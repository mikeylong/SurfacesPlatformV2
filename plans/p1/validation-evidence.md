# Validation And Evidence

## Decision
P1 evidence extends P0 evidence for runtime projection and adapter proof. It preserves P0 canonicalization, hash, provenance, diagnostic, and stale-output rules while adding upstream P0 input refs and adapter-boundary artifacts.

## Goal
Create one P1 evidence artifact that can prove the runtime projection and adapter proof without coupling P1 to a product UI, SurfaceOps, JudgmentKit, or an A2UI-specific P5 target.

## Inputs
- P1 schemas.
- `fixtures/p1/expectations.manifest.json`.
- All P1 fixtures.
- `artifacts/p0/evidence.json`.
- `artifacts/p0/governed-catalog.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- `artifacts/p1/runtime-projection.json`.
- P1 render-plan artifacts.
- `artifacts/p1/runtime-adapter-report.json`.

## Outputs
- `schemas/runtime-adapter-evidence.v0.schema.json`.
- `schemas/runtime-adapter-diagnostics.v0.schema.json`.
- `artifacts/p1/evidence.json`.

## Evidence Shape
`runtime-adapter-evidence.v0` must include all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- upstream P0 evidence ref;
- upstream governed catalog ref;
- upstream adapter diagnostics ref;
- P1 schema refs;
- P1 fixture refs;
- runtime projection ref;
- render-plan refs;
- runtime adapter report ref;
- diagnostics;
- validation results;
- artifact hashes and provenance for schemas, fixtures, upstream inputs, and generated proof artifacts under `artifacts/p1`;
- aggregate `status`;
- aggregate `promotionStatus`;
- final evidence self-hash.

## Upstream Boundary Refs
P1 evidence must include `boundaryRefs[]` for:

- `artifacts/p0/evidence.json`;
- `artifacts/p0/governed-catalog.json`;
- `artifacts/p0/adapter-diagnostics.json`;
- `artifacts/p1/runtime-projection.json`;
- every emitted render plan;
- `artifacts/p1/runtime-adapter-report.json`.

`boundaryRefs[]` is an exact ordered proof-closure tuple in that order. Missing, duplicated, reordered, or extra refs are schema-invalid. Each ref must include artifact path, schema id, hash, `sourceArtifactHash`, and provenance.

## P0 Preflight Gate
Before deriving or validating `artifacts/p1/runtime-projection.json`, P1 proof must run a strict P0 preflight gate and fail closed before writing any P1 proof artifact when any check fails.

Required preflight checks:

1. `artifacts/p0/evidence.json`, `artifacts/p0/governed-catalog.json`, and `artifacts/p0/adapter-diagnostics.json` exist at those exact POSIX-relative paths.
2. `artifacts/p0/evidence.json` validates against the P0 evidence schema and its self-hash is valid using the P0 null-placeholder rule.
3. P0 evidence has `status: "pass"` and aggregate `promotionStatus` is not `blocked`.
4. `artifacts/p0/adapter-diagnostics.json` validates against the P0 adapter diagnostics schema and has `status: "pass"`.
5. P0 evidence `runId` and adapter diagnostics `runId` are byte-identical.
6. P0 evidence contains exactly one artifact ref for each of `artifacts/p0/governed-catalog.json`, `artifacts/p0/adapter-diagnostics.json`, and `artifacts/p0/evidence.json`, with no duplicate artifact paths.
7. The P0 evidence artifact refs for `artifacts/p0/governed-catalog.json` and `artifacts/p0/adapter-diagnostics.json` exactly match the current files' recomputed SHA-256 hashes, `hashAlgorithm`, paths, and schema ids.
8. The P0 evidence self artifact ref for `artifacts/p0/evidence.json` exactly matches the recomputed P0 evidence self-hash.
9. The adapter diagnostics `catalogRef` exactly matches the governed catalog artifact ref in P0 evidence.
10. The `--catalog` argument exactly equals the governed catalog artifact path recorded in P0 evidence and adapter diagnostics.
11. P0 evidence `adapterDiagnosticsPath` exactly equals `artifacts/p0/adapter-diagnostics.json`.
12. No alternate catalog ref, absolute path, symlinked path, `..` traversal, or extra P0 catalog input is accepted before projection.

P1 evidence must copy the accepted P0 evidence, governed catalog, and adapter diagnostics refs into `boundaryRefs[]` without rewriting paths, hashes, run ids, or schema ids.

## Artifact Ordering
P1 evidence artifact order is:

1. P1-owned schemas only.
2. Upstream P0 evidence and artifacts consumed by P1.
3. P1 expectations manifest.
4. P1 valid fixtures.
5. P1 review fixtures.
6. P1 invalid fixtures.
7. P1 mutation fixtures.
8. Runtime projection.
9. Render plans.
10. Runtime adapter report.
11. Final P1 evidence.

The `artifacts` entry for `artifacts/p1/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

