# Generation Harness

## Decision
P0 uses hand-authored Surface IR fixtures against the governed catalog. It does not require an LLM call, prompt library, or generated application code.

## Goal
Prove that agent-emittable UI structures have a bounded vocabulary: valid Surface IR can be checked against the governed catalog, and invalid Surface IR can be rejected with precise diagnostics.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `schemas/surface-ir.v0.schema.json`.
- `fixtures/p0/valid.surface-ir.json`.
- `fixtures/p0/invalid/*.json`.
- `fixtures/p0/review/*.json`.

## Outputs
- Validation input set for `artifacts/p0/evidence.json`.
- Invalid fixture diagnostics that conform to `schemas/diagnostics.v0.schema.json`.

## Surface IR v0 Requirements
Surface IR is internal for P0. It must specify:

- root component instance;
- component id references;
- props and values;
- variant references;
- state references;
- slot children and max item constraints;
- action references;
- event references when used;
- token refs when used;
- data-binding refs when used;
- accessibility refs required by the governed catalog.

## P0 Proof
`fixtures/p0/valid.surface-ir.json` uses only catalog-approved components, props, variants, states, slots, actions/events, token refs, data bindings, and accessibility semantics. Every file in `fixtures/p0/invalid/` intentionally violates one rule and produces the expected diagnostic code. Every file in `fixtures/p0/review/` is structurally valid but has promotion status `review_required`.

## Non-Goals
- No LLM integration.
- No prompt library.
- No app code generation.
- No Storybook story generation.
- No runtime renderer.

## Closed P0 Decisions
- Surface IR has a P0 schema: `schemas/surface-ir.v0.schema.json`.
- Generated examples are JSON only.
- Storybook stories are post-P0.
