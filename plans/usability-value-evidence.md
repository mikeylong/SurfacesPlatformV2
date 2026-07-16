# Usability And Value Evidence Plan

## Status
This is a subordinate documentation plan. It explains how Surfaces Platform demonstrates usability and product value through existing proof contracts, generated artifacts, evidence, diagnostics, and demos.

This plan does not create a new proof authority, command, schema, fixture, artifact, runtime adapter, review workflow, production protocol, or product claim. Authority remains:

- product vision, authority taxonomy, roadmap sequence, and surface roles: [VISION.md](../VISION.md);
- mechanical proof contracts: [PLAN.md](../PLAN.md) and phase subplans under [plans/](README.md);
- implemented behavior: passing `artifacts/**/evidence.json`;
- presentation output: `demo/**`, only when backed by passing evidence.

[Curated design-partner testing](design-partner-testing.md) material is subordinate research and planning context. It may help design moderated tasks, capture qualitative partner feedback, score observations, and synthesize usability questions against evidence-backed demos, but it does not prove behavior, replace phase evidence, or promote any surface.

## Evidence Rule
The platform is usable when a developer, agent, reviewer, CI system, or runtime consumer can answer these questions from deterministic proof output:

- What command proves the claim?
- What inputs were consumed?
- What artifacts were generated?
- What evidence file is authoritative?
- Which demo, if any, presents the evidence for human inspection?
- What promotion status was recorded?
- What diagnostic coverage blocks unsupported or unsafe behavior?
- What is explicitly out of scope?

Demos make the proof easier to inspect. They are never proof authority. If a demo and evidence disagree, the evidence and phase contract win.

## Current Evidence Summary
The current tracked phase evidence files report passing status for P0 through the implemented P5 protocol and native proof-only targets. Evidence `status` records whether the proof command passed. `promotionStatus` records the governed outcome that downstream consumers must respect.

| Phase | Implemented slice | Evidence path | Current evidence status | Current promotion status | Demo path |
| --- | --- | --- | --- | --- | --- |
| P0 | Synthetic catalog contract proof | `artifacts/p0/evidence.json` | `pass` | `review_required` | `demo/p0/index.html` |
| P1 | `web-static` runtime projection and render-plan proof | `artifacts/p1/evidence.json` | `pass` | `review_required` | `demo/p1/index.html` |
| P2 | Bounded local Adobe Spectrum Design Data ingestion proof | `artifacts/p2/evidence.json` | `pass` | `review_required` | `demo/p2/index.html` |
| P3 | Inert agent orchestration proof | `artifacts/p3/evidence.json` | `pass` | `review_required` | `demo/p3/index.html` |
| P4 | Deterministic review and judgment proof | `artifacts/p4/evidence.json` | `pass` | `blocked` | `demo/p4/index.html` |
| P5 | `surfaces-protocol-static` inert protocol-envelope proof | `artifacts/p5/protocol/evidence.json` | `pass` | `review_required` | `demo/p5/protocol/index.html` |
| P5 | `surfaces-native-static` inert native-packet proof | `artifacts/p5/native/evidence.json` | `pass` | `review_required` | `demo/p5/native/index.html` |
| Target | Reusable checked authority-profile and source-fact conformance proof for two compatible bundles | `artifacts/source-family-packaging/evidence.json` | `pass` | `review_required` | none; report/evidence only |
| Target | Structured accessibility behavior reconciliation against accepted catalog facts | `artifacts/source-accessibility-policy/evidence.json` | `pass` | `review_required` | none; report/evidence only |
| Target | Designer workflow trace evidence index | `artifacts/designer-workflow-trace/evidence.json` | `pass` | `blocked` | none; report/evidence only |

The promotion status is not a marketing status. It is part of the proof contract: allowed work may proceed, review-required work stays inspectable but blocked from unattended promotion, and blocked work remains rejected by deterministic diagnostics or review policy.

P4's `status: "pass"` with `promotionStatus: "blocked"` is intentional in the current evidence. It proves review and evaluation artifacts can block invalid or unsafe outcomes without giving SurfaceOps or JudgmentKit authority to rewrite the catalog or execute work.

## Human Value Readout
A reviewer should be able to demonstrate platform value by walking the evidence loop for a declared target:

- Authority connection time: show both checked profiles, the two fresh accepted compiler executions, the post-workspace candidate evidence check, fact coverage, discovered conflicts, applied precedence, referenced-route owner exceptions, and connection reports; then show structured accessibility declarations matching existing facts or remaining non-executable review work. Source changes that exceed P2 and policy prose presented as behavior authority must block.
- Generation time: show the governed catalog, valid fixtures, invalid fixtures, review-required fixtures, and diagnostics that prevent unsupported UI from becoming hidden output.
- CI/CD integration time: show the package gate, tracked drift check, untracked-output guard, evidence file, and proof-bearing workflow result for the phase.
- Review time: show the P3 review queue, P4 decision ledger, JudgmentKit-shaped findings, diagnostics, and promotion status without claiming live SurfaceOps or live JudgmentKit behavior.
- Runtime, protocol, or native consumption time: show hash-bound projections, render plans, protocol projections, native projections, inert envelopes, inert native packets, and review-required rows that produce no executable output.
- Demo inspection time: show generated demos only as presentation views backed by passing evidence, never as the source of proof.

## Product Designer Workflow Evidence
The canonical product designer workflow is defined in [VISION.md](../VISION.md#product-designer-workflow), with subordinate workflow details in [Product Designer Workflow](product-designer-workflow.md). This plan uses that workflow as the human value lens for evidence-backed walkthroughs.

A product designer should be able to trace:

- which source material declares the components, variants, tokens, states, accessibility expectations, usage policy, and review requirements;
- which governed catalog records what agents or generators may emit;
- which diagnostics block unsupported UI or route ambiguous and sensitive work to review;
- which evidence file proves the current status and promotion status;
- which review queue, decision ledger, or judgment-shaped report makes review-required work inspectable;
- which projection, render plan, protocol envelope, native packet, or future adapter artifact is authorized for the target;
- which demo is only presentation output and must not be treated as proof authority.

If a designer cannot complete that trace for a target, the target is not yet a usable Surfaces Platform workflow regardless of how convincing the generated UI looks.

## Designer Workflow Trace Report
[Product Designer Workflow Trace](product-designer-workflow-trace.md) defines the implemented first proof-only consolidated trace report. The report indexes existing evidence from source authority through target handoff, but it does not replace the phase evidence files that prove implemented behavior.

Command:

```bash
interfacectl surfaces designer-workflow-trace proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --ingestion-report artifacts/p2/ingestion-report.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-authority-map artifacts/source-conformance/source-authority-map.json --source-conformance-report artifacts/source-conformance/source-conformance-report.json --source-review-queue artifacts/source-conformance/source-review-queue.json --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json --protocol-evidence artifacts/p5/protocol/evidence.json --native-evidence artifacts/p5/native/evidence.json --fixture fixtures/designer-workflow-trace --out artifacts/designer-workflow-trace
```

Artifacts:

- `artifacts/designer-workflow-trace/trace-selection.json`
- `artifacts/designer-workflow-trace/designer-workflow-trace-report.json`
- `artifacts/designer-workflow-trace/evidence.json`

Promotion status:

- Current tracked evidence records `blocked` because the trace faithfully preserves accepted P4 `promotionStatus: "blocked"` while the trace proof itself records `status: "pass"`.

Non-goals:

- No product workflow implementation, customer validation, production adoption, live SurfaceOps, live JudgmentKit, production adapter, API, SDK, runtime, A2UI, P6, P7, catalog authority, upstream proof authority, or demo authority.

## Design-Partner Testing Package
The [Curated Design-Partner Testing Program](design-partner-testing.md), [Session Guide](design-partner-testing/session-guide.md), [Results Capture](design-partner-testing/results-capture.md), [Scorecard](design-partner-testing/scorecard.md), and [Synthesis Template](design-partner-testing/synthesis-template.md) are non-proof research and planning surfaces. Use them to frame partner-facing test tasks around the current evidence loop, gather observations about comprehension and workflow value, and identify future proof or documentation gaps.

Design-partner testing may reference:

- the current proof snapshot in [VISION.md](../VISION.md#current-roadmap-proof-snapshot);
- evidence paths and proof commands in this plan;
- generated demos as presentation aids only;
- product boundary constraints in [Product Portfolio Boundaries](product-portfolio-boundaries.md).

Design-partner testing must not:

- treat qualitative feedback as proof that a phase or target is implemented;
- use demo output as authority when evidence or phase contracts disagree;
- broaden P5 beyond `surfaces-protocol-static` and `surfaces-native-static`;
- claim production adapters, A2UI, live SurfaceOps, live JudgmentKit, SDKs, APIs, live runtimes, or action execution without target-specific passing evidence.

## Phase Evidence Cards

### P0: Synthetic Catalog Contract Proof
Value demonstrated: the compiler can turn design-system-shaped proof input into a governed Surfaces Catalog with deterministic validation, governance, diagnostics, and evidence.

Command:

```bash
interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0
```

Inputs:

- `fixtures/p0/source.fixture.json`
- `fixtures/p0/expectations.manifest.json`
- `fixtures/p0/valid.surface-ir.json`
- `fixtures/p0/invalid/*.json`
- `fixtures/p0/review/*.json`
- `fixtures/p0/mutations/*.json`
- P0-owned schemas under `schemas/`

Artifacts:

- `artifacts/p0/extract.json`
- `artifacts/p0/catalog.json`
- `artifacts/p0/governed-catalog.json`
- `artifacts/p0/adapter-diagnostics.json`
- `artifacts/p0/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p0/evidence.json`
- Presentation only: `demo/p0/index.html`

Promotion status:

- Current tracked evidence records `review_required` because review fixtures are structurally valid but cannot be promoted unattended.

Diagnostic coverage:

- Schema validation failures.
- Required source fields and source refs.
- Token alias, JSON Pointer, and `$extends` unresolved or circular references.
- Composite token shape failures.
- Duplicate catalog ids.
- Unknown components, props, variants, states, slots, actions, events, data bindings, and token refs.
- Invalid prop values, unsafe markup, illegal slot children, slot limits, disabled action execution, and accessibility contract failures.
- Review-required governance and evidence hash/provenance failures.

Non-goals:

- No real design-system extraction.
- No live Figma, Storybook, Code Connect, docs, or production HTML ingestion.
- No general runtime renderer.
- No production product surface.
- No A2UI compatibility claim.
- No live SurfaceOps or JudgmentKit execution.

### P1: Runtime Projection And Render-Plan Proof
Value demonstrated: the governed catalog can produce a hash-bound `web-static` projection and deterministic render plans without letting runtime output become a second authority.

Command:

```bash
interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1
```

Inputs:

- `artifacts/p0/evidence.json`
- `artifacts/p0/governed-catalog.json`
- `artifacts/p0/adapter-diagnostics.json`
- `fixtures/p1/expectations.manifest.json`
- `fixtures/p1/valid/*.json`
- `fixtures/p1/invalid/*.json`
- `fixtures/p1/review/*.json`
- `fixtures/p1/mutations/*.json`
- P0 and P1 consumed schemas under `schemas/`

Artifacts:

- `artifacts/p1/runtime-projection.json`
- `artifacts/p1/render-plan.confirm-panel.json`
- `artifacts/p1/render-plan.status-callout.json`
- `artifacts/p1/render-plan.button-defaults.json`
- `artifacts/p1/runtime-adapter-report.json`
- `artifacts/p1/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p1/evidence.json`
- Presentation only: `demo/p1/index.html`

Promotion status:

- Current tracked evidence records `review_required` because review-required runtime fixtures remain report/evidence-only and emit no render-plan artifact.

Diagnostic coverage:

- Missing or mismatched governed catalog refs.
- Projection authority escalation.
- Runtime projection hash mismatch.
- Missing render-plan provenance.
- Runtime action execution attempts.
- Unknown projection members or token refs.
- Runtime review-required handling.
- Runtime adapter evidence hash mismatch.

Non-goals:

- No general DOM runtime, React package, native adapter, web-component package, or public Surface IR protocol.
- No live action execution, callbacks, RPC, workflow triggers, network calls, or secrets.
- No modal or `alertdialog` runtime support.
- No SurfaceOps console or JudgmentKit execution.
- No A2UI compatibility claim.

### P2: Bounded Real Design-System Ingestion Proof
Value demonstrated: the platform can ingest a bounded, manifest-declared local source bundle from real design-system source material while preserving source refs, mappings, policy, diagnostics, and evidence.

Command:

```bash
interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

Inputs:

- `sources/p2/design-system-source/manifest.json`
- Manifest-declared local `@adobe/spectrum-design-data@0.7.0` files scoped to `button` and `in-line-alert`
- `sources/p2/design-system-source/mappings/*.json`
- `sources/p2/design-system-source/docs/usage-policy.json`
- `fixtures/p2/expectations.manifest.json`
- `fixtures/p2/valid/*.json`
- `fixtures/p2/invalid/*.json`
- `fixtures/p2/review/*.json`
- `fixtures/p2/mutations/*.json`
- P2-owned and consumed shared schemas under `schemas/`

Artifacts:

- `artifacts/p2/source-inventory.json`
- `artifacts/p2/source-mapping.json`
- `artifacts/p2/extract.json`
- `artifacts/p2/catalog.json`
- `artifacts/p2/governed-catalog.json`
- `artifacts/p2/ingestion-report.json`
- `artifacts/p2/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p2/evidence.json`
- Presentation only: `demo/p2/index.html`

Promotion status:

- Current tracked evidence records `review_required` because structurally valid manual mapping cases require review.

Diagnostic coverage:

- Missing source manifest, package integrity mismatch, undeclared source paths, malformed source refs, and source hash mismatch.
- Missing extracted source refs.
- Unmapped components, unsupported tokens, unsupported modes, ambiguous variants, and missing governance policy.
- Mapping review-required cases.
- Mapping authority escalation, duplicate normalized ids, invalid mapping row refs, and invalid mapping cardinality.
- Schema and evidence hash mismatch.

Non-goals:

- No live Figma export ingestion.
- No Storybook scraping or code-doc metadata ingestion.
- No Code Connect parser.
- No docs crawler.
- No production HTML extraction.
- No agent recruitment or work-order generation.
- No SurfaceOps persistence or JudgmentKit evaluator execution.
- No full Spectrum support or Adobe endorsement claim.

### P3: Inert Agent Orchestration Proof
Value demonstrated: agent work can be represented as governed, evidence-bound, scoped work orders after ingestion evidence passes, without authorizing live execution.

Command:

```bash
interfacectl surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3
```

Inputs:

- `artifacts/p2/evidence.json`
- `artifacts/p2/governed-catalog.json`
- `fixtures/p3/agent-capability-registry.fixture.json`
- `fixtures/p3/expectations.manifest.json`
- `fixtures/p3/valid/*.json`
- `fixtures/p3/invalid/*.json`
- `fixtures/p3/review/*.json`
- `fixtures/p3/mutations/*.json`
- P3-owned and consumed shared schemas under `schemas/`

Artifacts:

- `artifacts/p3/agent-capability-registry.json`
- `artifacts/p3/orchestration-plan.json`
- `artifacts/p3/work-order.contract-architect.json`
- `artifacts/p3/work-order.fixture-author.json`
- `artifacts/p3/work-order.evidence-reviewer.json`
- `artifacts/p3/review-queue.json`
- `artifacts/p3/agent-orchestration-report.json`
- `artifacts/p3/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p3/evidence.json`
- Presentation only: `demo/p3/index.html`

Promotion status:

- Current tracked evidence records `review_required` because review-required work is routed to a non-executable review queue.

Diagnostic coverage:

- Missing, failing, stale, or hash-mismatched upstream P2 evidence.
- Missing or hash-mismatched capability registry refs.
- Unregistered agents or capabilities.
- Denied tools, network, secrets, side effects, shell, or file-system access.
- Scope escalation and hidden output.
- Blocked review policy.
- Dependency cycles, missing dependencies, duplicate task ids, duplicate work-order ids, and hidden handoffs.
- Review-required work and report/evidence hash mismatches.

Non-goals:

- No live subagent spawning or execution.
- No autonomous code edits.
- No shell, plugin, connector, network, file-system, callback, or secret access from generated work orders.
- No task marketplace, job scheduler, or persistent queue.
- No SurfaceOps persistence.
- No JudgmentKit execution.
- No relaxation of P0, P1, or P2 evidence boundaries.

### P4: Review And Judgment Proof
Value demonstrated: review-required work can be consumed by deterministic review and evaluation artifacts while preserving catalog authority and evidence refs.

Command:

```bash
interfacectl surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4
```

Inputs:

- `artifacts/p3/evidence.json`
- `artifacts/p3/review-queue.json`
- `artifacts/p3/agent-orchestration-report.json`
- `fixtures/p4/expectations.manifest.json`
- `fixtures/p4/valid/*.json`
- `fixtures/p4/invalid/*.json`
- `fixtures/p4/review/*.json`
- `fixtures/p4/mutations/*.json`
- P4-owned and consumed shared schemas under `schemas/`

Artifacts:

- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/judgmentkit-evaluation-report.json`
- `artifacts/p4/review-judgment-report.json`
- `artifacts/p4/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p4/evidence.json`
- Presentation only: `demo/p4/index.html`

Promotion status:

- Current tracked evidence records `blocked`, proving that review and evaluation can reject invalid or unsafe outcomes without overriding upstream policy.

Diagnostic coverage:

- Missing, failing, stale, or hash-mismatched upstream P3 evidence and review queue refs.
- Missing SurfaceOps evidence refs.
- SurfaceOps catalog override attempts.
- Work-order execution attempts.
- Hidden decisions.
- Second-review-required cases.
- Duplicate committed decisions.
- JudgmentKit-shaped findings that omit boundary refs or attempt policy override.
- Ledger, report, and evidence hash mismatches.

Non-goals:

- No live SurfaceOps console.
- No persistent operational review-decision store.
- No live JudgmentKit MCP or connector invocation.
- No execution of P3 work orders.
- No live agents, shell commands, connector calls, network calls, callbacks, or secret access.
- No production adapters, A2UI exports, or protocol boundaries.

### P5: `surfaces-protocol-static` Protocol Boundary Proof
Value demonstrated: accepted ingestion and review evidence can feed a downstream protocol boundary that emits deterministic inert envelopes without becoming a production API or broad adapter claim.

Command:

```bash
interfacectl surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol
```

Inputs:

- `artifacts/p2/evidence.json`
- `artifacts/p2/governed-catalog.json`
- `artifacts/p4/evidence.json`
- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/review-judgment-report.json`
- `fixtures/p5/protocol/adapter-target-selection.fixture.json`
- `fixtures/p5/protocol/expectations.manifest.json`
- `fixtures/p5/protocol/valid/*.json`
- `fixtures/p5/protocol/invalid/*.json`
- `fixtures/p5/protocol/review/*.json`
- `fixtures/p5/protocol/mutations/*.json`
- P5 protocol-owned and consumed shared schemas under `schemas/`

Artifacts:

- `artifacts/p5/protocol/adapter-target-selection.json`
- `artifacts/p5/protocol/protocol-projection.json`
- `artifacts/p5/protocol/protocol-envelope.button.json`
- `artifacts/p5/protocol/protocol-envelope.in-line-alert.json`
- `artifacts/p5/protocol/protocol-adapter-report.json`
- `artifacts/p5/protocol/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p5/protocol/evidence.json`
- Presentation only: `demo/p5/protocol/index.html`

Promotion status:

- Current tracked evidence records `review_required` because review-required protocol fixtures remain report/evidence-only and emit no envelope artifact.

Diagnostic coverage:

- Missing, failing, stale, or hash-mismatched upstream P2/P4 evidence.
- Missing or hash-mismatched decision ledger and review report refs.
- Undeclared, out-of-scope, A2UI-claiming, or live-API-claiming targets.
- Target-selection hash mismatch.
- Missing or hash-mismatched protocol projection refs.
- Protocol projection authority escalation.
- Live action callback attempts.
- Production API and A2UI conformance claims without proof.
- Report projection and evidence hash mismatches.
- Review-required protocol action handling.

Non-goals:

- No public Surface IR protocol.
- No live production adapter, production API, SDK, service, transport, webhook, callback, queue, or network boundary.
- No live action execution.
- No live SurfaceOps or live JudgmentKit integration.
- No work-order execution.
- No A2UI export or conformance claim without a separate A2UI-specific P5 proof shape.
- No claim that future P5 targets are implemented by this static protocol-envelope proof.

### P5: `surfaces-native-static` Native Packet Proof
Value demonstrated: accepted P2/P4 authority can feed a Surfaces-native static-packet target while protocol evidence is consumed only as compatibility preflight, not native authority.

Command:

```bash
interfacectl surfaces native proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --protocol-evidence artifacts/p5/protocol/evidence.json --fixture fixtures/p5/native --out artifacts/p5/native
```

Inputs:

- `artifacts/p2/evidence.json`
- `artifacts/p2/governed-catalog.json`
- `artifacts/p4/evidence.json`
- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/review-judgment-report.json`
- `artifacts/p5/protocol/evidence.json` as compatibility preflight only
- `fixtures/p5/native/adapter-target-selection.fixture.json`
- `fixtures/p5/native/expectations.manifest.json`
- `fixtures/p5/native/valid/*.json`
- `fixtures/p5/native/invalid/*.json`
- `fixtures/p5/native/review/*.json`
- `fixtures/p5/native/mutations/*.json`
- P5 native-owned and consumed shared schemas under `schemas/`

Artifacts:

- `artifacts/p5/native/adapter-target-selection.json`
- `artifacts/p5/native/surfaces-native-projection.json`
- `artifacts/p5/native/surfaces-native-packet.button.json`
- `artifacts/p5/native/surfaces-native-packet.in-line-alert.json`
- `artifacts/p5/native/surfaces-native-report.json`
- `artifacts/p5/native/evidence.json`

Evidence and demo:

- Proof authority: `artifacts/p5/native/evidence.json`
- Presentation only: `demo/p5/native/index.html`

Promotion status:

- Current tracked evidence records `review_required` because review-required native fixtures remain report/evidence-only and emit no native packet artifact.

Diagnostic coverage:

- Missing, failing, stale, wrong-schema, wrong-path, wrong-source-evidence-hash, or hash-mismatched accepted P2/P4 authority refs.
- Missing, failing, stale, wrong-schema, wrong-path, or hash-mismatched protocol compatibility preflight refs.
- Undeclared, out-of-scope, A2UI-claiming, or live-native-API-claiming targets.
- Target-selection, projection, report, generated artifact, and evidence ref tuple mismatch.
- Native projection authority escalation.
- Live action callback, production API, SDK, transport, network, and A2UI conformance claims without proof.
- Review-required native action handling.

Non-goals:

- No A2UI clone, export, or conformance claim.
- No production native SDK, production API, native bridge, live runtime, renderer, package, callback, network, connector, or secret access.
- No expansion of `surfaces-protocol-static`; protocol evidence is compatibility preflight only.
- No action execution, live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, or authority override.

## Lifecycle Evidence Cards

### Generation Time
Question answered: can a generator or agent know what it may emit, what must be rejected, and what requires review before unsupported UI enters the system?

Evidence path:

- P0: `artifacts/p0/evidence.json`
- P2: `artifacts/p2/evidence.json`
- P3: `artifacts/p3/evidence.json`

Usability signal:

- A user can point at declared fixture/source inputs, run the phase command, and inspect deterministic diagnostics for unsupported components, props, variants, states, slots, actions, token refs, accessibility semantics, mappings, agent capabilities, tools, scopes, and review policies.
- Review-required outputs remain structurally inspectable but are not promoted unattended.

Value signal:

- The platform prevents unsupported generation from becoming hidden UI behavior.
- It converts ambiguity into diagnostics, review-required records, or explicit mapping requirements rather than inference.

Non-goals:

- Generation-time proof does not authorize live agent execution, autonomous edits, connector calls, network calls, secret access, or production UI emission.

### CI/CD Integration Time
Question answered: can a repository prove that generated contracts, artifacts, demos, and evidence are reproducible before implementation claims are shipped?

Evidence paths:

- `artifacts/p0/evidence.json`
- `artifacts/p1/evidence.json`
- `artifacts/p2/evidence.json`
- `artifacts/p3/evidence.json`
- `artifacts/p4/evidence.json`
- `artifacts/p5/protocol/evidence.json`
- `artifacts/p5/native/evidence.json`
- `artifacts/source-family-packaging/evidence.json`
- `artifacts/source-accessibility-policy/evidence.json`

Gate commands:

```bash
npm run check:p0:ci
npm run check:p1:ci
npm run check:p2:ci
npm run check:p3:ci
npm run check:p4:ci
npm run check:p5:protocol:ci
npm run check:p5:native:ci
npm run check:source-family-packaging:ci
npm run check:source-accessibility-policy:ci
npm run check:designer-workflow-trace:ci
```

Usability signal:

- Each phase has package scripts that materialize schemas and fixtures, run proof commands, build generated demos, run tests, check tracked drift, and guard against untracked phase outputs.
- The gates use POSIX-relative paths and deterministic artifact roots so they are scriptable in local development and CI.

Value signal:

- Evidence files, report artifacts, drift checks, untracked-output guards, and deterministic diagnostics turn claims into reproducible CI facts.

Non-goals:

- CI passing does not make demos authoritative.
- CI passing for `surfaces-protocol-static` or `surfaces-native-static` does not implement future P5 targets, production adapters, native SDKs, A2UI exports, hosted APIs, native bridges, or live services.

### Review Time
Question answered: can review-required work be routed, evaluated, approved, rejected, or held without losing evidence traceability?

Evidence path:

- Review queue input: `artifacts/p3/review-queue.json`
- Review authority for implemented behavior: `artifacts/p4/evidence.json`
- Decision ledger: `artifacts/p4/surfaceops-decision-ledger.json`
- Review/judgment report: `artifacts/p4/review-judgment-report.json`
- Presentation only: `demo/p4/index.html`

Usability signal:

- Reviewers can inspect queue item refs, work-order refs, evidence refs, decision rows, evaluation findings, diagnostics, and aggregate promotion status from generated artifacts.
- Invalid decisions, hidden decisions, policy overrides, execution attempts, and missing evidence refs are blocked by deterministic diagnostics.

Value signal:

- The platform preserves human review as governed evidence rather than informal approval text.
- SurfaceOps-shaped decisions and JudgmentKit-shaped findings consume evidence but cannot create catalog authority.

Non-goals:

- No live review console, persistent review database, live JudgmentKit invocation, live SurfaceOps persistence, or work-order execution is proven by P4.

### Runtime, Protocol, And Native Consumption Time
Question answered: can downstream consumers render or package only what accepted evidence authorizes, without adding authority or behavior?

Evidence path:

- Runtime projection proof: `artifacts/p1/evidence.json`
- Runtime projection: `artifacts/p1/runtime-projection.json`
- Render plans: `artifacts/p1/render-plan.*.json`
- Protocol proof: `artifacts/p5/protocol/evidence.json`
- Protocol projection: `artifacts/p5/protocol/protocol-projection.json`
- Protocol envelopes: `artifacts/p5/protocol/protocol-envelope.*.json`
- Native proof: `artifacts/p5/native/evidence.json`
- Native projection: `artifacts/p5/native/surfaces-native-projection.json`
- Native packets: `artifacts/p5/native/surfaces-native-packet.*.json`
- Presentation only: `demo/p1/index.html`, `demo/p5/protocol/index.html`, and `demo/p5/native/index.html`

Usability signal:

- Runtime consumers can inspect hash-bound projections and render plans for allowed surfaces.
- Protocol consumers can inspect target selection, protocol projection, inert envelopes, transport-free action descriptors, diagnostics, and evidence refs.
- Native consumers can inspect target selection, native projection, inert native packets, compatibility preflight refs, diagnostics, and evidence refs.
- Review-required cases are report/evidence-only and do not emit render-plan, protocol-envelope, or native-packet artifacts.

Value signal:

- The platform demonstrates runtime-safe, protocol-safe, and native-packet-safe consumption without letting consumers invent components, actions, tokens, accessibility semantics, transport behavior, or promotion policy.

Non-goals:

- P1 is not a general renderer or production adapter.
- P5 `surfaces-protocol-static` is not a production API, SDK, hosted protocol service, public protocol, A2UI export, or A2UI conformance proof.
- P5 `surfaces-native-static` is not a production native SDK, native bridge, live runtime, renderer, A2UI clone, A2UI conformance proof, or expansion of protocol authority.

## How To Use This Plan
Use this file as a human-readable evidence map during roadmap, release, demo, and review discussions.

When making an implementation claim, link to the relevant phase evidence path and proof command first. Link to demos only as a presentation aid. For any new capability, do not call it implemented until the phase or target has the complete proof shape: schema, fixture, proof command, diagnostics, report or artifact path, evidence path, generated demo where applicable, and passing evidence.
