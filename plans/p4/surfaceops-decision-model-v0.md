# SurfaceOps Decision Model v0

## Decision
`surfaceops-decision-ledger.v0` is the planned P4 artifact for deterministic review decisions over P3 review queue items. It records what a reviewer decided, why, and which evidence supports the decision. It does not persist live operational state and does not mutate upstream artifacts.

## Goal
Provide the minimum review model needed to turn review-required proof artifacts into auditable decisions while preserving catalog authority and evidence traceability.

## Inputs
- `artifacts/p3/evidence.json`.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.
- Relevant P3 work-order refs.
- P4 review fixtures and expectations manifest.

## Outputs
- `schemas/surfaceops-decision-ledger.v0.schema.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.

## Decision Model Shape
The ledger must include:

- schema id and artifact provenance;
- upstream P3 evidence ref and review queue ref;
- deterministic generated metadata;
- reviewer records with stable ids and non-secret provenance;
- decision rows keyed by queue item id;
- decision status: `approved`, `rejected`, `changes_requested`, or `deferred`;
- rationale text with bounded length;
- evidence refs for every decision;
- optional second-review requirement;
- diagnostics for invalid or review-required decisions;
- aggregate promotion status.

Reviewer provenance must use deterministic fixture identities in P4 proof. Host usernames, emails, auth tokens, and live account identifiers are out of scope and must be `null` or fixture-defined non-secret values.

## Decision Rules
- Every decision must reference exactly one P3 review queue item.
- Every decision must cite accepted P3 evidence and the current P4 fixture row.
- `approved` decisions may only approve work already structurally valid and review-required upstream.
- `rejected` decisions must explain the evidence-backed reason and aggregate as `blocked`.
- `changes_requested` decisions must name requested changes and aggregate as `blocked`.
- `deferred` decisions must preserve `review_required`.
- Decisions requiring a second reviewer aggregate as `review_required`.
- Duplicate decisions for the same queue item are invalid unless the fixture explicitly models second-review behavior.

## Promotion, Reject, And Request-Changes Semantics
P4 promotion status is a proof aggregate, not a live deployment switch.

- `approved` can contribute `allowed` only when all expectations match and no second-review rows remain.
- `rejected` and `changes_requested` contribute `blocked`.
- `deferred` and second-review-required rows contribute `review_required`.
- No decision can change upstream P3 evidence, P3 review queue rows, P3 work orders, or catalog governance rules.

## Non-Override Rules
SurfaceOps decisions must not:

- rewrite catalog policy;
- mark an invalid upstream artifact valid;
- execute or schedule a work order;
- add hidden reviewer state;
- introduce new component, prop, action, token, runtime, or agent authority;
- call connectors, tools, network services, or agents.

## P4 Proof
The decision ledger passes when every valid, invalid, review, and mutation fixture matches the expectations manifest, all decisions cite evidence, invalid overrides are blocked, second-review rows remain non-executable, and the ledger hash is recorded by the review/judgment report and final evidence.

## Non-Goals
- No live reviewer identity integration.
- No durable database or approval workflow.
- No live SurfaceOps UI.
- No work-order execution.

## Closed P4 Decisions
- The first SurfaceOps model is a deterministic decision ledger.
- P4 uses fixture-defined reviewer provenance.
- Approval is evidence eligibility, not execution.
