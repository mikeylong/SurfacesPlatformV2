# Synthetic Moderated Product-Designer Walkthrough

## Status
This is a synthetic, non-proof moderated-session readout. It records a dry run
with synthetic company-archetype representatives and a Nielsen Norman
Group-style moderator persona. It does not involve a real Nielsen Norman Group
employee, representative, endorsement, or affiliation.

This readout is not partner evidence, customer validation, proof authority,
SurfaceOps decision state, JudgmentKit output, implementation-pilot readiness,
production adoption, or a self-serve product claim.

## Session Setup
The session tested whether the current Button evidence family can support a
moderated product-designer walkthrough with one representative from each company
archetype:

- Northstar Group: merger-integration enterprise with acquired systems,
  conflicting source authority, terminology drift, and accessibility behavior
  differences.
- AtlasWorks: large enterprise suite with 25+ tools, partial design-system
  adoption, forked UI variants, and pressure for CI gates with governed
  exceptions.
- LumenHouse: seven-brand platform company that needs shared interaction
  governance without flattening brand expression.
- Regulated-services partner: regulated product organization that needs
  auditability, approval evidence, evidence retention, accessibility compliance,
  and release controls.

The moderator used a neutral usability-testing protocol: task-based prompts,
think-aloud reactions, no forced consensus, observed behavior separated from
interpretation, and redirect criteria for production or self-serve overclaims.

## Guardrails Confirmed
All representatives confirmed the session boundaries:

- repo-owned examples only;
- demos are presentation aids, not proof authority;
- P5 protocol/native outputs are proof-only static artifacts;
- no live SurfaceOps, live JudgmentKit, live agents, connectors, production API,
  SDK, runtime, native bridge, adapter, A2UI, implementation pilot, customer
  validation, or production adoption claim.

## Moderator Thresholds
The synthetic moderator defined seven scored tasks:

1. Declare design authority.
2. Compile governed contracts.
3. Generate inside the catalog boundary.
4. Inspect evidence, not pixels.
5. Decide or revise at the authority layer.
6. Hand off only proven target output.
7. Govern changes over time.

Scoring:

- `2`: completes unaided and explains evidence used;
- `1`: partially completes or completes after neutral follow-up;
- `0`: cannot complete, mis-scopes the task, or depends on out-of-scope claims.

Guided walkthrough readiness requires all of the following:

- aggregate score at least `46/56`;
- every task at least `6/8`;
- every representative at least `10/14`;
- no unresolved confusion about evidence versus pixels, authority-layer fixes
  versus generated-output patches, or proof-only static output versus production
  API, SDK, runtime, or A2UI.

## Scorecard
| Representative | Declare | Compile | Generate | Inspect | Decide | Handoff | Govern | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Northstar Group | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 10/14 |
| AtlasWorks | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 10/14 |
| LumenHouse | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 10/14 |
| Regulated-services partner | 1 | 1 | 2 | 1 | 2 | 1 | 1 | 9/14 |
| Task total | 4/8 | 7/8 | 8/8 | 4/8 | 8/8 | 4/8 | 4/8 | 39/56 |

## Session Decision
The session result is:

```text
Revise the walkthrough before product-designer use.
```

The run did not pass the moderator's guided-readiness threshold because:

- aggregate score was `39/56`, below the `46/56` guided-readiness threshold;
- declare-authority, inspect-evidence, handoff, and govern-change tasks each
  scored `4/8`;
- the regulated-services representative scored `9/14`, below the per-person
  `10/14` threshold.

No stop condition was triggered. The session stayed inside proof-only,
repo-owned, synthetic-planning boundaries.

## What Worked
| Signal | Strength | Observation |
| --- | --- | --- |
| Boundary sign-off | High | All representatives understood repo-owned materials, proof-only P5 outputs, and non-production scope. |
| Catalog-bound generation | High | All representatives valued allowed, review-required, and blocked outcomes as safer than prompt-first UI generation. |
| Authority-layer repair | High | All representatives routed fixes to source, mapping, policy, review ownership, or future proof scope instead of downstream demo, protocol, or native patches. |
| Source-conformance evidence family | Medium | The current Button coverage made the walkthrough more credible by showing accepted precedence, ambiguous mapping review, forked exception review, expired review blocking, and authority-conflict blocking. |

