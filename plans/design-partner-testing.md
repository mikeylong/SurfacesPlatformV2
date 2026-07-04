# Curated Design-Partner Testing Program

## Status
This is a subordinate, docs-only testing program plan. It does not create proof authority, proof commands, schemas, fixtures, diagnostics, generated artifacts, demos, CI gates, product claims, live integrations, or partner-data storage.

Authority remains:

- product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules: [VISION.md](../VISION.md);
- mechanical proof contracts: [PLAN.md](../PLAN.md) and phase subplans under [plans/](README.md);
- implemented behavior: passing `artifacts/**/evidence.json` for the specific proof slice;
- presentation output: `demo/**`, only when backed by passing evidence.

The program uses curated partner sessions to test whether the current evidence loop is understandable, useful, and governed. Partner feedback may identify docs gaps, product risks, or future proof work. Partner feedback is not proof by itself.

## Program Goal
Run a small, evidence-backed design-partner testing program with 6-8 curated design partners in two waves. The program should test whether design-system teams can understand the Surfaces Platform governance loop across generation, CI, review, runtime projection, protocol boundary, and native static-packet consumption.

The practical questions are:

- Can a partner trace the authority chain from design-system source material to governed catalog, evidence, review, and downstream consumption?
- Can a partner tell what is implemented, what is proof-only, what is presentation output, and what remains planned?
- Can a partner understand why unsupported, ambiguous, review-required, or target-out-of-scope behavior becomes a diagnostic, review row, or non-emitted artifact?
- Can a partner explain where their own design-system workflow would need source refs, governance policy, CI evidence, review decisions, or runtime target proofs before adoption?

