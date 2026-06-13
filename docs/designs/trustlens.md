# CEO Plan: TrustLens — Brand Trust Engine
Date: 2026-06-13
Status: PROMOTED
Mode: SELECTIVE EXPANSION
Original: ~/.gstack/projects/nityadatla/ceo-plans/20260613-trustlens.md

---

## Vision

**CURRENT STATE**: amazon-lens performs per-product review authenticity analysis. A brand trust layer, warranty signal, and return signal don't exist yet.

**48-HOUR DEMO TARGET**: TrustLens dashboard shows brand-level trust scores across three signals (reviews, warranty, returns). A judge can flip between three pre-loaded brand scenarios and watch all three signal bars move in real time. A live Amazon URL can also be pasted to trigger real analysis. An embedded architecture diagram shows the technical stack without leaving the app. A Phase 2 checkout teaser at the end reveals the future.

**12-MONTH DREAM STATE**: Chrome extension with 1M+ users. Trust score visible on every Amazon product page. Brands tracked over time. Honest sellers rewarded, sketchy brands flagged before purchase. Amazon-partnership path via seller transparency program.

---

## Scope Decisions

| # | Proposal | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Full brand scorecard (3 signals) | **CORE** | The original spec — reviews + warranty + returns |
| 2 | Live Amazon URL input | **ACCEPTED** (D3.1) | Directly serves Implementation Quality judging criterion |
| 3 | Embedded architecture diagram | **ACCEPTED** (D3.2) | Directly serves Technical Architecture judging criterion |
| 4 | Phase 2 checkout teaser reveal | **ACCEPTED** (D3.3) | Directly serves Futuristic Vision judging criterion |
| 5 | Price analysis | **DEFERRED** | Amazon wouldn't benefit — user removed this consciously |
| 6 | Browser extension | **DEFERRED** | Post-hackathon only; web-first for demo |
| 7 | Real-time scraping (demo time) | **DEFERRED** | Mock data mitigates demo failure risk |
| 8 | B2B certification flow (Approach C) | **CUT** | Different product entirely, abandoned for hackathon |

---

## Accepted Scope (What Gets Built)

### Core (from design doc)
- Brand aggregation layer on top of amazon-lens
- Three-signal trust score (reviews 50%, warranty 30%, returns 20%)
- Trust dashboard with flip mechanic (Brand A / B / C)
- All brand data in-memory at page load — no fetch on flip
- Mock data schema with category averages and 6-month timeline

### Cherry-picks (SELECTIVE EXPANSION additions)
- **E1 — Live URL input**: Paste an Amazon product URL → TrustLens pulls the brand, runs amazon-lens, shows live trust score. Fallback: "service unavailable" error state with URL visible (not a silent brand swap). Badge shows "LIVE" vs "DEMO" mode.
- **E2 — Embedded architecture diagram**: "How it works" toggle/tab in the dashboard showing amazon-lens → brand aggregator → trust engine pipeline. LLM embeddings + clustering + reviewer behavior graph made legible.
- **E3 — Phase 2 teaser**: Static wireframe mockup at end of demo showing TrustLens trust badge at checkout + score on product pages. Revealed as a 30-second "what comes next" panel.

---

## Trust Score Formula

```
trust_score = (authenticity/100 × 0.5) + ((1 - claim_rate/100) × 0.3) + ((1 - return_rate/100) × 0.2)
```
Result × 100 for display (0–100 scale). All inputs normalized to 0–1 before weights are applied.

**Formula-derived scores (verified):**
- Brand A (trustworthy): auth=91, warranty=2.1%, returns=4.0% → **94**
- Brand B (sketchy): auth=34, warranty=18.7%, returns=31.0% → **55**
- Brand C (ambiguous): auth=67, warranty=9.2%, returns=14.0% → **78**

---

## Build Order

1. **T0** — Verify amazon-lens output schema (authenticity_score: 0-1 or 0-100?) before writing adapter
2. **T1** — Write `normalizeAmazonLensOutput(raw)` adapter with JSONParseError catch + clamp
3. **T2** — Write `computeTrustScore(signals)` with Math.max/min clamp
4. **T3** — Write `brands.json` with formula-derived scores + 6-month timelines
5. **T4** — Build dashboard UI (shadcn/ui): signal bars + trust score + timeline chart
6. **T5** — Add count-up/count-down animation on brand flip (0.4s)
7. **T6** — Add TRUSTED/CAUTION/RISK text labels alongside color indicator
8. **T7** — Build E1: live URL input + spinner + 8s timeout + "service unavailable" error state
9. **T8** — Build E2: architecture diagram tab (static)
10. **T9** — Build E3: Phase 2 teaser panel (static wireframe)
11. **T10** — Add tooltip copy with category averages to signal bars

---

## Deferred Items (TODOS)

- Document amazon-lens output schema contract after verifying in T0 (P2)
- URL allowlist for E1 live input — deferred from security review S3-1 (P2, post-hackathon)
- Real-time brand data ingestion (Amazon API integration)
- Chrome/Firefox browser extension
- Seller-facing dashboard (brand self-monitoring)
- Automated warranty claim data pipeline
- Time-series anomaly detection on trust score drops

---

## Dream State Delta

After the 48-hour hackathon demo, the gap to the 12-month dream state is:
1. Real data — warranty and return signals are mocked; production needs Amazon internal data access
2. Distribution — web app needs to become a Chrome extension to reach 1M users
3. Scale — brand aggregation needs to handle all Amazon sellers, not 3 pre-loaded scenarios
4. Monetization — seller transparency program or subscription model undefined

The demo closes the "does this resonate" gap. The rest is execution.

---

## Four Judging Criteria — Coverage Map

| Criterion | Coverage | How |
|-----------|----------|-----|
| Quality of Presentation | ✅ | "1 in 3 reviews is fake" hook + Brand B flip from 78% → 55% declining arc |
| Quality of Implementation | ✅ | Working demo: paste URL → analyze → trust dashboard (E1) |
| Technical Architecture | ✅ | Embedded 3-layer architecture diagram (E2) + formula transparency |
| Futuristic Vision | ✅ | Phase 2 checkout teaser (E3) + Phase 3 seller penalty scoring narrative |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | 3 proposals, 3 accepted, 1 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 5 findings, 2 tensions resolved |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** CEO REVIEW COMPLETE — eng review required before implementation.

NO UNRESOLVED DECISIONS