## What Failed The Threshold
| Task | Failure pattern | Required revision |
| --- | --- | --- |
| Declare design authority | Representatives could identify current Button authority, but each needed archetype-specific authority context before confidence improved. | Add a front-of-session authority map showing current refs versus missing archetype-specific refs. |
| Inspect evidence, not pixels | `status: "pass"` plus `promotionStatus: "blocked"` or `review_required` remained explainable but easy to misread. | Add a plain-language proof-status versus governance-outcome legend before trace inspection. |
| Hand off only proven target output | Static protocol/native artifacts were useful, but every representative needed repeated proof-only labels. | Add a handoff panel that separates proof-only static output from production API, SDK, runtime, native bridge, adapter, and A2UI requests. |
| Govern changes over time | Representatives understood regeneration in principle but wanted clearer change summaries, history, owners, and retained evidence. | Add a change packet or audit packet view with changed source/policy, affected outcomes, promotion-status change, required owner action, and regenerated evidence path. |
| Cross-step artifact translation | Representatives could reason through JSON evidence, source-conformance rows, review queues, hashes, and static target artifacts only because the moderator translated them into workflow language. | Create a designer-native evidence inspection surface that translates raw artifacts into workflow concepts while preserving evidence as the proof authority. |

## Representative Readouts
| Archetype | Guided walkthrough verdict | Self-serve verdict | Top acceptance signal | Top blocker | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Northstar Group | Strong with moderation | Weak | Can trace Button authority from source conflict through catalog, diagnostics, review routing, and static handoff. | Missing real acquired-system ownership, terminology drift, and accessibility behavior conflict packet. | Add a Northstar-like acquired Button source packet with terminology and accessibility conflicts. |
| AtlasWorks | Strong with moderation | Weak | Can trace a Button exception from source authority through governed catalog, review queue, diagnostics, and blocked or review-required handoff. | No real AtlasWorks source bundle, broader component coverage, or self-serve review surface. | Add an AtlasWorks-like forked Button scenario and `status` / `promotionStatus` legend. |
| LumenHouse | Strong with moderation | Weak | Allowed, review-required, and blocked Button outcomes do not flatten brand exceptions into global authority. | Multi-brand source authority and brand-token or interaction drift are not broadly proven. | Add a LumenHouse-style multi-brand Button scenario with brand-scoped expression and shared interaction policy. |
| Regulated-services partner | Mixed, usable only with strong moderation | Weak | Traceable Button evidence from source authority through diagnostics, proof artifacts, and promotion decision. | Missing approval chain, retention metadata, accessibility signoff, and release-control linkage. | Add a Button audit packet mapping outcome to source, policy, owner, decision evidence, retention, accessibility basis, and release impact. |

## Moderator Observations
- The current Button evidence family is strong enough to sustain a synthetic
  moderated discussion.
- It is not yet strong enough for product-designer use without revised
  facilitator materials.
- The session needs artifact translation: representatives could reason through
  JSON/evidence with moderation, but the walkthrough does not yet provide a
  designer-native surface.
- The weakest tasks are not the core proof mechanics. They are orientation,
  status semantics, target-handoff framing, and change-governance framing.
- Group moderation helped expose shared language problems faster than isolated
  archetype scorecards.

## Required Revisions Before Retest
1. Create a designer-native artifact translation surface for the Button
   walkthrough. It must derive from repo-owned proof artifacts without becoming
   authority, and it must translate source refs, evidence status, diagnostics,
   review queues, hashes, and static target outputs into workflow concepts a
   product designer can inspect.
2. Include a current-versus-missing authority map for the Button scenario.
3. Include a `status` versus `promotionStatus` legend before trace inspection.
4. Include allowed, review-required, and blocked outcome cards backed by the
   source-conformance evidence family.
5. Include a proof-only handoff panel for protocol/native static outputs.
6. Include a change or audit packet view for regenerated evidence, owner
   action, expiry, retention, and release impact.
7. Retest the same moderated group protocol with one representative from each
   archetype in the session, score each representative separately, and require
   the revised pass criteria to pass before calling the walkthrough ready for
   guided product-designer use.

The docs-only planning stimulus for these revisions is
[Button Workflow Workbench](button-workflow-workbench.md). It translates the
repo-owned Button evidence into a moderated inspection flow for retest, but it
does not replace evidence, create proof authority, or implement product
behavior.

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Product claim | `no change`; this is synthetic moderated planning only |
| Future proof candidates | Planning only until a target adds full proof shape and passing evidence |
