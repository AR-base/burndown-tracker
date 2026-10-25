const assert = require('assert');
const Cloud = require('../src/cloud.js'), createFake = require('./fake-supabase.js');
let n = 0; const ok = async (name, fn) => { await fn(); n++; console.log('✓', name); };
const mk = (o = {}) => { const fake = createFake(o); return { fake, c: Cloud.create({ url: 'https://abc.supabase.co', anonKey: 'anon', lib: { createClient: () => fake }, redirectTo: 'https://app.test/' }) }; };
const rejects = async (p, code) => { try { await p; } catch (e) { assert.strictEqual(e.code, code, `expected ${code}, got ${e.code} (${e.detail})`); return; } assert.fail('expected ' + code); };

(async () => {
  await ok('refuses to start without a valid Supabase URL', async () => {
    assert.throws(() => Cloud.create({ url: 'http://evil.test', anonKey: 'k', lib: { createClient() {} } }), e => e.code === 'not_configured');
    assert.throws(() => Cloud.create({ url: 'https://abc.supabase.co', anonKey: 'k', lib: null }), e => e.code === 'unavailable');
  });
  await ok('error messages map to stable codes', async () => {
    const m = e => Cloud.codeOf({ message: e });
    assert.strictEqual(m('Invalid login credentials'), 'bad_credentials');
    assert.strictEqual(m('Email not confirmed'), 'email_not_confirmed');
    assert.strictEqual(m('User already registered'), 'already_registered');
    assert.strictEqual(m('TypeError: Failed to fetch'), 'offline');
    assert.strictEqual(m('new row violates row-level security policy for table "projects"'), 'forbidden');
    assert.strictEqual(m('transfer_ownership_first: ACME'), 'transfer_ownership_first');
    assert.strictEqual(m('Password should be at least 6 characters'), 'weak_password');
    assert.strictEqual(m('Unsupported provider: provider is not enabled'), 'provider_disabled');
  });
  await ok('sign-up checks the e-mail and password length before calling the server', async () => {
    const { c } = mk();
    await rejects(c.signUp('nope', 'longenough1'), 'bad_email');
    await rejects(c.signUp('a@b.fr', 'short'), 'weak_password');
    const r = await c.signUp('ana@acme.fr', 'correct-horse-1', 'Ana');
    assert.strictEqual(r.needsConfirmation, false);
    await rejects(c.signUp('ana@acme.fr', 'correct-horse-1', 'Ana'), 'already_registered');
    await c.signOut();
    await rejects(c.signIn('ana@acme.fr', 'wrong'), 'bad_credentials');
  });
  await ok('workspace → project → save with version check → conflict', async () => {
    const { c, fake } = mk();
    await c.signUp('ana@acme.fr', 'correct-horse-1', 'Ana');
    const w = await c.createWorkspace('ACME');
    assert.deepStrictEqual((await c.workspaces()).map(x => [x.name, x.role]), [['ACME', 'owner']]);
    const p = await c.createProject(w.id, { name: 'Boutique', tasks: [] });
    const s1 = await c.saveProject(p.id, { name: 'Boutique 2' }, p.version);
    assert.strictEqual(s1.version, 2);
    await rejects(c.saveProject(p.id, { name: 'stale' }, p.version), 'conflict');
    assert.strictEqual(fake._db.projects[0].data.name, 'Boutique 2', 'a stale save changes nothing');
  });
  await ok('invitations and share links return one-time tokens; share opens without an account', async () => {
    const { c } = mk();
    await c.signUp('ana@acme.fr', 'correct-horse-1');
    const w = await c.createWorkspace('ACME');
    await rejects(c.invite(w.id, 'not an email', 'member'), 'bad_email');
    const t = await c.invite(w.id, 'Bob@ACME.fr', 'member');
    assert.match(t, /^[0-9a-f]{64}$/);
    const p = await c.createProject(w.id, { name: 'Boutique' });
    const s = await c.createShare(p.id, 'Client', 30);
    await c.signOut();
    const shared = await c.openShared(s);
    assert.strictEqual(shared.name, 'Boutique');
    await rejects(c.openShared('nope'), 'share_invalid');
    await rejects(c.acceptInvitation('nope'), 'invitation_invalid');
  });
  await ok('server refusals surface as codes, network failures as offline', async () => {
    const { c, fake } = mk();
    await c.signUp('ana@acme.fr', 'correct-horse-1');
    const w = await c.createWorkspace('ACME');
    fake._failNext('TypeError: Failed to fetch');
    await rejects(c.projects(w.id), 'offline');
    fake._failNext('forbidden');
    await rejects(c.members(w.id), 'forbidden');
  });
  await ok('two-step verification code format is checked', async () => {
    const { c } = mk();
    await c.signUp('ana@acme.fr', 'correct-horse-1');
    await rejects(c.mfaVerify('f1', '12ab'), 'bad_code');
    await c.mfaVerify('f1', '123456');
    await rejects(c.mfaVerify('f1', '000000'), 'bad_code');
  });
  await ok('billing only ever redirects to Stripe-hosted pages', async () => {
    const { c, fake } = mk();
    await c.signUp('ana@acme.fr', 'correct-horse-1'); const w = await c.createWorkspace('ACME');
    if (!(await c.checkout(w.id, 'pro')).startsWith('https://checkout.stripe.com/')) throw new Error('checkout url');
    await rejects(c.checkout(w.id, 'free'), 'invalid');
    fake.functions.invoke = async () => ({ data: { url: 'https://evil.example/phish' }, error: null });
    await rejects(c.checkout(w.id, 'team'), 'billing_unavailable');
    await rejects(c.billingPortal(w.id), 'billing_unavailable');
    fake.functions.invoke = async () => ({ data: null, error: { message: 'Edge Function returned a non-2xx status code' } });
    await rejects(c.checkout(w.id, 'pro'), 'billing_unavailable');
  });
  console.log(`\n${n} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
