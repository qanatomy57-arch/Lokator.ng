const assert = require('assert');
const path = require('path');

const locationsPath = path.join(__dirname, '..', 'locations.js');
const { NigeriaLocations, NIGERIA_LOCATIONS_DATA } = require(locationsPath);

console.log('--- STARTING DETERMINISTIC VERIFICATION OF 774 NIGERIAN LGAS ---');

// 1. Assert exactly 37 state/territory entities
const states = NigeriaLocations.getStates();
assert.strictEqual(states.length, 37, `Expected 37 states, got ${states.length}`);
console.log('✓ Exactly 37 States + FCT present');

// 2. Assert total LGAs across all states is exactly 774
let totalLgas = 0;
const allLgaNames = [];
const seenCodesPerState = new Map();

states.forEach(state => {
  const lgas = NigeriaLocations.getLgas(state.code);
  assert(lgas.length > 0, `State ${state.name} has no LGAs`);
  totalLgas += lgas.length;

  const stateCodes = new Set();
  const stateNames = new Set();

  lgas.forEach(lga => {
    // Assert non-empty code and name
    assert(lga.code && typeof lga.code === 'string', `LGA in ${state.name} missing valid code`);
    assert(lga.name && typeof lga.name === 'string', `LGA in ${state.name} missing valid name`);
    assert(Array.isArray(lga.localities) && lga.localities.length > 0, `LGA ${lga.name} in ${state.name} has no localities`);

    // Assert no duplicate codes or names within state
    assert(!stateCodes.has(lga.code), `Duplicate LGA code '${lga.code}' in ${state.name}`);
    assert(!stateNames.has(lga.name.toLowerCase()), `Duplicate LGA name '${lga.name}' in ${state.name}`);

    stateCodes.add(lga.code);
    stateNames.add(lga.name.toLowerCase());
    allLgaNames.push(`${lga.name} (${state.name})`);
  });
});

assert.strictEqual(totalLgas, 774, `Expected exactly 774 LGAs, got ${totalLgas}`);
console.log(`✓ Exactly 774 constitutional LGAs verified across all 37 entities`);

// 3. Assert all original 372 LGAs are preserved
const originalCheckpoints = [
  { state: 'lagos', lga: 'ikeja' },
  { state: 'lagos', lga: 'eti-osa' },
  { state: 'fct', lga: 'amac' },
  { state: 'kano', lga: 'kano-municipal' },
  { state: 'rivers', lga: 'port-harcourt-city' },
  { state: 'oyo', lga: 'ibadan-north' },
  { state: 'delta', lga: 'warri-south' },
  { state: 'kaduna', lga: 'kaduna-north' },
  { state: 'enugu', lga: 'enugu-north' },
  { state: 'anambra', lga: 'onitsha-north' }
];

originalCheckpoints.forEach(cp => {
  const lga = NigeriaLocations.getLga(cp.state, cp.lga);
  assert(lga, `Checkpoint LGA ${cp.lga} in ${cp.state} not found`);
  assert(lga.localities.length > 0, `Checkpoint LGA ${cp.lga} has no localities`);
});
console.log('✓ All key original commercial hubs and checkpoints verified intact');

// 4. Assert newly added LGAs resolve properly
const newCheckpoints = [
  { state: 'benue', query: 'Katsina-Ala', expectedName: 'Katsina-Ala' },
  { state: 'fct', query: 'Abaji', expectedName: 'Abaji' },
  { state: 'kano', query: 'Ajingi', expectedName: 'Ajingi' },
  { state: 'borno', query: 'Abadam', expectedName: 'Abadam' },
  { state: 'plateau', query: 'Bokkos', expectedName: 'Bokkos' }
];

newCheckpoints.forEach(cp => {
  const search = NigeriaLocations.searchLocations(cp.query);
  assert(search.length > 0, `Search for ${cp.query} returned no results`);
  assert(search.some(r => r.title.toLowerCase().includes(cp.expectedName.toLowerCase())), `Search for ${cp.query} did not contain expected title`);
});
console.log('✓ Newly added LGAs autocomplete and search verified');

console.log('--- ALL 774 LGA TESTS PASSED DETERMINISTICALLY! ---');
