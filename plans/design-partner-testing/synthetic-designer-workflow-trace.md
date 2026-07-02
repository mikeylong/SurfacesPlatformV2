# Synthetic Designer Workflow Trace Readout

## Status
This is a synthetic, non-proof research summary for the curated
design-partner testing program. It records a dry run with synthetic partner
agents against the merged designer-workflow trace, not real partners, partner
data, customer validation, production evidence, proof authority, SurfaceOps
decisions, JudgmentKit findings, or implementation claims.

The synthetic agents used the organization-level archetypes already recorded in
[Synthetic Wave 1 Readout](synthetic-wave-1.md) and
[Synthetic Wave 2 Plan](synthetic-wave-2-plan.md). These are partner
archetypes, not individual persona cards.

## Dry-Run Method
The dry run used four synthetic partner archetypes:

- Northstar Group: a merger-integration enterprise with three acquired product
  systems, conflicting source authority, terminology drift, and accessibility
  behavior differences.
- AtlasWorks: a large enterprise suite with more than 25 tools, partial
  design-system adoption, forked UI variants, and engineering pressure for CI
  gates that support governed exceptions.
- LumenHouse: a seven-brand platform company that needs shared interaction
  governance without flattening brand expression.
- Regulated-services partner: a regulated product organization that needs
  auditability, approval evidence, evidence retention, accessibility compliance,
  and clear release controls.

Each synthetic partner received the same current-scope stimulus:

- Surfaces is proof infrastructure for governed generated UI.
- The design-system source is product authority.
- The Surfaces Catalog is governed contract authority.
- Passing evidence is proof authority.
- Demos are presentation only, not proof.
- The merged designer-workflow trace indexes one Button scenario over accepted
  P2, source-conformance, P3, P4, P5 protocol, and P5 native evidence.
- Current scope does not include live source ingestion, production adapters,
  APIs, SDKs, A2UI, live SurfaceOps, live JudgmentKit, live runtimes, action
  execution, or customer validation.

