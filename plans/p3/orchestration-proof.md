# Orchestration Proof

## Decision
P3 proof emits deterministic orchestration artifacts for agent recruitment and handoff. The proof validates registry materialization, recruitment selection, task DAG shape, work-order scope, review routing, report rows, diagnostics, and final evidence without executing any agent work, applying VISION.md's canonical no-live-execution boundary.

## Goal
Show that agents can be safely recruited and coordinated from governed contracts before any phase allows those agents to act. The output should be enough for a future runtime or SurfaceOps review surface to consume, but P3 itself remains proof-only.

## Inputs
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p3/agent-capability-registry.json`.
- P3 task fixtures and manifest.

## Outputs
- `schemas/agent-work-order.v0.schema.json`.
- `schemas/agent-orchestration-plan.v0.schema.json`.
- `schemas/agent-review-queue.v0.schema.json`.
- `schemas/agent-orchestration-report.v0.schema.json`.
- `artifacts/p3/orchestration-plan.json`.
- `artifacts/p3/work-order.contract-architect.json`.
- `artifacts/p3/work-order.fixture-author.json`.
- `artifacts/p3/work-order.evidence-reviewer.json`.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.

## Orchestration Plan Shape
`agent-orchestration-plan.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `agent-orchestration-plan.v0` |
| `version` | string | yes | Semver |
| `registryRef` | object | yes | Path, schema id, and hash for `artifacts/p3/agent-capability-registry.json` |
| `boundaryRefs` | array | yes | Accepted P2/P3 refs consumed by orchestration |
| `tasks` | array | yes | Deterministic task DAG nodes |
| `workOrders` | array | yes | Planned work-order refs for allowed tasks |
| `reviewQueueRef` | object | yes | Path and hash for `artifacts/p3/review-queue.json`, always emitted |
| `diagnostics` | array | yes | P3 diagnostics objects |
| `provenance` | object | yes | Source refs, generator metadata, deterministic environment |

## Work Order Shape
`agent-work-order.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `agent-work-order.v0` |
| `workOrderId` | string | yes | Stable id |
| `taskId` | string | yes | Source task id |
| `agentId` | string | yes | Registered agent id |
| `capabilityIds` | array | yes | Registered capability ids used for selection |
| `allowedInputs` | array | yes | Exact artifact paths/source refs the agent may consume |
| `allowedOutputs` | array | yes | Exact future artifact paths the agent may be authorized to emit in a later executor proof |
| `dependencies` | array | yes | Task and artifact dependencies |
| `deniedCapabilities` | array | yes | Explicit forbidden tools, side effects, secret access, and execution paths |
| `evidenceObligations` | array | yes | Required hashes, provenance, report rows, and diagnostics |
| `promotionStatus` | enum | yes | `allowed`, `review_required`, or `blocked` |
| `provenance` | object | yes | Source refs and deterministic environment |

## Determinism Rules
- Task ids, work-order ids, dependency ids, and artifact refs are sorted deterministically.
- DAG validation fails on cycles, duplicate ids, missing dependencies, or references to undeclared tasks.
- Work orders are emitted only for allowed tasks.
- Review-required tasks emit review queue rows and report rows, but no work-order artifact.
- Invalid tasks emit report diagnostics, but no work-order artifact.
- The command must reject stale unexpected output under `artifacts/p3` before writing.

## Scope Resolution Rules
- Task fixtures request exact inputs and outputs.
- The registry authorizes agent and capability scope.
- Recruitment computes the intersection of requested scope and registry-authorized scope.
- `interfacectl` is the sole author of orchestration plan, work-order, review-queue, report, and evidence artifacts.
- Work orders echo the resolved scope. They cannot widen inputs, widen outputs, reinterpret policy, or create product, UI, runtime, projection, review, or recruitment authority.

## Side-Effect Rules
- These rules apply VISION.md's canonical no-live-execution boundary to P3; they do not define separate product policy.
- Work orders must not contain executable commands, callbacks, URLs to fetch, connector ids to call, secrets, environment variables, or instructions to mutate files.
- Work orders must not grant access to paths outside `allowedInputs` and `allowedOutputs`.
- Work orders must not change P2 artifact paths, hashes, promotion statuses, or diagnostic meanings.
- Any later executor phase must treat P3 work orders as inputs that still require that phase's own proof or authorization.

## Review Queue Shape
`agent-review-queue.v0` must always be emitted at `artifacts/p3/review-queue.json`. Empty queues are represented with `items: []`.

The review queue must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `agent-review-queue.v0` |
| `version` | string | yes | Semver |
| `orchestrationPlanRef` | object | yes | Path, schema id, and hash for `artifacts/p3/orchestration-plan.json` |
| `items` | array | yes | Review records sorted by task id, source fixture ref, then diagnostic code |
| `diagnostics` | array | yes | P3 diagnostics objects |
| `provenance` | object | yes | Source refs, generator metadata, deterministic environment |

Each `items[]` row must include `reviewItemId`, `taskId`, `sourceFixtureRef`, `selectedAgentIds`, `requiredCapabilities`, `requiredReviewerRole`, `suggestedAction`, `diagnosticCode`, `promotionStatus: "review_required"`, `workOrderRef: null`, `nonExecutable: true`, `evidenceObligations`, and `provenance`.

## Report Behavior
`agent-orchestration-report.json` records:

- preflight results;
- registry materialization results;
- recruitment selections;
- orchestration DAG validation;
- work-order validation;
- review queue routing;
- invalid and mutation fixture outcomes;
- diagnostics with canonical messages;
- aggregate status and promotion status.

The report is produced before final evidence and is included in the P3 evidence artifact order.

## P3 Proof
The proof passes when the registry is hash-bound, all valid tasks produce expected work orders, all review-required tasks produce review rows without execution, all invalid and mutation fixtures fail with expected diagnostics, the report matches the manifest, and final evidence is reproducible.

## Non-Goals
- No actual agent process lifecycle or live execution under VISION.md's canonical boundary.
- No background queue.
- No human review mutation.
- No scheduler or retry semantics.
- No execution transcript.

## Closed P3 Decisions
- The orchestration plan is a deterministic DAG.
- Work orders are inert proof artifacts.
- Report precedes final evidence.
