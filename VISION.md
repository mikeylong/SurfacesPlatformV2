# Surfaces Platform Vision And Roadmap

## Status
This is the canonical AI-native source reference for Surfaces Platform product context, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. Agents should read this file before `PLAN.md` or phase subplans.

`PLAN.md` and `plans/**` remain the mechanical proof-contract references: schemas, fixtures, commands, artifacts, diagnostics, and acceptance criteria. Phase subplans may add phase-local deltas and mechanics, but they must not redefine the product vision, authority taxonomy, roadmap sequence, surface roles, or agent operating rules in this file.

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
The current roadmap evidence is P0-P5, with P5 implemented only for the `surfaces-protocol-static` and `surfaces-native-static` proof-only slices. This repo also implements target-specific declared-source conformance, designer-workflow-trace, `surfaceops-kanban-static`, `surfaceops-kanban-live`, and `surfaceops-designer-review-ui` proofs that consume accepted evidence; none is a new numbered phase. `surfaceops-kanban-live` and `surfaceops-designer-review-ui` are bounded local-loopback live proofs, not production SurfaceOps or production `kanban.cards` claims. A row counts as implemented only when the named evidence file records `status: "pass"`. `promotionStatus` records governance outcome, not whether the proof command failed.

| Phase | Implemented slice | Lifecycle value | Evidence | Current status | Current promotion status | CI gate | Demo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | Synthetic catalog contract proof | Generation boundary for governed Surface IR | `artifacts/p0/evidence.json` | `pass` | `review_required` | `npm run check:p0:ci` | `demo/p0/index.html` |
| P1 | `web-static` runtime projection and render-plan proof | Runtime-safe derived projection and inert render plans | `artifacts/p1/evidence.json` | `pass` | `review_required` | `npm run check:p1:ci` | `demo/p1/index.html` |
| P2 | Bounded local Adobe Spectrum Design Data ingestion for `button` and `in-line-alert` | Real design-system source refs, mappings, diagnostics, and governed catalog output | `artifacts/p2/evidence.json` | `pass` | `review_required` | `npm run check:p2:ci` | `demo/p2/index.html` |
| Target | Declared source conformance proof | Declared-source authority, review, and evidence checks over accepted P2 catalog/evidence | `artifacts/source-conformance/evidence.json` | `pass` | `review_required` | `npm run check:source-conformance:ci` | none; report/evidence only |
| Target | Designer workflow trace proof | Index over accepted evidence from design authority through governed catalog, review/evaluation refs, static target handoff, and evidence status | `artifacts/designer-workflow-trace/evidence.json` | `pass` | `blocked` | `npm run check:designer-workflow-trace:ci` | none; report/evidence only |
| Target | `surfaceops-kanban-static` proof | Static SurfaceOps-owned board projection over accepted P3/P4 review evidence and a hash-bound local `kanban.cards` substrate contract | `artifacts/surfaceops-kanban-static/evidence.json` | `pass` | `review_required` | `npm run check:surfaceops-kanban-static:ci` | none; inert board artifacts only |
| Target | `surfaceops-kanban-live` proof | Local-loopback live `kanban.cards` API/browser proof for SurfaceOps approvals over accepted P3/P4 evidence and a hash-bound API manifest | `artifacts/surfaceops-kanban-live/evidence.json` | `pass` | `review_required` | `npm run check:surfaceops-kanban-live:ci` | none; browser runtime evidence under `output/playwright/surfaceops-kanban-live/` |
| Target | `surfaceops-designer-review-ui` proof | Local-loopback SurfaceOps inspection workbench that preserves the upstream block and mirrors a rationale-required blocked receipt to a real `kanban.cards` card | `artifacts/surfaceops-designer-review-ui/evidence.json` | `pass` | `blocked` | `npm run check:surfaceops-designer-review-ui:ci` | `demo/surfaceops-designer-review-ui/index.html`; browser runtime evidence under `output/playwright/surfaceops-designer-review-ui/` |
| P3 | Inert agent orchestration proof | Evidence-bound work orders, task DAG, review queue, and no live execution | `artifacts/p3/evidence.json` | `pass` | `review_required` | `npm run check:p3:ci` | `demo/p3/index.html` |
| P4 | Deterministic review and judgment proof | SurfaceOps-shaped decisions and JudgmentKit-shaped findings without live persistence or invocation | `artifacts/p4/evidence.json` | `pass` | `blocked` | `npm run check:p4:ci` | `demo/p4/index.html` |
| P5 | `surfaces-protocol-static` inert protocol-envelope proof | Protocol-boundary consumption of accepted P2/P4 evidence | `artifacts/p5/protocol/evidence.json` | `pass` | `review_required` | `npm run check:p5:protocol:ci` | `demo/p5/protocol/index.html` |
| P5 | `surfaces-native-static` inert native-packet proof | Surfaces-native static projection with protocol compatibility preflight | `artifacts/p5/native/evidence.json` | `pass` | `review_required` | `npm run check:p5:native:ci` | `demo/p5/native/index.html` |

