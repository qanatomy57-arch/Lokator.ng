// ============================================================================
// LOKATOR.NG — NIGERIAN SEARCH LANGUAGE & INTENT NORMALIZATION ENGINE
// Canonical Source of Truth for Nigerian Trade Slang, Pidgin Query Parsing,
// Spacing Variants, Proximity Intent, and Contextual Disambiguation
// ============================================================================

(function (global) {
  'use strict';

  // 1. CANONICAL NIGERIAN TRADE & SERVICE DICTIONARY
  const NIGERIAN_TRADE_ENTRIES = [
    // Tailoring, Fashion & Dressmaking
    {
      canonicalSlug: 'tailor',
      primaryTrade: 'Tailor & Fashion Designer',
      aliases: [
        'fashion designer', 'fashion-designer', 'fashiondesign', 'fashiondesigner',
        'tailor', 'tailors', 'tailoring', 'tailor man', 'tailorman', 'seamstress',
        'dressmaker', 'dress maker', 'dress-maker', 'cloth designer', 'agbada maker', 'agbada',
        'senator maker', 'senator wear', 'senator', 'native wear', 'aso ebi tailor', 'aso ebi',
        'clothes maker', 'sewing', 'alterations', 'bespoke tailor', 'bespoke suits'
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
        'ironing service', 'cloth washing', 'garment care'
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
        'auto rewire', 'car rewire', 'auto electrician', 'car electrician'
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
        'electrician', 'electricians', 'electrical', 'electrical engineer', 'wireman',
        'house wiring', 'conduit wiring', 'fault tracing', 'distribution board',
        'changeover switch', 'prepaid meter', 'electrical services'
      ],
      skills: ['Electrician', 'Generator Technician', 'House Conduit Wiring', 'Inverter & Solar Setup', 'Fault Detection']
    },
    // Air Conditioning & Refrigeration
    {
      canonicalSlug: 'ac-technician',
      primaryTrade: 'AC Technician & Fridge Specialist',
      aliases: [
        'ac person', 'ac technician', 'ac-technician', 'ac repairer', 'ac repair',
        'ac engineer', 'air conditioner', 'air condition', 'air condition repairer',
        'air conditioning', 'ac gas filling', 'ac servicing', 'ac maintenance',
        'ac', 'fridge', 'refrigerator', 'fridge person',
        'fridge engineer', 'fridge repairer', 'fridge technician', 'refrigerator repairer',
        'refrigerator technician', 'deep freezer repairer', 'cold room technician', 'hvac'
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
        'computer village engineer'
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
        'inverter installation', 'inverter repairer', 'battery storage', 'lithium battery'
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
        'water heater installer', 'water heater repairer', 'plumbing services'
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
        'aluminium fabricator', 'casement window', 'glass and aluminium'
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
        'roofing carpenter', 'kitchen cabinet', 'bed frame maker', 'woodwork'
      ],
      skills: ['Carpenter', 'Furniture Maker', 'Cabinet Making', 'Woodwork', 'Roofing Carpentry']
    },
    // Painting, Screeding & POP
    {
      canonicalSlug: 'painter',
      primaryTrade: 'Painter & POP Screeder',
      aliases: [
        'painter', 'painters', 'painting', 'house painter', 'wall painter',
        'screeder', 'screeding', 'wall screeding', 'pop installer',
        'pop ceiling', 'pop plasterer', 'wallpaper installer', '3d wall panel'
      ],
      skills: ['Painter', 'Wall Screeding', 'POP Ceiling Installation', 'House Painting', 'Wallpaper']
    },
    // Masonry, Bricklaying & Plastering
    {
      canonicalSlug: 'mason',
      primaryTrade: 'Mason & Bricklayer',
      aliases: [
        'mason', 'masons', 'masonry', 'bricklayer', 'brick layer', 'bricklaying',
        'block layer', 'block moulder', 'plasterer', 'concrete worker', 'building contractor'
      ],
      skills: ['Mason', 'Bricklayer', 'Plastering', 'Block Laying', 'Building Construction']
    },
    // Tiling, Flooring, Granite & Interlocking
    {
      canonicalSlug: 'tiler',
      primaryTrade: 'Tiler & Flooring Expert',
      aliases: [
        'tiler', 'tilers', 'tiling', 'floor tiler', 'wall tiler', 'tile layer',
        'granite installer', 'marble installer', 'interlocking stones', 'paving stones'
      ],
      skills: ['Tiler', 'Floor Tiling', 'Wall Tiling', 'Marble & Granite', 'Interlocking Stones']
    },
    // Barbering & Men's Grooming
    {
      canonicalSlug: 'barber',
      primaryTrade: 'Professional Barber',
      aliases: [
        'barber', 'barbers', 'barber man', 'barberman', 'barbing salon', 'hair cut',
        'haircut', 'fades', 'beard grooming', 'home service barber', 'celebrity barber'
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
        'hair braider', 'braider', 'wig maker', 'wig revamping', 'salon'
      ],
      skills: ['Nail Tech', 'Acrylic Nails', 'Pedicure & Manicure', 'Lash Technician', 'Hair Styling']
    },
    // Makeup & Gele Styling
    {
      canonicalSlug: 'makeup-artist',
      primaryTrade: 'Makeup Artist & Gele Tier',
      aliases: [
        'makeup artist', 'makeup-artist', 'make-up artist', 'makeup person',
        'mua', 'gele tier', 'gele artist', 'bridal makeup', 'glam makeup', 'editorial makeup'
      ],
      skills: ['Makeup Artist', 'Bridal Makeup', 'Gele Tying', 'Editorial Glam']
    },
    // Cleaning & Fumigation
    {
      canonicalSlug: 'cleaner',
      primaryTrade: 'Cleaning & Fumigation Specialist',
      aliases: [
        'cleaner', 'cleaners', 'cleaning', 'house cleaner', 'home cleaning',
        'deep clean', 'deep cleaning', 'fumigator', 'fumigation', 'pest control',
        'pest control person', 'post construction cleaning', 'office cleaner',
        'cleaning lady', 'housekeeping'
      ],
      skills: ['House Cleaning', 'Deep Cleaning', 'Fumigation & Pest Control', 'Office Cleaning']
    },
    // Catering & Baking
    {
      canonicalSlug: 'caterer',
      primaryTrade: 'Caterer & Baker',
      aliases: [
        'caterer', 'caterers', 'catering', 'event caterer', 'party jollof',
        'baker', 'baking', 'cake baker', 'small chops', 'pastry chef'
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
        'bike delivery', 'package delivery', 'house mover', 'relocation service'
      ],
      skills: ['Dispatch Rider', 'Same-Day Delivery', 'E-Commerce Dispatch', 'House Moving']
    },
    // Photography & Media
    {
      canonicalSlug: 'photographer',
      primaryTrade: 'Photographer & Videographer',
      aliases: [
        'photographer', 'photographers', 'photography', 'videographer', 'videography',
        'photo studio', 'wedding photographer', 'portrait photographer', 'drone pilot', 'video coverage'
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
        'intercom installer', 'access control installer'
      ],
      skills: ['CCTV Installation', 'POS Agent', 'Security Systems', 'Tech Support']
    }
  ];

  // 2. PIDGIN CONVERSATIONAL PATTERNS & PROXIMITY EXTRACTION
  const PROXIMITY_REGEX = /\b(?:near me|close to me|around me|around here|nearby|close by|wey dey close to me|wey dey around here|wey dey nearby|wey dey near me|dey near me|dey close to me)\b/i;

  const PIDGIN_STRIP_PATTERNS = [
    // Proximity phrases
    /\b(?:wey dey close to me|wey dey around here|wey dey nearby|wey dey near me|wey dey here|dey close to me|dey near me|close to me|around here|around me|near me|close by|nearby)\b/gi,
    
    // Capability / helper phrases
    /\b(?:person wey fit|who fit|who sabi|person wey sabi|someone wey fit|somebody wey fit|someone wey sabi|somebody wey sabi|someone to|person to|somebody to)\b/gi,
    /\b(?:wey fit fix|wey fit repair|wey fit do|wey fit sew|wey fit bake|wey fit paint|fit fix|fit repair|fit sew|fit do|fit paint)\b/gi,
    
    // Polite and informational inquiry openers
    /\b(?:abeg|biko|ejoo|plz|please help|help me|i need person for|need person for|person for|someone for|looking for person for|looking for someone to|looking for|i want to find|where i fit find|who dey do)\b/gi,
    
    // Standard conversational intros
    /\b(?:i need|where can i find|who can|somewhere to|a place to|how to find|best|top|for my|to fix|to repair|to build|to sew|to clean|services?)\b/gi,

    // Common action verbs after subject/capability
    /\b(?:to fix|to repair|fix|repair|repairs|servicing|to build|to sew|sew|to clean|cleaning|bake|paint)\b/gi,
    
    // Generic filler words: person, people, guy, man, lady
    /\b(?:person|people|guy|man|lady)\b/gi,
    
    // Faulty condition phrases
    /\b(?:my|is broken|is faulty|not working|not cooling|not blowing|dey misbehave|don spoil|don break|dey leak)\b/gi
  ];

  // Ambiguous Single-Word Keywords (Should NOT force a single trade unless contextualized)
  const AMBIGUOUS_STANDALONE_WORDS = new Set([
    'engineer', 'engineers', 'designer', 'designers',
    'person', 'people', 'repair', 'repairs', 'technician', 'technicians',
    'installer', 'installers', 'services', 'service', 'man', 'lady', 'woman',
    'fix', 'fixer', 'doctor', 'expert', 'pro', 'professional', 'master'
  ]);

  const STOP_WORDS = new Set([
    'my', 'a', 'an', 'the', 'to', 'in', 'at', 'and', 'or', 'of', 'for',
    'with', 'on', 'me', 'you', 'is', 'it', 'do', 'i', 'we', 'be', 'so',
    'can', 'who', 'somewhere', 'someone', 'please', 'help', 'need', 'find',
    'dey', 'wey', 'fit', 'sabi', 'na', 'don', 'abeg', 'here', 'now'
  ]);

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
     * Resolves Nigerian slang, compound phrase, or spacing variant into canonical trade entry
     * Examples:
     * - "fashion designer" -> tailor
     * - "drycleaner" -> laundry
     * - "panel beater" -> mechanic
     * - "generator mechanic" -> electrician
     * - "AC person" -> ac-technician
     * - "phone engineer" -> phone-repair
     * - "iron bender" -> welder
     *
     * @param {string} text
     * @returns {object|null} Matched trade entry or null
     */
    resolveTradeIntent(text) {
      if (!text || typeof text !== 'string') return null;
      let clean = text.toLowerCase().trim().replace(/_/g, ' ').replace(/-/g, ' ');
      const rawNoSpace = clean.replace(/\s+/g, '');

      // Guard: If query is purely an ambiguous standalone word (e.g. "engineer", "designer", "person"),
      // do NOT force a single trade mapping.
      if (AMBIGUOUS_STANDALONE_WORDS.has(clean)) {
        return null;
      }

      // 1. Direct alias match
      for (const entry of NIGERIAN_TRADE_ENTRIES) {
        for (const alias of entry.aliases) {
          const aliasClean = alias.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
          const aliasNoSpace = aliasClean.replace(/\s+/g, '');
          if (clean === aliasClean || rawNoSpace === aliasNoSpace) {
            return entry;
          }
        }
      }

      // 2. Normalize by removing trailing filler words (e.g. "generator person", "tailor person")
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

      // 3. Phrase containment match (e.g. "generator mechanic in Ikeja", "ac person around me")
      for (const entry of NIGERIAN_TRADE_ENTRIES) {
        for (const alias of entry.aliases) {
          if (alias.length >= 4 && !AMBIGUOUS_STANDALONE_WORDS.has(alias)) {
            const aliasClean = alias.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
            // Check word boundary match inside clean string
            const regex = new RegExp(`\\b${aliasClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(clean)) {
              return entry;
            }
          }
        }
      }

      return null;
    },

    /**
     * Deep Nigerian query intent parser.
     * Extracts:
     * - serviceIntent (canonical trade, slug, skills)
     * - locationHierarchy (State, LGA, Locality from Phase 10.12A)
     * - proximityIntent (near me / close to me flag)
     * - cleanQuery & tokens
     *
     * @param {string} rawQuery
     * @returns {{
     *   rawQuery: string,
     *   cleanQuery: string,
     *   serviceIntent: object|null,
     *   extractedLocation: string|null,
     *   locationHierarchy: object|null,
     *   isNearMe: boolean,
     *   tokens: string[]
     * }}
     */
    parseNigerianQuery(rawQuery) {
      if (!rawQuery || typeof rawQuery !== 'string') {
        return {
          rawQuery: '',
          cleanQuery: '',
          serviceIntent: null,
          extractedLocation: null,
          locationHierarchy: null,
          isNearMe: false,
          tokens: []
        };
      }

      const isNearMe = this.hasProximityIntent(rawQuery);
      let q = rawQuery.trim();
      let extractedLocation = null;
      let locationHierarchy = null;

      // 1. Check for location pattern: "in <location>", "at <location>", "around <location>", "inside <location>", "near <location>"
      const locMatch = q.match(/\s+(?:in|at|around|inside|near)\s+([a-zA-Z0-9\s-]+)$/i);
      if (locMatch && locMatch[1]) {
        const candidateLoc = locMatch[1].trim();
        const isNotLocation = /^(me|my|a|an|the|my area|here|now|house|home|flat|compound|close to me|around me|around here|repair|repairs|service|fixing|maintenance|cleaning|sewing)$/i.test(candidateLoc) || /^(my\s+|to\s+|for\s+)/i.test(candidateLoc);
        if (candidateLoc.length >= 2 && !isNotLocation) {
          extractedLocation = candidateLoc;
          q = q.substring(0, locMatch.index).trim();
        }
      }

      // 2. Resolve location using NigeriaLocations if available
      const LocEngine = (typeof NigeriaLocations !== 'undefined' ? NigeriaLocations : null) ||
                        (typeof globalThis !== 'undefined' ? globalThis.NigeriaLocations : null) ||
                        (typeof window !== 'undefined' ? window.NigeriaLocations : null) ||
                        (typeof global !== 'undefined' ? global.NigeriaLocations : null);

      if (LocEngine) {
        if (extractedLocation) {
          locationHierarchy = LocEngine.resolveLocationHierarchy(extractedLocation);
        } else {
          // Check if trailing or leading query contains a recognized Nigerian location (e.g. "plumber Awka", "mechanic Onitsha")
          const searchMatches = LocEngine.searchLocations(q, 1);
          if (searchMatches && searchMatches.length > 0) {
            const topMatch = searchMatches[0];
            const matchTitleLower = topMatch.title.toLowerCase();
            const qLower = q.toLowerCase();
            
            if (qLower === matchTitleLower || qLower.endsWith(' ' + matchTitleLower) || qLower.startsWith(matchTitleLower + ' ')) {
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
      }

      // 3. Strip Pidgin & conversational fillers
      let cleaned = q;
      for (const pattern of PIDGIN_STRIP_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
      }

      cleaned = cleaned
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 4. Resolve Trade Intent (checks raw q and cleaned)
      const serviceIntent = this.resolveTradeIntent(q) || this.resolveTradeIntent(cleaned);

      const rawTokens = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
      const tokens = rawTokens.filter(t => t.length > 1 && !STOP_WORDS.has(t));

      return {
        rawQuery: rawQuery.trim(),
        cleanQuery: cleaned.toLowerCase(),
        serviceIntent,
        extractedLocation,
        locationHierarchy,
        isNearMe,
        tokens
      };
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
