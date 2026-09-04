/**
 * PADIFIX — CLOUDFLARE EDGE & API INTEGRATION CLIENT
 * lib/cloudflare-client.js
 *
 * Lightweight server-side client for Cloudflare v4 REST API.
 *
 * Invariants:
 * - Server-Only: Throws if accessed in browser context.
 * - API Token Preferred: Enforces scoped CLOUDFLARE_API_TOKEN over global API keys.
 * - Zero Leakage: Never returns or logs raw token values.
 * - Additive & Non-Destructive: Does not mutate live DNS without explicit instruction.
 */

if (typeof window !== 'undefined') {
  throw new Error('SECURITY VIOLATION: Cloudflare client cannot be imported or executed in browser context.');
}

const https = require('https');

/**
 * Low-level HTTP client for Cloudflare v4 API
 */
function makeCloudflareRequest({ method = 'GET', path, body = null, token }) {
  return new Promise((resolve, reject) => {
    const apiToken = token || process.env.CLOUDFLARE_API_TOKEN;
    if (!apiToken) {
      return resolve({
        success: false,
        error: 'CLOUDFLARE_API_TOKEN is not configured',
        code: 'TOKEN_MISSING'
      });
    }

    const payloadStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
    if (payloadStr) {
      headers['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const req = https.request({
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${path}`,
      method,
      headers,
      timeout: 10000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({
            statusCode: res.statusCode,
            success: parsed.success === true,
            result: parsed.result || null,
            errors: parsed.errors || [],
            messages: parsed.messages || []
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            success: false,
            error: 'Malformed JSON from Cloudflare API',
            raw
          });
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Cloudflare API request timed out'));
    });

    if (payloadStr) {
      req.write(payloadStr);
    }
    req.end();
  });
}

const CloudflareClient = {
  /**
   * Get current configuration status (without exposing secrets)
   */
  getStatus: function () {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    return {
      tokenConfigured: Boolean(token && token.trim().length > 0),
      accountIdConfigured: Boolean(accountId && accountId.trim().length > 0),
      zoneIdConfigured: Boolean(zoneId && zoneId.trim().length > 0),
      authType: 'API_TOKEN'
    };
  },

  /**
   * Verify whether the configured API Token is active and valid
   */
  verifyToken: async function (token) {
    const res = await makeCloudflareRequest({
      method: 'GET',
      path: '/user/tokens/verify',
      token
    });

    if (res.success && res.result) {
      return {
        valid: true,
        status: res.result.status,
        expiresOn: res.result.expires_on || 'never'
      };
    }

    return {
      valid: false,
      error: res.errors && res.errors.length > 0 ? res.errors[0].message : (res.error || 'Token verification failed')
    };
  },

  /**
   * Retrieve zone information for PadiFix domain
   */
  getZoneDetails: async function (zoneId) {
    const targetZone = zoneId || process.env.CLOUDFLARE_ZONE_ID;
    if (!targetZone) {
      return { success: false, error: 'CLOUDFLARE_ZONE_ID is not configured' };
    }

    return makeCloudflareRequest({
      method: 'GET',
      path: `/zones/${targetZone}`
    });
  },

  /**
   * Purge cache for specific files or purge entire zone cache
   */
  purgeCache: async function (zoneId, files = null) {
    const targetZone = zoneId || process.env.CLOUDFLARE_ZONE_ID;
    if (!targetZone) {
      return { success: false, error: 'CLOUDFLARE_ZONE_ID is not configured' };
    }

    const body = files ? { files } : { purge_everything: true };
    return makeCloudflareRequest({
      method: 'POST',
      path: `/zones/${targetZone}/purge_cache`,
      body
    });
  },

  makeCloudflareRequest
};

module.exports = CloudflareClient;
