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

## Product Portfolio Boundaries
Surfaces Platform is the contract system. The surrounding product portfolio may include human-facing sites, developer docs, review tools, evaluators, workflow products, and downstream adapter targets, but none of those products gain authority by being adjacent to Surfaces.

- `interfacectl`, the Surfaces Catalog, proof reports, and evidence define implemented Surfaces behavior.
- `surfaces.systems` and `surfaces.dev` explain, teach, and guide. They do not prove behavior or replace evidence.
- SurfaceOps is the review-product direction, including any future `surfaceops.ai` product packaging. The implemented P4 boundary is deterministic decision artifacts only; live review storage, workflow, or product behavior needs a later proof.
- JudgmentKit is the evaluation direction. The implemented P4 boundary is deterministic JudgmentKit-shaped findings only; live invocation needs a later proof and explicit authorization.
- `kanban.cards` is the candidate upstream reusable board and human/agent collaboration core for SurfaceOps workflows. The default direction is to keep `kanban.cards` standalone, then layer SurfaceOps-specific governance, evidence, review queues, and promotion semantics on top. White-labeling `kanban.cards` as SurfaceOps is a packaging option only if the standalone product is intentionally deprioritized.
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

## Current State
P0 proves the catalog contract with a synthetic golden fixture. It materializes `extract.json`, `catalog.json`, `governed-catalog.json`, adapter diagnostics, and evidence from `fixtures/p0/source.fixture.json`.

P1 proves the first runtime-facing surface. It derives a `web-static` runtime projection and deterministic render plans from the governed catalog, then writes adapter report and evidence artifacts.

P2 implements the first bounded real design-system ingestion proof from a manifest-declared local source bundle: the pinned `@adobe/spectrum-design-data@0.7.0` snapshot scoped to `button` and `in-line-alert`. The former agent-orchestration draft has moved to `plans/p3/` and should run only after P2 ingestion evidence passes.

P3 implements the first inert agent recruitment and orchestration proof after P2 evidence passes. It materializes a capability registry, deterministic task DAG, scoped non-executable work orders, review queue, report, demo, and evidence without live agents, tool calls, connector calls, file edits, network calls, secrets, callbacks, SurfaceOps persistence, or JudgmentKit execution.

P4 implements the first deterministic review and judgment proof over accepted P3 evidence and the P3 review queue. It materializes a SurfaceOps decision ledger, JudgmentKit-shaped evaluation report, review/judgment report, demo, and evidence without live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, production adapters, P5/A2UI scope, or authority override.

P5 implements the first bounded protocol-boundary slice: `surfaces-protocol-static`. It materializes a deterministic target-selection artifact, protocol projection, inert protocol envelopes, protocol adapter report, demo, CI gate, and evidence from accepted P2 catalog/evidence and accepted P4 review/judgment evidence. This P5 slice is proof-only: it is not A2UI, a production adapter, public API, SDK, live protocol service, live SurfaceOps integration, or live JudgmentKit integration.

## Roadmap
This roadmap is the accepted product sequence for the current plan.

P0: Contract proof. Prove that design-system-shaped source material can compile into a governed Surfaces Catalog with diagnostics, review gates, and evidence. Current implementation uses a synthetic fixture, not a real product design system.

P1: Runtime surface proof. Prove that the governed catalog can produce an adapter-facing runtime projection, deterministic render plans, generated demo output, report rows, and evidence without becoming a general renderer.

P2: Real design-system ingestion proof. Prove that Surfaces can extract a governed catalog from at least one bounded, real design-system source. The proof should keep the existing contract discipline: declared inputs, normalized extraction, source refs, provenance, diagnostics, fixture coverage, pass/fail gates, and final evidence.

P3: Agent recruitment and orchestration proof. Prove agent control through registered capabilities, bounded inputs, bounded outputs, scoped work orders, explicit dependencies, review routing, reports, and evidence. This proof remains inert before any live agent execution is allowed.

P4: Review and judgment proof. Let SurfaceOps and JudgmentKit consume evidence. SurfaceOps should handle review queues and human decisions. JudgmentKit should evaluate activity fit, contract quality, evidence quality, and handoff quality. Neither should override the Surfaces Catalog.

P5: Protocol boundaries and target-specific adapter proofs. The first implemented slice is `surfaces-protocol-static`, a deterministic inert protocol-envelope proof. Add additional runtime projections, A2UI exports or conformance proofs, production APIs, SDKs, live runtimes, and broader adapter support only after each target has its own schema, fixtures, diagnostics, command contract, and evidence.

## Roadmap Horizon
The current P0-P5 sequence is the implemented proof-contract roadmap, not the full company roadmap. The horizon after P5 is target-specific expansion, not a blanket platform claim or a set of runnable P6/P7 phases before proof shapes exist.

- Source coverage can broaden only through declared source families that preserve refs, provenance, diagnostics, and evidence.
- SurfaceOps can move from deterministic decision artifacts toward live operational review only after a proof defines storage, workflow, permissions, and authority boundaries.
- `kanban.cards` can become the reusable collaboration core only after a proof defines how cards reference Surfaces evidence and SurfaceOps decisions. It should organize work around those decisions, not replace them.
- A2UI, production adapters, public APIs, SDKs, live runtimes, live SurfaceOps, and live JudgmentKit remain future work until target-specific evidence passes.
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

`kanban.cards` is the candidate upstream board and collaboration surface for human/agent SurfaceOps workflows. It may later organize Surfaces-backed work items, review status, and SurfaceOps decision references, but it does not own Surfaces review semantics. It must not create catalog authority, promote or reject surfaces, execute work, or persist SurfaceOps decisions unless a later proof defines that bounded consumer relationship.

A2UI is a downstream compatibility or projection target for a future P5 target. It is not implemented by the first `surfaces-protocol-static` slice and should not become the Surfaces data model unless a separate P5 target proves an A2UI projection with its own schema, fixtures, diagnostics, conformance proof, and evidence.

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
- Broader JudgmentKit execution or live integration beyond the implemented P4 deterministic `judgmentkit-evaluation-report.v0` remains open.
- Broader SurfaceOps operational storage, workflow, or live product behavior beyond the implemented P4 deterministic `surfaceops-decision-ledger.v0` remains open.
- The exact packaging relationship between SurfaceOps, `surfaceops.ai`, and `kanban.cards` remains open. The default architecture is `kanban.cards` as reusable collaboration core with SurfaceOps-specific governance layered on top, but white-labeling remains possible if standalone `kanban.cards` is deprioritized.
- Long-term JudgmentKit finding storage remains open: findings may stay in evidence, appear in SurfaceOps, or live in a separate evaluation store only after the relevant proof defines ownership and authority.
- A2UI target shape remains open: a future proof may define export, conformance, or both, but A2UI is not the Surfaces data model.
- Broader P5 support beyond the implemented `surfaces-protocol-static` proof remains open. The first P5 slice proves inert protocol envelopes only; A2UI, production adapters, public APIs, SDKs, live protocol services, live SurfaceOps, and live JudgmentKit remain future target-specific proof work.
