import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  getDocFromServer,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Trip, CheckIn, UserProfile, UserPreferences } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth avoiding IndexedDB when hidden
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (error: any) {
  if (error.code === 'auth/already-initialized') {
    authInstance = getAuth(app);
  } else {
    throw error;
  }
}
export const auth = authInstance;

export const googleProvider = new GoogleAuthProvider();
const scopes = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks'
];
scopes.forEach(scope => googleProvider.addScope(scope));

// Memory caching for OAuth access token
let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Initialize Firestore with custom Database ID and auto-detect long polling for iframe compatibility
const dbId = (firebaseConfig as any).firestoreDatabaseId;
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    dbId
  );
} catch (error) {
  firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreDb;

// Connection test helper as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase configuration notice: client operating in offline mode.');
    }
  }
}
testConnection();

// Authentication Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    localStorage.removeItem('voyager_custom_user');
    return result.user;
  } catch (error: any) {
    console.error('Erro no login com Google:', error);
    throw error;
  }
};

export const loginAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    // Seamless fallback to local guest user if Anonymous login is disabled in Firebase Console
    return {
      uid: 'guest-local-user',
      displayName: 'Viajante Convidado',
      email: null,
      photoURL: null,
      isAnonymous: true
    } as any;
  }
};

export const logoutUser = async () => {
  cachedAccessToken = null;
  return await firebaseSignOut(auth);
};

// Helper to seed user initial trips into Firestore so they are real persistent user docs

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Recursive sanitizer to strip undefined values before sending to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return undefined as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

// Firestore Realtime API for Trips
export const subscribeUserTrips = (
  userId: string,
  callback: (trips: Trip[]) => void
) => {
  const tripsRef = collection(db, 'trips');
  const q = query(tripsRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const trips: Trip[] = [];
      snapshot.forEach((docSnap) => {
        trips.push({ id: docSnap.id, ...docSnap.data() } as Trip);
      });

      // Sort client-side by createdAt / startDate
      trips.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      callback(trips);
    },
    (error) => {
      console.warn('Firestore subscription notice (trips):', error);
    }
  );
};

export const saveTripToFirestore = async (trip: Trip) => {
  if (!auth.currentUser) return;
  const tripRef = doc(db, 'trips', trip.id);
  const payload = sanitizeForFirestore({
    ...trip,
    userId: auth.currentUser.uid,
    updatedAt: new Date().toISOString()
  });

  try {
    await setDoc(tripRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `trips/${trip.id}`);
  }
};

export const deleteTripFromFirestore = async (tripId: string) => {
  if (!auth.currentUser) return;
  const tripRef = doc(db, 'trips', tripId);
  try {
    await deleteDoc(tripRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
  }
};

// Firestore Realtime API for Check-ins
export const subscribeUserCheckins = (
  userId: string,
  callback: (checkins: CheckIn[]) => void
) => {
  const checkinsRef = collection(db, 'checkins');
  const q = query(checkinsRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CheckIn[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CheckIn);
      });
      list.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      callback(list);
    },
    (error) => {
      console.warn('Checkins subscription notice:', error);
    }
  );
};

export const saveCheckinToFirestore = async (checkin: CheckIn) => {
  if (!auth.currentUser) return;
  const checkinRef = doc(db, 'checkins', checkin.id);
  const payload = sanitizeForFirestore({
    ...checkin,
    userId: auth.currentUser.uid
  });

  try {
    await setDoc(checkinRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `checkins/${checkin.id}`);
  }

  // If associated with a trip, increment its checkInsCount
  if (checkin.tripId) {
    try {
      const tripDocRef = doc(db, 'trips', checkin.tripId);
      await updateDoc(tripDocRef, {
        checkInsCount: (checkin as any).checkInsCount || 1,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      // ignore non-critical trip counter error
    }
  }
};

export const deleteCheckinFromFirestore = async (checkinId: string) => {
  if (!auth.currentUser) return;
  const checkinRef = doc(db, 'checkins', checkinId);
  try {
    await deleteDoc(checkinRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `checkins/${checkinId}`);
  }
};

// Firestore Realtime API for User Settings / Preferences
export const subscribeUserSettings = (
  userId: string,
  callback: (preferences: Partial<UserPreferences>) => void
) => {
  const settingsRef = doc(db, 'usersettings', userId);
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Partial<UserPreferences>);
      }
    },
    (error) => {
      console.warn('UserSettings subscription notice:', error);
    }
  );
};

export const saveUserSettingsToFirestore = async (
  userId: string,
  preferences: Partial<UserPreferences>
) => {
  if (!userId) return;
  const settingsRef = doc(db, 'usersettings', userId);
  const payload = sanitizeForFirestore({
    ...preferences,
    userId,
    updatedAt: new Date().toISOString(),
  });

  try {
    await setDoc(settingsRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usersettings/${userId}`);
  }
};
