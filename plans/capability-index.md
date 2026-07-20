# Capability Index Proof Target

## Status

Implemented as a non-numbered, cross-cutting proof target when
`artifacts/capability-index/evidence.json` records `status: "pass"`. The
current tracked result records `promotionStatus: "allowed"`.

This plan is subordinate to `VISION.md` and `PLAN.md`. It defines the
mechanical proof contract for capability discovery and read-only verification.
It does not redefine product authority, the P0-P5 roadmap, target behavior, or
the outcome milestones in `PROGRESS.md`.

## Purpose

The capability index gives people and agents one checked answer to four
questions:

- Which proof targets are implemented?
- Did each target's tracked evidence pass?
- What governance promotion status did each target record?
- Which capability groups remain planned without an implementation claim?

Passing capability-index evidence proves the index contract. Each target's own
evidence remains the proof authority for that target.

## Indexed Scope

The index contains exactly the 18 implemented proof targets other than the
capability-index target:

| Implemented target | Evidence authority | CI gate |
| --- | --- | --- |
| P0 synthetic catalog contract | `artifacts/p0/evidence.json` | `npm run check:p0:ci` |
| P1 `web-static` runtime projection | `artifacts/p1/evidence.json` | `npm run check:p1:ci` |
| P2 bounded Spectrum ingestion | `artifacts/p2/evidence.json` | `npm run check:p2:ci` |
| Spectrum Checkbox catalog authority | `artifacts/spectrum-checkbox-catalog/evidence.json` | `npm run check:spectrum-checkbox-catalog:ci` |
| Spectrum Switch catalog authority | `artifacts/spectrum-switch-catalog/evidence.json` | `npm run check:spectrum-switch-catalog:ci` |
| P3 inert agent orchestration | `artifacts/p3/evidence.json` | `npm run check:p3:ci` |
| P4 deterministic review and judgment | `artifacts/p4/evidence.json` | `npm run check:p4:ci` |
| P5 `surfaces-protocol-static` | `artifacts/p5/protocol/evidence.json` | `npm run check:p5:protocol:ci` |
| P5 `surfaces-native-static` | `artifacts/p5/native/evidence.json` | `npm run check:p5:native:ci` |
| Reusable declared-source conformance | `artifacts/source-family-packaging/evidence.json` | `npm run check:source-family-packaging:ci` |
| Structured source accessibility policy | `artifacts/source-accessibility-policy/evidence.json` | `npm run check:source-accessibility-policy:ci` |
| Fixed source-family layout mapping | `artifacts/source-family-layout-mapping/evidence.json` | `npm run check:source-family-layout-mapping:ci` |
| Fixed source-family namespace mapping | `artifacts/source-family-namespace-mapping/evidence.json` | `npm run check:source-family-namespace-mapping:ci` |
| Fixed source-family component-identity mapping | `artifacts/source-family-component-identity-mapping/evidence.json` | `npm run check:source-family-component-identity-mapping:ci` |
| Designer workflow trace | `artifacts/designer-workflow-trace/evidence.json` | `npm run check:designer-workflow-trace:ci` |
| SurfaceOps kanban static | `artifacts/surfaceops-kanban-static/evidence.json` | `npm run check:surfaceops-kanban-static:ci` |
| SurfaceOps kanban live | `artifacts/surfaceops-kanban-live/evidence.json` | `npm run check:surfaceops-kanban-live:ci` |
| SurfaceOps designer review UI | `artifacts/surfaceops-designer-review-ui/evidence.json` | `npm run check:surfaceops-designer-review-ui:ci` |

The declared-source-conformance row lists the canonical eight-artifact compiler
output plus the ten aggregate package artifacts, including the captured second
run and package report. The row points to aggregate package evidence while the
canonical `artifacts/source-conformance/evidence.json` remains the direct input
to designer-workflow-trace. The aggregate report records two fresh accepted
compiler passes, one separately counted failing causal probe, the checked local
JavaScript and runtime closure, and post-workspace candidate evidence
verification. The row keeps `canAddAuthority: false` and names
arbitrary connectors, broader P2 coverage, live crawling, and self-serve
connection UI as non-capabilities. Neither governed catalog can broaden
accepted P2 capability.

The source-accessibility-policy row points to report/evidence-only
reconciliation over five structured behavior declarations. It records
`promotionStatus: "review_required"`, keeps `canAddAuthority: false`, and names
free-form policy interpretation, runtime accessibility compliance, broader P2
coverage, arbitrary source packaging, live connectors, self-serve connection,
production adapters, and JudgmentKit invocation as non-capabilities.

The source-family-layout-mapping row points to report/evidence-only proof for
one fixed alternate physical layout mapped byte-for-byte onto the existing
logical source ABI. It records `promotionStatus: "review_required"`, keeps
`canAddAuthority: false`, and names arbitrary layouts or filenames, namespace
mapping, broader P2 coverage, live connectors, self-serve UI, runtime
accessibility claims, production adapters, SurfaceOps expansion, and
JudgmentKit as non-capabilities.

