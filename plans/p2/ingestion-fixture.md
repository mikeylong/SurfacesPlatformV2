# Ingestion Fixture

## Decision
P2 uses `fixtures/p2/` for ingestion expectations and failure coverage, while the real design-system source bundle lives under `sources/p2/design-system-source/`.

Fixtures test the proof. They are not the real design-system source.

## Goal
Define exact fixture paths, expected stages, phases, promotion statuses, diagnostics, artifact paths, source refs, and review behavior for the first real-source ingestion proof.

## Fixture Layout

```text
fixtures/p2/
  expectations.manifest.json
  valid/
    spectrum-button.design-source.json
    spectrum-in-line-alert.design-source.json
    spectrum-subset.source-mapping.json
  review/
    manual-mapping-required.design-source.json
  invalid/
    unmapped-component.design-source.json
    unsupported-token.design-source.json
    unsupported-mode.design-source.json
    ambiguous-variant.design-source.json
    governance-policy-missing.design-source.json
    duplicate-normalized-id.design-source-mapping.json
    mapping-row-ref-invalid.design-source-mapping.json
    mapping-cardinality-invalid.design-source-mapping.json
  mutations/
    missing-source-manifest.design-source.json
    package-integrity-mismatch.design-source.json
    source-path-undeclared.design-source.json
    invalid-source-ref.design-source.json
    source-hash-mismatch.design-source-inventory.json
    missing-source-ref.extract.json
    mapping-authority-escalation.design-source-mapping.json
    schema-hash-mismatch.design-system-ingestion-evidence.json
    hash-mismatch.design-system-ingestion-evidence.json
```

## Expectations Manifest
`fixtures/p2/expectations.manifest.json` must include:

- `sourceRoot`: `sources/p2/design-system-source`.
- `fixtureRoot`: `fixtures/p2`.
- `artifactRoot`: `artifacts/p2`.
- `schemaRoot`: `schemas`.
- `version`: P2 default `0.0.0`.
- `inputs[]`: every source file and fixture path in deterministic order.
- `artifactOrder[]`: every P2 schema, source input, fixture, generated P2 artifact, and final evidence artifact in the order defined by `validation-evidence.md`.
- `validCoverage[]`: every positive coverage fixture, including required Spectrum coverage for `button`, `in-line-alert`, and the accepted mapping rows that connect them to normalized catalog ids.
- `expectations[]`: fixture path, fixture kind, expected stage, expected phase, expected validation result, expected promotion status, expected diagnostic codes, expected artifact path, expected JSON Pointer, required source ref, and review queue requirement.
- `runExpectation`: aggregate status and promotion status.

## P2 Stages
P2 stage values are:

- `source-inventory`
- `mapping`
- `extract`
- `compile`
- `govern`
- `report`
- `evidence`

## P2 Phases
P2 expected phase values are:

- `source-manifest`
- `source-inventory`
- `source-mapping`
- `source-extraction`
- `catalog-compile`
- `catalog-governance`
- `ingestion-report`
- `ingestion-evidence`

## Normative Manifest Rows

