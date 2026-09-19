# Firestore Usage

Ce document resume les lectures/ecritures Firestore actuelles et les limites a respecter avant de connecter Shazax Concours a Firebase.

## Collections

### `user_roles`
- Lecture client temporaire: `useUserRole` lit `user_roles/{clerkUserId}` pour afficher les routes protegees.
- Lecture serveur: les API verifient le meme document avec Firebase Admin SDK avant toute operation sensible.
- Optimisation: cache memoire cote serveur pendant 5 minutes maximum, et cache memoire cote navigateur pendant 5 minutes.
- Important: ces caches reduisent les lectures, mais les permissions sensibles restent verifiees cote serveur.

### `resources`
- Lecture publique: `useResources` utilise une lecture ponctuelle limitee, pas un listener temps reel.
- Cache local: `shazax_resources_cache` sert de secours si Firestore echoue.
- Ecritures admin: creation, modification et suppression passent par `/api/resources`.
- Limite actuelle: 200 documents par lecture client, 300 maximum cote API.

### `institutions`
- Lecture publique: `/api/academic?view=learn` et `/api/academic?entity=institutions` retournent les contenus publies.
- Lecture admin: `/api/academic?entity=institutions&admin=true`.
- Ecritures: CRUD admin via API serveur uniquement.
- Les erreurs de quota doivent retourner `503` avec `FIRESTORE_QUOTA_EXCEEDED`.

### `programs`, `program_years`, `semesters`, `modules`
- Lecture publique: via `/api/academic?view=learn` pour la navigation Learn.
- Lecture admin: via `/api/academic?entity=...&admin=true`.
- Ecritures: via `/api/academic`.
- Chaque lecture dependante doit filtrer par parent (`institutionId`, `programId`, `programYearId`, `semesterId`) et utiliser une limite.

### `waitlist`
- Ecriture client: `addEmail` ajoute une adresse depuis la landing page.
- Lecture admin: seulement quand l onglet `Emails & Contact` est ouvert.
- Listener: limite a 100 documents.

### `analytics_visits`
- Ecriture client: `trackPageVisit`, dedupliquee par route dans `sessionStorage`.
- Desactivation: definir `VITE_ENABLE_CUSTOM_ANALYTICS=false`.
- Lecture admin: seulement quand l onglet `Live Analytics` est ouvert.
- Listener: limite a 50 documents.
- Vercel Analytics reste separe et peut continuer sans Firestore.

### `users`
- Ecriture client: `UserSync` synchronise les donnees Clerk minimales.
- Deduplication: cache memoire par utilisateur et valeurs stables pendant la session.
- Lecture admin: seulement quand l onglet `Users` est ouvert, limite a 100 documents.

## Listeners actifs

- `AdminPage` utilise encore `onSnapshot` pour:
  - `waitlist`, uniquement onglet `Emails & Contact`;
  - `analytics_visits`, uniquement onglet `Live Analytics`;
  - `users`, uniquement onglet `Users`.
- Chaque listener retourne `unsubscribe`.
- `resources` n utilise plus `onSnapshot` cote public.

## Gestion du quota

- `resource-exhausted` est traite comme une limite temporaire.
- Les API doivent retourner:

```json
{
  "success": false,
  "error": "Firestore quota exceeded.",
  "code": "FIRESTORE_QUOTA_EXCEEDED",
  "retryable": true
}
```

- L interface doit afficher: `Le quota Firebase quotidien est temporairement epuise. Reessayez apres sa reinitialisation.`
- Ne jamais afficher de faux succes apres une erreur 400, 401, 403, 409, 500 ou 503.

## Risques restants

- Le quota peut encore etre epuise si plusieurs admins ouvrent simultanement les onglets avec listeners.
- Le cache serveur Vercel est best-effort: il disparait si la fonction redemarre.
- Les roles modifies peuvent prendre jusqu a 5 minutes a se propager dans une instance chaude, sauf invalidation forcee.
- Le client lit encore `user_roles` temporairement pour l UI; la migration finale doit passer par une API securisee.

## Shazax Concours

- Ne pas ecrire une reponse QCM dans Firestore a chaque clic.
- Garder la session QCM en local pendant le quiz.
- Synchroniser par lots:
  - au debut de session;
  - a la fin de session;
  - lors d une pause explicite;
  - eventuellement toutes les 30 a 60 secondes si le backend est pret.
- Eviter `onSnapshot` pour les questions, classements, erreurs et progression.
- Utiliser API serveur, pagination, limites et filtres parent pour toute future banque de questions.
