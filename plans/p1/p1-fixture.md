# P1 Fixture

## Decision
P1 uses a dedicated `fixtures/p1/` set to prove runtime projection, render-plan, review, invalid, and evidence behavior. P1 may reference P0 fixture intent, but P1 expectations must be declared in its own manifest.

## Goal
Define exact fixture paths, expected stages, phases, promotion statuses, diagnostics, and artifact paths for the first runtime adapter proof.

## Fixture Layout

```text
fixtures/p1/
  expectations.manifest.json
  valid/
    confirm-panel.surface-ir.json
    status-callout.surface-ir.json
    button-defaults.surface-ir.json
  review/
    review-required-action.surface-ir.json
  invalid/
    unknown-component.surface-ir.json
    unknown-prop.surface-ir.json
    unsafe-markup.surface-ir.json
    disabled-action-execution.surface-ir.json
    unknown-action.surface-ir.json
    unknown-event.surface-ir.json
    unknown-slot.surface-ir.json
    unknown-token-key.surface-ir.json
    unknown-token-ref.surface-ir.json
    unknown-data-binding.surface-ir.json
    unknown-variant.surface-ir.json
    unknown-state.surface-ir.json
    modal-role-not-supported.surface-ir.json
  mutations/
    missing-catalog-ref.runtime-projection.json
    catalog-hash-mismatch.runtime-projection.json
    projection-authority-escalation.runtime-projection.json
    missing-render-plan-provenance.render-plan.json
    runtime-projection-hash-mismatch.runtime-adapter-report.json
    hash-mismatch.runtime-adapter-evidence.json
```

## Fixture Categories

| Category | Purpose | Expected stage |
| --- | --- | --- |
| `valid/` | Proves allowed surfaces can produce render plans | `runtime-boundary` |
| `review/` | Proves review-required usage is structurally valid but not rendered as allowed | `runtime-boundary` |
| `invalid/` | Proves P0-invalid usage remains fail-closed at the adapter boundary | `runtime-boundary` |
| `mutations/` | Proves projection, render-plan, and evidence tampering is blocked | `projection`, `runtime-boundary`, or `evidence` |

## Expectations Manifest
`fixtures/p1/expectations.manifest.json` must include:

- `fixtureRoot`: `fixtures/p1`.
- `artifactRoot`: `artifacts/p1`.
- `schemaRoot`: `schemas`.
- `version`: P1 default `0.0.0`.
- `inputs[]`: every fixture path in deterministic order.
- `artifactOrder[]`: every schema, upstream P0 input artifact, P1 fixture, generated P1 artifact, and final evidence artifact in the semantic order defined by `validation-evidence.md`; hashes are recorded values, not the sort key.
- `expectations[]`: fixture path, fixture kind, expected stage, expected phase, expected validation result, expected promotion status, expected diagnostic codes, expected artifact path, expected JSON Pointer, required source ref, and expected render-plan path or `null`.
- `runExpectation`: aggregate status and promotion status.

## P1 Stages
P1 stage values are:

- `projection`
- `runtime-boundary`
- `evidence`

P1 may preserve P0 stages inside upstream evidence references, but new P1 fixture expectations must use P1 stages unless they are explicitly inherited P0 expectations.

## P1 Phases
P1 expected phase values are:

- `projection-mutation`
- `runtime-adapter`
- `runtime-review`
- `runtime-invalid`
- `runtime-evidence`

## Manifest Expectation Rows
The table below is the normative `expectations[]` content. The row order is also the deterministic fixture input order unless the manifest separately lists the same paths in `inputs[]`.

