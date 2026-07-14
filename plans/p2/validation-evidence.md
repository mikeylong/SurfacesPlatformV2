# Validation And Evidence

## Decision
P2 evidence proves real design-system ingestion without coupling the phase to live connectors, runtime rendering, SurfaceOps persistence, JudgmentKit evaluation, or agent orchestration.

## Goal
Create one P2 evidence artifact that can prove source inventory, mapping, extraction, catalog compilation, governance, diagnostics, review routing, and report behavior.

## Inputs
- P2-owned schemas.
- Shared schemas consumed by P2 extraction, catalog compilation, diagnostics, expectations, evidence, and governed catalog behavior.
- `sources/p2/design-system-source/package-snapshot.lock.json`.
- `sources/p2/design-system-source/manifest.json`.
- Declared source files under `sources/p2/design-system-source/`.
- P2 fixtures and expectations manifest.
- `artifacts/p2/source-inventory.json`.
- `artifacts/p2/source-mapping.json`.
- `artifacts/p2/extract.json`.
- `artifacts/p2/catalog.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p2/ingestion-report.json`.

## Outputs
- `schemas/design-source-package-snapshot-lock.v0.schema.json`.
- `schemas/design-system-ingestion-evidence.v0.schema.json`.
- `schemas/design-system-ingestion-diagnostics.v0.schema.json`.
- `schemas/design-system-ingestion-valid-fixture.v0.schema.json`.
- `artifacts/p2/evidence.json`.

## Evidence Shape
`design-system-ingestion-evidence.v0` must include all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- source manifest ref;
- immutable package snapshot lock as `sourceFileRefs[0]`, with its raw-file hash;
- source file refs and hashes;
- P2-owned schema refs;
- consumed shared schema refs;
- P2 fixture refs;
- source inventory ref;
- source mapping ref;
- extract, catalog, and governed catalog refs;
- ingestion report ref;
- diagnostics;
- validation results;
- artifact hashes and provenance for schemas, source inputs, fixtures, and generated proof artifacts under `artifacts/p2`;
- aggregate `status`;
- aggregate `promotionStatus`;
- final evidence self-hash.

## Source Preflight Gate
Before materializing `artifacts/p2/source-inventory.json`, P2 proof must run strict source preflight checks and fail closed before writing any P2 proof artifact when any check fails.

Required preflight checks:

1. `sources/p2/design-system-source/package-snapshot.lock.json` exists at the exact POSIX-relative path and conforms to `design-source-package-snapshot-lock.v0`.
2. The lock identifies the pinned npm package, tarball, and SRI, records the tarball SHA-256, and contains the exact ordered package-file paths with `hashAlgorithm: "sha256"` and raw-byte `sha256` values established during a separate review-time tarball verification. Deterministic proof does not fetch or reconstruct that tarball.
3. Every checked-in file under `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/` matches the lock's exact path set, order, and raw-byte hash. Normal materialization fails on drift and never regenerates the lock.
4. `sources/p2/design-system-source/manifest.json` exists at the exact POSIX-relative path.
5. The manifest conforms to `design-source-manifest.v0` and its `packageSnapshotLock` path, schema id, hash algorithm, and `sha256` match the immutable lock.
6. The manifest package metadata matches `@adobe/spectrum-design-data@0.7.0`, the declared npm tarball, and package integrity `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`.
7. Every source file declared by the manifest exists, is a regular file, has bytes matching the declared SHA-256 hash, and lives under `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/` or a declared local `docs/` or `mappings/` path.
8. No source file outside the manifest is read.
9. No absolute path, symlinked path, `..` traversal, alternate source root, or extra source input is accepted.
10. The manifest declares `designSystemId`, `designSystemName`, `sourceFamily`, source files, required mappings, policy refs, source-ref grammar, and initial components `button` and `in-line-alert`.
11. Every source ref in manifest, mapping, extraction, catalog, report, and evidence artifacts conforms to the P2 source-ref grammar and points at a manifest-declared source file.

