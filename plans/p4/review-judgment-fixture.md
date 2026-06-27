# Review And Judgment Fixture

## Decision
P4 fixtures define deterministic review and judgment cases over accepted P3 evidence and review queue artifacts. They are proof inputs, not live review data.

## Goal
Cover the minimum decision and evaluation cases needed to prove SurfaceOps and JudgmentKit consumers stay evidence-backed, deterministic, and non-authoritative.

## Fixture Layout

```text
fixtures/p4/
  expectations.manifest.json
  valid/
    approve-reviewed-work.review-judgment.json
    reject-unsafe-work.review-judgment.json
    request-changes.review-judgment.json
    evaluate-evidence-quality.review-judgment.json
  review/
    second-review-required.review-judgment.json
  invalid/
    missing-evidence-ref.review-judgment.json
    decision-overrides-catalog.review-judgment.json
    executes-work-order.review-judgment.json
    judgmentkit-missing-boundary-ref.review-judgment.json
    judgmentkit-overrides-policy.review-judgment.json
    hidden-decision.review-judgment.json
  mutations/
    missing-upstream-evidence.review-preflight.json
    failing-upstream-evidence.review-preflight.json
    upstream-evidence-hash-mismatch.review-preflight.json
    stale-upstream-evidence.review-preflight.json
    duplicate-decision.surfaceops-decision-ledger.json
    ledger-hash-mismatch.surfaceops-decision-ledger.json
    report-ledger-hash-mismatch.review-judgment-report.json
    hash-mismatch.review-judgment-evidence.json
```

## Fixture Categories
- `valid/` fixtures produce manifest-declared committed decision ledger rows, coverage-only decision results, or evaluation findings that match expectations.
- `review/` fixtures are structurally valid but preserve `review_required`, such as second-review-required decisions.
- `invalid/` fixtures are blocked for missing accepted P3 evidence or review queue refs, policy overrides, forbidden execution, or hidden state.
- `mutations/` fixtures model command preflight, generated artifact, report, and evidence tampering failures.

Every review/judgment fixture `reviewItemRef` must bind to the accepted P3 review queue by exact `path`, `schemaId`, top-level `runId`, `reviewItemId`, and `taskId`. Stale run ids or refs that do not match an accepted queue item fail through the existing evidence-ref diagnostics.

## Expectations Manifest
`fixtures/p4/expectations.manifest.json` must declare every fixture input, expected stage, expected phase, expected validation result, expected promotion status, and expected diagnostic code.

The manifest must also declare the expected generated artifacts and final evidence behavior for valid and review-required cases. Unknown P4 fixtures must fail closed.

## P4 Stages
The stage order is:

1. `preflight`
2. `review`
3. `judgment`
4. `report`
5. `evidence`

## P4 Phases
The phase labels are:

- `upstream-preflight`
- `surfaceops-decision`
- `judgmentkit-evaluation`
- `review-judgment-report`
- `review-judgment-evidence`

## Normative Manifest Rows
The first fixture set should cover:

- approval of a P3 review-required queue item with evidence refs;
- rejection of unsafe work without upstream mutation;
- request-changes with explicit evidence-backed rationale;
- evidence-quality evaluation findings;
- second-review-required behavior;
- missing evidence refs;
- SurfaceOps catalog override attempts;
- forbidden work-order execution attempts;
- JudgmentKit policy override attempts;
- hidden decision state;
- duplicate committed decision ledger rows for the same P3 review item;
- missing, failing, mismatched, and stale upstream P3 evidence;
- ledger, report, and evidence hash tampering.

## P4 Proof
The proof passes when every manifest row is matched, valid fixtures produce deterministic ledger or evaluation rows, review fixtures preserve `review_required`, invalid fixtures are blocked with canonical diagnostics, mutation fixtures fail in the expected stage, and evidence records the complete fixture and artifact hash closure.

## Non-Goals
- No production review data.
- No live JudgmentKit result capture.
- No generated agent output beyond inert upstream P3 artifacts.
- No fixture that expands catalog authority.
