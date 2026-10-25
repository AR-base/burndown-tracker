# Burndown Tracker — FR / EN

Tracker de projet bilingue : burndown, Gantt synthétique et Gantt maître, chemin critique, SPI, date de fin prévue.
Fonctionne pour **n'importe quel projet** : importez un Gantt en CSV (Excel, Google Sheets, MS Project, GanttProject), en Mermaid ou en JSON.

Bilingual project tracker: burndown, summary and master Gantt, critical path, SPI, forecast finish.
Works for **any project**: import a Gantt as CSV (Excel, Google Sheets, MS Project, GanttProject), Mermaid or JSON.

Une seule page statique (`index.html`), aucun serveur, aucune base de données. Les données restent dans le navigateur (localStorage) ; exportez en JSON/CSV pour sauvegarder ou partager.
One static page (`index.html`), no server, no database. Data stays in the browser (localStorage); export JSON/CSV to back up or share.

---

## 0. Assistant de projet / Project assistant

Onglet **Assistant** (ou bouton **+ Nouveau projet**) : le client décrit son projet en une phrase, sans termes techniques (« je veux vendre mes vêtements en ligne »). L'outil détecte le type de projet et génère en un clic :
- le planning complet : 6 phases, tâches, durées en jours ouvrés, dépendances, 6 jalons, chemin critique ;
- tous les textes des documents en langage simple : contexte, objectifs, périmètre, parties prenantes, exigences, architecture, stack, sécurité, tests, déploiement, risques, prochaines étapes et lexique ;
- les 3 documents Word à télécharger immédiatement.

**Assistant tab** (or **+ New project**): the client describes the project in one plain sentence; the tool detects the type and generates the full schedule, every document text and the 3 Word documents in one click.

Types reconnus / Recognised types: e-commerce, site vitrine, application mobile, assistant IA / chatbot, tableau de bord / BI, machine learning, réservation en ligne, application de gestion (CRM/ERP/SaaS), e-learning, audit de cybersécurité, objets connectés (IoT), application sur mesure (par défaut). Ampleur : Essentiel / Standard / Complet (≈ 7 / 11 / 14 semaines).
Dans l'aperçu Claude, l'option **Adapter avec l'IA de Claude** personnalise les fonctionnalités au projet exact ; la réponse de l'IA est validée et nettoyée avant usage, et le modèle intégré prend le relais si elle échoue.

## 0 bis. Budget et équipe / Budget and team

