# Runtime Adapter Proof

## Decision
P1 proves the `web-static` adapter boundary by generating deterministic render plans from `runtime-projection.v0`. It does not build a general DOM renderer or execute actions.

## Goal
Show that an adapter can consume a governed projection, accept allowed surfaces, reject invalid surfaces, respect review gates, and emit evidence-compatible artifacts without weakening catalog governance.

## Inputs
- `artifacts/p1/runtime-projection.json`.
- `fixtures/p1/valid/*.surface-ir.json`.
- `fixtures/p1/review/*.surface-ir.json`.
- `fixtures/p1/invalid/*.surface-ir.json`.
- `fixtures/p1/mutations/*.json` as read-only negative artifacts or temporary overlays.
- P1 expectations manifest.

## Outputs
- `schemas/render-plan.v0.schema.json`.
- `schemas/runtime-adapter-report.v0.schema.json`.
- `artifacts/p1/render-plan.confirm-panel.json`.
- `artifacts/p1/render-plan.status-callout.json`.
- `artifacts/p1/render-plan.button-defaults.json`.
- `artifacts/p1/runtime-adapter-report.json`.

Review-required and invalid fixtures are report/evidence-only in P1. They must not emit render-plan artifacts.

## Render Plan Shape
`render-plan.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `render-plan.v0` |
| `version` | string | yes | Semver |
| `adapter` | const | yes | `web-static` |
| `surfaceRef` | object | yes | Fixture path, schema id, source ref, and hash |
| `projectionRef` | object | yes | `runtime-projection.json` path, schema id, and hash |
| `promotionStatus` | enum | yes | `allowed`, `review_required`, or `blocked` |
| `tree` | object | yes | Static render tree for allowed plans; absent render trees for blocked or review-required fixtures are recorded in the report, not render-plan artifacts |
| `actions` | array | yes | Inert action descriptors with `executed: false` |
| `sideEffects` | array | yes | Must be empty in P1 |
| `accessibility` | object | yes | Accessible roles, names, focusability, and activation metadata copied from validated inputs |
| `tokens` | object | yes | Resolved token refs used by the plan |
| `provenance` | object | yes | Source refs and deterministic generator metadata |
| `diagnostics` | array | yes | Runtime-adapter diagnostics |

`tree` nodes are limited to:

- `nodeId`: deterministic string unique within the plan.
- `component`: projected component id.
- `role`: catalog-declared accessibility role.
- `name`: resolved accessible name string when required by the catalog.
- `description`: resolved accessible description string or `null`.
- `props`: resolved primitive prop values allowed by the projection.
- `tokens`: resolved token refs used by the node.
- `children`: ordered child nodes.

`actions[]` descriptors are limited to:

- `actionId`: projected action id.
- `kind`: projected action kind.
- `target`: projected allowed target or `null`.
- `label`: resolved accessible action name.
- `reviewRequired`: boolean copied from governed catalog policy.
- `disabled`: boolean copied from validated Surface IR state.
- `executed`: constant `false`.
- `sourceRef`: fixture source ref for the action.

CSS emitted by render plans is limited to projected token values plus adapter-safe constants: `display`, `box-sizing`, `margin`, `padding`, `border`, `border-radius`, `background`, `color`, `font`, `font-size`, `font-weight`, `line-height`, `gap`, `width`, `max-width`, `min-height`, `align-items`, `justify-content`, and `outline`. Any other CSS property or value source blocks the plan.

## Static Rendering Rules
- The adapter proof emits render plans, not executable UI code.
- Allowed render plans may be rendered later into static HTML by `build:p1-demo`.
- Surface IR components, props, variants, states, slots, actions, events, data bindings, and token refs are validated against `runtime-projection.v0`, not the full governed P0 catalog.
- Any Surface IR member absent from the runtime projection emits `RUNTIME_PROJECTION_MEMBER_UNKNOWN` and blocks render-plan generation.
- Text props must be escaped.
- No raw `innerHTML` is allowed.
- No `script` tags, inline event handlers, external network references, or secret reads are allowed.
- CSS is limited to values derived from projected tokens and adapter-safe constants.
- Unsupported runtime capability usage blocks the plan.

## Action Rules
- Actions are inert descriptors in P1.
- `executed` must always be `false`.
- `sideEffects` must always be an empty array.
- Disabled action execution emits `RUNTIME_ACTION_EXECUTION_BLOCKED` and blocks the fixture.
- Review-required action intent emits `RUNTIME_REVIEW_REQUIRED`, produces `review_required`, and blocks unattended promotion.
- If any fixture records action execution, aggregate proof status is `fail` and promotion status is `blocked`.

## Review Rules
`review_required` is structurally valid but not unattended-allowed. P1 records review-required fixtures in `runtime-adapter-report.json` and final evidence with `promotionStatus: "review_required"`, `executed: false`, `sideEffects: []`, and canonical review diagnostics. P1 must not emit a render-plan artifact for review-required fixtures.

## Runtime Adapter Report
`runtime-adapter-report.v0` must include:

- `schemaId`, `version`, `adapter`, and `runId`.
- `projectionRef`.
- `fixtureRoot` and `artifactRoot`.
- `results[]` with expected and actual stage, phase, validation result, promotion status, diagnostic codes, artifact path, JSON Pointer, source ref, and matched boolean.
- `renderPlans[]` with artifact path, surface ref, promotion status, hash, and provenance.
- `diagnostics[]`.
- deterministic `environment`.
- aggregate `status` and `promotionStatus`.

## P1 Proof
The adapter proof accepts valid fixtures, blocks invalid fixtures, records review-required fixtures, writes render plans for allowed fixtures, records all outcomes in `runtime-adapter-report.json`, and finalizes evidence only after the report exists.

## Non-Goals
- No DOM runtime.
- No action callbacks.
- No RPC or workflow trigger execution.
- No modal focus trap.
- No browser accessibility audit beyond declared contract validation.
- No broad component library integration.

## Closed P1 Decisions
- The first adapter id is `web-static`.
- The adapter consumes `runtime-projection.v0`.
- Render plans are the proof artifact; static HTML demo output is generated from those plans later.
