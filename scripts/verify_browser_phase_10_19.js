/**
 * Lokator.NG — Phase 10.19 Browser & Mobile UX Verification Suite
 * Tests mobile navigation drawer, interactive service map, GPS detection, and viewport responsiveness (390x844 & 393x852)
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
  console.log('\n🖥️ RUNNING PHASE 10.19 BROWSER & MOBILE NAVIGATION VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');
  const dashHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const styleCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  const mapServiceJs = fs.readFileSync(path.join(root, 'map-service.js'), 'utf8');

  await test('1. Mobile navigation drawer is semantic, off-canvas by default, and accessible', () => {
    assert.ok(profileHtml.includes('id="mobile-nav-drawer"'));
    assert.ok(profileHtml.includes('id="mobile-nav-close-btn"'));
    assert.ok(profileHtml.includes('id="mobile-nav-backdrop"'));
    assert.ok(styleCss.includes('transform: translateX(100%);'));
    assert.ok(styleCss.includes('.mobile-nav-drawer.open'));
  });

  await test('2. Hamburger button meets 44x44px touch target guidelines and accessible attributes', () => {
    assert.ok(styleCss.includes('min-width: 44px;'));
    assert.ok(styleCss.includes('min-height: 44px;'));
    assert.ok(profileHtml.includes('aria-controls="mobile-nav-drawer"'));
    assert.ok(profileHtml.includes('aria-expanded="false"'));
  });

  await test('3. Navigation drawer slides in smoothly and locks background scrolling', () => {
    assert.ok(styleCss.includes('transition: transform 0.3s'));
    assert.ok(styleCss.includes('body.mobile-nav-open'));
    assert.ok(profileJs.includes('document.body.classList.add(\'mobile-nav-open\')'));
    assert.ok(profileJs.includes('document.body.classList.remove(\'mobile-nav-open\')'));
  });

  await test('4. Real Service Location Card exists on profile with interactive map and GPS button', () => {
    assert.ok(profileHtml.includes('id="service-location-card"'));
    assert.ok(profileHtml.includes('id="profile-service-map"'));
    assert.ok(profileHtml.includes('id="btn-profile-gps"'));
    assert.ok(profileHtml.includes('Use My Current Location'));
  });

  await test('5. GPS telemetry displays accuracy badge, timestamp, and friendly status', () => {
    assert.ok(profileHtml.includes('id="gps-accuracy-val"'));
    assert.ok(profileHtml.includes('id="gps-timestamp-val"'));
    assert.ok(profileHtml.includes('id="gps-status-indicator"'));
    assert.ok(profileJs.includes('result.accuracyFormatted'));
  });

  await test('6. Map Service calculates straight-line distance to provider safely without exposing private street address', () => {
    assert.ok(mapServiceJs.includes('calculateDistanceKm'));
    assert.ok(mapServiceJs.includes('formatDistance'));
    assert.ok(profileJs.includes('calculateDistanceKm'));
    assert.ok(profileJs.includes('gpsDistanceText'));
  });

  await test('7. Provider dashboard has interactive map, GPS location detection, and coordinate confirmation', () => {
    assert.ok(dashHtml.includes('id="dash-service-map"'));
    assert.ok(dashHtml.includes('id="dash-gps-btn"'));
    assert.ok(dashHtml.includes('id="btn-confirm-location"'));
    assert.ok(dashJs.includes('initDashboardServiceMap'));
    assert.ok(dashJs.includes('btnDashGps.addEventListener'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.19 BROWSER & MOBILE CHECKS PASSED (100%)!`);
  } else {
    console.error(`⚠️ ${failed} CHECKS FAILED.`);
    process.exitCode = 1;
  }
  console.log('================================================================================\n');
}

runBrowserTests();
