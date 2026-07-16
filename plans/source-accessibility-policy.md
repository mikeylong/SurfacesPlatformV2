# Source Accessibility Policy Proof Target

## Status

Implemented as a non-numbered Connect Authority proof target when
`artifacts/source-accessibility-policy/evidence.json` records
`status: "pass"`.

The tracked result records `promotionStatus: "review_required"`. Three of the
five declared behaviors match existing P2 catalog facts. Two remain
review-required because the accepted catalog does not contain the asserted
fact. A passing proof does not promote those missing facts or claim that any
runtime is accessible.

This plan is subordinate to `VISION.md`, `PLAN.md`, and the completed
declared-source conformance plan. It defines one mechanical authority-
reconciliation contract. It does not expand P2, replace the completed
authority compiler, or broaden the accepted source-family packaging proof.

## Purpose

The target closes one bounded authority gap: checked accessibility policy can
be connected to exact Button and InLineAlert catalog facts without treating
policy prose as executable behavior.

The proof answers three questions:

- Which structured accessibility behavior declarations match facts already in
  the accepted P2 catalog?
- Which declarations are missing or ambiguous and must stay in an owner-bound,
  non-executable review queue?
- Did the reconciliation preserve the accepted P2, source-conformance, and
  source-family packaging boundaries without adding catalog capability?

The P2 catalog remains the fact authority used for assertion evaluation.
Source-conformance and source-family packaging evidence remain upstream proof
authority. The generated coverage, authority map, review queue, report, and
evidence describe the reconciliation only.

## Structured-Only Guardrail

Behavior authority comes only from
`sources/source-accessibility-policy/accessibility-behavior-declarations.json`.
The declaration set must record `authorityMode: "structured-assertions-only"`.
Each closed declaration supplies:

- a `behaviorId`, closed `behaviorKind`, and Button or InLineAlert
  `componentId`;
- an exact accessibility-policy requirement ref and its opaque value hash;
- one or more assertions with a scoped catalog JSON Pointer, closed operator,
  expected JSON value, and source refs;
- explicit missing and conflict outcomes plus an optional declared review
  route.

The only assertion operators are `equals` and `exists`. Catalog pointers are
restricted to existing Button or InLineAlert `accessibility` and `tokenRefs`
subtrees. `equals` compares RFC 8785/JCS canonical JSON values. `exists` checks
only whether the scoped pointer is present.

Free-form fields such as `text`, `description`, and `policyText` cannot define
a behavior declaration. The invalid free-form fixture must produce
`SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN`. No parser, model, heuristic,
or keyword mapping may turn prose into a behavior kind, catalog pointer,
operator, expected value, precedence decision, diagnostic, or promotion
status.

## Opaque Policy Requirement Hash Rule

`sources/source-conformance/declared-source-bundle/policies/accessibility.json`
contains the checked `requirements` values. Each behavior declaration points
to one exact array entry and records `policyRequirementValueHash` as the
SHA-256 of that entry's RFC 8785/JCS canonical JSON value.

The proof may use the requirement value only to recompute and compare that
hash. A matching hash binds the declaration to the checked policy entry's
identity. It does not authorize the proof to interpret the requirement text or
infer any structured behavior from it. A missing requirement, changed value,
wrong index, or mismatched hash fails closed with
`SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING`.

The structured declaration remains the only source for the asserted behavior.
Changing policy prose requires an explicit declaration review and regenerated
hash; it cannot silently change the behavior contract.

## Exact Inputs

The command accepts only the following fixed, POSIX-relative roots and files:

- structured source root: `sources/source-accessibility-policy`;
- P2 ingestion evidence: `artifacts/p2/evidence.json`;
- P2 governed catalog: `artifacts/p2/governed-catalog.json`;
- source-conformance evidence:
  `artifacts/source-conformance/evidence.json`;
- source-conformance governed catalog:
  `artifacts/source-conformance/governed-catalog.json`;
- source-family packaging evidence:
  `artifacts/source-family-packaging/evidence.json`;
- fixture root: `fixtures/source-accessibility-policy`;
- output root: `artifacts/source-accessibility-policy`.

The structured source root contains exactly:

```text
sources/source-accessibility-policy/
  manifest.json
  accessibility-behavior-declarations.json
```

`manifest.json` binds the raw bytes of the declaration file with SHA-256. The
proof rejects an undeclared source file, missing file, symlink, or byte drift.

