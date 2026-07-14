# SurfaceOps Button Variants Journey

## Status
This is a subordinate product journey and prototype-planning document for the
`kanban.cards` -> SurfaceOps Button variants workflow. [VISION.md](../VISION.md)
remains canonical for the Surfaces Platform authority model, roadmap sequence,
surface roles, and implemented proof status.

This document is product and prototype planning, not implementation proof.
Implemented capability claims still come from the evidence-backed proof docs.
The prototype described here may use session-local UI state to demonstrate the
journey; that state is illustrative.

## Product Thesis
A designer should be able to start in the concrete `kanban.cards` work queue,
open a `Button variants` card, and move into SurfaceOps for the authoritative
visual review and decision.

`kanban.cards` helps the team find and coordinate the work. SurfaceOps owns the
review truth: canonical media, interpreted deltas, evidence refs, diagnostics,
notes, decisions, audit receipt, handoff eligibility, and the selected Button
variant of record.

The journey should make that ownership visible without forcing the designer to
read raw JSON first. The primary review activity is visual comparison, supported
by plain-language contract deltas and evidence refs.

## Actors
| Actor | Role In Journey | Authority Boundary |
| --- | --- | --- |
| Product designer | Reviews AI-agent or human-created Button variants, compares visuals and deltas, records decision rationale. | Can approve the work item, request refinement, or block it only through SurfaceOps. |
| Agent assignee | Creates or refines variants and responds to structured notes. | Cannot promote variants or infer approval from board movement. |
| Human creator | May create a `Button variants` card or attach context before review. | Card creation is collaboration state, not review authority. |
| SurfaceOps | Hosts canonical review media, DAG review workflow, notes, decisions, audit, and variant-of-record handoff. | Owns review state and handoff eligibility. |
| `kanban.cards` | Hosts board, cards, lanes, comments, assignments, and collaboration history. | Mirrors status and links; never owns SurfaceOps decisions. |
| Adapter | Syncs mirrored card state, idempotency keys, event cursor, projection, and reconciliation. | Does not create review decisions. |

## Outcome States
These are product-facing journey states. They do not change the current P4
proof schema by themselves.

| Product state | Meaning | Owner / next action |
| --- | --- | --- |
| `needs review` | The Button variants work item is ready for designer inspection. | Designer opens SurfaceOps from the card. |
| `needs refinement` | The designer requested changes and agents need another pass. | Owner/assignee becomes agents; notes stay in SurfaceOps and are mirrored as a card summary. |
| `approved for handoff` | The selected Button variant contract is accepted as the variant of record for later authorized use. | SurfaceOps records audit receipt and handoff eligibility; downstream consumers still need their own proof. |
| `blocked` | The item cannot proceed because evidence is missing or stale, authority conflicts exist, permissions fail, or proof issues remain. | SurfaceOps records rationale; card mirrors blocked state and link. |

Do not use `returned to agents` as a status. Use `needs refinement` with
owner/assignee set to agents.

## User-Journey Map
| Step | Surface | Designer sees | Designer can do | System behavior | Boundary to show |
| --- | --- | --- | --- | --- | --- |
| 1 | `kanban.cards` board | Design-system buildout board with lanes for `needs review`, `needs refinement`, `approved for handoff`, and `blocked`. | Scan work items and open `Button variants`. | Board renders mirrored status, owner, summary, thumbnails, and SurfaceOps link. | Board state is a mirror and collaboration surface only. |
| 2 | `Button variants` card | Thumbnail previews from SurfaceOps-hosted media, short agent/human context, owner, latest mirrored status, comments, and SurfaceOps link. | Read context and open SurfaceOps. | Card points to SurfaceOps-hosted media and review workflow. | Card comments do not approve, block, refine, or promote. |
| 3 | SurfaceOps intake | Review item summary, evidence/media preflight, backlink to card, and any blocked preflight reason. | Continue into review when evidence is current; stop when evidence fails. | SurfaceOps verifies refs before enabling decisions. | Missing, stale, mismatched, or failed evidence blocks decision controls. |
| 4 | SurfaceOps DAG | DAG nodes for authority, generation, variant candidates, integration, runtime, evidence, and decision. | Select nodes to inspect the review path. | Node selection updates the right inspector. | DAG is a review workflow surface. |
| 5 | Node inspector | Before/after visuals, state previews, interpreted attribute deltas, risks, diagnostics, and evidence refs. | Compare variants visually and inspect supporting refs. | Inspector stays tied to selected node and selected variant candidate. | Plain-language deltas lead; raw refs remain available for audit. |
| 6 | Decision panel | Approve, request refinement, or block controls with required notes/rationale. | Submit a work-item decision; optionally capture per-variant rationale. | SurfaceOps records the decision, reviewer, refs, media, and timestamp in the prototype receipt. | Decision applies to the work item; per-variant rationale supports the selected record. |
| 7 | Audit receipt | Reviewer, decision, notes, media refs, evidence refs, timestamp, selected variant, and kanban backlink. | Confirm the recorded outcome and return to the board. | Receipt separates decision, handoff eligibility, and target proof status. | Approval means variant-of-record eligibility, not deployment or runtime execution. |
| 8 | Return to `kanban.cards` | Card mirrored into the new status, with owner, note summary, thumbnails, and SurfaceOps link. | Continue collaboration from the board. | Adapter projection updates mirrored card fields in the prototype state. | Lane movement remains a signal; SurfaceOps remains the decision authority. |

