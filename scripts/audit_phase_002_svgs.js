const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run git diff on commit fb2c415
const diffOutput = execSync('git diff fb2c415~1..fb2c415', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

const lines = diffOutput.split('\n');
let currentFile = null;
const removedSvgBlocks = [];
let capturingSvg = false;
let currentBlock = [];
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('diff --git')) {
    const parts = line.split(' ');
    currentFile = parts[2].replace(/^a\//, '');
  }
  
  if (line.startsWith('-') && !line.startsWith('---')) {
    const content = line.substring(1);
    if (content.includes('<svg')) {
      capturingSvg = true;
      currentBlock = [content];
      startLine = i;
    } else if (capturingSvg) {
      currentBlock.push(content);
      if (content.includes('</svg>')) {
        capturingSvg = false;
        removedSvgBlocks.push({
          file: currentFile,
          content: currentBlock.join('\n'),
          lineNum: startLine
        });
        currentBlock = [];
      }
    }
  } else if (capturingSvg && !line.startsWith('-')) {
    // End of removed chunk
    capturingSvg = false;
    if (currentBlock.length > 0) {
      removedSvgBlocks.push({
        file: currentFile,
        content: currentBlock.join('\n'),
        lineNum: startLine
      });
      currentBlock = [];
    }
  }
}

console.log(`Total removed SVG blocks in commit fb2c415: ${removedSvgBlocks.length}`);

const auditResults = removedSvgBlocks.map((block, idx) => {
  const c = block.content;
  let classification = 'Unknown';
  let purpose = '';
  let status = 'Replaced with canonical PNG asset';
  let action = 'None (Valid brand logo replacement)';

  // Analyze SVG content
  if (c.includes('viewBox="0 0 100 100"') && c.includes('circle cx="48" cy="46"') && c.includes('stroke-linecap="round"')) {
    // This is the hand-coded Lokator/PadiFix magnifying glass + handshake logo mark!
    classification = '1. A PadiFix logo/brand mark';
    purpose = 'Hand-coded inline logo mark (magnifying glass with two heads & handshake)';
  } else if (c.includes('favicon')) {
    classification = '2. A favicon/logo asset';
    purpose = 'Favicon / logo asset';
  } else {
    // Check if it has other paths
    classification = 'Unknown';
    purpose = 'Unclassified SVG';
    status = 'Needs inspection';
    action = 'Investigate';
  }

  return {
    index: idx + 1,
    file: block.file,
    classification,
    purpose,
    status,
    action,
    contentSnippet: c.substring(0, 120).replace(/\s+/g, ' ') + '...'
  };
});

console.log(JSON.stringify(auditResults, null, 2));

// Also check all remaining SVGs in each HTML file to see what functional icons exist
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const remainingSvgs = {};

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/g) || [];
  remainingSvgs[file] = matches.length;
});

console.log('\nRemaining functional SVGs per HTML file:');
console.log(remainingSvgs);
