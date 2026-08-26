// ===== LOKATOR — CENTRALIZED SERVICE CATEGORIES MAPPING =====
// Single source of truth for category slugs, display names, search synonyms, and dropdown values.

(function (global) {
  'use strict';

  const SERVICE_CATEGORIES = [
    {
      id: 'electrician',
      slug: 'electrician',
      name: 'Electrician',
      displayName: 'Electrical Services',
      dropdownValue: 'Electrician',
      icon: '⚡',
      contextualLabel: 'ELECTRICAL SERVICES',
      promptText: 'Find trusted electricians near you.',
      ctaText: 'Find Electricians',
      heroStepIndex: 1,
      synonyms: [
        'electrician',
        'electricians',
        'electrical',
        'electrical services',
        'wiring',
        'house wiring',
        'generator',
        'generator repair',
        'generator repairer',
        'generator technician',
        'someone to fix my generator',
        'fix my generator',
        'fix my wiring',
        'rewiring',
        'conduit',
        'fault diagnosis',
        'circuit',
        'light fault',
        'electrical fault'
      ]
    },
    {
      id: 'plumber',
      slug: 'plumber',
      name: 'Plumber',
      displayName: 'Plumbing Services',
      dropdownValue: 'Plumber',
      icon: '🔧',
      contextualLabel: 'PLUMBING SERVICES',
      promptText: 'Find skilled plumbers near you.',
      ctaText: 'Find Plumbers',
      heroStepIndex: 2,
      synonyms: [
        'plumber',
        'plumbers',
        'plumbing',
        'plumbing services',
        'pipe',
        'pipes',
        'burst pipe',
        'drainage',
        'water heater',
        'pumping machine',
        'borehole',
        'leak',
        'soakaway',
        'bathroom fitting',
        'someone to fix my pipe',
        'fix my water heater',
        'fix my pumping machine',
        'plumbing repair',
        'water leak'
      ]
    },
    {
      id: 'nail-technician',
      slug: 'nail-technician',
      name: 'Nail Tech',
      displayName: 'Beauty & Nail Services',
      dropdownValue: 'Nail Tech',
      icon: '💅',
      contextualLabel: 'BEAUTY & NAIL SERVICES',
      promptText: 'Discover beauty professionals near you.',
      ctaText: 'Find Nail Technicians',
      heroStepIndex: 3,
      synonyms: [
        'nail-technician',
        'nail technician',
        'nail technicians',
        'nail tech',
        'nail techs',
        'nailtech',
        'nails',
        'beauty',
        'beauty & nail services',
        'beauty services',
        'pedicure',
        'manicure',
        'lashes',
        'acrylic',
        'gel nails',
        'esthetician',
        'fix my nails',
        'nail technician near me',
        'pedicure manicure',
        'acrylic nails'
      ]
    },
    {
      id: 'tailor',
      slug: 'tailor',
      name: 'Tailor',
      displayName: 'Fashion & Tailoring',
      dropdownValue: 'Tailor',
      icon: '🧵',
      contextualLabel: 'FASHION & TAILORING',
      promptText: 'Find skilled tailors near you.',
      ctaText: 'Find Tailors',
      heroStepIndex: 4,
      synonyms: [
        'tailor',
        'tailors',
        'tailoring',
        'fashion & tailoring',
        'fashion',
        'fashion designer',
        'agbada',
        'senator wear',
        'dressmaker',
        'sewing',
        'native wear',
        'alterations',
        'bespoke suits',
        'someone to sew my clothes',
        'sew my clothes',
        'make my agbada',
        'tailoring services',
        'bespoke tailor'
      ]
    },
    {
      id: 'mechanic',
      slug: 'mechanic',
      name: 'Mechanic',
      displayName: 'Auto Services',
      dropdownValue: 'Mechanic',
      icon: '🔩',
      contextualLabel: 'AUTO SERVICES',
      promptText: 'Connect with reliable mechanics near you.',
      ctaText: 'Find Mechanics',
      heroStepIndex: 5,
      synonyms: [
        'mechanic',
        'mechanics',
        'auto',
        'auto services',
        'auto mechanic',
        'car repair',
        'engine',
        'brake',
        'suspension',
        'computer diagnostics',
        'car',
        'roadside rescue',
        'my car is broken down',
        'car is broken down',
        'fix my car',
        'car breakdown',
        'engine repair',
        'car diagnostic'
      ]
    },
    {
      id: 'carpenter',
      slug: 'carpenter',
      name: 'Carpenter',
      displayName: 'Carpentry',
      dropdownValue: 'Carpenter',
      icon: '🪚',
      contextualLabel: 'CARPENTRY',
      promptText: 'Find skilled carpenters near you.',
      ctaText: 'Find Carpenters',
      heroStepIndex: 6,
      synonyms: [
        'carpenter',
        'carpenters',
        'carpentry',
        'carpentry & woodwork',
        'woodwork',
        'furniture',
        'cabinet',
        'wardrobe',
        'door repair',
        'hardwood',
        'roofing',
        'wood',
        'woodcrafter'
      ]
    },
    {
      id: 'cleaner',
      slug: 'cleaner',
      name: 'Cleaning',
      displayName: 'Cleaning Services',
      dropdownValue: 'Cleaning',
      icon: '✨',
      contextualLabel: 'CLEANING SERVICES',
      promptText: 'Find trusted cleaning professionals near you.',
      ctaText: 'Find Cleaners',
      heroStepIndex: 7,
      synonyms: [
        'cleaner',
        'cleaners',
        'cleaning',
        'cleaning services',
        'home & cleaning services',
        'housekeeping',
        'deep cleaning',
        'post-construction',
        'fumigation',
        'laundry',
        'clean',
        'home cleaning',
        'someone to clean my house',
        'clean my house',
        'home cleaner',
        'deep clean',
        'housekeeper',
        'house cleaning'
      ]
    },
    {
      id: 'barber',
      slug: 'barber',
      name: 'Barber',
      displayName: 'Barbers & Hair',
      dropdownValue: 'Barber',
      icon: '✂️',
      contextualLabel: 'BARBER SERVICES',
      promptText: 'Find skilled barbers near you.',
      ctaText: 'Find Barbers',
      heroStepIndex: null,
      synonyms: [
        'barber',
        'barbers',
        'haircut',
        'fades',
        'hair stylist',
        'beard grooming',
        'hair',
        'barbing salon',
        'celebrity barber',
        'give me a haircut',
        'haircut near me'
      ]
    },
    {
      id: 'painter',
      slug: 'painter',
      name: 'Painter',
      displayName: 'Painting & Screeding',
      dropdownValue: 'Painter',
      icon: '🎨',
      contextualLabel: 'PAINTING SERVICES',
      promptText: 'Find professional painters near you.',
      ctaText: 'Find Painters',
      heroStepIndex: null,
      synonyms: [
        'painter',
        'painters',
        'painting',
        'screeding',
        'pop',
        'pop ceiling',
        'pop installation',
        'wallpaper',
        'wall artist',
        'wall panels',
        'paint my house',
        'house painter'
      ]
    },
    {
      id: 'welder',
      slug: 'welder',
      name: 'Welder',
      displayName: 'Welding & Fabrication',
      dropdownValue: 'Welder',
      icon: '🔥',
      contextualLabel: 'WELDING SERVICES',
      promptText: 'Find metal welders and fabricators near you.',
      ctaText: 'Find Welders',
      heroStepIndex: null,
      synonyms: [
        'welder',
        'welders',
        'welding',
        'metal fabricator',
        'gates',
        'burglar proof',
        'iron work',
        'tank stands',
        'who can weld my gate',
        'someone to weld my gate',
        'weld my gate',
        'iron gate repair',
        'metal welding'
      ]
    },
    {
      id: 'phone-repair',
      slug: 'phone-repair',
      name: 'Phone Repair',
      displayName: 'Phone & Gadget Repair',
      dropdownValue: 'Phone Repair',
      icon: '📱',
      contextualLabel: 'GADGET REPAIR',
      promptText: 'Find phone and computer repairers near you.',
      ctaText: 'Find Phone Repairers',
      heroStepIndex: null,
      synonyms: [
        'phone-repair',
        'phone repair',
        'phonerepair',
        'laptop repair',
        'screen replacement',
        'gadget',
        'computer repair',
        'someone to repair my phone',
        'repair my phone',
        'fix my phone',
        'my phone is faulty',
        'phone is faulty',
        'phone technician',
        'phone engineer',
        'my screen is broken',
        'screen is broken',
        'fix my iphone',
        'fix my android',
        'phone repairer',
        'phone engineering',
        'faulty phone'
      ]
    },
    {
      id: 'caterer',
      slug: 'caterer',
      name: 'Caterer',
      displayName: 'Catering & Baking',
      dropdownValue: 'Caterer',
      icon: '🍽️',
      contextualLabel: 'CATERING SERVICES',
      promptText: 'Find trusted caterers and bakers near you.',
      ctaText: 'Find Caterers',
      heroStepIndex: null,
      synonyms: [
        'caterer',
        'caterers',
        'catering',
        'baker',
        'baking',
        'cake',
        'small chops',
        'party jollof',
        'event food',
        'pastry'
      ]
    },
    {
      id: 'photographer',
      slug: 'photographer',
      name: 'Photographer',
      displayName: 'Photography & Video',
      dropdownValue: 'Photographer',
      icon: '📸',
      contextualLabel: 'PHOTOGRAPHY',
      promptText: 'Find creative photographers near you.',
      ctaText: 'Find Photographers',
      heroStepIndex: null,
      synonyms: [
        'photographer',
        'photographers',
        'photography',
        'photoshoot',
        'videographer',
        'videography',
        'photo studio',
        'wedding photoshoot',
        'portrait',
        'camera'
      ]
    },
    {
      id: 'laundry',
      slug: 'laundry',
      name: 'Laundry',
      displayName: 'Laundry & Dry Cleaning',
      dropdownValue: 'Laundry',
      icon: '👔',
      contextualLabel: 'LAUNDRY SERVICES',
      promptText: 'Find dry cleaning and laundry services near you.',
      ctaText: 'Find Laundry Services',
      heroStepIndex: null,
      synonyms: [
        'laundry',
        'dry cleaning',
        'dry cleaner',
        'washing',
        'ironing'
      ]
    },
    {
      id: 'dispatch',
      slug: 'dispatch',
      name: 'Dispatch',
      displayName: 'Express Dispatch',
      dropdownValue: 'Dispatch',
      icon: '🏍️',
      contextualLabel: 'DISPATCH SERVICES',
      promptText: 'Find fast dispatch riders near you.',
      ctaText: 'Find Dispatch Riders',
      heroStepIndex: null,
      synonyms: [
        'dispatch',
        'dispatch rider',
        'courier',
        'delivery',
        'logistics',
        'parcel'
      ]
    },
    {
      id: 'solar-installer',
      slug: 'solar-installer',
      name: 'Solar Installer',
      displayName: 'Solar & Inverter Services',
      dropdownValue: 'Solar Installer',
      icon: '☀️',
      contextualLabel: 'SOLAR & INVERTER',
      promptText: 'Find certified solar and inverter engineers near you.',
      ctaText: 'Find Solar Installers',
      heroStepIndex: null,
      synonyms: [
        'solar-installer',
        'solar installer',
        'solar',
        'inverter',
        'solar engineer',
        'solar panel',
        'solar panel installation',
        'solar installation',
        'inverter technician',
        'inverter installation',
        'battery storage',
        'solar technician'
      ]
    },
    {
      id: 'ac-technician',
      slug: 'ac-technician',
      name: 'AC Technician',
      displayName: 'Air Conditioning & Refrigeration',
      dropdownValue: 'AC Technician',
      icon: '❄️',
      contextualLabel: 'AC & REFRIGERATION',
      promptText: 'Find expert AC technicians and fridge repairers.',
      ctaText: 'Find AC Techs',
      heroStepIndex: null,
      synonyms: [
        'ac-technician',
        'ac technician',
        'ac repair',
        'air condition',
        'air conditioning',
        'refrigerator',
        'fridge',
        'cold room',
        'hvac',
        'my ac is not cooling',
        'ac is not cooling',
        'fix my ac',
        'ac not blowing cold',
        'fridge repairer',
        'refrigerator repair',
        'air condition repair'
      ]
    },
    {
      id: 'mason',
      slug: 'mason',
      name: 'Mason',
      displayName: 'Masonry & Bricklaying',
      dropdownValue: 'Mason',
      icon: '🧱',
      contextualLabel: 'MASONRY SERVICES',
      promptText: 'Find experienced masons and bricklayers near you.',
      ctaText: 'Find Masons',
      heroStepIndex: null,
      synonyms: [
        'mason',
        'masons',
        'bricklayer',
        'bricklaying',
        'block layer',
        'plastering',
        'concrete',
        'building'
      ]
    },
    {
      id: 'tiler',
      slug: 'tiler',
      name: 'Tiler',
      displayName: 'Tiling & Flooring',
      dropdownValue: 'Tiler',
      icon: '🏛️',
      contextualLabel: 'TILING SERVICES',
      promptText: 'Find master tilers and flooring experts near you.',
      ctaText: 'Find Tilers',
      heroStepIndex: null,
      synonyms: [
        'tiler',
        'tilers',
        'tiling',
        'floor tiles',
        'wall tiles',
        'granite',
        'marble',
        'interlocking stones'
      ]
    },
    {
      id: 'makeup-artist',
      slug: 'makeup-artist',
      name: 'Makeup Artist',
      displayName: 'Makeup & Gele Styling',
      dropdownValue: 'Makeup Artist',
      icon: '💄',
      contextualLabel: 'MAKEUP & BEAUTY',
      promptText: 'Find creative makeup artists for bridal, events and shoots.',
      ctaText: 'Find Makeup Artists',
      heroStepIndex: null,
      synonyms: [
        'makeup-artist',
        'makeup artist',
        'makeup',
        'gele',
        'bridal makeup',
        'mua',
        'glam'
      ]
    },
    {
      id: 'event-planner',
      slug: 'event-planner',
      name: 'Event Planner',
      displayName: 'Event Planning & Decor',
      dropdownValue: 'Event Planner',
      icon: '🎉',
      contextualLabel: 'EVENT PLANNING',
      promptText: 'Find professional event planners and decorators.',
      ctaText: 'Find Event Planners',
      heroStepIndex: null,
      synonyms: [
        'event-planner',
        'event planner',
        'event planning',
        'event decorator',
        'party planner',
        'ushering'
      ]
    }
  ];

  // ===== CONTENT FILTERING & MODERATION ENGINE =====
  const BLOCKED_KEYWORDS = [
    'killer', 'assassin', 'assassination', 'murder', 'hitman',
    'kidnap', 'kidnapper', 'kidnapping', 'abduction',
    'fraud', 'scam', 'scammer', '419', 'yahoo', 'yahoo yahoo', 'money ritual', 'ritual',
    'hack', 'hacker', 'hacking', 'cracker', 'malware', 'virus', 'trojan', 'spyware',
    'weapon', 'weapons', 'gun', 'guns', 'firearm', 'firearms', 'pistol', 'rifle', 'ammo', 'ammunition', 'bomb', 'explosives',
    'drug', 'drugs', 'cocaine', 'heroin', 'weed', 'marijuana', 'narcotics', 'tramadol', 'codeine', 'meth',
    'stolen goods', 'stolen', 'fake document', 'fake documents', 'fake certificate', 'fake certificates', 'counterfeit', 'forgery',
    'prostitution', 'prostitute', 'escort', 'sex', 'nude', 'porn', 'adult service', 'adult entertainment',
    'illegal', 'money laundry', 'money laundering', 'organ harvesting', 'human parts',
    'blackmail', 'extortion', 'pirated', 'contraband'
  ];

  const ServiceModerator = {
    blockedKeywords: BLOCKED_KEYWORDS,

    /**
     * Validates a skill / service input string.
     * Rejects illegal, harmful, dangerous, or scam services.
     *
     * @param {string} skillText
     * @returns {{ valid: boolean, error?: string, blockedWord?: string, cleanName?: string }}
     */
    validateSkill(skillText) {
      if (!skillText || typeof skillText !== 'string') {
        return { valid: false, error: 'Skill name cannot be empty.' };
      }

      // 1. Remove all emojis and special decorative glyphs globally
      const clean = skillText.replace(/[\p{Emoji}\u200d\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
      if (clean.length < 2) {
        return { valid: false, error: 'Skill name must be at least 2 characters.' };
      }
      if (clean.length > 300) {
        return { valid: false, error: 'Skill text must be under 300 characters.' };
      }

      // If composite skill string (e.g. "Plumber & Electrician" or "Solar, AC"), validate each sub-token
      const tokens = clean.split(/[,&]/).map(t => t.trim()).filter(Boolean);
      for (const token of tokens) {
        if (token.length < 2) continue;
        const lower = token.toLowerCase();

        for (const word of BLOCKED_KEYWORDS) {
          // Strict word boundary regex: match whole word only to prevent false positives (e.g. "weeding", "ammonia")
          const regex = new RegExp('(^|[^a-zA-Z0-9])' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-zA-Z0-9])', 'i');
          if (regex.test(lower)) {
            return {
              valid: false,
              error: `Disallowed service keyword detected ("${word}"). Lokator only lists verified, legal artisan and trade services.`,
              blockedWord: word
            };
          }
        }
      }

      return {
        valid: true,
        cleanName: clean
      };
    },

    /**
     * Validates provider bio / description text against moderation blocklist.
     * Supports longer texts up to 1000 characters.
     *
     * @param {string} bioText
     * @returns {{ valid: boolean, error?: string, blockedWord?: string, cleanName?: string }}
     */
    validateBio(bioText) {
      if (!bioText || typeof bioText !== 'string') {
        return { valid: false, error: 'Bio text cannot be empty.' };
      }

      const clean = bioText.replace(/[\p{Emoji}\u200d\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
      if (clean.length < 5) {
        return { valid: false, error: 'Bio must be at least 5 characters.' };
      }
      if (clean.length > 1000) {
        return { valid: false, error: 'Bio text must be under 1000 characters.' };
      }

      const lower = clean.toLowerCase();
      for (const word of BLOCKED_KEYWORDS) {
        const regex = new RegExp('(^|[^a-zA-Z0-9])' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-zA-Z0-9])', 'i');
        if (regex.test(lower)) {
          return {
            valid: false,
            error: `Disallowed keyword detected ("${word}").`,
            blockedWord: word
          };
        }
      }

      return {
        valid: true,
        cleanName: clean
      };
    },

    /**
     * Validates a customer review or feedback comment.
     * Rejects profanity, abusive terms, extortion or prohibited content.
     */
    validateReview(reviewText) {
      if (!reviewText || typeof reviewText !== 'string') {
        return { valid: false, error: 'Review text cannot be empty.' };
      }
      const clean = reviewText.replace(/\s+/g, ' ').trim();
      if (clean.length < 3) {
        return { valid: false, error: 'Review must be at least 3 characters.' };
      }
      if (clean.length > 2000) {
        return { valid: false, error: 'Review must be under 2000 characters.' };
      }

      const lower = clean.toLowerCase();
      for (const word of BLOCKED_KEYWORDS) {
        const regex = new RegExp('(^|[^a-zA-Z0-9])' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-zA-Z0-9])', 'i');
        if (regex.test(lower)) {
          return {
            valid: false,
            error: `Disallowed keyword detected ("${word}"). Reviews must adhere to community safety guidelines.`,
            blockedWord: word
          };
        }
      }

      return { valid: true, cleanText: clean };
    },

    /**
     * Returns popular curated suggestion tags for UI chips.
     */
    getPopularSuggestions() {
      return [
        { name: 'Plumber', icon: '🔧' },
        { name: 'Electrician', icon: '⚡' },
        { name: 'Carpenter', icon: '🪚' },
        { name: 'Painter', icon: '🎨' },
        { name: 'Mechanic', icon: '🔩' },
        { name: 'AC Technician', icon: '❄️' },
        { name: 'Solar Installer', icon: '☀️' },
        { name: 'Mason', icon: '🧱' },
        { name: 'Tiler', icon: '🏛️' },
        { name: 'Tailor', icon: '🧵' },
        { name: 'Barber', icon: '✂️' },
        { name: 'Nail Technician', icon: '💅' },
        { name: 'Makeup Artist', icon: '💄' },
        { name: 'Cleaner', icon: '✨' },
        { name: 'Computer Repair', icon: '💻' },
        { name: 'Phone Repair', icon: '📱' }
      ];
    }
  };

  const CategoryMap = {
    categories: SERVICE_CATEGORIES,

    // Find by exact slug or ID
    getBySlug(slug) {
      if (!slug) return null;
      const normalized = String(slug).toLowerCase().trim().replace(/_/g, '-').replace(/\s+/g, '-');
      return SERVICE_CATEGORIES.find(c => c.slug === normalized || c.id === normalized) || null;
    },

    // Find by dropdown value
    getByDropdownValue(val) {
      if (!val) return null;
      return SERVICE_CATEGORIES.find(c => c.dropdownValue.toLowerCase() === String(val).toLowerCase()) || null;
    },

    // Resolve user input query (e.g. "plumber", "nail technician", "auto repair", "deep clean", "someone to repair my phone", "drycleaner", "fashion designer", "panel beater", "generator mechanic")
    resolveQuery(query) {
      if (!query) return null;
      const q = String(query).toLowerCase().trim();
      const slugified = q.replace(/_/g, '-').replace(/\s+/g, '-');

      // 1. Direct slug match
      const directSlug = this.getBySlug(slugified);
      if (directSlug) return directSlug;

      // 2. Nigerian Search Language intent resolution
      const LangEngine = (typeof NigeriaSearchLanguage !== 'undefined' ? NigeriaSearchLanguage : null) ||
                         (typeof globalThis !== 'undefined' ? globalThis.NigeriaSearchLanguage : null) ||
                         (typeof window !== 'undefined' ? window.NigeriaSearchLanguage : null) ||
                         (typeof global !== 'undefined' ? global.NigeriaSearchLanguage : null);
      if (LangEngine && LangEngine.resolveTradeIntent) {
        const tradeIntent = LangEngine.resolveTradeIntent(q);
        if (tradeIntent && tradeIntent.canonicalSlug) {
          const match = this.getBySlug(tradeIntent.canonicalSlug);
          if (match) return match;
        }
      }

      // 3. Direct name or displayName match
      const directName = SERVICE_CATEGORIES.find(c => 
        c.name.toLowerCase() === q ||
        c.displayName.toLowerCase() === q ||
        c.dropdownValue.toLowerCase() === q
      );
      if (directName) return directName;

      // 4. Synonym exact match
      const synonymMatch = SERVICE_CATEGORIES.find(c =>
        c.synonyms.some(syn => syn.toLowerCase() === q)
      );
      if (synonymMatch) return synonymMatch;

      // 5. Substring / keyword inclusion match
      const partialMatch = SERVICE_CATEGORIES.find(c =>
        c.synonyms.some(syn => q.includes(syn.toLowerCase()) || syn.toLowerCase().includes(q))
      );
      if (partialMatch) return partialMatch;

      // 6. Conversational intent stripping match
      const cleanIntent = q
        .replace(/\b(?:i need|where can i find|who can|looking for|someone to|somewhere to|a place to|how to find|best|top|near me|for my|to fix|to repair|to build|to sew|to clean|my|is broken|is faulty|not working|not cooling|down|wey dey|fit fix|fit do|person for)\b/gi, ' ')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanIntent && cleanIntent !== q) {
        const cleanSlug = cleanIntent.replace(/_/g, '-').replace(/\s+/g, '-');
        const cleanDirect = this.getBySlug(cleanSlug) ||
          SERVICE_CATEGORIES.find(c => 
            c.name.toLowerCase() === cleanIntent ||
            c.synonyms.some(syn => syn.toLowerCase() === cleanIntent || cleanIntent.includes(syn.toLowerCase()))
          );
        if (cleanDirect) return cleanDirect;
      }

      return null;
    },

    // Returns canonical slug string
    resolveSlug(query) {
      const res = this.resolveQuery(query);
      return res ? res.slug : String(query);
    },

    // Helper to build canonical search URL
    buildSearchUrl(options = {}) {
      const params = new URLSearchParams();
      if (options.service) {
        const resolved = this.resolveQuery(options.service) || this.getBySlug(options.service);
        params.set('service', resolved ? resolved.slug : options.service);
      }
      if (options.location) {
        params.set('location', options.location);
      }
      if (options.city) {
        params.set('city', options.city);
      }
      const qs = params.toString();
      return qs ? `search.html?${qs}` : 'search.html';
    }
  };

  // ===== PHASE 10.8 CANONICAL NIGERIAN SKILLS MARKETPLACE TAXONOMY =====
  const SKILL_INDUSTRIES = [
    {
      id: 'home-repairs',
      name: 'Home & Technical Repairs',
      icon: '🔧',
      description: 'Electrical, plumbing, carpentry, and building services',
      popularSkills: ['electrician', 'plumber', 'carpenter', 'painter', 'welder', 'solar-installer', 'ac-technician', 'generator-technician']
    },
    {
      id: 'beauty-wellness',
      name: 'Beauty, Hair & Personal Care',
      icon: '💅',
      description: 'Barbing, hair braiding, makeup, nails, and spa wellness',
      popularSkills: ['barber', 'hair-stylist', 'braider', 'nail-technician', 'makeup-artist', 'lash-technician']
    },
    {
      id: 'fashion-tailoring',
      name: 'Fashion, Bespoke & Tailoring',
      icon: '🧵',
      description: 'Custom tailoring, agbada, aso-ebi, and leathercraft',
      popularSkills: ['tailor', 'fashion-designer', 'shoemaker']
    },
    {
      id: 'auto-transport',
      name: 'Automotive, Repairs & Transport',
      icon: '🔩',
      description: 'Car mechanics, auto rewire, vulcanizing, and towing',
      popularSkills: ['mechanic', 'auto-electrician', 'auto-ac-technician', 'vulcanizer', 'panel-beater']
    },
    {
      id: 'cleaning-home',
      name: 'Cleaning, Hygiene & Fumigation',
      icon: '✨',
      description: 'Deep home cleaning, fumigation, laundry, and gardening',
      popularSkills: ['cleaner', 'fumigator', 'laundry']
    },
    {
      id: 'food-hospitality',
      name: 'Catering, Baking & Culinary Arts',
      icon: '🍽️',
      description: 'Party jollof catering, small chops, and custom cakes',
      popularSkills: ['caterer', 'baker']
    },
    {
      id: 'events-entertainment',
      name: 'Events, Sound & Entertainment',
      icon: '🎉',
      description: 'Event planning, decoration, DJs, MCs, and party rentals',
      popularSkills: ['event-planner', 'dj', 'mc-hypeman']
    },
    {
      id: 'digital-technology',
      name: 'Digital, IT & Phone Repair',
      icon: '📱',
      description: 'Phone screen fixing, laptop repair, web development, and CCTV',
      popularSkills: ['phone-repairer', 'computer-repairer', 'web-developer', 'graphic-designer', 'cctv-installer']
    },
    {
      id: 'construction-engineering',
      name: 'Construction, Masonry & Built Trades',
      icon: '🧱',
      description: 'Bricklaying, roofing, tiling, POP, and land surveying',
      popularSkills: ['bricklayer', 'pop-installer', 'tiler']
    },
    {
      id: 'education-training',
      name: 'Education, Tutoring & Music',
      icon: '📚',
      description: 'Academic home tutoring, WAEC/JAMB prep, and music lessons',
      popularSkills: ['tutor']
    },
    {
      id: 'agriculture-livestock',
      name: 'Agriculture, Poultry & Farming',
      icon: '🌱',
      description: 'Poultry farm setup, catfish hatching, and crop services',
      popularSkills: ['poultry-farmer']
    },
    {
      id: 'logistics-commerce',
      name: 'Logistics, Dispatch & Moving',
      icon: '🏍️',
      description: 'Express motorcycle dispatch and professional house movers',
      popularSkills: ['dispatch-rider', 'house-mover']
    },
    {
      id: 'photography-media',
      name: 'Photography, Video & Creative Media',
      icon: '📸',
      description: 'Portrait studio shoots, wedding coverage, and drone videography',
      popularSkills: ['photographer', 'videographer']
    },
    {
      id: 'personal-lifestyle',
      name: 'Fitness, Lifestyle & Family Care',
      icon: '🏃',
      description: 'Personal fitness trainers, nannies, and home caregivers',
      popularSkills: ['personal-trainer']
    }
  ];

  const MarketplaceTaxonomy = {
    industries: SKILL_INDUSTRIES,

    getIndustries() {
      return SKILL_INDUSTRIES;
    },

    getIndustryById(id) {
      return SKILL_INDUSTRIES.find(i => i.id === id) || null;
    },

    getAllPopularSkills() {
      const skills = [];
      SKILL_INDUSTRIES.forEach(ind => {
        ind.popularSkills.forEach(sSlug => {
          const cat = CategoryMap.getBySlug(sSlug);
          if (cat) {
            skills.push({
              slug: cat.slug,
              name: cat.name,
              displayName: cat.displayName,
              icon: cat.icon,
              industryId: ind.id,
              industryName: ind.name
            });
          }
        });
      });
      return skills;
    },

    // Phase 10.9: Governed Related Skills Graph (Offline/Client in-memory resolution)
    relationships: {
      'solar-installer': [
        { id: 'inverter-technician', name: 'Inverter Technician', icon: '🔋', type: 'COMPLEMENTARY', strength: 0.95 },
        { id: 'electrician', name: 'Electrician', icon: '⚡', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'generator-technician', name: 'Generator Technician', icon: '⚙️', type: 'SUBSTITUTE', strength: 0.80 }
      ],
      'electrician': [
        { id: 'generator-technician', name: 'Generator Technician', icon: '⚙️', type: 'COMPLEMENTARY', strength: 0.85 },
        { id: 'solar-installer', name: 'Solar Installer', icon: '☀️', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'cctv-installer', name: 'CCTV Installer', icon: '📹', type: 'COMPLEMENTARY', strength: 0.80 }
      ],
      'plumber': [
        { id: 'borehole-technician', name: 'Borehole Specialist', icon: '💧', type: 'COMPLEMENTARY', strength: 0.95 },
        { id: 'tiler', name: 'Tiler', icon: '🧱', type: 'COMPLEMENTARY', strength: 0.85 }
      ],
      'mechanic': [
        { id: 'auto-electrician', name: 'Auto Rewire / Electrician', icon: '⚡', type: 'COMPLEMENTARY', strength: 0.95 },
        { id: 'auto-ac-technician', name: 'Auto AC Technician', icon: '❄️', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'panel-beater', name: 'Panel Beater', icon: '🔨', type: 'COMPLEMENTARY', strength: 0.85 },
        { id: 'vulcanizer', name: 'Vulcanizer', icon: '🛞', type: 'COMPLEMENTARY', strength: 0.80 }
      ],
      'hair-stylist': [
        { id: 'braider', name: 'Braider', icon: '💇‍♀️', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'nail-technician', name: 'Nail Technician', icon: '💅', type: 'COMPLEMENTARY', strength: 0.85 },
        { id: 'makeup-artist', name: 'Makeup Artist', icon: '💄', type: 'COMPLEMENTARY', strength: 0.90 }
      ],
      'barber': [
        { id: 'hair-stylist', name: 'Hair Stylist', icon: '💇', type: 'RELATED', strength: 0.75 },
        { id: 'personal-trainer', name: 'Fitness Trainer', icon: '🏃', type: 'RELATED', strength: 0.60 }
      ],
      'painter': [
        { id: 'pop-installer', name: 'POP Installer', icon: '🏗️', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'carpenter', name: 'Carpenter', icon: '🪚', type: 'COMPLEMENTARY', strength: 0.80 }
      ],
      'carpenter': [
        { id: 'furniture-maker', name: 'Furniture Maker', icon: '🛋️', type: 'COMPLEMENTARY', strength: 0.85 },
        { id: 'painter', name: 'Painter', icon: '🎨', type: 'COMPLEMENTARY', strength: 0.80 }
      ],
      'event-planner': [
        { id: 'caterer', name: 'Event Caterer', icon: '🍲', type: 'COMPLEMENTARY', strength: 0.95 },
        { id: 'dj', name: 'Disc Jockey (DJ)', icon: '🎧', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'photographer', name: 'Photographer', icon: '📸', type: 'COMPLEMENTARY', strength: 0.90 }
      ],
      'deep-cleaner': [
        { id: 'fumigator', name: 'Fumigator', icon: '🧪', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'laundry', name: 'Dry Cleaner & Laundry', icon: '👔', type: 'COMPLEMENTARY', strength: 0.85 }
      ],
      'phone-repairer': [
        { id: 'computer-repairer', name: 'Computer & Laptop Repairer', icon: '💻', type: 'COMPLEMENTARY', strength: 0.90 },
        { id: 'cctv-installer', name: 'CCTV Installer', icon: '📹', type: 'RELATED', strength: 0.75 }
      ]
    },

    getRelatedSkills(skillSlug, limit = 6) {
      if (!skillSlug) return [];
      const normalizedSlug = CategoryMap.resolveSlug(skillSlug);
      if (Array.isArray(this.relationships[normalizedSlug])) {
        return this.relationships[normalizedSlug].slice(0, limit);
      }
      // Fallback: popular skills in same industry
      const ind = SKILL_INDUSTRIES.find(i => Array.isArray(i.popularSkills) && i.popularSkills.includes(normalizedSlug));
      if (ind) {
        return ind.popularSkills
          .filter(s => s !== normalizedSlug)
          .slice(0, limit)
          .map(s => {
            const cat = CategoryMap.getBySlug(s);
            return {
              id: s,
              name: cat ? cat.name : s,
              icon: cat ? cat.icon : '✨',
              type: 'SAME_INDUSTRY',
              strength: 0.70
            };
          });
      }
      return [];
    },

    // Specializations dictionary
    specializations: {
      'solar-installer': [
        { slug: 'residential-solar', name: 'Residential Home Solar' },
        { slug: 'commercial-solar', name: 'Commercial & Industrial Solar' },
        { slug: 'solar-inverter', name: 'Solar Inverter Installation' },
        { slug: 'solar-battery', name: 'Lithium & Tubular Battery Setup' },
        { slug: 'solar-maintenance', name: 'Solar Panel Cleaning & Maintenance' }
      ],
      'electrician': [
        { slug: 'house-wiring', name: 'House Conduit Wiring' },
        { slug: 'fault-troubleshooting', name: 'Electrical Fault Tracing' },
        { slug: 'industrial-wiring', name: '3-Phase Industrial Wiring' },
        { slug: 'lighting-fixtures', name: 'Chandelier & LED Strip Fitting' }
      ],
      'plumber': [
        { slug: 'burst-pipes', name: 'Burst Pipe & Leak Repair' },
        { slug: 'drainage-unblocking', name: 'Drainage & Soakaway Unblocking' },
        { slug: 'bathroom-fixtures', name: 'Water Closet & Shower Installation' },
        { slug: 'water-pumping', name: 'Pumping Machine Installation' }
      ],
      'mechanic': [
        { slug: 'engine-overhaul', name: 'Engine Overhaul & Servicing' },
        { slug: 'toyota-specialist', name: 'Toyota / Lexus Diagnostic Expert' },
        { slug: 'honda-specialist', name: 'Honda Diagnostic Specialist' },
        { slug: 'mercedes-bmw', name: 'German Car Specialist (Benz/BMW)' },
        { slug: 'brake-suspension', name: 'Brake, Hub & Suspension Repair' }
      ]
    },

    getSpecializations(skillSlug) {
      if (!skillSlug) return [];
      const normalizedSlug = CategoryMap.resolveSlug(skillSlug);
      return Array.isArray(this.specializations[normalizedSlug]) ? this.specializations[normalizedSlug] : [];
    },

    // Build Discovery Context Model
    buildDiscoveryContext(options = {}) {
      const {
        industry = null,
        category = null,
        service = null,
        skill = null,
        specialization = null,
        state = null,
        city = null,
        location = null,
        source = 'marketplace'
      } = options;

      const rawSkill = skill || service;
      let resolvedSkillSlug = null;
      let skillObj = null;
      let resolvedIndustry = null;

      if (rawSkill) {
        skillObj = CategoryMap.resolveQuery(rawSkill) || CategoryMap.getBySlug(rawSkill);
        resolvedSkillSlug = skillObj ? skillObj.slug : CategoryMap.resolveSlug(rawSkill);
      }

      if (industry) {
        resolvedIndustry = this.getIndustryById(industry);
      } else if (resolvedSkillSlug) {
        resolvedIndustry = SKILL_INDUSTRIES.find(i => i.popularSkills.includes(resolvedSkillSlug)) || null;
      }

      const effectiveState = state || location || null;
      const effectiveCity = city || null;

      const context = {
        industry: resolvedIndustry ? { id: resolvedIndustry.id, name: resolvedIndustry.name, icon: resolvedIndustry.icon } : null,
        category: category ? { id: category, name: category } : null,
        skill: skillObj ? { id: skillObj.slug, name: skillObj.name, displayName: skillObj.displayName, icon: skillObj.icon, promptText: skillObj.promptText, ctaText: skillObj.ctaText } : (rawSkill ? { id: rawSkill, name: rawSkill } : null),
        specialization: specialization ? { slug: specialization, name: specialization.replace(/-/g, ' ') } : null,
        location: { state: effectiveState, city: effectiveCity },
        source: source,
        modelVersion: 'MDCIE-1.0.0'
      };

      context.breadcrumbs = this.generateBreadcrumbs(context);
      context.relatedSkills = resolvedSkillSlug ? this.getRelatedSkills(resolvedSkillSlug) : [];

      return context;
    },

    // Generate Clickable Breadcrumbs
    generateBreadcrumbs(context) {
      const crumbs = [{ level: 'home', label: 'Home', url: 'index.html' }];

      if (context.industry) {
        crumbs.push({
          level: 'industry',
          id: context.industry.id,
          label: context.industry.name,
          icon: context.industry.icon,
          url: `search.html?industry=${encodeURIComponent(context.industry.id)}`
        });
      }

      if (context.category) {
        crumbs.push({
          level: 'category',
          id: context.category.id,
          label: context.category.name,
          url: `search.html?category=${encodeURIComponent(context.category.id)}`
        });
      }

      if (context.skill) {
        crumbs.push({
          level: 'skill',
          id: context.skill.id,
          label: context.skill.displayName || context.skill.name,
          icon: context.skill.icon,
          url: `search.html?service=${encodeURIComponent(context.skill.id)}`
        });
      }

      if (context.specialization) {
        crumbs.push({
          level: 'specialization',
          id: context.specialization.slug,
          label: context.specialization.name,
          url: `search.html?service=${encodeURIComponent(context.skill ? context.skill.id : '')}&spec=${encodeURIComponent(context.specialization.slug)}`
        });
      }

      if (context.location && context.location.state && context.location.state !== 'all') {
        const stateName = context.location.state;
        const skillPart = context.skill ? `service=${encodeURIComponent(context.skill.id)}&` : '';
        crumbs.push({
          level: 'state',
          label: stateName,
          url: `search.html?${skillPart}state=${encodeURIComponent(stateName)}`
        });
      }

      if (context.location && context.location.lga && context.location.lga !== 'all') {
        const lgaName = context.location.lga;
        const skillPart = context.skill ? `service=${encodeURIComponent(context.skill.id)}&` : '';
        const statePart = context.location.state ? `state=${encodeURIComponent(context.location.state)}&` : '';
        crumbs.push({
          level: 'lga',
          label: lgaName,
          url: `search.html?${skillPart}${statePart}lga=${encodeURIComponent(lgaName)}`
        });
      }

      if (context.location && context.location.city && context.location.city !== 'all' && context.location.city !== context.location.lga) {
        const cityName = context.location.city;
        const skillPart = context.skill ? `service=${encodeURIComponent(context.skill.id)}&` : '';
        const statePart = context.location.state ? `state=${encodeURIComponent(context.location.state)}&` : '';
        const lgaPart = context.location.lga ? `lga=${encodeURIComponent(context.location.lga)}&` : '';
        crumbs.push({
          level: 'city',
          label: cityName,
          url: `search.html?${skillPart}${statePart}${lgaPart}city=${encodeURIComponent(cityName)}`
        });
      }

      if (context.location && context.location.locality && context.location.locality !== 'all') {
        const locName = context.location.locality;
        const skillPart = context.skill ? `service=${encodeURIComponent(context.skill.id)}&` : '';
        const statePart = context.location.state ? `state=${encodeURIComponent(context.location.state)}&` : '';
        const lgaPart = context.location.lga ? `lga=${encodeURIComponent(context.location.lga)}&` : '';
        crumbs.push({
          level: 'locality',
          label: locName,
          url: `search.html?${skillPart}${statePart}${lgaPart}locality=${encodeURIComponent(locName)}`
        });
      }

      return crumbs;
    },

    // Zero-Result Recommendations Helper
    getZeroResultRecommendations(context) {
      const recs = {
        title: 'No exact matches in this specific area yet',
        suggestions: []
      };

      if (context.location && context.location.city && context.location.state) {
        recs.suggestions.push({
          type: 'EXPAND_TO_STATE',
          label: `Expand search to all of ${context.location.state}`,
          url: `search.html?service=${encodeURIComponent(context.skill ? context.skill.id : '')}&state=${encodeURIComponent(context.location.state)}`
        });
      }

      if (context.skill) {
        const related = this.getRelatedSkills(context.skill.id, 4);
        if (related.length > 0) {
          recs.relatedSkills = related;
        }
      }

      if (context.industry) {
        recs.suggestions.push({
          type: 'VIEW_INDUSTRY',
          label: `Browse all trades in ${context.industry.name}`,
          url: `search.html?industry=${encodeURIComponent(context.industry.id)}`
        });
      }

      recs.suggestions.push({
        type: 'SEARCH_ALL_NIGERIA',
        label: 'View all verified providers across Nigeria',
        url: context.skill ? `search.html?service=${encodeURIComponent(context.skill.id)}` : 'search.html'
      });

      recs.suggestions.push({
        type: 'BECOME_PROVIDER',
        label: 'Are you an artisan? List your skill on Lokator free',
        url: 'register.html'
      });

      return recs;
    }
  };

  // Expose to global window / module
  global.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
  global.CategoryMap = CategoryMap;
  global.ServiceModerator = ServiceModerator;
  global.SKILL_INDUSTRIES = SKILL_INDUSTRIES;
  global.MarketplaceTaxonomy = MarketplaceTaxonomy;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SERVICE_CATEGORIES, CategoryMap, ServiceModerator, SKILL_INDUSTRIES, MarketplaceTaxonomy };
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

