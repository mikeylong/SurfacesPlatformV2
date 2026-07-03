# Surfaces Platform V2 Plan

## Vision Source
Read [Surfaces Platform Vision And Roadmap](VISION.md) before selecting or implementing phase work. That file defines the product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. `PLAN.md` remains the mechanical proof-plan reference for schemas, fixtures, commands, artifacts, diagnostics, and acceptance criteria. Phase entries add only phase-local deltas and mechanics.

## Plan Scope
Subordinate to [VISION.md](VISION.md), this plan tracks the mechanical proof contracts for compiling design-system source material into governed UI contracts for bounded generation, CI/CD validation, evidence review, and runtime-safe rendering.

Cross-cutting product and value documentation lives in [Product Portfolio Boundaries](plans/product-portfolio-boundaries.md), [SurfaceOps Product Brief](plans/surfaceops-product-brief.md), [SurfaceOps UI Decisions And Review Criteria](plans/surfaceops-ui-decisions-review-criteria.md), [Product Designer Workflow](plans/product-designer-workflow.md), [Product Designer Workflow Trace](plans/product-designer-workflow-trace.md), and [Usability And Value Evidence Plan](plans/usability-value-evidence.md). Those files are subordinate to `VISION.md` and must not redefine product authority, roadmap sequence, or implemented proof status.

Any implementation or roadmap-status claim should cite the phase proof command, evidence path, evidence `status`, promotion status, and relevant CI gate. Generated demos may help present the claim, but demos are not proof authority.

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

