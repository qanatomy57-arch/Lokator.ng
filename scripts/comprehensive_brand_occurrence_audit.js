const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.cache',
  'visual_evidence',
  'mobile_screenshots'
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.mp4', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.zip'
]);

const occurrences = {
  PUBLIC: [],
  TECHNICAL: [],
  HISTORICAL: [],
  INFRASTRUCTURE: [],
  INTENTIONAL: []
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXCLUDED_EXTENSIONS.has(ext)) continue;
      auditFile(fullPath, relPath);
    }
  }
}

function classify(relPath, lineNum, lineText) {
  const lowerLine = lineText.toLowerCase();
  const lowerPath = relPath.toLowerCase();

  // HISTORICAL: Past phase reports, test suites, migration SQL, documentation, internal strategy blueprints
  if (
    lowerPath.startsWith('phase_') || 
    lowerPath.startsWith('scripts/') || 
    lowerPath.startsWith('scratch/') ||
    lowerPath.startsWith('test_') ||
    lowerPath.includes('migration') || 
    lowerPath.includes('audit') || 
    lowerPath.includes('test_') || 
    lowerPath.includes('verify_') ||
    lowerPath.includes('strategy_report') ||
    lowerPath.endsWith('.md') ||
    lowerPath.endsWith('.sql')
  ) {
    return 'HISTORICAL';
  }

  // INFRASTRUCTURE: Vercel deployment URLs, repo git remote
  if (lineText.includes('lokator-ng.vercel.app') || lineText.includes('github.com/adebayo') || lineText.includes('git@github.com') || lineText.includes('vercel')) {
    return 'INFRASTRUCTURE';
  }

  // TECHNICAL: Supabase schema, LocalStorage keys, DOM IDs, CSS classes, technical globals, logging, AI model names
  if (
    lineText.includes('lokator_') ||
    lineText.includes('lokator-') ||
    lineText.includes('why-lokator') ||
    lineText.includes('LokatorDB') ||
    lineText.includes('LokatorTelemetry') ||
    lineText.includes('LokatorAIService') ||
    lineText.includes('LokatorMapService') ||
    lineText.includes('LokatorDiscoveryOrchestrator') ||
    lineText.includes('LokatorPWA') ||
    lineText.includes('window.lokatorDiscovery') ||
    lineText.includes('window.LOKATOR_') ||
    lineText.includes('process.env.LOKATOR_') ||
    lineText.includes('lokator:telemetry') ||
    lineText.includes('[Lokator') ||
    lineText.includes('lokatorng') ||
    (lowerPath.endsWith('.css') && (lineText.includes('/*') || lineText.includes('*')))
  ) {
    return 'TECHNICAL';
  }

  // INTENTIONAL: Backward-compatible aliases, search intent tokens, internal comments
  if (
    lineText.includes('global.LokatorPWA =') ||
    lineText.includes('const LokatorPWA =') ||
    lineText.includes('module.exports = LokatorPWA') ||
    lineText.includes('Re-exports LokatorPWA') ||
    lineText.includes("'lokator'") ||
    lineText.includes('"lokator"') ||
    lineText.includes('|lokator|') ||
    lineText.trim().startsWith('//') ||
    lineText.trim().startsWith('/*') ||
    lineText.trim().startsWith('*')
  ) {
    return 'INTENTIONAL';
  }

  // If inside customer-facing HTML, CSS, JS, JSON that does not match above:
  if (lowerPath.endsWith('.html') || lowerPath.endsWith('.json') || lowerPath.endsWith('.js') || lowerPath.endsWith('.css')) {
    return 'PUBLIC';
  }

  return 'HISTORICAL';
}

function auditFile(fullPath, relPath) {
  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return;
  }

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/lokator/i.test(line)) {
      const classification = classify(relPath, idx + 1, line);
      occurrences[classification].push({
        file: relPath,
        line: idx + 1,
        text: line.trim()
      });
    }
  });
}

console.log('Running comprehensive repository brand audit...');
walk(repoRoot);

console.log('\n================================================================================');
console.log('🔍 BRAND OCCURRENCE CLASSIFICATION BREAKDOWN');
console.log('================================================================================');
console.log(`  PUBLIC (Unintended Customer-Facing): ${occurrences.PUBLIC.length}`);
console.log(`  TECHNICAL (Database/Storage/CSS/Singletons): ${occurrences.TECHNICAL.length}`);
console.log(`  HISTORICAL (Audit docs/Past SQL/Logs): ${occurrences.HISTORICAL.length}`);
console.log(`  INFRASTRUCTURE (Vercel URLs/Deployments): ${occurrences.INFRASTRUCTURE.length}`);
console.log(`  INTENTIONAL (Compatibility Aliases/Comments): ${occurrences.INTENTIONAL.length}`);
console.log('================================================================================\n');

if (occurrences.PUBLIC.length > 0) {
  console.error('❌ UNINTENDED PUBLIC OCCURRENCES DETECTED:');
  occurrences.PUBLIC.forEach(o => {
    console.error(`  ${o.file}:${o.line} -> ${o.text}`);
  });
} else {
  console.log('✅ ZERO UNINTENDED PUBLIC LOKATOR REFERENCES FOUND!');
}

fs.writeFileSync(
  path.join(__dirname, 'brand_audit_summary.json'),
  JSON.stringify(occurrences, null, 2),
  'utf8'
);
console.log('Saved machine-readable audit to scripts/brand_audit_summary.json');
