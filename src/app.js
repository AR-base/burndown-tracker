(() => {
'use strict';
const C = Core, $ = id => document.getElementById(id);
const STORE = 'burndown-tracker-v1';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const I18N = {
  fr: {
    eyebrow: 'Suivi de projet', tabBurndown: 'Burndown', tabGantt: 'Gantt', tabTasks: 'Tâches', tabProject: 'Projet',
    on: 'Dans les temps', risk: 'À risque', late: 'En retard',
    kRemaining: 'Reste à faire', kDone: 'pts terminés sur', kEarned: 'Avancement acquis', kPlanned: 'prévu', kVelocity: 'Vélocité',
    kRequired: 'requise', kSpi: 'SPI (délai)', kSpiS: 'valeur acquise ÷ planifiée', kForecast: 'Fin prévue', kPlannedEnd: 'fin planifiée', kCritical: 'Chemin critique', kTasks: 'tâches',
    perWeek: 'pts/sem', none: '—', noVelocity: 'pas encore de vélocité',
    bdTitle: 'Burndown (points restants)', ideal: 'Idéal', actual: 'Réel', forecastL: 'Projection', today: "Aujourd'hui", milestone: 'Jalon',
    focus: 'À surveiller', lateTasks: 'En retard', inProgress: 'En cours', nextUp: 'À venir (14 jours)', nothing: 'Rien à signaler',
    summary: 'Gantt synthétique', master: 'Gantt maître', showDeps: 'Dépendances', showCrit: 'Chemin critique',
    milestones: 'Jalons', phase: 'Phase', owner: 'Responsable', points: 'Points', nameFr: 'Nom (FR)', nameEn: 'Nom (EN)',
    start: 'Début', end: 'Fin', progress: 'Avancement', doneDate: 'Terminée le', deps: 'Dépend de (IDs séparés par des virgules)',
    addTask: 'Ajouter une tâche', editTask: 'Modifier', saveTask: 'Enregistrer la tâche', addBtn: 'Ajouter', cancel: 'Annuler',
    edHint: 'Fin-à-début : une tâche commence après ses prédécesseurs.', taskList: 'Tâches', status: 'Statut', task: 'Tâche',
    sDone: 'Terminée', sLate: 'En retard', sInprog: 'En cours', sTodo: 'À faire', markDone: 'Terminer', edit: 'Modifier', del: 'Supprimer', confirmDel: 'Confirmer ?',
    projSettings: 'Paramètres du projet', savedLocal: 'Enregistré dans ce navigateur', projName: 'Nom du projet', projCode: 'Code',
    statusDate: "Date d'état (vide = aujourd'hui)", workingDays: 'Ligne idéale sur jours ouvrés (week-ends exclus)', save: 'Enregistrer',
    phases: 'Phases', addPhase: 'Ajouter une phase', addMs: 'Ajouter un jalon', remove: 'Retirer',
    dataTitle: 'Importer un Gantt / exporter', dataHint: "Chargez n'importe quel projet : collez ou choisissez un Gantt en CSV (Excel, Google Sheets, MS Project, GanttProject — séparateur ; ou , et dates JJ/MM/AAAA acceptés), un Gantt Mermaid, ou un JSON exporté ici. Le format est détecté automatiquement.",
    boxLabel: 'Gantt à importer (CSV, Mermaid ou JSON)', template: 'Modèle CSV', exportAs: 'Exporter :', importGantt: 'Importer un Gantt',
    eCsvCols: 'CSV : colonnes obligatoires introuvables (nom de tâche, début, fin).', eNoTasks: 'Aucune tâche lisible dans ce Gantt.', eMermaid: 'Gantt Mermaid illisible : la première ligne doit être « gantt ».', eSize: 'Fichier trop volumineux (2 Mo max).',
    importedN: 'Importé : ', fmtJson: 'JSON', fmtCsv: 'CSV', fmtMermaid: 'Mermaid',
    copy: 'Copier', import: 'Importer', importFile: 'Choisir un fichier…', loadSample: 'Charger l’exemple ESAIP', newBlank: 'Nouveau projet vide',
    copied: 'Copié.', copyFail: 'Copie refusée : le texte est sélectionné, utilisez Ctrl+C.', imported: 'Projet importé.', saved: 'Enregistré.',
    sure: 'Cliquez encore pour confirmer', week: 'S',
    eBadJson: 'JSON illisible : vérifiez les accolades et les guillemets.', eInvalid: 'Projet refusé, champs invalides : ',
    eId: 'ID : lettres, chiffres, _ ou -, 16 caractères max.', eIdTaken: 'Cet ID existe déjà.', eName: 'Le nom (FR) est obligatoire.',
    eDates: 'Dates invalides : la fin doit être le même jour ou après le début.', eDeps: 'Dépendance inconnue : ', eCycle: 'Ces dépendances créent une boucle.',
    eRange: 'La date de fin du projet doit être après le début.', eRows: 'Ligne invalide : vérifiez ID et date.', eDoneDate: 'Date de fin réelle invalide.',
    tabAssistant: 'Assistant', newProject: 'Nouveau projet', tabBudget: 'Budget et équipe',
    cmdOpen: 'Ouvrir la barre de commandes', cmdPh: 'Rechercher une action, un onglet, un document…', cmdEmpty: 'Aucune action ne correspond.', cmdGo: 'Aller à', cmdLang: 'Passer en anglais',
    per_once: 'Une fois', per_month: 'Par mois', per_person: 'Par personne', per_personMonth: 'Par personne et par mois', basisL: 'Calcul', monthsU: 'mois',
    contAuto: 'Automatique, selon le risque du planning', contManual: 'Taux fixe choisi', contModeL: 'Marge pour imprévus', contWhy: 'Calcul :',
    budLive: 'Chaque modification s’applique aussitôt : budget, indicateurs et documents suivent.',
    kBudget: 'Budget estimé', kTeam: 'équipe', bTotal: 'Budget total', bLabour: 'Main-d’œuvre', bFixed: 'Coûts fixes', bCont: 'Marge pour imprévus', bTeam: 'Équipe', bPd: 'jours-homme', persons: 'personnes',
    bEV: 'Valeur acquise', bPV: 'Valeur planifiée', teamT: 'Équipe nécessaire', teamHint: 'Modifiez un taux journalier, puis enregistrez.', role: 'Rôle', people: 'Pers.', pdays: 'Jours-homme', period: 'Période', load: 'Charge', rate: 'Taux / jour', cost: 'Coût', total: 'Total',
    costPhase: 'Coût par phase', fixedT: 'Coûts fixes et marge', addExtra: 'Ajouter un coût', contingencyL: 'Marge pour imprévus (%)', saveBudget: 'Enregistrer le budget', amountL: 'Montant (€)', labelFr: 'Libellé (FR)', labelEn: 'Libellé (EN)',
    budNote: 'Calcul : chaque tâche compte une personne de son rôle à temps plein sur ses jours ouvrés. Taux indicatifs du marché français, à ajuster.',
    docLangFr: 'Vous modifiez la version française. Les documents téléchargés en français utilisent ces textes ; passez en EN pour modifier la version anglaise.',
    burnMode: 'Le burndown compte', bmProgress: 'L’avancement % de chaque tâche (recommandé)', bmDone: 'Seulement les tâches terminées',
    bdHintP: 'La courbe réelle suit l’avancement % des tâches : chaque modification enregistrée apparaît aussitôt, jour après jour.',
    bdHintD: 'La courbe réelle ne baisse que lorsqu’une tâche est terminée (bouton « Terminer » ou date de fin réelle).',
    wzEyebrow: 'Assistant de projet', wzTitle: 'Décrivez votre projet, on prépare tout le reste',
    wzLead: 'Une phrase suffit, sans termes techniques. Vous obtenez le planning (Gantt), le suivi burndown, le cahier des charges, le dossier technique et le rapport, prêts à télécharger.',
    wzPh: 'Ex. : je veux vendre mes vêtements en ligne', wzClient: 'Client (facultatif)', wzType: 'Type de projet', wzAuto: 'Détection automatique', wzSize: 'Ampleur',
    szSmall: 'Essentiel', szMedium: 'Standard', szLarge: 'Complet', wzDetected: 'Type détecté : ', wzNone: 'Écrivez quelques mots pour détecter le type de projet.',
    wzGo: 'Générer le projet complet', wzAi: 'Adapter avec l’IA de Claude', wzAiRun: 'Claude adapte le projet à votre demande…', wzAiFail: 'IA indisponible : projet généré avec le modèle intégré.',
    wzEmpty: 'Décrivez le projet en quelques mots.', wzDone: 'Projet prêt : ', wzUndo: 'Annuler', wzUndone: 'Projet précédent restauré.', wzSeeGantt: 'Voir le Gantt', wzEdit: 'Modifier les textes',
    wzS1: 'Décrivez', wzS1d: 'En une phrase, comme vous l’expliqueriez à un ami.', wzS2: 'Générez', wzS2d: 'Tâches, dates, dépendances, jalons et textes des documents sont créés.',
    wzS3: 'Téléchargez', wzS3d: 'Cahier des charges, dossier technique et rapport en Word, plus les Gantt.',
    wzStType: 'Type', wzStDur: 'Durée', wzStDates: 'Dates', wzStTasks: 'Tâches', wzStPts: 'Points d’effort', wzStMs: 'Jalons', weeksU: 'semaines',
    wzChips: ['Boutique en ligne de vêtements', 'Application mobile de suivi sportif', 'Chatbot pour le service client', 'Tableau de bord des ventes', 'Prise de rendez-vous en ligne', 'Site vitrine pour un restaurant'],
    download: 'Télécharger', dlDocs: 'Documents Word (.docx)', dlNeeds: 'Cahier des charges', dlTech: 'Dossier technique', dlReport: 'Rapport complet',
    dlImgs: 'Graphiques et données', dlGs: 'Gantt synthétique', dlGm: 'Gantt maître', dlBd: 'Burndown', dlCsv: 'Gantt pour Excel', dlJson: 'Projet complet',
    dlLang: 'Langue des documents : celle de l’interface (FR/EN).', dlFrame: 'Dans l’aperçu Claude, le navigateur peut bloquer les téléchargements : utilisez la version déployée.',
    generating: 'Génération…', dlDeclined: 'Téléchargement annulé.', dlBusy: 'Une confirmation est déjà ouverte, réessayez.', downloaded: 'Téléchargé : ', dlError: 'Échec de la génération. Réessayez.',
    docContent: 'Contenu des documents', docHint: 'Ce texte alimente le cahier des charges, le dossier technique et le rapport. Une ligne « - » = puce · « A | B | C » = ligne de tableau (la 1re = en-tête) · « ## » = sous-titre. Le planning, les Gantt et le burndown sont générés automatiquement.',
    author: 'Auteur / chef de projet', sponsor: 'Sponsor / client',
    fsWarn: 'Attention : commence avant la fin de ', blankName: 'Nouveau projet', pts: 'pts', d: 'j',
  },
  en: {
    eyebrow: 'Project tracking', tabBurndown: 'Burndown', tabGantt: 'Gantt', tabTasks: 'Tasks', tabProject: 'Project',
    on: 'On track', risk: 'At risk', late: 'Late',
    kRemaining: 'Remaining', kDone: 'pts done of', kEarned: 'Earned progress', kPlanned: 'planned', kVelocity: 'Velocity',
    kRequired: 'required', kSpi: 'SPI (schedule)', kSpiS: 'earned ÷ planned value', kForecast: 'Forecast finish', kPlannedEnd: 'planned end', kCritical: 'Critical path', kTasks: 'tasks',
    perWeek: 'pts/wk', none: '—', noVelocity: 'no velocity yet',
    bdTitle: 'Burndown (points remaining)', ideal: 'Ideal', actual: 'Actual', forecastL: 'Projection', today: 'Today', milestone: 'Milestone',
    focus: 'Watch list', lateTasks: 'Late', inProgress: 'In progress', nextUp: 'Starting soon (14 days)', nothing: 'Nothing to flag',
    summary: 'Summary Gantt', master: 'Master Gantt', showDeps: 'Dependencies', showCrit: 'Critical path',
    milestones: 'Milestones', phase: 'Phase', owner: 'Owner', points: 'Points', nameFr: 'Name (FR)', nameEn: 'Name (EN)',
    start: 'Start', end: 'End', progress: 'Progress', doneDate: 'Completed on', deps: 'Depends on (comma-separated IDs)',
    addTask: 'Add a task', editTask: 'Edit', saveTask: 'Save task', addBtn: 'Add', cancel: 'Cancel',
    edHint: 'Finish-to-start: a task starts after its predecessors end.', taskList: 'Tasks', status: 'Status', task: 'Task',
    sDone: 'Done', sLate: 'Late', sInprog: 'In progress', sTodo: 'To do', markDone: 'Complete', edit: 'Edit', del: 'Delete', confirmDel: 'Confirm?',
    projSettings: 'Project settings', savedLocal: 'Saved in this browser', projName: 'Project name', projCode: 'Code',
    statusDate: 'Status date (blank = today)', workingDays: 'Ideal line on working days (weekends excluded)', save: 'Save',
    phases: 'Phases', addPhase: 'Add a phase', addMs: 'Add a milestone', remove: 'Remove',
    dataTitle: 'Import a Gantt / export', dataHint: 'Load any project: paste or pick a Gantt as CSV (Excel, Google Sheets, MS Project, GanttProject; ; or , separators and DD/MM/YYYY dates accepted), a Mermaid gantt, or a JSON exported from here. The format is detected automatically.',
    boxLabel: 'Gantt to import (CSV, Mermaid or JSON)', template: 'CSV template', exportAs: 'Export:', importGantt: 'Import a Gantt',
    eCsvCols: 'CSV: required columns not found (task name, start, end).', eNoTasks: 'No readable tasks in this Gantt.', eMermaid: 'Unreadable Mermaid gantt: the first line must be "gantt".', eSize: 'File too large (2 MB max).',
    importedN: 'Imported: ', fmtJson: 'JSON', fmtCsv: 'CSV', fmtMermaid: 'Mermaid',
    copy: 'Copy', import: 'Import', importFile: 'Choose a file…', loadSample: 'Load the ESAIP sample', newBlank: 'New blank project',
    copied: 'Copied.', copyFail: 'Copy blocked: the text is selected, press Ctrl+C.', imported: 'Project imported.', saved: 'Saved.',
    sure: 'Click again to confirm', week: 'W',
    eBadJson: 'Unreadable JSON: check braces and quotes.', eInvalid: 'Project rejected, invalid fields: ',
    eId: 'ID: letters, digits, _ or -, 16 characters max.', eIdTaken: 'That ID already exists.', eName: 'Name (FR) is required.',
    eDates: 'Invalid dates: the end must be on or after the start.', eDeps: 'Unknown dependency: ', eCycle: 'These dependencies create a loop.',
    eRange: 'The project end date must be after the start.', eRows: 'Invalid row: check ID and date.', eDoneDate: 'Invalid completion date.',
    tabAssistant: 'Assistant', newProject: 'New project', tabBudget: 'Budget & team',
    cmdOpen: 'Open the command bar', cmdPh: 'Search an action, a tab, a document…', cmdEmpty: 'No matching action.', cmdGo: 'Go to', cmdLang: 'Switch to French',
    per_once: 'One-off', per_month: 'Per month', per_person: 'Per person', per_personMonth: 'Per person per month', basisL: 'Basis', monthsU: 'months',
    contAuto: 'Automatic, from schedule risk', contManual: 'Fixed rate', contModeL: 'Contingency', contWhy: 'How:',
    budLive: 'Every change applies at once: budget, indicators and documents follow.',
    kBudget: 'Estimated budget', kTeam: 'team', bTotal: 'Total budget', bLabour: 'Labour', bFixed: 'Fixed costs', bCont: 'Contingency', bTeam: 'Team', bPd: 'person-days', persons: 'people',
    bEV: 'Earned value', bPV: 'Planned value', teamT: 'Required team', teamHint: 'Change a day rate, then save.', role: 'Role', people: 'People', pdays: 'Person-days', period: 'Period', load: 'Load', rate: 'Day rate', cost: 'Cost', total: 'Total',
    costPhase: 'Cost by phase', fixedT: 'Fixed costs and contingency', addExtra: 'Add a cost', contingencyL: 'Contingency (%)', saveBudget: 'Save budget', amountL: 'Amount (€)', labelFr: 'Label (FR)', labelEn: 'Label (EN)',
    budNote: 'Method: each task counts one person of its role full time on its working days. Indicative French-market rates, adjust as needed.',
    docLangEn: 'You are editing the English version. Documents downloaded in English use these texts; switch to FR to edit the French version.',
    burnMode: 'Burndown counts', bmProgress: 'Each task’s progress % (recommended)', bmDone: 'Completed tasks only',
    bdHintP: 'The actual line follows each task’s progress %: every saved change shows at once, day after day.',
    bdHintD: 'The actual line only drops when a task is completed (“Complete” button or completion date).',
    wzEyebrow: 'Project assistant', wzTitle: 'Describe your project, we prepare everything else',
    wzLead: 'One sentence is enough, no technical terms needed. You get the schedule (Gantt), burndown tracking, requirements spec, technical document and report, ready to download.',
    wzPh: 'E.g. I want to sell my clothes online', wzClient: 'Client (optional)', wzType: 'Project type', wzAuto: 'Automatic detection', wzSize: 'Scope',
    szSmall: 'Essential', szMedium: 'Standard', szLarge: 'Complete', wzDetected: 'Detected type: ', wzNone: 'Type a few words to detect the project type.',
    wzGo: 'Generate the full project', wzAi: 'Tailor with Claude AI', wzAiRun: 'Claude is tailoring the project to your request…', wzAiFail: 'AI unavailable: project generated with the built-in model.',
    wzEmpty: 'Describe the project in a few words.', wzDone: 'Project ready: ', wzUndo: 'Undo', wzUndone: 'Previous project restored.', wzSeeGantt: 'See the Gantt', wzEdit: 'Edit the texts',
    wzS1: 'Describe', wzS1d: 'In one sentence, as you would explain it to a friend.', wzS2: 'Generate', wzS2d: 'Tasks, dates, dependencies, milestones and document texts are created.',
    wzS3: 'Download', wzS3d: 'Requirements spec, technical document and report in Word, plus the Gantts.',
    wzStType: 'Type', wzStDur: 'Duration', wzStDates: 'Dates', wzStTasks: 'Tasks', wzStPts: 'Effort points', wzStMs: 'Milestones', weeksU: 'weeks',
    wzChips: ['Online clothing shop', 'Mobile app for sports tracking', 'Customer service chatbot', 'Sales dashboard', 'Online appointment booking', 'Showcase website for a restaurant'],
    download: 'Download', dlDocs: 'Word documents (.docx)', dlNeeds: 'Requirements specification', dlTech: 'Technical document', dlReport: 'Full report',
    dlImgs: 'Charts and data', dlGs: 'Summary Gantt', dlGm: 'Master Gantt', dlBd: 'Burndown', dlCsv: 'Gantt for Excel', dlJson: 'Full project',
    dlLang: 'Document language follows the interface (FR/EN).', dlFrame: 'In the Claude preview the browser may block downloads: use the deployed version.',
    generating: 'Generating…', dlDeclined: 'Download cancelled.', dlBusy: 'A confirmation is already open, try again.', downloaded: 'Downloaded: ', dlError: 'Generation failed. Try again.',
    docContent: 'Document content', docHint: 'This text feeds the requirements spec, technical document and report. A "- " line = bullet · "A | B | C" = table row (first = header) · "## " = subheading. Schedule, Gantts and burndown are generated automatically.',
    author: 'Author / project manager', sponsor: 'Sponsor / client',
    fsWarn: 'Warning: starts before the end of ', blankName: 'New project', pts: 'pts', d: 'd',
  }
};

/* ---------- state ---------- */
const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } };
// a shared (read-only) project is never written over the viewer's own saved project
const persist = () => { if (typeof RO !== 'undefined' && RO) return; try { localStorage.setItem(STORE, JSON.stringify({ project: P, ui: UI })); } catch { /* storage unavailable: session-only */ } };
const hooks = { commit: [], render: [], replace: [], undo: [], tab: [] };
const emit = (ev, arg) => hooks[ev].forEach(f => { try { f(arg); } catch (e) { console.warn(ev, e); } });
const saved = load();
// the demo sample comes with its project-management kit, generated from its own schedule
const sampleProject = () => { const p = C.validateProject(SAMPLE).project; if (PM.isEmpty(p.pm)) p.pm = PM.generate(p, 'fr', []); return p; };
let P = (saved && C.validateProject(saved.project).project) || sampleProject();
const UI = Object.assign({ lang: 'fr', tab: 'brain', wzSize: 'medium', gMode: 'master', zoom: 14, deps: true, crit: true }, saved && saved.ui || {});
let editing = null, lastBurndown = null;
const t = k => I18N[UI.lang][k] ?? k;
const nm = o => (UI.lang === 'fr' ? o.fr : o.en) || o.fr || o.en || o.id;
const todayT = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
const nowT = () => C.statusTime(P, todayT());
const dLabel = (tm, long) => new Date(tm).toLocaleDateString(UI.lang === 'fr' ? 'fr-FR' : 'en-GB', long ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const isoWeek = tm => { const d = new Date(tm); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const f = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - f) / C.DAY - 3 + ((f.getUTCDay() + 6) % 7)) / 7); };
const phaseOf = id => P.phases.find(p => p.id === id) || { id: '', fr: '—', en: '—', color: '#8f9bb0' };
function taskStatus(k, now) {
  if (k.done) return 'done';
  if (C.parseDate(k.end) < now) return 'late';
  if (C.parseDate(k.start) <= now) return 'inprog';
  return 'todo';
}
const statusKey = { done: 'sDone', late: 'sLate', inprog: 'sInprog', todo: 'sTodo' };

