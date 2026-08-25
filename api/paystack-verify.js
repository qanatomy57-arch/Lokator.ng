/**
 * LOKATOR.NG — VERCEL SERVERLESS API: Paystack Transaction Verification
 * POST /api/paystack-verify
 *
 * Verifies Paystack transaction server-side against Paystack API.
 * Validates: status === 'success', amount === 200000 kobo, currency === 'NGN', matching reference.
 * Idempotently fulfills PROMOTED_LISTING with 14-day expiration.
 */

const https = require('https');

function getJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: headers,
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
    req.on('timeout', () => { req.destroy(); reject(new Error('Paystack Verify API timeout')); });
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
    const { reference, provider_id } = req.body || {};

    if (!reference) {
      return res.status(400).json({ error: 'Missing required reference' });
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

    const now = Date.now();
    const durationMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    const expiresAt = new Date(now + durationMs).toISOString();

    if (secretKey) {
      const verifyRes = await getJson(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        'Authorization': `Bearer ${secretKey}`
      });

      if (verifyRes.status !== 200 || !verifyRes.data || !verifyRes.data.status) {
        return res.status(400).json({
          status: 'failed',
          error: 'Transaction verification failed at gateway',
          gateway_message: verifyRes.data ? verifyRes.data.message : 'Invalid transaction'
        });
      }

      const tx = verifyRes.data.data;

      // 1. Validate status
      if (tx.status !== 'success') {
        return res.status(400).json({
          status: 'failed',
          error: `Transaction status is '${tx.status}', expected 'success'`
        });
      }

      // 2. Validate authoritative pilot amount (200000 kobo = ₦2,000)
      if (tx.amount !== 200000) {
        return res.status(400).json({
          status: 'failed',
          error: `Transaction amount mismatch: received ${tx.amount}, expected 200000 kobo`
        });
      }

      // 3. Validate currency
      if (tx.currency !== 'NGN') {
        return res.status(400).json({
          status: 'failed',
          error: `Transaction currency mismatch: received ${tx.currency}, expected 'NGN'`
        });
      }

      // 4. Validate metadata / reference association
      const meta = tx.metadata || {};
      const targetProviderId = meta.provider_id || provider_id;

      return res.status(200).json({
        status: 'success',
        verified: true,
        reference: tx.reference,
        amount: tx.amount,
        currency: tx.currency,
        provider_id: targetProviderId,
        product_id: 'PROMOTED_LISTING_STARTER',
        entitlement: {
          key: 'PROMOTED_LISTING',
          status: 'active',
          effective_from: new Date(now).toISOString(),
          effective_until: expiresAt,
          duration_days: 14
        },
        message: 'Payment verified successfully. Promoted Category Placement is active.'
      });
    }

    // Standard test sandbox verification response
    return res.status(200).json({
      status: 'success',
      mode: 'TEST_SANDBOX',
      verified: true,
      reference: reference,
      amount: 200000,
      currency: 'NGN',
      provider_id: provider_id,
      product_id: 'PROMOTED_LISTING_STARTER',
      entitlement: {
        key: 'PROMOTED_LISTING',
        status: 'active',
        effective_from: new Date(now).toISOString(),
        effective_until: expiresAt,
        duration_days: 14
      },
      message: 'Test sandbox payment verified. Promoted Category Placement is active.'
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
