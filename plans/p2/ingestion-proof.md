# Ingestion Proof

## Decision
P2 proof emits deterministic ingestion artifacts for a declared real design-system source bundle. The proof validates source inventory, source mapping, extraction, catalog compilation, governance, report rows, diagnostics, and final evidence.

## Goal
Show that Surfaces can move from synthetic fixture extraction to a real design-system source without losing provenance, diagnostics, review routing, or reproducibility.

## Inputs
- `sources/p2/design-system-source/manifest.json`.
- Declared source files under `sources/p2/design-system-source/`.
- P2 fixtures and expectations manifest.
- P2 schemas.

## Outputs
- `schemas/design-source-manifest.v0.schema.json`.
- `schemas/design-source-inventory.v0.schema.json`.
- `schemas/design-source-mapping.v0.schema.json`.
- `schemas/design-system-ingestion-report.v0.schema.json`.
- `artifacts/p2/source-inventory.json`.
- `artifacts/p2/source-mapping.json`.
- `artifacts/p2/extract.json`.
- `artifacts/p2/catalog.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p2/ingestion-report.json`.

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
| `componentMappings` | object | yes | Source component ids to catalog component ids |
| `tokenMappings` | object | yes | Source token ids to catalog token refs |
| `policyMappings` | object | yes | Source usage policies to governance rules |
| `reviewRequired` | array | yes | Mapping decisions requiring human review |
| `diagnostics` | array | yes | P2 ingestion diagnostics |
| `provenance` | object | yes | Source refs and deterministic environment |

## Extraction Rules
- Extraction reads only files declared in the source manifest.
- Extraction must preserve source refs for every emitted token, component, prop, variant, state, slot, action, event, data binding, accessibility contract, example, and governance rule.
- Unsupported source material must produce diagnostics.
- Ambiguous source material must block or route to review.
- Manual mappings must preserve refs to both the source entry and mapping entry.
- Generated `extract.json`, `catalog.json`, and `governed-catalog.json` must use the same catalog discipline as P0 while recording P2 source refs.

## Report Behavior
`ingestion-report.json` records:

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
The proof passes when the source bundle is hash-bound, source inventory and mapping are deterministic, extraction preserves source refs, catalog artifacts validate, all invalid and mutation fixtures fail with expected diagnostics, review-required rows remain non-promoted, the report matches the manifest, and final evidence is reproducible.

## Non-Goals
- No remote source lifecycle.
- No visual diff.
- No runtime projection.
- No action execution.
- No agent work-order generation.
