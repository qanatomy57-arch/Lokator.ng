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
        'inverter',
        'solar',
        'generator',
        'rewiring',
        'conduit',
        'fault diagnosis',
        'circuit'
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
        'bathroom fitting'
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
        'esthetician'
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
        'bespoke suits'
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
        'roadside rescue'
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
        'home cleaning'
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
        'hair'
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
        'wallpaper',
        'wall artist',
        'wall panels'
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
        'tank stands'
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
        'computer repair'
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
        'party jollof'
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
    }
  ];

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

    // Resolve user input query (e.g. "plumber", "nail technician", "auto repair", "deep clean")
    resolveQuery(query) {
      if (!query) return null;
      const q = String(query).toLowerCase().trim();
      const slugified = q.replace(/_/g, '-').replace(/\s+/g, '-');

      // 1. Direct slug match
      const directSlug = this.getBySlug(slugified);
      if (directSlug) return directSlug;

      // 2. Direct name or displayName match
      const directName = SERVICE_CATEGORIES.find(c => 
        c.name.toLowerCase() === q ||
        c.displayName.toLowerCase() === q ||
        c.dropdownValue.toLowerCase() === q
      );
      if (directName) return directName;

      // 3. Synonym exact match
      const synonymMatch = SERVICE_CATEGORIES.find(c =>
        c.synonyms.some(syn => syn.toLowerCase() === q)
      );
      if (synonymMatch) return synonymMatch;

      // 4. Substring / keyword inclusion match
      const partialMatch = SERVICE_CATEGORIES.find(c =>
        c.synonyms.some(syn => q.includes(syn.toLowerCase()) || syn.toLowerCase().includes(q))
      );
      if (partialMatch) return partialMatch;

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

  // Expose to global window
  global.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
  global.CategoryMap = CategoryMap;

})(typeof window !== 'undefined' ? window : this);
