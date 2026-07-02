# SurfaceOps UI Decisions And Review Criteria

## Status
This is a subordinate UI planning document for the future SurfaceOps product surface. [VISION.md](../VISION.md) remains canonical for the Surfaces Platform authority model, roadmap sequence, surface roles, and implemented proof status. [SurfaceOps Product Brief](surfaceops-product-brief.md) remains the product brief.

This document does not create proof authority, product behavior, live SurfaceOps workflow, persistent review storage, production adapter support, JudgmentKit invocation, or catalog policy. Current implemented SurfaceOps scope remains deterministic P4 artifacts only: `artifacts/p4/surfaceops-decision-ledger.json`, `artifacts/p4/review-judgment-report.json`, `artifacts/p4/judgmentkit-evaluation-report.json`, and `artifacts/p4/evidence.json`.

## Decision
SurfaceOps should be an `operator_review` surface: a dense, evidence-first review console for generated UI work that cannot advance unattended.

The UI should not be a marketing page, passive dashboard, general project tracker, catalog editor, policy editor, runtime adapter, or live execution console. The surface exists to help a human inspect evidence, understand risk, record a bounded decision, and leave an auditable receipt.

## Activity Model
The primary activity is evidence-backed review of generated UI work before it advances.

Participants:

- Product designer: checks generated UI against declared design authority before handoff.
- Design-system owner: protects component, token, accessibility, brand, and usage policy.
- Reviewer or approver: records approve, reject, request changes, defer, or second-review-required outcomes.
- Frontend or platform engineer: verifies evidence eligibility before target-specific handoff.
- Agent or automation operator: sees blocked, review-required, or eligible state without executing anything.
- JudgmentKit evaluator: may provide supporting findings only, never decisions.

The reviewer should leave knowing:

- what needs review;
- why Surfaces routed or blocked it;
- which source authority, catalog rule, diagnostic, queue item, artifact hash, and evidence file support that status;
- which decision was recorded or still needed;
- whether downstream consumers remain blocked or may act later under their own proof.

## Information Architecture
SurfaceOps should use a master-detail review console:

1. Review queue: filterable list of review items grouped by promotion status, owner, component, target, age, evidence freshness, diagnostic code, and decision state.
2. Item review workbench: selected item detail with request summary, source authority, catalog boundary, generated artifact refs, diagnostics, evidence status, and target eligibility.
3. Evidence explorer: source refs, queue refs, artifact paths, hashes, provenance, raw JSON links, and canonical diagnostics.
4. Judgment findings panel: evaluation-only findings shown as supporting context, visually separate from decision controls.
5. Decision panel: state-gated controls for approve, reject, request changes, defer, or require second review.
6. Receipt and ledger view: immutable decision record with rationale, reviewer provenance, evidence refs, promotion result, and handoff eligibility.
7. Source inspection drawer: deeper schema ids, artifact hashes, JSON pointers, fixture refs, and proof metadata for audit or debugging.

## Layout Decisions
Desktop should use a dense three-pane workbench:

- Left: queue and filters.
- Center: selected item, evidence, diagnostics, previews, and generated-artifact inspection.
- Right: decision panel, rationale, requested changes, reviewer provenance, second-review requirements, and downstream eligibility.

Mobile should use a stacked queue-to-detail flow. Mobile review may support triage and careful inspection, but decision controls must never appear without nearby evidence context. Long tables should collapse into labeled rows instead of requiring horizontal scrolling.

Demos or previews may appear only as presentation aids. Evidence, refs, hashes, diagnostics, and promotion status remain authoritative.

## Workflow
1. Preflight accepted evidence and hashes before the item can be actionable.
2. Populate the queue from review-required evidence, currently modeled by the P3 review queue consumed by the P4 proof.
3. Open an item detail view with source authority, catalog boundary, diagnostic code, promotion status, queue refs, evidence refs, artifact hashes, and target refs.
4. Inspect supporting context: proof reports, generated demos as presentation only, and JudgmentKit-shaped findings as advisory only.
5. Choose a bounded decision: `approved`, `rejected`, `changes_requested`, `deferred`, or second review required.
6. Validate the decision before submission: evidence refs present, one committed decision per queue item, no catalog override, no upstream mutation, no work-order execution, no hidden state.
7. Record the ledger row with rationale, reviewer provenance, immutable refs, and non-executable status.
8. Show a receipt that separates decision recorded, promotion status, target eligibility, and later authorized handoff.

## Required States
| State | UI Requirement | Decision Behavior |
| --- | --- | --- |
| Empty | Show no review items or no filtered matches, plus current proof boundary and last evidence status when available. | No decision controls. |
| Loading | Validate refs, hashes, and preflight status before showing active decision controls. | Controls disabled until evidence is ready. |
| Evidence error | Show missing, stale, mismatched, or failed evidence with canonical diagnostic codes. | Block decisions. |
| Review required | Show why the item cannot promote unattended and who can decide. | Allow only evidence-backed review decisions. |
| Blocked | Show invalid, stale, hash mismatch, policy override, hidden decision, duplicate decision, missing evidence, or execution-attempt reason. | No approval path. |
| Approved | Show approval as evidence eligibility for a later authorized consumer. | Must not execute, deploy, or mutate artifacts. |
| Rejected | Show blocked status with evidence-backed rationale. | Blocks unattended promotion. |
| Changes requested | Show requested changes, evidence refs, and no upstream mutation. | Blocks unattended promotion. |
| Deferred | Preserve `review_required` and explain what is waiting. | No unattended promotion. |
| Second review required | Show first reviewer, required second reviewer role, and separation rule when applicable. | Preserve `review_required`. |
| Permission denied | Explain reviewer role or ownership mismatch. | No decision controls. |
| Decision submitted | Show receipt, reviewer provenance, evidence refs, promotion result, and handoff eligibility. | No duplicate committed decision for the same queue item. |
| Coverage-only or report-only | Show the outcome as validation/report coverage, not a committed ledger decision. | No duplicate ledger row. |