The proof also reads two already checked declared-source inputs through the
accepted source-conformance closure:

- `sources/source-conformance/declared-source-bundle/policies/accessibility.json`
  for opaque requirement-value hash checks;
- `sources/source-conformance/declared-source-bundle/governance/authority-profile.json`
  for exact review-route owner, policy, expiry, and `executable: false`
  matching.

Assertions evaluate against `artifacts/p2/governed-catalog.json`. The
source-conformance catalog is an integrity-bound upstream input; it is not a
second fact authority and cannot be used to fill a missing P2 catalog fact.

## Schemas

The target owns this complete schema closure:

```text
schemas/source-accessibility-policy-manifest.v0.schema.json
schemas/source-accessibility-behavior-declarations.v0.schema.json
schemas/source-accessibility-policy-coverage.v0.schema.json
schemas/source-accessibility-policy-authority-map.v0.schema.json
schemas/source-accessibility-policy-review-queue.v0.schema.json
schemas/source-accessibility-policy-report.v0.schema.json
schemas/source-accessibility-policy-evidence.v0.schema.json
schemas/source-accessibility-policy-expectations.v0.schema.json
schemas/source-accessibility-policy-fixture.v0.schema.json
schemas/source-accessibility-policy-diagnostics.v0.schema.json
schemas/source-accessibility-policy-preflight-mutation.v0.schema.json
```

The schemas are closed. They preserve deterministic timestamps, null
host-derived fields, scoped catalog pointers, closed behavior and operator
sets, non-executable review routing, artifact refs, hashes, diagnostics,
fixture expectations, and evidence closure.

## Fixtures

The fixture root is exact and closed:

```text
fixtures/source-accessibility-policy/
  expectations.manifest.json
  valid/
    button-accessible-name.source-accessibility-policy.json
    button-keyboard-activation.source-accessibility-policy.json
    inline-alert-status-announcement.source-accessibility-policy.json
    policy-authorized-precedence.source-accessibility-policy.json
  review/
    focus-visible-unproven.source-accessibility-policy.json
    contrast-token-unproven.source-accessibility-policy.json
    ambiguous-mapping.source-accessibility-policy.json
  invalid/
    free-form-policy-text.source-accessibility-policy.json
    policy-catalog-conflict.source-accessibility-policy.json
    unsupported-behavior.source-accessibility-policy.json
    review-owner-missing.source-accessibility-policy.json
    authority-escalation.source-accessibility-policy.json
    source-ref-missing.source-accessibility-policy.json
    precedence-unresolved.source-accessibility-policy.json
  mutations/
    missing-upstream-evidence.source-accessibility-policy-preflight.json
    upstream-hash-mismatch.source-accessibility-policy-preflight.json
    source-hash-mismatch.source-accessibility-policy.json
    evidence-hash-mismatch.source-accessibility-policy.json
```

The expectations manifest defines every fixture's kind, expected result,
promotion status, diagnostic codes, artifact path, and JSON Pointer. The proof
passes only when all 18 fixture rows match. Invalid and mutation diagnostics
are expected causal coverage, so they appear in a passing report.

## Command

Materialization:

```bash
npm run materialize:source-accessibility-policy
```

Proof package script:

```bash
npm run proof:source-accessibility-policy
```

Expanded proof command:

```bash
interfacectl surfaces source-accessibility-policy proof \
  --source sources/source-accessibility-policy \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --source-conformance-evidence artifacts/source-conformance/evidence.json \
  --source-conformance-catalog artifacts/source-conformance/governed-catalog.json \
  --source-family-packaging-evidence artifacts/source-family-packaging/evidence.json \
  --fixture fixtures/source-accessibility-policy \
  --out artifacts/source-accessibility-policy
```

All eight arguments are required and must match the fixed contract paths.
Missing, duplicated, absolute, non-normalized, or substituted paths fail as
usage errors. Output must satisfy the repository's safe-output rules and may
contain only the five declared artifacts.

## Structured Behavior Set

The declaration set contains exactly five bounded behaviors:

