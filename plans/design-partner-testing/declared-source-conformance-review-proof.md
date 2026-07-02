# Declared-Source Conformance And Review Proof Candidate

## Status
This is a subordinate, planning-only proof-candidate memo derived from
design-partner testing synthesis. It covers broader declared-source conformance
and review coverage beyond the currently implemented source-conformance target.
It is not a phase subplan, proof contract, implementation claim,
source-eligibility decision, P2 expansion, P4 review target, P5 adapter target,
schema, fixture, diagnostic registry, command contract, artifact path, evidence
path, demo, CI gate, or product claim.

Authority remains `VISION.md`, `PLAN.md`, the relevant phase subplans, and
passing `artifacts/**/evidence.json` for implemented proof slices. Until a later
placement decision defines the complete proof shape and passing evidence,
broader declared-source conformance and review remains planned candidate work
only.

## Why This Candidate Exists
Synthetic Wave 2 converged on one practical next proof theme:

```text
A bounded declared-source proof that can ingest richer source authority, emit
deterministic conformance diagnostics, preserve review-required output, produce
evidence-bound reports, and support CI discussion without claiming live
production behavior.
```

The synthetic partner variants were different, but compatible:

- Northstar Group needs source-authority reconciliation across acquired systems.
- AtlasWorks needs CI conformance and exception routing.
- LumenHouse needs brand-preserving governance.
- The regulated-services partner needs audit, approval, and evidence retention.

Treat those as candidate variants under one planning theme. The first
source-precedence/conflict subset has since been implemented inside the existing
source-conformance target when `artifacts/source-conformance/evidence.json`
passes: declared Button supporting source refs, source-precedence policy,
accepted explicit precedence, blocked unresolved conflict, and ambiguous mapping
review routing. Do not treat this memo as proof that the broader theme is
implemented or that a real partner would adopt it.

## Placement
This memo belongs under `plans/design-partner-testing/` until the project makes
a later placement decision.

It should not move into `plans/p2/`, `plans/p4/`, or `plans/p5/` yet:

- A P2-style slice would need to stay limited to richer source-policy ingestion,
  diagnostics, catalog or catalog-delta output, review-required rows, reports,
  and evidence.
- A P4-style slice would need to consume evidence-bound review-required output
  and materialize deterministic decisions without adding source authority.
- A P5-style slice would need to define a specific downstream conformance target,
  such as an adapter, API, A2UI, runtime, or protocol boundary, with its own
  complete proof shape.

The current candidate crosses those concerns. A later planning pass should
either split it or choose one target-specific proof boundary.

## Target Candidate
The candidate target is broader proof-only declared-source conformance and
review coverage beyond the currently implemented source-conformance bundle and
the first source-precedence/conflict subset now covered there.

The planned slice would validate one bounded, manifest-declared local source
bundle against accepted Surfaces authority, emit deterministic conformance
diagnostics, and preserve review-required output with owner, rationale, expiry,
or decision metadata where relevant.

It would not authorize live ingestion, live review workflow, runtime rendering,
adapter support, API support, SDK support, A2UI support, action execution, or
production adoption.

The first planning scenario pack for that broader slice is
[Richer Source Conformance Scenario Pack](richer-source-conformance-scenario-pack.md).
It uses planning-only source and fixture names for broader source conflicts,
forked variants, multi-brand drift, approval, retention, accessibility,
ownership routing, and proof-only P5 wording. Names outside the implemented
source-conformance subset must not be created under `sources/` or `fixtures/`
until a future proof target owns their schemas, diagnostics, command behavior,
artifacts, evidence, and CI gate.

## Source Bundle Inputs
The candidate should use a manifest-declared local source bundle only.

Likely source material:

- component definitions, props, variants, states, slots, and examples;
- token refs, token scopes, and brand or system-specific token policy;
- accessibility expectations and behavior policy;
- terminology, content, or usage policy;
- brand, product, or system exceptions;
- governance, approval, or review metadata where relevant;
- required mappings for component, token, policy, term, exception, or authority
  reconciliation.

Candidate source rules:

- every source file must be declared in the manifest;
- every emitted contract, diagnostic, or review-required row must preserve source
  refs;
- mappings can reconcile declared source material, but cannot invent policy or
  broaden source authority;
- accepted upstream refs may include the current governed catalog and ingestion
  evidence only if the later proof contract declares them;
- files outside the manifest, live connectors, crawlers, APIs, remote source
  calls, and inferred source authority remain out of scope.

