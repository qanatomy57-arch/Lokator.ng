/**
 * LOKATOR.NG — PHASE 10.12B AUTOMATED VERIFICATION SUITE
 * Test Nigerian Phone Normalization, Canonical WhatsApp URLs, and Telephone Links
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load environment and modules
const { NigeriaPhone } = require('../phone-utils.js');
const { NigeriaLocations } = require('../locations.js');
global.NigeriaLocations = NigeriaLocations;
global.NigeriaPhone = NigeriaPhone;

const { CategoryMap, MarketplaceTaxonomy } = require('../categories.js');
global.CategoryMap = CategoryMap;
global.MarketplaceTaxonomy = MarketplaceTaxonomy;

const { PROVIDERS_DATA } = require('../providers-data.js');
global.PROVIDERS_DATA = PROVIDERS_DATA;

const { LokatorDB } = require('../supabase-client.js');
global.LokatorDB = LokatorDB;

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n' + '='.repeat(80));
  console.log('🇳🇬 LOKATOR.NG — PHASE 10.12B PHONE & WHATSAPP NORMALIZATION VERIFICATION');
  console.log('='.repeat(80));

  // --- GROUP 1: NIGERIAN PHONE NORMALIZATION ---
  console.log('\n--- TEST GROUP 1: NIGERIAN MOBILE NORMALIZATION ---');

  test('Normalize standard 11-digit 080... format', () => {
    const res = NigeriaPhone.normalize('08012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
    assert.strictEqual(res.national, '08012345678');
    assert.strictEqual(res.international, '+2348012345678');
    assert.strictEqual(res.telUri, 'tel:+2348012345678');
    assert.strictEqual(res.display, '0801 234 5678');
  });

  test('Normalize standard 11-digit 081... format', () => {
    const res = NigeriaPhone.normalize('08112345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348112345678');
    assert.strictEqual(res.international, '+2348112345678');
  });

  test('Normalize standard 11-digit 070... format', () => {
    const res = NigeriaPhone.normalize('07012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2347012345678');
    assert.strictEqual(res.international, '+2347012345678');
  });

  test('Normalize standard 11-digit 071... format', () => {
    const res = NigeriaPhone.normalize('07112345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2347112345678');
    assert.strictEqual(res.international, '+2347112345678');
  });

  test('Normalize standard 11-digit 090... format', () => {
    const res = NigeriaPhone.normalize('09012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2349012345678');
    assert.strictEqual(res.international, '+2349012345678');
  });

  test('Normalize standard 11-digit 091... format', () => {
    const res = NigeriaPhone.normalize('09112345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2349112345678');
    assert.strictEqual(res.international, '+2349112345678');
  });

  test('Normalize international +2348012345678 format', () => {
    const res = NigeriaPhone.normalize('+2348012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
    assert.strictEqual(res.national, '08012345678');
    assert.strictEqual(res.international, '+2348012345678');
  });

  test('Normalize international 2348012345678 format without plus', () => {
    const res = NigeriaPhone.normalize('2348012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
    assert.strictEqual(res.international, '+2348012345678');
  });

  test('Normalize 10-digit number without leading 0 (8012345678)', () => {
    const res = NigeriaPhone.normalize('8012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
    assert.strictEqual(res.national, '08012345678');
  });

  test('Normalize spaced input (080 1234 5678)', () => {
    const res = NigeriaPhone.normalize('080 1234 5678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
  });

  test('Normalize hyphenated input (080-1234-5678)', () => {
    const res = NigeriaPhone.normalize('080-1234-5678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
  });

  test('Normalize parenthesized input ((080) 1234 5678)', () => {
    const res = NigeriaPhone.normalize('(080) 1234 5678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
  });

  test('Safely normalize double prefix (+23408012345678)', () => {
    const res = NigeriaPhone.normalize('+23408012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
    assert.strictEqual(res.international, '+2348012345678');
  });

  test('Safely normalize double prefix (23408012345678)', () => {
    const res = NigeriaPhone.normalize('23408012345678');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.canonical, '2348012345678');
  });

  // --- GROUP 2: INVALID INPUT HANDLING ---
  console.log('\n--- TEST GROUP 2: INVALID INPUT REJECTION ---');

  test('Reject empty string', () => {
    const res = NigeriaPhone.normalize('');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.canonical, null);
  });

  test('Reject null input', () => {
    const res = NigeriaPhone.normalize(null);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.canonical, null);
  });

  test('Reject undefined input', () => {
    const res = NigeriaPhone.normalize(undefined);
    assert.strictEqual(res.valid, false);
  });

  test('Reject short input "123"', () => {
    const res = NigeriaPhone.normalize('123');
    assert.strictEqual(res.valid, false);
  });

  test('Reject partial number "080123"', () => {
    const res = NigeriaPhone.normalize('080123');
    assert.strictEqual(res.valid, false);
  });

  test('Reject non-numeric input "abcdefghijk"', () => {
    const res = NigeriaPhone.normalize('abcdefghijk');
    assert.strictEqual(res.valid, false);
  });

  test('Reject invalid mobile prefix (02012345678)', () => {
    const res = NigeriaPhone.normalize('02012345678');
    assert.strictEqual(res.valid, false);
  });

  test('NigeriaPhone.isValid returns true for valid, false for invalid', () => {
    assert.strictEqual(NigeriaPhone.isValid('08034567890'), true);
    assert.strictEqual(NigeriaPhone.isValid('+2348034567890'), true);
    assert.strictEqual(NigeriaPhone.isValid('invalid-phone'), false);
    assert.strictEqual(NigeriaPhone.isValid(''), false);
  });

  // --- GROUP 3: WHATSAPP URL GENERATION & CONTEXT ---
  console.log('\n--- TEST GROUP 3: WHATSAPP URL GENERATION & CONTEXT ---');

  test('Generate canonical WhatsApp URL with no double prefix', () => {
    const url = NigeriaPhone.buildWhatsAppUrl('+2348034567890');
    assert.ok(url.startsWith('https://wa.me/2348034567890?text='));
    assert.ok(!url.includes('234234'));
    assert.ok(!url.includes('+234'));
  });

  test('Generate contextual message with Provider Name, Service, and Location', () => {
    const provider = {
      name: 'Sunday Okafor',
      trade: 'Plumber',
      phone: '08034567890',
      area: 'Ikeja, Lagos'
    };
    const url = NigeriaPhone.buildWhatsAppUrl(provider);
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('Hello Sunday Okafor'));
    assert.ok(decoded.includes('Plumber'));
    assert.ok(decoded.includes('Ikeja, Lagos'));
    assert.ok(!decoded.includes('undefined'));
    assert.ok(!decoded.includes('null'));
    assert.ok(!decoded.includes('[object Object]'));
  });

  test('Generate graceful message when location is unavailable', () => {
    const provider = {
      name: 'Fatima Garba',
      trade: 'Tailor',
      phone: '08055667788',
      area: null
    };
    const url = NigeriaPhone.buildWhatsAppUrl(provider);
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('Hello Fatima Garba'));
    assert.ok(decoded.includes('Tailor'));
    assert.ok(!decoded.includes('around'));
    assert.ok(!decoded.includes('undefined'));
    assert.ok(!decoded.includes('null'));
  });

  test('Handle custom prefilled message override', () => {
    const url = NigeriaPhone.buildWhatsAppUrl('08034567890', {
      customMessage: 'Hello, need quick home wiring inspection.'
    });
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('Hello, need quick home wiring inspection.'));
  });

  test('Return empty string for invalid phone when generating WhatsApp URL', () => {
    const url = NigeriaPhone.buildWhatsAppUrl('invalid_phone');
    assert.strictEqual(url, '');
  });

  // --- GROUP 4: TELEPHONE LINK GENERATION ---
  console.log('\n--- TEST GROUP 4: TELEPHONE LINK GENERATION ---');

  test('Generate valid RFC 3966 tel: URI', () => {
    const tel = NigeriaPhone.buildTelUrl('08012345678');
    assert.strictEqual(tel, 'tel:+2348012345678');
  });

  test('Generate tel: URI from provider object', () => {
    const tel = NigeriaPhone.buildTelUrl({ phone: '08098765432' });
    assert.strictEqual(tel, 'tel:+2348098765432');
  });

  test('Return empty string for invalid phone when generating tel: URI', () => {
    const tel = NigeriaPhone.buildTelUrl('invalid');
    assert.strictEqual(tel, '');
  });

  // --- GROUP 5: DATA LAYER & REGISTRATION INTEGRATION ---
  console.log('\n--- TEST GROUP 5: DATA LAYER & REGISTRATION INTEGRATION ---');

  await runAsyncTest('LokatorDB.getProviders sanitizes phone & whatsapp fields', async () => {
    const res = await LokatorDB.getProviders({ limit: 5 });
    assert.ok(res.data && res.data.length > 0);
    res.data.forEach(p => {
      if (p.phone) {
        assert.ok(p.phone.startsWith('+234'), `Provider phone ${p.phone} should start with +234`);
      }
      if (p.whatsappNumber) {
        assert.ok(p.whatsappNumber.startsWith('234'), `Provider whatsappNumber ${p.whatsappNumber} should start with 234`);
      }
    });
  });

  await runAsyncTest('LokatorDB.registerProvider normalizes 080... phone input canonically', async () => {
    const regPayload = {
      fname: 'Emeka',
      lname: 'Nnamdi',
      phone: '08099887766',
      email: `emeka_test_${Date.now()}@lokator.ng`,
      service: 'Electrician',
      trade: 'Licensed Electrician',
      skills: ['Electrician', 'Wiring'],
      state: 'Lagos',
      lga: 'Surulere',
      locality: 'Aguda',
      city: 'Surulere',
      area: 'Aguda, Surulere',
      location: 'Aguda, Surulere, Lagos',
      experience: '5',
      bio: 'Expert electrician in Surulere'
    };

    const regRes = await LokatorDB.registerProvider(regPayload);
    assert.ok(regRes, 'Provider created');
    assert.strictEqual(regRes.phone, '+2348099887766');
    assert.strictEqual(regRes.whatsappNumber, '2348099887766');
  });

  // --- GROUP 6: PWA SHELL & SCRIPT TAG INTEGRITY ---
  console.log('\n--- TEST GROUP 6: PWA SHELL & SCRIPT TAG INTEGRITY ---');

  test('sw.js includes /phone-utils.js in SHELL_ASSETS pre-cache list', () => {
    const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
    assert.ok(swContent.includes("'/phone-utils.js'"), 'sw.js must contain /phone-utils.js');
  });

  const htmlFiles = ['index.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'login.html'];
  htmlFiles.forEach(file => {
    test(`${file} includes <script src="phone-utils.js"></script>`, () => {
      const html = fs.readFileSync(path.join(__dirname, `../${file}`), 'utf8');
      assert.ok(html.includes('src="phone-utils.js"'), `${file} must include phone-utils.js script tag`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
