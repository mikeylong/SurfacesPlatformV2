# Orchestration Fixture

## Decision
P3 uses a dedicated `fixtures/p3/` set to prove agent registry, recruitment, orchestration, review, invalid, mutation, report, and evidence behavior. P3 may reference P0/P1 fixture intent, but P3 expectations must be declared in its own manifest.

## Goal
Define exact fixture paths, expected stages, phases, promotion statuses, diagnostics, artifact paths, work-order paths, and review queue behavior for the first agent orchestration proof.

## Fixture Layout

```text
fixtures/p3/
  agent-capability-registry.fixture.json
  expectations.manifest.json
  valid/
    runtime-adapter-plan.agent-task.json
    fixture-authoring.agent-task.json
    evidence-review.agent-task.json
  review/
    review-required-work.agent-task.json
  invalid/
    unregistered-capability.agent-task.json
    denied-tool.agent-task.json
    scope-escalation.agent-task.json
    hidden-output.agent-task.json
    cycle-dependency.agent-task.json
    missing-dependency.agent-task.json
  mutations/
    missing-upstream-evidence.agent-preflight.json
    failing-upstream-evidence.agent-preflight.json
    upstream-evidence-hash-mismatch.agent-preflight.json
    stale-upstream-evidence.agent-preflight.json
    missing-registry-ref.agent-orchestration-plan.json
    registry-hash-mismatch.agent-orchestration-plan.json
    unregistered-agent.agent-orchestration-plan.json
    duplicate-task-id.agent-orchestration-plan.json
    duplicate-work-order-id.agent-orchestration-plan.json
    hidden-handoff.agent-orchestration-plan.json
    work-order-scope-escalation.agent-work-order.json
    report-plan-hash-mismatch.agent-orchestration-report.json
    hash-mismatch.agent-orchestration-evidence.json
```

## Fixture Categories

| Category | Purpose | Expected stage |
| --- | --- | --- |
| `agent-capability-registry.fixture.json` | Proves registered agents and capabilities can be materialized | `registry` |
| `valid/` | Proves allowed tasks recruit agents and emit scoped work orders | `recruitment` or `orchestration` |
| `review/` | Proves review-required work is structurally valid but not executable | `review` |
| `invalid/` | Proves invalid recruitment/orchestration fails closed | `recruitment`, `orchestration`, or `work-order` |
| `mutations/` | Proves command preflight, registry, plan, work-order, report, and evidence tampering is blocked | `preflight`, `orchestration`, `work-order`, `report`, or `evidence` |

## Expectations Manifest
`fixtures/p3/expectations.manifest.json` must include:

- `fixtureRoot`: `fixtures/p3`.
- `artifactRoot`: `artifacts/p3`.
- `schemaRoot`: `schemas`.
- `version`: P3 default `0.0.0`.
- `inputs[]`: every P3 fixture path in deterministic order.
- `artifactOrder[]`: every schema, upstream P2 input artifact, P3 fixture, generated P3 artifact, and final evidence artifact in the semantic order defined by `validation-evidence.md`.
- `expectations[]`: fixture path, fixture kind, expected stage, expected phase, expected validation result, expected promotion status, expected diagnostic codes, expected artifact path, expected JSON Pointer, required source ref, selected agent ids, work-order path or `null`, and review queue path or `null`.
- `runExpectation`: aggregate status and promotion status.

`schemas/agent-task.v0.schema.json` owns the `*.agent-task.json` fixture class before recruitment. The expectations manifest records expected results for task fixtures and mutation fixtures, but it does not redefine task fixture structure.

Command-level upstream preflight mutation fixtures are not task fixtures. They model command invocation failures that must stop before `agent-capability-registry.fixture.json` or any `*.agent-task.json` fixture is read.

## P3 Stages
P3 stage values are:

- `preflight`
- `registry`
- `recruitment`
- `orchestration`
- `work-order`
- `review`
- `report`
- `evidence`

P3 may preserve P0/P1 stages inside upstream evidence references, but new P3 fixture expectations must use P3 stages unless they are explicitly inherited upstream expectations.

## P3 Phases
P3 expected phase values are:

- `upstream-preflight`
- `registry-materialization`
- `recruitment-selection`
- `orchestration-plan`
- `work-order-validation`
- `review-routing`
- `orchestration-report`
- `orchestration-evidence`

