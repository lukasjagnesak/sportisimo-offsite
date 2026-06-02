import Stripe from 'stripe'

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
  })
}

export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = await createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  })

  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}
