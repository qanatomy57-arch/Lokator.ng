# LOKATOR.NG — PHASE 9.4 ARCHITECTURAL AUDIT & SPECIFICATION

## Strategic Optimization & Portfolio Allocation Engine (SOPAE)

**Status:** ARCHITECTURAL DESIGN COMPLETE — READ-ONLY VERIFIED
**Date:** August 21, 2026
**Environment:** Lokator.NG Architecture & Design Gate
**Target Migration:** `supabase/migrations/016_lokator_strategic_optimization.sql` (NOT YET AUTHORIZED)
**Current Production Commit Baseline:** `97cd790`
**Production URL:** `https://lokator-ng.vercel.app/`
**Production Supabase:** `hvxosxhnxauiqrhpyuur` (`eu-central-1`)

---

## 1. Executive Summary

Phase 9.4 introduces the **Strategic Optimization & Portfolio Allocation Engine (SOPAE)**.
SOPAE is the apex intelligence layer of the Lokator.NG executive suite. While Phase 9.3 (SSFDS) provides simulation for *individual* scenarios, Phase 9.4 evaluates *multiple competing opportunities simultaneously* to generate an optimal portfolio of strategic actions subject to operational constraints (time, budget, personnel).

SOPAE answers questions such as:

- *"Given limited acquisition budget, which 3 LGAs should we prioritize for provider acquisition to maximize overall marketplace liquidity?"*
- *"Which combination of promotional campaigns yields the highest aggregate Expected Strategic Value (EV) under our current risk tolerance?"*
- *"What is the mathematically optimal allocation of verification agents across the top 10 under-supplied categories?"*
- *"Which strategic opportunities deserve attention first?"*

### Critical Architectural Boundary: Optimization & Recommendation Only

SOPAE is **strictly an optimization and decision-support layer**. It provides deterministic, ranked recommendations. SOPAE contains **zero autonomous execution mechanisms**. It MUST NOT execute any recommendation. It MUST NOT modify the search ranking engine or provider data.

---

## 2. Authoritative Current Baseline State

Phase 9.3 (Strategic Scenario Forecasting & Decision Simulation Engine — SSFDS) is production-certified GREEN:

- **Live Production Verification**: 61/61 PASS.
- **Cumulative Platform Regression Score**: **3,350 / 3,350 assertions PASS across 35 suites (100%)**.
- **Security Vulnerabilities**: **0 P0, 0 P1, 0 P2, 0 P3**.
- **Platform Invariants**: Ranking Air-Gap CONFIRMED, Business Truth Mutation ZERO.
- **Active Database Migrations**: `001` through `015` applied and verified.

---

## 3. Phase 9.4 Objectives & Non-Negotiable Invariants

### 3.1 Core Objectives

1. **Multi-Objective Optimization**: Rank and optimize competing strategic scenarios based on Expected Value (EV), Risk (R), and Resource Cost.
2. **Constraint Satisfaction Modeling**: Apply hard constraints (e.g., maximum budget, max concurrent campaigns) to filter the strategic opportunity space.
3. **Portfolio Frontier Generation**: Identify the efficient frontier of strategic actions (maximizing EV for a given risk level).
4. **Deterministic Prioritization**: Ensure consistent ranking of opportunities given the same snapshot of intelligence state.
5. **Executive Allocation Brief**: Present the optimized portfolio allocation in a human-readable format.

### 3.2 Non-Negotiable Invariants

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NON-NEGOTIABLE PLATFORM INVARIANTS                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. RANKING AIR-GAP         │ search.js & discovery-orchestrator.js are 100% │
│                            │ isolated from SOPAE outputs.                   │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 2. BUSINESS TRUTH          │ Zero INSERT, UPDATE, DELETE on providers,      │
│    IMMUTABILITY            │ reviews, or provider_services. SOPAE only READS│
│                            │ approved intelligence outputs.                 │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 3. NO EXECUTION            │ SOPAE recommends. It DOES NOT EXECUTE.         │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 4. ZERO AUTONOMOUS         │ Zero pg_net, http_post, webhooks, or automated │
│    EXECUTION               │ operational mutations.                         │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 5. SERVER-SIDE PROVENANCE  │ auth.uid() + server-side public.is_admin()     │
│                            │ validation; zero client-supplied actor claims. │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 6. PRIVACY FLOOR           │ N >= 30, k >= 5 across all evaluated cohorts.  │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 7. RESOURCE SAFETY         │ Optimization horizons limited to max 100       │
│                            │ concurrent candidate scenarios. Timeout < 5s.  │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 8. DETERMINISM             │ Inputs + ModelVersion = Identical Output.      │
└────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 4. Component Architecture & 5 Deterministic Engines