## Normative Manifest Rows

| Fixture path | Kind | Stage | Phase | Expected result | Promotion status | Diagnostic codes | Artifact path | JSON Pointer | Source ref | Selected agent ids | Work-order path | Review queue path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fixtures/p3/valid/runtime-adapter-plan.agent-task.json` | `valid` | `orchestration` | `orchestration-plan` | `valid` | `allowed` | `[]` | `artifacts/p3/orchestration-plan.json` | `/taskId` | `fixture://p3/valid/runtime-adapter-plan#/taskId` | `["contract-architect"]` | `artifacts/p3/work-order.contract-architect.json` | `null` |
| `fixtures/p3/valid/fixture-authoring.agent-task.json` | `valid` | `work-order` | `work-order-validation` | `valid` | `allowed` | `[]` | `artifacts/p3/work-order.fixture-author.json` | `/taskId` | `fixture://p3/valid/fixture-authoring#/taskId` | `["fixture-author"]` | `artifacts/p3/work-order.fixture-author.json` | `null` |
| `fixtures/p3/valid/evidence-review.agent-task.json` | `valid` | `work-order` | `work-order-validation` | `valid` | `allowed` | `[]` | `artifacts/p3/work-order.evidence-reviewer.json` | `/taskId` | `fixture://p3/valid/evidence-review#/taskId` | `["evidence-reviewer"]` | `artifacts/p3/work-order.evidence-reviewer.json` | `null` |
| `fixtures/p3/review/review-required-work.agent-task.json` | `review` | `review` | `review-routing` | `review_required` | `review_required` | `["AGENT_REVIEW_REQUIRED"]` | `artifacts/p3/review-queue.json` | `/reviewPolicy` | `fixture://p3/review/review-required-work#/reviewPolicy` | `["contract-architect"]` | `null` | `artifacts/p3/review-queue.json` |
| `fixtures/p3/invalid/unregistered-capability.agent-task.json` | `invalid` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_CAPABILITY_UNREGISTERED"]` | `artifacts/p3/agent-orchestration-report.json` | `/requiredCapabilities` | `fixture://p3/invalid/unregistered-capability#/requiredCapabilities` | `[]` | `null` | `null` |
| `fixtures/p3/invalid/denied-tool.agent-task.json` | `invalid` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_TOOL_DENIED"]` | `artifacts/p3/agent-orchestration-report.json` | `/deniedCapabilities` | `fixture://p3/invalid/denied-tool#/deniedCapabilities` | `[]` | `null` | `null` |
| `fixtures/p3/invalid/scope-escalation.agent-task.json` | `invalid` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_SCOPE_ESCALATION"]` | `artifacts/p3/agent-orchestration-report.json` | `/allowedOutputs` | `fixture://p3/invalid/scope-escalation#/allowedOutputs` | `[]` | `null` | `null` |
| `fixtures/p3/invalid/hidden-output.agent-task.json` | `invalid` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_OUTPUT_HIDDEN"]` | `artifacts/p3/agent-orchestration-report.json` | `/allowedOutputs` | `fixture://p3/invalid/hidden-output#/allowedOutputs` | `[]` | `null` | `null` |
| `fixtures/p3/invalid/cycle-dependency.agent-task.json` | `invalid` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_DEPENDENCY_CYCLE"]` | `artifacts/p3/agent-orchestration-report.json` | `/dependencies` | `fixture://p3/invalid/cycle-dependency#/dependencies` | `[]` | `null` | `null` |
| `fixtures/p3/invalid/missing-dependency.agent-task.json` | `invalid` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_DEPENDENCY_MISSING"]` | `artifacts/p3/agent-orchestration-report.json` | `/dependencies` | `fixture://p3/invalid/missing-dependency#/dependencies` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/missing-upstream-evidence.agent-preflight.json` | `mutation` | `preflight` | `upstream-preflight` | `invalid` | `blocked` | `["AGENT_UPSTREAM_EVIDENCE_MISSING"]` | `fixtures/p3/mutations/missing-upstream-evidence.agent-preflight.json` | `/ingestionEvidenceRef` | `fixture://p3/mutations/missing-upstream-evidence#/ingestionEvidenceRef` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/failing-upstream-evidence.agent-preflight.json` | `mutation` | `preflight` | `upstream-preflight` | `invalid` | `blocked` | `["AGENT_UPSTREAM_EVIDENCE_FAILED"]` | `fixtures/p3/mutations/failing-upstream-evidence.agent-preflight.json` | `/status` | `fixture://p3/mutations/failing-upstream-evidence#/status` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/upstream-evidence-hash-mismatch.agent-preflight.json` | `mutation` | `preflight` | `upstream-preflight` | `invalid` | `blocked` | `["AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH"]` | `fixtures/p3/mutations/upstream-evidence-hash-mismatch.agent-preflight.json` | `/boundaryRefs/0/hash` | `fixture://p3/mutations/upstream-evidence-hash-mismatch#/boundaryRefs/0/hash` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/stale-upstream-evidence.agent-preflight.json` | `mutation` | `preflight` | `upstream-preflight` | `invalid` | `blocked` | `["AGENT_UPSTREAM_EVIDENCE_STALE"]` | `fixtures/p3/mutations/stale-upstream-evidence.agent-preflight.json` | `/boundaryRefs` | `fixture://p3/mutations/stale-upstream-evidence#/boundaryRefs` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_REGISTRY_REF_MISSING"]` | `fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json` | `/registryRef` | `fixture://p3/mutations/missing-registry-ref#/registryRef` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_REGISTRY_HASH_MISMATCH"]` | `fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json` | `/registryRef/hash` | `fixture://p3/mutations/registry-hash-mismatch#/registryRef/hash` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/unregistered-agent.agent-orchestration-plan.json` | `mutation` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_UNREGISTERED"]` | `fixtures/p3/mutations/unregistered-agent.agent-orchestration-plan.json` | `/tasks/0/selectedAgentIds/0` | `fixture://p3/mutations/unregistered-agent#/tasks/0/selectedAgentIds/0` | `["unregistered-agent"]` | `null` | `null` |
| `fixtures/p3/mutations/duplicate-task-id.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_TASK_DUPLICATE_ID"]` | `fixtures/p3/mutations/duplicate-task-id.agent-orchestration-plan.json` | `/tasks/1/taskId` | `fixture://p3/mutations/duplicate-task-id#/tasks/1/taskId` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/duplicate-work-order-id.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_WORK_ORDER_DUPLICATE_ID"]` | `fixtures/p3/mutations/duplicate-work-order-id.agent-orchestration-plan.json` | `/workOrders/1/workOrderId` | `fixture://p3/mutations/duplicate-work-order-id#/workOrders/1/workOrderId` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/hidden-handoff.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_HANDOFF_HIDDEN"]` | `fixtures/p3/mutations/hidden-handoff.agent-orchestration-plan.json` | `/tasks/1/dependencies/0` | `fixture://p3/mutations/hidden-handoff#/tasks/1/dependencies/0` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/work-order-scope-escalation.agent-work-order.json` | `mutation` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_SCOPE_ESCALATION"]` | `fixtures/p3/mutations/work-order-scope-escalation.agent-work-order.json` | `/allowedOutputs` | `fixture://p3/mutations/work-order-scope-escalation#/allowedOutputs` | `["fixture-author"]` | `null` | `null` |
| `fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json` | `mutation` | `report` | `orchestration-report` | `invalid` | `blocked` | `["AGENT_REPORT_PLAN_HASH_MISMATCH"]` | `fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json` | `/orchestrationPlanRef/hash` | `fixture://p3/mutations/report-plan-hash-mismatch#/orchestrationPlanRef/hash` | `[]` | `null` | `null` |
| `fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json` | `mutation` | `evidence` | `orchestration-evidence` | `invalid` | `blocked` | `["AGENT_EVIDENCE_HASH_MISMATCH"]` | `fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json` | `/artifacts/0/hash` | `fixture://p3/mutations/hash-mismatch#/artifacts/0/hash` | `[]` | `null` | `null` |

## P3 Proof
The fixture set passes only when every expectation matches the manifest, every unexpected fixture is rejected, every expected diagnostic code is registry-backed, every review-required row remains non-executable, and final evidence records the complete artifact order.

## Non-Goals
- No live agent transcript fixture.
- No model selection fixture.
- No shell or connector execution fixture.
- No persistent review-decision fixture.
- No generated application code fixture.
