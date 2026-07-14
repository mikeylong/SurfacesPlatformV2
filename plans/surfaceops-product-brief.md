# SurfaceOps Product Brief

## Status
This is a subordinate product brief for the SurfaceOps product direction. [VISION.md](../VISION.md) remains canonical for the Surfaces Platform vision, authority model, roadmap sequence, surface roles, and implemented proof status.

This brief does not create proof authority, product behavior, live review workflow, persistent decision storage, production adapter support, JudgmentKit invocation, or catalog policy. Current implemented SurfaceOps scope is limited to the deterministic P4 `surfaceops-decision-ledger.v0` proof artifact, the bounded local `surfaceops-kanban-live` adapter proof, and the evidence that backs those targets.

The follow-on UI decision set and review criteria live in [SurfaceOps UI Decisions And Review Criteria](surfaceops-ui-decisions-review-criteria.md).

## Product Thesis
SurfaceOps should be the operational review surface for generated UI that cannot be promoted unattended.

The product should help a reviewer answer five practical questions:

1. What generated surface or work item needs review?
2. Why did Surfaces route it to review instead of allowing or blocking it outright?
3. Which design-system source, catalog rule, diagnostic, queue item, and evidence file supports that status?
4. Should a human approve, reject, request changes, defer, or require a second review?
5. Which downstream consumers may act after the decision, and which remain blocked?

The current repo proves only the deterministic record shape for that decision loop. A live SurfaceOps product remains planned until a later proof defines storage, workflow, permissions, API or command boundaries, audit behavior, diagnostics, artifacts, and evidence.

## Problem
AI-generated UI can look plausible while exceeding the design system, skipping accessibility requirements, inventing policy, or hiding unsupported runtime behavior. Teams need a review layer that treats generated output as evidence-bound work instead of a screenshot, chat response, or untracked approval.

Without SurfaceOps, review-required work tends to scatter across PR comments, design tools, chat threads, CI logs, spreadsheets, and local judgment. The failure mode is not only slower review. The larger risk is that nobody can reconstruct why a surface was promoted, rejected, changed, or still blocked.

## Primary Users
- Product designers who need to see whether generated UI follows declared design authority before handoff.
- Design-system owners who need to protect component, token, accessibility, brand, and usage policy.
- Frontend and platform engineers who need deterministic evidence before allowing generated UI into a target.
- Reviewers and approvers who need a bounded decision record instead of hidden state.
- Agent or automation operators who need to know when generated work is blocked, review-required, or eligible for a later authorized consumer.

## Current Proof-Backed Scope
The implemented P4 proof gives SurfaceOps a first mechanical boundary:

- Input: accepted P3 orchestration evidence and the P3 review queue.
- Decision artifact: `artifacts/p4/surfaceops-decision-ledger.json`.
- Report artifact: `artifacts/p4/review-judgment-report.json`.
- Evidence authority: `artifacts/p4/evidence.json`.
- Demo output: `demo/p4/index.html`, presentation only.
- Supported decision statuses in the proof model: `approved`, `rejected`, `changes_requested`, and `deferred`.
- Required decision properties: queue item refs, evidence refs, reviewer provenance, rationale, decision status, and promotion semantics.
- Explicitly blocked behavior: catalog overrides, upstream mutation, work-order execution, hidden decisions, duplicate committed decisions, and missing evidence refs.

P4 evidence currently records `status: "pass"` with `promotionStatus: "blocked"`. That is expected. It proves the review layer can block unsafe or invalid outcomes while preserving evidence and catalog authority.

## Product Shape
SurfaceOps should feel like an operations console for governed UI review, not a general project tracker.

The core product surface is a review queue. Each item should show the request, source authority, catalog boundary, diagnostics, promotion status, owner, evidence refs, downstream target refs, and the current review state. A reviewer should be able to inspect the evidence, compare the generated surface against the governed contract, and record a decision with a rationale.

The product should keep the authority chain visible:

```text
design-system source
  -> Surfaces Catalog
  -> proof evidence
  -> review queue
  -> SurfaceOps decision
  -> target-specific handoff only when authorized
```

SurfaceOps may organize work, collect decisions, and expose audit history. It must not become the place where policy is invented after the fact. Policy changes belong in source authority, mappings, governance rules, or a future proof contract.

If SurfaceOps displays or exports board-shaped work, that layer should be SurfaceOps-owned and adjacent to the review product: a projection from accepted evidence, review queue refs, and decision refs into board-ready records. The board projection should not become the decision ledger, hidden promotion state, or proof authority.

## Planned MVP
A live SurfaceOps MVP should stay smaller than a workflow platform. The first useful product should prove one closed review loop:

1. Ingest a bounded review queue from passing Surfaces evidence.
2. Show review items with source refs, diagnostics, promotion status, artifact hashes, and target handoff status.
3. Let authorized reviewers approve, reject, request changes, defer, or require second review.
4. Persist decision records with immutable evidence refs and reviewer provenance.
5. Export or expose a decision ledger that downstream consumers can verify before acting.
6. Preserve blocked and review-required states without executing work orders or mutating upstream artifacts.
7. Record enough audit data to reconstruct who decided what, why, and against which evidence.

The MVP should not start by adding broad integrations. Integrations are useful only after the review record, authority boundaries, and evidence handoff are proven.

## Relationship To `kanban.cards`
`kanban.cards` is the standalone upstream collaboration-board substrate. SurfaceOps should remain the standalone app and review product.

In that model, `kanban.cards` can organize work items, owners, stages, comments, and collaboration. SurfaceOps owns the Surfaces-specific review semantics: evidence refs, promotion status, decision statuses, review requirements, catalog boundaries, and handoff eligibility. Any integration should pass through a SurfaceOps-owned adjacent adapter/projection layer that maps accepted evidence into board-ready records.

The first live proofable target is now `surfaceops-kanban-live`: a bounded local-loopback adapter proof that starts a real local `kanban.cards` server, writes and reads real board state, observes realtime events, verifies local persistence across restart, records browser video, and keeps SurfaceOps evidence and decisions as authority. White-labeling `kanban.cards` as SurfaceOps remains a packaging option only if the standalone product is intentionally deprioritized. Production sync, Auth0 delegated production auth, hosted persistence, service-account permissions, broad conflict handling, audit replay, and product adoption still require later proof.

## JudgmentKit Relationship
JudgmentKit is the evaluation direction, not the decision owner. SurfaceOps may display JudgmentKit-shaped findings or future authorized evaluator output as supporting context, but JudgmentKit should not approve, reject, request changes, defer, promote, execute, route, mutate, render, or override catalog policy.

The current P4 implementation emits a deterministic `judgmentkit-evaluation-report.json` without live JudgmentKit invocation. Any live JudgmentKit integration needs a separate proof and explicit authorization.

## Success Measures
SurfaceOps should be judged by whether review-required generated UI becomes easier to govern, not by whether more items are approved.

- Reviewers can identify why an item is review-required or blocked without reading raw artifact trees.
- Every decision has evidence refs, reviewer provenance, rationale, and deterministic status.
- Invalid or unsupported output stays blocked even when a reviewer tries to override policy.
- Product designers can trace a decision back to declared source authority and catalog rules.
- Downstream consumers can verify decision eligibility before rendering, adapting, or handing off output.
- The product reduces untracked approvals in chat, screenshots, and ad hoc PR comments.

## Proof Required Before Live Claims
SurfaceOps can move from product brief to live product only after a target-specific proof defines:

- schemas for queue items, decisions, reviewer provenance, permissions, audit history, and exported ledgers;
- fixtures for allowed decisions, invalid overrides, missing evidence, duplicate decisions, permission failures, second-review cases, stale evidence, and blocked handoff;
- diagnostics with canonical messages and promotion statuses;
- command or API contracts with deterministic input/output boundaries;
- persistence rules that prevent hidden mutable authority;
- board and adapter rules, if present, that keep SurfaceOps evidence and decisions authoritative while `kanban.cards` remains the collaboration substrate;
- artifact, report, and evidence paths;
- demo or product-surface boundaries that stay presentation-only unless separately proved;
- CI gates that prove stale input, hash mismatches, unauthorized decisions, and unsupported handoff fail closed.

Until production proof exists, SurfaceOps should be described as the planned operational review product direction, with current implementation limited to P4 deterministic artifacts and the bounded local-loopback `surfaceops-kanban-live` adapter proof.

## Non-Goals
- No catalog policy ownership.
- No design-system source authority.
- No hidden promotion state.
- No work-order execution.
- No live agent execution.
- No production adapter, API, SDK, runtime, or A2UI support.
- No production board sync, production bidirectional updates, hosted persistence, production auth, or production `kanban.cards` adapter behavior without a later proof.
- No live JudgmentKit invocation without a separate proof and explicit authorization.
- No claim that generated demos or product UI are proof authority.

## Open Decisions
- Whether `surfaceops.ai` is the first public packaging or a later product surface.
- Whether `kanban.cards` stays fully standalone as the upstream collaboration-board substrate, is white-labeled, or remains connected only through a SurfaceOps-owned adapter/projection layer.
- Which reviewer identity model is acceptable for the first live proof.
- Whether long-term JudgmentKit findings live inside SurfaceOps, a separate evaluator store, or evidence-only reports.
- Which downstream consumer should be the first to require a live SurfaceOps decision before handoff.
