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
  const p = { ...P, budget: { contMode: 'manual', contingency: 0.1, extras: [{ fr: 'Hébergement', en: 'Hosting', amount: 1000, per: 'once' }] } };
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
  assert.strictEqual(c.budget.extras.length, 2); assert.strictEqual(c.budget.extras[0].fr.length, 120); assert.strictEqual(c.budget.extras[0].amount, 0); assert.strictEqual(c.budget.extras[1].amount, 5); assert.strictEqual(c.budget.extras[1].per, 'once');
});
ok('fixed costs follow the plan: per month × months, per person × team', () => {
  const base = { ...P, budget: { contMode: 'manual', contingency: 0, extras: [{ fr: 'Host', en: 'Host', amount: 100, per: 'month' }, { fr: 'Tool', en: 'Tool', amount: 10, per: 'personMonth' }] } };
  const b1 = B.compute(base, today);
  assert.strictEqual(b1.extras[0].total, 100 * b1.months);
  assert.strictEqual(b1.extras[1].total, 10 * b1.people * b1.months);
  const longer = { ...base, end: '2027-03-31' };
  assert.ok(B.compute(longer, today).extrasTotal > b1.extrasTotal, 'a longer project costs more to host');
});
ok('automatic contingency reacts to schedule risk and is explained', () => {
  const p = { ...P, budget: { contMode: 'auto', extras: [] } };
  const b = B.compute(p, today);
  assert.strictEqual(b.contMode, 'auto');
  assert.ok(b.contingencyRate > 0.10 && b.contingencyRate <= 0.30);
  assert.strictEqual(Math.round(b.autoContingency.parts.reduce((a, x) => a + x.rate, 0) * 100) / 100, b.contingencyRate);
  // finishing the critical work lowers the risk part
  const doneAll = { ...p, tasks: p.tasks.map(k => ({ ...k, done: k.end, progress: 100 })) };
  assert.ok(B.compute(doneAll, today).contingencyRate <= b.contingencyRate);
  console.log('   auto contingency', b.contingencyRate, b.autoContingency.parts.map(x => x.en + ' ' + x.rate).join(', '));
});
console.log(`\n${n} tests passed`);
