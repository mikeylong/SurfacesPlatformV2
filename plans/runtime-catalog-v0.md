# Runtime Catalog v0

## Decision
The central P0 artifact is the Surfaces Catalog, with schema/artifact id `runtime-catalog.v0`. It is a governed design-system catalog/compiler artifact, not an A2UI catalog and not a public runtime protocol in P0.

## Goal
Define the smallest versioned contract that lets a fixture source compile into governed UI instructions that Surface IR fixtures can validate against, evidence can record, and adapter conformance can reject when usage is outside the contract.

## Schema Suite
P0 defines these schema contracts:

- `schemas/runtime-catalog.v0.schema.json`: validates `artifacts/p0/catalog.json` and `artifacts/p0/governed-catalog.json`.
- `schemas/surface-ir.v0.schema.json`: validates `fixtures/p0/valid.surface-ir.json`, every file under `fixtures/p0/invalid/`, and every file under `fixtures/p0/review/`.
- `schemas/fixture-expectations.v0.schema.json`: validates `fixtures/p0/expectations.manifest.json`.
- `schemas/extract.v0.schema.json`: validates `artifacts/p0/extract.json`.
- `schemas/adapter-diagnostics.v0.schema.json`: validates the `artifacts/p0/adapter-diagnostics.json` artifact envelope and fixture result matrix.
- `schemas/evidence.v0.schema.json`: validates `artifacts/p0/evidence.json`.
- `schemas/diagnostics.v0.schema.json`: validates diagnostic objects embedded in catalog, extract, evidence, and adapter diagnostics artifacts.

Each schema must define `$schema`, `$id`, `schemaId`, `version`, required fields, closed-object behavior for known structures, and JSON Pointer-compatible paths for diagnostics.

## Schema Norms
All P0 schemas must use JSON Schema Draft 2020-12 and must include:

| Field | Requirement |
| --- | --- |
| `$schema` | `https://json-schema.org/draft/2020-12/schema` |
| `$id` | Stable relative id under `https://surfaces.dev/schemas/p0/` |
| `schemaId` | Constant matching the file stem, such as `runtime-catalog.v0` |
| `version` | Semver string; P0 default is `0.0.0` |
| Required fields | Listed explicitly in each schema |
| Unknown fields | Rejected with `unevaluatedProperties: false` unless an extension object explicitly allows them |
| Paths | JSON Pointer strings per RFC 6901 |
| Identifiers | ASCII identifier grammar `^[A-Za-z_][A-Za-z0-9_]*$` for P0 component, prop, variant, state, slot, action, event, function, and data-binding ids |

## Schema Field Tables

`runtime-catalog.v0.schema.json` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `catalogId` | string | yes | Stable catalog id |
| `schemaId` | const `runtime-catalog.v0` | yes | Schema discriminator |
| `artifactKind` | enum | yes | `catalog` or `governed-catalog` |
| `version` | string | yes | Semver |
| `sourceRefs` | object | yes | JSON Pointer keyed source refs |
| `tokens` | object | yes | DTCG 2025.10-compatible subset |
| `components` | object | yes | Component map keyed by id |
| `runtimeCapabilities` | object | yes | Fail-closed runtime behavior |
| `governance` | object | yes | Exact empty shape for `catalog`; populated rule/result maps for `governed-catalog` |
| `provenance` | object | yes | Reproducibility metadata |
| `diagnostics` | array | yes | Diagnostics v0 objects |
| `compatibility` | object | yes | P0 value is A2UI reference-only |

`surface-ir.v0.schema.json` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const `surface-ir.v0` | yes | Schema discriminator |
| `version` | string | yes | Semver |
| `root` | object | yes | Root component instance |
| `instances` | object | yes | Component instances keyed by id |
| `bindings` | object | no | Data bindings used by instances |
| `provenance` | object | yes | Fixture provenance |

`fixture-expectations.v0.schema.json`, `extract.v0.schema.json`, `adapter-diagnostics.v0.schema.json`, `evidence.v0.schema.json`, and `diagnostics.v0.schema.json` are defined by the P0 fixture and evidence contracts in [P0 Fixture](p0-fixture.md) and [Validation And Evidence](validation-evidence.md).

## Nested Object Requirements

Component entries must require:

| Field | Type | Required |
| --- | --- | --- |
| `sourceRef` | string | yes |
| `props` | object | yes |
| `variants` | object | yes |
| `states` | object | yes |
| `slots` | object | yes |
| `actions` | object | yes |
| `events` | object | yes |
| `dataBindings` | object | yes |
| `tokenRefs` | object | yes |
| `accessibility` | object | yes |
| `examples` | array | yes |

Prop entries must require `id`, `type`, `required`, `default`, `allowedValues`, `tokenRefs`, `sourceRef`, and `diagnostics`.

