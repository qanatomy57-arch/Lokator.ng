const fs = require('fs');
const path = require('path');

// 1. Authoritative Constitutional Breakdown of all 774 LGAs in Nigeria (36 States + FCT)
const CONSTITUTIONAL_LGAS = {
  'Abia': [
    'Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North',
    'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo',
    'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'
  ],
  'Adamawa': [
    'Demsa', 'Fufore', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde',
    'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan',
    'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'
  ],
  'Akwa Ibom': [
    'Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan',
    'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene',
    'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara',
    'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'
  ],
  'Anambra': [
    'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South',
    'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala',
    'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South',
    'Orumba North', 'Orumba South', 'Oyi'
  ],
  'Bauchi': [
    'Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa',
    'Giade', 'Itas/Gadau', "Jama'are", 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira',
    'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'
  ],
  'Bayelsa': [
    'Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'
  ],
  'Benue': [
    'Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West',
    'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo',
    'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'
  ],
  'Borno': [
    'Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa',
    'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga',
    'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar',
    'Monguno', 'Ngala', 'Nganzai', 'Shani'
  ],
  'Cross River': [
    'Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki',
    'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra',
    'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'
  ],
  'Delta': [
    'Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West',
    'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West',
    'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North',
    'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'
  ],
  'Ebonyi': [
    'Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South',
    'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'
  ],
  'Edo': [
    'Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West',
    'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Orhionmwon',
    'Oredo', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'
  ],
  'Ekiti': [
    'Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure',
    'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun',
    'Ise/Orun', 'Moba', 'Oye'
  ],
  'Enugu': [
    'Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu',
    'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East',
    'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'
  ],
  'Federal Capital Territory': [
    'Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abuja Municipal'
  ],
  'Gombe': [
    'Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo',
    'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'
  ],
  'Imo': [
    'Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North',
    'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli',
    'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema',
    'Okigwe', 'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal',
    'Owerri North', 'Owerri West'
  ],
  'Jigawa': [
    'Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa',
    'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa',
    'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori',
    'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'
  ],
  'Kaduna': [
    'Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', "Jema'a", 'Kachia',
    'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau',
    'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'
  ],
  'Kano': [
    'Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta',
    'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam',
    'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya',
    'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa',
    'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa',
    'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'
  ],
  'Katsina': [
    'Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume',
    'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa',
    'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada',
    "Mai'Adua", 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa',
    'Safana', 'Sandamu', 'Zango'
  ],
  'Kebbi': [
    'Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza',
    'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski',
    'Sakaba', 'Shanga', 'Suru', 'Danko/Wasagu', 'Yauri', 'Zuru'
  ],
  'Kogi': [
    'Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela Odolu',
    'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori/Magongo',
    'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'
  ],
  'Kwara': [
    'Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South',
    'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'
  ],
  'Lagos': [
    'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry',
    'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe',
    'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'
  ],
  'Nasarawa': [
    'Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia',
    'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'
  ],
  'Niger': [
    'Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako',
    'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu',
    'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'
  ],
  'Ogun': [
    'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ewekoro', 'Ifo', 'Ijebu East',
    'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia',
    'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Sagamu',
    'Yewa North', 'Yewa South'
  ],
  'Ondo': [
    'Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West',
    'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje',
    'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'
  ],
  'Osun': [
    'Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro',
    'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ifedayo', 'Ifelodun',
    'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ila', 'Ilesa East',
    'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin',
    'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'
  ],
  'Oyo': [
    'Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East',
    'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central',
    'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa',
    'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo',
    'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East',
    'Saki West', 'Surulere'
  ],
  'Plateau': [
    'Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam',
    'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin',
    "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'
  ],
  'Rivers': [
    'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru',
    'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana',
    'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro',
    'Oyigbo', 'Port Harcourt', 'Tai'
  ],
  'Sokoto': [
    'Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa',
    'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame',
    'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'
  ],
  'Taraba': [
    'Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo',
    'Karim Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'
  ],
  'Yobe': [
    'Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani',
    'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa',
    'Yunusari', 'Yusufari'
  ],
  'Zamfara': [
    'Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi',
    'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi'
  ]
};

