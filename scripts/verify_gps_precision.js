/**
 * Lokator.NG — GPS Precision & Geolocation Reverse Lookup Verification Suite
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('📍 LOKATOR.NG — GPS PRECISION & GEOLOCATION REVERSE LOOKUP SUITE');
console.log('================================================================================');

// Load locations.js
const root = path.join(__dirname, '..');
const locCode = fs.readFileSync(path.join(root, 'locations.js'), 'utf8');
eval(locCode);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n--- 1. NIGERIAN CENTROID NEAREST REVERSE LOOKUP ---');

  await test('1.1 Coordinates near Warri resolve to Delta State & Warri South', async () => {
    const res = NigeriaLocations.findNearest(5.518, 5.752);
    assert.ok(res);
    assert.strictEqual(res.state, 'Delta');
    assert.strictEqual(res.lga, 'Warri South');
    assert.ok(res.formatted.includes('Warri'));
  });

  await test('1.2 Coordinates near Ikeja resolve to Lagos State & Ikeja', async () => {
    const res = NigeriaLocations.findNearest(6.602, 3.351);
    assert.ok(res);
    assert.strictEqual(res.state, 'Lagos');
    assert.strictEqual(res.lga, 'Ikeja');
  });

  await test('1.3 Coordinates near Abuja Central Area resolve to FCT', async () => {
    const res = NigeriaLocations.findNearest(9.076, 7.398);
    assert.ok(res);
    assert.strictEqual(res.state, 'FCT');
  });

  await test('1.4 Coordinates near Port Harcourt resolve to Rivers State', async () => {
    const res = NigeriaLocations.findNearest(4.815, 7.050);
    assert.ok(res);
    assert.strictEqual(res.state, 'Rivers');
    assert.strictEqual(res.lga, 'Port Harcourt');
  });

  console.log('\n--- 2. CODE AUDIT: NO HARDCODED GPS SURULERE FALLBACKS ---');

  const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  await test('2.1 app.js does not contain hardcoded "Surulere, Lagos" in GPS callback', () => {
    assert.ok(!appJs.includes("const detectedArea = 'Surulere, Lagos'"));
    assert.ok(appJs.includes('NigeriaLocations.reverseGeocode') || appJs.includes('NigeriaLocations.findNearest'));
  });

  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  await test('2.2 search.js parses lat, lng, and near_me parameters', () => {
    assert.ok(searchJs.includes('params.get("lat")'));
    assert.ok(searchJs.includes('params.get("lng")'));
    assert.ok(searchJs.includes('params.get("near_me")'));
    assert.ok(searchJs.includes('gpsTrigger.addEventListener'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} GPS PRECISION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
