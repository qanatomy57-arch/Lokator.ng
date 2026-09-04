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
    paymentLiveMode: false
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
    FEEDBACK_SUBMITTED: 'monetization_feedback_submitted'
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

  // 9. PUBLIC MONETIZATION API
  const PadiFixMonetization = {
    NAME,
    VERSION,
    PHASE,
    FEATURE_FLAGS,
    CONFIG,
    PRODUCTS,
    EVENTS: MONETIZATION_EVENTS,
    ADMIN_CONTROLS,
    formatNaira,
    sanitizeTelemetryPayload,
    checkClusterCapacity,

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
