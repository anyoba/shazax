export function getFirestoreErrorMessage(error, fallback = 'Unable to load Firebase data.') {
  if (
    error?.code === 'resource-exhausted' ||
    error?.code === 'FIRESTORE_QUOTA_EXCEEDED' ||
    error?.status === 503
  ) {
    return 'Le quota Firebase quotidien est temporairement epuise. Reessayez apres sa reinitialisation.';
  }

  if (error?.code === 'permission-denied') {
    return 'Acces Firestore refuse par les regles de securite.';
  }

  return error?.message || fallback;
}
