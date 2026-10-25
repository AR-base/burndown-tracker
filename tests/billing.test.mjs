// Stripe billing logic (pure parts of the Supabase Edge Functions).
import assert from 'node:assert/strict';
const { planFromPrice, patchFromSubscription, HANDLED } = await import('../supabase/functions/stripe-webhook/index.ts');
const { validate } = await import('../supabase/functions/create-checkout/index.ts');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const prices = { pro: 'price_pro', team: 'price_team' }, ws = '0b0c7a1e-1234-4abc-8def-0123456789ab';
const sub = (status, price, extra = {}) => ({ id: 'sub_1', status, customer: 'cus_1', metadata: { workspace_id: ws }, items: { data: [{ price: { id: price }, current_period_end: 1798761600 }] }, ...extra });

ok('a paid price maps to its plan, anything else to nothing', () => {
  assert.equal(planFromPrice('price_pro', prices), 'pro'); assert.equal(planFromPrice('price_team', prices), 'team');
  assert.equal(planFromPrice('price_other', prices), null); assert.equal(planFromPrice(undefined, { pro: '', team: '' }), null);
});
ok('an active Pro subscription upgrades the workspace with its renewal date', () => {
  const r = patchFromSubscription(sub('active', 'price_pro'), prices);
  assert.equal(r.workspace_id, ws); assert.equal(r.patch.plan, 'pro'); assert.equal(r.patch.subscription_status, 'active');
  assert.equal(r.patch.plan_renews_at, new Date(1798761600 * 1000).toISOString());
});
ok('past_due keeps access (Stripe retries the card), canceled or unpaid goes back to Free', () => {
  assert.equal(patchFromSubscription(sub('past_due', 'price_team'), prices).patch.plan, 'team');
  const c = patchFromSubscription(sub('canceled', 'price_team'), prices);
  assert.equal(c.patch.plan, 'free'); assert.equal(c.patch.stripe_subscription_id, null); assert.equal(c.patch.plan_renews_at, null);
  assert.equal(patchFromSubscription(sub('unpaid', 'price_pro'), prices).patch.plan, 'free');
  assert.equal(patchFromSubscription(sub('incomplete', 'price_pro'), prices).patch.plan, 'free');
});
ok('an unknown price never grants a plan', () => assert.equal(patchFromSubscription(sub('active', 'price_hacked'), prices).patch.plan, 'free'));
ok('events without a valid workspace id are ignored', () => {
  assert.equal(patchFromSubscription(sub('active', 'price_pro', { metadata: {} }), prices), null);
  assert.equal(patchFromSubscription(sub('active', 'price_pro', { metadata: { workspace_id: "x' or 1=1" } }), prices), null);
});
ok('only subscription and checkout events are handled', () => assert.deepEqual(HANDLED, ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']));
ok('checkout requests are validated (workspace uuid, pro or team only)', () => {
  assert.equal(validate({ workspace_id: ws, plan: 'pro' }), null); assert.equal(validate({ workspace_id: ws, plan: 'team' }), null);
  assert.equal(validate({ workspace_id: ws, plan: 'free' }), 'invalid'); assert.equal(validate({ workspace_id: 'nope', plan: 'pro' }), 'invalid'); assert.equal(validate(null), 'invalid');
});
console.log(`\n${n} tests passed`);
