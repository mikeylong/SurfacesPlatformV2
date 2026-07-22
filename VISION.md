# Surfaces Platform Vision And Roadmap

## Status
This is the canonical AI-native source reference for Surfaces Platform product context, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. Agents should read this file before `PLAN.md` or phase subplans.

`PLAN.md` and `plans/**` remain the mechanical proof-contract references: schemas, fixtures, commands, artifacts, diagnostics, and acceptance criteria. Phase subplans may add phase-local deltas and mechanics, but they must not redefine the product vision, authority taxonomy, roadmap sequence, surface roles, or agent operating rules in this file.

`PROGRESS.md` tracks the outcome-based product milestones above the mechanical
P0-P5 roadmap. It is subordinate to this vision, the mechanical plans, and
passing evidence; milestone status does not create proof authority.

## Vision
AI-generated interfaces should become governed product surfaces.

Surfaces Platform exists so generated UI is accountable to a design system, product policy, runtime boundaries, human review, and evidence. A surface should be traceable to source design-system material, validated against explicit contracts, rejected when it exceeds those contracts, routed to review when policy requires it, and rendered only through derived runtime projections.

The platform should make generated UI inspectable and governable enough for product teams to trust it in recurring work.

## Mission
Compile design-system source material into governed, versioned UI contracts that agents and runtimes can use for bounded generation, CI/CD validation, evidence review, and runtime-safe rendering.

## Canonical Authority Model
The design system is the product authority. The Surfaces Catalog is the governed contract authority. Passing evidence is the proof authority for implemented behavior. Agents, runtimes, product surfaces, review surfaces, docs, and evaluators are consumers of those authorities.

- Design-system source material provides the product truth: tokens, components, variants, states, slots, accessibility expectations, examples, and usage policy.
- Extraction normalizes that source material while preserving source references, provenance, and hashes.
- The Surfaces Catalog records what agents may emit and what consumers may render, reject, or send to review.
- Runtime projections, render plans, demos, review queues, docs, product surfaces, and evaluator findings are derived consumers. They cannot add authority.
- Evidence makes every proof reproducible, reviewable, and safe to consume in CI, SurfaceOps, JudgmentKit, demos, and future adapters.

## Platform Architecture Invariants

The platform must get cheaper to extend as it accepts more design systems and
components. A bounded source can prove the first contract, but its component
model, package layout, naming, or proof mechanics cannot become the platform
model.

- One source-ingestion path: every new design-system source or component enters
  through a manifest-declared, data-only adapter and the shared normalization,
  ingestion, and catalog compiler. A new source-specific compiler, merger,
  proof kernel, or consumer path is prohibited.
- Declining marginal cost: a qualifying source or component addition changes
  source locks or bytes, adapter data, manifest membership, fixtures, and
  derived proof output. If shared implementation must change, land and prove
  that reusable platform change separately with source-neutral contract
  fixtures and existing-adapter parity before adding the adapter.
- Source-identity-branch-free shared code: shared runtime, catalog-authority,
  ingestion, release-compatibility, future composition, and consumer modules do
  not dispatch on a concrete package, source family, component, adapter key, or
  output key. Generic identity validation is allowed only through an exact
  policy row; the v0 registry contains 113 non-growing allowances. Supported
  variation is declared as schema-validated data.
- One dependency direction: phase and target proofs may call shared platform
  modules. Shared platform modules must not import P0, P2, target-specific
  implementations, source-specific modules, or their internal exports. Every
  local dependency of protected shared code remains inside the protected,
  source-identity-branch-free closure.
- One catalog-authority path: catalog creation, extension, governance, and
  composition occur only through registered shared authority functions.
  Downstream proofs must not clone an accepted catalog and add or rewrite
  authority. The v0 policy freezes exclusive owners for source ingestion,
  compiler orchestration, catalog authority, release compatibility, and catalog
  consumption. Catalog composition has no v0 owner and remains planned.
- One release boundary as an end state: every downstream consumer must
  eventually accept a source-neutral, hash-bound catalog-release receipt and
  perform one shared fail-closed preflight. The implemented
  `catalog-boundary-receipt.v0` validator is narrower: it is the
  design-system-compiler's single-adapter compatibility envelope, not the
  generic platform release contract. Direct dependencies on P2 catalogs, P2
  evidence, or producer internals remain legacy paths to remove, not patterns
  to copy.
- Generic composition remains planned: multiple adapters may combine only
  after a shared deterministic composer proves collision rejection, source-ref
  and provenance preservation, explicit reviewed policy, and
  strictest-promotion propagation. No current compatibility receipt or consumer
  output proves composition.
- Closed adapter change boundary: a source or component addition may cochange
  only the policy-declared adapter data, derived-output, and required
  instruction-surface paths. v0 admits four roots under `sources/`, `fixtures/`,
  and `artifacts/`, plus `plans/design-system-compiler.md` and
  `plans/surfaces-dev.md`. It cannot carry a schema, shared implementation,
  executable, route, runtime path, or other documentation change in the same
  change set. Adapter manifests, adapter contracts, and source locks satisfy
  their canonical schemas; fixture and derived-output roots are JSON-only;
  source snapshots are inert exact regular-file closures with checked byte
  counts and SHA-256 values. Base-aware admission preserves every existing
  adapter row and closure, freezes the four generic compiler mutation fixtures,
  and permits exactly one new sorted manifest row under a unique direct-child
  adapter key, with fixtures rooted under that key's unshared fixture directory.
  Symlinks, noncanonical paths, artifact-as-
  input fixture refs, replacement adapters, and unowned adapter data are
  rejected.
- Preserved authority: adapters preserve source identity, source refs,
  provenance, hashes, and lossless member identity. Any value absent from the
  locked source requires an explicit mapping and keeps the result review-bound;
  shared code must not infer missing product truth.
- Shrinking exceptions: the architecture policy may name existing legacy paths
  while consolidation is in progress. Legacy implementation bytes are frozen
  while registered. Actual deletion may remove the matching legacy
  registration, hash, and exception; rewriting, adding, broadening, renaming
  around, or silently bypassing an exception is prohibited. The immutable
  migration baseline cannot be rewritten to make drift disappear.
