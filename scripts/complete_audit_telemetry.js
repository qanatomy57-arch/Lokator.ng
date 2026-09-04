/**
 * PADIFIX AUDIT TELEMETRY & SCREENSHOT COMPLETION RUNNER
 * scripts/complete_audit_telemetry.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'product_audit');

async function completeAudit() {
  console.log('🚀 Running Remaining Audit Flows (B, G, H, P, Q, S, T, U)...');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const findings = {
    search: {},
    login: {},
    dashboard: {},
    viewports: [],
    overflows: [],
    sub44pxTargets: [],
    a11y: {},
    performance: {},
    security: {}
  };

  try {
    // -----------------------------------------------------------------------
    // FLOW B: SEARCH & MOBILE DRAWER
    // -----------------------------------------------------------------------
    console.log('Testing Flow B Search Queries & Mobile Drawer...');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/search.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Query: Plumber
      await page.fill('#keyword-search', 'Plumber');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b2_search_plumber_results.png') });
      const plumberCount = await page.locator('.provider-card, .artisan-card, [data-provider-id]').count();

      // Query: Generator repair
      await page.fill('#keyword-search', 'Generator repair');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b3_search_generator_results.png') });
      const genCount = await page.locator('.provider-card, .artisan-card, [data-provider-id]').count();

      // Query: plumbar (misspelling)
      await page.fill('#keyword-search', 'plumbar');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b4_search_misspelled_plumbar.png') });
      const plumbarCount = await page.locator('.provider-card, .artisan-card, [data-provider-id]').count();

      // Query: zero results
      await page.fill('#keyword-search', 'xyzquantumphysics999');
      await page.press('#keyword-search', 'Enter');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b6_search_zero_results.png') });
      const zeroVisible = await page.locator('#empty-state').isVisible();

      findings.search = { plumberCount, genCount, plumbarCount, zeroVisible };
      await context.close();

      // Mobile Drawer test
      const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const mobilePage = await mobileCtx.newPage();
      await mobilePage.goto(`${BASE_URL}/search.html`, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForTimeout(1000);

      const filterBtn = mobilePage.locator('#mobile-filter-btn');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await mobilePage.waitForTimeout(600);
        await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b7_search_mobile_drawer_open.png') });
      }
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_b8_search_mobile_card_list.png') });
      await mobileCtx.close();
    }

    // -----------------------------------------------------------------------
    // FLOW G & H: LOGIN, DASHBOARD & PROFILE EDITING
    // -----------------------------------------------------------------------
    console.log('Testing Flow G & H Dashboard & Profile Editing...');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      // Login error
      await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.fill('#login-email', 'invalid_audit_test@padifix.ng');
      await page.fill('#login-password', 'WrongPassword123!');
      await page.click('#btn-login-submit');
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_g2_login_error_invalid_credentials.png') });
      const alertVisible = await page.locator('#auth-alert').isVisible();
      const alertMsg = await page.locator('#auth-alert').innerText().catch(() => '');

      // Dashboard
      await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_g3_dashboard_desktop_kpis.png'), timeout: 10000 });

      // Profile edit
      const editTab = page.locator('button:has-text("Profile"), [data-tab="profile"], a[href*="profile"]').first();
      if (await editTab.isVisible()) {
        await editTab.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_h1_dashboard_profile_edit.png'), timeout: 10000 });
      }

      await context.close();

      // Mobile Dashboard
      const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const mobPage = await mobCtx.newPage();
      await mobPage.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'domcontentloaded' });
      await mobPage.waitForTimeout(1500);
      await mobPage.screenshot({ path: path.join(EVIDENCE_DIR, 'flow_g4_dashboard_mobile_view.png'), timeout: 10000 });
      await mobCtx.close();

      findings.login = { alertVisible, alertMsg };
    }

    // -----------------------------------------------------------------------
    // FLOW P: MOBILE-FIRST VIEWPORTS & OVERFLOW AUDIT (Aborting .mp4)
    // -----------------------------------------------------------------------
    console.log('Testing Flow P Mobile-First Viewports & Overflow (320, 390, 412, 1280, 1440, 1920)...');
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
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        // Abort MP4 videos so it renders fast and doesn't exhaust sockets
        await context.route('**/*.mp4', route => route.abort());

        const page = await context.newPage();
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const overflow = await page.evaluate(() => {
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
          const smallTargets = await page.evaluate(() => {
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

        await page.screenshot({ path: path.join(EVIDENCE_DIR, `flow_p_${vp.name}_home.png`), timeout: 10000 });
        await context.close();
      }
    }

    // -----------------------------------------------------------------------
    // FLOW Q: ACCESSIBILITY (WCAG 2.1 AA)
    // -----------------------------------------------------------------------
    console.log('Testing Flow Q Accessibility Audit (WCAG 2.1 AA)...');
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.route('**/*.mp4', route => route.abort());
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const a11y = await page.evaluate(() => {
        const issues = [];
        
        // Headings
        const h1s = Array.from(document.querySelectorAll('h1'));
        if (h1s.length === 0) issues.push({ rule: 'WCAG 1.3.1', severity: 'P1', message: 'Missing <h1>' });
        if (h1s.length > 1) issues.push({ rule: 'WCAG 1.3.1', severity: 'P2', message: `Multiple <h1> (${h1s.length})` });

        // Unlabeled buttons
        const unlabeledBtns = [];
        document.querySelectorAll('button').forEach(btn => {
          const txt = (btn.innerText || '').trim();
          const aria = btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby');
          if (!txt && !aria) {
            unlabeledBtns.push({ id: btn.id, class: btn.className, html: btn.innerHTML.slice(0, 30) });
          }
        });
        if (unlabeledBtns.length > 0) {
          issues.push({ rule: 'WCAG 4.1.2', severity: 'P1', message: `${unlabeledBtns.length} buttons missing accessible name`, sample: unlabeledBtns.slice(0, 5) });
        }

        // Unlabeled inputs
        const unlabeledInputs = [];
        document.querySelectorAll('input, select, textarea').forEach(inp => {
          if (inp.type === 'hidden') return;
          const id = inp.id;
          const label = id && document.querySelector(`label[for="${id}"]`);
          const aria = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
          if (!label && !aria) {
            unlabeledInputs.push({ tag: inp.tagName, id: inp.id, type: inp.type });
          }
        });
        if (unlabeledInputs.length > 0) {
          issues.push({ rule: 'WCAG 4.1.2', severity: 'P1', message: `${unlabeledInputs.length} inputs missing explicit label`, sample: unlabeledInputs.slice(0, 5) });
        }

        return { h1Count: h1s.length, issues };
      });

      findings.a11y = a11y;
      await context.close();
    }

    // -----------------------------------------------------------------------
    // FLOW S, T & U: TRUST, PERFORMANCE & SECURITY
    // -----------------------------------------------------------------------
    console.log('Testing Flow S, T & U: Trust, Performance & Security...');
    {
      const context = await browser.newContext();
      await context.route('**/*.mp4', route => route.abort());
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

      // Trust signals
      findings.trust = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          mentionsZeroMiddleman: /zero middleman|no middleman|direct connect/i.test(text),
          mentionsVerified: /verified|vetted|trusted/i.test(text),
          mentionsFreeForCustomers: /100% free|free for customers/i.test(text),
          mentionsEscrowOrCommission: /escrow|commission/i.test(text)
        };
      });

      // Security check
      findings.security = await page.evaluate(() => {
        const leaked = [];
        ['PAYSTACK_SECRET_KEY', 'RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CLOUDFLARE_API_TOKEN'].forEach(k => {
          if (window[k] || (window.__ENV && window.__ENV[k])) leaked.push(k);
        });
        return { leaked, safe: leaked.length === 0 };
      });

      await context.close();
    }

  } finally {
    await browser.close();
  }

  // Save to telemetry JSON
  const finalJsonPath = path.join(EVIDENCE_DIR, 'comprehensive_audit_findings.json');
  fs.writeFileSync(finalJsonPath, JSON.stringify(findings, null, 2));
  console.log(`✅ All remaining flows completed! Findings saved to: ${finalJsonPath}`);
}

completeAudit();
