// ============================================================================
// LOKATOR.NG — OBSERVABILITY & PRIVACY-CONSCIOUS TELEMETRY (telemetry.js)
// Lightweight, non-blocking telemetry & client error tracking with remote sink
// ============================================================================

(function (global) {
  'use strict';

  const TELEMETRY_STORAGE_KEY = 'lokator_telemetry_events';
  const TELEMETRY_SESSION_KEY = 'lokator_telemetry_session_id';
  const MAX_STORED_EVENTS = 50;
  const MAX_BATCH_SIZE = 10;
  const FLUSH_INTERVAL_MS = 10000;
  const MAX_SESSION_EVENTS = 200; // Flood protection: max remote events per session

  // Sensitive property blocklist (Strict Privacy, SAIF & Nigerian NDPR compliance)
  const FORBIDDEN_KEYS = new Set([
    'password', 'pwd', 'token', 'access_token', 'refresh_token', 'jwt',
    'auth', 'secret', 'service_role', 'api_key', 'apikey', 'key',
    'nin', 'bvn', 'account_number', 'credit_card', 'phone', 'email',
    'whatsapp_message', 'message', 'private_message'
  ]);

  let remoteSyncEnabled = true;
  let sessionEventsCount = 0;
  let inMemoryBatch = [];
  let flushTimer = null;

  /**
   * Generates or retrieves an ephemeral, anonymous session UUID
   */
  function getSessionId() {
    if (typeof sessionStorage === 'undefined') {
      return '00000000-0000-4000-8000-000000000000';
    }
    try {
      let sId = sessionStorage.getItem(TELEMETRY_SESSION_KEY);
      if (!sId) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          sId = crypto.randomUUID();
        } else {
          sId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        sessionStorage.setItem(TELEMETRY_SESSION_KEY, sId);
      }
      return sId;
    } catch (e) {
      return '00000000-0000-4000-8000-000000000000';
    }
  }

  /**
   * Sanitizes event properties to eliminate all PII and sensitive credentials
   */
  function sanitizeProperties(props) {
    if (!props || typeof props !== 'object') return {};
    const clean = {};
    for (const [k, v] of Object.entries(props)) {
      const lowerKey = k.toLowerCase();
      if (FORBIDDEN_KEYS.has(lowerKey)) {
        continue;
      }
      // Mask potential emails or long values
      if (typeof v === 'string') {
        if (v.includes('@') && v.includes('.')) {
          clean[k] = '[REDACTED_EMAIL]';
        } else if (v.length > 200) {
          clean[k] = v.substring(0, 200) + '...';
        } else {
          clean[k] = v;
        }
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        clean[k] = sanitizeProperties(v);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Validates event name against strict format: ^[a-z0-9_]{3,64}$
   */
  function isValidEventName(name) {
    if (!name || typeof name !== 'string') return false;
    return /^[a-z0-9_]{3,64}$/.test(name);
  }

  const LokatorTelemetry = {
    /**
     * Track a business or user interaction event
     * @param {string} name - Event name (e.g. 'search_submitted', 'whatsapp_clicked')
     * @param {Object} properties - Non-sensitive metadata
     */
    trackEvent(name, properties = {}) {
      try {
        const eventName = String(name).trim().toLowerCase();
        if (!isValidEventName(eventName)) {
          return;
        }

        const pathStr = (typeof window !== 'undefined' && window.location) ? window.location.pathname.substring(0, 128) : '/';
        const sanitizedProps = sanitizeProperties(properties);

        const payload = {
          event: eventName,
          timestamp: new Date().toISOString(),
          path: pathStr,
          props: sanitizedProps
        };

        // 1. Emit custom browser event for local integrations
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          const customEvent = new CustomEvent('lokator:telemetry', { detail: payload });
          window.dispatchEvent(customEvent);
        }

        // 2. Store in bounded local queue for diagnostics
        if (typeof sessionStorage !== 'undefined') {
          try {
            const raw = sessionStorage.getItem(TELEMETRY_STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            list.push(payload);
            if (list.length > MAX_STORED_EVENTS) list.shift();
            sessionStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
        }

        // 3. Queue for remote ingestion sink
        if (remoteSyncEnabled && sessionEventsCount < MAX_SESSION_EVENTS) {
          const remoteRecord = {
            session_id: getSessionId(),
            event_name: eventName,
            page_path: pathStr,
            properties: sanitizedProps
          };

          inMemoryBatch.push(remoteRecord);
          sessionEventsCount++;

          if (inMemoryBatch.length >= MAX_BATCH_SIZE) {
            this.flushBatch();
          } else if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              LokatorTelemetry.flushBatch();
            }, FLUSH_INTERVAL_MS);
          }
        }
      } catch (err) {
        // Telemetry must fail silently without impacting user experience
      }
    },

    /**
     * Flushes queued telemetry batch to Supabase REST endpoint
     */
    flushBatch() {
      if (inMemoryBatch.length === 0) return;
      const itemsToSend = inMemoryBatch.splice(0, MAX_BATCH_SIZE);

      try {
        let supabaseUrl = null;
        let anonKey = null;

        if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
          supabaseUrl = window.SUPABASE_CONFIG.url;
          anonKey = window.SUPABASE_CONFIG.anonKey;
        } else if (typeof process !== 'undefined' && process.env) {
          supabaseUrl = process.env.SUPABASE_URL || 'https://hvxosxhnxauiqrhpyuur.supabase.co';
          anonKey = process.env.SUPABASE_ANON_KEY;
        }

        if (!supabaseUrl || !anonKey) {
          return; // No sink credentials configured; silently drop
        }

        const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/analytics_events`;
        const bodyStr = JSON.stringify(itemsToSend);

        if (typeof fetch === 'function') {
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Prefer': 'return=minimal'
            },
            body: bodyStr,
            keepalive: true
          }).catch(() => {});
        } else if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([bodyStr], { type: 'application/json' });
          navigator.sendBeacon(endpoint, blob);
        }
      } catch (e) {
        // Fail silently
      }
    },

    /**
     * Centralized Error Logger
     */
    reportError(error, context = {}) {
      try {
        const errMessage = error instanceof Error ? error.message : String(error);
        const payload = {
          type: 'ERROR',
          message: errMessage,
          context: sanitizeProperties(context),
          timestamp: new Date().toISOString(),
          path: (typeof window !== 'undefined' && window.location) ? window.location.pathname.substring(0, 128) : '/'
        };

        this.trackEvent('client_error', payload);
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[Lokator Telemetry Notice]:', errMessage);
        }
      } catch (e) {}
    },

    /**
     * Retrieve recent session diagnostics
     */
    getRecentEvents() {
      if (typeof sessionStorage === 'undefined') return [];
      try {
        const raw = sessionStorage.getItem(TELEMETRY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Disables remote telemetry synchronization (local-only mode)
     */
    disableRemoteSync() {
      remoteSyncEnabled = false;
      inMemoryBatch = [];
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    },

    /**
     * Enables remote telemetry synchronization
     */
    enableRemoteSync() {
      remoteSyncEnabled = true;
    },

    /**
     * Testing hook to inspect current queue depth
     */
    _getQueueDepth() {
      return inMemoryBatch.length;
    }
  };

  // Automatic Page View & Lifecycle Tracking
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        LokatorTelemetry.trackEvent('page_view', { title: document.title });
      });
    } else {
      LokatorTelemetry.trackEvent('page_view', { title: document.title });
    }

    // Flush batch on page unload / hide
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        LokatorTelemetry.flushBatch();
      }
    });

    window.addEventListener('pagehide', () => {
      LokatorTelemetry.flushBatch();
    });

    // Global uncaught error listener
    window.addEventListener('error', (event) => {
      LokatorTelemetry.reportError(event.error || event.message, { source: 'window.onerror' });
    });

    window.addEventListener('unhandledrejection', (event) => {
      LokatorTelemetry.reportError(event.reason || 'Unhandled Promise Rejection', { source: 'unhandledrejection' });
    });
  }

  // Expose globally
  global.LokatorTelemetry = LokatorTelemetry;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LokatorTelemetry;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
