# Runtime Projection v0

## Decision
P1 introduces `runtime-projection.v0` as a hash-bound, adapter-specific projection for the `web-static` adapter. The projection is derived from `artifacts/p0/governed-catalog.json`, verified against `artifacts/p0/evidence.json`, and consumed by the adapter proof instead of exposing the full governed catalog to a renderer.

## Goal
Create the smallest adapter-facing contract that can produce deterministic render plans while preserving catalog authority, governance results, accessibility fields, token constraints, and fail-closed runtime behavior.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `artifacts/p0/evidence.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- Schema constants from `schemas/runtime-projection.v0.schema.json`.

P1 valid, invalid, review, and mutation fixtures are not projection inputs. Fixtures may be read only after projection generation for manifest-backed adapter proof comparisons, render-plan generation for allowed surfaces, and mutation verification against already-emitted proof artifacts.

## Outputs
- `schemas/runtime-projection.v0.schema.json`.
- `artifacts/p1/runtime-projection.json`.
- Projection diagnostics recorded in `artifacts/p1/runtime-adapter-report.json` and final evidence.

## Projection Shape
`runtime-projection.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `runtime-projection.v0` |
| `version` | string | yes | Semver |
| `adapter` | const | yes | `web-static` |
| `catalogRef` | object | yes | Artifact path, schema id, hash, and source evidence hash for `artifacts/p0/governed-catalog.json` |
| `p0EvidenceRef` | object | yes | Artifact path, schema id, and hash for `artifacts/p0/evidence.json` |
| `adapterDiagnosticsRef` | object | yes | Artifact path, schema id, and hash for `artifacts/p0/adapter-diagnostics.json` |
| `components` | object | yes | Adapter-visible component subset |
| `tokens` | object | yes | Resolved token values and safe CSS variable names |
| `runtimeCapabilities` | object | yes | Fail-closed behavior copied or narrowed from governed catalog |
| `governance` | object | yes | Promotion and review rules copied or narrowed from governed catalog |
| `accessibility` | object | yes | Adapter-visible accessibility expectations |
| `provenance` | object | yes | Source refs, generator metadata, and deterministic environment |
| `diagnostics` | array | yes | Runtime-adapter diagnostics objects |

## Component Projection Rules
- Components are limited to the governed P0 catalog subset declared for `web-static` in schema constants and P1 docs: `ConfirmPanel`, `StatusCallout`, and `Button`.
- Props, variants, states, slots, actions, events, token refs, data bindings, and accessibility fields must be copied from or narrowed from the governed catalog.
- Projection must not introduce component ids, member ids, allowed values, action targets, token refs, or data-binding refs absent from the governed catalog.
- Projection must not convert `blocked` or `review_required` to `allowed`.
- Destructive or review-required actions remain inert action descriptors only.
- Projection generation must not inspect Surface IR fixture contents to decide which components, props, actions, tokens, data bindings, accessibility fields, or governance rules to include.

## Token Projection Rules
- Token values must resolve before rendering and keep provenance back to the governed catalog.
- `tokens` is a flat map keyed by governed token ref, where each value includes `value`, deterministic `cssVariable`, and `sourceRef`.
- CSS variable names must be deterministic and safe for static HTML.
- Token categories unsupported by `web-static` must be omitted with a projection diagnostic or rejected if required by the surface.
- Numeric token values keep the P0 canonical number constraints.

## Authority Checks
Projection generation fails with `PROJECTION_AUTHORITY_ESCALATION` if any projected field grants authority absent from the governed catalog. The check compares the projection against the governed catalog across projected components, props, variants, states, slots, actions, events, token refs, data bindings, component accessibility, top-level projection accessibility derived from `governedCatalog.components[*].accessibility`, projected tokens, runtime capabilities, and governance. Representative fixture coverage includes a projected `Button.props.variant.allowedValues` value that is absent from the governed catalog, but the guard is not limited to that field.

Projection generation fails with `PROJECTION_SOURCE_HASH_MISMATCH` if the governed catalog hash does not match P0 evidence.

Projection generation fails with `PROJECTION_CATALOG_REF_MISSING` if catalog refs are missing, malformed, absolute, or not POSIX-relative workspace paths.

## A2UI Position
P1 projection artifacts must not be named `a2ui-*` and must not claim A2UI compatibility. A future A2UI-specific P5 export may be a separate projection target with its own schema, fixture set, conformance proof, and evidence.

## P1 Proof
The P1 proof emits `artifacts/p1/runtime-projection.json`, validates it against `schemas/runtime-projection.v0.schema.json`, compares its authority against the governed catalog, records diagnostics in the adapter report, and includes the projection hash in final evidence.

## Non-Goals
- No direct renderer consumption of the full governed catalog.
- No A2UI projection.
- No public runtime protocol.
- No live theming engine.
- No runtime state manager.

## Closed P1 Decisions
- `web-static` consumes `runtime-projection.v0`, not `runtime-catalog.v0`.
- Projection is a derived contract subset, not a new authority source.
- Projection hashes are evidence-bound before render-plan generation.
