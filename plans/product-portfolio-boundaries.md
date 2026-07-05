# Product Portfolio Boundaries

## Status
This is a subordinate mechanical map for the product and surface names around Surfaces Platform. [VISION.md](../VISION.md) remains canonical for product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules.

This file is not proof authority. It summarizes what each named surface may own, consume, and emit under current evidence, and what must be proved before broader claims are made.

## Canonical Names And Packaging Defaults
- Surfaces Platform is the contract system. The repository name may be `SurfacesPlatformV2`, but prose should use "Surfaces Platform" unless referring to the repo.
- `surfaces.systems` and `surfaces.dev` are domain-style product and documentation surfaces. They explain and guide; they do not prove behavior.
- SurfaceOps is the standalone review-product direction. `surfaceops.ai` may become product packaging for that direction, but current proof is limited to deterministic P4 artifacts.
- `kanban.cards` should remain a standalone upstream collaboration-board substrate by default. SurfaceOps-specific governance, evidence refs, review queues, promotion semantics, and decision ownership should stay in SurfaceOps and flow to `kanban.cards` only through a SurfaceOps-owned adjacent adapter/projection layer. White-labeling `kanban.cards` as SurfaceOps remains a fallback only if standalone `kanban.cards` is intentionally deprioritized.
- JudgmentKit is the evaluator direction. JudgmentKit MCP or connector invocation is a possible future live integration path, not something invoked by the current P4 proof.
- A2UI is a possible downstream projection, export, or conformance target for a future A2UI-specific P5 proof. The implemented `surfaces-protocol-static` and `surfaces-native-static` P5 slices do not implement A2UI.
- [Curated design-partner testing](design-partner-testing.md) material is a subordinate research and planning surface only. It can organize partner-facing tasks and qualitative feedback around evidence-backed demos, but it does not prove behavior or replace phase evidence.

## Boundary Map

### Surfaces Platform
- Owns: the mission to compile design-system source material into governed UI contracts, plus the roadmap sequence described in `VISION.md`.
- Consumes: design-system source material, schemas, fixtures, phase subplans, proof commands, generated artifacts, diagnostics, demos, and evidence.
- Emits: governed proof slices, phase reports, generated demos, evidence, and product/documentation context.
- Current proof status: P0, P1, P2, P3, P4, and the implemented P5 `surfaces-protocol-static` and `surfaces-native-static` slices are deterministic proof contracts only when their evidence passes.
- Must not do: present the repo as a conventional live product, production service, broad adapter platform, or authority beyond the catalog and evidence chain.
- Future proof required before claim: each new capability needs its own schema, fixture, command contract, diagnostics, report or artifact path, evidence path, demo or docs boundary, and passing gate.

### Surfaces Catalog
- Owns: governed contract authority for what agents may emit and what consumers may render, reject, or route to review.
- Consumes: extracted design-system material, source refs, provenance, mappings, governance rules, diagnostics, and accepted evidence.
- Emits: `catalog.json`, `governed-catalog.json`, governed refs, promotion status, and review-required semantics for downstream consumers.
- Current proof status: P0 proves a synthetic catalog contract; P2 proves bounded local Spectrum ingestion for `button` and `in-line-alert`.
- Must not do: become a crawler, live source connector, runtime renderer, product docs surface, A2UI model, or protocol/API authority by itself.
- Future proof required before claim: any broader source family, component coverage, policy area, or compatibility claim needs source-specific contracts, fixtures, diagnostics, generated artifacts, and evidence.

### interfacectl
- Owns: deterministic compiler, validation, proof-command, stale-output, diagnostics, artifact, and evidence materialization behavior.
- Consumes: POSIX-relative inputs, schemas, fixtures, upstream evidence, governed catalogs, review artifacts, and phase-specific command arguments.
- Emits: phase artifacts under `artifacts/`, reports, diagnostics, and final evidence. Package scripts coordinate generated demos under `demo/` from passing evidence.
- Current proof status: implements the P0 catalog, P1 adapter, P2 ingestion, P3 agents, P4 review, P5 protocol, and P5 native proof commands documented in `PLAN.md`.
- Must not do: call live source APIs, execute work orders, invoke live SurfaceOps or JudgmentKit, expose production APIs, bypass stale-output checks, or infer unsupported behavior.
- Future proof required before claim: every new command or target needs an exact command contract, path rules, diagnostics, fixtures, generated artifact set, report, final evidence, tests, and CI gate.

