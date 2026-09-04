/**
 * Phase 013 Production Asset & Endpoint Prober
 * scripts/probe_production_endpoints.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const PROD_BASE = 'https://padifix.vercel.app';

const ENDPOINTS_TO_CHECK = [
  '/',
  '/index.html',
  '/search.html',
  '/profile.html?id=1',
  '/register.html',
  '/dashboard.html',
  '/manifest.json',
  '/sw.js',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/style.css?v=11.00',
  '/search.css?v=11.00',
  '/pwa.css?v=11.00',
  '/app.js?v=11.00',
  '/search.js?v=11.00',
  '/profile.js?v=11.00',
  '/dashboard.js?v=11.00',
  '/locations.js?v=11.00',
  '/monetization-config.js?v=11.00',
  '/hero/01_master_marketplace.mp4',
  '/icons/padifix-mark.png',
  '/icons/padifix-logo-dark.png',
  '/robots.txt',
  '/sitemap.xml'
];

function probeUrl(targetUrl) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'PadiFix-Phase013-Audit/1.0'
      }
    }, (res) => {
      resolve({
        url: targetUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers,
        contentType: res.headers['content-type'] || 'unknown',
        contentLength: res.headers['content-length'] || 'unknown',
        cacheControl: res.headers['cache-control'] || 'none',
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        url: targetUrl,
        statusCode: 0,
        statusMessage: err.message,
        headers: {},
        contentType: 'error',
        contentLength: '0',
        cacheControl: 'none',
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: targetUrl,
        statusCode: 408,
        statusMessage: 'Timeout',
        headers: {},
        contentType: 'timeout',
        contentLength: '0',
        cacheControl: 'none',
        success: false
      });
    });

    req.end();
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log(`🌐 PROBING PRODUCTION DEPLOYMENT: ${PROD_BASE}`);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const ep of ENDPOINTS_TO_CHECK) {
    const fullUrl = `${PROD_BASE}${ep}`;
    const res = await probeUrl(fullUrl);
    results.push(res);
    const icon = res.success ? '✅' : (res.statusCode === 404 ? '⚠️' : '❌');
    console.log(`${icon} [${res.statusCode || 'ERR'}] ${ep} (${res.contentType}, len: ${res.contentLength})`);
    if (res.success) passed++;
    else failed++;
  }

  console.log('='.repeat(80));
  console.log(`PROBE SUMMARY: ${passed} passed, ${failed} failed / missing out of ${ENDPOINTS_TO_CHECK.length}`);
  console.log('='.repeat(80));
  return { passed, failed, results };
}

main().catch(console.error);
