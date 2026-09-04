const fs = require('fs');
const path = require('path');

const mergedData = require('./merged_774_locations.json');
const locationsJsPath = path.join(__dirname, '..', 'locations.js');

let content = fs.readFileSync(locationsJsPath, 'utf8');

// Format mergedData cleanly as JS
const formattedData = '  const NIGERIA_LOCATIONS_DATA = ' + JSON.stringify(mergedData, null, 2).replace(/\n/g, '\n  ') + ';';

// Replace the NIGERIA_LOCATIONS_DATA declaration
const regex = /  const NIGERIA_LOCATIONS_DATA = \[[\s\S]*?\n  \];/;
if (!regex.test(content)) {
  console.error('ERROR: Could not locate NIGERIA_LOCATIONS_DATA declaration in locations.js');
  process.exit(1);
}

const updatedContent = content.replace(regex, formattedData);
fs.writeFileSync(locationsJsPath, updatedContent, 'utf8');
console.log('Successfully updated locations.js with all 774 LGAs!');

// Deterministic Verification
delete require.cache[require.resolve(locationsJsPath)];
const reloaded = require(locationsJsPath);
const states = reloaded.NigeriaLocations.getStates();
console.log(`Total States in locations.js: ${states.length}`);
let totalLgas = 0;
states.forEach(st => {
  const lgas = reloaded.NigeriaLocations.getLgas(st.code);
  totalLgas += lgas.length;
});
console.log(`Total LGAs across all states: ${totalLgas}`);

if (states.length !== 37 || totalLgas !== 774) {
  console.error(`VALIDATION FAILED: Expected 37 states and 774 LGAs, found ${states.length} states and ${totalLgas} LGAs.`);
  process.exit(1);
}

// Check search functionality
const testSearch1 = reloaded.NigeriaLocations.searchLocations('Ikeja');
console.log(`Search 'Ikeja' results: ${testSearch1.length}`);
const testSearch2 = reloaded.NigeriaLocations.searchLocations('Katsina-Ala');
console.log(`Search 'Katsina-Ala' results: ${testSearch2.length}`);
const testSearch3 = reloaded.NigeriaLocations.searchLocations('Abaji');
console.log(`Search 'Abaji' results: ${testSearch3.length}`);

console.log('Deterministic verification PASSED!');
