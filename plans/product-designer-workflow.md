# Product Designer Workflow

## Status
This is a subordinate product workflow plan. [VISION.md](../VISION.md) is canonical for the product designer workflow, authority model, roadmap sequence, surface roles, and prioritization lens.

This file does not create proof authority, commands, schemas, fixtures, artifacts, evidence, product behavior, live review workflow, production adapter, API, SDK, runtime, A2UI claim, SurfaceOps persistence, or JudgmentKit invocation. It explains how a product designer should employ Surfaces Platform when the relevant target has passing evidence.

## Workflow Contract
The designer workflow is evidence-first:

```text
declare design authority
  -> compile governed Surfaces Catalog
  -> generate inside catalog boundary
  -> validate and inspect evidence
  -> decide or revise at the authority layer
  -> hand off hash-bound target output
  -> regenerate evidence when authority changes
```

The workflow is not prompt-first. A designer should not ask an agent for arbitrary UI and then rely on visual inspection to decide whether the result is safe. The designer starts by making the design-system authority explicit, then lets Surfaces enforce what generated UI may emit, what must be blocked, and what must be routed to review.

## Designer Steps
1. Declare design authority: identify the source material that owns product truth, including components, variants, tokens, states, slots, accessibility expectations, examples, usage policy, brand rules, content or terminology rules, and review requirements.
2. Compile governed contracts: run or consume the relevant proof command so bounded source material becomes a governed Surfaces Catalog with source refs, provenance, diagnostics, promotion status, reports, and evidence.
3. Generate inside the catalog boundary: use an agent or generator only where catalog authority defines what may be emitted. Unsupported components, props, variants, tokens, actions, accessibility semantics, or policy claims become diagnostics or review-required records.
4. Inspect evidence, not only pixels: review source refs, diagnostics, promotion status, accessibility and policy triggers, generated reports, and any demo output. Demos are presentation aids only.
5. Decide or revise at the authority layer: accept, reject, request changes, or update source material, mappings, or policy. Unsupported UI should usually be fixed by strengthening authority or governance, not by patching a downstream rendering artifact.
6. Hand off only proven target output: downstream teams and runtimes may receive only accepted, hash-bound projections, render plans, protocol envelopes, native packets, or future target-specific adapter artifacts whose own proof authorizes that target.
7. Govern changes over time: when design-system source material, policy, or target behavior changes, regenerate proof artifacts and evidence so CI, review, and runtime consumers stay aligned.

## Evidence Walkthrough
A designer or facilitator can inspect the current proof-only workflow with the tracked evidence artifacts:

- Source authority: `sources/p2/design-system-source/manifest.json`, `artifacts/p2/source-inventory.json`, and `artifacts/p2/source-mapping.json`.
- Governed catalog: `artifacts/p2/governed-catalog.json`.
- Generation and validation boundary: valid, invalid, review, and mutation fixtures under `fixtures/p2`, plus `artifacts/p2/ingestion-report.json`.
- Review-required routing: `artifacts/p3/review-queue.json` and `artifacts/p4/surfaceops-decision-ledger.json`.
- Review and evaluation evidence: `artifacts/p4/review-judgment-report.json` and `artifacts/p4/evidence.json`.
- SurfaceOps kanban workflow substrate: `artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json`, `artifacts/surfaceops-kanban-live/surfaceops-kanban-live-handoff-record.json`, and `artifacts/surfaceops-kanban-live/evidence.json`.
- Target handoff: `artifacts/p5/protocol/protocol-projection.json`, `artifacts/p5/protocol/protocol-adapter-report.json`, `artifacts/p5/native/surfaces-native-projection.json`, and `artifacts/p5/native/surfaces-native-report.json`.
- Proof authority: the relevant `artifacts/**/evidence.json` file for the phase or target.
- Presentation only: generated demos under `demo/**`, only when backed by passing evidence.

## Button Workflow Walkthrough
The current repo-owned Button scenario can be used as the first moderated
walkthrough of the workflow. This walkthrough is still proof-only and
report/evidence-only; it is not a product workflow implementation or customer
validation.

| Designer step | What the walkthrough should show | Current repo refs |
| --- | --- | --- |
| Declare design authority | The Button scenario is governed by checked source facts, primary and supporting source bindings, policy, precedence, exception handling, and owner-routed review in the team-owned authority profile. | `sources/source-conformance/declared-source-bundle/governance/authority-profile.json`; `artifacts/source-conformance/source-fact-coverage.json`; `artifacts/source-conformance/source-authority-map.json` |
| Compile governed contracts | Bounded source material compiles into a governed catalog that preserves the accepted P2 capability ceiling, plus an actionable connection report with evidence, provenance, and promotion status. | `artifacts/p2/evidence.json`; `artifacts/p2/governed-catalog.json`; `artifacts/source-conformance/governed-catalog.json`; `artifacts/source-conformance/authority-connection-report.json` |
| Generate inside the catalog boundary | Allowed, invalid, and review-required cases are handled by fixtures, diagnostics, and review routing rather than inferred UI. | `fixtures/p2/valid`; `fixtures/p2/invalid`; `fixtures/p2/review`; `artifacts/p2/ingestion-report.json` |
| Inspect evidence, not only pixels | The consolidated trace indexes accepted evidence, governed-exception status, and presentation links; demos remain non-authoritative. | `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`; `artifacts/designer-workflow-trace/evidence.json`; `demo/p2`; `demo/p5/protocol`; `demo/p5/native` |
| Decide or revise at the authority layer | Unsupported, blocked, expired-exception, or review-required output should drive source, mapping, policy, review-owner, or future proof-shape decisions. A kanban card may carry collaboration signals, but it is not the decision. | `artifacts/source-conformance/source-review-queue.json`; `artifacts/p3/review-queue.json`; `artifacts/p4/surfaceops-decision-ledger.json`; `artifacts/p4/review-judgment-report.json`; `artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json` |
| Hand off only proven target output | Only hash-bound protocol, native static, or bounded target-specific adapter outputs backed by their own evidence are handoff candidates. | `artifacts/p5/protocol/evidence.json`; `artifacts/p5/protocol/protocol-envelope.button.json`; `artifacts/p5/native/evidence.json`; `artifacts/p5/native/surfaces-native-packet.button.json`; `artifacts/surfaceops-kanban-live/evidence.json` |
| Govern changes over time | Any source, policy, review, or target change requires regeneration and fresh evidence before downstream trust. | `npm run check:designer-workflow-trace:ci`; current `artifacts/**/evidence.json` paths |

