/**
 * LOKATOR.NG — BROWSER AUTOMATION QA FOR PHASE 10.12F
 * Mobile Discovery UX, Bottom-Sheet Filters, Location Cascade & Search Composition
 */

const puppeteer = require('puppeteer');

async function runBrowserTests() {
  console.log('\n========================================================');
  console.log('🌐 BROWSER QA: MOBILE DISCOVERY & BOTTOM-SHEET UX (10.12F)');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assertTest(name, condition, extra = '') {
    if (condition) {
      console.log(`   ✅ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`   ❌ [FAIL] ${name} ${extra ? `(${extra})` : ''}`);
      testsFailed++;
    }
  }

  try {
    const page = await browser.newPage();
    // Simulate Mobile Viewport (iPhone 13 / 14 - 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log('👉 [1/6] Navigating to Search Page on Mobile Viewport (390x844)...');
    await page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });

    // 1. Verify Mobile Filter Button is visible
    const mobileBtnVisible = await page.evaluate(() => {
      const btn = document.getElementById('mobile-filter-btn');
      if (!btn) return false;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });
    assertTest('Mobile filter trigger button is visible on mobile viewport', mobileBtnVisible);

    // 2. Open Bottom Sheet Filter Drawer
    console.log('👉 [2/6] Tapping Mobile Filter Trigger...');
    await page.click('#mobile-filter-btn');
    await new Promise(r => setTimeout(r, 400));

    const drawerOpenState = await page.evaluate(() => {
      const sidebar = document.getElementById('filter-sidebar');
      const backdrop = document.getElementById('filter-backdrop');
      const trigger = document.getElementById('mobile-filter-btn');
      const bodyLocked = document.body.classList.contains('filter-drawer-open');
      return {
        hasOpenClass: sidebar ? sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open') : false,
        backdropActive: backdrop ? backdrop.classList.contains('active') : false,
        ariaExpanded: trigger ? trigger.getAttribute('aria-expanded') : null,
        bodyLocked
      };
    });

    assertTest('Filter sidebar receives open / mobile-open class', drawerOpenState.hasOpenClass);
    assertTest('Backdrop receives active class on drawer open', drawerOpenState.backdropActive);
    assertTest('Mobile trigger aria-expanded updates to "true"', drawerOpenState.ariaExpanded === 'true');
    assertTest('Body scroll is locked via filter-drawer-open class', drawerOpenState.bodyLocked);

    // 3. Test Location Cascade in Mobile Drawer (State -> LGA -> Locality)
    console.log('👉 [3/6] Testing Nigerian Location Cascade in Filter Sheet...');
    
    // Select Lagos State
    await page.select('#state-select', 'Lagos');
    await new Promise(r => setTimeout(r, 200));

    const lgaSelectState = await page.evaluate(() => {
      const lgaSel = document.getElementById('lga-select');
      const options = Array.from(lgaSel ? lgaSel.options : []).map(o => o.value);
      return {
        disabled: lgaSel ? lgaSel.disabled : true,
        count: options.length,
        hasIkeja: options.includes('Ikeja'),
        hasEtiOsa: options.includes('Eti-Osa')
      };
    });

    assertTest('LGA select enables and populates Lagos LGAs', !lgaSelectState.disabled && lgaSelectState.hasIkeja && lgaSelectState.hasEtiOsa);

    // Select Eti-Osa LGA
    await page.select('#lga-select', 'Eti-Osa');
    await new Promise(r => setTimeout(r, 200));

    const localitySelectState = await page.evaluate(() => {
      const locGroup = document.getElementById('locality-filter-group');
      const locSel = document.getElementById('locality-select');
      const options = Array.from(locSel ? locSel.options : []).map(o => o.value);
      const isVisible = locGroup && window.getComputedStyle(locGroup).display !== 'none';
      return {
        isVisible,
        hasLekki: options.some(o => o.includes('Lekki')),
        hasVI: options.some(o => o.includes('Victoria Island'))
      };
    });

    assertTest('Locality select displays and populates Eti-Osa neighborhoods (Lekki / VI)', localitySelectState.isVisible && localitySelectState.hasLekki);

    // 4. Test Mobile "Apply Filters" action
    console.log('👉 [4/6] Tapping Sticky "Apply Filters" Button in Mobile Sheet...');
    await page.click('#mobile-apply-filters-btn');
    await new Promise(r => setTimeout(r, 400));

    const drawerClosedState = await page.evaluate(() => {
      const sidebar = document.getElementById('filter-sidebar');
      const backdrop = document.getElementById('filter-backdrop');
      const trigger = document.getElementById('mobile-filter-btn');
      const bodyLocked = document.body.classList.contains('filter-drawer-open');
      const urlHasLagos = window.location.search.includes('state=Lagos');
      return {
        isOpen: sidebar ? sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open') : false,
        backdropActive: backdrop ? backdrop.classList.contains('active') : false,
        ariaExpanded: trigger ? trigger.getAttribute('aria-expanded') : null,
        bodyLocked,
        urlHasLagos
      };
    });

    assertTest('Bottom sheet closes smoothly on Apply Filters click', !drawerClosedState.isOpen && !drawerClosedState.backdropActive);
    assertTest('Body scroll lock is released on close', !drawerClosedState.bodyLocked);
    assertTest('URL query params synchronized with applied filter state', drawerClosedState.urlHasLagos);

    // 5. Test Backdrop Click Dismissal
    console.log('👉 [5/6] Testing Backdrop Tap Dismissal...');
    await page.click('#mobile-filter-btn');
    await new Promise(r => setTimeout(r, 300));
    await page.click('#filter-backdrop');
    await new Promise(r => setTimeout(r, 300));

    const dismissedViaBackdrop = await page.evaluate(() => {
      const sidebar = document.getElementById('filter-sidebar');
      return !(sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open')));
    });
    assertTest('Tapping backdrop closes mobile bottom sheet', dismissedViaBackdrop);

    // 6. Test Escape Key Dismissal
    console.log('👉 [6/6] Testing Escape Key Dismissal...');
    await page.click('#mobile-filter-btn');
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));

    const dismissedViaEscape = await page.evaluate(() => {
      const sidebar = document.getElementById('filter-sidebar');
      return !(sidebar && (sidebar.classList.contains('mobile-open') || sidebar.classList.contains('open')));
    });
    assertTest('Pressing Escape key closes mobile bottom sheet', dismissedViaEscape);

  } catch (err) {
    console.error('Fatal Puppeteer test error:', err);
    testsFailed++;
  } finally {
    await browser.close();
  }

  console.log('\n========================================================');
  console.log(`BROWSER VERIFICATION COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================================\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runBrowserTests();
