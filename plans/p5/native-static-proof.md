# Native Static Proof

## Status
This is the implemented P5 proof contract for the `surfaces-native-static` sibling target.

`surfaces-native-static` is a Surfaces-native, proof-only, inert static-packet target. It is not A2UI, an A2UI clone, A2UI conformance, a production native SDK, a production API, a native bridge, a live runtime, or an expansion of `surfaces-protocol-static`.

## Decision
The native target consumes accepted P2 catalog/evidence and accepted P4 review/judgment evidence as authority, then validates the existing `surfaces-protocol-static` evidence as compatibility preflight only. Protocol evidence does not become native authority and does not prove native support.

Target selection records accepted P2/P4 authority refs in `upstreamRefs[]` and protocol compatibility evidence in `compatibilityPreflightRefs[]`. Native evidence records accepted P2/P4 authority and generated native artifact refs in `boundaryRefs[]`; `artifacts/p5/protocol/evidence.json` must appear only in `compatibilityPreflightRefs[]`.

All native refs are validated as full tuples: `path`, `schemaId`, `hashAlgorithm`, `hash`, `sourceEvidenceHash` where applicable, deterministic order or field-defined role, and provenance where required by schema. Wrong-schema, wrong-path, wrong-hash-algorithm, wrong-source-evidence-hash, stale, missing, duplicated, alternate, or extra refs fail closed.

## Contract Layout

```text
schemas/
  surfaces-native-target-selection.v0.schema.json
  surfaces-native-projection.v0.schema.json
  surfaces-native-packet.v0.schema.json
  surfaces-native-report.v0.schema.json
  surfaces-native-evidence.v0.schema.json
  surfaces-native-expectations.v0.schema.json
  surfaces-native-diagnostics.v0.schema.json
  surfaces-native-preflight-mutation.v0.schema.json

fixtures/p5/native/
  expectations.manifest.json
  adapter-target-selection.fixture.json
  valid/
  review/
  invalid/
  mutations/

artifacts/p5/native/
  adapter-target-selection.json
  surfaces-native-projection.json
  surfaces-native-packet.button.json
  surfaces-native-packet.in-line-alert.json
  surfaces-native-report.json
  evidence.json

demo/p5/native/
  README.md
  index.html
```

## Proof Command

```bash
interfacectl surfaces native proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --catalog artifacts/p2/governed-catalog.json \
  --protocol-evidence artifacts/p5/protocol/evidence.json \
  --fixture fixtures/p5/native \
  --out artifacts/p5/native
```

## Pass Condition
Given accepted P2 evidence/catalog, accepted P4 evidence/ledger/report, passing protocol evidence for compatibility preflight, and the native fixture set, the command emits the exact native artifact set, validates target selection and ref tuples, derives a hash-bound native projection from catalog authority, emits deterministic inert native packets for allowed fixtures only, preserves review-required rows without packet artifacts, records native diagnostics before evidence, and writes reproducible `surfaces-native-evidence.v0` with `status: "pass"`.

## Non-Goals
- No A2UI export, clone, or conformance claim.
- No production native SDK, package, bridge, API, renderer, or live runtime.
- No live protocol service and no expansion of `surfaces-protocol-static`.
- No action execution, callbacks, network calls, connector calls, secrets, or side effects.
- No live SurfaceOps persistence or live JudgmentKit invocation.
- No catalog-authority override; P2 catalog/evidence and P4 review evidence remain the authority inputs.
