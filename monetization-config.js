// ============================================================================
// PADIFIX — MARKETPLACE GROWTH & MONETIZATION CONFIGURATION (monetization-config.js)
// Authoritative pricing, feature flags, cluster capacity guards & telemetry schema
// ============================================================================

(function (global) {
  'use strict';

  const NAME = 'PadiFix Marketplace Growth & Monetization Architecture';
  const VERSION = '4.0.0';
  const PHASE = '004';

  // 1. FEATURE FLAGS
  // Safely controls rollout of monetization layers without destructive code surgery
  const FEATURE_FLAGS = {
    // Core Gate: Controls whether any sponsored cards appear in customer searches
    sponsoredListingsEnabled: false,

    // Provider Badging: Controls display of verified identity & reputation badges
    premiumProvidersEnabled: true,

    // Recurring Subscriptions: Locked until marketplace reaches critical liquidity
    providerSubscriptionsEnabled: false,

    // Third-Party Ad Networks: Strictly locked to protect page speed & conversion
    advertisingEnabled: false,

    // Rewarded Research / Surveys: Locked to protect core search task completion
    surveysEnabled: false,

    // Non-PII Telemetry & Funnel Tracking
    monetizationAnalyticsEnabled: true,

    // Payment Processing Mode: Strictly false for test sandbox mode
    paymentLiveMode: false,

    // Phase 005: Provider Growth & Liquidity Engine Flags
    providerProfileCompletionEnabled: true,
    providerAnalyticsEnabled: true,
    providerRecruitmentCtaEnabled: true,
    providerReferralEnabled: true,
    providerVerificationEnabled: true,

    // Phase 006: Provider Verification & Trust Infrastructure Flags
    liveKycGatewayEnabled: false // Strictly false: external KYC vendor network calls gated
  };

  // 2. MARKETPLACE RULES & PRIVACY CONFIGURATION
  const CONFIG = {
    RULES: {
      COMMISSION_PERCENT: 0,
      FREE_PHONE_CALLS: true,
      FREE_WHATSAPP_MESSAGING: true,
      FREE_PROFILE_LISTING: true,
      MAX_SPONSORED_PER_PAGE: 2
    },
    FORBIDDEN_KEYS: ['password', 'token', 'jwt', 'card', 'cvv', 'pan', 'nin', 'bvn', 'secret']
  };

  // 3. AUTHORITATIVE MONETIZATION PRODUCTS & PRICING (NGN)
  // Amounts are stored in both Nigerian Naira and Kobo (1 NGN = 100 Kobo)
  const PRODUCTS = {
    PROMOTED_LISTING_STARTER: {
      id: 'PROMOTED_LISTING_STARTER',
      name: 'Promoted Category Placement — Starter Pilot',
      description: 'Priority sponsored visibility at top of category searches within your registered LGA.',
      priceAmount: 2000,
      priceKobo: 200000,
      priceDisplay: '₦2,000',
      billingInterval: '14_days',
      durationDays: 14,
      entitlementKey: 'PROMOTED_LISTING',
      maxInventoryPerCluster: 2,
      tier: 'STARTER',
      priorityRank: 1,
      allowedPilotMarkets: ['Delta', 'Edo', 'Lagos', 'Abuja']
    },

    TRUST_VERIFICATION_AUDIT: {
      id: 'TRUST_VERIFICATION_AUDIT',
      name: 'Verified Trust Assurance & Compliance Review',
      description: 'Dedicated identity & credential review (vNIN / CAC) by compliance officer with official verified badge.',
      priceAmount: 3500,
      priceKobo: 350000,
      priceDisplay: '₦3,500',
      billingInterval: 'one_time',
      durationDays: null,
      entitlementKey: 'VERIFIED_TRUST_BADGE',
      maxInventoryPerCluster: null, // Unlimited (subject to passing strict verification criteria)
      guaranteeApproval: false,
      tier: 'COMPLIANCE',
      priorityRank: 2,
      noticeText: 'Audit review fee covers identity verification processing and does not guarantee badge approval without valid NIMC documentation.'
    },

    ANNUAL_PRO_SUITE: {
      id: 'ANNUAL_PRO_SUITE',
      name: 'PadiFix Pro Artisan Suite (Annual)',
      description: 'Comprehensive business bundle: Verified Trust Badge, monthly discovery insights, and priority support.',
      priceAmount: 18000,
      priceKobo: 1800000,
      priceDisplay: '₦18,000 / year',
      billingInterval: 'annual',
      durationDays: 365,
      entitlementKey: 'PRO_SUITE',
      maxInventoryPerCluster: null,
      tier: 'PRO',
      priorityRank: 3
    }
  };

  // 4. TELEMETRY EVENT SCHEMA FOR MONETIZATION
  // Strict Privacy: zero PII, zero card numbers, zero passwords, zero NIN/BVN
  const MONETIZATION_EVENTS = {
    PLAN_VIEWED: 'monetization_plan_viewed',
    CTA_CLICKED: 'monetization_cta_clicked',
    CHECKOUT_STARTED: 'monetization_checkout_started',
    CHECKOUT_COMPLETED: 'monetization_checkout_completed',
    SPONSORED_IMPRESSION: 'sponsored_impression',
    SPONSORED_CLICK: 'sponsored_click',
    SPONSORED_CONTACT: 'sponsored_contact_clicked',
    CHECKOUT_INIT: 'pilot_checkout_initiated',
    PAYMENT_SUCCESS: 'pilot_payment_success',
    CAPACITY_REACHED: 'monetization_capacity_reached',
    FEEDBACK_SUBMITTED: 'monetization_feedback_submitted',

    // Phase 005 Provider Growth & Trust Events
    PROVIDER_JOIN_STARTED: 'provider_join_started',
    PROVIDER_REGISTRATION_COMPLETED: 'provider_registration_completed',
    PROVIDER_PROFILE_COMPLETED: 'provider_profile_completed',
    PROVIDER_SHARE_CLICKED: 'provider_share_clicked',
    PROVIDER_RECRUITMENT_CTA_CLICKED: 'provider_recruitment_cta_clicked',
    PROVIDER_ANALYTICS_VIEWED: 'provider_analytics_viewed',
    PROVIDER_VERIFICATION_STARTED: 'provider_verification_started',

    // Phase 006 Verification Lifecycle Events
    VERIFICATION_STARTED: 'verification_started',
    VERIFICATION_REQUEST_CREATED: 'verification_request_created',
    VERIFICATION_COMPLETED: 'verification_completed',
    VERIFICATION_FAILED: 'verification_failed',
    VERIFICATION_STATUS_VIEWED: 'verification_status_viewed'
  };

  // 5. ADMIN CONTROLS & ROLE-BASED ACCESS
  const ADMIN_CONTROLS = {
    ROLES: {
      super_admin: ['can_manage_promotions', 'can_trigger_refunds', 'can_modify_pricing', 'can_audit_compliance'],
      compliance_officer: ['can_audit_compliance', 'can_view_reports'],
      support_agent: ['can_view_reports']
    }
  };

  // 6. CURRENCY FORMATTING UTILITY (Nigerian Naira / NGN)
  function formatNaira(amount) {
    const num = Number(amount) || 0;
    return `₦${num.toLocaleString('en-NG')}`;
  }

  // 7. TELEMETRY SANITIZATION (Strict Non-PII Filter)
  function sanitizeTelemetryPayload(payload) {
    if (!payload || typeof payload !== 'object') return {};
    const clean = {};
    const forbidden = CONFIG.FORBIDDEN_KEYS;
    for (const [k, v] of Object.entries(payload)) {
      const lowerK = k.toLowerCase();
      const isForbidden = forbidden.some(f => lowerK.includes(f));
      if (!isForbidden) {
        clean[k] = v;
      }
    }
    return clean;
  }

  // 8. CLUSTER CAPACITY GUARD
  // Prevents over-commercialization by capping sponsored placements at max 2 per Category/State/LGA
  function checkClusterCapacity(category, state, lga, activePromotions = []) {
    const normCat = String(category || '').toLowerCase().trim();
    const normState = String(state || '').toLowerCase().trim();
    const normLga = String(lga || '').toLowerCase().trim();
    const nowMs = Date.now();
    const maxCapacity = PRODUCTS.PROMOTED_LISTING_STARTER.maxInventoryPerCluster;

    const matchingActive = (activePromotions || []).filter(p => {
      if (!p || p.status !== 'active') return false;
      if (p.effective_until && new Date(p.effective_until).getTime() <= nowMs) return false;
      if (p.expiresAt && new Date(p.expiresAt).getTime() <= nowMs) return false;
      const pCat = String(p.category || '').toLowerCase().trim();
      const pState = String(p.state || '').toLowerCase().trim();
      const pLga = String(p.lga || '').toLowerCase().trim();
      return pCat === normCat && pState === normState && pLga === normLga;
    });

    return {
      available: matchingActive.length < maxCapacity,
      activeCount: matchingActive.length,
      maxCapacity: maxCapacity,
      remainingSlots: Math.max(0, maxCapacity - matchingActive.length),
      category,
      state,
      lga
    };
  }

  // 9. AUTHORITATIVE PROVIDER VERIFICATION LIFECYCLE & STATE RESOLVER
  const PROVIDER_VERIFICATION_STATES = {
    UNVERIFIED: 'Self-Reported Profile',
    AVAILABLE: 'Verification Available',
    PENDING: 'Pending Compliance Review',
    VERIFIED_PLATFORM: 'Platform Reviewed',
    VERIFIED_NIN: 'National NIN Verified'
  };

  const VERIFICATION_STATE_DETAILS = {
    UNVERIFIED: {
      key: 'UNVERIFIED',
      label: 'Self-Reported Profile',
      publicBadgeText: 'Self-Reported Profile',
      badgeClass: 'profile-verified-pill unverified',
      icon: 'ℹ️',
      color: '#94A3B8',
      description: 'Provider registered details independently. Information has not yet undergone official platform document review.',
      isVerified: false,
      isNinVerified: false,
      isPending: false,
      canRequestVerification: true
    },
    AVAILABLE: {
      key: 'AVAILABLE',
      label: 'Verification Available',
      publicBadgeText: 'Self-Reported Profile',
      badgeClass: 'profile-verified-pill unverified',
      icon: 'ℹ️',
      color: '#3B82F6',
      description: 'Profile has met foundational completeness requirements (>= 80%) and is eligible to submit credentials for official verification.',
      isVerified: false,
      isNinVerified: false,
      isPending: false,
      canRequestVerification: true
    },
    PENDING: {
      key: 'PENDING',
      label: 'Pending Compliance Review',
      publicBadgeText: 'Pending Verification',
      badgeClass: 'profile-verified-pill pending',
      icon: '⏳',
      color: '#F59E0B',
      description: 'Verification documents submitted and currently undergoing review by PadiFix compliance officers.',
      isVerified: false,
      isNinVerified: false,
      isPending: true,
      canRequestVerification: false
    },
    VERIFIED_PLATFORM: {
      key: 'VERIFIED_PLATFORM',
      label: 'Platform Reviewed',
      publicBadgeText: 'Platform Reviewed',
      badgeClass: 'profile-verified-pill verified',
      icon: '✓',
      color: '#00A859',
      description: 'Business registration, contact authenticity, and trade competence reviewed and confirmed by PadiFix compliance.',
      isVerified: true,
      isNinVerified: false,
      isPending: false,
      canRequestVerification: false
    },
    VERIFIED_NIN: {
      key: 'VERIFIED_NIN',
      label: 'National NIN Verified',
      publicBadgeText: 'National NIN Verified',
      badgeClass: 'profile-verified-pill verified',
      icon: '🛡️',
      color: '#00A859',
      description: 'Artisan identity validated against Nigeria National Identity Management Commission standards via Virtual NIN (vNIN).',
      isVerified: true,
      isNinVerified: true,
      isPending: false,
      canRequestVerification: false
    }
  };

  /**
   * Centrally resolves the authoritative verification state for any provider.
   * Eliminates ad-hoc or contradictory verification logic across pages.
   */
  function resolveVerificationState(provider) {
    if (!provider || typeof provider !== 'object') {
      return Object.assign({}, VERIFICATION_STATE_DETAILS.UNVERIFIED);
    }

    const isNin = Boolean(
      provider.nin_verified === true ||
      provider.ninVerified === true ||
      (provider.verification_type === 'vnin' && (provider.is_verified || provider.isVerified || provider.verification_status === 'approved'))
    );
    if (isNin) {
      return Object.assign({}, VERIFICATION_STATE_DETAILS.VERIFIED_NIN);
    }

    const isPlat = Boolean(
      provider.is_verified === true ||
      provider.isVerified === true ||
      provider.verification_status === 'verified_platform' ||
      provider.verification_status === 'approved'
    );
    if (isPlat) {
      return Object.assign({}, VERIFICATION_STATE_DETAILS.VERIFIED_PLATFORM);
    }

    const isPending = Boolean(
      provider.verification_status === 'pending' ||
      provider.verificationStatus === 'pending' ||
      provider.verification_requested === true
    );
    if (isPending) {
      return Object.assign({}, VERIFICATION_STATE_DETAILS.PENDING);
    }

    const completeness = calculateProfileCompleteness(provider);
    if (completeness.isComplete || completeness.score >= 80) {
      return Object.assign({}, VERIFICATION_STATE_DETAILS.AVAILABLE);
    }

    return Object.assign({}, VERIFICATION_STATE_DETAILS.UNVERIFIED);
  }

  /**
   * Returns transparent, explainable trust signals for a provider without opaque/fake scores.
   */
  function getTrustSignals(provider, reviews = []) {
    if (!provider || typeof provider !== 'object') {
      return {
        verificationState: 'UNVERIFIED',
        verificationDetails: VERIFICATION_STATE_DETAILS.UNVERIFIED,
        completenessScore: 0,
        isComplete: false,
        reviewCount: 0,
        rating: 0,
        tenureYears: 0,
        trustPillars: []
      };
    }

    const verDetails = resolveVerificationState(provider);
    const completeness = calculateProfileCompleteness(provider);
    const revCount = (Array.isArray(reviews) && reviews.length > 0) 
      ? reviews.length 
      : (provider.reviewsCount || provider.reviews_count || (Array.isArray(provider.reviews) ? provider.reviews.length : 0));
    const avgRating = Number(provider.rating != null ? provider.rating : 0);
    const tenure = Number(provider.experience_years || provider.experienceYrs || 1);

    const pillars = [];
    if (verDetails.isNinVerified) {
      pillars.push({ key: 'nin', icon: '🛡️', title: 'National NIN Verified', text: 'Identity validated via Virtual NIN tokenization.' });
    } else if (verDetails.isVerified) {
      pillars.push({ key: 'platform', icon: '✓', title: 'Platform Reviewed', text: 'Trade credentials and identity vetted by PadiFix compliance.' });
    } else {
      pillars.push({ key: 'self_reported', icon: 'ℹ️', title: 'Self-Reported Profile', text: 'Listing details supplied directly by the artisan.' });
    }

    if (provider.phone || provider.whatsapp_number) {
      pillars.push({ key: 'contact', icon: '📞', title: 'Direct Contact Ready', text: 'Direct WhatsApp and phone calling verified on Nigerian telecom networks.' });
    }

    if (provider.state && (provider.lga || provider.city)) {
      pillars.push({ key: 'location', icon: '📍', title: 'Local Presence', text: `Operating in ${provider.lga || provider.city}, ${provider.state}.` });
    }

    if (revCount > 0) {
      pillars.push({ key: 'reviews', icon: '⭐', title: 'Customer Feedback', text: `${revCount} customer review${revCount === 1 ? '' : 's'} (★ ${avgRating.toFixed(1)}).` });
    } else {
      pillars.push({ key: 'new_listing', icon: '🌱', title: 'New Marketplace Listing', text: 'Recently joined PadiFix; eager for initial verified reviews.' });
    }

    return {
      verificationState: verDetails.key,
      verificationDetails: verDetails,
      completenessScore: completeness.score,
      isComplete: completeness.isComplete,
      reviewCount: revCount,
      rating: avgRating,
      tenureYears: tenure,
      trustPillars: pillars
    };
  }

  // 10. PHASE 005: DETERMINISTIC PROFILE COMPLETENESS MODEL (100-point system)
  const PROFILE_COMPLETENESS_WEIGHTS = {
    identity: 15,       // Name & trade name
    contact: 15,        // Direct phone & WhatsApp
    trade_and_skills: 20, // Trade category + >= 1 verified skill
    location: 20,       // State + LGA / Operating area
    photo: 10,          // Avatar / Profile photo uploaded
    bio: 10,            // Factual craftsmanship biography
    pricing: 5,         // Benchmark starting price or pricing guide
    hours: 5            // Operating hours / weekday availability
  };

  /**
   * Deterministically calculates provider profile completeness score (0 - 100%)
   * and returns actionable missing items for progressive completion.
   */
  function calculateProfileCompleteness(provider) {
    if (!provider || typeof provider !== 'object') {
      return {
        score: 0,
        percentage: '0%',
        missingItems: [
          { key: 'identity', label: 'Add full name and trade title', actionTab: 'profile' },
          { key: 'contact', label: 'Add WhatsApp or direct phone number', actionTab: 'profile' },
          { key: 'trade_and_skills', label: 'Select trade and add specialized skills', actionTab: 'services' },
          { key: 'location', label: 'Set your Nigerian State and operating LGA', actionTab: 'profile' }
        ],
        isComplete: false
      };
    }

    let score = 0;
    const missing = [];

    // 1. Identity (15 pts)
    const hasName = Boolean((provider.name && provider.name.trim().length > 2) || 
                            (provider.firstName && provider.lastName));
    const hasTrade = Boolean(provider.trade && provider.trade.trim().length > 2);
    if (hasName && hasTrade) {
      score += PROFILE_COMPLETENESS_WEIGHTS.identity;
    } else {
      missing.push({ key: 'identity', label: 'Complete name and craft title', actionTab: 'profile' });
    }

    // 2. Direct Contact (15 pts)
    const hasPhone = Boolean(provider.phone && String(provider.phone).replace(/\D/g, '').length >= 10);
    const hasWa = Boolean(provider.whatsapp || provider.whatsapp_number || hasPhone);
    if (hasPhone || hasWa) {
      score += PROFILE_COMPLETENESS_WEIGHTS.contact;
    } else {
      missing.push({ key: 'contact', label: 'Add WhatsApp phone number', actionTab: 'profile' });
    }

    // 3. Trade & Skills (20 pts)
    const skillsList = Array.isArray(provider.skills) ? provider.skills : [];
    const hasCategory = Boolean(provider.category || provider.slug || provider.primary_category_slug);
    if (hasCategory && skillsList.length >= 1) {
      score += PROFILE_COMPLETENESS_WEIGHTS.trade_and_skills;
    } else {
      missing.push({ key: 'trade_and_skills', label: 'Add at least one specialized skill', actionTab: 'services' });
    }

    // 4. Location (20 pts)
    const hasState = Boolean(provider.state || (provider.city && provider.city.length > 2));
    const hasArea = Boolean(provider.lga || provider.area || provider.address);
    if (hasState && hasArea) {
      score += PROFILE_COMPLETENESS_WEIGHTS.location;
    } else {
      missing.push({ key: 'location', label: 'Specify your State and LGA area', actionTab: 'profile' });
    }

    // 5. Photo (10 pts)
    const hasPhoto = Boolean(provider.avatarUrl || provider.avatar_url || (provider.avatarBg && provider.avatarBg.includes('url')));
    if (hasPhoto) {
      score += PROFILE_COMPLETENESS_WEIGHTS.photo;
    } else {
      missing.push({ key: 'photo', label: 'Upload a clear profile photo', actionTab: 'profile' });
    }

    // 6. Bio (10 pts)
    const hasBio = Boolean(provider.bio && provider.bio.trim().length >= 20);
    if (hasBio) {
      score += PROFILE_COMPLETENESS_WEIGHTS.bio;
    } else {
      missing.push({ key: 'bio', label: 'Add a helpful craftsmanship bio', actionTab: 'profile' });
    }

    // 7. Pricing Guide (5 pts)
    const hasPricing = Boolean(
      (provider.startingPrice && provider.startingPrice.trim().length > 0) ||
      (provider.starting_price && provider.starting_price.trim().length > 0) ||
      (Array.isArray(provider.pricingGuide) && provider.pricingGuide.length > 0) ||
      (Array.isArray(provider.pricing_guide) && provider.pricing_guide.length > 0)
    );
    if (hasPricing) {
      score += PROFILE_COMPLETENESS_WEIGHTS.pricing;
    } else {
      missing.push({ key: 'pricing', label: 'Set starting price / quote estimate', actionTab: 'pricing' });
    }

    // 8. Working Hours (5 pts)
    const hasHours = Boolean(
      provider.workingHours || 
      provider.working_hours || 
      provider.weekdayHours || 
      provider.weekday_hours
    );
    if (hasHours) {
      score += PROFILE_COMPLETENESS_WEIGHTS.hours;
    } else {
      missing.push({ key: 'hours', label: 'Set weekly working hours', actionTab: 'hours' });
    }

    return {
      score,
      percentage: `${Math.round(score)}%`,
      missingItems: missing,
      isComplete: score >= 80
    };
  }

  // 11. PUBLIC MONETIZATION & PROVIDER GROWTH API
  const PadiFixMonetization = {
    NAME,
    VERSION,
    PHASE,
    FEATURE_FLAGS,
    CONFIG,
    PRODUCTS,
    EVENTS: MONETIZATION_EVENTS,
    ADMIN_CONTROLS,
    VERIFICATION_STATES: PROVIDER_VERIFICATION_STATES,
    VERIFICATION_STATE_DETAILS,
    PROFILE_COMPLETENESS_WEIGHTS,
    formatNaira,
    sanitizeTelemetryPayload,
    checkClusterCapacity,
    calculateProfileCompleteness,
    resolveVerificationState,
    getTrustSignals,

    isFeatureEnabled(flagName) {
      return Boolean(FEATURE_FLAGS[flagName]);
    },

    setFeatureFlag(flagName, value) {
      if (Object.prototype.hasOwnProperty.call(FEATURE_FLAGS, flagName)) {
        FEATURE_FLAGS[flagName] = Boolean(value);
        return true;
      }
      return false;
    },

    getProduct(productId) {
      return PRODUCTS[productId] || null;
    }
  };

  // Export for Browser or Node.js environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PadiFixMonetization;
  }
  if (typeof global !== 'undefined') {
    global.PadiFixMonetization = PadiFixMonetization;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