## Review Criteria
A SurfaceOps UI proposal should pass these criteria before it becomes an implementation candidate:

- The surface answers the five brief questions: what needs review, why it needs review, which evidence supports the status, which decision is allowed, and which consumers remain blocked or eligible.
- The surface keeps the authority chain visible: design-system source -> Surfaces Catalog -> proof evidence -> review queue -> SurfaceOps decision -> target-specific handoff.
- Every visible state maps to `status`, `promotionStatus`, diagnostics, artifact refs, and evidence refs.
- Decision controls stay adjacent to evidence and remain disabled when evidence is missing, stale, mismatched, failed, or not bound to the selected queue item.
- Approval copy says "eligible for a later authorized consumer" or equivalent plain wording. It must not say or imply deployed, executed, live, production-ready, or policy override.
- Rejection and changes-requested states block unattended promotion and do not rewrite upstream queue items, P3 work orders, catalog rules, or source authority.
- Deferred and second-review-required states preserve `review_required`.
- JudgmentKit findings are visually and semantically separate from SurfaceOps decisions. Findings may inform review, but they cannot approve, reject, request changes, defer, promote, route, mutate, render, execute, or override policy.
- `kanban.cards`, if used, may organize owners, stages, comments, and collaboration. SurfaceOps still owns evidence refs, decision semantics, promotion status, and handoff eligibility.
- Demos and previews are clearly presentation-only and never substitute for evidence.

## Evidence And Diagnostics Criteria
- Review items must show exact evidence refs before decision controls are actionable.
- The UI must distinguish proof status from promotion status, especially `status: "pass"` with `promotionStatus: "blocked"`.
- Diagnostics must show canonical code, message, stage, promotion status, artifact path, JSON pointer, source ref, and fixture coverage when available.
- Validator-native wording may help debugging, but canonical registry wording is authoritative.
- Hash mismatch, stale evidence, missing refs, hidden decisions, duplicate decisions, policy overrides, and execution attempts must fail closed.
- Raw artifact views should be available through an audit/source inspection path, not dominate the primary review surface.

## Accessibility And Responsive Criteria
- Queue and item lists use semantic tables or lists with text labels for every status.
- Decision controls have visible labels, keyboard access, visible focus, and disabled-state explanations.
- Evidence hashes and artifact refs are copyable and do not require hover-only interactions.
- Validation and submission feedback uses accessible status messaging such as `aria-live` where appropriate.
- Color cannot be the only status signal.
- Dense desktop review must remain scannable without nested cards or hidden critical evidence.
- Mobile layouts must preserve the full evidence path before decision actions.

## Product Language
Use:

- `review queue`
- `review item`
- `decision ledger`
- `evidence refs`
- `reviewer provenance`
- `rationale`
- `promotion status`
- `source authority`
- `Surfaces Catalog`
- `diagnostic`
- `evidence eligibility`
- `non-executable`
- `target-specific handoff`
- `audit receipt`

Avoid in product UI unless the user is explicitly auditing source details:

- `MCP`
- `tool call`
- `model configuration`
- `prompt template`
- `schema id`
- `trace`
- `deployment approval`
- `live approval`
- `policy override`
- `executes work`
- `persistent decision store`
- `JudgmentKit approved`
- `demo proves`
- `production adapter`
- `A2UI support`

## Risk Review
High:

- The UI implies a reviewer can override catalog policy, execute work, mutate upstream artifacts, or approve production handoff.
- The product claims live SurfaceOps before schemas, fixtures, diagnostics, persistence, permissions, command or API boundaries, evidence, and CI gates exist.
- Decision controls become available without exact evidence refs and current hashes.

Medium:

- Users confuse proof pass with promotion allowed.
- A board-first layout hides evidence refs, diagnostics, hashes, and one-decision-per-item rules.
- JudgmentKit findings read as decisions rather than supporting evaluation.
- Target eligibility, decision recorded, and target proof status collapse into one status badge.

Low:

- `surfaceops.ai` packaging distracts from proving the closed review loop.
- Demos or previews become more visually prominent than evidence and diagnostics.
- Product copy exposes implementation terms where review language would be clearer.

## Proof Required Before Live Claims
A live SurfaceOps UI needs a target-specific proof that defines:

- queue item, decision, reviewer provenance, permission, audit, and exported-ledger schemas;
- fixtures for allowed decisions, invalid overrides, missing evidence, duplicate decisions, permission failures, second-review cases, stale evidence, and blocked handoff;
- diagnostics with canonical messages and promotion statuses;
- command or API contracts with deterministic input and output boundaries;
- persistence rules that prevent hidden mutable authority;
- artifact, report, and evidence paths;
- UI or demo boundaries that keep presentation separate from proof authority;
- CI gates for stale input, hash mismatch, unauthorized decisions, unsupported handoff, drift, and untracked files.

Until that proof exists, SurfaceOps UI decisions and criteria are planning guidance only. The current repo implements deterministic P4 review artifacts, not a live review product.
