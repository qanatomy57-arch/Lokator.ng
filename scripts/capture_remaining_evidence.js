/**
 * PADIFIX COMPLETE REMAINING EVIDENCE & AUDIT TELEMETRY RUNNER
 * scripts/capture_remaining_evidence.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'product_audit');

async function run() {
  console.log('🚀 Executing remaining audit captures & telemetry...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const findings = {
    search: {},
    login: {},
    dashboard: {},
    overflows: [],
    sub44pxTargets: [],
    a11y: {},
    performance: {},
    security: {}
  };

  try {
    // -------------------------------------------------------------------------
    // 1. FLOW B: SEARCH & MOBILE DRAWER
    // -------------------------------------------------------------------------
    console.log('1. Flow B Search & Mobile Drawer...');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/search.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Search Plumber
      await page.fill('#keyword-search', 'Plumber');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b2_search_plumber_results.png') });
      const plumberCount = await page.locator('.provider-card, [data-provider-id]').count();

      // Search Generator
      await page.fill('#keyword-search', 'Generator repair');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b3_search_generator_results.png') });
      const genCount = await page.locator('.provider-card, [data-provider-id]').count();

      // Search Misspelled
      await page.fill('#keyword-search', 'plumbar');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b4_search_misspelled_plumbar.png') });
      const plumbarCount = await page.locator('.provider-card, [data-provider-id]').count();

      // Search Zero Results
      await page.fill('#keyword-search', 'xyzquantum99999');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b6_search_zero_results.png') });
      const zeroVisible = await page.locator('#empty-state').isVisible();

      findings.search = { plumberCount, genCount, plumbarCount, zeroVisible };
      await context.close();

      // Mobile Drawer
      const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const mobPage = await mobCtx.newPage();
      await mobPage.goto(`${BASE_URL}/search.html`, { waitUntil: 'domcontentloaded' });
      await mobPage.waitForTimeout(1000);

      const filterBtn = mobPage.locator('#mobile-filter-btn');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await mobPage.waitForTimeout(600);
        await mobPage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b7_search_mobile_drawer_open.png') });
      }
      await mobPage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b8_search_mobile_card_list.png') });
      await mobCtx.close();
    }

    // -------------------------------------------------------------------------
    // 2. FLOW G & H: AUTHENTICATED DASHBOARD & EDITING
    // -------------------------------------------------------------------------
    console.log('2. Flow G & H Authenticated Dashboard & Editing...');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      // Navigate to index to seed localStorage session
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const dummyProvider = {
          id: 1,
          name: 'Adebayo Okafor',
          trade: 'Master Electrician & Solar Installer',
          category: 'Electrician',
          phone: '+2348012345678',
          city: 'Lagos',
          area: 'Surulere, Lagos',
          rating: 4.9,
          reviewsCount: 214,
          isVerified: true
        };
        localStorage.setItem('lokator_current_provider', JSON.stringify(dummyProvider));
        localStorage.setItem('padifix_current_provider', JSON.stringify(dummyProvider));
      });

      // Now navigate to dashboard.html
      await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_g3_dashboard_desktop_kpis.png') });

      // Profile edit tab
      const profileTab = page.locator('#tab-btn-profile, [data-tab="profile"], button:has-text("Profile")').first();
      if (await profileTab.isVisible()) {
        await profileTab.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_h1_dashboard_profile_edit.png') });
      }

      // Subscription tab
      const subTab = page.locator('#tab-btn-subscription, [data-tab="subscription"], button:has-text("Subscription"), button:has-text("Trust")').first();
      if (await subTab.isVisible()) {
        await subTab.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_i1_subscription_plans_table.png') });
      }

      await context.close();

      // Mobile Dashboard
      const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const mobPage = await mobCtx.newPage();
      await mobPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      await mobPage.evaluate(() => {
        const dummyProvider = {
          id: 1,
          name: 'Adebayo Okafor',
          trade: 'Master Electrician & Solar Installer',
          category: 'Electrician',
          phone: '+2348012345678',
          city: 'Lagos',
          area: 'Surulere, Lagos',
          rating: 4.9,
          reviewsCount: 214,
          isVerified: true
        };
        localStorage.setItem('lokator_current_provider', JSON.stringify(dummyProvider));
        localStorage.setItem('padifix_current_provider', JSON.stringify(dummyProvider));
      });
      await mobPage.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'domcontentloaded' });
      await mobPage.waitForTimeout(1500);
      await mobPage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_g4_dashboard_mobile_view.png') });
      await mobCtx.close();
    }

    // -------------------------------------------------------------------------
    // 3. FLOW P: MOBILE VIEWPORTS & OVERFLOWS (320, 390, 412, 1280, 1440, 1920)
    // -------------------------------------------------------------------------
    console.log('3. Flow P Viewports & Overflows...');
    {
      const viewports = [
        { width: 320, height: 844, name: '320_compact_iphone_se' },
        { width: 390, height: 844, name: '390_standard_iphone_14' },
        { width: 412, height: 915, name: '412_samsung_galaxy' },
        { width: 1280, height: 720, name: '1280_compact_desktop' },
        { width: 1440, height: 900, name: '1440_standard_desktop' },
        { width: 1920, height: 1080, name: '1920_large_desktop_fhd' }
      ];

      for (const vp of viewports) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        await ctx.route('**/*.mp4', route => route.abort());
        const p = await ctx.newPage();
        await p.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(600);

        const overflow = await p.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = window.innerWidth;
          const hasOverflow = scrollW > clientW + 1;
          return { hasOverflow, scrollW, clientW, diff: scrollW - clientW };
        });

        if (overflow.hasOverflow) {
          findings.overflows.push({ viewport: vp.name, ...overflow });
          console.log(`  ⚠️ Overflow on ${vp.name}: +${overflow.diff}px`);
        }

        if (vp.width <= 412) {
          const smallTargets = await p.evaluate(() => {
            const bad = [];
            document.querySelectorAll('button, a, select').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                bad.push({
                  tag: el.tagName,
                  id: el.id,
                  class: el.className,
                  text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 20),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height)
                });
              }
            });
            return bad;
          });
          if (smallTargets.length > 0) {
            findings.sub44pxTargets.push({ viewport: vp.name, count: smallTargets.length, sample: smallTargets.slice(0, 8) });
          }
        }

        await p.screenshot({ path: path.join(EVIDENCE_DIR, `flow_p_${vp.name}_home.png`) });
        await ctx.close();
      }
    }

    // -------------------------------------------------------------------------
    // 4. FLOW Q: ACCESSIBILITY (WCAG 2.1 AA)
    // -------------------------------------------------------------------------
    console.log('4. Flow Q Accessibility Audit...');
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.route('**/*.mp4', route => route.abort());
      const p = await ctx.newPage();
      await p.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(800);

      findings.a11y = await p.evaluate(() => {
        const issues = [];
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim());
        if (h1s.length === 0) issues.push({ rule: 'WCAG 1.3.1', severity: 'P1', message: 'Missing <h1>' });
        if (h1s.length > 1) issues.push({ rule: 'WCAG 1.3.1', severity: 'P2', message: `Multiple <h1> (${h1s.length})` });

        // Unlabeled buttons
        const badBtns = [];
        document.querySelectorAll('button').forEach(btn => {
          const txt = (btn.innerText || '').trim();
          const aria = btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby');
          if (!txt && !aria) {
            badBtns.push({ id: btn.id, class: btn.className, html: btn.innerHTML.slice(0, 25) });
          }
        });
        if (badBtns.length > 0) {
          issues.push({ rule: 'WCAG 4.1.2', severity: 'P1', message: `${badBtns.length} icon-only buttons missing aria-label`, sample: badBtns.slice(0, 5) });
        }

        // Unlabeled inputs
        const badInputs = [];
        document.querySelectorAll('input, select, textarea').forEach(inp => {
          if (inp.type === 'hidden') return;
          const id = inp.id;
          const label = id && document.querySelector(`label[for="${id}"]`);
          const aria = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
          if (!label && !aria) {
            badInputs.push({ tag: inp.tagName, id: inp.id, type: inp.type, placeholder: inp.placeholder });
          }
        });
        if (badInputs.length > 0) {
          issues.push({ rule: 'WCAG 4.1.2', severity: 'P1', message: `${badInputs.length} form controls missing explicit label or aria-label`, sample: badInputs.slice(0, 5) });
        }

        return { h1s, issues };
      });
      await ctx.close();
    }

    // -------------------------------------------------------------------------
    // 5. FLOW S, T, U: TRUST, PERFORMANCE, SECURITY
    // -------------------------------------------------------------------------
    console.log('5. Flow S, T & U Trust, Performance & Security...');
    {
      const ctx = await browser.newContext();
      await ctx.route('**/*.mp4', route => route.abort());
      const p = await ctx.newPage();
      await p.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

      findings.trust = await p.evaluate(() => {
        const text = document.body.innerText;
        return {
          directConnect: /zero middleman|no middleman|direct connect/i.test(text),
          verifiedBadges: /verified|vetted|trusted/i.test(text),
          freeForCustomers: /100% free|free for customers/i.test(text),
          statesCoveredText: text.includes('36 Covered') || text.includes('36 States')
        };
      });

      findings.security = await p.evaluate(() => {
        const leaked = [];
        ['PAYSTACK_SECRET_KEY', 'RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CLOUDFLARE_API_TOKEN'].forEach(k => {
          if (window[k] || (window.__ENV && window.__ENV[k])) leaked.push(k);
        });
        return { leaked, safe: leaked.length === 0 };
      });

      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  const finalPath = path.join(EVIDENCE_DIR, 'comprehensive_audit_findings.json');
  fs.writeFileSync(finalPath, JSON.stringify(findings, null, 2));
  console.log(`✅ Telemetry & screenshots captured! Findings saved to: ${finalPath}`);
}

run();
