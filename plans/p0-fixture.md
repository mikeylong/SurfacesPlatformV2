# P0 Fixture

## Decision
Use one synthetic golden fixture with three components to prove the whole P0 contract path. The fixture is purpose-built and does not copy an existing product design system.

## Goal
Create enough design-system source material to exercise components, props, variants, states, slots, actions/events, token refs, accessibility semantics, provenance, diagnostics, valid Surface IR, invalid Surface IR, review-required behavior, and adapter rejection.

## Inputs
- `schemas/runtime-catalog.v0.schema.json`.
- `schemas/surface-ir.v0.schema.json`.
- `schemas/fixture-expectations.v0.schema.json`.
- `schemas/extract.v0.schema.json`.
- `schemas/adapter-diagnostics.v0.schema.json`.
- `schemas/evidence.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- Product boundary rules.

## Fixture Files

```text
fixtures/p0/
  source.fixture.json
  expectations.manifest.json
  mutations/
    missing-required-field.source.fixture.json
    missing-source-ref.source.fixture.json
    unresolved-token-alias.source.fixture.json
    unresolved-json-pointer-ref.source.fixture.json
    unresolved-extends-target.source.fixture.json
    circular-token-alias.source.fixture.json
    circular-json-pointer-ref.source.fixture.json
    circular-extends.source.fixture.json
    invalid-extends-target-type.source.fixture.json
    composite-missing-subvalue.source.fixture.json
    composite-extra-subvalue.source.fixture.json
    composite-incompatible-subvalue.source.fixture.json
    duplicate-component-id.source.fixture.json
    implementation-token-child.extract.json
    implementation-token-child.catalog.json
    missing-provenance.extract.json
    hash-mismatch.evidence.json
  valid.surface-ir.json
  invalid/
    unknown-component.json
    unknown-prop.json
    unknown-variant.json
    unknown-state.json
    unknown-slot.json
    unknown-action.json
    unknown-event.json
    unknown-data-binding.json
    unknown-token-ref.json
    extra-property.json
    invalid-prop-type.json
    invalid-enum-value.json
    invalid-string-bounds.json
    missing-required-prop.json
    unsafe-markup.json
    illegal-slot-child.json
    slot-max-items.json
    disabled-action-execution.json
    invalid-a11y.json
    invalid-keyboard-contract.json
    invalid-focus-contract.json
    invalid-live-region.json
    modal-role-not-supported.json
  review/
    review-required-action.json
```

## Expected Artifacts

```text
artifacts/p0/
  extract.json
  catalog.json
  governed-catalog.json
  adapter-diagnostics.json
  evidence.json
