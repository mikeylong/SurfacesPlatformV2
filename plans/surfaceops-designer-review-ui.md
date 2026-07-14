# SurfaceOps Designer Review UI Proof Target

## Status
Implemented as a non-numbered target proof. Proof authority is
`artifacts/surfaceops-designer-review-ui/evidence.json`.

This target is the first local-live SurfaceOps designer review loop for Button
variants. It consumes accepted designer-workflow-trace evidence, accepted P4
decision evidence, and accepted `surfaceops-kanban-live` evidence, then proves a
SurfaceOps-owned workbench, inspector, structured decision receipt, and
mirror-only return to a real local `kanban.cards` card.

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
schemas/surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json
```

Fixture root:

```text
fixtures/surfaceops-designer-review-ui/
```

Current fixture coverage includes valid workbench, decision receipt, and mirror
cases; a review-required local-live kanban boundary; invalid target, evidence,
authority, hidden decision, mirror override, and production adapter claims; and
preflight/evidence-hash mutations.

## Browser Proof

The browser-functional proof starts:

- a real local `kanban.cards` server at pinned commit
  `3b2a6f78693f0032439a1149eaed896f532aac09`;
- a proof-only loopback SurfaceOps review server;
- Chromium with video recording.

The proof creates a live `SurfaceOps Designer Review` board, a `Button variants`
card in `Needs Review`, opens the card, opens the SurfaceOps review URL, submits
a structured decision receipt, mirrors the receipt back to the live card, checks
SSE/event-history evidence, verifies restart persistence, and writes video,
screenshot, transcript, redacted API log, binding, runtime receipt, mirror
result, browser report, and browser evidence.

Browser pages do not receive kanban bearer tokens. The SurfaceOps loopback
server owns the kanban credentials and performs mirror writes server-side.

## Authority Boundary

- SurfaceOps owns the review decision and receipt.
- `kanban.cards` owns collaboration board state only.
- Kanban lane movement is a mirror/collaboration signal and does not commit a
  SurfaceOps decision.
- Surfaces evidence remains proof authority.
- Production adapter behavior is not implemented here.

## Acceptance Criteria

- `artifacts/surfaceops-designer-review-ui/evidence.json` records
  `status: "pass"`.
- The evidence self-hash matches the final artifact ref.
- The target emits all deterministic artifacts listed above.
- The workbench exposes the kanban card, SurfaceOps DAG, inspector, decision
  panel, evidence refs, and mirror plan.
- The decision receipt contains selected variant, rationale, mirrored kanban
  status, evidence refs, and explicit authority.
- Browser-functional evidence passes and records the real local kanban card,
  SurfaceOps receipt, mirror update, event replay, and restart persistence.

## Non-Goals

This proof does not implement production SurfaceOps, production `kanban.cards`,
production auth, hosted persistence, webhooks, broad production sync, conflict
record storage, mapping-store persistence, A2UI, SDKs, live JudgmentKit, work
execution, public product adoption, or customer validation.