## Data Ownership Map
| Data | SurfaceOps owns | `kanban.cards` owns | Adapter owns |
| --- | --- | --- | --- |
| Review media | Canonical before/after screenshots, state previews, hashes, media refs. | Thumbnails and links only. | Mapping between canonical media refs and card preview fields. |
| Review state | Current review item state, decision controls, handoff eligibility, selected variant of record. | Mirrored lane/status text. | Projection rules and reconciliation. |
| Notes and rationale | Structured decision notes, per-variant rationale, audit trail. | Card comments and collaboration history. | Latest-note summary and backlink projection. |
| Evidence and diagnostics | Evidence refs, proof status, promotion status, diagnostics, stale/missing/hash mismatch reasons. | Human-readable summary and link. | Ref validation status and sync cursor. |
| Board workflow | Backlink and current mirror target. | Cards, lanes, assignments, collaborators, comments. | Idempotency key, event cursor, conflict markers, retry/reconcile behavior. |

Lane movement in `kanban.cards` is only a signal. It cannot approve, block,
request refinement, promote, select a variant of record, or override SurfaceOps
evidence.

## Variant-Of-Record Handoff
Approval applies to the Button variants work item. SurfaceOps may still capture
per-variant rationale so the audit record explains why one candidate became the
variant of record.

An approved handoff means the selected Button variant contract, version, and
hash become eligible as the variant of record for later authorized consumers.
It does not bypass downstream target-specific proof or adoption work.

## JudgmentKit Activity Context
The relevant later JudgmentKit activity is:

> A product designer reviews AI-agent-generated design-system Button variants
> using visual before/after comparisons, state previews, and human-readable
> attribute deltas derived from governed contract data. The designer selects an
> approved variant of record or sends structured refinement notes. SurfaceOps
> owns the review decision and audit trail; `kanban.cards` mirrors current
> work-item status and links back to SurfaceOps.

JudgmentKit may later evaluate activity fit, workflow clarity, evidence quality,
and handoff quality only when explicitly authorized. JudgmentKit must not become
decision authority.

## Next Prototype Plan
Continue from the current static React Flow DAG prototype:

```text
demo/surfaceops-prototypes/contract-proof-v2/index.html
```

Build the next journey prototype as a sibling static prototype, for example:

```text
demo/surfaceops-prototypes/button-variants-journey/index.html
```

Do not replace the existing DAG prototype until the journey prototype is
reviewed. Link it from `demo/surfaceops-prototypes/index.html` only after the
new prototype file exists.

### Prototype Goals
- Show the full `kanban.cards` -> SurfaceOps -> `kanban.cards` loop.
- Keep the designer's first useful view visual: thumbnails, before/after
  comparison, state previews, and plain-language deltas.
- Preserve the DAG as the central SurfaceOps review workflow.
- Make SurfaceOps ownership of decisions, media, evidence, notes, audit, and
  variant-of-record handoff visible.
- Show `kanban.cards` as a concrete board and collaboration mirror, not the
  decision surface.
- Keep every action session-local and presentation-only.

