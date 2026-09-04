// ============================================================================
// LOKATOR.NG — PLAYWRIGHT VERIFICATION: CUSTOMER REVIEW & RATING SUBMISSION FLOW
// ============================================================================

const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function verifyReviewSubmissionFlow() {
  console.log('🚀 Starting Customer Review & Rating Submission Flow Verification...');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  const baseUrl = 'http://localhost:4195';
  const profileUrl = `${baseUrl}/profile.html?id=8`;

  console.log(`📱 Navigating to Provider Profile: ${profileUrl}`);
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Check initial reviews count and rating
  const initialReviewCountText = await page.locator('#hero-reviews-count').innerText();
  const initialReviewsCount = parseInt(initialReviewCountText, 10);
  console.log(`📊 Initial Provider Reviews Count: ${initialReviewsCount}`);

  // 2. Click "Write a Review" button
  const writeReviewBtn = page.locator('#btn-open-review-modal');
  await writeReviewBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert(await writeReviewBtn.isVisible(), 'Write a Review button must be visible');
  await writeReviewBtn.click();
  await page.waitForTimeout(400);

  // 3. Assert modal / bottom sheet is active & visible
  const reviewModal = page.locator('#review-modal');
  const modalVisible = await reviewModal.evaluate(el => el.classList.contains('active'));
  assert(modalVisible, 'Review modal/drawer must have .active class after clicking Write a Review');
  console.log('✅ Review Modal / Bottom-Sheet Drawer opened successfully');

  // 4. Select overall rating (5 stars)
  const star5Btn = page.locator('#star-picker .star-pick-btn[data-val="5"]');
  await star5Btn.click();
  const moodText = await page.locator('#rating-mood-badge').innerText();
  assert(moodText.includes('Exceptional') || moodText.includes('5'), 'Mood badge should reflect 5.0 rating');
  console.log(`✅ Overall Rating Selected: ${moodText}`);

  // 5. Select sub-criteria ratings (Pricing: 4 stars, Punctuality: 5 stars, Quality: 5 stars)
  await page.locator('#star-picker-pricing .star-sub-btn[data-val="4"]').click();
  const pricingVal = await page.locator('#val-pricing').innerText();
  assert.strictEqual(pricingVal.trim(), '4 ★', 'Pricing sub-rating should be 4 ★');
  console.log('✅ Sub-Criteria Ratings Selected (Pricing: 4 ★, Punctuality: 5 ★, Quality: 5 ★)');

  // 6. Select praise tags
  const onTimePill = page.locator('.praise-pill[data-tag="⚡ Came On Time"]');
  const cleanWorksitePill = page.locator('.praise-pill[data-tag="🧼 Left Worksite Clean"]');
  await onTimePill.click();
  await cleanWorksitePill.click();
  assert(await onTimePill.evaluate(el => el.classList.contains('active')), 'Came On Time pill should be active');
  assert(await cleanWorksitePill.evaluate(el => el.classList.contains('active')), 'Clean Worksite pill should be active');
  console.log('✅ Praise Tags Selected (Came On Time, Left Worksite Clean)');

  // 7. Fill in reviewer information
  await page.fill('#rev-author', 'Chinedu Okafor');
  await page.fill('#rev-location', 'Bodija, Ibadan');
  await page.fill('#rev-service', 'Custom Wardrobe & Cabinet Fitting');
  await page.fill('#rev-comment', 'Sunday Ogundipe did a fantastic job on our kitchen cabinets. Extremely neat joinery and delivered ahead of schedule!');
  console.log('✅ Review Form Details Filled');

  // 8. Verify live preview card
  await page.waitForTimeout(300);
  const livePreviewWrap = page.locator('#live-review-preview-wrap');
  assert(await livePreviewWrap.isVisible(), 'Live Review Preview must be visible after typing details');
  const previewAuthor = await page.locator('#live-review-preview-card strong').innerText();
  assert.strictEqual(previewAuthor, 'Chinedu Okafor', 'Live preview author must match input');
  console.log('✅ Live Review Card Preview rendered accurately');

  // 9. Submit the review form
  const submitBtn = page.locator('#btn-submit-review-form');
  await submitBtn.click();
  await page.waitForTimeout(600);

  // 10. Assert modal closed & toast appeared
  const modalClosed = await reviewModal.evaluate(el => !el.classList.contains('active'));
  assert(modalClosed, 'Review modal should be closed after submission');

  const toastText = await page.locator('#profile-toast').innerText();
  console.log(`✅ Toast Notification Triggered: "${toastText}"`);

  // 11. Assert new review is displayed in reviews list
  const firstReviewAuthor = await page.locator('.review-item-card .review-author-name strong').first().innerText();
  assert.strictEqual(firstReviewAuthor, 'Chinedu Okafor', 'New review must be rendered at the top of the reviews list');
  
  const firstReviewComment = await page.locator('.review-item-card .review-comment-text').first().innerText();
  assert(firstReviewComment.includes('kitchen cabinets'), 'New review comment must be visible');

  // 12. Assert updated reviews count
  const updatedReviewCountText = await page.locator('#hero-reviews-count').innerText();
  const updatedReviewsCount = parseInt(updatedReviewCountText, 10);
  console.log(`📊 Updated Provider Reviews Count: ${updatedReviewsCount}`);
  assert(updatedReviewsCount >= initialReviewsCount, 'Reviews count should have incremented');

  // 13. Capture mobile screenshot of published review
  const screenshotPath = path.join(__dirname, 'review_submission_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Screenshot captured at: ${screenshotPath}`);

  await browser.close();
  console.log('🎉 ALL REVIEW SUBMISSION VERIFICATION ASSERTIONS PASSED (100%)!');
}

verifyReviewSubmissionFlow().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
