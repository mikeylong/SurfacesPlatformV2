# Product Boundaries

## Decision
P2 keeps the Surfaces Catalog as the governed contract and introduces a real-source ingestion proof. [VISION](../../VISION.md#canonical-authority-model) remains the canonical authority taxonomy. P2 applies that model to a local source bundle, extraction provenance, and governed catalog output; it does not add a P2 authority model. P2 only defines the phase-local mechanics that make a local source bundle eligible for extraction.

## Goal
Prove the platform can ingest a bounded real design-system source without weakening P0/P1 contract discipline.

## Inputs
- [VISION](../../VISION.md), P0/P1 decisions, and P2 source strategy.
- `sources/p2/design-system-source/package-snapshot.lock.json` as the review-controlled package-byte trust anchor established by a separate SRI and tarball verification; deterministic proof verifies local conformance but does not replay that ceremony.
- `sources/p2/design-system-source/manifest.json`.
- Declared local Spectrum snapshot files, mapping files, and policy files under `sources/p2/design-system-source/`.
- P2 fixtures and expectations manifest.
- Existing P0/P1 schemas and evidence discipline.

## Outputs
- Boundary rules for real-source ingestion.
- P2-local responsibility matrix for ingestion artifacts, compiler, docs, runtime, review, evaluation, product, and downstream projection surfaces.
- Must-not-cross rules that keep P2 from becoming a live source connector or runtime adapter.

## Responsibility Matrix
The complete cross-phase surface-role taxonomy lives in [VISION](../../VISION.md#surface-roles). This matrix is a P2-local delta that names how each surface or artifact participates in the real-source ingestion proof; future-facing rows do not execute in P2.

| Surface | P2 role | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- |
| Design-system source bundle | Lock-verified, manifest-declared source input | Immutable npm snapshot lock, pinned local `@adobe/spectrum-design-data@0.7.0` snapshot, local mappings, local policy refs | Declared local package, mapping, and policy files | Accept Figma exports, Storybook/code metadata, Code Connect mappings, docs crawlers, production HTML, or other source-family inputs; change after locking or bypass lock and manifest refs |
| Source inventory | P2-local provenance and hash record | Source manifest and files | `source-inventory.json` | Invent missing source material or expand source eligibility |
| Source mapping | P2-local reconciliation record | Source inventory and mapping files | `source-mapping.json` | Add catalog behavior absent from source or expand source eligibility |
| Surfaces Catalog | Governed contract output | Extracted design-system material | `catalog.json`, `governed-catalog.json` | Become a source crawler or runtime projection |
| `interfacectl` | Compiler and proof command surface | Immutable package lock, P2 source, fixtures, schemas | Inventory, mapping, extract, catalogs, report, evidence | Call remote APIs, accept stale output, or regenerate the package snapshot lock during ordinary materialization |
| `surfaces.systems` | Product and category surface | P2 proof status and evidence after publication | Human product narrative in later publication | Become a proof artifact or choose product-wide source policy |
| `surfaces.dev` | Developer and agent docs surface | Evidence, commands, schemas, examples | Human-readable P2 docs in later publication | Replace schemas, manifests, proof, or evidence |
| Runtime projection | Downstream consumer | Governed catalog after future adapter proof | Adapter-specific projection | Add source eligibility or source policy in P2 |
| SurfaceOps | Future review console | Review-required evidence rows | Human decisions in later phase | Own ingestion policy in P2 |
| JudgmentKit | Future evaluator | Evidence and evaluator metadata | Quality evaluation in later phase | Override ingestion proof or catalog output |
| A2UI | Future A2UI-specific P5 target; non-participant in P2 | Governed catalog after A2UI-specific proof | A2UI projection, export, or conformance artifacts | Become the Surfaces data model without a separate A2UI proof or add P2 catalog behavior |

## Boundary Rules
- `sources/p2/design-system-source/package-snapshot.lock.json` is derived from the pinned npm tarball only after the tarball passes the declared SRI check. The lock records the tarball SHA-256 plus the exact ordered package-file paths and raw-byte SHA-256 hashes.
- Normal materialization must compare the checked-in package snapshot with the immutable lock before it writes generated manifest metadata. It must fail on drift and must never regenerate or rewrite the lock.
- P2 may read only files declared by `sources/p2/design-system-source/manifest.json`.
- The manifest `packageSnapshotLock` ref must match the exact lock path, schema id, hash algorithm, and `sha256` recorded by the proof contract.
- The current P2 manifest may authorize only the pinned local `@adobe/spectrum-design-data@0.7.0` snapshot, local mappings, and local policy refs for `button` and `in-line-alert`; Figma exports, Storybook/code metadata, Code Connect mappings, docs crawlers, production HTML, and other source families require later connector-specific proofs.
- Source file hashes must be recorded before extraction and copied into evidence.
- Every extracted token, component, prop, variant, state, slot, action, accessibility rule, example, and governance rule must preserve a source ref.
- Mapping files may narrow or explain how manifest-declared source material maps to current catalog contracts. They must not create components, props, variants, actions, policies, or catalog behavior absent from source material.
- For the Spectrum pilot, mapping files may normalize, rename, narrow, or require review for declared `@adobe/spectrum-design-data@0.7.0` facts only. They cannot create actions, variants, accessibility rules, governance rules, token values, allowed props, or catalog behavior absent from the declared Spectrum snapshot.
- Ambiguous source material must block, require review, or require explicit mapping. It must not be silently inferred.
- P2 may update catalog proof artifacts under `artifacts/p2`; it must not rewrite P0/P1 artifacts.
- P2 may prepare evidence that `surfaces.dev`, SurfaceOps, and JudgmentKit can consume later, but none of those products executes in P2.

## P2 Proof
The proof can be completed with an immutable package snapshot lock, a declared source bundle, P2 fixtures, P2 schemas, source inventory, source mapping, extract, catalog, governed catalog, ingestion report, final evidence, and a generated demo.

## Spectrum Authority Matrix
The first P2 pilot uses Adobe Spectrum Design Data, pinned as `@adobe/spectrum-design-data@0.7.0`. This matrix is phase-local and does not redefine the canonical authority taxonomy in [VISION](../../VISION.md#canonical-authority-model).

| Contract area | Spectrum source authority | P2 boundary |
| --- | --- | --- |
| Source eligibility | npm package name, version, tarball, SRI, immutable tarball-derived snapshot lock, local snapshot paths, per-file raw-byte SHA-256s, and the manifest lock ref | Missing or mismatched lock, package, or source hashes block before extraction; ordinary materialization cannot bless changed package bytes |
| Components | `components/button.json`, `components/in-line-alert.json`, `registry/components.json` | Only `button` and `in-line-alert` are in the initial subset |
| Props/options | Component JSON plus `registry/property-terms.json` and declared `fields/*.json` vocabularies | Mappings can normalize names but cannot add props/options absent from source |
| Variants/states | Component JSON, `registry/variants.json`, `registry/states.json`, `fields/variant.json`, `fields/state.json` | Ambiguous or unsupported variants/states block or require review |
| Slots/anatomy | Component JSON, `registry/anatomy-terms.json`, `fields/anatomy.json` | Slot cardinality must be explicit in mapping rows |
| Tokens/modes | `tokens/*.tokens.json`, `registry/token-terminology.json`, `registry/token-objects.json`, `mode-sets/*.json` | Unsupported token types or modes block; mappings cannot invent values |
| Accessibility/examples/policy | Declared component entries and `guidelines/*.json` or local `docs/usage-policy.json` policy refs | Missing governance or accessibility refs block sensitive governed behavior |
| Governed catalog | Extracted Spectrum source refs plus P2 mapping refs | The catalog is the governed contract output; it cannot exceed declared source authority |
| Evidence | P2-owned schemas, consumed shared schemas, source hashes, fixture results, artifact hashes, and self-hash | Passing evidence is required before any implemented P2 claim |

## Non-Goals
- No live connector implementation.
- No Figma export, Storybook/code metadata, Code Connect mapping, docs crawler, production HTML, or other source-family input in P2.
- No public docs site implementation.
- No runtime projection or renderer.
- No SurfaceOps review-decision persistence.
- No JudgmentKit evaluator execution.
- No generated agent work orders.
