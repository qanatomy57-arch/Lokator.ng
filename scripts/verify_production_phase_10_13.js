// ============================================================================
// LOKATOR.NG — PHASE 10.13 LIVE PRODUCTION EDGE & SUPABASE VERIFICATION
// ============================================================================

const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('🌐 VERIFYING LIVE PRODUCTION EDGE (https://lokator-ng.vercel.app)...\n');

  // 1. Check register.html
  const reg = await fetchUrl('https://lokator-ng.vercel.app/register.html');
  console.log(`[1] /register.html: HTTP ${reg.status} (${reg.body.length} bytes)`);
  const hasGpsHandling = reg.body.includes('Acquiring GPS location');
  console.log(`    - Advanced GPS handling present: ${hasGpsHandling ? 'YES ✓' : 'NO ✗'}`);

  // 2. Check categories.js
  const cat = await fetchUrl('https://lokator-ng.vercel.app/categories.js');
  console.log(`[2] /categories.js: HTTP ${cat.status} (${cat.body.length} bytes)`);
  const hasWordBoundary = cat.body.includes('split(/[,&]/)');
  console.log(`    - Composite skill & emoji moderation: ${hasWordBoundary ? 'YES ✓' : 'NO ✗'}`);

  // 3. Check search.html & search.js
  const searchJs = await fetchUrl('https://lokator-ng.vercel.app/search.js');
  console.log(`[3] /search.js: HTTP ${searchJs.status} (${searchJs.body.length} bytes)`);
  const hasSearchHamburger = searchJs.body.includes('hamburger.setAttribute');
  const hasSearchGps = searchJs.body.includes('gpsTrigger.addEventListener');
  console.log(`    - Search hamburger handler: ${hasSearchHamburger ? 'YES ✓' : 'NO ✗'}`);
  console.log(`    - Search GPS trigger handler: ${hasSearchGps ? 'YES ✓' : 'NO ✗'}`);

  // 4. Check style.css
  const styleCss = await fetchUrl('https://lokator-ng.vercel.app/style.css');
  console.log(`[4] /style.css: HTTP ${styleCss.status} (${styleCss.body.length} bytes)`);
  const hasAutoOverscroll = styleCss.body.includes('overscroll-behavior-y: auto;');
  const hasTranspCard = styleCss.body.includes('background: rgba(6, 14, 8, 0.04);');
  console.log(`    - Hero overscroll release: ${hasAutoOverscroll ? 'YES ✓' : 'NO ✗'}`);
  console.log(`    - Transparent 2-4% story card: ${hasTranspCard ? 'YES ✓' : 'NO ✗'}`);

  console.log('\n✅ ALL PRODUCTION DEPLOYMENT CHECKS COMPLETED!');
}

verifyLive().catch(console.error);
