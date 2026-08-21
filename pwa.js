/**
 * ============================================================================
 * LOKATOR.NG — PWA MODULE ALIAS (pwa.js)
 * Re-exports LokatorPWA from pwa-manager.js
 * ============================================================================
 */

(function (global) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = require('./pwa-manager.js');
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
