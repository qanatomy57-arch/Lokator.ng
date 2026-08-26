/**
 * LOKATOR.NG — PHASE 10.19 UNIT & INTEGRATION VERIFICATION SUITE
 * Real Location Map + Mobile Navigation UX
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('================================================================================');
console.log('🗺️ LOKATOR.NG — PHASE 10.19 REAL LOCATION MAP & MOBILE NAVIGATION SUITE');
console.log('================================================================================\n');

const ROOT = path.join(__dirname, '..');
const mapServiceJs = fs.readFileSync(path.join(ROOT, 'map-service.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const profileHtml = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
const profileJs = fs.readFileSync(path.join(ROOT, 'profile.js'), 'utf8');
const dashboardHtml = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(ROOT, 'dashboard.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const searchHtml = fs.readFileSync(path.join(ROOT, 'search.html'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const searchJs = fs.readFileSync(path.join(ROOT, 'search.js'), 'utf8');

console.log('--- 1. GOOGLE MAPS API KEY ARCHITECTURE & PRIVACY RULES ---');

check('1.1 Google Maps integration architecture exists in map-service.js', () => {
  assert.ok(mapServiceJs.includes('getGoogleMapsApiKey'), 'Missing getGoogleMapsApiKey in map-service.js');
  assert.ok(mapServiceJs.includes('loadGoogleMapsApi'), 'Missing loadGoogleMapsApi in map-service.js');
  assert.ok(mapServiceJs.includes('initServiceMap'), 'Missing initServiceMap in map-service.js');
});

check('1.2 No secret Google Maps API keys are committed in source code', () => {
  assert.ok(!mapServiceJs.includes('AIzaSy'), 'Secret Google Maps API key must not be hardcoded in map-service.js');
  assert.ok(!profileHtml.includes('AIzaSy'), 'Secret Google Maps API key must not be hardcoded in profile.html');
  assert.ok(!dashboardHtml.includes('AIzaSy'), 'Secret Google Maps API key must not be hardcoded in dashboard.html');
});

check('1.3 Map service provides seamless fallback to interactive Leaflet engine', () => {
  assert.ok(mapServiceJs.includes('L.map'), 'Leaflet map fallback missing in map-service.js');
  assert.ok(mapServiceJs.includes('L.tileLayer'), 'Leaflet tile layer missing in map-service.js');
  assert.ok(mapServiceJs.includes('accuracyCircle'), 'Accuracy circle handling missing in map-service.js');
});

console.log('\n--- 2. GEOLOCATION GPS & DISTANCE TELEMETRY LOGIC ---');

const LokatorMapService = require(path.join(ROOT, 'map-service.js'));

check('2.1 LokatorMapService exports core methods', () => {
  assert.strictEqual(typeof LokatorMapService.calculateDistanceKm, 'function');
  assert.strictEqual(typeof LokatorMapService.formatDistance, 'function');
  assert.strictEqual(typeof LokatorMapService.formatAccuracy, 'function');
  assert.strictEqual(typeof LokatorMapService.formatTimestamp, 'function');
  assert.strictEqual(typeof LokatorMapService.requestUserGPS, 'function');
});

check('2.2 calculateDistanceKm accurately computes distance (Haversine formula)', () => {
  // Lagos Ikeja (6.5954, 3.3364) to Victoria Island (6.4281, 3.4219) ~ 20.6 km
  const dist = LokatorMapService.calculateDistanceKm(6.5954, 3.3364, 6.4281, 3.4219);
  assert.ok(dist > 18 && dist < 24, `Expected ~20.6km, got ${dist}`);
});

check('2.3 formatDistance & formatAccuracy output user-friendly Nigerian strings', () => {
  assert.strictEqual(LokatorMapService.formatDistance(1.234), '~1.2 km away');
  assert.strictEqual(LokatorMapService.formatDistance(0.45), '~450 m away');
  assert.strictEqual(LokatorMapService.formatAccuracy(12.3), '±12 m');
  assert.strictEqual(LokatorMapService.formatAccuracy(null), '±15 m');
});

console.log('\n--- 3. PROVIDER PROFILE & DASHBOARD SERVICE LOCATION CARDS ---');

check('3.1 profile.html includes interactive Service Location Card & canvas', () => {
  assert.ok(profileHtml.includes('id="service-location-card"'), 'profile.html missing #service-location-card');
  assert.ok(profileHtml.includes('id="profile-service-map"'), 'profile.html missing #profile-service-map');
  assert.ok(profileHtml.includes('id="btn-profile-gps"'), 'profile.html missing #btn-profile-gps');
  assert.ok(profileHtml.includes('id="gps-accuracy-val"'), 'profile.html missing #gps-accuracy-val');
  assert.ok(profileHtml.includes('id="gps-status-indicator"'), 'profile.html missing #gps-status-indicator');
});

check('3.2 profile.js initializes service location map and handles GPS requests', () => {
  assert.ok(profileJs.includes('initProfileServiceMap'), 'profile.js missing initProfileServiceMap');
  assert.ok(profileJs.includes('btnGps.addEventListener'), 'profile.js missing GPS button click listener');
  assert.ok(profileJs.includes('calculateDistanceKm'), 'profile.js missing distance calculation');
});

check('3.3 dashboard.html & dashboard.js include interactive map and GPS confirmation', () => {
  assert.ok(dashboardHtml.includes('id="dash-service-map"'), 'dashboard.html missing #dash-service-map');
  assert.ok(dashboardHtml.includes('id="dash-gps-btn"'), 'dashboard.html missing #dash-gps-btn');
  assert.ok(dashboardHtml.includes('id="btn-confirm-location"'), 'dashboard.html missing #btn-confirm-location');
  assert.ok(dashboardJs.includes('initDashboardServiceMap'), 'dashboard.js missing initDashboardServiceMap');
  assert.ok(dashboardJs.includes('btnDashGps.addEventListener'), 'dashboard.js missing dash GPS listener');
});

console.log('\n--- 4. MOBILE HAMBURGER MENU & RIGHT-SIDE NAVIGATION DRAWER ---');

check('4.1 Hamburger buttons have semantic markup, aria attributes & >= 44x44px target', () => {
  assert.ok(profileHtml.includes('aria-controls="mobile-nav-drawer"'), 'profile.html hamburger missing aria-controls');
  assert.ok(profileHtml.includes('aria-expanded="false"'), 'profile.html hamburger missing aria-expanded');
  assert.ok(indexHtml.includes('aria-controls="mobile-nav-drawer"'), 'index.html hamburger missing aria-controls');
  assert.ok(searchHtml.includes('aria-controls="mobile-nav-drawer"'), 'search.html hamburger missing aria-controls');
  assert.ok(styleCss.includes('min-width: 44px;'), 'style.css missing min-width 44px on hamburger');
  assert.ok(styleCss.includes('min-height: 44px;'), 'style.css missing min-height 44px on hamburger');
});

check('4.2 Right-side sliding navigation drawer & backdrop are defined in style.css', () => {
  assert.ok(styleCss.includes('.mobile-nav-drawer'), 'style.css missing .mobile-nav-drawer');
  assert.ok(styleCss.includes('transform: translateX(100%);'), 'style.css drawer must start off-canvas');
  assert.ok(styleCss.includes('.mobile-nav-drawer.open'), 'style.css missing .mobile-nav-drawer.open');
  assert.ok(styleCss.includes('.mobile-nav-backdrop'), 'style.css missing .mobile-nav-backdrop');
  assert.ok(styleCss.includes('body.mobile-nav-open'), 'style.css missing body.mobile-nav-open scroll lock');
});

check('4.3 Navigation drawer HTML markup includes close button and complete destinations', () => {
  assert.ok(profileHtml.includes('id="mobile-nav-drawer"'), 'profile.html missing #mobile-nav-drawer');
  assert.ok(profileHtml.includes('id="mobile-nav-close-btn"'), 'profile.html missing #mobile-nav-close-btn');
  assert.ok(profileHtml.includes('id="mobile-nav-backdrop"'), 'profile.html missing #mobile-nav-backdrop');
  assert.ok(indexHtml.includes('id="mobile-nav-drawer"'), 'index.html missing #mobile-nav-drawer');
  assert.ok(searchHtml.includes('id="mobile-nav-drawer"'), 'search.html missing #mobile-nav-drawer');
});

check('4.4 Mobile drawer handlers implement open, close, backdrop tap, and Escape key', () => {
  assert.ok(profileJs.includes('openMobileDrawer'), 'profile.js missing openMobileDrawer');
  assert.ok(profileJs.includes('closeMobileDrawer'), 'profile.js missing closeMobileDrawer');
  assert.ok(profileJs.includes("e.key === 'Escape'"), 'profile.js missing Escape key handler');
  assert.ok(appJs.includes('openMobileNav'), 'app.js missing openMobileNav');
  assert.ok(searchJs.includes('openMobileNav'), 'search.js missing openMobileNav');
});

console.log('\n================================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} PHASE 10.19 UNIT ASSERTIONS PASSED (100%)!`);
} else {
  console.error(`⚠️ ${failed} CHECKS FAILED.`);
  process.exit(1);
}
console.log('================================================================================\n');
