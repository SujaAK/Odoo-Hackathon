import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Clean up private key formatting (e.g. escaped newlines, wrapping quotes)
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
}

// Check if credentials are still the default placeholders
const isPlaceholder =
  !privateKey ||
  privateKey.includes('YOUR_PRIVATE_KEY_HERE') ||
  (clientEmail && clientEmail.includes('xxxxx'));

let app;
if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey && !isPlaceholder) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } catch (err: any) {
      console.warn(
        `⚠️  Firebase Admin initialization failed: ${err.message}. Falling back to default project configuration.`
      );
      app = initializeApp({ projectId: projectId || 'trasitops' });
    }
  } else {
    console.warn(
      '⚠️  Firebase Admin: Missing or placeholder credentials in .env. Google Sign-In verification will be unavailable.'
    );
    app = initializeApp({ projectId: projectId || 'trasitops' });
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
