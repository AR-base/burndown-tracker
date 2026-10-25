/* In-memory stand-in for the supabase-js client, used by tests only.
   Implements the subset of the query builder, RPCs, auth and realtime the app uses. */
function createFakeSupabase(opts = {}) {
  const uid = () => 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]);
  const tok = () => Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const db = { users: [], profiles: [], workspaces: [], workspace_members: [], projects: [], invitations: [], project_shares: [], audit_log: [], tokens: {} };
  const listeners = [], channels = [];
  let session = null, failNext = null;
  const me = () => session && session.user;
  const roleIn = ws => (db.workspace_members.find(m => m.workspace_id === ws && me() && m.user_id === me().id) || {}).role;
  const rank = r => ({ owner: 4, pm: 3, member: 2, viewer: 1 }[r] || 0);
  const log = (ws, pid, action, details = {}) => db.audit_log.push({ id: db.audit_log.length + 1, workspace_id: ws, project_id: pid, actor: me() && me().id, action, details, at: new Date().toISOString() });
  const err = msg => ({ data: null, error: { message: msg } });
  const emit = (ev, s) => listeners.forEach(f => f(ev, s));
  // plans, as in db/saas.sql
  const plan = ws => { const w = db.workspaces.find(x => x.id === ws) || {}; return w.plan === 'free' && w.trial_ends_at && Date.parse(w.trial_ends_at) > Date.now() ? 'pro' : (w.plan || 'free'); };
  const LIM = { projects: { free: 3, pro: 25, team: 500 }, members: { free: 3, pro: 10, team: 50 }, shares: { free: 1, pro: 20, team: 20 } };
  const lim = (ws, what) => LIM[what][plan(ws)];
  const activeProjects = ws => db.projects.filter(p => p.workspace_id === ws && !p.archived).length;
  const people = ws => db.workspace_members.filter(m => m.workspace_id === ws).length + db.invitations.filter(i => i.workspace_id === ws && !i.accepted_at).length;

  function visible(table) {
    const u = me(); if (!u) return [];
    const mine = new Set(db.workspace_members.filter(m => m.user_id === u.id).map(m => m.workspace_id));
    if (table === 'workspace_members') return db.workspace_members.filter(m => mine.has(m.workspace_id)).map(m => ({ ...m, workspaces: db.workspaces.find(w => w.id === m.workspace_id) }));
    if (table === 'projects') return db.projects.filter(p => mine.has(p.workspace_id));
    if (table === 'audit_log') return db.audit_log.filter(a => mine.has(a.workspace_id));
    if (table === 'invitations') return db.invitations.filter(i => rank(roleIn(i.workspace_id)) >= 3);
    if (table === 'project_shares') return db.project_shares.filter(s => { const p = db.projects.find(x => x.id === s.project_id); return p && rank(roleIn(p.workspace_id)) >= 3; });
    if (table === 'profiles') return db.profiles;
    if (table === 'workspaces') return db.workspaces.filter(w => mine.has(w.id));
    return [];
  }

  function from(table) {
    const q = { table, op: 'select', filters: [], order: null, lim: null, single: false, maybe: false, values: null, returning: false };
    const b = {
      select() { if (q.op !== 'select') q.returning = true; return b; },
      insert(v) { q.op = 'insert'; q.values = v; return b; },
      update(v) { q.op = 'update'; q.values = v; return b; },
      delete() { q.op = 'delete'; return b; },
      eq(k, v) { q.filters.push(r => r[k] === v); return b; },
      is(k, v) { q.filters.push(r => (r[k] ?? null) === v); return b; },
      order(k, o) { q.order = [k, o && o.ascending === false ? -1 : 1]; return b; },
      limit(n) { q.lim = n; return b; },
      single() { q.single = true; return b; },
      maybeSingle() { q.maybe = true; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); }
    };
    function run() {
      if (failNext) { const f = failNext; failNext = null; return err(f); }
      if (!me()) return err('permission denied');
      const match = rows => rows.filter(r => q.filters.every(f => f(r)));
      if (q.op === 'select') {
        let rows = match(visible(table));
        if (q.order) rows = rows.slice().sort((a, b) => (a[q.order[0]] > b[q.order[0]] ? 1 : -1) * q.order[1]);
        if (q.lim) rows = rows.slice(0, q.lim);
        if (q.maybe || q.single) return { data: rows[0] || null, error: null };
        return { data: rows.map(r => ({ ...r })), error: null };
      }
      if (q.op === 'insert' && table === 'projects') {
        if (rank(roleIn(q.values.workspace_id)) < 2) return err('new row violates row-level security policy');
        if (activeProjects(q.values.workspace_id) >= lim(q.values.workspace_id, 'projects')) return err('plan_limit_projects');
        const row = { id: uid(), archived: false, version: 1, created_by: me().id, updated_by: me().id, updated_at: new Date().toISOString(), ...q.values };
        db.projects.push(row); log(row.workspace_id, row.id, 'project.created', { name: row.name });
        return { data: q.single ? { ...row } : [{ ...row }], error: null };
      }
      if (q.op === 'update') {
        const rows = match(visible(table));
        const out = [];
        rows.forEach(r => {
          const src = db[table].find(x => x === r || x.id === r.id);
          if (table === 'projects') {
            if (rank(roleIn(src.workspace_id)) < 2) return;
            if (q.values.archived === false && src.archived && activeProjects(src.workspace_id) >= lim(src.workspace_id, 'projects')) { out.limit = true; return; }
            Object.assign(src, q.values, { version: src.version + 1, updated_by: me().id, updated_at: new Date().toISOString() });
            log(src.workspace_id, src.id, 'project.updated', { name: src.name });
            channels.forEach(c => c.filter === 'id=eq.' + src.id && c.cb({ eventType: 'UPDATE', new: { ...src }, old: {} }));
          } else if (table === 'profiles' && src.id === me().id) Object.assign(src, q.values);
          else if (table === 'workspaces' && rank(roleIn(src.id)) >= 3) Object.assign(src, q.values);
          else return;
          out.push({ ...src });
        });
        if (out.limit) return err('plan_limit_projects');
        return { data: q.returning ? out : null, error: null };
      }
      if (q.op === 'delete') {
        const rows = match(visible(table));
        rows.forEach(r => {
          if (table === 'projects' && rank(roleIn(r.workspace_id)) >= 3) db.projects = db.projects.filter(x => x.id !== r.id);
          if (table === 'invitations') db.invitations = db.invitations.filter(x => x.id !== r.id);
          if (table === 'workspaces' && rank(roleIn(r.id)) === 4) { db.workspaces = db.workspaces.filter(x => x.id !== r.id); db.workspace_members = db.workspace_members.filter(m => m.workspace_id !== r.id); }
        });
        return { data: null, error: null };
      }
      return err('unsupported');
    }
    return b;
  }

  const RPC = {
    create_workspace({ ws_name }) { const w = { id: uid(), name: ws_name, created_at: new Date().toISOString(), plan: 'free', trial_ends_at: null, trial_used: false }; db.workspaces.push(w); db.workspace_members.push({ workspace_id: w.id, user_id: me().id, role: 'owner' }); log(w.id, null, 'workspace.created', { name: ws_name }); return w; },
    list_members({ ws }) { if (!roleIn(ws)) return []; return db.workspace_members.filter(m => m.workspace_id === ws).map(m => ({ user_id: m.user_id, role: m.role, display_name: (db.profiles.find(p => p.id === m.user_id) || {}).display_name || '', email: (db.users.find(u => u.id === m.user_id) || {}).email, joined_at: '' })); },
    set_member_role({ ws, target, new_role }) { if (roleIn(ws) !== 'owner') throw new Error('forbidden'); db.workspace_members.find(m => m.workspace_id === ws && m.user_id === target).role = new_role; log(ws, null, 'member.role_changed', { to: new_role }); return null; },
    remove_member({ ws, target }) { if (target !== me().id && roleIn(ws) !== 'owner') throw new Error('forbidden'); db.workspace_members = db.workspace_members.filter(m => !(m.workspace_id === ws && m.user_id === target)); return null; },
    create_invitation({ ws, invite_email, invite_role }) { if (rank(roleIn(ws)) < 3) throw new Error('forbidden'); if (people(ws) >= lim(ws, 'members')) throw new Error('plan_limit_members'); const t = tok(); db.tokens[t] = { ws, invite_email, invite_role }; db.invitations.push({ id: uid(), workspace_id: ws, email: invite_email, role: invite_role, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 864e5).toISOString(), accepted_at: null }); log(ws, null, 'member.invited', { email: invite_email }); return t; },
    accept_invitation({ invite_token }) { const i = db.tokens[invite_token]; if (!i) throw new Error('invitation_invalid'); if (i.invite_email !== me().email) throw new Error('invitation_wrong_account'); delete db.tokens[invite_token]; db.workspace_members.push({ workspace_id: i.ws, user_id: me().id, role: i.invite_role }); const w = db.workspaces.find(x => x.id === i.ws); return [{ workspace_id: w.id, workspace_name: w.name, role: i.invite_role }]; },
    create_share({ proj, share_label }) { const p = db.projects.find(x => x.id === proj); if (!p || rank(roleIn(p.workspace_id)) < 3) throw new Error('forbidden'); if (db.project_shares.filter(x => x.project_id === proj && !x.revoked_at).length >= lim(p.workspace_id, 'shares')) throw new Error('plan_limit_shares'); const t = tok(); db.tokens[t] = { share: proj }; db.project_shares.push({ id: uid(), project_id: proj, label: share_label, created_at: new Date().toISOString(), expires_at: null, revoked_at: null, last_viewed_at: null, _t: t }); return t; },
    revoke_share({ share_id }) { const s = db.project_shares.find(x => x.id === share_id); s.revoked_at = new Date().toISOString(); delete db.tokens[s._t]; return null; },
    get_shared_project({ share_token }) { const s = db.tokens[share_token]; if (!s || !s.share) return []; const p = db.projects.find(x => x.id === s.share); return p ? [{ name: p.name, data: p.data, updated_at: p.updated_at }] : []; },
    workspace_usage({ ws }) { if (!roleIn(ws)) throw new Error('forbidden'); const w = db.workspaces.find(x => x.id === ws);
      return [{ plan: w.plan, effective_plan: plan(ws), trial_ends_at: w.trial_ends_at, trial_used: w.trial_used, projects: activeProjects(ws), people: people(ws), max_projects: lim(ws, 'projects'), max_people: lim(ws, 'members'), max_shares: lim(ws, 'shares') }]; },
    start_trial({ ws }) { if (roleIn(ws) !== 'owner') throw new Error('forbidden'); const w = db.workspaces.find(x => x.id === ws); if (w.plan !== 'free' || w.trial_used) throw new Error('trial_unavailable');
      w.trial_used = true; w.trial_ends_at = new Date(Date.now() + 14 * 864e5).toISOString(); log(ws, null, 'plan.trial_started', {}); return w.trial_ends_at; },
    export_my_data() { return { account: { email: me().email }, memberships: db.workspace_members.filter(m => m.user_id === me().id) }; },
    delete_my_account() { const id = me().id; db.workspace_members = db.workspace_members.filter(m => m.user_id !== id); db.users = db.users.filter(u => u.id !== id); return null; }
  };

  const client = {
    _db: db,
    _failNext(msg) { failNext = msg; },
    _addUser(email, password, name) { const u = { id: uid(), email, password }; db.users.push(u); db.profiles.push({ id: u.id, display_name: name || email.split('@')[0] }); return u; },
    _remoteUpdate(id, patch, byUserId) {
      const p = db.projects.find(x => x.id === id);
      Object.assign(p, patch, { version: p.version + 1, updated_by: byUserId, updated_at: new Date().toISOString() });
      channels.forEach(c => c.filter === 'id=eq.' + id && c.cb({ eventType: 'UPDATE', new: { ...p }, old: {} }));
    },
    from,
    async rpc(fn, args) {
      if (failNext) { const f = failNext; failNext = null; return err(f); }
      if (!me() && fn !== 'get_shared_project') return err('permission denied for function ' + fn);
      try { return { data: RPC[fn](args || {}), error: null }; } catch (e) { return err(e.message); }
    },
    auth: {
      async getSession() { return { data: { session }, error: null }; },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() { listeners.splice(listeners.indexOf(cb), 1); } } } }; },
      async signUp({ email, password, options }) {
        if (db.users.some(u => u.email === email)) return err('User already registered');
        client._addUser(email, password, options && options.data && options.data.full_name);
        if (opts.confirmEmail) return { data: { user: null, session: null }, error: null };
        return client.auth.signInWithPassword({ email, password });
      },
      async signInWithPassword({ email, password }) {
        const u = db.users.find(x => x.email === email && x.password === password);
        if (!u) return err('Invalid login credentials');
        session = { user: { id: u.id, email: u.email } }; emit('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signInWithOAuth() { return { data: { url: 'https://example.test/oauth' }, error: null }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
      async updateUser() { return { data: {}, error: null }; },
      async signOut() { session = null; emit('SIGNED_OUT', null); return { error: null }; },
      mfa: {
        async listFactors() { return { data: { totp: opts.factors || [] }, error: null }; },
        async enroll() { return { data: { id: 'f1', totp: { qr_code: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>', secret: 'ABC' } }, error: null }; },
        async challengeAndVerify({ code }) { return code === '123456' ? { data: {}, error: null } : err('Invalid TOTP code entered'); },
        async unenroll() { return { data: {}, error: null }; },
        async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: 'aal1', nextLevel: opts.needMfa ? 'aal2' : 'aal1' }, error: null }; }
      }
    },
    channel() { const c = { on(_t, f, cb) { c.filter = f.filter; c.cb = cb; return c; }, subscribe() { channels.push(c); return c; } }; return c; },
    removeChannel(c) { const i = channels.indexOf(c); if (i >= 0) channels.splice(i, 1); }
  };
  return client;
}
if (typeof module !== 'undefined') module.exports = createFakeSupabase;
