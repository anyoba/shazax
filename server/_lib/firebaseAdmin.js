import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const FIREBASE_ENV_NAMES = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const FIREBASE_SERVICE_ACCOUNT_ENV_NAMES = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_BASE64',
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

function parseServiceAccountJson(value, sourceName) {
  if (!value) return null;

  const normalizedValue =
    sourceName === 'FIREBASE_SERVICE_ACCOUNT_BASE64'
      ? Buffer.from(value.trim(), 'base64').toString('utf8')
      : value.trim();

  try {
    return JSON.parse(normalizedValue);
  } catch (error) {
    console.error('[FIREBASE_ENV_INVALID]', {
      source: sourceName,
      message: error?.message,
    });
    throw createFirebaseConfigError(
      'Firebase service account JSON is invalid.',
      'FIREBASE_SERVICE_ACCOUNT_INVALID',
    );
  }
}

function normalizeServiceAccount(rawServiceAccount) {
  if (!rawServiceAccount || typeof rawServiceAccount !== 'object') return null;

  const privateKey = normalizePrivateKey(
    rawServiceAccount.private_key || rawServiceAccount.privateKey,
  );

  return {
    projectId: rawServiceAccount.project_id || rawServiceAccount.projectId,
    clientEmail: rawServiceAccount.client_email || rawServiceAccount.clientEmail,
    privateKey,
    storageBucket: rawServiceAccount.storage_bucket || rawServiceAccount.storageBucket,
  };
}

function getServiceAccountFromEnvironment() {
  for (const envName of FIREBASE_SERVICE_ACCOUNT_ENV_NAMES) {
    const rawValue = process.env[envName];
    if (!rawValue) continue;
    return normalizeServiceAccount(parseServiceAccountJson(rawValue, envName));
  }

  return null;
}

export function getFirebaseEnvironmentStatus() {
  const serviceAccount = getServiceAccountFromEnvironment();
  return {
    firebaseProjectConfigured: Boolean(process.env.FIREBASE_PROJECT_ID),
    firebaseClientEmailConfigured: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    firebasePrivateKeyConfigured: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    firebasePrivateKeyFormatValid: isPrivateKeyFormatValid(process.env.FIREBASE_PRIVATE_KEY),
    firebaseServiceAccountConfigured: FIREBASE_SERVICE_ACCOUNT_ENV_NAMES.some((name) => Boolean(process.env[name])),
    firebaseServiceAccountFormatValid: serviceAccount ? isPrivateKeyFormatValid(serviceAccount.privateKey) : false,
  };
}

export function validateFirebaseEnvironment() {
  const serviceAccount = getServiceAccountFromEnvironment();
  if (serviceAccount) {
    const missingServiceAccountFields = [];
    if (!serviceAccount.projectId) missingServiceAccountFields.push('project_id');
    if (!serviceAccount.clientEmail) missingServiceAccountFields.push('client_email');
    if (!serviceAccount.privateKey) missingServiceAccountFields.push('private_key');

    if (missingServiceAccountFields.length > 0) {
      console.error('[FIREBASE_ENV_MISSING]', { missing: missingServiceAccountFields });
      throw createFirebaseConfigError(
        'Firebase service account JSON is missing required fields.',
        'FIREBASE_SERVICE_ACCOUNT_MISSING_FIELDS',
      );
    }

    if (!isPrivateKeyFormatValid(serviceAccount.privateKey)) {
      console.error('[FIREBASE_ENV_MISSING]', { missing: ['service_account.private_key_format'] });
      throw createFirebaseConfigError('Firebase private key format is invalid.', 'FIREBASE_PRIVATE_KEY_INVALID');
    }

    return {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
      storageBucket: serviceAccount.storageBucket,
    };
  }

  const missing = FIREBASE_ENV_NAMES.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error('[FIREBASE_ENV_MISSING]', {
      missing,
      acceptedAlternatives: FIREBASE_SERVICE_ACCOUNT_ENV_NAMES,
    });
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
    process.env.FIREBASE_STORAGE_BUCKET ||
    firebaseConfig.storageBucket ||
    `${firebaseConfig.projectId}.firebasestorage.app`;

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
