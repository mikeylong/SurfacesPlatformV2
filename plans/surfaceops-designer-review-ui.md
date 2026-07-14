# SurfaceOps Designer Review UI Proof Target

## Status
Implemented as a non-numbered target proof. Proof authority is
`artifacts/surfaceops-designer-review-ui/evidence.json`.

This target is the first local-live SurfaceOps designer review loop for Button
variants. It consumes accepted designer-workflow-trace evidence, accepted P4
review evidence as context rather than Button handoff authority, and accepted
`surfaceops-kanban-live` evidence, then proves a SurfaceOps-owned workbench,
inspector, structured decision receipt, and
mirror-only return to a real local `kanban.cards` card.

The tracked proof records `status: "pass"` with `promotionStatus: "blocked"`.
The accepted designer trace records `targetHandoffAllowed: false` and
`SOURCE_REVIEW_EXPIRED`. The workbench therefore remains available for
inspection, disables approve and request-refinement, and enables only a
rationale-required block. The receipt and kanban mirror remain `blocked`; this
target emits no variant-of-record or handoff.

It is not P5, not A2UI, and not production adapter proof.

## Command

```bash
npm run proof:surfaceops-designer-review-ui
```

The expanded command is:

```bash
interfacectl surfaces surfaceops-designer-review-ui proof \
  --designer-evidence artifacts/designer-workflow-trace/evidence.json \
  --designer-report artifacts/designer-workflow-trace/designer-workflow-trace-report.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --kanban-live-evidence artifacts/surfaceops-kanban-live/evidence.json \
  --kanban-live-operation-plan artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json \
  --fixture fixtures/surfaceops-designer-review-ui \
  --out artifacts/surfaceops-designer-review-ui
```

Browser-functional proof:

```bash
npm run proof:surfaceops-designer-review-ui:browser
```

## Deterministic Artifacts

```text
artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-target-selection.json
artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-workbench.json
artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-decision-receipt.json
artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json
artifacts/surfaceops-designer-review-ui/evidence.json
```

Generated presentation output:

```text
demo/surfaceops-designer-review-ui/README.md
demo/surfaceops-designer-review-ui/index.html
```

Runtime browser evidence is intentionally ignored by git and written under:

```text
output/playwright/surfaceops-designer-review-ui/
```

## Schemas And Fixtures

Owned schemas:

```text
schemas/surfaceops-designer-review-ui-target-selection.v0.schema.json
schemas/surfaceops-designer-review-workbench.v0.schema.json
schemas/surfaceops-designer-review-decision-receipt.v0.schema.json
schemas/surfaceops-designer-review-ui-report.v0.schema.json
schemas/surfaceops-designer-review-ui-evidence.v0.schema.json
schemas/surfaceops-designer-review-ui-expectations.v0.schema.json
schemas/surfaceops-designer-review-ui-fixture.v0.schema.json
schemas/surfaceops-designer-review-ui-diagnostics.v0.schema.json
schemas/surfaceops-designer-review-ui-browser-functional-report.v0.schema.json
schemas/surfaceops-designer-review-ui-browser-functional-transcript.v0.schema.json
schemas/surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json
schemas/surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json
schemas/surfaceops-designer-review-ui-kanban-binding-runtime.v0.schema.json
schemas/surfaceops-designer-review-decision-receipt-runtime.v0.schema.json
schemas/surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0.schema.json
```

Fixture root:

```text
fixtures/surfaceops-designer-review-ui/
```

Core workbench, decision-receipt, and browser-functional records use closed
schemas. Current fixture coverage includes valid blocked workbench,
decision-receipt, and mirror cases; a review-required local-live kanban
boundary; invalid target, evidence, authority, hidden decision, mirror
override, handoff-while-blocked, refinement-while-blocked, and production
adapter claims; and preflight/evidence-hash mutations.
Fixture expectation rows are compared with diagnostics independently derived
from fixture content. Mutation cases mechanically change the preflight or
evidence input before evaluation instead of declaring their own diagnostic.

