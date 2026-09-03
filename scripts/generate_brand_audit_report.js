const fs = require('fs');
const path = require('path');

const data = require('./audit_brand_occurrences.json');

// Categorization rules
function classify(item) {
  const f = item.file;
  const c = item.content;

  // Historical files: past audits, past migration files
  if (f.startsWith('supabase/migrations/') || f.includes('AUDIT') || f.includes('COMPLETION') || f.includes('BASELINE') || f.includes('BLUEPRINT') || f.includes('Report') || f.includes('Strategy') || f.includes('Executive')) {
    return {
      classification: 'HISTORICAL',
      action: 'PRESERVE (Immutable historical record / migration log)',
      risk: 'ZERO'
    };
  }

  // Infrastructure / Deployment
  if (f === 'package.json' || f === 'package-lock.json' || f === '.env' || f === '.env.example' || f === 'vercel.json' || f.includes('verify_live_vercel')) {
    return {
      classification: 'INFRASTRUCTURE',
      action: 'AUDIT_FIRST (Preserve active deployment URLs, update meta if safe)',
      risk: 'MEDIUM'
    };
  }

  // Technical Identifiers in code (Supabase storage keys, localStorage DB keys, internal functions)
  if (c.includes('DB_STORE_KEY') || c.includes('DB_SERVICES_KEY') || c.includes('DB_REVIEWS_KEY') || 
      c.includes('DB_AUTH_SESSION_KEY') || c.includes('DB_PORTFOLIO_KEY') || c.includes('DB_WORKING_HOURS_KEY') ||
      c.includes('LOKATOR_SUPABASE_') || c.includes('lokator_supabase_') || c.includes('lokatorDiscovery') ||
      c.includes('lokator_') || c.includes('window.lokator')) {
    return {
      classification: 'TECHNICAL_IDENTIFIER',
      action: 'PRESERVE (Internal contract / local storage persistence / backward compatibility)',
      risk: 'LOW (Preserved to avoid breaking sessions or state)'
    };
  }

  // Test scripts that check branding or selectors
  if (f.startsWith('scripts/')) {
    if (c.includes('Lokator') || c.includes('lokator.ng') || c.includes('Lokator.NG')) {
      return {
        classification: 'TECHNICAL_IDENTIFIER',
        action: 'UPDATE_TEST_ASSERTION (Align test assertion with new PadiFix brand while preserving test logic)',
        risk: 'LOW'
      };
    }
  }

  // Public Brand in UI (HTML, CSS, PWA, User-Facing JS)
  if (f.endsWith('.html') || f === 'manifest.json' || f === 'pwa-manager.js' || f === 'pwa.css' || f === 'style.css' || f === 'sw.js') {
    return {
      classification: 'PUBLIC_BRAND',
      action: 'MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix)',
      risk: 'LOW'
    };
  }

  // Client-side JS customer-facing copy
  if (['app.js', 'search.js', 'profile.js', 'dashboard.js', 'ai-service.js', 'categories.js', 'providers-data.js', 'locations.js', 'phone-utils.js', 'search-language.js', 'telemetry.js', 'admin.js', 'map-service.js'].includes(f)) {
    if (c.includes('alert(') || c.includes('toast') || c.includes('textContent') || c.includes('innerHTML') || c.includes('placeholder') || c.includes('title') || c.includes('WhatsApp') || c.includes('notification')) {
      return {
        classification: 'PUBLIC_BRAND',
        action: 'MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message)',
        risk: 'LOW'
      };
    }
    return {
      classification: 'TECHNICAL_IDENTIFIER',
      action: 'PRESERVE (Code comments / internal telemetry IDs / internal helper)',
      risk: 'LOW'
    };
  }

  return {
    classification: 'UNCERTAIN',
    action: 'INSPECT_MANUALLY',
    risk: 'MEDIUM'
  };
}

let md = `# PHASE 011 — PADIFIX COMPLETE BRAND AUDIT REPORT\n\n`;
md += `**Date**: 2026-09-03  \n`;
md += `**Target Brand**: PadiFix  \n`;
md += `**Primary Tagline**: Find Skills. Get Things Done.  \n`;
md += `**Secondary Tagline**: Whatever You Need. We’ve Got You.  \n`;
md += `**Category**: Nigeria's Local-Services Marketplace  \n\n`;
md += `---\n\n`;

