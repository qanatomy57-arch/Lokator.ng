const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'authoritative_774_lgas.json'), 'utf8'));

console.log('=== NIGERIA 774 CONSTITUTIONAL LGAS AUDIT ===');
let totalLgas = 0;
const stateCounts = {};
const allLgaPairs = new Set();
const duplicates = [];

data.forEach(item => {
  const state = item.state;
  const lgas = item.lgas;
  stateCounts[state] = lgas.length;
  totalLgas += lgas.length;

  lgas.forEach(lga => {
    const cleanLga = lga.trim();
    const pair = `${cleanLga.toLowerCase()}__${state.toLowerCase()}`;
    if (allLgaPairs.has(pair)) {
      duplicates.push({ state, lga: cleanLga });
    }
    allLgaPairs.add(pair);
  });
});

console.log(`Total Entities: ${Object.keys(stateCounts).length} (36 States + FCT)`);
console.log(`Total LGAs: ${totalLgas}`);
console.log(`Duplicates within same state: ${duplicates.length}`);

console.log('\nBreakdown by State:');
Object.entries(stateCounts).sort((a,b) => b[1] - a[1]).forEach(([state, count]) => {
  console.log(`  - ${state}: ${count} LGAs`);
});

// Check FCT (Abuja) Area Councils
const fct = data.find(d => d.state.toLowerCase().includes('fct') || d.state.toLowerCase().includes('abuja'));
console.log('\nFCT Area Councils:', fct ? fct.lgas.join(', ') : 'Not found');
