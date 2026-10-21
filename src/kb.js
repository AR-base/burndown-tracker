/* Project knowledge base: one entry per kind of project a client may describe in plain words.
   feature tuple: [nameFr, nameEn, plainDescFr, plainDescEn, days(medium), points, priority M|S|C]
   stack row: [layer, choice, whyFr, whyEn] · comp: [name, roleFr, roleEn] · objective: [fr, en, kpiFr, kpiEn, target]
   nfr: [category, fr, en] · threat: [fr, en, controlFr, controlEn] · risk: [fr, en, P, I, responseFr, responseEn] */
const KB = [
  {
    id: 'ecommerce', fr: 'Site e-commerce', en: 'E-commerce website', code: 'ECOM',
    kw: ['e-commerce', 'ecommerce', 'e commerce', 'boutique en ligne', 'online store', 'online shop', 'shop', 'boutique', 'vente en ligne', 'vendre', 'vente', 'sell', 'selling', 'acheter', 'buy', 'panier', 'cart', 'checkout', 'paiement', 'payment', 'produits', 'products', 'catalogue', 'commande', 'orders', 'magasin', 'marketplace', 'dropshipping', 'shopify', 'woocommerce', 'vetements', 'clothes', 'bijoux', 'jewelry'],
    users: ['Acheteurs en ligne', 'Online shoppers'], owner: ['Marchand', 'Merchant'],
    features: [
      ['Catalogue produits et recherche', 'Product catalogue and search', 'Les visiteurs parcourent les produits par catégorie, filtrent (prix, taille, couleur) et cherchent par mot-clé.', 'Visitors browse products by category, filter (price, size, colour) and search by keyword.', 6, 8, 'M'],
      ['Fiche produit', 'Product page', 'Chaque produit a sa page : photos, description, prix et stock disponible.', 'Each product has its page: photos, description, price and stock.', 4, 5, 'M'],
      ['Panier et commande', 'Cart and checkout', 'Le client ajoute des articles au panier, saisit son adresse et valide sa commande en 3 étapes.', 'Customers add items to a cart, enter their address and confirm the order in 3 steps.', 6, 8, 'M'],
      ['Paiement en ligne sécurisé', 'Secure online payment', 'Paiement par carte via un prestataire certifié (Stripe) : le site ne stocke jamais la carte.', 'Card payment through a certified provider (Stripe): the site never stores the card.', 5, 8, 'M'],
      ['Comptes clients', 'Customer accounts', 'Création de compte, connexion, historique des commandes et adresses enregistrées.', 'Sign-up, login, order history and saved addresses.', 4, 5, 'M'],
      ['Back-office marchand', 'Merchant back office', 'Le marchand ajoute ses produits, gère ses stocks et suit ses commandes sans aide technique.', 'The merchant adds products, manages stock and follows orders without technical help.', 7, 8, 'M'],
      ['Livraison et suivi de colis', 'Shipping and parcel tracking', 'Choix du mode de livraison, frais calculés automatiquement, numéro de suivi envoyé au client.', 'Delivery options, automatic shipping fees, tracking number sent to the customer.', 4, 5, 'S'],
      ['E-mails automatiques', 'Automatic e-mails', 'Confirmation de commande, avis d’expédition, mot de passe oublié.', 'Order confirmation, shipping notice, password reset.', 2, 3, 'S'],
      ['Référencement et statistiques', 'SEO and analytics', 'Bonne visibilité sur Google et suivi des visites, ventes et paniers abandonnés.', 'Good Google visibility and tracking of visits, sales and abandoned carts.', 3, 3, 'S'],
      ['Codes promo et avis clients', 'Discount codes and reviews', 'Codes de réduction et notes laissées par les acheteurs.', 'Discount codes and ratings left by buyers.', 3, 3, 'C']
    ],
    stack: [['Boutique / Storefront', 'Next.js', 'Pages rapides, bien référencées', 'Fast, SEO-friendly pages'], ['Commerce', 'Medusa (Node.js)', 'Moteur e-commerce open source', 'Open-source commerce engine'], ['Base de données / Database', 'PostgreSQL', 'Fiable pour les commandes', 'Reliable for orders'], ['Paiement / Payment', 'Stripe', 'Certifié PCI-DSS, 3-D Secure', 'PCI-DSS certified, 3-D Secure'], ['Recherche / Search', 'Meilisearch', 'Recherche instantanée', 'Instant search'], ['Hébergement / Hosting', 'Vercel + Render', 'Déploiement automatique', 'Automatic deployment']],
    comps: [['Boutique (front-end)', 'Pages produits, panier, compte client', 'Product pages, cart, customer account'], ['API commerce', 'Prix, stocks, commandes, règles métier', 'Prices, stock, orders, business rules'], ['Base de données', 'Produits, clients, commandes', 'Products, customers, orders'], ['Paiement Stripe', 'Encaissement sécurisé par carte', 'Secure card payment'], ['Back-office', 'Gestion du catalogue et des commandes', 'Catalogue and order management'], ['Services e-mail et transport', 'Notifications et suivi de colis', 'Notifications and parcel tracking']],
    objectives: [['Vendre en ligne 24 h/24', 'Sell online 24/7', 'Taux de conversion', 'Conversion rate', '≥ 2 %'], ['Paiement fiable', 'Reliable payment', 'Paiements réussis', 'Successful payments', '≥ 98 %'], ['Gérer la boutique sans développeur', 'Run the shop without a developer', 'Produits ajoutés par le marchand seul', 'Products added by the merchant alone', '100 %']],
    nfr: [['Performance', 'Pages en moins de 2 s avec 1 000 produits', 'Pages under 2 s with 1,000 products'], ['Mobile', 'Achat complet possible sur smartphone', 'Full purchase possible on a smartphone'], ['Paiement / Payment', 'Conformité PCI-DSS via Stripe', 'PCI-DSS compliance through Stripe']],
    threats: [['Fraude au paiement', 'Payment fraud', '3-D Secure et détection de fraude Stripe Radar', '3-D Secure and Stripe Radar fraud detection'], ['Vol de comptes clients', 'Customer account takeover', 'Mots de passe hachés, limite de tentatives, 2FA pour l’admin', 'Hashed passwords, login rate limit, admin 2FA']],
    risks: [['Intégration du paiement plus longue que prévu', 'Payment integration takes longer', 3, 4, 'Compte Stripe de test ouvert dès la conception', 'Stripe test account opened during design'], ['Photos et fiches produits fournies en retard', 'Product photos and texts delivered late', 4, 3, 'Gabarit de saisie et date limite au jalon M2', 'Entry template and deadline at milestone M2'], ['Pic de trafic pendant les soldes', 'Traffic peak during sales', 2, 4, 'CDN et test de charge avant la mise en ligne', 'CDN and load test before go-live']],
    out: [['Application mobile native', 'Native mobile app'], ['Comptabilité et facturation fournisseur', 'Accounting and supplier invoicing'], ['Vente multi-devises (phase 2)', 'Multi-currency sales (phase 2)']]
  },
  {
    id: 'website', fr: 'Site web vitrine', en: 'Showcase website', code: 'WEB',
    kw: ['site vitrine', 'site web', 'site internet', 'website', 'web site', 'landing', 'landing page', 'portfolio', 'blog', 'wordpress', 'page web', 'presentation', 'présenter', 'presenter', 'association', 'restaurant', 'entreprise', 'company website', 'cv en ligne', 'agence'],
    users: ['Visiteurs et prospects', 'Visitors and prospects'], owner: ['Entreprise cliente', 'Client company'],
    features: [
      ['Page d’accueil et présentation', 'Home and about pages', 'Une page d’accueil claire qui explique l’activité en 5 secondes.', 'A clear home page explaining the business in 5 seconds.', 4, 5, 'M'],
      ['Pages services / offres', 'Services pages', 'Une page par service avec description, photos et appel à l’action.', 'One page per service with description, photos and a call to action.', 4, 5, 'M'],
      ['Formulaire de contact', 'Contact form', 'Les visiteurs envoient une demande ; le client la reçoit par e-mail, avec protection anti-spam.', 'Visitors send a request; the client receives it by e-mail, with spam protection.', 2, 3, 'M'],
      ['Gestion du contenu (CMS)', 'Content management (CMS)', 'Le client modifie textes et images lui-même, sans développeur.', 'The client edits texts and images without a developer.', 5, 5, 'M'],
      ['Référencement Google (SEO)', 'Google ranking (SEO)', 'Titres, descriptions et structure optimisés pour apparaître dans Google.', 'Titles, descriptions and structure optimised to appear in Google.', 3, 3, 'M'],
      ['Blog / actualités', 'Blog / news', 'Publication d’articles pour animer le site.', 'Publishing articles to keep the site alive.', 3, 3, 'S'],
      ['Version anglaise', 'English version', 'Site disponible en français et en anglais.', 'Site available in French and English.', 3, 3, 'S'],
      ['Statistiques de visite', 'Visitor analytics', 'Suivi du nombre de visiteurs et des pages vues, conforme RGPD.', 'GDPR-compliant tracking of visitors and page views.', 1, 2, 'C']
    ],
    stack: [['Site / Website', 'Astro ou WordPress', 'Rapide et simple à mettre à jour', 'Fast and easy to update'], ['CMS', 'Decap CMS / WordPress', 'Édition sans code', 'No-code editing'], ['Formulaires / Forms', 'Formspree + hCaptcha', 'Anti-spam sans serveur', 'Serverless anti-spam'], ['Hébergement / Hosting', 'Netlify ou Vercel', 'Gratuit, HTTPS automatique', 'Free, automatic HTTPS']],
    comps: [['Pages du site', 'Contenu public, responsive', 'Public, responsive content'], ['CMS', 'Édition des contenus par le client', 'Content editing by the client'], ['Formulaire', 'Envoi des demandes par e-mail', 'Requests sent by e-mail'], ['CDN / hébergement', 'Diffusion rapide et HTTPS', 'Fast delivery and HTTPS']],
    objectives: [['Être trouvé sur Google', 'Be found on Google', 'Position sur 3 mots-clés locaux', 'Ranking on 3 local keywords', 'Top 10'], ['Générer des contacts', 'Generate leads', 'Demandes reçues par mois', 'Requests per month', '≥ 10'], ['Site autonome', 'Self-managed site', 'Mises à jour faites par le client', 'Updates done by the client', '100 %']],
    nfr: [['Performance', 'Score Lighthouse ≥ 90', 'Lighthouse score ≥ 90'], ['Mobile', 'Lisible sur tous les écrans', 'Readable on every screen size']],
    threats: [['Spam via le formulaire', 'Form spam', 'Captcha et limite d’envois', 'Captcha and submission limit'], ['Site piraté (CMS non à jour)', 'Hacked site (outdated CMS)', 'Mises à jour automatiques, comptes admin en 2FA', 'Automatic updates, admin accounts with 2FA']],
    risks: [['Textes et photos fournis en retard', 'Texts and photos delivered late', 4, 3, 'Liste des contenus validée au jalon M1', 'Content list signed off at milestone M1'], ['Validation du design qui traîne', 'Design approval drags on', 3, 3, '2 propositions maximum, validation en 5 jours', 'Max 2 proposals, approval within 5 days']],
    out: [['Vente en ligne', 'Online sales'], ['Espace membre', 'Member area']]
  },
  {
    id: 'mobile', fr: 'Application mobile', en: 'Mobile app', code: 'APP',
    kw: ['application mobile', 'app mobile', 'mobile app', 'appli', 'android', 'ios', 'iphone', 'smartphone', 'flutter', 'react native', 'play store', 'app store', 'application telephone', 'phone app', 'notifications push'],
    users: ['Utilisateurs sur smartphone', 'Smartphone users'], owner: ['Porteur du projet', 'Product owner'],
    features: [
      ['Inscription et connexion', 'Sign-up and login', 'Création de compte par e-mail ou Google/Apple, mot de passe oublié.', 'Account creation by e-mail or Google/Apple, password reset.', 4, 5, 'M'],
      ['Écran d’accueil et navigation', 'Home screen and navigation', 'Navigation simple par onglets vers les fonctions principales.', 'Simple tab navigation to the main features.', 4, 5, 'M'],
      ['Fonction principale du service', 'Core service feature', 'Le cœur de l’application : ce pour quoi l’utilisateur la télécharge.', 'The heart of the app: what users download it for.', 8, 13, 'M'],
      ['Profil utilisateur', 'User profile', 'L’utilisateur modifie ses informations et préférences.', 'Users edit their details and preferences.', 3, 3, 'M'],
      ['Notifications push', 'Push notifications', 'Alertes envoyées au téléphone au bon moment.', 'Alerts sent to the phone at the right time.', 3, 5, 'S'],
      ['Mode hors connexion', 'Offline mode', 'Les données principales restent consultables sans réseau.', 'Main data stays available without network.', 4, 5, 'S'],
      ['Back-office d’administration', 'Admin back office', 'Une interface web pour gérer utilisateurs et contenus.', 'A web interface to manage users and content.', 5, 5, 'S'],
      ['Publication sur les stores', 'Store publication', 'Mise en ligne sur Google Play et l’App Store, fiches et captures.', 'Release on Google Play and the App Store, listings and screenshots.', 3, 3, 'M']
    ],
    stack: [['Application', 'Flutter', 'Une seule base de code Android + iOS', 'One codebase for Android + iOS'], ['API', 'Node.js (NestJS)', 'Structurée et testable', 'Structured and testable'], ['Base de données / Database', 'PostgreSQL', 'Fiable', 'Reliable'], ['Notifications', 'Firebase Cloud Messaging', 'Standard Android/iOS', 'Standard for Android/iOS'], ['Hébergement / Hosting', 'Render ou Railway', 'Simple et abordable', 'Simple and affordable']],
    comps: [['App Flutter', 'Écrans et logique côté téléphone', 'Screens and on-device logic'], ['API', 'Comptes, données, règles métier', 'Accounts, data, business rules'], ['Base de données', 'Données des utilisateurs', 'User data'], ['Firebase', 'Notifications push', 'Push notifications'], ['Back-office web', 'Administration', 'Administration']],
    objectives: [['Adoption', 'Adoption', 'Téléchargements à 3 mois', 'Downloads after 3 months', '≥ 1 000'], ['Satisfaction', 'Satisfaction', 'Note sur les stores', 'Store rating', '≥ 4,3/5'], ['Stabilité', 'Stability', 'Sessions sans plantage', 'Crash-free sessions', '≥ 99 %']],
    nfr: [['Compatibilité / Compatibility', 'Android 10+ et iOS 15+', 'Android 10+ and iOS 15+'], ['Performance', 'Démarrage en moins de 2 s', 'Start-up under 2 s']],
    threats: [['Vol de session', 'Session theft', 'Jetons courts, stockage sécurisé (Keychain/Keystore)', 'Short-lived tokens, secure storage (Keychain/Keystore)'], ['API exposée', 'Exposed API', 'Authentification sur chaque appel, limitation de débit', 'Auth on every call, rate limiting']],
    risks: [['Refus de l’App Store', 'App Store rejection', 3, 4, 'Respect des règles Apple vérifié avant soumission', 'Apple guidelines checked before submission'], ['Différences Android / iOS', 'Android / iOS differences', 3, 3, 'Tests sur 4 appareils réels', 'Tests on 4 real devices']],
    out: [['Version tablette dédiée', 'Dedicated tablet version'], ['Paiements dans l’application (phase 2)', 'In-app payments (phase 2)']]
  },
  {
    id: 'chatbot', fr: 'Assistant IA / chatbot', en: 'AI assistant / chatbot', code: 'BOT',
    kw: ['chatbot', 'chat bot', 'assistant ia', 'assistant ai', 'ai assistant', 'agent ia', 'ai agent', 'intelligence artificielle', 'artificial intelligence', 'llm', 'gpt', 'chatgpt', 'rag', 'claude', 'repond aux questions', 'answer questions', 'faq', 'support client', 'customer support', 'conversationnel'],
    users: ['Utilisateurs qui posent des questions', 'People asking questions'], owner: ['Service client / organisation', 'Support team / organisation'],
    features: [
      ['Collecte des documents de référence', 'Knowledge collection', 'Rassembler les documents (FAQ, guides, pages web) dont l’assistant tirera ses réponses.', 'Gather the documents (FAQ, guides, web pages) the assistant will answer from.', 5, 5, 'M'],
      ['Indexation et recherche (RAG)', 'Indexing and retrieval (RAG)', 'Les documents sont découpés et indexés pour retrouver le bon passage à chaque question.', 'Documents are split and indexed to find the right passage for each question.', 6, 8, 'M'],
      ['Moteur de réponse avec sources', 'Answer engine with sources', 'L’IA répond uniquement à partir des documents et cite ses sources.', 'The AI answers only from the documents and cites its sources.', 6, 8, 'M'],
      ['Interface de chat', 'Chat interface', 'Une fenêtre de discussion simple, sur le site ou en page dédiée.', 'A simple chat window, on the site or as its own page.', 5, 5, 'M'],
      ['Garde-fous', 'Guardrails', 'Refus des questions hors sujet, blocage des tentatives de manipulation, pas de données personnelles.', 'Off-topic refusals, manipulation attempts blocked, no personal data.', 4, 5, 'M'],
      ['Multilingue FR/EN', 'Multilingual FR/EN', 'Répond dans la langue de la question.', 'Replies in the language of the question.', 2, 3, 'S'],
      ['Transfert vers un humain', 'Human handover', 'Si l’IA ne sait pas, elle propose un contact humain.', 'If the AI does not know, it offers a human contact.', 3, 3, 'S'],
      ['Tableau de bord des questions', 'Questions dashboard', 'Questions fréquentes, réponses mal notées, coût d’utilisation.', 'Frequent questions, poorly rated answers, usage cost.', 4, 5, 'S'],
      ['Mise à jour des documents par l’admin', 'Admin document updates', 'L’administrateur ajoute ou retire un document sans développeur.', 'The admin adds or removes a document without a developer.', 3, 3, 'C']
    ],
    stack: [['Interface / UI', 'Next.js', 'Chat rapide et intégrable', 'Fast, embeddable chat'], ['API', 'Python FastAPI', 'Écosystème IA', 'AI ecosystem'], ['Recherche / Retrieval', 'PostgreSQL + pgvector', 'Une seule base', 'One database'], ['Modèle / Model', 'API LLM (Claude)', 'Qualité des réponses, pas de serveur GPU', 'Answer quality, no GPU server'], ['Hébergement / Hosting', 'Vercel + Render', 'Déploiement automatique', 'Automatic deployment']],
    comps: [['Interface de chat', 'Questions et réponses avec sources', 'Questions and cited answers'], ['API et garde-fous', 'Validation, filtrage, limitation de débit', 'Validation, filtering, rate limiting'], ['Index de connaissances', 'Passages des documents (vecteurs)', 'Document passages (vectors)'], ['Modèle de langage', 'Rédige la réponse à partir des passages', 'Writes the answer from the passages'], ['Admin et suivi', 'Documents, statistiques, coûts', 'Documents, statistics, costs']],
    objectives: [['Répondre juste', 'Answer correctly', 'Réponses exactes sur 100 questions test', 'Correct answers on 100 test questions', '≥ 85 %'], ['Désengorger le support', 'Relieve the support team', 'Demandes traitées sans humain', 'Requests handled without a human', '≥ 50 %'], ['Rester rapide', 'Stay fast', 'Temps de réponse', 'Response time', '< 4 s']],
    nfr: [['Fiabilité / Reliability', 'Aucune réponse sans source', 'No answer without a source'], ['Coût / Cost', 'Plafond mensuel de dépense IA', 'Monthly AI spend cap']],
    threats: [['Injection de prompt', 'Prompt injection', 'Instructions système isolées, réponses limitées aux documents', 'Isolated system instructions, document-only answers'], ['Fuite de données', 'Data leakage', 'Aucune donnée personnelle indexée, masquage automatique', 'No personal data indexed, automatic masking']],
    risks: [['Réponses inventées (hallucinations)', 'Made-up answers (hallucinations)', 4, 5, 'Réponses limitées aux sources + jeu de 100 questions test', 'Source-only answers + 100-question test set'], ['Documents obsolètes', 'Outdated documents', 4, 3, 'Date de mise à jour et revue mensuelle', 'Update date and monthly review'], ['Coût IA supérieur au budget', 'AI cost over budget', 3, 3, 'Plafond et cache des questions fréquentes', 'Cap and cache for frequent questions']],
    out: [['Accès aux données personnelles des utilisateurs', 'Access to users’ personal data'], ['Assistant vocal', 'Voice assistant']]
  },
  {
    id: 'dashboard', fr: 'Tableau de bord / BI', en: 'Dashboard / BI', code: 'BI',
    kw: ['dashboard', 'tableau de bord', 'reporting', 'rapport automatique', 'bi', 'business intelligence', 'power bi', 'tableau', 'kpi', 'indicateurs', 'statistiques', 'visualisation', 'visualization', 'data viz', 'analyse des ventes', 'sales analysis', 'graphiques', 'charts', 'excel'],
    users: ['Direction et managers', 'Management and managers'], owner: ['Direction', 'Management'],
    features: [
      ['Inventaire des sources de données', 'Data source inventory', 'Lister où sont les chiffres aujourd’hui (Excel, logiciel, base) et qui les met à jour.', 'List where today’s numbers live (Excel, software, database) and who updates them.', 4, 3, 'M'],
      ['Définition des indicateurs (KPI)', 'KPI definitions', 'Choisir avec le client 8 à 12 indicateurs et leur formule exacte.', 'Choose 8 to 12 indicators with the client, with exact formulas.', 3, 3, 'M'],
      ['Chaîne de chargement des données (ETL)', 'Data loading pipeline (ETL)', 'Les données sont récupérées et nettoyées automatiquement chaque nuit.', 'Data is collected and cleaned automatically every night.', 7, 8, 'M'],
      ['Entrepôt de données', 'Data warehouse', 'Une base unique et propre qui sert de référence.', 'A single clean database used as the reference.', 4, 5, 'M'],
      ['Tableaux de bord interactifs', 'Interactive dashboards', 'Graphiques filtrables par période, équipe, produit.', 'Charts filterable by period, team, product.', 7, 8, 'M'],
      ['Droits d’accès par profil', 'Role-based access', 'Chaque personne ne voit que ce qui la concerne.', 'Everyone sees only what concerns them.', 3, 3, 'S'],
      ['Alertes automatiques', 'Automatic alerts', 'E-mail quand un indicateur dépasse un seuil.', 'E-mail when an indicator crosses a threshold.', 3, 3, 'S'],
      ['Export PDF / Excel', 'PDF / Excel export', 'Rapport mensuel exporté en un clic.', 'Monthly report exported in one click.', 2, 2, 'C']
    ],
    stack: [['Chargement / ETL', 'Python + dbt', 'Transformations versionnées et testées', 'Versioned, tested transformations'], ['Entrepôt / Warehouse', 'PostgreSQL', 'Simple et robuste', 'Simple and robust'], ['Visualisation', 'Metabase ou Power BI', 'Tableaux sans code', 'No-code dashboards'], ['Planification / Scheduling', 'GitHub Actions / cron', 'Chargement nocturne', 'Nightly loads']],
    comps: [['Sources', 'Fichiers, logiciels, bases existants', 'Existing files, software, databases'], ['ETL', 'Extraction, nettoyage, contrôles qualité', 'Extraction, cleaning, quality checks'], ['Entrepôt', 'Données de référence', 'Reference data'], ['Outil de visualisation', 'Tableaux et filtres', 'Dashboards and filters']],
    objectives: [['Décider sur des chiffres fiables', 'Decide on reliable numbers', 'Écart avec les chiffres officiels', 'Gap with official figures', '< 1 %'], ['Gagner du temps', 'Save time', 'Heures de reporting manuel par mois', 'Manual reporting hours per month', '−80 %'], ['Données fraîches', 'Fresh data', 'Délai de mise à jour', 'Refresh delay', '< 24 h']],
    nfr: [['Qualité / Quality', 'Contrôles automatiques sur chaque chargement', 'Automatic checks on every load'], ['Performance', 'Tableaux affichés en moins de 3 s', 'Dashboards load under 3 s']],
    threats: [['Accès à des données sensibles', 'Access to sensitive data', 'Droits par profil, connexion SSO', 'Role-based rights, SSO login'], ['Identifiants de bases dans le code', 'Database credentials in code', 'Coffre à secrets, comptes en lecture seule', 'Secret vault, read-only accounts']],
    risks: [['Données sources de mauvaise qualité', 'Poor source data quality', 4, 4, 'Audit qualité dès la conception', 'Quality audit during design'], ['Indicateurs mal définis', 'Poorly defined KPIs', 3, 4, 'Fiche de définition signée par le client', 'Definition sheet signed by the client']],
    out: [['Saisie de données dans le tableau de bord', 'Data entry in the dashboard'], ['Prévisions par IA (phase 2)', 'AI forecasting (phase 2)']]
  },
  {
    id: 'ml', fr: 'Modèle d’IA / Machine learning', en: 'Machine learning model', code: 'ML',
    kw: ['machine learning', 'apprentissage automatique', 'deep learning', 'prediction', 'prédiction', 'predict', 'prevoir', 'forecast', 'prevision', 'classification', 'detection', 'détection', 'reconnaissance', 'recognition', 'computer vision', 'vision par ordinateur', 'modele ia', 'ai model', 'neural', 'reseau de neurones', 'scoring', 'anomalie', 'anomaly', 'recommandation', 'recommendation'],
    users: ['Équipes métier qui utilisent les prédictions', 'Business teams using predictions'], owner: ['Direction métier', 'Business owner'],
    features: [
      ['Collecte et exploration des données', 'Data collection and exploration', 'Rassembler l’historique et comprendre ce qu’il contient (manques, erreurs, tendances).', 'Gather history and understand it (gaps, errors, trends).', 5, 5, 'M'],
      ['Préparation des données', 'Data preparation', 'Nettoyage, étiquetage et création des variables utiles au modèle.', 'Cleaning, labelling and building useful features.', 6, 8, 'M'],
      ['Modèle de référence', 'Baseline model', 'Un premier modèle simple pour mesurer le point de départ.', 'A simple first model to measure the starting point.', 3, 3, 'M'],
      ['Entraînement et optimisation', 'Training and tuning', 'Tester plusieurs modèles et garder le plus fiable.', 'Try several models and keep the most reliable one.', 7, 8, 'M'],
      ['Évaluation et explicabilité', 'Evaluation and explainability', 'Mesurer la précision sur des données jamais vues et expliquer les décisions.', 'Measure accuracy on unseen data and explain decisions.', 4, 5, 'M'],
      ['API de prédiction', 'Prediction API', 'Le modèle est utilisable par les autres logiciels via une API.', 'Other software can use the model through an API.', 4, 5, 'S'],
      ['Interface de démonstration', 'Demo interface', 'Une page simple pour tester le modèle.', 'A simple page to try the model.', 3, 3, 'S'],
      ['Suivi du modèle en production', 'Model monitoring', 'Alerte si la qualité des prédictions baisse avec le temps.', 'Alert if prediction quality drops over time.', 3, 3, 'C']
    ],
    design: [['Cadrage des données et métriques', 'Data and metric framing', 'DATA', 4, 5], ['Architecture ML et environnement', 'ML architecture and environment', 'ARCH', 3, 3]],
    stack: [['Langage / Language', 'Python', 'Standard en data science', 'Data science standard'], ['Modèles / Models', 'scikit-learn, XGBoost, PyTorch', 'Du simple au profond', 'From simple to deep'], ['Suivi / Tracking', 'MLflow', 'Expériences reproductibles', 'Reproducible experiments'], ['API', 'FastAPI + Docker', 'Déploiement portable', 'Portable deployment']],
    comps: [['Données', 'Historique nettoyé et versionné', 'Cleaned, versioned history'], ['Pipeline d’entraînement', 'Préparation, entraînement, évaluation', 'Preparation, training, evaluation'], ['Registre de modèles', 'Versions et performances', 'Versions and performance'], ['API de prédiction', 'Sert le modèle aux applications', 'Serves the model to applications'], ['Monitoring', 'Dérive et qualité', 'Drift and quality']],
    objectives: [['Prédire juste', 'Predict accurately', 'Précision sur données de test', 'Accuracy on test data', 'à fixer au cadrage'], ['Être utile au métier', 'Be useful to the business', 'Décisions appuyées par le modèle', 'Decisions supported by the model', '≥ 70 %'], ['Être compris', 'Be understood', 'Prédictions expliquées', 'Explained predictions', '100 %']],
    nfr: [['Reproductibilité', 'Chaque résultat reproductible (code + données versionnés)', 'Every result reproducible (versioned code + data)'], ['Éthique / Ethics', 'Contrôle des biais sur les groupes sensibles', 'Bias check on sensitive groups']],
    threats: [['Données personnelles dans l’entraînement', 'Personal data in training', 'Anonymisation et minimisation (RGPD)', 'Anonymisation and minimisation (GDPR)'], ['Empoisonnement des données', 'Data poisoning', 'Contrôle des sources et des valeurs aberrantes', 'Source and outlier checks']],
    risks: [['Pas assez de données de qualité', 'Not enough quality data', 4, 5, 'Audit des données avant de promettre une précision', 'Data audit before promising accuracy'], ['Précision insuffisante', 'Insufficient accuracy', 3, 4, 'Objectif fixé après le modèle de référence', 'Target set after the baseline model']],
    out: [['Collecte de nouvelles données terrain', 'New field data collection'], ['Décision automatique sans humain', 'Fully automatic decisions without a human']]
  },
  {
    id: 'booking', fr: 'Plateforme de réservation', en: 'Booking platform', code: 'RSV',
    kw: ['reservation', 'réservation', 'booking', 'book', 'reserver', 'rendez-vous', 'rdv', 'appointment', 'agenda', 'calendrier', 'calendar', 'creneau', 'slot', 'location', 'rental', 'salle', 'room', 'hotel', 'table', 'planning', 'prise de rendez-vous', 'doctolib'],
    users: ['Clients qui réservent', 'Customers booking'], owner: ['Prestataire', 'Service provider'],
    features: [
      ['Calendrier des disponibilités', 'Availability calendar', 'Les clients voient en temps réel les créneaux libres.', 'Customers see free slots in real time.', 5, 8, 'M'],
      ['Réservation en ligne', 'Online booking', 'Choisir un créneau, confirmer, recevoir une confirmation.', 'Pick a slot, confirm, receive a confirmation.', 5, 8, 'M'],
      ['Annulation et modification', 'Cancel and reschedule', 'Le client annule ou déplace sa réservation selon les règles fixées.', 'Customers cancel or move a booking within set rules.', 3, 3, 'M'],
      ['Rappels automatiques', 'Automatic reminders', 'E-mail ou SMS la veille pour éviter les absences.', 'E-mail or SMS the day before to avoid no-shows.', 3, 3, 'M'],
      ['Espace prestataire', 'Provider space', 'Le prestataire gère horaires, congés et réservations.', 'The provider manages hours, holidays and bookings.', 6, 8, 'M'],
      ['Paiement ou acompte en ligne', 'Online payment or deposit', 'Paiement à la réservation via Stripe.', 'Payment at booking via Stripe.', 4, 5, 'S'],
      ['Comptes clients', 'Customer accounts', 'Historique et réservation en un clic.', 'History and one-click rebooking.', 3, 3, 'S'],
      ['Statistiques d’occupation', 'Occupancy statistics', 'Taux de remplissage et créneaux les plus demandés.', 'Fill rate and most requested slots.', 3, 3, 'C']
    ],
    stack: [['Front-end', 'Next.js', 'Calendrier fluide', 'Smooth calendar'], ['API', 'Node.js (NestJS)', 'Gestion fiable des conflits', 'Reliable conflict handling'], ['Base de données / Database', 'PostgreSQL', 'Verrous contre les doubles réservations', 'Locks against double booking'], ['Rappels / Reminders', 'Brevo (e-mail/SMS)', 'Envoi fiable', 'Reliable delivery'], ['Paiement / Payment', 'Stripe', 'Acomptes sécurisés', 'Secure deposits']],
    comps: [['Interface client', 'Calendrier et réservation', 'Calendar and booking'], ['Espace prestataire', 'Horaires et suivi', 'Hours and tracking'], ['API de réservation', 'Règles, conflits, confirmations', 'Rules, conflicts, confirmations'], ['Base de données', 'Créneaux et réservations', 'Slots and bookings'], ['Notifications', 'Rappels e-mail/SMS', 'E-mail/SMS reminders']],
    objectives: [['Réserver sans téléphoner', 'Book without calling', 'Réservations en ligne', 'Online bookings', '≥ 70 %'], ['Moins d’absences', 'Fewer no-shows', 'Taux d’absence', 'No-show rate', '−50 %'], ['Zéro double réservation', 'Zero double booking', 'Conflits', 'Conflicts', '0']],
    nfr: [['Fiabilité / Reliability', 'Aucune double réservation, même en simultané', 'No double booking, even concurrently'], ['Fuseaux / Time zones', 'Heures affichées dans le fuseau du client', 'Times shown in the customer’s time zone']],
    threats: [['Réservations massives par des robots', 'Bot mass-booking', 'Captcha et limite par compte', 'Captcha and per-account limit'], ['Accès aux données des clients', 'Access to customer data', 'Espace prestataire en 2FA, chiffrement', 'Provider space with 2FA, encryption']],
    risks: [['Règles de réservation complexes', 'Complex booking rules', 3, 4, 'Règles écrites et validées au cadrage', 'Rules written and approved during scoping'], ['Synchronisation avec un agenda existant', 'Sync with an existing calendar', 3, 3, 'Export iCal en phase 1, synchro en phase 2', 'iCal export in phase 1, sync in phase 2']],
    out: [['Synchronisation bidirectionnelle Google/Outlook (phase 2)', 'Two-way Google/Outlook sync (phase 2)'], ['Application mobile native', 'Native mobile app']]
  },
  {
    id: 'business', fr: 'Application de gestion (CRM / ERP / SaaS)', en: 'Business application (CRM / ERP / SaaS)', code: 'APPW',
    kw: ['crm', 'erp', 'saas', 'gestion', 'management', 'logiciel de gestion', 'plateforme', 'platform', 'intranet', 'portail', 'portal', 'clients', 'stock', 'inventaire', 'inventory', 'facturation', 'invoicing', 'ressources humaines', 'hr', 'rh', 'tickets', 'suivi', 'tracking', 'workflow', 'back office', 'administration'],
    users: ['Employés de l’entreprise', 'Company staff'], owner: ['Direction de l’entreprise', 'Company management'],
    features: [
      ['Comptes et rôles', 'Accounts and roles', 'Chaque employé se connecte et voit les fonctions de son rôle.', 'Each employee logs in and sees the features of their role.', 4, 5, 'M'],
      ['Gestion des fiches (clients, produits…)', 'Records management (customers, products…)', 'Créer, rechercher, modifier et archiver les fiches métier.', 'Create, search, edit and archive business records.', 7, 8, 'M'],
      ['Processus métier et validations', 'Business workflows and approvals', 'Les étapes du métier (demande, validation, clôture) sont suivies dans l’outil.', 'Business steps (request, approval, closure) are tracked in the tool.', 7, 8, 'M'],
      ['Tableau de bord', 'Dashboard', 'Les chiffres clés de l’activité sur une page.', 'Key business figures on one page.', 4, 5, 'M'],
      ['Import / export Excel', 'Excel import / export', 'Reprise des données existantes et export pour la comptabilité.', 'Load existing data and export for accounting.', 3, 3, 'M'],
      ['Notifications', 'Notifications', 'E-mail quand une action est attendue.', 'E-mail when an action is required.', 2, 3, 'S'],
      ['Historique et traçabilité', 'History and audit trail', 'Qui a modifié quoi et quand.', 'Who changed what and when.', 3, 3, 'S'],
      ['Connexion avec les outils existants (API)', 'Integration with existing tools (API)', 'Échange automatique avec la messagerie, la compta ou d’autres logiciels.', 'Automatic exchange with e-mail, accounting or other software.', 5, 5, 'C']
    ],
    stack: [['Front-end', 'React + TypeScript', 'Interfaces riches et typées', 'Rich, typed interfaces'], ['API', 'Node.js (NestJS)', 'Architecture modulaire', 'Modular architecture'], ['Base de données / Database', 'PostgreSQL', 'Données relationnelles', 'Relational data'], ['Authentification', 'Keycloak / SSO', 'Rôles et connexion unique', 'Roles and single sign-on'], ['Hébergement / Hosting', 'Docker sur cloud européen', 'Données en Europe (RGPD)', 'Data in Europe (GDPR)']],
    comps: [['Application web', 'Écrans métier', 'Business screens'], ['API', 'Règles métier et droits', 'Business rules and rights'], ['Base de données', 'Fiches et historique', 'Records and history'], ['SSO', 'Connexion et rôles', 'Login and roles'], ['Connecteurs', 'Échanges avec les autres outils', 'Exchanges with other tools']],
    objectives: [['Remplacer Excel et les e-mails', 'Replace Excel and e-mails', 'Processus suivis dans l’outil', 'Processes tracked in the tool', '100 %'], ['Gagner du temps', 'Save time', 'Temps de traitement d’une demande', 'Request handling time', '−40 %'], ['Adoption', 'Adoption', 'Employés actifs chaque semaine', 'Weekly active staff', '≥ 80 %']],
    nfr: [['Disponibilité / Availability', '99,5 % en heures ouvrées', '99.5 % during business hours'], ['RGPD / GDPR', 'Données hébergées en Europe, droit à l’oubli', 'Data hosted in Europe, right to erasure']],
    threats: [['Accès non autorisé', 'Unauthorised access', 'Rôles stricts, SSO, 2FA', 'Strict roles, SSO, 2FA'], ['Injection et XSS', 'Injection and XSS', 'Requêtes paramétrées, échappement, CSP', 'Parameterised queries, escaping, CSP']],
    risks: [['Processus métier mal décrits', 'Business processes poorly described', 4, 4, 'Ateliers avec les utilisateurs au cadrage', 'User workshops during scoping'], ['Reprise des données existantes', 'Migration of existing data', 3, 4, 'Import testé sur un échantillon dès la conception', 'Import tested on a sample during design'], ['Résistance au changement', 'Resistance to change', 3, 3, 'Formation et référents par service', 'Training and champions per team']],
    out: [['Comptabilité complète', 'Full accounting'], ['Application mobile native', 'Native mobile app']]
  },
  {
    id: 'elearning', fr: 'Plateforme e-learning', en: 'E-learning platform', code: 'LMS',
    kw: ['e-learning', 'elearning', 'lms', 'formation en ligne', 'online course', 'cours en ligne', 'courses', 'cours', 'training platform', 'apprendre', 'learning', 'quiz', 'eleves', 'students', 'etudiants', 'ecole', 'school', 'moodle', 'mooc', 'education'],
    users: ['Apprenants', 'Learners'], owner: ['Organisme de formation', 'Training organisation'],
    features: [
      ['Catalogue de cours', 'Course catalogue', 'Les apprenants trouvent et s’inscrivent aux cours.', 'Learners find and enrol in courses.', 4, 5, 'M'],
      ['Lecteur de cours (vidéo, PDF)', 'Course player (video, PDF)', 'Suivre les leçons en vidéo ou en document, reprendre où l’on s’est arrêté.', 'Follow lessons by video or document, resume where you left off.', 6, 8, 'M'],
      ['Quiz et évaluations', 'Quizzes and assessments', 'Quiz notés automatiquement après chaque module.', 'Auto-graded quizzes after each module.', 5, 5, 'M'],
      ['Suivi de progression', 'Progress tracking', 'L’apprenant et le formateur voient l’avancement.', 'Learners and trainers see progress.', 3, 5, 'M'],
      ['Espace formateur', 'Trainer space', 'Le formateur crée ses cours et quiz sans développeur.', 'Trainers build courses and quizzes without a developer.', 6, 8, 'M'],
      ['Certificats', 'Certificates', 'Certificat PDF délivré à la réussite.', 'PDF certificate issued on completion.', 2, 3, 'S'],
      ['Forum / questions', 'Forum / Q&A', 'Les apprenants posent des questions au formateur.', 'Learners ask the trainer questions.', 3, 3, 'C']
    ],
    stack: [['Plateforme', 'Moodle ou Next.js sur mesure', 'Standard ou sur mesure', 'Standard or custom'], ['Vidéo / Video', 'Vimeo / Bunny Stream', 'Lecture fluide et protégée', 'Smooth, protected playback'], ['Base de données / Database', 'PostgreSQL', 'Progression fiable', 'Reliable progress'], ['Standards', 'SCORM / xAPI', 'Compatibilité des contenus', 'Content compatibility']],
    comps: [['Espace apprenant', 'Cours, quiz, progression', 'Courses, quizzes, progress'], ['Espace formateur', 'Création de contenus', 'Content authoring'], ['Service vidéo', 'Diffusion des vidéos', 'Video streaming'], ['Base de données', 'Inscriptions et résultats', 'Enrolments and results']],
    objectives: [['Former à distance', 'Train remotely', 'Apprenants actifs', 'Active learners', 'à fixer / to set'], ['Faire finir les cours', 'Get courses completed', 'Taux de complétion', 'Completion rate', '≥ 60 %'], ['Autonomie des formateurs', 'Trainer autonomy', 'Cours créés sans aide', 'Courses created without help', '100 %']],
    nfr: [['Accessibilité / Accessibility', 'RGAA / WCAG 2.1 AA, sous-titres', 'RGAA / WCAG 2.1 AA, subtitles'], ['Charge / Load', '200 apprenants simultanés', '200 concurrent learners']],
    threats: [['Partage illégal des vidéos', 'Illegal video sharing', 'URLs signées et expirantes', 'Signed, expiring URLs'], ['Triche aux quiz', 'Quiz cheating', 'Questions aléatoires et temps limité', 'Random questions and time limits']],
    risks: [['Contenus pédagogiques en retard', 'Course content late', 4, 4, 'Planning éditorial par module', 'Editorial plan per module'], ['Faible engagement des apprenants', 'Low learner engagement', 3, 3, 'Rappels et progression visible', 'Reminders and visible progress']],
    out: [['Production des vidéos', 'Video production'], ['Classe virtuelle en direct (phase 2)', 'Live virtual classroom (phase 2)']]
  },
  {
    id: 'security', fr: 'Audit et sécurisation (cybersécurité)', en: 'Security audit and hardening', code: 'SEC',
    kw: ['cybersecurite', 'cybersécurité', 'cybersecurity', 'securite', 'sécurité', 'security', 'audit', 'pentest', 'test d intrusion', 'penetration', 'soc', 'siem', 'iso 27001', 'nis2', 'conformite', 'compliance', 'vulnerabilite', 'vulnerability', 'piratage', 'hack', 'ransomware', 'phishing', 'firewall', 'pare-feu'],
    users: ['Utilisateurs et équipes IT', 'Users and IT teams'], owner: ['Direction / RSSI', 'Management / CISO'],
    features: [
      ['Inventaire des actifs', 'Asset inventory', 'Lister serveurs, postes, applications et données sensibles.', 'List servers, workstations, applications and sensitive data.', 4, 5, 'M'],
      ['Analyse de risques (EBIOS RM)', 'Risk analysis (EBIOS RM)', 'Identifier ce qui pourrait arriver et ce que cela coûterait.', 'Identify what could happen and what it would cost.', 5, 8, 'M'],
      ['Scan de vulnérabilités', 'Vulnerability scan', 'Recherche automatique des failles connues.', 'Automatic search for known weaknesses.', 3, 5, 'M'],
      ['Test d’intrusion', 'Penetration test', 'Des experts tentent d’entrer comme un vrai attaquant, avec accord écrit.', 'Experts try to break in like a real attacker, with written consent.', 6, 8, 'M'],
      ['Revue de configuration et des accès', 'Configuration and access review', 'Mots de passe, droits, sauvegardes, pare-feu.', 'Passwords, rights, backups, firewalls.', 4, 5, 'M'],
      ['Plan de remédiation priorisé', 'Prioritised remediation plan', 'Liste des corrections classées par urgence et coût.', 'List of fixes ranked by urgency and cost.', 3, 5, 'M'],
      ['Sensibilisation des équipes', 'Staff awareness training', 'Formation et simulation d’hameçonnage.', 'Training and phishing simulation.', 3, 3, 'S'],
      ['Mise en place de la surveillance', 'Monitoring set-up', 'Journaux centralisés et alertes (SIEM).', 'Centralised logs and alerts (SIEM).', 5, 5, 'C']
    ],
    design: [['Périmètre, règles d’engagement et autorisations', 'Scope, rules of engagement and authorisations', 'SEC', 3, 3], ['Méthodologie et outillage', 'Methodology and tooling', 'SEC', 2, 2]],
    test: [['Validation des constats avec les équipes', 'Findings validation with the teams', 'SEC', 3, 3], ['Contre-test des corrections urgentes', 'Re-test of urgent fixes', 'SEC', 3, 3]],
    stack: [['Analyse de risques', 'EBIOS RM (ANSSI)', 'Méthode française de référence', 'French reference method'], ['Scan', 'OpenVAS / Nessus', 'Couverture large', 'Broad coverage'], ['Pentest web', 'Burp Suite, OWASP ZAP', 'Standard du métier', 'Industry standard'], ['Surveillance / Monitoring', 'Wazuh (SIEM)', 'Open source', 'Open source']],
    comps: [['Périmètre audité', 'Réseau, postes, applications', 'Network, workstations, applications'], ['Outils d’audit', 'Scan, pentest, revue', 'Scan, pentest, review'], ['Rapport et plan', 'Constats et corrections', 'Findings and fixes'], ['SIEM', 'Surveillance continue', 'Continuous monitoring']],
    objectives: [['Connaître son exposition', 'Know the exposure', 'Actifs inventoriés', 'Assets inventoried', '100 %'], ['Corriger le critique', 'Fix critical issues', 'Failles critiques corrigées', 'Critical flaws fixed', '100 % en 30 j'], ['Former', 'Train', 'Taux de clic à l’hameçonnage', 'Phishing click rate', '< 5 %']],
    nfr: [['Confidentialité / Confidentiality', 'Rapport chiffré, diffusion restreinte', 'Encrypted report, restricted distribution'], ['Légalité / Legality', 'Autorisation écrite avant tout test', 'Written authorisation before any test']],
    threats: [['Interruption de service pendant les tests', 'Service disruption during tests', 'Fenêtres de test et sauvegardes vérifiées', 'Test windows and verified backups'], ['Fuite du rapport d’audit', 'Audit report leak', 'Chiffrement et accès nominatif', 'Encryption and named access']],
    risks: [['Accès aux systèmes accordés tardivement', 'System access granted late', 4, 3, 'Autorisations signées au jalon M1', 'Authorisations signed at milestone M1'], ['Faille critique découverte en production', 'Critical flaw found in production', 3, 5, 'Procédure d’escalade immédiate', 'Immediate escalation procedure']],
    out: [['Correction de toutes les failles par l’équipe d’audit', 'All fixes done by the audit team'], ['Certification ISO 27001', 'ISO 27001 certification']]
  },
  {
    id: 'iot', fr: 'Objets connectés (IoT)', en: 'Connected devices (IoT)', code: 'IOT',
    kw: ['iot', 'objets connectes', 'objet connecte', 'connected device', 'capteur', 'capteurs', 'sensor', 'sensors', 'arduino', 'raspberry', 'esp32', 'domotique', 'smart home', 'maison connectee', 'temperature', 'mesure', 'telemetrie', 'telemetry', 'industrie 4.0', 'machine', 'robot'],
    users: ['Opérateurs et techniciens', 'Operators and technicians'], owner: ['Exploitant', 'Operator'],
    features: [
      ['Choix et prototypage du matériel', 'Hardware selection and prototyping', 'Choisir capteurs et cartes, monter un prototype.', 'Choose sensors and boards, build a prototype.', 6, 8, 'M'],
      ['Firmware des capteurs', 'Sensor firmware', 'Programme embarqué qui mesure et envoie les données.', 'Embedded program that measures and sends data.', 7, 8, 'M'],
      ['Transmission des données', 'Data transmission', 'Envoi fiable et chiffré (Wi-Fi, LoRa ou 4G).', 'Reliable, encrypted sending (Wi-Fi, LoRa or 4G).', 4, 5, 'M'],
      ['Plateforme de collecte', 'Collection platform', 'Réception et stockage des mesures dans le cloud.', 'Receiving and storing measurements in the cloud.', 5, 5, 'M'],
      ['Tableau de bord temps réel', 'Real-time dashboard', 'Graphiques des mesures en direct.', 'Live charts of measurements.', 4, 5, 'M'],
      ['Alertes', 'Alerts', 'SMS ou e-mail si une valeur sort des limites.', 'SMS or e-mail if a value goes out of range.', 3, 3, 'S'],
      ['Mise à jour à distance', 'Over-the-air updates', 'Mettre à jour les capteurs sans se déplacer.', 'Update devices without going on site.', 4, 5, 'C']
    ],
    stack: [['Matériel / Hardware', 'ESP32 + capteurs', 'Bon marché, Wi-Fi intégré', 'Cheap, built-in Wi-Fi'], ['Protocole / Protocol', 'MQTT sur TLS', 'Léger et chiffré', 'Lightweight and encrypted'], ['Stockage / Storage', 'InfluxDB / TimescaleDB', 'Séries temporelles', 'Time series'], ['Visualisation', 'Grafana', 'Tableaux temps réel', 'Real-time dashboards']],
    comps: [['Capteurs', 'Mesure sur le terrain', 'Field measurement'], ['Passerelle / broker MQTT', 'Réception sécurisée', 'Secure reception'], ['Base temporelle', 'Historique des mesures', 'Measurement history'], ['Grafana', 'Visualisation et alertes', 'Visualisation and alerts']],
    objectives: [['Surveiller à distance', 'Monitor remotely', 'Données reçues', 'Data received', '≥ 99 %'], ['Réagir vite', 'React fast', 'Délai d’alerte', 'Alert delay', '< 1 min'], ['Autonomie', 'Autonomy', 'Batterie des capteurs', 'Sensor battery life', '≥ 6 mois']],
    nfr: [['Robustesse', 'Reprise automatique après coupure', 'Automatic recovery after outage'], ['Énergie / Power', 'Mode basse consommation', 'Low-power mode']],
    threats: [['Capteur piraté', 'Hijacked device', 'Certificat par appareil, TLS, mot de passe par défaut supprimé', 'Per-device certificate, TLS, no default password'], ['Fausses données injectées', 'Fake data injected', 'Authentification de chaque appareil', 'Authentication of every device']],
    risks: [['Délais de livraison du matériel', 'Hardware delivery delays', 4, 4, 'Commande dès le cadrage, composants de secours', 'Order during scoping, spare parts'], ['Couverture réseau sur site', 'On-site network coverage', 3, 4, 'Test radio sur site en conception', 'On-site radio test during design']],
    out: [['Fabrication en série', 'Mass manufacturing'], ['Certification CE', 'CE certification']]
  },
  {
    id: 'software', fr: 'Application web sur mesure', en: 'Custom web application', code: 'PRJ',
    kw: [],
    users: ['Utilisateurs finaux', 'End users'], owner: ['Client', 'Client'],
    features: [
      ['Comptes utilisateurs et connexion', 'User accounts and login', 'Chaque utilisateur a son compte sécurisé.', 'Each user has a secure account.', 4, 5, 'M'],
      ['Fonctionnalité principale 1', 'Core feature 1', 'Première fonction clé décrite par le client (à détailler au cadrage).', 'First key feature described by the client (detailed during scoping).', 7, 8, 'M'],
      ['Fonctionnalité principale 2', 'Core feature 2', 'Deuxième fonction clé (à détailler au cadrage).', 'Second key feature (detailed during scoping).', 6, 8, 'M'],
      ['Administration', 'Administration', 'Interface pour gérer utilisateurs et contenus.', 'Interface to manage users and content.', 5, 5, 'M'],
      ['Notifications par e-mail', 'E-mail notifications', 'Messages automatiques aux bons moments.', 'Automatic messages at the right time.', 2, 3, 'S'],
      ['Tableau de bord', 'Dashboard', 'Indicateurs clés sur une page.', 'Key indicators on one page.', 4, 5, 'S'],
      ['Version anglaise', 'English version', 'Interface en français et en anglais.', 'Interface in French and English.', 3, 3, 'C']
    ],
    stack: [['Front-end', 'React / Next.js', 'Standard du marché', 'Market standard'], ['API', 'Node.js ou Python', 'Selon les besoins', 'Depending on needs'], ['Base de données / Database', 'PostgreSQL', 'Fiable et gratuite', 'Reliable and free'], ['Hébergement / Hosting', 'Vercel + Render', 'Déploiement automatique', 'Automatic deployment']],
    comps: [['Application web', 'Écrans utilisateurs', 'User screens'], ['API', 'Règles métier et sécurité', 'Business rules and security'], ['Base de données', 'Données de l’application', 'Application data'], ['Administration', 'Gestion', 'Management']],
    objectives: [['Répondre au besoin du client', 'Meet the client’s need', 'Exigences « Must » livrées', '"Must" requirements delivered', '100 %'], ['Satisfaction', 'Satisfaction', 'Note des utilisateurs en recette', 'User rating at acceptance', '≥ 4/5'], ['Qualité', 'Quality', 'Anomalies bloquantes à la mise en ligne', 'Blocking bugs at go-live', '0']],
    nfr: [['Performance', 'Pages en moins de 2 s', 'Pages under 2 s']],
    threats: [['Accès non autorisé', 'Unauthorised access', 'Mots de passe hachés, sessions sécurisées, 2FA admin', 'Hashed passwords, secure sessions, admin 2FA']],
    risks: [['Besoin flou au départ', 'Unclear initial need', 4, 4, 'Ateliers de cadrage et maquettes validées', 'Scoping workshops and approved mock-ups']],
    out: [['Application mobile native', 'Native mobile app']]
  }
];
if (typeof module !== 'undefined') module.exports = KB;
