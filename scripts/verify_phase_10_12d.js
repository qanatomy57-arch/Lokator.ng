/**
 * LOKATOR.NG — PHASE 10.12D AUTOMATED TEST SUITE
 * AI PROVIDER BIO + PRICING ASSISTANCE VERIFICATION
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment dependencies in order
const { NigeriaLocations } = require('../locations.js');
global.NigeriaLocations = NigeriaLocations;
globalThis.NigeriaLocations = NigeriaLocations;

const { NigeriaPhone } = require('../phone-utils.js');
global.NigeriaPhone = NigeriaPhone;
globalThis.NigeriaPhone = NigeriaPhone;

const { NigeriaSearchLanguage } = require('../search-language.js');
global.NigeriaSearchLanguage = NigeriaSearchLanguage;
globalThis.NigeriaSearchLanguage = NigeriaSearchLanguage;

const { CategoryMap, MarketplaceTaxonomy, ServiceModerator } = require('../categories.js');
global.CategoryMap = CategoryMap;
globalThis.CategoryMap = CategoryMap;
global.ServiceModerator = ServiceModerator;
globalThis.ServiceModerator = ServiceModerator;

const { LokatorAIService } = require('../ai-service.js');
global.LokatorAIService = LokatorAIService;
globalThis.LokatorAIService = LokatorAIService;

require('../providers-data.js');

const { LokatorDB } = require('../supabase-client.js');
LokatorDB.phone = NigeriaPhone;
LokatorDB.locations = NigeriaLocations;
LokatorDB.searchLanguage = NigeriaSearchLanguage;
LokatorDB.ai = LokatorDB.aiService;

async function runPhase10_12DVerification() {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 LOKATOR.NG — PHASE 10.12D AI PROVIDER BIO & PRICING ASSISTANCE VERIFICATION');
  console.log('='.repeat(80) + '\n');

  let passedTests = 0;
  let failedTests = 0;

  function runTest(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests++;
    }
  }

  async function runAsyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests++;
    }
  }

  // --- GROUP 1: FACTUAL BIO GENERATION ---
  console.log('--- TEST GROUP 1: FACTUAL BIO GENERATION ---');

  runTest('Generate bio from valid provider facts (Electrician in Ughelli)', () => {
    const facts = {
      name: 'Adebayo Okafor',
      businessName: 'Adebayo Power & Solar',
      trade: 'Electrician',
      skills: ['House Wiring', 'Solar Installation', 'Electrical Repairs'],
      location: 'Ughelli, Ughelli North, Delta',
      locality: 'Ughelli',
      lga: 'Ughelli North',
      state: 'Delta',
      experienceYrs: 8
    };

    const res = LokatorAIService.generateBio(facts);
    assert.ok(res, 'Returns result object');
    assert.ok(res.bio && typeof res.bio === 'string', 'Bio is a string');
    assert.ok(res.bio.includes('electrician') || res.bio.includes('Electrician'), 'Mentions trade');
    assert.ok(res.bio.includes('Ughelli') || res.bio.includes('Delta'), 'Mentions location');
    assert.ok(res.bio.includes('8+') || res.bio.includes('8 years'), 'Accurately includes 8 years experience');
    assert.ok(res.service_summary && typeof res.service_summary === 'string');
    assert.ok(Array.isArray(res.suggested_tags));
    assert.ok(res.confidence === 'high');
  });

  runTest('Generate bio for Plumber with concise style variant', () => {
    const facts = {
      name: 'Emeka Musa',
      trade: 'Plumber',
      skills: ['Burst Pipe Repair', 'Borehole Installation'],
      city: 'Ikeja',
      state: 'Lagos',
      experienceYrs: 3
    };

    const res = LokatorAIService.generateBio(facts, { variant: 'concise' });
    assert.ok(res.bio.includes('Plumber') || res.bio.includes('plumber'));
    assert.ok(res.bio.includes('3+') || res.bio.includes('3 years'));
    assert.ok(res.bio.length < 350, 'Concise bio is under 350 characters');
  });

  runTest('Reject empty or insufficient facts (missing trade)', () => {
    assert.throws(() => {
      LokatorAIService.generateBio({});
    }, /Insufficient provider facts/);

    assert.throws(() => {
      LokatorAIService.generateBio({ name: 'John Doe' });
    }, /Insufficient provider facts/);
  });

  runTest('Generated bio conforms to mobile length constraints (<= 600 chars)', () => {
    const facts = {
      name: 'Michael Efe',
      trade: 'Cinematographer & Photographer',
      skills: ['Wedding Photography', 'Event Photography', 'Drone Piloting', 'Video Editing', 'Studio Portraits'],
      locality: 'Lekki Phase 1',
      lga: 'Eti-Osa',
      state: 'Lagos',
      experienceYrs: 10,
      responseTime: '~15 mins'
    };

    const res = LokatorAIService.generateBio(facts);
    assert.ok(res.bio.length <= 600, `Length ${res.bio.length} is <= 600`);
  });

  // --- GROUP 2: ANTI-HALLUCINATION ENFORCEMENT ---
  console.log('\n--- TEST GROUP 2: ANTI-HALLUCINATION ENFORCEMENT ---');

  runTest('Strictly prohibits inventing years of experience when 3 years supplied', () => {
    const facts = {
      trade: 'Plumber',
      experienceYrs: 3,
      city: 'Ikeja',
      state: 'Lagos'
    };
    const res = LokatorAIService.generateBio(facts);
    assert.ok(!res.bio.includes('10 years'), 'Must not claim 10 years');
    assert.ok(!res.bio.includes('decade'), 'Must not claim decade');
    assert.ok(res.bio.includes('3+') || res.bio.includes('3 years'), 'Must state supplied 3 years');
  });

  runTest('Strictly prohibits inventing experience number when 0/null supplied', () => {
    const facts = {
      trade: 'Painter',
      skills: ['Wall Painting', 'POP Installation'],
      state: 'Oyo'
    };
    const res = LokatorAIService.generateBio(facts);
    assert.ok(!/\b\d+\s+years\s+of\s+experience/i.test(res.bio), 'Must not invent numeric years when unsupplied');
  });

  runTest('Strictly prohibits fabricating unsupplied certifications', () => {
    const unverifiedText = 'Licensed COREN certified engineer with ISO certified warranty.';
    const validation = LokatorAIService.validateOutput(unverifiedText, { trade: 'Electrician' });
    assert.ok(!validation.sanitizedText.includes('COREN certified'), 'Unsupplied COREN cert should be sanitized');
    assert.ok(!validation.sanitizedText.includes('ISO certified'), 'Unsupplied ISO cert should be sanitized');
  });

  runTest('Strictly sanitizes fabricated superlatives and fake customer counts', () => {
    const claimText = 'Professional plumber served over 5000 customers and rated #1 in Nigeria.';
    const validation = LokatorAIService.validateOutput(claimText, { trade: 'Plumber' });
    assert.ok(!validation.sanitizedText.includes('served over 5000 customers'));
    assert.ok(!validation.sanitizedText.includes('#1 in Nigeria'));
  });

  // --- GROUP 3: PRICING GUIDANCE ENGINE ---
  console.log('\n--- TEST GROUP 3: PRICING GUIDANCE ENGINE ---');

  runTest('Provides grounded pricing guidance for Electrician', () => {
    const res = LokatorAIService.getPricingGuidance({
      trade: 'Electrician',
      startingPrice: '₦20,000',
      state: 'Delta',
      lga: 'Ughelli North'
    });

    assert.ok(res.is_estimate === true, 'Clearly flagged as estimate');
    assert.ok(res.disclaimer.includes('AI estimate / guidance'), 'Contains mandatory disclaimer');
    assert.ok(res.suggested_range && typeof res.suggested_range === 'string', 'Contains suggested range');
    assert.ok(res.inspection_fee_range && typeof res.inspection_fee_range === 'string', 'Contains inspection range');
    assert.ok(Array.isArray(res.pricing_factors) && res.pricing_factors.length >= 3, 'Contains pricing factors');
    assert.ok(Array.isArray(res.key_questions) && res.key_questions.length >= 1, 'Contains key questions');
  });

  runTest('Differentiates provider-entered price from AI estimate', () => {
    const res = LokatorAIService.getPricingGuidance({
      trade: 'Plumber',
      startingPrice: '₦5,000 / leak repair',
      state: 'Lagos'
    });

    assert.strictEqual(res.provider_entered_price, '₦5,000 / leak repair');
    assert.ok(res.suggested_range !== res.provider_entered_price);
    assert.ok(res.disclaimer.includes('not a platform-set price'));
  });

  runTest('Adapts pricing factors when materials are included', () => {
    const res = LokatorAIService.getPricingGuidance({
      trade: 'AC Technician',
      includes_materials: true,
      state: 'Abuja'
    });

    assert.ok(res.pricing_factors.some(f => f.toLowerCase().includes('materials and replacement parts included')));
  });

  // --- GROUP 4: PRIVACY & PII SANITIZATION ---
  console.log('\n--- TEST GROUP 4: PRIVACY & PII SANITIZATION ---');

  runTest('Strips phone, whatsapp, password, and tokens from facts payload', () => {
    const dirtyFacts = {
      name: 'John Doe',
      trade: 'Carpenter',
      phone: '+2348012345678',
      whatsappNumber: '08012345678',
      password: 'super_secret_password',
      token: 'jwt_secret_token',
      telemetry_raw: { ip: '1.2.3.4' }
    };

    const clean = LokatorAIService.sanitizeInputs(dirtyFacts);
    assert.strictEqual(clean.phone, undefined, 'phone must be stripped');
    assert.strictEqual(clean.whatsappNumber, undefined, 'whatsappNumber must be stripped');
    assert.strictEqual(clean.password, undefined, 'password must be stripped');
    assert.strictEqual(clean.token, undefined, 'token must be stripped');
    assert.strictEqual(clean.trade, 'Carpenter');
    assert.strictEqual(clean.name, 'John Doe');
  });

  // --- GROUP 5: CONTENT MODERATION INTEGRATION ---
  console.log('\n--- TEST GROUP 5: CONTENT MODERATION INTEGRATION ---');

  runTest('Content moderation blocks illegal/prohibited trade generation', () => {
    const illicitText = 'Master scam agent offering fake documents in Lagos.';
    const validation = LokatorAIService.validateOutput(illicitText, { trade: 'Agent' });
    assert.strictEqual(validation.valid, false, 'Should be flagged as invalid');
    assert.ok(validation.errors.some(e => e.includes('Content moderation violation')));
  });

  // --- GROUP 6: DATA LAYER & LOKATORDB.AI INTEGRATION ---
  console.log('\n--- TEST GROUP 6: DATA LAYER & LOKATORDB.AI INTEGRATION ---');

  await runAsyncTest('LokatorDB.ai.generateBio returns structured draft', async () => {
    const res = await LokatorDB.ai.generateBio({
      name: 'Chidinma Ikenna',
      trade: 'Nail Technician',
      skills: ['Sculpted Acrylic Nails', 'Luxury Pedicure'],
      state: 'Lagos',
      locality: 'Lekki Phase 1',
      experienceYrs: 6
    });

    assert.ok(res && res.success === true, 'Returns success');
    assert.ok(res.data && res.data.bio, 'Returns bio text');
    assert.ok(res.data.bio.includes('Nail Technician') || res.data.bio.includes('nail technician'));
  });

  await runAsyncTest('LokatorDB.ai.getPricingGuidance returns pricing advice', async () => {
    const res = await LokatorDB.ai.getPricingGuidance({
      trade: 'Tailor',
      startingPrice: '₦15,000',
      state: 'Lagos'
    });

    assert.ok(res && res.success === true);
    assert.ok(res.data && res.data.suggested_range);
    assert.ok(res.data.is_estimate === true);
  });

  // --- GROUP 7: HTTP API ENDPOINTS & AUTH GATING ---
  console.log('\n--- TEST GROUP 7: HTTP API ENDPOINTS & AUTH GATING ---');

  function makeHttpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });
      req.on('error', reject);
      if (postData) req.write(JSON.stringify(postData));
      req.end();
    });
  }

  await runAsyncTest('GET /api/ai/health returns 200 OK', async () => {
    const res = await makeHttpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/health',
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.status, 'healthy');
  });

  await runAsyncTest('POST /api/ai/generate-bio without auth returns 401 Unauthorized', async () => {
    const res = await makeHttpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/generate-bio',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { trade: 'Electrician' });

    assert.strictEqual(res.status, 401);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Unauthorized'));
  });

  await runAsyncTest('POST /api/ai/generate-bio with valid Bearer token returns 200 OK', async () => {
    const res = await makeHttpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/generate-bio',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-provider-session-token'
      }
    }, {
      name: 'Grace Alabi',
      trade: 'Cleaner',
      skills: ['Deep Cleaning', 'Fumigation'],
      state: 'Lagos',
      locality: 'Victoria Island',
      experienceYrs: 5
    });

    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.bio.includes('cleaner') || json.data.bio.includes('Cleaner'));
  });

  await runAsyncTest('POST /api/ai/pricing-guidance with Bearer token returns 200 OK', async () => {
    const res = await makeHttpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/pricing-guidance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-provider-session-token'
      }
    }, {
      trade: 'Solar Installer',
      state: 'Lagos'
    });

    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.is_estimate === true);
  });

  // --- GROUP 8: PWA SHELL & SCRIPT TAG INTEGRITY ---
  console.log('\n--- TEST GROUP 8: PWA SHELL & SCRIPT TAG INTEGRITY ---');

  const swContent = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  runTest('sw.js includes /ai-service.js in SHELL_ASSETS', () => {
    assert.ok(swContent.includes("'/ai-service.js'"), 'sw.js must pre-cache /ai-service.js');
  });

  const htmlFiles = ['index.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'login.html'];
  htmlFiles.forEach(hf => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '..', hf), 'utf8');
    runTest(`${hf} includes <script src="ai-service.js"></script>`, () => {
      assert.ok(htmlContent.includes('ai-service.js'), `${hf} must include ai-service.js script tag`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('='.repeat(80) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase10_12DVerification().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