| Fixture path | Kind | Stage | Phase | Expected result | Promotion status | Diagnostic codes | Artifact path | JSON Pointer | Source ref | Render-plan path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fixtures/p1/valid/confirm-panel.surface-ir.json` | `valid` | `runtime-boundary` | `runtime-adapter` | `valid` | `allowed` | `[]` | `artifacts/p1/render-plan.confirm-panel.json` | `/root` | `fixture://p1/valid/confirm-panel#/root` | `artifacts/p1/render-plan.confirm-panel.json` |
| `fixtures/p1/valid/status-callout.surface-ir.json` | `valid` | `runtime-boundary` | `runtime-adapter` | `valid` | `allowed` | `[]` | `artifacts/p1/render-plan.status-callout.json` | `/root` | `fixture://p1/valid/status-callout#/root` | `artifacts/p1/render-plan.status-callout.json` |
| `fixtures/p1/valid/button-defaults.surface-ir.json` | `valid` | `runtime-boundary` | `runtime-adapter` | `valid` | `allowed` | `[]` | `artifacts/p1/render-plan.button-defaults.json` | `/root` | `fixture://p1/valid/button-defaults#/root` | `artifacts/p1/render-plan.button-defaults.json` |
| `fixtures/p1/review/review-required-action.surface-ir.json` | `review` | `runtime-boundary` | `runtime-review` | `review_required` | `review_required` | `["RUNTIME_REVIEW_REQUIRED"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/actions/confirm/execute` | `fixture://p1/review/review-required-action#/root/actions/confirm` | `null` |
| `fixtures/p1/invalid/unknown-component.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["CATALOG_UNKNOWN_COMPONENT"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/component` | `fixture://p1/invalid/unknown-component#/root` | `null` |
| `fixtures/p1/invalid/unknown-prop.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["CATALOG_UNKNOWN_PROP"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/props/eyebrow` | `fixture://p1/invalid/unknown-prop#/root/props/eyebrow` | `null` |
| `fixtures/p1/invalid/unsafe-markup.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["CATALOG_INVALID_VALUE"]` | `artifacts/p1/runtime-adapter-report.json` | `/instances/secondaryAction/props/label` | `fixture://p1/invalid/unsafe-markup#/instances/secondaryAction/props/label` | `null` |
| `fixtures/p1/invalid/disabled-action-execution.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_ACTION_EXECUTION_BLOCKED"]` | `artifacts/p1/runtime-adapter-report.json` | `/instances/secondaryAction/actions/dismiss/execute` | `fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss` | `null` |
| `fixtures/p1/invalid/unknown-action.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/actions/escalate` | `fixture://p1/invalid/unknown-action#/root/actions/escalate` | `null` |
| `fixtures/p1/invalid/unknown-event.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/events/escalated` | `fixture://p1/invalid/unknown-event#/root/events/escalated` | `null` |
| `fixtures/p1/invalid/unknown-slot.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/slots/footer` | `fixture://p1/invalid/unknown-slot#/root/slots/footer` | `null` |
| `fixtures/p1/invalid/unknown-token-key.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/tokenRefs/accent` | `fixture://p1/invalid/unknown-token-key#/root/tokenRefs/accent` | `null` |
| `fixtures/p1/invalid/unknown-token-ref.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/tokenRefs/surface` | `fixture://p1/invalid/unknown-token-ref#/root/tokenRefs/surface` | `null` |
| `fixtures/p1/invalid/unknown-data-binding.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/dataBindings/userId` | `fixture://p1/invalid/unknown-data-binding#/root/dataBindings/userId` | `null` |
| `fixtures/p1/invalid/unknown-variant.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/variant` | `fixture://p1/invalid/unknown-variant#/root/variant` | `null` |
| `fixtures/p1/invalid/unknown-state.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_MEMBER_UNKNOWN"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/state` | `fixture://p1/invalid/unknown-state#/root/state` | `null` |
| `fixtures/p1/invalid/modal-role-not-supported.surface-ir.json` | `invalid` | `runtime-boundary` | `runtime-invalid` | `invalid` | `blocked` | `["ACCESSIBILITY_MODAL_UNSUPPORTED"]` | `artifacts/p1/runtime-adapter-report.json` | `/root/accessibility/role` | `fixture://p1/invalid/modal-role-not-supported#/root/accessibility` | `null` |
| `fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json` | `mutation` | `projection` | `projection-mutation` | `invalid` | `blocked` | `["PROJECTION_CATALOG_REF_MISSING"]` | `fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json` | `/catalogRef` | `null` | `null` |
| `fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json` | `mutation` | `projection` | `projection-mutation` | `invalid` | `blocked` | `["PROJECTION_SOURCE_HASH_MISMATCH"]` | `fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json` | `/catalogRef/hash` | `fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef` | `null` |
| `fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json` | `mutation` | `projection` | `projection-mutation` | `invalid` | `blocked` | `["PROJECTION_AUTHORITY_ESCALATION"]` | `fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json` | `/components/ConfirmPanel/actions/escalate` | `fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate` | `null` |
| `fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json` | `mutation` | `runtime-boundary` | `runtime-adapter` | `invalid` | `blocked` | `["RUNTIME_RENDER_PLAN_PROVENANCE_MISSING"]` | `fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json` | `/provenance` | `fixture://p1/valid/confirm-panel#/root` | `null` |
| `fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` | `mutation` | `runtime-boundary` | `runtime-adapter` | `invalid` | `blocked` | `["RUNTIME_PROJECTION_HASH_MISMATCH"]` | `fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` | `/runtimeProjectionRef/hash` | `fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef` | `null` |
| `fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json` | `mutation` | `evidence` | `runtime-evidence` | `invalid` | `blocked` | `["RUNTIME_EVIDENCE_HASH_MISMATCH"]` | `fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json` | `/artifacts/0/hash` | `null` | `null` |

