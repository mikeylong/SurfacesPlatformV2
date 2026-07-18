# SurfacesPlatformV2 Subplans

For product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules, read [Surfaces Platform Vision And Roadmap](../VISION.md) first. This index is the mechanical contract reference for phase subplans. Phase subplans add phase-local deltas and mechanics only. Developer and agent documentation obligations for `surfaces.dev` are tracked in [Surfaces.dev Documentation Tracking](surfaces-dev.md).

These subplans define the Surfaces Platform proof contracts and their materialized schemas, fixtures, artifacts, demos, scripts, and tests. P0 specifies the first executable catalog proof, P1 specifies the first runtime projection proof, P2 specifies bounded real design-system ingestion, P3 specifies inert agent orchestration proof, P4 specifies review and judgment proof without turning derived consumers into new authority, and P5 specifies the bounded `surfaces-protocol-static` protocol-envelope proof plus the sibling `surfaces-native-static` native-packet proof. The source-conformance subplan specifies a target-specific compiler for checked source facts and a team-owned authority profile over accepted P2 evidence, plus aggregate packaging evidence that proves the unchanged compiler can consume a second compatible team-owned bundle for the same P2 components. Source Accessibility Policy specifies structured accessibility behavior reconciliation against accepted catalog facts and opaque, hash-bound policy requirement refs. Source Family Layout Mapping specifies the implemented proof for one fixed alternate physical-layout instance of that accepted bundle mapped byte-for-byte into the existing logical ABI. Source Family Namespace Mapping specifies the implemented proof for one fixed alternate declared-source prefix normalized through exact checked pointers onto that same ABI. Source Family Component Identity Mapping specifies the implemented proof for one team-owned authority declaration authorizing the exact fixture-local `TeamButton` to accepted P2 `Button` identity relation before a derived mapping feeds the existing namespace normalizer and unchanged compiler. Product Designer Workflow Trace specifies the implemented non-numbered trace target over accepted P2, source-conformance, P3, P4, protocol, and native evidence. SurfaceOps Kanban Static specifies the implemented non-numbered target over accepted P3/P4 evidence and a manifest-declared local `kanban.cards` substrate contract. SurfaceOps Kanban Live specifies the implemented non-numbered target for a local-loopback live `kanban.cards` API/browser proof over accepted P3/P4 evidence and a hash-bound API manifest. SurfaceOps Designer Review UI specifies the implemented non-numbered target for the local-live Button variants inspection workbench and rationale-required blocked receipt mirrored to `kanban.cards` over accepted designer-workflow, P4, and kanban-live evidence. Capability Index specifies the implemented non-numbered discovery and read-only verification target over the 16 implemented proof targets other than itself. Future targets remain planned until they add their own complete proof shape and passing evidence.

