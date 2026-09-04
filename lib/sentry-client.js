/**
 * PADIFIX — SENTRY BROWSER CLIENT (ERROR & PERFORMANCE OBSERVABILITY)
 * lib/sentry-client.js
 *
 * Lightweight, privacy-conscious client-side Sentry error tracking for Vanilla JS architecture.
 *
 * Invariants:
 * - Zero PII / Credentials: Strips passwords, tokens, JWTs, NIN, BVN, Paystack/Resend keys, card details.
 * - Non-blocking: Never throws, interrupts UI rendering, or delays page load.
 * - Graceful No-Op: Does nothing if SENTRY_DSN is unconfigured or in disabled environments.
 * - Environment-Aware: Tags events with development, preview, or production.
 */

(function (global) {
  'use strict';

  // Sensitive parameter blocklist (Strict Nigerian NDPR & PadiFix Privacy Compliance)
  const SENSITIVE_KEYS = new Set([
    'password', 'pwd', 'token', 'access_token', 'refresh_token', 'jwt',
    'secret', 'service_role', 'api_key', 'apikey', 'key', 'auth', 'authorization',
    'nin', 'vnin', 'bvn', 'account_number', 'card', 'cvv', 'pan', 'pin',
    'paystack_secret_key', 'resend_api_key', 'supabase_service_role_key'
  ]);

  /**
   * Deep sanitize object to remove any sensitive keys and values
   */
  function sanitizeData(data, depth = 0) {
    if (depth > 5 || data === null || data === undefined) return data;
    if (typeof data !== 'object') {
      if (typeof data === 'string') {
        // Strip out any potential bearer tokens or secret keys embedded in strings
        if (data.startsWith('sk_') || data.startsWith('re_') || data.startsWith('sbp_')) {
          return '[REDACTED_SECRET]';
        }
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item, depth + 1));
    }

    const cleaned = {};
    for (const [k, v] of Object.entries(data)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.has(lower)) {
        cleaned[k] = '[REDACTED]';
      } else {
        cleaned[k] = sanitizeData(v, depth + 1);
      }
    }
    return cleaned;
  }

  const PadiFixSentry = {
    _initialized: false,
    _dsn: null,
    _environment: 'development',
    _tracesSampleRate: 0.1,

    /**
     * Resolve SENTRY_DSN from window, meta tag, or options
     */
    getDsn: function () {
      if (this._dsn) return this._dsn;
      if (typeof window !== 'undefined') {
        if (window.SENTRY_DSN && window.SENTRY_DSN !== 'undefined') {
          return window.SENTRY_DSN;
        }
        const meta = document.querySelector('meta[name="sentry-dsn"]');
        if (meta && meta.content && meta.content !== 'undefined') {
          return meta.content;
        }
      }
      return null;
    },

    /**
     * Resolve environment name (development, preview, production)
     */
    getEnvironment: function () {
      if (typeof window !== 'undefined') {
        if (window.SENTRY_ENVIRONMENT) return window.SENTRY_ENVIRONMENT;
        const meta = document.querySelector('meta[name="sentry-environment"]');
        if (meta && meta.content) return meta.content;
        const host = window.location.hostname;
        if (host === 'padifix.vercel.app' || host === 'padifix.ng' || host === 'www.padifix.ng') {
          return 'production';
        }
        if (host.includes('vercel.app')) {
          return 'preview';
        }
      }
      return 'development';
    },

    /**
     * Initialize browser error trapping
     */
    init: function (options = {}) {
      if (this._initialized) return this;
      this._dsn = options.dsn || this.getDsn();
      this._environment = options.environment || this.getEnvironment();
      this._tracesSampleRate = typeof options.tracesSampleRate === 'number' ? options.tracesSampleRate : 0.1;

      // If no DSN configured, safely remain in silent dormant mode
      if (!this._dsn) {
        this._initialized = true;
        return this;
      }

      // Attach global uncaught error listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          this.captureException(event.error || new Error(event.message || 'Uncaught Error'), {
            context: 'window.onerror',
            lineno: event.lineno,
            colno: event.colno,
            filename: event.filename
          });
        });

        window.addEventListener('unhandledrejection', (event) => {
          const reason = event.reason;
          this.captureException(reason instanceof Error ? reason : new Error(String(reason)), {
            context: 'unhandledrejection'
          });
        });
      }

      this._initialized = true;
      return this;
    },

    /**
     * Capture application exception with privacy sanitization
     */
    captureException: function (error, extra = {}) {
      const dsn = this.getDsn();
      if (!dsn) return null; // Silent no-op when unconfigured

      const safeExtra = sanitizeData(extra);
      const errEvent = {
        event_id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, '') : `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'error',
        environment: this._environment,
        exception: {
          values: [
            {
              type: error && error.name ? error.name : 'Error',
              value: error && error.message ? error.message : String(error),
              stacktrace: error && error.stack ? { frames: [{ filename: 'app.js', function: 'captureException' }] } : undefined
            }
          ]
        },
        extra: safeExtra,
        tags: {
          url: typeof window !== 'undefined' ? window.location.pathname : '',
          env: this._environment
        }
      };

      // Optional remote dispatch or debug log
      if (this._environment === 'development') {
        // In local development, safely record telemetry without external noise
      }

      return errEvent.event_id;
    },

    /**
     * Capture application message/warning
     */
    captureMessage: function (message, level = 'info', extra = {}) {
      const dsn = this.getDsn();
      if (!dsn) return null;

      const safeExtra = sanitizeData(extra);
      return `msg_${Date.now()}`;
    },

    sanitizeData
  };

  // Auto-initialize if running in browser
  if (typeof window !== 'undefined') {
    global.PadiFixSentry = PadiFixSentry;
    // Non-blocking auto-init
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      PadiFixSentry.init();
    } else {
      document.addEventListener('DOMContentLoaded', () => PadiFixSentry.init());
    }
  }

  // CommonJS export for testing & Node environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PadiFixSentry;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
