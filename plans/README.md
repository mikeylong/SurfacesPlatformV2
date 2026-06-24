# SurfacesPlatformV2 Subplans

These subplans define the Surfaces Platform proof contracts and their materialized schemas, fixtures, artifacts, demos, scripts, and tests. P0 specifies the first executable catalog, validation, adapter-diagnostics, and evidence proof. P1 specifies the first runtime projection and adapter proof without turning the demo into an unaudited product mock.

## P0 Dependency Order
1. [Runtime Catalog v0](runtime-catalog-v0.md)
2. [Product Boundaries](product-boundaries.md)
3. [P0 Fixture](p0-fixture.md)
4. [Design-System Extractor](design-system-extractor.md)
5. [Catalog Compiler](catalog-compiler.md)
6. [Governance Layer](governance-layer.md)
7. [Generation Harness](generation-harness.md)
8. [Adapter Conformance](adapter-conformance.md)
9. [Validation and Evidence](validation-evidence.md)
10. [Runtime Adapter](runtime-adapter.md)

## P1 Dependency Order
1. [P1 Subplan Index](p1/README.md)
2. [P1 Product Boundaries](p1/product-boundaries.md)
3. [Runtime Projection v0](p1/runtime-projection-v0.md)
4. [P1 Fixture](p1/p1-fixture.md)
5. [Runtime Adapter Proof](p1/runtime-adapter-proof.md)
6. [P1 Validation And Evidence](p1/validation-evidence.md)
7. [Demo And CI](p1/demo-ci.md)

## P0 Contract Layout

```text
schemas/
  runtime-catalog.v0.schema.json
  surface-ir.v0.schema.json
  fixture-expectations.v0.schema.json
  extract.v0.schema.json
  adapter-diagnostics.v0.schema.json
  evidence.v0.schema.json
  diagnostics.v0.schema.json

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

artifacts/p0/
  extract.json
  catalog.json
  governed-catalog.json
  adapter-diagnostics.json
  evidence.json
```

## Proof Command

```bash
interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0
```

## Pass Condition
Given the P0 fixture, the proof command emits all expected artifacts, valid Surface IR passes, source/artifact mutations fail in their expected stage, invalid Surface IR fixtures fail in their expected phase with expected diagnostic codes, review fixtures are structurally valid but block unattended promotion, adapter diagnostics are produced before final evidence, and evidence contains reproducible hashes and provenance for every artifact.

## Source Of Truth
`runtime-catalog-v0.md` is the source of truth for the P0 catalog shape. `validation-evidence.md` is the source of truth for evidence and diagnostic requirements. Other subplans may reference those contracts, but they must not redefine them.

## Diagnostics Registry
`schemas/diagnostics.v0.schema.json` must encode this registry. Codes not listed here are invalid in P0. Each row defines the exact default diagnostic fields; artifact-specific paths may be more precise but must use the same artifact root and JSON Pointer form. `canonicalMessage` is row-specific, even when multiple rows share a code, and is the only diagnostic wording used for golden evidence hashing or manifest comparison.