## Checkbox Authority Walkthrough

The Checkbox target gives designers a second catalog-authority scenario without
claiming a second end-to-end trace. The source inventory shows the separately
locked real-source byte and reused P2 registry/token facts. The mapping artifact
shows the seven props, three state mappings, structured indeterminate
precedence, one desktop token, and two non-executable review rows. The expanded
catalog makes those facts available while preserving every accepted P2
component and token record. Designers can compare valid, blocked, and
`review_required` cases in `fixtures/spectrum-checkbox-catalog` and inspect the
result in `artifacts/spectrum-checkbox-catalog/spectrum-checkbox-catalog-report.json`.

The Checkbox evidence is adjacent authority evidence. The current Button trace,
protocol, native, and SurfaceOps targets do not consume the expanded Checkbox
catalog. A downstream Checkbox workflow remains unimplemented until a target
adds its own schemas, fixtures, diagnostics, report or artifacts, evidence, and
passing gate.

## Designer Workflow Trace
A designer workflow trace makes the evidence walkthrough easier to inspect by consolidating refs into one deterministic report. The current repo implements the first proof-only trace target for one Button scenario over accepted P2, source-conformance, P3, P4, protocol, and native evidence.

The proof shape is tracked in [Product Designer Workflow Trace](product-designer-workflow-trace.md). The generated trace artifacts are `artifacts/designer-workflow-trace/trace-selection.json`, `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`, and `artifacts/designer-workflow-trace/evidence.json`.

The reusable source-family package proof is adjacent to this walkthrough rather than a second trace scenario. `artifacts/source-family-packaging/evidence.json` records fresh passing executions for the canonical and second compatible team-owned Button and InLineAlert bundles, then separately records the failing authority-expansion probe. It does not expand P2. The current designer trace continues to index the canonical `artifacts/source-conformance/evidence.json` run.

The source-accessibility-policy proof is also adjacent evidence, not a new
designer-trace input. It shows whether five structured Button and InLineAlert
behavior declarations match existing catalog facts or remain non-executable
review work. It never derives behavior from policy prose and does not prove
runtime accessibility compliance.

For the governed Button exception path, the trace report indexes the
source-conformance review-required row and the expired blocked row together in
`sourceConformanceGovernance.exceptionLifecycle`. That lifecycle records the
owner, rationale, approved expiry, expired expiry, renewal requirement, and
non-executable expired state.

The trace report is an index over accepted evidence, not product workflow implementation, customer validation, production adoption, catalog authority, upstream proof authority, production SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, or P7.

## Prioritization Use
Use this workflow to rank platform work. Prefer work that improves a designer's ability to complete the evidence-backed loop without weakening authority:

- broader declared source coverage with preserved source refs and provenance;
- clearer diagnostics for unsupported, ambiguous, inaccessible, policy-incomplete, or review-bound output;
- first-class accessibility, brand, content, terminology, exception, approval, and ownership policy;
- review-owner routing and decision evidence that remains bounded by catalog authority;
- CI gates and reports that make proof status reproducible;
- target-specific handoff artifacts only after the target has schema, fixtures, diagnostics, command contract, reports or artifacts, evidence, and passing gates.

Deprioritize work that creates apparent designer value while bypassing the proof chain:

- demos that imply product support without passing evidence;
- live ingestion, production adapters, APIs, SDKs, live runtimes, production SurfaceOps, live JudgmentKit, or A2UI claims without target-specific proof;
- generated UI that looks plausible but lacks source refs, diagnostics, promotion status, or evidence;
- review tools that promote, reject, or persist decisions without an explicit review contract.

## Current Scope
The repo currently demonstrates this workflow as proof infrastructure. It is suitable for evidence-backed walkthroughs and design-partner discovery, not production adoption or self-serve product use.

Implemented proof slices cover bounded source ingestion, one separately locked Checkbox catalog expansion, reusable compilation across two compatible instances of one fixed source-family package, governed catalog output, deterministic diagnostics, inert review and judgment artifacts, static protocol/native handoff targets, the first report/evidence-only designer workflow trace index, and a bounded local-loopback SurfaceOps kanban live adapter proof. Broader trace scenarios, arbitrary source-family shapes, component coverage beyond Checkbox, production SurfaceOps workflow, production adapters, APIs, SDKs, live runtimes, live JudgmentKit, A2UI, and production-facing designer experiences remain future target-specific work until they add their own proof shape and passing evidence.
