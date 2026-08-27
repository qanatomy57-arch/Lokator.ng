const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const results = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/href\s*=\s*["']#["']/.test(line)) {
          results.push({
            file: relPath,
            line: idx + 1,
            text: line.trim()
          });
        }
      });
    }
  }
}

scanDir(rootDir);

console.log(`TOTAL href="#" OCCURRENCES FOUND: ${results.length}\n`);
results.forEach((r, i) => {
  console.log(`${i + 1}. [${r.file}:${r.line}] ${r.text}`);
});
