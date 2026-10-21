/* Project assistant: plain-language description → full project (phases, tasks, dates, dependencies,
   milestones) + all document content. Pure functions; KB holds the knowledge per project type. */
const Generator = (() => {
  const C = (typeof Core !== 'undefined') ? Core : require('./core.js');
  const K = (typeof KB !== 'undefined') ? KB : require('./kb.js');
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9+\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  const PHASES = [['P1', 'Cadrage', 'Initiation', '#4f6bed'], ['P2', 'Conception', 'Design', '#0f9d8a'], ['P3', 'Réalisation', 'Build', '#d9811e'],
    ['P4', 'Tests et recette', 'Testing and acceptance', '#c2417a'], ['P5', 'Mise en service', 'Go-live', '#7a5af5'], ['P6', 'Clôture', 'Closure', '#5f7182']];
  const SIZES = { small: { f: 0.7, prios: ['M'], lanes: 2 }, medium: { f: 1, prios: ['M', 'S'], lanes: 2 }, large: { f: 1.35, prios: ['M', 'S', 'C'], lanes: 2 } };

  /* ---- detection: weighted keyword match on the normalised text ---- */
  function detect(text) {
    const t = ' ' + norm(text) + ' ';
    const scores = K.filter(k => k.kw.length).map(k => {
      let s = 0;
      k.kw.forEach(w => { const n = norm(w); if (n && t.includes(' ' + n + ' ') || (n.length > 5 && t.includes(n))) s += 1 + n.split(' ').length; });
      return { id: k.id, score: s };
    }).sort((a, b) => b.score - a.score);
    const best = scores[0];
    return { id: best && best.score > 0 ? best.id : 'software', scores };
  }
  const type = id => K.find(k => k.id === id) || K.find(k => k.id === 'software');

  /* ---- working-day calendar ---- */
  const nextWork = t => { let x = t; while (C.isWeekend(x)) x = C.addDays(x, 1); return x; };
  const endAfter = (start, days) => { let x = nextWork(start), left = Math.max(1, days) - 1; while (left > 0) { x = C.addDays(x, 1); if (!C.isWeekend(x)) left--; } return x; };
  const nextMonday = t => { let x = C.addDays(t, 1); while (new Date(x).getUTCDay() !== 1) x = C.addDays(x, 1); return x; };

  /* ---- cleaned project name from the description ---- */
  function projectName(text, tp, lang) {
    let s = String(text || '').trim().replace(/\s+/g, ' ');
    const lead = /^(je (veux|voudrais|souhaite)|nous (voulons|souhaitons)|i (want|would like|need)( to)?|we (want|need)( to)?|j['’ ]ai besoin d['’ ]?(une?)?|to|creer|créer|create|build|develop|développer|developper|faire|make|realiser|réaliser|un|une|des|le|la|les|a|an|the)\s+/i;
    for (let i = 0; i < 5 && lead.test(s); i++) s = s.replace(lead, '');
    if (!s) return lang === 'fr' ? tp.fr : tp.en;
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s.length > 70 ? s.slice(0, 67).replace(/\s+\S*$/, '') + '…' : s.replace(/[.!]+$/, '');
  }

  /* ---- build the schedule ---- */
  function build({ description, client = '', start, size = 'medium', typeId, lang = 'fr', author = '', custom = null }) {
    const det = detect(description), base = type((custom && custom.typeId) || typeId || det.id), Z = SIZES[size] || SIZES.medium;
    const tp = custom && custom.features ? { ...base, features: custom.features } : base;
    const s0 = nextWork(C.parseDate(start) ?? nextMonday(Date.now() - Date.now() % C.DAY));
    const dur = d => Math.max(1, Math.round(d * Z.f)), pts = p => Math.max(1, Math.round(p * (size === 'large' ? 1.3 : size === 'small' ? 0.8 : 1)));
    const tasks = []; let n = 0;
    const add = (phase, fr, en, owner, days, points, deps) => {
      const ds = deps.map(id => tasks.find(t => t.id === id));
      const st = ds.length ? nextWork(C.addDays(Math.max(...ds.map(t => C.parseDate(t.end))), 1)) : s0;
      const t = { id: `T${++n}`, phase, fr, en, owner, start: C.fmt(st), end: C.fmt(endAfter(st, days)), points, progress: 0, done: '', deps };
      tasks.push(t); return t.id;
    };
    // P1 initiation
    const kick = add('P1', 'Réunion de lancement et recueil des besoins', 'Kick-off and needs gathering', 'PM', dur(3), pts(3), []);
    const spec = add('P1', 'Rédaction et validation du cahier des charges', 'Requirements specification and sign-off', 'PM', dur(4), pts(5), [kick]);
    add('P1', 'Planning, budget et registre des risques', 'Schedule, budget and risk register', 'PM', dur(2), pts(2), [kick]);
    // P2 design (type may override)
    const design = (tp.design || [['Architecture technique', 'Technical architecture', 'ARCH', 4, 5], ['Maquettes et parcours utilisateur', 'Mock-ups and user journeys', 'UX', 6, 5]])
      .map(([fr, en, o, d, p]) => add('P2', fr, en, o, dur(d), pts(p), [spec]));
    const dataModel = tp.design ? null : add('P2', 'Modèle de données', 'Data model', 'ARCH', dur(3), pts(3), [design[0]]);
    const designEnd = dataModel ? [...design, dataModel] : design;
    // P3 build: environment, then features on parallel lanes
    const env = add('P3', 'Environnement de développement et CI/CD', 'Development environment and CI/CD', 'OPS', dur(2), pts(2), [design[0]]);
    const feats = tp.features.filter(f => Z.prios.includes(f[6]));
    const lanes = Array.from({ length: Z.lanes }, () => null), featIds = [];
    feats.forEach((f, i) => {
      const lane = i % Z.lanes, prev = lanes[lane];
      const id = add('P3', f[0], f[1], `DEV${lane + 1}`, dur(f[4]), pts(f[5]), prev ? [prev] : [env, ...designEnd.filter(d => d !== design[0])]);
      lanes[lane] = id; featIds.push(id);
    });
    const buildEnd = lanes.filter(Boolean);
    // P4 tests
    let accept;
    if (tp.test) {
      const ids = tp.test.map(([fr, en, o, d, p], i) => add('P4', fr, en, o, dur(d), pts(p), i === 0 ? buildEnd : [`T${n}`]));
      accept = ids.at(-1);
    } else {
      const unit = add('P4', 'Tests unitaires et d’intégration', 'Unit and integration tests', 'QA', dur(5), pts(5), buildEnd);
      const sec = add('P4', 'Tests de sécurité', 'Security testing', 'SEC', dur(4), pts(3), buildEnd);
      const uat = add('P4', 'Recette avec le client', 'Client acceptance testing', 'QA', dur(4), pts(3), [unit]);
      accept = add('P4', 'Corrections avant mise en ligne', 'Fixes before go-live', 'DEV1', dur(3), pts(3), [uat, sec]);
    }
    // P5 go-live, P6 closure
    const live = add('P5', tp.id === 'security' ? 'Restitution et remise du rapport d’audit' : 'Mise en production', tp.id === 'security' ? 'Debrief and audit report handover' : 'Production go-live', tp.id === 'security' ? 'SEC' : 'OPS', dur(2), pts(3), [accept]);
    const train = add('P5', 'Formation et guide utilisateur', 'Training and user guide', 'PM', dur(3), pts(2), [accept]);
    const close = add('P6', 'Bilan, rapport final et transfert', 'Final review, report and handover', 'PM', dur(3), pts(3), [live, train]);
    const endOf = ids => C.fmt(Math.max(...ids.map(id => C.parseDate(tasks.find(t => t.id === id).end))));
    const phaseEnd = p => endOf(tasks.filter(t => t.phase === p).map(t => t.id));
    const milestones = [
      ['M1', 'Cahier des charges validé', 'Requirements signed off', endOf([spec])],
      ['M2', 'Conception validée', 'Design approved', phaseEnd('P2')],
      ['M3', tp.id === 'security' ? 'Fin des tests techniques' : 'Version complète livrée (MVP)', tp.id === 'security' ? 'Technical testing complete' : 'Complete version delivered (MVP)', phaseEnd('P3')],
      ['M4', 'Recette validée', 'Acceptance passed', phaseEnd('P4')],
      ['M5', tp.id === 'security' ? 'Rapport remis' : 'Mise en ligne', tp.id === 'security' ? 'Report delivered' : 'Go-live', endOf([live])],
      ['M6', 'Clôture du projet', 'Project closure', endOf([close])]
    ].map(([id, fr, en, date]) => ({ id, fr, en, date }));
    const name = (custom && custom.name) || projectName(description, tp, lang);
    const project = {
      name, code: `${tp.code}-${new Date(s0).getUTCFullYear()}`, start: C.fmt(s0), end: endOf([close]), statusDate: '', workingDays: true,
      phases: PHASES.map(([id, fr, en, color]) => ({ id, fr, en, color })), milestones, tasks,
      budget: { contingency: 0.15, extras: (tp.costs || []).map(([fr, en, amount]) => ({ fr, en, amount })) },
      docs: { fr: docs({ description, client, author, lang: 'fr', tp, feats, tasks, milestones, name, size }),
              en: docs({ description, client, author, lang: 'en', tp, feats, tasks, milestones, name, size }) }
    };
    return { project, type: tp, detection: det };
  }

  /* ---- document text, in plain language for a non-technical client ---- */
  function docs({ description, client, author, lang, tp, feats, tasks, milestones, name, size }) {
    const fr = lang === 'fr', L = (a, b) => fr ? a : b, row = cells => cells.join(' | ');
    const d = s => new Date(C.parseDate(s)).toLocaleDateString(fr ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    const ms = id => milestones.find(m => m.id === id).date, weeks = Math.ceil((C.diffDays(C.parseDate(tasks[0].start), C.parseDate(ms('M6'))) + 1) / 7);
    const sizeW = { small: L('réduite (fonctions essentielles)', 'reduced (essential features)'), medium: L('standard', 'standard'), large: L('étendue (toutes les options)', 'extended (all options)') }[size];
    const later = tp.features.filter(f => !feats.includes(f));
    const o = {};
    o.author = author || L('Équipe projet', 'Project team');
    o.sponsor = client || L(tp.owner[0], tp.owner[1]);
    o.context = [
      L(`Demande du client : « ${String(description).trim()} ».`, `Client request: "${String(description).trim()}".`),
      L(`Ce projet est de type **${tp.fr}**. Il s’adresse aux ${tp.users[0].toLowerCase()} et sera porté par ${o.sponsor}.`, `This is a **${tp.en}** project. It serves ${tp.users[1].toLowerCase()} and is sponsored by ${o.sponsor}.`),
      L(`Ce document traduit la demande en besoins précis, propose une solution technique et un planning de ${weeks} semaines (portée ${sizeW}). Les termes techniques sont expliqués dans le lexique en fin de rapport.`,
        `This document turns the request into precise needs, proposes a technical solution and a ${weeks}-week schedule (${sizeW} scope). Technical terms are explained in the glossary at the end of the report.`)
    ].join('\n');
    o.objectives = [row(['#', L('Objectif', 'Objective'), L('Indicateur', 'Indicator'), L('Cible', 'Target')]),
      ...tp.objectives.map((x, i) => row([`O${i + 1}`, fr ? x[0] : x[1], fr ? x[2] : x[3], x[4]])),
      row([`O${tp.objectives.length + 1}`, L('Livrer à temps', 'Deliver on time'), L('Mise en service', 'Go-live'), d(ms('M5'))])].join('\n');
    o.scope = [L('## Inclus', '## Included'), ...feats.map(f => `- ${fr ? f[0] : f[1]}`),
      L('## Prévu pour une phase 2', '## Planned for a phase 2'), ...(later.length ? later.map(f => `- ${fr ? f[0] : f[1]}`) : [L('- Aucune fonction reportée', '- No feature postponed')]),
      L('## Exclu', '## Excluded'), ...tp.out.map(x => `- ${fr ? x[0] : x[1]}`)].join('\n');
    o.stakeholders = [row([L('Partie prenante', 'Stakeholder'), L('Rôle', 'Role'), L('Attente', 'Expectation')]),
      row([o.sponsor, L('Client / sponsor : valide les étapes', 'Client / sponsor: approves each stage'), L('Un résultat conforme, dans les délais', 'A compliant result, on time')]),
      row([fr ? tp.users[0] : tp.users[1], L('Utilisateurs finaux', 'End users'), L('Un outil simple et rapide', 'A simple, fast tool')]),
      row([L('Chef de projet', 'Project manager'), L('Pilote le planning et les risques', 'Runs schedule and risks'), L('Décisions rapides du client', 'Fast client decisions')]),
      row([L('Équipe technique', 'Technical team'), L('Conçoit, développe, teste', 'Designs, builds, tests'), L('Besoins clairs et stables', 'Clear, stable needs')])].join('\n');
    o.functional = [row(['ID', L('Ce que le système doit faire', 'What the system must do'), L('Explication simple', 'Plain explanation'), L('Priorité', 'Priority')]),
      ...feats.map((f, i) => row([`EF${i + 1}`, fr ? f[0] : f[1], fr ? f[2] : f[3], { M: L('Indispensable', 'Must'), S: L('Important', 'Should'), C: L('Optionnel', 'Could') }[f[6]]]))].join('\n');
    o.nonfunctional = [row(['ID', L('Catégorie', 'Category'), L('Exigence', 'Requirement')]),
      ...[['Performance', L('Pages affichées en moins de 2 secondes', 'Pages shown in under 2 seconds')],
        [L('Sécurité', 'Security'), L('Bonnes pratiques OWASP, données chiffrées en transit (HTTPS)', 'OWASP good practice, data encrypted in transit (HTTPS)')],
        [L('RGPD', 'GDPR'), L('Données personnelles minimales, hébergées en Europe, supprimables sur demande', 'Minimal personal data, hosted in Europe, erasable on request')],
        [L('Accessibilité', 'Accessibility'), L('Utilisable au clavier et lisible (WCAG 2.1 AA)', 'Keyboard-usable and readable (WCAG 2.1 AA)')],
        ...tp.nfr.map(x => [x[0], fr ? x[1] : x[2]])].map((x, i) => row([`ENF${i + 1}`, x[0], x[1]]))].join('\n');
    o.constraints = [
      `- ${L('Début', 'Start')} : ${d(tasks[0].start)} · ${L('mise en service', 'go-live')} : ${d(ms('M5'))} · ${L('clôture', 'closure')} : ${d(ms('M6'))}`,
      `- ${L(`Durée estimée : ${weeks} semaines, ${tasks.length} tâches, ${tasks.reduce((a, t) => a + t.points, 0)} points d’effort`, `Estimated duration: ${weeks} weeks, ${tasks.length} tasks, ${tasks.reduce((a, t) => a + t.points, 0)} effort points`)}`,
      `- ${L('Le client valide chaque jalon sous 5 jours ouvrés', 'The client approves each milestone within 5 working days')}`,
      `- ${L('Contenus (textes, images, données) fournis par le client avant la fin de la conception', 'Content (texts, images, data) supplied by the client before the end of design')}`,
      `- ${L('Budget : calculé à partir de l’équipe nécessaire et des taux journaliers (voir « Budget et ressources »), marge pour imprévus incluse', 'Budget: computed from the required team and day rates (see “Budget and resources”), contingency included')}`
    ].join('\n');
    o.architecture = [L(`La solution est découpée en briques indépendantes, chacune remplaçable sans tout refaire :`, `The solution is split into independent building blocks, each replaceable without redoing everything:`),
      row([L('Brique', 'Component'), L('Rôle', 'Role')]), ...tp.comps.map(c => row([c[0], fr ? c[1] : c[2]]))].join('\n');
    o.stack = [row([L('Couche', 'Layer'), L('Choix', 'Choice'), L('Pourquoi', 'Why')]), ...tp.stack.map(s => row([s[0], s[1], fr ? s[2] : s[3]]))].join('\n');
    o.security = [row([L('Menace', 'Threat'), L('Protection', 'Control')]),
      ...tp.threats.map(x => row([fr ? x[0] : x[1], fr ? x[2] : x[3]])),
      row([L('Injection de code et XSS', 'Code injection and XSS'), L('Requêtes paramétrées, échappement, en-têtes CSP', 'Parameterised queries, escaping, CSP headers')]),
      row([L('Secrets exposés', 'Exposed secrets'), L('Variables d’environnement, aucun mot de passe dans le code', 'Environment variables, no password in code')]),
      row([L('Perte de données', 'Data loss'), L('Sauvegarde quotidienne testée', 'Tested daily backup')])].join('\n');
    o.testing = [row([L('Niveau', 'Level'), L('Ce qu’on vérifie', 'What is checked'), L('Critère de sortie', 'Exit criterion')]),
      row([L('Tests unitaires', 'Unit tests'), L('Chaque fonction isolément', 'Each function on its own'), L('Couverture ≥ 70 %', 'Coverage ≥ 70 %')]),
      row([L('Tests d’intégration', 'Integration tests'), L('Les briques ensemble', 'Components together'), L('Parcours principaux sans erreur', 'Main journeys error-free')]),
      row([L('Tests de sécurité', 'Security tests'), L('Failles connues (OWASP)', 'Known flaws (OWASP)'), L('0 faille critique', '0 critical flaw')]),
      row([L('Recette client', 'Client acceptance'), L('Le client teste les fonctions EF1–EF' + feats.length, 'The client tests features EF1–EF' + feats.length), L('Toutes les exigences indispensables validées', 'All must-have requirements approved')])].join('\n');
    o.deployment = [
      `- ${L('Chaque modification passe par des tests automatiques avant d’être mise en ligne (CI/CD)', 'Every change goes through automatic tests before going live (CI/CD)')}`,
      `- ${L('Environnement de test pour le client, puis production', 'Test environment for the client, then production')}`,
      `- ${L('Retour à la version précédente en 1 clic en cas de problème', 'One-click rollback to the previous version if needed')}`,
      `- ${L('Surveillance : disponibilité, erreurs et temps de réponse, avec alertes', 'Monitoring: availability, errors and response times, with alerts')}`,
      `- ${L('Formation et guide utilisateur remis le', 'Training and user guide delivered on')} ${d(ms('M5'))}`
    ].join('\n');
    const risks = [...tp.risks, ['Retard sur le planning', 'Schedule slippage', 3, 3, 'Suivi du burndown chaque semaine, alerte si SPI < 0,9', 'Weekly burndown review, alert if SPI < 0.9'],
      ['Changement de besoin en cours de projet', 'Requirement change mid-project', 3, 3, 'Toute demande nouvelle passe en phase 2 ou fait l’objet d’un avenant', 'New requests go to phase 2 or a change order']]
      .map(r => ({ r, s: r[2] * r[3] })).sort((a, b) => b.s - a.s);
    o.risks = [row(['ID', L('Risque', 'Risk'), L('Probabilité (1-5)', 'Probability (1-5)'), L('Impact (1-5)', 'Impact (1-5)'), 'Score', L('Réponse prévue', 'Planned response')]),
      ...risks.map(({ r, s }, i) => row([`R${i + 1}`, fr ? r[0] : r[1], r[2], r[3], s, fr ? r[4] : r[5]]))].join('\n');
    o.conclusion = [L('## Prochaines étapes', '## Next steps'),
      `- ${L('Valider ce cahier des charges avant le', 'Approve this specification before')} ${d(ms('M1'))} (M1)`,
      `- ${L('Valider les maquettes et l’architecture avant le', 'Approve mock-ups and architecture before')} ${d(ms('M2'))} (M2)`,
      `- ${L('Recevoir la version complète le', 'Receive the complete version on')} ${d(ms('M3'))} (M3)`,
      `- ${L('Mise en service prévue le', 'Go-live planned on')} ${d(ms('M5'))} (M5)`,
      L('## Lexique pour le client', '## Glossary for the client'),
      row([L('Terme', 'Term'), L('Signification', 'Meaning')]),
      ...[['MVP', L('Première version complète et utilisable du produit', 'First complete, usable version of the product')],
        ['API', L('Porte d’entrée qui permet à deux logiciels de s’échanger des données', 'Doorway that lets two pieces of software exchange data')],
        ['Front-end / Back-end', L('Ce que l’utilisateur voit / ce qui tourne sur le serveur', 'What the user sees / what runs on the server')],
        ['CI/CD', L('Chaîne automatique qui teste puis met en ligne chaque modification', 'Automatic chain that tests then publishes each change')],
        [L('Recette', 'Acceptance testing'), L('Tests faits par le client pour valider le produit', 'Tests by the client to approve the product')],
        [L('Jalon', 'Milestone'), L('Date clé où le client valide une étape', 'Key date when the client approves a stage')],
        [L('Point d’effort', 'Effort point'), L('Unité de mesure du travail d’une tâche', 'Unit measuring the work in a task')],
        ['Burndown', L('Courbe du travail restant, qui doit descendre jusqu’à zéro', 'Chart of remaining work, which should fall to zero')],
        ['SPI', L('Indice de respect du planning : 1 = à l’heure, moins de 1 = en retard', 'Schedule index: 1 = on time, below 1 = late')],
        [L('RGPD', 'GDPR'), L('Loi européenne sur la protection des données personnelles', 'EU law protecting personal data')],
        ['OWASP', L('Liste de référence des failles de sécurité web', 'Reference list of web security flaws')]].map(r => row(r))].join('\n');
    return o;
  }
  /* ---- AI answer (untrusted) → validated custom plan, or null ---- */
  function fromAI(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const str = (v, m) => typeof v === 'string' ? v.replace(/[|\n\r<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, m) : '';
    const int = (v, lo, hi, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
    const feats = (Array.isArray(raw.features) ? raw.features : []).slice(0, 12).map(f => f && [str(f.fr, 90), str(f.en, 90) || str(f.fr, 90), str(f.descFr, 260), str(f.descEn, 260) || str(f.descFr, 260),
      int(f.days, 1, 15, 4), int(f.points, 1, 21, 5), ['M', 'S', 'C'].includes(f.priority) ? f.priority : 'S']).filter(f => f && f[0] && f[2]);
    if (feats.length < 3) return null;
    if (!feats.some(f => f[6] === 'M')) feats.slice(0, 3).forEach(f => { f[6] = 'M'; });
    return { typeId: K.some(k => k.id === raw.typeId) ? raw.typeId : null, name: str(raw.name, 80) || null, features: feats };
  }
  function aiPrompt(description, lang) {
    return [`You plan IT projects for clients who are not technical. The client wrote: "${String(description).slice(0, 600)}".`,
      `Choose the closest typeId among: ${K.map(k => `${k.id} (${k.en})`).join(', ')}.`,
      `Return only JSON: {"typeId": string, "name": short project name in ${lang === 'fr' ? 'French' : 'English'}, "features": [{"fr": feature name in French, "en": feature name in English, "descFr": one plain-language sentence in French a non-technical client understands, "descEn": same in English, "days": working days 1-15, "points": effort 1-13, "priority": "M"|"S"|"C"}]}.`,
      'Give 6 to 10 features specific to this client project (what the product must do for its users), most important first, at least 4 with priority "M". No jargon in the descriptions. Do not use the | character.'].join('\n');
  }
  return { detect, build, fromAI, aiPrompt, types: () => K.map(k => ({ id: k.id, fr: k.fr, en: k.en })), norm };
})();
if (typeof module !== 'undefined') module.exports = Generator;
