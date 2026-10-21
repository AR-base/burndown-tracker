const assert = require('assert');
const C = require('../src/core.js'), IO = require('../src/io.js'), S = require('../src/sample.js');
const today = C.parseDate('2026-10-21');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const P = C.validateProject(S).project;
ok('date formats', () => {
  assert.strictEqual(IO.toIso('2026-10-05'), '2026-10-05');
  assert.strictEqual(IO.toIso('05/10/2026'), '2026-10-05');
  assert.strictEqual(IO.toIso('5.10.26'), '2026-10-05');
  assert.strictEqual(IO.toIso('31/02/2026'), null);
});
ok('detect format', () => {
  assert.strictEqual(IO.detect('{"a":1}'), 'json');
  assert.strictEqual(IO.detect('```mermaid\ngantt\n'), 'mermaid');
  assert.strictEqual(IO.detect('id;name;start'), 'csv');
});
ok('CSV round trip keeps tasks, dates, deps, done', () => {
  const back = C.validateProject(IO.fromCSV(IO.toCSV(P)));
  assert.deepStrictEqual(back.errors, []);
  assert.strictEqual(back.project.tasks.length, 20);
  assert.strictEqual(back.project.milestones.length, 6);
  assert.strictEqual(C.totalPoints(back.project), 109);
  assert.deepStrictEqual(back.project.tasks.find(t => t.id === 'T15').deps, ['T7', 'T9', 'T10']);
  assert.strictEqual(back.project.tasks.find(t => t.id === 'T5').done, '2026-10-20');
  assert.strictEqual(C.burndown(back.project, today).done, 26);
});
ok('French Excel CSV template (; and DD/MM/YYYY)', () => {
  const r = C.validateProject(IO.fromCSV(IO.CSV_TEMPLATE));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.project.tasks.length, 3);
  assert.strictEqual(r.project.milestones.length, 1);
  assert.strictEqual(r.project.tasks[0].start, '2027-01-04');
  assert.strictEqual(r.project.phases[0].en, 'Initiation');
});
ok('MS-Project-style CSV (Task Name, Start, Finish, % Complete, Predecessors)', () => {
  const csv = 'ID,Task Name,Start,Finish,% Complete,Predecessors,Resource Names\n1,Design,2027-03-01,2027-03-05,100%,,Ana\n2,Build,2027-03-08,2027-03-19,25%,1FS+2d,Bob\n';
  const r = C.validateProject(IO.fromCSV(csv));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.project.tasks[1].deps[0], '1');
  assert.strictEqual(r.project.tasks[0].done, '2027-03-05');
  assert.strictEqual(r.project.tasks[1].owner, 'Bob');
});
ok('Mermaid round trip keeps tasks, dates, deps-free schedule, milestones', () => {
  const mm = IO.toMermaid(P, 'fr', today);
  const r = C.validateProject(IO.fromMermaid(mm));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.project.tasks.length, 20);
  assert.strictEqual(r.project.milestones.length, 6);
  P.tasks.forEach(t => { const u = r.project.tasks.find(x => x.id === t.id); assert.strictEqual(u.start, t.start); assert.strictEqual(u.end, t.end); });
  assert.strictEqual(r.project.tasks.filter(t => t.done).length, 5);
});
ok('Mermaid with "after", durations and FR / EN names', () => {
  const mm = 'gantt\n title Demo\n dateFormat YYYY-MM-DD\n section Design / Conception\n Specs / Spécifications :done, a1, 2027-01-04, 5d\n Build :a2, after a1, 2w\n Launch :milestone, m1, 2027-01-29, 0d\n';
  const r = C.validateProject(IO.fromMermaid(mm));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.project.tasks[0].end, '2027-01-08');
  assert.strictEqual(r.project.tasks[1].start, '2027-01-11');
  assert.deepStrictEqual(r.project.tasks[1].deps, ['a1']);
  assert.strictEqual(r.project.tasks[0].en, 'Spécifications');
  assert.strictEqual(r.project.milestones[0].date, '2027-01-29');
});
ok('garbage input throws cleanly', () => {
  assert.throws(() => IO.fromCSV('hello'));
  assert.throws(() => IO.fromMermaid('not a gantt'));
  assert.throws(() => IO.fromCSV('a'.repeat(3e6)));
});
console.log(`\n${n} tests passed`);
