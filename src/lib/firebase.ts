/**
 * firebase.ts
 *
 * Standardized Firebase configuration and initializing wrapper.
 *
 * REAL-PROJECT ARCHITECTURE (TODO-002 / F002):
 * The production configuration comes from build-time environment variables
 * (`VITE_FIREBASE_*` in `.env` — git-ignored). The committed
 * `firebase-applet-config.json` is ONLY a development placeholder pointing at
 * a scratch project; it is used when no env config is present so local dev
 * keeps working, but the app treats that state as "cloud not configured":
 * `isFirebaseConfigured === false` hides Google sign-in and all cloud-sync
 * affordances, so users are never offered auth that cannot succeed.
 *
 * Firebase web config values are not secrets (they ship in every client
 * bundle by design); security is enforced by `firestore.rules`. What we avoid
 * committing is the coupling to any real project — deployments inject their
 * own config via env.
 */
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import devPlaceholderConfig from '../../firebase-applet-config.json';

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

function readEnvConfig(): FirebaseWebConfig | null {
  // SAFETY: import.meta.env is Vite's flat build-time string map.
  const env = import.meta.env as Record<string, string | undefined>;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const appId = env.VITE_FIREBASE_APP_ID;

  // All four core fields must be present for the env config to count.
  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  };
}

const envConfig = readEnvConfig();

/**
 * True only when a real project configuration was injected via environment.
 * The dev placeholder never counts: it points at a dead scratch project, so
 * offering Google sign-in against it would guarantee a failed login.
 */
export const isFirebaseConfigured = envConfig !== null;

// SAFETY: the in-repo dev placeholder JSON carries exactly the FirebaseWebConfig fields.
const firebaseConfig: FirebaseWebConfig = envConfig ?? (devPlaceholderConfig as FirebaseWebConfig);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'default');
setLogLevel('error');

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

