function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

function normalizePrivateKey(value) {
  return value
    ?.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');
}

function isPrivateKeyFormatValid(value) {
  const privateKey = normalizePrivateKey(value);
  return Boolean(
    privateKey &&
      privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
      privateKey.includes('-----END PRIVATE KEY-----'),
  );
}

function getEnvironmentStatus() {
  return {
    clerkSecretConfigured: Boolean(process.env.CLERK_SECRET_KEY),
    firebaseProjectConfigured: Boolean(process.env.FIREBASE_PROJECT_ID),
    firebaseClientEmailConfigured: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    firebasePrivateKeyConfigured: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    firebasePrivateKeyFormatValid: isPrivateKeyFormatValid(process.env.FIREBASE_PRIVATE_KEY),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, {
      ok: false,
      error: 'Method not allowed.',
    });
  }

  const environment = getEnvironmentStatus();
  let firebaseAdminInitialized = false;

  try {
    const { getAdminApp } = await import('./_lib/firebaseAdmin.js');
    getAdminApp();
    firebaseAdminInitialized = true;
  } catch (error) {
    console.error('[FIREBASE_INIT_FAILED]', {
      name: error?.name,
      message: error?.message,
    });
    firebaseAdminInitialized = false;
  }

  return sendJson(res, firebaseAdminInitialized ? 200 : 500, {
    ok:
      environment.clerkSecretConfigured &&
      environment.firebaseProjectConfigured &&
      environment.firebaseClientEmailConfigured &&
      environment.firebasePrivateKeyConfigured &&
      environment.firebasePrivateKeyFormatValid &&
      firebaseAdminInitialized,
    environment,
    firebaseAdminInitialized,
  });
}