// Step 1: Verify the count
let totalCount = 0;
const states = Object.keys(CONSTITUTIONAL_LGAS);
console.log(`Total States/Territories defined: ${states.length}`);
states.forEach(st => {
  const lgas = CONSTITUTIONAL_LGAS[st];
  totalCount += lgas.length;
  // check for duplicates within state
  const set = new Set();
  lgas.forEach(l => {
    const norm = l.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (set.has(norm)) {
      console.error(`DUPLICATE LGA in ${st}: ${l}`);
    }
    set.add(norm);
  });
});
console.log(`Total Constitutional LGAs: ${totalCount}`);

if (states.length !== 37 || totalCount !== 774) {
  console.error(`ERROR: Expected 37 states and 774 LGAs, got ${states.length} states and ${totalCount} LGAs`);
  process.exit(1);
}

// Step 2: Load current locations.js
const locationsPath = path.join(__dirname, '..', 'locations.js');
const currentLocations = require(locationsPath);
const currentData = currentLocations.NIGERIA_LOCATIONS_DATA;
console.log(`Currently loaded states in locations.js: ${currentData.length}`);

let existingLgaCount = 0;
currentData.forEach(st => {
  existingLgaCount += st.lgas.length;
});
console.log(`Currently loaded LGAs in locations.js: ${existingLgaCount}`);

// Helper to create slug code
function slugify(text) {
  return text.toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to normalize name for comparison
function normName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Step 3: Merge without mutating existing entries
let addedLgaCount = 0;
const mergedData = currentData.map(stateObj => {
  // Find matching state in CONSTITUTIONAL_LGAS
  let constKey = Object.keys(CONSTITUTIONAL_LGAS).find(k => {
    if (normName(k) === normName(stateObj.name)) return true;
    if (k.includes('Federal Capital Territory') && (stateObj.name.includes('FCT') || stateObj.code === 'fct')) return true;
    return false;
  });

  if (!constKey) {
    console.warn(`Could not find state match for: ${stateObj.name}`);
    return stateObj;
  }

  const constLgas = CONSTITUTIONAL_LGAS[constKey];
  const existingLgas = [...stateObj.lgas];
  const existingNorms = new Set(existingLgas.map(l => normName(l.name)));

  // Add missing LGAs
  const newLgas = [];
  constLgas.forEach(lgaName => {
    const norm = normName(lgaName);
    // Check if matched by existing
    let match = existingLgas.find(el => {
      const elNorm = normName(el.name);
      if (elNorm === norm) return true;
      // Handle known minor naming variations (e.g. "Abuja Municipal" vs "Abuja Municipal Area Council")
      if (elNorm.includes(norm) || norm.includes(elNorm)) return true;
      return false;
    });

    if (!match) {
      // Create new LGA object
      let code = slugify(lgaName);
      // Ensure code is unique in this state
      let codeSuffix = 1;
      let uniqueCode = code;
      while (existingLgas.some(e => e.code === uniqueCode) || newLgas.some(n => n.code === uniqueCode)) {
        uniqueCode = `${code}-${codeSuffix++}`;
      }

      newLgas.push({
        code: uniqueCode,
        name: lgaName,
        localities: [`${lgaName} Town`, `${lgaName} Central`]
      });
      addedLgaCount++;
    }
  });

  const combinedLgas = [...existingLgas, ...newLgas];
  return {
    ...stateObj,
    lgas: combinedLgas
  };
});

let totalMergedLgas = 0;
mergedData.forEach(st => {
  totalMergedLgas += st.lgas.length;
});
console.log(`Added ${addedLgaCount} LGAs. Total merged LGAs: ${totalMergedLgas}`);

// Step 4: Write authoritative merged dataset to a standalone JSON file for safety check
fs.writeFileSync(path.join(__dirname, 'merged_774_locations.json'), JSON.stringify(mergedData, null, 2), 'utf8');
console.log('Saved scripts/merged_774_locations.json successfully.');
