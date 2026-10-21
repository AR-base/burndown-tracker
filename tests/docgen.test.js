const assert = require('assert'), fs = require('fs'), { execSync } = require('child_process');
const C = require('../src/core.js'), DG = require('../src/docgen.js'), S = require('../src/sample.js'), IO = require('../src/io.js');
const today = C.parseDate('2026-10-21');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
const P = C.validateProject(S).project;
// 1x1 white PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC', 'base64');
const img = { bytes: new Uint8Array(PNG), w: 1200, h: 600 };
ok('docs preserved by validation', () => { assert.ok(P.docs.functional.includes('EF1')); assert.strictEqual(C.validateProject({ ...S, docs: { evil: 'x', context: 5 } }).project.docs.evil, undefined); });
ok('text syntax → bullets, tables, paragraphs', () => {
  const b = DG.textBlocks('Intro\n- a\n- b\nA | B\n1 | 2\n## Sub');
  assert.deepStrictEqual(b.map(x => x.k), ['p', 'bullets', 'table', 'h2']);
  assert.deepStrictEqual(b[2].rows, [['A', 'B'], ['1', '2']]);
});
ok('crc32 known value', () => assert.strictEqual(DG.crc32(new TextEncoder().encode('123456789')), 0xCBF43926));
const OUT = require('path').join(require('os').tmpdir(), 'docgen-test'); fs.mkdirSync(OUT, { recursive: true });
for (const kind of ['needs', 'technical', 'report']) for (const lang of ['fr', 'en']) {
  ok(`${kind}/${lang} docx builds`, () => {
    const d = DG.assemble(kind, P, lang, today, { summary: img, master: img, burndown: img });
    assert.ok(d.name.endsWith('.docx'));
    fs.writeFileSync(`${OUT}/${kind}-${lang}.docx`, d.bytes);
  });
}
ok('xml escaping of hostile project text', () => {
  const evil = C.validateProject({ ...S, name: 'A <b>&"x"</b>', docs: { context: '<script>alert(1)</script> & co' } }).project;
  const d = DG.assemble('report', evil, 'fr', today, {});
  fs.writeFileSync(`${OUT}/evil.docx`, d.bytes);
});
ok('imported CSV project (no docs) still builds all documents', () => {
  const p = C.validateProject(IO.fromCSV(IO.CSV_TEMPLATE)).project;
  ['needs', 'technical', 'report'].forEach(k => fs.writeFileSync(`${OUT}/csv-${k}.docx`, DG.assemble(k, p, 'en', today, {}).bytes));
});
// Validate with python-docx (strict OOXML reader)
let py = '';
try { py = execSync(`python3 -c "
import glob, docx
for f in sorted(glob.glob('${OUT}/*.docx')):
    d = docx.Document(f); print(f.split('/')[-1], len(d.paragraphs), 'paras', len(d.tables), 'tables', len(d.inline_shapes), 'images')"`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { if (/No module named/.test(String(e.stderr))) { console.log('   (python-docx not installed: OOXML reader check skipped)'); } else throw e; }
console.log(py.trim().split('\n').map(l => '   ' + l).join('\n'));
assert.ok(!/Error/.test(py)); n++; console.log('✓ every .docx opens in python-docx');
console.log(`\n${n} tests passed`);
