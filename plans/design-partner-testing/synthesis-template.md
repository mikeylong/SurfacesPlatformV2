# Design Partner Synthesis Template

## Status
This synthesis is a non-proof research summary. It rolls up anonymized
design-partner testing captures and scorecards so planning can see patterns
without changing Surfaces proof authority.

The synthesis does not create or update schemas, fixtures, diagnostics,
artifacts, demos, evidence, SurfaceOps decision ledgers, JudgmentKit-shaped
reports, source material, source refs, promotion status, or proof command
behavior.

## Inputs
Use only anonymized, reviewed research inputs from an approved private
workspace. Completed captures, scorecards, transcripts, recordings, screenshots,
and raw notes stay outside this repo by default.

- completed `plans/design-partner-testing/results-capture.md` copies or notes;
- completed `plans/design-partner-testing/scorecard.md` copies or notes;
- read-only references to current proof evidence and demos;
- approved paraphrased, de-identified synthesis statements.

Do not include raw recordings, private partner content, source exports, secrets,
private URLs, customer data, transcripts, direct quotes, screenshots, completed
session notes, or unreviewed notes in this repo.

## Synthesis Metadata
| Field | Value |
| --- | --- |
| Synthesis id | `dpt-synthesis-YYYYMMDD-##` |
| Created at UTC | `YYYY-MM-DDTHH:MM:SSZ` |
| Synthesizer alias | `synthesizer-##` |
| Session ids included |  |
| Session ids excluded |  |
| Exclusion reasons |  |
| Proof snapshot referenced |  |
| Evidence paths referenced read-only |  |
| Demo paths referenced read-only |  |

## Required Boundary Statement
Copy this statement into every completed synthesis:

Partner testing signals are research inputs only. They do not affect evidence
`status`, `promotionStatus`, SurfaceOps decision ledgers, JudgmentKit-shaped
reports, generated artifacts, generated demos, schemas, fixtures, diagnostics,
source refs, artifact hashes, or proof authority. Any partner-requested
capability remains planned until a future phase or target defines and passes a
complete proof shape.

## Executive Summary
- Sessions synthesized:
- Partner segments represented:
- Strongest acceptance pattern:
- Most important blocker:
- Most likely documentation follow-up:
- Most likely future proof candidate:
- Explicitly out-of-scope pattern:

## Wave 1 Disposition
Use this section after the first Wave 1 session and again after the Wave 1
batch. Dispositions are research planning decisions only; they do not change
proof status, promotion status, evidence, demos, artifacts, schemas, fixtures,
SurfaceOps decisions, or JudgmentKit-shaped reports.

| Decision point | Disposition | Evidence for disposition | Required next step | Proof impact |
| --- | --- | --- | --- | --- |
| First Wave 1 session readiness | `continue / revise guide / repeat test / stop and review data handling` |  |  | `none / requires future full proof shape` |
| Boundary and data handling | `clean / needs revision / incident review` |  |  | `none` |
| Required stimulus-pack completion | `complete / incomplete` |  |  | `none` |
| Evidence-loop comprehension | `Strong / Mixed / Weak / Not observed` |  |  | `none` |
| Future proof candidates | `none / candidate identified / out of scope` |  |  | `planning only until full proof exists` |

Disposition rules:
- Choose `continue` only if boundary sign-off passed, required stimulus-pack
  tasks were completed, no raw partner material entered the repo, and the
  scorecard marks evidence-loop comprehension as `Strong` or `Mixed`.
- Choose `revise guide` when the session completed but produced Medium or High
  confusion that a docs-only clarification could address before the next Wave 1
  session.
- Choose `repeat test` when a required task was skipped, boundary sign-off was
  incomplete, or the scorecard marks evidence-loop comprehension as `Weak` or
  `Not observed`.
- Choose `stop and review data handling` if raw partner material, direct quotes,
  transcripts, screenshots, source content, credentials, private URLs, partner
  identity, or proprietary examples entered the repo workspace.

## Pattern Summary
| Pattern id | Pattern | Supporting sessions | Signal type | Priority | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `pat-001` |  |  | `acceptance / blocker / question / workflow / target request / boundary confusion` | `High / Medium / Low` | `High / Medium / Low` |  |

