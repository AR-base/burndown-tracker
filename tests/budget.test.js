const assert = require('assert');
const C = require('../src/core.js'), B = require('../src/budget.js'), S = require('../src/sample.js');
const today = C.parseDate('2026-10-21');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const P = C.validateProject(S).project;
ok('default team added when none given', () => { assert.ok(P.team.length >= 10); assert.strictEqual(P.team.find(r => r.id === 'PM').rate, 550); });
ok('role of an owner strips lane numbers', () => { assert.strictEqual(B.roleOf('DEV2'), 'DEV'); assert.strictEqual(B.roleOf(' pm '), 'PM'); assert.strictEqual(B.roleOf(''), 'DEV'); });
ok('person-days = working days of each task, cost = days × rate', () => {
  const p = C.validateProject({ name: 'x', start: '2026-11-02', end: '2026-11-20', team: [{ id: 'DEV', fr: 'Dev', en: 'Dev', rate: 400 }],
    tasks: [{ id: 'A', owner: 'DEV1', start: '2026-11-02', end: '2026-11-06' }, { id: 'B', owner: 'DEV2', start: '2026-11-04', end: '2026-11-10' }] }).project;
  const s = B.staffing(p);
  assert.strictEqual(s.length, 1);
  assert.strictEqual(s[0].personDays, 5 + 5); // Mon–Fri, Wed–Tue (weekend skipped)
  assert.strictEqual(s[0].people, 2, 'two tasks overlap Wed–Fri');
  assert.strictEqual(s[0].cost, 4000);
});
ok('budget totals: labour + extras + contingency', () => {
  const p = { ...P, budget: { contingency: 0.1, extras: [{ fr: 'Hébergement', en: 'Hosting', amount: 1000 }] } };
  const b = B.compute(p, today);
  assert.strictEqual(b.subtotal, b.labour + 1000);
  assert.strictEqual(b.contingency, Math.round(b.subtotal * 0.1));
  assert.strictEqual(b.total, b.subtotal + b.contingency);
  assert.strictEqual(b.byPhase.reduce((a, x) => a + x.cost, 0), b.labour);
  assert.ok(b.earnedValue > 0 && b.plannedValue > 0);
  console.log('   labour', b.labour, '€ · people', b.people, '· person-days', b.personDays, '· total', b.total, '€');
});
ok('unknown owner role gets a fallback line instead of being lost', () => {
  const p = C.validateProject({ name: 'x', start: '2026-11-02', end: '2026-11-20', tasks: [{ id: 'A', owner: 'Alice', start: '2026-11-02', end: '2026-11-03' }] }).project;
  const s = B.staffing(p); assert.strictEqual(s[0].id, 'ALICE'); assert.strictEqual(s[0].cost, 2 * 500);
});
ok('hostile team / budget input is cleaned', () => {
  const c = B.clean([{ id: '<x>', rate: 1e9 }, { id: 'PM', rate: -5 }, { id: 'PM', rate: 9 }, 'junk'], { contingency: 7, extras: [{ fr: 'a'.repeat(500), amount: 'NaN' }, { amount: 5 }] });
  assert.deepStrictEqual(c.team.map(r => [r.id, r.rate]), [['X', 10000], ['PM', 0]]);
  assert.strictEqual(c.budget.contingency, 1);
  assert.strictEqual(c.budget.extras.length, 1); assert.strictEqual(c.budget.extras[0].fr.length, 120); assert.strictEqual(c.budget.extras[0].amount, 0);
});
console.log(`\n${n} tests passed`);
