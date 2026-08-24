// ============================================================================
// LOKATOR.NG — PHASE 10.12 COMPREHENSIVE E2E VERIFICATION SCRIPT
// ============================================================================

const fs = require('fs');
const path = require('path');

async function runBattery() {
  console.log('\n========================================================');
  console.log('🚀 RUNNING PHASE 10.12 COMPREHENSIVE VERIFICATION');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, title, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // TEST 1: Check syntax and LokatorDB module loading
  console.log('👉 [1/6] Validating JS Module Architecture & LokatorDB Initialization...');
  try {
    const categoriesPath = path.join(__dirname, '..', 'categories.js');
    const supabaseClientPath = path.join(__dirname, '..', 'supabase-client.js');
    
    // Simulate browser environment
    global.window = global;
    global.document = {
      readyState: 'complete',
      getElementById: () => null,
      addEventListener: () => {}
    };

    require(categoriesPath);
    require(supabaseClientPath);

    assert(typeof global.LokatorDB !== 'undefined', 'LokatorDB is defined and exported globally without ReferenceError');
    assert(typeof global.escapeHtml === 'function', 'escapeHtml is defined globally as a security utility');
    assert(typeof global.ServiceModerator !== 'undefined', 'ServiceModerator is defined');
    assert(typeof global.LokatorDB.strategicPerformance !== 'undefined', 'LokatorDB.strategicPerformance is wired cleanly');
    assert(typeof global.LokatorDB.strategicOptimization !== 'undefined', 'LokatorDB.strategicOptimization is wired cleanly');
  } catch (err) {
    assert(false, 'LokatorDB initialization', err.stack);
  }

  // TEST 2: Content Moderation & Skills Validation
  console.log('\n👉 [2/6] Validating Content Moderation Engine...');
  try {
    const valid1 = global.ServiceModerator.validateSkill('Solar Panel Installation');
    assert(valid1.valid === true, 'Valid trade "Solar Panel Installation" allowed');

    const valid2 = global.ServiceModerator.validateSkill('⚡ Electrician');
    assert(valid2.valid === true, 'Valid trade with emoji "⚡ Electrician" allowed');

    const invalid1 = global.ServiceModerator.validateSkill('scam');
    assert(invalid1.valid === false && invalid1.blockedWord === 'scam', 'Disallowed keyword "scam" blocked');

    const invalid2 = global.ServiceModerator.validateSkill('hire killer');
    assert(invalid2.valid === false, 'Disallowed keyword "killer" blocked');

    const invalid3 = global.ServiceModerator.validateSkill('illegal weapons');
    assert(invalid3.valid === false, 'Disallowed keyword "weapons" blocked');

    const invalid4 = global.ServiceModerator.validateSkill('fake documents');
    assert(invalid4.valid === false, 'Disallowed keyword "fake document" blocked');
  } catch (err) {
    assert(false, 'Content moderation test', err.message);
  }

  // TEST 3: File & DOM Integrity Audits
  console.log('\n👉 [3/6] Validating DOM Integrity & UI Element Audits...');
  try {
    const registerHtml = fs.readFileSync(path.join(__dirname, '..', 'register.html'), 'utf8');
    const loginHtml = fs.readFileSync(path.join(__dirname, '..', 'login.html'), 'utf8');
    const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

    // Observation #0 Lead & Autocomplete check
    assert(registerHtml.includes('id="moderation-alert" role="alert" style="display: none;"'), 'register.html default state has style="display: none;" on #moderation-alert');
    assert(registerHtml.includes('leaflet.js') && registerHtml.includes('leaflet.css'), 'register.html includes Leaflet interactive map assets');
    assert(registerHtml.includes('id="interactive-reg-map"'), 'register.html contains interactive map container #interactive-reg-map');
    assert(registerHtml.includes('id="skills-autocomplete-dropdown"'), 'register.html contains live skills autocomplete dropdown');
    assert(registerHtml.includes('searchSkillMatches'), 'register.html contains real-time skill matching engine');

    // Section 2: Demo login removal check
    assert(!loginHtml.includes('OR ONE-CLICK DEMO LOGIN'), 'login.html has removed "OR ONE-CLICK DEMO LOGIN" header');
    assert(!loginHtml.includes('Adebayo Okafor'), 'login.html has removed Adebayo Okafor demo button');
    assert(!loginHtml.includes('Emeka Musa'), 'login.html has removed Emeka Musa demo button');
    assert(!loginHtml.includes('Chidinma Ikenna'), 'login.html has removed Chidinma Ikenna demo button');
    assert(loginHtml.includes('id="forgot-link"'), 'login.html retains clean forgot-password link');

    // Section 6 & 7: Hero nav, Desktop scrollbar & Hamburger menu check
    assert(styleCss.includes('.hero-timeline-nav') && styleCss.includes('right: 12px;'), 'style.css anchors hero dot navigation to right: 12px');
    assert(styleCss.includes('.hero-scroll-wrapper::-webkit-scrollbar'), 'style.css configures desktop hero scrollbar styling');
    assert(appJs.includes('setupContinuousScrollTracking'), 'app.js includes setupContinuousScrollTracking for real-time video/dot sync');
    assert(appJs.includes('setupDesktopWheelControl'), 'app.js includes setupDesktopWheelControl for desktop 9-scene scroll lock');
    assert(appJs.includes('hamburger.setAttribute'), 'app.js includes mobile hamburger menu toggle');
  } catch (err) {
    assert(false, 'DOM audit test', err.message);
  }

  // TEST 4: Live End-to-End Registration & Supabase Data Persistence
  console.log('\n👉 [4/6] Testing End-to-End Provider Registration Flow...');
  try {
    const testEmail = `test_artisan_${Date.now()}@lokator.ng`;
    const testPhone = '8019876543';
    const testData = {
      fname: 'Tarila',
      lname: 'Ebi',
      phone: testPhone,
      email: testEmail,
      service: 'Solar Installer',
      trade: 'Solar Installer & Electrician',
      skills: ['Solar Installer', 'Electrician'],
      location: 'Surulere, Lagos, Nigeria',
      experience: '5-10',
      bio: 'Master solar and inverter technician with 8 years verified field experience in Lagos.',
      lat: 6.5000,
      lng: 3.3585,
      avatarUrl: null
    };

    const registered = await global.LokatorDB.registerProvider(testData);
    console.log('    [DEBUG registered]:', JSON.stringify(registered));
    assert(Boolean(registered && registered.id), `Provider registered with ID: ${registered ? registered.id : 'N/A'}`);
    assert(registered.first_name === 'Tarila', `Provider first_name preserved: ${registered ? registered.first_name : ''}`);
    assert(registered.phone.includes(testPhone), `Provider phone contains formatted prefix: ${registered ? registered.phone : ''}`);
    assert(Number(registered.lat) === 6.5000, `Provider latitude coordinates persisted accurately: ${registered ? registered.lat : ''}`);
    assert(Number(registered.lng) === 3.3585, `Provider longitude coordinates persisted accurately: ${registered ? registered.lng : ''}`);

    // Verify record retrieval by ID
    const retrieved = await global.LokatorDB.getProviderById(registered.id);
    assert(Boolean(retrieved && retrieved.id === registered.id), `Retrieved newly registered provider from database successfully`);
  } catch (err) {
    assert(false, 'Registration test', err.stack);
  }

  // TEST 5: Authentication Flow (Sign In With Password)
  console.log('\n👉 [5/6] Testing Provider Authentication Flow...');
  try {
    const authEmail = `auth_test_${Date.now()}@lokator.ng`;
    const authPass = 'SecurePass2026!';
    const authData = {
      fname: 'Chukwudi',
      lname: 'Nnamdi',
      phone: '8023456789',
      email: authEmail,
      service: 'Plumber',
      trade: 'Plumber',
      skills: ['Plumber'],
      location: 'Ikeja, Lagos, Nigeria',
      experience: '3-5',
      bio: 'Certified emergency plumber in Ikeja.',
      lat: 6.6018,
      lng: 3.3515
    };

    const signUpRes = await global.LokatorDB.auth.signUp({
      email: authEmail,
      password: authPass,
      options: { data: { first_name: 'Chukwudi', role: 'provider' } }
    }, authData);

    assert(Boolean(signUpRes && (signUpRes.data || signUpRes.user || !signUpRes.error)), 'LokatorDB.auth.signUp succeeded without crash');

    const signInRes = await global.LokatorDB.auth.signInWithPassword({
      email: authEmail,
      password: authPass
    });

    assert(Boolean(signInRes && signInRes.data && (signInRes.data.user || signInRes.data.session)), 'LokatorDB.auth.signInWithPassword verified credentials and established session');

    const currentP = await global.LokatorDB.auth.getCurrentProvider();
    assert(Boolean(currentP), `getCurrentProvider resolved authenticated user: ${currentP ? currentP.first_name || currentP.name : 'Unknown'}`);
  } catch (err) {
    assert(false, 'Authentication test', err.stack);
  }

  // TEST 6: HTTP Server Response
  console.log('\n👉 [6/6] Testing Localhost HTTP Endpoints...');
  const http = require('http');
  const checkUrl = (urlPath) => new Promise((resolve) => {
    http.get(`http://127.0.0.1:3000${urlPath}`, (res) => {
      resolve({ statusCode: res.statusCode });
    }).on('error', (e) => resolve({ error: e }));
  });

  const homeRes = await checkUrl('/index.html');
  assert(homeRes.statusCode === 200, 'GET /index.html returns 200 OK');

  const regRes = await checkUrl('/register.html');
  assert(regRes.statusCode === 200, 'GET /register.html returns 200 OK');

  const loginRes = await checkUrl('/login.html');
  assert(loginRes.statusCode === 200, 'GET /login.html returns 200 OK');

  const dashRes = await checkUrl('/dashboard.html');
  assert(dashRes.statusCode === 200, 'GET /dashboard.html returns 200 OK');

  console.log('\n========================================================');
  console.log(`TOTAL BATTERY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBattery();
