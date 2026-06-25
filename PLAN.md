# Surfaces Platform V2 Plan

## Vision Source
Read [Surfaces Platform Vision And Roadmap](VISION.md) before selecting or implementing phase work. That file defines the product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. `PLAN.md` remains the mechanical proof-plan reference for schemas, fixtures, commands, artifacts, diagnostics, and acceptance criteria. Phase entries add only phase-local deltas and mechanics.

## Plan Scope
Subordinate to [VISION.md](VISION.md), this plan tracks the mechanical proof contracts for compiling design-system source material into governed UI contracts for bounded generation, CI/CD validation, evidence review, and runtime-safe rendering.

## P0 Focus
P0 establishes one executable catalog proof contract. It specifies and implements the exact schema files, fixture files, output artifacts, diagnostics, and pass/fail gates that the proof must satisfy.

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

## P0/P1 Surface Mechanics
The canonical surface-role taxonomy lives in [VISION.md](VISION.md#surface-roles). The P0/P1 proof implications are:

- Surfaces.systems: context-only for P0/P1; no validation or enforcement ownership.
- Surfaces.dev: instruction context for P0/P1; no schema, manifest, or CLI proof ownership.
- JudgmentKit: deferred to the P4 review and judgment proof; P0/P1 may record evaluator metadata only.
- `interfacectl`: compiler, validation, and enforcement tooling. P0 implements the catalog proof command; P1 implements the adapter proof command.
- SurfaceOps: deferred to the P4 review and judgment proof; P0/P1 preserve review-required evidence only.
- Surfaces Catalog: product-facing name for the governed design-system catalog/compiler artifact defined by VISION as the governed contract authority.
- `runtime-catalog.v0`: schema/artifact id for the P0 Surfaces Catalog.
- A2UI: reference-only before P5. P5 may emit A2UI-compatible projections/exports from the governed Surfaces Catalog and validate those projections against A2UI conformance; P0/P1 do not define an A2UI adapter or data model.

## P0 Catalog Contract Implication
Subordinate to the authority model in [VISION.md](VISION.md#canonical-authority-model), the P0 Surfaces Catalog contract decides what fixture-backed Surface IR may emit and what proof consumers, runtime projections, and future adapters may render as inert plans, reject, or send to review.

## P0 Architecture
1. Schema Contracts
2. P0/P1 Product Boundaries
3. P0 Fixture
4. Design-System Extractor
5. Catalog Compiler
6. Governance Layer
7. Surface IR Validation
8. Adapter Conformance Check
9. Final Evidence Layer
10. Runtime Adapter Boundary Notes

## P0 Acceptance Criteria
- The schema suite is specified: `runtime-catalog.v0.schema.json`, `surface-ir.v0.schema.json`, `fixture-expectations.v0.schema.json`, `extract.v0.schema.json`, `adapter-diagnostics.v0.schema.json`, `evidence.v0.schema.json`, and `diagnostics.v0.schema.json`.
- The P0 proof gate is closed over the P0-owned schema suite above. The shared `schemas/` root may also contain regular future phase-owned `*.vN.schema.json` files without adding them to P0 proof authority, evidence, or drift expectations; missing or tampered P0 schemas and non-regular schema-root entries still fail closed.
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
- `check:p0:ci` must combine tracked drift checks with a P0 untracked-file guard because `git diff --exit-code` does not report untracked generated or source files.

## P1 Focus
P1 proves a governed product surface through a `web-static` runtime projection and deterministic render-plan proof. It is not a product mock, general DOM runtime, React package, native adapter, P5 A2UI adapter, SurfaceOps console, JudgmentKit evaluator, or public Surface IR protocol.

The P1 proof path is:

```text
artifacts/p0/evidence.json
artifacts/p0/governed-catalog.json
artifacts/p0/adapter-diagnostics.json
  -> artifacts/p1/runtime-projection.json
fixtures/p1/expectations.manifest.json
  -> validate fixtures/p1/mutations/*.json against expected projection/evidence failures
  -> validate fixtures/p1/valid/*.json, fixtures/p1/invalid/*.json, and fixtures/p1/review/*.json
  -> artifacts/p1/render-plan.confirm-panel.json
  -> artifacts/p1/render-plan.status-callout.json
  -> artifacts/p1/render-plan.button-defaults.json
  -> artifacts/p1/runtime-adapter-report.json
  -> artifacts/p1/evidence.json
  -> demo/p1/index.html
```

## P1 Proof Command

```bash
interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1
```

## P1 Pass Condition
Given a valid P0 proof and the P1 fixture set, the adapter proof command emits the exact P1 artifacts, creates a hash-bound `web-static` runtime projection from the governed catalog, validates every P1 fixture against the manifest, emits deterministic render plans for allowed surfaces only, blocks invalid and review-required usage without executing actions, records adapter diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P1 schema, fixture, input artifact, generated proof artifact under `artifacts/p1`, and final evidence artifact.

## P1 Architecture
1. P1 Product Boundaries
2. Runtime Projection v0
3. P1 Fixture
4. Runtime Adapter Proof
5. Validation And Evidence
6. Demo And CI

## P1 Acceptance Criteria
- P0 proof still passes unchanged before and after P1 work.
- `runtime-projection.json` is derived from `artifacts/p0/governed-catalog.json` and hash-verified against P0 evidence.
- Runtime projection cannot introduce components, props, actions, token refs, data bindings, governance rules, or promotion statuses absent from the governed catalog.
- Surface IR fixtures cannot reference actions, events, slots, token keys, token refs, data bindings, variants, or states absent from the runtime projection.
- Valid P1 fixtures produce deterministic render plans.
- Invalid P1 fixtures and inherited P0 invalid behavior remain blocked with expected diagnostics.
- Review-required fixtures remain structurally valid, record `review_required`, execute no actions, and block unattended promotion.
- Render plans contain inert action descriptors only: no callbacks, RPC, workflow triggers, network calls, or side effects.
- `runtime-adapter-report.json` records every expected and actual result before final P1 evidence.
- P1 evidence hashes upstream P0 artifacts, P1 schemas, P1 fixtures, generated P1 artifacts, and itself under the same canonicalization discipline as P0.
- The P1 proof gate is closed over the P0 and P1 schema suites it consumes. Regular future phase-owned schemas under `schemas/` do not enter P1 proof authority or evidence, while missing or tampered P0/P1 schemas and non-regular schema-root entries still fail closed.
- `demo/p1/index.html` is generated from P1 proof artifacts and does not count as proof unless the underlying P1 evidence passes.
- Review-required P1 fixtures are report/evidence-only and must not produce render-plan artifacts.

## P2 Focus
P2 proves deterministic local ingestion for the pinned `@adobe/spectrum-design-data@0.7.0` source snapshot, scoped to `button` and `in-line-alert`. It is a deterministic ingestion proof, not a live Figma integration, Storybook crawler, docs crawler, production sync service, runtime adapter, SurfaceOps workflow, JudgmentKit evaluator, or agent orchestration proof.

The P2 proof path is:

```text
sources/p2/design-system-source/manifest.json
manifest-declared source files, required mappings, and policy refs
fixtures/p2/expectations.manifest.json
  -> artifacts/p2/source-inventory.json
  -> artifacts/p2/source-mapping.json
  -> artifacts/p2/extract.json
  -> artifacts/p2/catalog.json
  -> artifacts/p2/governed-catalog.json
  -> validate fixtures/p2/valid/*.json
  -> validate fixtures/p2/mutations/*.json against expected source/mapping/extraction/evidence failures
  -> validate fixtures/p2/invalid/*.json and fixtures/p2/review/*.json
  -> artifacts/p2/ingestion-report.json
  -> artifacts/p2/evidence.json
  -> demo/p2/index.html
```

## P2 Proof Command

```bash
interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

Package scripts and tests execute this as `node bin/interfacectl.js surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2`. P2 evidence records the logical command string above to preserve the P0/P1 evidence convention.

## P2 Pass Condition
Given a declared design-system source bundle and the P2 fixture set, the ingest proof command emits the exact P2 artifacts, verifies source hashes, creates deterministic source inventory and mapping artifacts, extracts normalized design-system material with source refs, compiles catalog and governed catalog artifacts, validates positive Spectrum coverage for `button` and `in-line-alert`, blocks invalid and mutation cases with registry-backed diagnostics, preserves review-required manual mapping cases without promotion, records ingestion diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P2-owned schema, consumed shared schema, source input, fixture, generated artifact, and final evidence artifact.

## P2 Architecture
1. P2 Product Boundaries
2. Source Strategy
3. Ingestion Fixture
4. Ingestion Proof
5. Validation And Evidence
6. Demo And CI

## P2 Acceptance Criteria
- P0 and P1 proof gates still pass unchanged before and after P2 work.
- `sources/p2/design-system-source/manifest.json` declares the first pilot target as Adobe Spectrum Design Data, `@adobe/spectrum-design-data@0.7.0`, with npm package integrity, source snapshot paths, source-ref grammar, required mappings, policy refs, source hashes, and the initial component subset `button` and `in-line-alert`.
- P2 preflight validates the declared source manifest and hashes before extraction.
- Source inventory and source mapping cannot read outside the declared source bundle or promote catalog behavior absent from declared source material.
- Every extracted token, component, prop, variant, state, slot, action, accessibility rule, example, and governance rule preserves source refs.
- Unsupported, ambiguous, unmapped, or governance-incomplete source material blocks or routes to review according to `fixtures/p2/expectations.manifest.json`.
- `ingestion-report.json` records every expected and actual source, mapping, extraction, governance, fixture, and diagnostic result before final P2 evidence.
- P2 evidence hashes P2-owned schemas, every shared schema it consumes for extract/catalog/diagnostics/expectations/evidence/governed-catalog behavior, source inputs, P2 fixtures, generated P2 artifacts, and itself under the same canonicalization discipline as P0/P1.
- `demo/p2/index.html` is generated from P2 proof artifacts and does not count as proof unless the underlying P2 evidence passes.

## P3 Focus
P3 proves that Surfaces Platform can recruit and orchestrate agents through governed, evidence-bound work orders after P2 real design-system ingestion passes. It is a deterministic agent orchestration proof, not a live multi-agent runtime, background job system, prompt library, human workflow app, SurfaceOps console, JudgmentKit execution path, or generalized task marketplace.

The P3 proof path is:

```text
artifacts/p2/evidence.json
artifacts/p2/governed-catalog.json
fixtures/p3/agent-capability-registry.fixture.json
fixtures/p3/expectations.manifest.json
  -> artifacts/p3/agent-capability-registry.json
  -> validate fixtures/p3/mutations/*.json against expected registry/recruitment/orchestration/evidence failures
  -> validate fixtures/p3/valid/*.json, fixtures/p3/invalid/*.json, and fixtures/p3/review/*.json
  -> artifacts/p3/orchestration-plan.json
  -> artifacts/p3/work-order.contract-architect.json
  -> artifacts/p3/work-order.fixture-author.json
  -> artifacts/p3/work-order.evidence-reviewer.json
  -> artifacts/p3/review-queue.json
  -> artifacts/p3/agent-orchestration-report.json
  -> artifacts/p3/evidence.json
  -> demo/p3/index.html
```

## P3 Proof Command

```bash
interfacectl surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3
```

This remains a planned P3 command until that phase adds its schemas, fixtures, diagnostics, command implementation, artifacts, report, demo, and evidence.

## P3 Pass Condition
Given valid P2 ingestion evidence and the P3 fixture set, the agents proof command emits the exact P3 artifacts, creates a hash-bound agent capability registry, recruits only registered capabilities for declared task requirements, produces deterministic scoped work orders, blocks unregistered capabilities and scope escalation, routes review-required work to a non-executable review queue, records orchestration diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P3 schema, fixture, input artifact, generated proof artifact under `artifacts/p3`, and final evidence artifact.

## P3 Architecture
1. P3 Product Boundaries
2. Agent Capability Registry v0
3. Recruitment Policy
4. Orchestration Fixture
5. Orchestration Proof
6. Review Queue v0
7. Validation And Evidence
8. Demo And CI

## P3 Acceptance Criteria
- P0, P1, and P2 proof gates still pass unchanged before and after P3 work.
- P3 preflight validates the consumed P2 governed catalog and P2 evidence before recruitment.
- `agent-capability-registry.json` is derived from `fixtures/p3/agent-capability-registry.fixture.json` and hash-bound to upstream P2 refs.
- Recruitment cannot select unregistered agents, undeclared capabilities, denied tools, hidden outputs, or artifact paths outside the resolved work-order scope.
- Orchestration plans must be deterministic DAGs with no cycles, missing dependencies, duplicate work-order ids, or hidden handoffs.
- Work orders contain inert assignments only: no live tool calls, subprocesses, network calls, secrets, callbacks, autonomous edits, or executable output.
- `review-queue.json` is always emitted, conforms to `agent-review-queue.v0`, and keeps review-required work non-executable.
- Invalid P3 fixtures and mutation fixtures fail according to `fixtures/p3/expectations.manifest.json`.
- `agent-orchestration-report.json` records every expected and actual recruitment/orchestration result before final P3 evidence.
- P3 evidence hashes upstream P2 artifacts, P3 schemas, P3 fixtures, generated P3 artifacts, and itself under the same canonicalization discipline as P0/P1/P2.
- `demo/p3/index.html` is generated from P3 proof artifacts and does not count as proof unless the underlying P3 evidence passes.

## Subplans
- [Subplan Index](plans/README.md)
- [Runtime Catalog v0](plans/runtime-catalog-v0.md)
- [P0/P1 Product Boundaries](plans/product-boundaries.md)
- [P0 Fixture](plans/p0-fixture.md)
- [Design-System Extractor](plans/design-system-extractor.md)
- [Catalog Compiler](plans/catalog-compiler.md)
- [Governance Layer](plans/governance-layer.md)
- [Generation Harness](plans/generation-harness.md)
- [Adapter Conformance](plans/adapter-conformance.md)
- [Validation and Evidence](plans/validation-evidence.md)
- [Runtime Adapter](plans/runtime-adapter.md)
- [P1 Subplan Index](plans/p1/README.md)
- [P1 Product Boundaries](plans/p1/product-boundaries.md)
- [Runtime Projection v0](plans/p1/runtime-projection-v0.md)
- [P1 Fixture](plans/p1/p1-fixture.md)
- [Runtime Adapter Proof](plans/p1/runtime-adapter-proof.md)
- [P1 Validation and Evidence](plans/p1/validation-evidence.md)
- [P1 Demo and CI](plans/p1/demo-ci.md)
- [P2 Subplan Index](plans/p2/README.md)
- [P2 Product Boundaries](plans/p2/product-boundaries.md)
- [P2 Source Strategy](plans/p2/source-strategy.md)
- [P2 Ingestion Fixture](plans/p2/ingestion-fixture.md)
- [P2 Ingestion Proof](plans/p2/ingestion-proof.md)
- [P2 Validation and Evidence](plans/p2/validation-evidence.md)
- [P2 Demo and CI](plans/p2/demo-ci.md)
- [P3 Subplan Index](plans/p3/README.md)
- [P3 Product Boundaries](plans/p3/product-boundaries.md)
- [Agent Capability Registry v0](plans/p3/agent-capability-registry-v0.md)
- [Recruitment Policy](plans/p3/recruitment-policy.md)
- [Orchestration Fixture](plans/p3/orchestration-fixture.md)
- [Orchestration Proof](plans/p3/orchestration-proof.md)
- [Review Queue v0](plans/p3/review-queue-v0.md)
- [P3 Validation and Evidence](plans/p3/validation-evidence.md)
- [P3 Demo and CI](plans/p3/demo-ci.md)
- [Surfaces.dev Documentation Tracking](plans/surfaces-dev.md)

## P0 Decisions
- Runtime catalog name and boundary: Surfaces Catalog / `runtime-catalog.v0`, a governed design-system catalog/compiler artifact.
- A2UI role: reference-only before P5; possible downstream projection/export conformance target only at the P5 gate.
- Proof fixture: `fixtures/p0/source.fixture.json` plus mutation, valid, invalid, and review fixtures.
- Surface IR role: internal P0 validation fixture, not a public protocol.
- Proof command: `interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0`.
- Promotion statuses: `allowed`, `review_required`, and `blocked`.

## P1 Decisions
- First runtime target: `web-static`.
- First runtime boundary: adapter-specific `runtime-projection.v0`, not direct renderer consumption of the full governed catalog.
- First product-visible output: generated static demo from proof artifacts, not hand-authored product UI.
- A2UI remains deferred to P5 as a downstream projection target, not the P1 adapter or data model.
- Actions remain inert descriptors in P1; no live execution is allowed.
- Demo output is checked by drift and generated from evidence, but final P1 proof authority stays in `artifacts/p1/evidence.json`.

## P2 Decisions
- First real-ingestion target: Adobe Spectrum Design Data, pinned as `@adobe/spectrum-design-data@0.7.0` with npm integrity `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`.
- Initial component subset: Spectrum `button` and `in-line-alert`.
- First source boundary: `sources/p2/design-system-source/manifest.json`, source inventory, source mapping, extract, catalog, governed catalog, ingestion report, and evidence.
- P2 chooses a declared source bundle over live source APIs so the first real-ingestion proof remains deterministic.
- P2 may preserve review-required mapping rows, but it does not build SurfaceOps persistence.
- JudgmentKit remains evaluation metadata only unless a later proof defines evaluator execution.
- P2 may be described as implemented or shipped only for deterministic local npm package ingestion from the declared `@adobe/spectrum-design-data@0.7.0` source snapshot, initially scoped to `button` and `in-line-alert`, when `artifacts/p2/evidence.json` passes. It must not be described as full Spectrum support, live ingestion, runtime adapter rendering, SurfaceOps operation, JudgmentKit evaluation, P3 orchestration, or Adobe endorsement.
- P2 merge evidence lives with the PR or merge record: preserve the proof-bearing gate logs, commit SHA, and final `artifacts/p2/evidence.json` hash there. Do not add gate logs or merge records under `artifacts/p2`.

## P3 Decisions
- First agent-control target: deterministic agent orchestration proof.
- First agent boundary: `agent-capability-registry.v0`, `agent-work-order.v0`, and `agent-review-queue.v0`, not direct live agent execution.
- First orchestration output: generated task DAG, scoped work orders, review queue, report, evidence, and static demo from proof artifacts.
- SurfaceOps remains a later operational review product; P3 emits a review queue artifact but no persistent review console.
- JudgmentKit remains evaluation metadata only unless a later proof defines evaluator execution.
- Agent work orders are inert descriptors in P3; they authorize no actual tool execution, file edits, network calls, side effects, or future outputs.

## Non-Goals For P0/P1
- No full product scaffold.
- No copied legacy implementation.
- No live Figma ingestion before fixture-based compiler proof.
- No live or general-purpose runtime renderer in P0/P1; P1 stops at `web-static` projection, deterministic render plans, generated demos, and evidence.
- No broad A2UI compatibility layer before P5.
- No production product implementation or live operational surface in P0/P1 beyond proof tooling, generated artifacts, generated demos, and tests.

## Non-Goals For P2
- No Figma export ingestion.
- No Storybook server scraping or code-doc metadata ingestion.
- No Code Connect parser or Code Connect mapping ingestion.
- No docs crawler.
- No production HTML extraction or source input in P2.
- No agent recruitment or work-order generation.
- No SurfaceOps review-decision persistence.
- No JudgmentKit evaluator execution.
- No relaxation of P0/P1 catalog, projection, evidence, or review gates.

## Non-Goals For P3
- No live multi-agent execution.
- No autonomous code edits by recruited agents.
- No plugin, connector, shell, network, or file-system tool invocation from generated work orders.
- No task marketplace, scheduling system, or persistent queue.
- No SurfaceOps review-decision persistence.
- No JudgmentKit evaluator execution.
- No relaxation of P2 catalog, ingestion evidence, or review gates.