md += `## 1. Classification Summary\n\n`;
const counts = { PUBLIC_BRAND: 0, TECHNICAL_IDENTIFIER: 0, INFRASTRUCTURE: 0, HISTORICAL: 0, UNCERTAIN: 0 };

const classifiedData = data.map(item => {
  const res = classify(item);
  counts[res.classification]++;
  return { ...item, ...res };
});

md += `| Classification | Occurrences | Strategic Action |\n`;
md += `| :--- | :---: | :--- |\n`;
md += `| **PUBLIC_BRAND** | ${counts.PUBLIC_BRAND} | **MIGRATE**: Replace customer-facing copy, logos, titles, PWA name with PadiFix |\n`;
md += `| **TECHNICAL_IDENTIFIER** | ${counts.TECHNICAL_IDENTIFIER} | **PRESERVE**: Keep database keys, contracts, and internal configs intact |\n`;
md += `| **HISTORICAL** | ${counts.HISTORICAL} | **PRESERVE**: Keep past migration files and prior phase audit logs immutable |\n`;
md += `| **INFRASTRUCTURE** | ${counts.INFRASTRUCTURE} | **AUDIT FIRST**: Keep deployment endpoints functional, phase domain migrations |\n`;
md += `| **UNCERTAIN** | ${counts.UNCERTAIN} | **MANUAL REVIEW**: Validate during implementation phase |\n`;
md += `| **TOTAL** | **${data.length}** | Complete codebase scan |\n\n`;

md += `---\n\n`;
md += `## 2. Customer-Facing Surfaces (PUBLIC_BRAND) — High Priority Migration Matrix\n\n`;

const publicFiles = {};
classifiedData.filter(d => d.classification === 'PUBLIC_BRAND').forEach(d => {
  publicFiles[d.file] = publicFiles[d.file] || [];
  publicFiles[d.file].push(d);
});

Object.entries(publicFiles).forEach(([file, items]) => {
  md += `### \`${file}\` (${items.length} occurrences)\n\n`;
  md += `| Line | Old Brand Value | Proposed Action | Risk Level |\n`;
  md += `| :---: | :--- | :--- | :---: |\n`;
  items.slice(0, 15).forEach(item => {
    const escaped = item.content.replace(/\|/g, '\\|').slice(0, 80);
    md += `| ${item.line} | \`${escaped}\` | ${item.action} | ${item.risk} |\n`;
  });
  if (items.length > 15) {
    md += `| ... | *(${items.length - 15} more occurrences in this file)* | Batch replace customer-facing strings | LOW |\n`;
  }
  md += `\n`;
});

md += `---\n\n`;
md += `## 3. Technical Identifiers (TECHNICAL_IDENTIFIER) — Preserved for Safety\n\n`;
md += `The following technical identifiers are **strictly preserved** to prevent breaking client state, auth sessions, database relations, and service workers:\n\n`;
md += `- \`DB_STORE_KEY = 'lokator_supabase_providers_db'\` (LocalStorage offline database cache)\n`;
md += `- \`DB_AUTH_SESSION_KEY = 'lokator_supabase_auth_session'\` (User session token persistence)\n`;
md += `- \`DB_REVIEWS_KEY = 'lokator_supabase_reviews_db'\` (Review submission queue)\n`;
md += `- \`window.lokatorDiscovery\` (Core hero and scroll engine controller singleton)\n`;
md += `- \`window.LOKATOR_SUPABASE_URL\` / \`window.LOKATOR_SUPABASE_ANON_KEY\` (Backward-compatible environment fallback)\n`;
md += `- Supabase database table names (\`providers\`, \`categories\`, \`reviews\`, \`analytics_events\`, etc.)\n`;
md += `- Storage bucket IDs and column schemas\n\n`;

md += `---\n\n`;
md += `## 4. Historical Records (HISTORICAL) — Immutable Past Documentation\n\n`;
md += `All prior audit markdown files (\`PHASE_10_*.md\`, \`PHASE_9_*.md\`, etc.) and database migrations (\`supabase/migrations/*.sql\`) represent historical milestones and are preserved without modification.\n\n`;

fs.writeFileSync('PHASE_011_BRAND_AUDIT.md', md, 'utf8');
console.log('Generated PHASE_011_BRAND_AUDIT.md successfully!');
