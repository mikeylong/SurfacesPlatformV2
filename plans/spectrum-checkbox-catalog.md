# Spectrum Checkbox Catalog Proof Plan

Status: Implemented when `artifacts/spectrum-checkbox-catalog/evidence.json` records `status: "pass"`.

This non-numbered Connect Authority target adds one governed Spectrum component to a distinct expanded catalog. It consumes accepted P2 evidence and the accepted P2 governed catalog. It does not change the implemented P2 source bundle, regenerate the P2 package snapshot lock, or broaden any P2 consumer.

## Decision

Checkbox is the next bounded component.

| Candidate | New designer value | Catalog fit | Source and policy coverage | Diagnostic value | Implementation size | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Checkbox | 5 | 5 | 5 | 5 | 4 | 24/25 — selected |
| Switch | 4 | 5 | 4 | 4 | 4 | 21/25 |
| Text Field | 5 | 3 | 5 | 5 | 1 | 19/25, but too broad for one slice |
| Link | 3 | 3 | 3 | 3 | 5 | 17/25 |

Checkbox adds a common selection control with seven declared props, three interaction states, indeterminate precedence, owner-routed review, five structured accessibility fields, 18 document blocks, and 60 source token bindings. One explicit desktop token mapping keeps the token proof bounded. Switch adds less new state and policy coverage. Link lacks destination authority in the pinned source. Text Field carries compound state, width, validation, and 102 token bindings, which is a larger contract.

## Placement

The target is adjacent to P2 rather than an in-place P2 expansion.

The existing P2 lock declares an exact 31-file package boundary and the P2 compiler is scoped to Button and InLineAlert. Adding `components/checkbox.json` inside P2 would change that accepted boundary and cascade through every P2 consumer. The separate target creates legitimate catalog authority by requiring passing, intact P2 evidence; preserving every accepted P2 component, token, runtime capability, compatibility field, source ref, governance row, and provenance field; and allowing only the distinct catalog ID, one Checkbox component, one token, four source refs, two review/governance rules, one governance result, and one provenance record as the catalog delta. The report binds the before/after catalog IDs and requires that identity change explicitly.

## Checked source boundary

The additional source byte is:

```text
sources/spectrum-checkbox-catalog/npm/@adobe/spectrum-design-data/0.7.0/package/components/checkbox.json
```

The immutable review-time boundary is `sources/spectrum-checkbox-catalog/source-addendum.lock.json`:

- npm package: `@adobe/spectrum-design-data@0.7.0`
- npm SRI: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`
- `components/checkbox.json` raw SHA-256: `8476863b7164c8cf6a5e8ea0b274b6a706fb9ec20e401e212373129fb5bce488`

The review ceremony verified npm SRI, tarball SHA-256, and selected-file raw SHA-256 against the exact pinned tarball. Ordinary materialization is offline and checks the local byte and exact one-file package tree against this lock. It never fetches the package and never rewrites this lock or `sources/p2/design-system-source/package-snapshot.lock.json`.

The target reuses two already locked P2 bytes for identity and token authority:

- `registry/components.json#/values/13`
- `tokens/layout-component.tokens.json#/320`

The generated source manifest closes over the P2 evidence self-hash, P2 catalog JCS hash, addendum lock, selected source byte, reused P2 bytes, and both exact mapping files.

## Governed output

The expanded catalog adds:

- `Checkbox` with `label`, `isSelected`, `isIndeterminate`, `size`, `isEmphasized`, `isDisabled`, and `isError`;
- `hover`, `down`, and the declared `keyboard-focus` to `keyboardFocus` normalization;
- structured `indeterminate-over-selected` precedence bound to `/options/isIndeterminate`;
- the declared role, choose intent, focusability, activation intent, and WCAG references;
- one purpose example;
- `checkbox-control-size-medium-desktop` with the accepted `16px` desktop value;
- owner-bound, non-executable review rows for standalone-label and activation-intent questions.

The component emits no actions, events, slots, data bindings, runtime key bindings, or runtime accessibility-compliance claim. Promotion remains `review_required`.

## Proof command

```bash
interfacectl surfaces spectrum-checkbox-catalog proof \
  --source sources/spectrum-checkbox-catalog \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --fixture fixtures/spectrum-checkbox-catalog \
  --out artifacts/spectrum-checkbox-catalog
```

Package scripts:

```bash
npm run materialize:spectrum-checkbox-catalog
npm run proof:spectrum-checkbox-catalog
npm run check:spectrum-checkbox-catalog
npm run check:spectrum-checkbox-catalog:ci
```

## Proof shape

Schemas cover the source addendum lock, source manifest, source mappings, source inventory, valid/review/invalid fixtures, preflight mutations, expectations, diagnostics, report, and evidence. The runtime catalog and accepted P2 evidence schemas remain shared inputs.

Fixtures cover:

- valid complete Checkbox, indeterminate precedence, and desktop token cases;
- review-required standalone label, unspecified token mode, and activation intent cases;
- unsupported identity, invented behavior, invalid state normalization, missing precedence, missing or undeclared source refs, executable prose, and unattended promotion cases;
- causal mutations for missing/nonpassing/tampered P2 evidence, source-byte drift, undeclared source paths, lock drift, manifest drift, mapping drift, schema drift, and final report/evidence drift.

The proof writes:

```text
artifacts/spectrum-checkbox-catalog/source-inventory.json
artifacts/spectrum-checkbox-catalog/source-mapping.json
artifacts/spectrum-checkbox-catalog/governed-catalog.json
artifacts/spectrum-checkbox-catalog/spectrum-checkbox-catalog-report.json
artifacts/spectrum-checkbox-catalog/evidence.json
```

The report records every fixture result, diagnostic, source and mapping boundary, exact P2 preservation hash, and catalog delta. Final evidence closes over all schemas, sources, fixtures, implementation inputs, generated artifacts, the report, accepted P2 boundaries, and its own JCS self-hash. The production integrity inspector reconstructs the expected source inventory, mapping, catalog, report, run id, results, and evidence before accepting the persisted proof.

## Acceptance criteria

- Accepted P2 evidence is passing and intact before any Checkbox source is compiled.
- The existing P2 source snapshot lock and P2 catalog bytes remain unchanged.
- The addendum contains exactly one independent regular source file with no symlinked ancestor or hard link.
- Every mapping row and review row matches the fixed contract and resolves to checked source and output facts.
- Every accepted P2 component and token entry has the same JCS hash in the expanded catalog.
- The only component and token additions are `Checkbox` and `checkbox-control-size-medium-desktop`.
- All valid, review, invalid, and mutation expectations match their canonical diagnostics.
- The tracked report and evidence validate, reconstruct, and pass their hash closures.
- Capability-index status reports the target as implemented with passing evidence and `review_required` promotion.

## Non-capabilities

This target does not claim full Spectrum support, an in-place P2 expansion, live connectors, Figma or Storybook crawling, self-serve connection UI, production adapters, public APIs or SDKs, runtime action execution, runtime accessibility compliance, SurfaceOps expansion, JudgmentKit invocation, A2UI, or production-facing designer workflow support.
