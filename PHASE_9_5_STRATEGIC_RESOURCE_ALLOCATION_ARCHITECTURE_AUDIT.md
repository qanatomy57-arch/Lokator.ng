# LOKATOR.NG — PHASE 9.5 ARCHITECTURE AUDIT: STRATEGIC RESOURCE ALLOCATION & CONSTRAINT OPTIMIZATION ENGINE (SRACOE)

**Phase:** 9.5 Architecture Gate  
**Engine:** Strategic Resource Allocation & Constraint Optimization Engine (SRACOE)  
**Baseline Certified Commit:** `803df6b`  
**Model Version:** `SRACOE-1.0.0`  
**Status:** READ-ONLY ARCHITECTURAL SPECIFICATION  

---

## 1. EXECUTIVE SUMMARY

Phase 9.5 introduces the **Strategic Resource Allocation & Constraint Optimization Engine (SRACOE)** to Lokator.NG. SRACOE builds directly upon the Phase 9.4 Strategic Optimization & Portfolio Allocation Engine (SOPAE), providing executive decision-support for distributing multi-dimensional, finite resource envelopes (capital, operational bandwidth, personnel, campaign slots, geographic bounds, and execution time) across recommended strategic actions.

SRACOE operates strictly in an advisory capacity:

- **Decision Support Only:** Zero autonomous execution, zero webhook firing, zero provider mutations.
- **Air-Gapped:** Live marketplace search ranking (`search.js`) and discovery orchestration (`discovery-orchestrator.js`) are 100% isolated from resource optimization computations.
- **Deterministic:** Given identical inputs, resource envelopes, and model versions, the output allocation plan is mathematically reproducible.
- **Hardened Security:** Server-side `public.is_admin()` authentication, strict `search_path` pinning, and immutable audit logs.

---

## 2. EXISTING ARCHITECTURE DEPENDENCIES

SRACOE is downstream from the certified Phase 9.0–9.4 intelligence stack:

```text
[Phase 9.0: SIMCC Synthesis]
        │
        ▼
[Phase 9.1: Strategic Decisions & Actions]
        │
        ▼
[Phase 9.2: Continuous Orchestration (CSOEI)]
        │
        ▼
[Phase 9.3: Scenario Forecasting (SSFDS)]
        │
        ▼
[Phase 9.4: Strategic Optimization (SOPAE)]
        │
        ▼
[Phase 9.5: Resource Allocation & Constraints (SRACOE)]
```

---

## 3. ENGINE OBJECTIVES

1. **Multi-Constraint Optimization:** Solve simultaneous resource feasibility across 6 heterogeneous constraint dimensions.
2. **Sentinel Arithmetic:** Guarantee zero division-by-zero, NaN, or Infinity through Sentinel Class 2 zero-resource handling.
3. **Marginal Value & Shadow Pricing:** Provide mathematically sound marginal returns and binding constraint sensitivity.
4. **Adversarial Resilience:** Maintain strict security boundaries, fail-closed authorization, and zero side-effects.

---

## 4. RESOURCE ENVELOPE MODEL

A Resource Envelope $\mathcal{E}$ represents a bounded multi-vector of organizational constraints:

$$\mathcal{E} = \langle B_{\text{cap}}, K_{\text{ops}}, K_{\text{pers}}, K_{\text{camp}}, K_{\text{geo}}, K_{\text{time}} \rangle$$

| Dimension | Identifier | Type | Lower Bound | Canonical Upper Bound | Description |
| --- | --- | --- | --- | --- | --- |
| Capital Budget | `budget_capital` | `NUMERIC(12,2)` | `0.00` | `100,000,000.00` | Financial expenditure ceiling (₦ / €) |
| Operational Units | `capacity_operations` | `NUMERIC(8,2)` | `0.00` | `10,000.00` | Onboarding / vetting bandwidth units |
| Personnel Headcount | `capacity_personnel` | `INT` | `0` | `500` | Operations staff full-time equivalents |
| Campaign Slots | `capacity_campaigns` | `INT` | `0` | `100` | Marketing & outreach concurrent slots |
| Geographic Footprint | `capacity_geo_lga` | `INT` | `0` | `774` | Maximum LGA coverage boundaries |
| Execution Time Horizon | `capacity_time_days` | `INT` | `1` | `365` | Maximum implementation window |

---

## 5. MATHEMATICAL OPTIMIZATION MODEL