## Valid Fixtures
- `valid/confirm-panel.surface-ir.json` proves the main product-visible surface path.
- `valid/status-callout.surface-ir.json` proves non-action informational rendering.
- `valid/button-defaults.surface-ir.json` proves defaultable component member handling without broadening runtime scope.

Each valid fixture must produce a deterministic render plan and must not execute actions.

## Review Fixture
`review/review-required-action.surface-ir.json` proves that destructive or governed usage remains structurally valid, records `review_required`, emits `RUNTIME_REVIEW_REQUIRED`, and executes no action. It is report/evidence-only in P1 fixture expectations: `renderPlanPath` is `null`, the result is recorded in `artifacts/p1/runtime-adapter-report.json` and final evidence, and no review-required render-plan artifact may be produced for this fixture. If a review-required fixture is rendered as allowed, emits a render plan, or records any action execution, aggregate proof status is `fail` and aggregate promotion status is `blocked`.

## Invalid Fixtures
Invalid fixtures prove that the adapter boundary still blocks:

- unknown components;
- unknown props;
- unsafe markup;
- disabled action execution;
- Surface IR members absent from `runtime-projection.v0`, including actions, events, slots, token keys, token refs, data bindings, variants, and states;
- modal or `alertdialog` semantics unsupported by the P1 adapter.

Shared failures should preserve P0 diagnostic meaning where possible. P1-only diagnostics are used only for projection, render-plan, runtime-boundary, and evidence failures that P0 does not cover.

## Mutation Fixtures
Mutation fixtures prove that the proof fails when:

- runtime projection omits the governed catalog ref;
- runtime projection catalog hash does not match P0 evidence;
- runtime projection grants authority absent from the governed catalog;
- render plan omits provenance;
- runtime adapter report references a runtime projection hash that does not match the current generated projection;
- runtime adapter evidence violates the hash manifest or self-hash rule.

Mutation fixtures are read-only negative inputs. The proof command must load them in an isolated validation context, either as a complete negative target artifact or as a temporary overlay on the normal generated artifact, and then discard that context. Mutation fixtures must never be copied into `artifacts/p1`, committed as generated proof output, included in `renderPlans[]`, or used as the source for final passing artifacts. The normal P1 artifacts are generated only from non-mutated inputs after mutation checks pass.

