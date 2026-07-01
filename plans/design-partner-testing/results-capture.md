# Design Partner Results Capture

## Status
This template is a non-proof research layer for design-partner testing. It is
subordinate to `VISION.md`, `PLAN.md`, and the phase subplans. It does not define
a schema, fixture, proof command, generated artifact, demo, evidence path,
SurfaceOps decision, or JudgmentKit report.

Partner observations can inform planning and follow-up. They do not affect
evidence `status`, `promotionStatus`, SurfaceOps decision ledgers,
JudgmentKit-shaped reports, generated demos, generated artifacts, schemas,
fixtures, source refs, artifact hashes, or proof authority.

Completed copies of this template belong outside this repo by default. This repo
stores the blank template and may receive only approved paraphrased,
de-identified synthesis statements in docs or issues.

## Capture Rules
- Use only anonymized partner and participant identifiers.
- Do not record names, emails, account ids, private URLs, secrets, proprietary
  source files, source exports, screenshots with sensitive content, or raw
  customer data in this repo.
- Reference proof files only as read-only context, for example
  `artifacts/p4/evidence.json` or `demo/p5/native/index.html`.
- Treat demos as presentation output only. If a demo and evidence disagree, the
  evidence and phase contract win.
- Do not run live SurfaceOps, live JudgmentKit, live source APIs, connector
  calls, network collection, or partner-system ingestion for this capture.
- Use `High`, `Medium`, and `Low` labels for priority, severity, or impact.
- Any future capability raised by a partner remains planned until it has its own
  schema, fixture, command contract, diagnostics, report or artifact path, and
  passing evidence.

## Session Metadata
| Field | Value |
| --- | --- |
| Session id | `dpt-session-YYYYMMDD-##` |
| Captured at UTC | `YYYY-MM-DDTHH:MM:SSZ` |
| Facilitator alias | `facilitator-##` |
| Note taker alias | `note-taker-##` |
| Partner alias | `partner-##` |
| Partner segment | `enterprise / mid-market / startup / internal platform / other` |
| Design-system maturity | `early / established / mature / multi-system` |
| Participant roles | `design-system owner, frontend/platform engineer, governance reviewer, accessibility reviewer, product lead` |
| Recording or transcript handling | `none / external approved store only; repo stores no recordings or transcripts` |
| Consent constraints | `summary only / no direct quotes / no screenshots / other` |
| Repository snapshot | `branch and commit if available` |
| Proof snapshot inspected | `read-only evidence paths and current status values` |
| Boundary sign-off completed before prompts | `yes / no` |
| Raw-material incident during session | `none / redirected / stop condition triggered` |

## Scenario Context
| Field | Value |
| --- | --- |
| Testing objective |  |
| Current partner workflow being compared |  |
| Surfaces phase or target inspected | `P0 / P1 / P2 / P3 / P4 / P5 protocol / P5 native / planned future target` |
| Evidence paths inspected |  |
| Demo paths inspected |  |
| Boundaries explained before testing | `yes / no` |
| Out-of-scope requests raised |  |

## Wave 1 Walkthrough Coverage
Complete this section for the first Wave 1 moderated evidence walkthrough.
Leave partner-specific examples outside this repo.

| Required step | Completed | Evidence or demo refs used | De-identified capture note | Follow-up needed |
| --- | --- | --- | --- | --- |
| Boundary sign-off before task prompts | `yes / no` |  |  |  |
| Authority-chain orientation | `yes / no` | `VISION.md`; `plans/usability-value-evidence.md` |  |  |
| Repo-owned surface trace from P2 through review and P5 protocol or native output | `yes / no` | `artifacts/p2/evidence.json`; `artifacts/p3/review-queue.json`; `artifacts/p4/evidence.json`; `artifacts/p5/protocol/evidence.json` or `artifacts/p5/native/evidence.json` |  |  |
| Diagnostic or review-required case explained | `yes / no` |  |  |  |
| Status, promotion status, demo, and future target distinction tested | `yes / no` |  |  |  |
| Partner workflow fit captured generically | `yes / no` | `no current proof` allowed for future gaps |  |  |

Coverage rules:
- If any required step is `no`, the scorecard must mark the session as needing
  retest before Wave 2 readiness is claimed.
- Evidence and demo refs must be repo-owned paths only.
- De-identified notes must be paraphrased. Do not include direct quotes,
  transcripts, screenshots, partner component names, customer names, source
  material, credentials, private URLs, or proprietary examples.

