/**
 * OfflineStorageService.ts
 * 
 * Native IndexedDB and LocalStorage multi-tiered offline storage manager.
 * Stores UserData state and pending mutation sync queue.
 */
import { UserData } from '../models/user';

export interface PendingSyncMutation {
  id: string;
  userId: string;
  type: 'UPDATE_PROGRESS' | 'COMPLETE_LESSON' | 'EARN_XP' | 'CLAIM_REWARD' | 'UPDATE_STREAK';
  payload: {
    xpToAdd?: number;
    wordsToAdd?: number;
    quizCompleted?: boolean;
    gemsToAdd?: number;
    data?: Partial<UserData>;
  };
  clientTimestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

const DB_NAME = 'kurmanji_quester_db';
const DB_VERSION = 1;
const USER_DATA_STORE = 'user_data';
const SYNC_QUEUE_STORE = 'sync_queue';
const LOCALSTORAGE_KEY = 'kurmanji_user_data_v2';

class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (globalThis.window === undefined || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        // SAFETY: per the IndexedDB spec, upgradeneeded events always target an IDBOpenDBRequest.
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(USER_DATA_STORE)) {
          db.createObjectStore(USER_DATA_STORE);
        }
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('telemetry_events')) {
          db.createObjectStore('telemetry_events', { keyPath: 'eventId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to LocalStorage', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save UserData into both IndexedDB (Tier 2) and LocalStorage (Tier 1 fallback)
   */
  async saveUserData(userData: UserData): Promise<void> {
    // 1. Tier 1: LocalStorage fallback
    try {
      if (globalThis.window !== undefined) {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(userData));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // 2. Tier 2: IndexedDB
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_DATA_STORE, 'readwrite');
        const store = tx.objectStore(USER_DATA_STORE);
        const req = store.put(userData, 'current_user');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      // Graceful fallback if IDB fails
      console.warn('IndexedDB saveUserData fallback:', err);
    }
  }

  /**
   * Retrieve UserData from IndexedDB, or fallback to LocalStorage
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const db = await this.getDB();
      const idbData = await new Promise<UserData | null>((resolve, reject) => {
        const tx = db.transaction(USER_DATA_STORE, 'readonly');
        const store = tx.objectStore(USER_DATA_STORE);
        const req = store.get('current_user');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (idbData) return idbData;
    } catch (err) {
      console.warn('IndexedDB getUserData fallback to LocalStorage:', err);
    }

    // LocalStorage fallback
    try {
      if (globalThis.window !== undefined) {
        const raw = localStorage.getItem(LOCALSTORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalStorage parse failed:', e);
    }

    return null;
  }

  /**
   * Enqueue mutation into pending sync queue
   */
  async enqueueMutation(mutation: Omit<PendingSyncMutation, 'id' | 'clientTimestamp' | 'retryCount' | 'status'>): Promise<PendingSyncMutation> {
    const fullMutation: PendingSyncMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clientTimestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(SYNC_QUEUE_STORE);
        const req = store.put(fullMutation);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      // LocalStorage queue fallback
      try {
        const rawQueue = localStorage.getItem('kurmanji_sync_queue') || '[]';
        const queue: PendingSyncMutation[] = JSON.parse(rawQueue);
        queue.push(fullMutation);
        localStorage.setItem('kurmanji_sync_queue', JSON.stringify(queue));
      } catch (e) {
        console.warn('Failed to queue mutation in LocalStorage:', e);
      }
    }

    return fullMutation;
  }

  /**
   * Get all pending sync mutations from queue
   */
  async getPendingMutations(): Promise<PendingSyncMutation[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
        const store = tx.objectStore(SYNC_QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      try {
        const rawQueue = localStorage.getItem('kurmanji_sync_queue') || '[]';
        return JSON.parse(rawQueue);
      } catch (e) {
        return [];
      }
    }
  }

  /**
   * Remove a single mutation after successful sync
   */
  async removeMutation(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(SYNC_QUEUE_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      try {
        const rawQueue = localStorage.getItem('kurmanji_sync_queue') || '[]';
        const queue: PendingSyncMutation[] = JSON.parse(rawQueue);
        const filtered = queue.filter(m => m.id !== id);
        localStorage.setItem('kurmanji_sync_queue', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Failed to remove mutation from LocalStorage:', e);
      }
    }
  }

  /**
   * Clear all pending sync queue items
   */
  async clearSyncQueue(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(SYNC_QUEUE_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      localStorage.removeItem('kurmanji_sync_queue');
    }
  }
}

export const offlineStorage = new OfflineStorageService();