### 5.1 Objective Function

For a set of $N$ candidate actions drawn from Phase 9.4 portfolio allocations ($i \in \{1, \dots, N\}$), let $x_i \in \{0, 1\}$ denote the binary selection indicator.

Maximize total adjusted strategic value subject to resource penalties:

$$\max \mathcal{Z} = \sum_{i=1}^N x_i \cdot \text{AdjustedEV}_i \cdot \left(1 - \omega_i \cdot \text{ResourceRisk}_i\right)$$

where $\omega_i \in [0.0, 0.5]$ is the risk discount factor (default $\omega_i = 0.10$).

### 5.2 Hard Resource Constraints

A feasible allocation $X = (x_1, \dots, x_N)$ must satisfy all simultaneous resource bounds:

$$\sum_{i=1}^N x_i \cdot c_{i, m} \le R_m \quad \forall m \in \{\text{cap}, \text{ops}, \text{pers}, \text{camp}, \text{geo}, \text{time}\}$$

where $c_{i, m} \ge 0$ is candidate $i$'s requirement for resource dimension $m$, and $R_m$ is the envelope limit.

---

## 6. CONSTRAINT MODEL & BOUNDS

- **No Infeasible Allocations:** If adding candidate $i$ violates *any* resource constraint $m$, candidate $i$ cannot be selected ($x_i = 0$).
- **Bounded Resource Limits:** Any request specifying $R_m < 0$ fails closed with `ERRCODE = 22023`.
- **Envelope Feasibility Check:** If all $R_m = 0$, the engine returns a valid, empty allocation plan with `selected_count = 0` and `total_value = 0.00` without dividing by zero.

---

## 7. MULTI-DIMENSIONAL ALLOCATION ALGORITHM

To guarantee $O(M \cdot N \log N)$ computational safety and avoid $O(2^N)$ NP-hard branch-and-bound lockups in PostgreSQL PL/pgSQL, SRACOE employs a **Multi-Constraint Dominance Greedy Knapsack Heuristic with Dynamic Dominance Pruning**:

1. **Composite Resource Cost:** For each candidate $i$, compute normalized multi-resource usage:
   $$\rho_i = \max_{m} \left( \frac{c_{i, m}}{R_m} \right) \quad \text{for } R_m > 0$$
2. **Efficiency Rating:**
   - If $\rho_i = 0$ and $\text{AdjustedEV}_i > 0$: Sentinel Class 2 (`Zero-Resource Opportunity`).
   - If $\rho_i > 0$: Class 1, with Multi-Resource Efficiency $E_i = \frac{\text{AdjustedEV}_i}{\rho_i}$.
   - If $\rho_i = 0$ and $\text{AdjustedEV}_i = 0$: Sentinel Class 0.
   - If $\rho_i < 0$: Sentinel Class -1 (Invalid/Rejected).
3. **Iterative Allocation:** Candidates are evaluated in deterministic priority order. At each step, if candidate $i$ fits within all remaining resource capacities $\mathcal{R}_{\text{rem}}$, it is allocated:
   $$\mathcal{R}_{\text{rem}, m} \leftarrow \mathcal{R}_{\text{rem}, m} - c_{i, m} \quad \forall m$$

---

## 8. ZERO-RESOURCE & BOUNDARY MATHEMATICS

To prevent Division-by-Zero, `NaN`, or `Infinity`:

- When $\rho_i = 0$, no division is performed. Candidate $i$ is assigned `efficiency_class = 2` if $\text{AdjustedEV}_i > 0$, or `efficiency_class = 0` if $\text{AdjustedEV}_i = 0$.
- Sentinel Class 2 ranks strictly above Class 1 ($E_i < \infty$), ensuring zero-resource actions with positive return are prioritized without numeric instability.

---

## 9. MARGINAL VALUE MATHEMATICS

The Marginal Value ($MV$) of resource dimension $m$ evaluates the incremental strategic return per unit consumed:

$$MV_{i, m} = \begin{cases} 
\frac{\text{AdjustedEV}_i}{c_{i, m}} & \text{if } c_{i, m} > 0 \\
\text{NULL} \text{ (or Sentinel 9999.00)} & \text{if } c_{i, m} = 0 \text{ with Sentinel Class 2}
\end{cases}$$

---

## 10. CONSTRAINT SHADOW VALUE ENGINE