## Browser Proof

The browser-functional proof starts:

- a real local `kanban.cards` server at pinned commit
  `3b2a6f78693f0032439a1149eaed896f532aac09`;
- a proof-only loopback SurfaceOps review server;
- Chromium with video recording.

The proof creates a live `SurfaceOps Designer Review` board, a `Button variants`
card in `Needs Review`, opens the card, opens the SurfaceOps review URL, verifies
that approve and request-refinement are disabled, submits rationale for the
enabled block action, mirrors the blocked receipt back to the live card, checks
one identical sequential replay against the same running proof server returns
the same receipt and mirror without another card update or comment, rejects one
sequential conflicting replay, checks SSE/event-history evidence, verifies
kanban restart persistence, and writes video, screenshot, transcript, redacted
API log, binding, runtime receipt, mirror result, browser report, and browser
evidence. Before interaction, the gate schema-validates the deterministic
evidence, workbench, and receipt and verifies their evidence-bound hashes.
Credential instrumentation checks outbound browser requests, captured response
headers and bodies, full page HTML, browser storage, and cookies. The final
closure check reads and schema-validates the persisted report, transcript, API
log, binding, runtime receipt, mirror result, and evidence; it then cross-checks
their binding, receipt, mirror, evidence-hash, and report/evidence relationships
against the exact ordered runtime refs and hashes.

Browser pages do not receive kanban bearer tokens. The SurfaceOps loopback
server owns the kanban credentials and performs mirror writes server-side. These
checks prove only the bounded local-live loopback scenario.

## Authority Boundary

- SurfaceOps owns the review decision and receipt.
- `kanban.cards` owns collaboration board state only.
- Kanban lane movement is a mirror/collaboration signal and does not commit a
  SurfaceOps decision.
- Upstream `targetHandoffAllowed: false` and `SOURCE_REVIEW_EXPIRED` keep approve
  and request-refinement disabled while preserving inspection and the explicit
  block path.
- The blocked receipt does not select a variant of record or authorize handoff.
- Surfaces evidence remains proof authority.
- Production adapter behavior is not implemented here.

## Acceptance Criteria

- `artifacts/surfaceops-designer-review-ui/evidence.json` records
  `status: "pass"`.
- The evidence self-hash matches the final artifact ref.
- The target emits all deterministic artifacts listed above.
- The workbench exposes the kanban card, SurfaceOps DAG, inspector, decision
  panel, disabled approval/refinement actions, `SOURCE_REVIEW_EXPIRED`, evidence
  refs, and the blocked mirror plan.
- The decision receipt contains rationale, blocking diagnostics, mirrored
  `blocked` status, evidence refs, and explicit authority, with no
  variant-of-record or handoff.
- Fixture expectations are checked independently and mutation cases alter the
  proof inputs they claim to test.
- Deterministic and browser evidence validate the full declared ref closure and
  every recorded hash.
- Browser proof rejects approval and refinement while governance is blocked,
  proves one identical sequential replay is idempotent within the same running
  proof server, and rejects one sequential conflicting replay.
- Credential-leak checks cover outbound browser requests, captured response
  headers and bodies, full HTML, browser storage, and cookies.
- Persisted browser report, transcript, API log, binding, runtime receipt,
  mirror result, and evidence files are schema-validated, cross-checked, and
  bound to the exact ordered runtime ref closure.
- Browser-functional evidence passes and records the real local kanban card,
  SurfaceOps blocked receipt, mirror update, event replay, and restart
  persistence.

## Non-Goals

This proof does not implement production SurfaceOps, production `kanban.cards`,
production auth, hosted persistence, webhooks, broad production sync, conflict
record storage, mapping-store persistence, A2UI, SDKs, live JudgmentKit, work
execution, public product adoption, or customer validation. Its sequential
same-server replay check does not prove concurrent idempotency, partial-failure
retry recovery, or idempotency across SurfaceOps server restarts.
