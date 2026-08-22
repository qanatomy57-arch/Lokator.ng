# LOKATOR.NG — PHASE 10.8 NIGERIAN SKILLS SECURITY & THREAT AUDIT

**Document:** `PHASE_10_8_NIGERIA_SKILLS_SECURITY_AUDIT.md`  
**Phase:** 10.8 Architecture & Discovery Gate  
**Status:** HOSTILE SECURITY AUDIT & THREAT MODEL — DESIGN ONLY (READ-ONLY)  

---

## 1. HOSTILE THREAT VECTOR ANALYSIS

| Threat Vector | Attack Scenario | Defensive Control | Residual Risk |
|---|---|---|---|
| **Taxonomy Poisoning** | Attacker inserts illegal or fraudulent skills (e.g. "Yahoo Yahoo", "Kidnapping", "Weapons") | `ServiceModerator` blocklist + strict `public.is_admin()` governance gate on `skills` DDL | Zero |
| **Alias Poisoning** | Hijacking popular trade queries (e.g. mapping "electrician" alias to a fraudulent skill) | Unique constraint on `skill_aliases(alias)` + manual admin review required for alias addition | Zero |
| **Provider Skill Squatting** | Provider self-assigning 100+ skills to manipulate multi-category visibility | Maximum limit of 10 skills per provider enforced at DB level via trigger | Zero |
| **SEO Spam / Doorway Injection** | Generating thousands of programmatic thin-content pages for non-existent trades | Canonical skill whitelist; only indexed if verified active providers exist in that locality | Zero |
| **Ranking Contamination** | Using skill popularity scores to artificially inflate provider search rank | Strict Ranking Air-Gap: Taxonomy only filters candidate pools; scoring remains purely distance/rating/verification | Zero |
| **SQL / Regex Injection via Search** | Malicious payloads in free-form search input (e.g. `' OR 1=1 --`) | Parameterized queries + strict length bounding ($300\text{ chars}$) in `discovery-orchestrator.js` | Zero |
| **Cross-Tenant Metadata Leakage** | Exposing private draft skills or unapproved categories to unauthorized sessions | RLS policies restricting unapproved/draft taxonomy to authenticated administrators | Zero |
| **SECURITY DEFINER Exploitation** | Attempting schema hijacking on taxonomy maintenance RPCs | Pinned search path `SET search_path = public, extensions, pg_temp;` on all RPCs | Zero |

---

## 2. CONTENT FILTERING & DISALLOWED TRADES POLICY

Lokator.NG strictly enforces the exclusion of illegal, harmful, unlicensed medical, or predatory services. The canonical taxonomy permanently disallows:
- Unlicensed invasive medical procedures.
- Financial scamming, hacking, or fraudulent document production.
- Adult/escort services.
- Illicit substances, weapons, or counterfeit merchandise.

All proposed taxonomy additions must pass through `skill_governance_events` with mandatory human administrator approval.