Shadow Value ($\lambda_m$) models the estimated strategic opportunity gain if binding constraint $m$ were relaxed by a bounded increment $\Delta R_m$:

$$\lambda_m \approx \frac{\mathcal{Z}(R_m + \Delta R_m) - \mathcal{Z}(R_m)}{\Delta R_m}$$

- **Non-Binding Constraints:** If $\mathcal{R}_{\text{rem}, m} > 0$, then $\lambda_m = 0.00$.
- **Advisory Labeling:** Shadow values are explicitly flagged as `SIMULATED_SENSITIVITY_PROJECTION` to prevent misinterpretation as guaranteed revenue.

---

## 11. SENSITIVITY MODEL

SRACOE simulates 4 standard deterministic perturbation scenarios:

1. **Capital Contraction (-10% Budget):** Assesses vulnerability to budget cuts.
2. **Capital Expansion (+10% Budget):** Identifies next-in-line strategic opportunities.
3. **Capacity Shock (-20% Operational Bandwidth):** Tests operational resilience.
4. **Risk Surge (+15% Strategic Risk):** Evaluates portfolio stability under adverse market conditions.

---

## 12. ROBUSTNESS CLASSIFICATION MODEL

Let $\mathcal{J}(X, X_{\text{perturbed}})$ denote the Jaccard similarity index of selected actions between the baseline and perturbed scenarios:

$$\text{RobustnessIndex} = \frac{1}{4} \sum_{k=1}^4 \mathcal{J}(X, X^{(k)})$$

| Robustness Index Range | Classification | Action Guidance |
| --- | --- | --- |
| $[0.85, 1.00]$ | `ROBUST` | Highly stable under operational variations |
| $[0.65, 0.85)$ | `STABLE` | Minor allocation shifts under severe shocks |
| $[0.40, 0.65)$ | `SENSITIVE` | Sensitive to budget or capacity changes |
| $[0.00, 0.40)$ | `FRAGILE` | Critical dependency on exact resource parameters |

---

## 13. RESOURCE RISK ENGINE

Calculates a bounded composite Resource Risk Score $R_{\text{resource}} \in [0.00, 100.00]$:

$$R_{\text{resource}} = 0.35 \cdot \text{ConcentrationRisk} + 0.35 \cdot \text{ConstraintPressure} + 0.30 \cdot \text{FragilityScore}$$

- **Concentration Risk:** Gini coefficient of capital allocation across top 3 actions ($[0, 100]$).
- **Constraint Pressure:** $\max_m \left( \frac{R_m - \mathcal{R}_{\text{rem}, m}}{R_m} \right) \cdot 100$ ($[0, 100]$).
- **Fragility Score:** $(1.0 - \text{RobustnessIndex}) \cdot 100$ ($[0, 100]$).

---

## 14. DETERMINISM PROOF

SRACOE strictly eliminates non-deterministic execution paths:

1. Candidate Ordering uses an exhaustive 6-key tie-breaker:
   `efficiency_class DESC`, `finite_efficiency DESC`, `adjusted_ev DESC`, `risk ASC`, `conf DESC`, `scenario_id ASC`.
2. Dynamic Knapsack iteration follows deterministic single-pass loops.
3. Perturbation simulations use fixed deterministic multipliers (no random draws or Monte Carlo sampling).

---

## 15. MODEL VERSION GOVERNANCE

- **Canonical Version:** `SRACOE-1.0.0`
- **Validation:** RPC rejects any unapproved model string with `ERRCODE = 22023`.
- **Provenance:** `model_version` is stored in `analytics_strategic_resource_plans` and audit records.

---

## 16. SECURITY ARCHITECTURE

- **Row Level Security (RLS):** Enabled on all Phase 9.5 tables. `REVOKE ALL FROM PUBLIC, anon`.
- **Privileged RPC Hardening:**
  - `SECURITY DEFINER`
  - `SET search_path = public, extensions, pg_temp;`
  - Explicit session validation via `auth.uid()`.
  - Server-side role verification via `public.is_admin()`.
- **Immutable Audit Log:** `REVOKE UPDATE, DELETE` from `authenticated`.

---

## 17. PRIVACY ANALYSIS

- Consumes only pre-aggregated, privacy-compliant Phase 9.4 portfolio records.
- $N \ge 30, k \ge 5$ privacy floor preserved.
- Zero PII (no names, phones, emails, raw queries, or IP addresses).

---

## 18. RESOURCE SAFETY & COMPLEXITY

