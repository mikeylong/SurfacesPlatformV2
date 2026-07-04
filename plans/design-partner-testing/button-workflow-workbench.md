# Button Workflow Workbench

## Status
This is a docs-only planning and stimulus artifact for retesting Required
Revisions Before Retest items 1-6 from
`plans/design-partner-testing/synthetic-moderated-product-designer-walkthrough.md`.

It is not proof authority, product behavior, a live workflow, customer
validation, SurfaceOps decision state, JudgmentKit output, production API, SDK,
runtime, adapter, native bridge, A2UI support, or implementation-pilot
readiness. It translates repo-owned Button evidence for moderated inspection
only.

## Purpose
Give a facilitator a designer-native workbench script for the current
repo-owned Button workflow. The workbench should help a product designer inspect
source authority, governed contracts, outcomes, authority-layer actions,
proof-only static handoff, and change or audit impact without treating the
workbench itself as authority.

The workbench covers:

1. artifact translation for source refs, evidence status, diagnostics, review
   queues, hashes, and static target outputs;
2. current-versus-missing Button authority map;
3. `status` versus `promotionStatus` legend;
4. allowed, review-required, and blocked Button outcome cards;
5. proof-only protocol/native static handoff panel;
6. change or audit packet for regeneration, owner action, expiry, retention,
   and release-impact discussion.

## Inputs
Use only repo-owned references:

- Workflow authority: `VISION.md`, `PLAN.md`,
  `plans/product-designer-workflow.md`, and
  `plans/product-designer-workflow-trace.md`.
- Retest driver:
  `plans/design-partner-testing/synthetic-moderated-product-designer-walkthrough.md`.
- Trace index:
  `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`,
  `artifacts/designer-workflow-trace/trace-selection.json`, and
  `artifacts/designer-workflow-trace/evidence.json`.
- Source conformance:
  `artifacts/source-conformance/source-authority-map.json`,
  `artifacts/source-conformance/source-conformance-report.json`,
  `artifacts/source-conformance/source-review-queue.json`, and
  `artifacts/source-conformance/evidence.json`.
- Authority and catalog:
  `artifacts/p2/evidence.json`, `artifacts/p2/governed-catalog.json`,
  `artifacts/p2/source-inventory.json`, `artifacts/p2/source-mapping.json`,
  and `artifacts/p2/ingestion-report.json`.
- Review and decision context:
  `artifacts/p3/review-queue.json`,
  `artifacts/p4/surfaceops-decision-ledger.json`,
  `artifacts/p4/review-judgment-report.json`, and
  `artifacts/p4/evidence.json`.
- Proof-only static handoff:
  `artifacts/p5/protocol/evidence.json`,
  `artifacts/p5/protocol/protocol-envelope.button.json`,
  `artifacts/p5/native/evidence.json`, and
  `artifacts/p5/native/surfaces-native-packet.button.json`.

## Derived Surface Rules
- Start with the scope banner before any evidence, demo, or handoff artifact.
- Treat design-system source as product authority, the Surfaces Catalog as
  governed contract authority, and passing evidence as proof authority.
- Label the trace report and workbench as index-only translation surfaces.
- Show evidence paths and hashes as references, not as claims created by this
  document.
- Explain `status: "pass"` as proof-contract success only.
- Explain `promotionStatus` as the governed outcome: `allowed`,
  `review_required`, or `blocked`.
- Route unsupported, ambiguous, expired, or review-bound cases to source
  material, mapping, policy, owner review, or future proof scope.
- Do not route fixes to demos, protocol envelopes, native packets, or
  downstream presentation output.
- Show protocol/native artifacts only as inert proof-only static handoff refs
  for accepted evidence.
- Keep expired or blocked governed exceptions out of target handoff.

## Workbench Sections
### Scope Banner
Display first:

```text
This workbench translates repo-owned Button evidence for moderated inspection.
It does not implement a product workflow, live SurfaceOps, live JudgmentKit,
production adapters, APIs, SDKs, runtimes, native bridges, A2UI, customer
validation, pilot readiness, or production adoption.
```

Then show the current trace summary:

| Field | Current repo-owned value |
| --- | --- |
| Scenario | `p2-button-authority-to-static-handoff` |
| Component | `Button` |
| Targets | `surfaces-protocol-static`; `surfaces-native-static` |
| Trace evidence | `artifacts/designer-workflow-trace/evidence.json` |
| Trace status | `pass` |
| Trace promotionStatus | `blocked` |
| Trace authority | index only |

### Authority Map
Show current authority separately from missing adoption-shaped authority.

| Layer | Current Button refs | Missing or not proven here |
| --- | --- | --- |
| Primary Button source | `declared-source://source-conformance/components/button.json#/` | Broader partner-specific source families |
| Supporting Button sources | `button-acquired-a.json`, `button-acquired-b.json`, `button-forked-variant.json` | Real acquired-system ownership and terminology packets |
| Source precedence | `declared-source://source-conformance/policies/source-precedence.json#/` | Broader multi-source reconciliation proof |
| Accessibility policy | `declared-source://source-conformance/policies/accessibility.json#/` | Broader accessibility behavior conflict coverage |
| Review policy | `declared-source://source-conformance/governance/review-policy.json#/` | Live review workflow or persisted decisions |
| Exception policy | `declared-source://source-conformance/governance/exception-policy.json#/` | Production exception approval workflow |
| Contract authority | `artifacts/p2/governed-catalog.json` | Catalog coverage beyond current proven scope |
| Proof authority | Relevant `artifacts/**/evidence.json` files | Customer validation or adoption evidence |

