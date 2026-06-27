# Recruitment Policy

## Decision
P3 recruitment selects registered agent capabilities for declared task requirements using deterministic, phase-local policy. Recruitment cannot infer hidden permission from prose, select unregistered agents, widen scope, convert review-required work into allowed work, or create product, UI, runtime, projection, or review authority. Denied tools, side effects, secret access, and execution paths apply VISION.md's canonical no-live-execution boundary rather than defining a separate P3 execution rule.

## Goal
Make "recruit agents" auditable. A proof consumer should be able to see why each agent was selected, which capability matched, which inputs and outputs were allowed, what dependencies apply, and which evidence refs make the work reproducible.

## Inputs
- `artifacts/p3/agent-capability-registry.json`.
- P3 task fixtures under `fixtures/p3/valid/`, `fixtures/p3/review/`, and `fixtures/p3/invalid/`.
- `schemas/agent-task.v0.schema.json`, which owns the `*.agent-task.json` fixture class before recruitment.
- `fixtures/p3/expectations.manifest.json`.
- Upstream P2 ingestion boundary refs accepted by preflight.

## Outputs
- Recruitment selections inside `artifacts/p3/orchestration-plan.json`.
- Scoped work-order assignments under `artifacts/p3/work-order.*.json`.
- Review queue records for review-required selections.
- Recruitment diagnostics in `artifacts/p3/agent-orchestration-report.json`.

## Task Requirement Shape
Each P3 task fixture must validate against `schemas/agent-task.v0.schema.json` before recruitment. That schema owns all `*.agent-task.json` fixtures; orchestration-plan, work-order, review-queue, report, and evidence schemas consume the validated task records but do not redefine the fixture class.

Each P3 task fixture must declare:

| Field | Required | Notes |
| --- | --- | --- |
| `taskId` | yes | Stable id used in plan and report rows |
| `taskKind` | yes | Declared task category, not inferred from prose |
| `requiredCapabilities` | yes | Capability ids that must exist in the registry |
| `allowedInputs` | yes | Exact artifact paths or source refs the selected agent may consume |
| `allowedOutputs` | yes | Candidate artifact paths recorded for validation by a later executor proof; P3 authorizes no emission or execution |
| `dependencies` | yes | Other task ids or upstream artifact refs required before handoff |
| `reviewPolicy` | yes | `allowed`, `review_required`, or `blocked` |
| `evidenceObligations` | yes | Required hashes, provenance, diagnostics, and report rows |
| `deniedCapabilities` | yes | Explicitly denied tools, side effects, secret access, and execution paths |

## Selection Rules
- Select the smallest registry entry set that satisfies `requiredCapabilities`.
- Prefer deterministic tie-breaking by registry order, agent id, capability id, then task id.
- Reject tasks that require capabilities missing from the registry.
- Reject tasks that request denied capabilities, denied tools, hidden inputs, hidden outputs, or side effects.
- Reject tasks whose allowed output paths are outside `artifacts/p3` unless a later phase explicitly defines a new artifact root.
- Route `review_required` tasks to `review-queue.json` and do not emit executable work.
- Preserve `blocked` as blocked. Recruitment must never downgrade blocked or review-required status.

## Review Handling
Review-required tasks are structurally valid. They must:

- produce a manifest-checked report row;
- produce a review queue row with source refs, diagnostic code, required reviewer role, and suggested action;
- record `promotionStatus: "review_required"`;
- emit no executable work and no hidden output;
- remain included in final evidence as review-required, not allowed.

## Invalid Handling
Invalid tasks prove the policy rejects:

- unregistered capability requirements;
- generated orchestration plans or work orders that select unregistered agent ids;
- denied tools or side effects;
- output paths outside declared scope;
- hidden output channels;
- dependency cycles;
- missing dependencies;
- duplicate task ids;
- duplicate work-order ids;
- hidden handoffs not declared by task dependencies or evidence refs;
- blocked review policies that must stay blocked and must not emit work orders.

Command-level missing, failing, hash-mismatched, or stale upstream P2 ingestion evidence is not a recruitment invalid task. It is covered by preflight mutation fixtures and must fail before registry or task fixtures are read.

## P3 Proof
Recruitment passes only when every selected agent is registered, every selected capability is declared, every scope boundary matches the task fixture and registry policy, every review-required task remains non-executable, every blocked task remains blocked with no work order, and every invalid task fails with the expected diagnostic code.

## Non-Goals
- No scoring or ranking based on model quality.
- No dynamic load balancing.
- No live user assignment.
- No background execution authorization under VISION.md's canonical no-live-execution boundary.
- No natural-language-only task admission.

## Closed P3 Decisions
- Recruitment is deterministic.
- Task requirements are structured proof fixtures.
- Review-required recruitment produces queue/report/evidence records, not executable work.