### 4.1 Engine Specifications

1. **Candidate Ingestion Engine (Engine 1)**:
   - Queries `analytics_strategic_scenarios` (from Phase 9.3) to aggregate all currently active, valid candidate scenarios.
   - Filters out stale or unviable scenarios.

2. **Constraint Satisfaction Engine (Engine 2)**:
   - Applies operator-defined global constraints:
     - Maximum total capital cost ($C_{max}$)
     - Maximum risk tolerance ($R_{max}$)
     - Maximum operational units ($U_{max}$)
   - Culls candidate actions that individually breach limits.

3. **Portfolio Optimization Engine (Engine 3)**:
   - Utilizes a deterministic Knapsack-style greedy approximation algorithm.
   - Maximizes $\sum EV_i$ subject to capacity and risk boundaries.

4. **Efficient Frontier Engine (Engine 4)**:
   - Groups selected scenarios into risk-banded portfolios (e.g., Conservative, Balanced, Aggressive).
   - Provides comparative aggregate metrics for each portfolio.

5. **Allocation Executive Brief Engine (Engine 5)**:
   - Synthesizes the optimized portfolio into a structured JSON briefing detailing rank order, rationale, cumulative risk, and projected ROI.

---

## 5. Mathematical Models & Formulations

### 5.1 Objective Function & Zero-Cost Handling (Efficiency Class)

To prevent division-by-zero instability, the heuristic defines an explicit `efficiency_class` and a finite `finite_efficiency` metric. For any candidate $i$:

- **IF** $C_i > 0$:
  - `efficiency_class` = $1$ (positive finite efficiency)
  - `finite_efficiency` = $\frac{EV_i}{C_i}$
- **IF** $C_i = 0$ AND $EV_i > 0$:
  - `efficiency_class` = $2$ (positive EV / zero cost)
  - `finite_efficiency` = $0.00$ (Explicitly ignored during sort class 2)
- **IF** $C_i = 0$ AND $EV_i = 0$:
  - `efficiency_class` = $0$ (zero EV)
  - `finite_efficiency` = $0.00$
- **IF** $C_i < 0$:
  - `efficiency_class` = $-1$ (invalid cost)
  - Rejected immediately.

This numeric sentinel system cleanly isolates zero-cost opportunities, mathematically bounding them above any finite-cost opportunity, eliminating NaN, Infinity, or implicit float behaviors.

### 5.2 Deterministic Portfolio Penalty ($\text{OverlapPenalty}$)

The objective function considers diminishing returns when multiple actions target identical attributes in the selected portfolio $A$:
$$ \text{IncrementalEV}_i = EV_i \times (1 - \text{OverlapPenalty}(i, A)) $$

$\text{OverlapPenalty}(i, A) \in [0.00, 1.00]$ is explicitly defined as a weighted combination of attribute collisions between candidate $i$ and all previously selected items $j \in A$:
$$ \text{OverlapPenalty}(i, A) = \max_{j \in A} \left( 0.40 \times O_{\text{cat}}(i,j) + 0.40 \times O_{\text{geo}}(i,j) + 0.10 \times O_{\text{act}}(i,j) + 0.10 \times O_{\text{obj}}(i,j) \right) $$

Where boolean overlap functions evaluate to $1.00$ (match) or $0.00$ (no match):

- $O_{\text{cat}}$: Shared category.
- $O_{\text{geo}}$: Shared LGA/geography.
- $O_{\text{act}}$: Shared action category.
- $O_{\text{obj}}$: Shared strategic objective.

*Note: As items are sequentially added to portfolio $A$, the penalty for the next evaluated candidate $i$ increases if it heavily overlaps with any already-selected $j$.*

