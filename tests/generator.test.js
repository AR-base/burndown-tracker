const assert = require('assert');
const C = require('../src/core.js'), G = require('../src/generator.js'), DG = require('../src/docgen.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const cases = [
  ['un site e-commerce pour vendre des vêtements', 'ecommerce'],
  ['I want to sell my handmade jewelry online', 'ecommerce'],
  ['site vitrine pour mon restaurant', 'website'],
  ['une application mobile android et iphone pour suivre ses dépenses', 'mobile'],
  ['un chatbot qui répond aux questions des étudiants', 'chatbot'],
  ['tableau de bord des ventes avec indicateurs', 'dashboard'],
  ['prédire les pannes des machines avec du machine learning', 'ml'],
  ['prise de rendez-vous en ligne pour un cabinet', 'booking'],
  ['un CRM pour gérer nos clients et la facturation', 'business'],
  ['plateforme de cours en ligne avec quiz', 'elearning'],
  ['audit de sécurité et test d intrusion de notre réseau', 'security'],
  ['capteurs de température connectés avec ESP32', 'iot'],
  ['quelque chose de nouveau', 'software']
];
cases.forEach(([text, want]) => ok(`detect "${text}" → ${want}`, () => assert.strictEqual(G.detect(text).id, want, JSON.stringify(G.detect(text).scores.slice(0, 3)))));
ok('every type × size builds a valid project with a consistent schedule', () => {
  G.types().forEach(({ id }) => ['small', 'medium', 'large'].forEach(size => ['fr', 'en'].forEach(lang => {
    const { project } = G.build({ description: 'test', typeId: id, size, lang, start: '2026-11-02' });
    const r = C.validateProject(project);
    assert.deepStrictEqual(r.errors, [], `${id}/${size}: ${r.errors}`);
    assert.deepStrictEqual(C.depViolations(r.project), [], `${id}/${size} FS violation`);
    r.project.tasks.forEach(t => { assert.ok(!C.isWeekend(C.parseDate(t.start)) && !C.isWeekend(C.parseDate(t.end)), `${id} ${t.id} weekend`); });
    assert.strictEqual(r.project.milestones.length, 6);
    assert.ok(Object.keys(r.project.docs.fr).length >= 15 && Object.keys(r.project.docs.en).length >= 15, 'docs filled in both languages');
  })));
});
ok('sizes order project length small < medium < large', () => {
  const len = s => { const p = G.build({ description: 'boutique en ligne', size: s, start: '2026-11-02' }).project; return C.diffDays(C.parseDate(p.start), C.parseDate(p.end)); };
  const [a, b, c] = ['small', 'medium', 'large'].map(len); console.log('   weeks:', [a, b, c].map(x => Math.round(x / 7)).join(' / '));
  assert.ok(a < b && b < c);
});
ok('start on a weekend moves to Monday; name is cleaned', () => {
  const { project } = G.build({ description: 'je veux créer un site e-commerce pour vendre du thé', start: '2026-11-07' });
  assert.strictEqual(project.start, '2026-11-09');
  assert.strictEqual(project.name, 'Site e-commerce pour vendre du thé');
});
ok('generated project → 3 Word documents', () => {
  const p = C.validateProject(G.build({ description: 'un chatbot pour le support client', client: 'ACME', start: '2026-11-02', lang: 'en' }).project).project;
  ['needs', 'technical', 'report'].forEach(k => assert.ok(DG.assemble(k, p, 'en', C.parseDate('2026-11-02'), {}).bytes.length > 5000));
  assert.ok(p.docs.en.functional.split('\n').length >= 6 && p.docs.fr.functional.includes('Indispensable'));
  assert.ok(!/\|\s*\|/.test(p.docs.en.functional));
});
ok('hostile description is kept as text (escaped later), no crash', () => {
  const p = C.validateProject(G.build({ description: '<script>alert(1)</script> | e-commerce', start: '2026-11-02' }).project).project;
  assert.ok(p.name.length <= 120);
  DG.assemble('report', p, 'fr', C.parseDate('2026-11-02'), {});
});
ok('AI answer is validated and sanitised', () => {
  assert.strictEqual(G.fromAI(null), null);
  assert.strictEqual(G.fromAI({ features: [{ fr: 'a', descFr: 'b' }] }), null);
  const c = G.fromAI({ typeId: 'evil', name: 'Boutique <b>|x</b>', features: Array.from({ length: 20 }, (_, i) => ({ fr: 'F' + i + '|<i>', descFr: 'Desc', days: 99, points: -3, priority: 'X' })) });
  assert.strictEqual(c.typeId, null); assert.strictEqual(c.features.length, 12);
  assert.ok(!/[|<>]/.test(c.name + c.features.map(f => f.join('')).join('')));
  assert.strictEqual(c.features[0][4], 15); assert.strictEqual(c.features[0][5], 1); assert.strictEqual(c.features[0][6], 'M');
  const p = C.validateProject(G.build({ description: 'x', custom: c, start: '2026-11-02' }).project);
  assert.deepStrictEqual(p.errors, []);
  assert.ok(p.project.tasks.some(t => t.fr.startsWith('F0')));
});
console.log(`\n${n} tests passed`);
