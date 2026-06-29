# Synthetic Wave 2 Readout

## Status
This is a synthetic, non-proof research summary for the curated design-partner
testing program. It records a dry run with synthetic partner agents, not real
partners, partner data, production evidence, proof authority, SurfaceOps
decisions, JudgmentKit findings, or implementation claims.

The synthetic agents were prompted as blank-slate participants with no intended
prior project context. They received only synthetic organization context, the
current proof-only Surfaces stimulus, and the Wave 2 harder-stressor questions.
Their responses are planning signals only.

## Dry-Run Method
The dry run used four synthetic partner archetypes:

- Northstar Group: a merger-integration enterprise with three acquired product
  systems, conflicting source authority, terminology drift, and accessibility
  behavior differences.
- AtlasWorks: a large enterprise suite with more than 25 tools, partial
  design-system adoption, forked UI variants, and engineering pressure for CI
  gates that support exceptions.
- LumenHouse: a seven-brand platform company that needs shared interaction
  governance without flattening brand expression.
- Regulated-services partner: a regulated product organization that needs
  auditability, approval evidence, evidence retention, accessibility compliance,
  and clear release controls.

Each synthetic partner received the same Surfaces stimulus:

- Surfaces is proof infrastructure for governed generated UI.
- The design system is product authority.
- The Surfaces Catalog is governed contract authority.
- Passing evidence is proof authority.
- Demos are presentation only, not proof.
- Current scope is proof-only and does not include live source ingestion,
  production adapters, APIs, SDKs, A2UI, live SurfaceOps, live JudgmentKit, live
  runtimes, or action execution.

The session used two passes:

1. Unaided priority: each partner named the first proof target they would need
   before seeing candidate roadmap frontiers.
2. Framed worksheet: each partner reacted to candidate frontiers and completed a
   proof-shape worksheet with source family, minimum scope, diagnostics, command
   contract, artifact/report, evidence path, CI gate, non-goals, and blocker.

## Executive Summary
Synthetic Wave 2 confirmed that the governance/evidence loop survives harder
adoption constraints, but it also sharpened the boundary between a real
design-partner conversation and an implementation-ready pilot.

All four synthetic partners reported `Strong` evidence-loop comprehension. Three
reported `High` confidence and one reported `Medium` confidence. All four would
proceed to a real design-partner conversation if the conversation is framed as a
proof-oriented discovery or pilot-shaping discussion, not as production adoption
or runtime integration.

The leading next proof candidate is:

```text
A declared-source conformance and review proof that ingests a bounded local
source bundle, emits deterministic diagnostics and review-required output,
produces evidence-bound reports, and can be checked through CI without claiming
live ingestion, production adapters, APIs, SDKs, A2UI, live SurfaceOps, or live
JudgmentKit.
```

The common frontier appeared before facilitator framing, but each partner entered
through a different operating need:

- Northstar: authority reconciliation across acquired product systems.
- AtlasWorks: CI conformance and exception routing.
- LumenHouse: brand-preserving governance.
- Regulated-services partner: audit, approval, and evidence retention.

Treat those as target variants under one broader proof theme rather than as
separate roadmap branches.

## Partner Readouts
| Synthetic partner | Comprehension | Priority marker | First source family | First downstream target | Decision |
| --- | --- | --- | --- | --- | --- |
| Northstar Group | `Strong`, `High` confidence | `converged_before_framing` | Declared source bundle | Review workflow | Proceed to real design-partner conversation as authority-reconciliation proof discovery |
| AtlasWorks | `Strong`, `High` confidence | `converged_before_framing` | Declared source bundle | React/web conformance | Proceed to real design-partner conversation as CI governance evidence discovery |
| LumenHouse | `Strong`, `Medium` confidence | `converged_before_framing` | Declared source bundle | Review workflow | Proceed to real design-partner conversation as brand-governance proof discovery |
| Regulated-services partner | `Strong`, `High` confidence | `converged_before_framing` | Declared source bundle | Review workflow | Proceed to real design-partner conversation as release-control evidence discovery |

## Recurring Acceptance Signals
The recurring acceptance signals were:

- declared local source bundles make proof-oriented discovery credible without
  requiring live connectors;
- deterministic diagnostics help design-system, platform, accessibility,
  content, brand, engineering, and compliance stakeholders understand blocked
  and review-required output;