The evidence schema must reject missing or extra upstream refs, missing or extra boundary refs, arbitrary or extra render-plan refs, and truncated or extra artifact refs. The JSON `null` hash placeholder is valid only for the final `artifacts/p1/evidence.json` self ref during self-hash computation; every other artifact hash must be a lowercase SHA-256 hex digest.

Runtime projection, render plans, runtime adapter report, and final evidence are generated proof artifacts under `artifacts/p1`. Demo files under `demo/p1` are generated presentation output, not evidence-hashed proof artifacts.

The shared `schemas/` directory may contain regular schemas for later phases. P1 evidence does not hash or claim those schemas unless a later phase adds its own proof contract; P1 remains closed over the P1-owned schema list plus the upstream P0 artifacts it consumes.

## Diagnostics
P1 diagnostics must use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison. The registry `canonicalMessage` is emitted as the diagnostic `message`; any schema or manifest field named `canonicalMessage` must match it exactly.

P1 diagnostics are sorted by artifact path, stage order (`projection`, `runtime-boundary`, `evidence`), phase, path, keyword location, code, source ref, then canonical message. Nulls sort after strings.

P1 must preserve P0 diagnostic meaning for shared failures. P1-only diagnostic codes are allowed only for failures at the projection, runtime-boundary, or runtime evidence layer.

`schemas/runtime-adapter-diagnostics.v0.schema.json`, `fixtures/p1/expectations.manifest.json`, and `artifacts/p1/evidence.json` must encode the same registry rows. Codes not listed here are invalid in P1.

