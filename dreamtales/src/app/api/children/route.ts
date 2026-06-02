import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: children, error } = await supabase
      .from('children')
      .select(`
        *,
        story_preferences (*)
      `)
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch children:', error)
      return Response.json({ error: 'Failed to fetch children' }, { status: 500 })
    }

    return Response.json({ children })

  } catch (error) {
    console.error('Children GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { name: string; age?: number; gender?: 'boy' | 'girl' | 'neutral'; friends?: string[]; parents?: string[] }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, age, gender = 'neutral', friends = [], parents = [] } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    if (!['boy', 'girl', 'neutral'].includes(gender)) {
      return Response.json({ error: 'gender must be boy, girl, or neutral' }, { status: 400 })
    }

    // Insert child
    const { data: child, error: childError } = await supabase
      .from('children')
      .insert({
        user_id: user.id,
        name: name.trim(),
        age: age ?? null,
        gender,
        friends,
        parents,
      })
      .select()
      .single()

    if (childError || !child) {
      console.error('Failed to create child:', childError)
      return Response.json({ error: 'Failed to create child' }, { status: 500 })
    }

    // Insert story_preferences with defaults
    const { error: prefError } = await supabase
      .from('story_preferences')
      .insert({
        child_id: child.id,
      })

    if (prefError) {
      console.error('Failed to create story preferences:', prefError)
      // Non-fatal — child was created; preferences can be set later
    }

    return Response.json({ child }, { status: 201 })

  } catch (error) {
    console.error('Children POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
