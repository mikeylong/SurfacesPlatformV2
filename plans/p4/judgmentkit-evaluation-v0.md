# JudgmentKit Evaluation v0

## Decision
`judgmentkit-evaluation-report.v0` is the planned P4 artifact for deterministic, JudgmentKit-shaped findings over Surfaces evidence. It records evaluation dimensions, findings, and evidence refs without invoking live JudgmentKit tools in this planning slice and without becoming enforcement authority.

## Goal
Make evaluation results reviewable and evidence-backed. The first P4 evaluation contract should let a reviewer inspect whether the activity, contract, evidence, and handoff quality are adequate for downstream use.

## Inputs
- `artifacts/p3/evidence.json`.
- `artifacts/p3/review-queue.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- P4 review and judgment fixtures.

## Outputs
- `schemas/judgmentkit-evaluation-report.v0.schema.json`.
- `artifacts/p4/judgmentkit-evaluation-report.json`.

## Evaluation Shape
The report must include:

- schema id and artifact provenance;
- upstream P3 evidence refs;
- P4 decision ledger ref when available;
- evaluator identity as deterministic fixture metadata;
- evaluation dimensions;
- findings with severity, rationale, evidence refs, and affected artifact paths;
- aggregate result;
- diagnostics for invalid evaluator behavior.

## Evaluation Dimensions
The first P4 dimensions are:

- `activity_fit`: whether the reviewed work fits the declared task and phase boundary.
- `contract_quality`: whether schemas, fixtures, diagnostics, and reports support the claim.
- `evidence_quality`: whether hashes, provenance, and boundary refs are complete and reproducible.
- `handoff_quality`: whether downstream consumers can understand what is approved, rejected, blocked, or still review-required.

## Scoring And Finding Rules
- Findings must cite evidence refs and artifact paths.
- Allowed severities are `info`, `warning`, and `error`.
- Aggregate result is `pass`, `warn`, or `fail`.
- An `error` finding can make P4 evidence `blocked`, but it cannot rewrite catalog or SurfaceOps decision authority.
- Evaluator text must be deterministic in fixtures and golden artifacts.
- Validator-native text is non-normative; canonical diagnostic messages own hashed evidence wording.

## Non-Override Rules
JudgmentKit-shaped findings must not:

- promote or reject work directly;
- override SurfaceOps decision rows;
- rewrite governed catalog policy;
- mutate P3 or P4 artifacts;
- execute agents, tools, shell commands, network calls, or connector calls;
- introduce hidden evaluator state.

## P4 Proof
The evaluation report passes when every finding is evidence-backed, invalid override attempts are blocked, aggregate results match the expectations manifest, and final P4 evidence records the evaluation report hash and provenance.

## Non-Goals
- No live JudgmentKit MCP invocation in this planning slice.
- No replacement for SurfaceOps decisions.
- No enforcement authority beyond P4 proof aggregation.
- No broad evaluator framework.

## Closed P4 Decisions
- The first JudgmentKit contract is a deterministic evaluation report.
- Evaluation dimensions are activity fit, contract quality, evidence quality, and handoff quality.
- Judgment findings are advisory proof artifacts unless a later phase defines enforcement.
