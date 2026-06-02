import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook verification failed:', message)
    return new Response(`Webhook error: ${message}`, { status: 400 })
  }

  // Respond 200 immediately, process async
  processWebhookEvent(event).catch(err =>
    console.error('Webhook processing error:', err)
  )

  return new Response('OK', { status: 200 })
}

async function processWebhookEvent(event: Stripe.Event) {
  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break

      const subscriptionId = session.subscription as string | null
      const customerId = session.customer as string | null

      // Update user: activate subscription, store Stripe customer ID
      await supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          subscription_status: 'active',
        })
        .eq('id', userId)

      // Upsert subscription record
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: subscription.items.data[0]?.price.id ?? null,
            plan: resolvePlanFromPriceId(subscription.items.data[0]?.price.id),
            status: subscription.status,
            current_period_start: new Date((subscription as unknown as { current_period_start: number }).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!userRecord) break

      const plan = resolvePlanFromPriceId(subscription.items.data[0]?.price.id)
      const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

      await supabase
        .from('users')
        .update({
          subscription_plan: plan,
          subscription_status: subscription.status as string,
          subscription_period_end: new Date(periodEnd * 1000).toISOString(),
        })
        .eq('id', userRecord.id)

      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          stripe_price_id: subscription.items.data[0]?.price.id ?? null,
          plan,
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!userRecord) break

      await supabase
        .from('users')
        .update({
          subscription_plan: 'free',
          subscription_status: 'canceled',
          subscription_period_end: null,
        })
        .eq('id', userRecord.id)

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!userRecord) break

      await supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('id', userRecord.id)

      const invoiceSubId = (invoice as unknown as Record<string, unknown>).subscription
      if (invoiceSubId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoiceSubId as string)
      }
      break
    }

    default:
      break
  }
}

function resolvePlanFromPriceId(priceId: string | undefined): 'free' | 'starter' | 'family' {
  if (!priceId) return 'free'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID) return 'family'
  return 'free'
}