## Product Designer Workflow Coverage
Complete this section for every Wave 1 session. It tracks whether the partner
could follow the workflow from [VISION.md](../VISION.md#product-designer-workflow)
using repo-owned evidence.

| VISION workflow step | Completed | Repo-owned refs used | Partner comprehension | Follow-up disposition |
| --- | --- | --- | --- | --- |
| Declare design authority | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Compile governed contracts | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Generate inside the catalog boundary | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Inspect evidence, not only pixels | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Decide or revise at the authority layer | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Hand off only proven target output | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |
| Govern changes over time | `yes / no` |  | `Strong / Mixed / Weak / Not observed` | `doc update / repeat test / future proof candidate / out of scope / no action` |

Workflow coverage rules:
- If any completed workflow step is `Weak` or `Not observed`, synthesis must
  decide whether the issue is a docs clarification, repeat-test need, product
  risk, or future proof candidate.
- If a partner asks to skip authority or evidence and inspect only pixels, mark
  "Inspect evidence, not only pixels" as `Weak` unless the facilitator corrects
  the misunderstanding by the close.
- If a partner wants to fix unsupported output in a downstream demo, render
  artifact, protocol envelope, or native packet instead of source authority,
  mappings, policy, review ownership, or future proof scope, mark "Decide or
  revise at the authority layer" as `Weak` or `Mixed`.

## Observations
Use one row per observed behavior, question, friction point, or trust signal.

| Observation id | Moment | Observation | Supporting context | Affected surface or phase | Priority | Confidence | Research note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `obs-001` |  |  |  |  | `High / Medium / Low` | `High / Medium / Low` |  |

Observation guidance:
- Use paraphrased, de-identified observations only. Do not store direct quotes in
  this repo.
- Separate what the participant did from what the facilitator inferred.
- Mark inference explicitly when the note is not directly observed.
- Do not convert an observation into proof status, promotion status, or a
  SurfaceOps or JudgmentKit result.

## Acceptance Signals
Acceptance signals are research signals only. They indicate whether a partner
understands or values the evidence-backed loop; they do not approve, promote,
reject, or validate any proof artifact.

| Signal id | Signal | Evidence-loop connection | Strength | Confidence | Follow-up |
| --- | --- | --- | --- | --- | --- |
| `sig-001` |  |  | `High / Medium / Low` | `High / Medium / Low` |  |

Potential acceptance signals:
- Participant can identify which evidence file proves an implementation claim.
- Participant distinguishes generated demos from proof authority.
- Participant accepts `review_required` as inspectable but not unattended
  promotion.
- Participant can map their design-system governance workflow to source refs,
  catalog authority, diagnostics, review, and downstream consumption.
- Participant asks for a specific future target with a bounded proof shape.

## Blockers
Blockers are partner-reported or observed barriers. They are not proof failures
unless an existing proof command records a failure in evidence.

| Blocker id | Description | Category | Severity | Affected phase or target | Proof-authority impact | Proposed disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `blk-001` |  | `understanding / workflow / integration / governance / data / future target / other` | `High / Medium / Low` |  | `none / future proof candidate only` |  |

Blocker rules:
- `High` means the blocker would likely prevent the partner from continuing a
  pilot without a change in docs, workflow, or future proof scope.
- `Medium` means the blocker creates friction but does not stop continued
  testing.
- `Low` means the blocker is a minor clarification, polish item, or local
  preference.
- A partner blocker cannot mark current evidence `blocked`; only the proof
  contract and generated evidence can do that.

## Follow-Up Dispositions
Every action item should have exactly one research disposition.

| Follow-up id | Source ids | Disposition | Owner alias | Due date | Next step | Proof impact |
| --- | --- | --- | --- | --- | --- | --- |
| `fu-001` | `obs-001, sig-001, blk-001` | `doc update / repeat test / backlog candidate / future proof candidate / out of scope / no action` |  |  |  | `none / requires future full proof shape` |

Disposition rules:
- `doc update` means a non-proof explanatory change may be proposed.
- `repeat test` means the signal was inconclusive or needs another partner.
- `backlog candidate` means product planning may consider it, but no
  implementation claim exists.
- `future proof candidate` means the item needs a target-specific proof shape
  before it can be implemented or claimed.
- `out of scope` means it conflicts with current phase boundaries or portfolio
  boundaries.
- `no action` means the signal was noted but does not change plans.

## Boundary Review
Complete this section before using the capture in synthesis.

| Check | Result | Reviewer alias | Notes |
| --- | --- | --- | --- |
| All partner identifiers are anonymized | `pass / needs revision` |  |  |
| No secrets, private URLs, or proprietary source content are stored | `pass / needs revision` |  |  |
| Evidence paths are referenced read-only | `pass / needs revision` |  |  |
| No evidence status or promotion status was changed by partner feedback | `pass / needs revision` |  |  |
| No SurfaceOps decision row was created or changed | `pass / needs revision` |  |  |
| No JudgmentKit report or finding was created or changed | `pass / needs revision` |  |  |
| All priorities use High, Medium, or Low | `pass / needs revision` |  |  |
| Boundary sign-off was completed before task prompts | `pass / needs revision` |  |  |
| Completed capture stores only paraphrased, de-identified observations | `pass / needs revision` |  |  |

## Notes For Synthesis
- Strongest acceptance signals:
- Recurring blockers:
- Paraphrased wording themes worth preserving:
- Potential documentation gaps:
- Potential future proof candidates:
- Explicitly out-of-scope requests:

Repo-bound synthesis must not include verbatim partner quotes, transcripts,
screenshots, proprietary examples, component names, customer names, source
material, credentials, private URLs, or other identifying details.