Onglet **Budget et équipe** : calculé à partir du Gantt. Chaque tâche compte une personne de son rôle (PM, DEV, QA…) à temps plein sur ses jours ouvrés.
- **Équipe nécessaire** : jours-homme par rôle, nombre de personnes (jours répartis sur la période d'activité du rôle), charge, taux journalier modifiable, coût.
- **Coût par phase** ; **coûts fixes** facturés une fois, par mois (× durée du projet), par personne ou par personne et par mois (× équipe) : ils suivent automatiquement les dates et l’équipe ; **marge pour imprévus** automatique selon le risque du planning (base 10 %, + retard, + tâches sans marge, + projet long) ou taux fixe.
- Chaque modification s’applique aussitôt (sans bouton) : indicateurs, onglets et documents suivent.
- **Valeur acquise / planifiée en €** pour le suivi.
- Section **Budget et ressources** dans le cahier des charges, le dossier technique et le rapport.

**Budget & team** tab, computed from the Gantt: person-days and headcount per role, editable day rates, cost by phase, fixed costs per project type, contingency, earned/planned value; included in all three Word documents.

## 0 ter. Comptes, équipes et cloud (Phase 1) / Accounts, teams and cloud

Sans configuration, l'outil reste une démo locale (données dans le navigateur). Avec Supabase, il devient multi-utilisateur :
Without configuration the tool stays a local demo. With Supabase it becomes multi-user:

| Fonction / Feature | Détail / Detail |
| --- | --- |
| Connexion / Sign-in | E-mail + mot de passe (10 caractères min.), Google, Microsoft, mot de passe oublié, vérification en deux étapes (TOTP) |
| Espaces de travail / Workspaces | Un par entreprise ou startup, plusieurs projets chacun, sélecteur dans l'en-tête |
| Rôles / Roles | Propriétaire > Chef de projet > Membre > Lecteur, appliqués par la base de données (RLS) |
| Portefeuille / Portfolio | Tous les projets de l'espace : santé (SPI), avancement, budget, fin la plus tardive, archivage |
| Enregistrement / Saving | Automatique, versionné (détection des conflits), synchronisé en direct entre collègues, hors ligne toléré |
| Invitations | Lien à usage unique, lié à l'adresse e-mail, valable 7 jours (seul le hachage est stocké) |
| Liens client / Client links | Lecture seule sans compte, révocables, avec expiration, date de dernière consultation |
| Activité / Activity | Journal de qui a fait quoi (modifications regroupées par 10 minutes) |
| RGPD / GDPR | Données en UE (Francfort), export de mes données, suppression du compte |

### Mise en place (10 minutes) / Setup

1. **supabase.com → New project**, région **Central EU (Frankfurt)**.
2. **SQL Editor → New query** : collez `db/schema.sql` → **Run**. (Relançable sans risque / safe to re-run.)
3. **Authentication → URL Configuration** : *Site URL* = `https://the-manager-app.vercel.app`, *Redirect URLs* = la même adresse (+ l’ancienne `https://burndown-tracker.vercel.app`) (+ `http://localhost:8080` pour tester en local).
4. **Authentication → Sign In / Providers** : laissez *Confirm email* activé ; activez *Leaked password protection*. Optionnel : Google et Azure (Microsoft) avec leurs identifiants OAuth.
5. **Project Settings → API** : copiez *Project URL* et la clé **anon public**, puis créez `cloud.config.json` à la racine (voir `cloud.config.example.json`) et poussez. Vercel redéploie ; le build ajoute l'adresse Supabase à la CSP (`connect-src`).

Ne mettez **jamais** la clé `service_role` dans ce fichier : le build la refuse. La clé anon est publique par conception ; la sécurité vient des règles RLS de `db/schema.sql`, testées par `tests/db.test.mjs` (17 scénarios : autre entreprise, visiteur anonyme, membre, lecteur, liens expirés, suppression de compte…).
Never put the `service_role` key in this file: the build refuses it. The anon key is public by design; security comes from the RLS rules in `db/schema.sql`, tested by `tests/db.test.mjs`.

## 0 quater. Cerveau PM et pilotage / PM brain and toolkit

- **Connexion d’abord / Sign-in first** — en mode cloud, la première page est l’écran de connexion (e-mail, Google, Microsoft, 2FA). Un nouveau compte démarre **vide** : aucun projet d’exemple, aucune donnée d’un autre utilisateur ; la copie locale est effacée à la déconnexion. Un lien discret « Explorer la démo sans compte » ouvre l’exemple ESAIP en local. / In cloud mode the first page is the sign-in screen; new accounts start blank, the local copy is wiped on sign-out, and a discreet demo link opens the ESAIP sample locally.
- **Pilotage / PM toolkit** — chaque projet généré reçoit tous les registres d’un chef de projet, modifiables en direct et enregistrés avec le projet : charte, parties prenantes (grille influence × intérêt), matrice RACI (contrôle : un seul A, au moins un R), registre des risques (carte de chaleur 5×5), plan de communication, qualité et recette, achats, problèmes, décisions, demandes de changement (jours / €), réunions, retours d’expérience, et un **rapport hebdomadaire** rédigé à partir des données. Les documents Word incluent ces registres. / Every generated project gets the full set of PM registers, editable live, saved with the project and included in the Word documents, plus an auto-written weekly status report.
- **Cerveau PM / PM brain** — un cerveau en particules animé (canvas) relié aux 10 domaines du PMBOK ; chaque zone affiche une mesure en direct et passe au vert / orange / rouge selon l’état réel du projet ; un clic ouvre le module correspondant. Boutons HTML accessibles, mouvement réduit respecté. / An animated particle brain wired to the 10 PMBOK knowledge areas, each with a live metric and status colour; clicking opens the matching module.
- Toutes les saisies passent par `PM.clean` (types, bornes, listes fermées, longueurs, 300 lignes max) et tout le texte est échappé à l’affichage. / All input goes through `PM.clean`; all text is escaped on output.

## 0 quinquies. SaaS : offres, limites, essai / Plans, limits, trial

- **Page d’accueil publique** avec fonctionnalités, étapes et tarifs, puis la connexion (e-mail ou Google). / Public landing page with features, steps and pricing, then sign-in (e-mail or Google).
- **Offres par espace / Plans per workspace** — Free : 3 projets actifs, 3 personnes, 1 lien client par projet · Pro (19 €/mois) : 25 projets, 10 personnes, 20 liens · Team (49 €/mois) : 500 projets, 50 personnes. Les limites sont appliquées **dans la base** (triggers), impossibles à contourner depuis le navigateur. / Limits are enforced in the database.
- **Essai Pro 14 jours** lancé par le propriétaire, une fois par espace, sans carte. À la fin, les données restent ; seules les nouvelles créations au-delà du plan Free sont refusées. Le plan payant ne peut être changé que par le rôle service (administrateur ou futur webhook Stripe). / One 14-day Pro trial per workspace; the paid plan can only be changed server-side.
- **Barre d’abonnement, compteurs d’usage et liste « Bien démarrer »** dans l’onglet Projets. / Plan bar, usage meters and getting-started checklist in the Projects tab.

### Activer / Enable
1. Supabase → **SQL Editor** → coller `db/saas.sql` → **Run** (à faire une fois, après `schema.sql` ; relançable sans risque).
2. **Google** : Google Cloud Console → *APIs & Services → Credentials → Create credentials → OAuth client ID* (type *Web application*). *Authorized redirect URI* : `https://<votre-ref>.supabase.co/auth/v1/callback`. Copier l’ID client et le secret dans Supabase → **Authentication → Sign In / Providers → Google** → activer → enregistrer. Le secret ne va **jamais** dans ce dépôt.
3. Boutons affichés : `"oauth": ["google"]` dans `cloud.config.json` (ajouter `"azure"` pour Microsoft une fois configuré).
4. Passer un espace en Pro / Team à la main : `update public.workspaces set plan = 'pro' where name = '…';` (SQL Editor).

## 0 sexies. Paiement Stripe / Stripe billing

Le paiement passe **uniquement** par trois fonctions serveur (Supabase Edge Functions, dossier `supabase/functions`) ; la clé secrète Stripe n’est jamais dans le navigateur ni dans ce dépôt. / Payment runs only in three server functions; the Stripe secret key never reaches the browser or this repo.

- `create-checkout` : le propriétaire de l’espace choisit Pro ou Team → page de paiement Stripe.
- `billing-portal` : « Gérer l’abonnement » (carte, factures, résiliation, changement d’offre).
- `stripe-webhook` : Stripe confirme le paiement → l’offre de l’espace change dans la base (seul endroit qui peut le faire ; signature Stripe vérifiée).

### Mise en place (mode test d’abord)
1. **Stripe** (dashboard.stripe.com, mode *Test*) → *Product catalog* → créer **The Manager Pro** (19 €/mois, récurrent) et **The Manager Team** (49 €/mois). Copier les deux **Price ID** (`price_…`). Activer le **Customer portal** (*Settings → Billing → Customer portal*).
2. **Supabase SQL Editor** → exécuter `db/billing.sql`.
3. **Supabase → Edge Functions** → déployer les trois fonctions (CLI : `supabase functions deploy create-checkout`, `… billing-portal`, `supabase functions deploy stripe-webhook --no-verify-jwt`). Le webhook doit avoir **JWT verification désactivée**.
4. **Supabase → Edge Functions → Secrets** : `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`, `SITE_URL` (`https://the-manager-app.vercel.app,https://burndown-tracker.vercel.app`, plusieurs adresses séparées par des virgules), puis `STRIPE_WEBHOOK_SECRET` (étape 5).
5. **Stripe → Developers → Webhooks → Add endpoint** : `https://<ref>.supabase.co/functions/v1/stripe-webhook`, événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copier le *Signing secret* (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.
6. `cloud.config.json` : `"billing": true`, puis pousser. Les boutons « Passer à Pro / Team » et « Gérer l’abonnement » apparaissent pour le propriétaire.
7. Tester avec la carte `4242 4242 4242 4242`, date future, CVC quelconque. Passer en mode *Live* = refaire 1, 4 et 5 avec les clés live.

## 1. Déployer / Deploy

### Option A — Vercel + GitHub (recommandé / recommended)

1. Créez un dépôt GitHub `burndown-tracker` et poussez ce dossier / Create a GitHub repo and push this folder:
   ```bash
   cd burndown-tracker
   git init && git add . && git commit -m "Burndown tracker v1"
   git branch -M main
   git remote add origin https://github.com/<votre-compte>/burndown-tracker.git
   git push -u origin main
   ```
2. Sur / On **vercel.com → Add New → Project → Import** le dépôt / the repo.
3. Framework preset : **Other**. Build command : *(vide / empty)*. Output directory : `.` → **Deploy**.
4. URL obtenue / You get: `https://burndown-tracker-<xxx>.vercel.app`. Chaque `git push` redéploie / every push redeploys.

`vercel.json` ajoute les en-têtes de sécurité (CSP stricte avec hachages SHA-256 des scripts, HSTS, nosniff, no-referrer).
`vercel.json` adds the security headers (strict CSP with SHA-256 script hashes, HSTS, nosniff, no-referrer).

### Option B — Vercel CLI (2 minutes)

```bash
npm i -g vercel
cd burndown-tracker
vercel          # premier déploiement (aperçu) / first deploy (preview)
vercel --prod   # production
```

### Option C — Netlify Drop (sans compte Git / no Git)

Ouvrez / open **app.netlify.com/drop** et glissez le dossier `burndown-tracker`. Le fichier `_headers` applique les mêmes en-têtes de sécurité.

### Option D — GitHub Pages

Dépôt → **Settings → Pages → Source : Deploy from a branch → main / (root)**. Note : GitHub Pages ignore `vercel.json` et `_headers` (pas d'en-têtes CSP personnalisés).

### Option E — Local

Double-cliquez `index.html`, ou / or: `python3 -m http.server 8080` puis / then `http://localhost:8080`.

---

## 2. Utiliser pour n'importe quel projet / Use it for any project

Onglet **Projet → Importer un Gantt** (ou bouton *Importer un Gantt* dans l'onglet Gantt). Collez le contenu ou choisissez un fichier ; le format est détecté.
**Project tab → Import a Gantt** (or the *Import a Gantt* button on the Gantt tab). Paste or pick a file; the format is detected.

| Format | Source | Colonnes reconnues / Recognised columns |
| --- | --- | --- |
| CSV `;` ou `,` | Excel (FR/EN), Google Sheets, LibreOffice | `id, type, phase, name_fr, name_en, owner, start, end, points, progress, done, deps` |
| CSV | MS Project (*Fichier → Enregistrer sous → CSV*) | `ID, Task Name, Start, Finish, % Complete, Predecessors, Resource Names` |
| CSV | GanttProject (*Export → CSV*) | `ID, Name, Begin date, End date, Completion, Predecessors` |
| Mermaid | Docs, GitHub, Notion | `gantt` + `section` + `Nom :done, crit, id, début, fin | Nd | after id` |
| JSON | Export de ce tracker / this tracker's export | Format complet / full format |

Règles / Rules:
- Dates : `AAAA-MM-JJ` ou `JJ/MM/AAAA` (jour en premier). / Dates: `YYYY-MM-DD` or `DD/MM/YYYY` (day first).
- `Nom FR / Name EN` dans une seule cellule est séparé automatiquement. / One cell `Nom FR / Name EN` is split automatically.
- Sans colonne points, les points = durée en jours ouvrés. / No points column → points = working-day duration.
- `type = milestone` (ou `jalon`) crée un jalon. / creates a milestone.
- `% Complete = 100` ou `done = oui/yes/x` marque la tâche terminée. / marks the task done.
- Prédécesseurs MS Project `3FS+2d` → dépendance `3`. / MS Project predecessors `3FS+2d` → dependency `3`.

Modèle prêt à remplir / Ready-to-fill template: `examples/template-fr.csv` (ou bouton *Modèle CSV*).

Exports : JSON (sauvegarde complète), CSV (Excel), Mermaid Gantt (à coller dans un rapport, GitHub ou Notion).

---

## 3. Télécharger les documents / Download documents

Bouton **Télécharger** en haut à droite / **Download** button, top right:

| Fichier / File | Contenu / Content |
| --- | --- |
| Cahier des charges (.docx) / Requirements spec | Fiche projet, contexte, objectifs, périmètre, parties prenantes, exigences, contraintes, phases, jalons, Gantt synthétique |
| Dossier technique (.docx) / Technical document | Architecture, stack, sécurité, tests, déploiement, Gantt synthétique + maître, WBS, chemin critique, risques |
| Rapport complet (.docx) / Full report | Tout, plus résumé, indicateurs, burndown, historique hebdomadaire, tâches à surveiller, conclusion |
| Gantt synthétique / maître, Burndown (.png) | Graphiques haute résolution / High-resolution charts |
| Gantt (.csv), Projet (.json) | Pour Excel / pour réimporter / For Excel / to re-import |

Ça marche pour **n'importe quel projet importé** : planning, Gantt, burndown et indicateurs sont générés automatiquement ; le texte (contexte, exigences, architecture…) se saisit dans **Projet → Contenu des documents** (`- ` puce, `A | B | C` tableau, `## ` sous-titre). Langue des documents = langue de l'interface.
Works for **any imported project**: schedule, Gantts, burndown and KPIs are generated; text is entered in **Project → Document content**. Document language follows the interface.

Les fichiers .docx sont générés dans le navigateur (aucun serveur) et s'ouvrent dans Word, LibreOffice et Google Docs. / .docx files are built in the browser (no server) and open in Word, LibreOffice and Google Docs.

## 4. Calculs / Formulas

| Indicateur / Metric | Calcul / Formula |
| --- | --- |
| Reste à faire / Remaining | Total des points − points des tâches terminées à la date d'état |
| Ligne idéale / Ideal line | Total × (1 − jours ouvrés écoulés ÷ jours ouvrés du projet) |
| Vélocité / Velocity | Points terminés ÷ jours écoulés × 7 |
| Vélocité requise / Required | Points restants ÷ jours restants × 7 |
| Valeur planifiée / Planned value (PV) | Σ points × part de la durée de chaque tâche écoulée |
| Valeur acquise / Earned value (EV) | Σ points × avancement % |
| SPI | EV ÷ PV — ≥ 0,95 dans les temps · ≥ 0,80 à risque · < 0,80 en retard |
| Fin prévue / Forecast | Date d'état + points restants ÷ vélocité journalière |
| Chemin critique / Critical path | Passe arrière sur les dépendances fin-à-début ; marge nulle en jours ouvrés |

---

## 5. Développement / Development

```bash
npm install        # jsdom pour les tests DOM / for DOM tests
npm run build      # src/ → index.html + hachages CSP dans vercel.json et _headers
npm test           # 12 logique + 8 import/export + 14 .docx + 19 assistant + 8 budget + 7 cloud + 17 base de données + 54 interface + 38 comptes = 177 tests
```

Structure : `src/core.js` (calculs purs), `src/io.js` (CSV/Mermaid), `src/docgen.js` (générateur .docx sans dépendance), `src/kb.js` + `src/generator.js` (assistant de projet), `src/budget.js` (équipe et budget), `src/cloud.js` + `src/cloud-ui.js` (comptes et cloud), `db/schema.sql` (base Supabase), `src/app.js` (interface), `src/app.html` (gabarit + CSS), `src/sample.js` (projet exemple ESAIP AI Assistant).
La CI GitHub Actions (`.github/workflows/ci.yml`) reconstruit et teste à chaque push.

Sécurité / Security: entrées validées et bornées (IDs, dates, tailles ≤ 2 Mo), tout texte échappé avant affichage, détection des cycles de dépendances, aucun secret, aucune requête réseau sortante (`connect-src 'none'`).