### Governed Contract Summary
Translate the proof chain into designer workflow language:

| Designer question | Evidence-backed answer |
| --- | --- |
| What owns the Button truth? | Declared Button source refs, source-precedence policy, accessibility policy, review policy, exception policy, and accepted P2 catalog evidence. |
| What can be emitted? | Only catalog-backed Button outputs whose fixture and policy checks match accepted evidence. |
| What gets reviewed? | Ambiguous source mapping, brand exception, and declared forked Button exception rows in `source-review-queue.json`. |
| What gets blocked? | Missing or undeclared source refs, unknown components, unresolved authority conflict, undocumented fork drift, missing exception metadata, missing review metadata, expired review, and forbidden production claims. |
| What can be handed off? | Only proof-only static protocol/native Button artifacts backed by their own P5 evidence. |

### Status vs promotionStatus Legend
Use this before trace inspection:

| Field | Meaning | Current examples |
| --- | --- | --- |
| `status: "pass"` | The proof contract matched expectations. | P2, source-conformance, P3, P4, P5 protocol, P5 native, and designer-workflow-trace evidence currently report `pass`. |
| `promotionStatus: "allowed"` | The specific row or decision is allowed inside its proof boundary. | Source-conformance allowed Button rows; P4 approved ledger row. |
| `promotionStatus: "review_required"` | Structurally valid, non-executable output requires human review before unattended promotion. | Source-conformance review queue and P5 aggregate evidence. |
| `promotionStatus: "blocked"` | The governed outcome must not be promoted or handed off. | P4 aggregate evidence and the designer-workflow trace aggregate preserve blocked governance outcomes. |

Facilitator wording:

```text
Pass means the proof behaved as expected. It does not mean every indexed
surface is allowed for unattended promotion. The promotionStatus tells us
whether this specific outcome is allowed, review-required, or blocked.
```

### Allowed/Review-Required/Blocked Outcome Cards
Use three cards in this order. Each card must show the fixture path plus the
moderator-visible report or queue fields below; do not ask the participant to
read raw JSON before they can answer.

Allowed card:

- Show `fixtures/source-conformance/valid/button-source-precedence-accepted.source-conformance.json`.
- Show `artifacts/source-conformance/source-conformance-report.json` fields:
  `promotionStatus: "allowed"`, `diagnosticCodes: []`,
  `selectedSourceRef: "declared-source://source-conformance/components/button.json#/"`,
  and `resolvedBy` value
  `declared-source://source-conformance/policies/source-precedence.json#/`.
- Designer readout: source precedence resolves Button conflicts to the declared
  primary source with no diagnostics.
- Action: proceed inside current proof boundary and keep evidence visible.

Review-required card:

- Show `fixtures/source-conformance/review/source-mapping-ambiguous.source-conformance.json`
  or `fixtures/source-conformance/review/button-forked-exception.source-conformance.json`.
- Show `artifacts/source-conformance/source-review-queue.json` fields:
  `evidencePath: "artifacts/source-conformance/evidence.json"`,
  `promotionStatus: "review_required"`, `executable: false`,
  `owner: "design-systems-governance"`,
  `expiresAt: "1970-01-31T00:00:00.000Z"`, and
  `reviewQueueItemId: "source-review-source-mapping-ambiguous"` or
  `"source-review-button-forked-exception"`.
- Designer readout: ambiguity or declared fork requires non-executable owner
  review with rationale and expiry.
- Action: route to source owner and preserve review metadata before unattended
  promotion.
- Facilitator note: the 1970 dates are deterministic fixture-clock values, not
  live calendar approvals for July 3, 2026. In this proof family,
  `1970-01-31T00:00:00.000Z` is the review-required queue expiry, while
  `1969-12-31T00:00:00.000Z` in the expired-review fixture triggers
  `SOURCE_REVIEW_EXPIRED` and blocked status.

Blocked card:

- Show `fixtures/source-conformance/invalid/source-authority-conflict.source-conformance.json`,
  `fixtures/source-conformance/invalid/review-expired.source-conformance.json`,
  or `fixtures/source-conformance/invalid/button-undocumented-fork-drift.source-conformance.json`.
- Show `artifacts/source-conformance/source-conformance-report.json` fields:
  `promotionStatus: "blocked"` and `diagnosticCodes:
  ["SOURCE_AUTHORITY_CONFLICT"]`, `["SOURCE_REVIEW_EXPIRED"]`, or
  `["SOURCE_EXCEPTION_UNDECLARED"]`.
- Show the matching `jsonPointer`: `/authorityConflict`, `/review/expiresAt`,
  or `/exception/policyRef`.
