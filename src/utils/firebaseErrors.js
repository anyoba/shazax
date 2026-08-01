export function getFirestoreErrorMessage(error, fallback = 'Unable to load Firebase data.') {
  if (error?.code === 'resource-exhausted') {
    return 'Quota Firestore atteint ou limite de lecture depassee. Reessaie plus tard ou reduis les lectures.';
  }

  if (error?.code === 'permission-denied') {
    return 'Acces Firestore refuse par les regles de securite.';
  }

  return error?.message || fallback;
}