The source-family-namespace-mapping row points to report/evidence-only proof for
one fixed alternate declared-source prefix normalized at 78 checked JSON
pointers onto the canonical namespace. It records
`promotionStatus: "review_required"`, keeps `canAddAuthority: false`, and names
arbitrary namespaces, additional layouts, broader P2 coverage, live connectors,
self-serve UI, runtime accessibility, production adapters, SurfaceOps
expansion, and JudgmentKit as non-capabilities.

The source-family-component-identity-mapping row points to report/evidence-only
proof for one explicit team-owned authority declaration authorizing the exact
fixture-local `TeamButton` to accepted P2 `Button` relation for one checked
12-file bundle. It records `promotionStatus: "review_required"`, keeps
`canAddAuthority: false`, and requires source refs, provenance, hashes, current
P2 target refs, and owner-bound accepted review metadata before derived Stage 1
normalization. The row names arbitrary identities, alias registries, semantic
inference or equivalence, new components or facts, additional layouts or
namespaces, broader P2 coverage, live connectors, self-serve UI, runtime
accessibility, production adapters, SurfaceOps expansion, and JudgmentKit as
non-capabilities.

The Spectrum Checkbox catalog row points to the separate real-source catalog
expansion that consumes accepted P2 evidence without changing P2. It records
`promotionStatus: "review_required"`, preserves every accepted P2 component and
token record, and adds only Checkbox plus one desktop token to a distinct
governed catalog. Full Spectrum support, live connectors, self-serve UI,
runtime accessibility compliance, production adapters, SurfaceOps expansion,
JudgmentKit, and A2UI remain non-capabilities.

The Spectrum Switch catalog row points to the downstream real-source expansion
that requires passing P2 and Checkbox evidence plus the accepted Checkbox
catalog. It records `promotionStatus: "review_required"`, preserves 36 baseline
records by JCS hash, and adds only Switch plus one desktop token to a new
catalog identity. Runtime behavior, accessibility compliance, full Spectrum
support, live connectors, self-serve connection, production adapters/APIs/SDKs,
SurfaceOps expansion, JudgmentKit, A2UI, and production readiness remain
non-capabilities.

The capability-index target does not index itself. Adding it as a nineteenth
row would create a circular self-evidence boundary. Its own final evidence is
the authority for the index target.

The fixture also declares seven planned capability groups. Planned rows are
roadmap visibility only. They must carry planned status, must not reference a
proof command or evidence path, and must not inherit implementation or
promotion claims from adjacent targets.

## Status Model

The index keeps three states separate:

- `implementationStatus` records whether the indexed capability is implemented
  or planned.
- Evidence `status` records whether the implemented target proof passed.
- `promotionStatus` records the governed outcome: `allowed`,
  `review_required`, or `blocked`.

A passing proof with blocked promotion remains implemented. A planned group
cannot become implemented because a related target passed.

## Schema Contract

The target owns these schemas:

- `schemas/capability-declaration.v0.schema.json`
- `schemas/capability-index.v0.schema.json`
- `schemas/capability-index-report.v0.schema.json`
- `schemas/capability-index-evidence.v0.schema.json`
- `schemas/capability-index-expectations.v0.schema.json`
- `schemas/capability-index-diagnostics.v0.schema.json`
- `schemas/capability-index-preflight-mutation.v0.schema.json`

The schemas keep declarations closed, distinguish implemented targets from
planned groups, require POSIX-relative repository paths, and prohibit planned
rows from carrying proof or evidence claims.

## Fixture Contract

The fixture root is `fixtures/capability-index`:

```text
fixtures/capability-index/
  capabilities.fixture.json
  expectations.manifest.json
  valid/
    complete-current-inventory.capability-declaration.json
  review/
    blocked-promotion-indexed.capability-declaration.json
  invalid/
    missing-target.capability-declaration.json
    implemented-without-evidence.capability-declaration.json
    planned-claim-escalation.capability-declaration.json
    status-mismatch.capability-declaration.json
    dependency-invalid.capability-declaration.json
    authority-escalation.capability-declaration.json
  mutations/
    missing-evidence.capability-index-preflight-mutation.json
    upstream-hash-mismatch.capability-index-preflight-mutation.json
    hash-mismatch.capability-index-evidence.json
```

The expectations manifest declares the expected stage, validation result,
diagnostic code, and promotion status for every fixture case. Fixture claims
cannot define their own expected result.

## Generated Artifacts

The target emits exactly three tracked artifacts:

```text
artifacts/capability-index/
  capability-index.json
  capability-index-report.json
  evidence.json
```

Diagnostics are registry-defined rows embedded in the report and evidence
closure. The target does not emit a separate diagnostics artifact or generated
demo.

