import { ref, onValue, set, get, update, remove, child } from 'firebase/database';
import { rtdb } from './firebase';
import { PlantaoUser, PlantaoFolderItem } from '../types/plantao3d';
import { INITIAL_PLANTAO_USERS, INITIAL_PLANTAO_ITEMS } from '../data/initialPlantaoUsers';
import { PlantaoItem, INITIAL_PLANTAO_ITEMS as INITIAL_OCORRENCIAS } from '../data/plantaoData';
import { User, getAuthUsers } from './authStore';

// Database Paths
export const DB_PATHS = {
  CONNECTED: '.info/connected',
  PLANTAO_USERS: 'passagem_plantao/users',
  PLANTAO_ITEMS: 'passagem_plantao/items',
  OCORRENCIAS: 'ocorrencias',
  AUTH_USERS: 'auth_users',
  SYSTEM_STATUS: 'system_status',
  VEICULOS: 'veiculos',
  COLABORADORES: 'colaboradores',
};

/**
 * Listen to Firebase Realtime Database connection status
 */
export function subscribeToConnectionStatus(callback: (isConnected: boolean) => void): () => void {
  try {
    const connectedRef = ref(rtdb, DB_PATHS.CONNECTED);
    const unsubscribe = onValue(
      connectedRef,
      (snap) => {
        const isConnected = snap.val() === true;
        callback(isConnected);
      },
      (error) => {
        console.warn('Realtime Database connection status error:', error);
        callback(false);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB connection status', err);
    callback(false);
    return () => {};
  }
}

/**
 * Seed initial data if the Realtime Database nodes are empty
 */
export async function seedInitialRealtimeData(): Promise<void> {
  try {
    // 1. Check & Seed Plantão Users
    const usersRef = ref(rtdb, DB_PATHS.PLANTAO_USERS);
    const usersSnap = await get(usersRef);
    if (!usersSnap.exists() || !usersSnap.val()) {
      await set(usersRef, INITIAL_PLANTAO_USERS);
    }

    // 2. Check & Seed Plantão Items / Handover records
    const itemsRef = ref(rtdb, DB_PATHS.PLANTAO_ITEMS);
    const itemsSnap = await get(itemsRef);
    if (!itemsSnap.exists() || !itemsSnap.val()) {
      await set(itemsRef, INITIAL_PLANTAO_ITEMS);
    }

    // 3. Check & Seed Ocorrências (starts empty, user-created real data only)
    const ocorrenciasRef = ref(rtdb, DB_PATHS.OCORRENCIAS);
    const ocorrenciasSnap = await get(ocorrenciasRef);
    if (!ocorrenciasSnap.exists()) {
      await set(ocorrenciasRef, []);
    }

    // 4. Check & Seed Auth Users
    const authUsersRef = ref(rtdb, DB_PATHS.AUTH_USERS);
    const authUsersSnap = await get(authUsersRef);
    if (!authUsersSnap.exists() || !authUsersSnap.val()) {
      await set(authUsersRef, getAuthUsers());
    }

    // 5. Set System Info
    const sysRef = ref(rtdb, DB_PATHS.SYSTEM_STATUS);
    await update(sysRef, {
      appName: 'CCO 3corações - Passagem de Turno',
      projectId: 'passagem-de-turno-1d855',
      lastSyncedAt: new Date().toISOString(),
      activeShift: 'Turno A & B Diurno',
    });
  } catch (err) {
    console.warn('Note: RTDB seeding ran in offline/local fallback mode:', err);
  }
}

// ==========================================
// 1. PLANTÃO USERS SYNC
// ==========================================

export function subscribeToPlantaoUsers(callback: (users: PlantaoUser[]) => void): () => void {
  try {
    const usersRef = ref(rtdb, DB_PATHS.PLANTAO_USERS);
    const unsubscribe = onValue(
      usersRef,
      (snap) => {
        if (snap.exists() && snap.val()) {
          const val = snap.val();
          const list: PlantaoUser[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          localStorage.setItem('plantao_users_v2', JSON.stringify(list));
          callback(list);
        } else {
          // If empty in cloud, fallback to local and seed
          const local = localStorage.getItem('plantao_users_v2');
          const fallback = local ? JSON.parse(local) : INITIAL_PLANTAO_USERS;
          callback(fallback);
          set(usersRef, fallback).catch(() => {});
        }
      },
      (error) => {
        console.warn('Error reading plantao users from RTDB, using local cache:', error);
        const local = localStorage.getItem('plantao_users_v2');
        callback(local ? JSON.parse(local) : INITIAL_PLANTAO_USERS);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('RTDB subscribeToPlantaoUsers fallback to localStorage', err);
    const local = localStorage.getItem('plantao_users_v2');
    callback(local ? JSON.parse(local) : INITIAL_PLANTAO_USERS);
    return () => {};
  }
}

export async function savePlantaoUsersToRtdb(users: PlantaoUser[]): Promise<void> {
  localStorage.setItem('plantao_users_v2', JSON.stringify(users));
  try {
    const usersRef = ref(rtdb, DB_PATHS.PLANTAO_USERS);
    await set(usersRef, users);
  } catch (err) {
    console.warn('Saved plantao users locally, RTDB sync will retry when online', err);
  }
}

// ==========================================
// 2. PLANTÃO ITEMS (HANDOVER FOLDERS) SYNC
// ==========================================

export function subscribeToPlantaoItems(callback: (items: PlantaoFolderItem[]) => void): () => void {
  try {
    const itemsRef = ref(rtdb, DB_PATHS.PLANTAO_ITEMS);
    const unsubscribe = onValue(
      itemsRef,
      (snap) => {
        if (snap.exists() && snap.val()) {
          const val = snap.val();
          const list: PlantaoFolderItem[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          localStorage.setItem('plantao_items_v2', JSON.stringify(list));
          callback(list);
        } else {
          const local = localStorage.getItem('plantao_items_v2');
          const fallback = local ? JSON.parse(local) : INITIAL_PLANTAO_ITEMS;
          callback(fallback);
          set(itemsRef, fallback).catch(() => {});
        }
      },
      (error) => {
        console.warn('Error reading plantao items from RTDB, using local cache:', error);
        const local = localStorage.getItem('plantao_items_v2');
        callback(local ? JSON.parse(local) : INITIAL_PLANTAO_ITEMS);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('RTDB subscribeToPlantaoItems fallback to localStorage', err);
    const local = localStorage.getItem('plantao_items_v2');
    callback(local ? JSON.parse(local) : INITIAL_PLANTAO_ITEMS);
    return () => {};
  }
}

/**
 * Recursively converts undefined values to null or deletes them
 * to prevent Firebase RTDB "value argument contains undefined" errors.
 */
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null) return null as any;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)) as any;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirebase(val);
        }
      }
    }
    return sanitized;
  }

  return obj;
}

