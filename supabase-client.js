// ============================================================================
// LOKATOR.NG — SUPABASE CLIENT & DATA ACCESS LAYER (supabase-client.js)
// Real database driver for Provider Registration, Search, and Profiles
// Connected Project: hvxosxhnxauiqrhpyuur (https://hvxosxhnxauiqrhpyuur.supabase.co)
// ============================================================================

(function (global) {
  'use strict';

  // 1. SUPABASE CLIENT CONFIGURATION & PROJECT TARGETING
  // Primary Project Reference ID: hvxosxhnxauiqrhpyuur
  const TARGET_PROJECT_REF = 'hvxosxhnxauiqrhpyuur';
  const TARGET_DEFAULT_URL = `https://${TARGET_PROJECT_REF}.supabase.co`;

  // Dynamic configuration resolution (supports window config, global envs, or target project default)
  const userConfig = (typeof window !== 'undefined' && window.LOKATOR_SUPABASE_CONFIG) || {};
  const envUrl = (typeof window !== 'undefined' && (window.LOKATOR_SUPABASE_URL || window.SUPABASE_URL)) ||
                 (typeof process !== 'undefined' && process.env && (process.env.LOKATOR_SUPABASE_URL || process.env.SUPABASE_URL));
  const envKey = (typeof window !== 'undefined' && (window.LOKATOR_SUPABASE_ANON_KEY || window.LOKATOR_SUPABASE_PUBLISHABLE_KEY || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY)) ||
                 (typeof process !== 'undefined' && process.env && (process.env.LOKATOR_SUPABASE_ANON_KEY || process.env.LOKATOR_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY));

  const CONFIG = {
    url: userConfig.url || envUrl || TARGET_DEFAULT_URL,
    anonKey: userConfig.anonKey || userConfig.publishableKey || envKey || '',
    projectRef: TARGET_PROJECT_REF,
    schema: userConfig.schema || 'public'
  };

  let supabaseInstance = null;

  // Initialize official Supabase JS SDK if present and publishable/anon key is configured
  if (typeof global.supabase !== 'undefined' && typeof global.supabase.createClient === 'function' && CONFIG.url && CONFIG.anonKey) {
    try {
      supabaseInstance = global.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.warn('Supabase SDK initialization notice:', e);
    }
  }

  function isRemoteActive() {
    return Boolean(supabaseInstance && CONFIG.anonKey && CONFIG.anonKey.trim().length > 10);
  }

  // 2. HAVERSINE REAL DISTANCE CALCULATION
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  // 2.1 CENTRALIZED HTML ESCAPING UTILITY (XSS Prevention)
  /**
   * Safely converts HTML special characters into their inert entity equivalents.
   * Prevents stored and reflected XSS attacks across all dynamic template literals.
   *
   * @param {*} value - Value to escape (string, number, null, undefined)
   * @returns {string} Safe HTML-escaped string
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export globally
  global.escapeHtml = escapeHtml;
  if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
  }

  // 3. PERSISTENT STORAGE DRIVER (Fallback & In-Memory Supabase-Compatible DB)
  // Ensures seamless offline-first execution, testability, and real DB synchronization
  const DB_STORE_KEY = 'lokator_supabase_providers_db';
  const DB_SERVICES_KEY = 'lokator_supabase_services_db';
  const DB_REVIEWS_KEY = 'lokator_supabase_reviews_db';
  const DB_PORTFOLIO_KEY = 'lokator_supabase_portfolio_db';
  const DB_WORKING_HOURS_KEY = 'lokator_supabase_working_hours_db';
  const DB_AUTH_SESSION_KEY = 'lokator_supabase_auth_session';
  const DB_USERS_KEY = 'lokator_supabase_users_db';

  // 3.0 CENTRAL WRITE RESULT MODEL (Phase 4.5 Standard)
  function createWriteResult({
    status = 'REMOTE_SUCCESS',
    operationId = null,
    entity = 'unknown',
    entityId = null,
    message = '',
    remoteConfirmed = false,
    queued = false,
    data = null,
    error = null
  }) {
    const opId = operationId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)));
    const defaultMsg = status === 'REMOTE_SUCCESS' 
      ? 'Saved successfully.' 
      : (status === 'OFFLINE_PENDING' 
          ? "Saved offline — will sync when you're back online." 
          : (error && error.message ? error.message : 'Operation failed.'));

    const envelope = {
      status,
      operationId: opId,
      entity,
      entityId,
      message: message || defaultMsg,
      remoteConfirmed: Boolean(remoteConfirmed),
      queued: Boolean(queued),
      data: data,
      error: error ? { message: error.message || String(error), code: error.code || error.status || null } : null
    };

    // Backwards-compatibility: allow direct property access if data is an object
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.assign(Object.create(envelope), data, envelope);
    }
    return envelope;
  }

  // 3.0.1 MUTATION SANITIZER (Blocks privileged/sensitive data from outbox)
  function sanitizeOutboxPayload(type, payload) {
    if (!payload || typeof payload !== 'object') return {};
    const clean = { ...payload };
    const protectedFields = [
      'password', 'token', 'secret', 'service' + '_role', 'api_key',
      'is_verified', 'nin_verified', 'rating', 'reviews_count', 
      'subscription_plan', 'completed_jobs', 'user_id', 'role',
      'verification_documents', 'nin_document'
    ];
    protectedFields.forEach(f => { delete clean[f]; });
    return clean;
  }

  // 3.0.2 TRANSIENT NETWORK ERROR CLASSIFIER
  function isRetryableNetworkError(error) {
    if (!error) return true;
    const msg = (error.message || String(error)).toLowerCase();
    const code = error.code || error.status;

    if (code === 400 || code === 401 || code === 403 || code === 404 || code === 409 || code === 422 || 
        code === '42501' || code === '23505' || code === '23503') {
      return false;
    }
    if (msg.includes('permission denied') || msg.includes('violates foreign key') || 
        msg.includes('violates unique') || msg.includes('not authenticated') || 
        msg.includes('invalid email') || msg.includes('invalid credentials')) {
      return false;
    }
    return true;
  }

  // 3.0.3 INDEXEDDB OFFLINE MUTATION OUTBOX (with memory fallback)
  const IDB_DB_NAME = 'lokator_offline';
  const IDB_STORE_NAME = 'mutation_outbox';
  let memoryOutbox = [];

  const outboxManager = {
    async _getDb() {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return null;
      }
      return new Promise((resolve) => {
        try {
          const req = window.indexedDB.open(IDB_DB_NAME, 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
              const store = db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('userId', 'userId', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
          };
          req.onsuccess = (e) => resolve(e.target.result);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },

    async enqueue(mutation) {
      const record = {
        id: mutation.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('mut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9))),
        operationId: mutation.operationId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9))),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: mutation.type,
        entityId: mutation.entityId || null,
        payload: sanitizeOutboxPayload(mutation.type, mutation.payload),
        status: 'PENDING',
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
        userId: mutation.userId || null
      };

      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('offline_action_queued', { type: mutation.type });
      }

      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            store.put(record);
            tx.oncomplete = () => resolve(record);
            tx.onerror = () => {
              memoryOutbox.push(record);
              resolve(record);
            };
          } catch (e) {
            memoryOutbox.push(record);
            resolve(record);
          }
        });
      } else {
        memoryOutbox.push(record);
        return record;
      }
    },

    async getPending(targetUserId = null) {
      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => {
              const all = req.result || [];
              const pending = all.filter(m => m.status === 'PENDING' || m.status === 'SYNCING');
              if (targetUserId) {
                resolve(pending.filter(m => !m.userId || m.userId === targetUserId));
              } else {
                resolve(pending);
              }
            };
            req.onerror = () => resolve(memoryOutbox.filter(m => m.status === 'PENDING' || m.status === 'SYNCING'));
          } catch (e) {
            resolve(memoryOutbox.filter(m => m.status === 'PENDING' || m.status === 'SYNCING'));
          }
        });
      } else {
        return memoryOutbox.filter(m => {
          const isPend = m.status === 'PENDING' || m.status === 'SYNCING';
          return targetUserId ? (isPend && (!m.userId || m.userId === targetUserId)) : isPend;
        });
      }
    },

    async updateStatus(id, status, errorInfo = null) {
      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            const getReq = store.get(id);
            getReq.onsuccess = () => {
              const rec = getReq.result;
              if (rec) {
                rec.status = status;
                rec.updatedAt = new Date().toISOString();
                rec.lastAttemptAt = new Date().toISOString();
                rec.attempts = (rec.attempts || 0) + 1;
                if (errorInfo) rec.lastError = errorInfo;
                store.put(rec);
              }
              resolve(rec);
            };
            getReq.onerror = () => resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      } else {
        const item = memoryOutbox.find(m => m.id === id);
        if (item) {
          item.status = status;
          item.updatedAt = new Date().toISOString();
          item.lastAttemptAt = new Date().toISOString();
          item.attempts = (item.attempts || 0) + 1;
          if (errorInfo) item.lastError = errorInfo;
        }
        return item;
      }
    },

    async remove(id) {
      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          } catch (e) {
            resolve(false);
          }
        });
      } else {
        memoryOutbox = memoryOutbox.filter(m => m.id !== id);
        return true;
      }
    },

    async getAll() {
      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([...memoryOutbox]);
          } catch (e) {
            resolve([...memoryOutbox]);
          }
        });
      } else {
        return [...memoryOutbox];
      }
    },

    async clear() {
      const db = await this._getDb();
      if (db) {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            store.clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          } catch (e) {
            resolve(false);
          }
        });
      } else {
        memoryOutbox = [];
        return true;
      }
    }
  };

  // 3.0.4 SYNCHRONIZATION ENGINE & CONNECTION CONTROLLER
  let isSyncingLock = false;
  let connectionState = (typeof navigator !== 'undefined' && navigator.onLine === false) ? 'OFFLINE' : 'ONLINE';
  const connectionListeners = new Set();

  function notifyConnectionListeners(state, details = {}) {
    connectionState = state;
    connectionListeners.forEach(fn => {
      try {
        fn(state, details);
      } catch (err) {
        console.warn('Connection listener error:', err);
      }
    });
    updateConnectionUI(state, details);
  }

  function updateConnectionUI(state, details = {}) {
    if (typeof document === 'undefined') return;

    let banner = document.getElementById('lokator-global-conn-indicator');
    if (!banner && document.body) {
      banner = document.createElement('aside');
      banner.id = 'lokator-global-conn-indicator';
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('role', 'status');
      banner.className = 'lokator-conn-badge';
      document.body.appendChild(banner);
    }

    if (!banner) return;

    if (state === 'OFFLINE') {
      banner.innerHTML = `<span class="conn-dot offline"></span><span>Offline — showing cached data</span>`;
      banner.className = 'lokator-conn-badge show offline';
    } else if (state === 'SYNCING') {
      banner.innerHTML = `<span class="conn-dot syncing"></span><span>Syncing changes…</span>`;
      banner.className = 'lokator-conn-badge show syncing';
    } else if (state === 'SYNCED') {
      banner.innerHTML = `<span class="conn-dot synced"></span><span>All changes synced (${details.synced || 1})</span>`;
      banner.className = 'lokator-conn-badge show synced';
      setTimeout(() => {
        if (connectionState === 'ONLINE') banner.className = 'lokator-conn-badge';
      }, 3500);
    } else if (state === 'SYNC_FAILED') {
      banner.innerHTML = `<span class="conn-dot failed"></span><span>Some changes could not be synced</span>`;
      banner.className = 'lokator-conn-badge show failed';
    } else {
      banner.className = 'lokator-conn-badge';
    }
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
      notifyConnectionListeners('ONLINE');
      if (typeof LokatorDB !== 'undefined' && LokatorDB.sync) {
        LokatorDB.sync.processOutbox();
      }
    });

    window.addEventListener('offline', () => {
      notifyConnectionListeners('OFFLINE');
    });
  }

  const syncEngine = {
    isSyncing() {
      return isSyncingLock;
    },

    getConnectionState() {
      return connectionState;
    },

    onConnectionChange(callback) {
      if (typeof callback === 'function') {
        connectionListeners.add(callback);
      }
      return {
        unsubscribe: () => connectionListeners.delete(callback)
      };
    },

    async processOutbox() {
      if (isSyncingLock) {
        return { status: 'LOCKED', message: 'Sync cycle already in progress' };
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        notifyConnectionListeners('OFFLINE');
        return { status: 'OFFLINE', message: 'Cannot sync while offline' };
      }

      if (!isRemoteActive()) {
        return { status: 'NO_REMOTE', message: 'Remote Supabase is not active' };
      }

      isSyncingLock = true;
      notifyConnectionListeners('SYNCING');

      let syncedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      try {
        const userRes = await LokatorDB.auth.getUser();
        const activeUserId = userRes?.data?.user?.id || null;

        const pending = await outboxManager.getPending();

        for (const mut of pending) {
          if (mut.userId && activeUserId && mut.userId !== activeUserId) {
            skippedCount++;
            continue;
          }

          await outboxManager.updateStatus(mut.id, 'SYNCING');

          try {
            let res = null;
            if (mut.type === 'PROFILE_UPDATE') {
              res = await supabaseInstance
                .from('providers')
                .update(mut.payload)
                .eq('id', mut.entityId);
            } else if (mut.type === 'SERVICES_UPDATE') {
              if (Array.isArray(mut.payload.skills)) {
                res = await supabaseInstance
                  .from('providers')
                  .update({ skills: mut.payload.skills })
                  .eq('id', mut.entityId);
              }
            } else if (mut.type === 'PORTFOLIO_ADD') {
              res = await supabaseInstance
                .from('portfolio_items')
                .insert([mut.payload]);
            } else if (mut.type === 'PORTFOLIO_DELETE') {
              res = await supabaseInstance
                .from('portfolio_items')
                .delete()
                .eq('id', mut.entityId);
            } else if (mut.type === 'WORKING_HOURS_UPDATE') {
              res = await supabaseInstance
                .from('working_hours')
                .upsert([mut.payload]);
            } else if (mut.type === 'REVIEW_CREATE') {
              res = await supabaseInstance
                .from('reviews')
                .insert([mut.payload]);
            }

            if (res && res.error) {
              throw res.error;
            }

            await outboxManager.remove(mut.id);
            syncedCount++;
          } catch (err) {
            const isRetryable = isRetryableNetworkError(err);
            if (isRetryable) {
              await outboxManager.updateStatus(mut.id, 'PENDING', err.message || 'Transient network error');
            } else {
              await outboxManager.updateStatus(mut.id, 'FAILED', err.message || 'Permanent database rejection');
              failedCount++;
            }
          }
        }
      } catch (globalErr) {
        console.warn('Sync engine global exception:', globalErr);
      } finally {
        isSyncingLock = false;
      }

      if (failedCount > 0) {
        notifyConnectionListeners('SYNC_FAILED', { synced: syncedCount, failed: failedCount });
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('offline_sync_failed', { failedCount, syncedCount });
        }
      } else if (syncedCount > 0) {
        notifyConnectionListeners('SYNCED', { synced: syncedCount });
        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('offline_sync_completed', { syncedCount });
        }
        setTimeout(() => {
          if (connectionState === 'SYNCED') {
            notifyConnectionListeners('ONLINE');
          }
        }, 3500);
      } else {
        notifyConnectionListeners('ONLINE');
      }

      return {
        status: failedCount > 0 ? 'SYNC_FAILED' : 'SYNCED',
        synced: syncedCount,
        failed: failedCount,
        skipped: skippedCount
      };
    }
  };

  // Auth event listeners
  const authListeners = new Set();
  function notifyAuthListeners(event, session) {
    authListeners.forEach(fn => {
      try {
        fn(event, session);
      } catch (err) {
        console.warn('Auth listener notification warning:', err);
      }
    });
  }

  function getLocalStore(key, defaultValue = []) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (key === DB_STORE_KEY && typeof global.PROVIDERS_DATA !== 'undefined' && Array.isArray(global.PROVIDERS_DATA)) {
          const existingIds = new Set(parsed.map(p => p.id));
          global.PROVIDERS_DATA.forEach(def => {
            if (!existingIds.has(def.id)) {
              parsed.push(def);
            }
          });
        }
        return parsed;
      }
      if (key === DB_STORE_KEY && typeof global.PROVIDERS_DATA !== 'undefined') {
        return [...global.PROVIDERS_DATA];
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setLocalStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  const STOP_WORDS = new Set(['my', 'a', 'an', 'the', 'to', 'in', 'at', 'and', 'or', 'of', 'for', 'with', 'on', 'me', 'you', 'is', 'it', 'do', 'i', 'we', 'be', 'so', 'can', 'who', 'somewhere', 'someone', 'please', 'help', 'need', 'find']);

  // 3.1 NATURAL QUERY & SEARCH INTENT EXTRACTOR
  function parseSearchQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return { cleanQuery: '', extractedLocation: null, tokens: [] };
    }

    let q = rawQuery.trim();
    let extractedLocation = null;

    // Check for location pattern: "in <location>", "at <location>", "around <location>"
    const locMatch = q.match(/\s+(?:in|at|around|near)\s+([a-zA-Z\s]+)$/i);
    if (locMatch && locMatch[1]) {
      const candidateLoc = locMatch[1].trim();
      if (candidateLoc.length >= 3 && !/^(me|my area|here)$/i.test(candidateLoc)) {
        extractedLocation = candidateLoc;
        q = q.substring(0, locMatch.index).trim();
      }
    }

    // Strip conversational filler phrases
    const cleanQuery = q
      .replace(/\b(?:i need|where can i find|who can|looking for|someone to|somewhere to|a place to|how to find|best|top|near me|for my|to fix|to repair|to build|to sew|to clean|services?)\b/gi, ' ')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const rawTokens = cleanQuery.toLowerCase().split(/\s+/);
    const tokens = rawTokens.filter(t => t.length > 1 && !STOP_WORDS.has(t));

    return {
      rawQuery: rawQuery.trim(),
      cleanQuery: cleanQuery.toLowerCase(),
      extractedLocation,
      tokens
    };
  }

  // 3.2 STRING SIMILARITY & TYPO TOLERANCE
  function stringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.85;

    // Character bigram overlap similarity
    const bigrams = (str) => {
      const set = new Set();
      for (let i = 0; i < str.length - 1; i++) {
        set.add(str.substring(i, i + 2));
      }
      return set;
    };

    const b1 = bigrams(a);
    const b2 = bigrams(b);
    let intersection = 0;
    b1.forEach(bg => { if (b2.has(bg)) intersection++; });
    const union = b1.size + b2.size - intersection;
    return union > 0 ? (intersection / union) : 0;
  }

  // 3.3 MULTI-TIER PROVIDER SEARCH RELEVANCE SCORER
  function scoreProviderRelevance(provider, searchIntent, services = []) {
    const { cleanQuery, tokens } = searchIntent;
    if (!cleanQuery && tokens.length === 0) return 100; // No keyword constraint

    let score = 0;
    const q = cleanQuery;

    // Gather provider searchable attributes
    const skills = Array.isArray(provider.skills) 
      ? provider.skills 
      : (typeof provider.skills === 'string' ? [provider.skills] : []);
    
    // Also include services from provider_services table
    const pServices = services.filter(s => s.provider_id === provider.id).map(s => s.service_name);
    const allSkills = [...new Set([...skills, ...pServices])].map(s => String(s).toLowerCase());

    const trade = (provider.trade_title || provider.trade || '').toLowerCase();
    const bizName = (provider.business_name || '').toLowerCase();
    const fullName = `${provider.first_name || ''} ${provider.last_name || provider.name || ''}`.toLowerCase();
    const bio = (provider.bio || '').toLowerCase();
    const catSlug = (provider.primary_category_slug || provider.slug || '').toLowerCase();

    // 1. TIER 1: Exact skill match (+100)
    for (const skill of allSkills) {
      if (skill === q) {
        score += 100;
        break;
      }
    }

    // 2. TIER 2: Skill phrase / substring match (+80)
    if (score < 100) {
      for (const skill of allSkills) {
        if (skill.includes(q)) {
          score += 80;
          break;
        } else if (q.includes(skill) && skill.length >= 4) {
          score += 75;
          break;
        }
      }
    }

    // 3. TIER 3: Trade title / Profession match (+70)
    if (trade === q) {
      score += 75;
    } else if (trade.includes(q)) {
      score += 65;
    } else if (q.includes(trade) && trade.length >= 4) {
      score += 60;
    }

    // 4. TIER 4: Category Slug or Synonyms match (+50)
    if (catSlug && (catSlug === q || q.includes(catSlug))) {
      score += 50;
    } else if (typeof CategoryMap !== 'undefined' && CategoryMap.resolveQuery) {
      const resolved = CategoryMap.resolveQuery(q);
      if (resolved && (resolved === catSlug || (resolved.slug && resolved.slug === catSlug))) {
        score += 50;
      }
    }

    // 5. TIER 5: Business Name or Provider Full Name (+40)
    if (bizName.includes(q) || fullName.includes(q)) {
      score += 40;
    }

    // 6. TIER 6: Bio / Description full phrase match (+20)
    if (bio.includes(q)) {
      score += 20;
    }

    // 7. MULTI-TOKEN PARTIAL MATCHING (For natural queries like "record song", "repair ac", "photo wedding")
    if (tokens.length > 0) {
      let matchedSkillTokens = 0;
      let matchedTradeTokens = 0;
      let matchedAnyTokens = 0;

      tokens.forEach(tok => {
        const inSkills = allSkills.some(s => s.includes(tok) || tok.includes(s) || (tok.length >= 4 && s.startsWith(tok.substring(0, 4))));
        const inTrade = trade.includes(tok) || (tok.length >= 4 && trade.startsWith(tok.substring(0, 4)));
        const inBio = bio.includes(tok);
        const inBiz = bizName.includes(tok);

        if (inSkills) matchedSkillTokens++;
        if (inTrade) matchedTradeTokens++;
        if (inSkills || inTrade || inBiz || inBio) matchedAnyTokens++;
      });

      if (tokens.length === 1 && (matchedSkillTokens > 0 || matchedTradeTokens > 0)) {
        score += 70;
      } else if (tokens.length > 1) {
        const ratio = matchedAnyTokens / tokens.length;
        if (ratio >= 0.5 && (matchedSkillTokens > 0 || matchedTradeTokens > 0)) {
          score += Math.round(ratio * 70);
        } else if (ratio >= 0.75) {
          score += Math.round(ratio * 50);
        }
      }
    }

    // 8. TYPO / FUZZY TOLERANCE (For queries like "record studio", "photograper", "make up artist")
    if (score === 0 && q.length >= 4) {
      for (const skill of allSkills) {
        const sim = stringSimilarity(q, skill);
        if (sim >= 0.52) {
          score += Math.round(sim * 65);
          break;
        }
      }
      if (score === 0) {
        const tradeSim = stringSimilarity(q, trade);
        if (tradeSim >= 0.52) {
          score += Math.round(tradeSim * 55);
        }
      }
    }

    return score;
  }

  // 4. LOKATOR DATA ACCESS OBJECT
  const LokatorDB = {
    config: CONFIG,
    client: supabaseInstance,
    escapeHtml: escapeHtml,

    /**
     * Safe development-only diagnostic test
     * Verifies project connection without querying or requiring database tables
     */
    async testConnection() {
      const isConfigured = Boolean(CONFIG.url && CONFIG.anonKey && CONFIG.anonKey.trim().length > 10);
      const diagnostic = {
        projectRef: CONFIG.projectRef,
        url: CONFIG.url,
        hasKey: Boolean(CONFIG.anonKey && CONFIG.anonKey.trim().length > 0),
        isConfigured: isConfigured,
        clientInitialized: Boolean(supabaseInstance),
        reachable: false,
        latencyMs: null,
        message: ''
      };

      if (!isConfigured || !supabaseInstance) {
        diagnostic.message = `Supabase operating in offline sync mode. Project reference set to [${CONFIG.projectRef}]. Public key pending.`;
        return diagnostic;
      }

      const start = Date.now();
      try {
        const { error } = await supabaseInstance.auth.getSession();
        diagnostic.latencyMs = Date.now() - start;
        diagnostic.reachable = true;
        if (!error) {
          diagnostic.message = `Successfully communicated with Supabase project [${CONFIG.projectRef}] in ${diagnostic.latencyMs}ms.`;
        } else {
          diagnostic.message = `Reached Supabase project [${CONFIG.projectRef}] (${diagnostic.latencyMs}ms): ${error.message}`;
        }
      } catch (err) {
        diagnostic.latencyMs = Date.now() - start;
        diagnostic.reachable = false;
        diagnostic.message = `Connection diagnostic notice for [${CONFIG.projectRef}]: ${err.message}`;
      }

      return diagnostic;
    },

    /**
     * Supabase Provider Authentication & Session Layer
     */
    auth: {
      /**
       * Get current session synchronously from local storage cache
       */
      getSessionSync() {
        try {
          const raw = localStorage.getItem(DB_AUTH_SESSION_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      },

      /**
       * Get current user synchronously from local storage cache
       */
      getUserSync() {
        const session = this.getSessionSync();
        return session && session.user ? session.user : null;
      },

      /**
       * Internal test helper to simulate authenticated user synchronously
       */
      _setUserSync(user) {
        if (!user) {
          try { localStorage.removeItem(DB_AUTH_SESSION_KEY); } catch (e) {}
          return;
        }
        const session = {
          access_token: 'lokator_test_token_' + Date.now(),
          token_type: 'bearer',
          expires_in: 3600,
          user: user
        };
        setLocalStore(DB_AUTH_SESSION_KEY, session);
      },

      /**
       * Sign up a new provider with Supabase Auth
       */
      async signUp(credentials, profileData = null) {
        const email = credentials.email ? credentials.email.trim() : '';
        const password = credentials.password || '';
        const meta = (credentials.options && credentials.options.data) ? credentials.options.data : (credentials.data || {});

        let remoteResult = null;
        let authUser = null;
        let authSession = null;

        if (isRemoteActive()) {
          try {
            remoteResult = await supabaseInstance.auth.signUp({
              email,
              password,
              options: {
                data: {
                  ...meta,
                  role: meta.role || 'provider'
                }
              }
            });
            if (remoteResult.data && remoteResult.data.user) {
              authUser = remoteResult.data.user;
              authSession = remoteResult.data.session;
            }
          } catch (e) {
            console.warn('Supabase remote signUp warning:', e);
          }
        }

        // Fallback / local mock user creation
        if (!authUser) {
          const users = getLocalStore(DB_USERS_KEY, []);
          const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (existing) {
            const err = new Error('A user with this email address already exists.');
            err.status = 400;
            return { data: { user: null, session: null }, error: err };
          }

          const mockId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          authUser = {
            id: mockId,
            email: email,
            app_metadata: { provider: 'email', role: meta.role || 'provider' },
            user_metadata: { ...meta, email },
            created_at: new Date().toISOString()
          };
          authSession = {
            access_token: 'lokator_mock_token_' + Date.now(),
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'lokator_mock_refresh_' + Date.now(),
            user: authUser
          };

          users.push({
            id: mockId,
            email: email,
            password: password,
            metadata: meta,
            created_at: authUser.created_at
          });
          setLocalStore(DB_USERS_KEY, users);
        }

        if (authSession) {
          setLocalStore(DB_AUTH_SESSION_KEY, authSession);
          notifyAuthListeners('SIGNED_IN', authSession);
        }

        let linkedProvider = null;
        if (profileData) {
          profileData.email = email;
          profileData.user_id = authUser.id;
          linkedProvider = await LokatorDB.registerProvider(profileData);
          if (linkedProvider) {
            if (!authUser.user_metadata) authUser.user_metadata = {};
            authUser.user_metadata.provider_id = linkedProvider.id;
            if (authSession) {
              setLocalStore(DB_AUTH_SESSION_KEY, authSession);
            }
          }
        }

        return {
          data: {
            user: authUser,
            session: authSession,
            provider: linkedProvider
          },
          error: remoteResult && remoteResult.error ? remoteResult.error : null
        };
      },

      /**
       * Sign in existing provider with email and password
       */
      async signInWithPassword(credentials) {
        const email = credentials.email ? credentials.email.trim() : '';
        const password = credentials.password || '';

        let remoteResult = null;
        let authUser = null;
        let authSession = null;

        if (isRemoteActive()) {
          try {
            remoteResult = await supabaseInstance.auth.signInWithPassword({ email, password });
            if (remoteResult.data && remoteResult.data.user) {
              authUser = remoteResult.data.user;
              authSession = remoteResult.data.session;
            }
          } catch (e) {
            console.warn('Supabase remote signIn notice:', e);
          }
        }

        // Fallback / local auth verification
        if (!authUser) {
          const users = getLocalStore(DB_USERS_KEY, []);
          const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (!u.password || u.password === password));

          if (matchedUser) {
            authUser = {
              id: matchedUser.id,
              email: matchedUser.email,
              app_metadata: { provider: 'email', role: 'provider' },
              user_metadata: matchedUser.metadata || { email: matchedUser.email },
              created_at: matchedUser.created_at
            };
          } else {
            // Check if matches a seed provider email (e.g. adebayo@lokator.ng or test accounts)
            const providers = getLocalStore(DB_STORE_KEY, []);
            const matchedProvider = providers.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
            if (matchedProvider) {
              authUser = {
                id: matchedProvider.user_id || ('usr_' + matchedProvider.id),
                email: matchedProvider.email,
                app_metadata: { provider: 'email', role: 'provider' },
                user_metadata: {
                  first_name: matchedProvider.first_name || (matchedProvider.name ? matchedProvider.name.split(' ')[0] : 'Provider'),
                  last_name: matchedProvider.last_name || '',
                  provider_id: matchedProvider.id
                },
                created_at: matchedProvider.created_at || new Date().toISOString()
              };
            }
          }

          if (authUser) {
            authSession = {
              access_token: 'lokator_mock_token_' + Date.now(),
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'lokator_mock_refresh_' + Date.now(),
              user: authUser
            };
          }
        }

        if (!authUser) {
          const err = new Error('Invalid email or password. Please check your credentials.');
          err.status = 400;
          return { data: { user: null, session: null }, error: err };
        }

        setLocalStore(DB_AUTH_SESSION_KEY, authSession);
        notifyAuthListeners('SIGNED_IN', authSession);

        const provider = await this.getCurrentProvider();

        return {
          data: {
            user: authUser,
            session: authSession,
            provider: provider
          },
          error: null
        };
      },

      /**
       * Sign in with OTP or magic link
       */
      async signInWithOtp(credentials) {
        if (isRemoteActive()) {
          return await supabaseInstance.auth.signInWithOtp(credentials);
        }
        return { data: { message: 'OTP sent in demo mode' }, error: null };
      },

      /**
       * Instant Demo Provider Login for frictionless testing & evaluation
       */
      async demoLogin(providerId = 1) {
        const numId = Number(providerId) || 1;
        const provider = await LokatorDB.getProviderById(numId);
        if (!provider) {
          throw new Error(`Demo provider with ID ${numId} not found`);
        }

        const mockUser = {
          id: `usr_demo_${provider.id}`,
          email: `${provider.firstName.toLowerCase()}.${provider.lastName.toLowerCase()}@lokator.ng`.replace(/\s+/g, ''),
          app_metadata: { provider: 'demo', role: 'provider' },
          user_metadata: {
            first_name: provider.firstName,
            last_name: provider.lastName,
            provider_id: provider.id,
            trade: provider.trade,
            phone: provider.phone
          },
          created_at: new Date().toISOString()
        };

        const mockSession = {
          access_token: 'lokator_demo_session_' + Date.now(),
          token_type: 'bearer',
          expires_in: 86400,
          user: mockUser
        };

        setLocalStore(DB_AUTH_SESSION_KEY, mockSession);
        notifyAuthListeners('SIGNED_IN', mockSession);

        return {
          data: {
            user: mockUser,
            session: mockSession,
            provider: provider
          },
          error: null
        };
      },

      /**
       * Sign out currently authenticated user
       */
      async signOut() {
        if (isRemoteActive()) {
          try {
            await supabaseInstance.auth.signOut();
          } catch (e) {}
        }
        try {
          localStorage.removeItem(DB_AUTH_SESSION_KEY);
        } catch (e) {}
        notifyAuthListeners('SIGNED_OUT', null);
        return { error: null };
      },

      /**
       * Get currently authenticated user
       */
      async getUser() {
        if (isRemoteActive()) {
          try {
            const res = await supabaseInstance.auth.getUser();
            if (res && res.data && res.data.user) {
              return res;
            }
          } catch (e) {}
        }
        const user = this.getUserSync();
        return { data: { user: user }, error: null };
      },

      /**
       * Get current authentication session
       */
      async getSession() {
        if (isRemoteActive()) {
          try {
            const res = await supabaseInstance.auth.getSession();
            if (res && res.data && res.data.session) {
              return res;
            }
          } catch (e) {}
        }
        const session = this.getSessionSync();
        return { data: { session: session }, error: null };
      },

      /**
       * Listen to auth state changes (login, logout, token refresh)
       */
      onAuthStateChange(callback) {
        if (typeof callback === 'function') {
          authListeners.add(callback);
        }
        if (isRemoteActive()) {
          try {
            supabaseInstance.auth.onAuthStateChange(callback);
          } catch (e) {}
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              }
            }
          }
        };
      },

      /**
       * Resolve the full provider record linked to the current logged-in user
       */
      async getCurrentProvider() {
        const userRes = await this.getUser();
        const user = userRes && userRes.data ? userRes.data.user : null;
        if (!user) return null;

        const targetProviderId = user.user_metadata && user.user_metadata.provider_id;

        // 1. If explicit provider_id attached to user
        if (targetProviderId) {
          const p = await LokatorDB.getProviderById(targetProviderId);
          if (p) return p;
        }

        // 2. Query by user_id in Remote Supabase
        if (isRemoteActive()) {
          try {
            const { data, error } = await supabaseInstance
              .from('providers')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!error && data && data.id) {
              return await LokatorDB.getProviderById(data.id);
            }
          } catch (e) {}
        }

        // 3. Match in local store by user_id or email
        const providers = getLocalStore(DB_STORE_KEY, []);
        let match = providers.find(p => p.user_id === user.id);
        if (!match && user.email) {
          match = providers.find(p => p.email && p.email.toLowerCase() === user.email.toLowerCase());
        }

        if (match) {
          return await LokatorDB.getProviderById(match.id);
        }

        // Fallback: If in demo mode
        if (user.id && String(user.id).includes('demo')) {
          return await LokatorDB.getProviderById(1);
        }

        return null;
      }
    },

    /**
     * Get providers matching marketplace discovery criteria with flexible skills search
     */
    async getProviders(options = {}) {
      const {
        category = 'all',
        state = 'all',
        city = 'all',
        query = '',
        isVerified = false,
        isAvailable = false,
        minRating = 0,
        page = 1,
        pageSize = 20,
        userLat = null,
        userLng = null,
        sortBy = 'distance-asc'
      } = options;

      // Parse free-form natural search intent and location
      const searchIntent = parseSearchQuery(query);
      const effectiveLocation = (city && city !== 'all') ? city : (searchIntent.extractedLocation || 'all');

      // 1. If remote live Supabase client is connected and active:
      if (isRemoteActive()) {
        try {
          let queryBuilder = supabaseInstance
            .from('providers')
            .select(`
              id,
              business_name,
              first_name,
              last_name,
              trade_title,
              primary_category_slug,
              skills,
              bio,
              phone,
              whatsapp_number,
              email,
              state,
              city,
              lga,
              area,
              address,
              latitude,
              longitude,
              experience_years,
              starting_price,
              avatar_bg,
              badge_title,
              response_time,
              completed_jobs,
              rating,
              reviews_count,
              subscription_plan,
              is_verified,
              nin_verified,
              is_available,
              provider_services (service_name, category_slug)
            `)
            .eq('is_active', true)
            .eq('is_public', true)
            .eq('profile_complete', true);

          if (category && category !== 'all') {
            queryBuilder = queryBuilder.eq('primary_category_slug', category);
          }
          if (state && state !== 'all') {
            queryBuilder = queryBuilder.ilike('state', `%${state}%`);
          }
          if (effectiveLocation && effectiveLocation !== 'all') {
            queryBuilder = queryBuilder.or(`city.ilike.%${effectiveLocation}%,area.ilike.%${effectiveLocation}%,state.ilike.%${effectiveLocation}%`);
          }
          if (isVerified) {
            queryBuilder = queryBuilder.eq('is_verified', true);
          }
          if (isAvailable) {
            queryBuilder = queryBuilder.eq('is_available', true);
          }
          if (minRating > 0) {
            queryBuilder = queryBuilder.gte('rating', minRating);
          }

          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          const { data, count, error } = await queryBuilder.range(from, to);

          if (!error && Array.isArray(data)) {
            return {
              data: this._sanitizeProvidersList(data, userLat, userLng),
              totalCount: count || data.length,
              page,
              pageSize
            };
          }
        } catch (err) {
          console.warn('Supabase remote query failed, utilizing local sync layer:', err);
        }
      }

      // 2. Local Supabase-compatible Driver Query
      let providers = getLocalStore(DB_STORE_KEY, []);
      const services = getLocalStore(DB_SERVICES_KEY, []);

      // Filter: only public & active
      let list = providers.filter(p => p.is_active !== false && p.is_public !== false && p.profile_complete !== false);

      // Filter: Category
      if (category && category !== 'all') {
        const catSlug = String(category).toLowerCase();
        list = list.filter(p => {
          const pSlug = (p.primary_category_slug || p.category || p.slug || '').toLowerCase();
          if (pSlug === catSlug || (pSlug.length >= 4 && catSlug.includes(pSlug)) || (catSlug.length >= 4 && pSlug.includes(catSlug))) return true;
          // Check provider services
          const pServices = services.filter(s => s.provider_id === p.id);
          return pServices.some(s => s.category_slug && String(s.category_slug).toLowerCase() === catSlug);
        });
      }

      // Filter: State
      if (state && state !== 'all') {
        const stateNorm = state.toLowerCase();
        list = list.filter(p => (p.state && p.state.toLowerCase().includes(stateNorm)));
      }

      // Filter: City/LGA/Location (including extracted natural location e.g. "in Warri", "in Ughelli")
      if (effectiveLocation && effectiveLocation !== 'all') {
        const locNorm = effectiveLocation.toLowerCase();
        list = list.filter(p => 
          (p.city && p.city.toLowerCase().includes(locNorm)) ||
          (p.lga && p.lga.toLowerCase().includes(locNorm)) ||
          (p.area && p.area.toLowerCase().includes(locNorm)) ||
          (p.state && p.state.toLowerCase().includes(locNorm))
        );
      }

      // Filter: Verification
      if (isVerified) {
        list = list.filter(p => Boolean(p.is_verified || p.isVerified));
      }

      // Filter: Availability
      if (isAvailable) {
        list = list.filter(p => p.is_available !== false && p.isAvailable !== false);
      }

      // Filter: Min Rating
      if (minRating > 0) {
        list = list.filter(p => Number(p.rating || 5) >= minRating);
      }

      // Filter & Score: Free-form skills/services search query
      if (searchIntent.cleanQuery || searchIntent.tokens.length > 0) {
        const scoredList = [];
        list.forEach(p => {
          const score = scoreProviderRelevance(p, searchIntent, services);
          if (score > 0) {
            p._searchScore = score;
            scoredList.push(p);
          }
        });
        list = scoredList;
      }

      // Calculate real distances if customer coords are present
      list = this._sanitizeProvidersList(list, userLat, userLng, services);

      // Sort by relevance score first (if keyword search active), then user sort preference
      list.sort((a, b) => {
        if (searchIntent.cleanQuery && (a._searchScore || 0) !== (b._searchScore || 0)) {
          return (b._searchScore || 0) - (a._searchScore || 0);
        }
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        if (sortBy === 'reviews-desc') return b.reviews_count - a.reviews_count;
        if (sortBy === 'experience-desc') return b.experience_years - a.experience_years;
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });

      // Pagination
      const totalCount = list.length;
      const startIdx = (page - 1) * pageSize;
      const paginatedData = list.slice(startIdx, startIdx + pageSize);

      return {
        data: paginatedData,
        totalCount,
        page,
        pageSize
      };
    },

    /**
     * Get real-time search suggestions dynamically from all available provider skills
     */
    getSkillSuggestions(query, limit = 6) {
      if (!query || typeof query !== 'string' || query.trim().length < 1) return [];
      const q = query.toLowerCase().trim();
      const providers = getLocalStore(DB_STORE_KEY, []);
      const services = getLocalStore(DB_SERVICES_KEY, []);
      
      const suggestionSet = new Set();

      // 1. Gather all unique skills from providers
      providers.forEach(p => {
        const skills = Array.isArray(p.skills) ? p.skills : [];
        skills.forEach(s => {
          if (s && s.toLowerCase().includes(q)) {
            suggestionSet.add(s.trim());
          }
        });
        if (p.trade_title && p.trade_title.toLowerCase().includes(q)) {
          suggestionSet.add(p.trade_title.trim());
        }
      });

      // 2. Gather from provider_services
      services.forEach(s => {
        if (s.service_name && s.service_name.toLowerCase().includes(q)) {
          suggestionSet.add(s.service_name.trim());
        }
      });

      // 3. Gather from category synonyms
      if (typeof CategoryMap !== 'undefined' && CategoryMap.getAll) {
        CategoryMap.getAll().forEach(cat => {
          if (cat.name && cat.name.toLowerCase().includes(q)) suggestionSet.add(cat.name);
          if (cat.displayName && cat.displayName.toLowerCase().includes(q)) suggestionSet.add(cat.displayName);
          (cat.synonyms || []).forEach(syn => {
            if (syn.toLowerCase().includes(q) && syn.length > 2) {
              const cap = syn.charAt(0).toUpperCase() + syn.slice(1);
              suggestionSet.add(cap);
            }
          });
        });
      }

      return Array.from(suggestionSet).slice(0, limit);
    },

    /**
     * Get a single provider by ID with joined services, portfolio, reviews, working hours
     */
    async getProviderById(id) {
      const numId = Number(id);
      if (!numId) return null;

      // Remote Supabase query if available
      if (isRemoteActive()) {
        try {
          const { data, error } = await supabaseInstance
            .from('providers')
            .select(`
              *,
              provider_services (*),
              portfolio_items (*),
              reviews (*),
              working_hours (*)
            `)
            .eq('id', numId)
            .eq('is_active', true)
            .single();

          if (!error && data) {
            return this._sanitizeProviderDetail(data);
          }
        } catch (e) {
          console.warn('Supabase getProviderById fallback to local store:', e);
        }
      }

      // Local Supabase Data Store
      const providers = getLocalStore(DB_STORE_KEY, []);
      const provider = providers.find(p => p.id === numId);
      if (!provider) return null;

      const services = getLocalStore(DB_SERVICES_KEY, []).filter(s => s.provider_id === numId);
      const reviews = getLocalStore(DB_REVIEWS_KEY, []).filter(r => r.provider_id === numId && r.is_approved !== false);
      const customPortfolio = getLocalStore(DB_PORTFOLIO_KEY, []).filter(item => item.provider_id === numId);
      const customHours = getLocalStore(DB_WORKING_HOURS_KEY, {})[numId] || null;

      const portfolioItems = (customPortfolio.length > 0)
        ? customPortfolio
        : (provider.portfolio_items || provider.portfolio || []);

      return this._sanitizeProviderDetail({
        ...provider,
        provider_services: services,
        portfolio_items: portfolioItems,
        working_hours: customHours || provider.working_hours || provider.workingHours,
        reviews: reviews
      });
    },

    /**
     * Register a new service provider into Supabase with flexible multi-skills support
     */
    async registerProvider(formData) {
      const newId = Date.now();
      const firstName = (formData.fname || formData.first_name || 'Provider').trim();
      const lastName = (formData.lname || formData.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Parse skills array (from chips/tag input or custom string)
      let skillsArray = [];
      if (Array.isArray(formData.skills)) {
        skillsArray = formData.skills.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof formData.skills === 'string' && formData.skills.trim()) {
        skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      const rawCategory = formData.service || formData.category || (skillsArray[0] || 'other');

      // Strict Content Moderation Check on all inputs
      if (typeof global.ServiceModerator !== 'undefined' && global.ServiceModerator.validateSkill) {
        const catVal = global.ServiceModerator.validateSkill(rawCategory);
        if (!catVal.valid) {
          throw new Error('This service category is not permitted on Lokator.');
        }
        for (const sk of skillsArray) {
          const skVal = global.ServiceModerator.validateSkill(sk);
          if (!skVal.valid) {
            throw new Error('This service category is not permitted on Lokator.');
          }
        }
        if (formData.trade) {
          const tradeVal = global.ServiceModerator.validateSkill(formData.trade);
          if (!tradeVal.valid) {
            throw new Error('This service category is not permitted on Lokator.');
          }
        }
      }

      let categorySlug = 'other';
      if (typeof CategoryMap !== 'undefined' && CategoryMap.resolveQuery) {
        const resolved = CategoryMap.resolveQuery(rawCategory);
        categorySlug = (typeof resolved === 'string') ? resolved : (resolved && resolved.slug ? resolved.slug : String(rawCategory).toLowerCase().replace(/\s+/g, '-'));
      } else {
        categorySlug = String(rawCategory).toLowerCase().replace(/\s+/g, '-');
      }

      const catObj = (typeof CategoryMap !== 'undefined') ? CategoryMap.getBySlug(categorySlug) : null;
      const tradeTitle = formData.trade || (skillsArray.length > 0 ? skillsArray.join(' & ') : (catObj ? catObj.name : rawCategory));

      // Ensure primary skill is in skills list
      if (skillsArray.length === 0) {
        skillsArray = [catObj ? catObj.name : rawCategory];
      }

      const locationInput = formData.location || 'Lagos, Nigeria';
      const parts = locationInput.split(',').map(s => s.trim());
      const area = locationInput;
      const city = parts[0] || 'Lagos';
      const state = parts[1] || parts[0] || 'Lagos';

      // Parse coordinates if GPS was used
      let lat = null;
      let lng = null;
      if (formData.lat && formData.lng) {
        lat = Number(formData.lat);
        lng = Number(formData.lng);
      } else if (locationInput.includes(',') && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }

      let currentUserId = formData.user_id || null;
      if (!currentUserId && LokatorDB.auth && typeof LokatorDB.auth.getUserSync === 'function') {
        const u = LokatorDB.auth.getUserSync();
        if (u && u.id) currentUserId = u.id;
      }

      const newProvider = {
        id: newId,
        user_id: currentUserId,
        first_name: firstName,
        last_name: lastName,
        business_name: formData.business_name || fullName,
        trade_title: tradeTitle,
        primary_category_slug: categorySlug,
        skills: skillsArray,
        bio: formData.bio || `Certified ${tradeTitle} serving ${area}. Contact directly for instant quotes and prompt service.`,
        phone: formData.phone.startsWith('+234') ? formData.phone : `+234${formData.phone.replace(/^0+/, '')}`,
        whatsapp_number: formData.phone.startsWith('+234') ? formData.phone : `+234${formData.phone.replace(/^0+/, '')}`,
        email: formData.email || null,
        state: state,
        city: city,
        lga: formData.lga || city,
        area: area,
        address: formData.address || area,
        latitude: lat,
        longitude: lng,
        experience_years: parseInt(formData.experience, 10) || 3,
        starting_price: formData.starting_price || '₦3,500 / job',
        avatar_bg: 'linear-gradient(135deg, #006B3F, #059669)',
        badge_title: 'NIN Verified Artisan',
        response_time: '~15 mins',
        completed_jobs: 1,
        rating: 5.0,
        reviews_count: 0,
        subscription_plan: formData.plan || 'basic',
        is_verified: false,
        nin_verified: false,
        is_available: true,
        is_active: true,
        is_public: true,
        profile_complete: true,
        created_at: new Date().toISOString()
      };

      // 1. Remote Supabase Insertion
      if (isRemoteActive()) {
        try {
          const { data, error } = await supabaseInstance
            .from('providers')
            .insert([newProvider])
            .select()
            .single();

          if (!error && data) {
            // Also insert provider services
            const serviceRows = skillsArray.map((sk, idx) => ({
              provider_id: data.id,
              service_name: sk,
              category_slug: categorySlug,
              is_primary: idx === 0
            }));
            await supabaseInstance.from('provider_services').insert(serviceRows);
            return data;
          }
        } catch (e) {
          console.warn('Supabase remote insert error, saving to local store:', e);
        }
      }

      // 2. Local Supabase Store Insertion
      const providers = getLocalStore(DB_STORE_KEY, []);
      providers.unshift(newProvider);
      setLocalStore(DB_STORE_KEY, providers);

      // Services insertion
      const services = getLocalStore(DB_SERVICES_KEY, []);
      skillsArray.forEach((sk, idx) => {
        services.push({
          id: Date.now() + idx + 1,
          provider_id: newId,
          service_name: sk,
          category_slug: categorySlug,
          is_primary: idx === 0
        });
      });
      setLocalStore(DB_SERVICES_KEY, services);

      return newProvider;
    },

    /**
     * Submit verified customer review to Supabase & Local Outbox
     */
    async submitReview(providerId, reviewData) {
      const numId = Number(providerId);
      const newReview = {
        id: Date.now(),
        provider_id: numId,
        author_name: reviewData.author || 'Verified Customer',
        author_location: reviewData.location || 'Nigeria',
        rating: Number(reviewData.rating) || 5,
        service_type: reviewData.serviceType || 'General Service',
        comment: reviewData.comment || '',
        is_verified_customer: false,
        helpful_count: 0,
        is_approved: false,
        created_at: new Date().toISOString()
      };

      let remoteConfirmed = false;
      let remoteError = null;

      // 1. Attempt Remote Supabase Insert if active and online
      if (isRemoteActive() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const { data, error } = await supabaseInstance.from('reviews').insert([newReview]).select();
          if (error) {
            remoteError = error;
          } else {
            remoteConfirmed = true;
          }
        } catch (e) {
          remoteError = e;
        }
      }

      // If permanent database failure (e.g. self-review blocked or RLS denial)
      if (remoteError && !isRetryableNetworkError(remoteError)) {
        return createWriteResult({
          status: 'REMOTE_FAILURE',
          entity: 'review',
          entityId: newReview.id,
          remoteConfirmed: false,
          queued: false,
          error: remoteError,
          message: remoteError.message || 'Could not submit review.'
        });
      }

      // 2. Queue mutation to IndexedDB outbox if not confirmed remotely
      let isQueued = false;
      if (!remoteConfirmed) {
        await outboxManager.enqueue({
          type: 'REVIEW_CREATE',
          entityId: numId,
          payload: newReview
        });
        isQueued = true;
      }

      // 3. Update Local Store
      const reviews = getLocalStore(DB_REVIEWS_KEY, []);
      reviews.unshift(newReview);
      setLocalStore(DB_REVIEWS_KEY, reviews);

      // Recalculate local provider average rating
      const pReviews = reviews.filter(r => r.provider_id === numId);
      const avg = Number((pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length).toFixed(1));

      const providers = getLocalStore(DB_STORE_KEY, []);
      const p = providers.find(item => item.id === numId);
      if (p) {
        p.rating = avg;
        p.reviews_count = pReviews.length;
        setLocalStore(DB_STORE_KEY, providers);
      }

      const status = remoteConfirmed ? 'REMOTE_SUCCESS' : 'OFFLINE_PENDING';
      const message = remoteConfirmed 
        ? 'Review submitted successfully.' 
        : "Review saved offline — will sync when you're back online.";

      return createWriteResult({
        status,
        entity: 'review',
        entityId: newReview.id,
        remoteConfirmed,
        queued: isQueued,
        data: newReview,
        message
      });
    },

    /**
     * Get top featured providers for homepage
     */
    async getTopFeaturedProviders(limit = 3) {
      const res = await this.getProviders({ pageSize: limit, sortBy: 'rating-desc' });
      return res.data;
    },

    /**
     * Update an existing provider profile in Supabase & Local Store
     */
    async updateProviderProfile(providerId, updateData) {
      const numId = Number(providerId);
      if (!numId) throw new Error('Valid Provider ID is required for update');

      // Authorization check: Verify active auth session user owns this provider record
      const authUser = LokatorDB.auth ? LokatorDB.auth.getUserSync() : null;
      const existingProvider = await this.getProviderById(numId);
      if (authUser && existingProvider && existingProvider.user_id && existingProvider.user_id !== authUser.id) {
        const isAdmin = authUser.app_metadata && authUser.app_metadata.role === 'admin';
        if (!isAdmin) {
          throw new Error('Unauthorized: You do not have permission to modify another provider profile.');
        }
      }

      // Content Moderation check on updated fields
      if (typeof global.ServiceModerator !== 'undefined' && global.ServiceModerator.validateSkill) {
        if (updateData.trade || updateData.trade_title) {
          const tVal = global.ServiceModerator.validateSkill(updateData.trade || updateData.trade_title);
          if (!tVal.valid) {
            throw new Error('This service category is not permitted on Lokator.');
          }
        }
        if (Array.isArray(updateData.skills)) {
          for (const s of updateData.skills) {
            const sVal = global.ServiceModerator.validateSkill(s);
            if (!sVal.valid) {
              throw new Error('This service category is not permitted on Lokator.');
            }
          }
        }
      }

      const safeUpdates = {};
      const allowedFields = [
        'first_name', 'last_name', 'business_name', 'trade_title',
        'primary_category_slug', 'bio', 'phone', 'whatsapp_number',
        'email', 'state', 'city', 'lga', 'area', 'address',
        'experience_years', 'starting_price', 'badge_title',
        'response_time', 'is_available', 'skills', 'avatar_bg',
        'avatar_url', 'avatarUrl'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          safeUpdates[field] = updateData[field];
        }
      });

      if (updateData.firstName !== undefined) { safeUpdates.first_name = updateData.firstName; safeUpdates.firstName = updateData.firstName; }
      if (updateData.lastName !== undefined) { safeUpdates.last_name = updateData.lastName; safeUpdates.lastName = updateData.lastName; }
      if (updateData.businessName !== undefined) { safeUpdates.business_name = updateData.businessName; safeUpdates.businessName = updateData.businessName; }
      if (updateData.trade !== undefined) { safeUpdates.trade_title = updateData.trade; safeUpdates.trade = updateData.trade; }
      if (updateData.experienceYrs !== undefined) { safeUpdates.experience_years = parseInt(updateData.experienceYrs, 10); safeUpdates.experienceYrs = parseInt(updateData.experienceYrs, 10); }
      if (updateData.startingPrice !== undefined) { safeUpdates.starting_price = updateData.startingPrice; safeUpdates.startingPrice = updateData.startingPrice; }
      if (updateData.responseTime !== undefined) { safeUpdates.response_time = updateData.responseTime; safeUpdates.responseTime = updateData.responseTime; }
      if (updateData.isAvailable !== undefined) { safeUpdates.is_available = Boolean(updateData.isAvailable); safeUpdates.isAvailable = Boolean(updateData.isAvailable); }
      if (updateData.whatsappNumber !== undefined) { safeUpdates.whatsapp_number = updateData.whatsappNumber; safeUpdates.whatsappNumber = updateData.whatsappNumber; }

      safeUpdates.updated_at = new Date().toISOString();

      let remoteConfirmed = false;
      let remoteError = null;

      // 1. Attempt Remote Supabase Update if active & online
      if (isRemoteActive() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const { error } = await supabaseInstance
            .from('providers')
            .update(safeUpdates)
            .eq('id', numId);

          if (error) {
            remoteError = error;
          } else {
            remoteConfirmed = true;
          }
        } catch (e) {
          remoteError = e;
        }
      }

      // Permanent failure rejection (e.g. RLS unauthorized)
      if (remoteError && !isRetryableNetworkError(remoteError)) {
        return createWriteResult({
          status: 'REMOTE_FAILURE',
          entity: 'provider',
          entityId: numId,
          remoteConfirmed: false,
          queued: false,
          error: remoteError,
          message: remoteError.message || 'Failed to update provider profile.'
        });
      }

      // 2. Queue mutation if not confirmed remotely
      let isQueued = false;
      if (!remoteConfirmed) {
        const userRes = await this.auth.getUser();
        await outboxManager.enqueue({
          type: 'PROFILE_UPDATE',
          entityId: numId,
          payload: safeUpdates,
          userId: userRes?.data?.user?.id || null
        });
        isQueued = true;
      }

      // 3. Local Store Update
      const providers = getLocalStore(DB_STORE_KEY, []);
      const idx = providers.findIndex(p => p.id === numId);
      if (idx !== -1) {
        providers[idx] = {
          ...providers[idx],
          ...safeUpdates,
          name: `${safeUpdates.first_name || providers[idx].first_name || ''} ${safeUpdates.last_name || providers[idx].last_name || ''}`.trim() || providers[idx].name
        };
        setLocalStore(DB_STORE_KEY, providers);
      }

      const updatedProvider = await this.getProviderById(numId);
      const status = remoteConfirmed ? 'REMOTE_SUCCESS' : 'OFFLINE_PENDING';
      const message = remoteConfirmed 
        ? 'Profile saved successfully.' 
        : "Saved offline — will sync when you're back online.";

      return createWriteResult({
        status,
        entity: 'provider',
        entityId: numId,
        remoteConfirmed,
        queued: isQueued,
        data: updatedProvider,
        message
      });
    },

    /**
     * Fast toggle for provider availability status (Online / Busy)
     */
    async updateProviderAvailability(providerId, isAvailable) {
      return await this.updateProviderProfile(providerId, { is_available: Boolean(isAvailable) });
    },

    /**
     * Update provider offered services / skills
     */
    async updateProviderServices(providerId, skillsList) {
      const numId = Number(providerId);
      if (!numId) return null;

      const skillsArray = Array.isArray(skillsList) ? skillsList.map(s => String(s).trim()).filter(Boolean) : [];

      // Validate all skills against moderation
      if (typeof global.ServiceModerator !== 'undefined' && global.ServiceModerator.validateSkill) {
        for (const s of skillsArray) {
          const val = global.ServiceModerator.validateSkill(s);
          if (!val.valid) {
            throw new Error('This service category is not permitted on Lokator.');
          }
        }
      }

      const profileRes = await this.updateProviderProfile(numId, { skills: skillsArray });

      // Local services store update
      const services = getLocalStore(DB_SERVICES_KEY, []).filter(s => s.provider_id !== numId);
      skillsArray.forEach((sk, idx) => {
        services.push({
          id: Date.now() + idx + 1,
          provider_id: numId,
          service_name: sk,
          is_primary: idx === 0
        });
      });
      setLocalStore(DB_SERVICES_KEY, services);

      const updatedProvider = await this.getProviderById(numId);

      return createWriteResult({
        status: profileRes.status,
        entity: 'provider_services',
        entityId: numId,
        remoteConfirmed: profileRes.remoteConfirmed,
        queued: profileRes.queued,
        data: updatedProvider,
        message: profileRes.status === 'REMOTE_SUCCESS' 
          ? 'Skills and services updated.' 
          : profileRes.message
      });
    },

    /**
     * Update provider working hours schedule
     */
    async updateProviderWorkingHours(providerId, workingHours) {
      const numId = Number(providerId);
      if (!numId) return null;

      const hoursPayload = {
        provider_id: numId,
        weekday_hours: workingHours.weekday || '8:00 AM – 7:00 PM',
        saturday_hours: workingHours.saturday || '8:00 AM – 6:00 PM',
        sunday_hours: workingHours.sunday || 'Emergency Callouts (24/7)'
      };

      let remoteConfirmed = false;
      let remoteError = null;

      if (isRemoteActive() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const { error } = await supabaseInstance
            .from('working_hours')
            .upsert([hoursPayload]);
          if (error) {
            remoteError = error;
          } else {
            remoteConfirmed = true;
          }
        } catch (e) {
          remoteError = e;
        }
      }

      if (remoteError && !isRetryableNetworkError(remoteError)) {
        return createWriteResult({
          status: 'REMOTE_FAILURE',
          entity: 'working_hours',
          entityId: numId,
          remoteConfirmed: false,
          queued: false,
          error: remoteError,
          message: remoteError.message || 'Failed to update working hours.'
        });
      }

      let isQueued = false;
      if (!remoteConfirmed) {
        const userRes = await this.auth.getUser();
        await outboxManager.enqueue({
          type: 'WORKING_HOURS_UPDATE',
          entityId: numId,
          payload: hoursPayload,
          userId: userRes?.data?.user?.id || null
        });
        isQueued = true;
      }

      const hoursStore = getLocalStore(DB_WORKING_HOURS_KEY, {});
      hoursStore[numId] = {
        weekday: workingHours.weekday || '8:00 AM – 7:00 PM',
        saturday: workingHours.saturday || '8:00 AM – 6:00 PM',
        sunday: workingHours.sunday || 'Emergency Callouts (24/7)'
      };
      setLocalStore(DB_WORKING_HOURS_KEY, hoursStore);

      const providers = getLocalStore(DB_STORE_KEY, []);
      const p = providers.find(item => item.id === numId);
      if (p) {
        p.working_hours = hoursStore[numId];
        setLocalStore(DB_STORE_KEY, providers);
      }

      const status = remoteConfirmed ? 'REMOTE_SUCCESS' : 'OFFLINE_PENDING';
      const message = remoteConfirmed 
        ? 'Working hours schedule updated.' 
        : "Working hours saved offline — will sync when you're back online.";

      return createWriteResult({
        status,
        entity: 'working_hours',
        entityId: numId,
        remoteConfirmed,
        queued: isQueued,
        data: hoursStore[numId],
        message
      });
    },

    /**
     * Add a completed project to provider portfolio showcase
     */
    async addPortfolioItem(providerId, itemData) {
      const numId = Number(providerId);
      if (!numId) return null;

      const newItem = {
        id: 'port-' + Date.now(),
        provider_id: numId,
        title: itemData.title || 'Completed Project',
        category: itemData.category || 'Service Work',
        description: itemData.description || 'Quality craftsmanship delivered on time and within budget.',
        is_before_after: Boolean(itemData.isBeforeAfter || itemData.is_before_after),
        tag: itemData.tag || 'Verified Work',
        accent_color: itemData.accentColor || itemData.accent_color || '#006B3F',
        icon: itemData.icon || '🛠️',
        image_url: itemData.imageUrl || itemData.image_url || null,
        created_at: new Date().toISOString()
      };

      let remoteConfirmed = false;
      let remoteError = null;

      if (isRemoteActive() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const { error } = await supabaseInstance
            .from('portfolio_items')
            .insert([newItem]);
          if (error) {
            remoteError = error;
          } else {
            remoteConfirmed = true;
          }
        } catch (e) {
          remoteError = e;
        }
      }

      if (remoteError && !isRetryableNetworkError(remoteError)) {
        return createWriteResult({
          status: 'REMOTE_FAILURE',
          entity: 'portfolio_item',
          entityId: newItem.id,
          remoteConfirmed: false,
          queued: false,
          error: remoteError,
          message: remoteError.message || 'Failed to add portfolio item.'
        });
      }

      let isQueued = false;
      if (!remoteConfirmed) {
        const userRes = await this.auth.getUser();
        await outboxManager.enqueue({
          type: 'PORTFOLIO_ADD',
          entityId: numId,
          payload: newItem,
          userId: userRes?.data?.user?.id || null
        });
        isQueued = true;
      }

      const portfolioStore = getLocalStore(DB_PORTFOLIO_KEY, []);
      portfolioStore.unshift(newItem);
      setLocalStore(DB_PORTFOLIO_KEY, portfolioStore);

      const providers = getLocalStore(DB_STORE_KEY, []);
      const p = providers.find(item => item.id === numId);
      if (p) {
        if (!p.portfolio_items) p.portfolio_items = [];
        p.portfolio_items.unshift(newItem);
        setLocalStore(DB_STORE_KEY, providers);
      }

      const status = remoteConfirmed ? 'REMOTE_SUCCESS' : 'OFFLINE_PENDING';
      const message = remoteConfirmed 
        ? 'Project added to portfolio.' 
        : "Project saved offline — will sync when you're back online.";

      return createWriteResult({
        status,
        entity: 'portfolio_item',
        entityId: newItem.id,
        remoteConfirmed,
        queued: isQueued,
        data: newItem,
        message
      });
    },

    /**
     * Delete a portfolio item
     */
    async deletePortfolioItem(providerId, itemId) {
      const numId = Number(providerId);
      let remoteConfirmed = false;
      let remoteError = null;

      if (isRemoteActive() && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const { error } = await supabaseInstance
            .from('portfolio_items')
            .delete()
            .eq('id', itemId);
          if (error) {
            remoteError = error;
          } else {
            remoteConfirmed = true;
          }
        } catch (e) {
          remoteError = e;
        }
      }

      if (remoteError && !isRetryableNetworkError(remoteError)) {
        return createWriteResult({
          status: 'REMOTE_FAILURE',
          entity: 'portfolio_item',
          entityId: itemId,
          remoteConfirmed: false,
          queued: false,
          error: remoteError,
          message: remoteError.message || 'Failed to delete portfolio item.'
        });
      }

      let isQueued = false;
      if (!remoteConfirmed) {
        const userRes = await this.auth.getUser();
        await outboxManager.enqueue({
          type: 'PORTFOLIO_DELETE',
          entityId: itemId,
          payload: { id: itemId, provider_id: numId },
          userId: userRes?.data?.user?.id || null
        });
        isQueued = true;
      }

      const portfolioStore = getLocalStore(DB_PORTFOLIO_KEY, []).filter(item => item.id !== itemId);
      setLocalStore(DB_PORTFOLIO_KEY, portfolioStore);

      const providers = getLocalStore(DB_STORE_KEY, []);
      const p = providers.find(item => item.id === numId);
      if (p && p.portfolio_items) {
        p.portfolio_items = p.portfolio_items.filter(item => item.id !== itemId);
        setLocalStore(DB_STORE_KEY, providers);
      }

      const status = remoteConfirmed ? 'REMOTE_SUCCESS' : 'OFFLINE_PENDING';
      const message = remoteConfirmed 
        ? 'Project removed from portfolio.' 
        : "Project removal queued — will sync when you're back online.";

      LokatorDB.lastWriteResult = createWriteResult({
        status,
        entity: 'portfolio_item',
        entityId: itemId,
        remoteConfirmed,
        queued: isQueued,
        data: { id: itemId, deleted: true },
        message
      });

      return true;
    },

    /**
     * Get real-time & computed analytics metrics for Provider Dashboard
     */
    async getProviderDashboardMetrics(providerId) {
      const p = await this.getProviderById(providerId);
      if (!p) return null;

      const reviews = p.reviews || [];
      const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        ratingDist[star] = (ratingDist[star] || 0) + 1;
      });

      const completedJobs = p.completedJobs || 42;
      const profileViews = Math.round(completedJobs * 8.4 + (p.rating * 45));
      const directLeads = Math.round(completedJobs * 1.8 + reviews.length * 3);

      return {
        providerId: p.id,
        name: p.name,
        trade: p.trade,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        completedJobs: completedJobs,
        profileViewsThisMonth: profileViews,
        leadsThisMonth: directLeads,
        responseTime: p.responseTime || '~15 mins',
        isAvailable: p.isAvailable,
        isVerified: p.isVerified,
        plan: p.subscriptionPlan || (p.isTop ? 'premium' : (p.isVerified ? 'verified' : 'basic')),
        ratingDistribution: ratingDist,
        recentReviews: reviews.slice(0, 5)
      };
    },

    /**
     * Upgrade subscription plan (Basic -> Verified -> Premium)
     */
    async upgradeSubscriptionPlan(providerId, newPlan) {
      const numId = Number(providerId);
      const validPlans = ['basic', 'verified', 'premium'];
      if (!validPlans.includes(newPlan)) throw new Error('Invalid plan selection');

      const isVerified = newPlan !== 'basic';
      const isTop = newPlan === 'premium';

      const providers = getLocalStore(DB_STORE_KEY, []);
      const p = providers.find(item => item.id === numId);
      if (p) {
        p.subscription_plan = newPlan;
        p.is_verified = isVerified;
        p.isTop = isTop;
        p.badge_title = newPlan === 'premium' ? 'Lokator Premium Partner' : (newPlan === 'verified' ? 'NIN Verified Artisan' : 'Registered Provider');
        setLocalStore(DB_STORE_KEY, providers);
      }

      return await this.getProviderById(numId);
    },

    /**
     * Sanitize providers list & calculate distance
     */
    _sanitizeProvidersList(providers, userLat, userLng, allServices = []) {
      return providers.map(p => {
        let dist = null;
        if (userLat && userLng && p.latitude && p.longitude) {
          dist = calculateHaversineDistance(userLat, userLng, p.latitude, p.longitude);
        } else if (p.distanceKm != null) {
          dist = p.distanceKm;
        }

        const name = p.name || p.business_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Service Provider';
        const trade = p.trade || p.trade_title || 'Artisan';
        const category = p.category || p.primary_category_slug;
        const slug = p.slug || p.primary_category_slug;
        const pServices = p.provider_services || allServices.filter(s => s.provider_id === p.id);
        const skills = (Array.isArray(p.skills) && p.skills.length > 0) 
          ? p.skills 
          : (pServices.length > 0 ? pServices.map(s => s.service_name) : [trade]);

        return {
          id: p.id,
          name: name,
          firstName: p.first_name || (p.name ? p.name.split(' ')[0] : 'Provider'),
          lastName: p.last_name || (p.name ? p.name.split(' ').slice(1).join(' ') : ''),
          trade: trade,
          category: category,
          slug: slug,
          city: p.city,
          state: p.state,
          area: p.area || `${p.city}, ${p.state}`,
          address: p.address || p.area,
          distanceKm: dist,
          rating: Number(p.rating || 5.0),
          reviewsCount: p.reviewsCount != null ? p.reviewsCount : (p.reviews_count || 0),
          experienceYrs: p.experienceYrs != null ? p.experienceYrs : (p.experience_years || 2),
          isVerified: Boolean(p.is_verified || p.isVerified),
          isAvailable: p.is_available !== false && p.isAvailable !== false,
          isTop: Boolean((p.rating >= 4.8 && p.is_verified) || p.isTop),
          phone: p.phone,
          whatsappNumber: p.whatsappNumber || p.whatsapp_number || p.phone,
          avatarBg: p.avatarBg || p.avatar_bg || 'linear-gradient(135deg, #006B3F, #059669)',
          bio: p.bio,
          skills: skills,
          startingPrice: p.startingPrice || p.starting_price || '₦3,000 / service',
          completedJobs: p.completedJobs || p.completed_jobs || 50,
          responseTime: p.responseTime || p.response_time || '~15 mins',
          _searchScore: p._searchScore || 0
        };
      });
    },

    /**
     * Sanitize individual provider details for profile page
     */
    _sanitizeProviderDetail(p) {
      const name = p.name || p.business_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Service Provider';
      const trade = p.trade || p.trade_title || 'Artisan';
      const category = p.category || p.primary_category_slug;
      const slug = p.slug || p.primary_category_slug;
      const services = (p.provider_services || []).map(s => s.service_name);
      const skills = (Array.isArray(p.skills) && p.skills.length > 0)
        ? p.skills
        : (services.length > 0 ? services : [trade]);
      
      return {
        id: p.id,
        userId: p.user_id || p.userId || null,
        name: name,
        businessName: p.business_name || p.businessName || name,
        firstName: p.first_name || (p.name ? p.name.split(' ')[0] : 'Provider'),
        lastName: p.last_name || (p.name ? p.name.split(' ').slice(1).join(' ') : ''),
        trade: trade,
        category: category,
        slug: slug,
        city: p.city,
        state: p.state,
        lga: p.lga || p.city,
        area: p.area || `${p.city}, ${p.state}`,
        address: p.address || p.area,
        distanceKm: p.distanceKm || null,
        rating: Number(p.rating || 5.0),
        reviewsCount: p.reviewsCount != null ? p.reviewsCount : (p.reviews_count || (p.reviews ? p.reviews.length : 0)),
        experienceYrs: p.experienceYrs != null ? p.experienceYrs : (p.experience_years || 2),
        isVerified: Boolean(p.is_verified || p.isVerified),
        isAvailable: p.is_available !== false && p.isAvailable !== false,
        isTop: Boolean((p.rating >= 4.8 && p.is_verified) || p.isTop),
        subscriptionPlan: p.subscription_plan || p.subscriptionPlan || (p.isTop ? 'premium' : (p.is_verified || p.isVerified ? 'verified' : 'basic')),
        phone: p.phone,
        whatsappNumber: p.whatsappNumber || p.whatsapp_number || p.phone,
        email: p.email || null,
        avatarUrl: p.avatar_url || p.avatarUrl || p.profile_picture || null,
        avatarBg: p.avatarBg || p.avatar_bg || 'linear-gradient(135deg, #006B3F, #059669)',
        badgeTitle: p.badgeTitle || p.badge_title || 'NIN Verified Artisan',
        responseTime: p.responseTime || p.response_time || '~15 mins',
        bio: p.bio || `Certified ${trade} serving ${p.area}.`,
        skills: skills,
        startingPrice: p.startingPrice || p.starting_price || '₦3,000 / inspection',
        completedJobs: p.completedJobs || p.completed_jobs || 120,
        workingHours: p.workingHours || p.working_hours || {
          weekday: "8:00 AM – 7:00 PM",
          saturday: "8:00 AM – 6:00 PM",
          sunday: "Emergency Callouts (24/7)"
        },
        pricingGuide: p.pricingGuide || [
          { item: "Initial Inspection & Diagnosis", price: p.starting_price || "₦4,000" },
          { item: "Standard Service Task", price: "₦15,000 – ₦35,000" },
          { item: "Emergency Priority Repair", price: "₦10,000 – ₦25,000" }
        ],
        portfolio: p.portfolio_items || p.portfolio || [
          {
            id: "port-1",
            title: `Completed ${p.trade_title} Project`,
            category: p.trade_title,
            description: `Quality ${p.trade_title} craftsmanship delivered for client in ${p.area}.`,
            isBeforeAfter: false,
            tag: "Verified Work",
            accentColor: "#006B3F",
            icon: "🛠️"
          }
        ],
        reviews: (p.reviews || []).map(r => ({
          id: r.id,
          author: r.author_name || r.author || 'Verified Customer',
          location: r.author_location || r.location || p.city,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Recent',
          rating: r.rating || 5,
          serviceType: r.service_type || r.serviceType || p.trade_title,
          comment: r.comment,
          isVerifiedCustomer: r.is_verified_customer !== false,
          helpfulCount: r.helpful_count || 0
        }))
      };
    },

    /**
     * Client-side Image Compression Helper
     * Resizes and compresses image files before upload to save bandwidth and storage.
     */
    async compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
      if (!file) throw new Error('No image file provided');
      if (typeof window === 'undefined' || typeof document === 'undefined' || typeof FileReader === 'undefined') {
        // Node / test environment fallback
        return {
          dataUrl: typeof file === 'string' ? file : 'data:image/jpeg;base64,sample_compressed_image',
          blob: null,
          originalSize: file.size || 1024,
          compressedSize: 512
        };
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = () => reject(new Error('Failed to load image for compression'));
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            canvas.toBlob((blob) => {
              resolve({
                dataUrl: compressedDataUrl,
                blob: blob,
                originalSize: file.size || 0,
                compressedSize: blob ? blob.size : compressedDataUrl.length,
                width: width,
                height: height
              });
            }, 'image/jpeg', quality);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    },

    /**
     * Upload Profile Photo (Supabase Storage avatars bucket or local store fallback)
     */
    async uploadProfilePhoto(providerId, fileOrDataUrl) {
      const numId = Number(providerId);
      if (!numId) throw new Error('Valid Provider ID is required');

      // Authorization verification
      const authUser = LokatorDB.auth ? LokatorDB.auth.getUserSync() : null;
      const targetProvider = await this.getProviderById(numId);
      if (authUser && targetProvider && targetProvider.user_id && targetProvider.user_id !== authUser.id) {
        const isAdmin = authUser.app_metadata && authUser.app_metadata.role === 'admin';
        if (!isAdmin) {
          throw new Error('Unauthorized: You can only upload profile photos for your own account.');
        }
      }

      // Validate file size and MIME type
      if (fileOrDataUrl && (typeof fileOrDataUrl === 'object' || (typeof File !== 'undefined' && fileOrDataUrl instanceof File) || (typeof Blob !== 'undefined' && fileOrDataUrl instanceof Blob))) {
        if (fileOrDataUrl.size && fileOrDataUrl.size > 5 * 1024 * 1024) {
          throw new Error('File size exceeds maximum allowed limit of 5MB.');
        }
        const mimeType = (fileOrDataUrl.type || '').toLowerCase();
        if (mimeType.includes('svg') || mimeType.includes('html') || mimeType.includes('xml') || mimeType.includes('javascript')) {
          throw new Error('Invalid image format. SVG and scriptable file types are strictly prohibited for security.');
        }
        if (fileOrDataUrl.name && /\.(svg|html|htm|js|exe|sh|php)$/i.test(fileOrDataUrl.name)) {
          throw new Error('Invalid file extension.');
        }
      }

      let avatarUrl = '';
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
        avatarUrl = fileOrDataUrl;
      } else if (fileOrDataUrl instanceof File || (typeof Blob !== 'undefined' && fileOrDataUrl instanceof Blob)) {
        try {
          const compressed = await this.compressImage(fileOrDataUrl);
          avatarUrl = compressed.dataUrl;
        } catch (e) {
          avatarUrl = 'data:image/jpeg;base64,fallback';
        }
      } else {
        avatarUrl = String(fileOrDataUrl || '');
      }

      // Try uploading to remote Supabase Storage with isolated user folder path
      if (isRemoteActive() && fileOrDataUrl instanceof File) {
        try {
          const ownerFolder = (authUser && authUser.id) ? authUser.id : String(numId);
          const fileName = `${ownerFolder}/avatar_${Date.now()}.jpg`;
          const { data, error } = await supabaseInstance.storage
            .from('provider-avatars')
            .upload(fileName, fileOrDataUrl, { upsert: true, contentType: 'image/jpeg' });
          if (!error && data) {
            const { data: pubUrlData } = supabaseInstance.storage.from('provider-avatars').getPublicUrl(fileName);
            if (pubUrlData && pubUrlData.publicUrl) {
              avatarUrl = pubUrlData.publicUrl;
            }
          }
        } catch (err) {
          console.warn('Storage upload fallback to dataUrl:', err);
        }
      }

      // Update provider profile in DB/Store
      const updateRes = await this.updateProviderProfile(numId, {
        avatarUrl: avatarUrl,
        avatar_url: avatarUrl
      });

      return {
        avatarUrl: avatarUrl,
        provider: updateRes.data || updateRes
      };
    }
  };

  // Expose Outbox and Sync Engine on LokatorDB
  LokatorDB.sync = syncEngine;
  LokatorDB.outbox = outboxManager;
  LokatorDB.createWriteResult = createWriteResult;
  LokatorDB.moderator = (typeof global.ServiceModerator !== 'undefined') ? global.ServiceModerator : null;

  // 6. INTERNAL ANALYTICS API (Admin Aggregations & Retention)
  LokatorDB.analytics = {
    async getExecutiveSummary(days = 30) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_executive_summary', { p_days: days });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        total_events: 0,
        total_sessions_approx: 0,
        client_error_count: 0,
        search_count: 0,
        search_no_results_count: 0,
        no_results_rate: 0,
        daily_volume: [],
        generated_at: new Date().toISOString()
      };
    },
    async getFunnelSummary(days = 30) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_funnel_summary', { p_days: days });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        provider_funnel: {
          registration_started: 0, validation_failed: 0, registration_submitted: 0,
          registration_succeeded: 0, login_submitted: 0, login_succeeded: 0, login_failed: 0,
          dashboard_engagements: 0, form_completion_rate: 0, creation_success_rate: 0, login_success_rate: 0
        },
        customer_funnel: {
          category_browses: 0, searches: 0, search_no_results: 0, profile_views: 0,
          whatsapp_clicks: 0, phone_clicks: 0, total_contact_leads: 0, reviews_submitted: 0,
          registration_cta_clicks: 0, profile_lead_conversion_rate: 0, whatsapp_preference_ratio: 0
        },
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    },
    async getPerformanceSummary(days = 30) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_performance_summary', { p_days: days });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        sample_count: 0,
        status: 'INSTRUMENTATION_ONLY',
        p75_metrics: {
          lcp_ms: null, lcp_p50_ms: null, lcp_p90_ms: null, inp_ms: null,
          cls: null, ttfb_ms: null, fcp_ms: null, dom_ready_ms: null, pwa_splash_ms: null
        },
        thresholds: { lcp_good: '<= 2500ms', inp_good: '<= 200ms', cls_good: '<= 0.10', ttfb_target: '<= 800ms' },
        generated_at: new Date().toISOString()
      };
    },
    async pruneOldEvents(retentionDays = 60, batchSize = 5000) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('prune_old_analytics_events', {
          p_retention_days: retentionDays,
          p_batch_size: batchSize
        });
        if (error) throw error;
        return data;
      }
      return { raw_events_deleted: 0, daily_summaries_deleted: 0, completed_at: new Date().toISOString() };
    },
    async generateDailySummary(targetDate) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('generate_daily_analytics_summary', {
          p_target_date: targetDate
        });
        if (error) throw error;
        return data;
      }
      return 0;
    },
    async getAnomalySummary(days = 7, zThreshold = 2.5) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_anomaly_summary', {
          p_days: days,
          p_z_threshold: zThreshold
        });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        z_threshold: zThreshold,
        platform_status: 'DATA_INSUFFICIENT',
        anomalies_count: 0,
        anomalies: [],
        metrics_summary: { total_events: 0, total_sessions_approx: 0, error_rate_percent: 0, cwv_sample_count: 0, cwv_status: 'INSUFFICIENT_DATA' },
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    }
  };

  const analyticsAlertsManager = {
    async getSummary(days = 7) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_alert_summary', {
          p_days: days
        });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        platform_alert_status: 'HEALTHY',
        open_alerts_count: 0,
        critical_alerts_count: 0,
        warning_alerts_count: 0,
        resolved_alerts_count: 0,
        suppressed_alerts_count: 0,
        total_alerts_count: 0,
        alerts: [],
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    },
    async getDetail(alertId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_analytics_alert_detail', {
          p_alert_id: alertId
        });
        if (error) throw error;
        return data;
      }
      return { alert: null, audit_trail: [], observational_status: 'OBSERVATIONAL_ONLY', generated_at: new Date().toISOString() };
    },
    async acknowledge(alertId, reason = null) {
      if (isRemoteActive()) {
        const { error } = await supabaseInstance.rpc('acknowledge_analytics_alert', {
          p_alert_id: alertId,
          p_reason: reason
        });
        if (error) throw error;
        return true;
      }
      return true;
    },
    async resolve(alertId, reason = null) {
      if (isRemoteActive()) {
        const { error } = await supabaseInstance.rpc('resolve_analytics_alert', {
          p_alert_id: alertId,
          p_reason: reason
        });
        if (error) throw error;
        return true;
      }
      return true;
    },
    async suppress(alertId, reason = null, durationHours = 24) {
      if (isRemoteActive()) {
        const { error } = await supabaseInstance.rpc('suppress_analytics_alert', {
          p_alert_id: alertId,
          p_reason: reason,
          p_duration_hours: durationHours
        });
        if (error) throw error;
        return true;
      }
      return true;
    },
    async reopen(alertId, reason = null) {
      if (isRemoteActive()) {
        const { error } = await supabaseInstance.rpc('reopen_analytics_alert', {
          p_alert_id: alertId,
          p_reason: reason
        });
        if (error) throw error;
        return true;
      }
      return true;
    },
    async createOrUpdateAlert(params) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('create_or_update_analytics_alert', {
          p_anomaly_type: params.anomalyType,
          p_metric_name: params.metricName,
          p_category: params.category || null,
          p_severity: params.severity,
          p_current_value: params.currentValue,
          p_baseline_value: params.baselineValue,
          p_deviation_score: params.deviationScore,
          p_sample_size: params.sampleSize,
          p_window_days: params.windowDays || 7
        });
        if (error) throw error;
        return data;
      }
      return null;
    }
  };

  LokatorDB.analyticsAlerts = analyticsAlertsManager;
  LokatorDB.analytics.getAlertSummary = analyticsAlertsManager.getSummary;
  LokatorDB.analytics.getAlertDetail = analyticsAlertsManager.getDetail;
  LokatorDB.analytics.acknowledgeAlert = analyticsAlertsManager.acknowledge;
  LokatorDB.analytics.resolveAlert = analyticsAlertsManager.resolve;
  LokatorDB.analytics.suppressAlert = analyticsAlertsManager.suppress;
  LokatorDB.analytics.reopenAlert = analyticsAlertsManager.reopen;

  // 4D. DISCOVERY & GROWTH INTELLIGENCE MANAGER (Phase 7.1)
  const discoveryIntelligenceManager = {
    async getSummary(days = 30) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_growth_intelligence_summary', {
          p_days: days
        });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        model_version: 'v1',
        platform_total_searches: 0,
        platform_total_zero_results: 0,
        platform_total_profile_views: 0,
        platform_total_leads: 0,
        platform_zero_result_rate: 0,
        platform_search_to_profile_rate: 0,
        platform_profile_to_lead_rate: 0,
        platform_avg_dqs_score: 100.0,
        categories: [],
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    },
    async getDemandSupplyGaps(days = 30, minSearches = 10) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_lga_demand_supply_gaps', {
          p_days: days,
          p_min_searches: minSearches
        });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        min_search_threshold: minSearches,
        model_version: 'v1',
        k_anonymity_floor: 5,
        gaps: [],
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    },
    async getGrowthSignals(days = 14) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_growth_signals', {
          p_days: days
        });
        if (error) throw error;
        return data;
      }
      return {
        window_days: days,
        signals_count: 0,
        signals: [],
        observational_status: 'OBSERVATIONAL_ONLY',
        generated_at: new Date().toISOString()
      };
    },
    async generateDailySummary(targetDate = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('generate_daily_growth_summary', {
          p_target_date: targetDate || new Date(Date.now() - 86400000).toISOString().split('T')[0]
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', target_date: targetDate, records_processed: 0, model_version: 'v1', observational_status: 'OBSERVATIONAL_ONLY' };
    }
  };

  LokatorDB.discoveryIntelligence = discoveryIntelligenceManager;
  LokatorDB.analytics.getGrowthSummary = discoveryIntelligenceManager.getSummary;
  LokatorDB.analytics.getDemandSupplyGaps = discoveryIntelligenceManager.getDemandSupplyGaps;
  LokatorDB.analytics.getGrowthSignals = discoveryIntelligenceManager.getGrowthSignals;

  // Phase 7.2 Growth Automation & Smart Recommendations Manager
  const growthRecommendationsManager = {
    async getSummary() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_growth_recommendation_summary');
        if (error) throw error;
        return data;
      }
      return {
        active_count: 0,
        critical_count: 0,
        high_count: 0,
        supply_gap_count: 0,
        zero_result_count: 0,
        quality_fix_count: 0,
        recommendations: [],
        observational_posture: 'OBSERVATIONAL_ADVISORY_ONLY'
      };
    },
    async review(recommendationId, notes = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('review_growth_recommendation', {
          p_recommendation_id: recommendationId,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', id: recommendationId, new_status: 'REVIEWED' };
    },
    async accept(recommendationId, notes = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('accept_growth_recommendation', {
          p_recommendation_id: recommendationId,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', id: recommendationId, new_status: 'ACCEPTED', execution_posture: 'ACCEPTED_RECORDED_NO_AUTOMATED_MUTATION' };
    },
    async dismiss(recommendationId, reason = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('dismiss_growth_recommendation', {
          p_recommendation_id: recommendationId,
          p_reason: reason
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', id: recommendationId, new_status: 'DISMISSED' };
    },
    async generate(evalDays = 7, baselineDays = 28) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('generate_growth_recommendations', {
          p_eval_days: evalDays,
          p_baseline_days: baselineDays
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', recommendations_evaluated: 0, expired_recommendations: 0, model_version: 'v1' };
    }
  };

  // 4B. REALTIME GROWTH & OPERATIONAL MONITORING (Phase 8.0A)
  let realtimeGrowthChannel = null;
  let realtimeGrowthHeartbeatTimer = null;
  let realtimeGrowthPollingTimer = null;
  let realtimeGrowthStatus = 'DISCONNECTED';
  let lastRealtimeGrowthSignalTime = null;

  const realtimeGrowthManager = {
    getStatus() {
      return realtimeGrowthStatus;
    },
    async getLatestSignals() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_realtime_growth_signals');
        if (error) throw error;
        lastRealtimeGrowthSignalTime = new Date();
        return data;
      }
      return {
        posture: 'OBSERVATIONAL_ADVISORY_ONLY',
        active_signals_count: 0,
        critical_high_count: 0,
        last_computed_at: new Date().toISOString(),
        window_status: 'HEALTHY',
        events_evaluated: 0,
        signals: []
      };
    },
    async getDelta(since) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_realtime_growth_delta', {
          p_since: since
        });
        if (error) throw error;
        return data;
      }
      return { delta_timestamp: new Date().toISOString(), delta_signals: [] };
    },
    async computeSignals(forceRefresh = false) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compute_realtime_growth_signals', {
          p_force_refresh: forceRefresh
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', window_id: '5m', events_evaluated: 0, signals_generated: 0 };
    },
    async acknowledge(signalId, notes = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('acknowledge_realtime_signal', {
          p_signal_id: signalId,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', signal_id: signalId, new_status: 'ACKNOWLEDGED' };
    },
    subscribe(onSignal, onStatusChange) {
      realtimeGrowthManager.unsubscribe();

      const updateStatus = (newStatus) => {
        if (realtimeGrowthStatus !== newStatus) {
          realtimeGrowthStatus = newStatus;
          if (typeof onStatusChange === 'function') {
            onStatusChange(newStatus);
          }
        }
      };

      // Fallback Polling Loop (15-second intervals as required by P3-01 / P3-02)
      const startPolling = () => {
        updateStatus('POLLING_FALLBACK');
        if (realtimeGrowthPollingTimer) clearInterval(realtimeGrowthPollingTimer);
        realtimeGrowthPollingTimer = setInterval(async () => {
          try {
            const summary = await realtimeGrowthManager.getLatestSignals();
            if (typeof onSignal === 'function') {
              onSignal(summary);
            }
          } catch (err) {
            console.warn('[Lokator RealtimeGrowth] Polling error:', err.message);
            updateStatus('STALE');
          }
        }, 15000);
      };

      if (!isRemoteActive() || !supabaseInstance.channel) {
        startPolling();
        return;
      }

      try {
        updateStatus('LIVE');
        realtimeGrowthChannel = supabaseInstance.channel('realtime-growth-signals', {
          config: { broadcast: { self: false } }
        });

        realtimeGrowthChannel
          .on('broadcast', { event: 'growth_signal' }, (payload) => {
            lastRealtimeGrowthSignalTime = new Date();
            updateStatus('LIVE');
            if (typeof onSignal === 'function') {
              onSignal(payload.payload || payload);
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              updateStatus('LIVE');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              console.warn('[Lokator RealtimeGrowth] Channel disconnected, switching to polling fallback');
              startPolling();
            }
          });

        // 30-second Heartbeat monitor (P3-02)
        realtimeGrowthHeartbeatTimer = setInterval(() => {
          const now = Date.now();
          if (lastRealtimeGrowthSignalTime && (now - lastRealtimeGrowthSignalTime.getTime()) > 60000) {
            // Signal stale for over 60s, trigger delta poll
            realtimeGrowthManager.getLatestSignals().then(data => {
              if (typeof onSignal === 'function') onSignal(data);
            }).catch(() => {
              updateStatus('STALE');
            });
          }
        }, 30000);

      } catch (e) {
        console.warn('[Lokator RealtimeGrowth] WebSocket initialization failed, using polling fallback', e);
        startPolling();
      }
    },
    unsubscribe() {
      if (realtimeGrowthHeartbeatTimer) {
        clearInterval(realtimeGrowthHeartbeatTimer);
        realtimeGrowthHeartbeatTimer = null;
      }
      if (realtimeGrowthPollingTimer) {
        clearInterval(realtimeGrowthPollingTimer);
        realtimeGrowthPollingTimer = null;
      }
      if (realtimeGrowthChannel && isRemoteActive()) {
        try {
          supabaseInstance.removeChannel(realtimeGrowthChannel);
        } catch (e) {
          // ignore cleanup errors
        }
        realtimeGrowthChannel = null;
      }
      realtimeGrowthStatus = 'DISCONNECTED';
    }
  };

  const growthIntelligenceManager = {
    async getOperationalIntelligence() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_operational_growth_intelligence');
        if (error) throw error;
        return data;
      }
      return { status: 'HEALTHY', posture: 'OBSERVATIONAL_ADVISORY_ONLY', items: [] };
    },
    async getOperationalDelta(since) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_operational_growth_delta', { p_since: since });
        if (error) throw error;
        return data;
      }
      return { delta: [] };
    },
    async computeOperationalIntelligence(forceRefresh = false) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compute_operational_growth_intelligence', { p_force_refresh: forceRefresh });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', items_processed: 0 };
    },
    async transitionState(id, newState, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('transition_operational_intelligence', {
          p_id: id,
          p_new_state: newState,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'TRANSITIONED', id, new_state: newState };
    },
    async acknowledge(id, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('acknowledge_operational_intelligence', {
          p_id: id,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'ACKNOWLEDGED', id };
    },
    async suppress(id, notes = 'Suppressed by operator') {
      return this.transitionState(id, 'SUPPRESSED', notes);
    },
    async flagFollowUp(id, notes = 'Flagged for business follow-up') {
      return this.transitionState(id, 'SUSTAINED', notes);
    }
  };

  const predictiveGrowthManager = {
    async getPredictions() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_predictive_growth_predictions');
        if (error) throw error;
        return data;
      }
      return { status: 'HEALTHY', posture: 'OBSERVATIONAL_PREDICTIVE_ONLY', predictions: [] };
    },
    async getPredictionDelta(since) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_predictive_growth_delta', { p_since: since });
        if (error) throw error;
        return data;
      }
      return { delta: [] };
    },
    async computePredictions(forceRefresh = false) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compute_predictive_growth_intelligence', { p_force_refresh: forceRefresh });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', predictions_evaluated: 0 };
    },
    async getPredictionEvidence(predictionId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_predictive_growth_evidence', { p_prediction_id: predictionId });
        if (error) throw error;
        return data;
      }
      return { prediction_id: predictionId, explanation: {} };
    },
    async transitionPrediction(predictionId, newState, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('transition_predictive_growth', {
          p_prediction_id: predictionId,
          p_new_state: newState,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'TRANSITIONED', prediction_id: predictionId, new_state: newState };
    },
    async acknowledgePrediction(predictionId, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('acknowledge_predictive_growth', {
          p_prediction_id: predictionId,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'ACKNOWLEDGED', prediction_id: predictionId };
    },
    async watchPrediction(predictionId, notes = 'Flagged for operational monitoring') {
      return this.transitionPrediction(predictionId, 'WATCH', notes);
    },
    async dismissPrediction(predictionId, notes = 'Dismissed by operator') {
      return this.transitionPrediction(predictionId, 'INVALIDATED', notes);
    },
    getStatus() {
      return realtimeGrowthStatus;
    }
  };

  const strategicCommandManager = {
    async getCommandCenter() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_unified_marketplace_command_center');
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.0.0',
        status: 'HEALTHY',
        executive_pulse: {
          marketplace_health: 'OPTIMAL',
          strategic_pressure_index: 0,
          critical_interventions_count: 0,
          high_priority_expansions_count: 0,
          total_active_opportunities: 0,
          active_alerts_count: 0,
          top_opportunity: null,
          operational_posture: 'OBSERVATIONAL_ADVISORY_COMMAND_CENTER'
        },
        strategic_opportunities: [],
        regional_matrix: [],
        active_alerts: [],
        generated_at: new Date().toISOString()
      };
    },
    async computeSynthesis(forceRefresh = false) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compute_strategic_intelligence_synthesis', { p_force_refresh: forceRefresh });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', strategic_opportunities_synthesized: 0 };
    },
    async getSynthesisEvidence(synthesisId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_synthesis_evidence', { p_synthesis_id: synthesisId });
        if (error) throw error;
        return data;
      }
      return { synthesis_id: synthesisId, explanation: {} };
    },
    async transitionSynthesis(synthesisId, newState, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('transition_strategic_synthesis', {
          p_synthesis_id: synthesisId,
          p_new_state: newState,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'TRANSITIONED', synthesis_id: synthesisId, new_state: newState };
    },
    async acknowledgeSynthesis(synthesisId, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('acknowledge_strategic_synthesis', {
          p_synthesis_id: synthesisId,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'ACKNOWLEDGED', synthesis_id: synthesisId };
    },
    async watchSynthesis(synthesisId, notes = 'Flagged for operational monitoring') {
      return this.transitionSynthesis(synthesisId, 'WATCH', notes);
    },
    async dismissSynthesis(synthesisId, notes = 'Dismissed by operator') {
      return this.transitionSynthesis(synthesisId, 'INVALIDATED', notes);
    }
  };

  const strategicDecisionManager = {
    async recordDecision(synthesisId, decisionType, rationale, expectedOutcome = null, targetMetric = 'SUPPLY_DEFICIT_REDUCTION', targetValue = 0.00, observationWindowDays = 14) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('record_strategic_decision', {
          p_synthesis_id: synthesisId,
          p_decision_type: decisionType,
          p_rationale: rationale,
          p_expected_outcome: expectedOutcome,
          p_target_metric: targetMetric,
          p_target_value: targetValue,
          p_observation_window_days: observationWindowDays
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', synthesis_id: synthesisId, decision_type: decisionType };
    },
    async transitionDecision(decisionId, newState, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('transition_strategic_decision', {
          p_decision_id: decisionId,
          p_new_state: newState,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', decision_id: decisionId, new_state: newState };
    },
    async createActionPlan(decisionId, objective, actionCategory = 'PROVIDER_ACQUISITION', recommendedAction = 'Initiate provider acquisition outreach', ownerTitle = 'Operations Lead', priority = 'P1', startDate = null, targetCompletionDate = null, expectedOutcome = null, successMetric = 'SUPPLY_DEFICIT_REDUCTION', targetValue = 0.00, notes = '') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('create_strategic_action_plan', {
          p_decision_id: decisionId,
          p_objective: objective,
          p_action_category: actionCategory,
          p_recommended_action: recommendedAction,
          p_owner_title: ownerTitle,
          p_priority: priority,
          p_start_date: startDate || new Date().toISOString().split('T')[0],
          p_target_completion_date: targetCompletionDate,
          p_expected_outcome: expectedOutcome,
          p_success_metric: successMetric,
          p_target_value: targetValue,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', decision_id: decisionId, objective: objective };
    },
    async recordOutcome(actionPlanId, observedMetricValue, sampleSize = 0, uniqueSessions = 0, attributionNotes = 'Observed outcome in post-action observation window.') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('record_strategic_outcome', {
          p_action_plan_id: actionPlanId,
          p_observed_metric_value: observedMetricValue,
          p_sample_size: sampleSize,
          p_unique_sessions: uniqueSessions,
          p_attribution_notes: attributionNotes
        });
        if (error) throw error;
        return data;
      }
      return { status: 'SUCCESS', action_plan_id: actionPlanId, observed_metric_value: observedMetricValue };
    },
    async getWorkbench(synthesisId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_decision_workbench', {
          p_synthesis_id: synthesisId
        });
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.1.0',
        opportunity: { id: synthesisId },
        decisions: [],
        action_plans: [],
        outcomes: [],
        audit_trail: []
      };
    },
    async getPerformanceSummary() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_decision_performance_summary');
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.1.0',
        kpis: {
          total_decisions: 0,
          active_decisions: 0,
          active_action_plans: 0,
          decisions_awaiting_measurement: 0,
          successful_interventions: 0,
          underperforming_interventions: 0,
          inconclusive_interventions: 0,
          average_effectiveness_score: 0.0,
          conversion_rate: 0.0
        },
        recent_decisions: [],
        recent_action_plans: []
      };
    }
  };

  const strategicOrchestrationManager = {
    async evaluateCycle(forceReevaluate = false) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('evaluate_strategic_orchestration_cycle', {
          p_force_reevaluate: forceReevaluate
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'SUCCESS',
        evaluated_at: new Date().toISOString(),
        summary: {
          stalled_decisions: 0,
          overdue_action_plans: 0,
          plans_awaiting_measurement: 0,
          decayed_syntheses: 0,
          events_generated: 0
        }
      };
    },
    async getFeed(limit = 20) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_orchestration_feed', {
          p_limit: limit
        });
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.2.0',
        generated_at: new Date().toISOString(),
        feed_summary: {
          critical_escalations_count: 0,
          stalled_decisions_count: 0,
          overdue_plans_count: 0,
          awaiting_measurement_count: 0,
          stale_syntheses_count: 0
        },
        critical_escalations: [],
        stalled_decisions: [],
        overdue_action_plans: [],
        awaiting_measurement: [],
        stale_syntheses: []
      };
    },
    async getLearningInsights(actionCategory = null, category = null, state = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategy_learning_insights', {
          p_action_category: actionCategory,
          p_category: category,
          p_state: state
        });
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.2.0',
        generated_at: new Date().toISOString(),
        insights: []
      };
    },
    async getExecutiveSummary() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_executive_strategic_summary');
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.2.0',
        generated_at: new Date().toISOString(),
        kpis: {
          portfolio_health_score: 100.0,
          weekly_decision_velocity: 0,
          active_decisions: 0,
          active_action_plans: 0,
          overdue_action_plans: 0,
          plans_awaiting_measurement: 0,
          critical_escalations: 0,
          historical_average_effectiveness: 0.0
        },
        freshness_summary: {
          total_active_syntheses: 0,
          fresh_syntheses: 0,
          stale_syntheses: 0
        }
      };
    }
  };

  const strategicScenarioManager = {
    async createScenario({
      synthesisId,
      decisionId = null,
      title = 'Proposed Strategy Simulation',
      actionCategory = 'PROVIDER_ACQUISITION',
      forecastHorizonDays = 14,
      targetCapacityAddition = 5.0
    }) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('create_strategic_scenario', {
          p_synthesis_id: synthesisId,
          p_decision_id: decisionId,
          p_title: title,
          p_action_category: actionCategory,
          p_forecast_horizon_days: forecastHorizonDays,
          p_target_capacity_addition: targetCapacityAddition
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'SUCCESS',
        scenario_id: 'mock-scenario-' + Date.now(),
        synthesis_id: synthesisId,
        input_hash: 'mock-hash',
        model_version: 'SSFDS-1.0.0'
      };
    },

    async runScenario(scenarioId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('run_strategic_scenario', {
          p_scenario_id: scenarioId
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'SUCCESS',
        scenario_id: scenarioId,
        model_version: 'SSFDS-1.0.0',
        metrics: {
          forecast_confidence: 0.8500,
          strategic_risk_score: 25.00,
          expected_strategic_value: 75.00,
          projected_deficit_reduction_pct: 60.00
        },
        executive_brief: {
          classification: 'SIMULATED_PROJECTION',
          headline: 'Projected 60% deficit reduction over 14 days.',
          expected_strategic_value: 75.00,
          strategic_risk_rating: 'LOW',
          confidence_grade: 'HIGH',
          advisory_disclaimer: 'SIMULATED PROJECTION ONLY — Not an observed marketplace event.'
        }
      };
    },

    async compareScenarios(synthesisId, scenarioIds, comparisonTitle = 'Strategic Candidate Comparison') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compare_strategic_scenarios', {
          p_synthesis_id: synthesisId,
          p_scenario_ids: scenarioIds,
          p_comparison_title: comparisonTitle
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'SUCCESS',
        comparison_id: 'mock-comp-' + Date.now(),
        synthesis_id: synthesisId,
        recommended_scenario_id: scenarioIds[0] || null,
        matrix: []
      };
    },

    async getScenario(scenarioId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_scenario', {
          p_scenario_id: scenarioId
        });
        if (error) throw error;
        return data;
      }
      return {
        scenario: { id: scenarioId, scenario_status: 'DRAFT', model_version: 'SSFDS-1.0.0' },
        inputs: null,
        results: null,
        audit_trail: []
      };
    },

    async getScenarioHistory(synthesisId = null, decisionId = null, limit = 20) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_scenario_history', {
          p_synthesis_id: synthesisId,
          p_decision_id: decisionId,
          p_limit: limit
        });
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.3.0',
        generated_at: new Date().toISOString(),
        scenarios: []
      };
    },

    async getExecutiveSummary() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_executive_scenario_summary');
        if (error) throw error;
        return data;
      }
      return {
        schema_version: '9.3.0',
        generated_at: new Date().toISOString(),
        model_version: 'SSFDS-1.0.0',
        kpis: {
          total_scenarios: 0,
          simulated_scenarios: 0,
          average_expected_value: 0.0,
          average_risk_score: 0.0,
          average_forecast_confidence: 0.0,
          high_risk_scenarios_count: 0,
          total_comparisons: 0
        },
        top_opportunities: []
      };
    }
  };

  const strategicOptimizationManager = {
    async generatePortfolio(modelVersion = 'SOPAE-1.0.0', maxBudget = 100.00, maxRisk = 65.00, maxActions = 10) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('generate_strategic_portfolio_allocation', {
          p_model_version: modelVersion,
          p_max_budget: maxBudget,
          p_max_risk: maxRisk,
          p_max_actions: maxActions
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'OFFLINE_MOCK',
        portfolio_id: '00000000-0000-0000-0000-000000000000',
        model_version: 'SOPAE-1.0.0',
        executive_brief: {
          classification: 'DECISION_SUPPORT_RECOMMENDATION',
          headline: 'Optimized 0 strategic actions for €0.00',
          aggregate_expected_value: 0.00,
          aggregate_risk: 0.00,
          disclaimer: 'RECOMMENDED/SIMULATED ONLY — MANUAL_ACTION_REQUIRED. NOT EXECUTED.'
        }
      };
    },

    async getPortfolio(portfolioId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_portfolio', {
          p_portfolio_id: portfolioId
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'OFFLINE_MOCK',
        portfolio_id: portfolioId,
        model_version: 'SOPAE-1.0.0',
        metrics: { total_cost: 0, aggregate_expected_value: 0, aggregate_risk: 0, selected_count: 0 },
        allocations: [],
        executive_brief: {}
      };
    }
  };

  const strategicResourceAllocationManager = {
    async generateResourcePlan(portfolioId, modelVersion = 'SRACOE-1.0.0', envelope = {}) {
      const {
        budgetCapital = 1000000.00,
        capacityOperations = 100.00,
        capacityPersonnel = 10,
        capacityCampaigns = 5,
        capacityGeoLga = 20,
        capacityTimeDays = 90
      } = envelope;

      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('generate_strategic_resource_allocation', {
          p_portfolio_id: portfolioId,
          p_model_version: modelVersion,
          p_budget_capital: budgetCapital,
          p_capacity_operations: capacityOperations,
          p_capacity_personnel: capacityPersonnel,
          p_capacity_campaigns: capacityCampaigns,
          p_capacity_geo_lga: capacityGeoLga,
          p_capacity_time_days: capacityTimeDays
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'OFFLINE_MOCK',
        plan_id: '00000000-0000-0000-0000-000000000000',
        portfolio_id: portfolioId,
        model_version: 'SRACOE-1.0.0',
        robustness: 'STABLE',
        composite_resource_risk: 0.00,
        executive_brief: {
          classification: 'DECISION_SUPPORT_RECOMMENDATION',
          headline: 'Resource allocation completed (Offline Mock)',
          aggregate_expected_value: 0.00,
          composite_resource_risk: 0.00,
          robustness_classification: 'STABLE',
          disclaimer: 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED. NOT EXECUTED.'
        }
      };
    },

    async getResourcePlan(planId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_resource_plan', {
          p_plan_id: planId
        });
        if (error) throw error;
        return data;
      }
      return {
        status: 'OFFLINE_MOCK',
        plan_id: planId,
        portfolio_id: '00000000-0000-0000-0000-000000000000',
        model_version: 'SRACOE-1.0.0',
        envelope: {},
        allocated: {},
        residual: {},
        metrics: { selected_count: 0, aggregate_expected_value: 0.00, composite_resource_risk: 0.00, robustness_classification: 'STABLE' },
        shadow_prices: {},
        sensitivity_projections: [],
        allocations: [],
        executive_brief: {}
      };
    }
  };

  // Phase 9.6: Strategic Portfolio Resilience, Stress Testing & Contingency Intelligence (SPRTCIE)
  const strategicResilienceManager = {
    async createStressProfile({
      profileName,
      shockClass = 'CAPITAL_SHOCK',
      deltaCapital = 0.00,
      deltaOperations = 0.00,
      deltaPersonnel = 0.00,
      deltaCampaigns = 0.00,
      deltaGeo = 0.00,
      deltaTime = 0.00,
      demandShockRatio = 0.00,
      costInflationRatio = 0.00,
      description = null
    }) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('create_resilience_stress_profile', {
          p_profile_name: profileName,
          p_shock_class: shockClass,
          p_delta_capital: deltaCapital,
          p_delta_operations: deltaOperations,
          p_delta_personnel: deltaPersonnel,
          p_delta_campaigns: deltaCampaigns,
          p_delta_geo: deltaGeo,
          p_delta_time: deltaTime,
          p_demand_shock_ratio: demandShockRatio,
          p_cost_inflation_ratio: costInflationRatio,
          p_description: description
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        profile_id: '00000000-0000-0000-0000-000000000000',
        profile_name: profileName,
        shock_class: shockClass,
        status: 'OFFLINE_MOCK'
      };
    },

    async runStressTest(planId, profileId, modelVersion = 'SPRTCIE-1.0.0') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('run_resilience_stress_test', {
          p_plan_id: planId,
          p_profile_id: profileId,
          p_model_version: modelVersion
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        run_id: '00000000-0000-0000-0000-000000000000',
        resilience_score: 85.50,
        resilience_tier: 'IMMUNE',
        survival_ratio_count: 1.0000,
        survival_ratio_value: 0.9500,
        dominant_failure_constraint: 'NONE',
        contingency_value_recovery_ratio: 1.0000,
        executive_brief: {
          provenance: 'DECISION_SUPPORT_ONLY',
          status: 'SIMULATED_STRESS_TEST',
          action_guidance: 'MANUAL_ACTION_REQUIRED',
          model_version: modelVersion,
          resilience_score: 85.50,
          resilience_tier: 'IMMUNE'
        }
      };
    },

    async compareStressProfiles(planId, profileIds, modelVersion = 'SPRTCIE-1.0.0') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compare_resilience_stress_profiles', {
          p_plan_id: planId,
          p_profile_ids: profileIds,
          p_model_version: modelVersion
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        plan_id: planId,
        model_version: modelVersion,
        comparison_count: (profileIds || []).length,
        comparison_results: []
      };
    },

    async getStressRun(runId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_resilience_stress_run', {
          p_run_id: runId
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        run_id: runId,
        resilience_score: 0.00,
        resilience_tier: 'CRITICAL_FAILURE',
        constraint_failures: [],
        contingency_portfolios: [],
        executive_brief: {}
      };
    }
  };

  // Phase 9.7: Strategic Decision Governance & Recommendation Lifecycle Engine (SDGRLE)
  const strategicDecisionGovernanceManager = {
    async createRecommendation(planId, scenarioId, title, objective, validDays = 30, modelVersion = 'SDGRLE-1.0.0') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('create_strategic_recommendation', {
          p_plan_id: planId,
          p_scenario_id: scenarioId,
          p_title: title,
          p_objective: objective,
          p_valid_days: validDays,
          p_model_version: modelVersion
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        recommendation_id: '00000000-0000-0000-0000-000000000000',
        recommendation_code: 'REC-MOCK-001',
        current_state: 'RECOMMENDED',
        provenance_hash: 'mock-sha256-hash',
        valid_until: new Date(Date.now() + validDays * 86400000).toISOString()
      };
    },

    async transitionState(recommendationId, targetState, reasonCode, notes = null) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('transition_recommendation_state', {
          p_recommendation_id: recommendationId,
          p_target_state: targetState,
          p_reason_code: reasonCode,
          p_notes: notes
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        recommendation_id: recommendationId,
        from_state: 'RECOMMENDED',
        to_state: targetState
      };
    },

    async submitReview(recommendationId, verdict, alignmentScore, evidenceScore, feasibilityScore, riskScore, rationale, conditions = []) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('submit_recommendation_review', {
          p_recommendation_id: recommendationId,
          p_verdict: verdict,
          p_alignment_score: alignmentScore,
          p_evidence_score: evidenceScore,
          p_feasibility_score: feasibilityScore,
          p_risk_score: riskScore,
          p_rationale: rationale,
          p_conditions: conditions
        });
        if (error) throw error;
        return data;
      }
      const comp = Number((0.35 * alignmentScore + 0.25 * evidenceScore + 0.25 * feasibilityScore + 0.15 * riskScore).toFixed(2));
      return {
        success: true,
        review_id: '00000000-0000-0000-0000-000000000000',
        composite_score: comp,
        verdict: verdict
      };
    },

    async recordOutcome(recommendationId, actualEv, actualCost, actualRisk, evidence = {}) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('record_recommendation_outcome', {
          p_recommendation_id: recommendationId,
          p_actual_ev: actualEv,
          p_actual_cost: actualCost,
          p_actual_risk: actualRisk,
          p_evidence: evidence
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        outcome_id: '00000000-0000-0000-0000-000000000000',
        value_realization_ratio: 1.1500,
        effectiveness_tier: 'EFFECTIVE',
        forecast_error_pct: 5.20
      };
    },

    async getModelDrift(modelVersion = 'SDGRLE-1.0.0') {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_model_performance_drift', {
          p_model_version: modelVersion
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        model_version: modelVersion,
        evaluated_sample_count: 0,
        avg_forecast_error_ev: 0.00,
        avg_forecast_error_cost: 0.00,
        avg_value_realization_ratio: 1.0000,
        effective_rate_pct: 100.00,
        parameter_drift_flag: false
      };
    },

    async getRecommendationDetails(recommendationId) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_recommendation_details', {
          p_recommendation_id: recommendationId
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        recommendation_id: recommendationId,
        recommendation_code: 'REC-MOCK-001',
        title: 'Mock Recommendation',
        objective: 'Test objective',
        current_state: 'RECOMMENDED',
        source_phase: 'PHASE_9.5',
        projected_ev: 100000.00,
        projected_cost: 50000.00,
        confidence_score: 0.8500,
        reviews: [],
        transitions: [],
        outcome: null
      };
    }
  };

  // Phase 9.8: Strategic Intelligence Learning, Calibration & Continuous Improvement (SILCCIE)
  const strategicLearningManager = {
    async evaluateModelHealth(modelVersion = 'SDGRLE-1.0.0', lookbackDays = 90) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('evaluate_strategic_model_health', {
          p_model_version: modelVersion,
          p_lookback_days: lookbackDays
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        evaluation_id: '00000000-0000-0000-0000-000000000000',
        target_model_version: modelVersion,
        learning_engine_version: 'SILCCIE-1.0.0',
        sample_count: 12,
        brier_score: 0.0450,
        expected_calibration_error: 0.0380,
        model_health_score: 88.50,
        drift_status: 'STABLE',
        causality_label: 'OBSERVED_ASSOCIATION'
      };
    },

    async simulateCalibration(evaluationId, confidenceScale = 0.90, evBiasOffset = 0.00) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('simulate_calibration_adjustment', {
          p_evaluation_id: evaluationId,
          p_confidence_scale: confidenceScale,
          p_ev_bias_offset: evBiasOffset
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        simulation_id: '00000000-0000-0000-0000-000000000000',
        simulation_status: 'SIMULATED_ONLY',
        proposed_confidence_scale: confidenceScale,
        projected_health_score: 91.20,
        projected_ece: 0.0310,
        action_guidance: 'SIMULATED_CALIBRATION_ADJUSTMENT — NO_PRODUCTION_CHANGE'
      };
    },

    async getAssumptionSignals() {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('get_strategic_assumption_signals');
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        causality_label: 'OBSERVED_ASSOCIATION',
        signals: [
          {
            assumption_category: 'DEMAND_GROWTH',
            signal_type: 'OVERESTIMATION',
            bias_magnitude_pct: 12.50,
            observation_count: 18,
            confidence_tier: 'HIGH'
          }
        ]
      };
    },

    async compareModels(modelVersions = ['SDGRLE-1.0.0', 'SRACOE-1.0.0'], lookbackDays = 90) {
      if (isRemoteActive()) {
        const { data, error } = await supabaseInstance.rpc('compare_strategic_models', {
          p_model_versions: modelVersions,
          p_lookback_days: lookbackDays
        });
        if (error) throw error;
        return data;
      }
      return {
        success: true,
        lookback_days: lookbackDays,
        model_count: modelVersions.length,
        comparison_results: []
      };
    }
  };

  LokatorDB.strategicCommand = strategicCommandManager;
  LokatorDB.strategicDecision = strategicDecisionManager;
  LokatorDB.strategicOrchestration = strategicOrchestrationManager;
  LokatorDB.strategicScenario = strategicScenarioManager;
  LokatorDB.strategicOptimization = strategicOptimizationManager;
  LokatorDB.strategicResourceAllocation = strategicResourceAllocationManager;
  LokatorDB.strategicResilience = strategicResilienceManager;
  LokatorDB.strategicDecisionGovernance = strategicDecisionGovernanceManager;
  LokatorDB.strategicLearning = strategicLearningManager;
  LokatorDB.predictiveGrowth = predictiveGrowthManager;
  LokatorDB.growthIntelligence = growthIntelligenceManager;
  LokatorDB.realtimeGrowth = realtimeGrowthManager;
  LokatorDB.growthRecommendations = growthRecommendationsManager;
  LokatorDB.analytics.getGrowthRecommendations = growthRecommendationsManager.getSummary;
  LokatorDB.analytics.reviewGrowthRecommendation = growthRecommendationsManager.review;
  LokatorDB.analytics.acceptGrowthRecommendation = growthRecommendationsManager.accept;
  LokatorDB.analytics.dismissGrowthRecommendation = growthRecommendationsManager.dismiss;

  // 5. AUTOMATIC GLOBAL NAVBAR AUTH SYNC
  if (typeof document !== 'undefined') {
    function syncNavbarAuthState() {
      const navLinks = document.getElementById('nav-links');
      if (!navLinks) return;

      const user = LokatorDB.auth.getUserSync();
      const existingLoginLink = document.getElementById('nav-login-link');
      const existingDashBtn = document.getElementById('nav-dash-btn');

      if (user) {
        if (existingLoginLink) existingLoginLink.remove();
        if (!existingDashBtn) {
          const dashBtn = document.createElement('a');
          dashBtn.id = 'nav-dash-btn';
          dashBtn.href = 'dashboard.html';
          dashBtn.className = 'btn btn-outline';
          dashBtn.style.cssText = 'border-color: var(--green); color: var(--green); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;';
          dashBtn.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--green); display: inline-block;"></span> Dashboard`;
          navLinks.appendChild(dashBtn);
        }
      } else {
        if (existingDashBtn) existingDashBtn.remove();
        if (!existingLoginLink && !window.location.pathname.includes('login.html')) {
          const loginLink = document.createElement('a');
          loginLink.id = 'nav-login-link';
          loginLink.href = 'login.html';
          loginLink.className = 'nav-link';
          loginLink.textContent = 'Provider Sign In';
          loginLink.style.cssText = 'color: var(--green); font-weight: 700;';
          navLinks.appendChild(loginLink);
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncNavbarAuthState);
    } else {
      syncNavbarAuthState();
    }

    LokatorDB.auth.onAuthStateChange(() => {
      syncNavbarAuthState();
    });
  }

  // Expose
  global.LokatorDB = LokatorDB;

})(typeof window !== 'undefined' ? window : this);
