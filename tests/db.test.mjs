// Database tests: runs db/schema.sql on an in-process PostgreSQL (PGlite) and plays several users against the access rules.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('..', import.meta.url);
const db = new PGlite();
await db.exec(readFileSync(new URL('db/test-prelude.sql', root), 'utf8'));
await db.exec(readFileSync(new URL('db/schema.sql', root), 'utf8'));
await db.exec(readFileSync(new URL('db/schema.sql', root), 'utf8')); // running it twice must be safe
await db.exec(readFileSync(new URL('db/saas.sql', root), 'utf8'));
await db.exec(readFileSync(new URL('db/saas.sql', root), 'utf8'));
let n = 0; const ok = async (name, fn) => { await fn(); n++; console.log('✓', name); };
const U = { ana: '11111111-1111-4111-8111-111111111111', bob: '22222222-2222-4222-8222-222222222222', eve: '33333333-3333-4333-8333-333333333333', cid: '44444444-4444-4444-8444-444444444444' };
const mail = { ana: 'ana@acme.fr', bob: 'bob@acme.fr', eve: 'eve@evil.io', cid: 'cid@client.com' };
for (const [k, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, mail[k], { full_name: k.toUpperCase() }]);
async function as(who, sql, params = []) {
  await db.exec(`reset role`);
  if (who) {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [U[who], JSON.stringify({ sub: U[who], email: mail[who], role: 'authenticated' })]);
    await db.exec(`set role authenticated`);
  } else {
    await db.query(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)`);
    await db.exec(`set role anon`);
  }
  try { return (await db.query(sql, params)).rows; } finally { await db.exec(`reset role`); }
}
const fails = async (p, re) => { await assert.rejects(p, e => re.test(e.message), `expected error ${re}`); };
const project = { name: 'Boutique', start: '2026-11-02', end: '2026-12-18', tasks: [] };

let ws, ws2, proj;
await ok('profiles are created for new accounts', async () => {
  const r = await as('ana', `select display_name from profiles where id = $1`, [U.ana]);
  assert.equal(r[0].display_name, 'ANA');
});
await ok('creating a workspace makes you its owner', async () => {
  ws = (await as('ana', `select * from create_workspace('ACME')`))[0].id;
  const m = await as('ana', `select role from workspace_members where workspace_id = $1 and user_id = $2`, [ws, U.ana]);
  assert.equal(m[0].role, 'owner');
  ws2 = (await as('eve', `select * from create_workspace('Evil Corp')`))[0].id;
  await db.query(`update workspaces set plan = 'team' where id = $1`, [ws]);   // the access-rule tests run on a paid plan
});
await ok('nobody sees another company’s workspace, members or projects', async () => {
  proj = (await as('ana', `insert into projects (workspace_id, name, data) values ($1, 'Boutique', $2) returning id, version, created_by`, [ws, project]))[0];
  assert.equal(proj.version, 1); assert.equal(proj.created_by, U.ana);
  assert.equal((await as('eve', `select * from workspaces where id = $1`, [ws])).length, 0);
  assert.equal((await as('eve', `select * from projects where workspace_id = $1`, [ws])).length, 0);
  assert.equal((await as('eve', `select * from workspace_members where workspace_id = $1`, [ws])).length, 0);
  assert.equal((await as('eve', `select * from list_members($1)`, [ws])).length, 0);
  assert.equal((await as('eve', `select * from audit_log where workspace_id = $1`, [ws])).length, 0);
  assert.equal((await as('eve', `select * from profiles where id = $1`, [U.ana])).length, 0);
});
await ok('an outsider cannot write into or delete another company’s data', async () => {
  await fails(as('eve', `insert into projects (workspace_id, name, data) values ($1, 'x', '{}')`, [ws]), /row-level security/);
  assert.equal((await as('eve', `update projects set name = 'hacked' where id = $1 returning id`, [proj.id])).length, 0);
  assert.equal((await as('eve', `delete from projects where id = $1 returning id`, [proj.id])).length, 0);
  assert.equal((await as('eve', `delete from workspaces where id = $1 returning id`, [ws])).length, 0);
  await fails(as('eve', `select create_invitation($1, 'eve@evil.io', 'member')`, [ws]), /forbidden/);
  await fails(as('eve', `select create_share($1)`, [proj.id]), /forbidden/);
  await fails(as('eve', `insert into workspace_members (workspace_id, user_id, role) values ($1, $2, 'owner')`, [ws, U.eve]), /permission denied/);
});
await ok('anonymous visitors can read nothing directly', async () => {
  await fails(as(null, `select * from projects`), /permission denied/);
  await fails(as(null, `select * from workspaces`), /permission denied/);
  await fails(as(null, `select create_workspace('x')`), /permission denied/);
});
let invite;
await ok('invitations: only the invited e-mail can accept, once', async () => {
  invite = (await as('ana', `select create_invitation($1, ' Bob@ACME.fr ', 'member') as t`, [ws]))[0].t;
  assert.match(invite, /^[0-9a-f]{64}$/);
  const stored = await as('ana', `select token_hash, email from invitations where workspace_id = $1`, [ws]);
  assert.notEqual(stored[0].token_hash, invite, 'only the hash is stored'); assert.equal(stored[0].email, 'bob@acme.fr');
  await fails(as('eve', `select * from accept_invitation($1)`, [invite]), /invitation_wrong_account/);
  const r = await as('bob', `select * from accept_invitation($1)`, [invite]);
  assert.equal(r[0].workspace_name, 'ACME'); assert.equal(r[0].role, 'member');
  await fails(as('bob', `select * from accept_invitation($1)`, [invite]), /invitation_invalid/);
  await fails(as('bob', `select * from accept_invitation('nope')`), /invitation_invalid/);
});
await ok('a member edits projects; each save bumps the version (for conflict detection)', async () => {
  const r = await as('bob', `update projects set data = $2 where id = $1 and version = 1 returning version, updated_by`, [proj.id, { ...project, name: 'Boutique v2' }]);
  assert.equal(r[0].version, 2); assert.equal(r[0].updated_by, U.bob);
  const stale = await as('ana', `update projects set data = $2 where id = $1 and version = 1 returning version`, [proj.id, project]);
  assert.equal(stale.length, 0, 'a save based on an old version changes nothing');
  await fails(as('bob', `update projects set workspace_id = $2 where id = $1`, [proj.id, ws2]), /permission denied/);
  await fails(as('bob', `update projects set version = 99 where id = $1`, [proj.id]), /permission denied/);
});
await ok('a member cannot delete projects, manage people or create share links', async () => {
  assert.equal((await as('bob', `delete from projects where id = $1 returning id`, [proj.id])).length, 0);
  await fails(as('bob', `select create_invitation($1, 'x@acme.fr', 'viewer')`, [ws]), /forbidden/);
  await fails(as('bob', `select set_member_role($1, $2, 'owner')`, [ws, U.bob]), /forbidden/);
  await fails(as('bob', `select create_share($1)`, [proj.id]), /forbidden/);
  assert.equal((await as('bob', `select * from invitations`)).length, 0);
});
await ok('roles: PMs manage members and viewers only; the last owner is protected', async () => {
  await as('ana', `select set_member_role($1, $2, 'pm')`, [ws, U.bob]);
  const inv = (await as('bob', `select create_invitation($1, 'cid@client.com', 'viewer') as t`, [ws]))[0].t;
  await fails(as('bob', `select create_invitation($1, 'x@acme.fr', 'pm')`, [ws]), /forbidden_role/);
  await as('cid', `select * from accept_invitation($1)`, [inv]);
  await as('bob', `select set_member_role($1, $2, 'member')`, [ws, U.cid]);
  await fails(as('bob', `select set_member_role($1, $2, 'member')`, [ws, U.ana]), /forbidden/);
  await fails(as('ana', `select set_member_role($1, $2, 'pm')`, [ws, U.ana]), /last_owner/);
  await fails(as('ana', `select remove_member($1, $2)`, [ws, U.ana]), /last_owner/);
  await as('bob', `select set_member_role($1, $2, 'viewer')`, [ws, U.cid]);
});
await ok('a viewer reads but cannot change anything', async () => {
  assert.equal((await as('cid', `select id from projects where workspace_id = $1`, [ws])).length, 1);
  assert.equal((await as('cid', `update projects set name = 'x' where id = $1 returning id`, [proj.id])).length, 0);
  await fails(as('cid', `insert into projects (workspace_id, name, data) values ($1, 'x', '{}')`, [ws]), /row-level security/);
});
await ok('members see each other’s names; only PMs and owners see e-mail addresses', async () => {
  const forViewer = await as('cid', `select * from list_members($1)`, [ws]);
  assert.equal(forViewer.length, 3);
  assert.ok(forViewer.filter(m => m.user_id !== U.cid).every(m => m.email === null));
  const forPm = await as('bob', `select * from list_members($1)`, [ws]);
  assert.ok(forPm.every(m => m.email));
  assert.equal((await as('cid', `select display_name from profiles where id = $1`, [U.ana]))[0].display_name, 'ANA');
});
let share;
await ok('client share links: read-only, revocable, expiring, token stored hashed', async () => {
  share = (await as('bob', `select create_share($1, 'Client', 30) as t`, [proj.id]))[0].t;
  const r = await as(null, `select * from get_shared_project($1)`, [share]);
  assert.equal(r[0].name, 'Boutique'); assert.equal(r[0].data.name, 'Boutique v2');
  assert.equal((await as(null, `select * from get_shared_project($1)`, ['0'.repeat(64)])).length, 0);
  assert.equal((await as(null, `select * from get_shared_project($1)`, [`x' or 1=1 --`])).length, 0);
  const sid = (await as('bob', `select id from project_shares where project_id = $1`, [proj.id]))[0].id;
  assert.equal((await as('cid', `select id from project_shares`)).length, 0, 'viewers do not see share links');
  await as('bob', `select revoke_share($1)`, [sid]);
  assert.equal((await as(null, `select * from get_shared_project($1)`, [share])).length, 0);
  const s2 = (await as('ana', `select create_share($1, 'old', 1) as t`, [proj.id]))[0].t;
  await db.exec(`update project_shares set expires_at = now() - interval '1 day' where label = 'old'`);
  assert.equal((await as(null, `select * from get_shared_project($1)`, [s2])).length, 0);
});
await ok('the activity log records who did what and folds autosaves', async () => {
  for (let i = 0; i < 3; i++) await as('ana', `update projects set data = $2 where id = $1`, [proj.id, { ...project, i }]);
  const log = await as('cid', `select action, details from audit_log where workspace_id = $1 order by at`, [ws]);
  const acts = log.map(l => l.action);
  for (const a of ['workspace.created', 'project.created', 'member.invited', 'member.joined', 'member.role_changed', 'project.updated', 'share.created', 'share.revoked']) assert.ok(acts.includes(a), a);
  const anaEdits = log.filter(l => l.action === 'project.updated').map(l => l.details.edits);
  assert.ok(anaEdits.includes(3), 'three quick saves by one person become one entry');
  await fails(as('ana', `insert into audit_log (workspace_id, action) values ($1, 'fake')`, [ws]), /permission denied/);
  await fails(as('ana', `delete from audit_log where workspace_id = $1`, [ws]), /permission denied/);
});
await ok('data limits are enforced by the database', async () => {
  await fails(as('ana', `insert into projects (workspace_id, name, data) values ($1, '', '{}')`, [ws]), /check constraint/);
  await fails(as('ana', `insert into projects (workspace_id, name, data) values ($1, 'x', '[]')`, [ws]), /check constraint/);
  await fails(as('ana', `select create_invitation($1, 'not-an-email', 'member')`, [ws]), /check constraint/);
});
await ok('GDPR export returns the caller’s data only', async () => {
  const e = (await as('bob', `select export_my_data() as e`))[0].e;
  assert.equal(e.account.email, 'bob@acme.fr'); assert.equal(e.memberships[0].workspace, 'ACME');
  assert.ok(!JSON.stringify(e).includes('evil.io'));
});
await ok('account deletion: blocked for a sole owner with a team, otherwise removes the account', async () => {
  await fails(as('ana', `select delete_my_account()`), /transfer_ownership_first: ACME/);
  await as('eve', `insert into projects (workspace_id, name, data) values ($1, 'Solo', '{}')`, [ws2]);
  await as('eve', `select delete_my_account()`);
  assert.equal((await db.query(`select count(*)::int c from auth.users where id = $1`, [U.eve])).rows[0].c, 0);
  assert.equal((await db.query(`select count(*)::int c from workspaces where id = $1`, [ws2])).rows[0].c, 0, 'her solo workspace is gone');
  await as('cid', `select delete_my_account()`);
  assert.equal((await as('ana', `select * from list_members($1)`, [ws])).length, 2);
  assert.equal((await as('ana', `select name from projects where id = $1`, [proj.id]))[0].name, 'Boutique', 'team data stays');
});
await ok('ownership transfer then leaving works', async () => {
  await as('ana', `select set_member_role($1, $2, 'owner')`, [ws, U.bob]);
  await as('ana', `select remove_member($1, $2)`, [ws, U.ana]);
  assert.equal((await as('ana', `select * from projects where workspace_id = $1`, [ws])).length, 0);
  assert.equal((await as('bob', `select role from workspace_members where workspace_id = $1`, [ws]))[0].role, 'owner');
});