### 5.3 Constraints

$$ \sum_{i \in A} C_i \le C_{max} $$
$$ \frac{1}{|A|} \sum_{i \in A} R_i \le R_{max} $$

### 5.4 Deterministic Greedy Heuristic & Tie-Breaking

SOPAE utilizes a deterministic ratio sorting approach with an absolute tie-breaking hierarchy to guarantee implicit Postgres ordering is never relied upon:

1. **Sort Order**:
   1. `efficiency_class` DESC
   2. `finite_efficiency` DESC
   3. `expected_value` DESC
   4. `risk` ASC
   5. `forecast_confidence` DESC
   6. `scenario_id` ASC (Immutable Unique Identifier)

2. **Greedy Iteration**:
   - Iterate candidates strictly in the sorted order.
   - Calculate $\text{IncrementalEV}_i$.
   - Add $i$ to $A$ if constraints $C_{max}$ and $R_{max}$ are not violated.
   - Recompute dynamic overlap penalties for remaining candidates.

---

## 6. RPC Contracts & Model Governance (Architecture Only - Do Not Implement)

The optimizer uses **SOPAE-1.0.0** as the initial model identifier. No optimization result may be interpreted without its model version.

1. `rpc/generate_strategic_portfolio_allocation`
   - **Input**: `p_model_version TEXT`, `p_max_budget NUMERIC`, `p_max_risk NUMERIC`, `p_max_actions INT`
   - **Behavior**:
     - Enforces `SECURITY DEFINER` and `SET search_path = public, analytics, pg_temp;`. The `analytics` schema is proven trusted as it contains the read-only strategic tables.
     - Validates `p_model_version`. If unsupported, the RPC will **FAIL CLOSED**.
     - Calculates optimization deterministically.
   - **Output**: JSON payload with optimized portfolio. Retains `model_version`, `input_snapshot_hash`, `execution_timestamp`, `constraint_snapshot`, `objective_definition`, and `overlap_formula_version`.

---

## 7. Security, Privacy & Invariant Validation

### 7.1 Formal Determinism Proof

The optimizer ensures that an IDENTICAL INPUT SNAPSHOT + IDENTICAL MODEL VERSION + IDENTICAL CONSTRAINTS = IDENTICAL PORTFOLIO OUTPUT.

- No `random()` functions are used.
- No UUID generation acts as a ranking factor.
- Execution timestamps (`wall-clock`) are stored for provenance but do NOT affect selection math.
- The `scenario_id` ASC fallback ensures zero implicit row ordering.

### 7.2 Ranking Air-Gap & Business Truth Analysis

Zero touchpoints with `rpc/search_providers` or `public.providers`. SOPAE operates exclusively via `SELECT` on business data and `INSERT` on `analytics_*` logs.

### 7.3 Privacy Analysis

SOPAE consumes only aggregated $EV$ and $R$ scores where $N \ge 30, k \ge 5$. It never accesses raw user queries or provider PII.

---

## 8. Future Test Requirements

The following zero-cost and edge-case permutations must be validated during implementation:

1. zero cost + positive EV
2. zero cost + zero EV
3. negative cost
4. identical efficiency
5. identical EV
6. identical risk
7. identical confidence
8. identical scenario attributes
9. complete overlap
10. zero overlap
11. partial geographic overlap
12. partial category overlap

---

## 9. Final Verdict

PHASE_9_4_ARCHITECTURE:
GREEN

ARCHITECTURE:
PASS

INVARIANT_PRESERVATION:
PASS

SECURITY:
PASS

PRIVACY:
PASS

RESOURCE_SAFETY:
PASS

FAILURE_ISOLATION:
PASS

DETERMINISM:
PASS

MODEL_VERSIONING:
PASS

RANKING_AIR_GAP:
CONFIRMED

BUSINESS_TRUTH_MUTATION:
ZERO

AUTONOMOUS_EXECUTION:
ZERO

IMPLEMENTATION_AUTHORIZATION:
NOT AUTHORIZED

NEXT_STEP:
STOP AND AWAIT HUMAN OPERATOR AUTHORIZATION