## Schema And Fixture Needs
Candidate schemas may include:

- `declared-source-manifest.v0`;
- `declared-source-inventory.v0`;
- `source-authority-map.v0`;
- `source-conformance-report.v0`;
- `source-review-queue.v0`;
- `source-review-ledger.v0`;
- `declared-source-conformance-diagnostics.v0`;
- `declared-source-conformance-evidence.v0`;
- expectation and fixture schemas.

Candidate fixtures should cover:

- valid conforming source bundle cases;
- invalid missing source refs;
- source hash mismatch;
- undeclared source paths;
- authority escalation;
- unsupported policy;
- accessibility conflict;
- ambiguous terms, variants, or mappings;
- stale approval or review metadata;
- review-required exceptions, manual mapping, brand or system divergence,
  owner-required decisions, and second-review cases;
- mutation coverage for stale upstream evidence, report hash mismatch, evidence
  self-hash mismatch, and undeclared source paths.

## Diagnostics
A later proof contract would need canonical diagnostics for at least:

| Candidate code | Trigger | Intended status |
| --- | --- | --- |
| `DECLARED_SOURCE_MANIFEST_INVALID` | Source manifest is missing, malformed, or incomplete. | `blocked` |
| `DECLARED_SOURCE_PATH_UNDECLARED` | Source file appears outside the declared manifest. | `blocked` |
| `DECLARED_SOURCE_HASH_MISMATCH` | Source hash differs from the manifest or evidence. | `blocked` |
| `DECLARED_SOURCE_REF_INVALID` | Source ref is missing, malformed, or points outside declared source material. | `blocked` |
| `SOURCE_AUTHORITY_CONFLICT` | Declared sources conflict and no authority rule resolves the conflict. | `blocked` |
| `SOURCE_AUTHORITY_ESCALATION` | Mapping or policy attempts to create authority not present in declared source material. | `blocked` |
| `SOURCE_POLICY_MISSING` | Required governance, accessibility, content, or brand policy is absent. | `blocked` |
| `SOURCE_MAPPING_AMBIGUOUS` | Component, token, term, variant, or exception mapping cannot be resolved deterministically. | `review_required` |
| `SOURCE_REVIEW_OWNER_MISSING` | Review-required output lacks owner, rationale, expiry, or required decision metadata. | `blocked` |
| `SOURCE_REVIEW_REQUIRED` | Structurally valid source material needs human review before unattended promotion. | `review_required` |
| `SOURCE_APPROVAL_STALE` | Approval or review metadata is stale, invalid, or not evidence-bound. | `blocked` |
| `SOURCE_PRODUCTION_CLAIM_FORBIDDEN` | Source or target metadata claims production API, SDK, A2UI, live runtime, or live workflow support. | `blocked` |
| `SOURCE_CONFORMANCE_REPORT_HASH_MISMATCH` | Generated report hash differs from evidence. | `blocked` |
| `SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH` | Final evidence hash or self-hash rule fails. | `blocked` |

Each implemented diagnostic would need stage, severity, promotion status,
canonical message, artifact path, JSON Pointer, source ref, and fixture coverage.
This table is planning-only and does not create a diagnostic registry.

## Planned Command Shape
A future command might look like this:

```bash
interfacectl surfaces source-conformance proof \
  --source sources/next-proof/declared-source-bundle \
  --catalog artifacts/p2/governed-catalog.json \
  --ingestion-evidence artifacts/p2/evidence.json \
  --fixture fixtures/next-proof/source-conformance \
  --out artifacts/next-proof/source-conformance
```

This command is not implemented. The paths are placeholders for planning.

If implemented later, the command would need the same discipline as existing
proof commands:

- run from the workspace root;
- accept POSIX-style relative paths only;
- reject absolute paths, `.` segments, `..` traversal, symlinked output roots,
  hidden outputs, and stale output;
- use the fixed schema root;
- emit deterministic stdout, stderr, exit codes, artifacts, reports, and
  evidence;
- reject any output that claims live ingestion, production API, SDK, A2UI, live
  SurfaceOps, live JudgmentKit, live runtime, or action execution.

## Candidate Artifacts And Reports
Candidate output could use a future target-specific output root such as:

```text
artifacts/next-proof/source-conformance/
  source-inventory.json
  source-authority-map.json
  candidate-catalog-delta.json
  source-review-queue.json
  source-review-ledger.json
  source-conformance-report.json
  evidence.json
```

These paths are placeholders. They do not exist as implemented proof outputs.

