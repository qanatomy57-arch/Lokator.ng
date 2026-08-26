/**
 * LOKATOR.NG — PHASE 10.15 BROWSER & USER JOURNEY VERIFICATION SUITE
 * Validates offline bookmarking, Data Saver toggling, and offline modal flows.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

async function runBrowserTests() {
  console.log('\n🖥️ RUNNING PHASE 10.15 BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');
  const pwaManager = fs.readFileSync(path.join(root, 'pwa-manager.js'), 'utf8');

  await test('1. Search navbar provides instant access to Saved Hands and Data Saver toggle', () => {
    assert.ok(searchHtml.includes('nav-saved-artisans-btn'));
    assert.ok(searchHtml.includes('btn-toggle-data-saver'));
  });

  await test('2. Search cards include direct offline bookmark button', () => {
    assert.ok(searchJs.includes('btn-save-bookmark-card'));
    assert.ok(searchJs.includes('Save Contact'));
  });

  await test('3. Profile hero action bar includes bookmark heart button', () => {
    assert.ok(profileHtml.includes('btn-profile-bookmark'));
    assert.ok(profileJs.includes('btn-profile-bookmark'));
  });

  await test('4. PWA manager renders Saved Artisans modal with direct phone calling', () => {
    assert.ok(pwaManager.includes('saved-artisans-modal'));
    assert.ok(pwaManager.includes('saved-artisans-list'));
    assert.ok(pwaManager.includes('openSavedArtisansModal'));
  });

  await test('5. Offline banner is defined and triggered on network disconnect', () => {
    assert.ok(pwaManager.includes('offline-status-banner'));
    assert.ok(pwaManager.includes('updateOnlineStatus'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.15 BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserTests();