### surfaces.systems
- Owns: product and category narrative for humans: problem framing, platform model, trust posture, proof status, and positioning.
- Consumes: published proof status, evidence summaries, roadmap context, and product boundaries from `VISION.md` and phase plans.
- Emits: human-facing product narrative and category explanation.
- Current proof status: context-only; it is not a proof artifact or implemented proof surface in this repo.
- Must not do: define catalog policy, choose source authority, replace evidence, imply live product behavior, or turn demos/docs into proof authority.
- Future proof required before claim: any generated or evidence-backed publication pipeline needs explicit source refs, artifact refs, drift/overclaim checks, and evidence-linked release criteria.

### surfaces.dev
- Owns: developer and agent instruction surface for commands, schemas, fixtures, examples, evidence, and safe usage guidance.
- Consumes: `VISION.md`, `PLAN.md`, phase subplans, schemas, fixtures, commands, artifacts, diagnostics, reports, demos, and evidence.
- Emits: developer documentation, agent guidance, and phase update obligations tracked in `plans/surfaces-dev.md`.
- Current proof status: documentation tracking exists; `surfaces.dev` itself is not proof authority and does not replace versioned artifacts.
- Must not do: become a second source of truth, redefine phase authority, skip proof evidence, or claim support for planned targets before evidence exists.
- Future proof required before claim: a docs site or package needs explicit versioned artifact links, overclaim guards, generated or reviewed examples, and update criteria tied to passing evidence.

### SurfaceOps
- Owns: operational review semantics for queues and human decisions after an explicit proof boundary exists; future `surfaceops.ai` product packaging may present those semantics. SurfaceOps also owns any adjacent adapter/projection layer that maps accepted evidence into board-ready records.
- Consumes: review-required rows, P3 review queue evidence, P4 decision fixtures, accepted evidence refs, and reviewer provenance.
- Emits: currently, deterministic `surfaceops-decision-ledger.json` rows inside the P4 proof; later, a live product may emit persistent decisions only after its own proof.
- Current proof status: P4 implements `surfaceops-decision-ledger.v0` as deterministic evidence, not a live console or durable review database. The separate `surfaceops-kanban-static` target implements an inert board projection over accepted P3/P4 evidence and a local substrate contract.
- Must not do: invent catalog policy, mutate upstream artifacts, execute work orders, persist live decisions, live-sync board state, or authorize protocol execution without a later proof.
- Future proof required before claim: live SurfaceOps needs schemas, fixtures, diagnostics, persistence rules, command/API boundaries, audit evidence, review workflows, and proof gates. Live board sync remains unclaimed until a later proof extends beyond the implemented static and inert `surfaceops-kanban-static` target.

### kanban.cards
- Owns: no current Surfaces Platform proof authority; the preferred architecture treats it as a standalone upstream collaboration-board substrate.
- Consumes: in the implemented `surfaceops-kanban-static` proof, only a manifest-declared local substrate contract is consumed as presentation shape. Live `kanban.cards` services consume nothing in the current proof contract.
- Emits: the implemented proof emits SurfaceOps-owned inert board projection and packet artifacts under `artifacts/surfaceops-kanban-static/`; live `kanban.cards` emits nothing in the current proof contract.
- Current proof status: standalone product or repo direction only, plus a local static substrate contract consumed by `surfaceops-kanban-static`. The preferred packaging keeps `kanban.cards` upstream of SurfaceOps-specific governance, with SurfaceOps owning the adjacent adapter/projection layer and white-labeling as a fallback if standalone `kanban.cards` is intentionally deprioritized.
- Must not do: masquerade as proof authority, execute work orders, route review, persist SurfaceOps decisions, create catalog policy, live-sync review state, or claim proof status from unrelated artifacts.
- Future proof required before claim: live `kanban.cards` integration still needs product boundaries, schemas, fixtures, diagnostics, command or API contract, artifact/report/evidence paths, SurfaceOps-owned projection rules, persistence semantics, live-sync non-goals, and explicit non-goals beyond the implemented static and inert `surfaceops-kanban-static` proof.