- Designer readout: conflict, expired review, or undocumented drift cannot be
  promoted even when the proof report itself passes expected invalid fixtures.
- Action: fix source authority, policy, review metadata, or future proof scope
  before handoff.

### Authority-Layer Action Queue
Show actions as planning prompts, not executable work:

| Trigger | Queue language | Owner signal |
| --- | --- | --- |
| Ambiguous Button source mapping | Clarify source precedence or route to review. | `design-systems-governance` |
| Declared forked Button exception | Confirm exception-policy ref, rationale, and expiry. | `design-systems-governance` |
| Expired review metadata | Renew source-owner approval before handoff. | `design-systems-governance` |
| Undocumented fork drift | Declare exception metadata or block promotion. | Source and governance owners |
| Missing partner-specific authority | Record as future proof scope, not current support. | Product and proof planning |

### Proof-Only Handoff Panel
Show after evidence inspection:

| Target | Handoff ref | Evidence | Boundary copy |
| --- | --- | --- | --- |
| Protocol static | `artifacts/p5/protocol/protocol-envelope.button.json` | `artifacts/p5/protocol/evidence.json` | Inert proof-only static protocol envelope, not API, SDK, live service, runtime, adapter, or A2UI. |
| Native static | `artifacts/p5/native/surfaces-native-packet.button.json` | `artifacts/p5/native/evidence.json` | Inert proof-only static native packet, not native SDK, bridge, runtime, adapter, or A2UI. |

Moderator distinction:

```text
The base Button static protocol and native files are inspectable as proof-only
outputs because their own P5 evidence paths exist. That is different from
permission to hand off a blocked or expired governed exception. If the current
row is blocked, the static files can help explain the boundary, but they do not
make the blocked row handoff-allowed.
```

If the current issue is the expired governed exception, state:

```text
The base Button path has proof-only static handoff refs. The expired governed
exception has targetHandoffAllowed: false and must return to the authority
layer before any handoff discussion.
```

### Change/Audit Packet
Use one packet per changed source, policy, review row, or target requirement.

| Packet field | Required prompt |
| --- | --- |
| Changed thing | Which source ref, mapping, policy, review row, or target requirement changed? |
| Affected Button outcome | Did the change affect allowed, review-required, or blocked status? |
| Evidence paths | Which `artifacts/**/evidence.json` files would need regeneration before trust? |
| Owner action | Which source, governance, review, or future-proof owner must act? |
| Expiry or retention | Is there review expiry, approval renewal, or retention metadata to preserve? |
| Release impact | Is this currently blocked from handoff, review-required, or only planning scope? |
| Non-authority note | Which demo, trace, protocol, native, or workbench view must not be treated as authority? |

For retest scoring, the participant must complete this packet for the govern
changes task. A general statement that "we regenerate evidence" is not enough
unless it names the changed thing, owner action, affected outcome, required
evidence paths, expiry or retention metadata, release impact, and
non-authority view.

## Copy Rules
- Say "repo-owned Button evidence", not "customer evidence".
- Say "proof-only static output", not "production handoff".
- Say "index-only trace report", not "designer workflow implementation".
- Say "review-required row", not "approval".
- Say "blocked governed outcome", not "proof failure", when `status` is
  `pass` and `promotionStatus` is `blocked`.
- Say "future proof scope" when a need lacks schema, fixture, diagnostics,
  command, report or artifact path, evidence path, and passing evidence.
- Do not imply live agents, live SurfaceOps, live JudgmentKit, network calls,
  connectors, callbacks, secrets, action execution, production adapters, APIs,
  SDKs, runtimes, native bridges, A2UI, self-serve product readiness, customer
  validation, pilot readiness, or production adoption.

## Acceptance Criteria
- The retest facilitator can use this document to introduce items 1-6 before
  rerunning the moderated session.
- Every workbench section points to repo-owned evidence or explicitly names a
  missing proof scope.
- The workbench distinguishes current authority from missing
  adoption-shaped authority.
- The workbench explains `status` and `promotionStatus` before asking a
  participant to inspect the trace.
- The workbench includes one allowed, one review-required, and one blocked
  Button outcome from the source-conformance evidence family.
- The handoff panel labels protocol/native Button outputs as proof-only static
  artifacts and keeps blocked governed exceptions out of handoff.
- The change/audit packet routes updates to source, mapping, policy, review
  ownership, regeneration, or future proof scope.
- The document makes no implementation, proof, customer-validation, live
  workflow, production, API, SDK, runtime, adapter, native bridge, A2UI, live
  SurfaceOps, or live JudgmentKit claim.

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| Schemas, fixtures, diagnostics, commands, artifacts, demos, or source refs | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Proof authority | `no change`; evidence files remain authority |
| Retest readiness | Planning stimulus only for a moderated retest |
| Future proof candidates | No claim until a target adds schema, fixture, diagnostics, command, report or artifact path, evidence path, CI gate, and passing evidence |

This evidence-impact table applies only to this docs-only workbench. If these
docs are committed with schema, fixture, source, generated artifact, source
code, or test changes, verify those changes with their relevant proof gate.
