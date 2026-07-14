# surfaces.systems Category Page: Governance For AI-Generated Interfaces

## Status
This is a first-draft category page for future publication on `surfaces.systems`.
It is a subordinate product-surface draft, not proof authority, a proof command,
a schema, a fixture, a generated artifact, customer validation, production
readiness, or implementation-pilot readiness.

`VISION.md` remains canonical for Surfaces Platform product vision, authority
taxonomy, roadmap sequence, surface roles, and operating rules. Passing
`artifacts/**/evidence.json` files remain proof authority for implemented
behavior. Demos and screenshot candidates are presentation aids only.

## Publication Metadata
- Working URL: `/category/governance-for-ai-generated-interfaces`
- Page title: `Governance for AI-Generated Interfaces | Surfaces Platform`
- Meta description: `Surfaces Platform turns design-system source material into governed UI contracts, deterministic diagnostics, review evidence, and target-bound handoff for AI-generated interfaces.`
- Primary query: `governance for AI-generated interfaces`
- Supporting queries:
  - `how to govern AI-generated UI`
  - `how to keep AI-generated interfaces consistent`
  - `can agents follow a design system`
  - `validate AI-generated UI against a design system`
  - `accessibility governance for AI-generated interfaces`
  - `review workflow for agent-generated UI`
- Primary audience:
  - B2B SaaS teams adding copilots, agents, or generated workflows.
  - Design-system teams worried about UI drift from generated interfaces.
  - AI platform teams building internal app-generation tools.
  - Regulated or complex workflow products where random UI creates review, accessibility, or policy risk.
  - Devtool and enterprise AI teams that need governance around generation, not faster prototype output alone.

## Page Draft

# Governance For AI-Generated Interfaces

AI-generated UI can look plausible while exceeding the design system, skipping
accessibility expectations, inventing actions, or hiding product-policy risk.
Surfaces Platform gives teams a contract layer for bounded generated UI: the
system that turns "AI can make an interface" into "AI may make this interface,
under these rules, for this workflow."

Surfaces starts from declared design-system authority. Components, variants,
tokens, states, slots, accessibility rules, usage policy, source refs, review
requirements, and target boundaries are compiled into governed contracts that
agents and downstream consumers can validate against.

The result is a clearer control loop:

```text
design-system source
  -> Surfaces Catalog
  -> deterministic diagnostics and evidence
  -> review-required or blocked outcomes
  -> target-bound projection only after proof allows it
```

Surfaces does not ask teams to trust a screenshot. Surfaces makes generated UI
answer to source refs, policy, diagnostics, promotion status, and evidence.

## The Problem

AI interface generation changes the failure mode for product teams.

A generated screen may use the wrong Button variant, invent a missing prop,
combine components that should not appear together, skip accessible-name rules,
or attach a live action where the design system only allows an inert descriptor.
The generated output can still look good in a review screenshot.

For teams with copilots, agents, generated workflows, regulated flows, or
multiple design-system sources, visual review is not enough. The team needs to
know:

- which source material authorized the interface;
- which components, tokens, variants, states, slots, actions, and accessibility rules were allowed;
- which unsupported requests were blocked;
- which ambiguous or sensitive requests require human review;
- which evidence CI can reproduce;
- which downstream target is actually allowed to receive output.

Governance for AI-generated interfaces is the discipline of making those
answers machine-checkable before generated UI reaches a product surface.

## What Surfaces Adds

Surfaces Platform is the contract layer for AI-generated interfaces. It compiles
declared design-system source material into governed, versioned UI contracts
that agents, CI, reviewers, evaluators, and downstream targets can consume
without becoming new sources of authority.

In the current proof-contract repo, Surfaces demonstrates four practical
controls:

1. **Generation-time boundaries**: unsupported components, props, variants,
   tokens, slots, actions, accessibility semantics, and policy claims become
   deterministic diagnostics instead of inferred UI.
2. **Review routing**: structurally valid but sensitive or ambiguous output can
   be marked `review_required` and blocked from unattended promotion.
3. **Evidence-backed review**: reviewers inspect source refs, diagnostics,
   promotion status, artifact hashes, reports, and generated evidence instead
   of relying only on pixels.
