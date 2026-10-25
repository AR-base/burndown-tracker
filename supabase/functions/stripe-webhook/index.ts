// The Manager — Stripe webhook: the ONLY place a workspace's paid plan changes.
// Deploy with JWT verification OFF (Stripe calls it); every request is authenticated by its Stripe signature instead.
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM (+ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVE = ['active', 'trialing', 'past_due'];

/* Pure: what a Stripe subscription means for a workspace row (tested in tests/billing.test.mjs). */
export function planFromPrice(priceId, prices) {
  if (priceId && priceId === prices.team) return 'team';
  if (priceId && priceId === prices.pro) return 'pro';
  return null;
}
export function patchFromSubscription(sub, prices) {
  const ws = sub && sub.metadata && sub.metadata.workspace_id;
  if (!UUID.test(String(ws || ''))) return null;
  const item = sub.items && sub.items.data && sub.items.data[0];
  const paid = planFromPrice(item && item.price && item.price.id, prices);
  const live = ACTIVE.includes(sub.status) && paid;
  const end = (item && item.current_period_end) || sub.current_period_end;
  return {
    workspace_id: ws,
    patch: {
      plan: live ? paid : 'free',
      stripe_subscription_id: sub.status === 'canceled' ? null : sub.id,
      subscription_status: sub.status,
      plan_renews_at: live && end ? new Date(end * 1000).toISOString() : null
    }
  };
}
export const HANDLED = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];

async function handler(req) {
  const env = k => Deno.env.get(k) || '';
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  const Stripe = (await import('npm:stripe@17.7.0')).default;
  const { createClient } = await import('jsr:@supabase/supabase-js@2');
  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { httpClient: Stripe.createFetchHttpClient() });
  const raw = await req.text();
  let event;
  try { event = await stripe.webhooks.constructEventAsync(raw, req.headers.get('Stripe-Signature') || '', env('STRIPE_WEBHOOK_SECRET'), undefined, Stripe.createSubtleCryptoProvider()); }
  catch { return new Response('bad signature', { status: 400 }); }
  if (!HANDLED.includes(event.type)) return new Response('ignored', { status: 200 });
  const prices = { pro: env('STRIPE_PRICE_PRO'), team: env('STRIPE_PRICE_TEAM') };
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  let sub = event.data.object;
  if (event.type === 'checkout.session.completed') {
    if (!sub.subscription) return new Response('no subscription', { status: 200 });
    sub = await stripe.subscriptions.retrieve(sub.subscription);
  }
  const r = patchFromSubscription(sub, prices);
  if (!r) return new Response('no workspace', { status: 200 });
  const { error } = await admin.from('workspaces').update({ ...r.patch, stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id }).eq('id', r.workspace_id);
  if (error) { console.error(error); return new Response('db error', { status: 500 }); }   // Stripe retries
  await admin.from('audit_log').insert({ workspace_id: r.workspace_id, action: 'plan.changed', details: { plan: r.patch.plan, status: r.patch.subscription_status } });
  return new Response('ok', { status: 200 });
}
if (typeof Deno !== 'undefined') Deno.serve(req => handler(req).catch(e => { console.error(e); return new Response('error', { status: 500 }); }));
