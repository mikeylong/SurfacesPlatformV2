# Source Strategy

## Decision
P2 uses `design-system-source-bundle.v0` as the accepted P2 pilot source container. It is a local, hash-bound snapshot exported from a named real design-system source selected in `sources/p2/design-system-source/manifest.json`; it is not a synthetic replacement for the P0 fixture and not a placeholder bundle invented for the proof. The package portion is bound by review-controlled `package-snapshot.lock.json`, seeded during a separate SRI and tarball verification.

This keeps the proof deterministic while moving beyond P0 synthetic fixture extraction. It does not settle the universal product source policy decision; [VISION](../../VISION.md#real-design-system-extraction) remains canonical for the authority model and future source-family choices.

## Goal
Define how real design-system source material becomes eligible for P2 extraction without relying on live API calls, crawlers, or agent inference.

## Source Bundle Contract
`sources/p2/design-system-source/manifest.json` must declare:

- `schemaId`: `design-source-manifest.v0`;
- `version`;
- `designSystemId`;
- `designSystemName`;
- `sourceFamily`: `design-system-source-bundle.v0`;
- `packageName`: `@adobe/spectrum-design-data`;
- `packageVersion`: `0.7.0`;
- `packageIntegrity`: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`;
- `packageTarball`: `https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz`;
- `packageSnapshotLock`: exact path, `design-source-package-snapshot-lock.v0` schema id, `sha256` hash algorithm, and raw lock-file `sha256`;
- `snapshotRoot`: `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package`;
- `sourceRefGrammar`;
- `initialComponents`: `["button", "in-line-alert"]`;
- `sourceFiles[]`: POSIX-relative source file paths, source type, source system, hash algorithm, SHA-256 hash, and source ref root;
- `requiredMappings[]`: mapping files that must be present before extraction, with mapping ref roots, hash algorithm, and SHA-256 hashes;
- `policyRefs[]`: structured usage, accessibility, and governance policy inputs;
- `generatedAt` and deterministic environment metadata.

The manifest is the source eligibility gate. Files absent from the manifest must not be read. Files present in the manifest but missing or hash-mismatched must block before extraction.

The manifest identifies the real pilot target. If source files, required mappings, policy refs, or per-file hashes become placeholders, the P2 proof is invalid and no source bundle, generated artifacts, demo, CI success claim, or ingestion evidence claim should be accepted.

## Immutable Package Snapshot Lock
`schemas/design-source-package-snapshot-lock.v0.schema.json` defines `design-source-package-snapshot-lock.v0`. The checked-in `sources/p2/design-system-source/package-snapshot.lock.json` closes `schemaId`, `version`, `packageName`, `packageVersion`, `packageTarball`, `packageIntegrity`, `tarballHashAlgorithm`, `tarballSha256`, `packageRoot`, `packageFiles`, and `provenance`. It fixes the exact 31-entry P2 package-file order. Each package-file row contains `packagePath`, `hashAlgorithm: "sha256"`, and the raw-byte `sha256` from the unpacked tarball.

The lock is created only from the pinned npm tarball after the downloaded tarball passes its declared SRI check during a review-time ceremony. Ordinary `materialize:p2` execution is offline with respect to this lock: it schema-validates the checked-in lock, recursively compares the exact local package-file set and raw bytes, and fails when they differ. It never fetches or reconstructs the tarball, rewrites `package-snapshot.lock.json`, or recomputes the lock from the current workspace as a way to accept drift. Passing deterministic proof establishes local lock conformance; the external download ceremony remains a reviewed provenance input rather than a retained proof artifact.

The source manifest remains generated metadata, but its `packageSnapshotLock` ref must resolve to the immutable lock with the exact path, schema id, hash algorithm, and raw lock-file hash. This separates immutable package-byte identity from the per-source hashes materialized into `manifest.json`.

## Current P2 Source Inputs
The current P2 source bundle is limited to:

- the review-controlled `package-snapshot.lock.json` seeded from the pinned tarball verification;
- the pinned local `@adobe/spectrum-design-data@0.7.0` snapshot under `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/`;
- local `mappings/component-map.json`, `mappings/token-map.json`, and `mappings/policy-map.json` reconciliation files;
- local `docs/usage-policy.json` policy input plus declared Spectrum `guidelines/*.json` package files.

Only Spectrum `button` and `in-line-alert` may be extracted in current P2. The manifest records this closed file set and its hashes; it does not make other source types eligible.

## Future Source-Family Options
Figma exports, Storybook or code-doc metadata, Code Connect mappings, docs crawlers, production HTML, and any other source family require later connector-specific proofs before becoming source inputs. P2 may mention those families only as future options; they cannot appear as current P2 bundle inputs even if copied under the source directory.

## Target Design System
The target design system is Adobe Spectrum Design Data. The source manifest selects:

- `designSystemId`: `adobe-spectrum`;
- `designSystemName`: `Adobe Spectrum Design Data`;
- `packageName`: `@adobe/spectrum-design-data`;
- `packageVersion`: `0.7.0`;
- `packageIntegrity`: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`;
- first components: `button` and `in-line-alert`.

The declared package files are copied from the SRI-verified tarball into the local snapshot root during the review-time provenance ceremony, then recorded in the snapshot lock before normal proof execution. Later materialization compares the exact file set and bytes with the lock and fails on drift instead of updating the lock. The deterministic proof does not replay the tarball download. The manifest selects the P2 pilot target only; it is not a product-wide source policy or source-family taxonomy.

## Spectrum Source Snapshot Plan
The local snapshot root is:

```text
sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/
```

The sibling immutable lock is:

```text
sources/p2/design-system-source/package-snapshot.lock.json
```

The first source manifest must declare at least these Spectrum package paths:

| Source class | Required package paths |
| --- | --- |
| Package metadata | `package.json`, `README.md`, `LICENSE` |
| Components | `components/button.json`, `components/in-line-alert.json` |
| Component registry | `registry/components.json`, `registry/property-terms.json`, `registry/variants.json`, `registry/states.json`, `registry/anatomy-terms.json`, `registry/token-terminology.json`, `registry/token-objects.json` |
| Tokens | `tokens/color-component.tokens.json`, `tokens/color-aliases.tokens.json`, `tokens/color-palette.tokens.json`, `tokens/layout-component.tokens.json`, `tokens/layout.tokens.json`, `tokens/typography.tokens.json` |
| Modes and fields | `mode-sets/color-scheme.json`, `mode-sets/contrast.json`, `mode-sets/scale.json`, `fields/variant.json`, `fields/state.json`, `fields/size.json`, `fields/property.json`, `fields/anatomy.json` |
| Accessibility and usage policy | `guidelines/developer-overview.json`, `guidelines/states.json`, `guidelines/colors.json`, `guidelines/spacing.json`, `guidelines/typography-fundamentals.json` |
| Mappings | `mappings/component-map.json`, `mappings/token-map.json`, `mappings/policy-map.json` |

The first source manifest may declare more package files if the proof needs them, but it must not read files outside the manifest.

## Source Ref Grammar
Spectrum source refs are URI-like strings with a package-qualified authority and an RFC 6901 JSON Pointer:

```text
spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/<posix-package-path>#<rfc6901-json-pointer>
```

Rules:

- `<posix-package-path>` is the path inside the unpacked npm tarball, such as `components/button.json`.
- `<rfc6901-json-pointer>` starts with `/`; use `#/` for the document root.
- Source refs must identify manifest-declared files only.
- Package, version, and path casing are exact.
- Host-derived fields remain `null`; source refs must not embed local absolute paths.

Mapping refs use this grammar:

```text
mapping://p2/spectrum/<mapping-file>#<rfc6901-json-pointer>
```

Local policy refs use this grammar:

```text
source://p2/docs/usage-policy.json#<rfc6901-json-pointer>
```

Local policy refs must point to manifest-declared policy files under `sources/p2/design-system-source/docs/`. They may provide usage, accessibility, and governance policy refs for mapped Spectrum source material, but they do not authorize components, tokens, variants, states, slots, actions, or catalog behavior absent from the declared Spectrum snapshot.

## P2 Eligibility Rules
- The local package snapshot must match every ordered `packageFiles[]` row in the immutable lock before manifest materialization or proof extraction can continue.
- A package-byte mismatch emits `INGEST_PACKAGE_SNAPSHOT_LOCK_MISMATCH`; materialization must not update the lock or manifest hashes to make the changed bytes eligible.
- P2 source eligibility is limited to the pinned local `@adobe/spectrum-design-data@0.7.0` snapshot, local mappings, and local policy files declared by the manifest.
- The eligible component subset is limited to Spectrum `button` and `in-line-alert`.
- Figma exports, Storybook or code-doc metadata, Code Connect mappings, docs crawlers, production HTML, and any other source family are future connector-specific proof targets, not current eligible inputs.
- Mapping files are P2-local reconciliation records for declared source material. They must explain the mapping and preserve refs to the source entries they map.
- Mapping files must not add components, props, variants, actions, policies, or catalog behavior absent from manifest-declared source material.

## Spectrum Authority Matrix
This matrix defines which Spectrum package files may authorize each extraction class for the first subset. Mapping files can narrow or explain these rows, but cannot authorize behavior absent from the declared Spectrum files.

| Extraction class | Spectrum authority | Mapping role |
| --- | --- | --- |
| Tokens | `tokens/*.tokens.json`, `registry/token-terminology.json`, `registry/token-objects.json`, `mode-sets/*.json` | Normalize token ids and reject unsupported modes; cannot invent token values or modes |
| Components | `components/button.json`, `components/in-line-alert.json`, `registry/components.json` | Normalize component ids and subset the first components |
| Props/options | Component JSON plus `registry/property-terms.json`, `fields/property.json`, `fields/size.json`, `fields/variant.json` | Map supported prop names/options to catalog props; unmapped or ambiguous props block or require review |
| Variants | Component JSON plus `registry/variants.json`, `fields/variant.json` | Resolve one deterministic variant mapping per target; ambiguous variants block |
| States | Component JSON plus `registry/states.json`, `fields/state.json`, `guidelines/states.json` | Map only states present in Spectrum sources |
| Slots/anatomy | Component JSON plus `registry/anatomy-terms.json`, `fields/anatomy.json` | Map source anatomy to catalog slots when cardinality is explicit |
| Accessibility | Component JSON accessibility entries when present plus declared `guidelines/*.json` policy refs | Preserve source refs and block missing required accessibility policy |
| Examples | Component JSON examples when present plus package README or declared guidelines | Examples are evidence and fixture coverage only; they cannot add catalog behavior |
| Actions | Component JSON event/action affordances when present plus governance policy refs | Actions remain inert descriptors and require explicit source and policy refs |
| Data bindings | None in the current P2 source set | Not authorized in P2; future Storybook/code metadata would require a later connector-specific proof |
| Governance | Declared policy refs in `guidelines/*.json` and local `docs/usage-policy.json` | Mapping may attach policy refs to catalog rules; missing policy blocks sensitive behavior |

## Non-Goals
- No remote source calls.
- No Figma export ingestion.
- No Storybook or code-doc metadata ingestion.
- No Code Connect mapping ingestion.
- No source crawling or docs crawling.
- No inference-only mapping.
- No production HTML extraction.
- No multi-design-system merge.
