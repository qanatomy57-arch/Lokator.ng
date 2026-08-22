# LOKATOR.NG — PHASE 10.8 ARCHITECTURE AUDIT: NIGERIA SKILLS MARKETPLACE & CANONICAL SERVICE TAXONOMY

**Phase:** 10.8 Architecture & Discovery Gate  
**System:** Nigeria Skills Marketplace & Canonical Service Taxonomy  
**Status:** ARCHITECTURAL SPECIFICATION & DISCOVERY GATE — READ-ONLY  
**Model Version:** `NSMT-1.0.0` (Design Target)  
**Authoritative Baseline Commit:** `419f641`  

---

## 1. EXECUTIVE SUMMARY & RECONNAISSANCE

Lokator.NG currently operates with an 18-category flat service structure defined in `categories.js` and `001_lokator_production_foundation.sql`. While this foundation has powered initial verification, natural-language search resolution (`discovery-orchestrator.js`), and provider registration, it is inherently limited in its ability to support a multi-layered Nigerian skills economy.

### Key Reconnaissance Findings:
1. **Flat Hierarchy Limitation:** Current categories conflate *Industries* (e.g., "Auto Services"), *Professions* (e.g., "Electrician"), and *Individual Skills* (e.g., "Nail Tech").
2. **Multi-Skill Representation:** `providers.skills` is stored as an unconstrained `TEXT[]` array, while `provider_services` allows custom `service_name` strings without foreign-key constraints to canonical skills.
3. **Colloquial Gap:** While `discovery-orchestrator.js` contains a curated set of trade aliases (e.g., "rewire", "vulcanizer", "panel beater", "i pass my neighbor"), there is no database-backed alias index supporting phonetic, regional, or multilingual queries across Hausa, Yoruba, Igbo, and Nigerian Pidgin.
4. **Browse Discovery Deficit:** Current marketplace discovery is query-dependent (`search.html?service=...`). Users who do not know the exact term cannot browse systematically from high-level economic sectors down to localized specializations.

---

## 2. CANONICAL TAXONOMY HIERARCHY

To accurately represent the Nigerian informal and formal trade economy, Phase 10.8 establishes a 4-tier canonical hierarchy:

$$\mathbf{Industry} \longrightarrow \mathbf{Category} \longrightarrow \mathbf{Skill} \longrightarrow \mathbf{Specialization}$$

### Hierarchy Level Definitions:
1. **Industry (Level 1):** Broad macroeconomic sector (e.g., `Home & Repairs`, `Beauty & Personal Care`, `Automotive & Transport`, `Creative & Digital`).
2. **Category (Level 2):** Functional trade cluster within an industry (e.g., `Electrical & Energy`, `Hair Care`, `Vehicle Maintenance`, `Catering & Culinary`).
3. **Skill (Level 3 - Primary Canonical Unit):** Distinct artisan or professional capability that a provider is hired to execute (e.g., `Electrician`, `Solar Installer`, `Mechanic`, `Barber`, `Tailor`).
4. **Specialization (Level 4):** Niche competency, equipment specialization, or brand-specific expertise (e.g., `Toyota Diagnostic Specialist`, `Inverter Battery Maintenance`, `Bridal Hairstyling`, `Agbada Bespoke Tailoring`).

---

## 3. AIR-GAP & BUSINESS TRUTH INVARIANTS

1. **Ranking Air-Gap (100% Intact):** Canonical taxonomy resolution occurs strictly *pre-search* during query normalization. Taxonomy nodes and alias mappings feed `search.js` search filters but have **zero** influence on the distance-, review-, and verification-weighted provider ranking algorithms.
2. **Business Truth Immutability:** No automated or uncontrolled mutations to `providers`, `reviews`, or `provider_services`.
3. **Zero Autonomous Adaptation:** No automatic taxonomy generation or automated provider reclassification without human administrator authorization.

---

## 4. ARCHITECTURAL READINESS VERDICT

Phase 10.8 provides a complete, structured blueprint for scaling Lokator.NG into a browse-first skills marketplace while keeping production stable and fully isolated.
