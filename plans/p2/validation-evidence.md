# Validation And Evidence

## Decision
P2 evidence proves real design-system ingestion without coupling the phase to live connectors, runtime rendering, SurfaceOps persistence, JudgmentKit evaluation, or agent orchestration.

## Goal
Create one P2 evidence artifact that can prove source inventory, mapping, extraction, catalog compilation, governance, diagnostics, review routing, and report behavior.

## Inputs
- P2 schemas.
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
- `schemas/design-system-ingestion-evidence.v0.schema.json`.
- `schemas/design-system-ingestion-diagnostics.v0.schema.json`.
- `artifacts/p2/evidence.json`.

## Evidence Shape
`design-system-ingestion-evidence.v0` must include all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- source manifest ref;
- source file refs and hashes;
- P2 schema refs;
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

1. `sources/p2/design-system-source/manifest.json` exists at the exact POSIX-relative path.
2. The manifest conforms to `design-source-manifest.v0`.
3. Every source file declared by the manifest exists, is a regular file, and has bytes matching the declared SHA-256 hash.
4. No source file outside the manifest is read.
5. No absolute path, symlinked path, `..` traversal, alternate source root, or extra source input is accepted.
6. The manifest declares `designSystemId`, `designSystemName`, `sourceFamily`, source files, required mappings, and policy refs.

P2 evidence must copy accepted source refs into `boundaryRefs[]` without rewriting paths, hashes, run ids, schema ids, source ids, or source ref roots.

## Artifact Ordering
P2 evidence artifact order is:

1. P2 schemas.
2. P2 source manifest.
3. Declared source files.
4. P2 expectations manifest.
5. P2 review fixtures.
6. P2 invalid fixtures.
7. P2 mutation fixtures.
8. Source inventory.
9. Source mapping.
10. Extract.
11. Catalog.
12. Governed catalog.
13. Ingestion report.
14. Final P2 evidence.

The `artifacts` entry for `artifacts/p2/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

Demo files under `demo/p2` are generated presentation output, not evidence-hashed proof artifacts.

## Diagnostics
P2 diagnostics must use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison.

P2 diagnostics are sorted by artifact path, stage order (`source-inventory`, `mapping`, `extract`, `compile`, `govern`, `report`, `evidence`), phase, path, keyword location, code, source ref, then canonical message. Nulls sort after strings.

`schemas/design-system-ingestion-diagnostics.v0.schema.json`, `fixtures/p2/expectations.manifest.json`, `artifacts/p2/ingestion-report.json`, and `artifacts/p2/evidence.json` must encode the same registry rows. Codes not listed here are invalid in P2.

| Code | Trigger | `canonicalMessage` | Severity | Diagnostic source | Stage | Phase | Artifact path | JSON Pointer | Validation result | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `INGEST_SOURCE_MANIFEST_MISSING` | Source bundle manifest is absent or unreadable | Design-system source manifest is missing or unreadable. | `error` | `source-preflight-validator` | `source-inventory` | `source-manifest` | `fixtures/p2/mutations/missing-source-manifest.design-source.json` | `/manifest` | `invalid` | `blocked` | `mutations/missing-source-manifest.design-source.json` |
| `INGEST_SOURCE_HASH_MISMATCH` | Source file hash differs from manifest or inventory | Design-system source hash does not match the declared manifest. | `error` | `source-inventory-validator` | `source-inventory` | `source-inventory` | `fixtures/p2/mutations/source-hash-mismatch.design-source-inventory.json` | `/sourceFiles/0/hash` | `invalid` | `blocked` | `mutations/source-hash-mismatch.design-source-inventory.json` |
| `INGEST_SOURCE_REF_MISSING` | Extracted source material lacks source refs | Extracted design-system material is missing required source refs. | `error` | `extract-validator` | `extract` | `source-extraction` | `fixtures/p2/mutations/missing-source-ref.extract.json` | `/components/0/sourceRef` | `invalid` | `blocked` | `mutations/missing-source-ref.extract.json` |
| `INGEST_COMPONENT_UNMAPPED` | Source component lacks an accepted catalog mapping | Source component is missing a required catalog mapping. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/unmapped-component.design-source.json` | `/componentMappings` | `invalid` | `blocked` | `invalid/unmapped-component.design-source.json` |
| `INGEST_TOKEN_UNSUPPORTED` | Source token cannot be represented by current token contract | Source token is unsupported by the current catalog token contract. | `error` | `extract-validator` | `extract` | `source-extraction` | `fixtures/p2/invalid/unsupported-token.design-source.json` | `/tokens` | `invalid` | `blocked` | `invalid/unsupported-token.design-source.json` |
| `INGEST_VARIANT_AMBIGUOUS` | Source variants cannot be deterministically mapped | Source variant mapping is ambiguous. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/invalid/ambiguous-variant.design-source.json` | `/componentMappings/variants` | `invalid` | `blocked` | `invalid/ambiguous-variant.design-source.json` |
| `INGEST_GOVERNANCE_POLICY_MISSING` | Sensitive usage lacks a declared governance policy | Required governance policy is missing for sensitive source usage. | `error` | `governance-validator` | `govern` | `catalog-governance` | `fixtures/p2/invalid/governance-policy-missing.design-source.json` | `/policyRefs` | `invalid` | `blocked` | `invalid/governance-policy-missing.design-source.json` |
| `INGEST_MAPPING_REVIEW_REQUIRED` | Source material is structurally valid but requires human mapping review | Source mapping requires review before unattended promotion. | `review` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/review/manual-mapping-required.design-source.json` | `/reviewRequired` | `review_required` | `review_required` | `review/manual-mapping-required.design-source.json` |
| `INGEST_MAPPING_AUTHORITY_ESCALATION` | Mapping attempts to promote catalog behavior absent from source material | Source mapping attempted to promote catalog behavior absent from the design-system source. | `error` | `mapping-validator` | `mapping` | `source-mapping` | `fixtures/p2/mutations/mapping-authority-escalation.design-source-mapping.json` | `/componentMappings/0` | `invalid` | `blocked` | `mutations/mapping-authority-escalation.design-source-mapping.json` |
| `INGEST_EVIDENCE_HASH_MISMATCH` | Ingestion evidence hash differs from manifest or self-hash rule | Design-system ingestion evidence hash does not match the manifest or self-hash rule. | `error` | `evidence-validator` | `evidence` | `ingestion-evidence` | `fixtures/p2/mutations/hash-mismatch.design-system-ingestion-evidence.json` | `/artifacts/0/hash` | `invalid` | `blocked` | `mutations/hash-mismatch.design-system-ingestion-evidence.json` |

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any review-required fixture is promoted as allowed, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid source mapping requires review, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and no structurally valid source mapping requires review, `status` is `pass` and `promotionStatus` is `allowed`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
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
