import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.stripe_customer_id) {
      return Response.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    const origin = new URL(request.url).origin

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return Response.json({ url: portalSession.url })

  } catch (error) {
    console.error('Portal session error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
