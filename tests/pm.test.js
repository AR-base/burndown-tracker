const C = require('../src/core.js'), PM = require('../src/pm.js'), G = require('../src/generator.js'), D = require('../src/docgen.js'), Brain = require('../src/brain.js');
let n = 0, failed = 0;
const check = (name, cond) => { if (cond) { n++; console.log('✓', name); } else { failed++; console.log('✗', name); } };
const T0 = Date.UTC(2026, 10, 2);

const gen = G.build({ description: 'Je veux vendre mes vêtements en ligne', start: '2026-11-02', lang: 'fr' });
const P = C.validateProject(gen.project).project;
check('a generated project carries a full PM kit', P.pm.stakeholders.length >= 5 && P.pm.risks.length >= 3 && P.pm.comms.length >= 4 && P.pm.quality.length >= 4 && P.pm.charter.purpose.length > 10);
check('risks come from the project type knowledge base', P.pm.risks.some(r => /paiement/i.test(r.title)));
check('RACI: every deliverable has exactly one approver and someone responsible', P.pm.raci.rows.length === P.phases.length && PM.raciIssues(P.pm.raci).length === 0);
check('fixed costs become purchases to order', P.pm.procurement.length === P.budget.extras.filter(x => x.amount > 0).length);
const en = C.validateProject(G.build({ description: 'online clothes shop', start: '2026-11-02', lang: 'en' }).project).project;
check('kit written in the interface language', /Sponsor|End users/.test(en.pm.stakeholders.map(s => s.name + s.role).join()) && /payment/i.test(en.pm.risks.map(r => r.title).join()));

/* validation of untrusted input */
const dirty = PM.clean({
  risks: [{ id: 'x', title: '  <b>Leak</b>  ', p: 9, i: -3, strategy: 'pray', status: 'open', response: 'a'.repeat(5000) }, { title: '' }, null, 'str'],
  stakeholders: [{ id: 'bad id!', name: 'Ana', influence: '4', interest: 'lots' }],
  raci: { roles: ['pm', 'DEV<script>', 'QA'], rows: [{ id: 'D1', item: 'Spec' }], cells: { 'D1|PM': 'A', 'D1|QA': 'Z', 'D9|PM': 'R', 'D1|DEVSCRIPT': 'R' } },
  charter: { purpose: 42, approved: 'yes', approvedOn: '2026-02-31' },
  issues: Array.from({ length: 400 }, (_, i) => ({ title: 'i' + i }))
});
check('scores are clamped to 1–5 and unknown choices reset', dirty.risks[0].p === 5 && dirty.risks[0].i === 1 && dirty.risks[0].strategy === 'avoid');
check('text is trimmed and length-limited (escaping happens on output)', dirty.risks[0].title === '<b>Leak</b>' && dirty.risks[0].response.length === 240);
check('rows without their required field, nulls and strings are dropped', dirty.risks.length === 1);
check('ids are checked and numbers parsed', dirty.stakeholders[0].id === 'r1' && dirty.stakeholders[0].influence === 4 && dirty.stakeholders[0].interest === 1);
check('RACI keeps only known rows, roles and letters', JSON.stringify(dirty.raci.cells) === JSON.stringify({ 'D1|PM': 'A', 'D1|DEVSCRIPT': 'R' }) && dirty.raci.roles.join() === 'PM,DEVSCRIPT,QA');
check('charter: wrong types and impossible dates rejected', dirty.charter.purpose === '' && dirty.charter.approved === false && dirty.charter.approvedOn === '');
check('registers are capped (300 rows)', dirty.issues.length === 300);
check('a project without pm still validates (older files)', C.validateProject({ name: 'Old', start: '2026-01-01', end: '2026-02-01', phases: [], tasks: [] }).project.pm.risks.length === 0);
check('round trip through validation is stable', JSON.stringify(C.validateProject(P).project.pm) === JSON.stringify(P.pm));

/* the brain: ten areas with live status */
const A = PM.areas(P, T0, 'fr');
check('the brain has the ten PMBOK areas, each with a module to open', A.length === 10 && A.every(a => a.name && a.value && a.does && a.go && ['good', 'warn', 'bad'].includes(a.status)));
const risky = JSON.parse(JSON.stringify(P)); risky.pm.risks.push({ id: 'Z', title: 'Fire', p: 5, i: 5, owner: 'PM', strategy: 'avoid', response: '', status: 'open' });
check('a 5×5 open risk turns the Risk area red', PM.areas(C.validateProject(risky).project, T0, 'fr').find(a => a.id === 'risk').status === 'bad');
risky.pm.risks.forEach(r => { r.status = 'closed'; });
check('closing the risks turns it green', PM.areas(C.validateProject(risky).project, T0, 'fr').find(a => a.id === 'risk').status === 'good');
const late = JSON.parse(JSON.stringify(P)); late.statusDate = '2026-12-20';
check('a slipping schedule turns Schedule red', PM.areas(C.validateProject(late).project, T0, 'en').find(a => a.id === 'schedule').status === 'bad');
const ch = JSON.parse(JSON.stringify(P)); ch.pm.changes.push({ id: 'C1', title: 'Add a blog', requestedBy: 'Client', date: '2026-11-10', impactDays: 5, impactCost: 2500, status: 'pending' });
const chP = C.validateProject(ch).project;
check('a pending change request shows on Integration and in the weekly report', /1 changement/.test(PM.areas(chP, T0, 'fr').find(a => a.id === 'integration').value) && /Add a blog \(\+5 j/.test(PM.statusReport(chP, T0, 'fr')));
const rep = PM.statusReport(P, Date.UTC(2026, 11, 1), 'en');
check('weekly report is written from live data', /Status report — /.test(rep) && /SPI/.test(rep) && /Top risks/.test(rep));

/* documents */
const needs = D.assemble('needs', P, 'fr', T0, {}), tech = D.assemble('technical', P, 'en', T0, {}), report = D.assemble('report', P, 'fr', T0, {});
const h2 = d => d.blocks.filter(b => b.k === 'h2').map(b => b.t).join('|');
check('requirements spec includes charter, stakeholders, RACI, communication and quality', ['Charte projet', 'Parties prenantes', 'Matrice RACI', 'Plan de communication', 'Qualité et recette'].every(x => h2(needs).includes(x)));
check('technical document includes the risk register (EN)', h2(tech).includes('Risk register') && h2(tech).includes('RACI matrix'));
check('report includes risks, decisions and lessons', ['Registre des risques', 'Décisions', 'Retours d’expérience'].every(x => h2(report).includes(x)));

/* brain geometry */
const g = Brain.geometry(1200);
check('brain cloud has points, synapses and one anchor per area', g.pts.length > 900 && g.edges.length > 100 && Object.keys(g.anchors).length === 10 && Object.values(g.anchors).every(i => g.pts[i]));

console.log(`\n${n} tests passed${failed ? `, ${failed} FAILED` : ''}`);
process.exit(failed ? 1 : 0);
