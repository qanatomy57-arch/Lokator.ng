# LOKATOR.NG — PHASE 10.8 NIGERIAN SKILLS IMPLEMENTATION PRIORITY MATRIX

**Document:** `PHASE_10_8_NIGERIA_SKILLS_PRIORITY_MATRIX.md`  
**Phase:** 10.8 Architecture & Discovery Gate  
**Status:** IMPLEMENTATION ROADMAP & SEQUENCING — DESIGN ONLY (READ-ONLY)  

---

## 1. SEQUENCED IMPLEMENTATION PHASES

| Phase | Milestone Name | Scope & Deliverables | Priority | Risk Level |
|---|---|---|---|---|
| **Tier 1** | **Database Schema & Master Taxonomy DDL** | Deploy Migration with 15 Industries, 48 Categories, 185 Skills, and RLS policies | P0 | LOW |
| **Tier 1** | **Colloquial Alias & Synonym Engine** | Populate `skill_aliases` with 1,200+ Nigerian terms; connect to `discovery-orchestrator.js` | P0 | LOW |
| **Tier 2** | **Provider Skill Normalization Backfill** | Non-destructive mapping of existing providers to `provider_skills` rows | P1 | LOW |
| **Tier 2** | **Browse-First Homepage & Navigation UI** | Deploy Industry grid, popular trade carousels, and category drawer | P1 | LOW |
| **Tier 3** | **Provider Onboarding & Profile Upgrade** | Upgrade `register.html` and `profile.html` with multi-skill guided selectors | P2 | LOW |
| **Tier 3** | **Programmatic SEO Skill Landing Pages** | Generate canonical `/services/{slug}` routes with structured Schema.org data | P2 | MEDIUM |
| **Tier 4** | **Administrative Governance Workbench** | Add Phase 10.8 taxonomy management card to internal analytics dashboard | P3 | LOW |

---

## 2. RISK & DEFENSE MATRIX

| Potential Failure Mode | Impact | Defensive Protocol |
|---|---|---|
| **Taxonomy Misclassification** | Provider listed under wrong sub-skill | Multi-skill selection allows primary/secondary designation + easy self-edit in dashboard |
| **Search Regression** | Missing results for obscure colloquialisms | Fallback to full-text search against bio and services if canonical alias resolution fails |
| **Performance Overhead** | Slower query times on deep category trees | B-Tree indexes on `category_id` and `skill_id` + in-memory caching of taxonomy JSON |

---

## 3. FINAL SUMMARY & AUTHORIZATION STATUS

The Phase 10.8 architecture delivers a complete, evidence-based blueprint for turning Lokator.NG into the definitive Nigerian skills marketplace without disturbing existing ranking or business truth data.
