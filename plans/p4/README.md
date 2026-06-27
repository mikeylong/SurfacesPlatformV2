# Surfaces Platform V2 P4 Subplans

## Decision
P4 proves review and judgment as derived consumers of existing Surfaces evidence. It consumes accepted P3 orchestration evidence, the generated P3 review queue, and related reports, then materializes a deterministic SurfaceOps decision ledger, JudgmentKit-shaped evaluation report, review/judgment report, and final evidence.

P4 is subordinate to [VISION.md](../../VISION.md#canonical-authority-model)'s canonical authority model: the design system is the authority, the Surfaces Catalog is the governed contract, and evidence proves only implemented proof behavior. SurfaceOps may inspect review queue items and record approve, reject, request-changes, or defer decisions within the SurfaceOps decision ledger. JudgmentKit may inspect evidence and emit evaluation-only findings for activity fit, contract quality, evidence quality, and handoff quality. Neither may create catalog, runtime, source, adapter, execution, or override authority.

## Mission Fit
Surfaces Platform creates value when review-required work can be routed to humans and evidence can be evaluated without losing traceability. P4 makes that review layer governed: every decision and finding must cite evidence, preserve source refs and hashes, avoid hidden policy, and stay reproducible.

P4 must run only after P3 inert orchestration evidence passes. Review and judgment over earlier synthetic or ingestion-only phases can be useful for diagnostics, but the first P4 proof target is the P3 review queue because it exercises work orders, dependencies, handoffs, and review-required routing.

## Start Gate Record
P4 planning was opened by these documents. The implementation start gate was satisfied from clean post-merge `main` with passing:

- `npm run check:p0:ci`
- `npm run check:p1:ci`
- `npm run check:p2:ci`
- `npm run check:p3:ci`

The start-gate record for P4 implementation includes the merge commit, the accepted `artifacts/p3/evidence.json` self-hash, and the proof-bearing gate logs. Gate logs and merge records are not stored under `artifacts/p4`.

## Initial Implementation Slice
The first P4 implementation slice preserves the derived-consumer boundary and proceeds in this order:

1. Materialize P4 schema contracts for SurfaceOps decisions, JudgmentKit evaluations, review/judgment fixtures, reports, diagnostics, expectations, and evidence.
2. Add P4 fixtures and `fixtures/p4/expectations.manifest.json` before proof output claims.
3. Implement strict P3 preflight and deterministic artifact generation for the decision ledger, evaluation report, review/judgment report, and final evidence.
4. Add the generated demo and CI drift/untracked guards only after P4 evidence is reproducible.

P4 does not invoke live JudgmentKit tools, persist operational review decisions, execute work orders, or call agents unless a later explicit proof contract and user authorization allow it.

## P4 Dependency Order
1. [Product Boundaries](product-boundaries.md)
2. [SurfaceOps Decision Model v0](surfaceops-decision-model-v0.md)
3. [JudgmentKit Evaluation v0](judgmentkit-evaluation-v0.md)
4. [Review And Judgment Fixture](review-judgment-fixture.md)
5. [Review And Judgment Proof](review-judgment-proof.md)
6. [Validation And Evidence](validation-evidence.md)
7. [Demo And CI](demo-ci.md)

## P4 Contract Layout

```text
schemas/
  surfaceops-decision-ledger.v0.schema.json
  judgmentkit-evaluation-report.v0.schema.json
  review-judgment-fixture.v0.schema.json
  review-judgment-report.v0.schema.json
  review-judgment-evidence.v0.schema.json
  review-judgment-expectations.v0.schema.json
  review-judgment-diagnostics.v0.schema.json
  review-preflight-mutation.v0.schema.json

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

artifacts/p4/
  surfaceops-decision-ledger.json
  judgmentkit-evaluation-report.json
  review-judgment-report.json
  evidence.json

demo/p4/
  README.md
  index.html
```

## P4 Proof Command

Implemented command:

```bash
interfacectl surfaces review proof \
  --orchestration-evidence artifacts/p3/evidence.json \
  --review-queue artifacts/p3/review-queue.json \
  --fixture fixtures/p4 \
  --out artifacts/p4
```

Package scripts execute this through `node bin/interfacectl.js`. P4 evidence records the logical command string above.

## Pass Condition
Given valid P3 orchestration evidence, a valid P3 review queue, and the P4 fixture set, the review proof command emits the exact P4 artifacts, creates a deterministic SurfaceOps decision ledger for manifest-committed decisions, keeps reject, request-changes, and defer outcomes covered in validation/report rows without duplicating committed ledger entries for the same P3 review item, emits a deterministic evaluation-only JudgmentKit-shaped report, blocks invalid SurfaceOps decision rows and any JudgmentKit-shaped finding that attempts to approve, reject, request changes, route, promote, or override policy, preserves review-required second-review cases, records review/judgment diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P4 schema, fixture, input artifact, generated proof artifact under `artifacts/p4`, and final evidence artifact.

P4 generated artifact refs must be acyclic. Forward refs to later same-run artifacts omit hashes, resolved backward refs to already materialized artifacts may include hashes, and final P4 evidence owns the complete hash closure.

## Product Surface Rule
The P4 proof defines review and judgment contracts; it is not a live operations console or evaluator service.

`demo/p4/index.html` must be generated from P4 proof artifacts. It may show review queue intake, decision ledger entries, JudgmentKit-shaped findings, diagnostics, artifact refs, and evidence status. It must not contain editable review state, live decision submission, JudgmentKit connector calls, work-order execution controls, secrets, or live agent status.

## P0/P1/P2/P3 Invariants Carried Forward
- P0, P1, P2, and P3 proof gates must still pass unchanged before and after P4 work.
- P4 consumes P3 evidence and review queue artifacts as proof inputs; it does not add design-system, catalog, runtime, adapter, or source authority.
- Paths are POSIX-style paths relative to the workspace root.
- Stale unexpected output under the declared P4 output root fails before writing.
- Expected output symlinks, symlinked output roots, absolute paths, and `..` traversal fail with the same exit-code discipline as prior phases.
- Golden metadata is deterministic: `1970-01-01T00:00:00.000Z`, UTC, host-derived fields set to `null`, and stable command arguments.
- Evidence canonicalization follows RFC 8785/JCS with I-JSON numeric input constraints.
- Diagnostic messages used in hashed evidence are canonical registry messages, not validator-native text.
- P4 diagnostics preserve P0/P1/P2/P3 diagnostic meaning for shared upstream failures and add only registry-backed P4 rows for review, judgment, report, and evidence failures.

## P4 Diagnostic Additions

| Code | Trigger | Stage | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- |
| `REVIEW_UPSTREAM_EVIDENCE_MISSING` | Command-level upstream P3 evidence input is missing | `preflight` | `blocked` | `mutations/missing-upstream-evidence.review-preflight.json` |
| `REVIEW_UPSTREAM_EVIDENCE_FAILED` | Command-level upstream P3 evidence is not passing | `preflight` | `blocked` | `mutations/failing-upstream-evidence.review-preflight.json` |
| `REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH` | Command-level upstream P3 evidence or review queue hash does not match the accepted boundary | `preflight` | `blocked` | `mutations/upstream-evidence-hash-mismatch.review-preflight.json` |
| `REVIEW_UPSTREAM_EVIDENCE_STALE` | Command-level upstream P3 evidence or review queue ref is stale or not the exact declared input | `preflight` | `blocked` | `mutations/stale-upstream-evidence.review-preflight.json` |
| `SURFACEOPS_EVIDENCE_REF_MISSING` | Review decision omits required evidence or queue item refs | `review` | `blocked` | `invalid/missing-evidence-ref.review-judgment.json` |
| `SURFACEOPS_DECISION_OVERRIDE` | SurfaceOps decision rewrites catalog policy or upstream promotion status outside the ledger | `review` | `blocked` | `invalid/decision-overrides-catalog.review-judgment.json` |
| `SURFACEOPS_EXECUTION_FORBIDDEN` | Review decision attempts to execute a P3 work order or invoke tools | `review` | `blocked` | `invalid/executes-work-order.review-judgment.json` |
| `SURFACEOPS_DECISION_HIDDEN` | Review decision contains hidden, untracked, or non-evidence-backed state | `review` | `blocked` | `invalid/hidden-decision.review-judgment.json` |
| `SURFACEOPS_SECOND_REVIEW_REQUIRED` | Structurally valid decision requires a second reviewer | `review` | `review_required` | `review/second-review-required.review-judgment.json` |
| `SURFACEOPS_DUPLICATE_DECISION` | SurfaceOps decision ledger contains more than one committed decision for the same P3 review item | `review` | `blocked` | `mutations/duplicate-decision.surfaceops-decision-ledger.json` |
| `JUDGMENTKIT_EVIDENCE_REF_MISSING` | Judgment finding omits accepted P3 evidence or review queue boundary refs | `judgment` | `blocked` | `invalid/judgmentkit-missing-boundary-ref.review-judgment.json` |
| `JUDGMENTKIT_POLICY_OVERRIDE` | Judgment finding attempts to override catalog or SurfaceOps decision authority | `judgment` | `blocked` | `invalid/judgmentkit-overrides-policy.review-judgment.json` |
| `REVIEW_LEDGER_HASH_MISMATCH` | Review report or fixture references a decision ledger hash that differs from the current ledger | `report` | `blocked` | `mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json` |
| `REVIEW_REPORT_LEDGER_HASH_MISMATCH` | Review report references a ledger hash that differs from the current ledger | `report` | `blocked` | `mutations/report-ledger-hash-mismatch.review-judgment-report.json` |
| `REVIEW_EVIDENCE_HASH_MISMATCH` | Review evidence hash differs from manifest or self-hash rule | `evidence` | `blocked` | `mutations/hash-mismatch.review-judgment-evidence.json` |

## Allowed Claims
P4 may be described only as a deterministic review and judgment proof over the accepted P3 review queue and evidence when `artifacts/p4/evidence.json` passes.

It must not be described as a live SurfaceOps product, live JudgmentKit execution, agent execution, production review workflow, production adapter, A2UI projection, or authority override.

## Non-Goals
- No live SurfaceOps console.
- No persistent operational review-decision store.
- No live JudgmentKit MCP or connector invocation unless a later explicit proof and user authorization require it.
- No execution of P3 work orders.
- No live agents, shell commands, connector calls, network calls, or secret access from P4 artifacts.
- No P5 production adapters, A2UI exports, or protocol boundaries.
