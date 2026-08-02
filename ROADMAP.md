# Roadmap Shazax

Objectif: transformer l'application React/Vite actuelle en plateforme marocaine d'etudes superieures, fiable, securisee et utile aux etudiants pour explorer les etablissements, programmes, admissions et ressources academiques.

## Phase 1 - Securite

- Remplacer l'acces admin client-side actuel par une protection Clerk basee sur des roles.
- Supprimer les identifiants admin codes en dur du front-end.
- Definir des regles Firestore strictes pour `resources`, `waitlist`, `users` et `analytics_visits`.
- Limiter les operations sensibles aux comptes administrateurs verifies.
- Verifier que les secrets restent hors du bundle Vite et hors du depot.
- Ajouter une politique de confidentialite pour les emails, analytics et comptes etudiants.
- Reduire les donnees personnelles collectees dans l'analytics maison.
- Masquer les stack traces de `ErrorBoundary` en production.

## Phase 2 - Refactorisation

- Decouper `HomePage.jsx` en sections: hero, waitlist, demo, testimonials, CTA et footer.
- Decouper `AdminPage.jsx` en modules: auth, analytics, waitlist, utilisateurs, ressources et formulaires.
- Decouper `LearnPage.jsx` en composants: liste des modules, filtres, liste des ressources, progression.
- Centraliser les constantes `modules` et `categories` dans une source unique.
- Supprimer ou reintegrer les composants orphelins: `AdminForm`, `ModuleCard`, `ModuleModal`, `HeroPanel`.
- Creer des hooks dedies pour Firestore: ressources, utilisateurs, waitlist, analytics.
- Corriger les problemes d'encodage visibles dans l'interface.
- Harmoniser la marque: choisir `Shazax` ou `Shazaxx` partout.

## Phase 3 - Institutions

- Creer un modele de donnees pour les institutions marocaines: universite, ecole/faculte, ville, type, statut public/prive.
- Ajouter les fiches institutions avec description, localisation, domaines, contacts et liens officiels.
- Ajouter des filtres par ville, type d'etablissement, domaine et niveau.
- Prevoir une validation admin avant publication des institutions.
- Structurer les donnees pour couvrir les universites, FST, ENSA, ENCG, EST, facultes et ecoles privees.
- Dy !!

## Phase 4 - Programmes

- Creer un modele de programme: institution, filiere, diplome, niveau, duree, langue, mode, prerequis.
- Ajouter les semestres, modules, credits et ressources associees.
- Permettre la navigation institution -> programme -> semestre -> module -> ressources.
- Ajouter une recherche globale par filiere, mot-cle, ville et etablissement.
- Distinguer les contenus officiels, communautaires et verifies.

## Phase 5 - Admissions

- Modeliser les admissions: conditions, seuils, concours, dates, documents requis, frais et liens officiels.
- Ajouter des pages d'admission par programme et institution.
- Ajouter un calendrier des echeances importantes.
- Ajouter des alertes pour les dates limites et ouvertures de candidature.
- Prevoir une gestion admin des campagnes d'admission par annee universitaire.
- Ajouter un indicateur de fiabilite et date de derniere verification des informations.

## Phase 6 - Dashboard Etudiant

- Synchroniser la progression et les favoris avec le compte Clerk au lieu de seulement `localStorage`.
- Ajouter un espace personnel: programmes suivis, ressources sauvegardees, checklist d'admission.
- Ajouter recommandations de ressources selon filiere, semestre et objectifs.
- Ajouter historique de consultation et progression par module.
- Ajouter notifications pour nouvelles ressources, corrections et admissions.
- Prevoir un mode mobile prioritaire pour consultation rapide.

## Phase 7 - Administration

- Construire un vrai back-office securise par roles: owner, admin, editeur, moderateur.
- Ajouter CRUD complet pour institutions, programmes, modules, ressources et admissions.
- Ajouter workflow de moderation: brouillon, en revue, publie, archive.
- Ajouter upload de fichiers via stockage gere au lieu de simples URLs externes.
- Ajouter validation des URLs, doublons, champs obligatoires et formats de fichiers.
- Ajouter exports CSV pour waitlist, utilisateurs et contenus.
- Ajouter audit log pour les actions sensibles.

## Phase 8 - Tests

- Ajouter ESLint et un script `npm run lint`.
- Ajouter tests unitaires pour hooks, utilitaires et validation des formulaires.
- Ajouter tests d'integration pour les routes principales et l'etat d'authentification.
- Ajouter tests end-to-end pour waitlist, login, consultation ressources et admin.
- Ajouter verification de build dans CI.
- Ajouter tests de securite minimaux autour des regles Firestore.
- Ajouter donnees de seed pour developpement local.

## Phase 9 - Lancement

- Preparer les contenus minimum viables: institutions prioritaires, programmes populaires et ressources verifiees.
- Finaliser SEO, metadata, favicon, sitemap et pages legales.
- Configurer monitoring erreurs, analytics respectueuse de la confidentialite et alerting.
- Tester performance mobile, accessibilite et navigation sur connexions lentes.
- Mettre en place un processus de verification des informations d'admission.
- Lancer une beta fermee avec etudiants marocains, collecter feedback et corriger les blocages.
- Lancer publiquement avec une roadmap visible et un canal de contribution.

## Priorite Immediate

1. Securiser l'admin et Firestore.
2. Stabiliser le modele de donnees institutions/programmes/admissions.
3. Refactorer les grandes pages pour accelerer les prochaines evolutions.
4. Construire l'experience etudiante autour de la recherche, des favoris et de la progression.
5. Ajouter tests et processus de lancement.
