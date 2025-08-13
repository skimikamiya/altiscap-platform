# ALTISCAP - Plateforme M&A Digital

Plateforme de M&A digital pour due diligence, valorisation et dossiers de vente.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec Supabase
- **Système de crédits** pour les analyses
- **Interface d'administration** pour la gestion des utilisateurs
- **Analyses IA** pour la due diligence
- **Gestion des paiements** avec Stripe

## 🛠️ Installation

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Configurer les variables d'environnement (voir `.env.example`)
4. Exécuter les migrations Supabase
5. Lancer le serveur de développement : `npm run dev`

## 🔧 Configuration Supabase

1. Créer un nouveau projet Supabase
2. Exécuter la migration `supabase/migrations/20250113000000_complete_altiscap_system.sql`
3. Configurer les variables d'environnement avec vos clés Supabase

## 👤 Compte Administrateur

Pour accéder à l'interface d'administration, créez un compte avec l'email `admin@altiscap.com` ou modifiez la logique dans `ProtectedRoute.tsx`.

## 💳 Système de Crédits

- **50 crédits gratuits** à l'inscription
- **5 crédits** par analyse de due diligence
- **Packs de crédits** disponibles à l'achat
- **Historique des transactions** complet

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentification JWT avec Supabase
- Politiques de sécurité granulaires
- Fonctions RPC sécurisées