P4's `blocked` promotion status is expected in current tracked evidence: it proves invalid or unsafe review outcomes are blocked while the proof itself still passes. The designer review UI also passes with blocked promotion because its accepted trace records `targetHandoffAllowed: false` and `SOURCE_REVIEW_EXPIRED`. Demos remain presentation output. They help humans inspect the proof, but evidence and the proof contract remain authoritative.

## Current State
P0 proves the catalog contract with a synthetic golden fixture. It materializes `extract.json`, `catalog.json`, `governed-catalog.json`, adapter diagnostics, and evidence from `fixtures/p0/source.fixture.json`.

P1 proves the first runtime-facing surface. It derives a `web-static` runtime projection and deterministic render plans from the governed catalog, then writes adapter report and evidence artifacts.

P2 implements the first bounded real design-system ingestion proof from a manifest-declared local source bundle: the pinned `@adobe/spectrum-design-data@0.7.0` snapshot scoped to `button` and `in-line-alert`. The former agent-orchestration draft has moved to `plans/p3/` and should run only after P2 ingestion evidence passes.

The declared-source conformance proof consumes accepted P2 evidence and catalog output, then checks one manifest-declared local source bundle for source refs, source hashes, authority conflicts, review-required routing, forbidden live/production claims, report rows, and final evidence. It is proof-only and emits report/evidence artifacts, not a generated demo or live integration.

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

P2: Real design-system ingestion proof. Prove that Surfaces can extract a governed catalog from at least one bounded, real design-system source. The proof should keep the existing contract discipline: declared inputs, normalized extraction, source refs, provenance, diagnostics, fixture coverage, pass/fail gates, and final evidence.

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

## Real Design-System Extraction
P0 remains a synthetic fixture proof, and P1 remains a derived runtime projection proof. P2 is the first bounded real-source ingestion proof: it reads only the manifest-declared local `@adobe/spectrum-design-data@0.7.0` source snapshot, companion local mappings, and local usage policy under `sources/p2/design-system-source`, scoped to `button` and `in-line-alert`. It does not call Figma, scrape Storybook, parse Code Connect, crawl docs, inspect production HTML, or claim full Spectrum support.

Surfaces can claim a real design-system ingestion capability only for source families and targets that prove all of the following:

- the input source is an authoritative design-system source, not a hand-authored fixture shaped for the proof;
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
- Broader Spectrum coverage remains open. The implemented P2 target is Adobe Spectrum Design Data, pinned to `@adobe/spectrum-design-data@0.7.0`, initially scoped to `button` and `in-line-alert`; this is not a claim of full Spectrum support, live ingestion, or Adobe endorsement.
- Broader declared-source conformance remains open beyond the implemented local source-conformance bundle. Additional declared source families, component coverage, multi-source authority policy, or production-facing conformance targets require their own proof shape and passing evidence.
- Broader designer workflow trace coverage remains open beyond the first Button trace over accepted P2, source-conformance, P3, P4, protocol, and native evidence. Additional scenarios, targets, components, or partner-facing workflows require their own trace fixture coverage, diagnostics, report/evidence paths, and passing evidence.
- Broader JudgmentKit execution or live integration beyond the implemented P4 deterministic `judgmentkit-evaluation-report.v0` remains open.
- Broader SurfaceOps operational storage, workflow, or live product behavior beyond the implemented P4 deterministic `surfaceops-decision-ledger.v0` and the bounded local `surfaceops-kanban-live` adapter proof remains open.
- The exact packaging relationship between SurfaceOps, `surfaceops.ai`, and `kanban.cards` remains open. The default architecture is `kanban.cards` as a standalone upstream collaboration-board substrate, SurfaceOps as the standalone app and review product, and a SurfaceOps-owned adapter layer between them. White-labeling remains possible only if standalone `kanban.cards` is intentionally deprioritized. The live claim currently stops at the local-loopback `surfaceops-kanban-live` proof; production sync, production auth, hosted persistence, and production adapter behavior remain unclaimed until later proof.
- Long-term JudgmentKit finding storage remains open: findings may stay in evidence, appear in SurfaceOps, or live in a separate evaluation store only after the relevant proof defines ownership and authority.
- A2UI target shape remains open: a future proof may define export, conformance, or both, but A2UI is not the Surfaces data model.
- Broader P5 support beyond the implemented `surfaces-protocol-static` and `surfaces-native-static` proofs remains open. The current P5 slices prove inert protocol envelopes and inert native packets only; A2UI, production adapters, public APIs, SDKs, live protocol services, live native runtimes, production SurfaceOps, and live JudgmentKit remain future target-specific proof work.
