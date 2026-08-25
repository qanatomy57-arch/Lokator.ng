/**
 * LOKATOR.NG — VERCEL SERVERLESS API: Paystack Webhook Handler
 * POST /api/paystack-webhook
 *
 * Validates Paystack HMAC-SHA512 signature in `x-paystack-signature` header.
 * Idempotently processes `charge.success` events for the Promoted Category Placement pilot.
 */

const crypto = require('crypto');

// In-memory processed webhook event ID cache for deduplication (per lambda instance)
const processedEvents = new Set();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['x-paystack-signature'];
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

    // Retrieve raw request body for HMAC verification
    let rawBody = req.body;
    if (typeof rawBody === 'object' && rawBody !== null && !Buffer.isBuffer(rawBody)) {
      rawBody = JSON.stringify(rawBody);
    } else if (Buffer.isBuffer(rawBody)) {
      rawBody = rawBody.toString('utf8');
    }

    if (secretKey) {
      if (!signature) {
        return res.status(400).json({ error: 'Missing x-paystack-signature header' });
      }

      const expectedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody || '')
        .digest('hex');

      // Constant-time signature comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = event && (event.id || (event.data && event.data.id) || (event.data && event.data.reference));

    // Idempotency check: Ignore duplicate events
    if (eventId && processedEvents.has(eventId)) {
      return res.status(200).json({ status: 'success', message: 'Event already processed (idempotent)' });
    }

    if (event && event.event === 'charge.success') {
      const data = event.data || {};
      const amount = data.amount;
      const currency = data.currency;
      const reference = data.reference;
      const metadata = data.metadata || {};

      // Validate pilot parameters: 200000 kobo (₦2,000) in NGN
      if (amount === 200000 && currency === 'NGN') {
        if (eventId) processedEvents.add(eventId);

        return res.status(200).json({
          status: 'success',
          event: 'charge.success',
          reference: reference,
          provider_id: metadata.provider_id,
          fulfilled: true,
          entitlement: 'PROMOTED_LISTING',
          duration_days: 14
        });
      }
    }

    // Acknowledge other webhook events safely
    return res.status(200).json({ status: 'success', message: 'Webhook acknowledged' });

  } catch (err) {
    return res.status(500).json({ error: 'Webhook processing error', message: err.message });
  }
};
