# Protocol Adapter Proof

## Status
This is the implemented P5 proof contract for the `surfaces-protocol-static` target.

## Decision
The P5 protocol proof materializes deterministic artifacts showing that a protocol adapter can consume a governed protocol projection, accept allowed protocol-facing usage, reject invalid usage, preserve review gates, and emit evidence-compatible artifacts without creating a live production API or protocol service.

## Proof Command
Implemented command:

```bash
interfacectl surfaces protocol proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --catalog artifacts/p2/governed-catalog.json \
  --fixture fixtures/p5/protocol \
  --out artifacts/p5/protocol
```

Package scripts execute this as `node bin/interfacectl.js surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol`. P5 evidence records the logical command string above.

## Inputs
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p4/evidence.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/review-judgment-report.json`.
- `fixtures/p5/protocol/adapter-target-selection.fixture.json`.
- `fixtures/p5/protocol/expectations.manifest.json`.
- P5 valid, review, invalid, and mutation fixtures.
- P5 schemas.

## Outputs
- `artifacts/p5/protocol/adapter-target-selection.json`.
- `artifacts/p5/protocol/protocol-projection.json`.
- `artifacts/p5/protocol/protocol-envelope.button.json`.
- `artifacts/p5/protocol/protocol-envelope.in-line-alert.json`.
- `artifacts/p5/protocol/protocol-adapter-report.json`.
- `artifacts/p5/protocol/evidence.json`.

Review-required and invalid fixtures are report/evidence-only. They must not emit protocol-envelope artifacts.

## Protocol Envelope Shape
`protocol-envelope.v0` requires:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `protocol-envelope.v0` |
| `version` | string | yes | Semver |
| `adapter` | const | yes | `surfaces-protocol-static` |
| `surfaceRef` | object | yes | Fixture path, schema id, source ref, and hash |
| `projectionRef` | object | yes | `protocol-projection.json` path, schema id, and hash |
| `promotionStatus` | enum | yes | `allowed`, `review_required`, or `blocked` |
| `message` | object | yes | Declarative protocol envelope for allowed fixtures |
| `actions` | array | yes | Inert action descriptors with `executed: false` |
| `sideEffects` | array | yes | Must be empty |
| `transport` | const | yes | `none` |
| `accessibility` | object | yes | Accessibility expectations copied from validated inputs |
| `tokens` | object | yes | Resolved token refs used by the envelope |
| `provenance` | object | yes | Source refs and deterministic generator metadata |
| `diagnostics` | array | yes | Protocol diagnostics |

Envelope `tokens` must be a map of normalized catalog-derived token records closed over `type`, `value`, and `sourceRef`. CSS variables, CSS property names, renderer metadata, transport metadata, callbacks, and arbitrary implementation fields must not validate inside token records.

The `message` object is declarative JSON only. It must not include executable code, callback identifiers, network endpoints, secrets, credentials, live account identifiers, hidden state, mutable review decisions, or production API operation claims.

## Proof Behavior
- Run strict upstream preflight before target selection or projection.
- Use the accepted upstream boundary refresh runbook in `plans/p5/validation-evidence.md` only when an intentional P2 or P4 proof change needs explicit P5 boundary advancement.
- Emit target selection before projection.
- Derive protocol projection before reading valid/review/invalid Surface IR fixtures for adapter-boundary checks.
- Validate fixtures against the projection, not against a live service or full catalog.
- Emit protocol envelopes for allowed fixtures only.
- Record review-required fixtures in `protocol-adapter-report.json` and final evidence without emitting protocol-envelope artifacts.
- Block invalid fixtures with canonical diagnostics.
- Keep all actions inert with `executed: false`, `sideEffects: []`, and `transport: "none"`.
- Emit `protocol-adapter-report.json` before final evidence.
- Finalize evidence only after every artifact hash and provenance ref is current.

## Exit And Output Contract
The proof command follows the established phase command discipline:

- Exit `0`: upstream preflight passes, target selection is in scope, allowed fixtures emit deterministic protocol envelopes, review-required fixtures emit report/evidence rows only, invalid and mutation fixtures fail with expected diagnostics, the protocol adapter report is complete, final evidence is reproducible, and `evidence.status` is `pass`.
- Exit `1`: upstream preflight, target selection, projection, fixture expectation, report, evidence, stale-output, hash, provenance, or authority checks fail.
- Exit `2`: command usage, missing required argument, unreadable input path, invalid POSIX-relative path, or output-root error.
- The command must write a concise deterministic stage summary to stdout.
- The command must write diagnostics to stderr only for command/runtime failure, not for expected invalid fixture outcomes.
- The command must reject absolute paths, `.` segments, `..` traversal, symlinked paths, hidden output, stale unexpected output, and writes outside the declared `--out` directory before materializing P5 proof artifacts.

## Report Behavior
`protocol-adapter-report.v0` includes:

- schema id, version, adapter, and run id;
- upstream preflight summary;
- target selection ref;
- projection ref;
- fixture root and artifact root;
- result rows with expected and actual stage, phase, validation result, promotion status, diagnostics, artifact path, JSON Pointer, source ref, and matched boolean;
- protocol envelope refs for allowed fixtures;
- diagnostics;
- deterministic environment;
- aggregate status and promotion status.

## Pass Condition
The proof passes when upstream evidence and catalog hashes validate, target selection is in scope, projection authority is no broader than accepted catalog authority, all fixture expectations match, allowed protocol envelopes are deterministic and inert, review-required rows remain non-executable, invalid and mutation rows fail as expected, report rows are complete, and final evidence is reproducible.

## Non-Goals
- No live protocol server.
- No HTTP, RPC, webhook, queue, connector, or network behavior.
- No production API contract.
- No SDK package.
- No action callbacks or execution.
- No renderer.
- No A2UI export or conformance proof.
- No claim that future P5 targets are implemented by this static protocol proof.