- Closed execution surface: v0 registers the 83 implementation executables
  discovered under `bin/`, `scripts/`, and `src/`, freezes every detected CLI
  route, and freezes the exclusive non-null platform-role owners. It also
  byte-locks every current test, workflow, local execution-control file,
  dependency lock, admitted adapter closure, and the compiler's complete
  15-schema runtime contract closure. The repo-wide tracked-path
  inventory rejects a new root tool, workflow, action, test, or other side
  path outside the four explicitly inert adapter/output roots. Frozen paths
  must remain regular files; symbolic links are rejected at the repository
  root and under executable, test, and workflow roots. No new
  executable registration is permitted. Existing canonical and neutral
  registrations cannot be removed or reclassified; legacy registrations may
  shrink only through actual implementation deletion.

Before another design-system source or component proof is added, the shared
path must accept it without repo-specific implementation changes. The
`check:platform-architecture` gate enforces the machine-checkable portion of
these rules on every test run and against the pull-request or pre-push base in
CI. The v0 guard checks the closed 83-path implementation executable inventory,
241 local module edges, 113 exact identity-control allowances, 34 causal
mutations, and 177 frozen implementation, test, adapter, dependency, guard,
control, schema, mutation, workflow, and migration-protection files. Every run schema-validates the
candidate policy and verifies its normalized policy-schema hash. Bootstrap
runs also verify the admitted initial policy hash; base-aware runs load the
base policy, schema, and adapter manifest and enforce the closed evolution
rules. After this bootstrap PR merges, the trusted `pull_request_target`
workflow runs the default branch's verifier against the candidate checkout
without executing candidate lifecycle or architecture code. This bootstrap PR
still requires review of its admitted hashes and candidate-owned base-aware CI.
The gate
emits no capability evidence and does not prove a generic catalog-release
receipt, catalog composition, source migration, downstream rebinding, legacy
retirement, or production readiness. Those claims still require their own proof
contracts and passing evidence.

## Lifecycle Enforcement Model
Surfaces governs generated UI at the points where unsupported behavior can enter, move through review, or reach a consumer.

- Generation time: the Surfaces Catalog is the emission boundary for any agent or generator that claims Surfaces compliance. Implemented proof slices model that boundary without authorizing live agent execution. Unsupported, ambiguous, or review-bound requests become diagnostics or review-required records instead of inferred UI.
- CI/CD integration time: proof gates validate catalog, fixture, surface, projection, review, and adapter artifacts before repository evidence can support an implementation claim. Passing evidence, deterministic diagnostics, artifact hashes, and proof-bearing gate logs make each claim reproducible and reject stale or invalid output.
- Review time: review-required surfaces remain structurally inspectable but cannot be promoted unattended. Deterministic SurfaceOps decision artifacts and evaluator-facing findings may consume evidence under explicit contracts; they cannot override catalog policy or create live review persistence without a later proof.
- Runtime: runtimes and adapters may consume only derived, hash-bound projections, render plans, protocol envelopes, or adapter-facing artifacts. A target may render, reject, or display output only where its own proof authorizes that behavior; it must not add components, actions, policy, transport behavior, or authority absent from the governed catalog and accepted evidence.

These lifecycle moments share one authority chain: design-system source material feeds the Surfaces Catalog, the Surfaces Catalog defines what consumers may do, passing evidence proves implemented behavior, and derived consumers stay inside those boundaries. A later phase may broaden any lifecycle moment only after it adds its own schema, fixture, proof command, diagnostics, report or artifact path, and evidence.

## User Value
Surfaces Platform creates value when it lets teams:

- connect an existing design system to controlled AI interface generation;
- prevent agents from inventing unsupported UI, props, variants, tokens, slots, actions, or accessibility semantics;
- make generated surfaces reviewable through evidence instead of subjective inspection alone;
- promote safe surfaces, reject invalid surfaces, and route sensitive surfaces to human review;
- generate adapter-visible render plans without turning demos or runtime projections into hidden sources of truth.

## Product Designer Workflow
The product designer workflow is the primary human workflow Surfaces Platform must make safer, clearer, and more repeatable. A designer employing Surfaces should not start from a blank-slate prompt and then inspect pixels after the fact. The workflow starts by declaring product authority, then uses Surfaces to make generated UI accountable to the design system, product policy, review, evidence, and proven target boundaries.

1. <a id="product-designer-workflow-step-1"></a>Declare design authority: identify the authoritative source material for the product surface, including components, variants, tokens, states, slots, accessibility expectations, examples, usage policy, brand rules, content or terminology rules, and review requirements.
2. <a id="product-designer-workflow-step-2"></a>Compile governed contracts: run or consume the relevant Surfaces proof so bounded source material becomes a governed Surfaces Catalog with source refs, provenance, diagnostics, promotion status, and evidence.
3. <a id="product-designer-workflow-step-3"></a>Generate inside the catalog boundary: ask an agent or generator for a surface only where the catalog defines what may be emitted. Unsupported components, props, variants, tokens, actions, accessibility semantics, or policy claims become deterministic diagnostics or review requirements instead of inferred UI.
4. <a id="product-designer-workflow-step-4"></a>Inspect evidence, not only pixels: review source refs, diagnostics, promotion status, accessibility and policy triggers, generated reports, and any demo output. Demos may help inspection, but evidence and proof contracts remain authoritative.
5. <a id="product-designer-workflow-step-5"></a>Decide or revise at the authority layer: accept, reject, request changes, or update the declared source material, mappings, or policy. The preferred fix for unsupported UI is to strengthen source authority or governance, not patch a downstream rendering artifact.
6. <a id="product-designer-workflow-step-6"></a>Hand off only proven target output: downstream consumers may receive only accepted, hash-bound projections, render plans, protocol envelopes, native packets, or target-specific adapter artifacts whose own proof authorizes that target.
7. <a id="product-designer-workflow-step-7"></a>Govern changes over time: when the design system, policy, or target changes, regenerate proof artifacts and evidence so CI, review, and runtime consumers stay aligned with current authority.

