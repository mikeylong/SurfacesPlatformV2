# Surfaces Platform V2 P2 Subplans

## Decision
P2 proves real design-system ingestion under the canonical authority model in [VISION](../../VISION.md#canonical-authority-model). It consumes one bounded, manifest-declared P2 pilot source bundle, normalizes it into `extract.json`, compiles the Surfaces Catalog and governed catalog, validates diagnostics and review routing, and records final evidence.

P2 is not a live Figma integration, Storybook crawler, docs crawler, production sync service, runtime adapter, SurfaceOps workflow, JudgmentKit evaluator, or agent orchestration proof. Agent orchestration is parked as P3.

## Mission Fit
Surfaces Platform turns design-system source material into governed, versioned UI contracts that agents and runtimes can use to generate, validate, reject, review, and render UI safely.

P2 preserves this mission by replacing the synthetic P0 source fixture with a bounded source bundle exported from real design-system source material. [VISION](../../VISION.md#real-design-system-extraction) remains the canonical extraction and authority taxonomy; P2 describes only the phase-local mechanics for source eligibility, provenance, mapping, diagnostics, and evidence. The proof must show what can be extracted, what must be mapped manually, what is unsupported, and what can become governed catalog contract.

## Source Strategy
The accepted P2 pilot source container is `design-system-source-bundle.v0`: a local, versioned snapshot exported from manifest-declared design-system source material. This is a phase-local ingestion and fixture strategy, not a universal product source policy decision. Future source-family choices still follow [VISION source-selection rules and open decisions](../../VISION.md#open-decisions).

The bundle may include Figma exports, Storybook or code-doc metadata, Code Connect mappings, and structured usage-policy docs, but P2 reads only the declared local bundle.

P2 does not call remote APIs. Live Figma, Storybook, Code Connect, docs, and production HTML ingestion require later connector-specific proofs.

The target design system must be named in `sources/p2/design-system-source/manifest.json` before implementation starts. Without that manifest, P2 is planned but not implementation-ready.

## P2 Dependency Order
1. [Product Boundaries](product-boundaries.md)
2. [Source Strategy](source-strategy.md)
3. [Ingestion Fixture](ingestion-fixture.md)
4. [Ingestion Proof](ingestion-proof.md)
5. [Validation And Evidence](validation-evidence.md)
6. [Demo And CI](demo-ci.md)

## P2 Contract Layout

```text
schemas/
  design-source-manifest.v0.schema.json
  design-source-inventory.v0.schema.json
  design-source-mapping.v0.schema.json
  design-system-ingestion-report.v0.schema.json
  design-system-ingestion-evidence.v0.schema.json
  design-system-ingestion-expectations.v0.schema.json
  design-system-ingestion-diagnostics.v0.schema.json

sources/p2/design-system-source/
  manifest.json
  figma/
    variables.json
    components.json
  storybook/
    components.json
  docs/
    usage-policy.json
  mappings/
    component-map.json

fixtures/p2/
  expectations.manifest.json
  review/
    manual-mapping-required.design-source.json
  invalid/
    unmapped-component.design-source.json
    unsupported-token.design-source.json
    ambiguous-variant.design-source.json
    governance-policy-missing.design-source.json
  mutations/
    missing-source-manifest.design-source.json
    source-hash-mismatch.design-source-inventory.json
    missing-source-ref.extract.json
    mapping-authority-escalation.design-source-mapping.json
    hash-mismatch.design-system-ingestion-evidence.json

artifacts/p2/
  source-inventory.json
  source-mapping.json
  extract.json
  catalog.json
  governed-catalog.json
  ingestion-report.json
  evidence.json

demo/p2/
  README.md
  index.html
```

## P2 Proof Command

```bash
interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

The command must run from the workspace root. `--source`, `--fixture`, and `--out` are POSIX-style paths relative to the workspace root. The schema directory is fixed at `schemas/`.

## Pass Condition
Given a declared design-system source bundle and the P2 fixture set, the ingest proof command emits the exact P2 artifacts, verifies source hashes, creates deterministic source inventory and source mapping records, extracts normalized design-system material with source refs, compiles catalog and governed catalog artifacts, blocks invalid and mutation cases with registry-backed diagnostics, preserves review-required manual mapping cases without promotion, records ingestion diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P2 schema, source input, fixture, generated artifact, and final evidence artifact.

## Product Surface Rule
P2 proves real source ingestion, not a product docs site or generated UI surface. The complete cross-phase surface-role taxonomy remains in [VISION](../../VISION.md#surface-roles).

`demo/p2/index.html` must be generated from P2 proof artifacts. It may show source coverage, extracted components, token coverage, mapping decisions, diagnostics, review-required rows, and evidence refs. It must not contain hand-authored source claims that bypass `artifacts/p2/evidence.json`.

## P0/P1 Invariants Carried Forward
- P0 and P1 proof gates must still pass unchanged before and after P2 work.
- P0 remains the synthetic fixture proof. P2 does not rewrite P0 semantics.
- P1 remains the `web-static` runtime projection proof. P2 does not make a new runtime adapter.
- Paths are POSIX-style paths relative to the workspace root.
- Stale unexpected output under the declared P2 output root fails before writing.
- Evidence canonicalization follows RFC 8785/JCS with I-JSON numeric input constraints.
- Diagnostic messages used in hashed evidence are canonical registry messages, not validator-native text.

## P2 Diagnostic Additions
These diagnostics enforce the canonical authority model by blocking source, mapping, and evidence violations. They do not define a separate P2 authority taxonomy.

| Code | Trigger | Stage | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- |
| `INGEST_SOURCE_MANIFEST_MISSING` | Source bundle manifest is absent or unreadable | `source-inventory` | `blocked` | `mutations/missing-source-manifest.design-source.json` |
| `INGEST_SOURCE_HASH_MISMATCH` | Source file hash differs from manifest or inventory | `source-inventory` | `blocked` | `mutations/source-hash-mismatch.design-source-inventory.json` |
| `INGEST_SOURCE_REF_MISSING` | Extracted token, component, prop, variant, state, slot, action, accessibility, or policy lacks source ref | `extract` | `blocked` | `mutations/missing-source-ref.extract.json` |
| `INGEST_COMPONENT_UNMAPPED` | Source component lacks an accepted catalog mapping | `mapping` | `blocked` | `invalid/unmapped-component.design-source.json` |
| `INGEST_TOKEN_UNSUPPORTED` | Source token cannot be represented by the current token contract | `extract` | `blocked` | `invalid/unsupported-token.design-source.json` |
| `INGEST_VARIANT_AMBIGUOUS` | Source variants or component properties cannot be deterministically mapped | `mapping` | `blocked` | `invalid/ambiguous-variant.design-source.json` |
| `INGEST_GOVERNANCE_POLICY_MISSING` | Sensitive usage lacks a declared governance policy | `govern` | `blocked` | `invalid/governance-policy-missing.design-source.json` |
| `INGEST_MAPPING_REVIEW_REQUIRED` | Source material is structurally valid but requires human mapping review | `mapping` | `review_required` | `review/manual-mapping-required.design-source.json` |
| `INGEST_MAPPING_AUTHORITY_ESCALATION` | Mapping attempts to promote catalog behavior absent from source material | `mapping` | `blocked` | `mutations/mapping-authority-escalation.design-source-mapping.json` |
| `INGEST_EVIDENCE_HASH_MISMATCH` | Ingestion evidence hash differs from manifest or self-hash rule | `evidence` | `blocked` | `mutations/hash-mismatch.design-system-ingestion-evidence.json` |

## Non-Goals
- No live Figma API call.
- No Storybook server scraping.
- No Code Connect parser beyond declared local mapping input.
- No docs crawler.
- No production HTML extraction or source input in P2.
- No agent recruitment or work-order generation.
- No SurfaceOps persistence.
- No JudgmentKit evaluator execution.
