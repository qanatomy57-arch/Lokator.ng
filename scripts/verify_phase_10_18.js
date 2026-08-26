/**
 * Lokator.NG — Phase 10.18 Verified Review & Artisan Reputation Unit Test Suite
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('⭐ LOKATOR.NG — PHASE 10.18 ARTISAN REPUTATION & VERIFIED REVIEW SUITE');
console.log('================================================================================');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Mock ServiceModerator
const mockModerator = {
  validateReview: (text) => {
    if (text.includes('badword_forbidden')) {
      return { valid: false, error: 'Disallowed profanity detected.' };
    }
    return { valid: true };
  }
};
global.ServiceModerator = mockModerator;
global.window.ServiceModerator = mockModerator;

// Mock Telemetry
const telemetryEvents = [];
global.LokatorTelemetry = {
  trackEvent: (evt, data) => telemetryEvents.push({ evt, data, time: Date.now() })
};

// Load dependencies
const locCode = fs.readFileSync(path.join(__dirname, '../locations.js'), 'utf8');
eval(locCode);
const catCode = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
eval(catCode);
const searchLangCode = fs.readFileSync(path.join(__dirname, '../search-language.js'), 'utf8');
eval(searchLangCode);
const provCode = fs.readFileSync(path.join(__dirname, '../providers-data.js'), 'utf8');
eval(provCode);
const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
eval(clientCode);

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
  console.log('\n--- 1. REVIEW ENGINE API & VERIFIED SUBMISSIONS ---');
  await test('1.1 LokatorDB.reviews exists and exports required methods', async () => {
    assert.ok(LokatorDB.reviews, 'LokatorDB.reviews must be defined');
    assert.strictEqual(typeof LokatorDB.reviews.addReview, 'function');
    assert.strictEqual(typeof LokatorDB.reviews.getProviderReviews, 'function');
    assert.strictEqual(typeof LokatorDB.reviews.getReviewSummary, 'function');
    assert.strictEqual(typeof LokatorDB.reviews.replyToReview, 'function');
  });

  await test('1.2 addReview successfully adds customer review with sub-ratings', async () => {
    const res = LokatorDB.reviews.addReview({
      provider_id: 101,
      customer_name: 'Chidi Anozie',
      rating: 5,
      punctuality: 5,
      pricing: 4,
      quality: 5,
      comment: 'Excellent wiring work done on my duplex in Ikeja.',
      job_type: 'Electrical Rewiring'
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.review.id.startsWith('rev_'));
    assert.strictEqual(res.review.customer_name, 'Chidi Anozie');
    assert.strictEqual(res.review.punctuality, 5);
    assert.strictEqual(res.review.pricing, 4);
  });

  await test('1.3 getProviderReviews retrieves reviews sorted by newest first', async () => {
    LokatorDB.reviews.addReview({
      provider_id: 101,
      customer_name: 'Fatima Bello',
      rating: 4,
      punctuality: 4,
      pricing: 5,
      quality: 4,
      comment: 'Arrived on time and resolved generator issue.',
      job_type: 'Generator Servicing'
    });

    const reviews = LokatorDB.reviews.getProviderReviews(101);
    assert.strictEqual(reviews.length, 2);
    assert.strictEqual(reviews[0].customer_name, 'Fatima Bello');
  });

  console.log('\n--- 2. REPUTATION SUMMARY & DISTRIBUTION CALCULATIONS ---');
  await test('2.1 getReviewSummary calculates average and 5-star distribution', async () => {
    const summary = LokatorDB.reviews.getReviewSummary(101);
    assert.strictEqual(summary.totalCount, 2);
    assert.strictEqual(summary.averageRating, 4.5);
    assert.strictEqual(summary.distribution[5], 1);
    assert.strictEqual(summary.distribution[4], 1);
    assert.strictEqual(summary.distribution[3], 0);
  });

  console.log('\n--- 3. ARTISAN RESPONSE DESK & CONTENT MODERATION ---');
  await test('3.1 replyToReview allows provider to post official response', async () => {
    const reviews = LokatorDB.reviews.getProviderReviews(101);
    const reviewId = reviews[0].id;

    const res = LokatorDB.reviews.replyToReview(reviewId, 'Thank you Fatima! Glad I could help.', 101);
    assert.strictEqual(res.success, true);
    assert.ok(res.review.provider_reply);
    assert.strictEqual(res.review.provider_reply.text, 'Thank you Fatima! Glad I could help.');
  });

  await test('3.2 replyToReview rejects unauthorized provider reply', async () => {
    const reviews = LokatorDB.reviews.getProviderReviews(101);
    const reviewId = reviews[0].id;

    assert.throws(() => {
      LokatorDB.reviews.replyToReview(reviewId, 'Intruder reply', 999);
    }, /Unauthorized/);
  });

  await test('3.3 addReview blocks content failing moderation', async () => {
    assert.throws(() => {
      LokatorDB.reviews.addReview({
        provider_id: 101,
        customer_name: 'Spammer',
        rating: 1,
        comment: 'This artisan is a scam and thief.'
      });
    }, /Disallowed keyword detected/);
  });

  console.log('\n--- 4. TELEMETRY & SAFE MONETIZATION INVARIANTS ---');
  await test('4.1 Telemetry logs review submission and reply events', async () => {
    const subEvent = telemetryEvents.find(e => e.evt === 'review_submitted');
    const replyEvent = telemetryEvents.find(e => e.evt === 'review_reply_posted');
    assert.ok(subEvent, 'Must log review_submitted event');
    assert.ok(replyEvent, 'Must log review_reply_posted event');
  });

  await test('4.2 Safe zero-payment baseline preserved', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.18 UNIT ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
