// ============================================================================
// LOKATOR.NG — NIGERIAN SEARCH LANGUAGE & INTENT NORMALIZATION ENGINE (search-language.js)
// Phase 10.20: Comprehensive Nigerian English, Pidgin, Location, Action Intent,
// Urgency, Budget, Disambiguation & Typo-Tolerant Intelligence
// ============================================================================

(function (global) {
  'use strict';

  // 1. CANONICAL NIGERIAN TRADE & SERVICE DICTIONARY (Mapping into MarketplaceTaxonomy)
  const NIGERIAN_TRADE_ENTRIES = [
    // Tailoring, Fashion & Dressmaking
    {
      canonicalSlug: 'tailor',
      primaryTrade: 'Tailor & Fashion Designer',
      aliases: [
        'fashion designer', 'fashion-designer', 'fashiondesign', 'fashiondesigner',
        'tailor', 'tailors', 'tailoring', 'tailor man', 'tailorman', 'seamstress',
        'dressmaker', 'dress maker', 'dress-maker', 'cloth designer', 'agbada maker', 'agbada',
        'senator maker', 'senator wear', 'senator', 'sew senator', 'native wear', 'aso ebi tailor', 'aso ebi',
        'clothes maker', 'sewing', 'alterations', 'bespoke tailor', 'bespoke suits', 'sew cloth',
        'sew clothes', 'who fit sew', 'tailor person', 'fashion person', 'traditional wear'
      ],
      skills: ['Tailor', 'Fashion Designer', 'Bespoke Tailoring', 'Dressmaking', 'Senator Wear', 'Agbada']
    },
    // Laundry & Dry Cleaning
    {
      canonicalSlug: 'laundry',
      primaryTrade: 'Laundry & Dry Cleaning',
      aliases: [
        'drycleaner', 'dry cleaner', 'dry-cleaner', 'drycleaning', 'dry cleaning',
        'dry clean', 'dry-clean', 'laundry', 'laundry man', 'laundryman', 'laundromat',
        'ironing service', 'cloth washing', 'garment care', 'wash and iron'
      ],
      skills: ['Dry Cleaning', 'Laundry Service', 'Garment Pressing', 'Stain Removal']
    },
    // Auto Mechanic, Panel Beating & Spray Painting
    {
      canonicalSlug: 'mechanic',
      primaryTrade: 'Auto Mechanic & Panel Beater',
      aliases: [
        'panel beater', 'panel-beater', 'panelbeater', 'panel beating', 'panel-beating',
        'car body repair', 'car body work', 'auto body shop', 'body repairer',
        'car spray painter', 'car painter', 'auto painter', 'spray painter', 'oven bake painter',
        'mechanic', 'auto mechanic', 'car mechanic', 'car repairer', 'motor mechanic',
        'engine repairer', 'brake repairer', 'gearbox specialist', 'suspension specialist',
        'vulcanizer', 'vulcaniser', 'tyre repairer', 'tire repairer', 'wheel balancing',
        'auto rewire', 'car rewire', 'auto electrician', 'car electrician', 'car fix', 'fix car'
      ],
      skills: ['Auto Mechanic', 'Panel Beater', 'Car Body Repair', 'Engine Overhaul', 'Auto Spray Painting', 'Auto Electrician']
    },
    // Generator & Electrical Services
    {
      canonicalSlug: 'electrician',
      primaryTrade: 'Electrician & Generator Technician',
      aliases: [
        'generator mechanic', 'generator-mechanic', 'gen mechanic', 'generator repairer',
        'generator technician', 'gen repairer', 'generator engineer', 'generator repair',
        'generator service', 'gen technician', 'mikano repairer', 'fix generator',
        'generator person', 'gen person', 'generator', 'generators',
        'electrician', 'electricians', 'electrician guy', 'electrical', 'electrical engineer', 'wireman',
        'wire house', 'wire my house', 'house wiring', 'conduit wiring', 'fault tracing', 'distribution board',
        'changeover switch', 'prepaid meter', 'prepaid meter installation', 'electrical services',
        'electrical work', 'electric work', 'light problem', 'socket problem', 'wiring problem',
        'nepa problem', 'fuse problem', 'wire compound', 'electrical repair'
      ],
      skills: ['Electrician', 'Generator Technician', 'House Conduit Wiring', 'Inverter & Solar Setup', 'Fault Detection']
    },
    // Air Conditioning & Refrigeration
    {
      canonicalSlug: 'ac-technician',
      primaryTrade: 'AC Technician & Fridge Specialist',
      aliases: [
        'ac person', 'ac guy', 'ac technician', 'ac-technician', 'ac repairer', 'ac repair',
        'ac engineer', 'air conditioner', 'air condition', 'air condition repairer',
        'air conditioning', 'ac gas filling', 'ac servicing', 'ac maintenance',
        'fix my ac', 'fix ac', 'repair ac', 'ac don spoil', 'ac not cooling', 'ac not blowing',
        'ac', 'fridge', 'refrigerator', 'fridge person', 'fridge guy',
        'fridge engineer', 'fridge repairer', 'fridge technician', 'fridge repair', 'fix fridge', 'repair fridge',
        'my fridge is not cold', 'fridge not cold', 'fridge not cooling',
        'refrigerator repairer', 'refrigerator technician', 'deep freezer repairer', 'deep freezer',
        'freezer repair', 'cold room technician', 'cold room guy', 'cold-room technician',
        'cold room', 'hvac', 'washing machine repair', 'washing machine repairer', 'washing machine technician',
        'washing machine'
      ],
      skills: ['AC Technician', 'Air Conditioning Repair', 'Refrigerator Repair', 'Fridge Servicing', 'Gas Refill']
    },
    // Phone, Laptop & Gadget Repair
    {
      canonicalSlug: 'phone-repair',
      primaryTrade: 'Phone & Gadget Technician',
      aliases: [
        'phone engineer', 'phone technician', 'phone repairer', 'phone repair',
        'phonerepair', 'phone-repair', 'fix phone', 'phone fixer', 'phone screen',
        'screen replacement', 'iphone repairer', 'samsung repairer', 'laptop repairer',
        'computer repairer', 'gadget technician', 'screen changer', 'broken screen',
        'computer village engineer', 'fix laptop', 'repair phone', 'repair laptop'
      ],
      skills: ['Phone Repair', 'Screen Replacement', 'Laptop Repair', 'Computer Technician', 'iPhone Repair']
    },
    // Solar, Inverter & Clean Energy
    {
      canonicalSlug: 'solar-installer',
      primaryTrade: 'Solar & Inverter Engineer',
      aliases: [
        'solar installer', 'solar-installer', 'solar engineer', 'solar technician',
        'solar panel', 'solar installation', 'solar power', 'inverter technician',
        'inverter installation', 'inverter repairer', 'battery storage', 'lithium battery',
        'install solar', 'fix inverter', 'solar system'
      ],
      skills: ['Solar Installer', 'Inverter Installation', 'Solar Panel Maintenance', 'Battery Storage']
    },
    // Plumbing, Borehole & Water Systems
    {
      canonicalSlug: 'plumber',
      primaryTrade: 'Plumber & Pipe Specialist',
      aliases: [
        'plumber', 'plumbers', 'plumbing', 'plumber man', 'plumberman', 'pipe fitter',
        'pipe fitting', 'water leak', 'burst pipe', 'drainage cleaner', 'soakaway unblocker',
        'borehole specialist', 'borehole repairer', 'pumping machine', 'pumping machine repairer',
        'water heater installer', 'water heater repairer', 'plumbing services',
        'pipe repair', 'leaking pipe', 'tap repair', 'water problem', 'toilet repair',
        'bathroom plumbing', 'fix pipe', 'fix tap', 'water pump'
      ],
      skills: ['Plumber', 'Pipe Fitting', 'Borehole Drilling', 'Pumping Machine', 'Drainage Unblocking']
    },
    // Welder, Metal & Aluminium Fabrication
    {
      canonicalSlug: 'welder',
      primaryTrade: 'Welder & Iron Fabricator',
      aliases: [
        'iron bender', 'iron-bender', 'ironbender', 'iron worker', 'ironwork',
        'welder', 'welders', 'welding', 'metal fabricator', 'metal fabrication',
        'gate fabricator', 'iron gate', 'burglar proof', 'tank stand', 'weld gate',
        'aluminium person', 'aluminium window person', 'aluminum person',
        'aluminium fabricator', 'casement window', 'glass and aluminium', 'weld iron'
      ],
      skills: ['Welder', 'Metal Fabrication', 'Iron Gates', 'Burglar Proof', 'Aluminium Fabrication']
    },
    // Carpentry, Furniture & Woodwork
    {
      canonicalSlug: 'carpenter',
      primaryTrade: 'Carpenter & Furniture Maker',
      aliases: [
        'carpenter', 'carpenters', 'carpentry', 'furniture maker', 'wood worker',
        'woodcrafter', 'cabinet maker', 'wardrobe maker', 'door installer',
        'roofing carpenter', 'kitchen cabinet', 'bed frame maker', 'woodwork',
        'fix door', 'fix chair', 'wood furniture'
      ],
      skills: ['Carpenter', 'Furniture Maker', 'Cabinet Making', 'Woodwork', 'Roofing Carpentry']
    },
    // Painting, Screeding & POP
    {
      canonicalSlug: 'painter',
      primaryTrade: 'Painter & POP Screeder',
      aliases: [
        'painter', 'painters', 'painting', 'house painter', 'wall painter',
        'paint my house', 'paint house', 'house painting', 'wall painting', 'repaint house',
        'screeder', 'screeding', 'wall screeding', 'pop installer',
        'pop ceiling', 'pop plasterer', 'wallpaper installer', '3d wall panel',
        'who fit paint', 'paint room', 'paint building', 'do pop', 'pop work', 'pop'
      ],
      skills: ['Painter', 'Wall Screeding', 'POP Ceiling Installation', 'House Painting', 'Wallpaper']
    },
    // Masonry, Bricklaying & Plastering
    {
      canonicalSlug: 'mason',
      primaryTrade: 'Mason & Bricklayer',
      aliases: [
        'mason', 'masons', 'masonry', 'bricklayer', 'brick layer', 'bricklaying',
        'block layer', 'block moulder', 'plasterer', 'concrete worker', 'building contractor',
        'build wall', 'lay blocks', 'plaster house'
      ],
      skills: ['Mason', 'Bricklayer', 'Plastering', 'Block Laying', 'Building Construction']
    },
    // Tiling, Flooring, Granite & Interlocking
    {
      canonicalSlug: 'tiler',
      primaryTrade: 'Tiler & Flooring Expert',
      aliases: [
        'tiler', 'tilers', 'tiling', 'floor tiler', 'wall tiler', 'tile layer',
        'granite installer', 'marble installer', 'interlocking stones', 'paving stones',
        'tile bathroom', 'tile compound', 'tile floor', 'lay tile', 'lay tiles', 'tiles'
      ],
      skills: ['Tiler', 'Floor Tiling', 'Wall Tiling', 'Marble & Granite', 'Interlocking Stones']
    },
    // Barbering & Men's Grooming
    {
      canonicalSlug: 'barber',
      primaryTrade: 'Professional Barber',
      aliases: [
        'barber', 'barbers', 'barber man', 'barberman', 'barbing salon', 'hair cut',
        'haircut', 'fades', 'beard grooming', 'home service barber', 'celebrity barber',
        'barb hair', 'cut hair'
      ],
      skills: ['Barber', 'Haircut', 'Fades', 'Beard Grooming', 'Home Service Barber']
    },
    // Beauty, Nails & Hair Styling
    {
      canonicalSlug: 'nail-technician',
      primaryTrade: 'Nail Technician & Beauty Specialist',
      aliases: [
        'nail tech', 'nail technician', 'nail-technician', 'nailtech', 'nails',
        'acrylic nails', 'gel nails', 'pedicure', 'manicure', 'lash technician',
        'lash tech', 'eyelash extension', 'hair dresser', 'hairdresser', 'hair stylist',
        'hair braider', 'braider', 'wig maker', 'wig revamping', 'salon',
        'braid hair', 'fix nails', 'fix lashes'
      ],
      skills: ['Nail Tech', 'Acrylic Nails', 'Pedicure & Manicure', 'Lash Technician', 'Hair Styling']
    },
    // Makeup & Gele Styling
    {
      canonicalSlug: 'makeup-artist',
      primaryTrade: 'Makeup Artist & Gele Tier',
      aliases: [
        'makeup artist', 'makeup-artist', 'make-up artist', 'makeup person',
        'mua', 'gele tier', 'gele artist', 'bridal makeup', 'glam makeup', 'editorial makeup',
        'tie gele', 'do makeup'
      ],
      skills: ['Makeup Artist', 'Bridal Makeup', 'Gele Tying', 'Editorial Glam']
    },
    // Cleaning & Fumigation
    {
      canonicalSlug: 'cleaner',
      primaryTrade: 'Cleaning & Fumigation Specialist',
      aliases: [
        'cleaner', 'cleaners', 'cleaning', 'house cleaner', 'home cleaning',
        'clean house', 'clean my house', 'deep clean', 'deep cleaning', 'fumigator', 'fumigation', 'pest control',
        'pest control person', 'post construction cleaning', 'office cleaner',
        'cleaning lady', 'housekeeping', 'clean compound'
      ],
      skills: ['House Cleaning', 'Deep Cleaning', 'Fumigation & Pest Control', 'Office Cleaning']
    },
    // Catering & Baking
    {
      canonicalSlug: 'caterer',
      primaryTrade: 'Caterer & Baker',
      aliases: [
        'caterer', 'caterers', 'catering', 'event caterer', 'party jollof',
        'baker', 'baking', 'cake baker', 'small chops', 'pastry chef',
        'bake cake', 'bake birthday cake', 'bake', 'cook food', 'party food'
      ],
      skills: ['Caterer', 'Party Jollof Catering', 'Cake Baking', 'Small Chops']
    },
    // Events & Entertainment
    {
      canonicalSlug: 'event-planner',
      primaryTrade: 'Event Planner & Decorator',
      aliases: [
        'event planner', 'event-planner', 'party planner', 'event decorator',
        'wedding planner', 'party rentals', 'ushering agency', 'dj', 'disc jockey', 'mc', 'hypeman'
      ],
      skills: ['Event Planner', 'Event Decoration', 'DJ & Sound Setup', 'Master of Ceremonies']
    },
    // Logistics & Dispatch
    {
      canonicalSlug: 'dispatch',
      primaryTrade: 'Express Dispatch Rider',
      aliases: [
        'dispatch', 'dispatch rider', 'delivery rider', 'courier', 'express delivery',
        'bike delivery', 'package delivery', 'house mover', 'relocation service',
        'send package', 'move house'
      ],
      skills: ['Dispatch Rider', 'Same-Day Delivery', 'E-Commerce Dispatch', 'House Moving']
    },
    // Photography & Media
    {
      canonicalSlug: 'photographer',
      primaryTrade: 'Photographer & Videographer',
      aliases: [
        'photographer', 'photographers', 'photography', 'videographer', 'videography',
        'photo studio', 'wedding photographer', 'portrait photographer', 'drone pilot', 'video coverage',
        'take picture', 'shoot video'
      ],
      skills: ['Photographer', 'Videographer', 'Studio Portraits', 'Wedding Photo Coverage']
    },
    // Tech & Agency (POS / CCTV)
    {
      canonicalSlug: 'phone-repair',
      primaryTrade: 'CCTV & POS Technology Specialist',
      aliases: [
        'pos agent', 'pos operator', 'pos merchant', 'pos terminal',
        'cctv installer', 'cctv technician', 'cctv engineer', 'security camera installer',
        'intercom installer', 'access control installer', 'install cctv'
      ],
      skills: ['CCTV Installation', 'POS Agent', 'Security Systems', 'Tech Support']
    }
  ];

  // 2. ACTION & SERVICE INTENT PATTERNS
  const ACTION_INTENT_MAP = [
    {
      intent: 'repair',
      regex: /\b(?:fix|repair|repairs|repairing|servicing|troubleshoot|don spoil|spoil|spoilt|broken|faulty|not working|not cooling|not cold|not blowing|dey leak|burst|leak|leakage|damage|damaged)\b/i
    },
    {
      intent: 'installation',
      regex: /\b(?:install|installation|installing|mount|mounting|wire|wiring|conduit|setup|set up|fitting|connection|connect)\b/i
    },
    {
      intent: 'maintenance',
      regex: /\b(?:maintain|maintenance|service|servicing|gas filling|gas refill|top up|overhaul|routine check)\b/i
    },
    {
      intent: 'cleaning',
      regex: /\b(?:clean|cleaning|wash|washing|deep clean|fumigate|fumigation|pest control|housekeeping)\b/i
    },
    {
      intent: 'construction',
      regex: /\b(?:build|building|construct|construction|erect|mould|moulding|masonry|block laying)\b/i
    },
    {
      intent: 'design',
      regex: /\b(?:design|designing|style|styling|decor|decoration|decorate|plan|planning)\b/i
    },
    {
      intent: 'sewing',
      regex: /\b(?:sew|sewing|stitch|stitching|cut|tailor|tailoring|alter|alteration|weave)\b/i
    },
    {
      intent: 'painting',
      regex: /\b(?:paint|painting|screed|screeding|repaint|spray paint|oven bake)\b/i
    }
  ];

  // 3. URGENCY & TIME INTENT PATTERNS
  const URGENCY_PATTERNS = [
    {
      level: 'immediate',
      label: 'Urgent / ASAP',
      regex: /\b(?:now|right now|asap|urgent|urgently|emergency|sharp sharp|quick|fast fast|immediate|immediately)\b/i
    },
    {
      level: 'today',
      label: 'Today',
      regex: /\b(?:today|this morning|this afternoon|this evening|tonight)\b/i
    },
    {
      level: 'tomorrow',
      label: 'Tomorrow',
      regex: /\b(?:tomorrow|next day)\b/i
    },
    {
      level: 'weekend',
      label: 'Weekend',
      regex: /\b(?:this weekend|weekend|on saturday|on sunday|saturday|sunday)\b/i
    }
  ];

  // 4. BUDGET & PRICE SENSITIVITY PATTERNS
  const BUDGET_SENSITIVE_REGEX = /\b(?:cheap|cheaper|affordable|low cost|not too expensive|no too cost|make e no too cost|e no too cost|on a budget|budget friendly|economical|student budget|manageable price|fair price|pocket friendly)\b/i;
  const BUDGET_AMOUNT_REGEX = /\b(?:under|below|less than|max|not more than|within)\s*(?:₦|ngn|naira)?\s*(\d+)(?:\s*(k|thousand|000))?\b/i;

  // 5. PROXIMITY INTENT REGEX
  const PROXIMITY_REGEX = /\b(?:near me|close to me|around me|around here|nearby|close by|wey dey close to me|wey dey around here|wey dey nearby|wey dey near me|dey near me|dey close to me)\b/i;

  // 6. PIDGIN & CONVERSATIONAL STRIPPING PATTERNS
  const PIDGIN_STRIP_PATTERNS = [
    // Proximity phrases
    /\b(?:wey dey close to me|wey dey around here|wey dey nearby|wey dey near me|wey dey here|dey close to me|dey near me|close to me|around here|around me|near me|close by|nearby)\b/gi,
    
    // Capability / helper phrases
    /\b(?:person wey fit|person wey sabi|person wey go|who fit|who sabi|who go|someone wey fit|somebody wey fit|someone wey sabi|somebody wey sabi|someone to|person to|somebody to|who can|who sabi)\b/gi,
    /\b(?:wey fit fix|wey fit repair|wey fit do|wey fit sew|wey fit bake|wey fit paint|fit fix|fit repair|fit sew|fit do|fit paint)\b/gi,
    
    // Polite and informational inquiry openers
    /\b(?:abeg find|abeg i need|abeg help me|abeg|biko find|biko|ejoo|plz|please help|help me find|help me|i need somebody to|i need someone to|i need person to|i need person wey|i need person for|need person for|person for|someone for|looking for person for|looking for someone to|looking for|i want to find|where i fit find|who dey do)\b/gi,
    
    // Standard conversational intros
    /\b(?:i need|where can i find|somewhere to|a place to|how to find|best|top|find me|find|services?)\b/gi,

    // Faulty condition phrases
    /\b(?:don spoil|don break|dey misbehave|is broken|is faulty|not working|not cooling|not cold|not blowing|dey leak)\b/gi,

    // Pidgin object pronouns & benefactives
    /\b(?:fix am|repair am|do am|sew am|paint am|am for|for me|for us|for my house|for my car|for my room)\b/gi,

    // Budget modifiers when stripped from trade core
    /\b(?:but make e no too cost|make e no too cost|e no too cost|not too expensive|on a budget|manageable price)\b/gi
  ];

  // Ambiguous Single-Word Keywords (Should NOT force a single trade unless contextualized)
  const AMBIGUOUS_STANDALONE_WORDS = new Set([
    'engineer', 'engineers', 'designer', 'designers',
    'person', 'people', 'repair', 'repairs', 'technician', 'technicians',
    'installer', 'installers', 'services', 'service', 'man', 'lady', 'woman',
    'fix', 'fixer', 'doctor', 'expert', 'pro', 'professional', 'master',
    'hello', 'hi', 'hey', 'help', 'something', 'somebody', 'someone',
    'what', 'who', 'how', 'lokator', 'lokatorng', 'good morning', 'good afternoon'
  ]);

  const STOP_WORDS = new Set([
    'my', 'a', 'an', 'the', 'to', 'in', 'at', 'and', 'or', 'of', 'for',
    'with', 'on', 'me', 'you', 'is', 'it', 'do', 'i', 'we', 'be', 'so',
    'can', 'who', 'somewhere', 'someone', 'somebody', 'please', 'help', 'need', 'find',
    'dey', 'wey', 'fit', 'sabi', 'na', 'don', 'abeg', 'here', 'now', 'am', 'but', 'make', 'e', 'no', 'too'
  ]);

  /**
   * Typo & Noise Normalizer
   * Handles trailing repeated letters (plumberrr -> plumber, warrri -> warri),
   * abbreviation dots (a.c -> ac, p.o.s -> pos), and punctuation.
   */
  function normalizeInputNoise(input) {
    if (!input || typeof input !== 'string') return '';
    let s = input.trim().toLowerCase();

    // 1. Remove abbreviations dots/slashes (e.g. a.c, a/c, a c -> ac)
    s = s.replace(/\ba[\.\/\s]c\b/gi, 'ac');
    s = s.replace(/\bp[\.\/\s]o[\.\/\s]s\b/gi, 'pos');
    s = s.replace(/\bc[\.\/\s]c[\.\/\s]t[\.\/\s]v\b/gi, 'cctv');

    // 2. Remove punctuation noise like !!!, ???, etc.
    s = s.replace(/[!?.,;:()\"\'\\[\]{}]/g, ' ');

    // 3. Compress multiple consecutive spaces
    s = s.replace(/\s+/g, ' ').trim();

    // 4. Reduce excessive repeating characters at end of words (e.g., plumberrr -> plumber, electrican -> electrician)
    s = s.replace(/([a-z])\1{2,}/gi, '$1');

    // 5. Common spelling typo corrections
    s = s.replace(/\belectrican\b/gi, 'electrician');
    s = s.replace(/\bphotograper\b/gi, 'photographer');
    s = s.replace(/\bmehanic\b/gi, 'mechanic');
    s = s.replace(/\bplumberr\b/gi, 'plumber');
    s = s.replace(/\bwarrri\b/gi, 'warri');
    s = s.replace(/\babeggg\b/gi, 'abeg');

    return s;
  }

  /**
   * Nigerian Search Language Engine
   */
  const NigeriaSearchLanguage = {
    tradeDictionary: NIGERIAN_TRADE_ENTRIES,
    ambiguousWords: AMBIGUOUS_STANDALONE_WORDS,

    /**
     * Checks if input contains proximity intent (e.g. "near me", "close to me", "wey dey around here")
     * @param {string} query
     * @returns {boolean}
     */
    hasProximityIntent(query) {
      if (!query || typeof query !== 'string') return false;
      return PROXIMITY_REGEX.test(query);
    },

    /**
     * Extracts Action / Service Intent (e.g. repair, installation, maintenance, cleaning, sewing)
     * @param {string} text
     * @returns {string|null}
     */
    extractActionIntent(text) {
      if (!text || typeof text !== 'string') return null;
      for (const item of ACTION_INTENT_MAP) {
        if (item.regex.test(text)) {
          return item.intent;
        }
      }
      return null;
    },

    /**
     * Extracts Urgency & Time Intent (immediate, today, tomorrow, weekend)
     * @param {string} text
     * @returns {{ level: string, label: string }|null}
     */
    extractUrgencyIntent(text) {
      if (!text || typeof text !== 'string') return null;
      for (const item of URGENCY_PATTERNS) {
        if (item.regex.test(text)) {
          return { level: item.level, label: item.label };
        }
      }
      return null;
    },

    /**
     * Extracts Budget & Price Sensitivity Intent (cost-sensitive flag, max budget amount)
     * @param {string} text
     * @returns {{ isCostSensitive: boolean, maxBudget: number|null, label: string }|null}
     */
    extractBudgetIntent(text) {
      if (!text || typeof text !== 'string') return null;
      const isSensitive = BUDGET_SENSITIVE_REGEX.test(text);
      const amountMatch = text.match(BUDGET_AMOUNT_REGEX);
      let maxBudget = null;

      if (amountMatch) {
        let rawNum = parseInt(amountMatch[1], 10);
        const unit = (amountMatch[2] || '').toLowerCase();
        if (unit === 'k' || unit === 'thousand') {
          rawNum = rawNum * 1000;
        } else if (rawNum < 500) {
          // If user typed "under 50", interpret as 50,000 in Nigerian artisan context
          rawNum = rawNum * 1000;
        }
        maxBudget = rawNum;
      }

      if (isSensitive || maxBudget) {
        let label = 'Budget Conscious';
        if (maxBudget) {
          label = `Budget ≤ ₦${maxBudget.toLocaleString('en-NG')}`;
        } else if (isSensitive) {
          label = 'Affordable / Low-Cost Preferred';
        }
        return {
          isCostSensitive: true,
          maxBudget,
          label
        };
      }

      return null;
    },

    /**
     * Resolves Nigerian slang, compound phrase, or spacing variant into canonical trade entry
     * @param {string} text
     * @returns {object|null} Matched trade entry or null
     */
    resolveTradeIntent(text) {
      if (!text || typeof text !== 'string') return null;
      let clean = text.toLowerCase().trim().replace(/_/g, ' ').replace(/-/g, ' ');
      const rawNoSpace = clean.replace(/\s+/g, '');

      // Guard: If query is purely an ambiguous standalone word, do not force trade mapping.
      if (AMBIGUOUS_STANDALONE_WORDS.has(clean)) {
        return null;
      }

      // 1. Direct alias match (exact string or space-stripped match)
      for (const entry of NIGERIAN_TRADE_ENTRIES) {
        for (const alias of entry.aliases) {
          const aliasClean = alias.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
          const aliasNoSpace = aliasClean.replace(/\s+/g, '');
          if (clean === aliasClean || rawNoSpace === aliasNoSpace) {
            return entry;
          }
        }
      }

      // 2. Normalize by removing trailing filler words (e.g. "generator person", "tailor guy")
      const strippedClean = clean.replace(/\s+(?:person|people|man|lady|guy|near me|close to me|around me)$/i, '').trim();
      if (strippedClean && strippedClean !== clean && !AMBIGUOUS_STANDALONE_WORDS.has(strippedClean)) {
        for (const entry of NIGERIAN_TRADE_ENTRIES) {
          for (const alias of entry.aliases) {
            const aliasClean = alias.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
            if (strippedClean === aliasClean || strippedClean.replace(/\s+/g, '') === aliasClean.replace(/\s+/g, '')) {
              return entry;
            }
          }
        }
      }

      // 3. Multi-word phrase containment match (e.g. "generator mechanic in Ikeja", "paint my house", "wire house")
      // Sort aliases by length descending so longer compound phrases match first
      const sortedEntries = [];
      for (const entry of NIGERIAN_TRADE_ENTRIES) {
        for (const alias of entry.aliases) {
          sortedEntries.push({ entry, alias });
        }
      }
      sortedEntries.sort((a, b) => b.alias.length - a.alias.length);

      for (const item of sortedEntries) {
        const alias = item.alias;
        if (alias.length >= 2 && !AMBIGUOUS_STANDALONE_WORDS.has(alias)) {
          const aliasClean = alias.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
          const regex = new RegExp(`\\b${aliasClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(clean)) {
            return item.entry;
          }
        }
      }

      return null;
    },

    /**
     * Deep Nigerian natural-language & Pidgin query intent parser.
     * Extracts:
     * - serviceIntent (canonical trade, slug, skills)
     * - actionIntent (repair, installation, maintenance, cleaning, sewing, etc.)
     * - urgencyIntent (immediate, today, tomorrow, weekend)
     * - budgetIntent (isCostSensitive, maxBudget)
     * - locationHierarchy (State, LGA, Locality)
     * - isNearMe (proximity flag)
     * - confidence (HIGH, MEDIUM, LOW, UNKNOWN)
     * - cleanQuery & tokens
     *
     * @param {string} rawQuery
     * @returns {{
     *   rawQuery: string,
     *   cleanQuery: string,
     *   serviceIntent: object|null,
     *   actionIntent: string|null,
     *   urgencyIntent: object|null,
     *   budgetIntent: object|null,
     *   extractedLocation: string|null,
     *   locationHierarchy: object|null,
     *   isNearMe: boolean,
     *   confidence: string,
     *   tokens: string[]
     * }}
     */
    parseNigerianQuery(rawQuery) {
      if (!rawQuery || typeof rawQuery !== 'string') {
        return {
          rawQuery: '',
          cleanQuery: '',
          serviceIntent: null,
          actionIntent: null,
          urgencyIntent: null,
          budgetIntent: null,
          extractedLocation: null,
          locationHierarchy: null,
          isNearMe: false,
          confidence: 'UNKNOWN',
          tokens: []
        };
      }

      const rawTrimmed = rawQuery.trim();
      const normalizedQuery = normalizeInputNoise(rawTrimmed);

      // Check Proximity, Action, Urgency, and Budget from normalized query
      const isNearMe = this.hasProximityIntent(normalizedQuery);
      const actionIntent = this.extractActionIntent(normalizedQuery);
      const urgencyIntent = this.extractUrgencyIntent(normalizedQuery);
      const budgetIntent = this.extractBudgetIntent(normalizedQuery);

      let q = normalizedQuery;
      let extractedLocation = null;
      let locationHierarchy = null;

      const LocEngine = (typeof NigeriaLocations !== 'undefined' ? NigeriaLocations : null) ||
                        (typeof globalThis !== 'undefined' ? globalThis.NigeriaLocations : null) ||
                        (typeof window !== 'undefined' ? window.NigeriaLocations : null) ||
                        (typeof global !== 'undefined' ? global.NigeriaLocations : null);

      // 1. SMART LOCATION EXTRACTION
      // Check prepositions: "in <loc>", "at <loc>", "around <loc>", "inside <loc>", "near <loc>", "for <loc>"
      const locMatch = q.match(/\s+(?:in|at|around|inside|near|for)\s+([a-zA-Z0-9\s-]+)$/i);
      if (locMatch && locMatch[1]) {
        const candidateLoc = locMatch[1].trim();
        const prep = locMatch[0].trim().split(/\s+/)[0].toLowerCase();
        const isNotLocation = /^(me|us|my|a|an|the|my area|here|now|house|home|flat|compound|room|car|close to me|around me|around here|repair|repairs|service|fixing|maintenance|cleaning|sewing|bake|paint)$/i.test(candidateLoc) || /^(my\s+|to\s+|for\s+)/i.test(candidateLoc);

        if (candidateLoc.length >= 2 && !isNotLocation) {
          // If preposition is "for", verify candidate is a recognized Nigerian location or not a task clause
          if (prep === 'for') {
            if (LocEngine) {
              const testHierarchy = LocEngine.resolveLocationHierarchy(candidateLoc);
              if (testHierarchy && testHierarchy.state) {
                extractedLocation = candidateLoc;
                locationHierarchy = testHierarchy;
                q = q.substring(0, locMatch.index).trim();
              }
            } else {
              extractedLocation = candidateLoc;
              q = q.substring(0, locMatch.index).trim();
            }
          } else {
            extractedLocation = candidateLoc;
            q = q.substring(0, locMatch.index).trim();
            if (LocEngine) {
              locationHierarchy = LocEngine.resolveLocationHierarchy(extractedLocation);
            }
          }
        }
      }

      // If location wasn't extracted from preposition, search inside remaining query using NigeriaLocations
      if (LocEngine && !extractedLocation) {
        const searchMatches = LocEngine.searchLocations(q, 1);
        if (searchMatches && searchMatches.length > 0) {
          const topMatch = searchMatches[0];
          const matchTitleLower = topMatch.title.toLowerCase();
          const qLower = q.toLowerCase();
          
          if (qLower === matchTitleLower || qLower.endsWith(' ' + matchTitleLower) || qLower.startsWith(matchTitleLower + ' ') || qLower.includes(' ' + matchTitleLower + ' ')) {
            extractedLocation = topMatch.title;
            locationHierarchy = {
              state: topMatch.state,
              lga: topMatch.lga,
              locality: topMatch.locality,
              cleanLocation: topMatch.formatted
            };
            q = q.replace(new RegExp(`\\b${topMatch.title}\\b`, 'gi'), '').trim();
          }
        }
      }

      // 2. RESOLVE TRADE INTENT BEFORE STRIPPING
      // (Preserves multi-word intent phrases like "wire house", "paint my house", "fix my AC")
      let serviceIntent = this.resolveTradeIntent(rawTrimmed) || this.resolveTradeIntent(q);

      // 3. STRIP PIDGIN & CONVERSATIONAL FILLERS
      let cleaned = q;
      for (const pattern of PIDGIN_STRIP_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
      }

      cleaned = cleaned
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // If service intent wasn't found before, try on cleaned query
      if (!serviceIntent) {
        serviceIntent = this.resolveTradeIntent(cleaned);
      }

      // If cleanQuery is empty but serviceIntent is resolved, set cleanQuery to trade keyword
      if (!cleaned && serviceIntent) {
        cleaned = serviceIntent.canonicalSlug;
      }

      const rawTokens = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
      const tokens = rawTokens.filter(t => t.length > 1 && !STOP_WORDS.has(t));

      // 4. CONFIDENCE CLASSIFICATION
      let confidence = 'UNKNOWN';
      const cleanLower = cleaned.toLowerCase();
      const isQuestionOrGreeting = /^(?:what is|who is|who are|how to|where is|tell me about|good morning|good evening|good afternoon|hello|hi|hey|lokator|something|help)\b/i.test(normalizedQuery);

      if (AMBIGUOUS_STANDALONE_WORDS.has(cleanLower) || cleanLower === '' || isQuestionOrGreeting || cleanLower === 'something' || cleanLower === 'help') {
        confidence = 'LOW';
        serviceIntent = null; // Do not hallucinate trade on purely ambiguous input
      } else if (serviceIntent && (extractedLocation || actionIntent || isNearMe || tokens.length >= 1)) {
        confidence = 'HIGH';
      } else if (serviceIntent || tokens.length >= 2) {
        confidence = 'MEDIUM';
      } else if (tokens.length === 1) {
        confidence = 'LOW';
      }

      return {
        rawQuery: rawTrimmed,
        cleanQuery: cleaned.toLowerCase(),
        serviceIntent,
        actionIntent,
        urgencyIntent,
        budgetIntent,
        extractedLocation,
        locationHierarchy,
        isNearMe,
        confidence,
        tokens
      };
    },

    /**
     * Backward-compatible alias for parseNigerianQuery
     */
    parseQuery(rawQuery) {
      return this.parseNigerianQuery(rawQuery);
    }
  };

  // Expose globally
  global.NigeriaSearchLanguage = NigeriaSearchLanguage;
  if (typeof globalThis !== 'undefined') {
    globalThis.NigeriaSearchLanguage = NigeriaSearchLanguage;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NigeriaSearchLanguage };
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : this)));
