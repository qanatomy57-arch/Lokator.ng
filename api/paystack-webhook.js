/**
 * LOKATOR.NG — VERCEL SERVERLESS API: Paystack Webhook Handler
 * POST /api/paystack-webhook
 *
 * Validates Paystack HMAC-SHA512 signature in `x-paystack-signature` header.
 * Idempotently processes `charge.success` events for the Promoted Category Placement pilot.
 */

const crypto = require('crypto');

// In-memory processed webhook event ID cache with payload hash for replay/tamper detection
const processedEvents = new Map();

// Canonical Plan Map for verification
const WEBHOOK_PLANS = {
  350000: { id: 'BASIC', name: 'Basic', contacts: 30 },
  500000: { id: 'PRO', name: 'Pro', contacts: 100 },
  1000000: { id: 'PREMIUM', name: 'Premium', contacts: 'unlimited' }
};

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
        return res.status(401).json({ error: 'Missing x-paystack-signature header' });
      }

      const expectedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody || '')
        .digest('hex');

      // Constant-time signature comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = String(event && (event.id || (event.data && event.data.id) || (event.data && event.data.reference) || ''));

    // Compute payload hash for replay tamper detection
    const payloadHash = crypto.createHash('sha256').update(rawBody || '').digest('hex');

    // Replay attack and idempotency check
    if (eventId && processedEvents.has(eventId)) {
      const priorHash = processedEvents.get(eventId);
      if (priorHash !== payloadHash) {
        return res.status(409).json({ error: 'Tampered payload replay with recycled event ID' });
      }
      return res.status(200).json({ status: 'success', message: 'Event already processed (idempotent)', idempotent: true });
    }

    if (eventId) {
      processedEvents.set(eventId, payloadHash);
      // Clean cache if too large (FIFO max 1000 items)
      if (processedEvents.size > 1000) {
        const oldestKey = processedEvents.keys().next().value;
        processedEvents.delete(oldestKey);
      }
    }

    const eventType = event ? event.event : '';
    const data = (event && event.data) || {};
    const reference = data.reference || '';
    const amount = data.amount;
    const currency = data.currency;
    const metadata = data.metadata || {};

    // 1. Handle Successful Payment (charge.success)
    if (eventType === 'charge.success') {
      if (currency !== 'NGN') {
        return res.status(400).json({ error: 'Invalid currency' });
      }

      // Branch A: Subscription Plan Charge
      const isSub = (reference && reference.startsWith('lok_sub_')) || 
                    metadata.action === 'subscription_upgrade' || 
                    Boolean(metadata.plan_id);

      if (isSub || WEBHOOK_PLANS[amount]) {
        const plan = WEBHOOK_PLANS[amount] || {
          id: String(metadata.plan_id || 'PRO').toUpperCase(),
          name: metadata.plan_name || 'Pro',
          contacts: 100
        };

        return res.status(200).json({
          status: 'success',
          event: 'charge.success',
          reference: reference,
          provider_id: metadata.provider_id,
          fulfilled: true,
          entitlement: 'SUBSCRIPTION',
          plan_id: plan.id,
          plan_name: plan.name,
          contacts_allowance: plan.contacts,
          duration_days: 30
        });
      }

      // Branch B: Promoted Category Placement Pilot (200000 kobo = ₦2,000)
      if (amount === 200000) {
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

    // 2. Handle Subscription Creation (subscription.create)
    if (eventType === 'subscription.create') {
      return res.status(200).json({
        status: 'success',
        event: 'subscription.create',
        subscription_code: data.subscription_code,
        customer_email: data.customer && data.customer.email,
        status_applied: 'active'
      });
    }

    // 3. Handle Renewal Payment Failure (invoice.payment_failed)
    if (eventType === 'invoice.payment_failed') {
      return res.status(200).json({
        status: 'success',
        event: 'invoice.payment_failed',
        subscription_code: data.subscription_code,
        status_applied: 'past_due',
        notice: 'Provider subscription marked past_due; entering grace period.'
      });
    }

    // 4. Handle Subscription Disable / Cancellation (subscription.disable)
    if (eventType === 'subscription.disable') {
      return res.status(200).json({
        status: 'success',
        event: 'subscription.disable',
        subscription_code: data.subscription_code,
        status_applied: 'cancelled',
        notice: 'Provider subscription cancelled.'
      });
    }

    // Acknowledge other webhook events safely
    return res.status(200).json({ status: 'success', message: 'Webhook acknowledged', event: eventType });

  } catch (err) {
    return res.status(500).json({ error: 'Webhook processing error', message: err.message });
  }
};
