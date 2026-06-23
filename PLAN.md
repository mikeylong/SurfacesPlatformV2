# Surfaces Platform V2 Plan

## Working Thesis
Surfaces Platform V2 compiles design-system source material into governed UI contracts that agents can use for bounded generation, CI/CD validation, evidence review, and runtime-safe rendering.

## P0 Focus
P0 is a docs/spec revision for one executable contract. It stops describing desired behavior and specifies the exact schema files, fixture files, output artifacts, diagnostics, and pass/fail gates that an implementation must satisfy.

The proof path is:

```text
fixtures/p0/source.fixture.json
  -> artifacts/p0/extract.json
  -> artifacts/p0/catalog.json
  -> artifacts/p0/governed-catalog.json
  -> validate fixtures/p0/mutations/*.json against expected source/artifact mutation failures
  -> validate fixtures/p0/valid.surface-ir.json, fixtures/p0/invalid/*.json, and fixtures/p0/review/*.json
  -> artifacts/p0/adapter-diagnostics.json
  -> artifacts/p0/evidence.json
```

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

## Product Shape
- Surfaces.systems: category and product home. Context-only for P0.
- Surfaces.dev: agent-ready instructions with human-readable intent. Context-only for P0.
- JudgmentKit: judgment layer for activity fit, contract quality, evidence, and handoff. Context-only for P0 unless the proof records evaluator metadata.
- interfacectl: compiler, validation, and enforcement tooling. P0 specifies one future CLI proof command but does not implement it.
- SurfaceOps: operational review surface. Context-only for P0; it may consume `evidence.json` later.
- Surfaces Catalog: product-facing name for the governed design-system catalog/compiler artifact.
- `runtime-catalog.v0`: schema/artifact id for the P0 Surfaces Catalog.
- A2UI: reference-only for P0. Post-P0, Surfaces may emit A2UI-compatible projections/exports from the governed Surfaces Catalog and validate those projections against A2UI conformance; P0 does not define an A2UI adapter.

## Missing Layer
Define the Surfaces Catalog as the governed design-system contract that decides what agents may emit and what future runtime adapters may render, reject, or send to review.

## P0 Architecture
1. Schema Contracts
2. P0 Fixture
3. Design-System Extractor
4. Catalog Compiler
5. Governance Layer
6. Surface IR Validation
7. Adapter Conformance Check
8. Final Evidence Layer
9. Future Runtime Adapter Notes

## P0 Acceptance Criteria
- The schema suite is specified: `runtime-catalog.v0.schema.json`, `surface-ir.v0.schema.json`, `fixture-expectations.v0.schema.json`, `extract.v0.schema.json`, `adapter-diagnostics.v0.schema.json`, `evidence.v0.schema.json`, and `diagnostics.v0.schema.json`.
- One golden fixture source produces deterministic `extract.json`, `catalog.json`, and `governed-catalog.json`.
- `fixtures/p0/expectations.manifest.json` declares every fixture input, expected stage, expected phase, expected validation result, expected promotion status, and expected diagnostic code.
- `fixtures/p0/valid.surface-ir.json` passes catalog, governance, accessibility, token-ref, action, and provenance validation.
- Every file in `fixtures/p0/invalid/` fails according to the manifest.
- Every file in `fixtures/p0/mutations/` fails in the expected extractor, compiler, validation, or evidence phase according to the manifest.
- Every file in `fixtures/p0/review/` is structurally valid according to the manifest, records `review_required`, blocks unattended promotion, and does not execute runtime behavior.
- `adapter-diagnostics.json` proves a consumer can reject every P0 invalid fixture, block every review fixture, and avoid action execution without building a renderer.
- `evidence.json` is finalized after adapter diagnostics and records validation results, diagnostics, artifact hashes, provenance, evaluator metadata, run id, and pass/fail status.
- Diagnostic messages in hashed evidence use canonical registry wording; validator-native schema error text is non-normative.
- Evidence canonicalization follows RFC 8785/JCS with I-JSON numeric input constraints.
- The proof command rejects stale unexpected files or directories under `--out` before writing the exact P0 artifact set.

## Subplans
- [Subplan Index](plans/README.md)
- [Runtime Catalog v0](plans/runtime-catalog-v0.md)
- [Product Boundaries](plans/product-boundaries.md)
- [P0 Fixture](plans/p0-fixture.md)
- [Design-System Extractor](plans/design-system-extractor.md)
- [Catalog Compiler](plans/catalog-compiler.md)
- [Governance Layer](plans/governance-layer.md)
- [Generation Harness](plans/generation-harness.md)
- [Adapter Conformance](plans/adapter-conformance.md)
- [Validation and Evidence](plans/validation-evidence.md)
- [Runtime Adapter](plans/runtime-adapter.md)

## P0 Decisions
- Runtime catalog name and boundary: Surfaces Catalog / `runtime-catalog.v0`, a governed design-system catalog/compiler artifact.
- A2UI role: reference-only for P0; possible downstream projection/export conformance target after P0.
- Proof fixture: `fixtures/p0/source.fixture.json` plus mutation, valid, invalid, and review fixtures.
- Surface IR role: internal P0 validation fixture, not a public protocol.
- Proof command: `interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0`.
- Promotion statuses: `allowed`, `review_required`, and `blocked`.

## Non-Goals For First Pass
- No full product scaffold.
- No copied legacy implementation.
- No live Figma ingestion before fixture-based compiler proof.
- No runtime renderer before the catalog contract is clear.
- No broad A2UI compatibility layer.
- No implementation files beyond the docs/spec contract in this pass.
