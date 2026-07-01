# Richer Source Conformance Scenario Pack

## Status
This is a subordinate, planning-only scenario pack for the next declared-source
conformance and review proof candidate. It is not a phase subplan, proof
contract, implemented fixture set, schema, diagnostic registry, command,
artifact path, evidence path, CI gate, demo, SurfaceOps decision, JudgmentKit
finding, customer validation, product claim, or production-adoption signal.

The currently implemented source-conformance target remains the proof authority
only for the scope recorded in `artifacts/source-conformance/evidence.json`.
This scenario pack describes candidate coverage beyond that implemented scope.
Broader coverage remains planned until a later target adds its own schema,
fixture coverage, diagnostics, command behavior, generated reports or artifacts,
evidence path, CI gate, and passing evidence.

## Objective
The synthetic designer-workflow trace dry run found that one Button scenario is
enough to explain the evidence loop, but not enough to test partner-shaped
governance pressure. This pack turns those synthetic signals into candidate
scenario requirements for the next proof-planning pass.

The goal is to test whether richer declared-source authority can express:

- conflicting source authority without policy invention;
- forked variants and governed exceptions without silent approval;
- multi-brand drift without flattening brand expression;
- approval, retention, release-control, and accessibility requirements without
  claiming live workflow or production runtime support;
- ownership routing for source correction, catalog correction, exception
  approval, future proof scope, and proof-only target handoff.

## Boundary Rules
Any future implementation derived from this pack must preserve these rules:

- use a manifest-declared local source bundle only;
- preserve source refs on every emitted row, diagnostic, report entry, and
  review-required record;
- treat mappings as reconciliation, not new policy authority;
- keep review-required output non-executable and owner-bound;
- reject production API, SDK, adapter, A2UI, live runtime, live SurfaceOps, live
  JudgmentKit, action execution, customer-validation, pilot-readiness, or
  self-serve claims;
- keep protocol/native outputs labeled as proof-only static target artifacts
  unless a future P5 target proves production behavior;
- store no partner data, source files, screenshots, recordings, transcripts,
  private URLs, credentials, customer names, or proprietary examples in this
  repo.

## Candidate Retest Scenario
Use one integrated Button scenario family before splitting into separate proof
targets.

The first retest should include:

- one allowed Button path backed by declared source refs and accepted catalog
  authority;
- one review-required Button exception with owner, rationale, expiry, and
  evidence-bound review metadata;
- one blocked drift or authority-conflict case;
- one accessibility or behavior policy diagnostic;
- one proof-only protocol or native handoff reference that remains inert and
  non-production;
- one regeneration expectation showing what changes when source authority,
  policy, review metadata, or target requirements change.

## Scenario Variants
| Variant | Synthetic signal | Candidate source shape | Required result | Future proof reason |
| --- | --- | --- | --- | --- |
| Multi-source authority reconciliation | Northstar Group needs three acquired systems with conflicting source authority, terminology drift, and accessibility behavior differences. | Three declared Button source documents, a source-precedence policy, terminology aliases, accessibility behavior notes, and a manual reconciliation mapping. | Allowed output only when authority precedence is explicit; unresolved conflict blocks; ambiguous mapping routes to review. | Proves source conflicts become diagnostics or review-required rows instead of inferred policy. |
| Governed exception routing | AtlasWorks needs forked UI variants and CI gates that support exceptions without weakening compliance. | One accepted Button variant, one forked Button variant, exception policy, owner, rationale, expiry, and stale-exception case. | Approved exception is review-required and non-executable; undocumented drift blocks; expired exception blocks or requires renewal. | Proves exceptions are governed records, not generator-owned approvals. |
| Multi-brand governance drift | LumenHouse needs shared interaction governance with brand-specific expression. | Shared Button interaction contract, brand token scopes, brand-specific visual token mappings, and one brand-policy violation. | Brand token variation is allowed only within declared scopes; shared-interaction violation blocks; campaign exception routes to review. | Proves brand expression can vary without weakening shared interaction authority. |
| Regulated release control | Regulated-services partner needs auditability, approvals, evidence retention, accessibility compliance, and release controls. | Accessibility-sensitive Button change, approval record, retention manifest, release-gate policy, stale approval, and accessibility regression case. | Complete approval and retention metadata permits review-required inspection; stale approval or accessibility regression blocks. | Proves audit and release-control metadata can be evidence-bound without live workflow claims. |

## Candidate Source Files
These are planning names only. Do not create them under `sources/` until the
future proof target owns the schema and fixture contract.

```text
sources/next-proof/richer-source-conformance/
  manifest.json
  components/button.core.json
  components/button.acquired-a.json
  components/button.acquired-b.json
  components/button.forked-variant.json
  policies/source-precedence.json
  policies/accessibility-behavior.json
  policies/terminology-aliases.json
  policies/brand-scopes.json
  governance/exception-policy.json
  governance/approval-policy.json
  governance/retention-policy.json
  mappings/button-authority-map.json
```

## Candidate Fixture Coverage
These are planning names only. Do not create them under `fixtures/` until the
future proof target owns the schema and fixture contract.