```

## Component Coverage
- `Button`: props for `label`, `variant`, `size`, `disabled`, `icon`, and `loading`; variants for `primary`, `secondary`, and `danger`; states for `default`, `hover`, `focus`, `disabled`, and `loading`; action support for `submit` and `dismiss`.
- `StatusCallout`: props for `title`, `body`, `status`, and `dismissible`; variants for `info`, `success`, `warning`, and `critical`; status announcement accessibility semantics; optional action slot.
- `ConfirmPanel`: non-modal group only; slots for `heading`, `body`, `primaryAction`, `secondaryAction`, and `supportingContent`; allowed child components `Button` and `StatusCallout`; event support for `confirm` and `cancel`; one destructive/review-required action case.

## Mutation Fixture Matrix
Mutation fixtures exercise non-Surface-IR failure paths. Each mutation starts from the golden source or artifact named in the file and violates one rule. This table is explanatory; `fixtures/p0/expectations.manifest.json` is the machine-readable comparison reference.

Compile mutation coverage is intentionally limited to duplicate component ids through `CATALOG_DUPLICATE_ID` and generated artifact provenance through `PROVENANCE_MISSING`. Validate-stage failures, including unknown token refs, invalid values, accessibility failures, and invalid Surface IR paths, are covered under `invalid/`. Member-level duplicate ids are deferred beyond P1 unless a later phase adds dedicated mutation fixtures and registry rows.

| Fixture | Expected stage | Expected phase | Expected code |
| --- | --- | --- | --- |
| `mutations/missing-required-field.source.fixture.json` | `extract` | `source-mutation` | `EXTRACT_REQUIRED_FIELD_MISSING` |
| `mutations/missing-source-ref.source.fixture.json` | `extract` | `source-mutation` | `EXTRACT_SOURCE_REF_MISSING` |
| `mutations/unresolved-token-alias.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_UNRESOLVED` |
| `mutations/unresolved-json-pointer-ref.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_UNRESOLVED` |
| `mutations/unresolved-extends-target.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_UNRESOLVED` |
| `mutations/circular-token-alias.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_CIRCULAR` |
| `mutations/circular-json-pointer-ref.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_CIRCULAR` |
| `mutations/circular-extends.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_REFERENCE_CIRCULAR` |
| `mutations/invalid-extends-target-type.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_EXTENDS_INVALID` |
| `mutations/composite-missing-subvalue.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_COMPOSITE_INVALID` |
| `mutations/composite-extra-subvalue.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_COMPOSITE_INVALID` |
| `mutations/composite-incompatible-subvalue.source.fixture.json` | `extract` | `source-mutation` | `TOKEN_COMPOSITE_INVALID` |
| `mutations/duplicate-component-id.source.fixture.json` | `compile` | `source-mutation` | `CATALOG_DUPLICATE_ID` |
| `mutations/implementation-token-child.extract.json` | `validate` | `artifact-mutation` | `TOKEN_IMPLEMENTATION_METADATA_FORBIDDEN` |
| `mutations/implementation-token-child.catalog.json` | `validate` | `artifact-mutation` | `TOKEN_IMPLEMENTATION_METADATA_FORBIDDEN` |
| `mutations/missing-provenance.extract.json` | `compile` | `artifact-mutation` | `PROVENANCE_MISSING` |
| `mutations/hash-mismatch.evidence.json` | `validate` | `artifact-mutation` | `ARTIFACT_HASH_MISMATCH` |

## Invalid Fixture Matrix
Each invalid fixture violates one rule and must fail with the expected code. This table is explanatory; `fixtures/p0/expectations.manifest.json` is the machine-readable comparison reference.

| Fixture | Expected phase | Expected code |
| --- | --- | --- |
| `invalid/unknown-component.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_COMPONENT` |
| `invalid/unknown-prop.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_PROP` |
| `invalid/unknown-variant.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_VARIANT` |
| `invalid/unknown-state.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_STATE` |
| `invalid/unknown-slot.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_SLOT` |
| `invalid/unknown-action.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_ACTION` |
| `invalid/unknown-event.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_EVENT` |
| `invalid/unknown-data-binding.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_DATA_BINDING` |
| `invalid/unknown-token-ref.json` | `surface-ir-validation` | `CATALOG_UNKNOWN_TOKEN_REF` |
| `invalid/extra-property.json` | `surface-ir-validation` | `CATALOG_EXTRA_PROPERTY` |
| `invalid/invalid-prop-type.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-enum-value.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-string-bounds.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/missing-required-prop.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/unsafe-markup.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/illegal-slot-child.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/slot-max-items.json` | `surface-ir-validation` | `CATALOG_INVALID_VALUE` |
| `invalid/disabled-action-execution.json` | `adapter-conformance` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-a11y.json` | `surface-ir-validation` | `ACCESSIBILITY_LABEL_MISSING` |
| `invalid/invalid-keyboard-contract.json` | `surface-ir-validation` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/invalid-focus-contract.json` | `surface-ir-validation` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/invalid-live-region.json` | `surface-ir-validation` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/modal-role-not-supported.json` | `surface-ir-validation` | `ACCESSIBILITY_MODAL_UNSUPPORTED` |

## Review Fixture Matrix
Review fixtures are structurally valid and must not be treated as invalid validation failures. They must block unattended promotion. This table is explanatory; `fixtures/p0/expectations.manifest.json` is authoritative.

| Fixture | Expected code | Validation result | Promotion status |
| --- | --- | --- | --- |
| `review/review-required-action.json` | `GOVERNANCE_REVIEW_REQUIRED` | `valid` | `review_required` |

## Golden Content Requirements
`source.fixture.json` must contain:

- fixture metadata: `fixtureId`, `version`, `sourceUri`, `sourceHash`, and `generatedAt`.
- DTCG 2025.10-compatible token subset for color, spacing, radius, typography, shadow, and motion tokens used by the fixture, including `$value`, `$type`, `$description`, `$extensions`, alias references, `$ref`, `$extends`, and composite token examples.
- component definitions for `Button`, `StatusCallout`, and `ConfirmPanel`.
- source refs for every token, component, prop, variant, state, slot, action, event, data binding, accessibility contract, and example.
- governance metadata for the destructive `ConfirmPanel.primaryAction` case.

For golden fixtures, `generatedAt` is fixed to `1970-01-01T00:00:00.000Z`. Implementations may only use real timestamps outside golden comparison mode, and any timestamp override must be recorded in evidence environment metadata.

`expectations.manifest.json` must conform to `schemas/fixture-expectations.v0.schema.json` and contain:

- `schemaId`: `fixture-expectations.v0`.
- `version`.
- `fixtureRoot`: `fixtures/p0`.
- `schemaRoot`: `schemas`.
- `artifactRoot`: `artifacts/p0`.
- `runExpectation`: expected proof `status` and aggregate `promotionStatus`; the P0 fixture expects `status: pass` and `promotionStatus: review_required`.
- `inputs[]`: every mutation, valid, invalid, and review fixture path.
- `expectations[]`: fixture path, fixture kind (`mutation`, `valid`, `invalid`, or `review`), expected stage (`extract`, `compile`, `govern`, `validate`, `adapter-conformance`, or `evidence`), expected phase (`source-mutation`, `artifact-mutation`, `surface-ir-validation`, `adapter-conformance`, or `review`), validation result, promotion status, expected diagnostic codes, expected artifact path, expected JSON Pointer, and required source ref.
- `artifactOrder[]`: expected final evidence artifact ordering.

`valid.surface-ir.json` must instantiate `ConfirmPanel` with allowed `Button` and `StatusCallout` children, approved token refs, valid accessibility refs, no modal or `alertdialog` semantics, and no destructive action execution.

## Golden Artifact Requirements
`artifacts/p0/extract.json` must conform to `schemas/extract.v0.schema.json` and contain normalized source material only: tokens, components, variants, states, slots, actions, events, data bindings, accessibility contracts, examples, source refs, and extraction provenance.

`artifacts/p0/catalog.json` must conform to `schemas/runtime-catalog.v0.schema.json`, set `artifactKind` to `catalog`, and include the exact empty governance shape defined in [Runtime Catalog v0](runtime-catalog-v0.md).

`artifacts/p0/governed-catalog.json` must conform to `schemas/runtime-catalog.v0.schema.json`, set `artifactKind` to `governed-catalog`, and include populated governance rule/result maps for `allowed`, `review_required`, and `blocked` usage.

`artifacts/p0/adapter-diagnostics.json` must conform to `schemas/adapter-diagnostics.v0.schema.json`, contain the conformance matrix result for valid, invalid, and review fixtures, and embed diagnostics conforming to `schemas/diagnostics.v0.schema.json`.

`artifacts/p0/evidence.json` must be finalized last and contain hashes/provenance for P0-owned schemas, source fixture, mutation fixtures, valid fixture, invalid fixtures, review fixtures, generated artifacts, adapter diagnostics, and itself under the fixed null-placeholder self-hash rule.

## P0 Proof
The fixture compiles deterministically through `artifacts/p0/extract.json`, `artifacts/p0/catalog.json`, and `artifacts/p0/governed-catalog.json`. `fixtures/p0/valid.surface-ir.json` passes validation. Every invalid fixture fails with its expected diagnostic code. Every review fixture is structurally valid, records `review_required`, and blocks unattended promotion. The results appear in both `artifacts/p0/adapter-diagnostics.json` and final `artifacts/p0/evidence.json`.

## Non-Goals
- No real customer or product design system.
- No live Figma file.
- No Storybook scraping.
- No renderer implementation.
- No A2UI compatibility fixture without a separate A2UI-specific P5 proof.
- No deprecated-entry or warning-only fixture behavior.
- No modal dialog or `alertdialog` behavior.

## Closed P0 Decisions
- Fixture examples are JSON only for P0.
- Destructive behavior is included only as `review_required`; it is not executed.
- File names and folder layout are fixed by this document.
- `ConfirmPanel` modal dialog and `alertdialog` semantics are deferred beyond P1 and remain unsupported in P0/P1.
