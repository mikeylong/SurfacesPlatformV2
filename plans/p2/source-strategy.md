# Source Strategy

## Decision
P2 uses `design-system-source-bundle.v0` as the accepted P2 pilot source container. It is a local, hash-bound snapshot exported from a named real design-system source selected in `sources/p2/design-system-source/manifest.json`; it is not a synthetic replacement for the P0 fixture and not a placeholder bundle invented for the proof.

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
- `snapshotRoot`: `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package`;
- `sourceRefGrammar`;
- `initialComponents`: `["button", "in-line-alert"]`;
- `sourceFiles[]`: POSIX-relative source file paths, source type, source system, hash algorithm, SHA-256 hash, and source ref root;
- `requiredMappings[]`: mapping files that must be present before extraction, with mapping ref roots, hash algorithm, and SHA-256 hashes;
- `policyRefs[]`: structured usage, accessibility, and governance policy inputs;
- `generatedAt` and deterministic environment metadata.

The manifest is the source eligibility gate. Files absent from the manifest must not be read. Files present in the manifest but missing or hash-mismatched must block before extraction.

The manifest must identify the real pilot target before implementation begins. If source files, required mappings, policy refs, or per-file hashes are placeholders, P2 remains planned-only and no actual source bundle, generated artifacts, demo, CI success claim, or implemented ingestion evidence should be created.

## Initial Source Types
The first P2 source bundle may include:

- Figma variable exports for token source material;
- Figma component exports for component, variant, and component-property source material;
- Storybook or code-doc metadata for props, examples, states, and runtime constraints;
- structured usage-policy docs for accessibility, governance, and review requirements;
- explicit component mappings for source-to-catalog decisions.

P2 does not require every source type to exist. The manifest must declare which source types are in scope for the selected design system, and the proof must block when required source classes are absent.

## Target Design System
The target design system is Adobe Spectrum Design Data. The source manifest selects:

- `designSystemId`: `adobe-spectrum`;
- `designSystemName`: `Adobe Spectrum Design Data`;
- `packageName`: `@adobe/spectrum-design-data`;
- `packageVersion`: `0.7.0`;
- `packageIntegrity`: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`;
- first components: `button` and `in-line-alert`.

P2 implementation must not begin until the declared package files are copied into the local snapshot root with hashes. The manifest selects the P2 pilot target only; it is not a product-wide source policy or source-family taxonomy.

## Spectrum Source Snapshot Plan
The planned local snapshot root is:

```text
sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/
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

## P2 Eligibility Rules
- Figma exports may provide declared design variables, component variants, component properties, and design provenance when present in the manifest.
- Storybook or code-doc metadata may provide declared component API shape, prop types, examples, and runtime constraints when present in the manifest.
- Structured docs may provide usage, accessibility, governance, and review policy when present in the manifest.
- Mapping files are P2-local reconciliation records for declared source material. They must explain the mapping and preserve refs to the source entries they map.
- Mapping files must not add components, props, variants, actions, policies, or catalog behavior absent from manifest-declared source material.
- Production HTML can be used only as observed usage evidence in a later phase. It is not a P2 source input.

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
| Data bindings | Component/code metadata only when manifest-declared; absent for the initial npm-only subset unless source files declare them | Mapping cannot invent bindings absent from source |
| Governance | Declared policy refs in `guidelines/*.json` and local `docs/usage-policy.json` | Mapping may attach policy refs to catalog rules; missing policy blocks sensitive behavior |

## Non-Goals
- No remote source calls.
- No source crawling.
- No inference-only mapping.
- No production HTML extraction.
- No multi-design-system merge.