This workflow is also the prioritization lens for platform work. Prefer capabilities that shorten or clarify this loop while preserving authority: broader source coverage, better source refs, clearer diagnostics, review-owner routing, accessibility and policy evidence, CI confidence, and target-specific handoff. Deprioritize features that make generated UI look usable while bypassing catalog authority, proof evidence, or review semantics.

The current repo demonstrates this workflow through bounded proof slices and generated evidence, including a local-loopback SurfaceOps kanban live adapter proof. It does not demonstrate a self-serve designer product, production SurfaceOps workflow, live runtime, production adapter, SDK, API, or A2UI support.

## Product Portfolio Boundaries
Surfaces Platform is the contract system. The surrounding product portfolio may include human-facing sites, developer docs, review tools, evaluators, workflow products, and downstream adapter targets, but none of those products gain authority by being adjacent to Surfaces.

- `interfacectl`, the Surfaces Catalog, proof reports, and evidence define implemented Surfaces behavior.
- `surfaces.systems` and `surfaces.dev` explain, teach, and guide. They do not prove behavior or replace evidence.
- SurfaceOps is the standalone review-product direction, including any future `surfaceops.ai` product packaging. The implemented P4 boundary is deterministic decision artifacts only; the separate `surfaceops-kanban-static` target proves an inert adjacent board projection, and the separate `surfaceops-kanban-live` target proves a bounded local-loopback live `kanban.cards` adapter scenario. Production review storage, hosted workflow, production sync, or broader product behavior needs later proof.
- JudgmentKit is the evaluation direction. The implemented P4 boundary is deterministic JudgmentKit-shaped findings only; live invocation needs a later proof and explicit authorization.
- `kanban.cards` is the standalone upstream collaboration-board substrate for SurfaceOps workflows. SurfaceOps should remain the standalone app and review product; any connection should be through a SurfaceOps-owned adapter/projection layer that maps Surfaces evidence into board-ready records or live board operations. The implemented `surfaceops-kanban-live` target proves local-loopback live board read/write, realtime observation, local persistence restart, permission-denial checks, and browser video evidence. Production sync, production auth, hosted persistence, service-account permissions, webhooks, and broad bidirectional updates need later proof.
- A2UI, production adapters, public APIs, SDKs, live runtimes, and other downstream targets remain future target-specific work until each has its own proof shape and passing evidence.

`kanban.cards`, SurfaceOps, JudgmentKit, and A2UI can remain standalone products or targets only if their boundaries stay explicit. None may become catalog authority, proof authority, policy authority, or hidden review state without a later proof.

## Usable Platform Signal
Surfaces becomes a usable platform per target when a team can complete an evidence-backed loop:

- bounded design-system source material becomes a governed catalog with source refs and diagnostics;
- an agent or generator can emit only catalog-allowed surfaces and receives deterministic rejections or review requirements for unsupported requests;
- review-required work is inspectable through evidence and decision records without unattended promotion;
- a consumer can render, display, or adapt only the accepted, hash-bound output for its proven target;
- docs and product surfaces point back to the current proof status instead of claiming unsupported behavior.

Generated demos, review queues, protocol envelopes, workflow cards, or adapter-facing outputs can help demonstrate usability, but they are not the signal by themselves. The signal is the closed evidence loop for a declared target.

## Current Roadmap Proof Snapshot
The current roadmap evidence is P0-P5, with P5 implemented only for the `surfaces-protocol-static` and `surfaces-native-static` proof-only slices. This repo also implements target-specific declared-source conformance, structured accessibility policy reconciliation, fixed source-family layout mapping, fixed source-family namespace mapping, fixed source-family component-identity mapping, Spectrum Checkbox catalog authority, a source-independent design-system compiler with a portable proof-only consumer, designer-workflow-trace, `surfaceops-kanban-static`, `surfaceops-kanban-live`, `surfaceops-designer-review-ui`, and capability-index proofs; none is a new numbered phase. The capability index covers exactly the 18 implemented proof targets other than itself. Its separate planned capability groups provide roadmap visibility only. `surfaceops-kanban-live` and `surfaceops-designer-review-ui` are bounded local-loopback live proofs, not production SurfaceOps or production `kanban.cards` claims. A row counts as implemented only when the named evidence file records `status: "pass"`. `promotionStatus` records governance outcome, not whether the proof command failed.

