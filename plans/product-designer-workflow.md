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
- Target handoff: `artifacts/p5/protocol/protocol-projection.json`, `artifacts/p5/protocol/protocol-adapter-report.json`, `artifacts/p5/native/surfaces-native-projection.json`, and `artifacts/p5/native/surfaces-native-report.json`.
- Proof authority: the relevant `artifacts/**/evidence.json` file for the phase or target.
- Presentation only: generated demos under `demo/**`, only when backed by passing evidence.

## Designer Workflow Trace
A designer workflow trace makes the evidence walkthrough easier to inspect by consolidating refs into one deterministic report. The current repo implements the first proof-only trace target for one Button scenario over accepted P2, source-conformance, P3, P4, protocol, and native evidence.

The proof shape is tracked in [Product Designer Workflow Trace](product-designer-workflow-trace.md). The generated trace artifacts are `artifacts/designer-workflow-trace/trace-selection.json`, `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`, and `artifacts/designer-workflow-trace/evidence.json`.

The trace report is an index over accepted evidence, not product workflow implementation, customer validation, production adoption, catalog authority, upstream proof authority, live SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, or P7.

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
- live ingestion, production adapters, APIs, SDKs, live runtimes, live SurfaceOps, live JudgmentKit, or A2UI claims without target-specific proof;
- generated UI that looks plausible but lacks source refs, diagnostics, promotion status, or evidence;
- review tools that promote, reject, or persist decisions without an explicit review contract.

## Current Scope
The repo currently demonstrates this workflow as proof infrastructure. It is suitable for evidence-backed walkthroughs and design-partner discovery, not production adoption or self-serve product use.

Implemented proof slices cover bounded source ingestion, governed catalog output, deterministic diagnostics, inert review and judgment artifacts, static protocol/native handoff targets, and the first report/evidence-only designer workflow trace index. Broader trace scenarios, source families, live SurfaceOps workflow, production adapters, APIs, SDKs, live runtimes, live JudgmentKit, A2UI, and production-facing designer experiences remain future target-specific work until they add their own proof shape and passing evidence.
