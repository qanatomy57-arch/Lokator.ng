const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const viewports = [
    { name: 'iPhone SE / Small', width: 320, height: 568 },
    { name: 'iPhone 12/13/14', width: 390, height: 844 },
    { name: 'iPhone 14/15 Pro', width: 393, height: 852 },
    { name: 'iPhone 14/15 Pro Max', width: 430, height: 932 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:8080/register.html', { waitUntil: 'networkidle' });

    console.log(`\n================ Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);
    
    // Check initial scroll width
    const scrollInfo = await page.evaluate(() => {
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log('Document Scroll Info (Step 1):', scrollInfo);

    // Step 3 inspection
    await page.evaluate(() => {
      // populate dummy step 1 and step 2 so we can advance
      document.getElementById('fname').value = 'Daniel';
      document.getElementById('lname').value = 'Johnson';
      document.getElementById('phone').value = '08012345678';
      document.getElementById('email').value = 'daniel@example.com';
      document.getElementById('password').value = 'password123';
      
      // Step 2
      const input = document.getElementById('skill-input');
      if (input) {
        input.value = 'Carpenter & Furniture Maker & Roofing & Woodwork Specialist';
        document.getElementById('btn-add-skill').click();
      }
      
      // Go to step 3
      if (typeof goToStep === 'function') {
        goToStep(3);
      }
    });

    await page.waitForTimeout(400);

    const step3Info = await page.evaluate(() => {
      const stepper = document.getElementById('onboarding-stepper');
      const stepperRect = stepper ? stepper.getBoundingClientRect() : null;
      const stepButtons = Array.from(document.querySelectorAll('.step-indicator')).map(btn => {
        const r = btn.getBoundingClientRect();
        return { text: btn.innerText.replace(/\n+/g, ' '), right: r.right, width: r.width, visible: r.right <= window.innerWidth };
      });
      const mapEl = document.getElementById('interactive-reg-map');
      const mapRect = mapEl ? mapEl.getBoundingClientRect() : null;
      
      // Check overflowing elements
      const allEls = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      for (const el of allEls) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1) {
          overflowing.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: r.right,
            width: r.width,
            exceedBy: r.right - window.innerWidth
          });
        }
      }

      return {
        stepperRect,
        stepButtons,
        mapRect,
        overflowingCount: overflowing.length,
        overflowingTop5: overflowing.slice(0, 5),
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        docScrollWidth: document.documentElement.scrollWidth
      };
    });

    console.log('Step 3 Info:', JSON.stringify(step3Info, null, 2));

    // Step 5 inspection
    await page.evaluate(() => {
      // Step 3 location
      const stateSel = document.getElementById('reg-state');
      if (stateSel) {
        stateSel.value = 'Delta';
        stateSel.dispatchEvent(new Event('change'));
      }
      const lgaSel = document.getElementById('reg-lga');
      if (lgaSel) {
        lgaSel.value = 'Okpe';
        lgaSel.dispatchEvent(new Event('change'));
      }
      const locInput = document.getElementById('reg-locality');
      if (locInput) {
        locInput.value = 'Osubi (Airport)';
      }
      
      if (typeof goToStep === 'function') {
        goToStep(5);
      }
    });

    await page.waitForTimeout(400);

    const step5Info = await page.evaluate(() => {
      const bioEl = document.getElementById('prev-bio');
      const bioStyle = bioEl ? window.getComputedStyle(bioEl) : null;
      const cardEl = document.getElementById('preview-profile-card');
      const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
      const tradeEl = document.getElementById('prev-trade');
      const tradeStyle = tradeEl ? window.getComputedStyle(tradeEl) : null;

      // Color info
      return {
        bioColor: bioStyle ? bioStyle.color : null,
        bioBg: bioStyle ? bioStyle.backgroundColor : null,
        cardBg: cardStyle ? cardStyle.backgroundColor : null,
        tradeColor: tradeStyle ? tradeStyle.color : null,
        docScrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    console.log('Step 5 Info:', JSON.stringify(step5Info, null, 2));

    await page.close();
  }

  await browser.close();
})();