## Command Contract

Materialization:

```bash
npm run materialize:capability-index
```

Proof:

```bash
interfacectl surfaces capabilities proof --fixture fixtures/capability-index --out artifacts/capability-index
```

Read-only verification:

```bash
interfacectl surfaces capabilities verify --index artifacts/capability-index/capability-index.json --evidence artifacts/capability-index/evidence.json
```

Human entrypoint:

```bash
npm run status
```

Package gates:

```bash
npm run check:capability-index
npm run check:capability-index:ci
npm run check:capability-index:ci:phase
npm run check:capability-index:untracked
```

Proof and materialization are the only commands allowed to write the three
tracked artifacts. All CLI paths must stay POSIX-relative to the workspace
root and satisfy the repository output-root rules.

## Read-Only Verification Contract

`npm run status` aliases the `capabilities verify` command. Verification:

- reads the tracked index, report, capability-index evidence, package command
  registry, declared schemas and fixtures, the 18 indexed target evidence
  files, and their referenced closure;
- validates the index and evidence schemas, hashes, declared status, target
  count, dependencies, authority boundaries, and evidence refs;
- writes a concise table with capability, evidence status, promotion status,
  and evidence path to stdout;
- reports `implemented: 18/18 verified` plus the planned group count and ids;
- writes no file, creates no output directory, regenerates no artifact, and
  makes no network call.

Exit codes:

- `0`: the tracked index and evidence are verified;
- `1`: integrity or contract verification failed with a canonical diagnostic;
- `2`: command usage or path validation failed.

## Diagnostics

The capability diagnostics registry defines these codes:

| Code | Failure class |
| --- | --- |
| `CAPABILITY_TARGET_MISSING` | A required implemented target is absent from the index. |
| `CAPABILITY_EVIDENCE_MISSING` | An implemented target has no readable evidence. |
| `CAPABILITY_EVIDENCE_HASH_MISMATCH` | Indexed target evidence does not match its declared hash. |
| `CAPABILITY_STATUS_MISMATCH` | Indexed proof or promotion status differs from accepted evidence. |
| `CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN` | An implemented row lacks passing target evidence. |
| `CAPABILITY_PLANNED_CLAIM_ESCALATION` | A planned row claims implementation, proof, promotion, or runnable behavior. |
| `CAPABILITY_DEPENDENCY_INVALID` | A declared target dependency is missing, invalid, or out of order. |
| `CAPABILITY_AUTHORITY_ESCALATION` | An index row claims authority or behavior beyond its target evidence. |
| `CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH` | Capability-index evidence fails its own hash check. |

Canonical messages, stages, severities, artifact paths, JSON Pointers, source
refs, and fixture coverage live in
`schemas/capability-index-diagnostics.v0.schema.json` and the expectations
manifest. Proof output must use those values exactly.

## Evidence Closure

`artifacts/capability-index/evidence.json` closes over:

- all capability-index-owned schemas;
- the complete declared fixture set;
- the 18 accepted target evidence files and their hashes;
- `capability-index.json`;
- `capability-index-report.json`;
- the final evidence self-ref using the repository's canonical null-placeholder
  procedure before final hashing.

The evidence records deterministic ordering, JCS hashes, normalized UTC time,
host-derived fields as `null`, `status: "pass"`, and
`promotionStatus: "allowed"` for the accepted fixture set.

## CI Contract

`npm run check:capability-index:ci` runs the required upstream target gates,
materializes and proves the capability index, checks tracked drift, and rejects
untracked capability-index files. The phase-only gate may run after the 18
indexed target proof jobs have already passed.

CI must also prove that `npm run status` leaves the worktree unchanged. The
read-only verifier cannot hide stale output by regenerating it.

## Acceptance Criteria

The target is accepted only when:

- the index contains exactly the 18 implemented targets listed above;
- every implemented row points to present, passing, hash-matching target
  evidence;
- every proof status and promotion status matches the target evidence;
- all dependencies and authority boundaries validate;
- all seven planned groups remain non-runnable roadmap records;
- every valid, review, invalid, and mutation fixture produces its manifest
  result and canonical diagnostic;
- the report and evidence include the complete deterministic closure;
- the verifier returns `0` for tracked accepted output and returns `1` for
  missing, stale, tampered, or overclaimed content;
- the verifier produces no filesystem or network side effect;
- the proof-bearing CI gate passes on a clean worktree.

## Non-Goals

- No new catalog, product, policy, runtime, review, or adapter authority.
- No replacement for any indexed target's evidence.
- No live status service, API, SDK, daemon, dashboard, or hosted registry.
- No materialization, repair, or automatic update during read-only
  verification.
- No claim that planned capability groups are implemented, runnable, or
  supported.
- No generated demo.
- No self-indexing or circular proof authority.
