# Product Designer Workflow Trace

## Status
This is a subordinate docs-only trace plan. [VISION.md](../VISION.md#product-designer-workflow) is canonical for the product designer workflow and prioritization lens.

This file does not create proof authority, a command, schema, fixture, diagnostic registry, artifact, evidence file, CI gate, product behavior, live review workflow, production adapter, API, SDK, runtime, A2UI claim, SurfaceOps persistence, or JudgmentKit invocation. It defines the planning shape for a future consolidated trace report that would make the designer workflow easier to inspect.

Current governed generated UI claims remain proof-only and non-production. Passing phase evidence, not this trace plan, proves implemented behavior.

## Purpose
The designer workflow now has a canonical loop:

```text
declare design authority
  -> compile governed Surfaces Catalog
  -> generate inside catalog boundary
  -> validate and inspect evidence
  -> decide or revise at the authority layer
  -> hand off hash-bound target output
  -> regenerate evidence when authority changes
```

Today, that loop can be inspected by walking multiple evidence files, reports, queues, demos, and generated artifacts. A future designer workflow trace report should consolidate those refs into one deterministic index so a designer, reviewer, facilitator, or CI reader can see how one declared target moves through the loop.

The trace report would be an index over accepted evidence. It must not become catalog authority, proof authority, review authority, demo authority, customer validation, or production readiness.

## Current Inputs
The current proof-only repo already has inputs that could feed a future trace:

- Workflow framing: `VISION.md`, `plans/product-designer-workflow.md`, and `plans/usability-value-evidence.md`.
- Source authority and catalog: `artifacts/p2/evidence.json`, `artifacts/p2/source-inventory.json`, `artifacts/p2/source-mapping.json`, `artifacts/p2/ingestion-report.json`, and `artifacts/p2/governed-catalog.json`.
- Declared-source conformance: `artifacts/source-conformance/evidence.json`, `artifacts/source-conformance/source-authority-map.json`, `artifacts/source-conformance/source-conformance-report.json`, and `artifacts/source-conformance/source-review-queue.json`.
- Inert agent workflow evidence: `artifacts/p3/evidence.json`, `artifacts/p3/agent-capability-registry.json`, `artifacts/p3/orchestration-plan.json`, `artifacts/p3/review-queue.json`, `artifacts/p3/agent-orchestration-report.json`, and the generated non-executable work orders under `artifacts/p3/`.
- Review and evaluation: `artifacts/p4/evidence.json`, `artifacts/p4/surfaceops-decision-ledger.json`, `artifacts/p4/review-judgment-report.json`, and `artifacts/p4/judgmentkit-evaluation-report.json`.
- Target handoff: `artifacts/p5/protocol/evidence.json`, `artifacts/p5/protocol/adapter-target-selection.json`, `artifacts/p5/protocol/protocol-projection.json`, `artifacts/p5/protocol/protocol-adapter-report.json`, `artifacts/p5/native/evidence.json`, `artifacts/p5/native/adapter-target-selection.json`, `artifacts/p5/native/surfaces-native-projection.json`, and `artifacts/p5/native/surfaces-native-report.json`.
- Presentation aids: `demo/p2`, `demo/p3`, `demo/p4`, `demo/p5/protocol`, and `demo/p5/native`, only when backed by passing evidence.

P1 runtime artifacts are useful context for runtime projection mechanics, but they are P0 synthetic-derived. They should not be the primary real-source designer workflow trace unless a later target ties them to accepted P2 authority.

## Minimum Trace Report Shape
A future trace report should be deterministic and scenario-oriented. A minimum useful report should include:

1. Trace metadata: schema id, command, generated time, scenario id, target ids, status, promotion status, and current proof-only scope.
2. Authority declaration: source manifests, source files, component scope, mapping refs, policy refs, and source-conformance authority refs.
3. Catalog boundary: governed components, props, variants, tokens, states, slots, accessibility refs, and review-required mappings.
4. Validation results: valid, review-required, invalid, and mutation examples with diagnostic codes, stages, artifact paths, and source refs.
5. Review path: source review queue refs, P3 review queue refs, deterministic SurfaceOps decision ledger refs, review/judgment report refs, and JudgmentKit-shaped evaluation report refs.
6. Target handoff: protocol and native target selections, projections, emitted envelopes or packets, and review-required rows that intentionally emit no target artifact.
7. Presentation links: demo paths labeled as non-authoritative presentation output.
8. Boundary claims: explicit non-goals and excluded claims for live behavior, production behavior, and future targets.
9. Evidence refs: every consumed and generated artifact path with schema id, hash, status, promotion status, and source evidence hash where present.

P4 requires explicit handling: current tracked P4 evidence has `status: "pass"` and `promotionStatus: "blocked"` intentionally. A trace must explain that the proof passed while unsafe or invalid review outcomes remain blocked.

## Future Proof Shape
If this trace becomes executable, it should be treated as a non-numbered, cross-cutting target like source conformance, not as P6 and not as part of P4 or P5.

Candidate command shape:

```bash
interfacectl surfaces designer-workflow-trace proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --source-conformance-evidence artifacts/source-conformance/evidence.json \
  --source-authority-map artifacts/source-conformance/source-authority-map.json \
  --source-conformance-report artifacts/source-conformance/source-conformance-report.json \
  --review-queue artifacts/p3/review-queue.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --protocol-evidence artifacts/p5/protocol/evidence.json \
  --native-evidence artifacts/p5/native/evidence.json \
  --fixture fixtures/designer-workflow-trace \
  --out artifacts/designer-workflow-trace
```

Candidate generated paths:

- `artifacts/designer-workflow-trace/trace-selection.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/evidence.json`

Candidate schema names:

- `designer-workflow-trace-selection.v0.schema.json`
- `designer-workflow-trace-report.v0.schema.json`
- `designer-workflow-trace-evidence.v0.schema.json`
- `designer-workflow-trace-expectations.v0.schema.json`
- `designer-workflow-trace-diagnostics.v0.schema.json`
- `designer-workflow-trace-fixture.v0.schema.json`
- `designer-workflow-trace-preflight-mutation.v0.schema.json`

Candidate package scripts:

- `materialize:designer-workflow-trace`
- `proof:designer-workflow-trace`
- `check:designer-workflow-trace`
- `check:designer-workflow-trace:ci`

These names are planning candidates only until implementation adds the complete proof shape and passing evidence.

## Missing Pieces
The repo does not yet have:

- a `designer-workflow-trace` schema suite;
- fixture roots and expectation manifests;
- diagnostic registry rows;
- an `interfacectl` command contract;
- generated trace artifacts or evidence;
- a CI gate;
- a shared scenario id tying source authority, catalog rows, diagnostics, review queues, decisions, target handoff rows, and evidence together.

Those pieces must exist before the trace can be described as implemented.

## Non-Goals
The trace plan does not implement or claim:

- live ingestion, crawlers, source APIs, or source sync;
- live agents, tools, network calls, callbacks, secrets, action execution, or work-order execution;
- live SurfaceOps persistence or operational review workflow;
- live JudgmentKit invocation or MCP execution;
- production adapters, APIs, SDKs, native SDKs, live runtimes, native bridges, or A2UI;
- customer validation, pilot readiness, production adoption, self-serve product use, partner-data storage, or qualitative-feedback authority;
- demo authority, future P5 target support, or catalog-authority override.

## Prioritization
Use this trace plan to decide the next build slice. The highest-value implementation would make the designer workflow inspectable in one report before adding production-facing consumers. That report should expose gaps in source coverage, accessibility policy, brand and terminology policy, exception ownership, review-required routing, and target handoff clarity.

Do not prioritize a live review product, production adapter, public API, SDK, live runtime, A2UI target, or live evaluator ahead of the trace unless that target has its own complete proof shape and evidence.
