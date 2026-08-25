# LOKATOR.NG — PHASE 10.12I INTERNAL FUNNEL REPORT
## Marketplace Funnel Intelligence & Decision Support

**Status:** Certified 100% GREEN  
**Baseline Score:** 461 / 461 assertions passed  
**Production URL:** `https://lokator-ng.vercel.app/`  

---

## 1. Telemetry Architecture & Privacy Model

Lokator.NG's telemetry architecture operates under strict privacy, security, and Nigerian Data Protection Regulation (NDPR) principles:

- **Strict Property Blocklist:** Passwords, auth tokens, JWTs, OTPs, raw phone numbers, WhatsApp numbers, NIN, CAC evidence, and reporter identities are strictly stripped client-side and rejected via database check constraints.
- **Anonymous Ephemeral Session IDs:** Session tracking uses client-side UUIDs (`sessionStorage`) that expire at browser close and never link to personal identity profiles.
- **Non-Blocking Telemetry:** All telemetry events execute asynchronously and fail silently without blocking core marketplace actions (search, profile loading, phone calls, WhatsApp chats, or onboarding).
- **Air-Gapped Decision Support:** Analytics intelligence is strictly decoupled from provider search relevance scoring and ranking.

---

## 2. Event Inventory & Funnel Mapping

| Event Name | Funnel | Stage | Trigger | Source | Payload (PII-Free) |
|---|---|---|---|---|---|
| `provider_onboarding_started` | Provider | Entry | Registration page load / Step 1 init | `register.html` | `{ step: 1, total_steps: 5, device_class }` |
| `provider_onboarding_step_completed` | Provider | Progress | Step validation & transition (Steps 1–4) | `register.html` | `{ step: 1..4, device_class }` |
| `provider_onboarding_preview_reached` | Provider | Preview | Entering Step 5 Live Profile Preview | `register.html` | `{ completeness: score, device_class }` |
| `provider_onboarding_submitted` | Provider | Attempt | Clicking Publish Listing on Step 5 | `register.html` | `{ completeness, trade, state }` |
| `provider_onboarding_succeeded` | Provider | Success | Provider record written to database | `register.html` | `{ provider_id, completeness, trade, state }` |
| `search_submitted` | Customer | Search | Search bar query or filter submit | `search.js` | `{ category, keyword, state, lga, city }` |
| `search_result_viewed` | Customer | Results | Successful provider listings returned | `search.js` | `{ totalCount, page, category, state }` |
| `search_no_results` | Customer | Gap | Query produced zero matching providers | `search.js` | `{ query, category, state, lga }` |
| `provider_card_clicked` | Customer | Card | Clicking provider card in search | `search.js` | `{ providerId, trade, source }` |
| `provider_profile_viewed` | Customer | Profile | Provider profile loaded | `profile.js` | `{ providerId, trade, category, state, lga, verificationStatus }` |
| `phone_clicked` | Customer | Contact | Tap to Call CTA clicked | `profile.js` / `search.js` | `{ providerId, trade, state, lga, verificationStatus }` |
| `whatsapp_clicked` | Customer | Contact | WhatsApp Chat CTA clicked | `profile.js` / `search.js` | `{ providerId, trade, state, lga, verificationStatus }` |
| `provider_review_submitted` | Customer | Review | Approved customer review posted | `profile.js` | `{ rating, page }` |
| `provider_verification_requested` | Trust | Vetting | NIN/CAC compliance request submitted | `supabase-client.js` | `{ providerId, docType }` |
| `provider_report_submitted` | Trust | Moderation| Listing reported by customer | `supabase-client.js` | `{ targetId, reason }` |
| `review_report_submitted` | Trust | Moderation| Review flagged by customer | `supabase-client.js` | `{ targetId, reason }` |

---

## 3. Mathematical Metric Definitions & Denominator Rules

1. **Provider Step Conversion Rates:**
   - $\text{Step 1 Rate} = \frac{\text{Step 1 Completed}}{\text{Registration Starts}} \times 100$
   - $\text{Step 2 Rate} = \frac{\text{Step 2 Completed}}{\text{Step 1 Completed}} \times 100$
   - $\text{Step 3 Rate} = \frac{\text{Step 3 Completed}}{\text{Step 2 Completed}} \times 100$
   - $\text{Enhancement Rate} = \frac{\text{Profile Enhancement Reached}}{\text{Step 3 Completed}} \times 100$
   - $\text{Preview Rate} = \frac{\text{Preview Reached}}{\text{Profile Enhancement Reached}} \times 100$
   - $\text{Publish Rate} = \frac{\text{Published Listings}}{\text{Preview Reached}} \times 100$
   - $\text{Overall Registration Completion Rate} = \frac{\text{Published Listings}}{\text{Registration Starts}} \times 100$

2. **Customer Funnel Conversion Rates:**
   - $\text{Search Result Rate} = \frac{\text{Searches Producing } \ge 1 \text{ Result}}{\text{Total Searches Started}} \times 100$
   - $\text{Zero-Result Rate} = \frac{\text{Searches Producing 0 Results}}{\text{Total Searches Started}} \times 100$
   - $\text{Profile Conversion Rate} = \frac{\text{Provider Profile Views}}{\text{Searches with Results}} \times 100$
   - $\text{Contact Conversion Rate} = \frac{\text{Total Contacts (Call + WhatsApp)}}{\text{Provider Profile Views}} \times 100$
   - $\text{WhatsApp Preference Ratio} = \frac{\text{WhatsApp Clicks}}{\text{Total Contacts (Call + WhatsApp)}} \times 100$

---

## 4. Zero-Result & Supply Gap Intelligence

Zero-result searches indicate unmet customer demand across Nigerian localities. The intelligence engine aggregates these into normalized, privacy-safe metrics:
- **Category Supply Gaps:** High search volume + 0 verified providers (e.g. Solar Installers in Ogun / Sagamu).
- **High-Conversion Opportunities:** Adequate supply ($\ge 1$ provider) + high contact conversion ($\ge 15\%$).
- **Low-Engagement Areas:** Adequate supply ($\ge 2$ providers) + searches with 0 contact actions.

---

## 5. Completeness vs. Contact Rate Correlation

Analyzes aggregate correlation across profile completeness bands:
- `0–49%`: Incomplete profiles (unpublishable)
- `50–74%`: Sub-threshold profiles (require core trade/location info)
- `75–89%`: Standard published listings
- `90–100%`: Fully enhanced listings (portfolio items, verified working hours, AI bio)

*Note: Reported strictly as an observed correlation, not a causal claim.*

---

## 6. Mobile vs. Desktop Funnel Performance

Segments funnel conversion across device classes:
- **Mobile:** Primary interaction channel for Nigerian customers and on-the-go artisans.
- **Desktop:** Secondary research and bulk administrative management.

---

## 7. Security, RLS & Retention

- `analytics_events` table is append-only for `anon` and `authenticated` roles.
- `SELECT`, `UPDATE`, and `DELETE` are revoked from public roles.
- Server-side rate limiting throttles excessive submissions (max 30 events/minute/session).
- Data lifecycle policy supports automated 60-day raw event pruning via `pruneOldEvents()`.
