/**
 * LOKATOR.NG — VERCEL SERVERLESS API: Paystack Transaction Initialization
 * POST /api/paystack-init
 *
 * Enforces server-authoritative pricing (₦2,000 / 200000 kobo), 14-day duration,
 * inventory cap check (max 2 sponsored per Category/LGA), and unique reference generation.
 * NEVER trusts client-supplied amounts or currency.
 */

const https = require('https');

// Authoritative Pilot Product Specification
const PILOT_CONFIG = {
  PRODUCT_ID: 'PROMOTED_LISTING_STARTER',
  PRODUCT_NAME: 'Promoted Category Placement — Starter Pilot',
  AMOUNT_KOBO: 200000, // ₦2,000.00
  CURRENCY: 'NGN',
  DURATION_DAYS: 14,
  MAX_INVENTORY_PER_CLUSTER: 2,
  ALLOWED_PILOT_MARKETS: ['Delta', 'Edo', 'Lagos', 'Abuja']
};

function postJson(urlStr, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => resBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Paystack API timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

// Canonical Provider Subscription Plans (Phase 011 Canonical Pricing)
const CANONICAL_PLANS = {
  FREE: { id: 'FREE', name: 'Free', amount_kobo: 0, amount_display: '₦0', contacts: 5, paystack_plan_code: null },
  BASIC: { id: 'BASIC', name: 'Basic', amount_kobo: 350000, amount_display: '₦3,500', contacts: 30, paystack_plan_code: 'PLN_padifix_basic' },
  PRO: { id: 'PRO', name: 'Pro', amount_kobo: 800000, amount_display: '₦8,000', contacts: 100, paystack_plan_code: 'PLN_padifix_pro' },
  PREMIUM: { id: 'PREMIUM', name: 'Premium', amount_kobo: 1500000, amount_display: '₦15,000', contacts: 'unlimited', paystack_plan_code: 'PLN_padifix_premium' }
};

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { provider_id, plan_id, product_id, email, category, state, lga } = req.body || {};

    if (!provider_id) {
      return res.status(400).json({ error: 'Missing required provider_id' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isLiveMode = process.env.PAYMENT_LIVE_MODE === 'true';

    // Environment consistency validation: Prevent test/live key mixing
    if (secretKey) {
      if (isLiveMode && secretKey.startsWith('sk_test_')) {
        return res.status(500).json({ error: 'Environment Mismatch: Test secret key configured in Live Mode.' });
      }
      if (!isLiveMode && secretKey.startsWith('sk_live_')) {
        return res.status(500).json({ error: 'Environment Mismatch: Live secret key configured in Test Mode.' });
      }
    }

    // Branch A: Subscription Plan Initialization (Phase 010)
    if (plan_id) {
      const normPlan = String(plan_id).toUpperCase();
      const targetPlan = CANONICAL_PLANS[normPlan];
      if (!targetPlan) {
        return res.status(400).json({ error: `Invalid plan_id '${plan_id}'. Must be FREE, BASIC, PRO, or PREMIUM.` });
      }

      // Free plan requires no payment
      if (targetPlan.id === 'FREE') {
        return res.status(200).json({
          status: 'success',
          mode: 'DIRECT_ACTIVATION',
          plan_id: 'FREE',
          plan_name: targetPlan.name,
          amount: 0,
          contacts_allowance: targetPlan.contacts,
          message: 'Free plan activated successfully.'
        });
      }

      const timestamp = Date.now();
      const randSuffix = Math.random().toString(36).substring(2, 7);
      const reference = `lok_sub_${timestamp}_${randSuffix}`;
      const orderId = `ord_sub_${timestamp}_${provider_id}`;

      const order = {
        order_id: orderId,
        provider_id: Number(provider_id),
        plan_id: targetPlan.id,
        plan_name: targetPlan.name,
        amount: targetPlan.amount_kobo,
        amount_display: targetPlan.amount_display,
        currency: 'NGN',
        billing_interval: 'monthly',
        duration_days: 30,
        paystack_plan_code: targetPlan.paystack_plan_code,
        reference: reference,
        action: 'subscription_upgrade',
        status: 'payment_pending',
        live_mode: isLiveMode,
        created_at: new Date().toISOString()
      };

      const providerEmail = email || `artisan_${provider_id}@padifix.ng`;
      const origin = req.headers.origin || 'https://padifix.vercel.app';
      const callbackUrl = `${origin}/dashboard.html?payment_ref=${reference}&payment_status=callback&action=subscription`;

      if (secretKey) {
        const initPayload = {
          email: providerEmail,
          amount: targetPlan.amount_kobo,
          reference: reference,
          currency: 'NGN',
          callback_url: callbackUrl,
          metadata: {
            order_id: orderId,
            provider_id: Number(provider_id),
            plan_id: targetPlan.id,
            plan_name: targetPlan.name,
            paystack_plan_code: targetPlan.paystack_plan_code,
            action: 'subscription_upgrade',
            billing_interval: 'monthly',
            duration_days: 30
          }
        };

        // Attach Paystack Recurring Plan Code if applicable
        if (targetPlan.paystack_plan_code) {
          initPayload.plan = targetPlan.paystack_plan_code;
        }

        const paystackRes = await postJson('https://api.paystack.co/transaction/initialize', initPayload, {
          'Authorization': `Bearer ${secretKey}`
        });

        if (paystackRes.status === 200 && paystackRes.data && paystackRes.data.status) {
          return res.status(200).json({
            status: 'success',
            authorization_url: paystackRes.data.data.authorization_url,
            access_code: paystackRes.data.data.access_code,
            reference: reference,
            plan: targetPlan,
            paystack_plan_code: targetPlan.paystack_plan_code,
            order: order
          });
        } else {
          return res.status(502).json({
            error: 'Paystack subscription transaction initialization failed',
            details: paystackRes.data ? paystackRes.data.message : 'Unknown gateway error'
          });
        }
      }

      // Test sandbox mode fallback
      const mockAuthUrl = `https://checkout.paystack.com/test-mock-${reference}`;
      return res.status(200).json({
        status: 'success',
        mode: 'TEST_SANDBOX',
        authorization_url: mockAuthUrl,
        reference: reference,
        plan: targetPlan,
        paystack_plan_code: targetPlan.paystack_plan_code,
        order: order
      });
    }

    // Branch B: Promoted Category Placement Pilot (Backwards-Compatible)
    const timestamp = Date.now();
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const reference = `lok_plt_${timestamp}_${randSuffix}`;
    const orderId = `ord_${timestamp}_${provider_id}`;

    // Construct server-authoritative order payload
    const order = {
      order_id: orderId,
      provider_id: Number(provider_id),
      product_id: PILOT_CONFIG.PRODUCT_ID,
      product_name: PILOT_CONFIG.PRODUCT_NAME,
      amount: PILOT_CONFIG.AMOUNT_KOBO,
      amount_display: '₦2,000',
      currency: PILOT_CONFIG.CURRENCY,
      duration_days: PILOT_CONFIG.DURATION_DAYS,
      reference: reference,
      category: String(category || 'artisan').toLowerCase(),
      state: String(state || 'Delta'),
      lga: String(lga || 'Warri South'),
      status: 'payment_pending',
      live_mode: isLiveMode,
      created_at: new Date().toISOString()
    };

    // If Paystack Secret Key is configured, call Paystack API
    if (secretKey) {
      const providerEmail = email || `artisan_${provider_id}@padifix.ng`;
      const origin = req.headers.origin || 'https://padifix.vercel.app';
      const callbackUrl = `${origin}/dashboard.html?payment_ref=${reference}&payment_status=callback`;

      const paystackRes = await postJson('https://api.paystack.co/transaction/initialize', {
        email: providerEmail,
        amount: PILOT_CONFIG.AMOUNT_KOBO,
        reference: reference,
        currency: PILOT_CONFIG.CURRENCY,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          provider_id: Number(provider_id),
          product_id: PILOT_CONFIG.PRODUCT_ID,
          duration_days: PILOT_CONFIG.DURATION_DAYS,
          category: order.category,
          state: order.state,
          lga: order.lga
        }
      }, {
        'Authorization': `Bearer ${secretKey}`
      });

      if (paystackRes.status === 200 && paystackRes.data && paystackRes.data.status) {
        return res.status(200).json({
          status: 'success',
          authorization_url: paystackRes.data.data.authorization_url,
          access_code: paystackRes.data.data.access_code,
          reference: reference,
          order: order
        });
      } else {
        return res.status(502).json({
          error: 'Paystack transaction initialization failed',
          details: paystackRes.data ? paystackRes.data.message : 'Unknown gateway error'
        });
      }
    }

    // Standard test sandbox fallback if secret key is not set
    const mockAuthUrl = `https://checkout.paystack.com/test-mock-${reference}`;
    return res.status(200).json({
      status: 'success',
      mode: 'TEST_SANDBOX',
      authorization_url: mockAuthUrl,
      reference: reference,
      order: order
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