P2 evidence must preserve accepted source and proof refs through `sourceManifestRef`, `sourceFileRefs`, `schemaClosure`, `fixtureRefs`, `artifactRefs`, and `validationResults`; the immutable package-lock ref is `sourceFileRefs[0]`, before every declared package, docs, and mapping source ref. The accepted report is represented by the `artifactRefs` entry for `artifacts/p2/ingestion-report.json`.
These refs and the final evidence self-hash must be recorded without rewriting paths, hashes, run ids, schema ids, source ids, or source ref roots.
Each evidence ref must also carry deterministic provenance for its ref path, hash or self-hash placeholder, role, generator, timestamp, and environment.

## Artifact Ordering
P2 evidence artifact order is:

1. P2-owned schemas, with `schemas/design-source-package-snapshot-lock.v0.schema.json` first.
2. Consumed shared schemas.
3. Immutable P2 package snapshot lock.
4. P2 source manifest.
5. Declared source files.
6. P2 expectations manifest.
7. P2 valid fixtures.
8. P2 review fixtures.
9. P2 invalid fixtures.
10. P2 mutation fixtures in expectations-manifest order: missing manifest, package integrity mismatch, causal package-byte tamper, then the remaining mutation fixtures.
11. Source inventory.
12. Source mapping.
13. Extract.
14. Catalog.
15. Governed catalog.
16. Ingestion report.
17. Final P2 evidence.