| Phase | Implemented slice | Lifecycle value | Evidence | Current status | Current promotion status | CI gate | Demo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | Synthetic catalog contract proof | Generation boundary for governed Surface IR | `artifacts/p0/evidence.json` | `pass` | `review_required` | `npm run check:p0:ci` | `demo/p0/index.html` |
| P1 | `web-static` runtime projection and render-plan proof | Runtime-safe derived projection and inert render plans | `artifacts/p1/evidence.json` | `pass` | `review_required` | `npm run check:p1:ci` | `demo/p1/index.html` |
| P2 | Bounded local Adobe Spectrum Design Data ingestion for `button` and `in-line-alert` | Immutable npm snapshot lock, real design-system source refs, mappings, diagnostics, and governed catalog output | `artifacts/p2/evidence.json` | `pass` | `review_required` | `npm run check:p2:ci` | `demo/p2/index.html` |
| Target | Reusable declared-source conformance proof | The unchanged fact-level compiler consumes two compatible team-owned authority bundles for the existing P2 components without expanding accepted catalog authority | `artifacts/source-family-packaging/evidence.json` | `pass` | `review_required` | `npm run check:source-family-packaging:ci` | none; report/evidence only |
| Target | Structured accessibility policy reconciliation | Closed behavior declarations reconcile Button and InLineAlert accessibility requirements with accepted catalog facts while opaque policy strings remain identity anchors only | `artifacts/source-accessibility-policy/evidence.json` | `pass` | `review_required` | `npm run check:source-accessibility-policy:ci` | none; report/evidence only |
| Target | Fixed source-family layout mapping | One alternate physical directory and filename layout maps 12 byte-identical files onto the existing logical source ABI before the unchanged compiler runs | `artifacts/source-family-layout-mapping/evidence.json` | `pass` | `review_required` | `npm run check:source-family-layout-mapping:ci` | none; report/evidence only |
| Target | Fixed source-family namespace mapping | One alternate source-ref prefix normalizes at 78 checked JSON pointers onto the canonical namespace, refreshes 11 manifest hashes, and reproduces the exact accepted 12-file compiler result | `artifacts/source-family-namespace-mapping/evidence.json` | `pass` | `review_required` | `npm run check:source-family-namespace-mapping:ci` | none; report/evidence only |
| Target | Fixed source-family component-identity mapping | One explicit team-owned authority declaration authorizes the exact `TeamButton` to accepted P2 `Button` identity relation for one checked 12-file bundle before a derived 22-substitution mapping feeds the existing namespace normalizer and unchanged compiler | `artifacts/source-family-component-identity-mapping/evidence.json` | `pass` | `review_required` | `npm run check:source-family-component-identity-mapping:ci` | none; report/evidence only |
| Target | Spectrum Checkbox catalog authority | One separately locked real-source Checkbox byte expands a distinct governed catalog while every accepted P2 component and token record stays unchanged | `artifacts/spectrum-checkbox-catalog/evidence.json` | `pass` | `review_required` | `npm run check:spectrum-checkbox-catalog:ci` | none; report/evidence only |
| Target | Source-independent design-system compiler and portable consumer | Data-only Spectrum Switch and Astryx core Button adapters run through one shared ingestion kernel and one shared inert consumer with no source-specific implementation modules | `artifacts/design-system-compiler/evidence.json` | `pass` | `review_required` | `npm run check:design-system-compiler:ci` | none; report/evidence only |
| Target | Designer workflow trace proof | Index over accepted evidence from design authority through governed catalog, review/evaluation refs, static target handoff, and evidence status | `artifacts/designer-workflow-trace/evidence.json` | `pass` | `blocked` | `npm run check:designer-workflow-trace:ci` | none; report/evidence only |
| Target | `surfaceops-kanban-static` proof | Static SurfaceOps-owned board projection over accepted P3/P4 review evidence and a hash-bound local `kanban.cards` substrate contract | `artifacts/surfaceops-kanban-static/evidence.json` | `pass` | `review_required` | `npm run check:surfaceops-kanban-static:ci` | none; inert board artifacts only |
| Target | `surfaceops-kanban-live` proof | Local-loopback live `kanban.cards` API/browser proof for SurfaceOps approvals over accepted P3/P4 evidence and a hash-bound API manifest | `artifacts/surfaceops-kanban-live/evidence.json` | `pass` | `review_required` | `npm run check:surfaceops-kanban-live:ci` | none; browser runtime evidence under `output/playwright/surfaceops-kanban-live/` |
| Target | `surfaceops-designer-review-ui` proof | Local-loopback SurfaceOps inspection workbench that preserves the upstream block and mirrors a rationale-required blocked receipt to a real `kanban.cards` card | `artifacts/surfaceops-designer-review-ui/evidence.json` | `pass` | `blocked` | `npm run check:surfaceops-designer-review-ui:ci` | `demo/surfaceops-designer-review-ui/index.html`; browser runtime evidence under `output/playwright/surfaceops-designer-review-ui/` |
| P3 | Inert agent orchestration proof | Evidence-bound work orders, task DAG, review queue, and no live execution | `artifacts/p3/evidence.json` | `pass` | `review_required` | `npm run check:p3:ci` | `demo/p3/index.html` |
| P4 | Deterministic review and judgment proof | SurfaceOps-shaped decisions and JudgmentKit-shaped findings without live persistence or invocation | `artifacts/p4/evidence.json` | `pass` | `blocked` | `npm run check:p4:ci` | `demo/p4/index.html` |
| P5 | `surfaces-protocol-static` inert protocol-envelope proof | Protocol-boundary consumption of accepted P2/P4 evidence | `artifacts/p5/protocol/evidence.json` | `pass` | `review_required` | `npm run check:p5:protocol:ci` | `demo/p5/protocol/index.html` |
| P5 | `surfaces-native-static` inert native-packet proof | Surfaces-native static projection with protocol compatibility preflight | `artifacts/p5/native/evidence.json` | `pass` | `review_required` | `npm run check:p5:native:ci` | `demo/p5/native/index.html` |
| Target | Capability index and read-only verifier | Discovery and integrity verification across the 18 implemented proof targets other than itself, with planned groups kept separate from implementation claims | `artifacts/capability-index/evidence.json` | `pass` | `allowed` | `npm run check:capability-index:ci` | none; report/evidence only |

P4's `blocked` promotion status is expected in current tracked evidence: it proves invalid or unsafe review outcomes are blocked while the proof itself still passes. The designer review UI also passes with blocked promotion because its accepted trace records `targetHandoffAllowed: false` and `SOURCE_REVIEW_EXPIRED`. Demos remain presentation output. They help humans inspect the proof, but evidence and the proof contract remain authoritative.

## Current State
P0 proves the catalog contract with a synthetic golden fixture. It materializes `extract.json`, `catalog.json`, `governed-catalog.json`, adapter diagnostics, and evidence from `fixtures/p0/source.fixture.json`.

P1 proves the first runtime-facing surface. It derives a `web-static` runtime projection and deterministic render plans from the governed catalog, then writes adapter report and evidence artifacts.

P2 implements the first bounded real design-system ingestion proof from a manifest-declared local source bundle: the pinned `@adobe/spectrum-design-data@0.7.0` snapshot scoped to `button` and `in-line-alert`. The immutable `package-snapshot.lock.json` is derived from the pinned npm tarball after SRI verification and hash-binds the checked-in package bytes independently from the generated source manifest. Normal materialization compares the local snapshot with this lock and never regenerates it. The former agent-orchestration draft has moved to `plans/p3/` and should run only after P2 ingestion evidence passes.

