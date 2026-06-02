import { createAdminClient } from '@/lib/supabase/server'
import { generateStory } from '@/lib/claude/client'
import { generateStoryPDF } from '@/lib/pdf/generator'
import { getResend, FROM_EMAIL, FROM_NAME } from '@/lib/email/client'
import { StoryEmailTemplate } from '@/lib/email/templates'
import { GENRES } from '@/types'
import { render } from '@react-email/components'

const MAX_PER_RUN = 10

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // Query the daily_delivery_queue view for children whose delivery_time matches
  // the current hour (± 30 min) in their timezone.
  const { data: queue, error: queueError } = await supabase
    .from('daily_delivery_queue')
    .select('*')
    .limit(MAX_PER_RUN)

  if (queueError) {
    console.error('Failed to fetch delivery queue:', queueError)
    return Response.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }

  const processed: string[] = []
  const errors: Array<{ childId: string; error: string }> = []

  for (const item of queue ?? []) {
    try {
      // Pick a random genre from the child's preferences list
      const genres: string[] = item.genres ?? []
      const genre = genres.length > 0
        ? genres[Math.floor(Math.random() * genres.length)]
        : 'forest'

      const genreData = GENRES.find(g => g.id === genre) ?? GENRES.find(g => g.id === 'forest')!

      // Generate story content
      const content = await generateStory({
        childName: item.child_name,
        childAge: item.child_age ?? null,
        childGender: item.child_gender ?? 'neutral',
        genre,
        genreName: genreData.name_cs,
        readingLength: item.reading_length ?? 15,
        friends: item.friends ?? [],
        parents: item.parents ?? [],
      })

      // Extract title from first heading line
      const titleLine = content.split('\n').find((line: string) => line.startsWith('#'))
      const title = titleLine
        ? titleLine.replace(/^#+\s*/, '').trim()
        : 'Pohádka na dobrou noc'

      // Save story to DB
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          child_id: item.child_id,
          child_name: item.child_name,
          user_id: item.user_id,
          title,
          content,
          genre,
          genre_name: genreData.name_cs,
          reading_length: item.reading_length ?? 15,
        })
        .select()
        .single()

      if (storyError || !story) {
        throw new Error(`Failed to save story: ${storyError?.message}`)
      }

      // Generate PDF
      const pdfBuffer = await generateStoryPDF(story, genre)
      const fileName = `${item.user_id}/${story.id}.pdf`

      // Upload PDF to storage
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      let pdfUrl: string | null = null
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName)
        pdfUrl = urlData.publicUrl

        await supabase
          .from('stories')
          .update({ pdf_url: pdfUrl, pdf_storage_path: fileName })
          .eq('id', story.id)
      } else {
        console.error('PDF upload failed for story', story.id, uploadError)
      }

      // Send email with PDF attachment
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dreamtales.eu'}/dashboard`
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dreamtales.eu'}/settings`

      const storyExcerpt = content
        .split('\n')
        .filter((l: string) => l.trim() && !l.startsWith('#'))
        .slice(0, 3)
        .join(' ')

      const htmlBody = await render(
        StoryEmailTemplate({
          parentName: item.parent_name ?? 'milý rodiči',
          childName: item.child_name,
          storyTitle: title,
          storyExcerpt,
          genre: genreData.name_cs,
          genreEmoji: genreData.emoji,
          pdfFileName: `pohádka-${item.child_name}.pdf`,
          dashboardUrl,
          unsubscribeUrl,
        })
      )

      const resend = getResend()
      const emailPayload: Parameters<typeof resend.emails.send>[0] = {
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [item.parent_email],
        subject: `🌙 Dnešní pohádka pro ${item.child_name}: ${title}`,
        html: htmlBody,
      }

      if (pdfBuffer) {
        emailPayload.attachments = [
          {
            filename: `pohádka-${item.child_name}.pdf`,
            content: pdfBuffer,
          },
        ]
      }

      const { data: emailData, error: emailError } = await resend.emails.send(emailPayload)

      if (emailError) {
        console.error('Email send failed for child', item.child_id, emailError)
      }

      // Log to email_deliveries table
      await supabase
        .from('email_deliveries')
        .insert({
          user_id: item.user_id,
          child_id: item.child_id,
          story_id: story.id,
          email: item.parent_email,
          status: emailError ? 'failed' : 'sent',
          resend_id: emailData?.id ?? null,
        })

      // Mark story as sent
      await supabase
        .from('stories')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', story.id)

      processed.push(item.child_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Failed to process child', item.child_id, message)
      errors.push({ childId: item.child_id, error: message })
    }
  }

  return Response.json({ processed: processed.length, errors })
}
