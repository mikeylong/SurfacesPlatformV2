# Validation And Evidence

## Decision
P4 evidence extends P3 orchestration evidence for review and judgment proof. It preserves canonicalization, hash, provenance, diagnostic, preflight, and stale-output rules while adding SurfaceOps decision and JudgmentKit-shaped evaluation artifacts. Under VISION.md, P4 evidence proves only implemented proof behavior; it does not add catalog, runtime, adapter, execution, or operational authority.

## Goal
Create one P4 evidence artifact that proves review and judgment behavior without coupling P4 to a live SurfaceOps product, live JudgmentKit invocation, or work-order runtime.

## Inputs
- P4 schemas.
- `fixtures/p4/expectations.manifest.json`.
- All P4 valid, review, invalid, and mutation fixtures.
- `artifacts/p3/evidence.json`.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/judgmentkit-evaluation-report.json`.
- `artifacts/p4/review-judgment-report.json`.

## Outputs
- `schemas/review-judgment-evidence.v0.schema.json`.
- `schemas/review-judgment-diagnostics.v0.schema.json`.
- `artifacts/p4/evidence.json`.

## Evidence Shape
`review-judgment-evidence.v0` must include all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- upstream P3 orchestration evidence and review queue refs;
- P4 schema refs;
- P4 fixture refs;
- decision ledger ref;
- JudgmentKit-shaped evaluation report ref;
- review/judgment report ref;
- diagnostics;
- validation results;
- artifact hashes and provenance for schemas, fixtures, upstream inputs, and generated proof artifacts under `artifacts/p4`;
- aggregate `status`;
- aggregate `promotionStatus`;
- final evidence self-hash.

## Upstream Boundary Refs
P4 evidence must include `boundaryRefs[]` for:

- `artifacts/p3/evidence.json`;
- `artifacts/p3/review-queue.json`;
- `artifacts/p3/agent-orchestration-report.json`;
- `artifacts/p4/surfaceops-decision-ledger.json`;
- `artifacts/p4/judgmentkit-evaluation-report.json`;
- `artifacts/p4/review-judgment-report.json`.

Each ref must include artifact path, schema id, hash, source artifact hash when applicable, and deterministic provenance. P4 requires provenance on evidence `boundaryRefs[]` specifically so boundary crossings are auditable without requiring provenance on every generic artifact ref shape consumed elsewhere.

## P3 Preflight Gate
Before materializing `artifacts/p4/surfaceops-decision-ledger.json`, P4 proof must run strict P3 preflight checks and fail closed before writing any P4 proof artifact when any check fails.

Required preflight checks:

1. P3 evidence and review queue exist at their exact POSIX-relative paths.
2. P3 evidence self-hash validates using the null-placeholder rule.
3. P3 evidence has `status: "pass"` and aggregate `promotionStatus` is not `blocked`.
4. P3 evidence contains artifact refs for `artifacts/p3/review-queue.json`, `artifacts/p3/agent-orchestration-report.json`, and `artifacts/p3/evidence.json`.
5. Current P3 artifact bytes match the hashes recorded in accepted evidence.
6. P3 review queue ref matches the command input and evidence ref.
7. No alternate review queue ref, alternate orchestration evidence ref, absolute path, symlinked path, `..` traversal, or extra upstream input is accepted before ledger materialization.

After preflight accepts the queue, P4 fixture validation must bind each `reviewItemRef` to that queue's exact path, schema id, top-level run id, review item id, and task id. Stale fixture refs are reported with the existing SurfaceOps or JudgmentKit evidence-ref diagnostics.

P4 evidence must copy accepted upstream refs into `boundaryRefs[]` without rewriting paths, hashes, run ids, or schema ids.

## Artifact Ordering
P4 evidence artifact order is:

1. P4 schemas.
2. Upstream P3 evidence and artifacts consumed by P4.
3. P4 expectations manifest.
4. P4 valid fixtures.
5. P4 review fixtures.
6. P4 invalid fixtures.
7. P4 mutation fixtures.
8. SurfaceOps decision ledger.
9. JudgmentKit-shaped evaluation report.
10. Review/judgment report.
11. Final P4 evidence.

The `artifacts` entry for `artifacts/p4/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

Demo files under `demo/p4` are generated presentation output, not evidence-hashed proof artifacts.

## Schema Closure
P4 proof authority is closed over P4-owned schemas and every prior-phase schema it consumes through evidence validation. Regular future phase-owned schemas under `schemas/` do not enter P4 evidence or drift expectations, while missing or tampered P4 schemas and non-regular schema-root entries still fail closed according to the established phase-gate pattern.

## Diagnostics
P4 diagnostics must use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison.

P4 diagnostics are sorted by artifact path, stage order (`preflight`, `review`, `judgment`, `report`, `evidence`), phase, path, keyword location, code, source ref, then canonical message. Nulls sort after strings.

`schemas/review-judgment-diagnostics.v0.schema.json`, `fixtures/p4/expectations.manifest.json`, `artifacts/p4/review-judgment-report.json`, and `artifacts/p4/evidence.json` must encode the same registry rows. Codes not listed there are invalid in P4.

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any decision or finding attempts execution or policy override, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid fixture requires second review or deferral, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and every reviewed item is approved with no blocking evaluation findings, `status` is `pass` and `promotionStatus` is `allowed`.
6. If all expectations match and any reviewed item is rejected, changes-requested, or has an error evaluation finding, `status` is `pass` and `promotionStatus` is `blocked`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
- Paths are POSIX-style relative paths.
- Golden `generatedAt` is `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Command arguments are recorded in deterministic order.
- The evidence self-hash uses the prior-phase null-placeholder rule.
- Evidence hashes generated proof artifacts under `artifacts/p4`; it must not hash `demo/p4` output.

## P4 Proof
One evidence file records upstream preflight, decision validation, evaluation finding validation, report diagnostics, input and output hashes, and enough provenance to reproduce the run.

## Non-Goals
- No live SurfaceOps decision database.
- No live JudgmentKit execution path.
- No demo HTML hash requirement inside proof evidence.
- No validator-native message hashing.
- No non-deterministic environment capture.

## Closed P4 Decisions
- P4 evidence hashes upstream P3 artifacts.
- P4 evidence hashes generated proof artifacts under `artifacts/p4`, not demo output.
- Review/judgment report is produced before final P4 evidence.
- Demo output is checked by CI drift, not included in final evidence.
