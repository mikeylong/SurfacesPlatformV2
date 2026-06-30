# Wave 1 Launch Checklist

## Status
This checklist is an operational runbook for the first moderated Wave 1
customer-facing design-partner session. It is subordinate to
`VISION.md`, `PLAN.md`, phase subplans, and the design-partner testing program.

It does not create proof authority, proof commands, schemas, fixtures,
diagnostics, generated artifacts, demos, evidence paths, product claims, live
integrations, live review state, or partner-data storage. Partner feedback is
research input only.

Use this checklist to launch the first moderated evidence walkthrough. Do not
use it as a self-serve trial, production beta, live ingestion exercise,
implementation pilot, public API or SDK preview, A2UI test, live SurfaceOps
workflow, live JudgmentKit evaluation, production adapter test, or production
readiness review.

## Launch Goal
Run one controlled session that answers three practical questions:

- Can the partner explain the authority chain from design-system source
  material to governed catalog, evidence, review, and downstream consumption?
- Can the partner distinguish implemented proof, proof-only static targets,
  generated demos, review outcomes, and planned future work?
- Can the team complete capture, scorecard, boundary review, and first-session
  disposition without storing raw partner material in this repo?

## Roles
Assign these roles before inviting the partner. Use aliases in completed
records unless an approved private workspace requires real names.

| Role | Owns | Must not do |
| --- | --- | --- |
| Facilitator | Session flow, opening script, boundary sign-off, prompts, timebox, redirecting out-of-scope requests. | Promise live ingestion, production adapter support, public API or SDK support, A2UI, live SurfaceOps, or live JudgmentKit. |
| Note taker | External results capture, paraphrased observations, follow-up ids, data-handling notes. | Store raw notes, direct quotes, screenshots, transcripts, partner identity, source material, private URLs, credentials, customer names, or proprietary examples in this repo. |
| Evidence owner | Current proof snapshot, evidence path list, demo path list, trace-task aids. | Treat demos as proof authority or run proof gates during the session without separate authorization. |
| Boundary reviewer | Post-session boundary review for capture, scorecard, synthesis inputs, and repo workspace. | Approve a record that contains raw or identifiable partner material. |
| Decision owner | First-session disposition: continue, revise guide, repeat test, or stop for data-handling review. | Convert partner interest into an implementation claim without a future full proof shape and passing evidence. |

## Before Scheduling
Complete these checks before sending the invitation.

- Confirm the partner fits Wave 1: design-system governance, component policy,
  CI or release gate, review workflow, accessibility or governance review, or
  downstream runtime concern.
- Confirm the partner can react to repo-owned examples without providing source
  files, screenshots, exports, recordings, transcripts, customer data,
  credentials, private URLs, component names, or proprietary implementation
  details for repo storage.
- Confirm the session can be moderated by a facilitator. Do not hand the
  package to the partner for unattended evaluation.
- Confirm the planned session uses the required stimulus pack from
  `plans/design-partner-testing.md#required-stimulus-pack`.
- Confirm completed `results-capture.md`, `scorecard.md`, and synthesis notes
  will live in an approved private workspace, not in this repo.
- Confirm the opening script and boundary sign-off from `session-guide.md` will
  happen before task prompts.
- Confirm no one will run proof gates during the session unless a separate
  verification task explicitly authorizes it.

## Partner-Facing Send
Send a short note that sets expectations without exposing repo internals the
partner does not need.

Include:

- the session is a moderated evidence walkthrough for feedback;
- the team will use repo-owned examples, evidence paths, and generated demos;
- the partner should not bring or share proprietary source material, screenshots,
  recordings, transcripts, credentials, private URLs, customer data, or
  implementation details;
- the session is not a live integration, self-serve trial, production beta,
  production adapter test, public API or SDK preview, A2UI test, live SurfaceOps
  pilot, or live JudgmentKit evaluation;
- the useful feedback is where the evidence model is clear, where it is
  confusing, and what future proof target would matter for the partner's
  workflow.

Optional partner-facing agenda:

```text
We will walk through how Surfaces treats design-system source material,
catalog authority, proof evidence, review-required output, and derived static
targets. We will use our own repo-owned examples only. Please avoid sharing
proprietary files, screenshots, recordings, source exports, credentials,
private URLs, customer data, or implementation details. The goal is feedback
on whether the evidence model is understandable and useful, not a live
integration or production trial.
```

## Internal Prep Packet
Prepare these materials before the call.

Read-only orientation refs:

- `VISION.md`
- `PLAN.md`
- `plans/usability-value-evidence.md`
- `plans/product-portfolio-boundaries.md`
- `plans/design-partner-testing.md`
- `plans/design-partner-testing/session-guide.md`
- `plans/design-partner-testing/declared-source-conformance-review-proof.md`

External working copies:

- blank external copy of `plans/design-partner-testing/results-capture.md`;
- blank external copy of `plans/design-partner-testing/scorecard.md`;
- place to draft a de-identified first-session disposition using
  `plans/design-partner-testing/synthesis-template.md`;
- partner alias and session id assigned outside this repo;
- consent and recording constraints, if any, recorded outside this repo.

Do not create completed partner-specific copies of these templates in
`/Users/mike/SurfacesPlatformV2`.

## Evidence And Demo Refs
Use these as read-only session aids. Evidence comes first. Demos are
presentation output only.

Evidence refs:

- `artifacts/p0/evidence.json`
- `artifacts/p1/evidence.json`
- `artifacts/p2/evidence.json`
- `artifacts/p3/evidence.json`
- `artifacts/p4/evidence.json`
- `artifacts/p5/protocol/evidence.json`
- `artifacts/p5/native/evidence.json`

Trace-task refs:

