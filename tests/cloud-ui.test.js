const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const createFake = require('./fake-supabase.js');
const html = fs.readFileSync(path.join(__dirname, 'test-cloud.html'), 'utf8');
const fake = createFake();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let n = 0, failed = 0;
const check = (name, cond) => { if (cond) { n++; console.log('✓', name); } else { failed++; console.log('✗', name); } };
function page(url = 'https://app.test/') {
  const errors = [], saved = [];
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, pretendToBeVisual: true, beforeParse(w) {
    w.TextEncoder = require('util').TextEncoder; w.__fakeSupabase = { createClient: () => fake };
    w.addEventListener('error', e => errors.push(e.message)); w.console.error = (...a) => errors.push(a.join(' '));
    w.URL.createObjectURL = b => { saved.push(b); return 'blob:x'; }; w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () { saved.push(this.download); };
  } });
  const d = dom.window.document, $ = id => d.getElementById(id);
  const click = el => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const submit = el => el.dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  const type = (el, v) => { el.value = v; el.dispatchEvent(new dom.window.Event('input', { bubbles: true })); };
  const tabs = () => [...d.querySelectorAll('#tabs [data-tab]')].map(b => b.dataset.tab);
  return { dom, d, $, click, submit, type, tabs, errors, saved, w: dom.window };
}

