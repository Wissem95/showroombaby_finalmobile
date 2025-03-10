Implémente une configuration complète pour mon application ShowroomBaby en React Native (Expo SDK 52) avec TailwindCSS via NativeWind. J'ai besoin de :

1. Structure des dossiers claire et modulaire
2. Configuration correcte de NativeWind (babel.config.js, tailwind.config.js, etc.)
3. Thème personnalisé avec les couleurs de l'application (primary: #FF7043, secondary: #FFA726)
4. Types TypeScript correctement configurés
5. Service API avec Axios pour communiquer avec mon backend Laravel
6. Configuration des variables d'environnement (.env)

L'application devrait avoir un design responsive adapté aux mobiles avec une interface utilisateur intuitive et moderne, similaire à Vinted mais pour des articles de bébé/enfants. Utilise des composants réutilisables et bien structurés.

Implémente un système d'authentification similaire à Vinted pour mon application ShowroomBaby où les utilisateurs peuvent naviguer sans être connectés et se connecter depuis l'écran profil. J'ai besoin de :

1. Un écran de profil qui affiche soit des options de connexion/inscription, soit les informations de l'utilisateur
2. Des écrans modaux pour la connexion et l'inscription
3. Gestion du token JWT avec AsyncStorage
4. Service d'authentification qui communique avec mon API Laravel (endpoints : /api/auth/login, /api/auth/register, /api/auth/logout)
5. Gestion des états de chargement et des erreurs
6. Validation des formulaires
7. Design attrayant avec TailwindCSS/NativeWind

Le code doit être propre, bien commenté, et les composants doivent être réutilisables.

Implémente l'écran d'accueil de mon application ShowroomBaby qui affiche une liste de produits depuis mon API Laravel. J'ai besoin de :

1. Une grille de produits avec images, prix et informations essentielles
2. Pull-to-refresh et pagination (infinite scroll)
3. Filtres par catégories avec sélecteur horizontal
4. Section "Produits tendance" en haut de l'écran
5. Barre de recherche avec suggestions
6. Gestion des états de chargement (skeleton loaders)
7. Gestion des erreurs API
8. Design responsive avec TailwindCSS/NativeWind

Les données doivent être récupérées de l'API (/api/products) avec tous les paramètres de filtrage nécessaires. Assure-toi que l'interface soit fluide et performante même avec beaucoup d'images.

Implémente l'écran de détails d'un produit pour mon application ShowroomBaby qui affiche toutes les informations d'un article et permet d'interagir avec. J'ai besoin de :

1. Carousel d'images avec indicateur de position
2. Informations détaillées (titre, prix, description, état, taille, etc.)
3. Informations sur le vendeur avec possibilité de contacter
4. Section "Produits similaires" en bas de l'écran
5. Bouton pour ajouter/retirer des favoris
6. Bouton de signalement pour contenu inapproprié
7. Gestion des états de chargement et des erreurs
8. Design attrayant avec TailwindCSS/NativeWind

Les données doivent être récupérées via l'API (/api/products/{id}). Assure-toi que l'expérience utilisateur soit fluide et intuitive.

Implémente un système de messagerie complet pour mon application ShowroomBaby permettant aux utilisateurs de communiquer entre eux. J'ai besoin de :

1. Liste des conversations avec aperçu du dernier message et photo de profil
2. Écran de conversation avec historique des messages et champ de saisie
3. Possibilité de référencer un produit dans un message
4. Indicateurs de messages non lus
5. Pull-to-refresh et chargement des messages précédents
6. Gestion des états de chargement et des erreurs
7. Mise à jour en temps réel des messages (polling ou WebSocket si possible)
8. Design moderne avec TailwindCSS/NativeWind

Utilise les endpoints API (/api/messages/conversations, /api/messages/conversation/{userId}, etc.) pour récupérer et envoyer les messages. Le système doit être performant même avec beaucoup de messages.

Implémente un écran de création d'annonce pour mon application ShowroomBaby permettant aux utilisateurs de mettre en vente leurs articles. J'ai besoin de :

1. Formulaire multi-étapes avec indicateur de progression
2. Upload de plusieurs photos avec prévisualisation et possibilité de réorganiser
3. Champs pour titre, description, prix, catégorie, état, taille, etc.
4. Sélecteur de catégorie avec sous-catégories
5. Validation des champs avec messages d'erreur
6. Gestion de l'envoi des données avec barre de progression
7. Design intuitif et attrayant avec TailwindCSS/NativeWind
8. Gestion des erreurs API

Utilise l'endpoint API POST /api/products avec multipart/form-data pour l'envoi des images et des données. L'interface doit être simple et guider l'utilisateur à travers le processus.

Implémente un système de recherche et de filtrage avancé pour mon application ShowroomBaby. J'ai besoin de :

1. Barre de recherche avec suggestions et historique de recherche
2. Filtres par catégorie, prix (min/max), taille, état, etc.
3. Tri par pertinence, prix (croissant/décroissant), date
4. Interface de filtre modal avec application facile des filtres
5. Affichage des filtres actifs avec possibilité de les supprimer individuellement
6. Sauvegarde des filtres récents
7. Gestion des états de chargement et des résultats vides
8. Design moderne et intuitif avec TailwindCSS/NativeWind

Utilise l'endpoint API GET /api/products avec les paramètres de requête appropriés. L'interface doit être réactive et les filtres doivent être faciles à appliquer.

Implémente un système de notifications complet pour mon application ShowroomBaby. J'ai besoin de :

1. Centre de notifications avec liste de toutes les notifications
2. Différents types de notifications (message, vente, achat, baisse de prix, etc.)
3. Indicateur du nombre de notifications non lues sur l'icône
4. Possibilité de marquer comme lu ou supprimer les notifications
5. Pull-to-refresh pour charger les nouvelles notifications
6. Gestion des états de chargement et des erreurs
7. Design moderne avec TailwindCSS/NativeWind
8. Intégration des notifications push (si possible)

Utilise les endpoints API pour les notifications (/api/notifications, /api/notifications/unread/count, etc.). Le système doit être capable de gérer différents types de notifications avec leurs propres actions.

Implémente un écran de profil complet pour mon application ShowroomBaby avec paramètres utilisateur. J'ai besoin de :

1. Vue des informations du profil (photo, nom, évaluations, date d'inscription)
2. Liste des produits mis en vente par l'utilisateur
3. Statistiques (nombre de ventes, achats, évaluations)
4. Section paramètres avec:
   - Modification des informations personnelles
   - Changement de mot de passe
   - Notifications (activer/désactiver)
   - Confidentialité
   - Aide et support
   - Déconnexion
5. Option pour supprimer le compte
6. Gestion des états de chargement et des erreurs
7. Design attrayant avec TailwindCSS/NativeWind

Utilise les endpoints API appropriés pour récupérer et modifier les données utilisateur. L'interface doit être intuitive et facile à naviguer.

Optimise mon application ShowroomBaby pour le déploiement sur Infomaniak. J'ai besoin de :

1. Configuration de l'environnement de production (.env.production)
2. Optimisation des performances (lazy loading, memoization, etc.)
3. Compression des images et assets
4. Configuration du backend Laravel pour le déploiement sur Infomaniak
5. Instructions pour générer les builds iOS et Android
6. Configuration des certificats et signatures nécessaires
7. Stratégie de déploiement continu
8. Vérifications pré-déploiement (tests, linting, etc.)

L'application doit être rapide, stable et prête pour une utilisation en production. Fournis des instructions détaillées pour chaque étape du déploiement.
