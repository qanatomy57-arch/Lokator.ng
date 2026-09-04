const { NIGERIA_LOCATIONS_DATA } = require('../locations.js');

console.log('--- NIGERIA_LOCATIONS_DATA FORENSIC ANALYSIS ---');
console.log('Total entries:', NIGERIA_LOCATIONS_DATA.length);

const states = NIGERIA_LOCATIONS_DATA.filter(s => !s.name.toLowerCase().includes('abuja') && !s.name.toLowerCase().includes('fct'));
const fct = NIGERIA_LOCATIONS_DATA.filter(s => s.name.toLowerCase().includes('abuja') || s.name.toLowerCase().includes('fct'));

console.log(`States count: ${states.length}`);
console.log(`FCT entries: ${fct.map(f => f.name).join(', ')}`);

let totalLgas = 0;
let stateLgaBreakdown = [];

NIGERIA_LOCATIONS_DATA.forEach(s => {
  const count = (s.lgas || []).length;
  totalLgas += count;
  stateLgaBreakdown.push({ state: s.name, count });
});

console.log(`Total LGAs across all entries: ${totalLgas}`);
if (totalLgas === 774) {
  console.log('MATCH: Exactly 774 LGAs nationwide!');
} else {
  console.log(`VARIANCE: Found ${totalLgas} LGAs, difference from 774 is ${totalLgas - 774}`);
}
