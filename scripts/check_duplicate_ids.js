const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let totalDuplicates = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const ids = new Map();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }

  const dupes = [];
  ids.forEach((count, id) => {
    if (count > 1) {
      dupes.push(`${id} (count: ${count})`);
      totalDuplicates++;
    }
  });

  if (dupes.length > 0) {
    console.log(`❌ [${file}] DUPLICATE IDs:`, dupes.join(', '));
  } else {
    console.log(`✅ [${file}] 0 duplicate IDs (${ids.size} unique IDs)`);
  }
});

console.log(`\nTOTAL DUPLICATE IDs ACROSS ALL PAGES: ${totalDuplicates}`);