| Mutation fixture | Execution mode | Target schema | Target artifact | Expected diagnostic | Artifact path expectation |
| --- | --- | --- | --- | --- | --- |
| `mutations/missing-catalog-ref.runtime-projection.json` | Read-only replacement negative artifact | `runtime-projection.v0` | `artifacts/p1/runtime-projection.json` | `PROJECTION_CATALOG_REF_MISSING` | Manifest `artifactPath` is the mutation fixture path; no mutated `runtime-projection.json` is emitted. |
| `mutations/catalog-hash-mismatch.runtime-projection.json` | Read-only replacement negative artifact | `runtime-projection.v0` | `artifacts/p1/runtime-projection.json` | `PROJECTION_SOURCE_HASH_MISMATCH` | Manifest `artifactPath` is the mutation fixture path; no mutated `runtime-projection.json` is emitted. |
| `mutations/projection-authority-escalation.runtime-projection.json` | Temporary overlay on generated projection | `runtime-projection.v0` | `artifacts/p1/runtime-projection.json` | `PROJECTION_AUTHORITY_ESCALATION` | Manifest `artifactPath` is the mutation fixture path; the overlay is discarded before render-plan generation. |
| `mutations/missing-render-plan-provenance.render-plan.json` | Temporary overlay on `render-plan.confirm-panel` | `render-plan.v0` | `artifacts/p1/render-plan.confirm-panel.json` | `RUNTIME_RENDER_PLAN_PROVENANCE_MISSING` | Manifest `artifactPath` is the mutation fixture path; no provenance-missing render plan is emitted. |
| `mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` | Temporary overlay on generated adapter report metadata | `runtime-adapter-report.v0` | `artifacts/p1/runtime-adapter-report.json` | `RUNTIME_PROJECTION_HASH_MISMATCH` | Manifest `artifactPath` is the mutation fixture path; no hash-mismatched adapter report is emitted. |
| `mutations/hash-mismatch.runtime-adapter-evidence.json` | Read-only replacement negative artifact | `runtime-adapter-evidence.v0` | `artifacts/p1/evidence.json` | `RUNTIME_EVIDENCE_HASH_MISMATCH` | Manifest `artifactPath` is the mutation fixture path; no hash-mismatched evidence is emitted. |

Each mutation row is expected to produce `validationResult: "invalid"` and `promotionStatus: "blocked"` for that row. The aggregate P1 proof still exits successfully only when every mutation is rejected with the expected diagnostic and every non-mutated expectation also matches. If any mutation is accepted, lacks the expected diagnostic, changes a committed/generated artifact, or appears in final evidence as a generated artifact instead of an input fixture, aggregate `status` is `fail` and aggregate `promotionStatus` is `blocked`.

## Artifact Expectations
Every fixture must identify its expected artifact path. Valid fixtures point to their render-plan artifact. Review and invalid fixtures point to `artifacts/p1/runtime-adapter-report.json`, and their `renderPlanPath` is `null`. Mutation fixtures point to their read-only mutation fixture path in `fixtures/p1/mutations/`; their target artifact is named in the mutation semantics table, but the mutated target is never written under `artifacts/p1`. The only render-plan paths allowed by this fixture plan are:

- `artifacts/p1/render-plan.confirm-panel.json`;
- `artifacts/p1/render-plan.status-callout.json`;
- `artifacts/p1/render-plan.button-defaults.json`.

## P1 Proof
The fixture set passes only when every expectation matches the manifest, every unexpected fixture is rejected, every expected diagnostic code is registry-backed, and final evidence records the complete artifact order.

## Non-Goals
- No live source ingestion fixture.
- No generated application code fixture.
- No modal implementation fixture.
- No A2UI conformance fixture without a separate A2UI-specific P5 proof.
- No reviewer decision fixture.