The capability-index proof materializes one machine-readable index and report
over exactly the 18 implemented proof targets other than itself. Its read-only
verifier checks the tracked index, capability-index evidence, and target
evidence without regenerating artifacts. Implementation status, evidence
status, and promotion status remain separate. Seven planned capability groups
remain roadmap records only: they have no proof command or evidence claim. The
capability-index target does not index itself, replace target evidence, broaden
target authority, or turn planned work into implemented behavior.

The declared-source conformance target consumes accepted P2 evidence and catalog output, then runs the same fact-level compiler over two checked instances of the fixed `declared-local-source-bundle.v0` layout. The original bundle remains the accepted input for the designer workflow trace. The package proof executes both accepted bundles in separate isolated workspaces, records two passing compiler executions, and counts a third failing authority-expansion probe separately. The second team-owned bundle produces its own captured inventory, fact coverage, authority map, review queue, governed catalog, reports, and evidence. Aggregate package evidence binds the seven-file local JavaScript execution closure, Node 22 and package dependency inputs, the physical second-bundle manifest and source bytes, the shared P2 boundary, referenced-route ownership, and a post-workspace remap that re-verifies the captured inner evidence with the unchanged verifier. Both bundles cover only Button and InLineAlert, and their governed catalogs preserve the accepted P2 capability fields. The target remains proof-only and emits report/evidence artifacts, not a generated demo or live integration.

The `source-accessibility-policy` target consumes accepted P2, source-conformance, and source-family packaging evidence, then evaluates a separate manifest-declared set of structured behavior assertions for Button and InLineAlert. Existing policy requirement strings are resolved and hash-checked as opaque identities; behavior kind, component, catalog pointer, operator, expected value, source refs, and review routing come only from the closed declaration contract. Missing or conflicting facts become deterministic blocked or non-executable review results. The target emits coverage, an authority map, a review queue, a report, and evidence. It emits no governed catalog and does not prove runtime accessibility compliance.

The `source-family-layout-mapping` target consumes accepted P2 and source-family packaging evidence, then verifies one fixed alternate physical layout of the accepted team-owned bundle. Its immutable layout-package trust anchor maps 12 byte-identical independent regular files onto the existing logical source ABI before the unchanged source-conformance compiler runs. The target persists and re-verifies all eight inner artifacts, preserves the accepted fact, catalog, source-ref, owner, and review boundaries, and records passing report/evidence output with no demo. It proves this one fixed mapping only: arbitrary layouts or filenames, namespace mapping, broader P2 coverage, live connectors, self-serve UI, runtime accessibility claims, production adapters, SurfaceOps expansion, and JudgmentKit remain outside its evidence.

The `source-family-namespace-mapping` target consumes accepted P2 and fixed-layout evidence, then verifies one checked copy of the same physical bundle whose 78 declared-source string leaves use `declared-source://product-team-authority/`. An immutable namespace package binds every substitution pointer plus the 11 manifest hash refreshes. Normalization occurs only in an isolated workspace; all 12 normalized logical files must be byte-identical to the accepted fixed-layout baseline before the unchanged compiler runs. The target persists and re-verifies all eight inner artifacts and requires exact equality with accepted layout-mapping output. It proves this one prefix pair only: arbitrary namespaces or alias chains, new layouts or components, live connectors, self-serve UI, production adapters, SurfaceOps expansion, and JudgmentKit remain outside its evidence.

The `source-family-component-identity-mapping` target consumes accepted P2 and fixed-namespace evidence, then verifies one checked 12-file bundle whose Button authority records use the fixture-local `TeamButton` identity. One explicit, team-owned authority declaration binds the exact `TeamButton` to accepted P2 `Button` relation to source refs, provenance, hashes, the current P2 catalog/evidence target, and owner review status. The declaration is source authority; the mapping descriptor, Stage 1 normalizer, receipt, reports, and evidence are derived consumers and cannot authorize or infer identity. Stage 1 applies exactly 22 declared substitutions across five files, refreshes exactly five manifest hashes, preserves four narrative `Button` mentions unchanged, and must reproduce the accepted fixed-namespace input before the existing namespace normalizer and unchanged compiler run. The target persists and re-verifies all eight inner artifacts and requires exact equality with accepted namespace-mapping output. It removes this one exact component-identity constraint only: arbitrary identities, alias registries, semantic inference, new components or facts, broader P2 coverage, live connectors, self-serve UI, runtime accessibility, production adapters, SurfaceOps expansion, and JudgmentKit remain outside its evidence.

The `spectrum-checkbox-catalog` target consumes accepted P2 evidence and its
governed catalog, then verifies one separately locked Checkbox source byte from
the same pinned Spectrum package. It reuses the accepted component registry and
one desktop token record, adds Checkbox plus that token to a distinct governed
catalog, and preserves every accepted P2 component and token record by JCS
hash. Structured selection precedence and review-required ambiguity stay in
the catalog contract; no action or runtime accessibility authority is inferred.
The target does not change P2 or prove full Spectrum support, live connectors,
self-serve UI, production adapters, SurfaceOps expansion, JudgmentKit, or A2UI.

The `design-system-compiler` target proves a source-independent ingestion and
consumer boundary without changing P2 or Checkbox. Separately locked Spectrum
Switch and official Astryx core Button adapters declare exact typed locators,
normalized facts, complete mappings, and a narrowing-only policy contract as
data. One unchanged kernel requires lossless mapped facts to remain
source-justified, keeps inferences review-required, and emits
an extract, catalog, governed catalog, and hash-bound boundary receipt. One
unchanged `web-static-portable` consumer accepts that receipt, emits an inert
render plan for an allowed fixture, blocks an unknown member, and preserves
review-required governance for a promotion request. Passing evidence requires
matching transitive local ingestion-kernel and consumer implementation-closure
hashes plus an empty source-specific implementation-module list.
The target does not make legacy P2, P3, P4, or P5 portable and does not prove
broad Spectrum or Astryx support, live connectors, self-serve UI, runtime
accessibility compliance, production adapters, SurfaceOps expansion,
JudgmentKit, A2UI, or production readiness.

