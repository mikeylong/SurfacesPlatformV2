# Synthetic Governed Exception Retest

## Status
Planning-only dry run. This readout is synthetic archetype feedback, not partner
evidence, proof authority, customer validation, pilot readiness, production
adoption, or a product workflow claim.

## Retest Scope
The retest used the existing synthetic archetypes against the governed Button
exception path after source-conformance and designer-workflow-trace were updated
to cover expired review metadata.

Evidence inspected:

- `artifacts/source-conformance/evidence.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/evidence.json`
- `fixtures/source-conformance/invalid/review-expired.source-conformance.json`

## First Pass Result
The first pass held for platform/proof, multi-brand governance, and
accessibility/design QA perspectives, but did not fully hold for the AtlasWorks
forked-Button archetype. The weak point was not the block itself; it was that
the trace indexed `SOURCE_REVIEW_EXPIRED` without surfacing the exception
lifecycle in one place.

Required repair:

- expose owner, rationale, approved expiry, expired expiry, and policy source
  ref in the trace;
- distinguish the review-required queue item from the expired blocked row;
- keep the expired row non-executable and blocked from target handoff.

## Second Pass Result
After the lifecycle repair, all four synthetic archetypes marked the
governed-exception path as holding for proof-only use.

The trace now records:

- `sourceConformanceGovernance.exceptionLifecycle.status:
  "expired-blocked"`;
- review-required fixture and queue item id;
- expired fixture with `SOURCE_REVIEW_EXPIRED`;
- owner, approved rationale, expired rationale, approved expiry, and expired
  expiry;
- governance policy source ref;
- `expiredExceptionReviewQueueItemId: null`;
- `expiredExceptionExecutable: false`;
- `renewalRequiredBeforeHandoff: true`;
- `targetHandoffAllowed: false`.

## Remaining Weak Points
- The trace remains index-only; it does not prove live review persistence,
  renewal workflow, production handoff, or partner adoption.
- The scenario id is still the generic Button authority-to-static-handoff path,
  not a dedicated forked Button exception scenario.
- Some trace refs still rely on source-conformance artifacts for source refs.
- `SOURCE_AUTHORITY_CONFLICT` exists as blocked coverage, but precedence and
  conflict resolution are not yet a full proof slice.

## Decision
Proceed to the next proof implementation candidate:

```text
source precedence/conflict: multiple declared Button sources, explicit
precedence rules, unresolved conflict blocking, ambiguous mapping routing to
review, and no policy invention.
```

That candidate should remain proof-only and must add schema, fixture,
diagnostic, report or artifact path, evidence path, and passing proof evidence
before any implementation claim is made.

Follow-up status: the first source-precedence/conflict subset is now implemented
inside the existing source-conformance proof when
`artifacts/source-conformance/evidence.json` passes. It remains proof-only and
does not claim live ingestion, live review workflow, production handoff, or
partner adoption.
