/* Account layer: sign-in, workspaces, portfolio, team, client share links, activity, live saving.
   Runs only when the build provides CLOUD_CONFIG (Supabase URL + anon key) and supabase-js is loaded;
   otherwise the tracker stays in local demo mode, exactly as before. */
const CloudUI = (() => {
  const STR = {
    fr: {
      tabProjects: 'Projets', tabTeam: 'Équipe', signIn: 'Se connecter', signUp: 'Créer un compte', signOut: 'Se déconnecter', account: 'Mon compte',
      localMode: 'Démo locale', email: 'E-mail', password: 'Mot de passe', fullName: 'Nom complet', orWith: 'ou continuer avec', google: 'Google', microsoft: 'Microsoft',
      gateEyebrow: 'Espace chef de projet', gateH: 'Le cerveau, de tous vos projets.', gateLead: 'Décrivez un projet en une phrase : planning, burndown, budget, équipe, risques, RACI, documents et rapports sont prêts. Votre équipe et vos clients suivent tout en direct.', gateFeats: ['Gantt et burndown', 'Budget et équipe', 'Risques et RACI', 'Documents Word', 'Équipes et rôles', 'Liens client'], demo: 'Explorer la démo sans compte', loading: 'Connexion…', welcome: 'Bienvenue',
      forgot: 'Mot de passe oublié ?', resetSent: 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.', skip: 'Continuer sans compte',
      authLead: 'Retrouvez vos projets sur tous vos appareils et travaillez en équipe.', checkMail: 'Compte créé. Ouvrez l’e-mail de confirmation pour l’activer, puis connectez-vous.',
      pwHint: '10 caractères minimum.', newPw: 'Nouveau mot de passe', setPw: 'Enregistrer le mot de passe', pwChanged: 'Mot de passe modifié.', recoverTitle: 'Choisissez un nouveau mot de passe',
      mfaTitle: 'Vérification en deux étapes', mfaLead: 'Saisissez le code à 6 chiffres de votre application d’authentification.', code: 'Code', verify: 'Vérifier',
      saved: 'Enregistré', saving: 'Enregistrement…', pending: 'Modifications en attente', offline: 'Hors ligne · enregistré sur cet appareil', conflict: 'Conflit de version', saveError: 'Échec de l’enregistrement',
      conflictLead: 'Quelqu’un a enregistré ce projet pendant que vous le modifiiez.', takeTheirs: 'Charger leur version', keepMine: 'Garder ma version',
      ws: 'Espace de travail', newWs: 'Nouvel espace…', wsName: 'Nom de l’espace (entreprise, équipe, startup)', createWs: 'Créer l’espace', wsLead: 'Un espace regroupe les projets et l’équipe d’une entreprise ou d’une startup.',
      wsNone: 'Créez votre premier espace de travail', portfolio: 'Portefeuille de projets', active: 'Projets actifs', atRisk: 'À risque ou en retard', totalBudget: 'Budget total', latestEnd: 'Fin la plus tardive',
      newProject: 'Nouveau projet', showArchived: 'Archivés', open: 'Ouvrir', opened: 'Ouvert', archive: 'Archiver', restore: 'Restaurer', del: 'Supprimer', confirmDel: 'Confirmer la suppression',
      noProjects: 'Aucun projet pour l’instant.', firstProj: 'Créez votre premier projet', firstProjL: 'Décrivez-le en une phrase : l’assistant prépare le planning, le budget, l’équipe, les registres du chef de projet et les documents.', noArchived: 'Aucun projet archivé.',
      updatedBy: 'modifié', by: 'par', createdIn: 'Projet créé dans ', joined: 'Vous avez rejoint ', updatedByOther: 'Projet mis à jour par ', projectDeleted: 'Ce projet a été supprimé.',
      members: 'Membres', role: 'Rôle', since: 'Depuis', remove: 'Retirer', leave: 'Quitter l’espace', you: 'vous',
      r_owner: 'Propriétaire', r_pm: 'Chef de projet', r_member: 'Membre', r_viewer: 'Lecteur',
      rd_owner: 'Tout gérer, y compris l’espace et les rôles', rd_pm: 'Gérer projets, invitations et liens client', rd_member: 'Modifier les projets', rd_viewer: 'Consulter uniquement',
      invite: 'Inviter', inviteLead: 'Créez un lien d’invitation et envoyez-le à la personne : il ne fonctionne qu’avec cette adresse e-mail, une seule fois, pendant 7 jours.',
      inviteReady: 'Lien d’invitation pour ', copy: 'Copier', copied: 'Lien copié.', copyManual: 'Sélectionnez le lien et copiez-le (Ctrl+C).', pendingInv: 'Invitations en attente', cancel: 'Annuler', expires: 'expire le',
      shares: 'Liens client (lecture seule)', sharesLead: 'Le client suit le projet sans compte : burndown, Gantt, budget et téléchargements, sans pouvoir rien modifier.',
      shareLabel: 'Pour qui (ex. client ACME)', validity: 'Validité', d7: '7 jours', d30: '30 jours', d90: '90 jours', dNever: 'Sans limite', createLink: 'Créer le lien', shareReady: 'Lien client prêt :',
      revoke: 'Révoquer', viewed: 'vu', never: 'jamais', noShares: 'Aucun lien actif.', openProjectFirst: 'Ouvrez un projet pour gérer ses liens client.',
      activity: 'Activité', noActivity: 'Aucune activité pour l’instant.', settings: 'Paramètres de l’espace', rename: 'Renommer', deleteWs: 'Supprimer l’espace', wsDeleted: 'Espace supprimé.',
      a_workspace_created: 'a créé l’espace', a_project_created: 'a créé', a_project_updated: 'a modifié', a_project_deleted: 'a supprimé', a_project_archived: 'a archivé', a_project_restored: 'a restauré',
      a_member_invited: 'a invité', a_member_joined: 'a rejoint l’espace', a_member_role_changed: 'a changé un rôle', a_member_removed: 'a retiré un membre', a_member_left: 'a quitté l’espace',
      a_share_created: 'a créé un lien client', a_share_revoked: 'a révoqué un lien client', edits: 'modifications', someone: 'Quelqu’un',
      shareBanner: 'Vue client · lecture seule', shareUpdated: 'mis à jour le', shareLoading: 'Chargement du projet partagé…', shareInvalid: 'Ce lien client est invalide, révoqué ou expiré.',
      viewerBanner: 'Vous consultez ce projet en lecture seule (rôle Lecteur).',
      profile: 'Profil', saveName: 'Enregistrer', nameSaved: 'Nom enregistré.', security: 'Sécurité', mfaOn: 'Vérification en deux étapes activée', mfaOff: 'Vérification en deux étapes désactivée',
      enableMfa: 'Activer', disableMfa: 'Désactiver', mfaScan: 'Scannez ce QR code avec Google Authenticator, Microsoft Authenticator ou 1Password, puis saisissez le code affiché.', secretKey: 'Clé manuelle',
      mfaEnabled: 'Vérification en deux étapes activée.', mfaDisabled: 'Vérification en deux étapes désactivée.', changePw: 'Changer le mot de passe',
      privacy: 'Données personnelles (RGPD)', exportData: 'Exporter mes données', deleteAccount: 'Supprimer mon compte', deleteLead: 'Action définitive. Tapez SUPPRIMER pour confirmer.', deleteWord: 'SUPPRIMER',
      accountDeleted: 'Compte supprimé.', close: 'Fermer', lastSeen: 'il y a', now: 'à l’instant', min: 'min', h: 'h', d: 'j',
      e_bad_credentials: 'E-mail ou mot de passe incorrect.', e_email_not_confirmed: 'Confirmez d’abord votre adresse via l’e-mail reçu.', e_already_registered: 'Un compte existe déjà avec cet e-mail. Connectez-vous.',
      e_weak_password: 'Mot de passe trop faible : 10 caractères minimum.', e_bad_email: 'Adresse e-mail invalide.', e_rate_limited: 'Trop de tentatives. Réessayez dans quelques minutes.', e_bad_code: 'Code incorrect ou expiré.',
      e_provider_disabled: 'Ce mode de connexion n’est pas activé pour ce site.', e_offline: 'Pas de connexion. Vos modifications restent sur cet appareil.', e_forbidden: 'Votre rôle ne permet pas cette action.',
      e_forbidden_role: 'Vous ne pouvez pas attribuer ce rôle.', e_last_owner: 'Il faut au moins un propriétaire : nommez-en un autre d’abord.', e_invitation_invalid: 'Invitation invalide, déjà utilisée ou expirée.',
      e_invitation_wrong_account: 'Cette invitation a été envoyée à une autre adresse e-mail. Connectez-vous avec celle-ci.', e_transfer_ownership_first: 'Transférez d’abord la propriété de ces espaces : ',
      e_workspace_limit: 'Limite de 20 espaces atteinte.', e_share_limit: 'Limite de 20 liens actifs atteinte.', e_invitation_limit: 'Trop d’invitations en attente.', e_invalid: 'Valeur refusée par le serveur.',
      e_conflict: 'Quelqu’un a modifié ce projet entre-temps.', e_unknown: 'Une erreur est survenue. Réessayez.', e_not_authenticated: 'Session expirée. Reconnectez-vous.'
    },
    en: {
      tabProjects: 'Projects', tabTeam: 'Team', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out', account: 'My account',
      localMode: 'Local demo', email: 'E-mail', password: 'Password', fullName: 'Full name', orWith: 'or continue with', google: 'Google', microsoft: 'Microsoft',
      gateEyebrow: 'Project manager workspace', gateH: 'The brain, behind all your projects.', gateLead: 'Describe a project in one sentence: schedule, burndown, budget, team, risks, RACI, documents and reports are ready. Your team and clients follow it all live.', gateFeats: ['Gantt and burndown', 'Budget and team', 'Risks and RACI', 'Word documents', 'Teams and roles', 'Client links'], demo: 'Explore the demo without an account', loading: 'Signing in…', welcome: 'Welcome',
      forgot: 'Forgot password?', resetSent: 'If an account exists for this address, a reset e-mail has just been sent.', skip: 'Continue without an account',
      authLead: 'Find your projects on every device and work as a team.', checkMail: 'Account created. Open the confirmation e-mail to activate it, then sign in.',
      pwHint: '10 characters minimum.', newPw: 'New password', setPw: 'Save password', pwChanged: 'Password changed.', recoverTitle: 'Choose a new password',
      mfaTitle: 'Two-step verification', mfaLead: 'Enter the 6-digit code from your authenticator app.', code: 'Code', verify: 'Verify',
      saved: 'Saved', saving: 'Saving…', pending: 'Unsaved changes', offline: 'Offline · kept on this device', conflict: 'Version conflict', saveError: 'Save failed',
      conflictLead: 'Someone saved this project while you were editing it.', takeTheirs: 'Load their version', keepMine: 'Keep my version',
      ws: 'Workspace', newWs: 'New workspace…', wsName: 'Workspace name (company, team, startup)', createWs: 'Create workspace', wsLead: 'A workspace holds the projects and team of one company or startup.',
      wsNone: 'Create your first workspace', portfolio: 'Project portfolio', active: 'Active projects', atRisk: 'At risk or late', totalBudget: 'Total budget', latestEnd: 'Latest finish',
      newProject: 'New project', showArchived: 'Archived', open: 'Open', opened: 'Open now', archive: 'Archive', restore: 'Restore', del: 'Delete', confirmDel: 'Confirm deletion',
      noProjects: 'No projects yet.', firstProj: 'Create your first project', firstProjL: 'Describe it in one sentence: the assistant prepares the schedule, budget, team, the project manager’s registers and the documents.', noArchived: 'No archived projects.',
      updatedBy: 'updated', by: 'by', createdIn: 'Project created in ', joined: 'You joined ', updatedByOther: 'Project updated by ', projectDeleted: 'This project was deleted.',
      members: 'Members', role: 'Role', since: 'Since', remove: 'Remove', leave: 'Leave workspace', you: 'you',
      r_owner: 'Owner', r_pm: 'Project manager', r_member: 'Member', r_viewer: 'Viewer',
      rd_owner: 'Manage everything, including the workspace and roles', rd_pm: 'Manage projects, invitations and client links', rd_member: 'Edit projects', rd_viewer: 'View only',
      invite: 'Invite', inviteLead: 'Create an invitation link and send it to the person: it only works with that e-mail address, once, for 7 days.',
      inviteReady: 'Invitation link for ', copy: 'Copy', copied: 'Link copied.', copyManual: 'Select the link and copy it (Ctrl+C).', pendingInv: 'Pending invitations', cancel: 'Cancel', expires: 'expires',
      shares: 'Client links (read-only)', sharesLead: 'The client follows the project without an account: burndown, Gantt, budget and downloads, with no way to change anything.',
      shareLabel: 'For whom (e.g. ACME client)', validity: 'Valid for', d7: '7 days', d30: '30 days', d90: '90 days', dNever: 'No limit', createLink: 'Create link', shareReady: 'Client link ready:',
      revoke: 'Revoke', viewed: 'viewed', never: 'never', noShares: 'No active links.', openProjectFirst: 'Open a project to manage its client links.',
      activity: 'Activity', noActivity: 'No activity yet.', settings: 'Workspace settings', rename: 'Rename', deleteWs: 'Delete workspace', wsDeleted: 'Workspace deleted.',
      a_workspace_created: 'created the workspace', a_project_created: 'created', a_project_updated: 'edited', a_project_deleted: 'deleted', a_project_archived: 'archived', a_project_restored: 'restored',
      a_member_invited: 'invited', a_member_joined: 'joined the workspace', a_member_role_changed: 'changed a role', a_member_removed: 'removed a member', a_member_left: 'left the workspace',
      a_share_created: 'created a client link', a_share_revoked: 'revoked a client link', edits: 'edits', someone: 'Someone',
      shareBanner: 'Client view · read-only', shareUpdated: 'updated on', shareLoading: 'Loading the shared project…', shareInvalid: 'This client link is invalid, revoked or expired.',
      viewerBanner: 'You are viewing this project read-only (Viewer role).',
      profile: 'Profile', saveName: 'Save', nameSaved: 'Name saved.', security: 'Security', mfaOn: 'Two-step verification is on', mfaOff: 'Two-step verification is off',
      enableMfa: 'Turn on', disableMfa: 'Turn off', mfaScan: 'Scan this QR code with Google Authenticator, Microsoft Authenticator or 1Password, then enter the code shown.', secretKey: 'Manual key',
      mfaEnabled: 'Two-step verification turned on.', mfaDisabled: 'Two-step verification turned off.', changePw: 'Change password',
      privacy: 'Personal data (GDPR)', exportData: 'Export my data', deleteAccount: 'Delete my account', deleteLead: 'This cannot be undone. Type DELETE to confirm.', deleteWord: 'DELETE',
      accountDeleted: 'Account deleted.', close: 'Close', lastSeen: 'ago', now: 'just now', min: 'min', h: 'h', d: 'd',
      e_bad_credentials: 'Wrong e-mail or password.', e_email_not_confirmed: 'Confirm your address first, using the e-mail you received.', e_already_registered: 'An account already exists for this e-mail. Sign in.',
      e_weak_password: 'Password too weak: 10 characters minimum.', e_bad_email: 'Invalid e-mail address.', e_rate_limited: 'Too many attempts. Try again in a few minutes.', e_bad_code: 'Wrong or expired code.',
      e_provider_disabled: 'This sign-in method is not enabled for this site.', e_offline: 'No connection. Your changes stay on this device.', e_forbidden: 'Your role does not allow this action.',
      e_forbidden_role: 'You cannot give this role.', e_last_owner: 'There must be at least one owner: name another one first.', e_invitation_invalid: 'Invitation invalid, already used or expired.',
      e_invitation_wrong_account: 'This invitation was sent to another e-mail address. Sign in with that one.', e_transfer_ownership_first: 'Transfer ownership of these workspaces first: ',
      e_workspace_limit: 'Limit of 20 workspaces reached.', e_share_limit: 'Limit of 20 active links reached.', e_invitation_limit: 'Too many pending invitations.', e_invalid: 'Value refused by the server.',
      e_conflict: 'Someone changed this project in the meantime.', e_unknown: 'Something went wrong. Try again.', e_not_authenticated: 'Session expired. Sign in again.'
    }
  };
  const RANK = { owner: 4, pm: 3, member: 2, viewer: 1 };
  const LS = 'burndown-cloud-v1';
  const loadLS = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch { return {}; } };
  const saveLS = o => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch { /* private mode */ } };
  const ssGet = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const ssSet = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* private mode */ } };

  function init(App) {
    App.addStrings(STR.fr, STR.en);
    const cfg = (typeof CLOUD_CONFIG !== 'undefined' && CLOUD_CONFIG) || null;
    const lib = typeof window !== 'undefined' ? window.supabase : null;
    const root = document.getElementById('acct'), modalRoot = document.getElementById('cloudModal');
    if (!cfg || !lib || !root || typeof Cloud === 'undefined') return;   // local demo mode
    const { t, esc } = App, $ = id => document.getElementById(id);
    const E = e => { const c = (e && e.code) || 'unknown'; return (STR[App.ui.lang]['e_' + c] ? t('e_' + c) : t('e_unknown')) + (c === 'transfer_ownership_first' ? (e.detail || '').split(':').slice(1).join(':') : ''); };
    const redirect = location.origin + location.pathname;
    let cloud;
    try { cloud = Cloud.create({ url: cfg.url, anonKey: cfg.anonKey, lib, redirectTo: redirect }); } catch { return; }

    const st = Object.assign({ ws: null, pid: null, version: null, dirty: false }, loadLS());
    const S = { user: null, profile: null, wss: [], role: null, members: [], invites: [], shares: [], activity: [], projects: [], archived: false, status: 'idle',
      lastSaved: '', pendingCreate: false, unwatch: null, saveTimer: null, retryTimer: null, mfa: [], enrol: null, lastLink: null, lastShare: null, shared: false, undoPid: null };
    const keep = () => saveLS({ ws: st.ws, pid: st.pid, version: st.version, dirty: st.dirty });
    const canEdit = () => RANK[S.role] >= RANK.member, canManage = () => RANK[S.role] >= RANK.pm, isOwner = () => S.role === 'owner';
    const wsObj = () => S.wss.find(w => w.id === st.ws) || null;
    const nameOf = id => { const m = S.members.find(x => x.user_id === id); return m ? (m.display_name || (m.email || '').split('@')[0]) : (S.user && id === S.user.id ? (S.profile && S.profile.display_name) || t('you') : t('someone')); };
    const rel = iso => { const s = (Date.now() - Date.parse(iso)) / 1000; if (!(s >= 0)) return ''; if (s < 60) return t('now'); if (s < 3600) return `${Math.floor(s / 60)} ${t('min')}`; if (s < 86400) return `${Math.floor(s / 3600)} ${t('h')}`; return `${Math.floor(s / 86400)} ${t('d')}`; };
    const relTxt = iso => { const r = rel(iso); return r === t('now') || !r ? r : App.ui.lang === 'fr' ? `il y a ${r}` : `${r} ago`; };
    const fmtDate = iso => !iso || isNaN(Date.parse(iso)) ? '—' : new Date(iso).toLocaleDateString(App.ui.lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    /* ---------- header: save status, workspace switcher, account ---------- */
    function renderHeader() {
      if (S.shared) { root.innerHTML = ''; return; }
      if (!S.user) {
        root.innerHTML = `<span class="sync-pill s-local" title="${esc(t('localMode'))}">${esc(t('localMode'))}</span><button class="btn pri sm-pad" type="button" id="cuSignIn">${esc(t('signIn'))}</button>`;
        $('cuSignIn').onclick = () => openAuth('in');   // back to the sign-in screen
        return;
      }
      const statusTxt = { saved: t('saved'), saving: t('saving'), pending: t('pending'), offline: t('offline'), conflict: t('conflict'), error: t('saveError') }[S.status];
      const initials = ((S.profile && S.profile.display_name) || S.user.email || '?').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
      root.innerHTML = `${statusTxt && st.pid ? `<button type="button" class="sync-pill s-${S.status}" id="cuSync" title="${esc(statusTxt)}" aria-live="polite">${esc(statusTxt)}</button>` : ''}
        ${S.wss.length ? `<label class="sr" for="cuWs">${esc(t('ws'))}</label>
        <select id="cuWs" class="ws-select">${S.wss.map(w => `<option value="${esc(w.id)}"${w.id === st.ws ? ' selected' : ''}>${esc(w.name)}</option>`).join('')}<option value="__new">${esc(t('newWs'))}</option></select>` : ''}
        <button type="button" class="avatar" id="cuAvatar" aria-label="${esc(t('account'))}" title="${esc(S.user.email)}">${esc(initials || '?')}</button>`;
      if ($('cuWs')) $('cuWs').onchange = ev => { const v = ev.target.value; if (v === '__new') { ev.target.value = st.ws || ''; App.goTab('projects'); setTimeout(() => $('cuNewWsName') && $('cuNewWsName').focus(), 0); renderProjects(true); return; } switchWs(v); };
      $('cuAvatar').onclick = openAccount;
      if ($('cuSync')) $('cuSync').onclick = () => { if (S.status === 'conflict') openConflict(); else if (S.status === 'offline' || S.status === 'error') flushSave(); };
    }
    function setStatus(s) { S.status = s; renderHeader(); }

    /* ---------- modal helper ---------- */
    let lastFocus = null;
    function modal(html, onMount) {
      lastFocus = document.activeElement;
      modalRoot.hidden = false;
      modalRoot.innerHTML = `<div class="cmdk-back" data-close></div><div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="cuMTitle">${html}<button type="button" class="modal-x" data-close aria-label="${esc(t('close'))}">×</button></div>`;
      modalRoot.onclick = ev => { if (ev.target.closest('[data-close]')) closeModal(); };
      onMount && onMount();
      const f = modalRoot.querySelector('input:not([type=hidden]), button:not(.modal-x)'); f && f.focus();
    }
    function closeModal() { modalRoot.hidden = true; modalRoot.innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !modalRoot.hidden) closeModal(); });
    const busy = (btn, on) => { if (btn) { btn.disabled = on; btn.classList.toggle('is-busy', on); } };
    const msgEl = (id, text, ok) => { const el = $(id); if (el) { el.textContent = text; el.className = 'form-msg ' + (ok ? 'ok' : 'err'); } };

    /* ---------- authentication ---------- */
    /* ---------- sign-in gate: the first screen in cloud mode ---------- */
    const gate = $('gate'), gateCard = $('gateCard');
    let gateBrain = null;
    function renderGateCopy() {
      const [h1, h2] = t('gateH').split(/,\s*/);
      $('gateEyebrow').textContent = t('gateEyebrow');
      $('gateH').innerHTML = h2 ? `${esc(h1)}, <em>${esc(h2)}</em>` : esc(h1);
      $('gateLead').textContent = t('gateLead');
      $('gateFeats').innerHTML = STR[App.ui.lang].gateFeats.map(f => `<li>${esc(f)}</li>`).join('');
      gate.querySelectorAll('[data-glang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.glang === App.ui.lang));
    }
    function showGate(card) {
      document.body.classList.add('gated'); gate.hidden = false; renderGateCopy();
      if (card) { gateCard.innerHTML = card.html; card.bind && card.bind(); const f = gateCard.querySelector('input:not([type=hidden])'); f && f.focus({ preventScroll: true }); }
      if (typeof Brain !== 'undefined' && !gateBrain) { gateBrain = Brain.create($('gateCv'), { count: 2400, place: (W, H) => W > 900 ? { offsetX: 0.57, offsetY: 0.5, scale: 0.34 } : { offsetX: 0.5, cy: 185, scale: 120 / Math.min(W, H) } }); }
      gateBrain && (gateBrain.redraw(), gateBrain.start());
    }
    function hideGate() { document.body.classList.remove('gated'); gate.hidden = true; gateBrain && gateBrain.stop(); }
    function gateLoading() { showGate({ html: `<p class="gate-load">${esc(t('loading'))}</p>` }); }
    gate.addEventListener('click', ev => {
      const l = ev.target.closest('[data-glang]'); if (!l) return;
      App.ui.lang = l.dataset.glang; App.persist(); App.renderAll(); renderGateCopy();
      const m = gateCard.querySelector('[data-mode][aria-pressed="true"]'); if (m) openAuth(m.dataset.mode);
    });
    function openAuth(mode = 'in', note) {
      const up = mode === 'up';
      showGate({ html: `<p class="eyebrow">${esc(t(up ? 'signUp' : 'welcome'))}</p><h2 id="cuMTitle" class="modal-h">${esc(up ? t('signUp') : t('signIn'))}</h2>
        <p class="hint">${esc(note || t('authLead'))}</p>
        <div class="seg auth-seg" role="group"><button type="button" data-mode="in" aria-pressed="${!up}">${esc(t('signIn'))}</button><button type="button" data-mode="up" aria-pressed="${up}">${esc(t('signUp'))}</button></div>
        <form id="cuAuthForm" class="stack-sm" novalidate>
          ${up ? `<div class="f"><label for="cuName">${esc(t('fullName'))}</label><input id="cuName" autocomplete="name" maxlength="80"></div>` : ''}
          <div class="f"><label for="cuEmail">${esc(t('email'))}</label><input id="cuEmail" type="email" autocomplete="email" required maxlength="254"></div>
          <div class="f"><label for="cuPw">${esc(t('password'))}</label><input id="cuPw" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" required minlength="${up ? 10 : 1}" maxlength="200">${up ? `<span class="hint">${esc(t('pwHint'))}</span>` : ''}</div>
          <button class="btn pri wide-btn" type="submit" id="cuAuthGo">${esc(up ? t('signUp') : t('signIn'))}</button>
          <p class="form-msg" id="cuAuthMsg" role="alert"></p>
        </form>
        <p class="or">${esc(t('orWith'))}</p>
        <div class="oauth"><button class="btn" type="button" data-oauth="google">${esc(t('google'))}</button><button class="btn" type="button" data-oauth="azure">${esc(t('microsoft'))}</button></div>
        <div class="modal-foot">${up ? '<span></span>' : `<button type="button" class="linkish" id="cuForgot">${esc(t('forgot'))}</button>`}<button type="button" class="linkish" id="cuDemo">${esc(t('demo'))}</button></div>`,
      bind() {
        gateCard.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => openAuth(b.dataset.mode, note));
        gateCard.querySelectorAll('[data-oauth]').forEach(b => b.onclick = async () => { busy(b, true); try { await cloud.signInOAuth(b.dataset.oauth); } catch (e) { msgEl('cuAuthMsg', E(e)); busy(b, false); } });
        if ($('cuForgot')) $('cuForgot').onclick = async () => { try { await cloud.resetPassword($('cuEmail').value.trim()); msgEl('cuAuthMsg', t('resetSent'), true); } catch (e) { msgEl('cuAuthMsg', E(e)); } };
        $('cuDemo').onclick = () => { S.demo = true; hideGate(); App.setProject(App.sample(), { tab: 'brain' }); renderHeader(); };
        $('cuAuthForm').onsubmit = async ev => {
          ev.preventDefault(); const go = $('cuAuthGo'); busy(go, true); msgEl('cuAuthMsg', '');
          try {
            if (up) { const r = await cloud.signUp($('cuEmail').value.trim(), $('cuPw').value, $('cuName').value.trim()); if (r.needsConfirmation) { msgEl('cuAuthMsg', t('checkMail'), true); busy(go, false); return; } }
            else await cloud.signIn($('cuEmail').value.trim(), $('cuPw').value);
            await afterSignIn();
          } catch (e) { msgEl('cuAuthMsg', E(e)); busy(go, false); }
        };
      } });
    }
    function openMfaChallenge() {
      showGate({ html: `<p class="eyebrow">${esc(t('security'))}</p><h2 id="cuMTitle" class="modal-h">${esc(t('mfaTitle'))}</h2><p class="hint">${esc(t('mfaLead'))}</p>
        <form id="cuMfaForm" class="stack-sm" novalidate><div class="f"><label for="cuCode">${esc(t('code'))}</label><input id="cuCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" class="code-in"></div>
        <button class="btn pri wide-btn" type="submit" id="cuMfaGo">${esc(t('verify'))}</button><p class="form-msg" id="cuMfaMsg" role="alert"></p></form>`,
      bind() {
        $('cuMfaForm').onsubmit = async ev => {
          ev.preventDefault(); const go = $('cuMfaGo'); busy(go, true);
          try { const f = (await cloud.mfaFactors())[0]; await cloud.mfaVerify(f.id, $('cuCode').value.trim()); await afterSignIn(); }
          catch (e) { msgEl('cuMfaMsg', E(e)); busy(go, false); }
        };
      } });
    }
    function openRecovery() {
      modal(`<h2 id="cuMTitle" class="modal-h">${esc(t('recoverTitle'))}</h2><form id="cuRecForm" class="stack-sm" novalidate>
        <div class="f"><label for="cuNewPw">${esc(t('newPw'))}</label><input id="cuNewPw" type="password" autocomplete="new-password" minlength="10" maxlength="200"><span class="hint">${esc(t('pwHint'))}</span></div>
        <button class="btn pri wide-btn" type="submit" id="cuRecGo">${esc(t('setPw'))}</button><p class="form-msg" id="cuRecMsg" role="alert"></p></form>`, () => {
        $('cuRecForm').onsubmit = async ev => { ev.preventDefault(); try { await cloud.updatePassword($('cuNewPw').value); closeModal(); App.toast(t('pwChanged')); } catch (e) { msgEl('cuRecMsg', E(e)); } };
      });
    }

    let signInRun = null;
    function afterSignIn() { if (!signInRun) signInRun = doAfterSignIn().finally(() => { signInRun = null; }); return signInRun; }
    async function doAfterSignIn() {
      try {
        await cloud.session(); S.user = cloud.user(); if (!S.user) { openAuth('in'); return; }
        if (await cloud.mfaNeeded()) { openMfaChallenge(); return; }
        if (S.demo) { S.demo = false; App.clearLocal(); }
        S.profile = await cloud.profile();
        const inv = ssGet('pendingInvite');
        if (inv) { ssSet('pendingInvite', null); try { const r = await cloud.acceptInvitation(inv); if (r) { st.ws = r.workspace_id; st.pid = null; keep(); App.toast(t('joined') + r.workspace_name); } } catch (e) { App.toast(E(e), true); } }
        S.wss = await cloud.workspaces();
        if (!S.wss.some(w => w.id === st.ws)) { st.ws = S.wss[0] ? S.wss[0].id : null; st.pid = null; keep(); }
        App.setExtraTabs([['projects', 'tabProjects']], [['team', 'tabTeam']]);
        if (!st.pid) App.setEmpty(true);              // a new account starts blank: no sample, no other user's data
        hideGate(); renderHeader();
        if (!st.ws) { App.goTab('projects'); renderProjects(true); return; }
        await loadWs();
        if (st.pid) await openProject(st.pid, { resume: true }); else App.goTab('projects');
      } catch (e) { App.toast(E(e), true); if (!S.user) openAuth('in'); else hideGate(); }
    }

    async function loadWs() {
      const w = wsObj(); S.role = w ? w.role : null;
      const [projects, members, activity] = await Promise.all([cloud.projects(st.ws, S.archived), cloud.members(st.ws), cloud.activity(st.ws)]);
      S.projects = projects; S.members = members; S.activity = activity;
      S.invites = canManage() ? await cloud.invitations(st.ws) : [];
      renderProjects(); renderTeam(); renderHeader();
    }
    async function switchWs(id) {
      detach(); st.ws = id; st.pid = null; st.version = null; keep(); App.setReadOnly(false); App.setEmpty(true);
      try { await loadWs(); App.goTab('projects'); } catch (e) { App.toast(E(e), true); }
    }

    /* ---------- open / save / live updates ---------- */
    function detach() { if (S.unwatch) S.unwatch(); S.unwatch = null; clearTimeout(S.saveTimer); }
    async function openProject(pid, { resume = false } = {}) {
      detach();
      const row = await cloud.project(pid).catch(e => { App.toast(E(e), true); return null; });
      if (!row) { st.pid = null; keep(); App.setEmpty(true); App.goTab('projects'); renderProjects(); return; }
      const localDirty = resume && st.dirty && st.pid === pid;
      st.pid = pid; S.shares = [];
      if (localDirty && row.version === st.version) {
        st.version = row.version; S.lastSaved = ''; keep(); scheduleSave(0);   // our offline edits are newer: push them
      } else {
        App.setProject(row.data); st.version = row.version; st.dirty = false; S.lastSaved = JSON.stringify(App.project); keep();
        if (localDirty) setStatus('conflict'); else setStatus('saved');
      }
      App.setReadOnly(!canEdit());
      S.unwatch = cloud.watchProject(pid, onRemote);
      if (canManage()) cloud.shares(pid).then(s => { S.shares = s; renderTeam(); }).catch(() => {});
      renderProjects(); renderTeam();
      if (!resume) App.goTab('brain');
    }
    async function onRemote(ev, row) {
      if (ev === 'DELETE') { App.toast(t('projectDeleted'), true); st.pid = null; keep(); detach(); App.setReadOnly(false); App.setEmpty(true); App.goTab('projects'); loadWs().catch(() => {}); return; }
      if (!row || !(row.version > st.version)) return;          // our own save echoing back
      if (st.dirty) { setStatus('conflict'); return; }
      const data = row.data || ((await cloud.project(st.pid).catch(() => null)) || {}).data;
      if (!data) return;
      App.setProject(data); st.version = row.version; S.lastSaved = JSON.stringify(App.project); keep();
      App.toast(t('updatedByOther') + nameOf(row.updated_by)); setStatus('saved');
    }
    function scheduleSave(ms = 900) { clearTimeout(S.saveTimer); S.saveTimer = setTimeout(flushSave, ms); }
    async function flushSave() {
      if (!st.pid || !S.user || App.readOnly) return;
      const pid = st.pid, json = JSON.stringify(App.project);
      if (json === S.lastSaved) { st.dirty = false; keep(); setStatus('saved'); return; }
      setStatus('saving');
      try {
        const r = await cloud.saveProject(pid, JSON.parse(json), st.version);
        if (st.pid !== pid) return;          // another project was opened meanwhile
        st.version = r.version; st.dirty = false; S.lastSaved = json; keep(); setStatus('saved');
        const p = S.projects.find(x => x.id === st.pid); if (p) { p.data = App.project; p.name = App.project.name; p.version = r.version; p.updated_at = r.updated_at; p.updated_by = S.user.id; }
      } catch (e) {
        if (st.pid !== pid) return;
        if (e.code === 'conflict') setStatus('conflict');
        else if (e.code === 'offline') { setStatus('offline'); clearTimeout(S.retryTimer); S.retryTimer = setTimeout(flushSave, 15000); }
        else { setStatus('error'); App.toast(E(e), true); }
      }
    }
    window.addEventListener('online', () => { if (st.dirty) flushSave(); });
    function openConflict() {
      modal(`<h2 id="cuMTitle" class="modal-h">${esc(t('conflict'))}</h2><p class="hint">${esc(t('conflictLead'))}</p>
        <div class="actions"><button class="btn" type="button" id="cuTheirs">${esc(t('takeTheirs'))}</button><button class="btn pri" type="button" id="cuMine">${esc(t('keepMine'))}</button></div>`, () => {
        $('cuTheirs').onclick = async () => { closeModal(); st.dirty = false; keep(); await openProject(st.pid, { resume: true }); };
        $('cuMine').onclick = async () => { closeModal(); const row = await cloud.project(st.pid).catch(() => null); if (row) { st.version = row.version; S.lastSaved = ''; flushSave(); } };
      });
    }

    App.on('commit', p => {
      if (!S.user || S.shared || App.readOnly || App.empty) return;
      if (S.creating) return;               // the first save is on its way; later edits follow it
      if (S.pendingCreate) {
        if (!st.ws || !canEdit()) return;
        S.pendingCreate = false; S.creating = true;
        const json = JSON.stringify(p);
        cloud.createProject(st.ws, JSON.parse(json)).then(r => {
          S.creating = false;
          S.undoPid = r.id; st.pid = r.id; st.version = r.version; st.dirty = false; S.lastSaved = json; keep();
          detach(); S.unwatch = cloud.watchProject(r.id, onRemote); setStatus('saved');
          App.toast(t('createdIn') + ((wsObj() || {}).name || '')); loadWs().catch(() => {});
          scheduleSave(0);                  // anything edited while the project was being created
        }).catch(e => { S.creating = false; S.pendingCreate = true; App.toast(E(e), true); });
        return;
      }
      if (!st.pid) return;                 // a local project nobody asked to put online
      st.dirty = true; keep(); setStatus('pending'); scheduleSave();
    });
    App.on('replace', () => { if (S.user && !S.shared) { flushSave(); detach(); st.pid = null; st.version = null; S.pendingCreate = true; keep(); } });
    App.on('undo', () => {
      if (!S.user || !S.undoPid) return;
      const gone = S.undoPid; S.undoPid = null; S.pendingCreate = false;
      (canManage() ? cloud.deleteProject(gone) : cloud.archiveProject(gone, true)).catch(() => {}).then(() => loadWs().catch(() => {}));
      st.pid = null; keep(); setStatus('idle');
    });

    /* ---------- Projects tab: portfolio ---------- */
    const panelP = $('tab-projects'), panelT = $('tab-team');
    function renderProjects(forceCreate) {
      if (!panelP || !S.user) return;
      if (!S.wss.length || forceCreate === true) {
        panelP.innerHTML = `<div class="card onboard"><div class="card-b"><p class="eyebrow">${esc(t('ws'))}</p><h2 class="wiz-h">${esc(t('wsNone'))}</h2><p class="hint">${esc(t('wsLead'))}</p>
          <form id="cuNewWs" class="row-form" novalidate><div class="f grow"><label for="cuNewWsName">${esc(t('wsName'))}</label><input id="cuNewWsName" maxlength="80" required></div><button class="btn pri" type="submit">${esc(t('createWs'))}</button></form>
          <p class="form-msg" id="cuWsMsg" role="alert"></p></div></div>`;
        $('cuNewWs').onsubmit = async ev => {
          ev.preventDefault(); const name = $('cuNewWsName').value.trim(); if (!name) return;
          try { const w = await cloud.createWorkspace(name); S.wss = await cloud.workspaces(); st.ws = w.id; st.pid = null; keep(); renderHeader(); await loadWs(); }
          catch (e) { msgEl('cuWsMsg', E(e)); }
        };
        return;
      }
      const today = App.today(), C = App.Core;
      const items = S.projects.map(row => {
        const v = C.validateProject(row.data || {}); const p = v.project;
        if (!p) return null;
        const h = C.health(p, today), b = typeof Budget !== 'undefined' ? Budget.compute(p, today) : null;
        return { row, p, h, budget: b ? b.total : 0 };
      }).filter(Boolean);
      const atRisk = items.filter(x => x.h.status !== 'on').length, total = items.reduce((a, x) => a + x.budget, 0);
      const latest = items.reduce((m, x) => (x.p.end > m ? x.p.end : m), '');
      const tile = (k, v, cls = '') => `<div class="kpi ${cls}"><div class="k">${esc(t(k))}</div><div class="v" style="font-size:22px">${esc(v)}</div></div>`;
      const pill = s => `<span class="pill st-${s}">${esc(t(s))}</span>`;
      panelP.innerHTML = `<div class="port-head"><div><p class="eyebrow">${esc(t('portfolio'))}</p><h2 class="port-title">${esc((wsObj() || {}).name || '')} <span class="role-badge">${esc(t('r_' + S.role))}</span></h2></div>
        <div class="actions" style="margin:0">${canEdit() ? `<button class="btn pri" type="button" id="cuNewProj">+ ${esc(t('newProject'))}</button>` : ''}
        <label class="g-tools"><input type="checkbox" id="cuArch"${S.archived ? ' checked' : ''}> <span>${esc(t('showArchived'))}</span></label></div></div>
        ${S.archived ? '' : `<div class="kpis port-kpis">${tile('active', String(items.length))}${tile('atRisk', String(atRisk), atRisk ? 'warn-tile' : '')}${tile('totalBudget', App.eur(total))}${tile('latestEnd', latest ? App.dLabel(C.parseDate(latest), true) : '—')}</div>`}
        <div class="proj-grid">${items.length ? items.map(({ row, p, h, budget }) => `<article class="card proj-card${row.id === st.pid ? ' is-open' : ''}">
          <div class="card-b"><div class="proj-top"><h3>${esc(p.name)}</h3>${S.archived ? '' : pill(h.status)}</div>
          <p class="hint">${esc(App.dLabel(C.parseDate(p.start)))} → ${esc(App.dLabel(C.parseDate(p.end), true))} · ${p.tasks.length} ${esc(t('kTasks'))}</p>
          <div class="meter"><i style="width:${Math.round(h.pctEarned * 100)}%"></i></div>
          <dl class="proj-stats"><div><dt>${esc(t('kEarned'))}</dt><dd>${Math.round(h.pctEarned * 100)} %</dd></div><div><dt>SPI</dt><dd>${h.spi.toFixed(2)}</dd></div><div><dt>${esc(t('kBudget'))}</dt><dd>${esc(App.eur(budget))}</dd></div></dl>
          <p class="hint">${esc(t('updatedBy'))} ${esc(relTxt(row.updated_at))} ${esc(t('by'))} ${esc(nameOf(row.updated_by))}</p>
          <div class="row-actions" style="justify-content:flex-start">${row.id === st.pid ? `<span class="chip c-inprog">${esc(t('opened'))}</span>` : `<button class="btn pri sm" type="button" data-open="${esc(row.id)}">${esc(t('open'))}</button>`}
          ${canEdit() ? `<button class="btn sm" type="button" data-arch="${esc(row.id)}">${esc(t(S.archived ? 'restore' : 'archive'))}</button>` : ''}
          ${canManage() ? `<button class="btn sm danger" type="button" data-del="${esc(row.id)}">${esc(t('del'))}</button>` : ''}</div></div></article>`).join('')
          : S.archived || !canEdit() ? `<p class="hint empty">${esc(t(S.archived ? 'noArchived' : 'noProjects'))}</p>`
          : `<div class="card onboard first-proj"><div class="card-b"><p class="eyebrow">${esc(t('noProjects'))}</p><h2 class="wiz-h">${esc(t('firstProj'))}</h2><p class="hint">${esc(t('firstProjL'))}</p>
            <div class="actions"><button class="btn pri wiz-go" type="button" id="cuFirstProj">+ ${esc(t('newProject'))}</button></div></div></div>`}</div>`;
      const startNew = () => { S.pendingCreate = true; flushSave(); detach(); st.pid = null; keep(); App.setReadOnly(false); App.setEmpty(true); App.goTab('assistant'); setTimeout(() => $('wz-desc') && $('wz-desc').focus(), 0); };
      if ($('cuNewProj')) $('cuNewProj').onclick = startNew;
      if ($('cuFirstProj')) $('cuFirstProj').onclick = startNew;
      $('cuArch').onchange = async ev => { S.archived = ev.target.checked; try { S.projects = await cloud.projects(st.ws, S.archived); } catch (e) { App.toast(E(e), true); } renderProjects(); };
      let armed = null;
      panelP.onclick = async ev => {
        const o = ev.target.closest('[data-open]'), a = ev.target.closest('[data-arch]'), d = ev.target.closest('[data-del]');
        try {
          if (o) { await flushSave(); await openProject(o.dataset.open); }
          else if (a) { await cloud.archiveProject(a.dataset.arch, !S.archived); if (a.dataset.arch === st.pid) { detach(); st.pid = null; keep(); App.setReadOnly(false); App.setEmpty(true); } await loadWs(); }
          else if (d) {
            if (armed !== d.dataset.del) { armed = d.dataset.del; d.textContent = t('confirmDel'); return; }
            await cloud.deleteProject(d.dataset.del); if (d.dataset.del === st.pid) { detach(); st.pid = null; keep(); App.setReadOnly(false); App.setEmpty(true); } await loadWs();
          }
        } catch (e) { App.toast(E(e), true); }
      };
    }
    function linkBox(id, url, label) {
      return `<div class="link-box"><label class="lbl" for="${id}">${esc(label)}</label><div class="link-row"><input id="${id}" readonly value="${esc(url)}"><button class="btn sm" type="button" data-copy="${id}">${esc(t('copy'))}</button></div></div>`;
    }
    function renderTeam() {
      if (!panelT || !S.user || !st.ws) { if (panelT) panelT.innerHTML = ''; return; }
      const me = S.user.id, roles = ['owner', 'pm', 'member', 'viewer'];
      const roleOptions = (cur, target) => {
        const opts = isOwner() ? roles : (canManage() && ['member', 'viewer'].includes(cur) ? ['member', 'viewer'] : []);
        if (!opts.length || target === me && !isOwner()) return `<span class="role-badge">${esc(t('r_' + cur))}</span>`;
        return `<select class="role-sel" data-role-for="${esc(target)}" aria-label="${esc(t('role'))}">${opts.map(r => `<option value="${r}"${r === cur ? ' selected' : ''}>${esc(t('r_' + r))}</option>`).join('')}</select>`;
      };
      const invRoles = isOwner() ? ['pm', 'member', 'viewer'] : ['member', 'viewer'];
      const current = S.projects.find(p => p.id === st.pid);
      const act = S.activity.map(a => {
        const what = t('a_' + a.action.replace('.', '_'));
        const obj = a.details && (a.details.name || a.details.email || a.details.label);
        const extra = a.action === 'project.updated' && a.details.edits > 1 ? ` (${a.details.edits} ${t('edits')})` : a.action === 'member.role_changed' && a.details.to ? ` → ${t('r_' + a.details.to)}` : '';
        const q = App.ui.lang === 'fr' ? ['« ', ' »'] : ['“', '”'];
        return `<li><span class="act-dot"></span><div><b>${esc(nameOf(a.actor))}</b> ${esc(what)}${obj ? ` ${q[0]}${esc(obj)}${q[1]}` : ''}${esc(extra)}<br><span class="hint">${esc(relTxt(a.at))}</span></div></li>`;
      }).join('');
      panelT.innerHTML = `<div class="grid2 team-grid">
        <div class="stack">
          <div class="card"><div class="card-h"><h2>${esc(t('members'))}</h2><span class="hint">${S.members.length}</span></div>
            <div class="tbl-wrap"><table><thead><tr><th>${esc(t('fullName'))}</th><th>${esc(t('role'))}</th><th></th></tr></thead><tbody>
            ${S.members.map(m => `<tr><td><b>${esc(m.display_name || (m.email || '').split('@')[0] || '—')}</b>${m.user_id === me ? ` <span class="tid">(${esc(t('you'))})</span>` : ''}${m.email ? `<br><span class="hint">${esc(m.email)}</span>` : ''}</td>
              <td>${roleOptions(m.role, m.user_id)}</td>
              <td class="r">${m.user_id === me ? `<button class="btn sm" type="button" data-leave>${esc(t('leave'))}</button>` : (isOwner() || (canManage() && ['member', 'viewer'].includes(m.role))) ? `<button class="btn sm danger" type="button" data-rm="${esc(m.user_id)}">${esc(t('remove'))}</button>` : ''}</td></tr>`).join('')}
            </tbody></table></div>
            <div class="card-b role-legend">${roles.map(r => `<span><b>${esc(t('r_' + r))}</b> · ${esc(t('rd_' + r))}</span>`).join('')}</div></div>
          ${canManage() ? `<div class="card"><div class="card-h"><h2>${esc(t('invite'))}</h2></div><div class="card-b"><p class="hint">${esc(t('inviteLead'))}</p>
            <form id="cuInvForm" class="row-form" novalidate><div class="f grow"><label for="cuInvEmail">${esc(t('email'))}</label><input id="cuInvEmail" type="email" maxlength="254" required></div>
            <div class="f"><label for="cuInvRole">${esc(t('role'))}</label><select id="cuInvRole">${invRoles.map(r => `<option value="${r}"${r === 'member' ? ' selected' : ''}>${esc(t('r_' + r))}</option>`).join('')}</select></div>
            <button class="btn pri" type="submit" id="cuInvGo">${esc(t('invite'))}</button></form><p class="form-msg" id="cuInvMsg" role="alert"></p>
            ${S.lastLink ? linkBox('cuInvLink', S.lastLink.url, t('inviteReady') + S.lastLink.email) : ''}
            ${S.invites.length ? `<p class="sec-t">${esc(t('pendingInv'))}</p><ul class="mini">${S.invites.map(i => `<li><span class="tid">${esc(t('r_' + i.role))}</span><span>${esc(i.email)}<br><span class="hint">${esc(t('expires'))} ${esc(fmtDate(i.expires_at))}</span></span><button class="btn sm" type="button" data-cancel="${esc(i.id)}">${esc(t('cancel'))}</button></li>`).join('')}</ul>` : ''}
            </div></div>` : ''}
          ${canManage() ? `<div class="card"><div class="card-h"><h2>${esc(t('shares'))}</h2>${current ? `<span class="hint">${esc(current.name)}</span>` : ''}</div><div class="card-b"><p class="hint">${esc(t('sharesLead'))}</p>
            ${current ? `<form id="cuShareForm" class="row-form" novalidate><div class="f grow"><label for="cuShareLabel">${esc(t('shareLabel'))}</label><input id="cuShareLabel" maxlength="80"></div>
              <div class="f"><label for="cuShareDays">${esc(t('validity'))}</label><select id="cuShareDays"><option value="7">${esc(t('d7'))}</option><option value="30" selected>${esc(t('d30'))}</option><option value="90">${esc(t('d90'))}</option><option value="">${esc(t('dNever'))}</option></select></div>
              <button class="btn pri" type="submit">${esc(t('createLink'))}</button></form><p class="form-msg" id="cuShareMsg" role="alert"></p>
              ${S.lastShare ? linkBox('cuShareLink', S.lastShare, t('shareReady')) : ''}
              ${S.shares.length ? `<ul class="mini">${S.shares.map(s => `<li><span class="tid">↗</span><span>${esc(s.label || '—')}<br><span class="hint">${s.expires_at ? `${esc(t('expires'))} ${esc(fmtDate(s.expires_at))} · ` : ''}${esc(t('viewed'))} ${esc(s.last_viewed_at ? relTxt(s.last_viewed_at) : t('never'))}</span></span><button class="btn sm danger" type="button" data-revoke="${esc(s.id)}">${esc(t('revoke'))}</button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('noShares'))}</p>`}`
              : `<p class="hint">${esc(t('openProjectFirst'))}</p>`}
            </div></div>` : ''}
          ${canManage() ? `<div class="card"><div class="card-h"><h2>${esc(t('settings'))}</h2></div><div class="card-b">
            <form id="cuWsForm" class="row-form" novalidate><div class="f grow"><label for="cuWsRename">${esc(t('wsName'))}</label><input id="cuWsRename" maxlength="80" value="${esc((wsObj() || {}).name || '')}"></div><button class="btn" type="submit">${esc(t('rename'))}</button>
            ${isOwner() ? `<button class="btn danger" type="button" id="cuWsDel">${esc(t('deleteWs'))}</button>` : ''}</form><p class="form-msg" id="cuWsSetMsg" role="alert"></p></div></div>` : ''}
        </div>
        <div class="card"><div class="card-h"><h2>${esc(t('activity'))}</h2></div><div class="card-b">${act ? `<ul class="act">${act}</ul>` : `<p class="hint">${esc(t('noActivity'))}</p>`}</div></div>
      </div>`;
      bindTeam();
    }
    function bindTeam() {
      panelT.querySelectorAll('[data-role-for]').forEach(sel => sel.onchange = async () => { try { await cloud.setRole(st.ws, sel.dataset.roleFor, sel.value); await refreshWsList(); await loadWs(); } catch (e) { App.toast(E(e), true); renderTeam(); } });
      let armed = null;
      panelT.onclick = async ev => {
        const rm = ev.target.closest('[data-rm]'), lv = ev.target.closest('[data-leave]'), ca = ev.target.closest('[data-cancel]'), rv = ev.target.closest('[data-revoke]'), cp = ev.target.closest('[data-copy]');
        try {
          if (cp) { const inp = $(cp.dataset.copy); try { await navigator.clipboard.writeText(inp.value); App.toast(t('copied')); } catch { inp.focus(); inp.select(); App.toast(t('copyManual')); } return; }
          if (rm) { if (armed !== rm) { armed = rm; rm.textContent = t('confirmDel'); return; } await cloud.removeMember(st.ws, rm.dataset.rm); await loadWs(); }
          if (lv) { if (armed !== lv) { armed = lv; lv.textContent = t('confirmDel'); return; } await cloud.removeMember(st.ws, S.user.id); await refreshWsList(); st.ws = S.wss[0] ? S.wss[0].id : null; st.pid = null; keep(); detach(); App.setReadOnly(false); if (st.ws) await loadWs(); else renderProjects(true); App.goTab('projects'); }
          if (ca) { await cloud.cancelInvitation(ca.dataset.cancel); await loadWs(); }
          if (rv) { await cloud.revokeShare(rv.dataset.revoke); S.shares = await cloud.shares(st.pid); S.lastShare = null; renderTeam(); }
        } catch (e) { App.toast(E(e), true); }
      };
      if ($('cuInvForm')) $('cuInvForm').onsubmit = async ev => {
        ev.preventDefault(); const email = $('cuInvEmail').value.trim();
        try { const tok = await cloud.invite(st.ws, email, $('cuInvRole').value); const u = new URL(redirect); u.searchParams.set('invite', tok); S.lastLink = { url: u.toString(), email }; await loadWs(); setTimeout(() => $('cuInvLink') && $('cuInvLink').select(), 0); }
        catch (e) { msgEl('cuInvMsg', E(e)); }
      };
      if ($('cuShareForm')) $('cuShareForm').onsubmit = async ev => {
        ev.preventDefault();
        try { const tok = await cloud.createShare(st.pid, $('cuShareLabel').value.trim(), $('cuShareDays').value); const u = new URL(redirect); u.searchParams.set('share', tok); S.lastShare = u.toString(); S.shares = await cloud.shares(st.pid); renderTeam(); }
        catch (e) { msgEl('cuShareMsg', E(e)); }
      };
      if ($('cuWsForm')) $('cuWsForm').onsubmit = async ev => { ev.preventDefault(); try { await cloud.renameWorkspace(st.ws, $('cuWsRename').value); await refreshWsList(); renderTeam(); renderProjects(); msgEl('cuWsSetMsg', t('saved'), true); } catch (e) { msgEl('cuWsSetMsg', E(e)); } };
      if ($('cuWsDel')) $('cuWsDel').onclick = async ev => {
        const b = ev.currentTarget; if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = t('confirmDel'); return; }
        try { await cloud.deleteWorkspace(st.ws); App.toast(t('wsDeleted')); detach(); await refreshWsList(); st.ws = S.wss[0] ? S.wss[0].id : null; st.pid = null; keep(); App.setReadOnly(false); if (st.ws) await loadWs(); else { renderHeader(); renderProjects(true); renderTeam(); } App.goTab('projects'); }
        catch (e) { msgEl('cuWsSetMsg', E(e)); }
      };
    }
    async function refreshWsList() { S.wss = await cloud.workspaces(); const w = wsObj(); S.role = w ? w.role : null; renderHeader(); }

    /* ---------- account dialog ---------- */
    async function openAccount() {
      try { S.mfa = await cloud.mfaFactors(); } catch { S.mfa = []; }
      modal(`<p class="eyebrow">${esc(S.user.email)}</p><h2 id="cuMTitle" class="modal-h">${esc(t('account'))}</h2>
        <section class="acc-sec"><h3>${esc(t('profile'))}</h3><form id="cuNameForm" class="row-form" novalidate><div class="f grow"><label for="cuMyName">${esc(t('fullName'))}</label><input id="cuMyName" maxlength="80" value="${esc((S.profile && S.profile.display_name) || '')}"></div><button class="btn" type="submit">${esc(t('saveName'))}</button></form></section>
        <section class="acc-sec"><h3>${esc(t('security'))}</h3>
          <p class="hint">${esc(t(S.mfa.length ? 'mfaOn' : 'mfaOff'))}</p>
          ${S.mfa.length ? `<button class="btn" type="button" id="cuMfaOff">${esc(t('disableMfa'))}</button>` : S.enrol ? `<div class="mfa-enrol"><img src="${esc(S.enrol.qr)}" alt="QR" width="168" height="168"><div class="stack-sm"><p class="hint">${esc(t('mfaScan'))}</p><p class="hint">${esc(t('secretKey'))} : <code>${esc(S.enrol.secret)}</code></p>
            <form id="cuEnrolForm" class="row-form" novalidate><div class="f"><label for="cuEnrolCode">${esc(t('code'))}</label><input id="cuEnrolCode" inputmode="numeric" maxlength="6" class="code-in" autocomplete="one-time-code"></div><button class="btn pri" type="submit">${esc(t('verify'))}</button></form></div></div>`
            : `<button class="btn" type="button" id="cuMfaOn">${esc(t('enableMfa'))}</button>`}
          <form id="cuPwForm" class="row-form" novalidate style="margin-top:12px"><div class="f grow"><label for="cuPw2">${esc(t('changePw'))}</label><input id="cuPw2" type="password" autocomplete="new-password" minlength="10" maxlength="200" placeholder="${esc(t('pwHint'))}"></div><button class="btn" type="submit">${esc(t('setPw'))}</button></form>
          <p class="form-msg" id="cuSecMsg" role="alert"></p></section>
        <section class="acc-sec"><h3>${esc(t('privacy'))}</h3><div class="actions" style="margin-top:0"><button class="btn" type="button" id="cuExport">${esc(t('exportData'))}</button></div>
          <form id="cuDelForm" class="row-form" novalidate style="margin-top:12px"><div class="f grow"><label for="cuDelWord">${esc(t('deleteLead'))}</label><input id="cuDelWord" autocomplete="off" maxlength="20"></div><button class="btn danger" type="submit">${esc(t('deleteAccount'))}</button></form>
          <p class="form-msg" id="cuDelMsg" role="alert"></p></section>
        <div class="modal-foot"><button class="btn" type="button" id="cuOut">${esc(t('signOut'))}</button></div>`, () => {
        $('cuNameForm').onsubmit = async ev => { ev.preventDefault(); try { await cloud.setName($('cuMyName').value); S.profile = await cloud.profile(); renderHeader(); App.toast(t('nameSaved')); } catch (e) { msgEl('cuSecMsg', E(e)); } };
        if ($('cuMfaOn')) $('cuMfaOn').onclick = async () => { try { S.enrol = await cloud.mfaEnroll(); openAccount(); } catch (e) { msgEl('cuSecMsg', E(e)); } };
        if ($('cuEnrolForm')) $('cuEnrolForm').onsubmit = async ev => { ev.preventDefault(); try { await cloud.mfaVerify(S.enrol.id, $('cuEnrolCode').value.trim()); S.enrol = null; App.toast(t('mfaEnabled')); openAccount(); } catch (e) { msgEl('cuSecMsg', E(e)); } };
        if ($('cuMfaOff')) $('cuMfaOff').onclick = async () => { try { for (const f of S.mfa) await cloud.mfaUnenroll(f.id); App.toast(t('mfaDisabled')); openAccount(); } catch (e) { msgEl('cuSecMsg', E(e)); } };
        $('cuPwForm').onsubmit = async ev => { ev.preventDefault(); try { await cloud.updatePassword($('cuPw2').value); $('cuPw2').value = ''; msgEl('cuSecMsg', t('pwChanged'), true); } catch (e) { msgEl('cuSecMsg', E(e)); } };
        $('cuExport').onclick = async () => { try { const d = await cloud.exportMyData(); await App.saveFile(new TextEncoder().encode(JSON.stringify(d, null, 2)), 'mes-donnees-burndown.json', 'application/json'); } catch (e) { msgEl('cuDelMsg', E(e)); } };
        $('cuDelForm').onsubmit = async ev => {
          ev.preventDefault(); if ($('cuDelWord').value.trim() !== t('deleteWord')) { msgEl('cuDelMsg', t('deleteLead')); return; }
          try { await cloud.deleteAccount(); closeModal(); App.toast(t('accountDeleted')); signedOut(); } catch (e) { msgEl('cuDelMsg', E(e)); }
        };
        $('cuOut').onclick = async () => { await flushSave(); try { await cloud.signOut(); } catch { /* already signed out */ } closeModal(); signedOut(); };
      });
    }
    function signedOut() {
      detach(); S.user = null; S.profile = null; S.wss = []; S.role = null; S.projects = []; S.members = []; S.activity = [];
      st.pid = null; st.version = null; st.dirty = false; keep();
      App.setExtraTabs([], []); App.setReadOnly(false); App.clearLocal(); App.setEmpty(true); renderHeader();
      if (panelP) panelP.innerHTML = ''; if (panelT) panelT.innerHTML = '';
      openAuth('in');
    }

    /* ---------- client share view (no account) ---------- */
    async function openSharedView(token) {
      S.shared = true; App.setReadOnly(true); renderHeader();
      const banner = $('roBanner'); banner.hidden = false; banner.textContent = t('shareLoading');
      try {
        const r = await cloud.openShared(token);
        App.setProject(r.data, { tab: 'burndown' });
        banner.innerHTML = `<b>${esc(t('shareBanner'))}</b> · ${esc(t('shareUpdated'))} ${esc(fmtDate(r.updated_at))}`;
      } catch { banner.textContent = t('shareInvalid'); banner.classList.add('err'); }
    }

    App.on('render', () => {
      renderHeader();
      const smp = $('btnSample'); if (smp) smp.hidden = !!S.user;
      const banner = $('roBanner');
      if (!S.shared && banner) { const viewer = S.user && st.pid && S.role === 'viewer'; banner.hidden = !viewer; if (viewer) banner.textContent = t('viewerBanner'); }
    });
    let lastLang = App.ui.lang;
    App.on('render', () => { if (App.ui.lang !== lastLang) { lastLang = App.ui.lang; if (S.user) { renderProjects(); renderTeam(); } } });

    /* ---------- boot ---------- */
    const params = new URLSearchParams(location.search);
    const share = params.get('share'), invite = params.get('invite');
    if (invite && /^[0-9a-f]{64}$/.test(invite)) { ssSet('pendingInvite', invite); params.delete('invite'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (share) { openSharedView(share); return; }
    renderHeader(); gateLoading();
    cloud.onAuth((ev) => {
      if (ev === 'PASSWORD_RECOVERY') openRecovery();
      else if (ev === 'SIGNED_IN' && !S.user) afterSignIn();
      else if (ev === 'SIGNED_OUT' && S.user) signedOut();
    });
    cloud.session().then(s => { if (s) afterSignIn(); else openAuth('in'); }).catch(() => openAuth('in'));
  }
  return { init };
})();
if (typeof module !== 'undefined') module.exports = CloudUI;
