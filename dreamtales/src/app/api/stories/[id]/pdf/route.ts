import { createClient } from '@/lib/supabase/server'
import { generateStoryPDF } from '@/lib/pdf/generator'

export async function GET(
  request: Request,
  ctx: RouteContext<'/api/stories/[id]/pdf'>
) {
  try {
    const { id } = await ctx.params

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get story, verify ownership
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Generate PDF on-the-fly
    const pdfBuffer = await generateStoryPDF(story, story.genre)

    const fileName = `pohádka-${story.child_name}.pdf`

    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })

  } catch (error) {
    console.error('PDF download error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
