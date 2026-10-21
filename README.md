# Burndown Tracker — FR / EN

Tracker de projet bilingue : burndown, Gantt synthétique et Gantt maître, chemin critique, SPI, date de fin prévue.
Fonctionne pour **n'importe quel projet** : importez un Gantt en CSV (Excel, Google Sheets, MS Project, GanttProject), en Mermaid ou en JSON.

Bilingual project tracker: burndown, summary and master Gantt, critical path, SPI, forecast finish.
Works for **any project**: import a Gantt as CSV (Excel, Google Sheets, MS Project, GanttProject), Mermaid or JSON.

Une seule page statique (`index.html`), aucun serveur, aucune base de données. Les données restent dans le navigateur (localStorage) ; exportez en JSON/CSV pour sauvegarder ou partager.
One static page (`index.html`), no server, no database. Data stays in the browser (localStorage); export JSON/CSV to back up or share.

---

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
npm test           # 10 logique + 8 import/export + 12 documents .docx + 26 interface = 56 tests
```

Structure : `src/core.js` (calculs purs), `src/io.js` (CSV/Mermaid), `src/docgen.js` (générateur .docx sans dépendance), `src/app.js` (interface), `src/app.html` (gabarit + CSS), `src/sample.js` (projet exemple ESAIP AI Assistant).
La CI GitHub Actions (`.github/workflows/ci.yml`) reconstruit et teste à chaque push.

Sécurité / Security: entrées validées et bornées (IDs, dates, tailles ≤ 2 Mo), tout texte échappé avant affichage, détection des cycles de dépendances, aucun secret, aucune requête réseau sortante (`connect-src 'none'`).
