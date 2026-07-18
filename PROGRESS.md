# Surfaces Product Progress

This file tracks product-outcome milestones above the mechanical P0-P5
roadmap. It is subordinate to `VISION.md`, `PLAN.md`, the phase plans, and
passing evidence. It does not create proof authority or broaden an implemented
target.

Last updated: 2026-07-17
Current focus: **Connect Authority**

## Status Semantics

- **Complete**: The user promise is delivered at its declared scope, every
  completion criterion is satisfied, and every implementation claim has
  passing evidence.
- **In progress**: Passing proof establishes part of the promise, but one or
  more completion criteria remain unmet.
- **Planned**: The outcome is defined without an implementation claim.
- **Blocked**: Progress is stopped by an explicit dependency or decision.

Milestone status is separate from evidence `status` and governance
`promotionStatus`. A proof may pass while its governed outcome remains
`review_required` or `blocked`.

## Milestone Overview

| Milestone | User promise | Status |
| --- | --- | --- |
| Know What's Proven | I can understand exactly what Surfaces supports and trust its status. | **Complete** |
| Connect Authority | Surfaces understands my actual design system. | **In progress** |
| Generate Within Bounds | AI produces design-system-valid UI or clearly explains why it cannot. | **In progress** |
| Review With Confidence | I can evaluate and decide without reading proof internals. | **In progress** |
| Ship Proven Output | Approved work can safely reach a real target. | **In progress** |
| Govern Change Over Time | The system stays trustworthy as authority evolves. | **In progress** |

## 1. Know What's Proven

**Status: Complete for the current repository target set**

The repository provides one checked answer to what is implemented, what
passed, what its governance outcome is, and what remains outside the proven
boundary.

Completion record:

- [x] One schema-validated capability index covers all 16 implemented proof
  targets other than the capability-index target.
- [x] Each implemented row exposes its identity, scope, authority boundary,
  non-capabilities, dependencies, commands, CI gate, inputs, outputs,
  diagnostics, report, evidence, and demo references.
- [x] Implementation status, evidence status, and promotion status remain
  distinct.
- [x] Separate planned capability groups provide roadmap visibility without
  creating implementation or proof claims.
- [x] A strictly read-only verifier checks the index, capability-index evidence,
  and indexed target evidence without materializing or regenerating output.
- [x] Missing, stale, tampered, or overclaimed entries fail with canonical
  diagnostics and a nonzero exit.
- [x] The capability-index target has the complete proof shape: schemas,
  fixtures, proof command, diagnostics, report, evidence, tests, and CI gate.
- [x] The root entrypoint exposes one human status command and links the
  outcome, vision, and mechanical plans.
- [x] Passing capability-index evidence records the current result.

Human entrypoint:

```bash
npm run status
```

Proof and evidence:

- Index: `artifacts/capability-index/capability-index.json`
- Report: `artifacts/capability-index/capability-index-report.json`
- Proof authority: `artifacts/capability-index/evidence.json`
- Proof command: `interfacectl surfaces capabilities proof --fixture fixtures/capability-index --out artifacts/capability-index`
- Read-only verification: `interfacectl surfaces capabilities verify --index artifacts/capability-index/capability-index.json --evidence artifacts/capability-index/evidence.json`
- Proof-bearing gate: `npm run check:capability-index:ci`

The index intentionally covers the 16 other implemented targets rather than
indexing itself. Its evidence proves the index contract without creating a
circular authority chain. The index is a derived discovery surface. It does
not replace target evidence or turn demos and plans into proof.

## 2. Connect Authority

**Status: In progress**

Current foundation: P2 proves bounded ingestion from the locked Adobe Spectrum
Design Data package for `button` and `in-line-alert`. The declared-source
conformance target now reads field-level component facts and a checked,
team-owned authority profile from its bounded local bundle. It derives fact
coverage, source precedence, policy bindings, exceptions, review ownership,
and actionable findings; emits a governed catalog that cannot expand the
accepted P2 component, token, runtime-capability, or compatibility boundary;
and proves that profile-only ownership changes affect output without compiler
edits.

The reusable package slice now executes that same compiler over the canonical
bundle and a second distinct, manifest-declared team bundle in separate
isolated workspaces. The report records two passing accepted-bundle executions
and counts the failing causal probe separately. The package proof binds the
seven-file local JavaScript closure, Node 22 and package inputs, both evidence
boundaries, and the second bundle's physical source bytes. It derives the
active owner from referenced review routes, captures the complete second output
set, and reconstructs the compiler's logical workspace to re-verify that
captured evidence after the original workspace is gone. The two runs match the
same six normalized source facts, including each primary and supporting logical
fact ref and JCS value hash plus conflict, resolution, catalog hash, and status,
and nine immutable P2 catalog fields. The unchanged compiler blocks an
`expressive` Button expansion with `SOURCE_FACT_AUTHORITY_ESCALATION`. Both
bundles remain limited to Button and InLineAlert. The capability index exposes
the aggregate result at
`artifacts/source-family-packaging/evidence.json` as one target.

