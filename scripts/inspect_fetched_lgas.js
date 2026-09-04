const fs = require('fs');
const path = require('path');

const contentPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\fef6d640-fcb9-4d25-9889-63baa2201278\\.system_generated\\steps\\2527\\content.md';
let raw = fs.readFileSync(contentPath, 'utf8');

const jsonStart = raw.indexOf('[');
const jsonEnd = raw.lastIndexOf(']');
const jsonString = raw.substring(jsonStart, jsonEnd + 1);

try {
  const data = JSON.parse(jsonString);
  console.log('Parsed items count:', data.length);
  let totalLgas = 0;
  const states = [];
  data.forEach(item => {
    const stateName = item.state || item.name;
    const lgas = item.lgas || [];
    totalLgas += lgas.length;
    states.push({ state: stateName, lgaCount: lgas.length });
  });

  console.log('Total States/Territories:', states.length);
  console.log('Total LGAs:', totalLgas);
  if (totalLgas === 774) {
    console.log('SUCCESS: Exactly 774 constitutional LGAs found!');
    fs.writeFileSync(path.join(__dirname, 'authoritative_774_lgas.json'), JSON.stringify(data, null, 2));
  } else {
    console.log(`Variance from 774: ${totalLgas - 774}`);
  }
} catch (e) {
  console.error('JSON parse error:', e.message);
}
