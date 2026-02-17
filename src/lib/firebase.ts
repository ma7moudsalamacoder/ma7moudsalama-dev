import { initializeApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => value === '')
  .map(([key]) => key)

if (missingKeys.length > 0) {
  console.warn(
    `[firebase] Missing env config keys: ${missingKeys.join(', ')}. ` +
      'Set VITE_FIREBASE_* variables before using auth/database features.',
  )
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const database = getDatabase(firebaseApp)
export let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(firebaseApp)
  } catch (error) {
    console.warn('[firebase] Analytics is not available in this environment.', error)
  }
}

export const authReady = new Promise<void>((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, () => {
    unsubscribe()
    resolve()
  })
})