(async () => {
  /* ---- Ana creates an account, a workspace, and puts her project online ---- */
  let A = page();
  await sleep(30);
  check('signed out: header offers sign-in, demo still works', A.$('cuSignIn') && A.tabs().join() === 'assistant,burndown,gantt,tasks,budget,project');
  A.click(A.$('cuSignIn'));
  check('sign-in dialog opens with Google and Microsoft', !A.$('cloudModal').hidden && A.d.querySelectorAll('[data-oauth]').length === 2);
  A.click(A.d.querySelector('[data-mode="up"]'));
  A.$('cuName').value = 'Ana Martin'; A.$('cuEmail').value = 'ana@acme.fr'; A.$('cuPw').value = 'short';
  A.submit(A.$('cuAuthForm')); await sleep(30);
  check('weak password refused with a clear message', /10/.test(A.$('cuAuthMsg').textContent));
  A.$('cuPw').value = 'correct-horse-battery'; A.submit(A.$('cuAuthForm')); await sleep(80);
  check('after sign-up: Projects and Team tabs appear', A.tabs()[0] === 'projects' && A.tabs().at(-1) === 'team');
  check('no workspace yet: onboarding form shown', !!A.$('cuNewWsName'));
  A.$('cuNewWsName').value = 'ACME <img src=x onerror=alert(1)>'; A.submit(A.$('cuNewWs')); await sleep(80);
  check('workspace created and selected', A.$('cuWs') && /ACME/.test(A.$('cuWs').selectedOptions[0].textContent));
  check('workspace name is escaped everywhere', !A.d.querySelector('#tab-projects img, #acct img, #tab-team img'));
  check('owner sees create + import buttons', !!A.$('cuNewProj') && !!A.$('cuImportLocal'));
  A.click(A.$('cuImportLocal')); await sleep(120);
  check('browser project imported into the workspace', fake._db.projects.length === 1 && A.d.querySelectorAll('.proj-card').length === 1);
  check('portfolio shows health and budget', /SPI/.test(A.$('tab-projects').textContent) && /€/.test(A.$('tab-projects').textContent));
  check('save status shows Saved', /Enregistré/.test(A.$('acct').textContent));
  /* edit a task -> autosave */
  A.click(A.d.querySelector('[data-tab="tasks"]'));
  A.click(A.d.querySelector('[data-act="edit"][data-id="T8"]'));
  A.$('tf-progress').value = '70'; A.submit(A.$('taskForm')); await sleep(20);
  check('an edit marks changes as pending', /attente|Enregistrement/.test(A.$('acct').textContent));
  await sleep(1100);
  const pRow = fake._db.projects[0];
  check('autosave writes to the database with a new version', pRow.version === 2 && pRow.data.tasks.find(t => t.id === 'T8').progress === 70);
  /* someone else saves -> live update */
  const bobId = fake._addUser('ghost@acme.fr', 'x', 'Ghost').id;
  fake._remoteUpdate(pRow.id, { data: { ...pRow.data, name: 'Renamed remotely' }, name: 'Renamed remotely' }, bobId);
  await sleep(40);
  check('a teammate’s save appears live', A.$('pName').textContent === 'Renamed remotely');
  /* conflict: local pending edit + remote save */
  A.click(A.d.querySelector('[data-act="edit"][data-id="T9"]'));
  A.$('tf-progress').value = '40'; A.submit(A.$('taskForm'));
  fake._remoteUpdate(pRow.id, { data: { ...pRow.data } }, bobId); await sleep(40);
  check('simultaneous edits raise a conflict instead of overwriting', /Conflit/.test(A.$('acct').textContent));
  A.click(A.$('cuSync')); await sleep(20);
  check('conflict dialog offers both versions', !!A.$('cuTheirs') && !!A.$('cuMine'));
  A.click(A.$('cuMine')); await sleep(1200);
  check('keeping my version saves it on top of the latest', fake._db.projects[0].data.tasks.find(t => t.id === 'T9').progress === 40 && /Enregistré/.test(A.$('acct').textContent));
  /* team: invite + client link */
  A.click(A.d.querySelector('[data-tab="team"]')); await sleep(30);
  check('team tab lists members and activity', A.d.querySelectorAll('#tab-team tbody tr').length === 1 && A.d.querySelectorAll('.act li').length >= 2);
  A.$('cuInvEmail').value = 'bob@acme.fr'; A.$('cuInvRole').value = 'member'; A.submit(A.$('cuInvForm')); await sleep(60);
  const inviteUrl = A.$('cuInvLink') && A.$('cuInvLink').value;
  check('invitation link created and shown once', /\?invite=[0-9a-f]{64}$/.test(inviteUrl || '') && A.d.querySelectorAll('[data-cancel]').length === 1);
  A.$('cuShareLabel').value = 'Client ACME'; A.submit(A.$('cuShareForm')); await sleep(60);
  const shareUrl = A.$('cuShareLink') && A.$('cuShareLink').value;
  check('client share link created', /\?share=[0-9a-f]{64}$/.test(shareUrl || '') && A.d.querySelectorAll('[data-revoke]').length === 1);
  /* account dialog: export + sign out */
  A.click(A.$('cuAvatar')); await sleep(30);
  check('account dialog: profile, 2-step, GDPR export and deletion', !!A.$('cuMfaOn') && !!A.$('cuExport') && !!A.$('cuDelForm'));
  A.click(A.$('cuMfaOn')); await sleep(30);
  check('2-step setup shows a QR code and manual key', !!A.d.querySelector('.mfa-enrol img') && /ABC/.test(A.$('cloudModal').textContent));
  A.click(A.$('cuExport')); await sleep(30);
  check('GDPR export downloads a JSON file', A.saved.some(x => typeof x === 'string' && x.endsWith('.json')));
  A.$('cuDelWord').value = 'nope'; A.submit(A.$('cuDelForm')); await sleep(20);
  check('account deletion requires typing the confirmation word', /SUPPRIMER/.test(A.$('cuDelMsg').textContent));
  A.click(A.$('cuOut')); await sleep(60);
  check('sign-out returns to demo mode', !!A.$('cuSignIn') && A.tabs()[0] === 'assistant');
  check('no runtime errors for Ana', A.errors.length === 0); if (A.errors.length) console.log(A.errors);

  /* ---- a client opens the share link: read-only, no account ---- */
  const Cl = page(shareUrl); await sleep(80);
  check('client view loads the shared project', Cl.$('pName').textContent === 'Renamed remotely' && /lecture seule/.test(Cl.$('roBanner').textContent));
  check('client view is read-only: no assistant, settings, task form or edit buttons', !Cl.tabs().includes('assistant') && !Cl.tabs().includes('project') && Cl.d.body.classList.contains('ro'));
  check('client can still download documents', !!Cl.$('dlBtn'));
  check('client view never overwrites the visitor’s own saved project', !Cl.w.localStorage.getItem('burndown-tracker-v1'));
  const Bad = page('https://app.test/?share=' + '0'.repeat(64)); await sleep(60);
  check('an invalid or revoked link says so', /invalide|invalid/.test(Bad.$('roBanner').textContent));

  /* ---- Bob accepts the invitation ---- */
  const B = page(inviteUrl); await sleep(40);
  check('invite token is removed from the address bar', !B.w.location.search.includes('invite='));
  check('sign-in opens automatically for a pending invitation', !B.$('cloudModal').hidden);
  B.click(B.d.querySelector('[data-mode="up"]'));
  B.$('cuName').value = 'Bob'; B.$('cuEmail').value = 'bob@acme.fr'; B.$('cuPw').value = 'correct-horse-battery'; B.submit(B.$('cuAuthForm')); await sleep(150);
  check('Bob joins ACME as a member', B.$('cuWs') && /ACME/.test(B.$('cuWs').textContent) && fake._db.workspace_members.some(m => m.role === 'member'));
  check('a member does not get invite or client-link controls', (B.click(B.d.querySelector('[data-tab="team"]')), !B.$('cuInvForm') && !B.$('cuShareForm')));
  check('a member cannot delete projects', (B.click(B.d.querySelector('[data-tab="projects"]')), B.d.querySelectorAll('[data-del]').length === 0 && B.d.querySelectorAll('[data-open]').length === 1));
  /* Bob downgraded to viewer -> read-only */
  fake._db.workspace_members.find(m => m.role === 'member').role = 'viewer';
  B.click(B.$('cuAvatar')); await sleep(20); B.click(B.$('cuOut')); await sleep(40);
  B.click(B.$('cuSignIn')); B.$('cuEmail').value = 'bob@acme.fr'; B.$('cuPw').value = 'correct-horse-battery'; B.submit(B.$('cuAuthForm')); await sleep(150);
  B.click(B.d.querySelector('[data-tab="projects"]')); B.click(B.d.querySelector('[data-open]')); await sleep(80);
  check('a viewer opens projects read-only with a banner', B.d.body.classList.contains('ro') && !B.$('roBanner').hidden);
  check('no runtime errors for client and Bob', Cl.errors.length + B.errors.length + Bad.errors.length === 0); if (Cl.errors.length + B.errors.length) console.log(Cl.errors, B.errors);

  console.log(`\n${n} tests passed${failed ? `, ${failed} FAILED` : ''}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