## Roadmap Status Snapshot
The current implemented proof roadmap is P0-P5, where P5 means only the `surfaces-protocol-static` and `surfaces-native-static` proof-only slices. The repo also includes the declared-source conformance, source-accessibility-policy, source-family-layout-mapping, source-family-namespace-mapping, source-family-component-identity-mapping, designer-workflow-trace, `surfaceops-kanban-static`, `surfaceops-kanban-live`, `surfaceops-designer-review-ui`, and capability-index target proofs listed in [VISION.md](../VISION.md#current-roadmap-proof-snapshot). The capability index covers the 16 implemented targets other than itself. Its seven planned groups are roadmap visibility only. The canonical status snapshot lives in `VISION.md`, the outcome tracker lives in [PROGRESS.md](../PROGRESS.md), and the human-readable value map lives in [Usability And Value Evidence Plan](usability-value-evidence.md). Future P5 targets such as A2UI conformance, production APIs, SDKs, live protocol services, live native runtimes, production SurfaceOps, production `kanban.cards` sync, Auth0 delegated production auth, hosted persistence, or live JudgmentKit remain planned until they add their own target-specific schema, fixture, diagnostics, command contract, report or artifact path, evidence path, demo boundary, CI gate, and passing evidence.

## Cross-Cutting Documentation
These documents are subordinate to `VISION.md` and support the phase plans without redefining authority or proof status.

1. [Product Portfolio Boundaries](product-portfolio-boundaries.md)
2. [SurfaceOps Product Brief](surfaceops-product-brief.md)
3. [SurfaceOps UI Decisions And Review Criteria](surfaceops-ui-decisions-review-criteria.md)
4. [SurfaceOps Button Variants Journey](surfaceops-button-variants-journey.md)
5. [Product Designer Workflow](product-designer-workflow.md)
6. [Product Designer Workflow Trace](product-designer-workflow-trace.md)
7. [Usability And Value Evidence Plan](usability-value-evidence.md)
8. [Curated Design-Partner Testing Program](design-partner-testing.md)
9. [Design-System Readiness Plan](design-system-readiness.md)
10. [Surfaces Systems Category Page Draft](surfaces-systems-category-page.md)
11. [SurfaceOps Kanban Static Proof Target](surfaceops-kanban-static.md)
12. [SurfaceOps Kanban Live Proof Target](surfaceops-kanban-live.md)
13. [SurfaceOps Designer Review UI Proof Target](surfaceops-designer-review-ui.md)
14. [Source Accessibility Policy Proof Target](source-accessibility-policy.md)
15. [Source Family Layout Mapping Proof Target](source-family-layout-mapping.md)
16. [Source Family Namespace Mapping Proof Target](source-family-namespace-mapping.md)
17. [Source Family Component Identity Mapping Proof Target](source-family-component-identity-mapping.md)
18. [Capability Index Proof Target](capability-index.md)

The curated design-partner testing program and templates under `plans/design-partner-testing/` are also subordinate to `VISION.md`, `PLAN.md`, and passing phase evidence. Treat them as non-proof research and planning surfaces for partner task design, synthetic dry runs, feedback capture, scorecards, and synthesis. They may point testers to evidence-backed demos for inspection, but they must not create implementation claims, proof status, catalog authority, or demo authority.

The design-system readiness plan is also subordinate planning material. It can
shape future Spectrum or Astryx proof candidates, but it does not create support
or proof authority without target-specific schemas, fixtures, diagnostics,
commands, artifacts or reports, evidence, CI gates, and passing evidence.

The surfaces.systems category page draft is a subordinate product-surface draft
for human positioning only. It does not create proof authority, customer
validation, production readiness, pilot readiness, live product behavior, or
support for unproved targets.

The SurfaceOps Button variants journey is subordinate product and prototype
planning for the `kanban.cards` -> SurfaceOps designer review loop. It maps the
board, card, SurfaceOps DAG review, node inspector, decision receipt, and
mirrored return-to-board flow. It is planning only and does not broaden
implemented proof status.

The SurfaceOps kanban static proof target is implemented for a deterministic,
inert SurfaceOps-owned board projection over accepted P3/P4 evidence and a
manifest-declared local `kanban.cards` substrate contract. It now also has a
generated demo and a separate Chromium browser-functional recording gate for
inspectability evidence. It does not create live SurfaceOps, live board sync,
persistence, production adapter, API, SDK, A2UI, hidden review state, execution
authority, or product adoption claims.

The SurfaceOps kanban live proof target is implemented for a local-loopback
`kanban.cards` API/browser scenario over accepted P3/P4 evidence and a
hash-bound API manifest. It starts a real local `kanban.cards` server for the
browser-functional gate, performs real API read/write operations, observes
realtime events, verifies local persistence across restart, records video, and
writes hashed runtime evidence. It does not modify `kanban.cards` source code
and does not claim production SurfaceOps, production `kanban.cards`, production
auth, hosted persistence, public APIs, SDKs, A2UI, live JudgmentKit, work
execution, or product adoption.

The SurfaceOps designer review UI proof target is implemented for a local-live
Button variants review loop over accepted designer-workflow-trace and
`surfaceops-kanban-live` evidence plus P4 review context that does not authorize
this Button handoff. It emits deterministic workbench and
decision receipt artifacts, generates a demo, and has a separate Chromium
browser-functional gate that starts real local `kanban.cards` plus a proof-only
SurfaceOps review server. The current proof preserves the upstream
`targetHandoffAllowed: false` and `SOURCE_REVIEW_EXPIRED` block: designers can
inspect the work, but approve and request-refinement remain disabled, and the
only enabled outcome records rationale before mirroring a blocked receipt to
the live card. It produces no variant-of-record or handoff. Its core records use
closed schemas, fixture expectations are evaluated independently from fixture
claims, mutations change actual proof inputs, and deterministic plus browser
evidence close and hash-bind their declared inputs and outputs. It does not
claim production SurfaceOps, production `kanban.cards`, hosted persistence,
production auth, webhooks, broad production adapter behavior, SDKs, A2UI, live
JudgmentKit, work execution, or product adoption.

The source-family layout-mapping target is implemented for one fixed alternate
physical layout of the accepted team-owned bundle. It verifies an immutable
layout-package trust anchor, stages 12 byte-identical files into the existing
logical ABI, runs the unchanged compiler, persists and re-verifies all eight
inner artifacts, and records passing evidence with
`promotionStatus: "review_required"`. It does not prove arbitrary layouts or
filenames, namespace mapping, broader P2 coverage, live connectors, self-serve
UI, runtime accessibility, production adapters, SurfaceOps expansion, or
JudgmentKit.

The source-family namespace-mapping target is implemented for one checked copy
of that fixed-layout bundle whose 78 declared-source string leaves use
`declared-source://product-team-authority/`. An immutable namespace package
binds every allowed substitution pointer and the 11 manifest hash refreshes.
All 12 normalized logical files must match the accepted fixed-layout baseline
byte-for-byte before the unchanged compiler runs. It does not prove arbitrary
namespaces, new layouts or components, live connectors, self-serve UI,
production adapters, SurfaceOps expansion, or JudgmentKit.

The source-family component-identity-mapping target is implemented for one
checked 12-file bundle whose five Button authority files use the fixture-local
`TeamButton` identity at exactly 22 declared pointers. One explicit team-owned
authority manifest and declaration bind the exact `TeamButton` to accepted P2
`Button` relation to source refs, provenance, hashes, current P2 catalog and
evidence, and owner-bound accepted review metadata. The declaration is
authority; the derived Stage 1 mapping and existing namespace normalizer are
not. Stage 1 refreshes five manifest hashes, preserves four narrative `Button`
mentions, and reproduces the accepted namespaced baseline before Stage 2 and the
unchanged compiler run. The target persists the namespace receipt and all eight
inner artifacts. It does not prove arbitrary identities, alias registries,
semantic inference, new components, broader P2 coverage, live connectors,
self-serve UI, runtime accessibility, production adapters, SurfaceOps
expansion, or JudgmentKit.

The capability-index proof target is implemented for deterministic discovery
and read-only verification across P0, P1, P2, P3, P4, P5 protocol, P5 native,
declared-source conformance, structured source-accessibility-policy
reconciliation, source-family layout mapping, source-family namespace mapping,
source-family component-identity mapping, designer-workflow trace,
SurfaceOps kanban static, SurfaceOps kanban live, and the SurfaceOps designer
review UI. It does not
self-index. Its seven planned groups have no proof command or evidence claim,
and passing capability-index evidence proves the index contract rather than
the indexed targets.

## P0 Dependency Order
1. [Runtime Catalog v0](runtime-catalog-v0.md)
2. [P0/P1 Product Boundaries](product-boundaries.md)
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

## P2 Dependency Order
1. [P2 Subplan Index](p2/README.md)
2. [P2 Product Boundaries](p2/product-boundaries.md)
3. [Source Strategy](p2/source-strategy.md)
4. [Ingestion Fixture](p2/ingestion-fixture.md)
5. [Ingestion Proof](p2/ingestion-proof.md)
6. [P2 Validation And Evidence](p2/validation-evidence.md)
7. [P2 Demo And CI](p2/demo-ci.md)

## P3 Dependency Order
1. [P3 Subplan Index](p3/README.md)
2. [P3 Product Boundaries](p3/product-boundaries.md)
3. [Agent Capability Registry v0](p3/agent-capability-registry-v0.md)
4. [Recruitment Policy](p3/recruitment-policy.md)
5. [Orchestration Fixture](p3/orchestration-fixture.md)
6. [Orchestration Proof](p3/orchestration-proof.md)
7. [Review Queue v0](p3/review-queue-v0.md)
8. [P3 Validation And Evidence](p3/validation-evidence.md)
9. [P3 Demo And CI](p3/demo-ci.md)

## P4 Dependency Order
1. [P4 Subplan Index](p4/README.md)
2. [P4 Product Boundaries](p4/product-boundaries.md)
3. [SurfaceOps Decision Model v0](p4/surfaceops-decision-model-v0.md)
4. [JudgmentKit Evaluation v0](p4/judgmentkit-evaluation-v0.md)
5. [Review And Judgment Fixture](p4/review-judgment-fixture.md)
6. [Review And Judgment Proof](p4/review-judgment-proof.md)
7. [P4 Validation And Evidence](p4/validation-evidence.md)
8. [P4 Demo And CI](p4/demo-ci.md)

## P5 Protocol And Native Dependency Order
The P5 protocol and native subplans define the implemented `surfaces-protocol-static` and `surfaces-native-static` proof slices. They do not define a production adapter, protocol API, SDK, native SDK, live protocol service, live native runtime, A2UI export, A2UI conformance claim, live SurfaceOps integration, or live JudgmentKit integration.

1. [P5 Subplan Index](p5/README.md)
2. [P5 Product Boundaries](p5/product-boundaries.md)
3. [Adapter Target Selection](p5/adapter-target-selection.md)
4. [Protocol Projection v0](p5/protocol-projection-v0.md)
5. [Protocol Fixture](p5/protocol-fixture.md)
6. [Protocol Adapter Proof](p5/protocol-adapter-proof.md)
7. [P5 Validation And Evidence](p5/validation-evidence.md)
8. [P5 Demo And CI](p5/demo-ci.md)
9. [P5 Native Static Proof](p5/native-static-proof.md)

Before any future P5 target beyond `surfaces-protocol-static` and `surfaces-native-static` is implemented or documented as supported, the target-specific subplans must define:

- product boundaries for exactly one target, such as A2UI conformance, a production API boundary, or another runtime adapter;
- target-specific schemas for the adapter/protocol/export, report, diagnostics, expectations, fixtures, and evidence;
- fixture roots, mutation fixtures, review-required fixtures, invalid fixtures, and expectation manifests;
- diagnostics registry rows with canonical messages, stages, promotion statuses, artifact paths, JSON Pointers, source refs, and fixture coverage;
- an exact command contract with POSIX-relative arguments, output-root rules, stale-output failure, deterministic stdout/stderr, and exit codes;
- generated artifact paths, a target report path, and a final evidence path under a target-specific P5 output root, all hash-bound by final evidence;
- generated demo and CI expectations that run only after target evidence exists and keep demo output as presentation, not proof;
- non-goals that exclude live SurfaceOps persistence, live JudgmentKit invocation, unbounded adapter support, unproved production behavior, and any catalog-authority override;
- acceptance criteria requiring passing P0/P1/P2/P3/P4 proof gates, P4 evidence, decision-ledger, and review/judgment-report preflight, fail-closed unsupported target behavior, non-executable review-required handling, and reproducible final evidence.

## Source Conformance Dependency Order
The source-conformance subplans define an implemented proof-only target that consumes accepted P2 evidence and catalog output, then compiles checked source facts and team-owned authority profiles from exactly two compatible local bundle instances without adding P2 capability. It does not define arbitrary source layouts or connectors, broader P2 component coverage, self-serve connection, live ingestion, production adapters, APIs, SDKs, A2UI, live SurfaceOps, live JudgmentKit, native runtime behavior, or action execution.

1. [Declared Source Conformance Proof](source-conformance/README.md)
2. [Source Conformance Validation And Evidence](source-conformance/validation-evidence.md)

## Source Accessibility Policy Dependency Order

The source-accessibility-policy target consumes accepted P2, declared-source
conformance, and source-family packaging evidence. It reconciles a checked set
of closed behavior declarations with existing catalog facts and review routes.
Policy requirement text remains opaque and hash-bound. The target does not
infer behavior from prose, add P2 facts, or prove runtime accessibility
compliance.

1. [Source Accessibility Policy Proof Target](source-accessibility-policy.md)
2. `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json`
3. `artifacts/source-conformance/evidence.json` and its governed catalog
4. `artifacts/source-family-packaging/evidence.json`
5. `sources/source-accessibility-policy/manifest.json`
6. `fixtures/source-accessibility-policy/expectations.manifest.json`
7. `artifacts/source-accessibility-policy/evidence.json`

## Source Family Layout Mapping Dependency Order

The [Source Family Layout Mapping Proof Plan](source-family-layout-mapping.md)
defines an implemented non-numbered target over accepted P2 and source-family
packaging evidence.

Its dependency order is:

1. `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json`;
2. `artifacts/source-family-packaging/evidence.json` and its referenced closure;
3. one checked alternate physical-layout instance of the accepted team-owned
   bundle, a byte-only mapping descriptor, and a separate immutable
   layout-package trust anchor; and
4. target-owned schemas, fixtures, diagnostics, report, and evidence under the
   `source-family-layout-mapping` roots.

The implemented target is limited to byte-preserving physical-to-logical path
mapping for one named bundle. It does not include arbitrary layouts, source-ref
namespace changes, broader P2 coverage, live connectors, self-serve UI, runtime
accessibility claims, production adapters, SurfaceOps expansion, or JudgmentKit.

## Source Family Namespace Mapping Dependency Order

The [Source Family Namespace Mapping Proof Plan](source-family-namespace-mapping.md)
defines an implemented non-numbered target over accepted P2 and fixed-layout
evidence.

Its dependency order is:

1. `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json`;
2. `artifacts/source-family-layout-mapping/evidence.json` and its referenced
   closure;
3. one checked copy of the accepted physical bundle using the fixed alternate
   source-ref prefix, a closed mapping descriptor, and an immutable namespace
   package; and
4. target-owned schemas, fixtures, diagnostics, receipt, report, and evidence
   under the `source-family-namespace-mapping` roots.

The implemented target is limited to one exact prefix pair, 78 declared JSON
pointer substitutions, and 11 manifest hash refreshes. It does not include
arbitrary namespaces, another layout, broader P2 coverage, live connectors,
self-serve UI, production adapters, SurfaceOps expansion, or JudgmentKit.

## Source Family Component Identity Mapping Dependency Order

The [Source Family Component Identity Mapping Proof Plan](source-family-component-identity-mapping.md)
defines an implemented non-numbered target over accepted P2 and fixed-namespace
evidence.

Its dependency order is:

1. `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json`;
2. `artifacts/source-family-namespace-mapping/evidence.json` and its complete
   referenced closure, including the accepted namespace mapping, package, and
   implementation;
3. one checked 12-file `TeamButton` bundle, its exact 22-row mapping descriptor,
   a team-owned authority manifest and declaration, and a separate immutable
   component-identity package;
4. Stage 1 exact identity normalization followed by the existing Stage 2
   namespace normalizer and unchanged source-conformance compiler; and
5. target-owned schemas, fixtures, diagnostics, component-identity receipt,
   persisted namespace receipt, eight inner artifacts, report, and evidence
   under the `source-family-component-identity-mapping` roots.

The implemented target is limited to one exact, explicitly declared
`TeamButton` to accepted P2 `Button` relation, 22 substitutions in five files,
five manifest hash refreshes, and four unchanged narrative mentions. It does not
include arbitrary component identities, alias registries, semantic inference,
another layout or namespace, broader P2 coverage, live connectors, self-serve
UI, runtime accessibility, production adapters, SurfaceOps expansion, or
JudgmentKit.

## Capability Index Dependency Order

1. [Capability Index Proof Target](capability-index.md)
2. The 16 accepted target evidence files declared by the capability fixture
3. `fixtures/capability-index/expectations.manifest.json`
4. `artifacts/capability-index/capability-index.json`
5. `artifacts/capability-index/capability-index-report.json`
6. `artifacts/capability-index/evidence.json`

The capability-index proof runs after its indexed target evidence exists. The
`npm run status` entrypoint verifies tracked output read-only and must not
materialize or regenerate any target.

## Designer Workflow Trace Contract Summary
The designer-workflow-trace target consumes accepted P2 ingestion evidence/catalog/report, source-conformance evidence/report/authority/review queue refs, P3 evidence/review queue, P4 review and evaluation evidence, and the implemented P5 protocol/native evidence. It emits `trace-selection.json`, `designer-workflow-trace-report.json`, and `evidence.json` under `artifacts/designer-workflow-trace`.

Designer workflow trace proof command:

```bash
interfacectl surfaces designer-workflow-trace proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --ingestion-report artifacts/p2/ingestion-report.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-authority-map artifacts/source-conformance/source-authority-map.json --source-conformance-report artifacts/source-conformance/source-conformance-report.json --source-review-queue artifacts/source-conformance/source-review-queue.json --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json --protocol-evidence artifacts/p5/protocol/evidence.json --native-evidence artifacts/p5/native/evidence.json --fixture fixtures/designer-workflow-trace --out artifacts/designer-workflow-trace
```

This target is proof-only and report/evidence-only. It is not a product workflow implementation, customer validation, production adoption, live SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, P7, catalog authority, or upstream proof authority. The report indexes accepted evidence; `artifacts/designer-workflow-trace/evidence.json` proves only the trace index contract.

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

## P0 Mechanical Sources
`runtime-catalog-v0.md` defines the P0 catalog shape. `validation-evidence.md` defines P0 evidence and diagnostic requirements. Other subplans may reference those contracts, but they must not redefine them. Product authority, surface roles, and roadmap sequence remain canonical in [Surfaces Platform Vision And Roadmap](../VISION.md).

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
| `TOKEN_IMPLEMENTATION_METADATA_FORBIDDEN` | Extract token tree contains an implementation metadata child | Token trees must not encode implementation metadata as token children. | `validate` | `error` | `blocked` | `fixtures/p0/mutations/implementation-token-child.extract.json` | `/tokens/spacing/compact/cssVariable` | `null` | `mutations/implementation-token-child.extract.json` |
| `TOKEN_IMPLEMENTATION_METADATA_FORBIDDEN` | Runtime catalog token tree contains an implementation metadata child | Token trees must not encode implementation metadata as token children. | `validate` | `error` | `blocked` | `fixtures/p0/mutations/implementation-token-child.catalog.json` | `/tokens/spacing/compact/cssVariable` | `null` | `mutations/implementation-token-child.catalog.json` |
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
| `ACCESSIBILITY_MODAL_UNSUPPORTED` | Surface IR attempts modal dialog or alertdialog semantics through unsupported modal fields | Modal dialog and alertdialog semantics are deferred beyond P1 and unsupported in P0/P1. | `validate` | `error` | `blocked` | `fixtures/p0/invalid/modal-role-not-supported.json` | `/root/accessibility/role` | `fixture://p0/invalid/modal-role-not-supported#/root/accessibility` | `invalid/modal-role-not-supported.json` |
| `GOVERNANCE_REVIEW_REQUIRED` | Structurally valid usage requires review | Usage requires review before unattended promotion. | `govern` | `review` | `review_required` | `fixtures/p0/review/review-required-action.json` | `/root/actions/confirm/execute` | `fixture://p0/review/review-required-action#/root/actions/confirm` | `review/review-required-action.json` |
| `PROVENANCE_MISSING` | Required provenance is absent | Required generated artifact provenance is missing. | `compile` | `error` | `blocked` | `fixtures/p0/mutations/missing-provenance.extract.json` | `/provenance` | `fixture://p0/source#/provenance` | `mutations/missing-provenance.extract.json` |
| `ARTIFACT_HASH_MISMATCH` | Artifact hash differs from evidence manifest | Artifact hash does not match the evidence manifest. | `validate` | `error` | `blocked` | `fixtures/p0/mutations/hash-mismatch.evidence.json` | `/artifacts/0/hash` | `null` | `mutations/hash-mismatch.evidence.json` |

## Proof CLI Contract
`interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0` is implemented with these required behaviors:

- The command is run from the workspace root.
- `--fixture` and `--out` are POSIX-style paths relative to the workspace root.
- The schema directory is fixed at `schemas/` relative to the workspace root; P0 has no `--schemas` flag.
- P0 proof authority is closed over the P0-owned schema suite listed in this document. Regular future phase-owned `*.vN.schema.json` files may exist under the shared `schemas/` root without entering P0 evidence or drift expectations; missing or tampered P0 schemas and non-regular schema-root entries still fail.
- `fixtures/p0/expectations.manifest.json` is the machine-readable fixture comparison reference.
- Exit `0`: all valid fixtures are allowed, all mutation and invalid fixtures are blocked in the expected phase with expected codes, all review fixtures are `review_required`, final evidence is reproducible, `evidence.status` is `pass`, and the P0 fixture set produces aggregate `evidence.promotionStatus: review_required`.
- Exit `1`: contract validation fails, invalid fixture expectations do not match, review fixtures do not block unattended promotion, hashes/provenance are missing, or stale unexpected output exists under `--out`.
- Exit `2`: command usage, missing fixture path, unreadable schema path, or output path error.
- The command overwrites files only under the declared `--out` directory.
- The expected P0 output set is exactly `extract.json`, `catalog.json`, `governed-catalog.json`, `adapter-diagnostics.json`, and `evidence.json` directly under `--out`. Before writing, the command enumerates `--out`; expected files are replaced, but any other file or directory is stale unexpected output, causes exit `1`, and is excluded from evidence.
- The command writes a concise stage summary to stdout and machine-readable artifacts to `--out`.
- The command writes diagnostics to stderr only for command/runtime failure, not expected invalid fixture failures.
- `check:p0:ci` must run the materialize, proof, demo, test, tracked drift, and P0 untracked-file guard sequence. The untracked guard is required because `git diff --exit-code` does not report untracked files under P0 generated-output or source paths.

## P1 Contract Summary
P1 proves a governed product surface through a `web-static` runtime projection and deterministic render-plan proof. The governed catalog remains the contract authority. The runtime projection is a derived, hash-bound adapter subset. The generated demo is proof output, not a hand-authored product mock.

P1 contract references:

- [P1 Subplan Index](p1/README.md) defines the P1 artifact tree, command contract, diagnostics additions, pass condition, and non-goals.
- [Runtime Projection v0](p1/runtime-projection-v0.md) defines the adapter-facing projection.
- [P1 Fixture](p1/p1-fixture.md) defines the fixture and manifest contract.
- [Runtime Adapter Proof](p1/runtime-adapter-proof.md) defines render-plan and report behavior.
- [P1 Validation And Evidence](p1/validation-evidence.md) defines evidence, hashing, diagnostics, and aggregation.

P1 proof command:

```bash
interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1
```

The P1 proof gate is closed over the P0 and P1 schema suites it consumes. Regular future phase-owned schemas under `schemas/` do not enter P1 evidence or drift expectations, while missing or tampered P0/P1 schemas and non-regular schema-root entries still fail closed.

## P2 Contract Summary
P2 proves deterministic local ingestion for the pinned `@adobe/spectrum-design-data@0.7.0` source snapshot, scoped to `button` and `in-line-alert`. The proof verifies the exact checked-in package-file set and bytes against the review-controlled `sources/p2/design-system-source/package-snapshot.lock.json` before it accepts generated manifest hashes. The lock records a separate review-time SRI and tarball verification; normal materialization treats it as the trust anchor, does not fetch the tarball, and never regenerates the lock. P2 then materializes source inventory and mapping artifacts, extracts normalized design-system material with source refs, compiles catalog and governed catalog artifacts, records an ingestion report, and finalizes evidence. P2 does not call live source APIs, crawl docs, build a runtime adapter, recruit agents, persist review decisions, or run JudgmentKit.

P2 contract references:

- [P2 Subplan Index](p2/README.md) defines the P2 artifact tree, command contract, diagnostics additions, pass condition, and non-goals.
- [P2 Product Boundaries](p2/product-boundaries.md) defines what the ingestion proof may and may not own.
- [Source Strategy](p2/source-strategy.md) defines the first source family and target-selection gate.
- [Ingestion Fixture](p2/ingestion-fixture.md) defines fixture and manifest expectations.
- [Ingestion Proof](p2/ingestion-proof.md) defines source inventory, mapping, extraction, catalog compilation, and report behavior.
- [P2 Validation And Evidence](p2/validation-evidence.md) defines evidence, hashing, diagnostics, and aggregation.

P2 proof command:

```bash
interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

Package scripts and tests execute this as `node bin/interfacectl.js surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2`. Evidence records the logical command string above.

The implemented target is Adobe Spectrum Design Data, pinned to `@adobe/spectrum-design-data@0.7.0` with npm integrity `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`. The first component subset is `button` and `in-line-alert`. `design-source-package-snapshot-lock.v0` records the pinned tarball identity, tarball SHA-256, and the exact ordered package-file paths and raw-byte hashes. `package-snapshot-byte-tamper.design-source.json` requires causal package-byte tampering to fail with `INGEST_PACKAGE_SNAPSHOT_LOCK_MISMATCH`, whose canonical message is `Local package snapshot does not match the immutable npm snapshot lock.` This is a bounded local source-bundle proof only: locked Spectrum package files, local mapping files, and local usage policy are in scope; full Spectrum support, live ingestion, production adapters, SurfaceOps, JudgmentKit, A2UI, and agent orchestration remain outside P2. The `check:p2:planning` guard remains a non-proof contract-shape guard, while `check:p2:ci` is the proof-bearing package gate.

A PR or merge claiming P2 must preserve proof-bearing gate logs, commit SHA, and the final `artifacts/p2/evidence.json` hash with the PR or merge record. Those records are not generated artifacts under `artifacts/p2`.

## P3 Contract Summary
P3 proves governed agent recruitment and orchestration after P2 ingestion evidence passes. It consumes P2 evidence boundaries, materializes an agent capability registry, selects registered capabilities for structured task fixtures, emits deterministic scoped work orders, routes review-required work to a non-executable review queue, records an orchestration report, and finalizes evidence. P3 does not execute agents, call tools, edit files, persist review decisions, or run JudgmentKit.

P3 contract references:

- [P3 Subplan Index](p3/README.md) defines the P3 artifact tree, command contract, diagnostics additions, pass condition, and non-goals.
- [P3 Product Boundaries](p3/product-boundaries.md) defines what the orchestration proof may and may not own.
- [Agent Capability Registry v0](p3/agent-capability-registry-v0.md) defines the recruitable agent/capability registry contract.
- [Recruitment Policy](p3/recruitment-policy.md) defines deterministic selection, review routing, and invalid handling.
- [Orchestration Fixture](p3/orchestration-fixture.md) defines fixture and manifest expectations.
- [Orchestration Proof](p3/orchestration-proof.md) defines task DAG, work-order, review queue, and report behavior.
- [Review Queue v0](p3/review-queue-v0.md) defines the review queue envelope and row contract.
- [P3 Validation And Evidence](p3/validation-evidence.md) defines evidence, hashing, diagnostics, and aggregation.

P3 proof command:

```bash
interfacectl surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3
```

Package scripts and tests execute this as `node bin/interfacectl.js surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3`. Evidence records the logical command string above.

P3 generated artifact refs must be acyclic: forward refs to later same-run artifacts omit hashes, resolved backward refs to already materialized artifacts may include hashes, and final P3 evidence owns the complete hash closure.

Command-level P3 upstream preflight mutation fixtures validate against `agent-preflight-mutation.v0` and model missing, failing, hash-mismatched, or stale P2 inputs before registry or task fixtures are read.

## P4 Contract Summary
P4 implements governed review and judgment after P3 orchestration evidence passes. The deterministic proof consumes P3 evidence and review queue boundaries, materializes a deterministic SurfaceOps decision ledger, emits a JudgmentKit-shaped evaluation report, records a review/judgment report, and finalizes evidence. SurfaceOps owns approve, reject, request-changes, and defer decision coverage; only manifest-committed decisions are ledger rows, while coverage-only outcomes remain validation/report rows. JudgmentKit-shaped reports remain evaluation-only findings and cannot encode or override decision status. P4 does not execute work orders, persist live decisions, call live JudgmentKit tools, run agents, or create production adapter/A2UI scope.

P4 contract references:

- [P4 Subplan Index](p4/README.md) defines the P4 artifact tree, command contract, diagnostics additions, pass condition, and non-goals.
- [P4 Product Boundaries](p4/product-boundaries.md) defines what the review and judgment proof may and may not own.
- [SurfaceOps Decision Model v0](p4/surfaceops-decision-model-v0.md) defines the deterministic decision ledger contract.
- [JudgmentKit Evaluation v0](p4/judgmentkit-evaluation-v0.md) defines the deterministic evaluation report contract.
- [Review And Judgment Fixture](p4/review-judgment-fixture.md) defines fixture and manifest expectations.
- [Review And Judgment Proof](p4/review-judgment-proof.md) defines decision ledger, evaluation report, review/judgment report, and deterministic behavior.
- [P4 Validation And Evidence](p4/validation-evidence.md) defines evidence, hashing, diagnostics, and aggregation.
- [P4 Demo And CI](p4/demo-ci.md) defines generated demo, drift checks, untracked guards, and CI expectations.

P4 proof command:

```bash
interfacectl surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4
```

Package scripts execute it as `node bin/interfacectl.js surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4`. Evidence records the logical command string above.

## P5 Contract Summary
P5 implements `surfaces-protocol-static` as the first bounded protocol-boundary slice and `surfaces-native-static` as a sibling Surfaces-native static target. The protocol proof consumes accepted P2 catalog/evidence and accepted P4 review/judgment evidence, emits target selection, a protocol projection, deterministic inert protocol envelopes, a protocol adapter report, final evidence, a generated demo, and a CI gate. The native proof consumes the same accepted P2/P4 authority plus protocol evidence as compatibility preflight only, then emits native target selection, a native projection, deterministic inert native packets, a native report, final evidence, a generated demo, and a CI gate.

P5 proof command:

```bash
interfacectl surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol
```

This P5 implementation is proof-only. It must not be treated as a production adapter, public protocol/API, SDK, live protocol service, A2UI export, A2UI conformance proof, live SurfaceOps integration, live JudgmentKit invocation, or permission to execute actions. Future P5 production adapters, A2UI targets, and live protocol boundaries remain planned until a separate target-specific proof adds the complete schema, fixture, diagnostics, command, artifact, report, evidence, demo, and CI shape.

P5 native proof command:

```bash
interfacectl surfaces native proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --protocol-evidence artifacts/p5/protocol/evidence.json --fixture fixtures/p5/native --out artifacts/p5/native
```

The native implementation is also proof-only. It must not be treated as A2UI, an A2UI clone, A2UI conformance, a production native SDK/API/package, native bridge, live runtime, expansion of `surfaces-protocol-static`, live SurfaceOps integration, live JudgmentKit invocation, or permission to execute actions.

## Source Conformance Contract Summary
The source-conformance target consumes accepted P2 evidence and `artifacts/p2/governed-catalog.json`, then reads checked field-level facts and `governance/authority-profile.json` from the canonical manifest-declared bundle. It emits a source inventory, fact coverage, derived authority map, non-executable review queue, non-expanding governed catalog, actionable connection report, source-conformance report, and base evidence under `artifacts/source-conformance`. The source-family packaging command stages the canonical bundle and `sources/source-family-packaging/team-owned-authority-bundle` into separate fixed logical workspaces, records two passing executions of the same checked compiler without family-specific JavaScript, captures the second output set under `artifacts/source-family-packaging`, re-verifies its persisted inner evidence, compares both results with the accepted P2 boundary, and records the failing causal expansion probe separately.

Source-conformance proof command:

```bash
interfacectl surfaces source-conformance proof --source sources/source-conformance/declared-source-bundle --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/source-conformance --out artifacts/source-conformance

interfacectl surfaces source-family-packaging proof --package fixtures/source-family-packaging/package.fixture.json --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-conformance-catalog artifacts/source-conformance/governed-catalog.json --fixture fixtures/source-family-packaging --out artifacts/source-family-packaging
```

`artifacts/source-family-packaging/evidence.json` is the indexed aggregate authority for the two-bundle reuse claim. `artifacts/source-conformance/evidence.json` remains the authority for the canonical compiler run and stays the direct upstream input to the designer workflow trace. The target is proof-only. It must not be treated as customer validation, production readiness, pilot readiness, arbitrary source-family support, broader P2 coverage, self-serve support, live ingestion, API/SDK support, A2UI support, live SurfaceOps, live JudgmentKit, native runtime behavior, or action execution.

## Source Accessibility Policy Contract Summary

The source-accessibility-policy target reads five checked structured behavior
declarations and reconciles them with accepted P2 catalog facts. The
source-conformance catalog remains an integrity-bound upstream input rather
than a second fact authority. The target hash-binds the exact policy
requirement values as opaque
identifiers, uses only declared `equals` and `exists` assertions to determine
behavior, and reuses the existing `design-systems-governance` review route for
missing authoritative facts. It emits coverage, an authority map, a
non-executable review queue, a conformance report, and final evidence under
`artifacts/source-accessibility-policy`.

Source-accessibility-policy proof command:

```bash
interfacectl surfaces source-accessibility-policy proof --source sources/source-accessibility-policy --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-conformance-catalog artifacts/source-conformance/governed-catalog.json --source-family-packaging-evidence artifacts/source-family-packaging/evidence.json --fixture fixtures/source-accessibility-policy --out artifacts/source-accessibility-policy
```

`artifacts/source-accessibility-policy/evidence.json` is authoritative only for
this reconciliation contract. The target cannot add catalog capability and
does not interpret free-form policy text, expand P2 coverage, prove runtime
accessibility compliance, support arbitrary source packaging, call live
connectors, provide self-serve connection, or authorize production adapters or
JudgmentKit.

## Source Family Layout Mapping Contract Summary

The layout-mapping target consumes one third physical-layout instance of the
currently accepted team-owned bundle, whose physical paths differ from the
current fixed package without introducing a new bundle identity. A closed
descriptor, hash-bound by a separate immutable layout-package trust anchor,
maps its unchanged independent regular-file bytes one-to-one onto exactly
`manifest.json` plus the ordered 11-file `SC_SOURCE_FILES` closure, after which
the unchanged source-conformance compiler runs in an isolated workspace. The
proof persists a mapping receipt, the eight inner compiler artifacts, a target
report, and final evidence, then re-verifies the inner closure after workspace
cleanup.

`artifacts/source-family-layout-mapping/evidence.json` passes with
`promotionStatus: "review_required"`. The target proves exactly this fixed
mapping. It does not authorize arbitrary layouts or namespaces, source
rewriting, semantic transformation, broader P2 coverage, live connectors,
self-serve UI, runtime accessibility claims, production adapters, SurfaceOps
expansion, or JudgmentKit.

## Source Family Namespace Mapping Contract Summary

The namespace-mapping target consumes accepted P2 and fixed-layout evidence,
one immutable checked namespaced bundle, a closed namespace descriptor, and a
separate immutable namespace package. It replaces exactly
`declared-source://product-team-authority/` with
`declared-source://source-conformance/` at 78 declared JSON pointers, refreshes
exactly 11 manifest source-file hashes, and rejects every other transform. The
12 normalized logical files must be byte-identical to the accepted baseline
before the unchanged source-conformance compiler runs.

Source-family namespace-mapping proof command:

```bash
interfacectl surfaces source-family-namespace-mapping proof --source sources/source-family-namespace-mapping/team-owned-namespaced-bundle --mapping sources/source-family-namespace-mapping/namespace-mapping.json --namespace-package fixtures/source-family-namespace-mapping/namespace-package.fixture.json --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --source-family-layout-mapping-evidence artifacts/source-family-layout-mapping/evidence.json --fixture fixtures/source-family-namespace-mapping --out artifacts/source-family-namespace-mapping
```

The target persists a substitution receipt, all eight inner compiler artifacts,
a report, and final evidence. `artifacts/source-family-namespace-mapping/evidence.json`
is authoritative only for this fixed normalization contract. It does not prove
arbitrary namespace support, add layouts or components, call live connectors,
provide self-serve connection, authorize production adapters, expand
SurfaceOps, or invoke JudgmentKit.

## Source Family Component Identity Mapping Contract Summary

The component-identity target consumes accepted P2 and fixed-namespace
evidence, one checked 12-file `TeamButton` bundle, a closed 22-row mapping
descriptor, an explicit team-owned authority manifest and declaration, and a
separate immutable component-identity package. The declaration binds the exact
fixture-local `TeamButton` to accepted P2 `Button` relation to source refs,
provenance, hashes, current P2 target refs, the exact JCS Button-record hash, and
owner-bound accepted review
metadata. The declaration authorizes the relation; derived normalizers cannot.

Stage 1 changes exactly 22 identity values in
`review/authority-map.json`, `ui/button-definition.json`,
`ui/button-fork.json`, `ui/button-source-a.json`, and
`ui/button-source-b.json`, refreshes their five manifest hashes, and preserves
four narrative `Button` mentions. Its 12-file output must match the accepted
namespaced baseline. Stage 2 runs the existing namespace normalizer and persists
its schema-locked receipt before the unchanged source-conformance compiler runs.

Source-family component-identity-mapping proof command:

```bash
interfacectl surfaces source-family-component-identity-mapping proof --source sources/source-family-component-identity-mapping/team-owned-identity-bundle --authority-manifest sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json --authority-declaration sources/source-family-component-identity-mapping/authority/component-identity-declaration.json --mapping sources/source-family-component-identity-mapping/component-identity-mapping.json --identity-package fixtures/source-family-component-identity-mapping/component-identity-package.fixture.json --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --source-family-namespace-mapping-evidence artifacts/source-family-namespace-mapping/evidence.json --fixture fixtures/source-family-component-identity-mapping --out artifacts/source-family-component-identity-mapping
```

The target persists a component-identity mapping receipt, the Stage 2 namespace
receipt, all eight inner compiler artifacts, a report, and final evidence.
`artifacts/source-family-component-identity-mapping/evidence.json` is
authoritative only for this fixed declared relation and causal two-stage proof.
It does not prove arbitrary identities, alias registries, semantic equivalence,
new component support, broader P2 coverage, live connectors, self-serve
connection, runtime accessibility, production adapters, SurfaceOps expansion,
or JudgmentKit.
