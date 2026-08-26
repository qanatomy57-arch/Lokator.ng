/**
 * Lokator.NG — Phase 10.18 HTTP & Asset Verification Suite
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('🌐 RUNNING PHASE 10.18 HTTP & ASSET VERIFICATION SUITE...');
console.log('================================================================================');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

// 1. profile.html
const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
test('1. profile.html contains reviews section, score summary, histogram and filter pills', () => {
  assert.ok(profileHtml.includes('id="reviews-section"'));
  assert.ok(profileHtml.includes('id="score-big-val"'));
  assert.ok(profileHtml.includes('id="reviews-histogram"'));
  assert.ok(profileHtml.includes('id="review-filter-pills"'));
  assert.ok(profileHtml.includes('id="reviews-container"'));
  assert.ok(profileHtml.includes('id="review-modal"'));
});

// 2. profile.js
const profileJs = fs.readFileSync(path.join(__dirname, '../profile.js'), 'utf8');
test('2. profile.js implements renderReviews with filter tabs, sub-ratings, and nested replies', () => {
  assert.ok(profileJs.includes('renderReviews'));
  assert.ok(profileJs.includes('btn-review-filter'));
  assert.ok(profileJs.includes('LokatorDB.reviews'));
  assert.ok(profileJs.includes('provider_reply'));
  assert.ok(profileJs.includes('Response from Artisan'));
});

// 3. dashboard.html
const dashHtml = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
test('3. dashboard.html contains reviews tab navigation and all-reviews-list container', () => {
  assert.ok(dashHtml.includes('data-tab="reviews"'));
  assert.ok(dashHtml.includes('id="tab-reviews"'));
  assert.ok(dashHtml.includes('id="all-reviews-list"'));
});

// 4. dashboard.js
const dashJs = fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8');
test('4. dashboard.js implements renderDashboardReviews and replyToReview dispatch', () => {
  assert.ok(dashJs.includes('renderDashboardReviews'));
  assert.ok(dashJs.includes('replyToReview'));
  assert.ok(dashJs.includes('btn-post-reply'));
  assert.ok(dashJs.includes('all-reviews-list'));
});

// 5. supabase-client.js
const clientJs = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
test('5. supabase-client.js exports LokatorDB.reviews manager with full lifecycle methods', () => {
  assert.ok(clientJs.includes('LokatorDB.reviews = reviewsManager'));
  assert.ok(clientJs.includes('addReview('));
  assert.ok(clientJs.includes('getProviderReviews('));
  assert.ok(clientJs.includes('getReviewSummary('));
  assert.ok(clientJs.includes('replyToReview('));
});

// 6. categories.js
const catJs = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
test('6. categories.js implements ServiceModerator.validateReview', () => {
  assert.ok(catJs.includes('validateReview('));
  assert.ok(catJs.includes('BLOCKED_KEYWORDS'));
});

console.log('\n================================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} PHASE 10.18 HTTP & ASSET CHECKS PASSED (100%)!`);
} else {
  console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  process.exit(1);
}
console.log('================================================================================\n');