| Behavior | Exact catalog assertion | Accepted result |
| --- | --- | --- |
| `button-accessible-name` | `/components/Button/accessibility/nameFrom` equals `"content"` | `allowed` |
| `button-keyboard-activation` | `/components/Button/accessibility/keyboard` equals `["Enter", "Space"]` | `allowed` |
| `button-focus-visible` | `/components/Button/accessibility/focusVisible` equals `true` | `review_required` because the fact is absent |
| `inline-alert-status-announcement` | `/components/InLineAlert/accessibility/role` equals `"status"` and `/components/InLineAlert/accessibility/wcag` equals the declared WCAG 4.1.3 record | `allowed` |
| `button-contrast-token` | `/components/Button/tokenRefs/contrast-token` exists | `review_required` because the fact is absent |

`allowed` means only that each declared expected value is JCS-equal to the
existing P2 catalog value at proof time. `review_required` preserves missing
facts without adding them. Neither status is a browser, assistive-technology,
component implementation, or WCAG conformance result.

The declaration set reuses the checked `design-systems-governance` review
route. It does not invent a new owner. Every generated review item remains
`executable: false`.

## Generated Artifacts

The target emits exactly five deterministic, tracked artifacts:

```text
artifacts/source-accessibility-policy/
  accessibility-policy-coverage.json
  accessibility-policy-authority-map.json
  accessibility-policy-review-queue.json
  accessibility-policy-conformance-report.json
  evidence.json
```

- Coverage records expected and actual value hashes, match results, and
  behavior status.
- The authority map binds each behavior to its catalog pointers, policy ref,
  source refs, and status while recording `catalogCapabilityAdded: false`.
- The review queue preserves the two missing baseline facts and the ambiguous-
  mapping fixture as three owner-bound, non-executable items.
- The report records all fixture results, canonical diagnostics, boundary
  refs, summary, command, arguments, and promotion result.
- Final evidence closes and hash-binds the entire target.

The target emits no demo and no runtime evidence.

## Diagnostics

The canonical diagnostic registry contains:

| Code | Failure or review class |
| --- | --- |
| `SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING` | Required upstream evidence is absent, failing, or has an unexpected promotion result. |
| `SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH` | P2, source-conformance, source-family packaging, or bound catalog integrity does not match. |
| `SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH` | Structured source bytes or the exact source-file closure differ from the manifest. |
| `SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN` | Free-form policy text is presented as behavior authority. |
| `SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT` | A structured expected value contradicts an existing accepted catalog value. |
| `SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED` | A blocked structured declaration has no accepted catalog fact. |
| `SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS` | More than one catalog mapping requires declared owner review. |
| `SOURCE_ACCESSIBILITY_REVIEW_REQUIRED` | A review-routed declaration has no accepted catalog fact. |
| `SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING` | Review output does not match the checked owner-bound, non-executable route. |
| `SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION` | Reconciliation attempts to write outside the bounded accessibility or token-ref pointers or add catalog capability. |
| `SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING` | A declaration lacks the required policy/fact refs or its opaque requirement hash does not match. |
| `SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED` | A source conflict lacks the checked explicit primary-precedence resolution. |
| `SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH` | Report, artifact, boundary, closure, or final evidence integrity does not match. |

Canonical messages, stages, severities, promotion statuses, artifact paths,
JSON Pointers, suggested actions, and fixture coverage live in the diagnostics
schema and expectations manifest. Proof output must use those values exactly.

## Evidence Closure

`artifacts/source-accessibility-policy/evidence.json` closes over:

- all 11 target-owned schemas;
- both structured source files, with raw-byte hashes;
- the expectations manifest and all 18 fixture files;
- P2 evidence and governed catalog;
- source-conformance evidence and governed catalog;
- source-family packaging evidence;
- coverage, authority map, review queue, and conformance report;
- final evidence through the repository's null-placeholder self-hash
  procedure.

The proof verifies the P2 evidence self-ref and catalog hash, the complete
source-conformance evidence closure and catalog hash, the source-family
packaging evidence closure, and `candidateEvidenceClosureVerified: true`
before reconciliation. It does not regenerate or alter those upstream
artifacts.

Schema, fixture, boundary, and generated-artifact paths are ordered and
hash-bound. Source hashes use raw file bytes. JSON contracts and artifacts use
RFC 8785/JCS canonical hashing. The report and evidence must agree on run id,
boundary refs, artifact refs, structured-only status, catalog capability,
proof status, and promotion status. Generated time is normalized to
`1970-01-01T00:00:00.000Z`; host is `null`.