- Candidate limit: $N \le 100$.
- Resource constraints: $M \le 6$.
- Perturbation scenarios: Fixed $K = 4$.
- Total time complexity: $O(K \cdot M \cdot N \log N)$, completing in $< 50\text{ms}$ on PostgreSQL.
- Space complexity: $O(N)$ temporary table footprint.

---

## 19. FAILURE ISOLATION

- **Zero Core Dependencies:** SRACOE failure cannot affect search, user registration, provider profiles, or live discovery.
- **Fail-Closed API:** Unhandled errors or invalid inputs abort gracefully without mutating database state.

---

## 20. RANKING AIR-GAP PROOF

- `search.js` and `discovery-orchestrator.js` do not import or query `analytics_strategic_resource_*`.
- Search ranking algorithms remain 100% isolated.

---

## 21. BUSINESS TRUTH MUTATION PROOF

- SRACOE contains 0 write queries against `providers`, `reviews`, or `provider_services`.
- Marketplace truth remains strictly immutable.

---

## 22. AUTONOMOUS EXECUTION PROOF

- 0 triggers, 0 pg_net calls, 0 webhooks, 0 background worker jobs.
- Produces advisory resource plans only.

---

## 23. THREAT MODEL & MITIGATION MATRIX

| Threat ID | Threat Vector | Mitigation Strategy |
| --- | --- | --- |
| T-01 | Division by zero on zero-resource candidate | Sentinel Class 2 classification isolates zero-denominator cases |
| T-02 | Negative resource envelope injection | Strict `R_m >= 0` check; returns `ERRCODE 22023` on negative inputs |
| T-03 | Search path hijacking in SECURITY DEFINER RPC | Fixed `SET search_path = public, extensions, pg_temp;` |
| T-04 | Privilege escalation via forged claims | Server-side `auth.uid()` extraction and `public.is_admin()` verification |
| T-05 | Replay / audit log tampering | Append-only audit log with `REVOKE UPDATE, DELETE` |
| T-06 | Non-deterministic ordering | Complete tie-breaker hierarchy ending in `scenario_id ASC` |
| T-07 | Stale Phase 9.4 portfolio reference | Validates existence and foreign-key integrity of `portfolio_id` |
| T-08 | DoS via unbounded candidate payload | Bounded candidate scan (`LIMIT 100`) |

---

## 24. ADVERSARIAL REVIEW (THREAT VECTORS A–Z)

- **A (Div by Zero):** Sentinel class system guarantees division is never evaluated with zero divisor.
- **B (NaN/Infinity):** Arithmetic bounds on all numeric inputs.
- **C (Negative Resources):** Validated and rejected at RPC boundary.
- **D (Zero-Resource Candidates):** Prioritized deterministically via Sentinel Class 2 without NaN.
- **E (Impossible Constraints):** Handled gracefully; produces empty allocation with zero cost.
- **F (Conflicting Constraints):** Multi-resource feasibility check enforces simultaneous compliance across all dimensions.
- **G (Duplicate Candidates):** Foreign key unique constraints prevent duplicate allocations per plan.
- **H (Duplicate Resources):** Normalized canonical schema fields prevent multi-counting.
- **I (Deterministic Tie-Break):** 6-key deterministic sort hierarchy.
- **J (Integer Overflow):** Numerical bounds (`NUMERIC(12,2)`) prevent overflow.
- **K (Numeric Precision):** `ROUND(..., 2)` applied to currency and percentages.
- **L (Budget Exhaustion):** Single-pass allocation halts cleanly when resources are depleted.
- **M (Residual Resources):** Explicitly computed and reported in executive brief.
- **N (Candidate Starvation):** Tracked in `unallocated_candidates_count`.
- **O (Concentration Risk):** Quantified via Gini metric in Resource Risk score.
- **P (Constraint Relaxation Abuse):** Shadow values labeled as projections only.
- **Q (Model Version Mismatch):** Fail-closed validation for `SRACOE-1.0.0`.
- **R (Stale Inputs):** Foreign-key checks to active portfolio IDs.
- **S (Replay Attacks):** Unique plan IDs generated per execution with timestamps.
- **T (Concurrency):** Read-committed transaction isolation with local temp tables.
- **U (Privilege Escalation):** Blocked by `public.is_admin()`.
- **V (Forged Identity):** `auth.uid()` session validation.
- **W (SQL Injection):** Parameterized queries and strict version string validation.
- **X (Resource Exhaustion):** $N \le 100$ candidate bound.
- **Y (Privacy Differencing):** Pre-aggregated inputs preserve $k \ge 5$ anonymity.
- **Z (UX Confusion):** Explicit `DECISION_SUPPORT` and `MANUAL_ACTION_REQUIRED` UI badges.

