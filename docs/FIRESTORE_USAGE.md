# Firestore Usage

Ce document decrit la consommation Firestore actuelle et les precautions a garder avant de connecter Shazax Concours a des donnees distantes.

## Lectures par page

- `/learn`
  - Lit `resources` via `useResources`.
  - Utilise un listener `onSnapshot` limite pour garder les ressources publiques a jour.
  - Utilise le cache local `shazax_resources_cache` comme secours si Firestore echoue.

- `/admin`
  - Lit `resources` seulement quand l onglet `Resources` est ouvert.
  - Lit `waitlist` seulement quand l onglet `Emails & Contact` est ouvert.
  - Lit `analytics_visits` seulement quand l onglet `Live Analytics` est ouvert.
  - Lit `users` seulement quand l onglet `Users` est ouvert.
  - Lit les institutions via l'API serveur consolidee `/api/academic?entity=institutions`.

- Routes protegees par roles
  - `useUserRole` lit temporairement `user_roles/{clerkUserId}` cote client.
  - Cette lecture est mise en cache en memoire pour la session navigateur afin d eviter les doublons UI.
  - Les API serveur relisent toujours les roles avec Firebase Admin SDK pour les operations sensibles.

- Hooks academiques
  - `useInstitutions`, `usePrograms`, `useProgramYears`, `useSemesters`, `useAcademicModules`.
  - Utilisent `getDocs` avec filtre parent, `status == published`, tri par `order`, et limite.
  - Les hooks dependants ne lancent pas de requete sans parent ID.

- `/concours`
  - Ne lit pas Firestore actuellement.
  - Donnees, progression, favoris, erreurs et admin Concours restent locaux.

## Ecritures

- `analytics_visits`
  - Ecriture client via `trackPageVisit`.
  - Ignore les routes `/concours` et `/admin/concours`.
  - Deduplication courte par chemin pour limiter les doubles effets React StrictMode.

- `waitlist`
  - Ecriture client via `addEmail`.
  - Envoie aussi le contact vers Formspree.

- `users`
  - Ecriture client via `UserSync` pour synchroniser les donnees Clerk minimales.
  - Deduplication memoire par utilisateur et par donnees stables pendant la session.

- `resources`
  - Lecture client temporaire via `useResources`.
  - Creation/suppression admin via API serveur.
  - Anciennes fonctions directes dans `useResources` restent pour compatibilite mais ne doivent plus etre utilisees pour l admin.

- `institutions`
  - Gestion admin via API serveur avec Firebase Admin SDK.
  - Lecture publique possible uniquement pour les institutions publiees et non supprimees.

## Risques de quota

- Les listeners temps reel coutent une lecture initiale par document retourne, puis une lecture par changement recu.
- Un listener ouvert sur une collection entiere devient dangereux quand la collection grandit.
- React StrictMode peut relancer les effets en developpement. Les effets doivent donc etre idempotents.
- Les ecritures analytics peuvent consommer vite le quota si elles sont declenchees a chaque rendu ou sur trop de routes.
- Les dashboards admin doivent charger les collections seulement quand l onglet concerne est visible.

## Bonnes pratiques pour Shazax Concours

- Ne pas sauvegarder une reponse QCM distante apres chaque clic.
- Garder l etat de session local pendant le quiz.
- Synchroniser par lots :
  - au demarrage de session;
  - a la fin de session;
  - lors d une pause explicite;
  - eventuellement toutes les 30 a 60 secondes si le backend est pret.
- Separer les lectures publiques des questions publiees et les operations admin.
- Utiliser des API serveur pour toute creation, modification, publication, archivage ou code d activation.
- Ajouter pagination, limites et filtres parent pour `concours_questions`.
- Eviter `onSnapshot` pour les grandes banques de questions; preferer `getDocs` pagine ou API paginee.
- Stocker les evenements fins comme temps par question, hints et choix dans un buffer local, puis envoyer un resume.

## Messages de quota

Les erreurs `resource-exhausted` doivent etre affichees comme des problemes de quota ou de limite de lecture, pas comme des erreurs generiques. Elles doivent inviter a attendre la remise a zero ou a reduire les lectures.
