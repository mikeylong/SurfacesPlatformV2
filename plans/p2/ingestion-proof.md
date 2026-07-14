# Ingestion Proof

## Decision
P2 proof emits deterministic ingestion artifacts for a declared real design-system source bundle. The proof validates source inventory, source mapping, extraction, catalog compilation, governance, report rows, diagnostics, and final evidence.

## Goal
Show that Surfaces can move from synthetic fixture extraction to a real design-system source without losing provenance, diagnostics, review routing, or reproducibility.

## Inputs
- `sources/p2/design-system-source/package-snapshot.lock.json`.
- `sources/p2/design-system-source/manifest.json`.
- Declared source files under `sources/p2/design-system-source/`.
- P2 fixtures and expectations manifest.
- P2-owned schemas and consumed shared schemas.

## Outputs
- `schemas/design-source-package-snapshot-lock.v0.schema.json`.
- `schemas/design-source-manifest.v0.schema.json`.
- `schemas/design-source-inventory.v0.schema.json`.
- `schemas/design-source-mapping.v0.schema.json`.
- `schemas/design-system-ingestion-report.v0.schema.json`.
- `schemas/design-system-ingestion-evidence.v0.schema.json`.
- `schemas/design-system-ingestion-expectations.v0.schema.json`.
- `schemas/design-system-ingestion-diagnostics.v0.schema.json`.
- `schemas/design-system-ingestion-valid-fixture.v0.schema.json`.
- `artifacts/p2/source-inventory.json`.
- `artifacts/p2/source-mapping.json`.
- `artifacts/p2/extract.json`.
- `artifacts/p2/catalog.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p2/ingestion-report.json`.

## Immutable Snapshot Preflight
P2 validates `package-snapshot.lock.json` before it accepts the generated source manifest or writes a proof artifact. The lock conforms to `design-source-package-snapshot-lock.v0`, identifies the pinned tarball and SRI, records the tarball SHA-256, and lists the exact ordered package paths with raw-byte SHA-256 hashes.

Normal materialization recursively enumerates the checked-in package tree and compares its exact file set and bytes with the immutable lock. Extra, missing, symlinked, non-regular, or byte-drifted package inputs fail closed with `INGEST_PACKAGE_SNAPSHOT_LOCK_MISMATCH` and canonical message `Local package snapshot does not match the immutable npm snapshot lock.` Materialization never generates, updates, or rewrites the lock.

The generated source manifest carries `packageSnapshotLock` with the exact lock path, schema id, `hashAlgorithm: "sha256"`, and raw lock-file `sha256`. Strict proof preflight validates this tuple before inventory and extraction.

## Source Inventory Shape
`design-source-inventory.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `design-source-inventory.v0` |
| `version` | string | yes | Semver |
| `sourceManifestRef` | object | yes | Path, schema id, and hash for `sources/p2/design-system-source/manifest.json` |
| `sourceFiles` | array | yes | Declared source paths, source types, hashes, and source ref roots |
| `sourceCoverage` | object | yes | Components, tokens, docs, policies, and mappings found |
| `diagnostics` | array | yes | P2 ingestion diagnostics |
| `provenance` | object | yes | Source refs, generator metadata, deterministic environment |

## Source Mapping Shape
`design-source-mapping.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `design-source-mapping.v0` |
| `version` | string | yes | Semver |
| `sourceInventoryRef` | object | yes | Path, schema id, and hash for `artifacts/p2/source-inventory.json` |
| `mappingRows` | array | yes | Strict reconciliation rows for components, tokens, props, variants, states, slots, accessibility, examples, actions, data bindings, and governance |
| `reviewRequired` | array | yes | Mapping decisions requiring human review |
| `diagnostics` | array | yes | P2 ingestion diagnostics |
| `provenance` | object | yes | Source refs and deterministic environment |

Each `mappingRows[]` entry must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `mappingId` | string | yes | Deterministic unique id |
| `mappingKind` | enum | yes | `component`, `token`, `prop`, `variant`, `state`, `slot`, `accessibility`, `example`, `action`, `dataBinding`, or `governance` |
| `sourceRefs` | array | yes | One or more Spectrum source refs using the package-qualified grammar |
| `mappingRefs` | array | yes | One or more refs into declared mapping files |
| `targetRefs` | array | yes | One or more catalog target refs, such as `catalog://p2/components/Button` |
| `normalizedId` | string | yes | Canonical normalized id emitted by extraction or compilation |
| `rationale` | string | yes | Human-readable reason for the mapping decision |
| `cardinality` | object | yes | Source min/max and target min/max counts for the mapped relationship |
| `conflictRules` | array | yes | Duplicate-id, precedence, and review behavior for conflicting source material |
| `authorityScope` | enum | yes | `source-only`, `mapping-narrows-source`, or `review-required`; never `mapping-adds-authority` |
| `reviewStatus` | enum | yes | `accepted`, `review_required`, or `rejected` |

Duplicate `normalizedId` values are invalid unless all rows sharing the id declare a deterministic conflict rule that points to the same source refs, mapping refs, and target refs. Duplicate ids without that rule emit `INGEST_NORMALIZED_ID_DUPLICATE`.

Mapping row refs and cardinality are independently validated. Missing or malformed `sourceRefs`, `mappingRefs`, or `targetRefs` emit `INGEST_MAPPING_ROW_REF_INVALID`; absent or incompatible cardinality emits `INGEST_MAPPING_CARDINALITY_INVALID`.

Mapping rows are reconciliation-only. They may narrow, rename, normalize, or require review for manifest-declared Spectrum source material, but they must not create catalog behavior absent from source refs. Attempts to do so emit `INGEST_MAPPING_AUTHORITY_ESCALATION`.

## Extraction Rules
- Extraction starts only after the local package snapshot matches the immutable lock and the manifest lock ref validates.
- Extraction reads only files declared in the source manifest.
- Extraction must preserve source refs for every emitted token, component, prop, variant, state, slot, action, event, data binding, accessibility contract, example, and governance rule.
- Unsupported source material must produce diagnostics.
- Ambiguous source material must block or route to review.
- Manual mappings must preserve refs to the source entry, mapping entry, and catalog target entry.
- Generated `extract.json`, `catalog.json`, and `governed-catalog.json` must use the same catalog discipline as P0 while recording P2 source refs.

## Report Behavior
`ingestion-report.json` records:

- immutable package snapshot lock validation;
- source manifest validation;
- source inventory results;
- source mapping results;
- extraction results;
- catalog compilation results;
- governance results;
- review-required mapping rows;
- invalid and mutation fixture outcomes;
- diagnostics with canonical messages;
- aggregate status and promotion status.

The report is produced before final evidence and is included in the P2 evidence artifact order.

## P2 Proof
The proof passes when the local package bytes match the immutable tarball-derived lock, the source bundle is hash-bound, source inventory and mapping are deterministic, extraction preserves source refs, catalog artifacts validate, all invalid and mutation fixtures fail with expected diagnostics, the causal byte-tamper case fails against the unchanged lock, review-required rows remain non-promoted, the report matches the manifest, and final evidence is reproducible.

## Non-Goals
- No remote source lifecycle.
- No normal materialization path that creates or refreshes `package-snapshot.lock.json`.
- No visual diff.
- No runtime projection.
- No action execution.
- No agent work-order generation.
