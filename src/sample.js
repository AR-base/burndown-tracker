const SAMPLE = {
  name: 'ESAIP AI Assistant', code: 'EAA-2026',
  start: '2026-09-28', end: '2026-12-18', statusDate: '', workingDays: true,
  budget: { contMode: 'auto', contingency: 0.15, extras: [
    { fr: 'Consommation de l’API d’IA', en: 'AI API usage', amount: 100, per: 'month' },
    { fr: 'Base de données hébergée', en: 'Hosted database', amount: 25, per: 'month' },
    { fr: 'Nom de domaine', en: 'Domain name', amount: 30, per: 'once' },
    { fr: 'Outils collaboratifs et licences de développement', en: 'Collaboration tools and developer licences', amount: 15, per: 'personMonth' }
  ] },
  docs: {
    fr: {
      author: 'Pinninti Sai Anish — MSc Cybersécurité et Data Science, ESAIP',
      sponsor: 'Direction des formations ESAIP, DSI ESAIP',
      context: `Les réponses aux questions courantes des étudiants (vie de campus, aides financières, mobilité internationale, cadre CTI) sont dispersées entre le site, l’intranet et les e-mails ; les étudiants internationaux sont les plus touchés.
L’assistant IA bilingue centralise ces réponses 24 h/24, en français et en anglais, avec des sources citées.`,
      objectives: `# | Objectif | Indicateur | Cible
O1 | Répondre juste et sourcé | Exactitude sur 100 questions test | ≥ 85 %
O2 | Servir les deux langues | Réponse dans la langue de la question | 100 %
O3 | Réduire la charge des services | E-mails répétitifs à la scolarité | −30 % en 3 mois
O4 | Rester rapide | Temps de réponse (p95) | < 4 s
O5 | Coûter moins qu’une licence | Coût mensuel comparé à ChatGPT Team | Inférieur`,
      scope: `## Inclus
- Chat web en français et en anglais
- Base de connaissances ESAIP (campus, aides, mobilité, CTI, logement, alumni)
- Panneau d’administration, déploiement et formation
## Exclu
- Connexion à l’ENT
- Données personnelles des étudiants
- Application mobile native`,
      stakeholders: `Partie prenante | Rôle | Attente
Direction des formations | Sponsor | Moins de demandes répétitives
DSI ESAIP | Client interne, hébergement | Sécurité, RGPD, coût maîtrisé
Étudiants (dont internationaux) | Utilisateurs | Réponses rapides et fiables
Scolarité, relations internationales | Experts métier | Contenu exact et à jour`,
      functional: `ID | Exigence | Priorité
EF1 | Détecter la langue et répondre dans la même langue | Indispensable
EF2 | Citer la source de chaque réponse | Indispensable
EF3 | Couvrir campus, aides, mobilité, CTI, logement, alumni | Indispensable
EF4 | Dire « je ne sais pas » hors base et orienter vers un contact | Indispensable
EF5 | Mettre à jour la base sans redéploiement | Important
EF6 | Vote positif ou négatif sur chaque réponse | Important
EF7 | Questions suggérées par thème | Optionnel`,
      nonfunctional: `ID | Catégorie | Exigence
ENF1 | Performance | Temps de réponse < 4 s, 50 utilisateurs simultanés
ENF2 | Sécurité | OWASP Top 10 et OWASP LLM Top 10 couverts
ENF3 | RGPD | Aucune donnée personnelle stockée ; journaux anonymisés 30 jours
ENF4 | Accessibilité | RGAA, WCAG 2.1 AA
ENF5 | Disponibilité | 99 % hors maintenance
ENF6 | Maintenabilité | Couverture de tests ≥ 70 %, intégration continue obligatoire`,
      constraints: `- Échéance fixe : soutenance le 18/12/2026
- Budget : hébergement Vercel gratuit, plafond mensuel de coût IA
- Données : uniquement des contenus publics d’ESAIP`,
      architecture: `Architecture RAG en trois couches : interface web, API sécurisée, pipeline de connaissances. L’IA ne répond qu’à partir des passages retrouvés dans la base ESAIP.
Brique | Rôle
Front-end Next.js (Vercel) | Chat bilingue, citations cliquables
API FastAPI | Validation des entrées, limitation de débit, orchestration RAG
Garde-fous | Bloque l’injection de prompt, masque les données personnelles
Recherche + pgvector | Recherche hybride vecteurs et mots-clés, 5 meilleurs passages
Ingestion | Découpage en passages d’environ 500 tokens, embeddings multilingues
Supervision | Latence, taux de « je ne sais pas », votes`,
      stack: `Couche | Choix | Pourquoi
Front-end | Next.js + TypeScript | Traduction intégrée, hébergement Vercel
API | Python FastAPI + Pydantic | Validation stricte des entrées
Base vectorielle | PostgreSQL + pgvector | Une seule base de données
Modèle d’IA | API interchangeable | Pas de dépendance à un fournisseur
Réseau | Cloudflare | Pare-feu applicatif, anti-robots, limitation de débit
CI/CD | GitHub Actions vers Vercel | Tests et analyse de sécurité à chaque modification`,
      security: `Menace | Protection
Injection de prompt | Instructions système isolées, réponses limitées au contexte
Fuite de données | Masquage automatique des e-mails et numéros
XSS et injection SQL | Échappement, requêtes paramétrées, CSP stricte
Abus et coût | 20 requêtes par minute et par IP, plafond de coût
Secrets | Variables d’environnement, scan GitLeaks à chaque modification`,
      testing: `Niveau | Outil | Critère de sortie
Unitaire | Pytest | Couverture ≥ 70 %
Bout en bout | Playwright | Parcours FR et EN validés
Qualité des réponses | 100 questions test | Exactitude ≥ 85 %
Sécurité | OWASP ZAP + 30 attaques de prompt | 0 faille critique ou haute
Recette | 15 étudiants | Satisfaction ≥ 4/5`,
      deployment: `- Chaîne : branche, demande de fusion, tests automatiques et analyse, prévisualisation Vercel, production
- Sauvegarde quotidienne conservée 7 jours
- Retour à la version précédente en 1 clic sur Vercel
- Alerte si erreurs > 2 % ou temps de réponse > 4 s pendant 10 minutes`,
      risks: `ID | Risque | P | I | Score | Réponse
R1 | Réponses inventées par l’IA | 4 | 5 | 20 | Réponses limitées aux sources, citations
R2 | Informations obsolètes | 4 | 4 | 16 | Panneau admin et date de mise à jour affichée
R3 | Injection de prompt | 3 | 4 | 12 | Garde-fous et 30 tests d’attaque
R4 | Retard du chemin critique | 3 | 4 | 12 | Revue du burndown chaque semaine
R5 | Coût de l’IA | 3 | 3 | 9 | Plafond mensuel et cache`,
      conclusion: `- Terminer T6 et T7 avant le 23/10 pour tenir le jalon M2
- Démarrer T8 immédiatement : premier maillon du chemin critique
- Découper T9 (13 points) en 3 sous-tâches hebdomadaires
- Réaffecter une personne de T10 vers T8 et T9
- Revue du burndown chaque vendredi ; alerte si SPI < 0,90`
    },
    en: {
      author: 'Pinninti Sai Anish — MSc Cybersecurity & Data Science, ESAIP',
      sponsor: 'ESAIP Training Directorate, ESAIP IT department',
      context: `Answers to common student questions (campus life, financial aid, international mobility, CTI framework) are scattered across the website, intranet and e-mail; international students are hit hardest.
The bilingual AI assistant centralises those answers 24/7, in French and English, with cited sources.`,
      objectives: `# | Objective | Indicator | Target
O1 | Accurate, cited answers | Accuracy on 100 test questions | ≥ 85 %
O2 | Serve both languages | Reply in the question’s language | 100 %
O3 | Reduce staff workload | Repeat e-mails to the registrar | −30 % in 3 months
O4 | Stay fast | Response time (p95) | < 4 s
O5 | Cost less than a licence | Monthly cost compared with ChatGPT Team | Lower`,
      scope: `## Included
- Web chat in French and English
- ESAIP knowledge base (campus, aid, mobility, CTI, housing, alumni)
- Admin panel, deployment and training
## Excluded
- Student portal login
- Students’ personal data
- Native mobile app`,
      stakeholders: `Stakeholder | Role | Expectation
Training Directorate | Sponsor | Fewer repeat requests
ESAIP IT department | Internal client, hosting | Security, GDPR, controlled cost
Students (including international) | Users | Fast, reliable answers
Registrar, international office | Domain experts | Accurate, current content`,
      functional: `ID | Requirement | Priority
EF1 | Detect the language and reply in it | Must
EF2 | Cite the source of every answer | Must
EF3 | Cover campus, aid, mobility, CTI, housing, alumni | Must
EF4 | Say “I don’t know” outside the knowledge base and point to a contact | Must
EF5 | Update the knowledge base without redeploying | Should
EF6 | Thumbs up or down on every answer | Should
EF7 | Suggested questions per topic | Could`,
      nonfunctional: `ID | Category | Requirement
ENF1 | Performance | Response time < 4 s, 50 concurrent users
ENF2 | Security | OWASP Top 10 and OWASP LLM Top 10 covered
ENF3 | GDPR | No personal data stored; anonymised logs kept 30 days
ENF4 | Accessibility | RGAA, WCAG 2.1 AA
ENF5 | Availability | 99 % excluding maintenance
ENF6 | Maintainability | Test coverage ≥ 70 %, continuous integration required`,
      constraints: `- Fixed deadline: defence on 18 Dec 2026
- Budget: free Vercel hosting, monthly AI cost cap
- Data: public ESAIP content only`,
      architecture: `Three-layer RAG architecture: web front end, secured API, knowledge pipeline. The AI only answers from passages retrieved from the ESAIP knowledge base.
Component | Role
Next.js front end (Vercel) | Bilingual chat, clickable citations
FastAPI API | Input validation, rate limiting, RAG orchestration
Guardrails | Blocks prompt injection, masks personal data
Retrieval + pgvector | Hybrid vector and keyword search, top 5 passages
Ingestion | Chunks of about 500 tokens, multilingual embeddings
Monitoring | Latency, “I don’t know” rate, votes`,
      stack: `Layer | Choice | Why
Front end | Next.js + TypeScript | Built-in translation, Vercel hosting
API | Python FastAPI + Pydantic | Strict input validation
Vector database | PostgreSQL + pgvector | One single database
AI model | Swappable API | No vendor lock-in
Network | Cloudflare | Web firewall, anti-bot, rate limiting
CI/CD | GitHub Actions to Vercel | Tests and security scan on every change`,
      security: `Threat | Control
Prompt injection | Isolated system instructions, context-only answers
Data leakage | Automatic masking of e-mails and numbers
XSS and SQL injection | Escaping, parameterised queries, strict CSP
Abuse and cost | 20 requests per minute per IP, cost cap
Secrets | Environment variables, GitLeaks scan on every change`,
      testing: `Level | Tool | Exit criterion
Unit | Pytest | Coverage ≥ 70 %
End to end | Playwright | FR and EN journeys pass
Answer quality | 100 test questions | Accuracy ≥ 85 %
Security | OWASP ZAP + 30 prompt attacks | 0 critical or high finding
Acceptance | 15 students | Satisfaction ≥ 4/5`,
      deployment: `- Pipeline: branch, pull request, automatic tests and scan, Vercel preview, production
- Daily backup kept 7 days
- One-click rollback to the previous version on Vercel
- Alert if errors > 2 % or response time > 4 s for 10 minutes`,
      risks: `ID | Risk | P | I | Score | Response
R1 | Answers made up by the AI | 4 | 5 | 20 | Source-only answers, citations
R2 | Outdated information | 4 | 4 | 16 | Admin panel and visible update date
R3 | Prompt injection | 3 | 4 | 12 | Guardrails and 30 attack tests
R4 | Critical-path slippage | 3 | 4 | 12 | Weekly burndown review
R5 | AI cost | 3 | 3 | 9 | Monthly cap and cache`,
      conclusion: `- Finish T6 and T7 by 23 Oct to hold milestone M2
- Start T8 now: first link of the critical path
- Split T9 (13 points) into 3 weekly sub-tasks
- Move one person from T10 to T8 and T9
- Burndown review every Friday; alert if SPI < 0.90`
    }
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
