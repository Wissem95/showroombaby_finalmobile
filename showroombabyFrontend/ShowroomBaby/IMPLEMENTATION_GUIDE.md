# Guide d'Implémentation Frontend - ShowroomBaby

## Introduction

Ce document liste toutes les fonctionnalités à implémenter dans l'application mobile ShowroomBaby basée sur l'API backend existante. L'application est développée avec React Native et Expo.

## Problème Actuel

D'après les logs, il semble y avoir une erreur dans le code qui provoque le message :

> Warning: React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: undefined.

Ce type d'erreur survient généralement lorsqu'un composant est importé incorrectement ou n'est pas exporté correctement.

## Fonctionnalités à Implémenter

### 1. Authentification

- **Inscription** : Création de compte utilisateur
- **Connexion** : Authentification avec email/mot de passe
- **Déconnexion** : Nettoyage du token et des données utilisateur
- **Gestion du profil** : Modification des informations personnelles
- **Changement de mot de passe**
- **Suppression de compte**

### 2. Produits

- **Listing des produits** : Affichage avec pagination et filtres
- **Détails d'un produit** : Vue détaillée avec images et informations
- **Création d'une annonce** : Formulaire avec upload d'images
- **Produits similaires** : Suggestion de produits similaires
- **Produits tendance** : Affichage des produits populaires
- **Recherche** : Recherche par mot-clé et filtres avancés

### 3. Messagerie

- **Liste des conversations** : Affichage des discussions récentes
- **Détail d'une conversation** : Historique des messages avec un utilisateur
- **Envoi de message** : Avec possibilité de référencer un produit
- **Notifications de messages** : Indicateur de messages non lus
- **Archivage** : Gestion des conversations archivées

### 4. Notifications

- **Centre de notifications** : Liste de toutes les notifications
- **Gestion des notifications** : Marquer comme lu, archiver, supprimer
- **Badge de notification** : Indicateur du nombre de notifications non lues

### 5. Favoris

- **Ajout/Suppression de favoris** : Marquer un produit comme favori
- **Liste des favoris** : Affichage des produits favoris

### 6. Catégories

- **Affichage des catégories** : Liste des catégories disponibles
- **Filtrage par catégorie** : Recherche de produits par catégorie

### 7. Signalements

- **Signaler un produit** : Formulaire de signalement avec raison

## Architecture Recommandée

L'architecture actuelle semble suivre un modèle MVC ou similaire avec:

- **Models** : Définition des types de données
- **Views/Screens** : Interface utilisateur
- **Controllers** : Logique métier
- **Services** : Communication avec l'API
- **Store** : Gestion de l'état global (Redux)

## Priorités d'Implémentation

1. **Correction des bugs actuels** (erreur de composant invalide)
2. **Authentification** (base pour toutes les autres fonctionnalités)
3. **Listing et détail des produits** (fonctionnalité principale)
4. **Messagerie** (communication entre utilisateurs)
5. **Autres fonctionnalités** (favoris, notifications, etc.)

## Recommandations Techniques

- Assurer la compatibilité avec les dernières versions des packages React Native
- Mettre en place une gestion d'état cohérente (Redux est déjà utilisé)
- Implémenter un système de gestion des erreurs API
- Ajouter des tests unitaires et d'intégration
- Optimiser les performances pour le chargement des images

## Correction du Bug Actuel

Vérifier dans le navigateur (AppNavigator) et les écrans que tous les composants sont correctement importés et exportés. L'erreur dans les logs indique un problème à la ligne 28 de App.tsx, mais le fichier ne contient que 21 lignes. Il peut y avoir un problème d'importation dans un composant utilisé par AppNavigator.
