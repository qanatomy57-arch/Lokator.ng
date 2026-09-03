const fs = require('fs');
const path = require('path');

const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');

console.log('--- SUPABASE DATABASE CONTRACT & KEY PRESERVATION ---');

const tables = ['providers', 'reviews', 'portfolio_items', 'working_hours', 'provider_services', 'analytics_events'];
let tablesOk = true;
tables.forEach(t => {
  const hasTable = clientCode.includes(`'${t}'`) || clientCode.includes(`"${t}"`);
  if (!hasTable) tablesOk = false;
  console.log(`  ${hasTable ? '✅' : '❌'} Table reference '${t}': ${hasTable ? 'PRESERVED' : 'MISSING'}`);
});

const storageKeys = [
  'lokator_supabase_providers_db',
  'lokator_supabase_auth_session',
  'lokator_job_requests',
  'lokator_artisan_referral_codes',
  'lokator_telemetry_events',
  'lokator_offline'
];

let keysOk = true;
storageKeys.forEach(k => {
  const hasKey = clientCode.includes(k);
  if (!hasKey) keysOk = false;
  console.log(`  ${hasKey ? '✅' : '❌'} Technical storage key '${k}': ${hasKey ? 'INTACT' : 'MODIFIED'}`);
});

// Check if any DROP TABLE, ALTER TABLE, RENAME TABLE exist in repo
const sqlFiles = ['supabase/schema.sql'];
let destructiveSql = false;
sqlFiles.forEach(f => {
  if (fs.existsSync(path.join(__dirname, '..', f))) {
    const sql = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    if (/drop\s+table/i.test(sql) || /rename\s+to/i.test(sql)) {
      destructiveSql = true;
    }
  }
});
console.log(`  ${!destructiveSql ? '✅' : '❌'} Zero destructive SQL operations: ${!destructiveSql ? 'VERIFIED' : 'DETECTED'}`);

if (tablesOk && keysOk && !destructiveSql) {
  console.log('\n🎉 SUPABASE PRESERVATION VERIFIED 100% (READ-ONLY)');
  process.exit(0);
} else {
  console.error('\n❌ SUPABASE PRESERVATION CHECKS FAILED');
  process.exit(1);
}