- `surfaces.systems`: context-only for P0/P1; no validation or enforcement ownership.
- `surfaces.dev`: instruction context for P0/P1; no schema, manifest, or CLI proof ownership.
- JudgmentKit: deferred to the P4 review and judgment proof; P0/P1 may record evaluator metadata only.
- `interfacectl`: compiler, validation, and enforcement tooling. P0 implements the catalog proof command; P1 implements the adapter proof command.
- SurfaceOps: deferred to the P4 review and judgment proof; P0/P1 preserve review-required evidence only.
- Surfaces Catalog: product-facing name for the governed design-system catalog/compiler artifact defined by VISION as the governed contract authority.
- `runtime-catalog.v0`: schema/artifact id for the P0 Surfaces Catalog.
- A2UI: reference-only before a future A2UI-specific P5 target. A future A2UI-specific P5 proof may emit projections, exports, or conformance artifacts from the governed Surfaces Catalog; P0/P1 and the first `surfaces-protocol-static` P5 slice do not define an A2UI adapter or data model.

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
P1 proves a governed product surface through a `web-static` runtime projection and deterministic render-plan proof. It is not a product mock, general DOM runtime, React package, native adapter, A2UI adapter, SurfaceOps console, JudgmentKit evaluator, or public Surface IR protocol.

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
  -> validate fixtures/p3/mutations/*.agent-preflight.json against expected upstream-preflight failures
  -> artifacts/p3/agent-capability-registry.json
  -> validate remaining fixtures/p3/mutations/*.json against expected registry/recruitment/orchestration/evidence failures
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

Package scripts and tests execute this as `node bin/interfacectl.js surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3`. P3 evidence records the logical command string above.

## P3 Pass Condition
Given valid P2 ingestion evidence and the P3 fixture set, the agents proof command emits the exact P3 artifacts, creates a hash-bound agent capability registry, recruits only registered capabilities for declared task requirements, produces deterministic scoped work orders, blocks unregistered capabilities and scope escalation, routes review-required work to a non-executable review queue, records orchestration diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P3 schema, fixture, input artifact, generated proof artifact under `artifacts/p3`, and final evidence artifact.

P3 generated artifact refs must be acyclic: forward refs to later same-run artifacts omit hashes, resolved backward refs to already materialized artifacts may include hashes, and final P3 evidence owns the complete hash closure.

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
- P3 preflight validates the consumed P2 governed catalog and P2 evidence before recruitment and before reading P3 registry or task fixtures.
- `agent-capability-registry.json` is derived from `fixtures/p3/agent-capability-registry.fixture.json` after that fixture validates against `agent-capability-registry-fixture.v0`, then hash-bound to upstream P2 refs.
- Recruitment cannot select unregistered agents, undeclared capabilities, denied tools, hidden outputs, or artifact paths outside the resolved intersection of task request, registry agent scope, and registry capability scope.
- Orchestration plans must be deterministic DAGs with no cycles, missing dependencies, duplicate task ids, duplicate work-order ids, or hidden handoffs.
- Work orders contain inert assignments only: no live tool calls, subprocesses, network calls, secrets, callbacks, autonomous edits, or executable output.
- `review-queue.json` is always emitted, conforms to `agent-review-queue.v0`, and keeps review-required work non-executable.
- Invalid P3 fixtures and mutation fixtures fail according to `fixtures/p3/expectations.manifest.json`.
- `agent-orchestration-report.json` records every expected and actual recruitment/orchestration result before final P3 evidence.
- P3 evidence hashes upstream P2 artifacts, P3 schemas, P3 fixtures, generated P3 artifacts, and itself under the same canonicalization discipline as P0/P1/P2.
- `demo/p3/index.html` is generated from P3 proof artifacts and does not count as proof unless the underlying P3 evidence passes.

## P4 Focus
P4 implements the first deterministic review and judgment proof. It consumes accepted P3 orchestration evidence and the P3 review queue, then proves SurfaceOps decision and JudgmentKit-shaped evaluation artifacts as derived consumers. SurfaceOps owns approve, reject, request-changes, and defer decision coverage; only manifest-committed decisions are ledger rows, while coverage-only outcomes remain validation/report rows. JudgmentKit-shaped reports remain evaluation-only findings and cannot encode or override decision status. P4 is not a live SurfaceOps console, live JudgmentKit invocation, production workflow, work-order runtime, production adapter, protocol boundary, or A2UI export.

The P4 proof path is:

```text
artifacts/p3/evidence.json
artifacts/p3/review-queue.json
artifacts/p3/agent-orchestration-report.json
fixtures/p4/expectations.manifest.json
  -> validate fixtures/p4/mutations/*.review-preflight.json against expected upstream-preflight failures
  -> validate fixtures/p4/valid/*.json, fixtures/p4/invalid/*.json, fixtures/p4/review/*.json, and remaining fixtures/p4/mutations/*.json
  -> artifacts/p4/surfaceops-decision-ledger.json
  -> artifacts/p4/judgmentkit-evaluation-report.json
  -> artifacts/p4/review-judgment-report.json
  -> artifacts/p4/evidence.json
  -> demo/p4/index.html
```

## P4 Proof Command

Implemented command:

```bash
interfacectl surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4
```

Package scripts execute this as `node bin/interfacectl.js surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4`. P4 evidence records the logical command string above.

## P4 Pass Condition
Given valid P3 orchestration evidence, a valid P3 review queue, and the P4 fixture set, the review proof command emits the exact P4 artifacts, creates a deterministic SurfaceOps decision ledger for manifest-committed decisions, keeps reject, request-changes, and defer outcomes covered in validation/report rows without duplicating committed ledger entries for the same P3 review item, emits a deterministic evaluation-only JudgmentKit-shaped report, blocks invalid SurfaceOps decision rows and any JudgmentKit-shaped finding that attempts to approve, reject, request changes, route, promote, or override policy, preserves second-review-required cases without execution, records review/judgment diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P4 schema, fixture, input artifact, generated proof artifact under `artifacts/p4`, and final evidence artifact.

P4 generated artifact refs must be acyclic: forward refs to later same-run artifacts omit hashes, resolved backward refs to already materialized artifacts may include hashes, and final P4 evidence owns the complete hash closure.

## P4 Architecture
1. P4 Product Boundaries
2. SurfaceOps Decision Model v0
3. JudgmentKit Evaluation v0
4. Review And Judgment Fixture
5. Review And Judgment Proof
6. Validation And Evidence
7. Demo And CI

## P4 Acceptance Criteria
- P0, P1, P2, and P3 proof gates still pass unchanged before and after P4 work.
- P4 preflight validates consumed P3 evidence and review queue hashes before reading P4 fixtures or writing P4 artifacts.
- `surfaceops-decision-ledger.json` records deterministic review decisions with queue item refs, evidence refs, reviewer provenance, rationale, decision status, and aggregate promotion status.
- SurfaceOps decisions cannot rewrite catalog policy, mutate P3 artifacts, execute work orders, or introduce hidden review state.
- `judgmentkit-evaluation-report.json` records deterministic findings for activity fit, contract quality, evidence quality, and handoff quality.
- JudgmentKit-shaped findings cannot approve, reject, request changes, defer, route, promote, mutate, render, execute, or override catalog policy or SurfaceOps decision authority.
- Invalid P4 fixtures and mutation fixtures fail according to `fixtures/p4/expectations.manifest.json`.
- `review-judgment-report.json` records every expected and actual review/judgment result before final P4 evidence.
- P4 evidence hashes upstream P3 artifacts, P4 schemas, P4 fixtures, generated P4 artifacts, and itself under the same canonicalization discipline as P0/P1/P2/P3.
- `demo/p4/index.html` is generated from P4 proof artifacts and does not count as proof unless the underlying P4 evidence passes.

## P5 Focus
P5 implements the first bounded protocol-boundary proof through the `surfaces-protocol-static` target. It consumes accepted P2 catalog/evidence and accepted P4 review/judgment evidence, then proves deterministic inert protocol envelopes as derived artifacts. This slice is a protocol-envelope proof only: it is not a production adapter, public Surface IR protocol, public API, SDK, live protocol service, A2UI export, A2UI conformance proof, live SurfaceOps persistence path, live JudgmentKit invocation, or work-order execution path.

The P5 protocol proof path is:

```text
artifacts/p2/evidence.json
artifacts/p2/governed-catalog.json
artifacts/p4/evidence.json
artifacts/p4/surfaceops-decision-ledger.json
artifacts/p4/review-judgment-report.json
fixtures/p5/protocol/adapter-target-selection.fixture.json
fixtures/p5/protocol/expectations.manifest.json
  -> validate fixtures/p5/protocol/mutations/*.protocol-preflight.json against expected upstream-preflight failures
  -> artifacts/p5/protocol/adapter-target-selection.json
  -> artifacts/p5/protocol/protocol-projection.json
  -> validate fixtures/p5/protocol/valid/*.json, fixtures/p5/protocol/review/*.json, fixtures/p5/protocol/invalid/*.json, and remaining fixtures/p5/protocol/mutations/*.json
  -> artifacts/p5/protocol/protocol-envelope.button.json
  -> artifacts/p5/protocol/protocol-envelope.in-line-alert.json
  -> artifacts/p5/protocol/protocol-adapter-report.json
  -> artifacts/p5/protocol/evidence.json
  -> demo/p5/protocol/index.html
```

## P5 Proof Command

Implemented command:

```bash
interfacectl surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol
```

Package scripts execute this as `node bin/interfacectl.js surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol`. P5 evidence records the logical command string above.

## P5 Pass Condition
Given valid P2 ingestion evidence, the P2 governed catalog, valid P4 review/judgment evidence, the P4 decision ledger, the P4 review/judgment report, and the P5 protocol fixture set, the protocol proof command emits the exact P5 protocol artifact set, validates upstream hashes and target selection, creates a hash-bound `surfaces-protocol-static` projection, validates every fixture against the expectations manifest, emits deterministic inert protocol envelopes for allowed surfaces only, blocks invalid and review-required usage without executing actions or calling live services, records protocol diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P5 schema, fixture, input artifact, generated proof artifact under `artifacts/p5/protocol`, and final evidence artifact.

## P5 Architecture
1. P5 Product Boundaries
2. Adapter Target Selection
3. Protocol Projection v0
4. Protocol Fixture
5. Protocol Adapter Proof
6. Validation And Evidence
7. Demo And CI

## P5 Acceptance Criteria
- P0, P1, P2, P3, and P4 proof gates still pass unchanged before and after P5 work.
- P5 preflight validates consumed P2 evidence, P2 governed catalog, P4 evidence, P4 decision ledger, and P4 review/judgment report hashes before reading P5 target or Surface IR fixtures.
- Target selection declares exactly `surfaces-protocol-static` and cannot expand beyond accepted upstream component, action, token, data-binding, accessibility, governance, or evidence authority.
- `protocol-projection.json` is derived from the governed P2 catalog and accepted P2/P4 evidence refs, not from fixture convenience, demo output, live services, or reviewer preference.
- Protocol envelopes contain declarative data only, with inert action descriptors, `executed: false`, `sideEffects: []`, and `transport: "none"`.
- Review-required fixtures remain structurally valid, record `review_required`, execute no actions, and emit no protocol-envelope artifacts.
- Invalid and mutation fixtures fail according to `fixtures/p5/protocol/expectations.manifest.json`.
- `protocol-adapter-report.json` records every expected and actual target-selection, projection, protocol-boundary, report, evidence, fixture, and diagnostic result before final P5 evidence.
- P5 evidence hashes upstream P2/P4 artifacts, P5 schemas, P5 fixtures, generated P5 artifacts, and itself under the same canonicalization discipline as P0/P1/P2/P3/P4.
- `demo/p5/protocol/index.html` is generated from P5 proof artifacts and does not count as proof unless the underlying P5 evidence passes.

P5 also implements the sibling `surfaces-native-static` target. It is a Surfaces-native proof-only inert static-packet target, not an A2UI clone, A2UI conformance proof, production API, native SDK, native bridge, live runtime, or expansion of `surfaces-protocol-static`.

The P5 native proof path is:

```text
artifacts/p2/evidence.json
artifacts/p2/governed-catalog.json
artifacts/p4/evidence.json
artifacts/p4/surfaceops-decision-ledger.json
artifacts/p4/review-judgment-report.json
artifacts/p5/protocol/evidence.json
fixtures/p5/native/adapter-target-selection.fixture.json
fixtures/p5/native/expectations.manifest.json
  -> validate fixtures/p5/native/mutations/*.native-preflight.json against expected upstream and compatibility-preflight failures
  -> artifacts/p5/native/adapter-target-selection.json
  -> artifacts/p5/native/surfaces-native-projection.json
  -> validate fixtures/p5/native/valid/*.json, fixtures/p5/native/review/*.json, fixtures/p5/native/invalid/*.json, and remaining fixtures/p5/native/mutations/*.json
  -> artifacts/p5/native/surfaces-native-packet.button.json
  -> artifacts/p5/native/surfaces-native-packet.in-line-alert.json
  -> artifacts/p5/native/surfaces-native-report.json
  -> artifacts/p5/native/evidence.json
  -> demo/p5/native/index.html
```

Native proof command:

```bash
interfacectl surfaces native proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --protocol-evidence artifacts/p5/protocol/evidence.json --fixture fixtures/p5/native --out artifacts/p5/native
```

Given valid P2 ingestion evidence, the P2 governed catalog, valid P4 review/judgment evidence, the P4 decision ledger, the P4 review/judgment report, passing protocol evidence as compatibility preflight only, and the P5 native fixture set, the native proof command emits the exact P5 native artifact set, validates upstream hashes and target selection, creates a hash-bound `surfaces-native-static` projection, validates every fixture against the expectations manifest, emits deterministic inert native packets for allowed surfaces only, blocks invalid and review-required usage without executing actions or calling live services, records native diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every native schema, fixture, input artifact, generated proof artifact under `artifacts/p5/native`, and final evidence artifact.

Native target selection records accepted P2/P4 authority in `upstreamRefs[]` and protocol compatibility evidence in `compatibilityPreflightRefs[]`. Native evidence keeps `artifacts/p5/protocol/evidence.json` out of native `boundaryRefs[]`; protocol evidence is a compatibility preflight ref only, not native authority.

## Declared Source Conformance Target
The declared-source conformance proof is a target-specific proof-only expansion that consumes accepted P2 ingestion evidence and the P2 governed catalog. It proves that one manifest-declared local source bundle can be checked for source refs, source hashes, source authority conflicts, review-required routing, forbidden live/production claims, deterministic diagnostics, reports, and final evidence.

It is not a new numbered roadmap phase, production adapter, public API, SDK, A2UI target, live ingestion path, live SurfaceOps workflow, live JudgmentKit invocation, native runtime, demo authority, or action execution path.

The proof path is:

```text
artifacts/p2/evidence.json
artifacts/p2/governed-catalog.json
sources/source-conformance/declared-source-bundle/manifest.json
manifest-declared source files
fixtures/source-conformance/expectations.manifest.json
  -> validate fixtures/source-conformance/mutations/*.json against expected upstream, source, and evidence failures
  -> validate fixtures/source-conformance/valid/*.json, review/*.json, and invalid/*.json
  -> artifacts/source-conformance/source-inventory.json
  -> artifacts/source-conformance/source-authority-map.json
  -> artifacts/source-conformance/source-review-queue.json
  -> artifacts/source-conformance/source-conformance-report.json
  -> artifacts/source-conformance/evidence.json
```

Implemented command:

```bash
interfacectl surfaces source-conformance proof --source sources/source-conformance/declared-source-bundle --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/source-conformance --out artifacts/source-conformance
```

Given accepted P2 evidence and catalog output, the declared source bundle, and the source-conformance fixture set, the command emits the exact source-conformance artifact set, validates upstream hashes and source manifest hashes, validates every fixture against the expectations manifest, preserves review-required rows as non-executable evidence, records diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every source-conformance schema, consumed P2 schema, source file, fixture, upstream boundary ref, generated artifact, and final evidence artifact.

The proof currently has no generated demo. Use `source-conformance-report.json`, `source-review-queue.json`, `source-authority-map.json`, and `evidence.json` as report/evidence presentation refs, not as independent proof authority.

## Designer Workflow Trace Target
The designer-workflow-trace proof is a non-numbered, cross-cutting proof-only target that consumes accepted P2, source-conformance, P3, P4, protocol, and native evidence. It emits one deterministic Button scenario index from design authority through governed catalog, diagnostics/review-required status, review/evaluation refs, static target handoff artifacts, and evidence status.

It is not a product workflow implementation, customer validation, production adoption, live SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, P7, demo authority, catalog authority, or upstream proof authority.

The proof path is:

```text
artifacts/p2/evidence.json
artifacts/p2/governed-catalog.json
artifacts/p2/ingestion-report.json
artifacts/source-conformance/evidence.json
artifacts/source-conformance/source-authority-map.json
artifacts/source-conformance/source-conformance-report.json
artifacts/source-conformance/source-review-queue.json
artifacts/p3/evidence.json
artifacts/p3/review-queue.json
artifacts/p4/evidence.json
artifacts/p4/surfaceops-decision-ledger.json
artifacts/p4/review-judgment-report.json
artifacts/p4/judgmentkit-evaluation-report.json
artifacts/p5/protocol/evidence.json
artifacts/p5/native/evidence.json
fixtures/designer-workflow-trace/expectations.manifest.json
  -> validate fixtures/designer-workflow-trace/valid/*.json, review/*.json, invalid/*.json, and mutations/*.json
  -> artifacts/designer-workflow-trace/trace-selection.json
  -> artifacts/designer-workflow-trace/designer-workflow-trace-report.json
  -> artifacts/designer-workflow-trace/evidence.json
```

Implemented command:

```bash
interfacectl surfaces designer-workflow-trace proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --ingestion-report artifacts/p2/ingestion-report.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-authority-map artifacts/source-conformance/source-authority-map.json --source-conformance-report artifacts/source-conformance/source-conformance-report.json --source-review-queue artifacts/source-conformance/source-review-queue.json --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json --protocol-evidence artifacts/p5/protocol/evidence.json --native-evidence artifacts/p5/native/evidence.json --fixture fixtures/designer-workflow-trace --out artifacts/designer-workflow-trace
```

Given accepted upstream evidence and the designer-workflow-trace fixture set, the command emits the exact trace artifact set, validates upstream hashes and status, verifies current indexed report and review queue files, preserves P4 `status: "pass"` with `promotionStatus: "blocked"`, validates trace fixtures against deterministic diagnostics, records report rows before final evidence, and writes reproducible evidence with hashes and provenance for every trace schema, consumed schema, fixture, upstream boundary ref, generated artifact, and final evidence artifact.

The proof currently has no generated demo. Use `designer-workflow-trace-report.json`, `trace-selection.json`, and `evidence.json` as report/evidence presentation refs. The trace report is an index over accepted evidence; passing trace evidence proves only that the index was generated under the trace contract.

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
- [P4 Subplan Index](plans/p4/README.md)
- [P4 Product Boundaries](plans/p4/product-boundaries.md)
- [SurfaceOps Decision Model v0](plans/p4/surfaceops-decision-model-v0.md)
- [JudgmentKit Evaluation v0](plans/p4/judgmentkit-evaluation-v0.md)
- [Review And Judgment Fixture](plans/p4/review-judgment-fixture.md)
- [Review And Judgment Proof](plans/p4/review-judgment-proof.md)
- [P4 Validation and Evidence](plans/p4/validation-evidence.md)
- [P4 Demo and CI](plans/p4/demo-ci.md)
- [P5 Protocol Static Proof](plans/p5/README.md)
- [P5 Product Boundaries](plans/p5/product-boundaries.md)
- [P5 Adapter Target Selection](plans/p5/adapter-target-selection.md)
- [P5 Protocol Projection v0](plans/p5/protocol-projection-v0.md)
- [P5 Protocol Fixture](plans/p5/protocol-fixture.md)
- [P5 Protocol Adapter Proof](plans/p5/protocol-adapter-proof.md)
- [P5 Validation and Evidence](plans/p5/validation-evidence.md)
- [P5 Demo and CI](plans/p5/demo-ci.md)
- [P5 Native Static Proof](plans/p5/native-static-proof.md)
- [Declared Source Conformance Proof](plans/source-conformance/README.md)
- [Source Conformance Validation and Evidence](plans/source-conformance/validation-evidence.md)
- [Product Designer Workflow Trace](plans/product-designer-workflow-trace.md)
- [Product Portfolio Boundaries](plans/product-portfolio-boundaries.md)
- [SurfaceOps Product Brief](plans/surfaceops-product-brief.md)
- [SurfaceOps UI Decisions And Review Criteria](plans/surfaceops-ui-decisions-review-criteria.md)
- [Usability And Value Evidence Plan](plans/usability-value-evidence.md)
- [Surfaces.dev Documentation Tracking](plans/surfaces-dev.md)

The P5 subplans linked above define the implemented `surfaces-protocol-static` and `surfaces-native-static` proof slices. They do not implement production adapters, protocol APIs, SDKs, native SDKs, live protocol services, live native runtimes, A2UI export, or A2UI conformance. Future P5 targets remain planned until they add their own proof shape and passing evidence.

The source-conformance subplans define a proof-only declared-source conformance target over accepted P2 evidence. They do not implement live ingestion, production adapter behavior, API/SDK support, A2UI support, live SurfaceOps, live JudgmentKit, native runtime behavior, or action execution.

## P0 Decisions
- Runtime catalog name and boundary: Surfaces Catalog / `runtime-catalog.v0`, a governed design-system catalog/compiler artifact.
- A2UI role: reference-only before an A2UI-specific P5 target; possible downstream projection/export conformance target only after its own P5 proof gate.
- Proof fixture: `fixtures/p0/source.fixture.json` plus mutation, valid, invalid, and review fixtures.
- Surface IR role: internal P0 validation fixture, not a public protocol.
- Proof command: `interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0`.
- Promotion statuses: `allowed`, `review_required`, and `blocked`.

## P1 Decisions
- First runtime target: `web-static`.
- First runtime boundary: adapter-specific `runtime-projection.v0`, not direct renderer consumption of the full governed catalog.
- First product-visible output: generated static demo from proof artifacts, not hand-authored product UI.
- A2UI remains deferred to a future P5 downstream projection target, not the P1 adapter, the first P5 static protocol proof, or the Surfaces data model.
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
- First agent boundary: `agent-capability-registry.v0`, `agent-preflight-mutation.v0`, `agent-task.v0`, `agent-orchestration-plan.v0`, `agent-work-order.v0`, and `agent-review-queue.v0`, not direct live agent execution.
- First orchestration output: generated task DAG, scoped work orders, review queue, report, evidence, and static demo from proof artifacts.
- SurfaceOps remains a later operational review product; P3 emits a review queue artifact but no persistent review console.
- JudgmentKit remains evaluation metadata only unless a later proof defines evaluator execution.
- Agent work orders are inert descriptors in P3; they authorize no actual tool execution, file edits, network calls, side effects, or future outputs.

## P4 Decisions
- First review target: deterministic review and judgment proof over accepted P3 review queue and evidence.
- First SurfaceOps boundary: `surfaceops-decision-ledger.v0`, not a live review console or persistent decision store.
- First JudgmentKit boundary: `judgmentkit-evaluation-report.v0`, not live JudgmentKit MCP or connector execution in this implementation slice.
- First review output: decision ledger, evaluation report, review/judgment report, evidence, and static demo from proof artifacts.
- SurfaceOps approval decisions recorded in the P4 decision ledger are evidence eligibility records only; they do not execute P3 work orders or mutate upstream artifacts.
- P5 production adapters, live protocol boundaries, protocol APIs, SDKs, and A2UI remain deferred beyond the `surfaces-protocol-static` proof.

## P5 Decisions
- First implemented P5 target: `surfaces-protocol-static`, a deterministic inert protocol-envelope proof.
- First P5 boundary: `protocol-target-selection.v0`, `protocol-projection.v0`, `protocol-envelope.v0`, `protocol-adapter-report.v0`, and `protocol-adapter-evidence.v0`, not a production API, SDK, transport, live protocol service, or public Surface IR protocol.
- First P5 output: target selection, protocol projection, allowed protocol envelopes, protocol adapter report, evidence, generated demo, and CI gate from proof artifacts.
- Review-required protocol fixtures remain report/evidence-only and do not emit protocol-envelope artifacts.
- Sibling implemented P5 target: `surfaces-native-static`, a deterministic inert native-packet proof.
- Native P5 boundary: `surfaces-native-target-selection.v0`, `surfaces-native-projection.v0`, `surfaces-native-packet.v0`, `surfaces-native-report.v0`, and `surfaces-native-evidence.v0`, not a production native SDK, production API, native bridge, live runtime, A2UI clone, or expansion of `surfaces-protocol-static`.
- Native proof consumes `artifacts/p5/protocol/evidence.json` as compatibility preflight only; authority remains accepted P2 catalog/evidence plus accepted P4 review/judgment evidence.
- A2UI remains a downstream conformance or projection target only if a future P5 proof implements it with its own contract and evidence.
- Production adapters, protocol APIs, SDKs, live protocol services, live SurfaceOps, and live JudgmentKit remain planned until target evidence passes for those specific targets.
- Future P5 targets must prove their own schemas, fixtures, diagnostics, command contract, artifacts, target report, evidence, demo, CI gate, non-goals, and acceptance criteria before they are described as implemented.

## Non-Goals For P0/P1
- No full product scaffold.
- No copied legacy implementation.
- No live Figma ingestion before fixture-based compiler proof.
- No live or general-purpose runtime renderer in P0/P1; P1 stops at `web-static` projection, deterministic render plans, generated demos, and evidence.
- No broad A2UI compatibility layer in P0/P1.
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

## Non-Goals For P4
- No live SurfaceOps console or durable review database.
- No live JudgmentKit MCP or connector invocation without a later explicit proof and user authorization.
- No execution of P3 work orders.
- No live agents, shell commands, connector calls, network calls, callbacks, or secret access from P4 artifacts.
- No production adapters, protocol exports, A2UI conformance, or P5 scope.
- No relaxation of P3 orchestration evidence, review queue, catalog, or review gates.

## Non-Goals For P5 `surfaces-protocol-static`
- No live production adapter, production API, SDK, hosted protocol service, public Surface IR protocol, A2UI export, or A2UI conformance claim.
- No live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, agent execution, network call, connector call, callback, or secret access.
- No relaxation of P0/P1/P2/P3/P4 evidence, catalog authority, deterministic diagnostics, review-required semantics, or generated-demo boundaries.
- No claim that future P5 targets are implemented by the static protocol-envelope proof.

## Non-Goals For P5 `surfaces-native-static`
- No A2UI clone, A2UI export, or A2UI conformance claim.
- No production native SDK, production API, native bridge, live runtime, renderer, package, callback, network, connector, or secret access.
- No expansion of `surfaces-protocol-static`; protocol evidence is compatibility preflight only.
- No action execution, live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, or authority override.
- No relaxation of P0/P1/P2/P3/P4 evidence, catalog authority, deterministic diagnostics, review-required semantics, or generated-demo boundaries.