## Pass Condition

The target passes only when:

- all fixed command paths, schemas, source files, fixtures, and output-root
  rules validate;
- P2 evidence passes and its catalog hash matches;
- source-conformance and source-family packaging evidence pass with their
  accepted `review_required` promotion status and full integrity checks;
- the manifest matches the exact structured declaration bytes and source-file
  closure;
- every behavior id is unique and every declaration stays within the closed
  structured schema and pointer boundary;
- every policy requirement ref exists and its opaque JCS value hash matches;
- every review route matches the checked authority profile route id, owner,
  rationale, policy ref, expiry, and non-executable state;
- no baseline behavior resolves to `blocked`;
- the current coverage resolves three behaviors to `allowed`, two to
  `review_required`, and none to `blocked`;
- all 4 valid, 3 review, 7 invalid, and 4 mutation fixture expectations match
  their canonical results and diagnostics;
- every review item has the checked owner, rationale, policy ref, expiry,
  required source refs, and `executable: false`;
- all five generated artifacts validate, contain no stale output, and match
  their declared hashes;
- final evidence passes its full closure and self-hash verification;
- the result records `status: "pass"`,
  `promotionStatus: "review_required"`,
  `structuredDeclarationsOnly: true`, and
  `catalogCapabilityAdded: false`.

The `review_required` promotion result is intentional. Owner review records an
unresolved authority gap; it cannot approve or manufacture the absent P2
facts.

## CI

Package gates:

```bash
npm run check:source-accessibility-policy
npm run check:source-accessibility-policy:ci
npm run check:source-accessibility-policy:ci:phase
npm run check:source-accessibility-policy:untracked
```

`check:source-accessibility-policy` materializes the fixed upstream chain and
this target, runs the proof, and runs the serial Node test suite.
`check:source-accessibility-policy:ci` runs the complete source-family
packaging CI gate before the phase-only accessibility-policy gate. The phase
gate checks regenerated drift across contracts, sources, fixtures, artifacts,
implementation, tests, package scripts, workflow, and canonical docs, then
rejects untracked target files.

GitHub Actions runs the `source-accessibility-policy-proof` job on Node 22 after
`source-family-packaging-proof`. The job installs with `npm ci` and runs:

```bash
npm run check:source-accessibility-policy:ci:phase
```

The capability-index CI chain also requires the phase-only gate. Proof and test
commands remain sequential because upstream materializers and repository tests
write deterministic workspace output.

## Accepted Claims

Passing evidence supports only these claims:

- the repo has a deterministic, structured-only reconciliation for exactly
  five Button and InLineAlert accessibility declarations;
- three declarations match exact facts already present in the accepted P2
  catalog;
- the missing Button focus-visible and contrast-token facts remain explicit,
  owner-bound, and non-executable review work;
- free-form policy text cannot become behavior authority;
- each declaration is identity-bound to one opaque checked policy requirement
  value without interpreting that value;
- explicit checked source precedence can resolve the bounded precedence
  fixture, while unresolved precedence blocks;
- reconciliation adds no P2 catalog capability and preserves the accepted
  P2, source-conformance, and source-family packaging proof boundaries;
- schemas, sources, fixtures, upstream evidence, generated artifacts, report,
  and final evidence are deterministically closed and hash-bound.

## Non-Goals

- No runtime accessibility claim, WCAG conformance claim, assistive-technology
  result, browser behavior, keyboard execution, focus rendering, contrast
  measurement, or live announcement proof.
- No broader P2 component, source, token, state, action, behavior, or
  accessibility coverage.
- No new catalog fact, governed-catalog rewrite, ingestion authority, or
  promotion of a review-required declaration.
- No natural-language policy interpretation, semantic extraction, model-based
  inference, or free-form rule engine.
- No arbitrary source-family packaging, arbitrary source layout, new package
  ABI, connector family, or source namespace.
- No live connector, source API, crawler, network fetch, or production
  ingestion path.
- No self-serve connection or review UI.
- No production adapter, public API, SDK, hosted runtime, native runtime, or
  A2UI proof.
- No agent recruitment, tool execution, file mutation outside deterministic
  proof artifacts, or expansion of P3 orchestration.
- No live SurfaceOps action and no JudgmentKit invocation or judgment claim.
- No customer validation, pilot readiness, production readiness, or public
  product adoption claim.