Action entries must require `id`, `kind`, `allowedTargets`, `destructive`, `requiresReview`, `disabledUntilImplemented`, `dataBindingConstraints`, and `sourceRef`.

Surface IR root and instance entries must require `id`, `component`, `props`, `variant`, `state`, `slots`, `actions`, `events`, `tokenRefs`, `dataBindings`, and `accessibility`.

## Inputs
- `artifacts/p0/extract.json` from the P0 fixture extraction.
- `fixtures/p0/source.fixture.json` token refs, component definitions, examples, and source refs.
- Governance rules from `governance-layer.md`.

## Outputs
- `artifacts/p0/catalog.json`: compiled Surfaces Catalog before governance annotations.
- `artifacts/p0/governed-catalog.json`: Surfaces Catalog plus generation, review, and blocking rules.
- Diagnostics consumed by `artifacts/p0/evidence.json` and `artifacts/p0/adapter-diagnostics.json`.

## Minimum Catalog Shape

```json
{
  "catalogId": "surfaces-p0",
  "schemaId": "runtime-catalog.v0",
  "artifactKind": "catalog",
  "version": "0.0.0",
  "sourceRefs": {},
  "tokens": {},
  "components": {},
  "runtimeCapabilities": {},
  "governance": {
    "rules": {},
    "results": {},
    "promotionStatus": null
  },
  "provenance": {},
  "diagnostics": [],
  "compatibility": {
    "a2ui": "reference-only"
  }
}
```

`tokens` must use only this fixture-backed DTCG 2025.10-compatible subset or projection: `$value`, `$type`, `$description`, alias references, JSON Pointer `$ref`, `$extensions`, `$extends` group inheritance, token path diagnostics, and composite expansion for `typography` and `shadow` tokens. DTCG features not named here are out of P0.

P0 token handling must be exact enough to prove these cases:

- Alias resolution: fixture source may use curly-brace token aliases. `extract.json` must preserve the original reference and record the resolved value used by the catalog compiler. Unresolved aliases fail with `TOKEN_REFERENCE_UNRESOLVED`; alias cycles fail with `TOKEN_REFERENCE_CIRCULAR`.
- JSON Pointer `$ref`: fixture source may use JSON Pointer `$ref` values. `extract.json` must preserve the original pointer and record the resolved value used by the catalog compiler. Unresolved `$ref` targets fail with `TOKEN_REFERENCE_UNRESOLVED`; `$ref` cycles fail with `TOKEN_REFERENCE_CIRCULAR`.
- `$extends`: fixture source may use `$extends` for group inheritance. The extractor must resolve non-circular inheritance before catalog compilation and retain source refs for inherited and overridden values. Unresolved `$extends` targets fail with `TOKEN_REFERENCE_UNRESOLVED`; `$extends` cycles fail with `TOKEN_REFERENCE_CIRCULAR`; `$extends` targets that resolve to a token, non-group, or non-object fail with `TOKEN_EXTENDS_INVALID`.
- Composite expansion: `typography` and `shadow` composite tokens must expand into typed sub-values without dropping source refs. Composite values with missing required sub-values, extra sub-values, or incompatible sub-value types must fail extraction with `TOKEN_COMPOSITE_INVALID`.

P0 token ids must preserve source-owned token names in `sourceRefs`; normalized token keys may be used only when they retain a source pointer. Token references use `{token.path}` style in fixture source and JSON Pointer paths in diagnostics.

Numeric token `$value` fields and numeric composite sub-values must be finite JSON numbers and use the canonical number serialization defined by evidence. Source strings that look numeric remain strings and must not be parsed or coerced.

`components` is a map keyed by stable component id. Each component entry must include:

- `sourceRef`: pointer to the fixture source entry.
- `props`: allowed props with id, type, required flag, allowed values, default, token refs, string bounds when relevant, and diagnostics.
- `variants`: allowed variants with id, allowed values, required props, and state constraints.
- `states`: allowed runtime states with id, allowed props, and accessibility expectations.
- `slots`: allowed slots with id, kind, required flag, allowed components, and max item rules.
- `actions`: allowed invokable actions with id, kind, allowed targets, review requirement, and data-binding constraints.
- `events`: allowed emitted events with id, payload shape, and allowed action bindings.
- `dataBindings`: allowed data refs and constraints for values agents may bind.
- `tokenRefs`: token references by category, including color, spacing, radius, typography, shadow, and motion when present in the fixture.
- `accessibility`: semantic role, accessible-name source, description source, keyboard behavior, focus behavior, disabled behavior, and status announcement behavior.
- `examples`: valid fixture examples used by validation.

## Accessibility Contracts
P0 accessibility validation is catalog-declared, not a browser audit. Each component must include an accessibility contract:

