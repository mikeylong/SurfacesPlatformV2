# Product Designer Workflow Trace

## Status
This is a subordinate trace plan and the mechanical reference for the first implemented designer-workflow-trace target. [VISION.md](../VISION.md#product-designer-workflow) is canonical for the product designer workflow and prioritization lens.

The implemented target creates a proof command, schema suite, fixture root, diagnostic registry, report artifacts, evidence file, and CI gate for one Button trace scenario. The trace report is an index over accepted evidence. It does not create catalog authority, upstream proof authority, product behavior, live review workflow, live agent execution, work-order execution, production adapter, API, SDK, runtime, A2UI claim, SurfaceOps persistence, or JudgmentKit invocation.

Current governed generated UI claims remain proof-only and non-production. Passing phase and target evidence proves implemented behavior. Passing trace evidence proves only that the trace index was generated under this target contract.

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

Today, that loop can be inspected by walking multiple evidence files, reports, queues, demos, and generated artifacts. The first implemented designer workflow trace report consolidates those refs into one deterministic index so a designer, reviewer, facilitator, or CI reader can see how one Button scenario moves through the loop.

The trace report is an index over accepted evidence. It must not become catalog authority, upstream proof authority, review authority, demo authority, customer validation, production adoption, or production readiness.

## Current Inputs
The current proof-only repo has inputs that feed the implemented first trace:

- Workflow framing: `VISION.md`, `plans/product-designer-workflow.md`, and `plans/usability-value-evidence.md`.
- Source authority and catalog: `artifacts/p2/evidence.json`, `artifacts/p2/source-inventory.json`, `artifacts/p2/source-mapping.json`, `artifacts/p2/ingestion-report.json`, and `artifacts/p2/governed-catalog.json`.
- Declared-source conformance: `artifacts/source-conformance/evidence.json`, `artifacts/source-conformance/source-authority-map.json`, `artifacts/source-conformance/source-conformance-report.json`, and `artifacts/source-conformance/source-review-queue.json`.
- Inert agent workflow evidence: `artifacts/p3/evidence.json`, `artifacts/p3/agent-capability-registry.json`, `artifacts/p3/orchestration-plan.json`, `artifacts/p3/review-queue.json`, `artifacts/p3/agent-orchestration-report.json`, and the generated non-executable work orders under `artifacts/p3/`.
- Review and evaluation: `artifacts/p4/evidence.json`, `artifacts/p4/surfaceops-decision-ledger.json`, `artifacts/p4/review-judgment-report.json`, and `artifacts/p4/judgmentkit-evaluation-report.json`.
- Target handoff: `artifacts/p5/protocol/evidence.json`, `artifacts/p5/protocol/adapter-target-selection.json`, `artifacts/p5/protocol/protocol-projection.json`, `artifacts/p5/protocol/protocol-envelope.button.json`, `artifacts/p5/protocol/protocol-adapter-report.json`, `artifacts/p5/native/evidence.json`, `artifacts/p5/native/adapter-target-selection.json`, `artifacts/p5/native/surfaces-native-projection.json`, `artifacts/p5/native/surfaces-native-packet.button.json`, and `artifacts/p5/native/surfaces-native-report.json`.
- Presentation aids: `demo/p2`, `demo/p3`, `demo/p4`, `demo/p5/protocol`, and `demo/p5/native`, only when backed by passing evidence.

P1 runtime artifacts are useful context for runtime projection mechanics, but they are P0 synthetic-derived. They should not be the primary real-source designer workflow trace unless a later target ties them to accepted P2 authority.

## Minimum Trace Report Shape
The implemented first trace report is deterministic and scenario-oriented. A minimum useful report includes:

1. Trace scope: schema id, scenario id, target ids, status, promotion status, and current proof-only scope.
2. Designer workflow steps: a required `designerWorkflowSteps` array that maps
   the seven [VISION.md](../VISION.md#product-designer-workflow) workflow steps
   to accepted trace refs without turning the report into authority.
3. Target handoff: protocol and native target selections, projections, emitted
   envelopes or packets, and review-required rows that intentionally emit no
   target artifact. Target artifacts may be indexed as accepted upstream proof
   refs while a governed exception remains blocked from handoff.
4. Source-conformance governance: an index-only path for blocked governed
   exceptions, including expired review metadata, the source-conformance
   diagnostic code, upstream evidence refs, and an explicit
   `targetHandoffAllowed: false` outcome.
5. Presentation links: demo paths labeled as non-authoritative presentation output.
6. Boundary claims: explicit non-goals and excluded claims for live behavior, live agent or work-order execution, production behavior, and future targets.
7. Evidence refs: every consumed and generated artifact path with schema id, hash, status, promotion status, and source evidence hash where present.
8. Evidence metadata: command, arguments, generated-at metadata, fixture refs, schema closure, and generated artifact refs live in final trace evidence.

P4 requires explicit handling: current tracked P4 evidence has `status: "pass"` and `promotionStatus: "blocked"` intentionally. A trace must explain that the proof passed while unsafe or invalid review outcomes remain blocked.

## Implemented Proof Shape
The trace is executable as a non-numbered, cross-cutting target like source conformance. It is not P6 and not part of P4 or P5.

Implemented command:

```bash
interfacectl surfaces designer-workflow-trace proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --ingestion-report artifacts/p2/ingestion-report.json \
  --source-conformance-evidence artifacts/source-conformance/evidence.json \
  --source-authority-map artifacts/source-conformance/source-authority-map.json \
  --source-conformance-report artifacts/source-conformance/source-conformance-report.json \
  --source-review-queue artifacts/source-conformance/source-review-queue.json \
  --orchestration-evidence artifacts/p3/evidence.json \
  --review-queue artifacts/p3/review-queue.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json \
  --protocol-evidence artifacts/p5/protocol/evidence.json \
  --native-evidence artifacts/p5/native/evidence.json \
  --fixture fixtures/designer-workflow-trace \
  --out artifacts/designer-workflow-trace
```

Generated paths:

- `artifacts/designer-workflow-trace/trace-selection.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/evidence.json`

Schema names:

- `designer-workflow-trace-selection.v0.schema.json`
- `designer-workflow-trace-report.v0.schema.json`
- `designer-workflow-trace-evidence.v0.schema.json`
- `designer-workflow-trace-expectations.v0.schema.json`
- `designer-workflow-trace-diagnostics.v0.schema.json`
- `designer-workflow-trace-fixture.v0.schema.json`
- `designer-workflow-trace-preflight-mutation.v0.schema.json`

Package scripts:

- `materialize:designer-workflow-trace`
- `proof:designer-workflow-trace`
- `check:designer-workflow-trace:ci`
- `check:designer-workflow-trace:ci:phase`

The CI gate is `npm run check:designer-workflow-trace:ci`. The generated report has no demo; it is report/evidence-only.

The proof command validates every declared boundary input by exact path and current hash. The indexed P2 ingestion report and source-conformance review queue are command inputs, not hidden ambient files.

The current trace also indexes the source-conformance governed-exception expiry
fixture:

- source-conformance fixture: `fixtures/source-conformance/invalid/review-expired.source-conformance.json`;
- source-conformance diagnostic: `SOURCE_REVIEW_EXPIRED`;
- trace fixture: `fixtures/designer-workflow-trace/invalid/source-conformance-review-expired.designer-workflow-trace.json`;
- trace diagnostic: `TRACE_SOURCE_CONFORMANCE_REVIEW_EXPIRED_INDEXED`;
- report field: `sourceConformanceGovernance`.

This path is intentionally blocked and index-only. It routes the stale
exception back to the authority layer and does not permit target handoff for
that governed exception, SurfaceOps persistence, JudgmentKit invocation,
production behavior, or action execution.

The trace report includes `sourceConformanceGovernance.exceptionLifecycle` so
the governed exception path is visible without treating the invalid expired row
as an executable queue item. That lifecycle records the review-required
exception fixture, review queue item id, owner, rationale, approved expiry,
expired fixture, expired expiry, governance policy source ref, renewal
requirement, and `expiredExceptionExecutable: false`.
The target-handoff artifact section is still an index over accepted upstream
P5 artifacts for the base Button path; it records
`handoffAllowedForGovernedException: false` so those refs are not mistaken for
permission to hand off the expired exception.

## Missing Pieces
The first slice now has the minimum proof shape for one Button scenario. Broader coverage still needs:

- additional scenario fixtures tying more components, source refs, diagnostics, review rows, decisions, target handoffs, and evidence together;
- additional diagnostics for any broadened trace requirement;
- target-specific refs for future P5 targets only after those targets have passing evidence;
- updated report/evidence paths and CI gates for any broadened trace scope.

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
Use this trace plan to decide the next build slice. The implemented first trace makes one Button evidence path inspectable in one report before adding production-facing consumers. Next trace slices should expose gaps in source coverage, accessibility policy, brand and terminology policy, exception ownership, review-required routing, and target handoff clarity through additional schemas, fixtures, diagnostics, reports, evidence, and CI gates.

Do not prioritize a live review product, production adapter, public API, SDK, live runtime, A2UI target, or live evaluator ahead of the trace unless that target has its own complete proof shape and evidence.