export async function savePlantaoItemsToRtdb(items: PlantaoFolderItem[]): Promise<void> {
  localStorage.setItem('plantao_items_v2', JSON.stringify(items));
  try {
    const itemsRef = ref(rtdb, DB_PATHS.PLANTAO_ITEMS);
    const sanitized = sanitizeForFirebase(items);
    await set(itemsRef, sanitized);
  } catch (err) {
    console.warn('Saved plantao items locally, RTDB sync will retry when online', err);
  }
}

// ==========================================
// 3. OCORRÊNCIAS SYNC
// ==========================================

export function subscribeToOcorrencias(callback: (items: PlantaoItem[]) => void): () => void {
  try {
    const ocorrenciasRef = ref(rtdb, DB_PATHS.OCORRENCIAS);
    const unsubscribe = onValue(
      ocorrenciasRef,
      (snap) => {
        if (snap.exists() && snap.val()) {
          const val = snap.val();
          const list: PlantaoItem[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          localStorage.setItem('plantao_records_v2', JSON.stringify(list));
          callback(list);
        } else {
          const local = localStorage.getItem('plantao_records_v2');
          const fallback = local ? JSON.parse(local) : INITIAL_OCORRENCIAS;
          callback(fallback);
          set(ocorrenciasRef, fallback).catch(() => {});
        }
      },
      (error) => {
        console.warn('Error reading ocorrencias from RTDB, using local cache:', error);
        const local = localStorage.getItem('plantao_records_v2');
        callback(local ? JSON.parse(local) : INITIAL_OCORRENCIAS);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('RTDB subscribeToOcorrencias fallback to localStorage', err);
    const local = localStorage.getItem('plantao_records_v2');
    callback(local ? JSON.parse(local) : INITIAL_OCORRENCIAS);
    return () => {};
  }
}

export async function saveOcorrenciasToRtdb(records: PlantaoItem[]): Promise<void> {
  localStorage.setItem('plantao_records_v2', JSON.stringify(records));
  try {
    const ocorrenciasRef = ref(rtdb, DB_PATHS.OCORRENCIAS);
    const sanitized = sanitizeForFirebase(records);
    await set(ocorrenciasRef, sanitized);
  } catch (err) {
    console.warn('Saved ocorrencias locally, RTDB sync will retry when online', err);
  }
}

export async function clearAllOcorrenciasFromRtdb(): Promise<void> {
  localStorage.setItem('plantao_records_v2', JSON.stringify([]));
  try {
    const ocorrenciasRef = ref(rtdb, DB_PATHS.OCORRENCIAS);
    await set(ocorrenciasRef, []);
  } catch (err) {
    console.warn('Cleared ocorrencias locally, RTDB sync will retry when online', err);
  }
}

// ==========================================
// 4. AUTH USERS SYNC
// ==========================================

export function subscribeToAuthUsers(callback: (users: User[]) => void): () => void {
  try {
    const authRef = ref(rtdb, DB_PATHS.AUTH_USERS);
    const unsubscribe = onValue(
      authRef,
      (snap) => {
        if (snap.exists() && snap.val()) {
          const val = snap.val();
          const list: User[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          localStorage.setItem('cco_auth_users', JSON.stringify(list));
          callback(list);
        } else {
          const local = getAuthUsers();
          callback(local);
          set(authRef, local).catch(() => {});
        }
      },
      (error) => {
        console.warn('Error reading auth users from RTDB, using local cache:', error);
        callback(getAuthUsers());
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('RTDB subscribeToAuthUsers fallback to localStorage', err);
    callback(getAuthUsers());
    return () => {};
  }
}

export async function saveAuthUsersToRtdb(users: User[]): Promise<void> {
  localStorage.setItem('cco_auth_users', JSON.stringify(users));
  try {
    const authRef = ref(rtdb, DB_PATHS.AUTH_USERS);
    await set(authRef, users);
  } catch (err) {
    console.warn('Saved auth users locally, RTDB sync will retry when online', err);
  }
}
