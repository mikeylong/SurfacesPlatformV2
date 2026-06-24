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
- `sourceFiles[]`: POSIX-relative source file paths, source type, source system, hash algorithm, SHA-256 hash, and source ref root;
- `requiredMappings[]`: mapping files that must be present before extraction;
- `policyRefs[]`: structured usage, accessibility, and governance policy inputs;
- `generatedAt` and deterministic environment metadata.

The manifest is the source eligibility gate. Files absent from the manifest must not be read. Files present in the manifest but missing or hash-mismatched must block before extraction.

The manifest must identify the real pilot target before implementation begins. If `designSystemId`, `designSystemName`, source files, required mappings, or policy refs are placeholders, P2 remains planned-only and no P2 schemas, fixtures, artifacts, or source bundle should be created.

## Initial Source Types
The first P2 source bundle may include:

- Figma variable exports for token source material;
- Figma component exports for component, variant, and component-property source material;
- Storybook or code-doc metadata for props, examples, states, and runtime constraints;
- structured usage-policy docs for accessibility, governance, and review requirements;
- explicit component mappings for source-to-catalog decisions.

P2 does not require every source type to exist. The manifest must declare which source types are in scope for the selected design system, and the proof must block when required source classes are absent.

## Target Design System
The target design system is selected by `designSystemId` and `designSystemName` in the source manifest. P2 implementation must not begin until those fields identify a real, authoritative design-system source and the declared files are available as local exports with hashes. The manifest selects the P2 pilot target only; it is not a product-wide source policy or source-family taxonomy.

## P2 Eligibility Rules
- Figma exports may provide declared design variables, component variants, component properties, and design provenance when present in the manifest.
- Storybook or code-doc metadata may provide declared component API shape, prop types, examples, and runtime constraints when present in the manifest.
- Structured docs may provide usage, accessibility, governance, and review policy when present in the manifest.
- Mapping files are P2-local reconciliation records for declared source material. They must explain the mapping and preserve refs to the source entries they map.
- Mapping files must not add components, props, variants, actions, policies, or catalog behavior absent from manifest-declared source material.
- Production HTML can be used only as observed usage evidence in a later phase. It is not a P2 source input.

## Non-Goals
- No remote source calls.
- No source crawling.
- No inference-only mapping.
- No production HTML extraction.
- No multi-design-system merge.
