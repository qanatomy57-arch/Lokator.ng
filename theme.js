/**
 * PadiFix Platform Theme Engine (theme.js)
 * High-performance, zero-flicker 3-way theme management:
 * Modes: 'light' | 'dark' | 'system'
 * Persisted in localStorage ('padifix_theme') & synchronized across open browser tabs.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'padifix_theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch (e) {
      return 'system';
    }
  }

  function getSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function resolveEffectiveTheme(themeMode) {
    if (themeMode === 'system') {
      return getSystemPreference();
    }
    return themeMode === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(themeMode, triggerEvent = true) {
    const effectiveTheme = resolveEffectiveTheme(themeMode);
    const root = document.documentElement;

    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-theme-mode', themeMode);

    // Update meta theme-color for mobile address bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0B0F17' : '#00A859');
    }

    updateToggleButtons(themeMode, effectiveTheme);

    if (triggerEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('padifix:themechange', {
        detail: { mode: themeMode, effective: effectiveTheme }
      }));
    }
  }

  function setTheme(newMode) {
    if (!['light', 'dark', 'system'].includes(newMode)) {
      newMode = 'system';
    }
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {}
    applyTheme(newMode, true);
  }

  function cycleTheme() {
    const currentMode = getStoredTheme();
    let nextMode = 'dark';
    if (currentMode === 'light') {
      nextMode = 'dark';
    } else if (currentMode === 'dark') {
      nextMode = 'system';
    } else {
      nextMode = 'light';
    }
    setTheme(nextMode);
    return nextMode;
  }

  function updateToggleButtons(mode, effective) {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach((btn) => {
      btn.setAttribute('data-active-mode', mode);
      btn.setAttribute('data-effective-theme', effective);
      
      const iconSpan = btn.querySelector('.theme-icon');
      const textSpan = btn.querySelector('.theme-label');
      
      let icon = '☀️';
      let label = 'Light';
      let title = 'Theme: Light (Click to switch to Dark)';

      if (mode === 'dark') {
        icon = '🌙';
        label = 'Dark';
        title = 'Theme: Dark (Click to switch to System)';
      } else if (mode === 'system') {
        icon = '💻';
        label = `Auto (${effective === 'dark' ? 'Dark' : 'Light'})`;
        title = `Theme: System Default (${effective}) — Click to switch to Light`;
      } else {
        icon = '☀️';
        label = 'Light';
        title = 'Theme: Light (Click to switch to Dark)';
      }

      if (iconSpan) iconSpan.textContent = icon;
      if (textSpan) textSpan.textContent = label;
      btn.setAttribute('title', title);
      btn.setAttribute('aria-label', title);
    });
  }

  function init() {
    const currentMode = getStoredTheme();
    applyTheme(currentMode, false);

    // Bind click event to existing & future toggle buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-toggle-btn');
      if (btn) {
        e.preventDefault();
        cycleTheme();
      }
    });

    // Listen to system preference changes when in 'system' mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          if (getStoredTheme() === 'system') {
            applyTheme('system', true);
          }
        };
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handler);
        } else if (mediaQuery.addListener) {
          mediaQuery.addListener(handler);
        }
      } catch (e) {}
    }

    // Synchronize across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        applyTheme(e.newValue || 'system', true);
      }
    });
  }

  // Self-initialize on script load or DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.PadiFixTheme = {
    getMode: getStoredTheme,
    getEffective: () => resolveEffectiveTheme(getStoredTheme()),
    setTheme: setTheme,
    cycleTheme: cycleTheme,
    init: init
  };
})();
