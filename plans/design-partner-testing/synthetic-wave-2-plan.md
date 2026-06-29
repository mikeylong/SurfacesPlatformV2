# Synthetic Wave 2 Plan

## Status
This is a synthetic, non-proof planning document. It designs the next dry run for
synthetic design-partner testing. It does not create proof authority, partner
evidence, product commitments, schemas, fixtures, diagnostics, commands,
generated artifacts, demos, CI gates, SurfaceOps decisions, or JudgmentKit
findings.

## Objective
Synthetic Wave 2 should test whether the strongest synthetic Wave 1 planning
signals still appear under harder adoption constraints.

Synthetic Wave 1 suggested that the governance/evidence loop can be understood
and may be valuable to design-system teams. It did not validate market demand,
real partner comprehension, or implementation readiness. Wave 2 should test the
next planning question:

```text
What concrete proof shape would make Surfaces credible enough for a real design
partner to begin an implementation-oriented pilot?
```

## Hypotheses
Wave 2 should test these hypotheses:

- Teams will continue to understand Surfaces as proof infrastructure if the
  pitch stays focused on evidence before promotion.
- The highest-value next proof is broader real-source ingestion tied to CI
  conformance, not another presentation demo.
- Accessibility, behavior, terminology, brand expression, and governance
  ownership must be represented as first-class policy, diagnostics, and review
  requirements.
- Partners will accept a non-production proof if it clearly names the missing
  path to production adapters, APIs, SDKs, or runtimes.

## Synthetic Partner Set
Use the same three partner archetypes from Wave 1, with harder prompts, and add
a fourth regulated-services archetype so thresholds are unambiguous.

Reusing Wave 1 archetypes is only a synthetic stress-testing device for comparing
dry-run signals. It does not change real Wave 2 recruiting rules in
[Curated Design-Partner Testing Program](../design-partner-testing.md): real
partners should still be selected after Wave 1 synthesis based on adjacent but
not identical workflows, partner readiness, and proof-boundary fit.

| Synthetic partner | Wave 2 stressor | What to test |
| --- | --- | --- |
| Northstar Group | Three acquired systems have overlapping components, conflicting terminology, inconsistent accessibility behavior, and competing source authority across Figma, Storybook, and docs. | Can Surfaces express multi-system authority reconciliation without inventing policy? |
| AtlasWorks | Business units have partial design-system adoption and need CI gates that support exceptions without weakening compliance. | Can Surfaces support conformance gates, exception workflows, and accessibility diagnostics as proof requirements? |
| LumenHouse | Seven brands need shared interaction governance with brand-specific tokens, components, and campaign flexibility. | Can Surfaces separate shared interaction policy from brand expression without claiming A2UI or runtime support? |
| Regulated-services partner | Regulated product teams need auditability, approvals, and evidence retention before any generated UI reaches users. | Can Surfaces articulate audit and approval value without claiming live SurfaceOps or production workflow support? |

## Harder Stimulus Pack
Use the same current-proof boundary from Wave 1, but add these harder
constraints:

- The partner has more than one design-system source of truth.
- Source refs conflict or overlap across Figma, Storybook, docs, and component
  code.
- Accessibility and behavior policy matter as much as visual component shape.
- Some generated UI should be blocked, some should be review-required, and some
  should be allowed only under target-specific proof.
- The partner asks for a production-facing path, but the current Surfaces scope
  remains proof-only.

The stimulus should ask each synthetic partner to choose:

- the first source family they would want ingested;
- the minimum component/pattern coverage for a credible pilot;
- the first CI gate or conformance check they would try;
- the governance owner for diagnostics and review-required states;
- the downstream target that matters most;
- the one current proof limitation that would block a real pilot.

Before showing any candidate frontier such as broader ingestion plus CI
conformance, ask each synthetic partner for unaided priorities. Then show the
candidate frontiers and record whether convergence existed before facilitator
framing, appeared only after facilitator framing, or did not appear.

## Session Questions
Ask each synthetic partner:

1. Before seeing any candidate roadmap frontier, what is the first proof target
   you would need to consider a credible pilot, if any?
2. Is there no credible pilot yet under the current proof-only scope? If so,
   what missing proof shape blocks the conversation?
3. If Surfaces could ingest one real source family next, should it be Figma,
   Storybook, docs, Code Connect, component code, or a declared source bundle?
4. What minimum component, token, accessibility, and behavior coverage would
   make the pilot credible?
5. Which diagnostics would need to block generated UI versus route it to review?
6. Who in your organization owns the decision to resolve review-required output?
7. What would a CI conformance proof need to emit for your engineers to trust
   it?
8. Which downstream target matters first: web runtime projection, protocol,
   native, React/web conformance, API/SDK, A2UI, or review workflow?
9. After hearing candidate frontiers, did your priority change? Record
   `converged_before_framing`, `converged_after_framing`, or `no_convergence`.
