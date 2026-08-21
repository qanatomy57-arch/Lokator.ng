/**
 * LOKATOR.NG — DISCOVERY ORCHESTRATION ENGINE (discovery-orchestrator.js)
 * Deterministic intent classification, spatial resolution, and skill canonicalization.
 * 
 * Pipeline:
 * Raw Query -> Input Normalization -> Intent Classification -> Spatial Resolution -> Skill Canonicalization
 * 
 * Architectural Contract:
 * - Deterministic, bounded execution (O(N) character scans, zero backtracking regex)
 * - Zero external LLM / cloud dependencies
 * - Preserves existing search scoring & ranking air-gap (OBSERVATIONAL & PRE-SEARCH ONLY)
 * - Comprehensive support for Nigerian trade terminology, trade aliases, colloquialisms & LGA abbreviations
 */

(function (global) {
  'use strict';

  // Supported Intent Classes
  const INTENTS = Object.freeze({
    SERVICE_DISCOVERY: 'SERVICE_DISCOVERY',
    PROVIDER_DISCOVERY: 'PROVIDER_DISCOVERY',
    LOCATION_SPECIFIC_SERVICE: 'LOCATION_SPECIFIC_SERVICE',
    MULTI_SKILL_REQUEST: 'MULTI_SKILL_REQUEST',
    URGENT_SERVICE: 'URGENT_SERVICE',
    PRICE_SEEKING: 'PRICE_SEEKING',
    AVAILABILITY_SEEKING: 'AVAILABILITY_SEEKING',
    GENERAL_INFORMATION: 'GENERAL_INFORMATION',
    UNKNOWN: 'UNKNOWN'
  });

  // Nigerian Geographical Entities & Canonical Normalization Map
  const NIGERIAN_LOCATIONS = [
    // Lagos LGAs & Major Localities
    { canonical: 'Ikeja', state: 'Lagos', lga: 'Ikeja', aliases: ['ikeja', 'alausa', 'computer village', 'allen', 'adeniyi jones', 'oba akran'] },
    { canonical: 'Ibeju-Lekki', state: 'Lagos', lga: 'Ibeju-Lekki', aliases: ['ibeju-lekki', 'ibeju lekki', 'ibeju', 'eleko', 'awoyaya', 'lakowe', 'bogije'] },
    { canonical: 'Lekki', state: 'Lagos', lga: 'Eti-Osa', aliases: ['lekki', 'lekki phase 1', 'lekki phase 2', 'chevron', 'jakande', 'osapa', 'ikate', 'agungi'] },
    { canonical: 'Victoria Island', state: 'Lagos', lga: 'Eti-Osa', aliases: ['vi', 'victoria island', 'v/i', 'adeola odeku', 'kofo abayomi'] },
    { canonical: 'Ikoyi', state: 'Lagos', lga: 'Eti-Osa', aliases: ['ikoyi', 'banana island', 'parkview', 'bourdillon', 'old ikoyi'] },
    { canonical: 'Surulere', state: 'Lagos', lga: 'Surulere', aliases: ['surulere', 'suru lere', 'bode thomas', 'ojuelegba', 'masha', 'itire', 'aguda'] },
    { canonical: 'Yaba', state: 'Lagos', lga: 'Lagos Mainland', aliases: ['yaba', 'akoka', 'tejuosho', 'sabo', 'ebute metta', 'unilag'] },
    { canonical: 'Ikorodu', state: 'Lagos', lga: 'Ikorodu', aliases: ['ikorodu', 'ogolonto', 'agric', 'ebute', 'ikpakodo'] },
    { canonical: 'Alimosho', state: 'Lagos', lga: 'Alimosho', aliases: ['alimosho', 'egbeda', 'idimu', 'ikotun', 'igando', 'ipaja', 'iyana ipaja'] },
    { canonical: 'Oshodi-Isolo', state: 'Lagos', lga: 'Oshodi-Isolo', aliases: ['oshodi', 'isolo', 'okota', 'mafoluku', 'ilasa', 'ajaocan'] },
    { canonical: 'Apapa', state: 'Lagos', lga: 'Apapa', aliases: ['apapa', 'wharf', 'tincan'] },
    { canonical: 'Agege', state: 'Lagos', lga: 'Agege', aliases: ['agege', 'pen cinema', 'dopemu', 'oko oba'] },
    { canonical: 'Kosofe', state: 'Lagos', lga: 'Kosofe', aliases: ['kosofe', 'ketu', 'mile 12', 'ojota', 'ogudu', 'magodo', 'alapere'] },
    { canonical: 'Somolu', state: 'Lagos', lga: 'Somolu', aliases: ['somolu', 'shomolu', 'bariga', 'palmgrove', 'onipanu'] },
    
    // Abuja FCT & Environs
    { canonical: 'Abuja Municipal', state: 'Abuja (FCT)', lga: 'AMAC', aliases: ['abuja', 'amac', 'wuse', 'wuse 2', 'garki', 'garki 2', 'maitama', 'asokoro', 'guzape', 'jabi', 'utako', 'gwarinpa', 'lugbe', 'kubwa', 'lokogoma', 'apo'] },
    
    // Rivers State / Port Harcourt
    { canonical: 'Port Harcourt', state: 'Rivers', lga: 'Port Harcourt', aliases: ['port harcourt', 'ph', 'phc', 'diobu', 'trans amadi', 'd/line', 'gra port harcourt', 'rumuokoro', 'woji', 'choba'] },

    // Oyo / Ibadan
    { canonical: 'Ibadan', state: 'Oyo', lga: 'Ibadan North', aliases: ['ibadan', 'bodija', 'dugbe', 'ring road ibadan', 'challenge ibadan', 'iwo road', 'ui', 'samonda'] },

    // Ogun
    { canonical: 'Abeokuta', state: 'Ogun', lga: 'Abeokuta South', aliases: ['abeokuta', 'panseke', 'kuto', 'oke mosan'] },
    { canonical: 'Ogun Border', state: 'Ogun', lga: 'Ifo', aliases: ['berger', 'arepo', 'magboro', 'mowe', 'ibafo', 'sango ota', 'ota'] }
  ];

  // Nigerian Trade Aliases & Colloquial Service Terms
  const NIGERIAN_TRADE_SYNONYMS = [
    // Auto & Electrical
    { canonicalSkill: 'auto_electrician', categorySlug: 'mechanic', matches: ['rewire', 'auto rewire', 'car rewire', 'auto electrician', 'car electrical', 'car battery dead', 'alternator fix'] },
    { canonicalSkill: 'generator_technician', categorySlug: 'electrician', matches: ['generator repairer', 'generator mechanic', 'gen mechanic', 'fix my generator', 'i pass my neighbor', 'mikano repair', 'generator rewire', 'changeover switch fix'] },
    { canonicalSkill: 'air_conditioning_technician', categorySlug: 'electrician', matches: ['ac repairer', 'ac technician', 'ac gas filling', 'ac blowing hot', 'install ac', 'air conditioner repair'] },
    { canonicalSkill: 'tyre_repairer', categorySlug: 'mechanic', matches: ['vulcanizer', 'wheel balancing', 'flat tyre', 'puncture tyre', 'gauge air', 'vulcanize'] },
    { canonicalSkill: 'panel_beater', categorySlug: 'mechanic', matches: ['panel beater', 'panel beating', 'car body repair', 'spray painter', 'dent repair', 'car body work'] },
    { canonicalSkill: 'plumber', categorySlug: 'plumber', matches: ['soakaway fix', 'burst pipe', 'water heater', 'pumping machine', 'pumping machine repairer', 'borehole plumber', 'tiler plumber'] },
    { canonicalSkill: 'inverter_solar_installer', categorySlug: 'electrician', matches: ['solar installer', 'solar technician', 'inverter technician', 'solar battery', 'solar panel fixing'] },
    { canonicalSkill: 'aluminum_fabricator', categorySlug: 'welder', matches: ['aluminum worker', 'aluminum window', 'casement window', 'iron gate fabricator', 'welder repair'] },
    { canonicalSkill: 'tailor_fashion_designer', categorySlug: 'tailor', matches: ['fashion designer', 'seamstress', 'agbada sewing', 'native wear tailor', 'amend clothes'] }
  ];

  // Intent Pattern Matching Words
  const URGENT_KEYWORDS = ['urgent', 'urgently', 'emergency', 'asap', 'immediately', 'burst pipe', 'battery dead'];
  const PRICE_KEYWORDS = ['price', 'cost', 'how much', 'rate', 'estimate', 'cheap', 'affordable', 'charges'];
  const AVAILABILITY_KEYWORDS = ['available', 'open now', 'weekend', 'sunday', 'night', '24/7', 'near me', 'today', 'working now'];
  const MULTI_SKILL_CONNECTORS = [' and ', ' & ', ' plus ', ' with ', ' also '];
  const INFO_KEYWORDS = ['how to', 'why is', 'what causes', 'diy', 'tips', 'guide', 'tutorial'];

  /**
   * Sanitizes and bounds raw text input
   * @param {string} rawInput 
   * @returns {string}
   */
  function normalizeInput(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return '';
    return rawInput
      .slice(0, 300) // Bound input length to prevent resource exhaustion
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Classifies user search intent deterministically
   * @param {string} query 
   * @returns {object} { intent, confidence, details }
   */
  function classifyIntent(query) {
    const clean = normalizeInput(query);
    if (!clean) {
      return { intent: INTENTS.UNKNOWN, confidence: 1.0, details: 'Empty query' };
    }

    // 1. General Information / Diagnostic Query
    if (INFO_KEYWORDS.some(kw => clean.startsWith(kw) || clean.includes(` ${kw} `))) {
      return { intent: INTENTS.GENERAL_INFORMATION, confidence: 0.90, details: 'Informational keyword detected' };
    }

    // 2. Provider Name Lookup (e.g. "Mama Tobi", "Alhaji", "Emeka Enterprises")
    if (/^(mr|mrs|mama|papa|alhaji|chief|emeka|tobi|bola|musa|bayo|engr|pastor)\s+/i.test(clean) ||
        clean.includes('enterprises') || clean.includes('services ltd') || clean.includes('ventures')) {
      return { intent: INTENTS.PROVIDER_DISCOVERY, confidence: 0.85, details: 'Provider business/personal name pattern' };
    }

    // 3. Urgent Service Demand
    if (URGENT_KEYWORDS.some(kw => clean.includes(kw))) {
      return { intent: INTENTS.URGENT_SERVICE, confidence: 0.92, details: 'Emergency/Urgency keyword matched' };
    }

    // 4. Price Seeking
    if (PRICE_KEYWORDS.some(kw => clean.includes(kw))) {
      return { intent: INTENTS.PRICE_SEEKING, confidence: 0.88, details: 'Cost estimation pattern matched' };
    }

    // 5. Availability Seeking
    if (AVAILABILITY_KEYWORDS.some(kw => clean.includes(kw))) {
      return { intent: INTENTS.AVAILABILITY_SEEKING, confidence: 0.85, details: 'Availability modifier matched' };
    }

    // 6. Multi-Skill Compound Request
    if (MULTI_SKILL_CONNECTORS.some(conn => clean.includes(conn))) {
      const parts = clean.split(/ and | & | plus | with | also /);
      if (parts.length > 1 && parts[0].length >= 3 && parts[1].length >= 3) {
        return { intent: INTENTS.MULTI_SKILL_REQUEST, confidence: 0.82, details: 'Compound skill connector detected' };
      }
    }

    // 7. Location-Specific Service
    const locationMatch = resolveLocation(clean);
    if (locationMatch.matched) {
      return { intent: INTENTS.LOCATION_SPECIFIC_SERVICE, confidence: 0.90, details: `Geographic entity matched: ${locationMatch.canonical}` };
    }

    // 8. Service Discovery Default
    if (clean.length >= 2) {
      return { intent: INTENTS.SERVICE_DISCOVERY, confidence: 0.80, details: 'Standard service keyword query' };
    }

    return { intent: INTENTS.UNKNOWN, confidence: 0.50, details: 'Unclassified pattern' };
  }

  /**
   * Deterministically resolves geographic entities in query string
   * @param {string} query 
   * @returns {object} { matched, canonical, state, lga, cleanedQuery }
   */
  function resolveLocation(query) {
    const clean = normalizeInput(query);
    if (!clean) return { matched: false, canonical: null, state: null, lga: null, cleanedQuery: '' };

    for (const loc of NIGERIAN_LOCATIONS) {
      for (const alias of loc.aliases) {
        // Match whole word / boundary
        const regex = new RegExp(`(^|\\s|in|at|for|near)(${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})($|\\s|,|\\.)`, 'i');
        if (regex.test(clean)) {
          // Strip location from query to isolate skill terms
          const cleanedQuery = clean.replace(regex, ' ').replace(/\s+/g, ' ').trim();
          return {
            matched: true,
            canonical: loc.canonical,
            state: loc.state,
            lga: loc.lga,
            cleanedQuery: cleanedQuery
          };
        }
      }
    }

    return { matched: false, canonical: null, state: null, lga: null, cleanedQuery: clean };
  }

  /**
   * Canonicalizes trade terms, colloquialisms, and synonyms to standard categories/skills
   * @param {string} query 
   * @returns {object} { canonicalSkill, categorySlug, matchedColloquial }
   */
  function canonicalizeSkill(query) {
    const clean = normalizeInput(query);
    if (!clean) return { canonicalSkill: null, categorySlug: null, matchedColloquial: null };

    // Check specialized Nigerian trade synonyms first
    for (const trade of NIGERIAN_TRADE_SYNONYMS) {
      for (const match of trade.matches) {
        if (clean.includes(match)) {
          return {
            canonicalSkill: trade.canonicalSkill,
            categorySlug: trade.categorySlug,
            matchedColloquial: match
          };
        }
      }
    }

    // Fallback to CategoryMap if available globally
    if (typeof global.CategoryMap !== 'undefined' && typeof global.CategoryMap.resolveQuery === 'function') {
      const resolvedSlug = global.CategoryMap.resolveQuery(clean);
      if (resolvedSlug) {
        return {
          canonicalSkill: resolvedSlug,
          categorySlug: resolvedSlug,
          matchedColloquial: null
        };
      }
    }

    return { canonicalSkill: null, categorySlug: null, matchedColloquial: null };
  }

  /**
   * Full Discovery Orchestrator Execution Pipeline
   * Takes raw query and returns structured pre-search intelligence
   * @param {string} query 
   * @param {object} [clientContext] 
   * @returns {object}
   */
  function orchestrateQuery(query, clientContext = {}) {
    const normalized = normalizeInput(query);
    const intentResult = classifyIntent(normalized);
    const locationResult = resolveLocation(normalized);
    const skillResult = canonicalizeSkill(locationResult.cleanedQuery || normalized);

    return {
      rawQuery: query,
      normalizedQuery: normalized,
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      location: {
        matched: locationResult.matched,
        canonical: locationResult.canonical,
        state: locationResult.state,
        lga: locationResult.lga
      },
      skill: {
        canonicalSkill: skillResult.canonicalSkill,
        categorySlug: skillResult.categorySlug,
        matchedColloquial: skillResult.matchedColloquial
      },
      sanitizedSearchKeyword: locationResult.cleanedQuery || normalized,
      modelVersion: 'v1',
      orchestratedAt: new Date().toISOString()
    };
  }

  // Export to global environment
  const LokatorDiscoveryOrchestrator = Object.freeze({
    INTENTS,
    normalizeInput,
    classifyIntent,
    resolveLocation,
    canonicalizeSkill,
    orchestrateQuery
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LokatorDiscoveryOrchestrator;
  } else {
    global.LokatorDiscoveryOrchestrator = LokatorDiscoveryOrchestrator;
  }
})(typeof window !== 'undefined' ? window : global);