Each synthetic partner reacted to the seven product designer workflow steps from
[VISION.md](../../VISION.md#product-designer-workflow):

1. Declare design authority.
2. Compile governed contracts.
3. Generate inside the catalog boundary.
4. Inspect evidence, not only pixels.
5. Decide or revise at the authority layer.
6. Hand off only proven target output.
7. Govern changes over time.

## Current Trace Snapshot
The dry run used the current merged trace as a read-only stimulus:

- `artifacts/designer-workflow-trace/evidence.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/trace-selection.json`

The trace report records seven workflow steps with `status: "pass"`. The final
trace evidence records `status: "pass"` and `promotionStatus: "blocked"`. The
blocked promotion status is a governed outcome carried from accepted upstream P4
review/judgment evidence, not a failed proof command.

## Executive Summary
The synthetic pass produced a consistent signal: the merged designer-workflow
trace is strong enough to explain the evidence loop, but not broad enough to
support adoption-shaped confidence.

All four synthetic partners reported `High` comprehension and `Medium`
confidence. All four understood the proof-only boundary after it was stated.
All four recommended continuing, but revising and retesting with a harder
scenario before using the walkthrough as evidence for implementation-oriented
pilot readiness.

The recurring positive signal was that the Button trace now makes the product
designer workflow concrete. The recurring blocker was that one accepted Button
path does not test the work that would matter most in real partner contexts:
source conflicts, forked variants, brand drift, approval evidence, accessibility
policy, ownership routing, exception expiry, and deterministic review outcomes.

## Partner Readouts
| Synthetic partner | Comprehension | Confidence | Decision | Strongest acceptance signal | Highest blocker | Future proof candidate |
| --- | --- | --- | --- | --- | --- | --- |
| Northstar Group | `High` | `Medium` | Revise, then retest | The proof-authority hierarchy can expose acquired-system conflicts instead of hiding them. | Need a three-source conflict scenario with accessibility and terminology drift. | Multi-source Button authority reconciliation with deterministic diagnostics and review-required outcomes. |
| AtlasWorks | `High` | `Medium` | Revise, then retest | Catalog-bound generation maps directly to CI gates and exception control. | Need a governed exception path for forked UI variants. | Forked Button variant proof with owner, reason, expiry, allowed exception, rejected drift, and CI-usable evidence. |
| LumenHouse | `High` | `Medium` | Continue, revise, then retest | Authority separation fits multi-brand governance without making demos authoritative. | Need multi-brand proof that shared interaction policy does not flatten brand expression. | Multi-brand Button governance drift scenario with brand tokens, shared interaction policy, source violation, and accessibility diagnostics. |
| Regulated-services partner | `High` | `Medium` | Revise, then retest | Evidence-first inspection fits auditability and fail-closed generated UI. | Need approval chain, retention, release-gate, and accessibility evidence. | Regulated release-control proof for an accessibility-sensitive Button change with approval and retention metadata. |

## Workflow Readout
| VISION workflow step | What worked synthetically | What needs revision before stronger testing |
| --- | --- | --- |
| Declare design authority | All partners understood source authority, catalog authority, evidence authority, and demos as presentation. | Future scenarios need multiple source authorities, brand/system variants, approval refs, or explicit source conflicts. |
| Compile governed contracts | The deterministic proof-contract model was credible across all four archetypes. | Partners need to see richer source policy, accessibility, terminology, brand, exception, and review metadata compile into governed outputs. |
| Generate inside the catalog boundary | Catalog-bound generation was one of the strongest acceptance signals. | Retest with one allowed case, one review-required case, and one blocked drift case inside the same scenario family. |
| Inspect evidence, not only pixels | The merged trace report made the workflow easier to inspect before demos. | Keep demos after evidence in the session flow; polished demos can still imply more maturity than current proof scope. |
| Decide or revise at the authority layer | Partners accepted that unsupported output should be fixed in source, mapping, policy, ownership, or future proof scope. | Add a clearer decision tree for source correction, catalog correction, exception approval, and future proof candidate routing. |
| Hand off only proven target output | Protocol/native static outputs were understandable when backed by P5 evidence. | The phrases `protocol evidence`, `native evidence`, and `hand off proven target output` need repeated proof-only labeling to avoid production API, SDK, runtime, or adapter confusion. |
| Govern changes over time | All partners saw high value in regeneration and evidence refresh over time. | Future proof candidates should show deterministic deltas for source changes, accessibility changes, approval expiry, brand drift, or forked-variant changes. |

## Recurring Acceptance Signals
- `High`: The authority model is understandable when stated explicitly.
- `High`: Passing evidence, not demo output, is a credible proof boundary.
- `High`: Catalog-bound generation reads as safer than prompt-first UI
  generation.
- `High`: Review-required and blocked outcomes can read as governance strength,
  not product failure.
- `Medium`: P5 protocol and native static outputs are useful as handoff
  examples only when repeatedly framed as proof-only and non-production.

## Recurring Blockers
| Severity | Blocker | Pattern |
| --- | --- | --- |
| High | Single-scenario breadth | All four partners said one Button trace is enough for comprehension, not adoption-shaped confidence. |
| High | Richer source and policy coverage | Partners asked for source conflicts, accessibility behavior, terminology, brand expression, approval records, or exception policy. |
| High | Ownership and exception routing | Northstar, AtlasWorks, and LumenHouse need clearer routing for source correction, catalog correction, review ownership, and exception decisions. |
| Medium | P5 wording risk | All four partners flagged protocol/native wording as close to production readiness unless qualified as proof-only static output. |
| Medium | Evidence-over-demo discipline | Demos are understandable as presentation aids, but should remain after evidence in the walkthrough. |

## Recommended Synthetic Decision
Revise and retest before treating the walkthrough as implementation-oriented
pilot material.

The merged trace is ready for proof-oriented discovery because it gives a
coherent Button evidence index across the seven product designer workflow steps.
It is not ready to support an adoption or implementation-pilot claim because the
scenario is intentionally narrow and does not yet cover partner-shaped
governance pressure.

## Recommended Next Proof-Candidate Direction
Do not split the four partner requests into unrelated roadmap branches yet.
Treat them as variants under the existing planning theme in
[Declared-Source Conformance And Review Proof Candidate](declared-source-conformance-review-proof.md):

```text
A bounded declared-source conformance and review proof with richer source
authority, deterministic diagnostics, review-required ownership, exception or
approval metadata, evidence-bound reports, and CI-discussable output, without
claiming live ingestion, production adapters, APIs, SDKs, A2UI, live SurfaceOps,
live JudgmentKit, live runtimes, or action execution.
```

The first retest scenario should include:

- one accepted Button path;
- one review-required exception with owner, rationale, and expiry;
- one blocked drift or authority-conflict case;
- at least one accessibility or behavior policy diagnostic;
- source refs for every emitted row;
- a plain-language decision tree for source correction, catalog correction,
  exception approval, and future proof scope;
- explicit proof-only labels for protocol/native static outputs.

The retest shape is expanded in
[Richer Source Conformance Scenario Pack](richer-source-conformance-scenario-pack.md).
That scenario pack is planning-only. It must not be treated as implemented
source coverage, fixture coverage, diagnostic coverage, command behavior,
artifact output, evidence, CI behavior, or customer validation.

The governed-exception implementation retest is captured in
[Synthetic Governed Exception Retest](synthetic-governed-exception-retest.md).
It records the synthetic archetype check that moved the expired exception path
from mechanically indexed to lifecycle-visible for proof-only walkthroughs.

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | Planning only until a later target adds schema, fixture, diagnostics, command, artifact or report path, evidence path, and passing evidence. |
