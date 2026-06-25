# Surfaces Platform V2 P2 Subplans

## Decision
P2 proves real design-system ingestion under the canonical authority model in [VISION](../../VISION.md#canonical-authority-model). It consumes one bounded, manifest-declared P2 pilot source bundle, normalizes it into `extract.json`, compiles the Surfaces Catalog and governed catalog, validates diagnostics and review routing, and records final evidence.

P2 is not a live Figma integration, Storybook crawler, docs crawler, production sync service, runtime adapter, SurfaceOps workflow, JudgmentKit evaluator, or agent orchestration proof. Agent orchestration is parked as P3.

## Mission Fit
Surfaces Platform turns design-system source material into governed, versioned UI contracts that agents and runtimes can use to generate, validate, reject, review, and render UI safely.

P2 preserves this mission by replacing the synthetic P0 source fixture with a bounded source bundle exported from real design-system source material. [VISION](../../VISION.md#real-design-system-extraction) remains the canonical extraction and authority taxonomy; P2 describes only the phase-local mechanics for source eligibility, provenance, mapping, diagnostics, and evidence. The proof must show what can be extracted, what must be mapped manually, what is unsupported, and what can become governed catalog contract.

## Source Strategy
The accepted P2 pilot source container is `design-system-source-bundle.v0`: a local, versioned, hash-bound snapshot exported from Adobe Spectrum Design Data, pinned as `@adobe/spectrum-design-data@0.7.0` with npm integrity `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`. This is a phase-local ingestion and fixture strategy, not a universal product source policy decision, and not a synthetic replacement for the P0 fixture. Future source-family choices still follow [VISION source-selection rules and open decisions](../../VISION.md#open-decisions).

The first component subset is Spectrum `button` and `in-line-alert`. The snapshot root is `sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/`, preserving tarball paths such as `components/button.json`, `components/in-line-alert.json`, `tokens/color-component.tokens.json`, `tokens/layout-component.tokens.json`, `tokens/typography.tokens.json`, `registry/components.json`, `registry/variants.json`, `registry/states.json`, and selected `guidelines/*.json` policy inputs.

The current P2 bundle input is limited to the pinned local `@adobe/spectrum-design-data@0.7.0` snapshot plus local `mappings/*.json` and `docs/usage-policy.json` policy files for `button` and `in-line-alert`. Figma exports, Storybook or code-doc metadata, Code Connect mappings, docs crawlers, production HTML, and other source families are not valid current P2 bundle inputs.

P2 does not call remote APIs or broaden source families by manifest entry. Those source-family options require later connector-specific proofs before they can become eligible source inputs.

The target design system is named in `sources/p2/design-system-source/manifest.json`, with source files, required mappings, policy refs, and hashes. The implemented proof remains scoped to that declared local snapshot and evidence.

## Source Ref Grammar
P2 Spectrum source refs use this grammar:

```text
spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/<posix-package-path>#<rfc6901-json-pointer>
```

Examples:

- `spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/button.json#/`
- `spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/in-line-alert.json#/`
- `spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/color-component.tokens.json#/`

Mapping refs use:

```text
mapping://p2/spectrum/<mapping-file>#<rfc6901-json-pointer>
```

Mapping refs may reconcile or narrow declared Spectrum source material. They cannot create catalog behavior absent from manifest-declared Spectrum files.

Local policy refs use:

```text
source://p2/docs/usage-policy.json#<rfc6901-json-pointer>
```

Local policy refs identify manifest-declared policy files only. They can supply governance, accessibility, and usage-policy evidence, but cannot broaden the eligible Spectrum source subset.

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
  design-system-ingestion-valid-fixture.v0.schema.json

sources/p2/design-system-source/
  README.md
  manifest.template.json
  manifest.json
  npm/
    @adobe/spectrum-design-data/
      0.7.0/
        package/
          package.json
          README.md
          LICENSE
          components/
            button.json
            in-line-alert.json
          registry/
            components.json
            property-terms.json
            variants.json
            states.json
            anatomy-terms.json
            token-terminology.json
            token-objects.json
          tokens/
            color-component.tokens.json
            color-aliases.tokens.json
            color-palette.tokens.json
            layout-component.tokens.json
            layout.tokens.json
            typography.tokens.json
          mode-sets/
            color-scheme.json
            contrast.json
            scale.json
          fields/
            variant.json
            state.json
            size.json
            property.json
            anatomy.json
          guidelines/
            developer-overview.json
            states.json
            colors.json
            spacing.json
            typography-fundamentals.json
  docs/
    usage-policy.json
  mappings/
    component-map.json
    token-map.json
    policy-map.json

fixtures/p2/
  expectations.manifest.json
  valid/
    spectrum-button.design-source.json
    spectrum-in-line-alert.design-source.json
    spectrum-subset.source-mapping.json
  review/
    manual-mapping-required.design-source.json
  invalid/
    unmapped-component.design-source.json
    unsupported-token.design-source.json
    unsupported-mode.design-source.json
    ambiguous-variant.design-source.json
    governance-policy-missing.design-source.json
    duplicate-normalized-id.design-source-mapping.json
    mapping-row-ref-invalid.design-source-mapping.json
    mapping-cardinality-invalid.design-source-mapping.json
  mutations/
    missing-source-manifest.design-source.json
    package-integrity-mismatch.design-source.json
    source-path-undeclared.design-source.json
    invalid-source-ref.design-source.json
    source-hash-mismatch.design-source-inventory.json
    missing-source-ref.extract.json
    mapping-authority-escalation.design-source-mapping.json
    schema-hash-mismatch.design-system-ingestion-evidence.json
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
  data.json
  index.html
```

## P2 Proof Command

```bash
interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

This command runs from the workspace root. `--source`, `--fixture`, and `--out` are POSIX-style paths relative to the workspace root. The schema directory is fixed at `schemas/`.

Package scripts and tests must invoke `node bin/interfacectl.js surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2`. Evidence may record the logical command string above to match the existing proof-command convention.

## Pass Condition
Given a declared design-system source bundle and the P2 fixture set, the ingest proof command emits the exact P2 artifacts, verifies source hashes, creates deterministic source inventory and source mapping records, extracts normalized design-system material with source refs, compiles catalog and governed catalog artifacts, validates positive Spectrum coverage for `button` and `in-line-alert`, blocks invalid and mutation cases with registry-backed diagnostics, preserves review-required manual mapping cases without promotion, records ingestion diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P2-owned schema, every consumed shared schema, source input, fixture, generated artifact, and final evidence artifact.

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
| `INGEST_PACKAGE_INTEGRITY_MISMATCH` | Spectrum package metadata differs from the pinned npm target | `source-inventory` | `blocked` | `mutations/package-integrity-mismatch.design-source.json` |
| `INGEST_SOURCE_PATH_UNDECLARED` | Source path is outside the manifest or outside allowed snapshot roots | `source-inventory` | `blocked` | `mutations/source-path-undeclared.design-source.json` |
| `INGEST_SOURCE_REF_INVALID` | Source ref grammar is malformed or points outside manifest-declared source files | `source-inventory` | `blocked` | `mutations/invalid-source-ref.design-source.json` |
| `INGEST_SOURCE_HASH_MISMATCH` | Source file hash differs from manifest or inventory | `source-inventory` | `blocked` | `mutations/source-hash-mismatch.design-source-inventory.json` |
| `INGEST_SOURCE_REF_MISSING` | Extracted token, component, prop, variant, state, slot, action, accessibility, or policy lacks source ref | `extract` | `blocked` | `mutations/missing-source-ref.extract.json` |
| `INGEST_COMPONENT_UNMAPPED` | Source component lacks an accepted catalog mapping | `mapping` | `blocked` | `invalid/unmapped-component.design-source.json` |
| `INGEST_TOKEN_UNSUPPORTED` | Source token cannot be represented by the current token contract | `extract` | `blocked` | `invalid/unsupported-token.design-source.json` |
| `INGEST_TOKEN_MODE_UNSUPPORTED` | Source token mode or color mode cannot be represented by the current token contract | `extract` | `blocked` | `invalid/unsupported-mode.design-source.json` |
| `INGEST_VARIANT_AMBIGUOUS` | Source variants or component properties cannot be deterministically mapped | `mapping` | `blocked` | `invalid/ambiguous-variant.design-source.json` |
| `INGEST_GOVERNANCE_POLICY_MISSING` | Sensitive usage lacks a declared governance policy | `govern` | `blocked` | `invalid/governance-policy-missing.design-source.json` |
| `INGEST_MAPPING_REVIEW_REQUIRED` | Source material is structurally valid but requires human mapping review | `mapping` | `review_required` | `review/manual-mapping-required.design-source.json` |
| `INGEST_MAPPING_AUTHORITY_ESCALATION` | Mapping attempts to promote catalog behavior absent from source material | `mapping` | `blocked` | `mutations/mapping-authority-escalation.design-source-mapping.json` |
| `INGEST_NORMALIZED_ID_DUPLICATE` | Multiple mapping rows emit the same normalized id without an explicit conflict rule | `mapping` | `blocked` | `invalid/duplicate-normalized-id.design-source-mapping.json` |
| `INGEST_MAPPING_ROW_REF_INVALID` | Mapping row source refs, mapping refs, or target refs are missing, malformed, or outside the declared source bundle | `mapping` | `blocked` | `invalid/mapping-row-ref-invalid.design-source-mapping.json` |
| `INGEST_MAPPING_CARDINALITY_INVALID` | Mapping row cardinality is absent or incompatible with the source and target refs | `mapping` | `blocked` | `invalid/mapping-cardinality-invalid.design-source-mapping.json` |
| `INGEST_SCHEMA_HASH_MISMATCH` | A P2-owned schema or consumed shared schema hash differs from the evidence manifest | `evidence` | `blocked` | `mutations/schema-hash-mismatch.design-system-ingestion-evidence.json` |
| `INGEST_EVIDENCE_HASH_MISMATCH` | Ingestion evidence hash differs from manifest or self-hash rule | `evidence` | `blocked` | `mutations/hash-mismatch.design-system-ingestion-evidence.json` |

## Allowed Claims
With passing P2 evidence, repo text may claim deterministic local ingestion for the declared `@adobe/spectrum-design-data@0.7.0` source snapshot, scoped to `button` and `in-line-alert`. It must not claim full Spectrum support, live ingestion, runtime adapter rendering, A2UI support, SurfaceOps operation, JudgmentKit evaluation, P3 orchestration, or Adobe endorsement. `check:p2:planning:validate` remains a non-mutating planning guard; `check:p2:ci` is the proof-bearing gate.

## Non-Goals
- No Figma export ingestion.
- No Storybook server scraping or code-doc metadata ingestion.
- No Code Connect parser or Code Connect mapping ingestion.
- No docs crawler.
- No production HTML extraction or source input in P2.
- No agent recruitment or work-order generation.
- No SurfaceOps persistence.
- No JudgmentKit evaluator execution.