The designer-workflow-trace proof consumes accepted P2, source-conformance, P3, P4, protocol, and native evidence, then emits a deterministic trace selection, report, and evidence index for one Button scenario. The trace report is an index over accepted evidence, not catalog authority, upstream proof authority, product workflow implementation, customer validation, production adoption, live SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, or P7.

The `surfaceops-kanban-static` proof consumes accepted P3/P4 evidence plus a manifest-declared local `kanban.cards` board-substrate contract, then emits deterministic target selection, board projection, designer view model, inert board packets, adapter report, and evidence. Its generated demo and browser-functional recording gate provide inspectability evidence for that static projection, while `artifacts/surfaceops-kanban-static/evidence.json` remains proof authority. It proves a static adjacent projection only: no live `kanban.cards` writes, live SurfaceOps, live JudgmentKit, persistence, production adapter, API, SDK, A2UI, hidden review state, or execution authority.

The `surfaceops-kanban-live` proof consumes accepted P3/P4 evidence plus a hash-bound local `kanban.cards` API manifest, then emits deterministic target selection, API projection, operation plan, handoff record, adapter report, and evidence. Its browser-functional gate starts a real local `kanban.cards` server from a sibling checkout, uses isolated temporary state, performs real API reads and writes, observes realtime events, verifies local persistence across restart, drives Chromium, records video, captures a screenshot, and writes hashed runtime evidence. It proves the local SurfaceOps-owned adapter boundary only: no `kanban.cards` source modifications, production SurfaceOps, production `kanban.cards`, Auth0 delegated production auth, hosted persistence, public API or SDK, A2UI, live JudgmentKit, work execution, or product adoption.

The `surfaceops-designer-review-ui` proof consumes accepted designer-workflow-trace evidence, accepted P4 review evidence as context rather than Button handoff authority, and accepted `surfaceops-kanban-live` evidence, then emits deterministic target selection, workbench, decision receipt, report, and evidence for the Button variants designer review loop. The accepted trace passes with blocked promotion, denies target handoff, and carries `SOURCE_REVIEW_EXPIRED`, so the workbench remains available for inspection while approve and request-refinement actions stay disabled. The only enabled outcome is a rationale-required blocked receipt, mirrored back to the live card as `blocked`; the target emits no variant-of-record or handoff. Its browser-functional gate starts a real local `kanban.cards` server and a proof-only loopback SurfaceOps review server, creates a live `Button variants` card, opens the evidence-bound workbench, records the blocked receipt, mirrors it through server-side kanban credentials, observes realtime/event-history evidence, verifies restart persistence, records video, captures a screenshot, and writes hashed runtime evidence. It proves local-live inspection UI and mirror behavior only: no production SurfaceOps, production `kanban.cards`, hosted persistence, production auth, webhooks, broad production adapter, live JudgmentKit, A2UI, SDK, or work execution claim.

P3 implements the first inert agent recruitment and orchestration proof after P2 evidence passes. It materializes a capability registry, deterministic task DAG, scoped non-executable work orders, review queue, report, demo, and evidence without live agents, tool calls, connector calls, file edits, network calls, secrets, callbacks, SurfaceOps persistence, or JudgmentKit execution.

P4 implements the first deterministic review and judgment proof over accepted P3 evidence and the P3 review queue. It materializes a SurfaceOps decision ledger, JudgmentKit-shaped evaluation report, review/judgment report, demo, and evidence without live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, production adapters, P5/A2UI scope, or authority override.

P5 implements the first bounded protocol-boundary slice: `surfaces-protocol-static`. It materializes a deterministic target-selection artifact, protocol projection, inert protocol envelopes, protocol adapter report, demo, CI gate, and evidence from accepted P2 catalog/evidence and accepted P4 review/judgment evidence. This P5 slice is proof-only: it is not A2UI, a production adapter, public API, SDK, live protocol service, live SurfaceOps integration, or live JudgmentKit integration.

P5 also implements the sibling `surfaces-native-static` target. It materializes native target selection, a Surfaces-native projection, inert native packets, a native report, demo, CI gate, and evidence from accepted P2 catalog/evidence and accepted P4 review/judgment evidence, with `artifacts/p5/protocol/evidence.json` consumed only as compatibility preflight. This slice is proof-only: it is not A2UI, a production native SDK, production API, native bridge, live runtime, expansion of `surfaces-protocol-static`, live SurfaceOps integration, or live JudgmentKit integration.

## Roadmap
This roadmap is the accepted product sequence for the current plan.

P0: Contract proof. Prove that design-system-shaped source material can compile into a governed Surfaces Catalog with diagnostics, review gates, and evidence. Current implementation uses a synthetic fixture, not a real product design system.

P1: Runtime surface proof. Prove that the governed catalog can produce an adapter-facing runtime projection, deterministic render plans, generated demo output, report rows, and evidence without becoming a general renderer.

P2: Real design-system ingestion proof. Prove that Surfaces can extract a governed catalog from at least one bounded, real design-system source. The proof keeps the existing contract discipline: a pinned-tarball package snapshot lock, declared inputs, normalized extraction, source refs, provenance, diagnostics, fixture coverage, pass/fail gates, and final evidence.

P3: Agent recruitment and orchestration proof. Prove agent control through registered capabilities, bounded inputs, bounded outputs, scoped work orders, explicit dependencies, review routing, reports, and evidence. This proof remains inert before any live agent execution is allowed.

P4: Review and judgment proof. Let SurfaceOps and JudgmentKit consume evidence. SurfaceOps should handle review queues and human decisions. JudgmentKit should evaluate activity fit, contract quality, evidence quality, and handoff quality. Neither should override the Surfaces Catalog.

P5: Protocol boundaries and target-specific adapter proofs. The implemented slices are `surfaces-protocol-static`, a deterministic inert protocol-envelope proof, and `surfaces-native-static`, a deterministic inert native-packet proof. Add additional runtime projections, A2UI exports or conformance proofs, production APIs, SDKs, live runtimes, and broader adapter support only after each target has its own schema, fixtures, diagnostics, command contract, and evidence.