Pattern rules:
- Require at least two supporting sessions for a cross-partner pattern unless
  the synthesis labels it as a single-session signal.
- Separate observed behavior from facilitator inference.
- Do not upgrade a pattern into an implementation claim.
- Use `High`, `Medium`, and `Low` for priority, impact, or severity labels.

## Acceptance Signals By Theme
| Theme | Supporting signals | Partner value indicated | Confidence | Follow-up |
| --- | --- | --- | --- | --- |
| Evidence-backed trust |  |  | `High / Medium / Low` |  |
| Design-system authority fit |  |  | `High / Medium / Low` |  |
| Review-required workflow fit |  |  | `High / Medium / Low` |  |
| Diagnostics clarity |  |  | `High / Medium / Low` |  |
| Target or adapter pull |  |  | `High / Medium / Low` |  |

Acceptance synthesis guidance:
- Treat acceptance as willingness to continue testing or confidence in the model,
  not as approval or promotion.
- Preserve the distinction between proof authority and product interest.
- Note when acceptance depends on a future proof target.

## Blockers By Theme
| Theme | Severity | Supporting blockers | Current proof impact | Disposition |
| --- | --- | --- | --- | --- |
| Authority confusion | `High / Medium / Low` |  | `none` |  |
| Evidence or promotion semantics | `High / Medium / Low` |  | `none` |  |
| Source-ingestion requirements | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Review workflow requirements | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Runtime, protocol, native, or adapter requirements | `High / Medium / Low` |  | `none / future proof candidate only` |  |
| Privacy, procurement, or data constraints | `High / Medium / Low` |  | `none / future proof candidate only` |  |

Blocker synthesis guidance:
- Do not mark current evidence as failed because a partner reported a blocker.
- Link blockers to future proof candidates only when the requested behavior can
  be bounded by schemas, fixtures, diagnostics, commands, artifacts, and
  evidence.
- Label requests that would override catalog authority, execute work orders,
  create hidden review state, or invoke live evaluators as out of scope unless a
  later proof explicitly defines them.

## Surface And Phase Readout
| Surface or phase | What partners understood | What partners challenged | Follow-up disposition |
| --- | --- | --- | --- |
| P0 catalog contract |  |  |  |
| P1 runtime projection |  |  |  |
| P2 source ingestion |  |  |  |
| P3 inert orchestration |  |  |  |
| P4 SurfaceOps and JudgmentKit-shaped proof |  |  |  |
| P5 protocol static |  |  |  |
| P5 native static |  |  |  |
| Future target candidates |  |  |  |

## Follow-Up Disposition Register
| Disposition id | Source pattern ids | Disposition | Owner alias | Due date | Next step | Proof impact |
| --- | --- | --- | --- | --- | --- | --- |
| `disp-001` | `pat-001` | `doc update / repeat test / backlog candidate / future proof candidate / out of scope / no action` |  |  |  | `none / requires future full proof shape` |

Disposition guidance:
- `doc update`: clarify existing proof status, phase boundaries, or value
  narrative without changing proof contracts.
- `repeat test`: gather more partner evidence before planning.
- `backlog candidate`: track product interest without claiming support.
- `future proof candidate`: define later only through full proof-contract shape.
- `out of scope`: preserve current authority boundaries.
- `no action`: keep for traceability only.

## Evidence Impact Statement
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | `planning only until full proof exists` |

## Final Review Checklist
| Check | Result | Reviewer alias | Notes |
| --- | --- | --- | --- |
| All inputs are anonymized and consent-compatible | `pass / needs revision` |  |  |
| Synthesis uses only reviewed research inputs | `pass / needs revision` |  |  |
| No proof authority is created or changed | `pass / needs revision` |  |  |
| No SurfaceOps decision state is created or changed | `pass / needs revision` |  |  |
| No JudgmentKit finding or report is created or changed | `pass / needs revision` |  |  |
| Planned capabilities remain clearly labeled as planned | `pass / needs revision` |  |  |
| High, Medium, and Low labels are used for priority or severity | `pass / needs revision` |  |  |