`candidate-catalog-delta.json` must remain non-authoritative unless a future
proof explicitly defines how it is validated and promoted. Review queue or ledger
artifacts must remain deterministic and non-executable unless a later P4-style
proof defines live review ownership.

## Evidence And CI Expectations
The planned evidence path would be target-specific and hash-bound only after a
future implementation exists. Candidate evidence should hash:

- schemas;
- source manifest;
- declared source files;
- mappings;
- upstream evidence and catalog refs, if declared;
- fixtures;
- generated artifacts;
- reports;
- final evidence itself under the existing canonical JSON and self-hash rules.

A future broadened target may reuse the current source-conformance gate name or
add a target-specific variant. The current implemented gate already exists for
the current source-conformance target:

```bash
npm run check:source-conformance:ci
```

If broadened, the gate should fail on:

- blocking diagnostics;
- stale or unexpected output;
- missing provenance;
- missing source refs;
- missing owner, rationale, expiry, or required decision metadata;
- invalid review records;
- non-determinism;
- hash mismatch;
- unsupported production, API, SDK, A2UI, live runtime, live SurfaceOps, or live
  JudgmentKit claims;
- review-required rows that are not preserved as non-executable review records.

## Acceptance Criteria For A Later Proof
A later implementation plan should require:

- existing P0-P5 proof gates remain unchanged;
- source preflight validates manifest, refs, hashes, source family, and allowed
  files before artifact generation;
- conformance cannot add catalog behavior absent from declared source and
  accepted authority;
- invalid fixtures block with canonical diagnostics;
- review-required fixtures remain structurally valid, non-executable,
  owner-bound, and not unattended-promoted;
- reports record every expected and actual result before final evidence;
- evidence is reproducible and records boundary refs, artifact hashes,
  diagnostics, validation results, `status`, and `promotionStatus`;
- generated demos or inspection views, if added later, are presentation output
  only and run only after passing evidence exists.

## Design-Partner Discovery Use
Use this memo to prepare real design-partner discovery conversations, not as a
claim that a pilot is ready.

Discovery should test:

- whether partners can map their source authority to a manifest-declared bundle;
- which refs matter most for trust: component provenance, variants, states,
  accessibility rules, content policy, brand exceptions, approval metadata, or
  other source facts;
- which unsupported or ambiguous UI behavior should block versus route to
  review;
- who owns review-required output and what evidence they need;
- what would make CI evidence actionable rather than noisy;
- which downstream target matters first and what proof would need to exist before
  support is claimed;
- what wording would cross into a production adoption claim too early.

Use repo-owned examples only. Keep raw partner source files, screenshots,
recordings, transcripts, credentials, customer details, and proprietary
implementation specifics out of the repo. Partner feedback remains planning
input until a later proof adds schemas, fixtures, diagnostics, commands,
artifacts, reports, evidence, demos where applicable, and CI.

Safe pitch:

```text
Surfaces is a proof-contract system for governed generated UI. It tests whether
generated output conforms to declared design-system authority and produces
deterministic evidence before promotion. Current outputs are proof artifacts and
inspection demos, not production APIs, SDKs, adapters, A2UI exports, live
runtimes, live SurfaceOps workflows, or live JudgmentKit evaluations.
```

## Non-Goals
- No phase authority or proof authority.
- No source-eligibility decision.
- No P2 expansion claim.
- No P4 review target claim.
- No P5 adapter target claim.
- No implemented schema, fixture, diagnostic, command, artifact, evidence path,
  demo, or CI gate beyond the existing source-conformance proof and its first
  source-precedence/conflict subset.
- No live ingestion, connector, crawler, API, network, or partner-data storage.
- No production adapter, API, SDK, native SDK, A2UI export, A2UI conformance,
  live runtime, or action execution.
- No live SurfaceOps persistence, workflow, approval system, or decision store.
- No live JudgmentKit invocation or evaluation service.
- No generator-owned approval, policy invention, silent exception approval, or
  catalog-authority override.
- No implementation-ready pilot, production adoption, public case study, sales
  claim, or partner endorsement.

## Evidence Impact
| Area | Impact |
| --- | --- |
| Evidence status | `no change` |
| Promotion status | `no change` |
| SurfaceOps decision ledger | `no change` |
| JudgmentKit-shaped report | `no change` |
| Schemas, fixtures, diagnostics, artifacts, demos, or source refs | `no change` |
| Future proof candidates | Broader declared-source conformance and review remains planned candidate work until a later placement decision, full proof shape, and passing evidence exist. |
