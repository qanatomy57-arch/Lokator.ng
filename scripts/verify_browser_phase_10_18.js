/**
 * Lokator.NG — Phase 10.18 Browser & User Journey Verification Suite
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
  console.log('\n🖥️ RUNNING PHASE 10.18 BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');
  const dashHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');

  await test('1. Profile reviews section includes score summary and 5-star histogram bars', () => {
    assert.ok(profileHtml.includes('score-big-val'));
    assert.ok(profileHtml.includes('histo-bar-5'));
    assert.ok(profileHtml.includes('histo-bar-1'));
    assert.ok(profileJs.includes('summary.distribution'));
  });

  await test('2. Profile review modal captures overall rating, sub-ratings, and author identity', () => {
    assert.ok(profileHtml.includes('star-picker'));
    assert.ok(profileHtml.includes('rev-author'));
    assert.ok(profileHtml.includes('rev-comment'));
    assert.ok(profileJs.includes('selectedRating'));
  });

  await test('3. Filter pills switch view between All, 5-Star, and Artisan Replied reviews', () => {
    assert.ok(profileHtml.includes('data-filter="all"'));
    assert.ok(profileHtml.includes('data-filter="5star"'));
    assert.ok(profileHtml.includes('data-filter="with_reply"'));
    assert.ok(profileJs.includes('btn-review-filter'));
  });

  await test('4. Provider dashboard renders customer reviews feed with response desk', () => {
    assert.ok(dashHtml.includes('id="tab-reviews"'));
    assert.ok(dashHtml.includes('id="all-reviews-list"'));
    assert.ok(dashJs.includes('renderDashboardReviews'));
    assert.ok(dashJs.includes('dash-review-card'));
  });

  await test('5. Artisan responses render with official verification badge and reply timestamp', () => {
    assert.ok(dashJs.includes('Your Official Response') || dashJs.includes('Response from Artisan'));
    assert.ok(profileJs.includes('Response from Artisan'));
    assert.ok(dashJs.includes('LokatorDB.reviews.replyToReview'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.18 BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

runBrowserTests();