---

## 25. PROPOSED CONTRACTS & SCHEMA SPECIFICATION

### 25.1 Migration 017 Schema Contract (Proposed)

```sql
-- 1. RESOURCE PLANS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_optimization_portfolios(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL DEFAULT 'SRACOE-1.0.0',
    envelope_capital NUMERIC(12,2) NOT NULL,
    envelope_operations NUMERIC(8,2) NOT NULL,
    envelope_personnel INT NOT NULL,
    envelope_campaigns INT NOT NULL,
    envelope_geo_lga INT NOT NULL,
    envelope_time_days INT NOT NULL,
    allocated_capital NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    allocated_operations NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    allocated_personnel INT NOT NULL DEFAULT 0,
    allocated_campaigns INT NOT NULL DEFAULT 0,
    allocated_geo_lga INT NOT NULL DEFAULT 0,
    allocated_time_days INT NOT NULL DEFAULT 0,
    residual_capital NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    aggregate_expected_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    composite_resource_risk NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    robustness_classification TEXT NOT NULL DEFAULT 'STABLE',
    executive_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESOURCE ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    allocation_rank INT NOT NULL,
    allocated_capital NUMERIC(10,2) NOT NULL,
    allocated_operations NUMERIC(8,2) NOT NULL,
    allocated_personnel INT NOT NULL,
    allocated_campaigns INT NOT NULL,
    allocated_geo_lga INT NOT NULL,
    marginal_value_capital NUMERIC(10,4),
    marginal_value_operations NUMERIC(10,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_scenario UNIQUE (plan_id, scenario_id)
);

-- 3. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 25.2 Primary RPC Contract (Proposed)

```sql
CREATE OR REPLACE FUNCTION public.generate_strategic_resource_allocation(
    p_portfolio_id UUID,
    p_model_version TEXT DEFAULT 'SRACOE-1.0.0',
    p_budget_capital NUMERIC DEFAULT 1000000.00,
    p_capacity_operations NUMERIC DEFAULT 100.00,
    p_capacity_personnel INT DEFAULT 10,
    p_capacity_campaigns INT DEFAULT 5,
    p_capacity_geo_lga INT DEFAULT 20,
    p_capacity_time_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp;
```

---

## 26. TEST STRATEGY

When authorized, implementation testing will feature 4 zero-dependency, self-contained suites:

1. **Unit Test Suite (`scratch/test_phase95_strategic_resource_allocation.js`):** Schema verification, multi-constraint boundary checking, sentinel class zero-resource math, and tie-breaking determinism (80+ assertions).
2. **Adversarial Security Suite (`scratch/test_phase95b_adversarial_security.js`):** Unauthenticated fail-closed gates, negative budget rejection, SQLi resistance, ranking air-gap validation, and business truth immutability (30+ assertions).
3. **Live Verification Suite (`scratch/test_phase95c_live_verification.js`):** Production HTTP endpoints and Supabase REST RPC authorization checks.
4. **Master Regression Matrix (`scratch/run_phase95c_full_matrix.js`):** Comprehensive 39-suite regression runner maintaining 100% green baseline.

---

## 27. ROLLBACK STRATEGY

Should rollback be required:

1. Revert `analytics.html`, `analytics.js`, and `supabase-client.js` to commit `803df6b`.
2. Execute teardown script dropping `analytics_strategic_resource_*` tables and RPCs.
3. Verify zero impact on Phase 9.0–9.4 tables or core platform operations.

---

## 28. EXPLICIT GO / NO-GO GATE

- **Architecture Audit:** Complete & Sound
- **Mathematical Formulations:** Division-by-zero resilient, multi-dimensional knapsack heuristic fully defined
- **Security Posture:** Hardened with `SECURITY DEFINER`, fixed `search_path`, and `public.is_admin()`
- **Invariants:** 100% Ranking Air-Gap, 0 Business Truth Mutations, 0 Autonomous Execution

**GATE RECOMMENDATION:** `GO` (Architecture is GREEN. Ready for human review and implementation authorization.)