4. **Target-bound handoff**: downstream projections, protocol envelopes, native
   packets, and future targets may consume only hash-bound outputs whose own
   proof authorizes that target.

Surfaces is not a replacement for a design system. The design system remains the
product authority. Surfaces turns bounded design-system authority into contracts
that generated UI must obey.

## A Concrete Example: Button Governance

The current repo-owned Button scenario shows the category in miniature.

### Before Surfaces

An agent receives a request for a generated workflow and chooses a Button style
that looks close enough. The team sees a plausible UI, but the generated output
has unresolved questions:

- Which Button source won if multiple source files define competing Button rules?
- Was the selected variant authorized by source material?
- Did the Button preserve required accessibility behavior?
- Did the output request action execution where the target only allows inert descriptors?
- Does the exception expire, and who owns review?

### After Surfaces

Surfaces makes those questions explicit.

The Button source-precedence fixture records conflicting declared sources,
the policy that resolves them, and the selected source ref:

```json
{
  "componentId": "Button",
  "authorityConflict": {
    "conflictingRefs": [
      "declared-source://source-conformance/components/button-acquired-a.json#/",
      "declared-source://source-conformance/components/button-acquired-b.json#/"
    ],
    "resolutionRule": "declared-source-precedence",
    "resolvedBy": "declared-source://source-conformance/policies/source-precedence.json#/",
    "selectedSourceRef": "declared-source://source-conformance/components/button.json#/"
  },
  "review": {
    "required": false
  }
}
```

An ambiguous source variant is blocked unless a deterministic mapping resolves
it:

```json
{
  "fixtureId": "ambiguous-variant",
  "description": "A source variant with multiple possible catalog targets must block unless a deterministic mapping resolves it.",
  "expectedDiagnosticCode": "INGEST_VARIANT_AMBIGUOUS",
  "promotionStatus": "blocked"
}
```

A forked Button exception can be routed to review without becoming executable:

```json
{
  "reviewQueueItemId": "source-review-button-forked-exception",
  "componentId": "Button",
  "owner": "design-systems-governance",
  "promotionStatus": "review_required",
  "executable": false,
  "rationale": "Forked Button variant requires declared exception policy and source-owner review."
}
```

When a target handoff is allowed, the protocol envelope stays inert and
target-bound:

```json
{
  "schemaId": "protocol-envelope.v0",
  "adapter": "surfaces-protocol-static",
  "promotionStatus": "allowed",
  "transport": "none",
  "sideEffects": [],
  "actions": []
}
```

The page screenshots should show this contrast:

| Screenshot slot | Source | Caption |
| --- | --- | --- |
| Before: prompt-first generated Button | Use a future recreated mock from the Button prompt, not proof output | A plausible generated Button leaves source authority, variant mapping, accessibility, and review ownership unclear. |
| After: blocked ambiguous variant | `fixtures/p2/invalid/ambiguous-variant.design-source.json` and `artifacts/p2/ingestion-report.json` | Surfaces blocks ambiguous variant mapping with `INGEST_VARIANT_AMBIGUOUS` before it becomes hidden UI. |
| After: review-required forked Button | `artifacts/source-conformance/source-review-queue.json` | A forked Button exception is non-executable, owner-routed, and review-required before unattended promotion. |
| After: target-bound protocol envelope | `artifacts/p5/protocol/protocol-envelope.button.json` | Allowed target output remains hash-bound, inert, and limited to the proven `surfaces-protocol-static` target. |

Screenshot captions must say that demos and screenshots are presentation only.
The backing evidence path is the proof reference.

## The Evidence Loop

Surfaces is built around an evidence-first workflow:

1. **Declare design authority**: identify the source material that owns
   components, variants, tokens, states, slots, accessibility expectations,
   examples, usage policy, brand rules, terminology, and review requirements.
2. **Compile governed contracts**: generate a governed Surfaces Catalog with
   source refs, provenance, diagnostics, promotion status, reports, and evidence.
3. **Generate inside the catalog boundary**: ask an agent or generator for UI
   only where the catalog defines what may be emitted.
