const fs = require('fs');
const path = require('path');

const files = ['dashboard.html', 'register.html', 'search.html', 'profile.html', 'login.html', 'index.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const defects = [];

  lines.forEach((line, idx) => {
    const num = idx + 1;
    // Hardcoded white background in dark mode or hardcoded dark background in light mode
    if (/background:\s*#(fff|ffffff|f8fafc|f0fdf4|fffbeb|ecfdf5)/i.test(line)) {
      defects.push({ line: num, type: 'light-background-inline', text: line.trim() });
    }
    if (/background:\s*#(0a0e17|111827|1e293b|0f172a)/i.test(line)) {
      defects.push({ line: num, type: 'dark-background-inline', text: line.trim() });
    }
    // Hardcoded dark text
    if (/color:\s*#(0f172a|000|000000|334155|475569|1e293b|111827)/i.test(line) && !line.includes('var(')) {
      defects.push({ line: num, type: 'hardcoded-dark-text', text: line.trim() });
    }
    // Hardcoded white text
    if (/color:\s*#(fff|ffffff|f8fafc|f1f5f9)/i.test(line) && !line.includes('var(')) {
      defects.push({ line: num, type: 'hardcoded-white-text', text: line.trim() });
    }
  });

  if (defects.length > 0) {
    console.log(`\n================== ${file} (${defects.length} potential defects) ==================`);
    defects.forEach(d => console.log(`[L${d.line} ${d.type}] ${d.text.substring(0, 100)}`));
  }
});
