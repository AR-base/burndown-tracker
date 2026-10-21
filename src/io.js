/* Gantt interchange: CSV (Excel / Google Sheets / MS Project / GanttProject exports) and Mermaid gantt.
   Every parser returns a RAW project object that still goes through Core.validateProject. */
const GanttIO = (() => {
  const C = (typeof Core !== 'undefined') ? Core : require('./core.js');
  const PALETTE = ['#4f6bed', '#0f9d8a', '#d9811e', '#c2417a', '#7a5af5', '#5f7182', '#2f8fd6', '#a15c2b'];
  const MAX = 2e6;

  /* ---- dates: 2026-10-05 | 05/10/2026 | 5/10/26 | 05.10.2026 (day first, French/European) ---- */
  function toIso(v) {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return iso(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/);
    if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    return null;
  }
  function iso(y, mo, d) {
    const s = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return C.parseDate(s) === null ? null : s;
  }
  const workDur = (s, e) => Math.max(1, C.workDays(C.addDays(C.parseDate(s), -1), C.parseDate(e)));
  const nextWork = t => { let x = t; while (C.isWeekend(x)) x = C.addDays(x, 1); return x; };
  const splitName = n => { const i = n.indexOf(' / '); return i > 0 ? [n.slice(0, i).trim(), n.slice(i + 3).trim()] : [n.trim(), n.trim()]; };
  const safeId = (s, prefix, i) => { const c = String(s || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16); return c || `${prefix}${i}`; };

  /* ---- CSV ---- */
  function parseCSV(text) {
    const first = text.split(/\r?\n/, 1)[0] || '';
    const counts = [';', ',', '\t'].map(d => [d, first.split(d).length]);
    const delim = counts.sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  }
  const norm = h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%]/g, '');
  const ALIASES = {
    id: ['id', 'code', 'wbs', 'ref', 'num', 'no', 'n'],
    type: ['type', 'kind'],
    phase: ['phase', 'section', 'groupe', 'group', 'lot', 'epic', 'sprint', 'outlinelevel1'],
    fr: ['namefr', 'nomfr', 'name', 'nom', 'task', 'tache', 'taskname', 'nomdelatache', 'title', 'titre', 'libelle', 'activite', 'activity'],
    en: ['nameen', 'nomen', 'english', 'anglais'],
    owner: ['owner', 'responsable', 'resource', 'resources', 'resourcenames', 'ressources', 'assignee', 'assigne', 'role', 'qui', 'who'],
    start: ['start', 'debut', 'startdate', 'begindate', 'begin date', 'datededebut', 'begin', 'from'],
    end: ['end', 'fin', 'finish', 'enddate', 'datedefin', 'due', 'echeance', 'to'],
    points: ['points', 'pts', 'storypoints', 'sp', 'effort', 'charge', 'estimate', 'estimation', 'work', 'jh'],
    progress: ['progress', 'avancement', '%complete', 'complete', 'percentcomplete', 'pourcentage', '%', 'pct', 'completion'],
    done: ['done', 'termine', 'terminee', 'completed', 'completedon', 'actualfinish', 'findereelle', 'dateterminee'],
    deps: ['deps', 'dependencies', 'dependances', 'dependsOn', 'dependson', 'predecessors', 'predecesseurs', 'pred']
  };
  function fromCSV(text) {
    if (text.length > MAX) throw new Error('size');
    const rows = parseCSV(text.replace(/^﻿/, ''));
    if (rows.length < 2) throw new Error('csv-empty');
    const head = rows[0].map(norm), col = {};
    Object.entries(ALIASES).forEach(([k, al]) => { const i = head.findIndex(h => al.map(norm).includes(h)); if (i >= 0) col[k] = i; });
    if (col.fr === undefined || col.start === undefined || (col.end === undefined)) throw new Error('csv-columns');
    const get = (r, k) => (col[k] === undefined ? '' : String(r[col[k]] ?? '').trim());
    const phases = new Map(), tasks = [], milestones = [];
    rows.slice(1, 1201).forEach((r, i) => {
      const name = get(r, 'fr'); if (!name) return;
      const start = toIso(get(r, 'start')), end = toIso(get(r, 'end')) || start;
      if (!start) return;
      const type = norm(get(r, 'type'));
      if (type === 'milestone' || type === 'jalon') { const [fr, en] = splitName(name); milestones.push({ id: safeId(get(r, 'id'), 'M', milestones.length + 1), fr, en, date: start }); return; }
      const phName = get(r, 'phase') || '—';
      if (!phases.has(phName)) { const n = phases.size + 1; const [pf, pe] = splitName(phName); phases.set(phName, { id: `P${n}`, fr: pf, en: pe, color: PALETTE[(n - 1) % PALETTE.length] }); }
      const [fr, en0] = splitName(name);
      const prog = parseFloat(get(r, 'progress').replace(',', '.').replace('%', ''));
      const doneRaw = get(r, 'done'), doneIso = toIso(doneRaw);
      const yes = /^(1|y|yes|oui|true|x|done|ok)$/i.test(doneRaw);
      const pts = parseFloat(get(r, 'points').replace(',', '.'));
      tasks.push({
        id: safeId(get(r, 'id'), 'T', i + 1), phase: phases.get(phName).id, fr, en: get(r, 'en') || en0, owner: get(r, 'owner'),
        start, end: end < start ? start : end,
        points: Number.isFinite(pts) ? pts : workDur(start, end < start ? start : end),
        progress: Number.isFinite(prog) ? (prog <= 1 && /\./.test(get(r, 'progress')) ? prog * 100 : prog) : 0,
        done: doneIso || (yes || prog >= 100 ? end : ''),
        deps: get(r, 'deps').split(/[,;\s]+/).map(d => d.replace(/(FS|SS|FF|SF)([+-]\d+\w*)?$/i, '')).filter(Boolean)
      });
    });
    return wrap('Imported project', tasks, [...phases.values()], milestones);
  }

  /* ---- Mermaid gantt ---- */
  function fromMermaid(text) {
    if (text.length > MAX) throw new Error('size');
    const lines = text.replace(/```(mermaid)?/g, '').split(/\r?\n/).map(l => l.trim());
    if (!lines.some(l => /^gantt\b/.test(l))) throw new Error('mermaid');
    let title = 'Imported project', section = null, sCount = 0;
    const phases = [], tasks = [], milestones = [], byId = new Map(); let auto = 0, prevEnd = null;
    for (const l of lines) {
      if (!l || l.startsWith('%%') || /^(gantt|dateFormat|axisFormat|tickInterval|excludes|todayMarker|weekday|includes)\b/.test(l)) continue;
      if (/^title\s/.test(l)) { title = l.slice(6).trim().slice(0, 120); continue; }
      if (/^section\s/.test(l)) {
        sCount++; const raw = l.slice(8).trim(); const [fr, en] = splitName(raw);
        section = { id: `P${sCount}`, fr, en, color: PALETTE[(sCount - 1) % PALETTE.length] }; phases.push(section); continue;
      }
      const ci = l.lastIndexOf(':'); if (ci <= 0) continue;
      const name = l.slice(0, ci).trim(), parts = l.slice(ci + 1).split(',').map(s => s.trim()).filter(Boolean);
      const tags = new Set(); while (parts.length && /^(done|active|crit|milestone)$/.test(parts[0])) tags.add(parts.shift());
      let id = null, startTok = null, endTok = null;
      if (parts.length >= 3) [id, startTok, endTok] = parts;
      else if (parts.length === 2) { if (toIso(parts[0]) || /^after\s/.test(parts[0])) [startTok, endTok] = parts; else [id, endTok] = parts; }
      else endTok = parts[0];
      id = safeId(id, 'T', ++auto);
      let start = null; const deps = [];
      if (startTok && /^after\s/.test(startTok)) {
        startTok.slice(6).trim().split(/\s+/).forEach(d => { if (byId.has(d)) deps.push(d); });
        const ends = deps.map(d => C.parseDate(byId.get(d).end));
        if (ends.length) start = C.fmt(nextWork(C.addDays(Math.max(...ends), 1)));
      } else if (startTok) start = toIso(startTok);
      if (!start && prevEnd) start = C.fmt(nextWork(C.addDays(C.parseDate(prevEnd), 1)));
      if (!start) continue;
      let end = null; const s0 = C.parseDate(start);
      const dur = endTok && endTok.match(/^(\d+(?:\.\d+)?)\s*([dwh])$/i);
      if (dur) { const n = +dur[1] * (dur[2].toLowerCase() === 'w' ? 7 : dur[2].toLowerCase() === 'h' ? 1 / 24 : 1); end = C.fmt(C.addDays(s0, Math.max(0, Math.ceil(n) - 1))); }
      else if (endTok && toIso(endTok)) end = C.fmt(Math.max(s0, C.addDays(C.parseDate(toIso(endTok)), -1))); // Mermaid end date is exclusive
      else end = start;
      const [fr, en] = splitName(name);
      if (tags.has('milestone') || (dur && +dur[1] === 0)) { milestones.push({ id, fr, en, date: start }); continue; }
      if (!section) { section = { id: 'P1', fr: 'Tâches', en: 'Tasks', color: PALETTE[0] }; phases.push(section); sCount = 1; }
      const t = { id, phase: section.id, fr, en, owner: '', start, end, points: workDur(start, end), progress: tags.has('done') ? 100 : 0, done: tags.has('done') ? end : '', deps };
      tasks.push(t); byId.set(id, t); prevEnd = end;
    }
    return wrap(title, tasks, phases, milestones);
  }

  function wrap(name, tasks, phases, milestones) {
    if (!tasks.length) throw new Error('no-tasks');
    const ds = [...tasks.flatMap(t => [t.start, t.end]), ...milestones.map(m => m.date)].map(C.parseDate);
    let s = Math.min(...ds), e = Math.max(...ds);
    if (e <= s) e = C.addDays(s, 1);
    return { name, code: '', start: C.fmt(s), end: C.fmt(e), statusDate: '', workingDays: true, phases, milestones, tasks };
  }

  /* ---- exports ---- */
  const q = v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function toCSV(p) {
    const head = ['id', 'type', 'phase', 'name_fr', 'name_en', 'owner', 'start', 'end', 'points', 'progress', 'done', 'deps'];
    const ph = id => { const x = p.phases.find(f => f.id === id); return x ? (x.fr === x.en ? x.fr : `${x.fr} / ${x.en}`) : ''; };
    const rows = p.tasks.map(t => [t.id, 'task', ph(t.phase), t.fr, t.en, t.owner, t.start, t.end, t.points, t.progress, t.done, t.deps.join(' ')]);
    p.milestones.forEach(m => rows.push([m.id, 'milestone', '', m.fr, m.en, '', m.date, m.date, 0, '', '', '']));
    return [head, ...rows].map(r => r.map(q).join(',')).join('\n');
  }
  function toMermaid(p, lang, todayT) {
    const nm = o => (lang === 'en' ? o.en : o.fr) || o.fr || o.id;
    const clean = s => String(s).replace(/[:#;\n]/g, ' ').trim();
    const crit = C.criticalPath(p).critical, now = todayT ?? Date.now();
    const out = ['gantt', `  title ${clean(p.name)}`, '  dateFormat YYYY-MM-DD', '  axisFormat %d/%m'];
    p.phases.forEach(ph => {
      const ts = p.tasks.filter(t => t.phase === ph.id); if (!ts.length) return;
      out.push(`  section ${clean(ph.id + ' ' + nm(ph))}`);
      ts.forEach(t => {
        const tags = [crit.has(t.id) && 'crit', t.done ? 'done' : (C.parseDate(t.start) <= now ? 'active' : '')].filter(Boolean);
        out.push(`  ${clean(t.id + ' ' + nm(t))} :${tags.length ? tags.join(', ') + ', ' : ''}${t.id}, ${t.start}, ${C.fmt(C.addDays(C.parseDate(t.end), 1))}`);
      });
    });
    if (p.milestones.length) {
      out.push(`  section ${lang === 'en' ? 'Milestones' : 'Jalons'}`);
      p.milestones.forEach(m => out.push(`  ${clean(m.id + ' ' + nm(m))} :milestone, ${m.id}, ${m.date}, 0d`));
    }
    return out.join('\n');
  }
  const CSV_TEMPLATE = [
    'id;type;phase;name_fr;name_en;owner;start;end;points;progress;done;deps',
    'T1;task;Cadrage / Initiation;Réunion de lancement;Kick-off meeting;PM;04/01/2027;08/01/2027;3;100;08/01/2027;',
    'T2;task;Cadrage / Initiation;Cahier des charges;Requirements spec;PM;11/01/2027;15/01/2027;5;40;;T1',
    'T3;task;Réalisation / Build;Développement MVP;MVP development;DEV;18/01/2027;05/02/2027;13;0;;T2',
    'M1;milestone;;Livraison MVP;MVP delivered;;05/02/2027;05/02/2027;0;;;'
  ].join('\n') + '\n';

  function detect(text) {
    const s = text.trim();
    if (s.startsWith('{')) return 'json';
    if (/^(```\s*mermaid\s*)?\s*gantt\b/m.test(s)) return 'mermaid';
    return 'csv';
  }
  return { toIso, parseCSV, fromCSV, fromMermaid, toCSV, toMermaid, detect, CSV_TEMPLATE };
})();
if (typeof module !== 'undefined') module.exports = GanttIO;
