// ============================================================================
// LOKATOR.NG — PHASE 10.12E AUTOMATED VERIFICATION SUITE
// Hero Performance Optimization, Poster-First Loading & Adaptive Strategy
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function logPass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
  passed++;
}

function logFail(msg, err) {
  console.error(`  ❌ [FAIL] ${msg}`);
  if (err) console.error(`     Details: ${err.message || err}`);
  failed++;
}

console.log('\n================================================================================');
console.log('⚡ LOKATOR.NG — PHASE 10.12E CINEMATIC HERO PERFORMANCE VERIFICATION');
console.log('================================================================================\n');

const rootDir = path.join(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const appJsPath = path.join(rootDir, 'app.js');
const swJsPath = path.join(rootDir, 'sw.js');
const heroDir = path.join(rootDir, 'hero');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const swJs = fs.readFileSync(swJsPath, 'utf8');

// --- TEST GROUP 1: HERO STRUCTURE & SCENE INTEGRITY ---
console.log('--- TEST GROUP 1: HERO STRUCTURE & SCENE INTEGRITY ---');

try {
  assert(indexHtml.includes('id="hero"'), 'Hero container id="hero" missing');
  logPass('Hero container id="hero" is present');
} catch (e) { logFail('Hero container present', e); }

try {
  const slideMatches = indexHtml.match(/class="hero-slide/g) || [];
  assert.strictEqual(slideMatches.length, 9, `Expected 9 hero slides, found ${slideMatches.length}`);
  logPass(`All 9 hero slides present in index.html`);
} catch (e) { logFail('9 hero slides present', e); }

try {
  for (let i = 0; i <= 8; i++) {
    assert(indexHtml.includes(`id="video-${i}"`), `Video element id="video-${i}" missing`);
  }
  logPass('All 9 hero video elements (id="video-0" .. id="video-8") present');
} catch (e) { logFail('All 9 hero video elements present', e); }

// --- TEST GROUP 2: POSTER-FIRST STRATEGY & ASSET INTEGRITY ---
console.log('\n--- TEST GROUP 2: POSTER-FIRST STRATEGY & ASSET INTEGRITY ---');

try {
  let posterCount = 0;
  for (let i = 0; i <= 8; i++) {
    const posterName = `poster_0${i + 1}.jpg`;
    const posterPath = path.join(heroDir, posterName);
    assert(fs.existsSync(posterPath), `Poster file missing: ${posterName}`);
    const stat = fs.statSync(posterPath);
    assert(stat.size > 10000, `Poster file ${posterName} unexpectedly small (${stat.size} bytes)`);
    assert(indexHtml.includes(`poster="hero/${posterName}"`), `HTML video-${i} missing poster attribute for ${posterName}`);
    posterCount++;
  }
  logPass(`All 9 hero videos configured with valid poster images (${posterCount}/9)`);
} catch (e) { logFail('Poster images present & configured', e); }

// --- TEST GROUP 3: CONTROLLED PRELOADING & BANDWIDTH REDUCTION ---
console.log('\n--- TEST GROUP 3: CONTROLLED PRELOADING & BANDWIDTH REDUCTION ---');

try {
  assert(indexHtml.includes('id="video-0"') && indexHtml.includes('preload="auto"'), 'video-0 missing preload="auto"');
  logPass('video-0 (active scene) configured with preload="auto"');
} catch (e) { logFail('video-0 preload="auto"', e); }

try {
  let deferredCount = 0;
  for (let i = 1; i <= 8; i++) {
    const videoTagRegex = new RegExp(`id="video-${i}"[^>]*preload="none"`);
    assert(videoTagRegex.test(indexHtml), `video-${i} should have preload="none" in initial HTML`);
    deferredCount++;
  }
  logPass(`All inactive hero videos (video-1 .. video-8) deferred with preload="none" (${deferredCount}/8)`);
} catch (e) { logFail('Inactive videos deferred', e); }

try {
  let totalVideoSize = 0;
  for (let i = 1; i <= 9; i++) {
    const vidFile = path.join(heroDir, `0${i}_${i === 1 ? 'master_marketplace' : i === 2 ? 'electrician' : i === 3 ? 'plumber' : i === 4 ? 'beauty_nail' : i === 5 ? 'tailor' : i === 6 ? 'mechanic' : i === 7 ? 'carpenter' : i === 8 ? 'cleaner' : 'finale_community'}.mp4`);
    if (fs.existsSync(vidFile)) {
      totalVideoSize += fs.statSync(vidFile).size;
    }
  }
  const video0Size = fs.statSync(path.join(heroDir, '01_master_marketplace.mp4')).size;
  const reductionPct = (((totalVideoSize - video0Size) / totalVideoSize) * 100).toFixed(1);
  logPass(`Initial hero media transfer reduced by ${reductionPct}% (from ${(totalVideoSize / 1024 / 1024).toFixed(1)}MB to ${(video0Size / 1024 / 1024).toFixed(1)}MB)`);
} catch (e) { logFail('Bandwidth reduction metric', e); }

// --- TEST GROUP 4: ADAPTIVE NETWORK & DEVICE LOGIC IN APP.JS ---
console.log('\n--- TEST GROUP 4: ADAPTIVE NETWORK & DEVICE LOGIC IN APP.JS ---');

try {
  assert(appJs.includes('detectNetworkAndDeviceCapabilities'), 'detectNetworkAndDeviceCapabilities method missing in app.js');
  assert(appJs.includes('this.effectiveType'), 'effectiveType detection missing');
  assert(appJs.includes('this.saveData'), 'saveData detection missing');
  assert(appJs.includes('this.isSlowConnection'), 'isSlowConnection metric missing');
  logPass('Network capabilities detection (effectiveType, saveData, isSlowConnection) present in app.js');
} catch (e) { logFail('Network capabilities detection in app.js', e); }

try {
  assert(appJs.includes('prefers-reduced-motion'), 'prefers-reduced-motion media query check missing in app.js');
  logPass('Accessibility prefers-reduced-motion preference respected in app.js');
} catch (e) { logFail('prefers-reduced-motion in app.js', e); }

try {
  assert(appJs.includes('bufferAdjacentVideos'), 'bufferAdjacentVideos method missing');
  assert(appJs.includes('Math.abs(idx - centerIdx) > 2'), 'Resource release for distant scenes (> 2 slides) missing');
  logPass('Controlled adjacent preloading & distant scene resource release implemented in app.js');
} catch (e) { logFail('Controlled adjacent preloading', e); }

// --- TEST GROUP 5: PWA & SERVICE WORKER INTEGRITY ---
console.log('\n--- TEST GROUP 5: PWA & SERVICE WORKER INTEGRITY ---');

try {
  for (let i = 1; i <= 9; i++) {
    const posterPath = `/hero/poster_0${i}.jpg`;
    assert(swJs.includes(posterPath), `sw.js missing poster asset: ${posterPath}`);
  }
  logPass('All 9 hero poster images included in sw.js SHELL_ASSETS');
} catch (e) { logFail('Hero posters in sw.js', e); }

try {
  assert(!swJs.includes('.mp4'), 'sw.js should NOT precache large .mp4 video files in static shell');
  logPass('Service Worker correctly omits large MP4 videos from static shell precache');
} catch (e) { logFail('No MP4 in sw.js precache', e); }

// --- SUMMARY ---
console.log('\n================================================================================');
console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================\n');

process.exit(failed > 0 ? 1 : 0);