## Roadmap Horizon
The current P0-P5 sequence is the implemented proof-contract roadmap, not the full company roadmap. The horizon after P5 is target-specific expansion, not a blanket platform claim or a set of runnable P6/P7 phases before proof shapes exist.

- Source coverage can broaden only through declared source families that preserve refs, provenance, diagnostics, and evidence.
- Declared-source conformance can broaden only by adding target-specific source schemas, fixture coverage, diagnostics, report/evidence paths, and passing CI evidence.
- Designer workflow trace coverage can broaden only by adding trace-specific schemas, fixture coverage, diagnostics, command arguments, report/evidence paths, CI gates, and passing evidence for the additional scenario or target refs.
- SurfaceOps can move from deterministic decision artifacts toward live operational review only within target-specific proof boundaries. The implemented `surfaceops-kanban-live` target proves a local-loopback `kanban.cards` API/browser integration for the designer approval workflow; production SurfaceOps remains future work until its own proof defines production storage, workflow, permissions, deployment, and authority boundaries.
- `kanban.cards` can become the reusable upstream collaboration-board substrate only within proved bounds. The implemented `surfaceops-kanban-static` target proves a static, inert SurfaceOps-owned board projection over accepted evidence and a local substrate contract. The implemented `surfaceops-kanban-live` target proves local-loopback live board read/write, realtime observation, local persistence restart, permission-denial checks, and browser video evidence without modifying `kanban.cards`. Production sync, production auth, hosted persistence, service-account permissions, webhooks, and broad bidirectional conflict handling require later proof.
- A2UI, production adapters, public APIs, SDKs, live runtimes, production SurfaceOps, and live JudgmentKit remain future work until target-specific evidence passes.
- Product and docs surfaces should continue to describe the current proven scope plainly and keep planned targets labeled as planned.
- The capability index may expose planned capability groups for roadmap
  visibility, but only passing target evidence can establish implemented
  behavior. The index remains a derived discovery surface and does not
  self-index.

## Real Design-System Extraction
P0 remains a synthetic fixture proof, and P1 remains a derived runtime projection proof. P2 is the first bounded real-source ingestion proof: it reads only the manifest-declared local `@adobe/spectrum-design-data@0.7.0` source snapshot, companion local mappings, and local usage policy under `sources/p2/design-system-source`, scoped to `button` and `in-line-alert`. The package snapshot must match the exact file set and hashes in `package-snapshot.lock.json`. That checked-in lock records the result of a separate review-time SRI and tarball verification; the deterministic proof treats it as a trust anchor and does not fetch or reconstruct the tarball. It does not call Figma, scrape Storybook, parse Code Connect, crawl docs, inspect production HTML, or claim full Spectrum support.

Surfaces can claim a real design-system ingestion capability only for source families and targets that prove all of the following:

- the input source is an authoritative design-system source, not a hand-authored fixture shaped for the proof;
- checked-in package bytes match an immutable lock derived from the pinned upstream package, and ordinary materialization cannot rewrite that lock to accept local drift;
- extraction preserves source references for every token, component, prop, variant, state, slot, action, accessibility rule, example, and governance rule it emits;
- unsupported or ambiguous source material becomes a diagnostic, review requirement, or explicit manual mapping, not a silent assumption;
- the generated catalog and governed catalog validate against the same contract discipline as P0/P1;
- evidence records source hashes, generated artifact hashes, provenance, diagnostics, and pass/fail status.

Likely source families:

- Figma libraries can provide variables, styles, components, variants, component properties, visual examples, and design provenance. Figma is usually weak on runtime behavior, data binding, action semantics, and governance unless those are represented through annotations or companion sources.
- Storybook and code documentation can provide component APIs, prop types, examples, states, controls, and implementation constraints. They are usually stronger for runtime shape than for design authority.
- Figma Code Connect can bridge design components to code usage when mappings are maintained and source refs are preserved.
- Design-system docs can provide usage rules, accessibility guidance, do/don't policy, and governance context. They need structured references to become reliable proof input.
- Production HTML pages can provide observed usage examples and regression signals. They should not become the design-system authority unless the project explicitly declares them canonical.

P2 picks one bounded local source-bundle strategy and proves it end to end before expanding to multiple source families.

## Surface Roles
Surfaces Catalog is the governed contract artifact. It is the authority for what agents may emit and what runtime projections, proof consumers, future adapters, and review tools may render, reject, or send to review. Evaluators consume catalog-backed evidence to assess activity fit, contract quality, evidence quality, and handoff quality; they do not render surfaces, route review, promote work, or become enforcement authority.

`interfacectl` is the compiler, validation, and enforcement surface. It materializes proof artifacts, validates contracts, blocks stale or invalid output, writes diagnostics, and finalizes evidence. It should stay deterministic and evidence-first.

`surfaces.systems` is the product and category surface. It should explain the problem, the platform model, trust posture, proof status, and product narrative for humans. It is context and positioning, not proof authority.

`surfaces.dev` is the developer and agent instruction surface. It should explain how to use the contracts, commands, schemas, examples, and evidence. It can guide agents and developers, but it should point back to versioned proof artifacts instead of becoming a second source of truth. Required phase updates are tracked in [Surfaces.dev Documentation Tracking](plans/surfaces-dev.md).

JudgmentKit is the evaluation layer. It may emit evaluation findings over existing proof artifacts after they exist. It should not compile, mutate, render, route, promote, reject, or override the Surfaces Catalog.

SurfaceOps is the operational review surface. It should consume review-required evidence, show queues and decisions, and help humans promote, reject, or request changes. It should not invent policy outside the governed catalog.

`kanban.cards` is the standalone upstream collaboration-board substrate for human/agent SurfaceOps workflows. SurfaceOps remains the standalone app and review product. The implemented `surfaceops-kanban-static` target maps Surfaces evidence, review queue refs, and SurfaceOps decision refs into inert board-ready records for a local `kanban.cards` substrate contract. The implemented `surfaceops-kanban-live` target proves a local-loopback live API/browser adapter scenario over real `kanban.cards` board state without modifying the upstream source. In both targets, the board substrate does not own Surfaces review semantics. It must not create catalog authority, promote or reject surfaces, execute work, persist SurfaceOps decisions as proof authority, or infer decisions from lane movement.