4. **Inspect evidence, not only pixels**: review source refs, diagnostics,
   promotion status, review-required rows, reports, and presentation demos.
5. **Decide at the authority layer**: accept, reject, request changes, or update
   the declared source material, mappings, or policy.
6. **Hand off only proven target output**: downstream consumers receive only
   accepted, hash-bound projections, render plans, protocol envelopes, native
   packets, or future target-specific artifacts.
7. **Govern changes over time**: when design-system source material, policy, or
   target behavior changes, regenerate proof artifacts and evidence.

This workflow is not prompt-first. The preferred fix for unsupported generated
UI is to strengthen source authority or governance, not patch a downstream
rendering artifact.

## Current Proof Status

The current repo proves deterministic proof-contract slices. It does not prove a
live product, public API, SDK, production adapter, live runtime, live SurfaceOps,
live JudgmentKit, A2UI target, customer validation, or production adoption.

| Slice | What it proves | Evidence |
| --- | --- | --- |
| P0 synthetic catalog proof | A design-system-shaped fixture can compile into a governed catalog with diagnostics, review gates, and evidence. | `artifacts/p0/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"`. |
| P1 `web-static` runtime projection | A governed catalog can produce a hash-bound static projection and inert render plans without becoming a general renderer. | `artifacts/p1/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"`. |
| P2 bounded Spectrum ingestion | A manifest-declared local `@adobe/spectrum-design-data@0.7.0` snapshot, scoped to `button` and `in-line-alert`, can produce source inventory, mappings, extract, catalog, governed catalog, report, and evidence. | `artifacts/p2/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"`. |
| Source conformance | Declared local source refs, conflicts, exceptions, review routing, and forbidden production claims can be checked against accepted P2 evidence. | `artifacts/source-conformance/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"`. |
| Designer workflow trace | One Button scenario can index accepted evidence from source authority through review, evaluation-shaped artifacts, and static target handoff. | `artifacts/designer-workflow-trace/evidence.json` records `status: "pass"` and `promotionStatus: "blocked"`. |
| P4 review and judgment proof | SurfaceOps-shaped decisions and JudgmentKit-shaped findings can consume evidence without live persistence, live invocation, or authority override. | `artifacts/p4/evidence.json` records `status: "pass"` and `promotionStatus: "blocked"`. |
| P5 protocol and native static targets | Accepted evidence can produce inert protocol envelopes and native packets for the implemented static targets only. | `artifacts/p5/protocol/evidence.json` and `artifacts/p5/native/evidence.json` record passing proof-only target evidence. |

`status` records whether the proof command passed. `promotionStatus` records the
governed outcome that downstream consumers must respect. A passing proof can
correctly produce `blocked` promotion status when the contract proves that
unsafe, expired, or unsupported output must not promote.

## Where Surfaces Fits

| Adjacent model | What it does | Where Surfaces fits |
| --- | --- | --- |
| Design systems | Define product truth for components, tokens, patterns, accessibility, and policy. | Surfaces treats the design system as authority and compiles bounded contracts from it. |
| Component libraries | Provide implementation primitives and reusable UI code. | Surfaces governs what generated UI may emit, validate, review, or hand off from those primitives. |
| Prompt guidelines | Tell humans and agents what to prefer. | Surfaces turns allowed behavior into machine-checkable contracts, diagnostics, and evidence. |
| Eval frameworks | Assess outputs, workflows, or model behavior. | Surfaces provides evidence evaluators can inspect; evaluators do not become catalog authority. |
| AI app builders | Generate application UI and workflows. | Surfaces constrains generated UI at generation, CI, review, and target handoff boundaries. |
| Agent guardrails | Limit broad agent behavior. | Surfaces is UI-contract-specific: source refs, props, variants, tokens, accessibility, review status, promotion status, and artifact hashes. |

## Buyer Questions

Teams usually feel this problem through specific questions:

- How do we stop AI-generated UI from drifting away from our design system?
- Can agents follow a design system when the source lives across Figma, code,
  Storybook, docs, and policy files?
- What happens when an agent asks for an unsupported component, prop, token,
  variant, state, slot, action, or accessibility behavior?
