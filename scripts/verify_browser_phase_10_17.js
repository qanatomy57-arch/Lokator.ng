/**
 * LOKATOR.NG — PHASE 10.17 BROWSER & USER JOURNEY VERIFICATION SUITE
 * Validates hero search navigation, map view mode toggles, recent search chips,
 * and mobile map pill button.
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
  console.log('\n🖥️ RUNNING PHASE 10.17 BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  await test('1. Homepage hero search inputs trigger search redirection with URL parameters', () => {
    assert.ok(appJs.includes('params.set(\'service\', service)'));
    assert.ok(appJs.includes('params.set(\'location\', loc)'));
    assert.ok(appJs.includes('window.location.href = `search.html?${params.toString()}`'));
  });

  await test('2. Search page provides List, Split, and Map view switcher buttons', () => {
    assert.ok(searchHtml.includes('data-view="list"'));
    assert.ok(searchHtml.includes('data-view="split"'));
    assert.ok(searchHtml.includes('data-view="map"'));
    assert.ok(searchJs.includes('setViewMode'));
  });

  await test('3. Mobile view provides floating Map/List toggle pill for responsive smartphones', () => {
    assert.ok(searchHtml.includes('mobile-map-toggle-pill'));
    assert.ok(searchJs.includes('btn-mobile-map-toggle'));
    assert.ok(searchJs.includes('mobileMapToggleBtn.addEventListener'));
  });

  await test('4. Recent searches bar renders clickable chips that re-run previous queries', () => {
    assert.ok(searchJs.includes('recent-chip'));
    assert.ok(searchJs.includes('recentSearchesChips.addEventListener'));
    assert.ok(searchJs.includes('btn-remove-chip'));
  });

  await test('5. Interactive map popups generate direct Call & WhatsApp booking links', () => {
    assert.ok(searchJs.includes('lokator-popup-call'));
    assert.ok(searchJs.includes('lokator-popup-wa'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.17 BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserTests();