A2UI is a downstream compatibility or projection target for a future P5 target. It is not implemented by the `surfaces-protocol-static` or `surfaces-native-static` slices and should not become the Surfaces data model unless a separate P5 target proves an A2UI projection with its own schema, fixtures, diagnostics, conformance proof, and evidence.

## Runtime Relationship
The runtime chain is:

```text
Surfaces Catalog -> runtime projection -> render plans -> generated demo or adapter-facing output
```

The Surfaces Catalog is the authority. Runtime projections are hash-bound, adapter-specific subsets. Render plans are deterministic outputs for allowed surfaces only. Generated demos are presentation output, not proof authority.

## Agent Operating Rules
Agents working in this repo should follow these rules:

- Read this file first, then `PLAN.md`, then the relevant phase subplans.
- Treat passing `artifacts/*/evidence.json` as the proof authority for implemented behavior.
- Use `npm run status` for a read-only summary of the tracked capability index;
  follow its evidence refs back to the target evidence before making an
  implementation claim.
- Treat data under `fixtures/**` as proof input, not product data, public API, runtime state, or real design-system extraction.
- Do not describe synthetic fixture extraction as real design-system extraction.
- Do not treat generated demos as proof. Demos are presentation output derived from proof artifacts.
- Do not let runtime projections, review queues, docs, or product surfaces add authority absent from the governed catalog.
- Keep phase subplans limited to phase-local deltas and mechanics; link back here for product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules.
- Preserve source refs, provenance, hashes, diagnostic codes, promotion status, and review semantics when changing any proof layer.
- Preserve proof-bearing gate logs, commit SHA, and final evidence hash with the PR or merge record for shipped claims. Do not store merge records or gate logs under generated artifact roots such as `artifacts/p2`.
- If a new capability lacks a schema, fixture, proof command, diagnostics, report or evidence path, it is not implemented yet.
- Keep live execution, network calls, tool calls, secret access, autonomous edits, and persistent review decisions out of a phase until that phase has a deterministic proof contract.

## Phase Selection Rules
When choosing the next phase, prefer work that strengthens catalog authority or evidence quality before adding consumers.

If a phase adds a consumer before real source ingestion, name the limitation clearly. A consumer can prove enforcement mechanics, but it does not prove the platform can understand a real design system.

If source material is ambiguous, the correct output is a diagnostic, review requirement, or explicit mapping requirement. Do not fill gaps with agent inference and call the result governed.

If a product surface consumes evidence, it may explain, evaluate, route, or display the result. It may not override the catalog, rewrite policy, or promote work without an explicit review contract.

## Open Decisions
- Broader real design-system source families beyond the P2 local source bundle remain open. P2 does not settle Figma, Storybook, Code Connect, docs crawler, production HTML, or multi-source authority policy.
- Broader Spectrum coverage remains open. The implemented P2 target is Adobe Spectrum Design Data, pinned to `@adobe/spectrum-design-data@0.7.0`, scoped to `button` and `in-line-alert`. The separate Checkbox target adds one bounded component to a distinct governed catalog. The design-system compiler proves one bounded Spectrum Switch adapter through the shared kernel and portable consumer without expanding P2 or Checkbox. These targets are not claims of full Spectrum support, live ingestion, or Adobe endorsement.
- Broader declared-source conformance remains open beyond the two checked fixed-layout package instances, one fixed alternate physical layout, one fixed alternate source-ref prefix, one explicit team-owned declaration for the exact fixture-local `TeamButton` to accepted P2 `Button` identity relation, the separately locked Checkbox catalog addition, and the two bounded design-system compiler adapters. Arbitrary layouts, namespace pairs, component identities, alias registries, semantic mappings, additional source families or components, legacy P2-P5 portability, live connectors, self-serve connection, and production-facing conformance still require separate proof shapes and passing evidence.
- Broader accessibility policy coverage remains open beyond the structured Button and InLineAlert declaration set. The implemented reconciliation target proves deterministic policy-to-catalog comparison and non-executable review routing; it does not infer behavior from free-form text, add missing P2 facts, or establish runtime accessibility compliance.
- Broader designer workflow trace coverage remains open beyond the first Button trace over accepted P2, source-conformance, P3, P4, protocol, and native evidence. Additional scenarios, targets, components, or partner-facing workflows require their own trace fixture coverage, diagnostics, report/evidence paths, and passing evidence.
- Broader JudgmentKit execution or live integration beyond the implemented P4 deterministic `judgmentkit-evaluation-report.v0` remains open.
- Broader SurfaceOps operational storage, workflow, or live product behavior beyond the implemented P4 deterministic `surfaceops-decision-ledger.v0` and the bounded local `surfaceops-kanban-live` adapter proof remains open.
- The exact packaging relationship between SurfaceOps, `surfaceops.ai`, and `kanban.cards` remains open. The default architecture is `kanban.cards` as a standalone upstream collaboration-board substrate, SurfaceOps as the standalone app and review product, and a SurfaceOps-owned adapter layer between them. White-labeling remains possible only if standalone `kanban.cards` is intentionally deprioritized. The live claim currently stops at the local-loopback `surfaceops-kanban-live` proof; production sync, production auth, hosted persistence, and production adapter behavior remain unclaimed until later proof.
- Long-term JudgmentKit finding storage remains open: findings may stay in evidence, appear in SurfaceOps, or live in a separate evaluation store only after the relevant proof defines ownership and authority.
- A2UI target shape remains open: a future proof may define export, conformance, or both, but A2UI is not the Surfaces data model.
- Broader P5 support beyond the implemented `surfaces-protocol-static` and `surfaces-native-static` proofs remains open. The current P5 slices prove inert protocol envelopes and inert native packets only; A2UI, production adapters, public APIs, SDKs, live protocol services, live native runtimes, production SurfaceOps, and live JudgmentKit remain future target-specific proof work.
