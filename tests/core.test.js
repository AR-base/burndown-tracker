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
ok('burndown at 21 Oct (done mode = completed tasks only)', () => {
  const b = C.burndown({ ...C.validateProject(S).project, burnMode: 'done' }, today);
  assert.strictEqual(b.done, 26);
  assert.strictEqual(b.remaining, 83);
  assert.strictEqual(b.ideal[0].v, 109);
  assert.strictEqual(b.ideal.at(-1).v, 0);
  assert.strictEqual(C.fmt(b.actual.at(-1).t), '2026-10-21');
  assert.ok(b.forecast > C.parseDate('2026-12-18'), 'velocity forecast later than end');
});
ok('burndown counts partial progress by default (progress mode)', () => {
  const p = C.validateProject(S).project;
  const b = C.burndown(p, today);
  assert.strictEqual(b.mode, 'progress');
  assert.strictEqual(b.done, 26);
  assert.strictEqual(Math.round(b.remaining * 10) / 10, 77.9);
  // raising one task's progress moves today's point immediately
  const p2 = { ...p, tasks: p.tasks.map(k => k.id === 'T8' ? { ...k, progress: 50 } : k) };
  assert.ok(C.burndown(p2, today).actual.at(-1).v < b.actual.at(-1).v);
  console.log('   remaining', b.remaining.toFixed(1), 'vel/wk', b.velocityWeek.toFixed(1), 'forecast', C.fmt(b.forecast));
});
ok('history snapshots are kept and carried forward', () => {
  const p = C.validateProject(S).project;
  const h = C.recordHistory({ ...p, tasks: p.tasks.map(k => k.id === 'T6' ? { ...k, progress: 0 } : k) }, C.parseDate('2026-10-14'));
  const b = C.burndown({ ...p, history: h }, today);
  const v14 = b.actual.find(x => C.fmt(x.t) === '2026-10-14').v, v15 = b.actual.find(x => C.fmt(x.t) === '2026-10-15').v;
  assert.ok(v14 < 109 - 18 + 1, 'snapshot used on its day');
  assert.strictEqual(v15, v14, 'carried forward');
  const back = C.validateProject({ ...S, history: { ...h, 'bad-date': 3, '2026-10-01': -5 } }).project.history;
  assert.deepStrictEqual(Object.keys(back), ['2026-10-14']);
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
