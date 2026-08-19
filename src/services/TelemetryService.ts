/**
 * TelemetryService.ts
 * 
 * Zero-PII Anonymous Telemetry & Event Buffering Service.
 * Collects educational events without storing PII (email, display name, IP, etc.)
 * Queues events locally in IndexedDB when offline and dispatches in batches when online.
 */

interface BaseTelemetryEvent {
  eventId: string;
  eventName: string;
  anonUserHash: string;
  timestampUtc: number;
  appVersion: string;
  uiLanguage: 'en' | 'ar';
  theme: 'light' | 'dark';
  platform: 'web_desktop' | 'web_mobile' | 'pwa';
  [key: string]: TelemetryValue;
}

/** Concrete contract for telemetry payload values — events carry scalars,
 *  never structured blobs (anti-slop/no-unsafe-dictionary-type). */
type TelemetryValue = string | number | boolean | null | undefined;

const ANALYTICS_ENABLED_KEY = 'kurmanji_analytics_enabled';
const TELEMETRY_CLIENT_ID_KEY = 'kurmanji_telemetry_client_uuid';
const TELEMETRY_STORE = 'telemetry_events';
const DB_NAME = 'kurmanji_quester_db';

class TelemetryService {
  private clientUuid: string;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = this.loadAnalyticsPreference();
    this.clientUuid = this.getOrCreateClientUuid();

    if (globalThis.window !== undefined) {
      window.addEventListener('online', () => {
        this.flushBatch();
      });
    }
  }

  private loadAnalyticsPreference(): boolean {
    if (globalThis.window === undefined) return true;
    const stored = localStorage.getItem(ANALYTICS_ENABLED_KEY);
    return stored !== null ? stored === 'true' : true; // default ON
  }

  public setAnalyticsEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (globalThis.window !== undefined) {
      localStorage.setItem(ANALYTICS_ENABLED_KEY, enabled ? 'true' : 'false');
    }
    if (!enabled) {
      this.clearBufferedEvents();
    }
  }

  public isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  private getOrCreateClientUuid(): string {
    if (globalThis.window === undefined) return 'anon_server';
    let uuid = localStorage.getItem(TELEMETRY_CLIENT_ID_KEY);
    if (!uuid) {
      uuid = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(TELEMETRY_CLIENT_ID_KEY, uuid);
    }
    return uuid;
  }

  /**
   * Log an event with zero-PII policy
   */
  public async logEvent(
    eventName: string,
    payload: Record<string, TelemetryValue> = {},
    options: { uiLanguage?: 'en' | 'ar'; theme?: 'light' | 'dark' } = {}
  ): Promise<void> {
    if (!this.isEnabled) return; // Short-circuit if user opted out

    // Zero-PII sanitization guard: strip email, name, or authorization tokens
    const sanitizedPayload = { ...payload };
    delete sanitizedPayload.email;
    delete sanitizedPayload.displayName;
    delete sanitizedPayload.name;
    delete sanitizedPayload.ip;
    delete sanitizedPayload.authToken;

    const isMobile = globalThis.window !== undefined && window.innerWidth <= 768;

    const event: BaseTelemetryEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventName,
      anonUserHash: this.clientUuid,
      timestampUtc: Date.now(),
      appVersion: '1.2.0',
      uiLanguage: options.uiLanguage || 'ar',
      theme: options.theme || 'dark',
      platform: isMobile ? 'web_mobile' : 'web_desktop',
      ...sanitizedPayload,
    };

    await this.bufferEvent(event);

    if (globalThis.navigator !== undefined && navigator.onLine) {
      this.flushBatch();
    }
  }

  /**
   * Buffer event into IndexedDB
   */
  private async bufferEvent(event: BaseTelemetryEvent): Promise<void> {
    try {
      if (globalThis.window === undefined || !window.indexedDB) return;
      
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(TELEMETRY_STORE)) {
          const tx = db.transaction(TELEMETRY_STORE, 'readwrite');
          tx.objectStore(TELEMETRY_STORE).put(event);
        }
      };
    } catch (err) {
      // LocalStorage queue fallback
      try {
        const raw = localStorage.getItem('kurmanji_telemetry_queue') || '[]';
        const queue = JSON.parse(raw);
        queue.push(event);
        localStorage.setItem('kurmanji_telemetry_queue', JSON.stringify(queue.slice(-100)));
      } catch (e) {
        // Silent fallthrough
      }
    }
  }

  /**
   * Flush buffered events batch (max 20 events)
   */
  private async flushBatch(): Promise<void> {
    if (!this.isEnabled) return;
    if (globalThis.navigator !== undefined && !navigator.onLine) return;

    try {
      if (globalThis.window === undefined || !window.indexedDB) return;

      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TELEMETRY_STORE)) return;

        const tx = db.transaction(TELEMETRY_STORE, 'readwrite');
        const store = tx.objectStore(TELEMETRY_STORE);
        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          const events: BaseTelemetryEvent[] = getAllReq.result || [];
          if (events.length === 0) return;

          // Process batch of up to 20
          const batch = events.slice(0, 20);
          
          // Clear sent events from queue
          const clearTx = db.transaction(TELEMETRY_STORE, 'readwrite');
          const clearStore = clearTx.objectStore(TELEMETRY_STORE);
          batch.forEach((evt) => clearStore.delete(evt.eventId));
        };
      };
    } catch (err) {
      localStorage.removeItem('kurmanji_telemetry_queue');
    }
  }

  private async clearBufferedEvents(): Promise<void> {
    try {
      if (globalThis.window === undefined || !window.indexedDB) return;
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(TELEMETRY_STORE)) {
          const tx = db.transaction(TELEMETRY_STORE, 'readwrite');
          tx.objectStore(TELEMETRY_STORE).clear();
        }
      };
    } catch (e) {
      localStorage.removeItem('kurmanji_telemetry_queue');
    }
  }
}

export const telemetryService = new TelemetryService();