10. What phrase in the Surfaces pitch still risks overclaiming current scope?
11. Would you proceed to a real design-partner conversation after this synthetic
   session?

## Per-Partner Proof-Shape Worksheet
Complete one worksheet per synthetic partner. The worksheet captures future proof
candidates only. It must not be read as implemented production adapter, API,
SDK, A2UI, live SurfaceOps, or live JudgmentKit support.

### Northstar Group
| Field | Planning capture |
| --- | --- |
| Target | Candidate multi-source ingestion reconciliation proof. |
| Source family | Unaided partner priority first; likely Figma, Storybook, docs, component code, Code Connect, or declared source bundle after framing. |
| Minimum scope | Overlapping components across acquired systems, token conflicts, terminology conflicts, accessibility behavior conflicts, and source-authority precedence. |
| Schema/fixture needs | Target-specific schemas and fixtures for source manifests, conflict cases, manual mappings, authority precedence, review-required reconciliation, expectations, and evidence. |
| Diagnostics | Missing source refs, conflicting authority, ambiguous mapping, incompatible accessibility behavior, terminology collision, unsupported component, and governance-incomplete policy. |
| Command contract | Future deterministic proof command with POSIX-relative source, fixture, and output roots; no live source API calls or crawler behavior unless separately proved. |
| Artifact/report | Source inventory, source mapping, reconciliation report, governed catalog or catalog delta, and target report under a future proof-owned output root. |
| Evidence path | Future target-specific evidence path only after the proof shape exists; no current evidence change. |
| CI gate | Future target-specific CI gate that validates source hashes, fixtures, diagnostics, report rows, artifacts, and final evidence. |
| Non-goals | No live ingestion, production adapter, API, SDK, A2UI, live SurfaceOps, live JudgmentKit, or policy invention. |
| Blocker | Current proof covers a bounded Spectrum source bundle only, not multi-system reconciliation. |

### AtlasWorks
| Field | Planning capture |
| --- | --- |
| Target | Candidate CI conformance and exception-routing proof. |
| Source family | Unaided partner priority first; likely Storybook, component code, docs, Code Connect, Figma, or declared source bundle after framing. |
| Minimum scope | Representative component set, token and prop rules, accessibility checks, behavior policy, exception cases, and governance owner routing. |
| Schema/fixture needs | Target-specific schemas and fixtures for conformance checks, exception requests, review-required routing, expectations, diagnostics, reports, and evidence. |
| Diagnostics | Compliance blocker, accessibility blocker, behavior-policy blocker, exception requires review, missing governance owner, stale evidence, and unsupported target. |
| Command contract | Future deterministic conformance proof command that emits report/evidence only and does not execute production CI side effects. |
| Artifact/report | Conformance report, exception review rows, diagnostics report, accepted/rejected fixture results, and evidence-bound target artifacts. |
| Evidence path | Future target-specific evidence path only after the proof shape exists; no current evidence change. |
| CI gate | Future proof-bearing package or workflow gate that fails closed on invalid, stale, missing, or review-required unattended output. |
| Non-goals | No production CI integration claim, live workflow, API, SDK, live SurfaceOps, live JudgmentKit, A2UI, or runtime support. |
| Blocker | Current evidence does not prove broader component coverage or operational conformance gates. |

### LumenHouse
| Field | Planning capture |
| --- | --- |
| Target | Candidate multi-brand governance proof. |
| Source family | Unaided partner priority first; likely Figma variables/components, docs, Storybook, component code, Code Connect, or declared source bundle after framing. |
| Minimum scope | Shared interaction policy, brand-specific tokens, brand variants, campaign exceptions, accessibility requirements, and review-required brand overrides. |
| Schema/fixture needs | Target-specific schemas and fixtures for brand policy, token scopes, variant compatibility, exception routing, expectations, diagnostics, reports, and evidence. |
| Diagnostics | Brand-token conflict, unsupported brand variant, shared-interaction violation, campaign exception requires review, missing source ref, and governance-incomplete policy. |
| Command contract | Future deterministic proof command for brand-governance extraction or conformance; no live runtime, A2UI, or production adapter behavior. |
| Artifact/report | Brand policy mapping, governed catalog or projection delta, brand-governance report, diagnostics report, and evidence-bound target artifacts. |
| Evidence path | Future target-specific evidence path only after the proof shape exists; no current evidence change. |
| CI gate | Future target-specific gate for brand policy fixtures, diagnostics, generated reports, and final evidence. |
| Non-goals | No A2UI export/conformance, production runtime, production adapter, API, SDK, live SurfaceOps, live JudgmentKit, or brand policy invention. |
| Blocker | Current proof does not cover multi-brand token or policy governance. |

