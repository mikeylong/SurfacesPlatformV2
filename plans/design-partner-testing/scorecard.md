# Design Partner Scorecard

## Status
This scorecard is a non-proof research template. It helps compare design-partner
testing sessions without changing Surfaces proof artifacts or authority.

Scores and ratings do not affect evidence `status`, `promotionStatus`, generated
artifact hashes, SurfaceOps decision ledgers, JudgmentKit-shaped reports, demos,
schemas, fixtures, diagnostics, or phase proof claims.

Completed scorecards stay outside this repo by default. Repo-bound synthesis may
include only approved paraphrased, de-identified findings. Do not store raw
partner quotes, transcripts, screenshots, component names, customer names,
company names, source files, credentials, private URLs, or proprietary examples
in this scorecard.

## Review Rules
- Score only what was observed in an anonymized design-partner session.
- Use the current proof snapshot as read-only context.
- Do not infer implementation support from interest, preference, or willingness
  to pilot.
- Do not treat this scorecard as a SurfaceOps approval, rejection,
  request-changes decision, or defer decision.
- Do not treat this scorecard as a JudgmentKit finding or evaluation report.
- Use `High`, `Medium`, and `Low` labels for priority, severity, confidence, or
  impact.
- Planned or requested capabilities require a future full proof shape before
  they can be claimed as implemented.
- Use paraphrased observations only. Do not paste direct partner quotes,
  transcripts, proprietary examples, component names, customer names,
  screenshots, source material, credentials, or private URLs.

## Scorecard Metadata
| Field | Value |
| --- | --- |
| Scorecard id | `dpt-scorecard-YYYYMMDD-##` |
| Related session id | `dpt-session-YYYYMMDD-##` |
| Completed at UTC | `YYYY-MM-DDTHH:MM:SSZ` |
| Reviewer alias | `reviewer-##` |
| Partner alias | `partner-##` |
| Participant roles represented |  |
| Proof snapshot inspected |  |
| Evidence paths referenced |  |
| Demo paths referenced |  |

## Rating Scale
| Rating | Meaning |
| --- | --- |
| `Strong` | Multiple observed signals support the dimension. |
| `Mixed` | Some signals support the dimension, but there is material friction or ambiguity. |
| `Weak` | Observed signals suggest the dimension is not yet clear, credible, or useful to the partner. |
| `Not observed` | The session did not test this dimension. |

## Dimension Scores
| Dimension | Rating | Confidence | Priority | Evidence from session | Follow-up disposition |
| --- | --- | --- | --- | --- | --- |
| Evidence-loop comprehension | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Design-system authority fit | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Governance and review fit | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Diagnostics and blocker clarity | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| SurfaceOps boundary clarity | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| JudgmentKit boundary clarity | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Runtime, protocol, or native target fit | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Demo-as-presentation clarity | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |
| Future proof-shape clarity | `Strong / Mixed / Weak / Not observed` | `High / Medium / Low` | `High / Medium / Low` |  |  |

## Program And Wave Decision Thresholds
Use these thresholds for program decisions. They are research thresholds only
and do not affect proof evidence.

| Decision | Threshold |
| --- | --- |
| Program evidence-loop comprehension | At least 75% of completed sessions, rounded up, mark evidence-loop comprehension as `Strong` or `Mixed`: 5 of 6, 6 of 7, or 6 of 8. |
| Program authority distinction | At least 75% of completed sessions, rounded up, distinguish proof authority, generated demos, review decisions, and planned future targets: 5 of 6, 6 of 7, or 6 of 8. |
| Program trace task | At least 60% of completed sessions, rounded up, trace one repo-owned surface through generation, CI evidence, review governance, and runtime/protocol/native consumption: 4 of 6, 5 of 7, or 5 of 8. |
| Program unresolved confusion limit | Fewer than 2 completed sessions end with unresolved High severity confusion about live SurfaceOps, live JudgmentKit, production API or SDK support, A2UI, or demo authority. |
| Proceed from Wave 1 to Wave 2 | For a 3-session Wave 1, all 3 scorecards must mark evidence-loop comprehension as `Strong` or `Mixed`; for a 4-session Wave 1, at least 3 of 4 must do so. In both cases, all required stimulus-pack tasks must be completed. |
| Revise session guide before Wave 2 | 2 or more Wave 1 scorecards mark authority confusion, demo-as-proof confusion, or production-support confusion as High severity. |
| Retest before Wave 2 | Any Wave 1 session skipped a required stimulus-pack task or failed the boundary sign-off. |
| Treat a signal as recurring | The same acceptance signal or blocker appears in at least 2 sessions. |
| Treat a future target as a proof candidate | At least 2 sessions request the same target and the synthesis can name the missing schema, fixture, diagnostics, command, report or artifact path, evidence path, and gate. |

