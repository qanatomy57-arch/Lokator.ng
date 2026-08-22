# LOKATOR.NG — PHASE 10.9 ARCHITECTURE AUDIT
## MARKETPLACE DISCOVERY & CONVERSION INTELLIGENCE ENGINE (MDCIE)

```text
ENGINE:              Marketplace Discovery & Conversion Intelligence Engine (MDCIE)
VERSION:             MDCIE-1.0.0
AUDIT_DATE:          2026-08-22
STATUS:              CERTIFIED_ARCHITECTURAL_BASELINE
CLASSIFICATION:      AIR-GAPPED_DISCOVERY_CONVERSION_SYSTEM
SECURITY:            SECURITY_DEFINER_PINNED_SEARCH_PATH
RANKING_AIR_GAP:     100% INTACT (ZERO MODIFICATIONS TO DISTANCE RANKING)
MUTATION_STATUS:     ZERO BUSINESS TRUTH MUTATION
```

---

## 1. EXECUTIVE SUMMARY & SYSTEM PURPOSE

Phase 10.9 introduces the **Marketplace Discovery & Conversion Intelligence Engine (MDCIE)** for Lokator.NG.

The fundamental goal of Lokator.NG is to connect Nigerians seeking artisans and technical services with verified, nearby service providers through a friction-free, WhatsApp-first, and browse-first discovery journey:

```text
MACRO INDUSTRY (15 Sectors)
          ↓
SERVICE CATEGORY (48 Categories)
          ↓
CANONICAL SKILL (185 Trades)
          ↓
SPECIALIZATION (450+ Micro-skills)
          ↓
LOCATION (36 States + FCT + LGAs)
          ↓
AVAILABLE VERIFIED PROVIDERS
          ↓
PROVIDER PROFILE
          ↓
WHATSAPP / DIRECT PHONE CONVERSION
```

MDCIE does **not** replace the existing distance-based ranking search engine. Rather, it supercharges discovery navigation, cross-trade discovery, zero-results intelligent recovery, and full-funnel conversion telemetry without compromising any architectural invariants.

---

## 2. ARCHITECTURAL INVARIANTS & AIR-GAP GUARANTEES

| Invariant | Status | Verification Result |
| :--- | :---: | :--- |
| **Search Ranking Air-Gap** | 🔒 Certified | Zero modifications to distance, rating, or verification weights in `search.js` / `discovery-orchestrator.js`. |
| **Business Truth Immutability** | 🔒 Certified | Zero writes/mutations to `public.providers`, `public.reviews`, or ratings tables. |
| **Telemetry Append-Only** | 🔒 Certified | `marketplace_discovery_events` is strictly append-only; `UPDATE` and `DELETE` revoked. |
| **National Geographic Dynamic** | 🔒 Certified | Dynamic resolution across all 36 States + FCT; Lagos is not hardcoded as default. |
| **Zero Autonomous Decisions** | 🔒 Certified | No unmonitored triggers, cron auto-mutations, or external egress. |

---

## 3. DATABASE SCHEMA TOPOLOGY (Migration 031)

### 3.1. `public.skill_relationships`
Governs cross-trade relatedness and complementary skills (e.g. Solar Installer $\leftrightarrow$ Inverter Technician):
* `id`: UUID Primary Key
* `skill_id_a`: VARCHAR(100)
* `skill_id_b`: VARCHAR(100)
* `relationship_type`: CHECK `('COMPLEMENTARY', 'SUBSTITUTE', 'PREREQUISITE', 'RELATED')`
* `strength_score`: NUMERIC(3,2) CHECK `BETWEEN 0.10 AND 1.00`
* `is_active`: BOOLEAN DEFAULT TRUE

### 3.2. `public.marketplace_discovery_events`
Append-only telemetry recording granular user discovery steps:
* `id`: UUID Primary Key
* `session_id`: VARCHAR(100)
* `event_type`: VARCHAR(50) (`'industry_viewed'`, `'category_selected'`, `'skill_selected'`, `'location_filtered'`, `'provider_results_viewed'`, `'zero_results'`, `'profile_opened'`, `'whatsapp_clicked'`, `'phone_clicked'`)
* `context`: JSONB
* `created_at`: TIMESTAMPTZ DEFAULT NOW()

---

## 4. PRIVILEGED RPC ARCHITECTURE

1. `public.get_marketplace_discovery_context(p_industry, p_category, p_skill, p_specialization, p_state, p_city)`
   * Resolves taxonomy hierarchy, builds interactive breadcrumbs, and fetches related trade recommendations.
2. `public.get_related_canonical_skills(p_skill_id, p_limit)`
   * Fetches complementary skills from the governed relationship graph.
3. `public.get_hierarchical_taxonomy_tree()`
   * Returns complete macro-industry tree for browse-first navigation.
4. `public.log_marketplace_discovery_event(p_event_type, p_context, p_session_id)`
   * Safely logs non-invasive discovery and conversion events.
5. `public.get_discovery_conversion_signals(p_timeframe_days)`
   * Executive reporting endpoint for demand discovery and conversion health.

---

## 5. RECOVERY & CONVERSION MECHANISMS

* **Interactive Multi-Tier Breadcrumbs**: Clear visual context trail allowing seamless upstream and downstream navigation.
* **Intelligent Zero-Results Recovery Card**: When an exact query has 0 providers in an LGA, provides instant action buttons to expand search to the full State, browse the macro industry, or explore complementary skills.
* **Preserved Profile Context**: Profiles maintain the search and category context from which the user arrived, tracking WhatsApp and Call conversion rates per source.