/* ---------- SaaS plans ---------- */
let ws3;
U.zoe = '55555555-5555-4555-8555-555555555555'; mail.zoe = 'zoe@startup.io';
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [U.zoe, mail.zoe]);
await ok('a new workspace starts on the free plan with its limits', async () => {
  ws3 = (await as('zoe', `select * from create_workspace('Startup')`))[0].id;
  const u = (await as('zoe', `select * from workspace_usage($1)`, [ws3]))[0];
  assert.equal(u.plan, 'free'); assert.equal(u.effective_plan, 'free'); assert.equal(u.max_projects, 3); assert.equal(u.max_people, 3); assert.equal(u.people, 1);
  await fails(as('eve', `select * from workspace_usage($1)`, [ws3]), /forbidden/);
});
await ok('free plan: a 4th active project is refused, archiving frees a slot', async () => {
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push((await as('zoe', `insert into projects (workspace_id, name, data) values ($1, $2, $3) returning id`, [ws3, 'P' + i, project]))[0].id);
  await fails(as('zoe', `insert into projects (workspace_id, name, data) values ($1, 'P4', $2)`, [ws3, project]), /plan_limit_projects/);
  await as('zoe', `update projects set archived = true where id = $1`, [ids[0]]);
  await as('zoe', `insert into projects (workspace_id, name, data) values ($1, 'P4', $2)`, [ws3, project]);
  await fails(as('zoe', `update projects set archived = false where id = $1`, [ids[0]]), /plan_limit_projects/);
  await as('zoe', `update projects set data = $2 where id = $1`, [ids[1], { ...project, edited: true }]);   // ordinary saves still work at the limit
});
await ok('free plan: people (members + pending invitations) capped at 3, one client link per project', async () => {
  await as('zoe', `select create_invitation($1, 'a@x.io', 'member')`, [ws3]);
  await as('zoe', `select create_invitation($1, 'b@x.io', 'member')`, [ws3]);
  await fails(as('zoe', `select create_invitation($1, 'c@x.io', 'member')`, [ws3]), /plan_limit_members/);
  const p = (await as('zoe', `select id from projects where workspace_id = $1 and not archived limit 1`, [ws3]))[0].id;
  await as('zoe', `select create_share($1, 'Client')`, [p]);
  await fails(as('zoe', `select create_share($1, 'Client 2')`, [p]), /plan_limit_shares/);
});
await ok('the plan cannot be changed from the browser', async () => {
  await fails(as('zoe', `update workspaces set plan = 'team' where id = $1`, [ws3]), /permission denied/);
  await fails(as('zoe', `update workspaces set trial_ends_at = now() + interval '1 year' where id = $1`, [ws3]), /permission denied/);
});
await ok('owners get one 14-day Pro trial that lifts the limits', async () => {
  await fails(as('bob', `select start_trial($1)`, [ws3]), /forbidden/);
  const ends = (await as('zoe', `select start_trial($1) as e`, [ws3]))[0].e;
  assert.ok(new Date(ends) - Date.now() > 13 * 864e5);
  const u = (await as('zoe', `select * from workspace_usage($1)`, [ws3]))[0];
  assert.equal(u.effective_plan, 'pro'); assert.equal(u.max_projects, 25); assert.equal(u.trial_used, true);
  await as('zoe', `insert into projects (workspace_id, name, data) values ($1, 'P5', $2)`, [ws3, project]);
  await fails(as('zoe', `select start_trial($1)`, [ws3]), /trial_unavailable/);
});
await ok('when the trial ends, existing data stays but new projects are refused again', async () => {
  await db.query(`update workspaces set trial_ends_at = now() - interval '1 day' where id = $1`, [ws3]);
  assert.equal((await as('zoe', `select * from workspace_usage($1)`, [ws3]))[0].effective_plan, 'free');
  assert.equal((await as('zoe', `select count(*)::int as c from projects where workspace_id = $1 and not archived`, [ws3]))[0].c, 4);
  await fails(as('zoe', `insert into projects (workspace_id, name, data) values ($1, 'P6', $2)`, [ws3, project]), /plan_limit_projects/);
});
console.log(`\n${n} tests passed`);
