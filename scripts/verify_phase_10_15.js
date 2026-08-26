/**
 * LOKATOR.NG — PHASE 10.15 OFFLINE-FIRST PWA & LOW-BANDWIDTH SUITE
 * Validates service worker configuration, bookmark storage, offline access,
 * low-bandwidth data saver mode, and zero-payment safety invariants.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  body: {
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    }
  },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    connection: { saveData: false }
  },
  writable: true,
  configurable: true
});

// Mock Telemetry
const telemetryEvents = [];
global.LokatorTelemetry = {
  trackEvent: (evt, data) => telemetryEvents.push({ evt, data, time: Date.now() })
};

// Load supabase-client.js
const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
eval(clientCode);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runPhase10_15Suite() {
  console.log('\n================================================================================');
  console.log('📶 LOKATOR.NG — PHASE 10.15 OFFLINE-FIRST PWA & LOW-BANDWIDTH VERIFICATION SUITE');
  console.log('================================================================================\n');

  const swCode = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

  console.log('--- 1. SERVICE WORKER & SHELL CACHE ---');
  await test('1.1 sw.js specifies CACHE_VERSION lokator-v10.15', async () => {
    assert.ok(swCode.includes("const CACHE_VERSION = 'lokator-v10.15';"));
    assert.ok(swCode.includes('SHELL_ASSETS'));
  });

  console.log('\n--- 2. OFFLINE SAVED ARTISANS (MY SAVED HANDS) ---');
  await test('2.1 LokatorDB.offline exists and exports required methods', async () => {
    assert.ok(LokatorDB.offline);
    assert.strictEqual(typeof LokatorDB.offline.saveProviderBookmark, 'function');
    assert.strictEqual(typeof LokatorDB.offline.removeProviderBookmark, 'function');
    assert.strictEqual(typeof LokatorDB.offline.getSavedProviders, 'function');
    assert.strictEqual(typeof LokatorDB.offline.isProviderSaved, 'function');
    assert.strictEqual(typeof LokatorDB.offline.isDataSaverActive, 'function');
    assert.strictEqual(typeof LokatorDB.offline.setDataSaver, 'function');
  });

  const sampleProvider = {
    id: 601,
    name: 'Tarila Ebi',
    trade_title: 'Master Solar Technician',
    category: 'solar-installer',
    state: 'Delta',
    lga: 'Warri South',
    phone: '08012345678',
    whatsapp_number: '08012345678',
    rating: 4.9,
    is_verified: true
  };

  await test('2.2 saveProviderBookmark persists artisan into localStorage store', async () => {
    const res = LokatorDB.offline.saveProviderBookmark(sampleProvider);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.alreadySaved, false);

    const saved = LokatorDB.offline.getSavedProviders();
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].name, 'Tarila Ebi');
    assert.strictEqual(saved[0].phone, '08012345678');
  });

  await test('2.3 isProviderSaved detects saved status correctly', async () => {
    assert.strictEqual(LokatorDB.offline.isProviderSaved(601), true);
    assert.strictEqual(LokatorDB.offline.isProviderSaved(999), false);
  });

  await test('2.4 removeProviderBookmark removes artisan from localStorage store', async () => {
    const res = LokatorDB.offline.removeProviderBookmark(601);
    assert.strictEqual(res.success, true);
    assert.strictEqual(LokatorDB.offline.isProviderSaved(601), false);
    assert.strictEqual(LokatorDB.offline.getSavedProviders().length, 0);
  });

  console.log('\n--- 3. DATA SAVER & LOW-BANDWIDTH ENGINE ---');
  await test('3.1 isDataSaverActive reflects navigator.connection.saveData when no manual override', async () => {
    localStorage.removeItem('lokator_data_saver_pref');
    global.navigator.connection.saveData = true;
    assert.strictEqual(LokatorDB.offline.isDataSaverActive(), true);

    global.navigator.connection.saveData = false;
    assert.strictEqual(LokatorDB.offline.isDataSaverActive(), false);
  });

  await test('3.2 setDataSaver sets manual preference and updates document.body class', async () => {
    LokatorDB.offline.setDataSaver(true);
    assert.strictEqual(LokatorDB.offline.isDataSaverActive(), true);
    assert.strictEqual(document.body.classList.contains('data-saver-mode'), true);

    LokatorDB.offline.setDataSaver(false);
    assert.strictEqual(LokatorDB.offline.isDataSaverActive(), false);
    assert.strictEqual(document.body.classList.contains('data-saver-mode'), false);
  });

  console.log('\n--- 4. TELEMETRY & FREE MARKETPLACE GUARANTEE ---');
  await test('4.1 Telemetry tracks provider_saved_offline and provider_unsaved_offline', async () => {
    LokatorDB.offline.saveProviderBookmark(sampleProvider);
    LokatorDB.offline.removeProviderBookmark(sampleProvider.id);

    const saveEvt = telemetryEvents.find(e => e.evt === 'provider_saved_offline');
    const unsaveEvt = telemetryEvents.find(e => e.evt === 'provider_unsaved_offline');
    assert.ok(saveEvt);
    assert.ok(unsaveEvt);
  });

  await test('4.2 Safe zero-payment baseline preserved', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.15 OFFLINE & LOW-BANDWIDTH ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase10_15Suite();
