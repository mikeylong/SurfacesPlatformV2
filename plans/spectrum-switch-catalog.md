# Spectrum Switch Catalog Proof Plan

Status: Implemented when `artifacts/spectrum-switch-catalog/evidence.json`
records `status: "pass"` and `promotionStatus: "review_required"`.

This non-numbered Connect Authority target adds exactly one governed `Switch`
component to a new catalog identity downstream of passing P2 and Spectrum
Checkbox evidence. The accepted Checkbox governed catalog is the immediate
baseline. P2 and Checkbox source contracts, locks, mappings, components,
tokens, source refs, governance, provenance, compatibility, and runtime
capabilities are not broadened or rewritten.

## Source-authority decision

The Switch source preflight is a go. The exact byte comes only from the pinned
`@adobe/spectrum-design-data@0.7.0` tarball:

- npm SRI: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`
- exact unique tar path: `package/components/switch.json`
- raw selected-file SHA-256: `f71fca208251775638f52f9b6dfefc19104b17119512f6c3ae491da3c684b512`

The immutable one-file lock is
`sources/spectrum-switch-catalog/source-addendum.lock.json` and uses the
Switch-specific `spectrum-switch-source-addendum-lock.v0` schema. Ordinary
materialization is offline, accepts exactly `components/switch.json`, rejects
unsafe or additional paths, and never writes any source lock.

The checked source supports six props (`label`, `isSelected`, `size`,
`isEmphasized`, `isDisabled`, and `isReadOnly`), three interaction states
(`hover`, `down`, and `keyboard-focus`), five structured accessibility fact
groups, one purpose block, 16 guidance blocks, and 62 token bindings. The one
minimal token delta is `switch-control-width-medium-desktop`, bound from
`components/switch.json#/tokenBindings/6` through the P2-locked
`tokens/layout-component.tokens.json#/1066` record with value `26px`.
`registry/components.json#/values/44` corroborates identity only.

The source does not authorize actions, events, slots, data bindings, exact
runtime key bindings, toggle execution, group propagation, read-only runtime
behavior, or runtime accessibility compliance. Guidance prose does not become
executable authority.

## Governed delta

The target emits a distinct `surfaces-spectrum-switch-catalog-governed`
catalog containing `Button`, `Checkbox`, `InLineAlert`, and `Switch`. It adds:

- one `Switch` component with exactly six declared props and three normalized
  states;
- the checked accessibility metadata with runtime compliance explicitly
  recorded as not proven;
- one purpose example;
- one `26px` desktop token;
- 13 accepted source-mapping rows;
- two owner-bound, non-executable review rows for standalone labeling and
  activation intent;
- one Switch source-review governance rule, one result row, four source refs,
  and one provenance record.

The report preserves 36 Checkbox-baseline records by JCS hash: four root
invariants, all three components, all four tokens, all 11 source refs, all
three governance rules, both governance results, promotion status, all six
provenance records, runtime capabilities, and compatibility. Promotion remains
`review_required`.

## Proof command

```bash
interfacectl surfaces spectrum-switch-catalog proof \
  --source sources/spectrum-switch-catalog \
  --ingestion-evidence artifacts/p2/evidence.json \
  --checkbox-evidence artifacts/spectrum-checkbox-catalog/evidence.json \
  --catalog artifacts/spectrum-checkbox-catalog/governed-catalog.json \
  --fixture fixtures/spectrum-switch-catalog \
  --out artifacts/spectrum-switch-catalog
```

Package scripts:

```bash
npm run materialize:spectrum-switch-catalog
npm run proof:spectrum-switch-catalog
npm run check:spectrum-switch-catalog
npm run check:spectrum-switch-catalog:ci
```

## Proof shape

Ten target schemas cover the immutable lock, source manifest, mappings,
inventory, catalog fixtures, preflight mutations, expectations, diagnostics,
report, and evidence. Shared runtime-catalog and P2 evidence schemas remain
inputs. Forty-two expectations cover four valid cases, three review cases,
15 invalid cases, and 20 causal mutations.

The causal matrix rejects missing, nonpassing, and still-pass tampered P2 or
Checkbox evidence; Checkbox baseline drift; source byte, exact tree, lock,
manifest, input mapping, schema, implementation, generated inventory, generated
mapping, governed catalog, report, and evidence drift; undeclared source
pointers; invented action, event, slot, data-binding, runtime-key, toggle,
read-only, or accessibility behavior; unsupported `isIndeterminate`; executable
guidance; and unattended promotion.

The proof writes:

```text
artifacts/spectrum-switch-catalog/source-inventory.json
artifacts/spectrum-switch-catalog/source-mapping.json
artifacts/spectrum-switch-catalog/governed-catalog.json
artifacts/spectrum-switch-catalog/spectrum-switch-catalog-report.json
artifacts/spectrum-switch-catalog/evidence.json
```

Final evidence closes over three upstream boundaries, 14 schema files, seven
source files, 43 fixture files, implementation inputs, all five artifacts, the
report, and its own RFC 8785/JCS self-hash. The production inspector reconstructs
the complete output before accepting persisted evidence.

## Acceptance criteria

- P2 and Checkbox evidence are passing and pass their own deep integrity
  inspectors before Switch inputs are accepted.
- The Checkbox governed catalog matches its evidence and is preserved through
  all 36 report rows.
- The one-file source tree and three source hashes match the immutable review
  ceremony; no lock is rewritten.
- Every source ref is both resolvable and inside the exact manifest pointer
  allowlist.
- The only component and token additions are `Switch` and
  `switch-control-width-medium-desktop`.
- The exact Switch component contains no executable or inferred behavior.
- Every expectation matches its canonical diagnostic and every persisted
  artifact reconstructs from checked inputs.
- Capability-index evidence records 18 implemented targets, seven planned
  groups, self-exclusion, passing Switch evidence, and `review_required`
  promotion.

## Non-capabilities

This target does not claim full Spectrum support, live connectors, self-serve
connection, runtime behavior, accessibility compliance, production adapters,
public APIs or SDKs, SurfaceOps expansion, A2UI, production readiness, or live
JudgmentKit use.