### JudgmentKit And JudgmentKit MCP
- Owns: no live execution ownership in the current repo; the current proof owns only a JudgmentKit-shaped evaluation artifact. JudgmentKit is the evaluator direction, while JudgmentKit MCP is a possible future invocation transport.
- Consumes: existing evidence and evidence refs when a proof or explicit user request authorizes evaluation.
- Emits: currently, deterministic `judgmentkit-evaluation-report.json` inside the P4 proof; future live MCP output requires separate authorization and proof.
- Current proof status: P4 implements `judgmentkit-evaluation-report.v0` without live JudgmentKit MCP or connector invocation.
- Must not do: compile, mutate, render, route, approve, reject, request changes, defer, promote, execute, call live tools, or override catalog or SurfaceOps authority.
- Future proof required before claim: live JudgmentKit integration needs invocation boundaries, input schemas, fixture coverage, diagnostics, report/evidence shape, authorization rules, and passing proof gates.

### A2UI
- Owns: no current Surfaces data-model authority; it is a possible downstream compatibility, export, or conformance target.
- Consumes: a future governed catalog projection and conformance fixtures only after an A2UI-specific P5 target exists.
- Emits: no current artifacts; future output could be A2UI projection/export/conformance artifacts under a separate P5 proof.
- Current proof status: planned only; P0/P1 do not implement it, and the implemented P5 `surfaces-protocol-static` and `surfaces-native-static` proofs do not implement A2UI export or conformance.
- Must not do: become the Surfaces Catalog, redefine Surface IR, claim compatibility from static protocol envelopes or native packets, or add behavior absent from governed catalog evidence.
- Future proof required before claim: target-specific A2UI schemas, projection/export rules, conformance fixtures, diagnostics, command contract, report, evidence, demo, CI gate, and non-goals.

### Curated Design-Partner Testing Program
- Owns: non-proof research planning for design-partner tests, partner task scripts, qualitative observation capture, and synthesis prompts.
- Consumes: current proof snapshot, phase evidence paths, product boundaries, and generated demos only as presentation aids backed by passing evidence.
- Emits: research notes, task plans, observation summaries, scorecards, synthesis outputs, and candidate documentation or proof follow-ups.
- Current proof status: none; [Curated Design-Partner Testing Program](design-partner-testing.md) and templates under `plans/design-partner-testing/` are not phase proofs, commands, schemas, fixtures, artifacts, evidence files, or generated demos.
- Must not do: become proof authority, replace evidence, promote surfaces, claim implementation support, treat qualitative feedback as validation, or turn demos into authority.
- Future proof required before claim: any productized research workflow, partner-feedback artifact, or evaluator/review integration needs its own bounded contracts, artifact/report/evidence ownership, authority rules, and passing gate.

### P5 Protocol And Native Targets
- Owns: protocol-boundary and native static proof targets after accepted upstream evidence exists.
- Consumes: accepted P2 catalog/evidence, accepted P4 review/judgment evidence, decision ledger, review/judgment report, target-selection fixtures, target fixtures, and target-owned P5 schemas. Native also consumes protocol evidence as compatibility preflight only.
- Emits: for `surfaces-protocol-static`, `adapter-target-selection.json`, `protocol-projection.json`, inert protocol envelopes, `protocol-adapter-report.json`, final evidence, and generated demo output; for `surfaces-native-static`, native target selection, `surfaces-native-projection.json`, inert native packets, `surfaces-native-report.json`, final evidence, and generated demo output.
- Current proof status: `surfaces-protocol-static` is implemented as a deterministic inert protocol-envelope proof, and `surfaces-native-static` is implemented as a deterministic inert native-packet proof, only when their evidence passes.
- Must not do: claim production adapter, public API, SDK, native SDK, live protocol service, live native runtime, transport, A2UI, live SurfaceOps, live JudgmentKit, action execution, or future P5 target support.
- Future proof required before claim: each additional P5 target needs its own product boundaries, schemas, fixtures, diagnostics, command contract, generated artifacts, target report, evidence, demo, CI gate, non-goals, and acceptance criteria.
