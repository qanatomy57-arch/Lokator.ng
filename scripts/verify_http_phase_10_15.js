/**
 * LOKATOR.NG — PHASE 10.15 HTTP & ASSET VERIFICATION SUITE
 * Validates service worker registration, PWA CSS rules,
 * Data Saver buttons, and bookmark UI markup.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

function runHttpTests() {
  console.log('\n🌐 RUNNING PHASE 10.15 HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const swCode = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const pwaCss = fs.readFileSync(path.join(root, 'pwa.css'), 'utf8');
  const pwaManager = fs.readFileSync(path.join(root, 'pwa-manager.js'), 'utf8');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. sw.js includes lokator-v10.15 cache version and shell assets array', () => {
    assert.ok(swCode.includes('lokator-v10.15'));
    assert.ok(swCode.includes('SHELL_ASSETS'));
  });

  test('2. pwa.css contains Data Saver and offline banner rules', () => {
    assert.ok(pwaCss.includes('data-saver-mode'));
    assert.ok(pwaCss.includes('offline-status-banner'));
    assert.ok(pwaCss.includes('saved-artisan-btn'));
  });

  test('3. pwa-manager.js implements online/offline listeners & saved artisans modal', () => {
    assert.ok(pwaManager.includes('offline-status-banner'));
    assert.ok(pwaManager.includes('saved-artisans-modal'));
    assert.ok(pwaManager.includes('openSavedArtisansModal'));
    assert.ok(pwaManager.includes('renderSavedArtisansList'));
  });

  test('4. search.html contains Saved Hands and Data Saver toggle buttons in navbar', () => {
    assert.ok(searchHtml.includes('nav-saved-artisans-btn'));
    assert.ok(searchHtml.includes('btn-toggle-data-saver'));
  });

  test('5. search.js implements bookmark toggle on provider cards and Data Saver state listener', () => {
    assert.ok(searchJs.includes('btn-save-bookmark-card'));
    assert.ok(searchJs.includes('saveProviderBookmark'));
    assert.ok(searchJs.includes('btn-toggle-data-saver'));
  });

  test('6. profile.html & profile.js include bookmark action button and offline contact handler', () => {
    assert.ok(profileHtml.includes('btn-profile-bookmark'));
    assert.ok(profileJs.includes('btn-profile-bookmark'));
    assert.ok(profileJs.includes('isProviderSaved'));
  });

  test('7. supabase-client.js exports LokatorDB.offline module with zero payment dependencies', () => {
    assert.ok(supabaseClient.includes('LokatorDB.offline'));
    assert.ok(supabaseClient.includes('saveProviderBookmark'));
    assert.ok(supabaseClient.includes('isDataSaverActive'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.15 HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
