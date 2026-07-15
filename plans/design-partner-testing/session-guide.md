# Design-Partner Session Guide

## Status
This guide is a subordinate facilitator runbook for the curated design-partner testing program in [Curated Design-Partner Testing Program](../design-partner-testing.md).

It is not proof authority and does not create a new proof command, schema, fixture, artifact, demo, CI gate, live workflow, production adapter, partner-data store, or implementation claim.

## Facilitator Goals
Each session should test whether a design-system partner can understand and critique the current Surfaces Platform evidence loop using repo-owned material only.

The facilitator should leave with:

- anonymized observations about what was clear or unclear;
- evidence-backed notes about where the partner trusted or questioned the proof loop;
- a small set of triaged follow-ups;
- no raw partner data in the repo.

## Required Guardrails
State these guardrails at the start and enforce them during the session.

- The session uses repo-owned examples, current proof artifacts, and generated demos only.
- The partner should not paste, upload, screenshare for capture, or place proprietary source material into this repo.
- The package is for moderated feedback only, not a self-serve product trial or partner-run validation.
- Demos are presentation output, not proof authority.
- P5 `surfaces-protocol-static` and `surfaces-native-static` are proof-only static targets, not production APIs, SDKs, services, native runtimes, A2UI, or live adapters.
- SurfaceOps and JudgmentKit are represented by deterministic P4 artifacts only. Do not imply live persistence, live evaluator invocation, or operational workflow support.
- Partner reactions can guide future work, but they do not prove implementation.

If the partner starts to share proprietary material, pause and redirect to a generalized description. Capture only the generalized workflow need.

## Pre-Session Setup
Complete this setup before the session.

- Confirm this is the first Wave 1 moderated evidence walkthrough unless the
  facilitator is explicitly running a later session.
- Assign the partner to Wave 1 or Wave 2.
- Assign an anonymized partner id outside this repo.
- Confirm the partner fits the program criteria: design-system authority, component governance, CI/release gate, review workflow, or downstream runtime concern.
- Confirm the session can use repo-owned examples without partner files or source material.
- Prepare links or local views for `VISION.md`, `PLAN.md`, `plans/usability-value-evidence.md`, and the generated demos listed in this guide.
- For declared-source proof-candidate discovery, prepare
  `plans/design-partner-testing/declared-source-conformance-review-proof.md`
  and keep its Status and Non-Goals sections attached to any excerpt.
- For the revised Button retest, prepare
  `plans/design-partner-testing/button-workflow-workbench.md` as a derived
  inspection surface only. Use it to translate repo-owned Button evidence into
  workflow language; do not treat it as proof authority or as a replacement for
  evidence files, reports, schemas, fixtures, diagnostics, or generated
  artifacts.
- Prepare the evidence path list for the current proof loop:
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
- Prepare the presentation-only demo path list:
  - `demo/p0/index.html`
  - `demo/p1/index.html`
  - `demo/p2/index.html`
  - `demo/p3/index.html`
  - `demo/p4/index.html`
  - `demo/p5/protocol/index.html`
  - `demo/p5/native/index.html`
