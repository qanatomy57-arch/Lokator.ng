const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let totalControls = 0;
let totalMissing = 0;
const issues = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  
  // Find all label for attributes
  const labelFors = new Set();
  const labelMatches = content.matchAll(/<label[^>]*\bfor=["']([^"']+)["']/gi);
  for (const m of labelMatches) {
    labelFors.add(m[1]);
  }

  // Find all inputs, selects, textareas
  const controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
  let match;
  while ((match = controlRegex.exec(content)) !== null) {
    totalControls++;
    const tag = match[1].toLowerCase();
    const attrs = match[2];

    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : (tag === 'textarea' ? 'textarea' : (tag === 'select' ? 'select' : 'text'));

    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') {
      continue; // standard action buttons and hidden tokens do not need for labels
    }

    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : null;

    const hasAriaLabel = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
    const hasLabelFor = id && labelFors.has(id);
    const hasTitle = /\btitle=["'][^"']+["']/i.test(attrs);

    if (!hasAriaLabel && !hasLabelFor && !hasTitle) {
      totalMissing++;
      issues.push({
        file,
        tag,
        id,
        type,
        snippet: match[0].substring(0, 100)
      });
    }
  }
});

console.log(`TOTAL AUDITED INTERACTIVE CONTROLS: ${totalControls}`);
console.log(`TOTAL UNLABELLED CONTROLS: ${totalMissing}`);
if (issues.length > 0) {
  console.log('\nISSUES FOUND:');
  issues.forEach(i => console.log(`- [${i.file}] <${i.tag} type="${i.type}" id="${i.id}"> -> ${i.snippet}`));
} else {
  console.log('\n✅ ALL INTERACTIVE FORM CONTROLS ACROSS ALL PAGES HAVE VALID ACCESSIBLE NAMES / LABELS!');
}