| Fixture path | Kind | Stage | Phase | Expected result | Promotion status | Diagnostic codes | Artifact path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fixtures/p2/valid/spectrum-button.design-source.json` | `valid` | `extract` | `source-extraction` | `valid` | `allowed` | `[]` | `artifacts/p2/ingestion-report.json` |
| `fixtures/p2/valid/spectrum-in-line-alert.design-source.json` | `valid` | `extract` | `source-extraction` | `valid` | `allowed` | `[]` | `artifacts/p2/ingestion-report.json` |
| `fixtures/p2/valid/spectrum-subset.source-mapping.json` | `valid` | `mapping` | `source-mapping` | `valid` | `allowed` | `[]` | `artifacts/p2/source-mapping.json` |
| `fixtures/p2/review/manual-mapping-required.design-source.json` | `review` | `mapping` | `source-mapping` | `review_required` | `review_required` | `["INGEST_MAPPING_REVIEW_REQUIRED"]` | `fixtures/p2/review/manual-mapping-required.design-source.json` |
| `fixtures/p2/invalid/unmapped-component.design-source.json` | `invalid` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_COMPONENT_UNMAPPED"]` | `fixtures/p2/invalid/unmapped-component.design-source.json` |
| `fixtures/p2/invalid/unsupported-token.design-source.json` | `invalid` | `extract` | `source-extraction` | `invalid` | `blocked` | `["INGEST_TOKEN_UNSUPPORTED"]` | `fixtures/p2/invalid/unsupported-token.design-source.json` |
| `fixtures/p2/invalid/unsupported-mode.design-source.json` | `invalid` | `extract` | `source-extraction` | `invalid` | `blocked` | `["INGEST_TOKEN_MODE_UNSUPPORTED"]` | `fixtures/p2/invalid/unsupported-mode.design-source.json` |
| `fixtures/p2/invalid/ambiguous-variant.design-source.json` | `invalid` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_VARIANT_AMBIGUOUS"]` | `fixtures/p2/invalid/ambiguous-variant.design-source.json` |
| `fixtures/p2/invalid/governance-policy-missing.design-source.json` | `invalid` | `govern` | `catalog-governance` | `invalid` | `blocked` | `["INGEST_GOVERNANCE_POLICY_MISSING"]` | `fixtures/p2/invalid/governance-policy-missing.design-source.json` |
| `fixtures/p2/invalid/duplicate-normalized-id.design-source-mapping.json` | `invalid` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_NORMALIZED_ID_DUPLICATE"]` | `fixtures/p2/invalid/duplicate-normalized-id.design-source-mapping.json` |
| `fixtures/p2/invalid/mapping-row-ref-invalid.design-source-mapping.json` | `invalid` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_MAPPING_ROW_REF_INVALID"]` | `fixtures/p2/invalid/mapping-row-ref-invalid.design-source-mapping.json` |
| `fixtures/p2/invalid/mapping-cardinality-invalid.design-source-mapping.json` | `invalid` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_MAPPING_CARDINALITY_INVALID"]` | `fixtures/p2/invalid/mapping-cardinality-invalid.design-source-mapping.json` |
| `fixtures/p2/mutations/missing-source-manifest.design-source.json` | `mutation` | `source-inventory` | `source-manifest` | `invalid` | `blocked` | `["INGEST_SOURCE_MANIFEST_MISSING"]` | `fixtures/p2/mutations/missing-source-manifest.design-source.json` |
| `fixtures/p2/mutations/package-integrity-mismatch.design-source.json` | `mutation` | `source-inventory` | `source-manifest` | `invalid` | `blocked` | `["INGEST_PACKAGE_INTEGRITY_MISMATCH"]` | `fixtures/p2/mutations/package-integrity-mismatch.design-source.json` |
| `fixtures/p2/mutations/source-path-undeclared.design-source.json` | `mutation` | `source-inventory` | `source-manifest` | `invalid` | `blocked` | `["INGEST_SOURCE_PATH_UNDECLARED"]` | `fixtures/p2/mutations/source-path-undeclared.design-source.json` |
| `fixtures/p2/mutations/invalid-source-ref.design-source.json` | `mutation` | `source-inventory` | `source-manifest` | `invalid` | `blocked` | `["INGEST_SOURCE_REF_INVALID"]` | `fixtures/p2/mutations/invalid-source-ref.design-source.json` |
| `fixtures/p2/mutations/source-hash-mismatch.design-source-inventory.json` | `mutation` | `source-inventory` | `source-inventory` | `invalid` | `blocked` | `["INGEST_SOURCE_HASH_MISMATCH"]` | `fixtures/p2/mutations/source-hash-mismatch.design-source-inventory.json` |
| `fixtures/p2/mutations/missing-source-ref.extract.json` | `mutation` | `extract` | `source-extraction` | `invalid` | `blocked` | `["INGEST_SOURCE_REF_MISSING"]` | `fixtures/p2/mutations/missing-source-ref.extract.json` |
| `fixtures/p2/mutations/mapping-authority-escalation.design-source-mapping.json` | `mutation` | `mapping` | `source-mapping` | `invalid` | `blocked` | `["INGEST_MAPPING_AUTHORITY_ESCALATION"]` | `fixtures/p2/mutations/mapping-authority-escalation.design-source-mapping.json` |
| `fixtures/p2/mutations/schema-hash-mismatch.design-system-ingestion-evidence.json` | `mutation` | `evidence` | `ingestion-evidence` | `invalid` | `blocked` | `["INGEST_SCHEMA_HASH_MISMATCH"]` | `fixtures/p2/mutations/schema-hash-mismatch.design-system-ingestion-evidence.json` |
| `fixtures/p2/mutations/hash-mismatch.design-system-ingestion-evidence.json` | `mutation` | `evidence` | `ingestion-evidence` | `invalid` | `blocked` | `["INGEST_EVIDENCE_HASH_MISMATCH"]` | `fixtures/p2/mutations/hash-mismatch.design-system-ingestion-evidence.json` |

## Positive Spectrum Coverage
Valid P2 coverage must prove that the selected Spectrum subset is not only blocked in invalid cases. The minimum positive coverage is:

- `fixtures/p2/valid/spectrum-button.design-source.json`: `components/button.json` can provide a source component ref, normalized id, props/options, variants, states, accessibility refs, examples, and token refs for the governed catalog subset.
- `fixtures/p2/valid/spectrum-in-line-alert.design-source.json`: `components/in-line-alert.json` can provide a source component ref, normalized id, props/options, variants, states, accessibility refs, examples, and token refs for the governed catalog subset.
- `fixtures/p2/valid/spectrum-subset.source-mapping.json`: mapping rows for both components include source refs, mapping refs, target refs, normalized ids, rationale, cardinality, conflict rules, authority scope, review status, and duplicate normalized-id handling.

## P2 Proof
The fixture set passes only when every expectation matches the manifest, every unexpected fixture is rejected, every expected diagnostic code is registry-backed, every review-required row remains non-promoted, and final evidence records the complete artifact order.

## Non-Goals
- No synthetic source fixture as the primary source.
- No live source connector fixture.
- No generated UI fixture.
- No agent-task fixture.