- Prepare the required stimulus pack from [Curated Design-Partner Testing Program](../design-partner-testing.md#required-stimulus-pack), including the fixed trace task, diagnostic or review-required task, status-versus-promotion task, and future-proof-shape task.
- Prepare blank external copies of [Results Capture](results-capture.md) and
  [Scorecard](scorecard.md) in the approved private workspace. Do not fill
  completed copies in this repo.
- Confirm the facilitator can complete the boundary sign-off before the first
  task prompt.
- Do not run proof gates during the session unless a separate verification task explicitly authorizes it.

## Wave 1 Run Sheet
Use this run sheet for the first moderated customer-feedback sessions. It keeps
the session evidence-first and prevents the feedback MVP from becoming a
self-serve product claim.

Before the call:

- confirm the current proof snapshot and note the evidence paths that will be
  shown;
- open the repo-owned docs, evidence files, and generated demos needed for the
  required stimulus pack;
- open `plans/design-partner-testing/button-workflow-workbench.md` only as a
  facilitator inspection aid for the revised Button retest, keeping the
  evidence paths as the source of proof authority;
- prepare external copies of the results capture and scorecard templates;
- restate the no-partner-data rule to the facilitator and note taker.

During the call:

- use the opening script before showing any demo;
- walk one repo-owned trace through the seven product designer workflow steps
  from `VISION.md`: declare authority, compile governed contracts, generate
  inside the catalog boundary, inspect evidence, decide or revise at the
  authority layer, hand off proven target output, and govern changes over time;
- when running the revised Button retest, use the Button workflow workbench to
  orient the participant, then name the backing evidence path before discussing
  any conclusion;
- ask the diagnostic or review-required task before asking future-target
  questions;
- ask the partner to distinguish evidence `status`, `promotionStatus`, demos,
  and planned targets before the close;
- redirect any request for live ingestion, production adapter behavior, public
  API or SDK support, A2UI, live SurfaceOps, or live JudgmentKit into a future
  proof-candidate note.

After the call:

- complete the external scorecard and boundary review;
- keep raw notes, recordings, screenshots, transcripts, partner source material,
  private URLs, credentials, customer names, and proprietary examples outside
  this repo;
- classify follow-ups before opening docs or proof work;
- treat the first wave as complete only after the synthesis decides whether to
  proceed to Wave 2, revise the guide, or retest a session.

## Opening Script
Use plain language and keep the opening short.

Surfaces Platform is a proof-contract system for governed generated UI. The design system is product authority. The Surfaces Catalog is the governed contract authority. Passing evidence is proof authority for implemented behavior. Demos and docs help humans inspect the proof, but they do not prove behavior by themselves.

The session is not a live integration with your design system. We will use repo-owned examples and ask where this evidence model would or would not fit your workflow. Please avoid sharing proprietary source files, screenshots, recordings, customer data, credentials, or private implementation details.

## Product Designer Workflow Spine
Use this spine for Wave 1. The session should test whether the partner can
follow the product designer workflow from `VISION.md`, not just recognize phase
names.

| VISION workflow step | Facilitator action | Repo-owned aids | Success signal |
| --- | --- | --- | --- |
| Declare design authority | Ask which source facts, precedence rules, policy refs, and review owner govern the Button scenario. | `sources/source-conformance/declared-source-bundle/governance/authority-profile.json`; `artifacts/source-conformance/source-fact-coverage.json`; `artifacts/source-conformance/authority-connection-report.json` | Partner can name source authority and the required follow-up without treating demos or generated output as authority. |
| Compile governed contracts | Show the P2 proof result and governed catalog. | `artifacts/p2/evidence.json`; `artifacts/p2/governed-catalog.json`; `artifacts/p2/ingestion-report.json` | Partner can identify which evidence file proves the bounded catalog output. |
| Generate inside the catalog boundary | Show allowed, invalid, and review-required fixture behavior. | `fixtures/p2/valid`; `fixtures/p2/invalid`; `fixtures/p2/review`; ingestion/report diagnostics | Partner understands unsupported UI becomes diagnostics or review-required records, not inferred UI. |
| Inspect evidence, not only pixels | Use the trace report before opening any demo. | `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`; `artifacts/designer-workflow-trace/evidence.json`; matching demos only after evidence | Partner distinguishes evidence, reports, promotion status, and presentation aids. |
| Decide or revise at the authority layer | Ask where a blocked or review-required case should be fixed. | `artifacts/source-conformance/source-review-queue.json`; `artifacts/p3/review-queue.json`; `artifacts/p4/surfaceops-decision-ledger.json` | Partner routes fixes to source authority, mappings, policy, review ownership, or future proof scope. |
| Hand off only proven target output | Show protocol or native output only after matching evidence. | `artifacts/p5/protocol/protocol-envelope.button.json`; `artifacts/p5/native/surfaces-native-packet.button.json`; P5 evidence | Partner can separate proof-only static handoff from production adapter, SDK, API, runtime, or A2UI support. |
| Govern changes over time | Ask what must happen when source material, policy, decisions, or target requirements change. | relevant `npm run check:*:ci` gate names; `artifacts/**/evidence.json` paths | Partner expects regeneration and evidence refresh instead of patching downstream artifacts. |

## Boundary Sign-Off
Complete this verbal sign-off before showing task prompts. If any answer cannot
be confirmed, stop or switch to a general orientation only.

| Check | Required answer |
| --- | --- |
| Partner will use repo-owned examples only | `yes` |
| Partner will not provide source files, screenshots, recordings, transcripts, customer data, credentials, private URLs, component names, or proprietary implementation details for repo storage | `yes` |
| Facilitator will capture only paraphrased, de-identified observations outside this repo | `yes` |
| Partner understands demos are presentation aids, not proof authority | `yes` |
| Partner understands P5 protocol and native outputs are inert proof-only static targets | `yes` |
| Partner understands live SurfaceOps, live JudgmentKit, production adapters, SDKs, APIs, live runtimes, and A2UI are not implemented by this session | `yes` |

Record the sign-off result in the external copy of
[Results Capture](results-capture.md). Do not store the partner's name,
company, direct quote, recording, transcript, screenshot, or source material in
this repo.

## Session Agenda
Use a 75-90 minute session. Shorten by reducing discussion time, not by skipping the authority and evidence framing.

| Segment | Time | Goal |
| --- | --- | --- |
| Orientation and guardrails | 10 minutes | Establish authority, implemented scope, proof-only scope, and data guardrails. |
| Declare and compile | 15 minutes | Test whether source authority, mappings, policy refs, governed catalog output, and proof evidence are understandable. |
| Generate and inspect | 20 minutes | Test whether catalog-bound generation, diagnostics, review-required behavior, evidence, reports, promotion status, and demos are distinguishable. |
| Decide or revise | 15-20 minutes | Test whether review queues and P4 SurfaceOps/JudgmentKit-shaped artifacts support authority-layer decisions without live persistence or evaluator invocation. |
| Handoff and govern changes | 20 minutes | Test whether P5 protocol/native outputs read as proof-only static handoff and whether the partner expects regeneration when authority or targets change. |
| Close | 10 minutes | Capture adoption blockers, unclear boundaries, and future proof targets by workflow step. |

## Wave 1 Session 1 Moderated Evidence Walkthrough
Use this fixed walkthrough for the first Wave 1 session. It keeps the session
comparable across partners and prevents partner-owned material from becoming the
stimulus.

| Step | Facilitator action | Repo-owned aids | Required prompt | Capture focus |
| --- | --- | --- | --- | --- |
| 1 | Establish authority and current proof posture. | `VISION.md`; `plans/usability-value-evidence.md`; current evidence summary table. | "In your own words, what is the authority chain from design-system source material to catalog, evidence, review, and downstream consumption?" | Evidence-loop comprehension; authority confusion; demo-as-proof confusion. |
| 2 | Declare authority for the repo-owned Button scenario. | P2 manifest, inventory, mapping, and source-conformance authority map. | "Which source material and policy refs own this scenario, and which parts are not authority?" | Source-authority comprehension; missing-source-ref questions. |
| 3 | Compile governed contracts and identify proof authority. | `artifacts/p2/evidence.json`; `artifacts/p2/governed-catalog.json`; `artifacts/p2/ingestion-report.json`. | "Which proof result turns bounded source material into catalog authority for this scenario?" | Evidence path recall; governed-catalog comprehension. |
| 4 | Generate inside the catalog boundary with a diagnostic or review-required case before showing any demo. | P2 valid, invalid, review fixtures and report rows; demos only after evidence is shown. | "Why should this case become a diagnostic, review row, or non-emitted artifact instead of unattended generated UI?" | Diagnostic clarity; governance fit; unsafe inference requests. |
| 5 | Inspect the consolidated trace report, then separate proof status, promotion status, demos, and future requests. | `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`; trace evidence; relevant generated demo path for the same phase. | "Which parts are implemented proof, which are presentation aids, which are review outcomes, and which would need future proof before support is claimed?" | Proof-boundary clarity; production-support confusion; future proof-shape clarity. |
| 6 | Decide or revise at the authority layer. | Source review queue, P3 review queue, P4 decision ledger, and review/judgment report. | "If this output is unsupported, blocked, or review-required, what should change: source material, mapping, policy, review ownership, or future proof scope? What would be wrong with patching only the demo, protocol envelope, or native packet?" | Authority-layer decision fit; review-owner clarity. |
| 7 | Hand off proven target output and govern changes over time. | P5 protocol or native evidence and static output; relevant CI gate names. | "Which target output is safe to hand off, and what evidence and generated outputs must be regenerated if source authority, policy, review, or target requirements change?" | Handoff comprehension; regeneration expectation; future target request. |

For Step 2, default to the P2-to-P4-to-P5 trace if time is limited:

- `artifacts/p2/evidence.json` as bounded real-source ingestion proof;
- `artifacts/p2/governed-catalog.json` as catalog authority for the P2 slice;
- `artifacts/p3/review-queue.json` as inert review-required work output;
- `artifacts/p4/surfaceops-decision-ledger.json`,
  `artifacts/p4/review-judgment-report.json`, and
  `artifacts/p4/evidence.json` as deterministic review/judgment proof;
- `artifacts/p5/protocol/protocol-envelope.button.json` or
  `artifacts/p5/native/surfaces-native-packet.button.json` as inert
  downstream output only when backed by matching P5 evidence;
- matching demos only after the evidence path has been named.

The session is complete only if the facilitator can fill all required
stimulus-pack completion fields and the product-designer workflow coverage
fields in the external results capture and scorecard.
If any required task is skipped, mark the session for retest before treating
Wave 1 as ready for Wave 2.

## Revised Button Workbench Retest
Use this short retest only after the Button workflow workbench has been prepared
as a derived inspection surface. The retest remains docs-only, synthetic or
moderated feedback material, not proof authority or partner validation.

Run one moderated group retest session with one representative for each
archetype from the moderated walkthrough: Northstar Group, AtlasWorks,
LumenHouse, and the regulated-services partner. Score each representative
separately across the seven prompts. Do not role-play missing representatives,
do not score one participant across all four lenses, and do not aggregate
partial sessions. If the retest is repeated across cohorts, each session must
include all four representative lenses and pass on its own.

Retest prompts:

1. Declare design authority: "Using the Button workflow workbench, what
   currently owns the Button scenario, what is missing or archetype-specific,
   and which surfaced items are not authority?"
2. Compile governed contracts: "Which proof result and evidence path turn
   bounded source material into governed Button catalog authority?"
3. Generate inside the catalog boundary: "Which Button outcomes are allowed,
   review-required, or blocked, and why should unsupported behavior become
   diagnostics or review rows instead of unattended generated UI?"
4. Inspect evidence, not pixels: "What is the difference between evidence
   `status`, `promotionStatus`, demos, reports, and future requests for this
   Button case?"
5. Decide or revise at the authority layer: "If the Button output is
   unsupported, blocked, or review-required, what should change at the source,
   mapping, policy, review ownership, or future proof scope, and what should
   not be patched downstream?"
6. Hand off only proven target output: "Which base Button protocol or native
   static output is safe to inspect as proof-only handoff, which blocked or
   expired exception is not handoff-allowed, and which API, SDK, runtime,
   adapter, native bridge, or A2UI claims remain unproved?"
7. Govern changes over time: "Fill the Change/Audit Packet for one source
   authority, policy, review-state, or target-requirement change: what changed,
   which Button outcome is affected, which evidence must regenerate, who owns
   the action, what expiry or retention metadata applies, what release or
   handoff impact applies, and which workbench, trace, demo, protocol, or native
   view is not authority?"

The revised retest passes only if all revised pass criteria hold:

- aggregate score at least `46/56`;
- each task at least `6/8`;
- each representative at least `10/14`;
- the govern-changes task includes a completed Change/Audit Packet in every
  representative session;
- no unresolved confusion about evidence versus pixels, authority-layer fixes
  versus generated-output patches, or proof-only static output versus production
  API, SDK, runtime, native bridge, adapter, or A2UI.

## Segment 1: Orientation
Show:

- `VISION.md` authority model and lifecycle enforcement model.
- `plans/usability-value-evidence.md` current evidence summary.
- Current distinction between evidence status and promotion status.

Ask:

- Which role in your team owns design-system source authority?
- Which role would need to trust generated UI before it moves toward production?
- Does the difference between design-system authority, catalog authority, and proof authority make sense?
- Which part of the loop sounds closest to your current workflow: source governance, generation, CI, review, runtime, protocol, or native consumption?

Watch for:

- Confusion between demos and proof.
- Assumption that a passing proof means production readiness.
- Assumption that partner feedback can override catalog or evidence.

## Segment 2: Generation Boundary
Show:

- P0 as the synthetic catalog contract proof.
- P2 as bounded real design-system ingestion for the declared local Spectrum source subset.
- The required stimulus pack's diagnostic or review-required case from repo-owned evidence or generated demo output.

Explain:

- Unsupported components, props, variants, states, slots, actions, token refs, data bindings, accessibility semantics, mappings, and governance gaps must become diagnostics or review-required records.
- P0 fixtures are synthetic proof inputs.
- P2 is bounded local ingestion only. It is not live Figma, Storybook, Code Connect, docs crawling, production HTML extraction, or full Spectrum support.

Ask:

- Where would your design system need explicit source refs or policy refs?
- Which unsupported UI behavior would your team most want blocked?
- Which ambiguous cases would require manual mapping or review instead of automatic generation?
- Would the diagnostic style help your team decide what to fix?

Watch for:

- Desire to infer missing behavior from examples.
- Need for source-family support that does not exist yet.
- Requests for component coverage beyond the current P2 proof.

## Segment 3: CI Evidence
Show:

- The phase evidence paths.
- The proof command shape from `PLAN.md` or `plans/usability-value-evidence.md`.
- The distinction between `status` and `promotionStatus`.
- Generated demos as presentation views only.

Explain:

- CI gates prove reproducibility for declared proof slices.
- Evidence files, report artifacts, artifact hashes, diagnostics, drift checks, and untracked-output guards make implementation claims reviewable.
- Passing CI for one target does not prove future targets.

Ask:

- Would evidence files and promotion status be enough for your release or governance process to reason about generated UI?
- Which evidence fields would your engineers or design-system owners inspect first?
- Where would your team expect the proof-bearing gate log or release record to live?
- What would make a CI failure actionable rather than noisy?

Watch for:

- Treating proof commands as live product workflows.
- Treating demo output as the source of truth.
- Missing audit expectations around evidence refs, hashes, or promotion status.

## Segment 4: Review Governance
Show:

- P3 review queue as inert proof output.
- P4 `surfaceops-decision-ledger.json` as deterministic SurfaceOps-shaped decision evidence.
- P4 `judgmentkit-evaluation-report.json` as deterministic evaluation-only findings.
- P4 `review-judgment-report.json` and `artifacts/p4/evidence.json`.

Explain:

- P3 work orders authorize no live agents, shell commands, connector calls, network calls, file edits, secrets, callbacks, or execution.
- P4 records deterministic review and judgment proof artifacts only.
- SurfaceOps decisions cannot rewrite catalog policy or execute work orders.
- JudgmentKit-shaped findings cannot approve, reject, route, promote, mutate, render, execute, or override policy.

Ask:

- Which review decisions would need human accountability in your workflow?
- Would decision rows with evidence refs and reviewer provenance be inspectable enough?
- What should remain blocked or review-required even if a generated surface is structurally valid?
- Which evaluation findings would be useful if they remained advisory only?

Watch for:

- Requests for live review persistence or workflow state.
- Confusion between evaluator findings and decision authority.
- Assumption that approval executes work orders or promotes downstream artifacts.

## Segment 5: Runtime, Protocol, And Native Consumption
Show:

- P1 `web-static` runtime projection and render plans.
- P5 `surfaces-protocol-static` target selection, protocol projection, inert envelopes, adapter report, and evidence.
- P5 `surfaces-native-static` target selection, native projection, inert packets, native report, and evidence.

Explain:

- Runtime projections, protocol projections, envelopes, native projections, native packets, reports, and demos are derived consumers.
- Review-required runtime, protocol, or native fixtures remain report/evidence-only and do not emit render-plan, protocol-envelope, or native-packet artifacts.
- Protocol evidence is only a compatibility preflight input for native. Native authority remains accepted P2 catalog/evidence plus accepted P4 review/judgment evidence.
- These targets do not prove production APIs, SDKs, native SDKs, native bridges, live runtimes, live services, A2UI exports, or A2UI conformance.

Ask:

- Which downstream target would matter first for your team?
- What would your runtime or adapter need to know before rendering or packaging generated UI?
- Does the non-emission rule for review-required cases make sense?
- Which future target would need its own proof shape before your team would treat it as supported?

Watch for:

- Treating protocol envelopes as a public API.
- Treating native packets as a native SDK or renderer.
- Treating A2UI as implemented by the current P5 slices.

## Segment 6: Close
Ask the partner to summarize:

- what they believe Surfaces Platform currently proves;
- what they believe remains planned or proof-only;
- where their team would need more evidence;
- which risks would block adoption;
- which future target would be most valuable.

End by restating that no partner data will be stored in the repo and that findings will be synthesized without proprietary details.

## Declared-Source Proof-Candidate Discovery Branch
Use this branch only after the partner has the authority and evidence framing.
It is for future proof-shape discovery, not implementation-ready pilot claims.

Show:

- `plans/design-partner-testing/declared-source-conformance-review-proof.md`
  with its Status and Non-Goals sections.
- The current P2 evidence boundary as the implemented source-ingestion example.
- The explicit `no current proof` boundary for broader declared-source
  conformance and review.

Use the safe pitch from the proof-candidate memo:

```text
Surfaces is a proof-contract system for governed generated UI. It tests whether
generated output conforms to declared design-system authority and produces
deterministic evidence before promotion. Current outputs are proof artifacts and
inspection demos, not production APIs, SDKs, adapters, A2UI exports, live
runtimes, live SurfaceOps workflows, or live JudgmentKit evaluations.
```

Ask:

- What source materials or policies would your team need declared before
  generated UI could be evaluated safely?
- Which refs matter most for trust: component provenance, variants, states,
  accessibility rules, content policy, brand exceptions, approval metadata, or
  something else?
- What unsupported or ambiguous UI behavior should block versus route to review?
- Who would own review-required output, and what evidence would they need before
  making a decision?
- What would make CI evidence actionable rather than noisy?
- Which downstream target would matter first, and what proof would need to exist
  before support is claimed?
- What wording would cross into a production adoption claim too early?

Capture:

- current evidence fit;
- `no current proof` gaps;
- future proof-candidate requirements;
- overclaim risks;
- raw or proprietary material that must stay outside the repo.

## Observation Template
Use this template outside the repo for raw notes. If a synthesized finding later enters a repo issue or docs change, remove partner identity and proprietary details first.

```markdown
Partner id: [anonymized id]
Wave: [1 or 2]
Session date: [date]
Partner role lens: [design-system / engineering / governance / review / runtime]

Observation:
- Phase or lifecycle point: [generation / CI / review / runtime / protocol / native / cross-cutting]
- Evidence or doc ref: [repo-owned path, or "no current proof"]
- What the partner understood:
- What was unclear:
- Adoption blocker:
- Follow-up type: [docs clarification / demo-inspection issue / proof-contract gap / product risk / future target request]
- Priority: [High / Medium / Low, only if prioritizing]
- De-identified synthesis:

Excluded from repo:
- Partner names, company names, component names, proprietary examples, screenshots, recordings, source files, customer data, credentials, and implementation details.
```

## Finding Triage
Classify each finding before turning it into work.

Docs clarification:

- The current proof already supports the statement, but the explanation is unclear.
- The fix must stay subordinate to `VISION.md`, `PLAN.md`, and phase subplans.

Demo or inspection issue:

- The generated demo or human inspection path makes evidence harder to understand.
- The fix must keep demo output as presentation only.

Proof-contract gap:

- The partner need requires behavior that is not implemented by current evidence.
- The follow-up must name the missing schema, fixture, diagnostics, command, report or artifact path, evidence path, demo boundary if relevant, and CI gate before implementation is claimed.

Product risk:

- The partner reaction indicates a likely adoption blocker or overclaim risk.
- The follow-up should clarify boundaries or defer the claim until proof exists.

Future target request:

- The partner asks for production adapter behavior, live SurfaceOps, live JudgmentKit, A2UI, SDKs, APIs, native bridges, live runtimes, or broader source support.
- The finding stays planned until target-specific evidence passes.

## Stop Conditions
Stop or redirect the session if any of these happen:

- Partner material would need to be copied into the repo.
- The conversation requires live ingestion, live connector use, live agent execution, or secret access.
- The partner interprets a proof-only slice as production support and the facilitator cannot correct the misunderstanding.
- The session becomes a sales commitment, production readiness review, legal negotiation, or public endorsement discussion.
- The discussion cannot proceed without raw data that the program is not allowed to store.

## Post-Session Checklist
Complete this checklist after each session.

- Remove or isolate raw notes from the repo workspace.
- Confirm no partner files, screenshots, recordings, transcripts, names, source material, or proprietary details were created under `/Users/mike/SurfacesPlatformV2`.
- Confirm completed captures, scorecards, and syntheses remain outside this repo unless they are approved paraphrased, de-identified synthesis statements.
- Convert useful notes into de-identified findings outside the repo.
- Tie each finding to a repo-owned evidence path, docs path, or explicit "no current proof" gap.
- Classify each finding by follow-up type.
- Mark any priority with `High`, `Medium`, or `Low` only when prioritization is needed.
- Decide whether the finding affects Wave 2 session flow, docs clarity, demo inspection, or future proof planning.
