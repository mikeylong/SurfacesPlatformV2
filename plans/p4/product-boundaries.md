# Product Boundaries

## Decision
P4 is subordinate to [VISION.md](../../VISION.md#canonical-authority-model)'s canonical authority model. It consumes P3 evidence and review queue artifacts, then defines the planned proof for review and judgment behavior as derived consumers. SurfaceOps may inspect review queue items and record approve, reject, request-changes, or defer decisions within the SurfaceOps decision ledger. JudgmentKit may inspect evidence and emit evaluation-only findings for activity fit, contract quality, evidence quality, and handoff quality. Neither may create catalog, runtime, source, adapter, execution, or override authority.

## Goal
Make human review and evidence judgment accountable. P4 should prove that review-required work can be inspected and decided with explicit evidence refs, reviewer provenance, deterministic decision state, and evaluator findings without creating hidden authority or executing work.

## Inputs
- Root plan working thesis and P0/P1/P2/P3 decisions.
- P3 orchestration evidence.
- P3 review queue.
- P3 agent orchestration report and work-order refs.
- P4 review and judgment fixtures.

## Outputs
- Boundary rules for P4 review and judgment artifacts.
- Responsibility matrix for catalog, compiler, review, evaluation, instruction, and product surfaces.
- Must-not-cross rules for SurfaceOps and JudgmentKit consumers.

## Phase-Local Responsibility Matrix
This matrix is a P4 phase-local delta over [VISION.md Surface Roles](../../VISION.md#surface-roles), not a complete surface list.

| Surface | P4 role | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- |
| Surfaces Catalog | Governed UI contract referenced by review | P2/P3 catalog refs through evidence | No new catalog artifacts | Accept review decisions as catalog policy |
| `interfacectl` | Compiler and proof command surface | P3 evidence, P3 review queue, P4 fixtures, P4 schemas | Decision ledger, evaluation report, review report, evidence | Persist live decisions, invoke live JudgmentKit, or execute work orders |
| P3 review queue | Upstream review input | P3 proof artifacts | Queue refs consumed by P4 | Become a live queue or mutable review store |
| SurfaceOps decision ledger | Deterministic review artifact | P3 queue items and P4 fixtures | Evidence-backed decision rows | Rewrite upstream evidence, mutate P3 artifacts, or execute work |
| JudgmentKit evaluation report | Deterministic evaluation artifact | P3/P4 evidence refs and P4 fixtures | Evidence-backed findings | Approve, reject, request changes, defer, route, promote, mutate, render, execute, or override catalog policy or SurfaceOps decision authority |
| Review/judgment report | Summary proof artifact | Ledger, evaluation report, diagnostics | Expected vs actual review results | Hide unsupported findings or decisions |
| Surfaces.dev | Agent-ready instruction surface | P4 evidence and docs | Human-readable instructions after implementation | Replace schemas, manifests, proof, or evidence |
| SurfaceOps | Future operational review product | P4 ledger and evidence | Later persistent decisions | Own catalog policy or execute work in P4 |
| JudgmentKit | Future evaluator | P4 evidence | Later evaluation findings | Approve, reject, request changes, defer, route, promote, mutate, render, execute, or override catalog policy or SurfaceOps decision authority |

## Boundary Rules
- P4 starts only from clean post-merge `main` after P0/P1/P2/P3 proof gates pass.
- P4 review and judgment artifacts are derived from P3 evidence, P3 review queue, P4 fixtures, and P4 schemas.
- SurfaceOps decisions must cite queue item refs, upstream evidence refs, reviewer provenance, rationale, and decision status.
- SurfaceOps decisions may approve, reject, request changes, or defer a queue item only inside the P4 decision ledger.
- An approval means "eligible for a later authorized consumer"; it does not execute a work order or mutate upstream artifacts.
- Rejection and request-changes decisions block unattended promotion in P4 evidence, but they do not rewrite the upstream queue item.
- JudgmentKit-shaped findings must cite evidence refs and dimensions; they cannot approve, reject, request changes, defer, route, promote, mutate, render, execute, or override catalog policy or SurfaceOps decision authority.
- Review-required second-review cases stay non-executable and aggregate as `review_required`.
- Product demos must be generated from proof artifacts.
- P4 may prepare records that a future SurfaceOps product or JudgmentKit integration can consume, but neither live product executes in P4.

## P4 Proof
The planned P4 proof can be completed with P3 artifacts, P4 fixtures, P4 schemas, a SurfaceOps decision ledger, JudgmentKit-shaped evaluation report, review/judgment report, final evidence, and generated demo. No live operations console, live evaluator call, or work-order runtime is needed.

## Non-Goals
- No live SurfaceOps application.
- No live JudgmentKit MCP or connector invocation in this planning slice.
- No execution of P3 work orders.
- No persistent review decision store.
- No catalog, runtime, adapter, protocol, or A2UI expansion.

## Closed P4 Decisions
- P4 review and judgment artifacts are derived consumers.
- SurfaceOps decisions live in a deterministic ledger, not a mutable product store.
- JudgmentKit findings are evidence-backed evaluations, not enforcement authority.
- SurfaceOps approval decisions recorded in the P4 decision ledger are evidence eligibility records only; they do not execute P3 work orders or mutate upstream artifacts.
