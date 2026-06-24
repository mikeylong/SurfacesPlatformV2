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
    missing-upstream-evidence.agent-task.json
  mutations/
    missing-registry-ref.agent-orchestration-plan.json
    registry-hash-mismatch.agent-orchestration-plan.json
    unregistered-agent.agent-orchestration-plan.json
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
| `invalid/` | Proves invalid recruitment/orchestration fails closed | `preflight`, `recruitment`, `orchestration`, or `work-order` |
| `mutations/` | Proves registry, plan, work-order, report, and evidence tampering is blocked | `orchestration`, `work-order`, `report`, or `evidence` |

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

| Fixture path | Kind | Stage | Phase | Expected result | Promotion status | Diagnostic codes | Artifact path | Work-order path | Review queue path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fixtures/p3/valid/runtime-adapter-plan.agent-task.json` | `valid` | `orchestration` | `orchestration-plan` | `valid` | `allowed` | `[]` | `artifacts/p3/orchestration-plan.json` | `artifacts/p3/work-order.contract-architect.json` | `null` |
| `fixtures/p3/valid/fixture-authoring.agent-task.json` | `valid` | `work-order` | `work-order-validation` | `valid` | `allowed` | `[]` | `artifacts/p3/work-order.fixture-author.json` | `artifacts/p3/work-order.fixture-author.json` | `null` |
| `fixtures/p3/valid/evidence-review.agent-task.json` | `valid` | `work-order` | `work-order-validation` | `valid` | `allowed` | `[]` | `artifacts/p3/work-order.evidence-reviewer.json` | `artifacts/p3/work-order.evidence-reviewer.json` | `null` |
| `fixtures/p3/review/review-required-work.agent-task.json` | `review` | `review` | `review-routing` | `review_required` | `review_required` | `["AGENT_REVIEW_REQUIRED"]` | `artifacts/p3/review-queue.json` | `null` | `artifacts/p3/review-queue.json` |
| `fixtures/p3/invalid/unregistered-capability.agent-task.json` | `invalid` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_CAPABILITY_UNREGISTERED"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/invalid/denied-tool.agent-task.json` | `invalid` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_TOOL_DENIED"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/invalid/scope-escalation.agent-task.json` | `invalid` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_SCOPE_ESCALATION"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/invalid/hidden-output.agent-task.json` | `invalid` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_OUTPUT_HIDDEN"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/invalid/cycle-dependency.agent-task.json` | `invalid` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_DEPENDENCY_CYCLE"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/invalid/missing-upstream-evidence.agent-task.json` | `invalid` | `preflight` | `upstream-preflight` | `invalid` | `blocked` | `["AGENT_UPSTREAM_EVIDENCE_MISSING"]` | `artifacts/p3/agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_REGISTRY_REF_MISSING"]` | `fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json` | `null` | `null` |
| `fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json` | `mutation` | `orchestration` | `orchestration-plan` | `invalid` | `blocked` | `["AGENT_REGISTRY_HASH_MISMATCH"]` | `fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json` | `null` | `null` |
| `fixtures/p3/mutations/unregistered-agent.agent-orchestration-plan.json` | `mutation` | `recruitment` | `recruitment-selection` | `invalid` | `blocked` | `["AGENT_CAPABILITY_UNREGISTERED"]` | `fixtures/p3/mutations/unregistered-agent.agent-orchestration-plan.json` | `null` | `null` |
| `fixtures/p3/mutations/work-order-scope-escalation.agent-work-order.json` | `mutation` | `work-order` | `work-order-validation` | `invalid` | `blocked` | `["AGENT_SCOPE_ESCALATION"]` | `fixtures/p3/mutations/work-order-scope-escalation.agent-work-order.json` | `null` | `null` |
| `fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json` | `mutation` | `report` | `orchestration-report` | `invalid` | `blocked` | `["AGENT_REPORT_PLAN_HASH_MISMATCH"]` | `fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json` | `null` | `null` |
| `fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json` | `mutation` | `evidence` | `orchestration-evidence` | `invalid` | `blocked` | `["AGENT_EVIDENCE_HASH_MISMATCH"]` | `fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json` | `null` | `null` |

## P3 Proof
The fixture set passes only when every expectation matches the manifest, every unexpected fixture is rejected, every expected diagnostic code is registry-backed, every review-required row remains non-executable, and final evidence records the complete artifact order.

## Non-Goals
- No live agent transcript fixture.
- No model selection fixture.
- No shell or connector execution fixture.
- No persistent review-decision fixture.
- No generated application code fixture.