/* ---------- chrome ---------- */
const BASE_TABS = [['brain', 'tabBrain'], ['assistant', 'tabAssistant'], ['burndown', 'tabBurndown'], ['gantt', 'tabGantt'], ['tasks', 'tabTasks'], ['pm', 'tabPm'], ['budget', 'tabBudget'], ['project', 'tabProject']];
const ALL_TABS = ['projects', 'brain', 'assistant', 'burndown', 'gantt', 'tasks', 'pm', 'budget', 'project', 'team'];
let extraTabs = { before: [], after: [] }, RO = false, EMPTY = false;   // EMPTY: signed in, no project open yet
const visibleTabs = () => [...extraTabs.before, ...BASE_TABS.filter(([id]) => EMPTY ? id === 'assistant' : !RO || !['assistant', 'project'].includes(id)), ...extraTabs.after];
function renderChrome() {
  document.documentElement.lang = UI.lang;
  document.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
  $('eyebrow').textContent = t('eyebrow') + (P.code ? ' · ' + P.code : '');
  $('pName').textContent = EMPTY ? t('noProjT') : P.name;
  document.body.classList.toggle('noproj', EMPTY);
  $('emptyNote').hidden = !EMPTY;
  $('pMeta').textContent = `${dLabel(C.parseDate(P.start), true)} → ${dLabel(C.parseDate(P.end), true)} · ${P.tasks.length} ${t('kTasks')} · ${C.totalPoints(P)} ${t('pts')}`;
  ['fr', 'en'].forEach(l => $('lang-' + l).setAttribute('aria-pressed', UI.lang === l));
  const tabs = visibleTabs();
  if (!tabs.some(([id]) => id === UI.tab)) UI.tab = tabs[0][0];
  document.body.classList.toggle('ro', RO);
  $('tabs').innerHTML = tabs.map(([id, k]) => `<button type="button" role="tab" id="tb-${id}" data-tab="${id}" aria-selected="${UI.tab === id}" aria-controls="tab-${id}">${esc(t(k))}</button>`).join('');
  ALL_TABS.forEach(id => { const el = $('tab-' + id); if (el) el.hidden = UI.tab !== id; });
  $('kpis').hidden = EMPTY || ['assistant', 'projects', 'team', 'brain'].includes(UI.tab);
  $('hero').hidden = EMPTY || UI.tab === 'projects' || UI.tab === 'team';
  $('g-summary').textContent = t('summary'); $('g-master').textContent = t('master');
  $('g-summary').setAttribute('aria-pressed', UI.gMode === 'summary'); $('g-master').setAttribute('aria-pressed', UI.gMode === 'master');
  document.querySelectorAll('#gZoom button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.z === UI.zoom));
  $('optDeps').checked = UI.deps; $('optCrit').checked = UI.crit;
  emit('tab', UI.tab);
}

function renderKpis() {
  setTimeout(() => countUp($('kpis')), 0);
  const BG = Budget.compute(P, todayT());
  const b = C.burndown(P, todayT()), h = C.health(P, todayT()), cp = C.criticalPath(P);
  const end = C.parseDate(P.end);
  const st = $('pStatus'); st.className = 'pill st-' + h.status; st.textContent = t(h.status);
  const fcLate = b.forecast !== null && b.forecast > end;
  const slip = b.forecast !== null ? C.diffDays(end, b.forecast) : null;
  const pct = x => Math.round(x * 100) + '%';
  const ring = (v, plan) => { const R = 19, L = 2 * Math.PI * R; return `<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="${R}" fill="none" stroke="var(--grid)" stroke-width="5"/>
    <circle cx="24" cy="24" r="${R}" fill="none" stroke="var(--ideal)" stroke-opacity=".5" stroke-width="5" stroke-dasharray="${(L * Math.min(1, plan)).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 24 24)"/>
    <circle class="ring-v" cx="24" cy="24" r="${R}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(L * Math.min(1, v)).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 24 24)"/></svg>`; };
  $('kpis').innerHTML = `
    <div class="kpi"><div class="k">${esc(t('kRemaining'))}</div><div class="v"><span data-to="${Math.round(b.remaining)}">${Math.round(b.remaining)}</span> <small>${esc(t('pts'))}</small></div>
      <div class="s">${b.done} ${esc(t('kDone'))} ${b.total}</div><div class="meter"><i style="width:${b.total ? b.done / b.total * 100 : 0}%"></i></div></div>
    <div class="kpi"><div class="k">${esc(t('kEarned'))}</div><div class="ring">${ring(h.pctEarned, h.pctPlanned)}<div><div class="v"><span data-to="${Math.round(h.pctEarned * 100)}" data-suffix="%">${pct(h.pctEarned)}</span></div>
      <div class="s">${pct(h.pctPlanned)} ${esc(t('kPlanned'))}</div></div></div></div>
    <div class="kpi"><div class="k">${esc(t('kVelocity'))}</div><div class="v">${b.velocityWeek.toFixed(1)} <small>${esc(t('perWeek'))}</small></div>
      <div class="s" style="color:${b.velocityWeek + 0.05 < b.requiredWeek ? 'var(--warn)' : 'var(--muted)'}">${b.requiredWeek.toFixed(1)} ${esc(t('perWeek'))} ${esc(t('kRequired'))}</div></div>
    <div class="kpi"><div class="k">${esc(t('kSpi'))}</div><div class="v" style="color:var(--${h.status === 'on' ? 'good' : h.status === 'risk' ? 'warn' : 'bad'})">${h.spi.toFixed(2)}</div><div class="s">${esc(t('kSpiS'))}</div></div>
    <div class="kpi"><div class="k">${esc(t('kForecast'))}</div><div class="v" style="font-size:19px;${fcLate ? 'color:var(--bad)' : ''}">${b.forecast !== null ? esc(dLabel(b.forecast, true)) : esc(t('none'))}</div>
      <div class="s">${b.forecast !== null ? `${slip > 0 ? '+' : ''}${slip} ${esc(t('d'))} · ` : esc(t('noVelocity')) + ' · '}${esc(t('kPlannedEnd'))} ${esc(dLabel(end))}</div></div>
    <div class="kpi"><div class="k">${esc(t('kBudget'))}</div><div class="v" style="font-size:19px">${esc(eurF(BG.total))}</div><div class="s">${BG.people} ${esc(t('persons'))} · ${BG.personDays} ${esc(t('bPd'))}</div></div>
    <div class="kpi"><div class="k">${esc(t('kCritical'))}</div><div class="v">${cp.critical.size} <small>${esc(t('kTasks'))}</small></div>
      <div class="s mono">${esc([...cp.critical].filter(id => !P.tasks.find(k => k.id === id).done).slice(0, 6).join(' → ') || t('none'))}</div></div>`;
}

const eurF = v => new Intl.NumberFormat(UI.lang === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

/* ---------- budget and team ---------- */
function renderBudget() {
  const B = Budget.compute(P, todayT());
  const tile = (k, v, s, cls = '') => `<div class="kpi ${cls}"><div class="k">${esc(t(k))}</div><div class="v" style="font-size:20px">${esc(v)}</div>${s ? `<div class="s">${esc(s)}</div>` : ''}</div>`;
  $('budKpis').innerHTML = tile('bTotal', eurF(B.total), `${B.personDays} ${t('bPd')}`, 'total') + tile('bLabour', eurF(B.labour)) + tile('bFixed', eurF(B.extrasTotal)) +
    tile('bCont', eurF(B.contingency), Math.round(B.contingencyRate * 100) + ' %') + tile('bTeam', `${B.people} ${t('persons')}`, `${B.staff.length} ${t('role').toLowerCase()}s`) +
    tile('bEV', eurF(B.earnedValue), `${t('bPV')} : ${eurF(B.plannedValue)}`);
  $('teamTable').innerHTML = `<thead><tr><th>${esc(t('role'))}</th><th class="r">${esc(t('people'))}</th><th class="r">${esc(t('pdays'))}</th><th>${esc(t('period'))}</th><th class="r">${esc(t('load'))}</th><th class="r">${esc(t('rate'))}</th><th class="r">${esc(t('cost'))}</th></tr></thead><tbody>` +
    B.staff.map(r => `<tr><td>${esc(nm(r))} <span class="tid">${esc(r.id)}</span></td><td class="r num">${r.people}</td><td class="r num">${r.personDays}</td>
      <td class="num">${esc(dLabel(C.parseDate(r.start)))} → ${esc(dLabel(C.parseDate(r.end)))}</td><td class="r num">${Math.round(r.load * 100)} %</td>
      <td class="r"><input class="rate-in" type="number" min="0" max="10000" step="10" id="rate-${esc(r.id)}" data-role="${esc(r.id)}" value="${r.rate}" aria-label="${esc(t('rate'))} ${esc(nm(r))}"></td>
      <td class="r num">${esc(eurF(r.cost))}</td></tr>`).join('') +
    `<tr class="total-row"><td>${esc(t('total'))}</td><td class="r num">${B.people}</td><td class="r num">${B.personDays}</td><td></td><td></td><td></td><td class="r num">${esc(eurF(B.labour))}</td></tr></tbody>`;
  const max = Math.max(1, ...B.byPhase.map(x => x.cost));
  $('phaseCost').innerHTML = B.byPhase.map(x => `<div class="pc-row"><span>${esc(x.id + ' · ' + nm(x))}</span><span class="pc-bar"><i style="width:${x.cost / max * 100}%;background:${esc(x.color)}"></i></span><span class="num">${esc(eurF(x.cost))}</span></div>`).join('');
  const totals = new Map(B.extras.map(x => [x, x.total]));
  $('extraRows').innerHTML = (P.budget.extras || []).map((x, i) => { const hit = B.extras.find(y => y.fr === x.fr && y.en === x.en && y.amount === x.amount && (y.per || 'once') === (x.per || 'once')); return extraRow({ ...x, total: hit ? hit.total : 0 }, i); }).join('');
  $('bud-mode').innerHTML = `<option value="auto">${esc(t('contAuto'))}</option><option value="manual">${esc(t('contManual'))}</option>`;
  $('bud-mode').value = B.contMode;
  $('bud-cont').value = Math.round(B.contingencyRate * 100);
  $('bud-cont').disabled = B.contMode === 'auto';
  $('contWhy').innerHTML = B.contMode === 'auto' ? `<b>${esc(t('contWhy'))}</b> ${B.autoContingency.parts.map(x => `${esc(nm(x))} <span class="num">${Math.round(x.rate * 100)} %</span>`).join(' + ')} = <b class="num">${Math.round(B.contingencyRate * 100)} %</b>` : '';
  $('fixedSum').textContent = `${t('bFixed')} : ${eurF(B.extrasTotal)} · ${B.months} ${t('monthsU')} · ${B.people} ${t('persons')}`;
}
const PERS = ['once', 'month', 'person', 'personMonth'];
const extraRow = (x, i) => `<div class="extra-row" data-idx="${i}"><input class="ex-fr" id="ex-fr-${i}" maxlength="120" value="${esc(x.fr)}" placeholder="${esc(t('labelFr'))}" aria-label="${esc(t('labelFr'))}"><input class="ex-en" id="ex-en-${i}" maxlength="120" value="${esc(x.en)}" placeholder="${esc(t('labelEn'))}" aria-label="${esc(t('labelEn'))}">
  <input class="ex-amt" id="ex-amt-${i}" type="number" min="0" step="1" value="${x.amount}" aria-label="${esc(t('amountL'))}">
  <select class="ex-per" id="ex-per-${i}" aria-label="${esc(t('basisL'))}">${PERS.map(p => `<option value="${p}"${(x.per || 'once') === p ? ' selected' : ''}>${esc(t('per_' + p))}</option>`).join('')}</select>
  <span class="ex-tot num">${x.total != null ? esc(eurF(x.total)) : ''}</span><button class="btn sm danger" type="button" data-rm>${esc(t('remove'))}</button></div>`;
$('extraRows').addEventListener('click', ev => { if (ev.target.closest('[data-rm]')) { ev.target.closest('.extra-row').remove(); applyBudget(false); } });
$('addExtra').addEventListener('click', () => { const i = document.querySelectorAll('#extraRows .extra-row').length; $('extraRows').insertAdjacentHTML('beforeend', extraRow({ fr: '', en: '', amount: 0, per: 'once' }, i)); $('ex-fr-' + i).focus(); });
function applyBudget(showMsg) {
  const rates = new Map([...document.querySelectorAll('#teamTable .rate-in')].map(i => [i.dataset.role, Number(i.value)]));
  const known = new Set(P.team.map(r => r.id));
  const team = [...P.team.map(r => rates.has(r.id) ? { ...r, rate: rates.get(r.id) } : r),
    ...Budget.staffing(P).filter(r => !known.has(r.id)).map(r => ({ id: r.id, fr: r.fr, en: r.en, rate: rates.has(r.id) ? rates.get(r.id) : r.rate }))];
  const extras = [...document.querySelectorAll('#extraRows .extra-row')].map(r => ({ fr: r.querySelector('.ex-fr').value, en: r.querySelector('.ex-en').value, amount: Number(r.querySelector('.ex-amt').value), per: r.querySelector('.ex-per').value }));
  P = C.validateProject({ ...P, team, budget: { contMode: $('bud-mode').value, contingency: Number($('bud-cont').value) / 100, extras } }).project; commit();
  if (showMsg) { $('budMsg').textContent = t('saved'); $('budMsg').className = 'ok'; }
}
$('saveBudget').addEventListener('click', () => applyBudget(true));
// every edit in the budget tab applies by itself (short pause while typing), so all screens and documents follow
let budTimer = null;
$('tab-budget').addEventListener('input', ev => { if (!ev.target.matches('input, select')) return; clearTimeout(budTimer); budTimer = setTimeout(() => applyBudget(false), 450); });
$('tab-budget').addEventListener('change', ev => { if (ev.target.matches('select')) { clearTimeout(budTimer); applyBudget(false); } });

/* ---------- burndown chart ---------- */
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
const shown = new Map();
function countUp(root) {
  root.querySelectorAll('[data-to]').forEach(el => {
    const to = Number(el.dataset.to), key = el.closest('.kpi')?.querySelector('.k')?.textContent || '', from = shown.has(key) ? shown.get(key) : 0;
    shown.set(key, to);
    if (reduceMotion || from === to || !Number.isFinite(to)) return;
    const suf = el.dataset.suffix || '', t0 = performance.now(), dur = 700;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
let animateBd = true;
function renderBurndown() {
  const box = $('bdBox'), tip = $('bdTip');
  box.querySelectorAll('svg').forEach(s => s.remove());
  const b = C.burndown(P, todayT());
  const s = C.parseDate(P.start), e = C.parseDate(P.end);
  const xEnd = b.forecast !== null && b.forecast > e ? Math.min(b.forecast, C.addDays(e, 60)) : e;
  const W = 820, H = 380, m = { l: 48, r: 20, t: 28, b: 52 };
  const X = tm => m.l + (tm - s) / (xEnd - s) * (W - m.l - m.r);
  const ymax = Math.max(1, b.total) * 1.06;
  const Y = v => m.t + (1 - v / ymax) * (H - m.t - m.b);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find(x => ymax / x <= 6) || 1000;
  let g = '';
  for (let v = 0; v <= ymax; v += step) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">${v}</text>`;
  // weekly x ticks (Mondays)
  let mon = s; while (new Date(mon).getUTCDay() !== 1) mon = C.addDays(mon, 1);
  const wkStep = Math.ceil(((xEnd - s) / C.DAY / 7) / 12);
  for (let tm = mon, i = 0; tm <= xEnd; tm = C.addDays(tm, 7), i++) {
    if (i % wkStep) continue;
    g += `<line x1="${X(tm)}" x2="${X(tm)}" y1="${H - m.b}" y2="${H - m.b + 5}" stroke="var(--line)"/><text x="${X(tm)}" y="${H - m.b + 18}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">${esc(dLabel(tm))}</text>`;
  }
  g += `<line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}" stroke="var(--line)"/>`;
  if (xEnd > e) g += `<rect x="${X(e)}" y="${m.t}" width="${X(xEnd) - X(e)}" height="${H - m.t - m.b}" fill="var(--bad-soft)"/>`;
  // milestones on axis
  P.milestones.forEach(ms => { const tm = C.parseDate(ms.date); if (tm < s || tm > xEnd) return;
    g += `<path d="M${X(tm)} ${H - m.b + 26}l5 5l-5 5l-5 -5z" fill="var(--ink)"><title>${esc(ms.id + ' · ' + nm(ms) + ' · ' + dLabel(tm, true))}</title></path>`; });
  // ideal
  g += `<polyline fill="none" stroke="var(--ideal)" stroke-width="1.6" stroke-dasharray="5 4" points="${b.ideal.map(p => `${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}"/>`;
  // actual (step) + area
  if (b.actual.length) {
    let d = `M${X(b.actual[0].t)} ${Y(b.actual[0].v)}`;
    b.actual.forEach((p, i) => { if (i) d += `H${X(p.t).toFixed(1)}V${Y(p.v).toFixed(1)}`; });
    const last = b.actual.at(-1);
    g += `<path d="${d}V${H - m.b}H${X(b.actual[0].t)}Z" fill="var(--accent-soft)"/><path class="bd-line" d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" filter="url(#bdGlow)"/>`;
    if (b.forecast !== null && b.remaining > 0) {
      const fx = Math.min(b.forecast, xEnd), fv = b.remaining * (1 - (fx - last.t) / (b.forecast - last.t || 1));
      g += `<line x1="${X(last.t)}" y1="${Y(last.v)}" x2="${X(fx)}" y2="${Y(fv)}" stroke="var(--${b.forecast > e ? 'bad' : 'good'})" stroke-width="1.8" stroke-dasharray="2 4" stroke-linecap="round"/>`;
    }
    g += `<circle cx="${X(last.t)}" cy="${Y(last.v)}" r="4.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.4"/>
      <text x="${X(last.t) + 9}" y="${Y(last.v) - 9}" font-size="12" font-weight="600" fill="var(--ink)" font-family="var(--f-mono)">${Math.round(last.v)}</text>`;
  }
  // today
  const nt = b.now;
  if (nt >= s && nt <= xEnd) g += `<line x1="${X(nt)}" x2="${X(nt)}" y1="${m.t - 8}" y2="${H - m.b}" stroke="var(--ink)" stroke-dasharray="3 3" opacity=".55"/><text x="${X(nt)}" y="${m.t - 12}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)" font-family="var(--f-display)">${esc(t('today').toUpperCase())}</text>`;
  g += `<rect id="bdHit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/>`;
  g += `<line id="bdCursor" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--muted)" visibility="hidden"/>`;
  lastBurndown = { svg: g.replace(' filter="url(#bdGlow)"', ''), W, H };
  g = `<defs><filter id="bdGlow" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` + g;
  box.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('bdTitle'))}">${g}</svg>`);
  $('bdLegend').innerHTML = `<span><i class="sw" style="border-color:var(--accent);border-top-width:3px"></i>${esc(t('actual'))}</span><span><i class="sw" style="border-color:var(--ideal);border-top-style:dashed"></i>${esc(t('ideal'))}</span><span><i class="sw" style="border-color:var(--${b.forecast !== null && b.forecast > e ? 'bad' : 'good'});border-top-style:dotted"></i>${esc(t('forecastL'))}</span><span><svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0l5 5l-5 5l-5-5z" fill="var(--ink)"/></svg>${esc(t('milestone'))}</span>`;
  $('bdHint').textContent = t(P.burnMode === 'done' ? 'bdHintD' : 'bdHintP');
  const line = box.querySelector('.bd-line');
  if (line && animateBd && UI.tab === 'burndown' && !reduceMotion) { try { const len = line.getTotalLength(); line.style.setProperty('--len', len); line.classList.add('draw'); animateBd = false; } catch { /* no layout */ } }
  const svg = box.querySelector('svg'), hit = svg.querySelector('#bdHit'), cur = svg.querySelector('#bdCursor');
  const move = ev => {
    const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * W;
    const tm = C.addDays(s, Math.round((sx - m.l) / (W - m.l - m.r) * (xEnd - s) / C.DAY));
    if (tm < s || tm > xEnd) return;
    const a = b.actual.find(p => p.t === tm);
    cur.setAttribute('x1', X(tm)); cur.setAttribute('x2', X(tm)); cur.setAttribute('visibility', 'visible');
    tip.hidden = false; tip.style.left = (X(tm) / W * r.width) + 'px'; tip.style.top = (m.t / H * r.height + 20) + 'px';
    tip.textContent = `${dLabel(tm, true)} · ${t('ideal')} ${Math.round(C.idealAt(P, tm))}${a ? ` · ${t('actual')} ${a.v}` : ''}`;
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerleave', () => { tip.hidden = true; cur.setAttribute('visibility', 'hidden'); });
}

function renderFocus() {
  const now = nowT(), soon = C.addDays(now, 14);
  const late = P.tasks.filter(k => taskStatus(k, now) === 'late');
  const prog = P.tasks.filter(k => taskStatus(k, now) === 'inprog');
  const next = P.tasks.filter(k => !k.done && C.parseDate(k.start) > now && C.parseDate(k.start) <= soon);
  const li = (k, extra) => `<li><span class="tid">${esc(k.id)}</span><span>${esc(nm(k))}<br><span class="hint">${esc(k.owner || '')} · ${esc(dLabel(C.parseDate(k.start)))} → ${esc(dLabel(C.parseDate(k.end)))}</span></span>${extra}</li>`;
  const block = (title, arr, fn) => `<p class="sec-t">${esc(title)} · ${arr.length}</p>${arr.length ? `<ul class="mini">${arr.map(fn).join('')}</ul>` : `<p class="hint">${esc(t('nothing'))}</p>`}`;
  $('focus').innerHTML =
    block(t('lateTasks'), late, k => li(k, `<span class="chip c-late">+${C.diffDays(C.parseDate(k.end), now)} ${esc(t('d'))}</span>`)) +
    block(t('inProgress'), prog, k => li(k, `<span class="pbar" title="${k.progress}%"><i style="width:${k.progress}%;background:var(--accent)"></i></span>`)) +
    block(t('nextUp'), next, k => li(k, `<span class="num hint">${k.points} ${esc(t('pts'))}</span>`));
}

/* ---------- gantt ---------- */
function buildGantt(mode, dw, showDeps, showCrit) {
  const now = nowT(), cp = C.criticalPath(P);
  const allDates = [C.parseDate(P.start), C.parseDate(P.end), ...P.tasks.flatMap(k => [C.parseDate(k.start), C.parseDate(k.end)]), ...P.milestones.map(m => C.parseDate(m.date))];
  let s = Math.min(...allDates), e = Math.max(...allDates);
  while (new Date(s).getUTCDay() !== 1) s = C.addDays(s, -1);
  e = C.addDays(e, 3);
  const days = C.diffDays(s, e) + 1, W = days * dw, RH = 30, HEAD = 46;
  const X = tm => C.diffDays(s, tm) * dw;
  const rows = [];
  rows.push({ kind: 'ms' });
  if (mode === 'summary') C.phaseSpans(P).filter(p => p.start).forEach(p => rows.push({ kind: 'phase', p }));
  else P.phases.forEach(ph => {
    const sp = C.phaseSpans(P).find(x => x.id === ph.id);
    if (!sp.start) return;
    rows.push({ kind: 'phaseHead', p: sp });
    P.tasks.filter(k => k.phase === ph.id).forEach(k => rows.push({ kind: 'task', k }));
  });
  const orphan = P.tasks.filter(k => !P.phases.some(p => p.id === k.phase));
  if (mode === 'master') orphan.forEach(k => rows.push({ kind: 'task', k }));
  const H = HEAD + rows.length * RH + 8;
  const rowY = new Map();
  let L = '', R = '';
  // header: months + weeks
  R += `<rect x="0" y="0" width="${W}" height="${HEAD}" fill="var(--sunk)"/>`;
  for (let tm = s; tm <= e; tm = C.addDays(tm, 1)) {
    const d = new Date(tm);
    if (C.isWeekend(tm) && dw >= 8) R += `<rect x="${X(tm)}" y="${HEAD}" width="${dw}" height="${H - HEAD}" fill="var(--grid)" opacity=".55"/>`;
    if (d.getUTCDate() === 1 || (tm === s && d.getUTCDate() <= 20)) {
      R += `<line x1="${X(tm)}" x2="${X(tm)}" y1="0" y2="22" stroke="var(--line)"/><text x="${X(tm) + 6}" y="15" font-size="11.5" font-weight="600" fill="var(--ink)" font-family="var(--f-display)">${esc(d.toLocaleDateString(UI.lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase())}</text>`;
    }
    if (d.getUTCDay() === 1) {
      R += `<line x1="${X(tm)}" x2="${X(tm)}" y1="22" y2="${H}" stroke="var(--line)" opacity=".7"/>`;
      if (dw * 7 >= 84) R += `<text x="${X(tm) + 5}" y="38" font-size="10.5" fill="var(--muted)" font-family="var(--f-mono)">${esc(t('week'))}${isoWeek(tm)} · ${esc(dLabel(tm))}</text>`;
      else R += `<text x="${X(tm) + 3}" y="38" font-size="10.5" fill="var(--muted)" font-family="var(--f-mono)">${isoWeek(tm)}</text>`;
    }
  }
  R += `<line x1="0" x2="${W}" y1="22" y2="22" stroke="var(--line)"/><line x1="0" x2="${W}" y1="${HEAD}" y2="${HEAD}" stroke="var(--line)"/>`;
  L += `<rect x="0" y="0" width="400" height="${HEAD}" fill="var(--sunk)"/><line x1="0" x2="400" y1="${HEAD}" y2="${HEAD}" stroke="var(--line)"/>
    <text x="12" y="30" font-size="11.5" font-weight="600" fill="var(--muted)" font-family="var(--f-display)" letter-spacing=".08em">${esc((mode === 'summary' ? t('phase') : t('task')).toUpperCase())}</text>`;
  rows.forEach((r, i) => {
    const y = HEAD + i * RH, cy = y + RH / 2;
    const zebra = r.kind === 'phaseHead' ? `<rect x="0" y="${y}" width="%W%" height="${RH}" fill="var(--sunk)"/>` : '';
    R += zebra.replace('%W%', W); L += zebra.replace('%W%', 400);
    R += `<line x1="0" x2="${W}" y1="${y + RH}" y2="${y + RH}" stroke="var(--grid)"/>`;
    L += `<line x1="0" x2="400" y1="${y + RH}" y2="${y + RH}" stroke="var(--grid)"/>`;
    if (r.kind === 'ms') {
      L += `<text x="12" y="${cy + 4}" font-size="12.5" font-weight="600" fill="var(--ink)" font-family="var(--f-display)">${esc(t('milestones'))}</text>`;
      P.milestones.forEach(ms => { const x = X(C.parseDate(ms.date)) + dw / 2;
        R += `<g><path d="M${x} ${cy - 8}l8 8l-8 8l-8 -8z" fill="var(--ink)"/><title>${esc(ms.id + ' · ' + nm(ms) + ' · ' + dLabel(C.parseDate(ms.date), true))}</title></g><text x="${x + 11}" y="${cy + 4}" font-size="10.5" font-weight="600" fill="var(--muted)" font-family="var(--f-mono)">${esc(ms.id)}</text>`; });
      return;
    }
    if (r.kind === 'phase' || r.kind === 'phaseHead') {
      const p = r.p, x1 = X(C.parseDate(p.start)), x2 = X(C.parseDate(p.end)) + dw, big = r.kind === 'phase';
      L += `<rect x="10" y="${cy - 5}" width="10" height="10" rx="2" fill="${esc(p.color)}"/><text x="28" y="${cy + 4}" font-size="${big ? 13 : 12.5}" font-weight="600" fill="var(--ink)" font-family="var(--f-display)">${esc(p.id + ' · ' + nm(p))}</text>`;
      if (big) {
        L += `<text x="392" y="${cy + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">${Math.round(p.progress * 100)}%</text>`;
        R += `<rect x="${x1}" y="${cy - 9}" width="${x2 - x1}" height="18" rx="4" fill="${esc(p.color)}" fill-opacity=".2" stroke="${esc(p.color)}"/><rect x="${x1}" y="${cy - 9}" width="${(x2 - x1) * p.progress}" height="18" rx="4" fill="${esc(p.color)}"/>
          <text x="${x2 + 8}" y="${cy + 4}" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">${esc(dLabel(C.parseDate(p.start)))}–${esc(dLabel(C.parseDate(p.end)))} · ${p.points} ${esc(t('pts'))}</text>`;
      } else {
        R += `<path d="M${x1} ${cy + 6}V${cy - 4}H${x2}V${cy + 6}" fill="none" stroke="${esc(p.color)}" stroke-width="2"/><rect x="${x1}" y="${cy - 4}" width="${(x2 - x1) * p.progress}" height="4" fill="${esc(p.color)}"/>`;
      }
      return;
    }
    const k = r.k, ph = phaseOf(k.phase), x1 = X(C.parseDate(k.start)), x2 = X(C.parseDate(k.end)) + dw;
    const st = taskStatus(k, now), crit = showCrit && cp.critical.has(k.id);
    rowY.set(k.id, { cy, x1, x2 });
    L += `<text x="12" y="${cy + 4}" font-size="11" fill="var(--muted)" font-family="var(--f-mono)">${esc(k.id)}</text><text x="52" y="${cy + 4}" font-size="12.5" fill="var(--ink)">${esc(nm(k).length > 38 ? nm(k).slice(0, 37) + '…' : nm(k))}<title>${esc(nm(k))}</title></text>`;
    R += `<g><title>${esc(`${k.id} · ${nm(k)}\n${dLabel(C.parseDate(k.start), true)} → ${dLabel(C.parseDate(k.end), true)}\n${k.owner} · ${k.points} ${t('pts')} · ${k.progress}% · ${t(statusKey[st])}`)}</title>
      <rect x="${x1}" y="${cy - 8}" width="${x2 - x1}" height="16" rx="3" fill="${esc(ph.color)}" fill-opacity=".22" stroke="${crit ? 'var(--ink)' : esc(ph.color)}" stroke-width="${crit ? 1.8 : 1}"/>
      <rect x="${x1}" y="${cy - 8}" width="${(x2 - x1) * k.progress / 100}" height="16" rx="3" fill="${esc(ph.color)}"/></g>
      <text x="${x2 + 6}" y="${cy + 4}" font-size="10.5" fill="${st === 'late' ? 'var(--bad)' : 'var(--muted)'}" font-family="var(--f-mono)">${esc(k.owner)}${k.owner ? ' · ' : ''}${k.points}${st === 'late' ? ' · !' : ''}</text>`;
  });
  if (mode === 'master' && showDeps) {
    let dp = '';
    P.tasks.forEach(k => k.deps.forEach(d => {
      const a = rowY.get(d), b2 = rowY.get(k.id); if (!a || !b2) return;
      const crit = showCrit && cp.critical.has(k.id) && cp.critical.has(d);
      const midX = Math.max(a.x2 + 4, Math.min(b2.x1 - 6, a.x2 + 10));
      dp += `<path d="M${a.x2} ${a.cy}H${midX}V${b2.cy}H${b2.x1 - 1}" fill="none" stroke="${crit ? 'var(--ink)' : 'var(--muted)'}" stroke-opacity="${crit ? .85 : .45}" stroke-width="1.1" marker-end="url(#arr${crit ? 'C' : ''})"/>`;
    }));
    R = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker><marker id="arrC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink)"/></marker></defs>` + R + dp;
  }
  if (now >= s && now <= e) R += `<line x1="${X(now) + dw / 2}" x2="${X(now) + dw / 2}" y1="19" y2="${H}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="${X(now) + dw / 2 - 42}" y="4" width="84" height="15" rx="7.5" fill="var(--accent)"/><text x="${X(now) + dw / 2}" y="15" text-anchor="middle" font-size="9.5" font-weight="600" fill="#fff" font-family="var(--f-display)" letter-spacing=".06em">${esc(t('today').toUpperCase())}</text>`;
  return { L, R, W, H };
}
function renderGantt() {
  const { L, R, W, H } = buildGantt(UI.gMode, UI.zoom, UI.deps, UI.crit);
  $('gLeft').innerHTML = `<svg width="400" height="${H}" viewBox="0 0 400 ${H}" role="img" aria-label="${esc(t(UI.gMode))}">${L}</svg>`;
  $('gRight').innerHTML = `<svg width="${W + 140}" height="${H}" viewBox="0 0 ${W + 140} ${H}" role="img" aria-label="${esc(t(UI.gMode))}">${R}</svg>`;
  $('gLegend').innerHTML = P.phases.map(p => `<span><svg width="12" height="12" viewBox="0 0 12 12"><rect width="12" height="12" rx="2" fill="${esc(p.color)}"/></svg>${esc(p.id + ' ' + nm(p))}</span>`).join('') +
    (UI.crit ? `<span><svg width="18" height="12" viewBox="0 0 18 12"><rect x="1" y="1" width="16" height="10" rx="2" fill="none" stroke="var(--ink)" stroke-width="2"/></svg>${esc(t('showCrit'))}</span>` : '') +
    `<span><svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0l5 5l-5 5l-5-5z" fill="var(--ink)"/></svg>${esc(t('milestone'))}</span>`;
}

/* ---------- tasks ---------- */
function renderTasks() {
  const now = nowT(), cp = C.criticalPath(P);
  $('taskCount').textContent = `${P.tasks.length} ${t('kTasks')} · ${C.totalPoints(P)} ${t('pts')}`;
  $('tf-phase').innerHTML = P.phases.map(p => `<option value="${esc(p.id)}">${esc(p.id + ' · ' + nm(p))}</option>`).join('');
  $('edTitle').textContent = editing ? `${t('editTask')} ${editing}` : t('addTask');
  $('tfSave').textContent = editing ? t('saveTask') : t('addBtn');
  $('tfCancel').hidden = !editing;
  let rows = '';
  const groups = [...P.phases.map(p => ({ p, ts: P.tasks.filter(k => k.phase === p.id) })), { p: null, ts: P.tasks.filter(k => !P.phases.some(p => p.id === k.phase)) }];
  groups.forEach(({ p, ts }) => {
    if (!ts.length) return;
    if (p) rows += `<tr class="phase-row"><td colspan="9"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${esc(p.color)};margin-right:8px"></span>${esc(p.id + ' · ' + nm(p))}</td></tr>`;
    ts.forEach(k => {
      const st = taskStatus(k, now);
      rows += `<tr><td class="tid">${esc(k.id)}${cp.critical.has(k.id) ? ' <span title="' + esc(t('showCrit')) + '" style="color:var(--bad)">●</span>' : ''}</td>
        <td style="min-width:220px">${esc(nm(k))}${k.deps.length ? `<br><span class="hint mono">← ${esc(k.deps.join(', '))}</span>` : ''}</td>
        <td>${esc(k.owner)}</td><td class="num">${esc(dLabel(C.parseDate(k.start)))}</td><td class="num">${esc(dLabel(C.parseDate(k.end)))}</td>
        <td class="r num">${k.points}</td>
        <td><span class="pbar"><i style="width:${k.progress}%;background:${esc(phaseOf(k.phase).color)}"></i></span> <span class="num hint">${k.progress}%</span></td>
        <td><span class="chip c-${st}">${esc(t(statusKey[st]))}</span></td>
        <td><div class="row-actions">${k.done ? '' : `<button class="btn sm" type="button" data-act="done" data-id="${esc(k.id)}">${esc(t('markDone'))}</button>`}
          <button class="btn sm" type="button" data-act="edit" data-id="${esc(k.id)}">${esc(t('edit'))}</button>
          <button class="btn sm danger" type="button" data-act="del" data-id="${esc(k.id)}">${esc(t('del'))}</button></div></td></tr>`;
    });
  });
  $('taskTable').innerHTML = `<thead><tr><th>ID</th><th>${esc(t('task'))}</th><th>${esc(t('owner'))}</th><th>${esc(t('start'))}</th><th>${esc(t('end'))}</th><th class="r">${esc(t('points'))}</th><th>${esc(t('progress'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${rows}</tbody>`;
}

function fillForm(k) {
  editing = k ? k.id : null;
  $('tf-id').value = k ? k.id : nextId('T', P.tasks);
  $('tf-id').readOnly = !!k;
  $('tf-phase').value = k ? k.phase : (P.phases[0] ? P.phases[0].id : '');
  $('tf-owner').value = k ? k.owner : '';
  $('tf-points').value = k ? k.points : 3;
  $('tf-fr').value = k ? k.fr : ''; $('tf-en').value = k ? k.en : '';
  $('tf-start').value = k ? k.start : C.fmt(nowT()); $('tf-end').value = k ? k.end : C.fmt(C.addDays(nowT(), 4));
  $('tf-progress').value = k ? k.progress : 0; $('tf-pv').textContent = $('tf-progress').value + '%';
  $('tf-done').value = k ? k.done : ''; $('tf-deps').value = k ? k.deps.join(', ') : '';
  $('tfErr').textContent = '';
  renderTasks();
}
function nextId(prefix, list) { let n = list.length + 1; while (list.some(x => x.id === prefix + n)) n++; return prefix + n; }

$('tf-progress').addEventListener('input', () => { $('tf-pv').textContent = $('tf-progress').value + '%'; });
$('taskForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const err = m => { $('tfErr').textContent = m; $('tfErr').className = 'err'; };
  const id = $('tf-id').value.trim();
  if (!/^[A-Za-z0-9_-]{1,16}$/.test(id)) return err(t('eId'));
  if (!editing && P.tasks.some(k => k.id === id)) return err(t('eIdTaken'));
  if (!$('tf-fr').value.trim()) return err(t('eName'));
  const s = C.parseDate($('tf-start').value), e = C.parseDate($('tf-end').value);
  if (s === null || e === null || e < s) return err(t('eDates'));
  const done = $('tf-done').value;
  if (done && C.parseDate(done) === null) return err(t('eDoneDate'));
  const deps = $('tf-deps').value.split(/[,;\s]+/).map(x => x.trim()).filter(Boolean);
  const unknown = deps.filter(d => d === id || !P.tasks.some(k => k.id === d));
  if (unknown.length) return err(t('eDeps') + unknown.join(', '));
  if (C.createsCycle(P.tasks, id, deps)) return err(t('eCycle'));
  const task = { id, phase: $('tf-phase').value, owner: $('tf-owner').value, points: $('tf-points').value,
    fr: $('tf-fr').value, en: $('tf-en').value, start: $('tf-start').value, end: $('tf-end').value,
    progress: done ? 100 : $('tf-progress').value, done, deps };
  const list = editing ? P.tasks.map(k => k.id === editing ? task : k) : [...P.tasks, task];
  const r = C.validateProject({ ...P, tasks: list });
  if (!r.project || r.project.tasks.length !== list.length) return err(t('eInvalid') + r.errors.join(', '));
  P = r.project;
  const warn = deps.filter(d => C.parseDate(P.tasks.find(k => k.id === d).end) >= s);
  commit();
  fillForm(null);
  if (warn.length) { $('tfErr').textContent = `${id} — ${t('fsWarn')}${warn.join(', ')}`; $('tfErr').className = 'err'; }
  else { $('tfErr').textContent = t('saved'); $('tfErr').className = 'ok'; }
});
$('tfCancel').addEventListener('click', () => fillForm(null));
let pendingDel = null;
$('taskTable').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-act]'); if (!b) return;
  const id = b.dataset.id, k = P.tasks.find(x => x.id === id); if (!k) return;
  if (b.dataset.act === 'edit') { fillForm(k); $('taskForm').scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  if (b.dataset.act === 'done') { k.done = C.fmt(nowT()); k.progress = 100; commit(); }
  if (b.dataset.act === 'del') {
    if (pendingDel !== id) { pendingDel = id; b.textContent = t('confirmDel'); return; }
    pendingDel = null;
    P.tasks = P.tasks.filter(x => x.id !== id);
    P.tasks.forEach(x => { x.deps = x.deps.filter(d => d !== id); });
    if (editing === id) editing = null;
    commit();
  }
});

/* ---------- project settings ---------- */
function renderProject() {
  $('pf-mode').innerHTML = `<option value="progress">${esc(t('bmProgress'))}</option><option value="done">${esc(t('bmDone'))}</option>`;
  $('pf-name').value = P.name; $('pf-code').value = P.code; $('pf-start').value = P.start; $('pf-end').value = P.end;
  $('pf-status').value = P.statusDate; $('pf-wd').checked = P.workingDays; $('pf-mode').value = P.burnMode;
  $('phaseRows').innerHTML = P.phases.map((p, i) => phaseRow(p, i)).join('');
  $('msRows').innerHTML = P.milestones.map((m, i) => msRow(m, i)).join('');
}
const phaseRow = (p, i) => `<div class="edit-row" data-row="${i}"><input aria-label="ID" class="ph-id" value="${esc(p.id)}" maxlength="16"><input aria-label="FR" class="ph-fr" value="${esc(p.fr)}" maxlength="80" placeholder="FR"><input aria-label="EN" class="ph-en" value="${esc(p.en)}" maxlength="80" placeholder="EN"><input aria-label="Color" class="ph-color" type="color" value="${esc(p.color)}"><button class="btn sm danger" type="button" data-rm>${esc(t('remove'))}</button></div>`;
const msRow = (m, i) => `<div class="edit-row" data-row="${i}"><input aria-label="ID" class="ms-id" value="${esc(m.id)}" maxlength="16"><input aria-label="FR" class="ms-fr" value="${esc(m.fr)}" maxlength="80" placeholder="FR"><input aria-label="EN" class="ms-en" value="${esc(m.en)}" maxlength="80" placeholder="EN"><input aria-label="Date" class="ms-date" type="date" value="${esc(m.date)}"><button class="btn sm danger" type="button" data-rm>${esc(t('remove'))}</button></div>`;
['phaseRows', 'msRows'].forEach(id => $(id).addEventListener('click', ev => { if (ev.target.closest('[data-rm]')) ev.target.closest('.edit-row').remove(); }));
$('addPhase').addEventListener('click', () => $('phaseRows').insertAdjacentHTML('beforeend', phaseRow({ id: nextId('P', [...document.querySelectorAll('.ph-id')].map(x => ({ id: x.value }))), fr: '', en: '', color: '#8556F7' }, 0)));
$('addMs').addEventListener('click', () => $('msRows').insertAdjacentHTML('beforeend', msRow({ id: nextId('M', [...document.querySelectorAll('.ms-id')].map(x => ({ id: x.value }))), fr: '', en: '', date: C.fmt(nowT()) }, 0)));
$('savePhases').addEventListener('click', () => {
  const phases = [...document.querySelectorAll('#phaseRows .edit-row')].map(r => ({ id: r.querySelector('.ph-id').value.trim(), fr: r.querySelector('.ph-fr').value, en: r.querySelector('.ph-en').value, color: r.querySelector('.ph-color').value }));
  const r = C.validateProject({ ...P, phases });
  if (r.errors.some(x => x.startsWith('phase'))) { $('phErr').textContent = t('eRows'); $('phErr').className = 'err'; return; }
  P = r.project; commit(); $('phErr').textContent = t('saved'); $('phErr').className = 'ok';
});
$('saveMs').addEventListener('click', () => {
  const milestones = [...document.querySelectorAll('#msRows .edit-row')].map(r => ({ id: r.querySelector('.ms-id').value.trim(), fr: r.querySelector('.ms-fr').value, en: r.querySelector('.ms-en').value, date: r.querySelector('.ms-date').value }));
  const r = C.validateProject({ ...P, milestones });
  if (r.errors.some(x => x.startsWith('milestone'))) { $('msErr').textContent = t('eRows'); $('msErr').className = 'err'; return; }
  P = r.project; commit(); $('msErr').textContent = t('saved'); $('msErr').className = 'ok';
});
$('projForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const r = C.validateProject({ ...P, name: $('pf-name').value, code: $('pf-code').value, start: $('pf-start').value, end: $('pf-end').value, statusDate: $('pf-status').value, workingDays: $('pf-wd').checked, burnMode: $('pf-mode').value });
  const bad = r.errors.filter(x => ['start', 'end', 'range', 'statusDate'].includes(x));
  if (bad.length) { $('pfErr').textContent = bad.includes('range') ? t('eRange') : t('eDates'); $('pfErr').className = 'err'; return; }
  P = r.project; commit(); $('pfErr').textContent = t('saved'); $('pfErr').className = 'ok';
});

/* ---------- import / export ---------- */
const msg = (m, ok) => { $('dataMsg').textContent = m; $('dataMsg').className = ok ? 'ok' : 'err'; };
$('btnExport').addEventListener('click', () => { $('jsonBox').value = JSON.stringify(P, null, 2); msg('', true); });
$('btnCsv').addEventListener('click', () => { $('jsonBox').value = GanttIO.toCSV(P); msg('', true); });
$('btnMermaid').addEventListener('click', () => { $('jsonBox').value = GanttIO.toMermaid(P, UI.lang, nowT()); msg('', true); });
$('btnTemplate').addEventListener('click', () => { $('jsonBox').value = GanttIO.CSV_TEMPLATE; msg('', true); });
$('gImport').addEventListener('click', () => { UI.tab = 'project'; persist(); renderChrome(); $('jsonBox').focus(); $('jsonBox').scrollIntoView?.({ behavior: 'smooth', block: 'center' }); });
$('btnCopy').addEventListener('click', () => {
  if (!$('jsonBox').value) $('jsonBox').value = JSON.stringify(P, null, 2);
  const box = $('jsonBox');
  const fallback = () => { box.focus(); box.select(); msg(t('copyFail'), false); };
  try { navigator.clipboard.writeText(box.value).then(() => msg(t('copied'), true), fallback); } catch { fallback(); }
});
function importText(txt) {
  if (txt.length > 2e6) return msg(t('eSize'), false);
  const fmt = GanttIO.detect(txt);
  let raw;
  try {
    if (fmt === 'json') raw = JSON.parse(txt);
    else if (fmt === 'mermaid') raw = GanttIO.fromMermaid(txt);
    else raw = GanttIO.fromCSV(txt);
  } catch (e) {
    const m = { 'csv-columns': 'eCsvCols', 'csv-empty': 'eCsvCols', 'no-tasks': 'eNoTasks', mermaid: 'eMermaid', size: 'eSize' }[e.message];
    return msg(t(m || 'eBadJson'), false);
  }
  const r = C.validateProject(raw);
  if (!r.project || (fmt === 'json' && !r.ok)) return msg(t('eInvalid') + r.errors.slice(0, 8).join(', '), false);
  if (!r.project.tasks.length) return msg(t('eNoTasks'), false);
  emit('replace', 'import'); EMPTY = false;
  if (PM.isEmpty(r.project.pm) && r.project.tasks.length) r.project.pm = PM.generate(r.project, UI.lang, []);
  P = r.project; editing = null; UI.tab = 'gantt'; commit(); toast(t('imported'));
  const skipped = (raw.tasks || []).length - P.tasks.length;
  msg(`${t('importedN')}${t({ json: 'fmtJson', csv: 'fmtCsv', mermaid: 'fmtMermaid' }[fmt])} · ${P.tasks.length} ${t('kTasks')}${skipped > 0 ? ` (−${skipped})` : ''}${r.errors.includes('cycle') ? ' · ' + t('eCycle') : ''}`, true);
}
$('btnImport').addEventListener('click', () => importText($('jsonBox').value));
$('fileIn').addEventListener('change', ev => {
  const f = ev.target.files[0]; if (!f) return;
  if (f.size > 2e6) return msg(t('eSize'), false);
  const rd = new FileReader(); rd.onload = () => { $('jsonBox').value = String(rd.result); importText(String(rd.result)); }; rd.readAsText(f);
  ev.target.value = '';
});
let armed = null;
const twoStep = (btn, fn) => btn.addEventListener('click', () => {
  if (armed !== btn) { armed = btn; msg(t('sure'), false); setTimeout(() => { if (armed === btn) { armed = null; msg('', true); } }, 4000); return; }
  armed = null; fn();
});
twoStep($('btnSample'), () => { emit('replace', 'sample'); EMPTY = false; P = sampleProject(); editing = null; commit(); msg(t('imported'), true); });
twoStep($('btnBlank'), () => {
  emit('replace', 'blank'); EMPTY = false;
  const s = nowT();
  P = C.validateProject({ name: t('blankName'), code: '', start: C.fmt(s), end: C.fmt(C.addDays(s, 56)), statusDate: '', workingDays: true,
    phases: [{ id: 'P1', fr: 'Phase 1', en: 'Phase 1', color: '#8556F7' }], milestones: [], tasks: [] }).project;
  editing = null; commit(); msg(t('saved'), true);
});


/* ---------- document downloads ---------- */
const LIGHT = { bg: '#ffffff', surface: '#ffffff', sunk: '#f7f8fb', ink: '#141112', muted: '#5E585A', line: '#d7dde6', grid: '#e9edf3', accent: '#6B3FE0',
  'accent-soft': 'rgba(107,63,224,.10)', ideal: '#8f9bb0', good: '#16865a', warn: '#b86e00', bad: '#c42f3a', 'good-soft': 'rgba(22,134,90,.12)',
  'warn-soft': 'rgba(184,110,0,.13)', 'bad-soft': 'rgba(196,47,58,.12)', 'f-display': 'Arial, Helvetica, sans-serif', 'f-body': 'Arial, Helvetica, sans-serif', 'f-mono': 'Consolas, Courier New, monospace' };
const literal = s => s.replace(/var\(--([a-z-]+)\)/g, (m, k) => LIGHT[k] || '#142033');
function ganttSvg(mode) {
  const { L, R, W, H } = buildGantt(mode, 10, true, true), w = 400 + W + 150;
  return { svg: literal(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}"><rect width="${w}" height="${H}" fill="#ffffff"/><g>${L}</g><g transform="translate(400,0)">${R}</g></svg>`), W: w, H };
}
function burndownSvg() {
  if (!lastBurndown) renderBurndown();
  const { svg, W, H } = lastBurndown;
  return { svg: literal(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>${svg}</svg>`), W, H };
}
function toPng({ svg, W, H }, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = Math.round(W * scale); c.height = Math.round(H * scale);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? b.arrayBuffer().then(buf => resolve({ bytes: new Uint8Array(buf), w: c.width, h: c.height })) : reject(new Error('png')), 'image/png');
    };
    img.onerror = () => reject(new Error('svg'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
// Inside the Claude viewer, files go through its `downloads` capability; on a normal site, a blob link.
const dlCap = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
async function saveFile(bytes, name, type) {
  const blob = new Blob([bytes], { type }), cap = await dlCap;
  if (cap) {
    try { await cap.save({ filename: name, data: blob }); return 'saved'; }
    catch (e) { if (e && e.code === 'declined') return 'declined'; if (e && e.code === 'rate_limited') return 'busy'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'saved';
}
const slug = s => String(s).replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'projet';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
async function download(kind, st = $('dlStatus')) {
  st = st || $('dlStatus'); st.textContent = t('generating'); st.className = 'dl-status';
  const report = (r, name) => { const m = r === 'saved' ? t('downloaded') + name : r === 'declined' ? t('dlDeclined') : t('dlBusy'); st.textContent = m; st.className = 'dl-status' + (r === 'saved' ? '' : ' err'); toast(m, r !== 'saved'); };
  try {
    const base = slug(P.code || P.name);
    if (['needs', 'technical', 'report'].includes(kind)) {
      const imgs = {};
      imgs.summary = await toPng(ganttSvg('summary'));
      if (kind !== 'needs') imgs.master = await toPng(ganttSvg('master'), 1.6);
      if (kind === 'report') imgs.burndown = await toPng(burndownSvg());
      const d = DocGen.assemble(kind, P, UI.lang, todayT(), imgs);
      report(await saveFile(d.bytes, d.name, DOCX), d.name);
    } else if (kind === 'gs' || kind === 'gm' || kind === 'bd') {
      const png = await toPng(kind === 'bd' ? burndownSvg() : ganttSvg(kind === 'gs' ? 'summary' : 'master'));
      const name = `${base}-${kind === 'bd' ? 'burndown' : kind === 'gs' ? 'gantt-summary' : 'gantt-master'}.png`;
      report(await saveFile(png.bytes, name, 'image/png'), name);
    } else if (kind === 'csv') report(await saveFile(new TextEncoder().encode('\uFEFF' + GanttIO.toCSV(P)), `${base}-gantt.csv`, 'text/csv'), `${base}-gantt.csv`);
    else if (kind === 'json') report(await saveFile(new TextEncoder().encode(JSON.stringify(P, null, 2)), `${base}.json`, 'application/json'), `${base}.json`);
  } catch (e) { console.warn('download failed', e); st.textContent = t('dlError'); st.className = 'dl-status err'; }
}
const menu = $('dlMenu'), dlBtn = $('dlBtn');
const setMenu = open => { menu.hidden = !open; dlBtn.setAttribute('aria-expanded', open); if (open) menu.querySelector('button').focus(); };
dlBtn.addEventListener('click', ev => { ev.stopPropagation(); setMenu(menu.hidden); });
menu.addEventListener('click', ev => { const b = ev.target.closest('[data-dl]'); if (!b) return; ev.stopPropagation(); download(b.dataset.dl); });
document.addEventListener('click', ev => { if (!menu.hidden && !ev.target.closest('#dl')) setMenu(false); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !menu.hidden) { setMenu(false); dlBtn.focus(); } });
dlCap.then(cap => { let framed = true; try { framed = window.top !== window.self; } catch { /* cross-origin */ } $('dlFrameNote').hidden = !!cap || !framed; });

function renderDocsEditor() {
  const F = DocGen.FIELDS, d = (P.docs && P.docs[UI.lang]) || {};
  $('docLangNote').textContent = t(UI.lang === 'fr' ? 'docLangFr' : 'docLangEn');
  $('docFields').innerHTML = `<div class="f"><label for="doc-author">${esc(t('author'))}</label><input id="doc-author" maxlength="200" value="${esc(d.author || '')}"></div>
    <div class="f"><label for="doc-sponsor">${esc(t('sponsor'))}</label><input id="doc-sponsor" maxlength="200" value="${esc(d.sponsor || '')}"></div>` +
    F.map(([k, fr, en]) => `<div class="f wide"><label for="doc-${k}">${esc(UI.lang === 'fr' ? fr : en)}</label><textarea id="doc-${k}" class="doc-ta" rows="4" maxlength="20000" spellcheck="true" lang="${UI.lang}">${esc(d[k] || '')}</textarea></div>`).join('');
}
$('saveDocs').addEventListener('click', () => {
  const set = { author: $('doc-author').value, sponsor: $('doc-sponsor').value };
  DocGen.FIELDS.forEach(([k]) => { set[k] = $('doc-' + k).value; });
  const docs = { fr: { ...((P.docs || {}).fr || {}) }, en: { ...((P.docs || {}).en || {}) } };
  docs[UI.lang] = set;
  P = C.validateProject({ ...P, docs }).project; commit();
  $('docMsg').textContent = t('saved'); $('docMsg').className = 'ok';
});


/* ---------- project assistant ---------- */
let prevProject = null, lastGen = null;
const sampleCap = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
sampleCap.then(s => { $('wzAiWrap').hidden = !s; });
function renderAssistant() {
  { const [h1, h2] = t('wzTitle').split(/,\s*/); $('wzTitleEl').innerHTML = h2 ? `${esc(h1)}, <em>${esc(h2)}</em>` : esc(h1); }
  $('wz-desc').placeholder = t('wzPh'); $('wzGo').textContent = t('wzGo');
  $('wzChips').innerHTML = t('wzChips').map(c => `<button type="button" data-chip="${esc(c)}">${esc(c)}</button>`).join('');
  const sel = $('wz-type'), cur = sel.value || 'auto';
  sel.innerHTML = `<option value="auto">${esc(t('wzAuto'))}</option>` + Generator.types().map(x => `<option value="${esc(x.id)}">${esc(UI.lang === 'fr' ? x.fr : x.en)}</option>`).join('');
  sel.value = cur;
  ['small', 'medium', 'large'].forEach(s => { const b = $('sz-' + s); b.textContent = t('sz' + s[0].toUpperCase() + s.slice(1)); b.setAttribute('aria-pressed', UI.wzSize === s); });
  if (!$('wz-start').value) { let x = C.addDays(todayT(), 1); while (new Date(x).getUTCDay() !== 1) x = C.addDays(x, 1); $('wz-start').value = C.fmt(x); }
  showDetect();
  if (lastGen) renderResult();
}
function showDetect() {
  const v = $('wz-desc').value.trim(), el = $('wzDetect');
  if (!v) { el.textContent = t('wzNone'); return; }
  const id = $('wz-type').value !== 'auto' ? $('wz-type').value : Generator.detect(v).id, tp = Generator.types().find(x => x.id === id);
  el.innerHTML = `${esc(t('wzDetected'))}<b>${esc(UI.lang === 'fr' ? tp.fr : tp.en)}</b>`;
}
function renderResult() {
  const p = P, weeks = Math.ceil((C.diffDays(C.parseDate(p.start), C.parseDate(p.end)) + 1) / 7);
  $('wzResult').hidden = false;
  $('wzResTitle').textContent = t('wzDone') + p.name;
  const st = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`;
  $('wzStats').innerHTML = st('wzStType', UI.lang === 'fr' ? lastGen.fr : lastGen.en) + st('wzStDur', `${weeks} ${t('weeksU')}`) +
    st('wzStDates', `${dLabel(C.parseDate(p.start))} → ${dLabel(C.parseDate(p.end), true)}`) + st('wzStTasks', String(p.tasks.length)) +
    st('wzStPts', String(C.totalPoints(p))) + st('wzStMs', String(p.milestones.length)) +
    (B => st('kBudget', eurF(B.total)) + st('bTeam', `${B.people} ${t('persons')} · ${B.personDays} ${t('bPd')}`))(Budget.compute(p, todayT()));
  $('wzUndo').hidden = !prevProject;
}
$('wz-desc').addEventListener('input', showDetect);
$('wz-type').addEventListener('change', showDetect);
$('wzChips').addEventListener('click', ev => { const b = ev.target.closest('[data-chip]'); if (!b) return; $('wz-desc').value = b.dataset.chip; showDetect(); $('wz-desc').focus(); });
$('wzSize').addEventListener('click', ev => { const b = ev.target.closest('[data-size]'); if (!b) return; UI.wzSize = b.dataset.size; persist(); renderAssistant(); });
$('wzGo').addEventListener('click', async () => {
  const desc = $('wz-desc').value.trim(), msgEl = $('wzMsg');
  if (desc.length < 3) { msgEl.textContent = t('wzEmpty'); msgEl.className = 'err'; $('wz-desc').focus(); return; }
  $('wzGo').disabled = true; msgEl.textContent = ''; msgEl.className = '';
  let custom = null;
  try {
    const s = await sampleCap;
    if (s && $('wzAi').checked) {
      msgEl.textContent = t('wzAiRun');
      try { custom = Generator.fromAI(await s.json(Generator.aiPrompt(desc, UI.lang), { modelTier: 'default' })); } catch { custom = null; }
      msgEl.textContent = custom ? '' : t('wzAiFail');
    }
    const typeSel = $('wz-type').value;
    if (custom && typeSel !== 'auto') custom.typeId = typeSel;
    const out = Generator.build({ description: desc, client: $('wz-client').value.trim(), start: $('wz-start').value, size: UI.wzSize,
      typeId: typeSel === 'auto' ? undefined : typeSel, lang: UI.lang, custom });
    const r = C.validateProject(out.project);
    if (!r.ok) throw new Error(r.errors.join(','));
    emit('replace', 'assistant');
    prevProject = EMPTY ? null : P; EMPTY = false; lastGen = out.type; P = r.project; editing = null;
    commit(); renderResult(); toast(t('wzDone') + P.name);
    $('wzResult').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  } catch (e) { console.warn('generation failed', e); msgEl.textContent = t('dlError'); msgEl.className = 'err'; }
  finally { $('wzGo').disabled = false; }
});
$('wzUndo').addEventListener('click', () => { if (!prevProject) return; emit('undo'); P = prevProject; prevProject = null; lastGen = null; $('wzResult').hidden = true; commit(); $('wzMsg').textContent = t('wzUndone'); $('wzMsg').className = 'ok'; });
$('wzResult').addEventListener('click', ev => { const b = ev.target.closest('[data-wdl]'); if (b) download(b.dataset.wdl, $('wzDlStatus')); });
$('wzSeeBrain').addEventListener('click', () => { UI.tab = 'brain'; persist(); renderChrome(); });
$('wzSeeGantt').addEventListener('click', () => { UI.tab = 'gantt'; UI.gMode = 'master'; persist(); renderChrome(); renderGantt(); });
$('wzEdit').addEventListener('click', () => { UI.tab = 'project'; persist(); renderChrome(); $('doc-context')?.focus(); });
$('newBtn').addEventListener('click', () => { UI.tab = 'assistant'; persist(); renderChrome(); $('wz-desc').focus(); });

/* ---------- toasts ---------- */
function toast(msg, err) {
  const el = document.createElement('div'); el.className = 'toast' + (err ? ' err' : ''); el.setAttribute('role', 'status'); el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}

/* ---------- command bar (⌘K / Ctrl K) ---------- */
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
let cmdItems = [], cmdSel = 0, cmdReturn = null;
function cmdActions() {
  const go = (id, k, ic) => ({ label: `${t('cmdGo')} ${t(k)}`, ic, run: () => { UI.tab = id; if (id === 'burndown') animateBd = true; persist(); renderChrome(); if (id === 'burndown') renderBurndown(); } });
  if (EMPTY) return [{ label: t('newProject'), ic: '+', run: () => { UI.tab = 'assistant'; persist(); renderChrome(); $('wz-desc').focus(); } }, ...extraTabs.before.concat(extraTabs.after).map(([id, k]) => go(id, k, '·')), { label: t('cmdLang'), ic: UI.lang === 'fr' ? 'EN' : 'FR', run: () => { UI.lang = UI.lang === 'fr' ? 'en' : 'fr'; persist(); renderAll(); } }];
  return [
    ...(RO ? [] : [{ label: t('newProject'), ic: '+', hint: '', run: () => { UI.tab = 'assistant'; persist(); renderChrome(); $('wz-desc').focus(); } }]),
    go('brain', 'tabBrain', '◎'), ...(RO ? [] : [go('assistant', 'tabAssistant', 'A')]), go('burndown', 'tabBurndown', 'B'), go('gantt', 'tabGantt', 'G'), go('tasks', 'tabTasks', 'T'), go('pm', 'tabPm', 'R'), go('budget', 'tabBudget', '€'), ...(RO ? [] : [go('project', 'tabProject', 'P')]), ...extraTabs.before.concat(extraTabs.after).map(([id, k]) => go(id, k, k[3] || '·')),
    ...[['needs', 'dlNeeds', '.docx'], ['technical', 'dlTech', '.docx'], ['report', 'dlReport', '.docx'], ['gs', 'dlGs', '.png'], ['gm', 'dlGm', '.png'], ['bd', 'dlBd', '.png'], ['csv', 'dlCsv', '.csv'], ['json', 'dlJson', '.json']]
      .map(([kind, k, ext]) => ({ label: `${t('download')} · ${t(k)}`, ic: '↓', hint: ext, run: () => download(kind) })),
    { label: t('cmdLang'), ic: UI.lang === 'fr' ? 'EN' : 'FR', run: () => { UI.lang = UI.lang === 'fr' ? 'en' : 'fr'; commit(); } },
    { label: `${t('tabGantt')} · ${t('summary')}`, ic: 'G', run: () => { UI.tab = 'gantt'; UI.gMode = 'summary'; persist(); renderChrome(); renderGantt(); } },
    { label: `${t('tabGantt')} · ${t('master')}`, ic: 'G', run: () => { UI.tab = 'gantt'; UI.gMode = 'master'; persist(); renderChrome(); renderGantt(); } },
    ...(RO ? [] : [{ label: t('addTask'), ic: '+', run: () => { UI.tab = 'tasks'; persist(); renderChrome(); fillForm(null); $('tf-fr').focus(); } }])
  ];
}
const fold = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function renderCmd() {
  const q = fold($('cmdkIn').value.trim());
  cmdItems = cmdActions().filter(a => !q || q.split(/\s+/).every(w => fold(a.label).includes(w)));
  cmdSel = Math.min(cmdSel, Math.max(0, cmdItems.length - 1));
  $('cmdkList').innerHTML = cmdItems.length ? cmdItems.map((a, i) => `<li role="option" id="cmd-${i}" data-i2="${i}" aria-selected="${i === cmdSel}"><span class="ci">${esc(a.ic)}</span>${esc(a.label)}${a.hint ? `<small>${esc(a.hint)}</small>` : ''}</li>`).join('')
    : `<li class="cmdk-empty" role="option" aria-disabled="true">${esc(t('cmdEmpty'))}</li>`;
  $('cmdkIn').setAttribute('aria-activedescendant', cmdItems.length ? 'cmd-' + cmdSel : '');
  $('cmd-' + cmdSel)?.scrollIntoView?.({ block: 'nearest' });
}
function openCmd() { cmdReturn = document.activeElement; $('cmdk').hidden = false; $('cmdkIn').value = ''; $('cmdkIn').placeholder = t('cmdPh'); cmdSel = 0; renderCmd(); $('cmdkIn').focus(); }
function closeCmd() { $('cmdk').hidden = true; cmdReturn?.focus?.(); }
function runCmd(i) { const a = cmdItems[i]; if (!a) return; closeCmd(); a.run(); }
$('cmdKey').textContent = isMac ? '⌘K' : 'Ctrl K';
$('cmdBtn').addEventListener('click', openCmd);
$('cmdkIn').addEventListener('input', () => { cmdSel = 0; renderCmd(); });
$('cmdkIn').addEventListener('keydown', ev => {
  if (ev.key === 'ArrowDown') { ev.preventDefault(); cmdSel = (cmdSel + 1) % Math.max(1, cmdItems.length); renderCmd(); }
  else if (ev.key === 'ArrowUp') { ev.preventDefault(); cmdSel = (cmdSel - 1 + cmdItems.length) % Math.max(1, cmdItems.length); renderCmd(); }
  else if (ev.key === 'Enter') { ev.preventDefault(); runCmd(cmdSel); }
  else if (ev.key === 'Tab') ev.preventDefault();
});
$('cmdkList').addEventListener('click', ev => { const li = ev.target.closest('[data-i2]'); if (li) runCmd(Number(li.dataset.i2)); });
$('cmdk').addEventListener('click', ev => { if (ev.target.closest('[data-close]')) closeCmd(); });
document.addEventListener('keydown', ev => {
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); $('cmdk').hidden ? openCmd() : closeCmd(); }
  else if (ev.key === 'Escape' && !$('cmdk').hidden) closeCmd();
});

/* ---------- cursor spotlight on glass cards ---------- */
let spotRaf = 0;
document.addEventListener('pointermove', ev => {
  if (reduceMotion || spotRaf) return;
  spotRaf = requestAnimationFrame(() => {
    spotRaf = 0;
    const el = ev.target.closest && ev.target.closest('.card, .kpi, .wiz-main'); if (!el) return;
    const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
  });
}, { passive: true });

/* ---------- wiring ---------- */
function renderAll() {
  const fa = document.activeElement, fid = fa && fa.id, sel = fa && typeof fa.selectionStart === 'number' ? [fa.selectionStart, fa.selectionEnd] : null;
  renderAllInner();
  if (fid && document.activeElement !== $(fid) && $(fid)) { const el = $(fid); el.focus({ preventScroll: true }); if (sel && typeof el.setSelectionRange === 'function') try { el.setSelectionRange(sel[0], sel[1]); } catch { /* number inputs */ } }
}
function lockReadOnly() {
  if (!RO) return;
  document.querySelectorAll('#tab-budget input, #tab-budget select, #tab-budget button, #taskTable button').forEach(el => { el.disabled = true; });
}
function renderAllInner() { renderChrome(); renderKpis(); renderBurndown(); renderFocus(); renderGantt(); renderTasks(); renderProject(); renderDocsEditor(); renderAssistant(); renderBudget(); if (!editing) fillFormSilent(); lockReadOnly(); hooks.render.forEach(f => f()); }
function fillFormSilent() { const keep = editing; if (!keep && !$('tf-fr').value) { $('tf-id').value = nextId('T', P.tasks); $('tf-id').readOnly = false; } }
function commit() {
  if (RO || EMPTY) { renderAll(); return; }
  P.history = C.recordHistory(P, nowT()); persist(); renderAll(); emit('commit', P);
}
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { UI.lang = b.dataset.lang; persist(); renderAll(); }));
$('tabs').addEventListener('click', ev => { const b = ev.target.closest('[data-tab]'); if (!b) return; UI.tab = b.dataset.tab; persist(); renderChrome(); if (UI.tab === 'burndown') { animateBd = true; renderBurndown(); } });
$('tabs').addEventListener('keydown', ev => {
  if (!['ArrowRight', 'ArrowLeft'].includes(ev.key)) return;
  const ids = visibleTabs().map(([id]) => id), i = ids.indexOf(UI.tab);
  UI.tab = ids[(i + (ev.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]; persist(); renderChrome(); $('tb-' + UI.tab).focus();
});
$('gMode').addEventListener('click', ev => { const b = ev.target.closest('[data-mode]'); if (!b) return; UI.gMode = b.dataset.mode; persist(); renderChrome(); renderGantt(); });
$('gZoom').addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (!b) return; UI.zoom = +b.dataset.z; persist(); renderChrome(); renderGantt(); });
$('optDeps').addEventListener('change', ev => { UI.deps = ev.target.checked; persist(); renderGantt(); });
$('optCrit').addEventListener('change', ev => { UI.crit = ev.target.checked; persist(); renderGantt(); });
/* ---------- API for the account / cloud layer ---------- */
const App = {
  get project() { return P; },
  get readOnly() { return RO; },
  ui: UI, t, esc, nm, toast, dLabel, eur: v => eurF(v), today: todayT, Core: C, persist,
  saveFile: (bytes, name, type) => saveFile(bytes, name, type),
  on(ev, fn) { hooks[ev].push(fn); },
  addStrings(fr, en) { Object.assign(I18N.fr, fr); Object.assign(I18N.en, en); },
  setProject(p, opts = {}) {
    const r = C.validateProject(p); if (!r.project) return false;
    P = r.project; editing = null; prevProject = null; lastGen = null; EMPTY = false;
    if (opts.tab) UI.tab = opts.tab;
    persist(); renderAll(); return true;
  },
  setExtraTabs(before, after) { extraTabs = { before: before || [], after: after || [] }; renderChrome(); },
  setReadOnly(on) { RO = !!on; renderAll(); },
  get empty() { return EMPTY; },
  setEmpty(on) { EMPTY = !!on; if (EMPTY) { UI.tab = 'assistant'; prevProject = null; lastGen = null; $('wzResult').hidden = true; } renderAll(); },
  mutate(fn) { if (RO || EMPTY) return; fn(P); const r = C.validateProject(P); if (r.project) P = r.project; commit(); },
  clearLocal() { try { localStorage.removeItem(STORE); } catch { /* storage unavailable */ } },
  sample: () => sampleProject(),
  goTab(id) { UI.tab = id; persist(); renderChrome(); if (id === 'burndown') { animateBd = true; renderBurndown(); } },
  renderAll: () => renderAll()
};
if (typeof PMUI !== 'undefined') PMUI.init(App);
if (typeof CloudUI !== 'undefined') CloudUI.init(App);
const hash = (location.hash || '').slice(1);
if (ALL_TABS.includes(hash)) UI.tab = hash;
renderAll(); fillForm(null);
})();
