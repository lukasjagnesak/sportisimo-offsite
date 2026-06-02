import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = await createAdminClient()

  const { data: profile } = await adminSupabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Cancel Stripe subscriptions if any
  if (profile?.stripe_customer_id) {
    try {
      const subscriptions = await getStripe().subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
      })
      for (const sub of subscriptions.data) {
        await getStripe().subscriptions.cancel(sub.id)
      }
    } catch (e) {
      console.error('Stripe cleanup failed:', e)
    }
  }

  // Delete all user data (cascades via FK)
  await adminSupabase.auth.admin.deleteUser(user.id)

  return Response.json({ success: true })
}