- CI-style evidence is a natural trust boundary if it emits stable reports,
  source refs, artifact hashes, diagnostics, and evidence paths;
- review-required output is useful when it has owner, rationale, expiry or
  decision metadata, and retained evidence;
- static protocol/native outputs are understandable when repeatedly framed as
  inert proof artifacts, not runtime or production support.

## Recurring Blockers
| Severity | Blocker | Pattern |
| --- | --- | --- |
| High | Current proof scope is not enough for implementation-oriented adoption | Northstar and the regulated-services partner explicitly said no credible implementation-oriented pilot exists yet under current proof-only scope; LumenHouse said current scope can support discovery but not implementation adoption. |
| High | Declared source policy needs richer coverage | All four partners need source bundles that include policy, provenance, accessibility, terminology, brand, exception, or approval information beyond basic component metadata. |
| High | Operational ownership must be explicit | All four partners named governance owners for review-required output and rejected generator-owned approval. |
| Medium | Production path still matters | Partners accepted proof-only discovery, but AtlasWorks and LumenHouse still need eventual production adapter, API, SDK, or runtime paths before adoption. |
| Medium | Pitch wording can still overclaim | All four partners flagged `governed generated UI` as risky unless it is immediately qualified as proof-only and non-production in current scope. |

## Proof Candidate Shape
The recommended next proof candidate should stay target-specific and bounded.

Minimum shape:

- source family: manifest-declared local source bundle;
- input coverage: components plus source refs, provenance, variants, states,
  accessibility expectations, terminology/content policy, brand or system
  exceptions, and review/approval metadata where relevant;
- schemas and fixtures: source manifest, catalog or policy contract, exception
  or authority model, invalid cases, review-required cases, expectations, and
  evidence;
- diagnostics: stable blocking, review-required, and informational diagnostics
  with severity, source refs, owner or authority, canonical message, artifact
  path, and evidence impact;
- command contract: deterministic local command with POSIX-relative source,
  fixture, and output roots;
- artifacts and reports: governed catalog or catalog delta, diagnostics report,
  conformance or conflict report, review-required queue or approval ledger, and
  final evidence;
- CI gate: fail on blocking diagnostics, missing provenance, invalid schema,
  stale evidence, non-determinism, unsupported production claims, or unreviewed
  review-required output;
- non-goals: no live ingestion, production adapter, API, SDK, A2UI, live
  SurfaceOps, live JudgmentKit, live runtime, action execution, or policy
  invention.

## Success Criteria Assessment
| Criterion | Result | Notes |
| --- | --- | --- |
| At least 3 of 4 synthetic partners report `Strong` or `Mixed` evidence-loop comprehension | Pass | All four reported `Strong`; three were `High` confidence and one was `Medium` confidence. |
| At least 3 partners can name a concrete next proof target with source, diagnostics, command, artifact/report, evidence, and CI expectations | Pass | All four completed a concrete proof-shape worksheet. |
| At least 2 partners converge unaided on the same first implementation frontier, or synthesis records convergence timing | Pass with nuance | All four marked `converged_before_framing`, but the literal unaided labels differed. The shared frontier is a declared-source conformance and review proof with partner-specific variants. |
| No synthetic partner treats current static protocol/native outputs as production API, SDK, A2UI, or runtime support after clarification | Pass | All four preserved the proof-only boundary. |
| The synthesis allows `no credible pilot yet` and records missing proof shape | Pass | At least two partners said current scope is not enough for implementation-oriented adoption. The missing proof shape is the declared-source conformance and review proof described above. |

## Wave 2 Decision
Proceed to real design-partner conversations only as proof-candidate discovery.

Do not claim implementation-oriented pilot readiness yet. The strict planning
signal is:

- real design-partner conversations are warranted;
- production adoption conversations are premature;
- the next proof candidate should be written before any product claim changes;
- the pitch must qualify `governed generated UI` as proof-only in current scope.

Recommended pitch language:

```text
Surfaces proves whether generated UI conforms to declared design-system
authority and emits deterministic evidence before promotion. Current outputs are
proof artifacts, not production APIs, SDKs, adapters, A2UI, or live runtimes.
```

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | Declared-source conformance and review proof remains planning-only until full proof shapes and passing evidence exist. |
