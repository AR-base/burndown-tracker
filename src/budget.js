/* Team and budget, derived from the schedule.
   A task is worked by one person of its owner's role, full time, on each working day of the task.
   → person-days per role, people needed per role (person-days over the active period, capped by peak overlap),
     labour cost (person-days × day rate), fixed costs, contingency, earned and planned value in €. */
const Budget = (() => {
  const C = (typeof Core !== 'undefined') ? Core : require('./core.js');
  const DEFAULT_TEAM = [
    ['PM', 'Chef de projet', 'Project manager', 550], ['ARCH', 'Architecte logiciel', 'Software architect', 650],
    ['UX', 'Designer UX/UI', 'UX/UI designer', 500], ['DEV', 'Développeur', 'Developer', 500],
    ['FE', 'Développeur front-end', 'Front-end developer', 500], ['BE', 'Développeur back-end', 'Back-end developer', 500],
    ['DATA', 'Data engineer', 'Data engineer', 550], ['ML', 'Data scientist', 'Data scientist', 600],
    ['QA', 'Testeur QA', 'QA tester', 450], ['SEC', 'Expert cybersécurité', 'Security expert', 650], ['OPS', 'Ingénieur DevOps', 'DevOps engineer', 550]
  ].map(([id, fr, en, rate]) => ({ id, fr, en, rate }));
  const FALLBACK_RATE = 500;
  const roleOf = owner => String(owner || '').trim().toUpperCase().replace(/\d+$/, '') || 'DEV';
  const workDaysOf = k => C.workDays(C.addDays(C.parseDate(k.start), -1), C.parseDate(k.end)) || 1;

  function team(p) {
    const list = Array.isArray(p.team) && p.team.length ? p.team : DEFAULT_TEAM;
    const byId = new Map(list.map(r => [r.id, r]));
    // any role used by a task but missing from the list gets a line with the fallback rate
    p.tasks.forEach(k => { const id = roleOf(k.owner); if (!byId.has(id)) byId.set(id, { id, fr: k.owner || id, en: k.owner || id, rate: FALLBACK_RATE }); });
    return byId;
  }

  function staffing(p) {
    const roles = team(p), out = new Map();
    p.tasks.forEach(k => {
      const id = roleOf(k.owner), r = roles.get(id), d = workDaysOf(k);
      const o = out.get(id) || { id, fr: r.fr, en: r.en, rate: r.rate, personDays: 0, start: k.start, end: k.end, days: new Map(), tasks: 0 };
      o.personDays += d; o.tasks++;
      if (k.start < o.start) o.start = k.start;
      if (k.end > o.end) o.end = k.end;
      for (let t = C.parseDate(k.start); t <= C.parseDate(k.end); t = C.addDays(t, 1)) if (!C.isWeekend(t)) o.days.set(t, (o.days.get(t) || 0) + 1);
      out.set(id, o);
    });
    return [...out.values()].map(o => {
      // People needed = person-days spread over the role's active period, rounded up,
      // never more than the peak number of tasks this role has running on the same day.
      const span = C.workDays(C.addDays(C.parseDate(o.start), -1), C.parseDate(o.end)) || 1;
      const people = Math.max(1, Math.min(Math.max(1, ...o.days.values()), Math.ceil(o.personDays / span)));
      return { id: o.id, fr: o.fr, en: o.en, rate: o.rate, people, personDays: o.personDays, tasks: o.tasks, start: o.start, end: o.end,
        load: Math.min(1, o.personDays / (span * people)), cost: o.personDays * o.rate };
    }).sort((a, b) => b.cost - a.cost);
  }

  function compute(p, todayT) {
    const roles = team(p), cfg = p.budget || {};
    const taskCost = k => workDaysOf(k) * (roles.get(roleOf(k.owner)) || { rate: FALLBACK_RATE }).rate;
    const staff = staffing(p);
    const labour = staff.reduce((a, r) => a + r.cost, 0);
    // Fixed costs follow the plan: monthly items × project months, per-person items × team size.
    const months = Math.max(1, Math.ceil((C.diffDays(C.parseDate(p.start), C.parseDate(p.end)) + 1) / 30.44));
    const people = staff.reduce((a, r) => a + r.people, 0);
    const qtyOf = per => per === 'month' ? months : per === 'person' ? people : per === 'personMonth' ? people * months : 1;
    const extras = (Array.isArray(cfg.extras) ? cfg.extras : []).filter(x => x.amount > 0).map(x => ({ ...x, per: x.per || 'once', qty: qtyOf(x.per), total: x.amount * qtyOf(x.per) }));
    const extrasTotal = extras.reduce((a, x) => a + x.total, 0);
    // Contingency: automatic from schedule risk, or a fixed rate chosen by the user.
    const auto = autoContingency(p, todayT, months);
    const contingencyRate = cfg.contMode === 'manual' && Number.isFinite(cfg.contingency) ? cfg.contingency : auto.rate;
    const subtotal = labour + extrasTotal, contingency = Math.round(subtotal * contingencyRate);
    const byPhase = p.phases.map(ph => ({ id: ph.id, fr: ph.fr, en: ph.en, color: ph.color, cost: p.tasks.filter(k => k.phase === ph.id).reduce((a, k) => a + taskCost(k), 0) })).filter(x => x.cost > 0);
    const now = C.statusTime(p, todayT);
    const ev = p.tasks.reduce((a, k) => a + taskCost(k) * (k.done ? 1 : k.progress / 100), 0);
    const pv = p.tasks.reduce((a, k) => {
      const s = C.parseDate(k.start), e = C.addDays(C.parseDate(k.end), 1);
      const f = now >= e ? 1 : now < s ? 0 : (C.addDays(now, 1) - s) / (e - s);
      return a + taskCost(k) * Math.min(1, Math.max(0, f));
    }, 0);
    return {
      currency: 'EUR', staff, labour, extras, extrasTotal, contingencyRate, contingency, subtotal, total: subtotal + contingency, byPhase,
      months, contMode: cfg.contMode === 'manual' ? 'manual' : 'auto', autoContingency: auto,
      people, personDays: staff.reduce((a, r) => a + r.personDays, 0),
      earnedValue: Math.round(ev), plannedValue: Math.round(pv)
    };
  }

  /* Automatic contingency: 10 % base, more when the schedule is at risk, when much of the plan is
     critical (no slack) and when the project is long. Each part is listed so the figure can be explained. */
  function autoContingency(p, todayT, months) {
    const parts = [{ fr: 'Base', en: 'Base', rate: 0.10 }];
    const h = C.health(p, todayT);
    if (h.status === 'risk') parts.push({ fr: 'Planning à risque (SPI < 0,95)', en: 'Schedule at risk (SPI < 0.95)', rate: 0.05 });
    if (h.status === 'late') parts.push({ fr: 'Planning en retard (SPI < 0,80)', en: 'Schedule late (SPI < 0.80)', rate: 0.10 });
    const cp = C.criticalPath(p), share = p.tasks.length ? cp.critical.size / p.tasks.length : 0;
    const crit = Math.round(Math.min(0.05, share * 0.08) * 100) / 100;
    if (crit > 0) parts.push({ fr: `Tâches sans marge (${Math.round(share * 100)} % du plan)`, en: `Tasks with no slack (${Math.round(share * 100)} % of the plan)`, rate: crit });
    if (months > 4) parts.push({ fr: 'Projet long (plus de 4 mois)', en: 'Long project (over 4 months)', rate: 0.02 });
    return { rate: Math.round(parts.reduce((a, x) => a + x.rate, 0) * 100) / 100, parts };
  }

  /* Validate untrusted team / budget settings (used by Core.validateProject through the app). */
  function clean(rawTeam, rawBudget) {
    const str = (v, m) => typeof v === 'string' ? v.trim().slice(0, m) : '';
    const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
    const seen = new Set();
    const t = (Array.isArray(rawTeam) ? rawTeam : []).slice(0, 40).map(r => r && ({ id: str(r.id, 16).toUpperCase().replace(/[^A-Z0-9_-]/g, ''), fr: str(r.fr, 60), en: str(r.en, 60), rate: Math.round(num(r.rate, 0, 10000, FALLBACK_RATE)) }))
      .filter(r => r && r.id && !seen.has(r.id) && seen.add(r.id)).map(r => ({ ...r, fr: r.fr || r.id, en: r.en || r.fr || r.id }));
    const b = rawBudget && typeof rawBudget === 'object' ? rawBudget : {};
    const extras = (Array.isArray(b.extras) ? b.extras : []).slice(0, 40).map(x => x && ({ fr: str(x.fr, 120), en: str(x.en, 120), amount: Math.round(num(x.amount, 0, 1e8, 0)),
      per: ['once', 'month', 'person', 'personMonth'].includes(x.per) ? x.per : 'once' }))
      .filter(x => x && (x.fr || x.en || x.amount > 0)).map(x => ({ ...x, fr: x.fr || x.en, en: x.en || x.fr }));
    return { team: t.length ? t : DEFAULT_TEAM.map(r => ({ ...r })), budget: { contMode: b.contMode === 'manual' ? 'manual' : 'auto', contingency: num(b.contingency, 0, 1, 0.15), extras } };
  }
  return { DEFAULT_TEAM, roleOf, staffing, compute, clean, autoContingency };
})();
if (typeof module !== 'undefined') module.exports = Budget;