- How do we validate generated interfaces before they reach CI or product review?
- How do we enforce accessibility expectations in AI-generated UI?
- Who owns ambiguous mappings, source conflicts, brand exceptions,
  forked components, or expired approvals?
- How do product teams approve agent-created workflows without treating a
  screenshot as proof?
- Which downstream target actually matters first: static web, protocol envelope,
  native packet, future API, SDK, runtime, or A2UI?
- What proof would make generated UI eligible for handoff?

Each question should become a short page, demo walkthrough, or repo-backed
example. The canonical category page should link those pages as they exist.

## Founder-Led Proof Discovery

The right first offer is narrow and evidence-led:

> Bring one governed component and one review-sensitive generated interface
> request. We will map the source authority, identify what Surfaces can prove
> today, show where unsupported output would be blocked or routed to review, and
> define the proof shape required before any live integration.

This is a moderated evidence walkthrough and proof-discovery offer. It is not a
production beta, self-serve trial, implementation pilot, live SurfaceOps
workflow, live JudgmentKit invocation, API, SDK, runtime, native bridge, or A2UI
pilot.

Suggested outbound note:

> I am building Surfaces Platform, a contract layer for AI-generated
> interfaces. It helps teams constrain what agents can generate so UI stays tied
> to design-system source, product policy, review, and evidence.
>
> If you are already seeing interface drift from AI-generated workflows, I would
> like to run a narrow proof-discovery session against one workflow: map the
> source authority, show what would be allowed, blocked, or review-required, and
> define the proof shape needed before a real integration.

## Content Roadmap For AI Search

Publish supporting pages around the buyer questions AI systems are likely to
retrieve:

| Page | Search intent | Evidence anchor |
| --- | --- | --- |
| How to stop AI-generated UI from drifting | Design-system drift and generated UI governance | P2 diagnostics and source-conformance conflicts. |
| Can agents follow a design system? | Agent compliance with design-system source | Surfaces Catalog, P2 source refs, P3 inert work orders. |
| How to validate generated interfaces | CI and proof status for generated UI | Evidence files, reports, and promotion status. |
| Accessibility governance for AI-generated UI | Accessible names, keyboard contracts, focus, and review | P0/P1 accessibility diagnostics and Button source-conformance requirements. |
| How product teams approve agent-created workflows | Review-required output, ownership, and expiry | Source review queue, P4 decision ledger, designer workflow trace. |
| Surfaces vs design systems | Clarify authority relationship | Design system as product authority; Surfaces Catalog as governed contract authority. |
| Surfaces vs component libraries | Clarify implementation primitives versus governed emission | Runtime projection and protocol/native static target boundaries. |
| Surfaces vs prompt guidelines | Explain machine-checkable contracts | Diagnostics, fixtures, and evidence. |
| Surfaces vs eval frameworks | Explain evidence consumed by evaluators | P4 JudgmentKit-shaped findings without authority override. |
| Surfaces vs AI app builders | Explain generation control rather than app building | Generation-time, CI, review, and handoff constraints. |
| Surfaces vs agent guardrails | Explain UI-specific governance | Source refs, catalog constraints, review status, artifact hashes. |

Third-party validation should start with useful artifacts where technical buyers
already look:

- GitHub examples that show allowed, blocked, and review-required cases.
- A technical README that explains evidence authority and proof boundaries.
- Short demo videos that show the Button walkthrough with presentation-only
  captions and evidence paths.
- LinkedIn posts that answer one buyer question at a time.
- Design-system community posts asking how teams handle AI-generated UI drift.
- AI engineering community posts focused on contract-bound generation and review.

Do not claim third-party validation until it exists. Seed useful material first.

## Refresh Rules

Refresh this page when any of these change:

- `VISION.md` changes the product vision, surface roles, authority taxonomy, or
  current proof snapshot.
- A proof evidence file changes status or promotion status.
- A new target-specific proof is added with schema, fixtures, diagnostics,
  command contract, artifact or report path, evidence path, CI gate, and passing
  evidence.
- Public assets are created for screenshots, demo videos, examples, or GitHub
  README material.
- Design-partner discovery produces approved public learning. Treat internal
  synthetic or moderated research as planning signal unless a later artifact
  explicitly authorizes publication.
