// ============================================================================
// LOKATOR.NG — OBSERVABILITY & PRIVACY-CONSCIOUS TELEMETRY (telemetry.js)
// Lightweight, non-blocking telemetry & client error tracking
// ============================================================================

(function (global) {
  'use strict';

  const TELEMETRY_STORAGE_KEY = 'lokator_telemetry_events';
  const MAX_STORED_EVENTS = 50;

  // Sensitive property blocklist (Strict Privacy & SAIF compliance)
  const FORBIDDEN_KEYS = new Set([
    'password', 'pwd', 'token', 'access_token', 'jwt', 'auth', 'nin',
    'secret', 'apikey', 'key', 'credit_card', 'bvn', 'account_number'
  ]);

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
      // Mask potential emails or long hex secrets
      if (typeof v === 'string') {
        if (v.includes('@') && v.includes('.')) {
          clean[k] = '[REDACTED_EMAIL]';
        } else if (v.length > 200) {
          clean[k] = v.substring(0, 200) + '...';
        } else {
          clean[k] = v;
        }
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  }

  const LokatorTelemetry = {
    /**
     * Track a business or user interaction event
     * @param {string} name - Event name (e.g. 'search_submitted', 'whatsapp_clicked')
     * @param {Object} properties - Non-sensitive metadata
     */
    trackEvent(name, properties = {}) {
      try {
        const payload = {
          event: String(name),
          timestamp: new Date().toISOString(),
          path: (typeof window !== 'undefined') ? window.location.pathname : '',
          props: sanitizeProperties(properties)
        };

        // Emit custom browser event for integrations
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          const customEvent = new CustomEvent('lokator:telemetry', { detail: payload });
          window.dispatchEvent(customEvent);
        }

        // Store in bounded local queue for diagnostics
        if (typeof sessionStorage !== 'undefined') {
          try {
            const raw = sessionStorage.getItem(TELEMETRY_STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            list.push(payload);
            if (list.length > MAX_STORED_EVENTS) list.shift();
            sessionStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
        }
      } catch (err) {
        // Telemetry must fail silently without impacting user experience
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
          path: (typeof window !== 'undefined') ? window.location.pathname : ''
        };

        this.trackEvent('client_error', payload);
        console.warn('[Lokator Telemetry Notice]:', errMessage);
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
    }
  };

  // Automatic Page View Tracking
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        LokatorTelemetry.trackEvent('page_view', { title: document.title });
      });
    } else {
      LokatorTelemetry.trackEvent('page_view', { title: document.title });
    }

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