The `artifactRefs` entry for `artifacts/p2/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

Demo files under `demo/p2` are generated presentation output, not evidence-hashed proof artifacts.

## Schema Closure
P2 evidence is closed over every schema it consumes. The schema closure must include:

| Schema group | Required files |
| --- | --- |
| P2-owned source contracts | `schemas/design-source-package-snapshot-lock.v0.schema.json`, `schemas/design-source-manifest.v0.schema.json`, `schemas/design-source-inventory.v0.schema.json`, `schemas/design-source-mapping.v0.schema.json` |
| P2-owned proof contracts | `schemas/design-system-ingestion-report.v0.schema.json`, `schemas/design-system-ingestion-evidence.v0.schema.json`, `schemas/design-system-ingestion-expectations.v0.schema.json`, `schemas/design-system-ingestion-diagnostics.v0.schema.json`, `schemas/design-system-ingestion-valid-fixture.v0.schema.json` |
| Shared extraction and catalog contracts | `schemas/extract.v0.schema.json`, `schemas/runtime-catalog.v0.schema.json` |
| Shared diagnostic, expectation, and evidence behavior | `schemas/diagnostics.v0.schema.json`, `schemas/fixture-expectations.v0.schema.json`, `schemas/evidence.v0.schema.json` |

Missing, extra, or hash-mismatched required schema refs fail P2 evidence with `INGEST_SCHEMA_HASH_MISMATCH`. Future phase-owned schema files may exist under `schemas/`, but P2 evidence must hash only this consumed schema closure.

## Diagnostics
P2 diagnostics must use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison.

P2 diagnostics are sorted by artifact path, stage order (`source-inventory`, `mapping`, `extract`, `compile`, `govern`, `report`, `evidence`), phase, path, keyword location, code, source ref, then canonical message. Nulls sort after strings.

`schemas/design-system-ingestion-diagnostics.v0.schema.json`, `fixtures/p2/expectations.manifest.json`, `artifacts/p2/ingestion-report.json`, and `artifacts/p2/evidence.json` must encode the same registry rows. Codes not listed here are invalid in P2.

| Code | Trigger | `canonicalMessage` | Severity | Diagnostic source | Stage | Phase | Artifact path | JSON Pointer | Validation result | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `INGEST_SOURCE_MANIFEST_MISSING` | Source bundle manifest is absent or unreadable | Design-system source manifest is missing or unreadable. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/missing-source-manifest.design-source.json` | `/manifest` | `invalid` | `blocked` | `mutations/missing-source-manifest.design-source.json` |
| `INGEST_PACKAGE_INTEGRITY_MISMATCH` | Spectrum package metadata differs from the pinned npm target | Spectrum package integrity does not match the pinned npm package. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/package-integrity-mismatch.design-source.json` | `/packageIntegrity` | `invalid` | `blocked` | `mutations/package-integrity-mismatch.design-source.json` |
| `INGEST_PACKAGE_SNAPSHOT_LOCK_MISMATCH` | The checked-in package path set, path type, or file bytes differ from the immutable npm snapshot lock | Local package snapshot does not match the immutable npm snapshot lock. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/package-snapshot-byte-tamper.design-source.json` | `/packageFiles/3/sha256` | `invalid` | `blocked` | `mutations/package-snapshot-byte-tamper.design-source.json` |
| `INGEST_SOURCE_PATH_UNDECLARED` | Source path is outside the manifest or outside the allowed snapshot roots | Design-system source path is not declared by the manifest. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/source-path-undeclared.design-source.json` | `/sourceFiles/0/path` | `invalid` | `blocked` | `mutations/source-path-undeclared.design-source.json` |
| `INGEST_SOURCE_REF_INVALID` | Source ref grammar is malformed or points outside manifest-declared source files | Design-system source reference does not match the required source-ref grammar. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/invalid-source-ref.design-source.json` | `/sourceFiles/0/sourceRefRoot` | `invalid` | `blocked` | `mutations/invalid-source-ref.design-source.json` |
| `INGEST_SOURCE_HASH_MISMATCH` | Source file hash differs from manifest or inventory | Design-system source hash does not match the declared manifest. | `error` | `source-inventory-validator` | `source-inventory` | `source-inventory` | `fixtures/p2/mutations/source-hash-mismatch.design-source-inventory.json` | `/sourceFiles/0/hash` | `invalid` | `blocked` | `mutations/source-hash-mismatch.design-source-inventory.json` |
| `INGEST_SOURCE_REF_MISSING` | Extracted source material lacks source refs | Extracted design-system material is missing required source refs. | `error` | `extract-validator` | `extract` | `source-extraction` | `fixtures/p2/mutations/missing-source-ref.extract.json` | `/components/0/sourceRef` | `invalid` | `blocked` | `mutations/missing-source-ref.extract.json` |
| `INGEST_COMPONENT_UNMAPPED` | Source component lacks an accepted catalog mapping | Source component is missing a required catalog mapping. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/unmapped-component.design-source.json` | `/mappingRows` | `invalid` | `blocked` | `invalid/unmapped-component.design-source.json` |
| `INGEST_TOKEN_UNSUPPORTED` | Source token cannot be represented by current token contract | Source token is unsupported by the current catalog token contract. | `error` | `extract-validator` | `extract` | `source-extraction` | `fixtures/p2/invalid/unsupported-token.design-source.json` | `/tokens` | `invalid` | `blocked` | `invalid/unsupported-token.design-source.json` |
| `INGEST_TOKEN_MODE_UNSUPPORTED` | Source token mode or color mode cannot be represented by current token contract | Source token mode is unsupported by the current catalog token contract. | `error` | `extract-validator` | `extract` | `source-extraction` | `fixtures/p2/invalid/unsupported-mode.design-source.json` | `/tokens/modes` | `invalid` | `blocked` | `invalid/unsupported-mode.design-source.json` |
| `INGEST_VARIANT_AMBIGUOUS` | Source variants cannot be deterministically mapped | Source variant mapping is ambiguous. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/ambiguous-variant.design-source.json` | `/mappingRows` | `invalid` | `blocked` | `invalid/ambiguous-variant.design-source.json` |
| `INGEST_GOVERNANCE_POLICY_MISSING` | Sensitive usage lacks a declared governance policy | Required governance policy is missing for sensitive source usage. | `error` | `governance-validator` | `govern` | `catalog-governance` | `fixtures/p2/invalid/governance-policy-missing.design-source.json` | `/policyRefs` | `invalid` | `blocked` | `invalid/governance-policy-missing.design-source.json` |
| `INGEST_MAPPING_REVIEW_REQUIRED` | Source material is structurally valid but requires human mapping review | Source mapping requires review before unattended promotion. | `review` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/review/manual-mapping-required.design-source.json` | `/reviewRequired` | `review_required` | `review_required` | `review/manual-mapping-required.design-source.json` |
| `INGEST_MAPPING_AUTHORITY_ESCALATION` | Mapping attempts to promote catalog behavior absent from source material | Source mapping attempted to promote catalog behavior absent from the design-system source. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/mutations/mapping-authority-escalation.design-source-mapping.json` | `/mappingRows/0` | `invalid` | `blocked` | `mutations/mapping-authority-escalation.design-source-mapping.json` |
| `INGEST_NORMALIZED_ID_DUPLICATE` | Multiple mapping rows emit the same normalized id without an explicit conflict rule | Source mapping contains a duplicate normalized id without an accepted conflict rule. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/duplicate-normalized-id.design-source-mapping.json` | `/mappingRows/1/normalizedId` | `invalid` | `blocked` | `invalid/duplicate-normalized-id.design-source-mapping.json` |
| `INGEST_MAPPING_ROW_REF_INVALID` | Mapping row source refs, mapping refs, or target refs are missing, malformed, or outside declared refs | Source mapping row references are missing or invalid. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/mapping-row-ref-invalid.design-source-mapping.json` | `/mappingRows/0/sourceRefs` | `invalid` | `blocked` | `invalid/mapping-row-ref-invalid.design-source-mapping.json` |
| `INGEST_MAPPING_CARDINALITY_INVALID` | Mapping row cardinality is missing or incompatible with source and target refs | Source mapping row cardinality is invalid. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/mapping-cardinality-invalid.design-source-mapping.json` | `/mappingRows/0/cardinality` | `invalid` | `blocked` | `invalid/mapping-cardinality-invalid.design-source-mapping.json` |
| `INGEST_SCHEMA_HASH_MISMATCH` | P2-owned schema or consumed shared schema hash differs from evidence closure | Design-system ingestion schema hash does not match the evidence manifest. | `error` | `evidence-validator` | `evidence` | `ingestion-evidence` | `fixtures/p2/mutations/schema-hash-mismatch.design-system-ingestion-evidence.json` | `/schemaClosure/0/hash` | `invalid` | `blocked` | `mutations/schema-hash-mismatch.design-system-ingestion-evidence.json` |
| `INGEST_EVIDENCE_HASH_MISMATCH` | Ingestion evidence hash differs from manifest or self-hash rule | Design-system ingestion evidence hash does not match the manifest or self-hash rule. | `error` | `evidence-validator` | `evidence` | `ingestion-evidence` | `fixtures/p2/mutations/hash-mismatch.design-system-ingestion-evidence.json` | `/artifactRefs/6/hash` | `invalid` | `blocked` | `mutations/hash-mismatch.design-system-ingestion-evidence.json` |

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any review-required fixture is promoted as allowed, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid source mapping requires review, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and no structurally valid source mapping requires review, `status` is `pass` and `promotionStatus` is `allowed`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
- Package-file hashes in the snapshot lock are over raw package bytes. The manifest and evidence lock references hash the raw lock-file bytes, keeping both authorities independent from generated manifest source hashes.
- Paths are POSIX-style relative paths.
- Golden `generatedAt` is `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Command arguments are recorded in deterministic order.
- The evidence self-hash uses the P0/P1 null-placeholder rule.
- Evidence hashes generated proof artifacts under `artifacts/p2`; it must not hash `demo/p2` output.

## Non-Goals
- No validator-native message hashing.
- No non-deterministic environment capture.
- No live connector evidence.
- No demo HTML hash requirement inside proof evidence.
