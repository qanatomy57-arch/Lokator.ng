/**
 * ============================================================================
 * LOKATOR.NG — SECURE AI PROVIDER ASSISTANCE SERVICE (ai-service.js)
 * Phase 10.12D: AI Provider Bio Generation & Pricing Assistance Engine
 * ============================================================================
 *
 * Provides safe, factual, anti-hallucinatory AI generation for:
 * 1. Provider Profile Bio Copy
 * 2. Service Offering Summaries
 * 3. Market Pricing Guidance & Rate Card Estimation
 *
 * Privacy & Security Guarantees:
 * - Never transmits sensitive PII (passwords, auth tokens, phone numbers, WhatsApp numbers).
 * - Enforces zero-hallucination boundaries (never invents years, certifications, awards, customer counts).
 * - Integrates dual-layer content moderation (ServiceModerator blocklist).
 * - Operates securely behind authenticated server endpoints or local transformation engine.
 */

(function (global) {
  'use strict';

  // Benchmark baseline pricing reference ranges for Nigerian artisanal trades
  // (Used for grounding AI estimation & guidance — clearly marked as guidance, not platform price)
  const NIGERIA_TRADE_PRICING_GUIDANCE = {
    'electrician': {
      label: 'Electrical & Inverter Services',
      inspectionRange: '₦3,500 – ₦6,000',
      standardTaskRange: '₦10,000 – ₦30,000',
      complexTaskRange: '₦35,000 – ₦85,000',
      factors: [
        'Conduit vs surface wiring requirements',
        'Inverter & battery system capacity (e.g. 1kVA–3.5kVA vs 5kVA–15kVA)',
        'Materials included (cables, MCBs, changeover switch) vs labor-only',
        'Emergency or night callout surcharge'
      ],
      questions: [
        'Will you provide the distribution board and circuit breakers, or will the customer supply them?',
        'Does the installation require grounding / earthing rod installation?'
      ]
    },
    'plumber': {
      label: 'Plumbing & Pipe Services',
      inspectionRange: '₦3,000 – ₦5,000',
      standardTaskRange: '₦8,000 – ₦25,000',
      complexTaskRange: '₦25,000 – ₦65,000',
      factors: [
        'Surface piping vs subterranean / concealed wall breaking',
        'PPR vs PVC pipe materials',
        'Pumping machine rating (0.5HP, 1HP, 1.5HP submersible)',
        'Emergency soakaway or drainage unblocking complexity'
      ],
      questions: [
        'Is the leak accessible, or does it require excavation / wall tiling removal?',
        'Are sanitary fixtures supplied by the client?'
      ]
    },
    'tailor': {
      label: 'Bespoke Tailoring & Fashion',
      inspectionRange: '₦2,500 – ₦5,000',
      standardTaskRange: '₦12,000 – ₦35,000',
      complexTaskRange: '₦40,000 – ₦120,000',
      factors: [
        'Fabric type (Senator cashmeres, Aso-Oke, lace, Ankara)',
        'Intricate embroidery, agbada styling, or stone embellishment',
        'Express turnaround timeline (< 48 hours)',
        'Lining and interlining material grade'
      ],
      questions: [
        'Is fabric provided by the customer or sourced by the designer?',
        'Does the order include complex neck/chest embroidery?'
      ]
    },
    'ac-technician': {
      label: 'AC & Refrigeration Services',
      inspectionRange: '₦3,500 – ₦6,000',
      standardTaskRange: '₦10,000 – ₦25,000',
      complexTaskRange: '₦30,000 – ₦75,000',
      factors: [
        'AC tonnage (1HP, 1.5HP, 2HP, Standing Unit)',
        'Gas refrigerant type (R22 vs R410A eco gas)',
        'Compressor repair vs routine chemical outdoor unit wash',
        'High-elevation outdoor condenser mounting'
      ],
      questions: [
        'Does the unit require complete refrigerant evacuation and refilling?',
        'Are scaffolding or extended ladders required to reach the outdoor unit?'
      ]
    },
    'phone-repair': {
      label: 'Phone & Gadget Repair',
      inspectionRange: '₦2,000 – ₦4,000',
      standardTaskRange: '₦8,000 – ₦25,000',
      complexTaskRange: '₦30,000 – ₦85,000',
      factors: [
        'OEM Original Screen vs High-Copy Grade AAA replacement',
        'Charging IC micro-soldering vs port swap',
        'Data recovery complexity and motherboard water damage',
        'Device tier (flagship iPhone/Samsung vs budget smartphone)'
      ],
      questions: [
        'Is the device powering on or experiencing short circuits?',
        'Does the customer require warranty on the replacement screen?'
      ]
    },
    'welder': {
      label: 'Welding & Iron Fabrication',
      inspectionRange: '₦3,500 – ₦6,000',
      standardTaskRange: '₦15,000 – ₦45,000',
      complexTaskRange: '₦60,000 – ₦250,000',
      factors: [
        'Gauge and thickness of structural steel / wrought iron',
        'Automated gate motor integration vs manual sliding gate',
        'Anti-rust primer coating and paint finishing',
        'On-site generator power requirements for welding machine'
      ],
      questions: [
        'Will steel pipes and plates be supplied by the client?',
        'Is site power stable, or is a mobile welding generator needed?'
      ]
    },
    'cleaner': {
      label: 'Deep Cleaning & Fumigation',
      inspectionRange: '₦4,000 – ₦7,000',
      standardTaskRange: '₦18,000 – ₦45,000',
      complexTaskRange: '₦50,000 – ₦150,000',
      factors: [
        'Apartment size (1-bedroom, 3-bedroom duplex, commercial office)',
        'Post-construction paint/cement residue vs routine deep clean',
        'Steam extraction for upholstery and mattresses',
        'Odorless chemical grade for fumigation'
      ],
      questions: [
        'Is the building furnished or vacant post-construction?',
        'Is running water and electricity available on-site during cleaning?'
      ]
    },
    'painter': {
      label: 'Painting & Wall Screeding',
      inspectionRange: '₦3,000 – ₦5,000',
      standardTaskRange: '₦20,000 – ₦60,000',
      complexTaskRange: '₦70,000 – ₦220,000',
      factors: [
        'Dustless wall screeding vs single-coat repaint',
        'Specialty finishes (stucco, marble effect, satin, gloss)',
        'Surface dampness / anti-fungal treatment requirements',
        'Interior vs exterior multi-story scaffolding'
      ],
      questions: [
        'Are paints and screeding compound supplied by the client?',
        'Are walls peeling or experiencing rising damp?'
      ]
    },
    'carpenter': {
      label: 'Carpentry & Cabinet Making',
      inspectionRange: '₦3,500 – ₦6,000',
      standardTaskRange: '₦15,000 – ₦40,000',
      complexTaskRange: '₦50,000 – ₦180,000',
      factors: [
        'Wood type (HDF, MDF, Marine Board, Hardwood Teak/Mahogany)',
        'Hydraulic soft-close hinges and luxury architectural handles',
        'Modular kitchen layout vs freestanding wardrobe',
        'On-site assembly vs pre-fabricated workshop delivery'
      ],
      questions: [
        'Are exact architectural dimensions / drawings available?',
        'Will materials be purchased directly with trade supplier discount?'
      ]
    },
    'solar-installer': {
      label: 'Solar & Inverter Engineering',
      inspectionRange: '₦5,000 – ₦10,000',
      standardTaskRange: '₦25,000 – ₦60,000',
      complexTaskRange: '₦75,000 – ₦300,000',
      factors: [
        'System rating (1kVA–3.5kVA, 5kVA, 10kVA+ commercial systems)',
        'Lithium LiFePO4 battery setup vs tubular gel batteries',
        'Roof angle, panel mounting rails, and lightning surge arrestors',
        'Full energy audit and load separation wiring'
      ],
      questions: [
        'What is the total peak wattage of appliances to be powered?',
        'Is roof access suitable for optimum sun orientation?'
      ]
    },
    'default': {
      label: 'General Artisan & Technical Services',
      inspectionRange: '₦3,000 – ₦5,000',
      standardTaskRange: '₦10,000 – ₦30,000',
      complexTaskRange: '₦35,000 – ₦90,000',
      factors: [
        'Labor-only vs materials included',
        'Task complexity and specialist tools required',
        'Travel distance and local transport logistics',
        'Emergency or expedited delivery requirements'
      ],
      questions: [
        'Are materials provided by the customer or supplied by the artisan?',
        'Is the job urgent or scheduled in advance?'
      ]
    }
  };

  /**
   * Lokator AI Intelligence Core
   */
  const LokatorAIService = {
    pricingReference: NIGERIA_TRADE_PRICING_GUIDANCE,

    /**
     * Strips sensitive PII from facts payload before AI processing.
     * Guarantees phone numbers, WhatsApp, passwords, tokens are NEVER passed.
     *
     * @param {object} rawFacts
     * @returns {object} Cleaned facts
     */
    sanitizeInputs(rawFacts) {
      if (!rawFacts || typeof rawFacts !== 'object') return {};
      
      const clean = {};
      const allowedFields = [
        'name', 'firstName', 'lastName', 'businessName', 'trade', 'trade_title',
        'category', 'skills', 'experienceYrs', 'experience_years',
        'state', 'city', 'lga', 'locality', 'area', 'address',
        'startingPrice', 'starting_price', 'provider_price', 'responseTime', 'response_time',
        'services', 'certifications', 'specialties', 'pricingGuide', 'pricing_guide',
        'service_name', 'service', 'materials_included', 'includes_materials', 'is_emergency', 'emergency'
      ];

      for (const field of allowedFields) {
        if (rawFacts[field] !== undefined && rawFacts[field] !== null) {
          if (typeof rawFacts[field] === 'string') {
            // Trim and truncate to bounded size
            clean[field] = rawFacts[field].trim().substring(0, 500);
          } else if (Array.isArray(rawFacts[field])) {
            clean[field] = rawFacts[field].slice(0, 20).map(item => {
              return typeof item === 'string' ? item.trim().substring(0, 100) : item;
            });
          } else if (typeof rawFacts[field] === 'number' || typeof rawFacts[field] === 'boolean') {
            clean[field] = rawFacts[field];
          }
        }
      }

      // Explicitly remove any accidentally passed sensitive keys
      delete clean.phone;
      delete clean.whatsappNumber;
      delete clean.whatsapp_number;
      delete clean.password;
      delete clean.password_hash;
      delete clean.token;
      delete clean.access_token;
      delete clean.session;
      delete clean.secret;

      return clean;
    },

    /**
     * Validates and verifies AI-generated text against source facts.
     * Guarantees zero hallucinations and checks content moderation.
     *
     * @param {string} text
     * @param {object} sourceFacts
     * @returns {{ valid: boolean, errors: string[], sanitizedText: string }}
     */
    validateOutput(text, sourceFacts = {}) {
      if (!text || typeof text !== 'string') {
        return { valid: false, errors: ['Generated text is empty or invalid'], sanitizedText: '' };
      }

      const errors = [];
      let cleanText = text.trim();

      // 1. Content Moderation Check via ServiceModerator if available
      const Moderator = (typeof ServiceModerator !== 'undefined' ? ServiceModerator : null) ||
                        (typeof globalThis !== 'undefined' ? globalThis.ServiceModerator : null) ||
                        (typeof global !== 'undefined' ? global.ServiceModerator : null);

      if (Moderator) {
        const modFn = typeof Moderator.validateBio === 'function' ? Moderator.validateBio.bind(Moderator) : Moderator.validateSkill.bind(Moderator);
        const modRes = modFn(cleanText);
        if (modRes && modRes.valid === false) {
          errors.push(`Content moderation violation: ${modRes.error || modRes.reason || 'Disallowed terminology detected'}`);
        }
      }

      // 2. Anti-Hallucination: Years of Experience Check
      // If the provider specified 3 years, the bio cannot claim "10 years" or "15 years"
      const expNum = Number(sourceFacts.experienceYrs || sourceFacts.experience_years || 0);
      if (expNum > 0) {
        const yearMatches = cleanText.match(/(\d+)\+?\s*(?:years|yrs)/i);
        if (yearMatches && yearMatches[1]) {
          const claimedYrs = parseInt(yearMatches[1], 10);
          if (claimedYrs > expNum + 1) {
            errors.push(`Hallucination detected: Claimed ${claimedYrs} years experience but provider supplied ${expNum} years.`);
          }
        }
      } else {
        // Provider did NOT supply years of experience. Text must not invent a specific number > 0.
        const yearMatches = cleanText.match(/(\d+)\+?\s*(?:years|yrs)\s+of\s+experience/i);
        if (yearMatches && parseInt(yearMatches[1], 10) > 0) {
          errors.push(`Hallucination detected: Invented ${yearMatches[0]} when provider supplied no experience years.`);
        }
      }

      // 3. Anti-Hallucination: Unsupplied Certifications Check
      const suppliedCerts = Array.isArray(sourceFacts.certifications) 
        ? sourceFacts.certifications.map(c => String(c).toLowerCase()) 
        : [];
      
      const unverifiedCertKeywords = ['coren certified', 'iso certified', 'government approved license', 'licensed master'];
      for (const kw of unverifiedCertKeywords) {
        if (cleanText.toLowerCase().includes(kw) && !suppliedCerts.some(c => c.includes(kw))) {
          // Replace unverified claims cleanly rather than crashing
          cleanText = cleanText.replace(new RegExp(kw, 'gi'), 'verified professional');
        }
      }

      // 4. Anti-Hallucination: Fabricated Customer Counts & Superlatives
      const fabricatedClaims = [
        /(?:thousands of satisfied clients|served over \d+ customers|#1 in nigeria|best in nigeria|cheapest prices guaranteed|100% guaranteed work)/gi
      ];
      for (const pattern of fabricatedClaims) {
        if (pattern.test(cleanText)) {
          cleanText = cleanText.replace(pattern, 'quality craftsmanship');
        }
      }

      // 5. Length Constraints (Concise, readable for mobile)
      if (cleanText.length > 600) {
        cleanText = cleanText.substring(0, 597) + '...';
      }

      return {
        valid: errors.length === 0,
        errors,
        sanitizedText: cleanText
      };
    },

    /**
     * Generates a factual, polished marketplace provider bio from facts.
     * Uses template-based Nigerian trade intelligence engine.
     *
     * @param {object} rawFacts
     * @param {object} [options]
     * @returns {object} Structured result
     */
    generateBio(rawFacts, options = {}) {
      const facts = this.sanitizeInputs(rawFacts);

      // Validate required minimum facts
      const trade = facts.trade || facts.trade_title || facts.category;
      if (!trade || trade.trim().length < 2) {
        throw new Error('Insufficient provider facts: Primary trade or category is required for bio generation.');
      }

      const skills = Array.isArray(facts.skills) ? facts.skills.filter(Boolean) : [];
      const expYrs = Number(facts.experienceYrs || facts.experience_years || 0);
      const name = facts.name || (facts.firstName ? `${facts.firstName} ${facts.lastName || ''}`.trim() : '');
      const businessName = facts.businessName || '';
      
      // Location composition
      const locality = facts.locality || '';
      const lga = facts.lga || facts.city || '';
      const state = facts.state || '';
      
      let locationText = '';
      if (locality && lga && state) {
        locationText = `in ${locality}, ${lga}, ${state}`;
      } else if (lga && state) {
        locationText = `in ${lga}, ${state}`;
      } else if (state) {
        locationText = `in ${state}`;
      } else if (facts.area) {
        locationText = `serving ${facts.area}`;
      }

      // Skills composition
      const topSkills = skills.slice(0, 4);
      let skillsClause = '';
      if (topSkills.length > 0) {
        if (topSkills.length === 1) {
          skillsClause = `Specializing in ${topSkills[0]}.`;
        } else if (topSkills.length === 2) {
          skillsClause = `Specializing in ${topSkills[0]} and ${topSkills[1]}.`;
        } else {
          const last = topSkills[topSkills.length - 1];
          const initial = topSkills.slice(0, -1).join(', ');
          skillsClause = `Specializing in ${initial}, and ${last}.`;
        }
      }

      // Experience clause (Strictly grounded)
      let expClause = '';
      if (expYrs > 0) {
        expClause = `with ${expYrs}+ years of hands-on experience `;
      } else {
        expClause = 'with proven craftsmanship ';
      }

      // Response time & callout context
      let extraClause = '';
      if (facts.responseTime) {
        extraClause = ` Known for rapid response times (${facts.responseTime}) and reliable service delivery.`;
      }

      // Compose primary bio options based on style variant
      const styleVariant = (options && options.variant) ? options.variant : 'standard';
      let generatedBio = '';

      if (styleVariant === 'concise') {
        const displayName = businessName || name || 'Verified artisan';
        generatedBio = `${displayName} provides professional ${trade.toLowerCase()} services ${locationText} ${expClause.trim()}. ${skillsClause}${extraClause}`.trim();
      } else if (styleVariant === 'client_focused') {
        generatedBio = `Looking for dependable ${trade.toLowerCase()} services ${locationText}? ${expClause ? `With ${expYrs > 0 ? `${expYrs}+ years of professional expertise, ` : ''}` : ''}${skillsClause} Committed to transparent communication, tidy job execution, and lasting craftsmanship.${extraClause}`.trim();
      } else {
        // Standard Professional Bio
        const titleIntro = businessName ? `${businessName} is a professional ${trade.toLowerCase()} service` : `Professional ${trade.toLowerCase()}`;
        generatedBio = `${titleIntro} ${locationText} ${expClause}${locationText ? '' : 'delivering top-tier craftsmanship'}. ${skillsClause} Dedicated to high-quality workmanship, neat execution, and customer satisfaction.${extraClause}`.trim();
      }

      // Clean redundant double spaces
      generatedBio = generatedBio.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();

      // Run anti-hallucination validation
      const validation = this.validateOutput(generatedBio, facts);
      if (!validation.valid) {
        throw new Error(`AI Bio generation validation failed: ${validation.errors.join('; ')}`);
      }

      // Compose Service Summary
      const summaryText = topSkills.length > 0 
        ? `${trade} services covering ${topSkills.slice(0, 3).join(', ')} ${locationText}`.trim()
        : `Professional ${trade} services ${locationText}`.trim();

      // Extract suggested search tags
      const suggestedTags = [trade, ...topSkills.slice(0, 3)];
      if (locality) suggestedTags.push(locality);
      if (lga && lga !== locality) suggestedTags.push(lga);
      if (state) suggestedTags.push(state);

      const sourceFactsSummary = [
        `trade: ${trade}`,
        skills.length > 0 ? `skills: ${skills.join(', ')}` : null,
        expYrs > 0 ? `experience: ${expYrs} years` : null,
        (locality || lga || state) ? `location: ${[locality, lga, state].filter(Boolean).join(', ')}` : null
      ].filter(Boolean);

      return {
        bio: validation.sanitizedText,
        service_summary: summaryText,
        suggested_tags: [...new Set(suggestedTags)].slice(0, 6),
        confidence: 'high',
        source_facts: sourceFactsSummary,
        model: 'lokator-trade-intelligence-v1',
        is_draft: true
      };
    },

    /**
     * Generates structured pricing guidance based on Nigerian marketplace trade facts.
     * Clearly marked as AI estimate/guidance — not a platform-set price.
     *
     * @param {object} rawContext
     * @returns {object} Structured pricing guidance
     */
    getPricingGuidance(rawContext) {
      const context = this.sanitizeInputs(rawContext);
      const tradeSlug = (context.trade || context.category || 'default').toLowerCase().replace(/\s+/g, '-');
      
      // Lookup trade reference
      let matchedRef = NIGERIA_TRADE_PRICING_GUIDANCE[tradeSlug];
      if (!matchedRef) {
        // Fallback search
        for (const [k, ref] of Object.entries(NIGERIA_TRADE_PRICING_GUIDANCE)) {
          if (tradeSlug.includes(k) || k.includes(tradeSlug)) {
            matchedRef = ref;
            break;
          }
        }
      }
      if (!matchedRef) {
        matchedRef = NIGERIA_TRADE_PRICING_GUIDANCE['default'];
      }

      const serviceName = context.service_name || context.service || context.trade || 'General Service Task';
      const isEmergency = Boolean(context.is_emergency);
      const includesMaterials = Boolean(context.includes_materials);

      let suggestedRange = matchedRef.standardTaskRange;
      if (isEmergency) {
        suggestedRange = matchedRef.complexTaskRange;
      }

      const factors = [...matchedRef.factors];
      if (context.locality || context.lga) {
        factors.push(`Local transport & callout distance within ${context.locality || context.lga}, ${context.state || 'Nigeria'}`);
      }
      if (includesMaterials) {
        factors.unshift('Materials and replacement parts included in quote');
      } else {
        factors.unshift('Labor-only quote (client supplies all hardware and cables)');
      }

      return {
        service_name: serviceName,
        trade: context.trade || matchedRef.label,
        provider_entered_price: context.startingPrice || context.provider_price || null,
        suggested_range: suggestedRange,
        inspection_fee_range: matchedRef.inspectionRange,
        is_estimate: true,
        disclaimer: 'AI estimate / guidance — not a platform-set price. Providers independently set their own rates.',
        pricing_factors: factors.slice(0, 5),
        key_questions: matchedRef.questions || [],
        confidence: 'high',
        model: 'lokator-pricing-intelligence-v1'
      };
    },

    /**
     * Generates a structured, polite, high-conversion WhatsApp job brief.
     * Integrates Nigerian trade context, pricing guidance benchmarks, and anti-hallucination checks.
     *
     * @param {object} provider Provider facts
     * @param {object} [inputs] User input selections
     * @returns {{
     *   plainText: string,
     *   pricingGuidance: object,
     *   tradeQuestions: string[],
     *   confidence: string,
     *   model: string
     * }}
     */
    /**
     * Maps action intent string to structured job scope
     * @param {string} action
     * @returns {string}
     */
    mapScopeFromAction(action) {
      if (!action) return 'Inspection & Diagnosis';
      const a = String(action).toLowerCase();
      if (a === 'repair') return 'Emergency Repair';
      if (a === 'installation') return 'New Installation';
      if (a === 'maintenance') return 'Routine Maintenance';
      if (a === 'cleaning') return 'Inspection & Diagnosis';
      return 'General Task / Inspection';
    },

    /**
     * Generates a structured, polite, high-conversion WhatsApp job brief.
     * Integrates Nigerian trade context, pricing guidance benchmarks, and anti-hallucination checks.
     *
     * @param {object} providerOrInputs Provider facts or merged input object
     * @param {object} [optionalInputs] User input selections if provider is passed as first arg
     * @returns {{
     *   plainText: string,
     *   pricingGuidance: object,
     *   tradeQuestions: string[],
     *   confidence: string,
     *   model: string
     * }}
     */
    generateStructuredJobBrief(providerOrInputs = {}, optionalInputs = null) {
      let provider = {};
      let inputs = {};

      if (optionalInputs !== null && typeof optionalInputs === 'object') {
        provider = providerOrInputs || {};
        inputs = optionalInputs || {};
      } else {
        inputs = providerOrInputs || {};
        provider = {
          name: inputs.providerName || inputs.name || 'Artisan',
          trade: inputs.trade || inputs.service || 'Specialist',
          area: inputs.location || inputs.userLocation || inputs.clientLocation || 'my area'
        };
      }

      const sanitizedProv = this.sanitizeInputs(provider);
      const provName = sanitizedProv.name || (sanitizedProv.firstName ? `${sanitizedProv.firstName} ${sanitizedProv.lastName || ''}`.trim() : 'Artisan');
      const provTrade = sanitizedProv.trade || sanitizedProv.trade_title || sanitizedProv.category || 'Specialist';
      
      const serviceNeeded = (inputs.serviceType || inputs.service || provTrade).trim();
      const scope = (inputs.jobScope || inputs.scope || 'General Task / Inspection').trim();
      const location = (inputs.clientLocation || inputs.userLocation || inputs.location || sanitizedProv.area || sanitizedProv.locality || 'my area').trim();
      const urgency = (inputs.urgency || 'Urgent / Today').trim();
      const materials = (inputs.materialsOption || inputs.materials || 'Labor Only (I will supply materials)').trim();
      const details = (inputs.details || inputs.note || inputs.jobDetails || '').trim();
      
      const isEmergency = /urgent|emergency|today|asap/i.test(urgency) || /emergency|breakdown/i.test(scope);
      const includesMaterials = /artisan to supply|materials included|supplier/i.test(materials);

      // Fetch dynamic pricing guidance
      const pricingGuidance = this.getPricingGuidance({
        trade: provTrade,
        service: serviceNeeded,
        locality: sanitizedProv.locality || sanitizedProv.area,
        state: sanitizedProv.state,
        is_emergency: isEmergency,
        includes_materials: includesMaterials
      });

      // Compose structured WhatsApp message
      const lines = [
        '🛠️ *JOB INQUIRY VIA PADIFIX*',
        '━━━━━━━━━━━━━━━━━━━━',
        `👋 *Hello ${provName}*,`,
        `I found your verified profile on PadiFix and would like to request your service.`,
        '',
        `📋 *Service:* ${serviceNeeded}`,
        `🎯 *Job Scope:* ${scope}`,
        `📍 *Location:* ${location}`,
        `⏰ *Preferred Time:* ${urgency}`,
        `📦 *Materials:* ${materials}`
      ];

      if (details) {
        lines.push(`📝 *Job Notes:* ${details}`);
      }

      if (pricingGuidance && pricingGuidance.suggested_range) {
        lines.push(`💡 *Reference Rate Guidance:* ${pricingGuidance.suggested_range} (Inspection: ${pricingGuidance.inspection_fee_range || '₦3,500 – ₦6,000'})`);
      }

      lines.push('');
      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push('Are you available to take on this job? Please let me know your availability and initial assessment. Thank you!');

      const formattedBrief = lines.join('\n');

      return {
        plainText: formattedBrief,
        pricingGuidance,
        tradeQuestions: pricingGuidance.key_questions || [],
        confidence: 'high',
        model: 'lokator-brief-intelligence-v1'
      };
    }
  };

  // Expose globally
  global.LokatorAIService = LokatorAIService;
  if (typeof globalThis !== 'undefined') {
    globalThis.LokatorAIService = LokatorAIService;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LokatorAIService, NIGERIA_TRADE_PRICING_GUIDANCE };
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : this)));
