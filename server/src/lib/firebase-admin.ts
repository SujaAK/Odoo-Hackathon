import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'node:path';
import dotenv from 'dotenv';

// Ensure env is loaded (guards against import-order issues)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Normalize private key — handles both:
//   1. dotenvx/dotenv that already converted \n → real newlines
//   2. Envs where literal \\n strings remain
if (privateKey) {
  // Strip surrounding quotes if present (some .env parsers leave them)
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  // If the key still has escaped \\n, replace with real newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
}

let app;
if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized with service account credentials.');
    } catch (err: any) {
      console.warn(`⚠️  Firebase Admin cert() failed: ${err.message}`);
      console.warn('   Falling back to projectId-only init. Google Sign-In token verification may fail.');
      app = initializeApp({ projectId: projectId || 'trasitops' });
    }
  } else {
    console.warn('⚠️  Firebase Admin: Missing credentials in .env. Falling back to projectId-only init.');
    console.warn(`   projectId=${projectId}, clientEmail=${clientEmail ? 'set' : 'MISSING'}, privateKey=${privateKey ? 'set' : 'MISSING'}`);
    app = initializeApp({ projectId: projectId || 'trasitops' });
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);

