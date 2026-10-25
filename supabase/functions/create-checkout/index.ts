// The Manager — start a Stripe Checkout for a workspace plan (Supabase Edge Function, Deno).
// Called by the signed-in workspace owner. Secrets come from the function environment only:
//   STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM, SITE_URL  (+ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, provided by Supabase)
export const PLANS = ['pro', 'team'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const cors = (origin) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' });
export function validate(body) {
  if (!body || typeof body !== 'object') return 'invalid';
  if (!UUID.test(String(body.workspace_id || ''))) return 'invalid';
  if (!PLANS.includes(body.plan)) return 'invalid';
  return null;
}
const json = (status, data, headers) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function handler(req) {
  const env = k => Deno.env.get(k) || '';
  // SITE_URL may list several addresses (comma-separated): answer the one the request comes from
  const allowed = env('SITE_URL').split(',').map(x => x.trim().replace(/\/+$/, '')).filter(Boolean);
  const origin = req.headers.get('Origin') || '', site = allowed.includes(origin) ? origin : allowed[0] || '';
  const headers = cors(site || 'null');
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json(405, { error: 'method' }, headers);
  const { createClient } = await import('jsr:@supabase/supabase-js@2');
  const Stripe = (await import('npm:stripe@17.7.0')).default;
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return json(401, { error: 'not_authenticated' }, headers);
  let body; try { body = await req.json(); } catch { body = null; }
  const bad = validate(body); if (bad) return json(400, { error: bad }, headers);
  const { data: m } = await admin.from('workspace_members').select('role').eq('workspace_id', body.workspace_id).eq('user_id', user.id).maybeSingle();
  if (!m || m.role !== 'owner') return json(403, { error: 'forbidden' }, headers);
  const { data: w } = await admin.from('workspaces').select('id, name, stripe_customer_id').eq('id', body.workspace_id).single();
  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { httpClient: Stripe.createFetchHttpClient() });
  let customer = w.stripe_customer_id;
  // a stored customer can be stale (deleted, or created under another Stripe account/key): start a fresh one
  if (customer) {
    try { if ((await stripe.customers.retrieve(customer)).deleted) customer = null; }
    catch (e) { if (e && e.code === 'resource_missing') customer = null; else throw e; }
  }
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, name: w.name, metadata: { workspace_id: w.id } })).id;
    await admin.from('workspaces').update({ stripe_customer_id: customer }).eq('id', w.id);
  }
  const price = body.plan === 'team' ? env('STRIPE_PRICE_TEAM') : env('STRIPE_PRICE_PRO');
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer, client_reference_id: w.id, line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { workspace_id: w.id } }, metadata: { workspace_id: w.id },
    allow_promotion_codes: true, success_url: `${site}/?checkout=success`, cancel_url: `${site}/?checkout=cancel`
  });
  return json(200, { url: session.url }, headers);
}
if (typeof Deno !== 'undefined') Deno.serve(req => handler(req).catch(e => { console.error(e); return json(500, { error: 'unknown' }, cors('*')); }));