```text
fixtures/next-proof/richer-source-conformance/
  valid/button-authority-accepted.source-conformance.json
  review/button-forked-exception.source-conformance.json
  review/button-brand-campaign-exception.source-conformance.json
  invalid/button-unresolved-source-conflict.source-conformance.json
  invalid/button-undocumented-fork-drift.source-conformance.json
  invalid/button-shared-interaction-violation.source-conformance.json
  invalid/button-accessibility-regression.source-conformance.json
  invalid/button-stale-approval.source-conformance.json
  invalid/button-production-target-claim.source-conformance.json
  mutations/source-path-undeclared.declared-source-manifest.json
  mutations/source-hash-mismatch.declared-source-manifest.json
  mutations/report-hash-mismatch.source-conformance-report.json
  mutations/evidence-hash-mismatch.source-conformance-evidence.json
```

## Candidate Diagnostics
The existing source-conformance registry already covers several narrow cases.
A broader target would need additional diagnostics or stricter variants.

Current implementation note: the narrow governed-exception expiry slice uses
`SOURCE_REVIEW_EXPIRED` in source-conformance evidence. The broader
`SOURCE_EXCEPTION_EXPIRED` row below remains planning terminology for a future
generalized scenario pack unless that target adds its own full proof shape.

| Candidate code | Trigger | Intended promotion status |
| --- | --- | --- |
| `SOURCE_PRECEDENCE_MISSING` | Multiple declared sources claim authority and no precedence rule resolves the conflict. | `blocked` |
| `SOURCE_MAPPING_AMBIGUOUS` | A term, component, token, variant, or behavior mapping cannot be resolved deterministically. | `review_required` |
| `SOURCE_EXCEPTION_EXPIRED` | Exception metadata is expired, stale, or not evidence-bound. | `blocked` |
| `SOURCE_EXCEPTION_OWNER_MISSING` | Review-required exception omits owner, rationale, expiry, or decision metadata. | `blocked` |
| `SOURCE_BRAND_SCOPE_VIOLATION` | Brand-specific token or variant usage exceeds declared brand scope. | `blocked` |
| `SOURCE_SHARED_INTERACTION_VIOLATION` | Brand or forked variant changes shared interaction behavior absent authority. | `blocked` |
| `SOURCE_ACCESSIBILITY_BEHAVIOR_CONFLICT` | Declared sources disagree on accessibility behavior without an authority rule. | `blocked` |
| `SOURCE_APPROVAL_STALE` | Approval or release-control metadata is stale or not evidence-bound. | `blocked` |
| `SOURCE_RETENTION_REF_MISSING` | Required evidence retention reference is missing or malformed. | `blocked` |
| `SOURCE_TARGET_HANDOFF_OVERCLAIM` | Source, fixture, report, or target metadata implies production API, SDK, adapter, runtime, A2UI, live SurfaceOps, or live JudgmentKit support. | `blocked` |

Each implemented diagnostic would need canonical message, stage, severity,
promotion status, artifact path, JSON Pointer, source ref, suggested action,
diagnostic source, and fixture coverage before it can become proof authority.

## Ownership Routing
The next scenario should force every non-allowed outcome into exactly one
planning disposition:

| Outcome | Preferred route | Do not route to |
| --- | --- | --- |
| Missing or conflicting source authority | Source material, source-precedence policy, or mapping update. | Demo patch, protocol envelope patch, native packet patch. |
| Forked variant with business justification | Review-required exception with owner, rationale, expiry, and evidence. | Silent catalog broadening or generator-owned approval. |
| Brand expression within declared scope | Brand policy or token-scope mapping. | Shared interaction policy change. |
| Brand or forked behavior changing shared interaction | Source authority correction or blocked diagnostic. | Downstream target artifact mutation. |
| Accessibility behavior conflict | Accessibility policy authority or blocked diagnostic. | Visual-only approval. |
| Stale approval or retention gap | Governance approval or retention source update. | SurfaceOps live decision claim. |
| Production handoff request | Future target-specific P5 proof candidate. | Current protocol/native proof-only static output. |

## P5 Wording Control
Use this wording in retests:

```text
P5 protocol and native artifacts in this repo are proof-only static outputs.
They demonstrate hash-bound target handoff mechanics for accepted evidence. They
are not production adapters, APIs, SDKs, live runtimes, A2UI exports, native
bridges, live SurfaceOps integrations, or live JudgmentKit integrations.
```

Avoid shorthand such as:

```text
Native handoff is supported.
```

Use instead:

```text
The current native-static proof emits inert native packets only where accepted
evidence authorizes that proof target.
```

## Retest Success Criteria
A synthetic retest is useful only if it can answer these questions without
changing proof evidence:

- Can each archetype classify allowed, review-required, and blocked outcomes?
- Can each archetype identify the source refs or policy refs that should change?
- Can each archetype distinguish current proof-only P5 static outputs from
  production adapter, API, SDK, runtime, native bridge, or A2UI support?
- Do at least three archetypes still report `High` or `Medium` comprehension?
- Do at least two archetypes converge on one target-specific next proof
  boundary before facilitator framing?
- Does any archetype still treat demos or protocol/native outputs as proof
  authority after correction?

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | Planning only until a later target adds schema, fixture coverage, diagnostics, command behavior, generated reports or artifacts, evidence path, CI gate, and passing evidence. |
