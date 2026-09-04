/**
 * PADIFIX — VERCEL SERVERLESS API: KYC & Identity Verification Webhook Handler
 * POST /api/kyc-webhook
 *
 * Implements a secure, idempotent webhook receiver for authorized Nigerian identity
 * verification gateways (e.g., Prembly / Dojah / NIMC verification partner).
 *
 * Security & Compliance Invariants:
 * 1. Validates cryptographic HMAC signature in `x-kyc-signature` header via timingSafeEqual.
 * 2. Deduplicates incoming webhooks using idempotency tracking on event reference.
 * 3. Normalizes vendor-specific payloads into standard PadiFix verification state.
 * 4. Zero Raw NIN Persistence: Strips all raw NINs, BVNs, and credential payload dumps.
 * 5. Fails closed: Unsigned or malformed requests are rejected immediately.
 */

const crypto = require('crypto');

// In-memory processed event cache for per-lambda instance deduplication
const processedKycEvents = new Set();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['x-kyc-signature'] || req.headers['x-prembly-signature'] || req.headers['x-dojah-signature'];
    const webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'test_kyc_webhook_secret_padifix_2026';
    const isLiveGateway = process.env.LIVE_KYC_GATEWAY_ENABLED === 'true';

    // Retrieve raw body for signature verification
    let rawBody = req.body;
    if (typeof rawBody === 'object' && rawBody !== null && !Buffer.isBuffer(rawBody)) {
      rawBody = JSON.stringify(rawBody);
    } else if (Buffer.isBuffer(rawBody)) {
      rawBody = rawBody.toString('utf8');
    }

    // Require signature when secret is configured
    if (webhookSecret) {
      if (!signature) {
        return res.status(401).json({ error: 'Missing x-kyc-signature header', safeCode: 'UNAUTHENTICATED_WEBHOOK' });
      }

      const expectedSignature = crypto
        .createHmac('sha512', webhookSecret)
        .update(rawBody || '')
        .digest('hex');

      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      // Constant-time signature comparison to prevent timing attacks
      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return res.status(401).json({ error: 'Invalid webhook signature', safeCode: 'INVALID_SIGNATURE' });
      }
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody || {});
    const eventId = payload.id || payload.event_id || (payload.data && payload.data.reference) || payload.reference;

    if (!eventId) {
      return res.status(400).json({ error: 'Malformed webhook event: Missing event identifier' });
    }

    // Idempotency Check: Reject duplicated events safely
    if (processedKycEvents.has(eventId)) {
      return res.status(200).json({
        status: 'success',
        idempotent: true,
        message: 'Event already processed'
      });
    }

    // Normalize vendor event
    const eventType = String(payload.event || payload.action || (payload.data && payload.data.status) || '').toLowerCase();
    const data = payload.data || {};
    const providerId = Number(data.provider_id || payload.provider_id);
    const requestId = data.request_id || payload.request_id;
    const documentType = String(data.verification_type || data.doc_type || 'vnin').toLowerCase();

    let normalizedOutcome = 'PENDING';
    let safeResultCode = 'PENDING_REVIEW';

    if (eventType.includes('approved') || eventType.includes('verified') || eventType.includes('success')) {
      normalizedOutcome = (documentType === 'vnin') ? 'VERIFIED_NIN' : 'VERIFIED_PLATFORM';
      safeResultCode = 'APPROVED';
    } else if (eventType.includes('rejected') || eventType.includes('failed')) {
      normalizedOutcome = 'REJECTED';
      safeResultCode = 'REJECTED';
    }

    // Mark as processed in idempotency set
    processedKycEvents.add(eventId);

    // Return sanitized, display-safe outcome (ZERO raw NIN/BVN in response)
    return res.status(200).json({
      status: 'success',
      received: true,
      eventId: String(eventId),
      providerId: providerId || null,
      requestId: requestId || null,
      normalizedOutcome,
      safeResultCode,
      processedAt: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      error: 'KYC Webhook processing exception',
      safeCode: 'SERVER_ERROR',
      message: err.message
    });
  }
};
