const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.join(__dirname, 'run_comprehensive_52_flow_audit.js'), 'utf8');

// Parse flows 1 through 52
const matrix = [];

for (let i = 1; i <= 52; i++) {
  const flowId = `FLOW-${String(i).padStart(2, '0')}`;
  
  // Find where this flow is handled in the script
  const flowRegex = new RegExp(`recordFlow\\(['"]${flowId}['"],\\s*['"]([^'"]+)['"],\\s*['"]([^'"]+)['"],\\s*([^,]+),([\\s\\S]*?)\\);`);
  const match = scriptContent.match(flowRegex);

  let flowName = 'Unknown';
  let category = 'Unknown';
  let statusExpr = 'PASS';
  let notes = '';
  let evidence = '';

  if (match) {
    flowName = match[1];
    category = match[2];
    statusExpr = match[3].trim();
    notes = match[4];
  }

  // Look at lines preceding recordFlow for this flow to see what was actually executed
  const flowIdx = scriptContent.indexOf(`recordFlow('${flowId}'`);
  let precedingCode = '';
  if (flowIdx !== -1) {
    // Look up to 1000 characters before recordFlow
    const startIdx = Math.max(0, flowIdx - 1000);
    precedingCode = scriptContent.substring(startIdx, flowIdx);
  }

  const hasClick = precedingCode.includes('.click(');
  const hasFill = precedingCode.includes('.fill(');
  const hasSelect = precedingCode.includes('.selectOption(');
  const hasGoto = precedingCode.includes('.goto(');
  const hasScreenshot = precedingCode.includes('.screenshot(');

  const realInteraction = hasClick || hasFill || hasSelect;
  const capturesScreenshot = hasScreenshot;

  // Viewports: Did it run in Section 1 (viewports loop) or Section 2/3/4?
  // Section 1 viewports loop only tested 5 generic page renders: home, search, profile, register, dashboard.
  // Flows 1-52 ran inside a single context: viewport 1440x900 (Desktop only)!
  const desktopTested = true;
  const mobileTested = false; // specific flow steps were NOT in the viewport loop

  let automatedOnly = !realInteraction;
  let status = statusExpr.includes('FAIL') ? 'FAIL' : (statusExpr.includes('PASS WITH') ? 'PASS WITH NOTES' : 'PASS');

  matrix.push({
    flowId,
    name: flowName,
    category,
    realInteraction,
    capturesScreenshot,
    mobileTested,
    desktopTested,
    automatedOnly,
    status
  });
}

console.log(JSON.stringify(matrix, null, 2));
fs.writeFileSync(path.join(__dirname, 'flow_forensic_matrix.json'), JSON.stringify(matrix, null, 2));
