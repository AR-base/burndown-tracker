const assert = require('assert');
const C = require('../src/core.js');
const S = require('../src/sample.js');
const today = C.parseDate('2026-10-21');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };

ok('dates: valid / invalid', () => {
  assert.strictEqual(C.fmt(C.parseDate('2026-02-28')), '2026-02-28');
  assert.strictEqual(C.parseDate('2026-02-30'), null);
  assert.strictEqual(C.parseDate('2026-2-3'), null);
  assert.strictEqual(C.parseDate('<script>'), null);
});
ok('sample validates cleanly', () => {
  const r = C.validateProject(S);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.project.tasks.length, 20);
  assert.strictEqual(C.totalPoints(r.project), 109);
});
ok('no finish-to-start violations in sample', () => {
  assert.deepStrictEqual(C.depViolations(C.validateProject(S).project), []);
});
ok('burndown at 21 Oct', () => {
  const b = C.burndown(C.validateProject(S).project, today);
  assert.strictEqual(b.done, 26);
  assert.strictEqual(b.remaining, 83);
  assert.strictEqual(b.ideal[0].v, 109);
  assert.strictEqual(b.ideal.at(-1).v, 0);
  assert.strictEqual(C.fmt(b.actual.at(-1).t), '2026-10-21');
  assert.ok(b.forecast > C.parseDate('2026-12-18'), 'velocity forecast later than end');
  console.log('   idealNow', b.idealNow.toFixed(1), 'vel/wk', b.velocityWeek.toFixed(1), 'req/wk', b.requiredWeek.toFixed(1), 'forecast', C.fmt(b.forecast));
});
ok('health / SPI', () => {
  const h = C.health(C.validateProject(S).project, today);
  assert.ok(h.spi > 0 && h.spi < 2);
  console.log('   PV', h.pv.toFixed(1), 'EV', h.ev.toFixed(1), 'SPI', h.spi.toFixed(2), h.status);
});
ok('critical path', () => {
  const cp = C.criticalPath(C.validateProject(S).project);
  console.log('   critical:', [...cp.critical].join(' '));
  assert.ok(cp.critical.has('T20'));
});
ok('cycle detection', () => {
  const p = C.validateProject(S).project;
  assert.strictEqual(C.createsCycle(p.tasks, 'T1', ['T20']), true);
  assert.strictEqual(C.createsCycle(p.tasks, 'T20', ['T1']), false);
  const bad = JSON.parse(JSON.stringify(S)); bad.tasks[0].deps = ['T2'];
  assert.ok(C.validateProject(bad).errors.includes('cycle'));
});
ok('hostile input is rejected / sanitised', () => {
  assert.strictEqual(C.validateProject(null).ok, false);
  assert.strictEqual(C.validateProject([]).ok, false);
  const r = C.validateProject({ name: 'x'.repeat(500), start: '2026-01-01', end: '2026-02-01', tasks: [
    { id: '<img>', start: '2026-01-02', end: '2026-01-03' },
    { id: 'A', start: '2026-01-05', end: '2026-01-02' },
    { id: 'B', start: '2026-01-02', end: '2026-01-03', points: 1e9, deps: ['ghost', 'B'] }
  ] });
  assert.strictEqual(r.project.name.length, 120);
  assert.strictEqual(r.project.tasks.length, 1);
  assert.strictEqual(r.project.tasks[0].points, 999);
  assert.deepStrictEqual(r.project.tasks[0].deps, []);
  assert.ok(r.errors.includes('task:0') && r.errors.includes('task:1'));
});
ok('working-day ideal is flat on weekends', () => {
  const p = C.validateProject(S).project;
  assert.strictEqual(C.idealAt(p, C.parseDate('2026-10-03')), C.idealAt(p, C.parseDate('2026-10-04')));
});
ok('phase spans', () => {
  const sp = C.phaseSpans(C.validateProject(S).project);
  assert.strictEqual(sp[0].start, '2026-09-28');
  assert.strictEqual(sp[0].progress, 1);
  assert.strictEqual(sp[5].end, '2026-12-18');
});
console.log(`\n${n} tests passed`);