| Component | Required accessibility contract |
| --- | --- |
| `Button` | role `button`; accessible name from `label` or explicit icon label; `Enter` and `Space` activation; disabled state blocks activation; focusable unless disabled; optional description source for destructive actions |
| `StatusCallout` | role `status` for info/success or `alert` for warning/critical; accessible name from `title`; description from `body`; live-region politeness declared by status; dismiss action has accessible name |
| `ConfirmPanel` | non-modal group only; accessible name from `heading`; description from `body`; primary and secondary actions have names; destructive primary action is `review_required` |

P0 uses WAI-ARIA APG as reference guidance for catalog-declared semantics, keyboard support, accessible names/descriptions, focus behavior, and status/alert announcements. P0 does not run a browser accessibility audit; it validates the declared Surface IR against the catalog accessibility contract.

WAI-ARIA APG modal dialog and `alertdialog` support is deferred beyond P1. P0 and P1 do not declare modal roles or modal behavior because modal support requires inert outside content, focus containment and return, Escape behavior, and modal role/ARIA fields. P0 schema/catalog validation must reject `dialog`, `alertdialog`, `aria-modal`, `modal: true`, `focusTrap`, `initialFocus`, `returnFocus`, or `inertOutside` with `ACCESSIBILITY_MODAL_UNSUPPORTED`.

Accessibility fixture coverage is:

- `fixtures/p0/invalid/invalid-a11y.json`: required accessible-name source is absent -> `ACCESSIBILITY_LABEL_MISSING`.
- `fixtures/p0/invalid/invalid-keyboard-contract.json`: required `Button` activation keys or disabled activation blocking are absent or contradicted -> `ACCESSIBILITY_CONTRACT_UNMET`.
- `fixtures/p0/invalid/invalid-focus-contract.json`: required `Button` focusability or disabled focus exclusion is absent or contradicted -> `ACCESSIBILITY_CONTRACT_UNMET`.
- `fixtures/p0/invalid/invalid-live-region.json`: `StatusCallout` status/alert role and live-region politeness do not match the declared status severity -> `ACCESSIBILITY_CONTRACT_UNMET`.
- `fixtures/p0/invalid/modal-role-not-supported.json`: Surface IR attempts `dialog`, `alertdialog`, `aria-modal`, `modal: true`, `focusTrap`, `initialFocus`, `returnFocus`, or `inertOutside` -> `ACCESSIBILITY_MODAL_UNSUPPORTED`.

`runtimeCapabilities` must define failure behavior for unknown component, prop, variant, state, slot, action, event, token ref, and data binding usage. For P0, every unknown runtime usage blocks and emits diagnostics.

`artifactKind` determines the governance shape. When `artifactKind` is `catalog`, governance must be represented exactly as:

```json
{
  "rules": {},
  "results": {},
  "promotionStatus": null
}
```

When `artifactKind` is `governed-catalog`, `governance.rules` and `governance.results` must be populated objects and `governance.promotionStatus` must be `allowed`, `review_required`, or `blocked`.

`governance` must expose the promotion status for governed generated usage: `allowed`, `review_required`, or `blocked`. Ungoverned `catalog` artifacts use `promotionStatus: null` because no governance result has been applied.

`provenance` must record source URI, source hash, compiler name, compiler version, generated timestamp, fixture label, schema ids, command, and command args. Golden `generatedAt` and generated timestamp fields are fixed to `1970-01-01T00:00:00.000Z`; real timestamps are non-golden only.

`diagnostics` must conform to `schemas/diagnostics.v0.schema.json` and record code, severity, message, path, source ref, stage, promotion status, and suggested action.

`compatibility` may mention A2UI only as reference-only in P0. It must not claim adapter compatibility.

## P0 Proof
The golden fixture compiles into deterministic `artifacts/p0/catalog.json` and `artifacts/p0/governed-catalog.json`. `fixtures/p0/valid.surface-ir.json` passes against the governed catalog. Every invalid fixture fails with its expected diagnostic code. Review fixtures are structurally valid and produce `review_required`. Adapter conformance consumes the governed catalog without requiring a renderer.

## Non-Goals
- No live Figma ingestion.
- No renderer implementation.
- No broad A2UI compatibility layer.
- No multi-framework or multi-product catalog schema.
- No theming system beyond fixture token refs.
- No governance workflow beyond fields required by P0 enforcement.
- No modal dialog or `alertdialog` semantics.

## Closed P0 Decisions
- `runtime-catalog.v0` is internal until P0 proves the contract.
- Surface IR is an internal validation fixture for P0.
- Diagnostics codes are shared across compiler, governance, validation, and adapter conformance.
- P1 resolves the first post-P0 adapter proof target as `web-static` over `runtime-projection.v0`; additional adapter target selection remains deferred, and A2UI remains reference-only in P0.
