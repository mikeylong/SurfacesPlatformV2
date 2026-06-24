# Review Queue v0

## Decision
P3 defines `agent-review-queue.v0` as the schema for non-executable review records emitted by the orchestration proof.

`artifacts/p3/review-queue.json` is always emitted. Empty queues use `items: []`.

The review queue is a derived proof artifact for later review surfaces to consume. It is not product, UI, runtime, projection, or review-decision authority, and it cannot authorize execution or persist human decisions in P3.

## Goal
Make review-required agent work inspectable without building SurfaceOps persistence or promoting review-required work as executable.

## Queue Shape
`agent-review-queue.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `agent-review-queue.v0` |
| `version` | string | yes | Semver |
| `runId` | string | yes | Same run id as orchestration report and evidence |
| `orchestrationPlanRef` | object | yes | Path, schema id, and hash for `artifacts/p3/orchestration-plan.json` |
| `items` | array | yes | Review rows sorted deterministically |
| `diagnostics` | array | yes | P3 diagnostics objects |
| `provenance` | object | yes | Source refs, generator metadata, deterministic environment |

Each `items[]` row must include:

- `reviewItemId`;
- `taskId`;
- `sourceFixtureRef`;
- `selectedAgentIds`;
- `requiredCapabilities`;
- `requiredReviewerRole`;
- `suggestedAction`;
- `diagnosticCode`;
- `promotionStatus: "review_required"`;
- `workOrderRef: null`;
- `nonExecutable: true`;
- `evidenceObligations`;
- `provenance`.

## Ordering
Rows are sorted by `taskId`, then `sourceFixtureRef`, then `diagnosticCode`, then `reviewItemId`.

## Non-Goals
- No persistent SurfaceOps decisions.
- No reviewer assignment workflow.
- No approval, rejection, or promotion mutation.
- No executable task queue.
