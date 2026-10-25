// The Manager — open the Stripe customer portal (change card, cancel, invoices) for a workspace owner.
// Secrets: STRIPE_SECRET_KEY, SITE_URL (+ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, provided by Supabase).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cors = (origin) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' });
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
  const { data: { user } } = await admin.auth.getUser((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
  if (!user) return json(401, { error: 'not_authenticated' }, headers);
  let body; try { body = await req.json(); } catch { body = {}; }
  if (!UUID.test(String(body && body.workspace_id || ''))) return json(400, { error: 'invalid' }, headers);
  const { data: m } = await admin.from('workspace_members').select('role').eq('workspace_id', body.workspace_id).eq('user_id', user.id).maybeSingle();
  if (!m || m.role !== 'owner') return json(403, { error: 'forbidden' }, headers);
  const { data: w } = await admin.from('workspaces').select('stripe_customer_id').eq('id', body.workspace_id).single();
  if (!w || !w.stripe_customer_id) return json(404, { error: 'not_found' }, headers);
  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { httpClient: Stripe.createFetchHttpClient() });
  const s = await stripe.billingPortal.sessions.create({ customer: w.stripe_customer_id, return_url: `${site}/?billing=done` });
  return json(200, { url: s.url }, headers);
}
if (typeof Deno !== 'undefined') Deno.serve(req => handler(req).catch(e => { console.error(e); return json(500, { error: 'unknown' }, cors('*')); }));
