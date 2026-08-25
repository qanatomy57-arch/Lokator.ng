/**
 * LOKATOR.NG — BROWSER AUTOMATION QA FOR PHASE 10.12B
 * Tests search card contact CTAs, Profile CTAs, and mobile viewports
 */

const puppeteer = require('puppeteer');

async function runBrowserTests() {
  console.log('\n========================================================');
  console.log('🌐 BROWSER QA: NIGERIAN PHONE & WHATSAPP ACTIONS (10.12B)');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'iPhone X / 12 Mini (375x812)', width: 375, height: 812 },
    { name: 'iPhone 13 / 14 (390x844)', width: 390, height: 844 },
    { name: 'Android Pixel 7 / Galaxy (412x915)', width: 412, height: 915 }
  ];

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    const page = await browser.newPage();

    // 1. Test Search Page Contact CTAs
    console.log('👉 [1/3] Testing Search Page Contact Links (search.html)...');
    await page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });

    // Evaluate first card Call & WA links
    const cardCtas = await page.evaluate(() => {
      const waBtn = document.querySelector('.provider-item-card .wa-btn');
      const callBtn = document.querySelector('.provider-item-card .call-btn');
      return {
        waHref: waBtn ? waBtn.getAttribute('href') : null,
        callHref: callBtn ? callBtn.getAttribute('href') : null
      };
    });

    console.log('   Card WA href:', cardCtas.waHref);
    console.log('   Card Call href:', cardCtas.callHref);

    if (cardCtas.waHref && cardCtas.waHref.startsWith('https://wa.me/234') && !cardCtas.waHref.includes('234234') && !cardCtas.waHref.includes('+234')) {
      console.log('   ✅ [PASS] Search card WhatsApp deep link has canonical 234 format without double country code');
      testsPassed++;
    } else {
      console.error('   ❌ [FAIL] Search card WhatsApp deep link invalid:', cardCtas.waHref);
      testsFailed++;
    }

    if (cardCtas.callHref && cardCtas.callHref.startsWith('tel:+234')) {
      console.log('   ✅ [PASS] Search card Call link has valid international tel:+234 format');
      testsPassed++;
    } else {
      console.error('   ❌ [FAIL] Search card Call link invalid:', cardCtas.callHref);
      testsFailed++;
    }

    // 2. Test Profile Page Hero & Booking CTAs
    console.log('\n👉 [2/3] Testing Profile Page Contact Links (profile.html?id=1)...');
    await page.goto('http://localhost:3000/profile.html?id=1', { waitUntil: 'networkidle0' });

    const profileCtas = await page.evaluate(() => {
      const heroCall = document.getElementById('btn-call-hero');
      const heroWa = document.getElementById('btn-wa-hero');
      const modalWa = document.getElementById('wa-send-btn');
      return {
        heroCallHref: heroCall ? heroCall.getAttribute('href') : null,
        heroWaHref: heroWa ? heroWa.getAttribute('href') : null,
        modalWaHref: modalWa ? modalWa.getAttribute('href') : null
      };
    });

    console.log('   Profile Hero Call href:', profileCtas.heroCallHref);
    console.log('   Profile Hero WA href:', profileCtas.heroWaHref);
    console.log('   Profile Modal WA href:', profileCtas.modalWaHref);

    if (profileCtas.heroCallHref === 'tel:+2348012345678') {
      console.log('   ✅ [PASS] Profile hero Call link correctly formatted');
      testsPassed++;
    } else {
      console.error('   ❌ [FAIL] Profile hero Call link invalid:', profileCtas.heroCallHref);
      testsFailed++;
    }

    if (profileCtas.heroWaHref && profileCtas.heroWaHref.startsWith('https://wa.me/2348012345678?text=')) {
      console.log('   ✅ [PASS] Profile hero WhatsApp link correctly formatted');
      testsPassed++;
    } else {
      console.error('   ❌ [FAIL] Profile hero WhatsApp link invalid:', profileCtas.heroWaHref);
      testsFailed++;
    }

    // 3. Test Mobile Viewports
    console.log('\n👉 [3/3] Testing Responsive Viewports...');
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });
      const isVisible = await page.evaluate(() => {
        const waBtn = document.querySelector('.provider-item-card .wa-btn');
        if (!waBtn) return false;
        const rect = waBtn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (isVisible) {
        console.log(`   ✅ [PASS] Action buttons rendered and tappable on ${vp.name}`);
        testsPassed++;
      } else {
        console.error(`   ❌ [FAIL] Action buttons not rendered properly on ${vp.name}`);
        testsFailed++;
      }
    }

  } catch (err) {
    console.error('Fatal browser test error:', err);
    testsFailed++;
  } finally {
    await browser.close();
  }

  console.log('\n========================================================');
  console.log(`BROWSER VERIFICATION RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runBrowserTests();
