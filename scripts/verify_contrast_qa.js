const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer(port = 8899) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let pathname = new URL(req.url, `http://localhost:${port}`).pathname;
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.join(ROOT, decodeURIComponent(pathname));
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not Found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const server = await startServer(8899);
  const BASE = 'http://localhost:8899';

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  try {
    const page = await context.newPage();

    // 1. Dashboard with auth
    await page.goto(`${BASE}/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const mock = {
        id: '1',
        name: 'Adebayo Okafor',
        trade: 'Electrician & Solar Installer',
        phone: '+2348012345678',
        subscription_tier: 'PRO',
        monthly_contacts_used: 0,
        monthly_contacts_limit: 100
      };
      localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({ user: { id: '1' }, provider: mock }));
      localStorage.setItem('lokator_provider_profile', JSON.stringify(mock));
    });

    await page.goto(`${BASE}/dashboard.html#subscription`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Switch to subscription tab explicitly
    await page.evaluate(() => {
      document.querySelectorAll('.dash-tab-panel').forEach(p => p.classList.remove('active'));
      const subPanel = document.getElementById('tab-subscription');
      if (subPanel) {
        subPanel.classList.add('active');
      }
      if (typeof window.switchTab === 'function') {
        try { window.switchTab('subscription'); } catch(e) {}
      }
    });
    await page.waitForTimeout(500);

    const outputDir = path.resolve(__dirname, 'visual_evidence/contrast_fix');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Scroll to principles banner cards specifically
    await page.evaluate(() => {
      const cards = document.querySelectorAll('strong');
      for (const s of cards) {
        if (s.textContent.includes('0% Commission')) {
          s.scrollIntoView({ block: 'center' });
          break;
        }
      }
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, 'dashboard_principles_cards.png') });
    console.log('✅ Captured dashboard_principles_cards.png');

    // Scroll to trust center verification notices
    await page.evaluate(() => {
      const el = document.getElementById('dash-ver-pending-notice');
      if (el) {
        el.style.display = 'block';
        el.scrollIntoView({ block: 'start' });
      }
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, 'dashboard_trust_center_contrast.png') });
    console.log('✅ Captured dashboard_trust_center_contrast.png');

  } catch (err) {
    console.error('Error during QA:', err);
  } finally {
    await browser.close();
    server.close();
  }
})();
