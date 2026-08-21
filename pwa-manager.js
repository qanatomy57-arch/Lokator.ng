/**
 * ============================================================================
 * LOKATOR.NG — PWA EXPERIENCE & INSTALL MANAGER (pwa.js / pwa-manager.js)
 * Native mobile install prompt, iOS Add to Home Screen, and SW Update UX
 * ============================================================================
 */

(function (global) {
  'use strict';

  // Non-sensitive Storage Keys
  const STORAGE_KEYS = {
    PWA_DISMISSED: 'lokator_pwa_install_dismissed',
    IOS_DISMISSED: 'lokator_ios_install_dismissed',
    PROMPTED: 'lokator_pwa_install_prompted',
    COMPLETED: 'lokator_pwa_install_completed'
  };

  const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days expiration

  let deferredPrompt = null;
  let swRegistration = null;
  let hasInteracted = false;
  let isMutationInProgress = false;

  const LokatorPWA = {
    STORAGE_KEYS,

    /**
     * Detect if running as an installed standalone PWA
     * Supports Android standalone, iOS Safari navigator.standalone, fullscreen, minimal-ui
     */
    isInstalled() {
      if (typeof window === 'undefined') return false;
      
      const isStandaloneMedia = window.matchMedia && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches
      );
      
      const isStandaloneNav = window.navigator && Boolean(window.navigator.standalone);
      const isStoredInstalled = this._getStorage(STORAGE_KEYS.COMPLETED) === 'true';

      return Boolean(isStandaloneMedia || isStandaloneNav || isStoredInstalled);
    },

    /**
     * Backward-compatible alias
     */
    isStandaloneMode() {
      return this.isInstalled();
    },

    /**
     * Detect iOS device (iPhone / iPad / iPod) in browser mode
     */
    isIOS() {
      if (typeof navigator === 'undefined') return false;
      const ua = navigator.userAgent || '';
      return /iPhone|iPad|iPod/i.test(ua) && !this.isInstalled();
    },

    /**
     * Check if Android/PWA prompt is in dismissal cooldown
     */
    isDismissed() {
      const until = this._getStorage(STORAGE_KEYS.PWA_DISMISSED);
      if (!until) return false;
      return Date.now() < parseInt(until, 10);
    },

    /**
     * Check if iOS guide is in dismissal cooldown
     */
    isIOSDismissed() {
      const until = this._getStorage(STORAGE_KEYS.IOS_DISMISSED);
      if (!until) return false;
      return Date.now() < parseInt(until, 10);
    },

    /**
     * Dismiss prompt for cooldown period (default 7 days)
     */
    dismissPrompt(days = 7) {
      const until = Date.now() + (days * 24 * 60 * 60 * 1000);
      this._setStorage(STORAGE_KEYS.PWA_DISMISSED, String(until));
      
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('pwa_install_dismissed', { days });
      }
    },

    /**
     * Dismiss iOS guidance drawer
     */
    dismissIOSGuidance(days = 7) {
      const until = Date.now() + (days * 24 * 60 * 60 * 1000);
      this._setStorage(STORAGE_KEYS.IOS_DISMISSED, String(until));

      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('ios_install_guide_dismissed', { days });
      }
    },

    /**
     * Mark an active mutation (e.g. form submission, portfolio upload) to prevent SW refresh interruption
     */
    setMutationInProgress(inProgress) {
      isMutationInProgress = Boolean(inProgress);
    },

    /**
     * Safe localStorage wrapper
     */
    _getStorage(key) {
      if (typeof localStorage === 'undefined') return null;
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },

    _setStorage(key, value) {
      if (typeof localStorage === 'undefined') return;
      try { localStorage.setItem(key, String(value)); } catch (e) {}
    },

    /**
     * Smoothly dismiss and remove the startup splash screen
     */
    dismissSplash() {
      if (typeof document === 'undefined') return;
      const splash = document.getElementById('pwa-app-splash');
      if (splash && !splash.classList.contains('splash-fade-out')) {
        splash.classList.add('splash-fade-out');
        setTimeout(() => {
          if (splash && splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 450);
      }
    },

    _dismissSplash() {
      this.dismissSplash();
    },

    /**
     * Initialize PWA lifecycle
     */
    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      // Ensure splash is dismissed smoothly
      setTimeout(() => this.dismissSplash(), 150);

      if (this.isInstalled()) {
        document.body.classList.add('pwa-mode');
        this._setStorage(STORAGE_KEYS.COMPLETED, 'true');
        this._listenForServiceWorkerUpdates();
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('pwa_installed', { mode: 'standalone' });
        }
        return;
      }

      this._injectUI();
      this._bindEvents();
      this._listenForServiceWorkerUpdates();
      this._setupSmartTiming();
    },

    /**
     * Inject DOM elements for install banner, sheets, and SW update toast
     */
    _injectUI() {
      if (document.getElementById('pwa-install-container')) return;

      const container = document.createElement('div');
      container.id = 'pwa-install-container';
      container.innerHTML = `
        <!-- Backdrop -->
        <div id="pwa-sheet-backdrop" class="pwa-sheet-backdrop" aria-hidden="true"></div>

        <!-- Android & Desktop Custom Install Bottom Sheet -->
        <div id="pwa-install-sheet" class="pwa-install-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-sheet-title" aria-describedby="pwa-sheet-desc" aria-hidden="true">
          <div class="pwa-sheet-drag-handle"></div>
          <div class="pwa-sheet-header">
            <div class="pwa-sheet-icon">
              <img src="icons/icon-192.png" alt="Lokator.NG Icon" width="56" height="56">
            </div>
            <div class="pwa-sheet-title-group">
              <h3 id="pwa-sheet-title">Install Lokator.NG</h3>
              <p id="pwa-sheet-desc">Install Lokator.NG on your phone for faster access and an app-like experience.</p>
            </div>
          </div>
          <div class="pwa-sheet-perks">
            <div class="pwa-perk-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Instant home screen launch & clean full-screen view</span>
            </div>
            <div class="pwa-perk-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Works offline & saves 90% mobile data</span>
            </div>
            <div class="pwa-perk-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Direct WhatsApp & phone callout connectivity</span>
            </div>
          </div>
          <div class="pwa-sheet-actions">
            <button id="pwa-btn-dismiss" class="pwa-btn-dismiss" type="button">Not now</button>
            <button id="pwa-btn-install" class="pwa-btn-install" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Install App</span>
            </button>
          </div>
        </div>

        <!-- iOS Safari Add to Home Screen Guided Drawer -->
        <div id="pwa-ios-sheet" class="pwa-ios-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-ios-title" aria-hidden="true">
          <div class="pwa-sheet-drag-handle"></div>
          <div class="pwa-sheet-header">
            <div class="pwa-sheet-icon">
              <img src="icons/icon-192.png" alt="Lokator.NG Icon" width="56" height="56">
            </div>
            <div class="pwa-sheet-title-group">
              <h3 id="pwa-ios-title">Install Lokator.NG</h3>
              <p>Add to your iPhone Home Screen for instant access</p>
            </div>
          </div>
          <div class="pwa-ios-steps">
            <div class="pwa-ios-step-row">
              <div class="pwa-step-num">1</div>
              <div class="pwa-step-text">Tap the <strong>Share</strong> button <span class="pwa-ios-icon-badge">⎋</span> in Safari's bottom toolbar</div>
            </div>
            <div class="pwa-ios-step-row">
              <div class="pwa-step-num">2</div>
              <div class="pwa-step-text">Scroll down and tap <strong>"Add to Home Screen"</strong> <span class="pwa-ios-icon-badge">⊞</span></div>
            </div>
            <div class="pwa-ios-step-row">
              <div class="pwa-step-num">3</div>
              <div class="pwa-step-text">Tap <strong>Add</strong> in the top-right corner</div>
            </div>
          </div>
          <button id="pwa-ios-done-btn" class="pwa-ios-done-btn" type="button">Got It</button>
        </div>

        <!-- Service Worker Floating Update Toast -->
        <div id="sw-update-toast" class="sw-update-toast" role="alert" aria-live="assertive" aria-hidden="true">
          <div class="sw-update-icon">⚡</div>
          <div class="sw-update-text">New version available</div>
          <button id="sw-update-btn" class="sw-update-btn" type="button">Update</button>
        </div>
      `;
      document.body.appendChild(container);
    },

    /**
     * Smart timing: trigger after meaningful interaction or delay
     */
    _setupSmartTiming() {
      const onFirstInteraction = () => {
        if (hasInteracted) return;
        hasInteracted = true;

        window.removeEventListener('scroll', onFirstInteraction);
        window.removeEventListener('click', onFirstInteraction);
        window.removeEventListener('keydown', onFirstInteraction);

        // If iOS and not dismissed, show gentle guidance after delay
        if (this.isIOS() && !this.isIOSDismissed()) {
          setTimeout(() => {
            this.showIOSGuidance();
          }, 4500);
        }
      };

      window.addEventListener('scroll', onFirstInteraction, { passive: true });
      window.addEventListener('click', onFirstInteraction, { passive: true });
      window.addEventListener('keydown', onFirstInteraction, { passive: true });
    },

    /**
     * Bind listeners
     */
    _bindEvents() {
      // 1. Intercept beforeinstallprompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show header install button if exists
        const navBtn = document.getElementById('nav-pwa-install-btn');
        if (navBtn) navBtn.style.display = 'inline-flex';

        if (!this.isDismissed()) {
          setTimeout(() => {
            this.showInstallPrompt();
          }, 3500);
        }
      });

      // 2. Window installed listener
      window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        this.hideSheets();
        this._setStorage(STORAGE_KEYS.COMPLETED, 'true');
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('pwa_install_accepted', { platform: 'native_prompt' });
          LokatorTelemetry.trackEvent('pwa_installed', { platform: 'native_prompt' });
        }
      });

      // 3. UI Buttons
      document.addEventListener('click', (e) => {
        if (e.target.closest('#pwa-btn-dismiss') || e.target.closest('#pwa-sheet-backdrop')) {
          this.dismissPrompt();
          this.hideSheets();
        }

        if (e.target.closest('#pwa-btn-install')) {
          this.triggerInstall();
        }

        if (e.target.closest('#pwa-ios-done-btn')) {
          this.dismissIOSGuidance();
          this.hideSheets();
        }

        if (e.target.closest('#nav-pwa-install-btn')) {
          if (this.isIOS()) {
            this.showIOSGuidance();
          } else {
            this.showInstallPrompt();
          }
        }
      });

      // 4. Escape Key accessibility
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideSheets();
        }
      });
    },

    /**
     * Show Android / Chromium Install Bottom Sheet
     */
    showInstallPrompt() {
      if (this.isInstalled()) return;
      const backdrop = document.getElementById('pwa-sheet-backdrop');
      const sheet = document.getElementById('pwa-install-sheet');
      if (backdrop) backdrop.classList.add('active');
      if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
      }

      this._setStorage(STORAGE_KEYS.PROMPTED, 'true');

      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('pwa_install_prompt_shown', { type: 'android_bottom_sheet' });
      }
    },

    /**
     * Show iOS Safari guidance drawer
     */
    showIOSGuidance() {
      if (this.isInstalled()) return;
      const backdrop = document.getElementById('pwa-sheet-backdrop');
      const sheet = document.getElementById('pwa-ios-sheet');
      if (backdrop) backdrop.classList.add('active');
      if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
      }

      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('ios_install_guide_shown', { type: 'safari_guide' });
      }
    },

    /**
     * Hide all active bottom sheets
     */
    hideSheets() {
      const backdrop = document.getElementById('pwa-sheet-backdrop');
      const sheet = document.getElementById('pwa-install-sheet');
      const iosSheet = document.getElementById('pwa-ios-sheet');
      if (backdrop) backdrop.classList.remove('active');
      if (sheet) {
        sheet.classList.remove('active');
        sheet.setAttribute('aria-hidden', 'true');
      }
      if (iosSheet) {
        iosSheet.classList.remove('active');
        iosSheet.setAttribute('aria-hidden', 'true');
      }
    },

    /**
     * Trigger native prompt from deferred beforeinstallprompt event
     */
    async triggerInstall() {
      if (!deferredPrompt) {
        this.hideSheets();
        return;
      }

      this.hideSheets();
      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        this._setStorage(STORAGE_KEYS.COMPLETED, 'true');
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('pwa_install_accepted', { outcome: 'accepted' });
        }
      } else {
        this.dismissPrompt();
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('pwa_install_dismissed', { outcome: 'dismissed' });
        }
      }
      deferredPrompt = null;
    },

    /**
     * Listen for Service Worker updatefound & waiting state
     */
    _listenForServiceWorkerUpdates() {
      if (!('serviceWorker' in navigator)) return;

      navigator.serviceWorker.ready.then((reg) => {
        swRegistration = reg;

        if (reg.waiting) {
          this._showUpdateToast(reg.waiting);
          return;
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this._showUpdateToast(newWorker);
            }
          });
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing && !isMutationInProgress) {
          refreshing = true;
          window.location.reload();
        }
      });
    },

    /**
     * Show floating update notification pill
     */
    _showUpdateToast(worker) {
      const toast = document.getElementById('sw-update-toast');
      const btn = document.getElementById('sw-update-btn');
      if (!toast) return;

      toast.classList.add('active');
      toast.setAttribute('aria-hidden', 'false');

      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('pwa_update_available', { version: 'latest' });
      }

      if (btn) {
        btn.onclick = () => {
          if (isMutationInProgress) {
            alert('A change or upload is currently in progress. Please wait for completion before updating.');
            return;
          }
          if (typeof LokatorTelemetry !== 'undefined') {
            LokatorTelemetry.trackEvent('pwa_update_accepted', {});
          }
          if (worker) {
            worker.postMessage({ action: 'skipWaiting' });
          }
        };
      }
    }
  };

  // Expose globally under both names & auto-init on DOMContentLoaded
  global.LokatorPWA = LokatorPWA;
  global.PWAManager = LokatorPWA;

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => LokatorPWA.init());
    } else {
      LokatorPWA.init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LokatorPWA;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