The source-accessibility-policy slice closes the next bounded reconciliation
gap. It reads five checked structured behavior declarations, hash-binds the
referenced policy requirement values as opaque identifiers, and compares
explicit `equals` and `exists` assertions with accepted P2 catalog facts. The
source-conformance catalog remains an integrity-bound upstream input, not a
second fact authority. Three declarations reconcile as allowed.
Two missing authoritative facts remain non-executable and owner-bound for
review. Free-form policy text, contradiction, unsupported behavior, unresolved
precedence, missing source refs, and authority expansion fail with canonical
diagnostics. Passing evidence records 18 matching fixture results and
`promotionStatus: "review_required"` without emitting or mutating a governed
catalog.

The source-family-layout-mapping slice removes one more fixed packaging
constraint. A third physical instance of the accepted team-owned bundle uses
different directories and filenames, while an immutable layout-package trust
anchor maps its 12 byte-identical files onto the existing logical ABI. The
unchanged compiler produces the same eight inner artifacts, six normalized
fact tuples, nine immutable P2 catalog fields, owner-bound review semantics,
and causal `SOURCE_FACT_AUTHORITY_ESCALATION` rejection. Passing evidence
records all 20 fixture results and `promotionStatus: "review_required"`.

The source-family-namespace-mapping slice removes one fixed source-ref namespace
constraint without changing source authority. A checked copy of the accepted
fixed-layout bundle uses `declared-source://product-team-authority/` at exactly
78 declared JSON string pointers. An immutable namespace package binds those
substitutions and exactly 11 manifest source-file hash refreshes. The isolated
normalization result must match all 12 accepted logical files byte-for-byte
before the unchanged compiler runs. Passing evidence preserves the eight inner
artifacts, six normalized fact tuples, nine immutable P2 catalog fields,
owner-bound non-executable review semantics, and causal
`SOURCE_FACT_AUTHORITY_ESCALATION` rejection with
`promotionStatus: "review_required"`.

The source-family-component-identity-mapping slice removes one exact component-
identity constraint without expanding accepted P2 catalog authority. One explicit,
team-owned declaration binds the fixture-local `TeamButton` identity to the
already accepted P2 `Button` target with declared source refs, provenance,
hashes, current P2 catalog/evidence refs, the JCS hash of the accepted Button
record, and owner-bound accepted review
metadata. The declaration authorizes the relation; the derived mapping and
normalizers add no authority. Stage 1 applies exactly 22 substitutions in five
files, refreshes five manifest hashes, preserves four narrative `Button`
mentions, and reproduces the accepted fixed-namespace input. The existing
namespace normalizer then reproduces the canonical logical bundle before the
unchanged compiler runs. Passing evidence preserves and re-verifies all eight
inner artifacts with exact equality to the fixed-namespace baseline and records
`promotionStatus: "review_required"`.

Complete when a team can declare its authoritative sources, precedence,
policies, and review ownership without repo-specific implementation changes,
then compile a traceable governed catalog with actionable conflict and
ambiguity handling. The current slice proves that path for two checked
instances of one fixed source-family package ABI plus one fixed alternate
physical layout mapped onto that same ABI and one fixed alternate source-ref
prefix normalized onto its canonical namespace, plus one explicit team-owned
declaration for the exact fixture-local `TeamButton` to accepted P2 `Button`
identity relation. Arbitrary additional source layouts, namespace pairs,
component identities or alias registries, broader component coverage, live
connectors, and a self-serve connection path remain open and require separate
proof.

What's next: use the passing fixed component-identity proof as the new Connect
Authority baseline, then select one bounded next proof slice from the remaining
milestone gaps. Current evidence does not authorize arbitrary additional
layouts, namespace pairs, component identities, alias registries, or semantic
mappings; broader P2 coverage; live connectors; self-serve UI; runtime
accessibility claims; production adapters; SurfaceOps expansion; or JudgmentKit
use.

## 3. Generate Within Bounds

**Status: In progress**

Current foundation: P0 proves catalog-bound Surface IR validation, and P3
proves bounded but inert orchestration artifacts. Neither proves a live
generator operating against the catalog.

Complete when at least one bounded generator consumes a governed catalog,
emits only supported UI, and deterministically rejects or routes unsupported,
ambiguous, inaccessible, or review-required requests.

## 4. Review With Confidence

**Status: In progress**

Current foundation: P4 proves deterministic review and evaluation artifacts.
The local-loopback SurfaceOps designer UI proves inspection and a blocked
decision path while preserving upstream authority.

Complete when a designer can inspect provenance and policy context and
complete the allowed approve, reject, revise, or defer outcomes for both
promotable and blocked scenarios without reading proof internals.

## 5. Ship Proven Output

**Status: In progress**

Current foundation: P1 and the implemented P5 targets prove hash-bound
projections and inert output. The kanban target proves a bounded local-loopback
adapter scenario.

Complete when one production-like target accepts current, authorized output
and rejects stale, unproven, review-required, or blocked handoffs at its actual
consumption boundary.

## 6. Govern Change Over Time

**Status: In progress**

Current foundation: deterministic hashes, evidence chains, regeneration
commands, drift checks, and CI gates reject stale tracked output.

Complete when an authority change produces deterministic impact analysis,
identifies affected surfaces and consumers, triggers targeted revalidation or
review, and prevents stale downstream output from shipping.
