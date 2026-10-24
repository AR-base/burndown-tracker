/* Cloud data layer: a thin, typed wrapper over Supabase (auth + Postgres + realtime).
   Every call returns plain data or throws a CloudError whose .code the UI translates.
   No secrets here: the anon key is public by design; access is enforced by the database (db/schema.sql). */
const Cloud = (() => {
  class CloudError extends Error {
    constructor(code, detail) { super(code); this.code = code; this.detail = detail || ''; }
  }
  const KNOWN = ['forbidden', 'forbidden_role', 'last_owner', 'invitation_invalid', 'invitation_wrong_account', 'transfer_ownership_first',
    'workspace_limit', 'share_limit', 'invitation_limit', 'not_authenticated', 'not_found', 'project_workspace_immutable'];
  function codeOf(err) {
    if (!err) return 'unknown';
    const msg = String(err.message || err.error_description || err.msg || err || '');
    const k = KNOWN.find(c => msg.includes(c));
    if (k) return k;
    const status = err.status || err.code;
    if (/invalid login credentials/i.test(msg)) return 'bad_credentials';
    if (/email not confirmed/i.test(msg)) return 'email_not_confirmed';
    if (/already registered|already been registered|user_already_exists/i.test(msg)) return 'already_registered';
    if (/password/i.test(msg) && /(weak|short|at least|characters)/i.test(msg)) return 'weak_password';
    if (/rate limit|too many/i.test(msg) || status === 429) return 'rate_limited';
    if (/invalid totp|invalid code|mfa/i.test(msg) && /invalid|expired/i.test(msg)) return 'bad_code';
    if (/provider is not enabled|unsupported provider/i.test(msg)) return 'provider_disabled';
    if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) return 'offline';
    if (/row-level security|permission denied/i.test(msg) || status === 403 || err.code === '42501') return 'forbidden';
    if (/check constraint|violates/i.test(msg)) return 'invalid';
    return 'unknown';
  }
  const fail = err => { throw new CloudError(codeOf(err), String((err && err.message) || '')); };
  const unwrap = ({ data, error }) => { if (error) fail(error); return data; };
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function create({ url, anonKey, lib, redirectTo }) {
    if (!lib || typeof lib.createClient !== 'function') throw new CloudError('unavailable');
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(String(url || '')) || !anonKey) throw new CloudError('not_configured');
    const sb = lib.createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
    const call = async p => { try { return unwrap(await p); } catch (e) { if (e instanceof CloudError) throw e; fail(e); } };
    const rpc = (fn, args) => call(sb.rpc(fn, args || {}));
    let user = null;
    const uidOrFail = () => { if (!user) throw new CloudError('not_authenticated'); return user.id; };

    const api = {
      raw: sb,
      user: () => user,

      /* ---- authentication ---- */
      async session() { const d = await call(sb.auth.getSession()); user = d.session ? d.session.user : null; return d.session; },
      onAuth(cb) { const { data } = sb.auth.onAuthStateChange((ev, s) => { user = s ? s.user : null; cb(ev, s); }); return () => data.subscription.unsubscribe(); },
      async signUp(email, password, name) {
        if (!EMAIL.test(email)) throw new CloudError('bad_email');
        if (String(password).length < 10) throw new CloudError('weak_password');
        const d = await call(sb.auth.signUp({ email, password, options: { data: { full_name: String(name || '').slice(0, 80) }, emailRedirectTo: redirectTo } }));
        if (d.session) user = d.session.user;
        return { needsConfirmation: !d.session };
      },
      async signIn(email, password) { const d = await call(sb.auth.signInWithPassword({ email, password })); user = d.user; return d; },
      async signInOAuth(provider) {
        if (!['google', 'azure'].includes(provider)) throw new CloudError('provider_disabled');
        return call(sb.auth.signInWithOAuth({ provider, options: { redirectTo, scopes: provider === 'azure' ? 'email' : undefined } }));
      },
      async resetPassword(email) { if (!EMAIL.test(email)) throw new CloudError('bad_email'); return call(sb.auth.resetPasswordForEmail(email, { redirectTo })); },
      async updatePassword(password) { if (String(password).length < 10) throw new CloudError('weak_password'); return call(sb.auth.updateUser({ password })); },
      async signOut() { await call(sb.auth.signOut()); user = null; },

      /* ---- two-step verification (TOTP) ---- */
      async mfaFactors() { const d = await call(sb.auth.mfa.listFactors()); return (d.totp || []).filter(f => f.status === 'verified'); },
      async mfaEnroll() { const d = await call(sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator ' + Date.now().toString(36) })); return { id: d.id, qr: d.totp.qr_code, secret: d.totp.secret }; },
      async mfaVerify(factorId, code) {
        if (!/^\d{6}$/.test(String(code))) throw new CloudError('bad_code');
        return call(sb.auth.mfa.challengeAndVerify({ factorId, code: String(code) }));
      },
      async mfaUnenroll(factorId) { return call(sb.auth.mfa.unenroll({ factorId })); },
      async mfaNeeded() { const d = await call(sb.auth.mfa.getAuthenticatorAssuranceLevel()); return d.nextLevel === 'aal2' && d.currentLevel !== 'aal2'; },

      /* ---- profile ---- */
      async profile() { return (await call(sb.from('profiles').select('id, display_name').eq('id', uidOrFail()).maybeSingle())) || { id: user.id, display_name: '' }; },
      async setName(name) { return call(sb.from('profiles').update({ display_name: String(name).trim().slice(0, 80) }).eq('id', uidOrFail())); },

      /* ---- workspaces ---- */
      async workspaces() {
        const rows = await call(sb.from('workspace_members').select('role, workspaces ( id, name, created_at )').eq('user_id', uidOrFail()));
        return rows.filter(r => r.workspaces).map(r => ({ id: r.workspaces.id, name: r.workspaces.name, role: r.role, created_at: r.workspaces.created_at }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },
      async createWorkspace(name) {
        const n = String(name || '').trim(); if (!n || n.length > 80) throw new CloudError('invalid');
        const w = await rpc('create_workspace', { ws_name: n }); return { ...w, role: 'owner' };
      },
      async renameWorkspace(id, name) { return call(sb.from('workspaces').update({ name: String(name).trim().slice(0, 80) }).eq('id', id)); },
      async deleteWorkspace(id) { return call(sb.from('workspaces').delete().eq('id', id)); },

      /* ---- members and invitations ---- */
      members: ws => rpc('list_members', { ws }),
      setRole: (ws, target, role) => rpc('set_member_role', { ws, target, new_role: role }),
      removeMember: (ws, target) => rpc('remove_member', { ws, target }),
      async invite(ws, email, role) {
        const e = String(email || '').trim().toLowerCase(); if (!EMAIL.test(e)) throw new CloudError('bad_email');
        return rpc('create_invitation', { ws, invite_email: e, invite_role: role });
      },
      invitations: ws => call(sb.from('invitations').select('id, email, role, created_at, expires_at, accepted_at').eq('workspace_id', ws).is('accepted_at', null).order('created_at', { ascending: false })),
      cancelInvitation: id => call(sb.from('invitations').delete().eq('id', id)),
      async acceptInvitation(token) { if (!/^[0-9a-f]{64}$/.test(String(token))) throw new CloudError('invitation_invalid'); const r = await rpc('accept_invitation', { invite_token: token }); return r && r[0]; },

      /* ---- projects ---- */
      projects: (ws, archived = false) => call(sb.from('projects').select('id, name, version, archived, updated_at, updated_by, data').eq('workspace_id', ws).eq('archived', archived).order('updated_at', { ascending: false })),
      project: id => call(sb.from('projects').select('id, workspace_id, name, version, archived, updated_at, updated_by, data').eq('id', id).maybeSingle()),
      async createProject(ws, data) {
        return call(sb.from('projects').insert({ workspace_id: ws, name: String(data.name || 'Projet').slice(0, 120) || 'Projet', data }).select('id, version, updated_at').single());
      },
      /* Optimistic locking: the update only applies if nobody saved since `version`. */
      async saveProject(id, data, version) {
        const rows = await call(sb.from('projects').update({ name: String(data.name || 'Projet').slice(0, 120) || 'Projet', data }).eq('id', id).eq('version', version).select('version, updated_at'));
        if (!rows || !rows.length) throw new CloudError('conflict');
        return rows[0];
      },
      archiveProject: (id, archived) => call(sb.from('projects').update({ archived: !!archived }).eq('id', id)),
      deleteProject: id => call(sb.from('projects').delete().eq('id', id)),

      /* ---- client share links ---- */
      shares: pid => call(sb.from('project_shares').select('id, label, created_at, expires_at, revoked_at, last_viewed_at').eq('project_id', pid).is('revoked_at', null).order('created_at', { ascending: false })),
      createShare: (pid, label, days) => rpc('create_share', { proj: pid, share_label: String(label || '').slice(0, 80), valid_days: days ? Number(days) : null }),
      revokeShare: id => rpc('revoke_share', { share_id: id }),
      async openShared(token) {
        if (!/^[0-9a-f]{64}$/.test(String(token))) throw new CloudError('share_invalid');
        const r = await rpc('get_shared_project', { share_token: token });
        if (!r || !r.length) throw new CloudError('share_invalid');
        return r[0];
      },

      /* ---- activity ---- */
      activity: (ws, limit = 60) => call(sb.from('audit_log').select('id, project_id, actor, action, details, at').eq('workspace_id', ws).order('at', { ascending: false }).limit(limit)),

      /* ---- GDPR ---- */
      exportMyData: () => rpc('export_my_data'),
      async deleteAccount() { await rpc('delete_my_account'); try { await sb.auth.signOut(); } catch { /* session already gone */ } user = null; },

      /* ---- live updates on one project ---- */
      watchProject(id, onChange) {
        const ch = sb.channel('project-' + id)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: 'id=eq.' + id }, payload => onChange(payload.eventType, payload.new || {}, payload.old || {}))
          .subscribe();
        return () => { try { sb.removeChannel(ch); } catch { /* already closed */ } };
      }
    };
    return api;
  }
  return { create, CloudError, codeOf };
})();
if (typeof module !== 'undefined') module.exports = Cloud;
