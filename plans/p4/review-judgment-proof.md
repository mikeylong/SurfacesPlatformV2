# Review And Judgment Proof

## Decision
P4 review proof materializes deterministic artifacts that show SurfaceOps decisions and JudgmentKit-shaped evaluations can consume P3 evidence without overriding the governed catalog or executing work.

## Goal
Produce machine-checkable review and judgment artifacts that are reproducible, evidence-backed, and safe for CI.

## Inputs
- `artifacts/p3/evidence.json`.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.
- P3 work-order refs recorded by evidence.
- P4 schemas and fixtures.
- `fixtures/p4/expectations.manifest.json`.

## Outputs
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/judgmentkit-evaluation-report.json`.
- `artifacts/p4/review-judgment-report.json`.
- `artifacts/p4/evidence.json`.

## Review Decision Ledger Shape
The decision ledger records:

- upstream evidence and review queue refs;
- reviewer fixture metadata;
- decision rows keyed by queue item id;
- decision status and rationale;
- evidence refs for each decision;
- second-review markers when required;
- diagnostics and aggregate promotion status.

## Judgment Evaluation Report Shape
The evaluation report records:

- upstream evidence refs;
- ledger ref when available;
- deterministic evaluator metadata;
- activity fit, contract quality, evidence quality, and handoff quality findings;
- aggregate result and diagnostics.

## Same-Run Artifact Reference Rule
P4 generated artifact refs are acyclic. The decision ledger may reference upstream P3 artifacts. The evaluation report may reference the ledger after it exists. The review/judgment report may reference both the ledger and evaluation report. Final P4 evidence owns the complete hash closure.

Forward refs to later same-run generated artifacts omit hashes. Resolved refs to already materialized artifacts may include hashes.

## Determinism Rules
- Output ordering is stable by artifact path, queue item id, fixture id, stage order, phase, diagnostic code, and source ref.
- Golden timestamps use `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Paths are POSIX-style relative paths.
- No absolute paths, `.` segments, `..` traversal, symlinked output roots, hidden outputs, or stale output bypasses are accepted.
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.

## SurfaceOps Decision Rules
- Decisions must cite P3 queue items and P3 evidence.
- Decisions must not mutate upstream P3 artifacts.
- Decisions must not execute work orders.
- Decisions must not create hidden review state.
- Approval, rejection, request-changes, and deferral are ledger states only.

## JudgmentKit Evaluation Rules
- Findings must cite evidence refs.
- Findings cannot override SurfaceOps decisions.
- Findings cannot rewrite catalog policy.
- Findings cannot call live JudgmentKit tooling in this proof.
- Evaluation output is a proof artifact, not an enforcement service.

## Report Behavior
`review-judgment-report.json` must record every expected and actual result before final evidence. It must include:

- upstream preflight summary;
- decision ledger summary;
- JudgmentKit-shaped evaluation summary;
- fixture result rows;
- diagnostics;
- generated artifact refs;
- aggregate status and promotion status.

## P4 Proof
The proof passes when upstream P3 evidence and review queue hashes validate, all expected artifacts are emitted, all fixture expectations match, invalid override and execution attempts are blocked, review-required rows remain non-executable, report rows are complete, and final evidence is reproducible.

## Non-Goals
- No live evaluator service.
- No SurfaceOps database.
- No work-order execution.
- No runtime adapter or production protocol.

## Closed P4 Decisions
- P4 proof emits ledger, evaluation report, review/judgment report, and final evidence.
- The review/judgment report is produced before final evidence.
- P4 output is deterministic and CI-safe.
