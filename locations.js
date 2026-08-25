// ============================================================================
// LOKATOR.NG — NIGERIAN LOCATION INTELLIGENCE (locations.js)
// Comprehensive dataset and lookup methods for all 36 Nigerian States + FCT,
// Local Government Areas (LGAs), and prominent localities / neighborhoods.
// ============================================================================

(function (global) {
  'use strict';

  // 1. COMPREHENSIVE NIGERIAN STATES, LGAS, AND LOCALITIES DATASET
  const NIGERIA_LOCATIONS_DATA = [
    {
      code: 'abia',
      name: 'Abia',
      displayName: 'Abia State',
      region: 'South East',
      lgas: [
        { code: 'aba-north', name: 'Aba North', localities: ['Eziama', 'Industrial Layout', 'Ariaria'] },
        { code: 'aba-south', name: 'Aba South', localities: ['Asa Road', 'Main Park', 'Enyimba', 'Ngwa Road'] },
        { code: 'arochukwu', name: 'Arochukwu', localities: ['Arochukwu Town', 'Ututu', 'Ihechiowa'] },
        { code: 'bende', name: 'Bende', localities: ['Bende Town', 'Item', 'Alayi', 'Uzuakoli'] },
        { code: 'ikwuano', name: 'Ikwuano', localities: ['Umudike (MOUAU)', 'Oloko', 'Ibare'] },
        { code: 'isiala-ngwa-north', name: 'Isiala Ngwa North', localities: ['Okpuala Ngwa', 'Mbawsi'] },
        { code: 'isiala-ngwa-south', name: 'Isiala Ngwa South', localities: ['Omoba', 'Ovungwu'] },
        { code: 'isuikwuato', name: 'Isuikwuato', localities: ['Otampa', 'Ovabor', 'Uturu (ABSU)'] },
        { code: 'obi-ngwa', name: 'Obi Ngwa', localities: ['Mgboko', 'Umuojima'] },
        { code: 'ohafia', name: 'Ohafia', localities: ['Ebem Ohafia', 'Asaga', 'Elenu Ohafia', 'Abiriba'] },
        { code: 'osisioma', name: 'Osisioma', localities: ['Osisioma Industrial', 'Abayi', 'Umuojima'] },
        { code: 'ugwunagbo', name: 'Ugwunagbo', localities: ['Ugwunagbo Town', 'Ihie'] },
        { code: 'ukwa-east', name: 'Ukwa East', localities: ['Akwete', 'Azumini'] },
        { code: 'ukwa-west', name: 'Ukwa West', localities: ['Oke-Ikpe', 'Owaza'] },
        { code: 'umuahia-north', name: 'Umuahia North', localities: ['Umuahia Main', 'Isieke', 'Afara Ukwu', 'World Bank Housing'] },
        { code: 'umuahia-south', name: 'Umuahia South', localities: ['Ubani Ibeku', 'Amachara', 'Old Umuahia'] },
        { code: 'umu-nneochi', name: 'Umu Nneochi', localities: ['Nkwoagu', 'Isuochi', 'Lomara'] }
      ]
    },
    {
      code: 'adamawa',
      name: 'Adamawa',
      displayName: 'Adamawa State',
      region: 'North East',
      lgas: [
        { code: 'demsa', name: 'Demsa', localities: ['Demsa Town', 'Mbula', 'Dong'] },
        { code: 'fufore', name: 'Fufore', localities: ['Fufore Town', 'Gurin', 'Ribo'] },
        { code: 'ganye', name: 'Ganye', localities: ['Ganye Town', 'Sugu', 'Gurum'] },
        { code: 'girei', name: 'Girei', localities: ['Girei Town', 'Modibbo Adama Univ (MAU)', 'Jabbi Lamba'] },
        { code: 'gombi', name: 'Gombi', localities: ['Gombi Town', 'Boga', 'Guyaku'] },
        { code: 'guyuk', name: 'Guyuk', localities: ['Guyuk Town', 'Banjiram', 'Purokayo'] },
        { code: 'hong', name: 'Hong', localities: ['Hong Town', 'Pella', 'Kwarhi'] },
        { code: 'jada', name: 'Jada', localities: ['Jada Town', 'Kojoli', 'Mayo Kalaye'] },
        { code: 'lamurde', name: 'Lamurde', localities: ['Lamurde Town', 'Gyawana', 'Suwa'] },
        { code: 'madagali', name: 'Madagali', localities: ['Madagali Town', 'Gulak', 'Hyambula'] },
        { code: 'maiha', name: 'Maiha', localities: ['Maiha Town', 'Pakka', 'Sorau'] },
        { code: 'mayo-belwa', name: 'Mayo Belwa', localities: ['Mayo Belwa Town', 'Binyeri', 'Nassarawo'] },
        { code: 'michika', name: 'Michika', localities: ['Michika Town', 'Bazza', 'Futudou'] },
        { code: 'mubi-north', name: 'Mubi North', localities: ['Mubi Town', 'Lokuwa', 'Federal Poly Mubi'] },
        { code: 'mubi-south', name: 'Mubi South', localities: ['Gella', 'Nasarawa', 'Dirbishi'] },
        { code: 'numan', name: 'Numan', localities: ['Numan Town', 'Imburu', 'Pare'] },
        { code: 'shelleng', name: 'Shelleng', localities: ['Shelleng Town', 'Kiri', 'Libbo'] },
        { code: 'song', name: 'Song', localities: ['Song Town', 'Dumne', 'Zumo'] },
        { code: 'toungo', name: 'Toungo', localities: ['Toungo Town', 'Kiri', 'Gumti'] },
        { code: 'yola-north', name: 'Yola North', localities: ['Jimeta', 'Doubeli', 'Karewa', 'Bekaji'] },
        { code: 'yola-south', name: 'Yola South', localities: ['Yola Town', 'Namtari', 'Bako', 'Wuro Hausa'] }
      ]
    },
    {
      code: 'akwa-ibom',
      name: 'Akwa Ibom',
      displayName: 'Akwa Ibom State',
      region: 'South South',
      lgas: [
        { code: 'abak', name: 'Abak', localities: ['Abak Town', 'Ediene', 'Afaha Obong'] },
        { code: 'eastern-obolo', name: 'Eastern Obolo', localities: ['Okoroete', 'Iko', 'Elile'] },
        { code: 'eket', name: 'Eket', localities: ['Eket Urban', 'Afaha Eket', 'Qua River Area', 'Idua'] },
        { code: 'esit-eket', name: 'Esit Eket', localities: ['Uquo', 'Etebi', 'Akpautong'] },
        { code: 'essien-udim', name: 'Essien Udim', localities: ['Afaha Ikot Ebak', 'Ukana', 'Adiasim'] },
        { code: 'etim-ekpo', name: 'Etim Ekpo', localities: ['Utu Etim Ekpo', 'Obong Ntak', 'Urua Inyang'] },
        { code: 'etinan', name: 'Etinan', localities: ['Etinan Town', 'Northern Iman', 'Southern Iman'] },
        { code: 'ibeno', name: 'Ibeno', localities: ['Ukpenekang', 'Iwoachang', 'Mkpanak'] },
        { code: 'ibesikpo-asutan', name: 'Ibesikpo Asutan', localities: ['Nung Udoe', 'Asutan', 'Ibesikpo'] },
        { code: 'ibiono-ibom', name: 'Ibiono Ibom', localities: ['Okoita', 'Idoro', 'Ikpanya'] },
        { code: 'ika', name: 'Ika', localities: ['Urua Inyang', 'Ito', 'Achan'] },
        { code: 'ikono', name: 'Ikono', localities: ['Ibiaku Ntok Okpo', 'Ediene', 'Itak'] },
        { code: 'ikot-abasi', name: 'Ikot Abasi', localities: ['Ikot Abasi Town', 'Essene', 'Ukpum Ete'] },
        { code: 'ikot-ekpene', name: 'Ikot Ekpene', localities: ['Raffia City', 'Ikot Ekpene Urban', 'Amanyam', 'Obot Akara border'] },
        { code: 'ini', name: 'Ini', localities: ['Odoro Ikpe', 'Ikpe Ikot Nkon', 'Nkari'] },
        { code: 'itu', name: 'Itu', localities: ['Itu Bridge', 'Mbiatok', 'West Itam', 'Ayadehe'] },
        { code: 'mbo', name: 'Mbo', localities: ['Enwang', 'Ibaka', 'Uda'] },
        { code: 'mkpat-enin', name: 'Mkpat Enin', localities: ['Mkpat Enin Town', 'Ukpum Minya', 'Ibiaku'] },
        { code: 'nsit-atai', name: 'Nsit Atai', localities: ['Odot', 'Afaha', 'Eastern Nsit'] },
        { code: 'nsit-ibom', name: 'Nsit Ibom', localities: ['Afaha Offiong', 'Asang', 'Mbaiso'] },
        { code: 'nsit-ubium', name: 'Nsit Ubium', localities: ['Ikole', 'Ndiya', 'Ubium'] },
        { code: 'obot-akara', name: 'Obot Akara', localities: ['Nto Edino', 'Ikot Mbang'] },
        { code: 'okobo', name: 'Okobo', localities: ['Okopedi', 'Amamong', 'Ekeya'] },
        { code: 'onna', name: 'Onna', localities: ['Abat', 'Awa', 'Oniong'] },
        { code: 'oron', name: 'Oron', localities: ['Oron Urban', 'Idua', 'Eyo Abasi'] },
        { code: 'oruk-anam', name: 'Oruk Anam', localities: ['Ikot Ibritam', 'Inen', 'QIC Abak'] },
        { code: 'udung-uko', name: 'Udung Uko', localities: ['Eyofin', 'Udung Uko Town'] },
        { code: 'ukanafun', name: 'Ukanafun', localities: ['Ikot Akpa Nkuk', 'Northern Afaha', 'Southern Afaha'] },
        { code: 'uruan', name: 'Uruan', localities: ['Idu', 'Adadia', 'Mbiaya Uruan'] },
        { code: 'urue-offong-oruko', name: 'Urue-Offong/Oruko', localities: ['Urue Offong', 'Oruko'] },
        { code: 'uyo', name: 'Uyo', localities: ['Uyo City Center', 'Ewet Housing', 'Shelter Afrique', 'Osongama Estate', 'Ikot Ekpene Road', 'Oron Road'] }
      ]
    },
    {
      code: 'anambra',
      name: 'Anambra',
      displayName: 'Anambra State',
      region: 'South East',
      lgas: [
        { code: 'aguata', name: 'Aguata', localities: ['Ekwulobia', 'Uga', 'Achina', 'Isuofia', 'Agulu Ezechukwu'] },
        { code: 'anambra-east', name: 'Anambra East', localities: ['Otuocha', 'Aguleri', 'Nsugbe', 'Umueri'] },
        { code: 'anambra-west', name: 'Anambra West', localities: ['Nzam', 'Anam', 'Igbedor'] },
        { code: 'anaocha', name: 'Anaocha', localities: ['Neni', 'Agulu (Lake)', 'Adazi-Nnukwu', 'Aguluzigbo'] },
        { code: 'awka-north', name: 'Awka North', localities: ['Achalla', 'Amansea', 'Ebenebe'] },
        { code: 'awka-south', name: 'Awka South', localities: ['Awka Main', 'Ifite Awka (UNIZIK)', 'Aroma', 'Amawbia', 'Nibo'] },
        { code: 'ayamelum', name: 'Ayamelum', localities: ['Anaku', 'Omor', 'Ifite Ogwari'] },
        { code: 'dunukofia', name: 'Dunukofia', localities: ['Ukpo', 'Ifitedunu', 'Umunachi'] },
        { code: 'ekwusigo', name: 'Ekwusigo', localities: ['Ozubulu', 'Oraifite', 'Ichi'] },
        { code: 'idemili-north', name: 'Idemili North', localities: ['Ogidi', 'Nkpor', 'Obosi', 'Uke', 'Abatete'] },
        { code: 'idemili-south', name: 'Idemili South', localities: ['Ojoto', 'Alor', 'Nnobi', 'Oba'] },
        { code: 'ihiala', name: 'Ihiala', localities: ['Ihiala Urban', 'Okija', 'Uli (COOU)', 'Amorka'] },
        { code: 'njikoka', name: 'Njikoka', localities: ['Abagana', 'Enugwu-Ukwu', 'Nawfia'] },
        { code: 'nnewi-north', name: 'Nnewi North', localities: ['Otolo Nnewi', 'Umudim', 'Nnewichi', 'Uruagu', 'Bank Road'] },
        { code: 'nnewi-south', name: 'Nnewi South', localities: ['Ukpor', 'Amichi', 'Osumenyi'] },
        { code: 'ogbaru', name: 'Ogbaru', localities: ['Atani', 'Okpoko', 'Odekpe'] },
        { code: 'onitsha-north', name: 'Onitsha North', localities: ['Main Market', 'GRA Onitsha', 'Woliwo', 'Inland Town'] },
        { code: 'onitsha-south', name: 'Onitsha South', localities: ['Fegge', 'Ochanja Market', 'Bridge Head'] },
        { code: 'orumba-north', name: 'Orumba North', localities: ['Ajalli', 'Oko (Federal Poly)', 'Ndikelionwu', 'Nanka'] },
        { code: 'orumba-south', name: 'Orumba South', localities: ['Umunze', 'Ihite', 'Nawfija'] },
        { code: 'oyi', name: 'Oyi', localities: ['Nteje', 'Awkuzu', 'Ogbunike (Cave)', 'Umunya'] }
      ]
    },
    {
      code: 'bauchi',
      name: 'Bauchi',
      displayName: 'Bauchi State',
      region: 'North East',
      lgas: [
        { code: 'alkaleri', name: 'Alkaleri', localities: ['Alkaleri Town', 'Yankari Reserve Area', 'Gwana'] },
        { code: 'bauchi', name: 'Bauchi', localities: ['Bauchi City', 'Yelwa (ATBU)', 'GRA Bauchi', 'Fadaman Mada', 'Kari'] },
        { code: 'bogoro', name: 'Bogoro', localities: ['Bogoro Town', 'Lusa', 'Gobbiya'] },
        { code: 'damban', name: 'Damban', localities: ['Damban Town', 'Garbun', 'Jalam'] },
        { code: 'darazo', name: 'Darazo', localities: ['Darazo Town', 'Sade', 'Wandi'] },
        { code: 'dass', name: 'Dass', localities: ['Dass Town', 'Bununu', 'Dot'] },
        { code: 'gamawa', name: 'Gamawa', localities: ['Gamawa Town', 'Gololo', 'Alagarno'] },
        { code: 'ganjuwa', name: 'Ganjuwa', localities: ['Kafin Madaki', 'Miya', 'Soro'] },
        { code: 'giade', name: 'Giade', localities: ['Giade Town', 'Chinkani', 'Doguwa'] },
        { code: 'itas-gadau', name: 'Itas/Gadau', localities: ['Itas Town', 'Gadau (BASUG)', 'Buzawa'] },
        { code: 'jamaare', name: 'Jama\'are', localities: ['Jama\'are Town', 'Hanafun', 'Galdimari'] },
        { code: 'katagum', name: 'Katagum', localities: ['Azare', 'Chinade', 'Madangala'] },
        { code: 'kirfi', name: 'Kirfi', localities: ['Cheledi', 'Kirfi Town', 'Bara'] },
        { code: 'misau', name: 'Misau', localities: ['Misau Town', 'Akuyam', 'Zindi'] },
        { code: 'ningi', name: 'Ningi', localities: ['Ningi Town', 'Burra', 'Nasaru'] },
        { code: 'shira', name: 'Shira', localities: ['Yana', 'Shira Town', 'Disina'] },
        { code: 'tafawa-balewa', name: 'Tafawa Balewa', localities: ['Tafawa Balewa Town', 'Bununu', 'Lere'] },
        { code: 'toro', name: 'Toro', localities: ['Toro Town', 'Tilden Fulani', 'Gumau', 'Rishi'] },
        { code: 'warji', name: 'Warji', localities: ['Warji Town', 'Bima', 'Tiyin'] },
        { code: 'zaki', name: 'Zaki', localities: ['Katagum Town', 'Sakwa', 'Mainari'] }
      ]
    },
    {
      code: 'bayelsa',
      name: 'Bayelsa',
      displayName: 'Bayelsa State',
      region: 'South South',
      lgas: [
        { code: 'brass', name: 'Brass', localities: ['Twon-Brass', 'Akassa', 'Liama'] },
        { code: 'ekeremor', name: 'Ekeremor', localities: ['Ekeremor Town', 'Peretorugbene', 'Aleibiri'] },
        { code: 'kolokuma-opokuma', name: 'Kolokuma/Opokuma', localities: ['Kaiama', 'Opokuma', 'Sampou'] },
        { code: 'nembe', name: 'Nembe', localities: ['Nembe City', 'Bassambiri', 'Ogbolomabiri'] },
        { code: 'ogbia', name: 'Ogbia', localities: ['Oloibiri', 'Ogbia Town', 'Kolo', 'Otueke'] },
        { code: 'sagbama', name: 'Sagbama', localities: ['Sagbama Town', 'Agbere', 'Toru-Orua'] },
        { code: 'southern-ijaw', name: 'Southern Ijaw', localities: ['Oporoma', 'Amassoma (NDU)', 'Ekowe', 'Peremabiri'] },
        { code: 'yenagoa', name: 'Yenagoa', localities: ['Yenagoa City', 'Swali', 'Kpansia', 'Biogbolo', 'Etegwe (Tombia Junction)', 'Amarata', 'Okaka'] }
      ]
    },
    {
      code: 'benue',
      name: 'Benue',
      displayName: 'Benue State',
      region: 'North Central',
      lgas: [
        { code: 'ado', name: 'Ado', localities: ['Igumale', 'Utonkon', 'Apa-Agila'] },
        { code: 'agatu', name: 'Agatu', localities: ['Obagaji', 'Ogbaulu', 'Oshigbudu'] },
        { code: 'apa', name: 'Apa', localities: ['Ugbokpo', 'Ikobi', 'Akpete'] },
        { code: 'buruku', name: 'Buruku', localities: ['Buruku Town', 'Binev', 'Mbaakura'] },
        { code: 'gboko', name: 'Gboko', localities: ['Gboko Main', 'Gboko South', 'Mkar', 'Rice Mill Area'] },
        { code: 'guma', name: 'Guma', localities: ['Gbajimba', 'Daudu', 'Agasha'] },
        { code: 'gwer-east', name: 'Gwer East', localities: ['Aliade', 'Ikpayongo', 'Mbaikkayenge'] },
        { code: 'gwer-west', name: 'Gwer West', localities: ['Naka', 'Tse-Agagbe', 'Mbachohon'] },
        { code: 'katsina-ala', name: 'Katsina-Ala', localities: ['Katsina-Ala Town', 'Tor Donga', 'Abaji'] },
        { code: 'konshisha', name: 'Konshisha', localities: ['Tse-Agberagba', 'Gungul', 'Ihugh'] },
        { code: 'kwande', name: 'Kwande', localities: ['Adikpo', 'Jato-Aka', 'Nanev'] },
        { code: 'logo', name: 'Logo', localities: ['Ugba', 'Anyiin', 'Ayilamo'] },
        { code: 'makurdi', name: 'Makurdi', localities: ['High Level', 'Wurukum', 'North Bank', 'Modern Market Area', 'Judges Quarters', 'Wadata'] },
        { code: 'obi', name: 'Obi', localities: ['Obarike-Ito', 'Ito', 'Adiko'] },
        { code: 'ogbadibo', name: 'Ogbadibo', localities: ['Otukpa', 'Orokam', 'Owukpa'] },
        { code: 'ohimini', name: 'Ohimini', localities: ['Idekpa', 'Ochobo', 'Onyagede'] },
        { code: 'oju', name: 'Oju', localities: ['Oju Town', 'Ainu', 'Ibilla'] },
        { code: 'okpokwu', name: 'Okpokwu', localities: ['Okpoga', 'Ugbokolo (Benue Poly)', 'Ichama'] },
        { code: 'otukpo', name: 'Otukpo', localities: ['Otukpo Urban', 'Akpa', 'Ugboju', 'Adoka'] },
        { code: 'tarka', name: 'Tarka', localities: ['Wannune', 'Mbaayo', 'Mbatie'] },
        { code: 'ukum', name: 'Ukum', localities: ['Sankera', 'Zaki Biam', 'Kyado'] },
        { code: 'ushongo', name: 'Ushongo', localities: ['Lessel', 'Ushongo Town', 'Mbawegh'] },
        { code: 'vandeikya', name: 'Vandeikya', localities: ['Vandeikya Town', 'Tsar', 'Mbagbera'] }
      ]
    },
    {
      code: 'borno',
      name: 'Borno',
      displayName: 'Borno State',
      region: 'North East',
      lgas: [
        { code: 'maiduguri', name: 'Maiduguri (MMC)', localities: ['Maiduguri City', 'GRA Maiduguri', 'Bulunkutu', 'Monday Market', 'Custom Area', 'Post Office'] },
        { code: 'jere', name: 'Jere', localities: ['Maimusari', 'University of Maiduguri (UNIMAID)', 'Gomari', 'Old Maiduguri', 'Khadamari'] },
        { code: 'biu', name: 'Biu', localities: ['Biu Town', 'Miringa', 'Galdimare'] },
        { code: 'bama', name: 'Bama', localities: ['Bama Town', 'Gulumba', 'Soye'] },
        { code: 'gwoza', name: 'Gwoza', localities: ['Gwoza Town', 'Pulka', 'Limankara'] },
        { code: 'damboa', name: 'Damboa', localities: ['Damboa Town', 'Azir', 'Gumsuri'] },
        { code: 'chibok', name: 'Chibok', localities: ['Chibok Town', 'Mbalala', 'Pemi'] },
        { code: 'hawul', name: 'Hawul', localities: ['Azare', 'Marama', 'Shaffa'] },
        { code: 'kaga', name: 'Kaga', localities: ['Benisheikh', 'Ngamdu', 'Mainok'] },
        { code: 'konduga', name: 'Konduga', localities: ['Konduga Town', 'Auno', 'Kawuri'] },
        { code: 'monguno', name: 'Monguno', localities: ['Monguno Town', 'Moyo', 'Kaguram'] },
        { code: 'ngala', name: 'Ngala', localities: ['Gamboru Ngala', 'Wulgo', 'Ngala Town'] }
      ]
    },
    {
      code: 'cross-river',
      name: 'Cross River',
      displayName: 'Cross River State',
      region: 'South South',
      lgas: [
        { code: 'abi', name: 'Abi', localities: ['Itigidi', 'Ugep border', 'Imabana'] },
        { code: 'akamkpa', name: 'Akamkpa', localities: ['Akamkpa Town', 'Awi', 'Uyanga'] },
        { code: 'akpabuyo', name: 'Akpabuyo', localities: ['Ikang', 'Atimbo', 'Ikot Nakanda'] },
        { code: 'bakassi', name: 'Bakassi', localities: ['Abana', 'Archibong', 'Atabong'] },
        { code: 'bekwarra', name: 'Bekwarra', localities: ['Abuochiche', 'Nyanya', 'Gabu'] },
        { code: 'biase', name: 'Biase', localities: ['Akpet Central', 'Umon', 'Erei'] },
        { code: 'boki', name: 'Boki', localities: ['Boje', 'Ikom border', 'Okundi'] },
        { code: 'calabar-municipal', name: 'Calabar Municipal', localities: ['State Housing Estate', 'Marian Road', 'Etta Agbor (UNICAL)', 'Federal Housing', 'Diamond Hill'] },
        { code: 'calabar-south', name: 'Calabar South', localities: ['Anantigha', 'Watt Market Area', 'Target Road', 'Mbukpa', 'CRUTECH/UNICROSS'] },
        { code: 'etung', name: 'Etung', localities: ['Effraya', 'Ikom border', 'Ajassor'] },
        { code: 'ikom', name: 'Ikom', localities: ['Ikom Urban', 'Four Corners', 'Okoja'] },
        { code: 'obanliku', name: 'Obanliku', localities: ['Sankwala', 'Obudu Mountain Resort Area', 'Bebi'] },
        { code: 'obubra', name: 'Obubra', localities: ['Obubra Town', 'Ofodua', 'Apiapum'] },
        { code: 'obudu', name: 'Obudu', localities: ['Obudu Urban', 'Begiading', 'Utugwang'] },
        { code: 'odukpani', name: 'Odukpani', localities: ['Odukpani Junction', 'Pamol', 'Creek Town'] },
        { code: 'ogoja', name: 'Ogoja', localities: ['Ogoja Urban', 'Igoli', 'Mbube'] },
        { code: 'yakuur', name: 'Yakuur', localities: ['Ugep', 'Mkpani', 'Ekori'] },
        { code: 'yala', name: 'Yala', localities: ['Okpoma', 'Okuku', 'Wanokom'] }
      ]
    },
    {
      code: 'delta',
      name: 'Delta',
      displayName: 'Delta State',
      region: 'South South',
      lgas: [
        { code: 'aniocha-north', name: 'Aniocha North', localities: ['Issele-Uku', 'Onicha-Ugbo', 'Idumuje-Ugboko'] },
        { code: 'aniocha-south', name: 'Aniocha South', localities: ['Ogwashi-Uku', 'Ubulu-Uku', 'Nsukwa'] },
        { code: 'bomadi', name: 'Bomadi', localities: ['Bomadi Town', 'Kpakiama', 'Ogriagbene'] },
        { code: 'burutu', name: 'Burutu', localities: ['Burutu Town', 'Kiagbodo', 'Forcados'] },
        { code: 'ethiope-east', name: 'Ethiope East', localities: ['Abraka (DELSU)', 'Isiokolo', 'Eku', 'Kokori'] },
        { code: 'ethiope-west', name: 'Ethiope West', localities: ['Oghara', 'Mosogar', 'Jesse'] },
        { code: 'ika-north-east', name: 'Ika North East', localities: ['Owa-Oyibu', 'Boji-Boji Owa', 'Ute-Okpu'] },
        { code: 'ika-south', name: 'Ika South', localities: ['Agbor', 'Boji-Boji Agbor', 'Abavo'] },
        { code: 'isoko-north', name: 'Isoko North', localities: ['Ozoro (Delta State Poly)', 'Ofagbe', 'Owhelogbo'] },
        { code: 'isoko-south', name: 'Isoko South', localities: ['Oleh (DELSU Law)', 'Aviara', 'Uzere'] },
        { code: 'ndokwa-east', name: 'Ndokwa East', localities: ['Aboh', 'Ashaka', 'Kwale border'] },
        { code: 'ndokwa-west', name: 'Ndokwa West', localities: ['Kwale (Obiaruku)', 'Utagba-Ogbe', 'Onicha-Ukwuani'] },
        { code: 'okpe', name: 'Okpe', localities: ['Orerokpe', 'Osubi (Airport)', 'Jeddo'] },
        { code: 'oshimili-north', name: 'Oshimili North', localities: ['Ibusa', 'Akwukwu-Igbo', 'Okpanam'] },
        { code: 'oshimili-south', name: 'Oshimili South', localities: ['Asaba Main', 'GRA Asaba', 'Cable Point', 'Nnebisi Road', 'Okwe'] },
        { code: 'patani', name: 'Patani', localities: ['Patani Town', 'Agoloma', 'Abari'] },
        { code: 'sapele', name: 'Sapele', localities: ['Sapele Urban', 'Amukpe', 'Ogodo Road', 'Boyo Road'] },
        { code: 'udu', name: 'Udu', localities: ['Udu Bridge Area', 'Ovwian', 'Aladja', 'Orhuwhorun'] },
        { code: 'ughelli-north', name: 'Ughelli North', localities: ['Ughelli Urban', 'Agbarho', 'Evwreni', 'Otovwodo'] },
        { code: 'ughelli-south', name: 'Ughelli South', localities: ['Otu-Jeremi', 'Effurun-Otor', 'Ewu'] },
        { code: 'ukwuani', name: 'Ukwuani', localities: ['Obiaruku', 'Umutu', 'Ebedei'] },
        { code: 'uvwie', name: 'Uvwie', localities: ['Effurun', 'PTI Road', 'Airport Road Effurun', 'Jakpa Road', 'Enerhen'] },
        { code: 'warri-north', name: 'Warri North', localities: ['Koko', 'Tebujor', 'Ogheye'] },
        { code: 'warri-south', name: 'Warri South', localities: ['Warri Main', 'Pessu', 'Ogunu', 'Edjeba', 'Ekpan border', 'Deco Road'] },
        { code: 'warri-south-west', name: 'Warri South West', localities: ['Ogbe-Ijoh', 'Escravos', 'Oporoza'] }
      ]
    },
    {
      code: 'ebonyi',
      name: 'Ebonyi',
      displayName: 'Ebonyi State',
      region: 'South East',
      lgas: [
        { code: 'abakaliki', name: 'Abakaliki', localities: ['Abakaliki Urban', 'Kpirikpiri', 'Mile 50', 'Ezza Road', 'CAS Campus'] },
        { code: 'afikpo-north', name: 'Afikpo North', localities: ['Afikpo Town', 'Oziza', 'Amuro', 'Egah'] },
        { code: 'afikpo-south', name: 'Afikpo South', localities: ['Nguzu Edda', 'Ebonyi Poly Area', 'Osunche'] },
        { code: 'ebonyi', name: 'Ebonyi', localities: ['Ugbodo', 'Nkaleke', 'Agba'] },
        { code: 'ezza-north', name: 'Ezza North', localities: ['Ebiaji', 'Umuoghara', 'Nkomoro'] },
        { code: 'ezza-south', name: 'Ezza South', localities: ['Onueke', 'Amana', 'Amudo'] },
        { code: 'ikwo', name: 'Ikwo', localities: ['Onuebonyi', 'AE-FUNAI Campus Area', 'Echialike'] },
        { code: 'ishielu', name: 'Ishielu', localities: ['Ezillo', 'Nkalagu', 'Nkalaha'] },
        { code: 'ivo', name: 'Ivo', localities: ['Ishiaha', 'Akaeze', 'Ngwogwo'] },
        { code: 'izzi', name: 'Izzi', localities: ['Iboko', 'Ndembia', 'Ndieze'] },
        { code: 'ohaozara', name: 'Ohaozara', localities: ['Obiozara', 'Uburu', 'Okposi'] },
        { code: 'ohaukwu', name: 'Ohaukwu', localities: ['Ezzamgbo', 'Effium', 'Ngbo'] },
        { code: 'onicha', name: 'Onicha', localities: ['Isu', 'Onicha Igboeze', 'Abaomege'] }
      ]
    },
    {
      code: 'edo',
      name: 'Edo',
      displayName: 'Edo State',
      region: 'South South',
      lgas: [
        { code: 'egor', name: 'Egor', localities: ['Ugbowo (UNIBEN)', 'Siluko Road', 'Textile Mill Road', 'Ogida', 'Uselu'] },
        { code: 'ikpoba-okha', name: 'Ikpoba-Okha', localities: ['Ikpoba Hill', 'Upper Sakponba', 'Aduwawa', 'Ologbo', 'Ramah Park'] },
        { code: 'oredo', name: 'Oredo', localities: ['Benin City GRA', 'Ring Road (King Square)', 'Airport Road Benin', 'Sapele Road', 'Boundary Road', 'Ekenwan Road'] },
        { code: 'esan-central', name: 'Esan Central', localities: ['Irrua (ISTH)', 'Ewu', 'Opoji'] },
        { code: 'esan-north-east', name: 'Esan North-East', localities: ['Uromi Urban', 'Amedokhian', 'Uzea'] },
        { code: 'esan-west', name: 'Esan West', localities: ['Ekpoma (AAU)', 'Iruekpen', 'Eguare'] },
        { code: 'etsako-west', name: 'Etsako West', localities: ['Auchi (Federal Poly)', 'Jattu', 'Aviele'] },
        { code: 'etsako-central', name: 'Etsako Central', localities: ['Fugar', 'Ekperi', 'Iraokhor'] },
        { code: 'etsako-east', name: 'Etsako East', localities: ['Agenebode', 'Okpella (Cement)', 'Weppa'] },
        { code: 'akoko-edo', name: 'Akoko-Edo', localities: ['Igarra', 'Ibillo', 'Ososo'] },
        { code: 'ovia-north-east', name: 'Ovia North-East', localities: ['Okada (Igbinedion Univ)', 'Isiohor', 'Oluku Junction'] },
        { code: 'ovia-south-west', name: 'Ovia South-West', localities: ['Iguobazuwa', 'Nikorogha', 'Gelegele'] },
        { code: 'esan-south-east', name: 'Esan South-East', localities: ['Ubiaja', 'Ilushi', 'Ewohimi'] },
        { code: 'igueben', name: 'Igueben', localities: ['Igueben Town', 'Amahor', 'Ewossa'] },
        { code: 'owan-east', name: 'Owan East', localities: ['Afuze', 'Ihonvbe', 'Warrake'] },
        { code: 'owan-west', name: 'Owan West', localities: ['Sabongidda-Ora', 'Ozalla', 'Sobe'] },
        { code: 'uhunmwonde', name: 'Uhunmwonde', localities: ['Ehor', 'Oluku', 'Irhirhi'] },
        { code: 'orhionmwon', name: 'Orhionmwon', localities: ['Abudu', 'Ugo', 'Uronigbe'] }
      ]
    },
    {
      code: 'ekiti',
      name: 'Ekiti',
      displayName: 'Ekiti State',
      region: 'South West',
      lgas: [
        { code: 'ado-ekiti', name: 'Ado-Ekiti', localities: ['Ado-Ekiti Urban', 'GRA Ado', 'Ajilosun', 'Basiri', 'Okesa', 'Fajuyi Park Area', 'EKSU Area'] },
        { code: 'ikere', name: 'Ikere', localities: ['Ikere-Ekiti Urban', 'Odo-Oja', 'Afao'] },
        { code: 'oye', name: 'Oye', localities: ['Oye-Ekiti (FUOYE)', 'Ilumoba', 'Ayegbaju'] },
        { code: 'ijero', name: 'Ijero', localities: ['Ijero-Ekiti', 'Ipoti', 'Ikoro'] },
        { code: 'ikole', name: 'Ikole', localities: ['Ikole-Ekiti', 'Ayedun', 'Odo Ayedun'] },
        { code: 'ido-osi', name: 'Ido-Osi', localities: ['Ido-Ekiti', 'Ifaki-Ekiti', 'Usi-Ekiti'] },
        { code: 'efon', name: 'Efon', localities: ['Efon-Alaaye', 'Iwaji', 'Alan'] }
      ]
    },
    {
      code: 'enugu',
      name: 'Enugu',
      displayName: 'Enugu State',
      region: 'South East',
      lgas: [
        { code: 'enugu-east', name: 'Enugu East', localities: ['Trans-Ekulu', 'Abakpa Nike', 'Emene Industrial', 'Nowas', 'Federal Housing Nike'] },
        { code: 'enugu-north', name: 'Enugu North', localities: ['Independence Layout', 'New Haven', 'Ogui Road', 'GRA Enugu', 'Coal Camp', 'Polo Park Area'] },
        { code: 'enugu-south', name: 'Enugu South', localities: ['Achara Layout', 'Uwani', 'Gariki Awkunanaw', 'Maryland Enugu', 'Amechi'] },
        { code: 'nsukka', name: 'Nsukka', localities: ['Nsukka Urban', 'UNN Campus Area', 'Ofulonu', 'Eha-Alumona', 'Opi Junction'] },
        { code: 'oji-river', name: 'Oji River', localities: ['Oji Urban', 'Achi', 'Inyi', 'Ugwuoba'] },
        { code: 'udi', name: 'Udi', localities: ['9th Mile Corner', 'Udi Town', 'Ngwo', 'Eke'] },
        { code: 'nkanu-west', name: 'Nkanu West', localities: ['Agbani (ESUT Campus)', 'Akpugo', 'Ozalla'] }
      ]
    },
    {
      code: 'fct',
      name: 'Federal Capital Territory (Abuja)',
      displayName: 'Federal Capital Territory (FCT Abuja)',
      region: 'North Central',
      aliases: ['abuja', 'fct', 'federal capital territory', 'abuja fct'],
      lgas: [
        {
          code: 'amac',
          name: 'Abuja Municipal (AMAC)',
          localities: [
            'Wuse 2', 'Wuse 1', 'Maitama', 'Garki 1', 'Garki 2', 'Asokoro',
            'Gwarinpa', 'Jabi', 'Utako', 'Apo (Legislative & Mechanic Village)',
            'Guzape', 'Lokogoma', 'Lugbe (Airport Road)', 'Life Camp', 'Mabushi',
            'Katampe (Main & Extension)', 'Central Business District (CBD)', 'Durumi'
          ]
        },
        {
          code: 'bwari',
          name: 'Bwari',
          localities: [
            'Kubwa', 'Bwari Town (Law School)', 'Dutse Alhaji', 'Dawaki', 'Ushafa', 'Mpape'
          ]
        },
        {
          code: 'gwagwalada',
          name: 'Gwagwalada',
          localities: [
            'Gwagwalada Town', 'UniAbuja Main Campus', 'Teaching Hospital Area', 'Dobi', 'Kutunku'
          ]
        },
        {
          code: 'kuje',
          name: 'Kuje',
          localities: ['Kuje Urban', 'Chibiri', 'Gaube', 'Rubochi']
        },
        {
          code: 'kwali',
          name: 'Kwali',
          localities: ['Kwali Town', 'Shedda', 'Kilankwa', 'Yangoji']
        },
        {
          code: 'abaji',
          name: 'Abaji',
          localities: ['Abaji Town', 'Yaba', 'Nuku', 'Agyana']
        }
      ]
    },
    {
      code: 'gombe',
      name: 'Gombe',
      displayName: 'Gombe State',
      region: 'North East',
      lgas: [
        { code: 'gombe', name: 'Gombe', localities: ['Gombe City', 'GRA Gombe', 'Pantami', 'Jeka Da Fari', 'Tudun Wada Gombe'] },
        { code: 'akko', name: 'Akko', localities: ['Kumo', 'Pindiga', 'Gombe State Univ Area'] },
        { code: 'kaltungo', name: 'Kaltungo', localities: ['Kaltungo Town', 'Tula', 'Awak'] },
        { code: 'billiri', name: 'Billiri', localities: ['Billiri Town', 'Bare', 'Tangale'] }
      ]
    },
    {
      code: 'imo',
      name: 'Imo',
      displayName: 'Imo State',
      region: 'South East',
      lgas: [
        { code: 'owerri-municipal', name: 'Owerri Municipal', localities: ['Ikenegbu Layout', 'Aladinma', 'Douglas Road', 'Tetlow', 'Wetheral Road'] },
        { code: 'owerri-north', name: 'Owerri North', localities: ['Orji', 'Uratta', 'Toronto Junction', 'Naze', 'Egbu'] },
        { code: 'owerri-west', name: 'Owerri West', localities: ['World Bank Housing Owerri', 'Umuguma', 'Nekede (Federal Poly)', 'Ihiagwa (FUTO)'] },
        { code: 'orlu', name: 'Orlu', localities: ['Orlu Urban', 'Amaigbo border', 'Umuna', 'Owerri-Ebeiri'] },
        { code: 'okigwe', name: 'Okigwe', localities: ['Okigwe Urban', 'Ihimengwa', 'Umulolo'] },
        { code: 'mbaitoli', name: 'Mbaitoli', localities: ['Nwaorieubi', 'Ubommiri', 'Orodo', 'Ogwa'] },
        { code: 'oguta', name: 'Oguta', localities: ['Oguta Town', 'Oguta Lake Area', 'Izombe', 'Ejemekwuru'] }
      ]
    },
    {
      code: 'jigawa',
      name: 'Jigawa',
      displayName: 'Jigawa State',
      region: 'North West',
      lgas: [
        { code: 'dutse', name: 'Dutse', localities: ['Dutse City', 'FUD Campus Area', 'Takur', 'Garu', 'Fatara'] },
        { code: 'hadejia', name: 'Hadejia', localities: ['Hadejia Urban', 'Gagariya', 'Kasuwar Kofa'] },
        { code: 'gumel', name: 'Gumel', localities: ['Gumel Town', 'Danama', 'Zango'] },
        { code: 'kazaure', name: 'Kazaure', localities: ['Kazaure Town', 'Informatics Institute Area', 'Kanti'] },
        { code: 'ringim', name: 'Ringim', localities: ['Ringim Town', 'Sankara', 'Daba'] }
      ]
    },
    {
      code: 'kaduna',
      name: 'Kaduna',
      displayName: 'Kaduna State',
      region: 'North West',
      lgas: [
        { code: 'kaduna-north', name: 'Kaduna North', localities: ['Kaduna GRA', 'Malali', 'Kawo', 'Ungwan Rimi', 'Badarawa', 'Doka', 'Lugard Hall Area'] },
        { code: 'kaduna-south', name: 'Kaduna South', localities: ['Barnawa', 'Kakuri', 'Sabon Tasha', 'Television Garage Area', 'Tudun Wada Kaduna', 'Ungwan Sanusi'] },
        { code: 'chikun', name: 'Chikun', localities: ['Narayi', 'Kamazo', 'Gbagyi Villa', 'Kujama', 'Maraban Rido'] },
        { code: 'igabi', name: 'Igabi', localities: ['Rigasa', 'Maraban Jos', 'Mando', 'Afaka (NDA Area)'] },
        { code: 'zaria', name: 'Zaria', localities: ['Samaru (ABU Campus)', 'Zaria City', 'Tudun Wada Zaria', 'PZ Area', 'Kongo Campus Area'] },
        { code: 'sabon-gari', name: 'Sabon Gari', localities: ['Sabon Gari Zaria', 'Dogarawa', 'Hanwa', 'Basawa'] },
        { code: 'jemaa', name: 'Jema\'a', localities: ['Kafanchan Urban', 'Godogodo', 'Kagoro'] }
      ]
    },
    {
      code: 'kano',
      name: 'Kano',
      displayName: 'Kano State',
      region: 'North West',
      lgas: [
        { code: 'kano-municipal', name: 'Kano Municipal', localities: ['Kano City Center', 'Kofar Ruwa', 'Kofar Mata', 'Sabon Gari Kano', 'Kurmi Market', 'Fagge border'] },
        { code: 'fagge', name: 'Fagge', localities: ['Fagge Main', 'Wapa', 'Kwanar Dawaki', 'Yammata'] },
        { code: 'dala', name: 'Dala', localities: ['Dala Hill Area', 'Kabuga', 'Gwammaja', 'Bakinkasuwa'] },
        { code: 'gwale', name: 'Gwale', localities: ['Gwale Town', 'Dorayi (BUK Old Campus)', 'Goron Dutse', 'Kurna'] },
        { code: 'tarauni', name: 'Tarauni', localities: ['Gyadi-Gyadi', 'Hotoro', 'Unguwa Uku', 'Maiduguri Road Area', 'Court Road'] },
        { code: 'nasarawa', name: 'Nasarawa', localities: ['Bompai Industrial', 'Nassarawa GRA', 'Giginyu', 'Gama', 'Kaura Goje'] },
        { code: 'ungogo', name: 'Ungogo', localities: ['BUK New Campus Area', 'Rangaza', 'Rijiyar Zaki', 'Panisau'] },
        { code: 'kumbotso', name: 'Kumbotso', localities: ['Challawa Industrial', 'Panshekara', 'Mariri', 'Kumbotso Town'] }
      ]
    },
    {
      code: 'katsina',
      name: 'Katsina',
      displayName: 'Katsina State',
      region: 'North West',
      lgas: [
        { code: 'katsina', name: 'Katsina', localities: ['Katsina City', 'GRA Katsina', 'Kofar Kaura', 'Kofar Kwaya', 'Nagogo Road', 'UMYU Area'] },
        { code: 'daura', name: 'Daura', localities: ['Daura City', 'Kusugu Well Area', 'Sarkin Yara'] },
        { code: 'funtua', name: 'Funtua', localities: ['Funtua Urban', 'Dukke', 'BCGA Area'] },
        { code: 'malumfashi', name: 'Malumfashi', localities: ['Malumfashi Town', 'Yaba', 'Galadima'] }
      ]
    },
    {
      code: 'kebbi',
      name: 'Kebbi',
      displayName: 'Kebbi State',
      region: 'North West',
      lgas: [
        { code: 'birnin-kebbi', name: 'Birnin Kebbi', localities: ['Birnin Kebbi City', 'GRA Birnin Kebbi', 'Haliru Abdu Area', 'Badariya', 'Gesse'] },
        { code: 'argungu', name: 'Argungu', localities: ['Argungu Fishing Village', 'Kanta Museum Area', 'Gulma'] },
        { code: 'jega', name: 'Jega', localities: ['Jega Town', 'Kimba', 'Alelu'] },
        { code: 'yauri', name: 'Yauri', localities: ['Yauri Town', 'Yelwa', 'Zamare'] }
      ]
    },
    {
      code: 'kogi',
      name: 'Kogi',
      displayName: 'Kogi State',
      region: 'North Central',
      lgas: [
        { code: 'lokoja', name: 'Lokoja', localities: ['Lokoja Town', 'GRA Lokoja', 'Ganaja Village Area', 'Felele (FULokoja Area)', 'Confluence Beach Area', 'Patti'] },
        { code: 'okene', name: 'Okene', localities: ['Okene Town', 'Okengwe', 'Agassa', 'Idoji'] },
        { code: 'adavi', name: 'Adavi', localities: ['Ogaminana', 'Nagazi', 'Kuroko'] },
        { code: 'kabba-bunu', name: 'Kabba/Bunu', localities: ['Kabba Urban', 'Kolete', 'Iyah Gbede'] },
        { code: 'idah', name: 'Idah', localities: ['Idah Town', 'Inikpi', 'Ega'] },
        { code: 'ajaokuta', name: 'Ajaokuta', localities: ['Steel Town Area', 'Ajaokuta Native', 'Geregu'] }
      ]
    },
    {
      code: 'kwara',
      name: 'Kwara',
      displayName: 'Kwara State',
      region: 'North Central',
      lgas: [
        { code: 'ilorin-south', name: 'Ilorin South', localities: ['Fate Area', 'Tanke (Unilorin Road)', 'Tanke Oke-Odo', 'GRA Ilorin', 'Basin'] },
        { code: 'ilorin-west', name: 'Ilorin West', localities: ['Taiwo Isale', 'Taiwo Oke', 'Oja Oba', 'Pakata', 'Oloje', 'Adeta', 'Airport Road Ilorin'] },
        { code: 'ilorin-east', name: 'Ilorin East', localities: ['Gambari', 'Maraba', 'Sango Area', 'Kwara State Poly Area', 'Zango'] },
        { code: 'offa', name: 'Offa', localities: ['Offa Urban', 'Federal Poly Offa Area', 'Olofa Way', 'Awoniyi'] },
        { code: 'irepodun', name: 'Irepodun', localities: ['Omu-Aran', 'Landmark Univ Area', 'Oro'] }
      ]
    },
    {
      code: 'lagos',
      name: 'Lagos',
      displayName: 'Lagos State',
      region: 'South West',
      aliases: ['lagos', 'lasgidi', 'eko'],
      lgas: [
        {
          code: 'ikeja',
          name: 'Ikeja',
          localities: [
            'Ikeja GRA', 'Allen Avenue', 'Opebi', 'Computer Village', 'Agidingbi',
            'Alausa (Secretariat)', 'Maryland', 'Oregun', 'Adeniyi Jones',
            'Anifowoshe', 'Magodo Phase 1', 'Magodo Phase 2'
          ]
        },
        {
          code: 'eti-osa',
          name: 'Eti-Osa',
          localities: [
            'Lekki Phase 1', 'Lekki Phase 2', 'Victoria Island (VI)', 'Ikoyi',
            'Ajah', 'Sangotedo', 'Chevron Drive', 'Osapa London', 'Ikate Elegushi',
            'Agungi', 'Jakande', 'VGC (Victoria Garden City)', 'Oniru', 'Banana Island'
          ]
        },
        {
          code: 'surulere',
          name: 'Surulere',
          localities: [
            'Bode Thomas', 'Adeniran Ogunsanya', 'Ojuelegba', 'Aguda', 'Ijesha',
            'Itire', 'Lawanson', 'Masha', 'Stadium Area', 'Ogunlana Drive',
            'Dipo Olubi', 'Akerele', 'Shitta'
          ]
        },
        {
          code: 'alimosho',
          name: 'Alimosho',
          localities: [
            'Egbeda', 'Iyana Ipaja', 'Ikotun', 'Akowonjo', 'Igando', 'Ayobo',
            'Gowon Estate', 'Shasha', 'Idimu', 'Command', 'Abule Egba (Lagos end)'
          ]
        },
        {
          code: 'lagos-mainland',
          name: 'Lagos Mainland',
          localities: [
            'Yaba', 'Sabo (Tech Hub)', 'Akoka (UNILAG)', 'Ebute Metta (East & West)',
            'Jibowu', 'Iwaya', 'Alagomeji', 'Abule Ijesha', 'Oyingbo Market Area'
          ]
        },
        {
          code: 'kosofe',
          name: 'Kosofe',
          localities: [
            'Ogudu (GRA & Main)', 'Gbagada (Phase 1 & 2)', 'Ketu', 'Ojota',
            'Oworonshoki', 'Anthony Village', 'Alapere', 'Mile 12'
          ]
        },
        {
          code: 'oshodi-isolo',
          name: 'Oshodi-Isolo',
          localities: [
            'Isolo', 'Okota', 'Ajao Estate', 'Oshodi Main', 'Mafoluku',
            'Ilasamaja', 'Coker', 'Ago Palace Way'
          ]
        },
        {
          code: 'amuwo-odofin',
          name: 'Amuwo-Odofin',
          localities: [
            'Festac Town', 'Amuwo GRA', 'Mile 2', 'Kirikiri', 'Apple Junction Area'
          ]
        },
        {
          code: 'shomolu',
          name: 'Shomolu',
          localities: [
            'Shomolu Urban', 'Bariga', 'Pedro', 'Palmgrove', 'Onipanu', 'Fadeyi'
          ]
        },
        {
          code: 'lagos-island',
          name: 'Lagos Island',
          localities: [
            'Marina', 'Broad Street', 'Balogun Market', 'Idumota', 'TBS Area', 'Isale Eko'
          ]
        },
        {
          code: 'ikorodu',
          name: 'Ikorodu',
          localities: [
            'Ikorodu Town', 'Agric', 'Ipakodo', 'Benson', 'Ebute Ikorodu',
            'Ogolonto', 'Imota', 'Igbogbo', 'LASPOTECH / LASUSTECH Area'
          ]
        },
        {
          code: 'agege',
          name: 'Agege',
          localities: [
            'Pen Cinema Area', 'Dopemu', 'Orile Agege', 'Sango Agege', 'Oko Oba'
          ]
        },
        {
          code: 'ifako-ijaiye',
          name: 'Ifako-Ijaiye',
          localities: [
            'Iju Ishaga', 'Ogba', 'Abule Egba', 'Ifako', 'Fagba'
          ]
        },
        {
          code: 'apapa',
          name: 'Apapa',
          localities: [
            'Apapa GRA', 'Wharf Area', 'Liverpool', 'Ajegunle (Apapa boundary)'
          ]
        },
        {
          code: 'ibeju-lekki',
          name: 'Ibeju-Lekki',
          localities: [
            'Eleko', 'Dangote Refinery Zone', 'Bogije', 'Lakowe', 'Awoyaya', 'Eleranigbe'
          ]
        },
        {
          code: 'ojo',
          name: 'Ojo',
          localities: [
            'Alaba International Market', 'Ojo Town', 'LASU Campus Area', 'Iba', 'Okokomaiko'
          ]
        },
        {
          code: 'badagry',
          name: 'Badagry',
          localities: [
            'Badagry Town', 'Seme Border Area', 'Ajara', 'Apa', 'Aradagun'
          ]
        },
        {
          code: 'epe',
          name: 'Epe',
          localities: [
            'Epe Town', 'Alaro City Area', 'Poka', 'Noforija', 'Epe Marina'
          ]
        }
      ]
    },
    {
      code: 'nasarawa',
      name: 'Nasarawa',
      displayName: 'Nasarawa State',
      region: 'North Central',
      lgas: [
        { code: 'karu', name: 'Karu', localities: ['Mararaba (Abuja Border)', 'Nyanya Border', 'Masaka', 'New Karu', 'Ado'] },
        { code: 'lafia', name: 'Lafia', localities: ['Lafia City', 'GRA Lafia', 'Jos Road Area', 'Shendam Road', 'College of Agric Area'] },
        { code: 'keffi', name: 'Keffi', localities: ['Keffi Town', 'NSUK Campus Area', 'GRA Keffi', 'High Court Area'] },
        { code: 'akwanga', name: 'Akwanga', localities: ['Akwanga Town', 'College of Educ Area', 'Andaha'] }
      ]
    },
    {
      code: 'niger',
      name: 'Niger',
      displayName: 'Niger State',
      region: 'North Central',
      lgas: [
        { code: 'chanchaga', name: 'Chanchaga (Minna)', localities: ['Minna City Center', 'GRA Minna', 'Bosso (FUTMinna Old)', 'Tunga', 'Kpakungu', 'Maitumbi'] },
        { code: 'bosso', name: 'Bosso', localities: ['FUTMinna Gidan Kwano', 'Bosso Town', 'Maikunkele'] },
        { code: 'suleja', name: 'Suleja', localities: ['Suleja Town (Abuja Border)', 'Madalla', 'Kwamba', 'Maje', 'Zuba Border'] },
        { code: 'bida', name: 'Bida', localities: ['Bida Town', 'Federal Poly Bida Area', 'Dokodza', 'Banwuya'] },
        { code: 'kontagora', name: 'Kontagora', localities: ['Kontagora Town', 'GRA Kontagora', 'Federal College Area'] }
      ]
    },
    {
      code: 'ogun',
      name: 'Ogun',
      displayName: 'Ogun State',
      region: 'South West',
      lgas: [
        { code: 'abeokuta-south', name: 'Abeokuta South', localities: ['Ibikunle', 'Ake', 'Sapon', 'Itoku', 'Lafenwa', 'Kuto', 'Oke-Ilewo'] },
        { code: 'abeokuta-north', name: 'Abeokuta North', localities: ['Ibara Housing', 'GRA Ibara', 'FUNAAB Area', 'Camp', 'Adatan'] },
        { code: 'ado-odo-ota', name: 'Ado-Odo/Ota', localities: ['Ota Industrial', 'Sango Ota', 'Covenant Univ Area', 'Itele', 'Toll Gate Ota'] },
        { code: 'obafemi-owode', name: 'Obafemi Owode', localities: ['Mowe (Lagos Border)', 'Ibafo', 'Magboro', 'Asese', 'Redeemed Camp (RCCG)'] },
        { code: 'sagamu', name: 'Sagamu', localities: ['Sagamu Urban', 'Sabon Gari Sagamu', 'Olabisi Onabanjo Univ Teaching Hosp Area'] },
        { code: 'ijebu-ode', name: 'Ijebu Ode', localities: ['Ijebu Ode City', 'GRA Ijebu Ode', 'Molipa', 'Ibadan Road Area'] },
        { code: 'ifo', name: 'Ifo', localities: ['Ifo Town', 'Ojodu Abiodun (Lagos Border)', 'Akute', 'Alagbole', 'Lambe'] }
      ]
    },
    {
      code: 'ondo',
      name: 'Ondo',
      displayName: 'Ondo State',
      region: 'South West',
      lgas: [
        { code: 'akure-south', name: 'Akure South', localities: ['Akure City Center', 'Alagbaka (GRA & Govt Secretariat)', 'FUTA Area (Obakekere & Obanla)', 'Oja Oba', 'Oda Road', 'Ijapo Estate'] },
        { code: 'akure-north', name: 'Akure North', localities: ['Iju-Itaogbolu', 'Ogbese', 'Ilara-Mokin (Elizade Area)'] },
        { code: 'ondo-west', name: 'Ondo West', localities: ['Ondo Town', 'Yaba Ondo', 'UNIMED Area', 'Enuowa'] },
        { code: 'owo', name: 'Owo', localities: ['Owo Urban', 'Achievers Univ Area', 'Rufus Giwa Poly Area', 'Owatowegbe'] },
        { code: 'akoko-north-east', name: 'Akoko North-East', localities: ['Ikare-Akoko', 'Oyimo', 'Ekun'] }
      ]
    },
    {
      code: 'osun',
      name: 'Osun',
      displayName: 'Osun State',
      region: 'South West',
      lgas: [
        { code: 'osogbo', name: 'Osogbo', localities: ['Osogbo City Center', 'GRA Osogbo', 'Alekuwodo', 'Ogo-Oluwa', 'Olaiya Junction', 'Station Road', 'UNIOSUN Area'] },
        { code: 'ife-central', name: 'Ife Central', localities: ['Ile-Ife Town', 'OAU Campus Area', 'Mayfair Area', 'Lagere', 'Moore', 'Opa'] },
        { code: 'ife-east', name: 'Ife East', localities: ['Oke-Ogbo', 'Ilode', 'Modakeke'] },
        { code: 'ilesa-east', name: 'Ilesa East', localities: ['Ilesa Urban', 'Iroye', 'Bolorunduro'] },
        { code: 'ede-south', name: 'Ede South', localities: ['Ede Town', 'Federal Poly Ede Area', 'Redeemer\'s Univ Area'] }
      ]
    },
    {
      code: 'oyo',
      name: 'Oyo',
      displayName: 'Oyo State',
      region: 'South West',
      aliases: ['oyo', 'ibadan'],
      lgas: [
        {
          code: 'ibadan-north',
          name: 'Ibadan North',
          localities: [
            'Bodija (Old & New)', 'University of Ibadan (UI)', 'Agodi GRA',
            'Samonda', 'Mokola', 'Secretariat Agodi', 'Sango Ibadan', 'Ashimolowo'
          ]
        },
        {
          code: 'ibadan-south-west',
          name: 'Ibadan South-West',
          localities: [
            'Ring Road', 'Challenge', 'Jericho (GRA)', 'Oluyole Estate',
            'Oke-Ado', 'Liberty Stadium Area', 'Molete'
          ]
        },
        {
          code: 'ibadan-north-west',
          name: 'Ibadan North-West',
          localities: ['Dugbe (Commercial Hub)', 'Onireke', 'Adamasingba', 'Eleyele']
        },
        {
          code: 'ibadan-north-east',
          name: 'Ibadan North-East',
          localities: ['Iwo Road (Transport Hub)', 'Agodi Gate', 'Oje Market', 'Bashorun']
        },
        {
          code: 'ibadan-south-east',
          name: 'Ibadan South-East',
          localities: ['Mapo Hall Area', 'Orita Challenge', 'Felele', 'Scout Camp Area']
        },
        {
          code: 'oluyole',
          name: 'Oluyole',
          localities: ['Idi-Ayunre', 'Podo Industrial', 'Odo Ona Elewe', 'CRIN Area']
        },
        {
          code: 'egbeda',
          name: 'Egbeda',
          localities: ['Alakia (Airport Area)', 'Gbagi Market Area', 'Egbeda Town', 'Monatan']
        },
        {
          code: 'ogbomosho-north',
          name: 'Ogbomosho North',
          localities: ['LAUTECH Campus Area', 'Oja Igbo', 'Under G Area', 'Takie']
        },
        {
          code: 'oyo-east',
          name: 'Oyo East',
          localities: ['Oyo Town', 'Kosobo', 'Ajagba']
        }
      ]
    },
    {
      code: 'plateau',
      name: 'Plateau',
      displayName: 'Plateau State',
      region: 'North Central',
      lgas: [
        { code: 'jos-north', name: 'Jos North', localities: ['Jos City Center', 'Terminus Market Area', 'Tafawa Balewa Area', 'Naraguta (UniJos)', 'Tudun Wada Jos', 'Kabong'] },
        { code: 'jos-south', name: 'Jos South', localities: ['Rayfield (GRA)', 'Bukuru', 'Zawan', 'Kufang', 'National Institute Kuru (NIPSS)'] },
        { code: 'jos-east', name: 'Jos East', localities: ['Angware', 'Fobur', 'Federe'] },
        { code: 'pankshin', name: 'Pankshin', localities: ['Pankshin Town', 'Federal College of Educ Area', 'Lankan'] }
      ]
    },
    {
      code: 'rivers',
      name: 'Rivers',
      displayName: 'Rivers State',
      region: 'South South',
      aliases: ['rivers', 'port harcourt', 'phc', 'pitakwa'],
      lgas: [
        {
          code: 'port-harcourt-city',
          name: 'Port Harcourt City',
          localities: [
            'Old GRA', 'New GRA (Phases 1-4)', 'D-Line', 'Trans-Amadi Industrial',
            'Diobu (Mile 1, 2, 3)', 'Borikiri', 'Town (Creek Road)', 'Aggrey Road',
            'Waterlines', 'Garrison'
          ]
        },
        {
          code: 'obio-akpor',
          name: 'Obio/Akpor',
          localities: [
            'Rumuokoro', 'Rumuola', 'Rumuigbo', 'Choba (UniPort)', 'Woji',
            'Eliozu', 'Peter Odili Road', 'Rumuodara', 'Alakahia (UPTH)',
            'Eneka', 'Rumueme', 'Eligbolo'
          ]
        },
        {
          code: 'eleme',
          name: 'Eleme',
          localities: ['Onne (Port & Free Zone)', 'Aleto', 'Akpajo', 'Ebubu', 'Refinery Area']
        },
        {
          code: 'ikwerre',
          name: 'Ikwerre',
          localities: ['Isiokpo', 'Aluu', 'Airport Area (Omagwa)', 'Elele']
        },
        {
          code: 'oyigbo',
          name: 'Oyigbo',
          localities: ['Oyigbo Urban', 'Afam (Power Plant Area)', 'Komkom']
        },
        {
          code: 'bonny',
          name: 'Bonny',
          localities: ['Bonny Island (NLNG Area)', 'Finima', 'Coal Beach']
        }
      ]
    },
    {
      code: 'sokoto',
      name: 'Sokoto',
      displayName: 'Sokoto State',
      region: 'North West',
      lgas: [
        { code: 'sokoto-north', name: 'Sokoto North', localities: ['Sokoto City Center', 'Sultan Palace Area', 'GRA Sokoto', 'Marina', 'Waziri Area'] },
        { code: 'sokoto-south', name: 'Sokoto South', localities: ['Mabera', 'Gidan Dare', 'Old Market Area', 'Tudun Wada Sokoto'] },
        { code: 'wamako', name: 'Wamako', localities: ['UDUS Main Campus Area', 'Wamako Town', 'Arkilla', 'Kwalkwalawa'] }
      ]
    },
    {
      code: 'taraba',
      name: 'Taraba',
      displayName: 'Taraba State',
      region: 'North East',
      lgas: [
        { code: 'jalingo', name: 'Jalingo', localities: ['Jalingo City', 'GRA Jalingo', 'Mile 6', 'Nkpeti', 'TSU Campus Area', 'Main Market Area'] },
        { code: 'wukari', name: 'Wukari', localities: ['Wukari Urban', 'Federal Univ Wukari Area', 'Kente', 'Tsokundi'] },
        { code: 'bali', name: 'Bali', localities: ['Bali Town', 'Sunkani', 'Maihula'] }
      ]
    },
    {
      code: 'yobe',
      name: 'Yobe',
      displayName: 'Yobe State',
      region: 'North East',
      lgas: [
        { code: 'damaturu', name: 'Damaturu', localities: ['Damaturu City', 'GRA Damaturu', 'Nayi-Nawa', 'Pompomari', 'Yobe State Univ Area'] },
        { code: 'potiskum', name: 'Potiskum', localities: ['Potiskum Urban', 'Cattle Market Area', 'Dogo Nini', 'Bolewa'] },
        { code: 'nguru', name: 'Nguru', localities: ['Nguru Town', 'Hausari', 'Bulabulin'] }
      ]
    },
    {
      code: 'zamfara',
      name: 'Zamfara',
      displayName: 'Zamfara State',
      region: 'North West',
      lgas: [
        { code: 'gusau', name: 'Gusau', localities: ['Gusau City', 'GRA Gusau', 'Tudun Wada Gusau', 'Samaru Gusau', 'Federal Univ Gusau Area'] },
        { code: 'kaura-namoda', name: 'Kaura Namoda', localities: ['Kaura Namoda Town', 'Federal Poly Area', 'Kungurki'] },
        { code: 'talata-mafara', name: 'Talata Mafara', localities: ['Mafara Town', 'Abdu Gusau Poly Area', 'Garbadu'] }
      ]
    }
  ];

  // 2. LOOKUP & HIERARCHY UTILITY ENGINE
  const NigeriaLocations = {
    // Return complete array of states
    getStates() {
      return NIGERIA_LOCATIONS_DATA.map(st => ({
        code: st.code,
        name: st.name,
        displayName: st.displayName,
        region: st.region,
        lgaCount: (st.lgas || []).length
      }));
    },

    // Lookup state by code, name, or alias
    getState(query) {
      if (!query || typeof query !== 'string') return null;
      const q = query.trim().toLowerCase();
      return NIGERIA_LOCATIONS_DATA.find(st => {
        if (st.code === q || st.name.toLowerCase() === q || st.displayName.toLowerCase() === q) return true;
        if (st.displayName.toLowerCase().replace(/\s+state$/i, '') === q) return true;
        if (st.aliases && st.aliases.some(alias => alias.toLowerCase() === q)) return true;
        return false;
      }) || null;
    },

    // Get all LGAs for a given state
    getLgas(stateCodeOrName) {
      const stateObj = this.getState(stateCodeOrName);
      if (!stateObj || !Array.isArray(stateObj.lgas)) return [];
      return stateObj.lgas.map(l => ({
        code: l.code,
        name: l.name,
        stateCode: stateObj.code,
        stateName: stateObj.name,
        localityCount: (l.localities || []).length,
        localities: l.localities || []
      }));
    },

    // Get a specific LGA inside a state
    getLga(stateCodeOrName, lgaCodeOrName) {
      if (!lgaCodeOrName) return null;
      const lgas = this.getLgas(stateCodeOrName);
      const q = lgaCodeOrName.trim().toLowerCase();
      return lgas.find(l => l.code === q || l.name.toLowerCase() === q || l.name.toLowerCase().includes(q)) || null;
    },

    // Get all known localities for an LGA
    getLocalities(stateCodeOrName, lgaCodeOrName) {
      const lgaObj = this.getLga(stateCodeOrName, lgaCodeOrName);
      return lgaObj ? (lgaObj.localities || []) : [];
    },

    // Hierarchical autocomplete search across all Nigerian States, LGAs, and Localities
    searchLocations(query, limit = 8) {
      if (!query || typeof query !== 'string') return [];
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];

      const results = [];
      const seenKeys = new Set();

      // Priority 1: Exact / Prefix State Matches
      NIGERIA_LOCATIONS_DATA.forEach(st => {
        const stateMatch = st.code === q || st.name.toLowerCase() === q || st.name.toLowerCase().startsWith(q) || (st.aliases && st.aliases.some(a => a.toLowerCase() === q || a.toLowerCase().startsWith(q)));
        if (stateMatch) {
          const key = `state:${st.code}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            results.push({
              type: 'state',
              level: 'State',
              title: st.displayName,
              label: st.displayName,
              state: st.name,
              stateCode: st.code,
              lga: null,
              locality: null,
              formatted: st.displayName
            });
          }
        }
      });

      // Priority 2: LGA & Locality Matches
      NIGERIA_LOCATIONS_DATA.forEach(st => {
        (st.lgas || []).forEach(lga => {
          // LGA name match
          const lgaMatch = lga.name.toLowerCase().includes(q) || lga.code.includes(q);
          if (lgaMatch) {
            const key = `lga:${st.code}:${lga.code}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              results.push({
                type: 'lga',
                level: 'LGA / City',
                title: lga.name,
                label: `${lga.name}, ${st.name} State`,
                state: st.name,
                stateCode: st.code,
                lga: lga.name,
                locality: null,
                formatted: `${lga.name}, ${st.name}`
              });
            }
          }

          // Locality / Neighborhood match
          (lga.localities || []).forEach(loc => {
            if (loc.toLowerCase().includes(q)) {
              const key = `loc:${st.code}:${lga.code}:${loc.toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                results.push({
                  type: 'locality',
                  level: 'Neighborhood',
                  title: loc,
                  label: `${loc} (${lga.name}, ${st.name})`,
                  state: st.name,
                  stateCode: st.code,
                  lga: lga.name,
                  locality: loc,
                  formatted: `${loc}, ${lga.name}, ${st.name}`
                });
              }
            }
          });
        });
      });

      return results.slice(0, limit);
    },

    // Resolve freeform location string into structured hierarchy (State, LGA, Locality)
    resolveLocationHierarchy(rawLocation) {
      if (!rawLocation || typeof rawLocation !== 'string') {
        return { state: null, lga: null, locality: null, cleanLocation: '' };
      }

      const clean = rawLocation.replace(/, Nigeria$/i, '').trim();
      const parts = clean.split(',').map(s => s.trim()).filter(Boolean);

      // Check if matches known state
      const stateObj = this.getState(parts[parts.length - 1] || clean) || 
                       this.getState(parts[0]);

      if (stateObj) {
        const stateName = stateObj.name;
        let matchedLga = null;
        let matchedLoc = null;

        // Try to match LGA from remaining parts
        (stateObj.lgas || []).forEach(l => {
          for (const p of parts) {
            if (p.toLowerCase() === l.name.toLowerCase() || l.name.toLowerCase().includes(p.toLowerCase())) {
              matchedLga = l.name;
            }
            (l.localities || []).forEach(loc => {
              if (p.toLowerCase() === loc.toLowerCase() || loc.toLowerCase().includes(p.toLowerCase())) {
                matchedLoc = loc;
                matchedLga = l.name;
              }
            });
          }
        });

        return {
          state: stateName,
          lga: matchedLga,
          locality: matchedLoc,
          cleanLocation: clean
        };
      }

      // Fallback search
      const searches = this.searchLocations(clean, 1);
      if (searches.length > 0) {
        const top = searches[0];
        return {
          state: top.state,
          lga: top.lga,
          locality: top.locality,
          cleanLocation: top.formatted
        };
      }

      return {
        state: null,
        lga: null,
        locality: null,
        cleanLocation: clean
      };
    }
  };

  // Export to global scope & CommonJS
  global.NIGERIA_LOCATIONS_DATA = NIGERIA_LOCATIONS_DATA;
  global.NigeriaLocations = NigeriaLocations;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NIGERIA_LOCATIONS_DATA, NigeriaLocations };
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