- `artifacts/p2/governed-catalog.json`
- `artifacts/p3/review-queue.json`
- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/review-judgment-report.json`
- `artifacts/p5/protocol/protocol-envelope.button.json`
- `artifacts/p5/native/surfaces-native-packet.button.json`

Presentation refs:

- `demo/p0/index.html`
- `demo/p1/index.html`
- `demo/p2/index.html`
- `demo/p3/index.html`
- `demo/p4/index.html`
- `demo/p5/protocol/index.html`
- `demo/p5/native/index.html`

## Session Run Order
Keep the first session evidence-first. If time gets tight, reduce discussion
time before skipping the authority or evidence framing.

1. Start with the opening script in `session-guide.md`.
2. Complete boundary sign-off before showing task prompts.
3. Establish the authority chain using `VISION.md` and
   `plans/usability-value-evidence.md`.
4. Trace one repo-owned surface from `artifacts/p2/evidence.json` and
   `artifacts/p2/governed-catalog.json` through `artifacts/p3/review-queue.json`,
   P4 review and judgment evidence, and either P5 protocol or P5 native static
   output.
5. Show one diagnostic or review-required case before showing the matching demo.
6. Ask the partner to separate evidence `status`, `promotionStatus`, demos,
   review outcomes, and future target requests.
7. Ask for partner workflow fit generically: one requirement current evidence
   supports, and one requirement that would need a future proof shape.
8. Close by restating that no raw partner data will be stored in this repo.

## In-Session Control Points
The facilitator should stop or redirect when the session crosses a boundary.

- If the partner starts to share proprietary material, pause and ask for a
  generalized workflow description instead.
- If the partner asks for live ingestion, classify it as a future proof
  candidate or out-of-scope request.
- If the partner asks for production API, SDK, adapter, native bridge, runtime,
  or A2UI support, restate that current P5 outputs are inert proof-only static
  targets.
- If the partner asks whether SurfaceOps or JudgmentKit is live, restate that P4
  contains deterministic SurfaceOps-shaped and JudgmentKit-shaped artifacts only.
- If the partner treats demos as proof, return to the matching evidence path and
  explain that demos are presentation aids.
- If a boundary cannot be corrected, stop the task flow and move to general
  orientation only.

## Capture Rules
Capture outside this repo.

Allowed in external capture:

- anonymized partner id;
- participant role lens, if generalized;
- paraphrased observations;
- repo-owned evidence and demo paths;
- follow-up type;
- `High`, `Medium`, or `Low` priority or severity when needed;
- explicit `no current proof` gaps.

Not allowed in this repo:

- partner names, company names, emails, account ids, private URLs, credentials,
  customer names, component names, proprietary examples, source exports, source
  files, screenshots, transcripts, recordings, direct quotes, raw notes, or
  implementation details.

If any raw partner material enters the repo workspace, stop the launch process
and treat it as a data-handling incident. Do not fold the incident into normal
docs cleanup.

## After-Session Checklist
Complete these steps before scheduling the next Wave 1 session.

- Complete the external results capture.
- Complete the external scorecard.
- Complete boundary review on both external records.
- Confirm no completed partner-specific records or raw partner materials were
  created under `/Users/mike/SurfacesPlatformV2`.
- Convert observations into de-identified findings outside the repo.
- Tie each finding to a repo-owned evidence path, docs path, or explicit
  `no current proof` gap.
- Classify each follow-up as `doc update`, `repeat test`, `backlog candidate`,
  `future proof candidate`, `out of scope`, or `no action`.
- Write the first-session disposition outside the repo using the Wave 1
  disposition section in `synthesis-template.md`.

## First-Session Decision Path
Use the scorecard thresholds, then choose one disposition.

| Disposition | Use when | Next action |
| --- | --- | --- |
| Continue with same walkthrough | Boundary sign-off passed, all required stimulus-pack tasks were completed, evidence-loop comprehension is `Strong` or `Mixed`, no raw partner material entered the repo, and no unresolved High severity confusion remains about demo authority, production support, live SurfaceOps, live JudgmentKit, A2UI, SDKs, APIs, or live runtimes. | Schedule the next Wave 1 session with the same run order. |
| Revise guide before next session | Required tasks were completed, but Medium or High confusion can be addressed through docs-only facilitator guidance. | Propose a docs-only clarification under `plans/design-partner-testing/` before the next session. |
| Repeat first-session test | A required stimulus-pack task was skipped, boundary sign-off was incomplete, evidence-loop comprehension is `Weak` or `Not observed`, or proof authority and demos remained confused by the close. | Retest the revised first-session flow before treating Wave 1 as ready to continue. |
| Stop and review data handling | Raw partner material, direct quotes, screenshots, transcripts, source content, credentials, private URLs, partner identity, customer identity, component names, or proprietary examples entered the repo workspace. | Stop partner scheduling until the data-handling failure is resolved outside the proof-contract docs flow. |

## Repo-Safe Output
The first session may produce internal planning decisions, but the repo-safe
output is limited.

Allowed later, only when approved and de-identified:

- a docs clarification that stays subordinate to current proof authority;
- a paraphrased synthesis statement that names a phase, evidence path, or
  `no current proof` gap;
- a future proof-candidate note that explicitly says no implementation claim
  exists until a full proof shape and passing evidence exist.

Not allowed:

- completed partner captures or scorecards;
- raw notes, direct quotes, recordings, transcripts, screenshots, source
  material, partner names, company names, customer names, component names,
  credentials, private URLs, or proprietary examples;
- claims that partner feedback changed proof status, promotion status, catalog
  authority, SurfaceOps decisions, JudgmentKit findings, generated artifacts,
  generated demos, schemas, fixtures, diagnostics, source refs, artifact hashes,
  CI gates, production readiness, or target support.
