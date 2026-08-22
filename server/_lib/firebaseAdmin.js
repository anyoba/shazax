import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const FIREBASE_ENV_NAMES = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

function createFirebaseConfigError(message, code) {
  return Object.assign(new Error(message), {
    statusCode: 500,
    code,
  });
}

export function normalizePrivateKey(value) {
  return value
    ?.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');
}

export function isPrivateKeyFormatValid(value) {
  const privateKey = normalizePrivateKey(value);
  return Boolean(
    privateKey &&
      privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
      privateKey.includes('-----END PRIVATE KEY-----'),
  );
}

export function getFirebaseEnvironmentStatus() {
  return {
    firebaseProjectConfigured: Boolean(process.env.FIREBASE_PROJECT_ID),
    firebaseClientEmailConfigured: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    firebasePrivateKeyConfigured: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    firebasePrivateKeyFormatValid: isPrivateKeyFormatValid(process.env.FIREBASE_PRIVATE_KEY),
  };
}

export function validateFirebaseEnvironment() {
  const missing = FIREBASE_ENV_NAMES.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error('[FIREBASE_ENV_MISSING]', { missing });
    throw createFirebaseConfigError('Firebase server configuration is missing.', 'FIREBASE_CONFIG_MISSING');
  }

  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!isPrivateKeyFormatValid(privateKey)) {
    console.error('[FIREBASE_ENV_MISSING]', { missing: ['FIREBASE_PRIVATE_KEY_FORMAT'] });
    throw createFirebaseConfigError('Firebase private key format is invalid.', 'FIREBASE_PRIVATE_KEY_INVALID');
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  };
}

export function getAdminApp() {
  if (getApps().length > 0) return getApp();

  const firebaseConfig = validateFirebaseEnvironment();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${firebaseConfig.projectId}.firebasestorage.app`;

  try {
    return initializeApp({
      credential: cert(firebaseConfig),
      storageBucket,
    });
  } catch (error) {
    console.error('[FIREBASE_INIT_FAILED]', {
      name: error?.name,
      message: error?.message,
    });
    throw error;
  }
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorageBucket() {
  return getStorage(getAdminApp()).bucket();
}

export { FieldValue };
