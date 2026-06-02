import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/children/[id]'>
) {
  try {
    const { id } = await ctx.params

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: child, error } = await supabase
      .from('children')
      .select(`
        *,
        story_preferences (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (error || !child) {
      return Response.json({ error: 'Child not found' }, { status: 404 })
    }

    return Response.json({ child })

  } catch (error) {
    console.error('Child GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/children/[id]'>
) {
  try {
    const { id } = await ctx.params

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('children')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: 'Child not found' }, { status: 404 })
    }

    let body: {
      name?: string
      age?: number | null
      gender?: 'boy' | 'girl' | 'neutral'
      friends?: string[]
      parents?: string[]
      preferences?: {
        genres?: string[]
        reading_length?: number
        delivery_time?: string
        timezone?: string
        language?: string
      }
    }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, age, gender, friends, parents, preferences } = body

    // Build child update payload
    const childUpdate: Record<string, unknown> = {}
    if (name !== undefined) childUpdate.name = name.trim()
    if (age !== undefined) childUpdate.age = age
    if (gender !== undefined) childUpdate.gender = gender
    if (friends !== undefined) childUpdate.friends = friends
    if (parents !== undefined) childUpdate.parents = parents

    let updatedChild = null
    if (Object.keys(childUpdate).length > 0) {
      const { data, error: updateError } = await supabase
        .from('children')
        .update(childUpdate)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update child:', updateError)
        return Response.json({ error: 'Failed to update child' }, { status: 500 })
      }
      updatedChild = data
    }

    // Update story preferences if provided
    if (preferences) {
      const prefUpdate: Record<string, unknown> = {}
      if (preferences.genres !== undefined) prefUpdate.genres = preferences.genres
      if (preferences.reading_length !== undefined) prefUpdate.reading_length = preferences.reading_length
      if (preferences.delivery_time !== undefined) prefUpdate.delivery_time = preferences.delivery_time
      if (preferences.timezone !== undefined) prefUpdate.timezone = preferences.timezone
      if (preferences.language !== undefined) prefUpdate.language = preferences.language

      if (Object.keys(prefUpdate).length > 0) {
        const { error: prefError } = await supabase
          .from('story_preferences')
          .update(prefUpdate)
          .eq('child_id', id)

        if (prefError) {
          console.error('Failed to update story preferences:', prefError)
          return Response.json({ error: 'Failed to update preferences' }, { status: 500 })
        }
      }
    }

    // Return updated child with preferences
    const { data: child } = await supabase
      .from('children')
      .select(`*, story_preferences (*)`)
      .eq('id', id)
      .single()

    return Response.json({ child: child ?? updatedChild })

  } catch (error) {
    console.error('Child PUT error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/children/[id]'>
) {
  try {
    const { id } = await ctx.params

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('children')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: 'Child not found' }, { status: 404 })
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('children')
      .update({ active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to soft delete child:', deleteError)
      return Response.json({ error: 'Failed to delete child' }, { status: 500 })
    }

    return new Response(null, { status: 204 })

  } catch (error) {
    console.error('Child DELETE error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
