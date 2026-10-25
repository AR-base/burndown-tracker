/* PM toolkit: the registers a project manager keeps, their validation, generation for a new project,
   and the live "brain" view of the ten PM knowledge areas. Pure functions, no DOM. */
const PM = (() => {
  const C = (typeof Core !== 'undefined') ? Core : require('./core.js');
  const BG = () => (typeof Budget !== 'undefined') ? Budget : require('./budget.js');

  /* ---- register schemas: column key, type, limits ---- */
  const E = {
    strategy: ['manage', 'satisfy', 'inform', 'monitor'],
    rstrat: ['avoid', 'mitigate', 'transfer', 'accept'],
    rstatus: ['open', 'watch', 'closed'],
    severity: ['low', 'medium', 'high', 'critical'],
    istatus: ['open', 'progress', 'resolved'],
    cstatus: ['pending', 'approved', 'rejected'],
    qstatus: ['todo', 'pass', 'fail'],
    pstatus: ['planned', 'ordered', 'received'],
    freq: ['daily', 'weekly', 'biweekly', 'monthly', 'milestone'],
    mtype: ['kickoff', 'standup', 'review', 'steering', 'retro', 'client'],
    lcat: ['planning', 'team', 'technical', 'client', 'risk', 'process']
  };
  const REG = {
    stakeholders: [['name', 'text', 80, true], ['role', 'text', 80], ['influence', 'int', [1, 5]], ['interest', 'int', [1, 5]], ['strategy', 'enum', E.strategy], ['contact', 'text', 120]],
    risks: [['title', 'text', 160, true], ['p', 'int', [1, 5]], ['i', 'int', [1, 5]], ['owner', 'text', 40], ['strategy', 'enum', E.rstrat], ['response', 'text', 240], ['status', 'enum', E.rstatus]],
    issues: [['title', 'text', 160, true], ['severity', 'enum', E.severity], ['owner', 'text', 40], ['opened', 'date'], ['due', 'date'], ['status', 'enum', E.istatus]],
    decisions: [['date', 'date'], ['decision', 'text', 200, true], ['by', 'text', 60], ['rationale', 'text', 240]],
    changes: [['title', 'text', 160, true], ['requestedBy', 'text', 60], ['date', 'date'], ['impactDays', 'int', [-365, 365]], ['impactCost', 'int', [-1e8, 1e8]], ['status', 'enum', E.cstatus]],
    comms: [['what', 'text', 120, true], ['audience', 'text', 120], ['freq', 'enum', E.freq], ['channel', 'text', 60], ['owner', 'text', 40]],
    quality: [['deliverable', 'text', 120, true], ['criteria', 'text', 240], ['method', 'text', 120], ['status', 'enum', E.qstatus]],
    procurement: [['item', 'text', 120, true], ['supplier', 'text', 80], ['amount', 'int', [0, 1e8]], ['due', 'date'], ['status', 'enum', E.pstatus]],
    meetings: [['date', 'date'], ['type', 'enum', E.mtype], ['notes', 'text', 600, true], ['actions', 'text', 400]],
    lessons: [['date', 'date'], ['category', 'enum', E.lcat], ['lesson', 'text', 300, true], ['action', 'text', 240]]
  };
  const RACI = ['R', 'A', 'C', 'I'];
  const str = (v, m) => (typeof v === 'string' ? v.trim().slice(0, m) : '');
  const okId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,16}$/.test(v);

  function cleanRow(cols, raw, i) {
    if (!raw || typeof raw !== 'object') return null;
    const row = { id: okId(raw.id) ? raw.id : 'r' + (i + 1) };
    for (const [k, type, lim, req] of cols) {
      const v = raw[k];
      if (type === 'text') row[k] = str(v, lim);
      else if (type === 'int') { const n = Math.round(Number(v)); row[k] = Number.isFinite(n) ? Math.min(lim[1], Math.max(lim[0], n)) : lim[0] > 0 ? lim[0] : 0; }
      else if (type === 'enum') row[k] = lim.includes(v) ? v : lim[0];
      else if (type === 'date') row[k] = typeof v === 'string' && C.parseDate(v) !== null ? v : '';
      if (req && !row[k]) return null;
    }
    return row;
  }

  /* Validate an untrusted pm object (from storage, import or the network). */
  function clean(raw) {
    const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const [name, cols] of Object.entries(REG)) {
      const seen = new Set();
      out[name] = (Array.isArray(r[name]) ? r[name] : []).slice(0, 300).map((x, i) => cleanRow(cols, x, i)).filter(x => x && !seen.has(x.id) && seen.add(x.id));
    }
    const c = r.charter && typeof r.charter === 'object' ? r.charter : {};
    out.charter = { purpose: str(c.purpose, 600), sponsor: str(c.sponsor, 120), manager: str(c.manager, 120), success: str(c.success, 600), approved: c.approved === true, approvedOn: typeof c.approvedOn === 'string' && C.parseDate(c.approvedOn) !== null ? c.approvedOn : '' };
    const rx = r.raci && typeof r.raci === 'object' ? r.raci : {};
    const roles = (Array.isArray(rx.roles) ? rx.roles : []).map(x => str(x, 16).toUpperCase().replace(/[^A-Z0-9_-]/g, '')).filter(Boolean).slice(0, 12);
    const rows = (Array.isArray(rx.rows) ? rx.rows : []).slice(0, 60).map((x, i) => x && typeof x === 'object' ? { id: okId(x.id) ? x.id : 'x' + (i + 1), item: str(x.item, 120) } : null).filter(x => x && x.item);
    const cells = {};
    if (rx.cells && typeof rx.cells === 'object') for (const [k, v] of Object.entries(rx.cells)) {
      const [rid, role] = k.split('|');
      if (rows.some(x => x.id === rid) && roles.includes(role) && RACI.includes(v)) cells[`${rid}|${role}`] = v;
    }
    out.raci = { roles, rows, cells };
    return out;
  }
  const empty = () => clean({});
  const isEmpty = pm => !pm || (!pm.charter.purpose && Object.keys(REG).every(k => !pm[k].length) && !pm.raci.rows.length);

  /* ---- generate a full PM kit from any project (generated, imported or typed) ---- */
  function generate(P, lang = 'fr', typeRisks = []) {
    const fr = lang === 'fr', L = (a, b) => (fr ? a : b);
    const docs = (P.docs && (P.docs[lang] || P.docs.fr || P.docs.en)) || {};
    const ms = id => { const v = (P.milestones.find(m => m.id === id) || {}).date || P.end; return new Date(C.parseDate(v)).toLocaleDateString(fr ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
    const phaseEnd = id => { const ts = P.tasks.filter(t => t.phase === id); return ts.length ? ts.reduce((m, t) => (t.end > m ? t.end : m), ts[0].end) : P.start; };
    const roles = [...new Set(P.tasks.map(t => BG().roleOf(t.owner)))].filter(r => r && r !== 'PM').slice(0, 8);
    roles.unshift('CLIENT', 'PM');
    const sponsor = docs.sponsor || L('Sponsor', 'Sponsor'), manager = docs.author || L('Chef de projet', 'Project manager');
    const firstLine = s => String(s || '').split('\n').map(x => x.trim()).find(x => x && !x.includes(' | ') && !x.startsWith('#')) || '';
    let n = 0; const id = p => `${p}${++n}`;

    const risks = (typeRisks.length ? typeRisks : [
      [L('Retard sur les livrables clés', 'Key deliverables late'), 3, 4, L('Suivi hebdomadaire du burndown, marge sur le chemin critique', 'Weekly burndown review, buffer on the critical path')],
      [L('Besoins qui changent en cours de projet', 'Requirements change mid-project'), 3, 3, L('Demandes de changement chiffrées et validées par le sponsor', 'Change requests costed and approved by the sponsor')],
      [L('Indisponibilité d’une personne clé', 'Key person unavailable'), 2, 4, L('Binômes et documentation des tâches critiques', 'Pairing and documentation of critical tasks')]
    ]).map(([t, p, i, resp]) => ({ id: id('R'), title: t, p, i, owner: 'PM', strategy: p * i >= 15 ? 'avoid' : 'mitigate', response: resp, status: 'open' }));
    risks.push({ id: id('R'), title: L('Dérive du budget', 'Budget overrun'), p: 2, i: 4, owner: 'PM', strategy: 'mitigate', response: L('Revue mensuelle valeur acquise / planifiée, marge pour imprévus', 'Monthly earned vs planned value review, contingency reserve'), status: 'open' });

    const deliverables = P.phases.map(ph => ({ ph, ts: P.tasks.filter(t => t.phase === ph.id) })).filter(x => x.ts.length);
    const raciRows = deliverables.map((x, i) => ({ id: 'D' + (i + 1), item: `${x.ph.id} · ${fr ? x.ph.fr : x.ph.en}` }));
    const cells = {};
    deliverables.forEach((x, i) => {
      const rid = 'D' + (i + 1), owners = [...new Set(x.ts.map(t => BG().roleOf(t.owner)))];
      const pmOnly = owners.every(o => o === 'PM');
      roles.forEach(r => { cells[`${rid}|${r}`] = owners.includes(r) && r !== 'PM' ? 'R' : 'I'; });
      // the PM approves the team's work; when the PM does the work (scoping, closure), the client approves it
      cells[`${rid}|PM`] = pmOnly ? 'R' : 'A';
      cells[`${rid}|CLIENT`] = pmOnly ? 'A' : ['P2', 'P4'].includes(x.ph.id) ? 'C' : 'I';
      const reviewer = roles.find(r => ['ARCH', 'SEC', 'QA'].includes(r) && !owners.includes(r));
      if (reviewer) cells[`${rid}|${reviewer}`] = 'C';
    });

    return clean({
      charter: {
        purpose: firstLine(docs.context) || L(`Livrer « ${P.name} » dans les délais, le budget et la qualité attendus.`, `Deliver “${P.name}” on time, on budget and to the expected quality.`),
        sponsor, manager,
        success: L(`Mise en service le ${ms('M5')}, toutes les exigences indispensables validées en recette, budget respecté à ±10 %.`, `Go-live on ${ms('M5')}, all must-have requirements accepted, budget within ±10 %.`)
      },
      stakeholders: [
        { id: id('S'), name: sponsor, role: L('Sponsor / client', 'Sponsor / client'), influence: 5, interest: 5, strategy: 'manage' },
        { id: id('S'), name: manager, role: L('Chef de projet', 'Project manager'), influence: 4, interest: 5, strategy: 'manage' },
        { id: id('S'), name: L('Utilisateurs finaux', 'End users'), role: L('Utilisent le produit', 'Use the product'), influence: 2, interest: 5, strategy: 'inform' },
        { id: id('S'), name: L('Équipe technique', 'Technical team'), role: L('Conçoit et réalise', 'Designs and builds'), influence: 3, interest: 4, strategy: 'inform' },
        { id: id('S'), name: L('Direction / finance', 'Management / finance'), role: L('Valide le budget', 'Approves the budget'), influence: 5, interest: 2, strategy: 'satisfy' },
        { id: id('S'), name: L('Support / exploitation', 'Support / operations'), role: L('Reprend le produit après la mise en service', 'Takes over after go-live'), influence: 2, interest: 2, strategy: 'monitor' }
      ],
      raci: { roles, rows: raciRows, cells },
      risks,
      comms: [
        { id: id('C'), what: L('Point d’équipe (stand-up)', 'Team stand-up'), audience: L('Équipe projet', 'Project team'), freq: 'daily', channel: 'Teams / Slack', owner: 'PM' },
        { id: id('C'), what: L('Rapport d’avancement (burndown, SPI, budget)', 'Status report (burndown, SPI, budget)'), audience: L('Sponsor, client', 'Sponsor, client'), freq: 'weekly', channel: 'E-mail', owner: 'PM' },
        { id: id('C'), what: L('Revue de sprint / démonstration', 'Sprint review / demo'), audience: L('Client, utilisateurs clés', 'Client, key users'), freq: 'biweekly', channel: L('Visio', 'Video call'), owner: 'PM' },
        { id: id('C'), what: L('Comité de pilotage', 'Steering committee'), audience: L('Sponsor, direction', 'Sponsor, management'), freq: 'milestone', channel: L('Réunion', 'Meeting'), owner: 'PM' },
        { id: id('C'), what: L('Rétrospective', 'Retrospective'), audience: L('Équipe projet', 'Project team'), freq: 'biweekly', channel: L('Atelier', 'Workshop'), owner: 'PM' }
      ],
      quality: [
        ...P.milestones.slice(0, 5).map(m => ({ id: id('Q'), deliverable: fr ? m.fr : m.en, criteria: L('Validé par le sponsor à la date du jalon', 'Approved by the sponsor on the milestone date'), method: L('Revue et signature', 'Review and sign-off'), status: 'todo' })),
        { id: id('Q'), deliverable: L('Code et application', 'Code and application'), criteria: L('Tests automatiques au vert, couverture ≥ 70 %, 0 faille critique', 'Automated tests green, coverage ≥ 70 %, 0 critical flaw'), method: L('Intégration continue + revue de code', 'CI + code review'), status: 'todo' }
      ],
      procurement: (P.budget && Array.isArray(P.budget.extras) ? P.budget.extras : []).filter(x => x.amount > 0).slice(0, 12)
        .map(x => ({ id: id('A'), item: fr ? x.fr : x.en, supplier: '', amount: x.amount, due: (x.per || 'once') === 'once' ? phaseEnd('P2') : P.start, status: 'planned' })),
      meetings: [{ id: id('M'), date: P.start, type: 'kickoff', notes: L('Réunion de lancement : objectifs, périmètre, rôles, planning et règles de communication.', 'Kick-off: objectives, scope, roles, schedule and communication rules.'), actions: L('Valider le cahier des charges avant le jalon M1', 'Approve the requirements before milestone M1') }],
      decisions: [{ id: id('D'), date: P.start, decision: L('Méthode : phases + sprints d’une semaine, suivi par burndown', 'Method: phases + one-week sprints, tracked by burndown'), by: 'PM', rationale: L('Visibilité hebdomadaire pour le client', 'Weekly visibility for the client') }],
      issues: [], changes: [], lessons: []
    });
  }

  /* ---- the ten PM knowledge areas (PMBOK), with live status for the brain ---- */
  const AREAS = [
    { id: 'integration', fr: 'Intégration', en: 'Integration', go: 'pm:charter', does: ['Tient la charte, arbitre les changements et décide', 'Owns the charter, arbitrates changes and decides'] },
    { id: 'scope', fr: 'Périmètre', en: 'Scope', go: 'tasks', does: ['Définit ce qui est inclus, découpe en tâches (WBS)', 'Defines what is in, breaks it into tasks (WBS)'] },
    { id: 'schedule', fr: 'Délais', en: 'Schedule', go: 'gantt', does: ['Planifie, suit le Gantt et le chemin critique', 'Plans, tracks the Gantt and critical path'] },
    { id: 'cost', fr: 'Coûts', en: 'Cost', go: 'budget', does: ['Estime, budgétise et suit la valeur acquise', 'Estimates, budgets and tracks earned value'] },
    { id: 'quality', fr: 'Qualité', en: 'Quality', go: 'pm:quality', does: ['Fixe les critères d’acceptation et les contrôle', 'Sets acceptance criteria and checks them'] },
    { id: 'resources', fr: 'Ressources', en: 'Resources', go: 'budget', does: ['Constitue l’équipe, répartit la charge', 'Builds the team, balances the workload'] },
    { id: 'communication', fr: 'Communication', en: 'Communication', go: 'pm:comms', does: ['Informe la bonne personne au bon moment', 'Informs the right people at the right time'] },
    { id: 'risk', fr: 'Risques', en: 'Risk', go: 'pm:risks', does: ['Anticipe, évalue et traite les risques', 'Anticipates, scores and treats risks'] },
    { id: 'procurement', fr: 'Achats', en: 'Procurement', go: 'pm:procurement', does: ['Achète licences, services et matériel', 'Buys licences, services and hardware'] },
    { id: 'stakeholders', fr: 'Parties prenantes', en: 'Stakeholders', go: 'pm:stakeholders', does: ['Implique sponsor, client et utilisateurs', 'Engages sponsor, client and users'] }
  ];
  const lvl = (bad, warn) => (bad ? 'bad' : warn ? 'warn' : 'good');
  function areas(P, todayT, lang = 'fr') {
    const fr = lang === 'fr', pm = P.pm || empty(), h = C.health(P, todayT), b = C.burndown(P, todayT), B = BG().compute(P, todayT);
    const openRisks = pm.risks.filter(r => r.status !== 'closed'), worst = openRisks.reduce((m, r) => Math.max(m, r.p * r.i), 0);
    const openIssues = pm.issues.filter(x => x.status !== 'resolved'), critical = openIssues.filter(x => x.severity === 'critical' || x.severity === 'high').length;
    const pend = pm.changes.filter(x => x.status === 'pending').length;
    const qDone = pm.quality.filter(x => x.status === 'pass').length, qFail = pm.quality.filter(x => x.status === 'fail').length;
    const overload = B.staff.filter(r => r.load > 0.95).length;
    const tasksDone = P.tasks.filter(t => t.done).length;
    const keyPlayers = pm.stakeholders.filter(s => s.influence >= 4 && s.interest >= 4).length;
    const procLeft = pm.procurement.filter(x => x.status !== 'received');
    const procLate = procLeft.filter(x => x.status === 'planned' && x.due && C.parseDate(x.due) < C.statusTime(P, todayT)).length;
    const eur = v => new Intl.NumberFormat(fr ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    const T = (a, e) => (fr ? a : e);
    const m = {
      integration: { status: lvl(critical > 0, pend > 0 || !pm.charter.approved), value: pend ? `${pend} ${T('changement(s) à arbitrer', 'change(s) to decide')}` : T(pm.charter.approved ? 'Charte validée' : 'Charte à valider', pm.charter.approved ? 'Charter approved' : 'Charter to approve'), detail: `${pm.decisions.length} ${T('décisions', 'decisions')} · ${openIssues.length} ${T('problèmes ouverts', 'open issues')}` },
      scope: { status: lvl(false, pend > 0), value: `${tasksDone}/${P.tasks.length} ${T('tâches terminées', 'tasks done')}`, detail: `${b.total} ${T('points', 'points')} · ${P.milestones.length} ${T('jalons', 'milestones')}` },
      schedule: { status: h.status === 'on' ? 'good' : h.status === 'risk' ? 'warn' : 'bad', value: `SPI ${h.spi.toFixed(2)}`, detail: b.forecast !== null ? `${T('Fin prévue', 'Forecast')} ${C.fmt(b.forecast)}` : T('Pas encore de vélocité', 'No velocity yet') },
      cost: { status: lvl(B.plannedValue > 0 && B.earnedValue / B.plannedValue < 0.8, B.plannedValue > 0 && B.earnedValue / B.plannedValue < 0.95), value: eur(B.total), detail: `${T('Valeur acquise', 'Earned value')} ${eur(B.earnedValue)}` },
      quality: { status: lvl(qFail > 0, pm.quality.length > 0 && qDone === 0 && h.pctPlanned > 0.6), value: `${qDone}/${pm.quality.length} ${T('critères validés', 'criteria passed')}`, detail: qFail ? `${qFail} ${T('en échec', 'failed')}` : T('Aucun échec', 'No failures') },
      resources: { status: lvl(false, overload > 0), value: `${B.people} ${T('personnes', 'people')}`, detail: overload ? `${overload} ${T('rôle(s) surchargé(s)', 'overloaded role(s)')}` : `${B.personDays} ${T('jours-homme', 'person-days')}` },
      communication: { status: lvl(false, pm.comms.length === 0), value: `${pm.comms.length} ${T('rituels', 'rituals')}`, detail: `${pm.meetings.length} ${T('comptes rendus', 'meeting notes')}` },
      risk: { status: lvl(worst >= 15, worst >= 10), value: `${openRisks.length} ${T('risques ouverts', 'open risks')}`, detail: `${T('Score max', 'Top score')} ${worst}/25` },
      procurement: { status: lvl(procLate > 0, false), value: eur(pm.procurement.reduce((a, x) => a + x.amount, 0)), detail: procLate ? `${procLate} ${T('achat(s) à commander, échéance passée', 'purchase(s) overdue to order')}` : `${procLeft.length} ${T('achats en cours', 'purchases open')}` },
      stakeholders: { status: lvl(false, pm.stakeholders.length === 0), value: `${pm.stakeholders.length} ${T('parties prenantes', 'stakeholders')}`, detail: `${keyPlayers} ${T('acteurs clés', 'key players')}` }
    };
    return AREAS.map(a => ({ ...a, name: fr ? a.fr : a.en, does: a.does[fr ? 0 : 1], ...m[a.id] }));
  }

  /* ---- weekly status report, written from the live data ---- */
  function statusReport(P, todayT, lang = 'fr') {
    const fr = lang === 'fr', T = (a, e) => (fr ? a : e), pm = P.pm || empty(), now = C.statusTime(P, todayT);
    const h = C.health(P, todayT), b = C.burndown(P, todayT), B = BG().compute(P, todayT);
    const d = t => new Date(t).toLocaleDateString(fr ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    const weekAgo = C.addDays(now, -7), nextWeek = C.addDays(now, 7);
    const done = P.tasks.filter(t => t.done && C.parseDate(t.done) > weekAgo), next = P.tasks.filter(t => !t.done && C.parseDate(t.start) <= nextWeek && C.parseDate(t.end) >= now);
    const nm = o => (fr ? o.fr : o.en) || o.fr || o.en;
    const risks = pm.risks.filter(r => r.status !== 'closed').sort((a, b) => b.p * b.i - a.p * a.i).slice(0, 3);
    const word = { on: T('dans les temps', 'on track'), risk: T('à risque', 'at risk'), late: T('en retard', 'late') }[h.status];
    const eur = v => new Intl.NumberFormat(fr ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    return [
      `${T('Rapport d’avancement', 'Status report')} — ${P.name} — ${d(now)}`, '',
      `${T('Météo', 'Health')} : ${word.toUpperCase()} · SPI ${h.spi.toFixed(2)} · ${Math.round(h.pctEarned * 100)} % ${T('réalisé', 'done')} (${Math.round(h.pctPlanned * 100)} % ${T('prévu', 'planned')})`,
      `${T('Fin prévue', 'Forecast finish')} : ${b.forecast !== null ? d(b.forecast) : '—'} (${T('planifiée', 'planned')} ${d(C.parseDate(P.end))}) · ${T('Budget', 'Budget')} ${eur(B.total)}`, '',
      `${T('Terminé cette semaine', 'Done this week')} :`, ...(done.length ? done.map(t => `  • ${t.id} ${nm(t)}`) : [`  • ${T('Aucune tâche clôturée', 'No task closed')}`]), '',
      `${T('Prévu la semaine prochaine', 'Planned next week')} :`, ...(next.length ? next.slice(0, 8).map(t => `  • ${t.id} ${nm(t)} (${t.progress} %)`) : [`  • —`]), '',
      `${T('Principaux risques', 'Top risks')} :`, ...(risks.length ? risks.map(r => `  • ${r.title} — ${r.p}×${r.i}=${r.p * r.i} — ${r.response}`) : [`  • —`]), '',
      `${T('Décisions attendues', 'Decisions needed')} :`, ...(pm.changes.filter(c => c.status === 'pending').map(c => `  • ${c.title} (${c.impactDays >= 0 ? '+' : ''}${c.impactDays} ${T('j', 'd')}, ${eur(c.impactCost)})`).concat(pm.issues.filter(i => i.status !== 'resolved' && ['high', 'critical'].includes(i.severity)).map(i => `  • ${i.title}`)).slice(0, 6)),
      ...(pm.changes.some(c => c.status === 'pending') || pm.issues.some(i => i.status !== 'resolved' && ['high', 'critical'].includes(i.severity)) ? [] : [`  • ${T('Aucune', 'None')}`])
    ].join('\n');
  }


  /* ---- labels (FR / EN) for the interface and the documents ---- */
  const LBL = {
    fr: {
      charter: ['Charte projet', 'Pourquoi le projet existe, qui le porte et à quoi on reconnaît le succès.'],
      stakeholders: ['Parties prenantes', 'Qui est concerné, quelle influence, quel intérêt — et comment s’en occuper.'],
      raci: ['Matrice RACI', 'Pour chaque livrable : qui Réalise, qui est Approbateur (un seul), qui est Consulté, qui est Informé.'],
      risks: ['Registre des risques', 'Ce qui pourrait mal tourner, sa probabilité × son impact, et la parade prévue.'],
      comms: ['Plan de communication', 'Qui reçoit quelle information, à quel rythme et par quel canal.'],
      quality: ['Qualité et recette', 'Les critères d’acceptation de chaque livrable et leur résultat.'],
      procurement: ['Achats', 'Licences, services et matériel à commander, avec montant et échéance.'],
      issues: ['Problèmes', 'Ce qui bloque aujourd’hui (un risque qui s’est produit) et qui le règle.'],
      decisions: ['Décisions', 'Les décisions prises, par qui et pourquoi, pour ne pas y revenir.'],
      changes: ['Demandes de changement', 'Toute modification du périmètre, chiffrée en jours et en euros, puis acceptée ou refusée.'],
      meetings: ['Réunions', 'Comptes rendus et actions décidées.'],
      lessons: ['Retours d’expérience', 'Ce qu’on refera, ce qu’on évitera au prochain projet.'],
      report: ['Rapport hebdomadaire', 'Rédigé automatiquement à partir des données du projet, prêt à envoyer au client.'],
      col: { name: 'Nom', role: 'Rôle', influence: 'Influence', interest: 'Intérêt', strategy: 'Stratégie', contact: 'Contact', title: 'Intitulé', p: 'Proba.', i: 'Impact', score: 'Score',
        owner: 'Responsable', response: 'Réponse prévue', status: 'Statut', severity: 'Gravité', opened: 'Ouvert le', due: 'Échéance', date: 'Date', decision: 'Décision', by: 'Par',
        rationale: 'Justification', requestedBy: 'Demandé par', impactDays: 'Impact (jours)', impactCost: 'Impact (€)', what: 'Information', audience: 'Destinataires', freq: 'Fréquence',
        channel: 'Canal', deliverable: 'Livrable', criteria: 'Critère d’acceptation', method: 'Vérification', item: 'Article', supplier: 'Fournisseur', amount: 'Montant (€)',
        type: 'Type', notes: 'Compte rendu', actions: 'Actions', category: 'Catégorie', lesson: 'Leçon', action: 'À faire la prochaine fois',
        purpose: 'Raison d’être et objectif', sponsor: 'Sponsor', manager: 'Chef de projet', success: 'Critères de succès', approved: 'Charte validée par le sponsor', approvedOn: 'Validée le' },
      en_: {
        manage: 'Gérer de près', satisfy: 'Satisfaire', inform: 'Tenir informé', monitor: 'Surveiller', avoid: 'Éviter', mitigate: 'Réduire', transfer: 'Transférer', accept: 'Accepter',
        open: 'Ouvert', watch: 'Sous surveillance', closed: 'Clos', low: 'Faible', medium: 'Moyenne', high: 'Élevée', critical: 'Critique', progress: 'En cours', resolved: 'Résolu',
        pending: 'En attente', approved: 'Accepté', rejected: 'Refusé', todo: 'À vérifier', pass: 'Validé', fail: 'En échec', planned: 'À commander', ordered: 'Commandé', received: 'Reçu',
        daily: 'Quotidien', weekly: 'Hebdomadaire', biweekly: 'Toutes les 2 semaines', monthly: 'Mensuel', milestone: 'À chaque jalon',
        kickoff: 'Lancement', standup: 'Stand-up', review: 'Revue', steering: 'Comité de pilotage', retro: 'Rétrospective', client: 'Point client',
        planning: 'Planification', team: 'Équipe', technical: 'Technique', risk: 'Risques', process: 'Méthode'
      },
      raciLegend: 'R = réalise · A = approuve (un seul par ligne) · C = consulté · I = informé', raciNoA: 'sans approbateur', raciManyA: 'plusieurs approbateurs', raciNoR: 'personne ne réalise',
      grid: ['Satisfaire', 'Gérer de près', 'Surveiller', 'Tenir informé'], heat: 'Carte de chaleur des risques', probability: 'Probabilité', impact: 'Impact',
      docH: 'Pilotage du projet', docLead: 'Registres tenus par le chef de projet, à jour à la date du document.', none: 'Aucun élément pour l’instant.'
    },
    en: {
      charter: ['Project charter', 'Why the project exists, who sponsors it and what success looks like.'],
      stakeholders: ['Stakeholders', 'Who is involved, how much influence and interest — and how to handle them.'],
      raci: ['RACI matrix', 'For each deliverable: who is Responsible, who Approves (only one), who is Consulted, who is Informed.'],
      risks: ['Risk register', 'What could go wrong, probability × impact, and the planned response.'],
      comms: ['Communication plan', 'Who gets which information, how often and through which channel.'],
      quality: ['Quality and acceptance', 'Acceptance criteria for each deliverable and their result.'],
      procurement: ['Procurement', 'Licences, services and hardware to buy, with amount and due date.'],
      issues: ['Issues', 'What blocks the project today (a risk that happened) and who fixes it.'],
      decisions: ['Decisions', 'Decisions taken, by whom and why, so they are not reopened.'],
      changes: ['Change requests', 'Any scope change, costed in days and euros, then approved or rejected.'],
      meetings: ['Meetings', 'Minutes and agreed actions.'],
      lessons: ['Lessons learned', 'What to repeat and what to avoid on the next project.'],
      report: ['Weekly status report', 'Written automatically from the project data, ready to send to the client.'],
      col: { name: 'Name', role: 'Role', influence: 'Influence', interest: 'Interest', strategy: 'Strategy', contact: 'Contact', title: 'Title', p: 'Prob.', i: 'Impact', score: 'Score',
        owner: 'Owner', response: 'Planned response', status: 'Status', severity: 'Severity', opened: 'Opened', due: 'Due', date: 'Date', decision: 'Decision', by: 'By',
        rationale: 'Rationale', requestedBy: 'Requested by', impactDays: 'Impact (days)', impactCost: 'Impact (€)', what: 'Information', audience: 'Audience', freq: 'Frequency',
        channel: 'Channel', deliverable: 'Deliverable', criteria: 'Acceptance criterion', method: 'Check', item: 'Item', supplier: 'Supplier', amount: 'Amount (€)',
        type: 'Type', notes: 'Minutes', actions: 'Actions', category: 'Category', lesson: 'Lesson', action: 'Next time',
        purpose: 'Purpose and objective', sponsor: 'Sponsor', manager: 'Project manager', success: 'Success criteria', approved: 'Charter approved by the sponsor', approvedOn: 'Approved on' },
      en_: {
        manage: 'Manage closely', satisfy: 'Keep satisfied', inform: 'Keep informed', monitor: 'Monitor', avoid: 'Avoid', mitigate: 'Mitigate', transfer: 'Transfer', accept: 'Accept',
        open: 'Open', watch: 'Watching', closed: 'Closed', low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical', progress: 'In progress', resolved: 'Resolved',
        pending: 'Pending', approved: 'Approved', rejected: 'Rejected', todo: 'To check', pass: 'Passed', fail: 'Failed', planned: 'To order', ordered: 'Ordered', received: 'Received',
        daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', milestone: 'At each milestone',
        kickoff: 'Kick-off', standup: 'Stand-up', review: 'Review', steering: 'Steering committee', retro: 'Retrospective', client: 'Client meeting',
        planning: 'Planning', team: 'Team', technical: 'Technical', risk: 'Risk', process: 'Process'
      },
      raciLegend: 'R = responsible · A = approves (one per row) · C = consulted · I = informed', raciNoA: 'no approver', raciManyA: 'several approvers', raciNoR: 'nobody responsible',
      grid: ['Keep satisfied', 'Manage closely', 'Monitor', 'Keep informed'], heat: 'Risk heat map', probability: 'Probability', impact: 'Impact',
      docH: 'Project management', docLead: 'Registers kept by the project manager, up to date on the document date.', none: 'Nothing yet.'
    }
  };
  const SECTIONS = ['charter', 'stakeholders', 'raci', 'risks', 'comms', 'quality', 'procurement', 'issues', 'decisions', 'changes', 'meetings', 'lessons', 'report'];

  /* RACI checks: exactly one A and at least one R per deliverable */
  function raciIssues(raci, lang = 'fr') {
    const L = LBL[lang];
    return raci.rows.map(r => {
      const v = raci.roles.map(ro => raci.cells[`${r.id}|${ro}`]);
      const a = v.filter(x => x === 'A').length, rr = v.filter(x => x === 'R').length;
      return { id: r.id, msg: [a === 0 ? L.raciNoA : a > 1 ? L.raciManyA : '', rr === 0 ? L.raciNoR : ''].filter(Boolean).join(' · ') };
    }).filter(x => x.msg);
  }

  /* ---- document sections: rows ready for DocGen tables ---- */
  function docTables(P, kind, lang = 'fr') {
    const pm = P.pm || empty(), L = LBL[lang], c = L.col, e = v => L.en_[v] || v, out = [];
    const dfmt = v => v ? new Date(C.parseDate(v)).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '—';
    const eur = v => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    const add = (key, rows, text) => out.push({ title: L[key][0], lead: L[key][1], rows: rows && rows.length > 1 ? rows : null, text });
    const ch = pm.charter;
    const want = { needs: ['charter', 'stakeholders', 'raci', 'comms', 'quality'], technical: ['raci', 'risks', 'quality', 'procurement'], report: ['charter', 'risks', 'issues', 'changes', 'decisions', 'quality', 'lessons'] }[kind] || [];
    for (const key of want) {
      if (key === 'charter') add(key, [[lang === 'fr' ? 'Rubrique' : 'Item', lang === 'fr' ? 'Contenu' : 'Content'], [c.purpose, ch.purpose || '—'], [c.sponsor, ch.sponsor || '—'], [c.manager, ch.manager || '—'], [c.success, ch.success || '—'], [c.approved, ch.approved ? `✓ ${dfmt(ch.approvedOn)}` : '—']]);
      else if (key === 'stakeholders') add(key, [[c.name, c.role, c.influence, c.interest, c.strategy], ...pm.stakeholders.map(x => [x.name, x.role, `${x.influence}/5`, `${x.interest}/5`, e(x.strategy)])]);
      else if (key === 'raci') add(key, [[lang === 'fr' ? 'Livrable' : 'Deliverable', ...pm.raci.roles], ...pm.raci.rows.map(r => [r.item, ...pm.raci.roles.map(ro => pm.raci.cells[`${r.id}|${ro}`] || '·')])], L.raciLegend);
      else if (key === 'risks') add(key, [[c.title, c.p, c.i, c.score, c.strategy, c.response, c.status], ...[...pm.risks].sort((a, b) => b.p * b.i - a.p * a.i).map(x => [x.title, String(x.p), String(x.i), String(x.p * x.i), e(x.strategy), x.response, e(x.status)])]);
      else if (key === 'comms') add(key, [[c.what, c.audience, c.freq, c.channel, c.owner], ...pm.comms.map(x => [x.what, x.audience, e(x.freq), x.channel, x.owner])]);
      else if (key === 'quality') add(key, [[c.deliverable, c.criteria, c.method, c.status], ...pm.quality.map(x => [x.deliverable, x.criteria, x.method, e(x.status)])]);
      else if (key === 'procurement') add(key, [[c.item, c.supplier, c.amount, c.due, c.status], ...pm.procurement.map(x => [x.item, x.supplier || '—', eur(x.amount), dfmt(x.due), e(x.status)])]);
      else if (key === 'issues') add(key, [[c.title, c.severity, c.owner, c.due, c.status], ...pm.issues.map(x => [x.title, e(x.severity), x.owner, dfmt(x.due), e(x.status)])]);
      else if (key === 'changes') add(key, [[c.title, c.requestedBy, c.impactDays, c.impactCost, c.status], ...pm.changes.map(x => [x.title, x.requestedBy, String(x.impactDays), eur(x.impactCost), e(x.status)])]);
      else if (key === 'decisions') add(key, [[c.date, c.decision, c.by, c.rationale], ...pm.decisions.map(x => [dfmt(x.date), x.decision, x.by, x.rationale])]);
      else if (key === 'lessons') add(key, [[c.date, c.category, c.lesson, c.action], ...pm.lessons.map(x => [dfmt(x.date), e(x.category), x.lesson, x.action])]);
    }
    return { title: L.docH, lead: L.docLead, none: L.none, sections: out };
  }

  return { REG, E, RACI, LBL, SECTIONS, clean, empty, isEmpty, generate, AREAS, areas, statusReport, raciIssues, docTables };
})();
if (typeof module !== 'undefined') module.exports = PM;