The program should test the product designer workflow in
[VISION.md](../VISION.md#product-designer-workflow), not a generic tour of
proof phases. Every Wave 1 session should make the partner walk the repo-owned
Button trace through the designer actions: declare authority, compile governed
contracts, generate inside the catalog boundary, inspect evidence, decide or
revise at the authority layer, hand off proven target output, and govern changes
over time.

## Partner Shape
The program should recruit 6-8 partners total. Do not expand the cohort until
the first two-wave readout has been reviewed.

Wave 1 should include 3-4 highly curated partners who can give concrete
feedback on design-system governance, CI evidence, and review workflows. Good
candidates are teams with an active component library, documented usage policy,
design-system ownership, and some release or quality gate.

Wave 2 should include 3-4 additional partners selected after Wave 1 synthesis.
Wave 2 should test whether the same evidence model holds for teams with
adjacent but not identical workflows, such as stronger engineering CI ownership,
stronger design governance ownership, or clearer downstream runtime needs.

Selection criteria:

- The partner can evaluate design-system source authority, component coverage, usage policy, governance, or CI review in a real operating context.
- The partner can discuss their workflow without placing raw proprietary design-system material, source files, screenshots, recordings, credentials, or customer data in this repo.
- The partner can react to the current Surfaces evidence loop using repo-owned examples and generated demos rather than requiring a live integration with their system.
- The partner understands that this is not a production adapter trial, public API beta, live SurfaceOps pilot, live JudgmentKit invocation, or A2UI conformance test.

Defer partners who require raw proprietary data in the repo, live source ingestion, live agent execution, production adapter behavior, live review persistence, legal procurement, or public case-study approval before a useful session can happen.

## Wave Plan
Wave 1 goal: find the sharpest comprehension and governance issues before broadening the cohort.

Wave 1 should test:

- whether the authority model is clear from the first explanation;
- whether the current P0-P5 evidence chain is enough for a partner to understand the platform's proof posture;
- whether partners understand that demos present evidence but do not prove behavior;
- whether review-required and blocked outcomes read as governed safety, not product failure;
- whether `surfaces-protocol-static` and `surfaces-native-static` are understood as proof-only static targets, not production adapters.

Wave 1 output should be an internal synthesis of anonymized observations and a decision on what to adjust before Wave 2. Do not store raw notes, partner-owned examples, recordings, or partner-specific source material in this repo.

Synthetic Wave 1 has been captured in [Synthetic Wave 1 Readout](design-partner-testing/synthetic-wave-1.md). It is a dry-run planning artifact only, not partner evidence or proof authority.

A post-merge synthetic designer-workflow trace dry run is captured in
[Synthetic Designer Workflow Trace Readout](design-partner-testing/synthetic-designer-workflow-trace.md).
It reuses the synthetic partner archetypes against the merged Button trace and
is a dry-run planning artifact only, not partner evidence, proof authority,
customer validation, implementation-pilot readiness, production adoption, or a
product workflow claim.

Wave 2 goal: validate whether Wave 1 findings repeat with adjacent design-system teams and whether the session flow supports a broader product conversation.

Wave 2 should test:

- whether the revised explanation helps partners classify implemented versus planned scope;
- whether evidence paths, diagnostics, reports, and promotion status are enough to support trust discussions;
- whether partners can name which future proof target would be required for their own runtime, adapter, workflow, or A2UI needs;
- whether the governance loop gives enough signal for a team to decide what would block adoption.

Synthetic Wave 2 planning is captured in [Synthetic Wave 2 Plan](design-partner-testing/synthetic-wave-2-plan.md).
It may reuse and harden the Wave 1 synthetic partner archetypes for dry-run
stress testing of ingestion scale, accessibility and behavior policy, brand
governance, CI conformance, exception ownership, and production-adapter path
without changing current proof scope. Real Wave 2 recruiting remains governed
by the program rule above: select 3-4 additional partners only after Wave 1
synthesis.

Synthetic Wave 2 results are captured in [Synthetic Wave 2 Readout](design-partner-testing/synthetic-wave-2-results.md).
The readout is a dry-run planning artifact only. It supports proof-candidate
discovery conversations, not implementation-ready pilot claims, production
adapter claims, live workflow claims, or proof authority.

The Wave 2 follow-up proof-candidate memo is [Declared-Source Conformance And Review Proof Candidate](design-partner-testing/declared-source-conformance-review-proof.md).
It is planning-only and requires a later phase-placement decision before any
schema, fixture, command, artifact, evidence, demo, CI, or implementation claim
exists.

The first richer scenario pack for that candidate is
[Richer Source Conformance Scenario Pack](design-partner-testing/richer-source-conformance-scenario-pack.md).
It converts the synthetic archetype signals into planning-only source, fixture,
diagnostic, ownership-routing, and proof-only P5 wording requirements. It does
not create source files, fixtures, diagnostics, commands, artifacts, evidence,
or CI behavior.

The governed-exception implementation retest is captured in
[Synthetic Governed Exception Retest](design-partner-testing/synthetic-governed-exception-retest.md).
It records the synthetic archetype check after the trace began indexing
expired review metadata and its exception lifecycle. It is planning-only; the
proof authority remains the source-conformance and designer-workflow-trace
evidence files.

The guided product-designer MVP readiness synthesis is captured in
[Synthetic Guided MVP Readiness Readout](design-partner-testing/synthetic-guided-mvp-readiness.md).
It records the synthetic archetype decision that the current evidence-backed
Button workflow is ready only for a revised, moderated designer walkthrough,
not self-serve use, implementation-pilot readiness, production adoption, or
customer validation.

The first synthetic moderated group walkthrough is captured in
[Synthetic Moderated Product-Designer Walkthrough](design-partner-testing/synthetic-moderated-product-designer-walkthrough.md).
It uses a Nielsen Norman Group-style moderator persona and one representative
from each company archetype. The session remained synthetic and non-proof, and
its scorecard requires revisions before product-designer use.

The revised Button retest stimulus is captured in
[Button Workflow Workbench](design-partner-testing/button-workflow-workbench.md).
It is a derived, docs-only inspection surface for translating repo-owned Button
evidence into product-designer workflow language. It is not proof authority,
product behavior, live workflow, customer validation, or production support.

## Evidence-Backed Governance Loop
Each session should use the same loop:

1. Start from the current authority model in `VISION.md`.
2. Show the relevant proof path from `PLAN.md`, phase subplans, and current evidence files.
3. Walk the partner through a repo-owned example that moves through generation, CI, review, and runtime/protocol/native consumption.
4. Ask the partner to identify where their own workflow would need a source ref, policy rule, diagnostic, review decision, or downstream target proof.
5. Capture observations as anonymized findings tied to evidence paths or to an explicit "no proof exists yet" gap.
6. Triage each finding as a docs clarification, demo/inspection issue, proof-contract gap, product risk, or future target request.
7. Only convert a finding into an implementation claim after a later change adds the full proof shape required by AGENTS.md: schema, fixture, proof command, diagnostics, report or artifact path, evidence path, and passing evidence.

The governance loop should preserve these rules:

- Partner reactions can inform priorities, but they cannot override the Surfaces Catalog, phase contracts, diagnostics, promotion status, or evidence.
- Partner examples may be paraphrased only after removing proprietary terms, component names, screenshots, data, customer details, and implementation specifics.
- If a partner asks for behavior outside current proof scope, record it as planned or future target work until a target-specific proof exists.
- If a partner finds a mismatch between demo presentation and evidence, evidence wins and the demo or docs should be treated as the likely follow-up.

## Required Stimulus Pack
Use the same repo-owned stimulus pack in every session so Wave 1 and Wave 2
results are comparable. Facilitators may add clarifying context, but they
should not replace these materials with partner-owned examples.

Required orientation refs:

- `VISION.md`
- `PLAN.md`
- `plans/usability-value-evidence.md`
- `plans/product-portfolio-boundaries.md`
- `plans/design-partner-testing/declared-source-conformance-review-proof.md`

Required evidence refs:

- `artifacts/p0/evidence.json`
- `artifacts/p1/evidence.json`
- `artifacts/p2/evidence.json`
- `artifacts/source-conformance/evidence.json`
- `artifacts/source-conformance/source-authority-map.json`
- `artifacts/source-conformance/source-conformance-report.json`
- `artifacts/source-conformance/source-review-queue.json`
- `artifacts/p3/evidence.json`
- `artifacts/p4/evidence.json`
- `artifacts/p5/protocol/evidence.json`
- `artifacts/p5/native/evidence.json`
- `artifacts/designer-workflow-trace/evidence.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/trace-selection.json`

Required presentation refs:

- `demo/p0/index.html`
- `demo/p1/index.html`
- `demo/p2/index.html`
- `demo/p3/index.html`
- `demo/p4/index.html`
- `demo/p5/protocol/index.html`
- `demo/p5/native/index.html`

Required product-designer workflow spine:

| VISION workflow step | Wave 1 task | Repo-owned refs |
| --- | --- | --- |
| Declare design authority | Identify the source material and policy refs that govern the Button scenario. | `sources/p2/design-system-source/manifest.json`; `artifacts/p2/source-inventory.json`; `artifacts/p2/source-mapping.json`; `artifacts/source-conformance/source-authority-map.json` |
| Compile governed contracts | Confirm which proof command and evidence file turn source material into governed catalog output. | `artifacts/p2/evidence.json`; `artifacts/p2/governed-catalog.json`; `artifacts/p2/ingestion-report.json` |
| Generate inside the catalog boundary | Explain why allowed, invalid, and review-required cases do not rely on agent inference. | `fixtures/p2/valid`; `fixtures/p2/invalid`; `fixtures/p2/review`; `artifacts/p2/ingestion-report.json` |
| Inspect evidence, not only pixels | Name evidence, diagnostics, promotion status, reports, and demos for the scenario. | `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`; `artifacts/designer-workflow-trace/evidence.json`; matching `demo/**` paths as presentation only |
| Decide or revise at the authority layer | Classify whether an issue should update source material, mappings, policy, review ownership, or future proof scope. | `artifacts/source-conformance/source-review-queue.json`; `artifacts/p3/review-queue.json`; `artifacts/p4/surfaceops-decision-ledger.json`; `artifacts/p4/review-judgment-report.json` |
| Hand off only proven target output | Identify which protocol or native static output is authorized, and which review-required cases intentionally emit no target artifact. | `artifacts/p5/protocol/protocol-envelope.button.json`; `artifacts/p5/native/surfaces-native-packet.button.json`; P5 evidence files |
| Govern changes over time | State what must be regenerated or re-proved when source authority, policy, review decisions, or target requirements change. | relevant `npm run check:*:ci` gate names; current `artifacts/**/evidence.json` paths |

Required partner tasks:

- Trace one repo-owned surface from P2 governed catalog evidence through P3 review queue output, P4 review and judgment evidence, and P5 protocol or native static output.
- Identify one diagnostic or review-required case and explain why it should not become unattended generated UI.
- Explain the difference between evidence `status`, `promotionStatus`, generated demos, and future target requests.
- Name one partner-workflow requirement that current evidence supports and one requirement that would need a future proof shape.
- For declared-source proof-candidate discovery, identify one source,
  conformance, or review requirement that belongs to current evidence and one
  that remains planned candidate work.

## Wave 1 Feedback MVP Package
Wave 1 is the first customer-feedback package. It is ready only as a moderated,
evidence-backed research session, not as a self-serve product, production beta,
live integration, implementation-oriented pilot, or public proof claim.

Before inviting a Wave 1 partner, the facilitator should confirm:

- the repo has passing tracked evidence for the specific P0-P5 slices being
  discussed;
- the session uses only the required stimulus pack, repo-owned evidence paths,
  and generated demos as presentation aids;
- [Session Guide](design-partner-testing/session-guide.md), [Results Capture](design-partner-testing/results-capture.md),
  [Scorecard](design-partner-testing/scorecard.md), and [Synthesis Template](design-partner-testing/synthesis-template.md)
  are prepared outside the repo for completed partner-specific records;
- partner identifiers, raw notes, recordings, screenshots, transcripts, source
  files, proprietary examples, customer names, credentials, and private URLs
  will stay outside this repo;
- the opening script states that partner feedback can create docs follow-ups,
  product risks, or future proof candidates, but cannot change implemented
  proof status.

The minimum Wave 1 session output is:

- one completed external results capture per session;
- one completed external scorecard per session;
- a boundary review confirming no partner material entered the repo;
- a de-identified synthesis after the wave that classifies findings as docs
  clarification, demo or inspection issue, proof-contract gap, product risk,
  future target request, out of scope, or no action.

## Templates
- [Button Workflow Workbench](design-partner-testing/button-workflow-workbench.md)
- [Wave 1 Launch Checklist](design-partner-testing/wave-1-launch-checklist.md)
- [Session Guide](design-partner-testing/session-guide.md)
- [Results Capture](design-partner-testing/results-capture.md)
- [Scorecard](design-partner-testing/scorecard.md)
- [Synthesis Template](design-partner-testing/synthesis-template.md)

## Session Flow
Use the detailed facilitator runbook in [Session Guide](design-partner-testing/session-guide.md). The main session arc should stay consistent across both waves.

1. Orientation: explain Surfaces Platform as a proof-contract system, not a conventional app or live service.
2. Generation boundary: show how governed catalog authority, Surface IR fixtures, invalid fixtures, diagnostics, and review-required cases constrain what generated UI may emit.
3. CI evidence: show how proof commands, evidence files, drift checks, promotion status, and demos support reproducible claims. Do not run proof gates during partner sessions unless a separate verification task explicitly authorizes it.
4. Review governance: show how P3 review queue output and P4 SurfaceOps/JudgmentKit-shaped artifacts preserve evidence-backed decisions without live review persistence or live evaluator invocation.
5. Runtime/protocol/native consumption: show P1 runtime projection and render plans, P5 `surfaces-protocol-static` inert envelopes, and P5 `surfaces-native-static` inert packets as derived proof-only consumers.
6. Close: ask the partner what would make the evidence loop usable, what remains unclear, and what proof target would matter for their workflow.

## Success Criteria
The program is useful if it produces clear, anonymized evidence about partner comprehension and adoption blockers without changing proof authority.

Success means:

- 6-8 curated partners complete sessions across two waves.
- Every session follows the same evidence-first flow and avoids raw/proprietary partner data in the repo.
- At least 75% of completed partner sessions, rounded up, show `Strong` or `Mixed` evidence-loop comprehension in the scorecard: 5 of 6, 6 of 7, or 6 of 8.
- At least 75% of completed partner sessions, rounded up, can distinguish proof authority, generated demos, review decisions, and planned future targets by the end of the session: 5 of 6, 6 of 7, or 6 of 8.
- At least 60% of completed partner sessions, rounded up, can trace one repo-owned surface through generation, CI evidence, review governance, and runtime/protocol/native consumption: 4 of 6, 5 of 7, or 5 of 8.
- Fewer than 2 completed partner sessions end with unresolved High severity confusion about live SurfaceOps, live JudgmentKit, production API or SDK support, A2UI, or demo authority.
- Wave 1 produces concrete session-guide improvements before Wave 2 begins.
- Wave 2 confirms which findings are recurring and which are partner-specific.
- Findings are triaged into docs clarifications, demo/inspection issues, proof-contract gaps, product risks, or future target requests without claiming implementation from interviews alone.
- Any future implementation work that comes out of the program is scoped to a proof shape before being described as implemented.

Wave 1 decision rule:

- Proceed to Wave 2 if the Wave 1 threshold is met: all 3 of 3 sessions, or at least 3 of 4 sessions, complete the required stimulus pack and score `Strong` or `Mixed` on evidence-loop comprehension.
- Defer Wave 2 for docs/session-guide revisions if 2 or more Wave 1 sessions record High severity authority confusion, demo-as-proof confusion, or production-support confusion.
- Retest one revised Wave 1 session before Wave 2 if the facilitator skipped any required stimulus-pack task.

## Risks
| Priority | Risk | Mitigation |
| --- | --- | --- |
| High | Partner feedback is accidentally treated as proof authority. | Tie every finding to existing evidence or mark it as a future proof gap. Do not change implementation claims without proof shape and passing evidence. |
| High | Raw or proprietary partner material enters the repo. | Use repo-owned examples during sessions. Keep raw notes, recordings, screenshots, source material, names, and customer details outside this repo. Add only anonymized synthesis when explicitly allowed. |
| High | Partners misunderstand P5 protocol or native proof as production adapter support. | Repeat that `surfaces-protocol-static` and `surfaces-native-static` are inert proof-only targets, not APIs, SDKs, live services, native runtimes, or A2UI. |
| Medium | Sessions become demo-led and hide the evidence chain. | Start from authority and evidence, then use demos only as presentation views. If time is tight, skip the demo before skipping evidence. |
| Medium | Partner selection is too broad for actionable feedback. | Keep Wave 1 tightly curated around design-system governance, CI, and review ownership. Use Wave 1 findings to select Wave 2. |
| Medium | Findings mix current docs gaps with future product requests. | Triage each finding by type and require an explicit proof-shape note for future implementation requests. |
| Low | Sessions run long and reduce quality of synthesis. | Use the session-guide timeboxes and defer partner-specific product discussion to follow-up. |

## Non-Goals
- No new proof authority, command, schema, fixture, diagnostic, generated artifact, evidence path, demo, CI gate, or implemented phase claim.
- No edits to `schemas/`, `fixtures/`, `artifacts/`, `demo/`, `src/`, `scripts/`, or `test/` for this program documentation.
- Docs-only verification applies only to this design-partner testing package. If
  it is committed with schema, fixture, source, generated artifact, source code,
  or test changes, those changes still require their relevant proof gates.
- No raw partner source material, screenshots, recordings, transcripts, design files, component names, customer data, credentials, or proprietary workflow details in this repo.
- No self-serve product trial, unattended partner evaluation, or partner-run source validation.
- No live ingestion of partner design systems.
- No live agent execution, autonomous edits, connector calls, network calls, work-order execution, callbacks, or secret access.
- No live SurfaceOps persistence or live JudgmentKit invocation.
- No production adapter, public API, SDK, native SDK, live protocol service, live native runtime, A2UI export, or A2UI conformance claim.
- No public case study, sales claim, or partner endorsement unless a separate approved process creates one outside this proof-contract plan.

## Data Handling
Partner data handling is part of the program contract.

- Use repo-owned proof artifacts and generated demos as the session materials.
- Assign anonymized partner ids outside this repo, such as `wave-1-partner-a`, before sessions begin.
- Keep raw notes, recordings, screenshots, transcripts, partner names, company names, source material, and implementation details outside this repo in an approved private workspace.
- Keep completed session captures, scorecards, and syntheses outside this repo by default. This repo stores the blank templates and may receive only approved paraphrased, de-identified synthesis statements in docs or issues.
- If a repo issue, PR, or future doc needs a partner-derived finding, write a synthesized and de-identified statement that names the phase, evidence path, and observed comprehension or workflow gap. Do not include partner-owned examples.
- Delete accidental partner material from the working area before committing and treat the incident as a process failure, not a doc cleanup task.

## Follow-Up Decision Rules
Use partner findings to decide what to clarify or prove next.

- A docs clarification can proceed as docs-only work if it remains subordinate to `VISION.md`, `PLAN.md`, and phase subplans.
- A demo or inspection issue can proceed only if it preserves generated-demo boundaries and keeps evidence authoritative.
- A proof-contract gap requires a future implementation plan with schema, fixture, diagnostics, command, report or artifact path, evidence path, demo boundary where applicable, and CI gate.
- A future target request, including production adapters, live SurfaceOps, live JudgmentKit, A2UI, SDKs, APIs, native bridges, or runtime services, remains planned until target-specific evidence passes.
