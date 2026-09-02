/**
 * LOKATOR.NG — LIVE VERCEL PRODUCTION VERIFICATION: CONTINUOUS TESTIMONIAL MARQUEE
 * Target: https://lokator-ng.vercel.app/
 */

const https = require('https');
const { chromium } = require('playwright');

const PROD_HOME_URL = 'https://lokator-ng.vercel.app/index.html';
const PROD_CSS_URL = 'https://lokator-ng.vercel.app/style.css';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Lokator-Live-Testimonials-Agent/1.0', 'Cache-Control': 'no-cache' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyLiveVercelTestimonials() {
  console.log('================================================================================');
  console.log('🚀 VERIFYING LIVE VERCEL PRODUCTION DEPLOYMENT FOR TESTIMONIALS MARQUEE');
  console.log(`🌐 Target: ${PROD_HOME_URL}`);
  console.log('================================================================================\n');

  // Step 1: HTTP & CDN Edge Cache Validation
  console.log('1. Checking HTTP Status from Vercel Edge CDN:');
  const pageRes = await fetchUrl(PROD_HOME_URL);
  console.log(`   ✓ ${PROD_HOME_URL} -> HTTP ${pageRes.statusCode}`);
  if (pageRes.statusCode !== 200) {
    throw new Error(`Expected HTTP 200 from ${PROD_HOME_URL}, got ${pageRes.statusCode}`);
  }

  const cssRes = await fetchUrl(PROD_CSS_URL);
  console.log(`   ✓ ${PROD_CSS_URL} -> HTTP ${cssRes.statusCode}`);

  // Step 2: Signature Checks on Live HTML & CSS
  console.log('\n2. Verifying New HTML & CSS Signatures on Live Production:');
  const requiredHtmlSignatures = [
    'testi-group',
    'Group 1: Primary Set',
    'Group 2: Seamless Clone Set 1'
  ];

  for (const sig of requiredHtmlSignatures) {
    const present = pageRes.body.includes(sig);
    console.log(`   ${present ? '✅' : '❌'} HTML Signature "${sig}": ${present ? 'PRESENT (Live)' : 'MISSING'}`);
    if (!present) throw new Error(`Live index.html is missing signature: ${sig}`);
  }

  const requiredCssSignatures = [
    '.testi-group',
    'scrollTestimonials 30s linear infinite',
    'overflow-x: clip'
  ];

  for (const sig of requiredCssSignatures) {
    const present = cssRes.body.includes(sig);
    console.log(`   ${present ? '✅' : '❌'} CSS Signature "${sig}": ${present ? 'PRESENT (Live)' : 'MISSING'}`);
    if (!present) throw new Error(`Live style.css is missing signature: ${sig}`);
  }

  // Step 3: Real Browser Execution on Live Vercel Production
  console.log('\n3. Running Live Headless Browser Audit on Vercel Production:');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14
      deviceScaleFactor: 2,
      locale: 'en-NG',
      serviceWorkers: 'block'
    });

    const page = await context.newPage();
    await page.route('**/*.{mp4,webm,ogg}', route => route.abort());
    await page.goto(PROD_HOME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#testimonials', { timeout: 15000 });
    // Wait until style.css is active
    await page.waitForFunction(() => {
      const track = document.getElementById('testi-track');
      return track && window.getComputedStyle(track).animationName === 'scrollTestimonials';
    }, { timeout: 15000 });
    console.log('   ✓ Live index.html loaded on mobile viewport (390x844) with active stylesheet');

    // Scroll to testimonials
    await page.evaluate(() => document.getElementById('testimonials').scrollIntoView());
    await page.waitForTimeout(500);

    // Live DOM structure & overflow verification
    const liveMarqueeAudit = await page.evaluate(() => {
      const track = document.getElementById('testi-track');
      const groups = track.querySelectorAll('.testi-group');
      const cs = window.getComputedStyle(track);
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;

      return {
        groupCount: groups.length,
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        animationPlayState: cs.animationPlayState,
        animationTimingFunction: cs.animationTimingFunction,
        docW,
        scrollW,
        bodyScrollW,
        noOverflow: scrollW <= docW && bodyScrollW <= docW
      };
    });

    console.log(`   ✓ Live Marquee Group Count: ${liveMarqueeAudit.groupCount} (Expected 2)`);
    console.log(`   ✓ Live Marquee Animation: ${liveMarqueeAudit.animationName} ${liveMarqueeAudit.animationDuration} ${liveMarqueeAudit.animationTimingFunction}`);
    console.log(`   ✓ Live Marquee Play State: ${liveMarqueeAudit.animationPlayState}`);
    console.log(`   ✓ Live Horizontal Overflow: docW=${liveMarqueeAudit.docW}, docScrollW=${liveMarqueeAudit.scrollW}, bodyScrollW=${liveMarqueeAudit.bodyScrollW} (0px OVERFLOW: ${liveMarqueeAudit.noOverflow ? 'YES' : 'NO'})`);

    if (liveMarqueeAudit.groupCount !== 2) throw new Error('Live Vercel does not have 2 groups yet');
    if (!liveMarqueeAudit.noOverflow) throw new Error('Live Vercel has horizontal body overflow');

    // Live Motion Sampling over time on Vercel
    const getLiveX = async () => {
      return await page.evaluate(() => {
        const track = document.getElementById('testi-track');
        const m = window.getComputedStyle(track).transform.match(/matrix.*\((.+)\)/);
        return m ? parseFloat(m[1].split(', ')[4]) : 0;
      });
    };

    const x0 = await getLiveX();
    await page.waitForTimeout(1500);
    const x1 = await getLiveX();
    await page.waitForTimeout(1500);
    const x2 = await getLiveX();

    console.log(`   ✓ Live Movement Tracking: t=0: ${x0.toFixed(1)}px -> t=1.5s: ${x1.toFixed(1)}px -> t=3s: ${x2.toFixed(1)}px`);
    const isMovingRightToLeft = x1 < x0 && x2 < x1;
    console.log(`   ✓ Live Movement Direction: RIGHT -> LEFT (${isMovingRightToLeft ? 'CONFIRMED' : 'FAILED'})`);

    if (!isMovingRightToLeft) throw new Error('Live Vercel testimonial track is not actively moving right-to-left');

    console.log('\n================================================================================');
    console.log('🎉 LIVE VERCEL PRODUCTION DEPLOYMENT FULLY CONFIRMED & VERIFIED (100%)!');
    console.log('================================================================================\n');

    await context.close();
  } finally {
    await browser.close();
  }
}

verifyLiveVercelTestimonials().catch(err => {
  console.error('❌ Live Vercel verification error:', err);
  process.exit(1);
});
