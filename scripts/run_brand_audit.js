const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoreDirs = new Set(['.git', 'node_modules', 'scratch']);
const brandRegex = /lokator/i;

const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (ignoreDirs.has(f)) continue;
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      const ext = path.extname(f).toLowerCase();
      if (!['.html', '.js', '.css', '.json', '.sql', '.md', '.py', '.txt', '.svg'].includes(ext)) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (brandRegex.test(line)) {
            results.push({
              file: path.relative(root, fullPath).replace(/\\/g, '/'),
              line: idx + 1,
              content: line.trim()
            });
          }
        });
      } catch (e) {}
    }
  }
}

walk(root);

console.log('Total matches found:', results.length);
const byFile = {};
results.forEach(r => {
  byFile[r.file] = (byFile[r.file] || 0) + 1;
});

console.log('\nTop files with brand occurrences:');
Object.entries(byFile).sort((a,b) => b[1] - a[1]).forEach(([file, count]) => {
  console.log('  ' + file + ': ' + count);
});

fs.writeFileSync('scripts/audit_brand_occurrences.json', JSON.stringify(results, null, 2), 'utf8');
console.log('\nFull occurrence database saved to scripts/audit_brand_occurrences.json');
