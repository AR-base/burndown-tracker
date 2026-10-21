const SAMPLE = {
  name: 'ESAIP AI Assistant', code: 'EAA-2026',
  start: '2026-09-28', end: '2026-12-18', statusDate: '', workingDays: true,
  docs: {
    author: 'Pinninti Sai Anish — MSc Cybersecurity & Data Science, ESAIP',
    sponsor: 'Direction des formations ESAIP / DSI ESAIP',
    context: `Les réponses aux questions courantes des étudiants (vie de campus, aides financières, mobilité internationale, cadre CTI) sont dispersées entre le site, l’intranet et les e-mails ; les étudiants internationaux sont les plus touchés. / Answers to common student questions are scattered across the website, intranet and e-mail; international students are hit hardest.
L’assistant IA bilingue centralise ces réponses 24 h/24, en français et en anglais, avec des sources citées. / The bilingual AI assistant centralises those answers 24/7 in French and English, with cited sources.`,
    objectives: `# | Objectif / Objective | Indicateur / KPI | Cible / Target
O1 | Répondre juste et sourcé / Accurate, cited answers | Exactitude sur 100 questions / Accuracy on 100 questions | ≥ 85 %
O2 | Servir les deux langues / Serve both languages | Réponse dans la langue de la question / Reply in the question's language | 100 %
O3 | Réduire la charge des services / Reduce staff workload | E-mails répétitifs à la scolarité / Repeat e-mails | −30 % en 3 mois
O4 | Rester rapide / Stay fast | Latence p95 / p95 latency | < 4 s
O5 | Coûter moins qu’une licence / Cost less than a licence | Coût mensuel vs ChatGPT Team | Inférieur / Lower`,
    scope: `- Dans le périmètre / In scope : chat web FR/EN, base de connaissances ESAIP, panneau d’administration, déploiement, formation
- Hors périmètre / Out of scope : connexion à l’ENT, données personnelles d’étudiants, application mobile native`,
    stakeholders: `Partie prenante / Stakeholder | Rôle / Role | Attente / Expectation
Direction des formations | Sponsor | Moins de demandes répétitives / Fewer repeat requests
DSI ESAIP | Client interne, hébergement / Internal client, hosting | Sécurité, RGPD, coût maîtrisé / Security, GDPR, controlled cost
Étudiants (dont internationaux) | Utilisateurs / Users | Réponses rapides et fiables en FR/EN / Fast, reliable answers
Scolarité, relations internationales | Experts métier / Domain experts | Contenu exact et à jour / Accurate, current content`,
    functional: `ID | Exigence / Requirement | Priorité / Priority
EF1 | Détecter la langue et répondre dans la même / Detect language and reply in it | Must
EF2 | Citer la source de chaque réponse / Cite the source of every answer | Must
EF3 | Couvrir campus, aides, mobilité, CTI, logement, alumni / Cover campus, aid, mobility, CTI, housing, alumni | Must
EF4 | Dire « je ne sais pas » hors base et orienter vers un contact / Say "I don't know" outside the KB | Must
EF5 | Mettre à jour la base sans redéploiement / Update the KB without redeploying | Should
EF6 | Vote positif/négatif par réponse / Thumbs up/down per answer | Should
EF7 | Questions suggérées par thème / Suggested questions per topic | Could`,
    nonfunctional: `ID | Catégorie / Category | Exigence / Requirement
ENF1 | Performance | Latence p95 < 4 s, 50 utilisateurs simultanés / p95 < 4 s, 50 concurrent users
ENF2 | Sécurité / Security | OWASP Top 10 et OWASP LLM Top 10 couverts / covered
ENF3 | RGPD / GDPR | Aucune donnée personnelle stockée ; logs anonymisés 30 j / No personal data; anonymised logs 30 days
ENF4 | Accessibilité / Accessibility | RGAA / WCAG 2.1 AA
ENF5 | Disponibilité / Availability | 99 % hors maintenance / excluding maintenance
ENF6 | Maintenabilité / Maintainability | Couverture de tests ≥ 70 %, CI obligatoire / Test coverage ≥ 70 %, CI required`,
    constraints: `- Échéance fixe : soutenance le 18/12/2026 / Fixed deadline: defence on 18 Dec 2026
- Budget : hébergement Vercel gratuit, plafond mensuel de coût LLM / Budget: free Vercel hosting, monthly LLM cost cap
- Données : uniquement des contenus publics ESAIP / Data: public ESAIP content only`,
    architecture: `Architecture RAG en trois couches : interface web, API sécurisée, pipeline de connaissances. Le LLM ne répond qu’à partir des passages retrouvés. / Three-layer RAG architecture: web front end, secured API, knowledge pipeline. The LLM only answers from retrieved passages.
Composant / Component | Rôle / Role
Front-end Next.js (Vercel) | Chat bilingue, citations cliquables / Bilingual chat, clickable citations
API FastAPI | Validation des entrées, limitation de débit, orchestration RAG / Input validation, rate limiting, RAG orchestration
Garde-fous / Guardrails | Bloque l’injection de prompt, masque les données personnelles / Blocks prompt injection, masks personal data
Retriever + pgvector | Recherche hybride vecteurs + mots-clés, top-k = 5 / Hybrid vector + keyword search, top-k = 5
Ingestion | Découpage ~500 tokens, embeddings multilingues / ~500-token chunks, multilingual embeddings
Monitoring | Latence, taux de « je ne sais pas », votes / Latency, "I don't know" rate, votes`,
    stack: `Couche / Layer | Choix / Choice | Pourquoi / Why
Front-end | Next.js + TypeScript | i18n natif, hébergement Vercel / Built-in i18n, Vercel hosting
API | Python FastAPI + Pydantic | Validation stricte / Strict validation
Base vectorielle / Vector DB | PostgreSQL + pgvector | Une seule base / One database
LLM | API interchangeable / Swappable API | Pas de verrouillage fournisseur / No lock-in
Réseau / Network | Cloudflare | WAF, anti-bot, rate limit
CI/CD | GitHub Actions → Vercel | Tests et scan à chaque push / Tests and scan on every push`,
    security: `Menace / Threat | Mesure / Control
Injection de prompt / Prompt injection | Prompt système isolé, réponses limitées au contexte / Isolated system prompt, context-only answers
Fuite de données / Data leakage | Masquage des e-mails et numéros / Masking e-mails and numbers
XSS / injection SQL | Échappement, requêtes paramétrées, CSP stricte / Escaping, parameterised queries, strict CSP
Abus / Abuse | 20 requêtes/min par IP, plafond de coût / 20 req/min per IP, cost cap
Secrets | Variables d’environnement, scan GitLeaks en CI / Env variables, GitLeaks scan in CI`,
    testing: `Niveau / Level | Outil / Tool | Critère de sortie / Exit criterion
Unitaire / Unit | Pytest | Couverture ≥ 70 % / Coverage ≥ 70 %
Bout en bout / E2E | Playwright | Parcours FR et EN / FR and EN journeys pass
Qualité RAG / RAG quality | 100 questions | Exactitude ≥ 85 % / Accuracy ≥ 85 %
Sécurité / Security | OWASP ZAP + 30 attaques / attacks | 0 faille critique ou haute / 0 critical or high
Recette / UAT | 15 étudiants / students | Satisfaction ≥ 4/5`,
    deployment: `- Chaîne / Pipeline : branche → pull request → CI (tests + scan) → preview Vercel → production
- Sauvegarde quotidienne, 7 jours / Daily backup, 7 days
- Retour arrière en 1 clic sur Vercel / One-click rollback on Vercel
- Alerte si erreurs > 2 % ou p95 > 4 s pendant 10 min / Alert if errors > 2 % or p95 > 4 s for 10 min`,
    risks: `ID | Risque / Risk | P | I | Score | Réponse / Response
R1 | Réponses inventées par le LLM / Hallucinations | 4 | 5 | 20 | Réponses limitées au contexte + citations / Context-only answers + citations
R2 | Informations obsolètes / Outdated information | 4 | 4 | 16 | Panneau admin + date de mise à jour / Admin panel + last-updated date
R3 | Injection de prompt / Prompt injection | 3 | 4 | 12 | Garde-fous + 30 tests d’attaque / Guardrails + 30 attack tests
R5 | Retard du chemin critique / Critical-path slippage | 3 | 4 | 12 | Burndown hebdomadaire / Weekly burndown
R4 | Coût LLM / LLM cost | 3 | 3 | 9 | Plafond mensuel + cache / Monthly cap + cache`,
    conclusion: `- Clôturer T6 et T7 avant le 23/10 pour tenir M2 / Close T6 and T7 by 23 Oct to hold M2
- Démarrer T8 immédiatement, premier maillon critique / Start T8 now, first critical link
- Découper T9 (13 pts) en 3 sous-tâches hebdomadaires / Split T9 into 3 weekly sub-tasks
- Réaffecter 1 personne de T10 vers T8–T9 / Move 1 person from T10 to T8–T9
- Revue du burndown chaque vendredi ; alerte si SPI < 0,90 / Friday burndown review; alert if SPI < 0.90`
  },
  phases: [
    { id: 'P1', fr: 'Initialisation', en: 'Initiation', color: '#4f6bed' },
    { id: 'P2', fr: 'Conception', en: 'Design', color: '#0f9d8a' },
    { id: 'P3', fr: 'Développement', en: 'Build', color: '#d9811e' },
    { id: 'P4', fr: 'Tests et recette', en: 'Test and UAT', color: '#c2417a' },
    { id: 'P5', fr: 'Déploiement', en: 'Deployment', color: '#7a5af5' },
    { id: 'P6', fr: 'Clôture', en: 'Closure', color: '#5f7182' }
  ],
  milestones: [
    { id: 'M1', fr: 'Cahier des charges validé', en: 'Spec signed off', date: '2026-10-09' },
    { id: 'M2', fr: 'Gel de la conception', en: 'Design freeze', date: '2026-10-23' },
    { id: 'M3', fr: 'MVP', en: 'MVP', date: '2026-11-20' },
    { id: 'M4', fr: 'Recette validée', en: 'UAT passed', date: '2026-12-08' },
    { id: 'M5', fr: 'Mise en production', en: 'Go-live', date: '2026-12-11' },
    { id: 'M6', fr: 'Soutenance', en: 'Defence', date: '2026-12-18' }
  ],
  tasks: [
    { id: 'T1', phase: 'P1', fr: 'Lancement et entretiens', en: 'Kick-off and stakeholder interviews', owner: 'PM', start: '2026-09-28', end: '2026-10-02', points: 3, progress: 100, done: '2026-10-02', deps: [] },
    { id: 'T2', phase: 'P1', fr: 'Cahier des charges', en: 'Requirements specification', owner: 'PM', start: '2026-10-05', end: '2026-10-09', points: 5, progress: 100, done: '2026-10-09', deps: ['T1'] },
    { id: 'T3', phase: 'P1', fr: 'Registre des risques et RACI', en: 'Risk register and RACI', owner: 'PM', start: '2026-10-05', end: '2026-10-08', points: 2, progress: 100, done: '2026-10-08', deps: ['T1'] },
    { id: 'T4', phase: 'P2', fr: 'Architecture RAG et API', en: 'RAG and API architecture', owner: 'ARCH', start: '2026-10-12', end: '2026-10-16', points: 8, progress: 100, done: '2026-10-16', deps: ['T2'] },
    { id: 'T5', phase: 'P2', fr: 'Collecte base de connaissances', en: 'Knowledge-base data collection', owner: 'DATA', start: '2026-10-05', end: '2026-10-20', points: 8, progress: 100, done: '2026-10-20', deps: ['T1'] },
    { id: 'T6', phase: 'P2', fr: 'Maquettes UI bilingues', en: 'Bilingual UI wireframes', owner: 'FE', start: '2026-10-12', end: '2026-10-23', points: 5, progress: 60, done: '', deps: ['T2'] },
    { id: 'T7', phase: 'P2', fr: 'Conception sécurité et RGPD', en: 'Security and GDPR design', owner: 'SEC', start: '2026-10-19', end: '2026-10-23', points: 3, progress: 30, done: '', deps: ['T4'] },
    { id: 'T8', phase: 'P3', fr: 'Pipeline d’ingestion et embeddings', en: 'Ingestion pipeline and embeddings', owner: 'DATA', start: '2026-10-21', end: '2026-11-03', points: 8, progress: 0, done: '', deps: ['T4', 'T5'] },
    { id: 'T9', phase: 'P3', fr: 'Orchestration RAG et LLM', en: 'RAG retrieval and LLM orchestration', owner: 'ARCH', start: '2026-11-04', end: '2026-11-20', points: 13, progress: 0, done: '', deps: ['T8'] },
    { id: 'T10', phase: 'P3', fr: 'API back-end et limitation de débit', en: 'Back-end API and rate limiting', owner: 'BE', start: '2026-10-19', end: '2026-11-06', points: 8, progress: 15, done: '', deps: ['T4'] },
    { id: 'T11', phase: 'P3', fr: 'Interface de chat FR/EN', en: 'FR/EN chat interface', owner: 'FE', start: '2026-10-26', end: '2026-11-20', points: 8, progress: 0, done: '', deps: ['T6'] },
    { id: 'T12', phase: 'P3', fr: 'Détection de langue et i18n', en: 'Language detection and i18n', owner: 'FE', start: '2026-11-09', end: '2026-11-18', points: 3, progress: 0, done: '', deps: ['T6'] },
    { id: 'T13', phase: 'P3', fr: 'Panneau d’administration', en: 'Admin panel', owner: 'BE', start: '2026-11-23', end: '2026-12-02', points: 5, progress: 0, done: '', deps: ['T10'] },
    { id: 'T14', phase: 'P4', fr: 'Tests unitaires et d’intégration', en: 'Unit and integration tests', owner: 'QA', start: '2026-11-23', end: '2026-12-02', points: 5, progress: 0, done: '', deps: ['T9', 'T11'] },
    { id: 'T15', phase: 'P4', fr: 'Tests de sécurité (OWASP, injection)', en: 'Security testing (OWASP, injection)', owner: 'SEC', start: '2026-11-23', end: '2026-12-04', points: 5, progress: 0, done: '', deps: ['T7', 'T9', 'T10'] },
    { id: 'T16', phase: 'P4', fr: 'Évaluation qualité des réponses', en: 'Answer-quality evaluation', owner: 'QA', start: '2026-11-23', end: '2026-12-03', points: 5, progress: 0, done: '', deps: ['T9'] },
    { id: 'T17', phase: 'P4', fr: 'Recette utilisateurs', en: 'User acceptance testing', owner: 'QA', start: '2026-12-03', end: '2026-12-08', points: 3, progress: 0, done: '', deps: ['T14'] },
    { id: 'T18', phase: 'P5', fr: 'Déploiement, CI/CD, monitoring', en: 'Deployment, CI/CD, monitoring', owner: 'BE', start: '2026-12-07', end: '2026-12-11', points: 5, progress: 0, done: '', deps: ['T15', 'T16'] },
    { id: 'T19', phase: 'P5', fr: 'Formation et guides', en: 'Training and user guides', owner: 'PM', start: '2026-12-09', end: '2026-12-11', points: 2, progress: 0, done: '', deps: ['T17'] },
    { id: 'T20', phase: 'P6', fr: 'Rapport final et soutenance', en: 'Final report and defence', owner: 'PM', start: '2026-12-14', end: '2026-12-18', points: 5, progress: 0, done: '', deps: ['T18', 'T19'] }
  ]
};
if (typeof module !== 'undefined') module.exports = SAMPLE;
