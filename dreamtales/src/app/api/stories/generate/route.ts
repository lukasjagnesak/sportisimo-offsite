import { createClient } from '@/lib/supabase/server'
import { generateStory } from '@/lib/claude/client'
import { generateStoryPDF } from '@/lib/pdf/generator'
import { GENRES, PLANS, type ReadingLength } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status, stories_generated_this_month, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Rate limit check
    const plan = profile.subscription_plan as keyof typeof PLANS
    const maxStories = PLANS[plan]?.stories_per_month ?? 3
    if (profile.stories_generated_this_month >= maxStories) {
      return Response.json(
        { error: 'Monthly story limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body: { childId: string; genre: string; readingLength: ReadingLength }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { childId, genre, readingLength } = body

    if (!childId || !genre || !readingLength) {
      return Response.json(
        { error: 'Missing required fields: childId, genre, readingLength' },
        { status: 400 }
      )
    }

    if (![15, 30, 45].includes(readingLength)) {
      return Response.json(
        { error: 'readingLength must be 15, 30, or 45' },
        { status: 400 }
      )
    }

    // Get child profile
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (childError || !child) {
      return Response.json({ error: 'Child not found' }, { status: 404 })
    }

    // Resolve genre name
    const genreData = GENRES.find(g => g.id === genre)
    if (!genreData) {
      return Response.json({ error: 'Unknown genre' }, { status: 400 })
    }

    // Generate story content
    const content = await generateStory({
      childName: child.name,
      childAge: child.age,
      childGender: child.gender,
      genre,
      genreName: genreData.name_cs,
      readingLength,
      friends: child.friends,
      parents: child.parents,
    })

    // Extract title from first line (# Title)
    const titleLine = content.split('\n').find(line => line.startsWith('#'))
    const title = titleLine
      ? titleLine.replace(/^#+\s*/, '').trim()
      : 'Pohádka na dobrou noc'

    // Save story to DB
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        child_id: childId,
        child_name: child.name,
        user_id: user.id,
        title,
        content,
        genre,
        genre_name: genreData.name_cs,
        reading_length: readingLength,
      })
      .select()
      .single()

    if (storyError || !story) {
      console.error('Failed to save story:', storyError)
      return Response.json({ error: 'Failed to save story' }, { status: 500 })
    }

    // Increment stories_generated_this_month
    await supabase
      .from('users')
      .update({ stories_generated_this_month: profile.stories_generated_this_month + 1 })
      .eq('id', user.id)

    // Generate PDF
    let pdfUrl: string | null = null
    try {
      const pdfBuffer = await generateStoryPDF(story, genre)
      const fileName = `${user.id}/${story.id}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName)

        pdfUrl = urlData.publicUrl

        // Update story with pdf_url
        await supabase
          .from('stories')
          .update({ pdf_url: pdfUrl, pdf_storage_path: fileName })
          .eq('id', story.id)
      } else {
        console.error('PDF upload failed:', uploadError)
      }
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      // Non-fatal: story is saved, PDF failed
    }

    return Response.json({
      story: {
        ...story,
        pdf_url: pdfUrl,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Story generation error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
