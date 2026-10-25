/* Core planning logic — pure functions, no DOM. Tested in core.test.js */
const Core = (() => {
  const DAY = 86400000;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const ID = /^[A-Za-z0-9_-]{1,16}$/;
  const HEX = /^#[0-9a-fA-F]{6}$/;

  function parseDate(s) {
    if (typeof s !== 'string' || !ISO.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d);
    const dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return t;
  }
  const fmt = t => new Date(t).toISOString().slice(0, 10);
  const addDays = (t, n) => t + n * DAY;
  const diffDays = (a, b) => Math.round((b - a) / DAY);
  const isWeekend = t => { const w = new Date(t).getUTCDay(); return w === 0 || w === 6; };
  function workDays(a, b) { // working days in (a, b]
    let n = 0;
    for (let t = addDays(a, 1); t <= b; t = addDays(t, 1)) if (!isWeekend(t)) n++;
    return n;
  }
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const num = (v, lo, hi, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };

  /* Validate + normalise an untrusted project object. Returns {ok, errors, project}. */
  function validateProject(raw) {
    const errors = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['root'], project: null };
    const p = {
      name: str(raw.name, 120) || 'Untitled project',
      code: str(raw.code, 24),
      start: str(raw.start, 10), end: str(raw.end, 10),
      statusDate: str(raw.statusDate, 10),
      workingDays: raw.workingDays !== false,
      phases: [], milestones: [], tasks: [], docs: { fr: {}, en: {} },
      burnMode: raw.burnMode === 'done' ? 'done' : 'progress', history: {}
    };
    if (raw.history && typeof raw.history === 'object' && !Array.isArray(raw.history))
      Object.keys(raw.history).filter(k => parseDate(k) !== null).sort().slice(-1000).forEach(k => {
        const v = Number(raw.history[k]); if (Number.isFinite(v) && v >= 0 && v <= 1e6) p.history[k] = Math.round(v * 10) / 10;
      });
    const DOC_KEYS = ['author', 'sponsor', 'context', 'objectives', 'scope', 'stakeholders', 'functional', 'nonfunctional', 'constraints',
      'architecture', 'stack', 'security', 'testing', 'deployment', 'risks', 'conclusion'];
    // Document texts are kept per language: docs = { fr: {...}, en: {...} }.
    // Older files with one flat set of texts are accepted and used for both languages.
    const pick = src => { const o = {}; if (src && typeof src === 'object' && !Array.isArray(src)) DOC_KEYS.forEach(k => { if (typeof src[k] === 'string' && src[k].trim()) o[k] = src[k].slice(0, 20000); }); return o; };
    if (raw.docs && typeof raw.docs === 'object' && !Array.isArray(raw.docs)) {
      if (raw.docs.fr || raw.docs.en) p.docs = { fr: pick(raw.docs.fr), en: pick(raw.docs.en) };
      else { const flat = pick(raw.docs); p.docs = { fr: { ...flat }, en: { ...flat } }; }
    } else p.docs = { fr: {}, en: {} };
    // Team day rates and budget settings (validated by budget.js, loaded lazily to avoid a require cycle)
    const B = typeof Budget !== 'undefined' ? Budget : (typeof require === 'function' ? require('./budget.js') : null);
    if (B) { const tb = B.clean(raw.team, raw.budget); p.team = tb.team; p.budget = tb.budget; }
    // Project-management registers (charter, stakeholders, RACI, risks, …) validated by pm.js
    const PMx = typeof PM !== 'undefined' ? PM : (typeof require === 'function' ? require('./pm.js') : null);
    if (PMx) p.pm = PMx.clean(raw.pm);
    const ps = parseDate(p.start), pe = parseDate(p.end);
    if (ps === null) errors.push('start');
    if (pe === null) errors.push('end');
    if (ps !== null && pe !== null && pe <= ps) errors.push('range');
    if (p.statusDate && parseDate(p.statusDate) === null) errors.push('statusDate');

    const phases = Array.isArray(raw.phases) ? raw.phases.slice(0, 30) : [];
    const phaseIds = new Set();
    phases.forEach((ph, i) => {
      const id = str(ph && ph.id, 16);
      if (!ID.test(id) || phaseIds.has(id)) { errors.push(`phase:${i}`); return; }
      phaseIds.add(id);
      p.phases.push({ id, fr: str(ph.fr, 80) || id, en: str(ph.en, 80) || str(ph.fr, 80) || id, color: HEX.test(ph.color) ? ph.color : '#5b6cff' });
    });

    const ms = Array.isArray(raw.milestones) ? raw.milestones.slice(0, 50) : [];
    ms.forEach((m, i) => {
      const id = str(m && m.id, 16);
      if (!ID.test(id) || parseDate(m.date) === null) { errors.push(`milestone:${i}`); return; }
      p.milestones.push({ id, fr: str(m.fr, 80) || id, en: str(m.en, 80) || str(m.fr, 80) || id, date: m.date });
    });

    const ts = Array.isArray(raw.tasks) ? raw.tasks.slice(0, 300) : [];
    const taskIds = new Set();
    ts.forEach((t, i) => {
      const id = str(t && t.id, 16);
      const s = parseDate(t && t.start), e = parseDate(t && t.end);
      if (!ID.test(id) || taskIds.has(id) || s === null || e === null || e < s) { errors.push(`task:${i}`); return; }
      if (t.done && parseDate(t.done) === null) { errors.push(`task:${i}:done`); return; }
      taskIds.add(id);
      p.tasks.push({
        id, fr: str(t.fr, 120) || id, en: str(t.en, 120) || str(t.fr, 120) || id,
        phase: phaseIds.has(t.phase) ? t.phase : (p.phases[0] ? p.phases[0].id : ''),
        owner: str(t.owner, 24), start: t.start, end: t.end,
        points: num(t.points, 0, 999, 1),
        progress: t.done ? 100 : num(t.progress, 0, 100, 0),
        done: t.done || '',
        deps: (Array.isArray(t.deps) ? t.deps : []).map(d => str(d, 16)).filter(Boolean).slice(0, 20)
      });
    });
    p.tasks.forEach(t => { t.deps = t.deps.filter(d => taskIds.has(d) && d !== t.id); });
    if (topoOrder(p.tasks) === null) errors.push('cycle');
    return { ok: errors.length === 0, errors, project: p };
  }

  /* Kahn topological sort; null when the dependency graph has a cycle. */
  function topoOrder(tasks) {
    const indeg = new Map(tasks.map(t => [t.id, 0]));
    const succ = new Map(tasks.map(t => [t.id, []]));
    tasks.forEach(t => t.deps.forEach(d => { if (succ.has(d)) { succ.get(d).push(t.id); indeg.set(t.id, indeg.get(t.id) + 1); } }));
    const q = tasks.filter(t => indeg.get(t.id) === 0).map(t => t.id);
    const out = [];
    while (q.length) {
      const id = q.shift(); out.push(id);
      succ.get(id).forEach(s => { indeg.set(s, indeg.get(s) - 1); if (indeg.get(s) === 0) q.push(s); });
    }
    return out.length === tasks.length ? out : null;
  }

  const totalPoints = p => p.tasks.reduce((a, t) => a + t.points, 0);
  function statusTime(p, todayT) {
    const s = parseDate(p.statusDate);
    return s !== null ? s : todayT;
  }
  const donePointsAt = (p, t) => p.tasks.reduce((a, k) => a + (k.done && parseDate(k.done) <= t ? k.points : 0), 0);
  const earned = p => p.tasks.reduce((a, k) => a + k.points * (k.done ? 1 : k.progress / 100), 0);

  /* Planned value at t: each task's points spread linearly over its duration (inclusive days). */
  function plannedAt(p, t) {
    return p.tasks.reduce((a, k) => {
      const s = parseDate(k.start), e = addDays(parseDate(k.end), 1);
      const f = t >= e ? 1 : t < s ? 0 : (addDays(t, 1) - s) / (e - s);
      return a + k.points * Math.min(1, Math.max(0, f));
    }, 0);
  }

  function idealAt(p, t) {
    const s = parseDate(p.start), e = parseDate(p.end), total = totalPoints(p);
    if (t <= s) return total;
    if (t >= e) return 0;
    if (p.workingDays) { const all = workDays(s, e); return all ? total * (1 - workDays(s, t) / all) : 0; }
    return total * (1 - diffDays(s, t) / diffDays(s, e));
  }

  /* Burndown: ideal series over the whole project, actual series up to the status date, and a forecast. */
  /* Remaining work at day t.
     'progress' mode (default): partial progress counts. Each save records a dated snapshot (p.history),
     so the line moves as soon as a task's % changes and keeps that history; days without a snapshot
     carry the last one forward, never above what completed tasks alone give.
     'done' mode: classic agile burndown, only completed tasks count. */
  function burndown(p, todayT) {
    const s = parseDate(p.start), e = parseDate(p.end), total = totalPoints(p);
    const now = Math.max(statusTime(p, todayT), s);
    const prog = p.burnMode !== 'done';
    const hist = Object.entries(p.history || {}).map(([d, v]) => [parseDate(d), v]).filter(([t]) => t !== null).sort((a, b) => a[0] - b[0]);
    const remainingNowProg = total - earned(p);
    const at = t => {
      const doneR = total - donePointsAt(p, t);
      if (!prog) return doneR;
      if (t === now) return Math.min(doneR, remainingNowProg);
      let last = null;
      for (const [ht, v] of hist) { if (ht <= t) last = v; else break; }
      return last === null ? doneR : Math.min(doneR, last);
    };
    const ideal = [], actual = [];
    for (let t = s; t <= e; t = addDays(t, 1)) ideal.push({ t, v: idealAt(p, t) });
    for (let t = s; t <= now; t = addDays(t, 1)) actual.push({ t, v: Math.round(at(t) * 10) / 10 });
    const done = donePointsAt(p, now);
    const remaining = Math.max(0, at(now));
    const burned = total - remaining;
    const elapsed = Math.max(1, diffDays(s, now));
    const velocityDay = burned / elapsed;
    let forecast = null;
    if (remaining <= 0.0001) {
      const dates = p.tasks.filter(k => k.done).map(k => parseDate(k.done));
      forecast = dates.length ? Math.max(...dates) : now;
    } else if (velocityDay > 0) forecast = addDays(now, Math.ceil(remaining / velocityDay));
    const daysLeft = Math.max(1, diffDays(now, e));
    return {
      total, done, remaining, now, ideal, actual, mode: prog ? 'progress' : 'done',
      idealNow: idealAt(p, now),
      velocityWeek: velocityDay * 7,
      requiredWeek: remaining / daysLeft * 7,
      forecast
    };
  }

  /* Snapshot of today's remaining work, kept for the burndown history (max 1000 days). */
  function recordHistory(p, t) {
    const h = { ...(p.history || {}) };
    h[fmt(t)] = Math.round((totalPoints(p) - earned(p)) * 10) / 10;
    const keys = Object.keys(h).sort();
    return Object.fromEntries(keys.slice(-1000).map(k => [k, h[k]]));
  }

  function health(p, todayT) {
    const now = statusTime(p, todayT);
    const pv = plannedAt(p, now), ev = earned(p), total = totalPoints(p);
    // Before the first planned finish nothing is due yet: the project cannot be late.
    const firstEnd = p.tasks.length ? Math.min(...p.tasks.map(k => parseDate(k.end))) : Infinity;
    const spi = now < firstEnd ? 1 : pv > 0 ? ev / pv : 1;
    const status = spi >= 0.95 ? 'on' : spi >= 0.8 ? 'risk' : 'late';
    return { pv, ev, spi, status, pctEarned: total ? ev / total : 0, pctPlanned: total ? pv / total : 0 };
  }

  /* Critical path from fixed dates: float = latest allowed start − planned start (calendar days). */
  function criticalPath(p) {
    const order = topoOrder(p.tasks);
    if (!order || !p.tasks.length) return { critical: new Set(), float: new Map() };
    const byId = new Map(p.tasks.map(t => [t.id, t]));
    const succ = new Map(p.tasks.map(t => [t.id, []]));
    p.tasks.forEach(t => t.deps.forEach(d => succ.get(d).push(t.id)));
    const projEnd = Math.max(parseDate(p.end), ...p.tasks.map(t => parseDate(t.end)));
    const ls = new Map(), fl = new Map();
    // Weekends are not slack: the latest finish snaps back to the previous working day,
    // and float is counted in working days when the project uses them.
    const prevWork = t => { let x = t; while (p.workingDays && isWeekend(x)) x = addDays(x, -1); return x; };
    [...order].reverse().forEach(id => {
      const t = byId.get(id), dur = diffDays(parseDate(t.start), parseDate(t.end));
      const lf = prevWork(succ.get(id).length ? Math.min(...succ.get(id).map(s => addDays(ls.get(s), -1))) : projEnd);
      ls.set(id, addDays(lf, -dur));
      const s0 = parseDate(t.start), l0 = ls.get(id);
      fl.set(id, p.workingDays ? (l0 >= s0 ? workDays(s0, l0) : -workDays(l0, s0)) : diffDays(s0, l0));
    });
    const minFloat = Math.min(...fl.values());
    // Critical = tasks sharing the minimum float, chained to a task without successors.
    const critical = new Set([...fl].filter(([, f]) => f <= Math.max(0, minFloat)).map(([id]) => id));
    return { critical, float: fl };
  }

  function phaseSpans(p) {
    return p.phases.map(ph => {
      const ts = p.tasks.filter(t => t.phase === ph.id);
      if (!ts.length) return { ...ph, start: null, end: null, points: 0, progress: 0, count: 0 };
      const pts = ts.reduce((a, t) => a + t.points, 0);
      const ev = ts.reduce((a, t) => a + t.points * t.progress / 100, 0);
      return {
        ...ph, count: ts.length, points: pts,
        start: fmt(Math.min(...ts.map(t => parseDate(t.start)))),
        end: fmt(Math.max(...ts.map(t => parseDate(t.end)))),
        progress: pts ? ev / pts : ts.every(t => t.done) ? 1 : 0
      };
    });
  }

  /* Wouldn't adding `dep` before `taskId` create a cycle? */
  function createsCycle(tasks, taskId, deps) {
    const copy = tasks.map(t => ({ id: t.id, deps: t.id === taskId ? deps : t.deps }));
    if (!copy.some(t => t.id === taskId)) copy.push({ id: taskId, deps });
    return topoOrder(copy) === null;
  }

  /* Finish-to-start violations: a task starting on/before a predecessor's end. */
  function depViolations(p) {
    const byId = new Map(p.tasks.map(t => [t.id, t]));
    const out = [];
    p.tasks.forEach(t => t.deps.forEach(d => { if (parseDate(t.start) <= parseDate(byId.get(d).end)) out.push([d, t.id]); }));
    return out;
  }

  return { DAY, parseDate, fmt, addDays, diffDays, isWeekend, workDays, validateProject, topoOrder, totalPoints,
    statusTime, donePointsAt, earned, plannedAt, idealAt, burndown, recordHistory, health, criticalPath, phaseSpans, createsCycle, depViolations };
})();
if (typeof module !== 'undefined') module.exports = Core;