| Code | Trigger | `canonicalMessage` | Stage | Severity | Promotion status | Artifact path | JSON Pointer | Source ref | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SCHEMA_VALIDATION_FAILED` | JSON Schema validation fails for any checked artifact | Schema validation failed for the checked artifact. | `validate` | `error` | `blocked` | `checked artifact` | `/` | `null` | `manifest-wide` |
| `EXTRACT_REQUIRED_FIELD_MISSING` | Required source fixture field is absent | Required source fixture field is missing. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/missing-required-field.source.fixture.json` | `/fixtureId` | `fixture://p0/source#/fixtureId` | `mutations/missing-required-field.source.fixture.json` |
| `EXTRACT_SOURCE_REF_MISSING` | Source ref is absent or invalid | Source reference is missing or invalid. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/missing-source-ref.source.fixture.json` | `/components/0/sourceRef` | `null` | `mutations/missing-source-ref.source.fixture.json` |
| `TOKEN_REFERENCE_UNRESOLVED` | Token alias target cannot be resolved | Token alias target cannot be resolved. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/unresolved-token-alias.source.fixture.json` | `/tokens/color/action/brokenAlias/$value` | `fixture://p0/source#/tokens/color/action/brokenAlias` | `mutations/unresolved-token-alias.source.fixture.json` |
| `TOKEN_REFERENCE_UNRESOLVED` | JSON Pointer $ref target cannot be resolved | JSON Pointer reference target cannot be resolved. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/unresolved-json-pointer-ref.source.fixture.json` | `/tokens/color/action/brokenPointer/$ref` | `fixture://p0/source#/tokens/color/action/brokenPointer` | `mutations/unresolved-json-pointer-ref.source.fixture.json` |
| `TOKEN_REFERENCE_UNRESOLVED` | $extends target cannot be resolved | Token group extends target cannot be resolved. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/unresolved-extends-target.source.fixture.json` | `/tokens/spacing/compact/$extends` | `fixture://p0/source#/tokens/spacing/compact` | `mutations/unresolved-extends-target.source.fixture.json` |
| `TOKEN_REFERENCE_CIRCULAR` | Token alias resolution creates a cycle | Token alias resolution contains a cycle. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/circular-token-alias.source.fixture.json` | `/tokens/color/cycle/a/$value` | `fixture://p0/source#/tokens/color/cycle/a` | `mutations/circular-token-alias.source.fixture.json` |
| `TOKEN_REFERENCE_CIRCULAR` | JSON Pointer $ref resolution creates a cycle | JSON Pointer reference resolution contains a cycle. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/circular-json-pointer-ref.source.fixture.json` | `/tokens/color/pointerCycle/a/$ref` | `fixture://p0/source#/tokens/color/pointerCycle/a` | `mutations/circular-json-pointer-ref.source.fixture.json` |
| `TOKEN_REFERENCE_CIRCULAR` | $extends resolution creates a cycle | Token group extends resolution contains a cycle. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/circular-extends.source.fixture.json` | `/tokens/spacing/cycleA/$extends` | `fixture://p0/source#/tokens/spacing/cycleA` | `mutations/circular-extends.source.fixture.json` |
| `TOKEN_EXTENDS_INVALID` | $extends resolves to a token, non-group, or non-object target | Token group extends target must resolve to a group object. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/invalid-extends-target-type.source.fixture.json` | `/tokens/spacing/compact/$extends` | `fixture://p0/source#/tokens/spacing/compact` | `mutations/invalid-extends-target-type.source.fixture.json` |
| `TOKEN_COMPOSITE_INVALID` | Composite token is missing a required sub-value | Composite token is missing a required sub-value. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/composite-missing-subvalue.source.fixture.json` | `/tokens/typography/heading/$value/lineHeight` | `fixture://p0/source#/tokens/typography/heading` | `mutations/composite-missing-subvalue.source.fixture.json` |
| `TOKEN_COMPOSITE_INVALID` | Composite token contains an extra sub-value not allowed by its token type | Composite token contains an unsupported extra sub-value. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/composite-extra-subvalue.source.fixture.json` | `/tokens/shadow/raised/$value/opacity` | `fixture://p0/source#/tokens/shadow/raised` | `mutations/composite-extra-subvalue.source.fixture.json` |
| `TOKEN_COMPOSITE_INVALID` | Composite token contains an incompatible typed sub-value | Composite token contains an incompatible sub-value type. | `extract` | `error` | `blocked` | `fixtures/p0/mutations/composite-incompatible-subvalue.source.fixture.json` | `/tokens/shadow/raised/$value/blur` | `fixture://p0/source#/tokens/shadow/raised` | `mutations/composite-incompatible-subvalue.source.fixture.json` |
| `CATALOG_DUPLICATE_ID` | Duplicate component id | Catalog contains a duplicate component id. | `compile` | `error` | `blocked` | `fixtures/p0/mutations/duplicate-component-id.source.fixture.json` | `/components/3/id` | `fixture://p0/source#/components/3` | `mutations/duplicate-component-id.source.fixture.json` |
| `CATALOG_UNKNOWN_COMPONENT` | Surface IR references an unknown component | Surface IR references an unknown component. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-component.json` | `/root/component` | `fixture://p0/invalid/unknown-component#/root` | `invalid/unknown-component.json` |
| `CATALOG_UNKNOWN_PROP` | Surface IR references an unknown prop | Surface IR references an unknown prop. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-prop.json` | `/root/props/eyebrow` | `fixture://p0/invalid/unknown-prop#/root/props/eyebrow` | `invalid/unknown-prop.json` |
| `CATALOG_UNKNOWN_VARIANT` | Surface IR references an unknown variant | Surface IR references an unknown variant. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-variant.json` | `/root/variant` | `fixture://p0/invalid/unknown-variant#/root/variant` | `invalid/unknown-variant.json` |
| `CATALOG_UNKNOWN_STATE` | Surface IR references an unknown state | Surface IR references an unknown state. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-state.json` | `/root/state` | `fixture://p0/invalid/unknown-state#/root/state` | `invalid/unknown-state.json` |
| `CATALOG_UNKNOWN_SLOT` | Surface IR references an unknown slot | Surface IR references an unknown slot. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-slot.json` | `/root/slots/footer` | `fixture://p0/invalid/unknown-slot#/root/slots/footer` | `invalid/unknown-slot.json` |
| `CATALOG_UNKNOWN_ACTION` | Surface IR references an unknown action | Surface IR references an unknown action. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-action.json` | `/root/actions/escalate` | `fixture://p0/invalid/unknown-action#/root/actions/escalate` | `invalid/unknown-action.json` |
| `CATALOG_UNKNOWN_TOKEN_REF` | Surface IR references an unknown token | Surface IR references an unknown token. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-token-ref.json` | `/root/tokenRefs/surface` | `fixture://p0/invalid/unknown-token-ref#/root/tokenRefs/surface` | `invalid/unknown-token-ref.json` |
| `CATALOG_UNKNOWN_EVENT` | Surface IR references an unknown event | Surface IR references an unknown event. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-event.json` | `/root/events/escalated` | `fixture://p0/invalid/unknown-event#/root/events/escalated` | `invalid/unknown-event.json` |
| `CATALOG_UNKNOWN_DATA_BINDING` | Surface IR references an unknown data binding | Surface IR references an unknown data binding. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unknown-data-binding.json` | `/root/dataBindings/userId` | `fixture://p0/invalid/unknown-data-binding#/root/dataBindings/userId` | `invalid/unknown-data-binding.json` |
| `CATALOG_INVALID_VALUE` | Prop value has the wrong JSON type | Prop value has the wrong JSON type. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-prop-type.json` | `/root/props/heading` | `fixture://p0/invalid/invalid-prop-type#/root/props/heading` | `invalid/invalid-prop-type.json` |
| `CATALOG_INVALID_VALUE` | Value is outside an allowed enum | Value is outside an allowed enum. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-enum-value.json` | `/instances/callout1/props/status` | `fixture://p0/invalid/invalid-enum-value#/instances/callout1/props/status` | `invalid/invalid-enum-value.json` |
| `CATALOG_INVALID_VALUE` | String value violates catalog bounds | String value violates catalog bounds. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-string-bounds.json` | `/root/props/heading` | `fixture://p0/invalid/invalid-string-bounds#/root/props/heading` | `invalid/invalid-string-bounds.json` |
| `CATALOG_INVALID_VALUE` | Required prop is missing for the selected component, variant, or state | Required prop is missing. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/missing-required-prop.json` | `/root/props/heading` | `fixture://p0/invalid/missing-required-prop#/root` | `invalid/missing-required-prop.json` |
| `CATALOG_INVALID_VALUE` | String prop contains unsafe markup or unsanitized text | String prop contains unsafe markup or unsanitized text. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/unsafe-markup.json` | `/instances/secondaryAction/props/label` | `fixture://p0/invalid/unsafe-markup#/instances/secondaryAction/props/label` | `invalid/unsafe-markup.json` |
| `CATALOG_INVALID_VALUE` | Slot contains an illegal child component type | Slot contains an illegal child component. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/illegal-slot-child.json` | `/root/slots/primaryAction/0` | `fixture://p0/invalid/illegal-slot-child#/root/slots/primaryAction/0` | `invalid/illegal-slot-child.json` |
| `CATALOG_INVALID_VALUE` | Slot exceeds its max item rule | Slot exceeds its maximum item count. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/slot-max-items.json` | `/root/slots/primaryAction` | `fixture://p0/invalid/slot-max-items#/root/slots/primaryAction` | `invalid/slot-max-items.json` |
| `CATALOG_INVALID_VALUE` | Surface IR requests execution of a disabled action | Surface IR requests execution of a disabled action. | `adapter-conformance` | `error` | `blocked` | `fixtures/p0/invalid/disabled-action-execution.json` | `/instances/secondaryAction/actions/dismiss/execute` | `fixture://p0/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss` | `invalid/disabled-action-execution.json` |
| `CATALOG_EXTRA_PROPERTY` | Surface IR contains a property disallowed by schema/catalog | Surface IR contains an unsupported property. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/extra-property.json` | `/root/renderHtml` | `fixture://p0/invalid/extra-property#/root/renderHtml` | `invalid/extra-property.json` |
| `ACCESSIBILITY_LABEL_MISSING` | Required accessible-name source is absent | Required accessible name source is missing. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-a11y.json` | `/root/accessibility/nameFrom` | `fixture://p0/invalid/invalid-a11y#/root/accessibility` | `invalid/invalid-a11y.json` |
| `ACCESSIBILITY_CONTRACT_UNMET` | Keyboard contract is unmet | Keyboard contract is unmet. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-keyboard-contract.json` | `/instances/primaryAction/accessibility/activationKeys` | `fixture://p0/invalid/invalid-keyboard-contract#/instances/primaryAction/accessibility` | `invalid/invalid-keyboard-contract.json` |
| `ACCESSIBILITY_CONTRACT_UNMET` | Focus contract is unmet | Focus contract is unmet. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-focus-contract.json` | `/instances/primaryAction/accessibility/focusableWhenDisabled` | `fixture://p0/invalid/invalid-focus-contract#/instances/primaryAction/accessibility` | `invalid/invalid-focus-contract.json` |
| `ACCESSIBILITY_CONTRACT_UNMET` | Live-region contract is unmet | Live-region contract is unmet. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/invalid-live-region.json` | `/instances/callout1/accessibility/liveRegion` | `fixture://p0/invalid/invalid-live-region#/instances/callout1/accessibility` | `invalid/invalid-live-region.json` |
| `ACCESSIBILITY_MODAL_UNSUPPORTED` | Surface IR attempts modal dialog semantics through unsupported modal fields | Modal dialog semantics are unsupported in P0. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/modal-role-not-supported.json` | `/root/accessibility/role` | `fixture://p0/invalid/modal-role-not-supported#/root/accessibility` | `invalid/modal-role-not-supported.json` |
| `GOVERNANCE_REVIEW_REQUIRED` | Structurally valid usage requires review | Usage requires review before unattended promotion. | `govern` | `review` | `review_required` | `fixtures/p0/review/review-required-action.json` | `/root/actions/confirm/execute` | `fixture://p0/review/review-required-action#/root/actions/confirm` | `review/review-required-action.json` |
| `PROVENANCE_MISSING` | Required provenance is absent | Required generated artifact provenance is missing. | `compile` | `error` | `blocked` | `fixtures/p0/mutations/missing-provenance.extract.json` | `/provenance` | `fixture://p0/source#/provenance` | `mutations/missing-provenance.extract.json` |
| `ARTIFACT_HASH_MISMATCH` | Artifact hash differs from evidence manifest | Artifact hash does not match the evidence manifest. | `validate` | `error` | `blocked` | `fixtures/p0/mutations/hash-mismatch.evidence.json` | `/artifacts/0/hash` | `null` | `mutations/hash-mismatch.evidence.json` |