| Code | Trigger | `canonicalMessage` | Severity | Diagnostic source | Stage | Phase | Artifact path | JSON Pointer | Source ref | Validation result | Promotion status | Suggested action | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PROJECTION_CATALOG_REF_MISSING` | Runtime projection omits its governed catalog reference | Runtime projection governed catalog reference is missing. | `error` | `runtime-projection-validator` | `projection` | `projection-mutation` | `fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json` | `/catalogRef` | `null` | `invalid` | `blocked` | Reject the projection and regenerate it from the governed P0 catalog. | `mutations/missing-catalog-ref.runtime-projection.json` |
| `PROJECTION_SOURCE_HASH_MISMATCH` | Runtime projection catalog hash differs from P0 evidence | Runtime projection governed catalog hash does not match P0 evidence. | `error` | `runtime-projection-validator` | `projection` | `projection-mutation` | `fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json` | `/catalogRef/hash` | `fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef` | `invalid` | `blocked` | Reject the projection and regenerate it from the accepted P0 catalog ref. | `mutations/catalog-hash-mismatch.runtime-projection.json` |
| `PROJECTION_AUTHORITY_ESCALATION` | Runtime projection grants component, prop, action, token, data-binding, or governance authority absent from the governed catalog | Runtime projection grants authority absent from the governed catalog. | `error` | `runtime-projection-validator` | `projection` | `projection-mutation` | `fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json` | `/components/Button/props/variant/allowedValues/3` | `fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/Button/props/variant/allowedValues/3` | `invalid` | `blocked` | Reject the projection and remove non-catalog authority before proof continues. | `mutations/projection-authority-escalation.runtime-projection.json` |
| `RUNTIME_PROJECTION_HASH_MISMATCH` | Adapter proof consumes runtime projection metadata whose hash differs from the current projection artifact | Runtime projection hash does not match adapter proof metadata. | `error` | `runtime-boundary-validator` | `runtime-boundary` | `runtime-adapter` | `fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` | `/runtimeProjectionRef/hash` | `fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef` | `invalid` | `blocked` | Reject the adapter report and regenerate proof artifacts from the current runtime projection. | `mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` |
| `RUNTIME_RENDER_PLAN_PROVENANCE_MISSING` | Render plan omits required provenance | Render plan provenance is missing. | `error` | `render-plan-validator` | `runtime-boundary` | `runtime-adapter` | `fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json` | `/provenance` | `fixture://p1/valid/confirm-panel#/root` | `invalid` | `blocked` | Reject the render plan and regenerate it with required provenance. | `mutations/missing-render-plan-provenance.render-plan.json` |
| `RUNTIME_ACTION_EXECUTION_BLOCKED` | Runtime proof encounters disabled or unsupported action execution | Runtime action execution is blocked by the governed catalog. | `error` | `runtime-boundary-validator` | `runtime-boundary` | `runtime-invalid` | `fixtures/p1/invalid/disabled-action-execution.surface-ir.json` | `/instances/secondaryAction/actions/dismiss/execute` | `fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss` | `invalid` | `blocked` | Reject runtime usage without rendering or executing actions. | `invalid/disabled-action-execution.surface-ir.json` |
| `RUNTIME_PROJECTION_MEMBER_UNKNOWN` | Runtime Surface IR references a component member or token absent from the runtime projection | Runtime Surface IR references authority absent from the runtime projection. | `error` | `runtime-boundary-validator` | `runtime-boundary` | `runtime-invalid` | `runtime-surface-fixture` | `/` | `null` | `invalid` | `blocked` | Reject runtime usage and correct the Surface IR against the runtime projection. | `manifest-wide` |
| `RUNTIME_REVIEW_REQUIRED` | Runtime proof encounters structurally valid usage that requires review | Runtime usage requires review before unattended promotion. | `review` | `runtime-boundary-validator` | `runtime-boundary` | `runtime-review` | `fixtures/p1/review/review-required-action.surface-ir.json` | `/root/actions/confirm/execute` | `fixture://p1/review/review-required-action#/root/actions/confirm` | `review_required` | `review_required` | Preserve review status in report and evidence, and do not emit executable output for the action. | `review/review-required-action.surface-ir.json` |
| `RUNTIME_EVIDENCE_HASH_MISMATCH` | Runtime adapter evidence hash differs from manifest or self-hash rule | Runtime adapter evidence hash does not match the manifest or self-hash rule. | `error` | `evidence-validator` | `evidence` | `runtime-evidence` | `fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json` | `/artifacts/0/hash` | `null` | `invalid` | `blocked` | Reject the evidence and regenerate it from current proof artifacts. | `mutations/hash-mismatch.runtime-adapter-evidence.json` |

The `RUNTIME_EVIDENCE_HASH_MISMATCH` mutation must prove both sides of the evidence hash guard: at least one generated P1 artifact ref must not match the current generated artifact hash, and the final `artifacts/p1/evidence.json` artifact ref must not match the recomputed evidence self-hash under the null-placeholder rule.

`RUNTIME_PROJECTION_HASH_MISMATCH` must be fixture-backed by `fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json`. Manifest-wide coverage is not sufficient for this code.

`RUNTIME_PROJECTION_MEMBER_UNKNOWN` is a manifest-wide runtime-boundary guard. Its emitted artifact path, JSON Pointer, and source ref identify the specific Surface IR member that referenced authority absent from `runtime-projection.v0`.

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any review-required fixture executes an action or is promoted as allowed, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and no structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `allowed`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
- Paths are POSIX-style relative paths.
- Golden `generatedAt` is `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Command arguments are recorded in deterministic order.
- The evidence self-hash uses the P0 null-placeholder rule.
- Evidence hashes generated proof artifacts under `artifacts/p1`; it must not hash `demo/p1` output.

## P1 Proof
One evidence file records projection validation, render-plan validation, expected invalid failures, review-required results, adapter report diagnostics, input and output hashes, and enough provenance to reproduce the run.

## Non-Goals
- No JudgmentKit evaluation output.
- No SurfaceOps review-decision persistence.
- No demo HTML hash requirement inside proof evidence.
- No validator-native message hashing.
- No non-deterministic environment capture.

## Closed P1 Decisions
- P1 evidence hashes upstream P0 artifacts.
- P1 evidence hashes generated proof artifacts under `artifacts/p1`, not demo output.
- Adapter diagnostics/report are produced before final P1 evidence.
- Demo output is checked by CI drift, not included in final evidence, to avoid circular proof/demo dependencies.