### Regulated-Services Partner
| Field | Planning capture |
| --- | --- |
| Target | Candidate audit, approval, and evidence-retention proof. |
| Source family | Unaided partner priority first; likely docs, component code, Storybook, Figma, Code Connect, or declared source bundle after framing. |
| Minimum scope | Approved component set, accessibility policy, approval records as deterministic fixtures, evidence retention refs, review-required cases, and audit report fields. |
| Schema/fixture needs | Target-specific schemas and fixtures for approval rows, audit evidence refs, retention metadata, review-required routing, expectations, diagnostics, reports, and evidence. |
| Diagnostics | Missing approval ref, stale evidence, audit-retention gap, accessibility blocker, unsupported component, ambiguous policy, and live-workflow request out of scope. |
| Command contract | Future deterministic audit proof command that emits inert approval/evidence artifacts only and does not persist live SurfaceOps workflow state. |
| Artifact/report | Audit report, approval fixture results, evidence-retention refs, diagnostics report, and target evidence-bound artifacts. |
| Evidence path | Future target-specific evidence path only after the proof shape exists; no current evidence change. |
| CI gate | Future target-specific gate that verifies approval fixtures, audit diagnostics, artifact hashes, and final evidence. |
| Non-goals | No live SurfaceOps persistence, live JudgmentKit invocation, production workflow, production adapter, API, SDK, A2UI, or runtime support. |
| Blocker | Current P4 proves deterministic decision artifacts only, not live approvals or retained operational review state. |

## Success Criteria
Wave 2 is successful if:

- at least 3 of 4 synthetic partners still report `Strong` or `Mixed`
  evidence-loop comprehension;
- at least 3 synthetic partners can name a concrete next proof target with
  required source, diagnostic, command, artifact/report, evidence, and CI
  expectations;
- at least 2 synthetic partners converge unaided on the same first
  implementation frontier, or the synthesis explicitly records that convergence
  happened only after facilitator framing;
- no synthetic partner treats current static protocol/native outputs as
  production API, SDK, A2UI, or runtime support after clarification;
- the synthesis allows `no credible pilot yet` as a valid outcome and records
  the missing proof shape for any partner who selects it.

## Expected Patterns To Confirm Or Reject
Confirm:

- whether broader ingestion plus CI conformance is the highest-value next proof;
- accessibility and behavior diagnostics are required for credibility;
- governance ownership needs clearer product language;
- production adapter path matters, but should remain future proof work.

Reject or revise if:

- partners cannot understand the proof-only boundary under harder constraints;
- partners only value a live product, not proof artifacts;
- all partners diverge on the next proof frontier;
- convergence appears only after facilitator framing and not in unaided
  priorities;
- at least 2 partners choose `no credible pilot yet`;
- the pitch continues to imply production behavior despite corrections.

## Planned Synthesis Output
The Wave 2 synthesis should produce:

- a ranked next-proof shortlist;
- one recommended first implementation frontier;
- the minimum credible pilot coverage;
- pitch language that survived synthetic partner scrutiny;
- blockers that must be resolved before real design-partner outreach;
- explicit non-goals that still need to be repeated in real sessions.

## Recommended Wave 2 Decision Rule

### Continue
Continue only if all of these are true:

- At least 3 of 4 partners show `Strong` or `Mixed` comprehension.
- At least 2 partners converge unaided on one proof frontier.
- No partner mistakes current static outputs for production API, SDK, A2UI, or
  runtime support after clarification.

Follow-up: treat the unaided convergence frontier as the leading next proof
candidate, still planning-only until it has schema, fixture, diagnostics,
command, artifact/report, evidence, demo boundary where applicable, and CI gate.

### Revise
Revise if comprehension is sufficient, but any of these are true:

- Convergence appears only after facilitator framing.
- Partners split across unrelated frontiers.
- Exactly 1 partner selects `no credible pilot yet`.

Follow-up: rewrite prompts or candidate frontiers, preserve divergent target
variants, and run another synthetic pass before recommending real Wave 2
outreach.

### Pause
Pause if any of these are true:

- Fewer than 3 partners show `Strong` or `Mixed` comprehension.
- At least 2 partners select `no credible pilot yet`.
- Any partner continues to read current static outputs as production API, SDK,
  A2UI, runtime, live SurfaceOps, or live JudgmentKit support after
  clarification.

Follow-up: do not proceed to real Wave 2 recruiting. Fix pitch, proof-boundary
language, and missing proof-shape framing first.

All three decisions remain synthetic planning outcomes only. They do not create
production API, SDK, A2UI, runtime, live SurfaceOps, or live JudgmentKit claims.

If production adapter/API/SDK demand dominates the feedback, require a written
intermediate proof plan before any product claim changes. If multi-brand,
merger-specific, regulated, or CI-specific needs appear as variants of the same
unaided frontier, preserve those as target variants rather than starting separate
roadmap branches immediately.

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | Planning-only until full proof shapes and passing evidence exist. |