## First Wave 1 Session Thresholds
Use these thresholds for the first moderated evidence walkthrough before
scheduling the next Wave 1 session. They are research controls only and do not
change proof evidence.

| Decision | Threshold |
| --- | --- |
| Continue with the same walkthrough | Boundary sign-off passes, all required stimulus-pack tasks are completed, evidence-loop comprehension is `Strong` or `Mixed`, and no unresolved High severity confusion remains about demo authority, production adapters, live SurfaceOps, live JudgmentKit, A2UI, SDKs, APIs, or live runtimes. |
| Revise walkthrough before the next session | Required tasks are completed, but one or more Medium or High confusion points can be addressed through docs-only facilitator guidance. |
| Repeat the first-session test | Any required stimulus-pack task is skipped, boundary sign-off fails, evidence-loop comprehension is `Weak` or `Not observed`, or the partner cannot distinguish proof authority from demos by the close. |
| Stop and review data handling | Raw partner material, direct quotes, transcripts, screenshots, source content, credentials, private URLs, partner identity, customer identity, component names, or proprietary examples enter the repo workspace. |

## Acceptance Signal Checklist
Check only signals observed in the session.

| Signal | Observed | Notes |
| --- | --- | --- |
| Partner identifies passing evidence as proof authority | `yes / no / partial / not tested` |  |
| Partner distinguishes demo output from proof authority | `yes / no / partial / not tested` |  |
| Partner understands `review_required` as non-promoted but inspectable | `yes / no / partial / not tested` |  |
| Partner understands `blocked` as a governed outcome, not necessarily a failed command | `yes / no / partial / not tested` |  |
| Partner can identify needed source refs/manifests and classify them as current P2 evidence or planned declared-source proof-candidate work | `yes / no / partial / not tested` |  |
| Partner sees value in deterministic diagnostics for unsupported UI | `yes / no / partial / not tested` |  |
| Partner sees a credible review path without live SurfaceOps claims | `yes / no / partial / not tested` |  |
| Partner sees evaluator value without live JudgmentKit claims | `yes / no / partial / not tested` |  |
| Partner can name a bounded future adapter or target candidate | `yes / no / partial / not tested` |  |

## Blocker Summary
| Blocker category | Severity | Description | Current proof impact | Recommended disposition |
| --- | --- | --- | --- | --- |
| Authority confusion | `High / Medium / Low` |  | `none` |  |
| Evidence or promotion semantics | `High / Medium / Low` |  | `none` |  |
| Source-ingestion fit | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Review workflow fit | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Target or adapter gap | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Privacy, security, or data constraints | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Documentation gap | `High / Medium / Low` |  | `none` |  |

## Research Disposition
| Field | Value |
| --- | --- |
| Overall partner readiness for another test | `High / Medium / Low` |
| Overall signal strength | `High / Medium / Low` |
| Main acceptance signal |  |
| Main blocker |  |
| Recommended next action | `doc update / repeat test / backlog candidate / future proof candidate / out of scope / no action` |
| Why this is not proof impact |  |

## Boundary Sign-Off
| Check | Result | Notes |
| --- | --- | --- |
| Scorecard contains no partner PII or secrets | `pass / needs revision` |  |
| Scorecard contains no proprietary examples, component names, customer names, screenshots, transcripts, direct quotes, source files, credentials, or private URLs | `pass / needs revision` |  |
| Scorecard does not claim implementation support from partner feedback | `pass / needs revision` |  |
| Scorecard does not alter evidence status or promotion status | `pass / needs revision` |  |
| Scorecard does not create SurfaceOps decision state | `pass / needs revision` |  |
| Scorecard does not create JudgmentKit findings | `pass / needs revision` |  |
| Scorecard keeps future targets planned until proof exists | `pass / needs revision` |  |
