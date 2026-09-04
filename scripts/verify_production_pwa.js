/**
 * Phase 013 PWA & Service Worker Production Verification Suite
 * scripts/verify_production_pwa.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

async function runPwaSuite() {
  console.log('='.repeat(80));
  console.log('📱 PADIFIX PHASE 013: PWA & SERVICE WORKER VERIFICATION SUITE');
  console.log('='.repeat(80));

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

  // 1. MANIFEST VERIFICATION
  console.log('\n--- 1. WEB APP MANIFEST INTEGRITY ---');
  check('manifest.json is valid parseable JSON', () => {
    const raw = fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8');
    const manifest = JSON.parse(raw);
    assert.strictEqual(manifest.name, 'PadiFix — Find Skills. Get Things Done.');
    assert.strictEqual(manifest.short_name, 'PadiFix');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.theme_color, '#00A859');
    assert.strictEqual(manifest.start_url, '/index.html');
  });

  check('manifest.json specifies all mandatory icon sizes and maskable icons', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 4);

    const has192 = manifest.icons.some(i => i.sizes === '192x192' && i.purpose === 'any');
    const has512 = manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'any');
    const hasMaskable192 = manifest.icons.some(i => i.sizes === '192x192' && i.purpose === 'maskable');
    const hasMaskable512 = manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable');

    assert.ok(has192, 'Missing 192x192 standard icon');
    assert.ok(has512, 'Missing 512x512 standard icon');
    assert.ok(hasMaskable192, 'Missing 192x192 maskable icon');
    assert.ok(hasMaskable512, 'Missing 512x512 maskable icon');
  });

  check('All manifest icon files exist physically on disk', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
    for (const icon of manifest.icons) {
      const p = path.join(ROOT, icon.src);
      assert.ok(fs.existsSync(p), `Icon file missing on disk: ${icon.src}`);
      assert.ok(fs.statSync(p).size > 0, `Icon file is empty: ${icon.src}`);
    }
  });

  // 2. SERVICE WORKER VERIFICATION
  console.log('\n--- 2. SERVICE WORKER LIFECYCLE & CACHING LOGIC ---');
  check('sw.js declares cache versioning and distinct static/runtime caches', () => {
    const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.ok(swCode.includes('CACHE_VERSION'), 'Must declare CACHE_VERSION');
    assert.ok(swCode.includes('STATIC_CACHE'), 'Must declare STATIC_CACHE');
    assert.ok(swCode.includes('RUNTIME_CACHE'), 'Must declare RUNTIME_CACHE');
  });

  check('sw.js SHELL_ASSETS covers critical HTML, CSS, JS, and offline fallback', () => {
    const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.ok(swCode.includes('/offline.html'), 'Must precache offline.html');
    assert.ok(swCode.includes('/index.html'), 'Must precache index.html');
    assert.ok(swCode.includes('/search.html'), 'Must precache search.html');
    assert.ok(swCode.includes('/profile.html'), 'Must precache profile.html');
    assert.ok(swCode.includes('/dashboard.html'), 'Must precache dashboard.html');
    assert.ok(swCode.includes('/style.css'), 'Must precache style.css');
    assert.ok(swCode.includes('/app.js'), 'Must precache app.js');
    assert.ok(swCode.includes('/locations.js'), 'Must precache locations.js');
  });

  check('sw.js activates immediately and invalidates obsolete cache versions', () => {
    const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.ok(swCode.includes('self.skipWaiting()'), 'Must call skipWaiting in install');
    assert.ok(swCode.includes('self.clients.claim()'), 'Must call clients.claim in activate');
    assert.ok(swCode.includes('caches.delete'), 'Must delete obsolete caches on activate');
  });

  check('sw.js implements Network-First navigation with /offline.html fallback', () => {
    const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.ok(swCode.includes("request.mode === 'navigate'"), 'Must handle navigation mode');
    assert.ok(swCode.includes('/offline.html'), 'Must fallback to offline.html when network drops');
  });

  check('offline.html exists on disk and provides clear user guidance', () => {
    const offlinePath = path.join(ROOT, 'offline.html');
    assert.ok(fs.existsSync(offlinePath), 'offline.html must exist on disk');
    const content = fs.readFileSync(offlinePath, 'utf8');
    assert.ok(content.includes('Offline') || content.includes('Internet Connection'), 'Must mention offline status');
    assert.ok(content.includes('Try Reconnecting') || content.includes('reload'), 'Must provide retry action');
  });

  console.log('\n' + '='.repeat(80));
  console.log(`PWA SUITE SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  if (failed > 0) process.exit(1);
}

runPwaSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
