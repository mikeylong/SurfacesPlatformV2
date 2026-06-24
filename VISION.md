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

## User Value
Surfaces Platform creates value when it lets teams:

- connect an existing design system to controlled AI interface generation;
- prevent agents from inventing unsupported UI, props, variants, tokens, slots, actions, or accessibility semantics;
- make generated surfaces reviewable through evidence instead of subjective inspection alone;
- promote safe surfaces, reject invalid surfaces, and route sensitive surfaces to human review;
- generate adapter-visible render plans without turning demos or runtime projections into hidden sources of truth.

## Current State
P0 proves the catalog contract with a synthetic golden fixture. It materializes `extract.json`, `catalog.json`, `governed-catalog.json`, adapter diagnostics, and evidence from `fixtures/p0/source.fixture.json`.

P1 proves the first runtime-facing surface. It derives a `web-static` runtime projection and deterministic render plans from the governed catalog, then writes adapter report and evidence artifacts.

The current `plans/p2/` contract defines the real design-system ingestion proof. The former agent-orchestration draft has moved to `plans/p3/` and should run only after P2 ingestion evidence passes.

## Roadmap
This roadmap is the accepted product sequence for the current plan.

P0: Contract proof. Prove that design-system-shaped source material can compile into a governed Surfaces Catalog with diagnostics, review gates, and evidence. Current implementation uses a synthetic fixture, not a real product design system.

P1: Runtime surface proof. Prove that the governed catalog can produce an adapter-facing runtime projection, deterministic render plans, generated demo output, report rows, and evidence without becoming a general renderer.

P2: Real design-system ingestion proof. Prove that Surfaces can extract a governed catalog from at least one bounded, real design-system source. The proof should keep the existing contract discipline: declared inputs, normalized extraction, source refs, provenance, diagnostics, fixture coverage, pass/fail gates, and final evidence.

P3: Agent recruitment and orchestration proof. Use `plans/p3/` as the agent-control draft for the later phase. Agents should be recruited through registered capabilities, bounded inputs, bounded outputs, scoped work orders, explicit dependencies, review routing, reports, and evidence. This proof should remain inert before any live agent execution is allowed.

P4: Review and judgment proof. Let SurfaceOps and JudgmentKit consume evidence. SurfaceOps should handle review queues and human decisions. JudgmentKit should evaluate activity fit, contract quality, evidence quality, and handoff quality. Neither should override the Surfaces Catalog.

P5: Production adapters and protocol boundaries. Add additional runtime projections, A2UI exports or conformance proofs, production APIs, and broader adapter support only after each target has its own schema, fixtures, diagnostics, command contract, and evidence.

## Real Design-System Extraction
The platform has not yet extracted an actual design system. The current extractor reads `fixtures/p0/source.fixture.json` only. It does not call Figma, scrape Storybook, parse Code Connect, crawl docs, or inspect production HTML.

Surfaces can claim real design-system extraction only when a phase proves all of the following:

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

P2 should pick one bounded source strategy and prove it end to end before expanding to multiple source families.

## Surface Roles
Surfaces Catalog is the governed contract artifact. It is the authority for what agents may emit and what runtime projections, proof consumers, future adapters, and review tools may render, reject, or send to review. Evaluators consume catalog-backed evidence to assess activity fit, contract quality, evidence quality, and handoff quality; they do not render surfaces, route review, promote work, or become enforcement authority.

`interfacectl` is the compiler, validation, and enforcement surface. It materializes proof artifacts, validates contracts, blocks stale or invalid output, writes diagnostics, and finalizes evidence. It should stay deterministic and evidence-first.

`surfaces.systems` is the product and category surface. It should explain the problem, the platform model, trust posture, proof status, and product narrative for humans. It is context and positioning, not proof authority.

`surfaces.dev` is the developer and agent instruction surface. It should explain how to use the contracts, commands, schemas, examples, and evidence. It can guide agents and developers, but it should point back to versioned proof artifacts instead of becoming a second source of truth. Required phase updates are tracked in [Surfaces.dev Documentation Tracking](plans/surfaces-dev.md).

JudgmentKit is the evaluation layer. It may emit evaluation findings over existing proof artifacts after they exist. It should not compile, mutate, render, route, promote, reject, or override the Surfaces Catalog.

SurfaceOps is the operational review surface. It should consume review-required evidence, show queues and decisions, and help humans promote, reject, or request changes. It should not invent policy outside the governed catalog.

A2UI is a downstream compatibility or projection target for P5. It should not become the Surfaces data model unless P5 proves an A2UI projection with its own schema, fixtures, diagnostics, conformance proof, and evidence.

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
- If a new capability lacks a schema, fixture, proof command, diagnostics, report or evidence path, it is not implemented yet.
- Keep live execution, network calls, tool calls, secret access, autonomous edits, and persistent review decisions out of a phase until that phase has a deterministic proof contract.

## Phase Selection Rules
When choosing the next phase, prefer work that strengthens catalog authority or evidence quality before adding consumers.

If a phase adds a consumer before real source ingestion, name the limitation clearly. A consumer can prove enforcement mechanics, but it does not prove the platform can understand a real design system.

If source material is ambiguous, the correct output is a diagnostic, review requirement, or explicit mapping requirement. Do not fill gaps with agent inference and call the result governed.

If a product surface consumes evidence, it may explain, evaluate, route, or display the result. It may not override the catalog, rewrite policy, or promote work without an explicit review contract.

## Open Decisions
- Which real design-system source should be first: Figma, Storybook/code docs, Figma Code Connect, structured docs, or a deliberately small combination?
- Which design system should be the first ingestion target?
- What is the first JudgmentKit evaluation contract over Surfaces evidence?
- What minimum SurfaceOps decision model is needed before review-required artifacts can be promoted or rejected?