## Proof CLI Contract
`interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0` is implemented with these required behaviors:

- The command is run from the workspace root.
- `--fixture` and `--out` are POSIX-style paths relative to the workspace root.
- The schema directory is fixed at `schemas/` relative to the workspace root; P0 has no `--schemas` flag.
- `fixtures/p0/expectations.manifest.json` is the source of truth for fixture comparisons.
- Exit `0`: all valid fixtures are allowed, all mutation and invalid fixtures are blocked in the expected phase with expected codes, all review fixtures are `review_required`, final evidence is reproducible, `evidence.status` is `pass`, and the P0 fixture set produces aggregate `evidence.promotionStatus: review_required`.
- Exit `1`: contract validation fails, invalid fixture expectations do not match, review fixtures do not block unattended promotion, hashes/provenance are missing, or stale unexpected output exists under `--out`.
- Exit `2`: command usage, missing fixture path, unreadable schema path, or output path error.
- The command overwrites files only under the declared `--out` directory.
- The expected P0 output set is exactly `extract.json`, `catalog.json`, `governed-catalog.json`, `adapter-diagnostics.json`, and `evidence.json` directly under `--out`. Before writing, the command enumerates `--out`; expected files are replaced, but any other file or directory is stale unexpected output, causes exit `1`, and is excluded from evidence.
- The command writes a concise stage summary to stdout and machine-readable artifacts to `--out`.
- The command writes diagnostics to stderr only for command/runtime failure, not expected invalid fixture failures.

## P1 Contract Summary
P1 proves a governed product surface through a `web-static` runtime projection and deterministic render-plan proof. The governed catalog remains the source of truth. The runtime projection is a derived, hash-bound adapter subset. The generated demo is proof output, not a hand-authored product mock.

P1 source of truth:

- [P1 Subplan Index](p1/README.md) defines the P1 artifact tree, command contract, diagnostics additions, pass condition, and non-goals.
- [Runtime Projection v0](p1/runtime-projection-v0.md) defines the adapter-facing projection.
- [P1 Fixture](p1/p1-fixture.md) defines the fixture and manifest contract.
- [Runtime Adapter Proof](p1/runtime-adapter-proof.md) defines render-plan and report behavior.
- [P1 Validation And Evidence](p1/validation-evidence.md) defines evidence, hashing, diagnostics, and aggregation.

P1 proof command:

```bash
interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1
```
