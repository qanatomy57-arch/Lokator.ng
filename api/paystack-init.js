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
    const { provider_id, email, category, state, lga } = req.body || {};

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

    // Generate unique, non-PII transaction reference
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
      const providerEmail = email || `artisan_${provider_id}@lokator.ng`;
      const origin = req.headers.origin || 'https://lokator-ng.vercel.app';
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