### Prototype Screen Model
| Screen | Implementation shape | Required behavior |
| --- | --- | --- |
| Board | Static `kanban.cards` board with lane columns and work-item cards. | Clicking `Button variants` opens card detail. |
| Card detail | Work-item detail with thumbnails, context, owner, status, comments, and SurfaceOps link. | SurfaceOps link opens intake with backlink. |
| Intake | Evidence/media preflight strip before review. | Decision controls disabled when preflight is blocked. |
| DAG review | React Flow DAG based on `contract-proof-v2`, expanded with variant and decision nodes. | Node click updates inspector. |
| Node inspector | Right panel with before/after visuals, candidate selector, deltas, risks, diagnostics, and refs. | Visual comparison appears before raw artifact refs. |
| Decision panel | Approve, request refinement, block; required notes/rationale. | Submit creates session-local receipt and mirrored card update. |
| Audit receipt | Recorded decision, reviewer, selected variant, notes, refs, timestamp, kanban backlink. | Return action opens board with updated mirrored status. |
| Returned board | Same board with changed card status, owner, note summary, thumbnail/link preserved. | Shows mirror status while naming SurfaceOps as authority. |

### Prototype Data Model
Use one hardcoded in-page object. Keep fields explicit so future proof work can
turn them into schemas without guessing.

```text
workItem
  cardId
  title
  source: agent | human
  owner
  mirroredStatus
  surfaceOpsReviewId
  canonicalMediaRefs[]
  evidenceRefs[]
  variants[]
    variantId
    contractRef
    mediaRef
    beforeAfterSummary
    interpretedDeltas[]
    risks[]
    diagnostics[]
  decision
    state
    selectedVariantId
    notes
    reviewer
    timestamp
  auditReceipt
    receiptId
    kanbanBacklink
    evidenceRefs[]
    mediaRefs[]
```

### Interaction Rules
- Opening the card does not start review authority; it only exposes the
  SurfaceOps link and context.
- Opening SurfaceOps starts review inspection after preflight.
- DAG node selection changes the inspector and keeps the selected variant
  context.
- Approve requires a selected variant and rationale.
- Request refinement requires notes and sets mirrored status to
  `needs refinement` with owner/assignee set to agents.
- Block requires rationale and records the blocking class: missing/stale
  evidence, authority conflict, permissions, or proof issue.
- After submission, the prototype shows a receipt before returning to the board.
- Returning to the board updates only mirrored status, owner, latest note
  summary, thumbnails, and SurfaceOps link.
- Moving a card lane manually in the prototype may show a warning, but it must
  not create a SurfaceOps decision.

### Visual And UX Requirements
- Board, card, and SurfaceOps review views must feel like one journey, but the
  authority boundary must remain clear.
- Cards can use compact thumbnails. SurfaceOps uses larger canonical review
  media and before/after comparison.
- The right inspector should use small, dense sections: visual comparison,
  interpreted deltas, risks, diagnostics, evidence refs, and decision controls.
- The prototype should avoid a landing page. The first screen is the
  `kanban.cards` board.
- Raw JSON refs can be present, but they should not be the primary review task.
- Status labels must be text, not color alone.
- Button labels and status text must fit mobile and desktop.

### Boundary Copy To Preserve
Use clear copy in the prototype header or intake:

```text
Static prototype. SurfaceOps is the review authority; kanban.cards is the work
queue mirror. State changes are illustrative.
```

Use receipt copy like:

```text
Prototype receipt recorded. Approval selects the Button variant of record for
later authorized handoff.
```

## Prototype Acceptance Checklist
- The designer can complete the board -> card -> SurfaceOps -> receipt -> board
  loop without reading raw JSON first.
- The `Button variants` card can be framed as agent-created or human-created.
- SurfaceOps-hosted canonical media is visually distinguished from card
  thumbnails.
- Approve, request refinement, and block are work-item decisions.
- Per-variant rationale is visible but subordinate to the work-item decision.
- `needs refinement` is used instead of `returned to agents`.
- Approved handoff names the selected Button variant contract as the variant of
  record.
- The card mirrors the decision result after submission but never owns the
  decision.
- Lane movement is shown as a signal only.
- JudgmentKit is absent or clearly advisory-only and not invoked.
- The prototype does not make implementation claims beyond the journey being
  reviewed.

## Future Proof Work
The prototype can inform later proof work, but it does not implement it. A live
or proof-backed version would need target-specific schemas, fixtures,
diagnostics, command or API contracts, artifact/report paths, evidence paths,
permissions, persistence rules, adapter sync rules, conflict handling,
idempotency, audit replay, demo boundaries, and CI gates.

Likely future proof slices:

- SurfaceOps review workflow storage and audit proof.
- SurfaceOps-owned `kanban.cards` production adapter proof.
- Canonical review media proof with hash-bound screenshot refs.
- Variant-of-record handoff proof over accepted Button variant contracts.
- JudgmentKit activity-fit and evidence-quality evaluation proof, only when
  explicitly authorized.
