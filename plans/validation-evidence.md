# Validation And Evidence

## Decision
P0 final evidence produces `artifacts/p0/evidence.json` after adapter conformance. It is the proof record for catalog validation, governed Surface IR validation, invalid fixture failures, review-required cases, adapter diagnostics, artifact hashes, and provenance.

## Goal
Create one evidence artifact that can later be consumed by JudgmentKit, SurfaceOps, or CI without coupling P0 to those products.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `fixtures/p0/valid.surface-ir.json`.
- `fixtures/p0/invalid/*.json`.
- `fixtures/p0/review/*.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- `schemas/runtime-catalog.v0.schema.json`.
- `schemas/surface-ir.v0.schema.json`.
- `schemas/fixture-expectations.v0.schema.json`.
- `schemas/extract.v0.schema.json`.
- `schemas/adapter-diagnostics.v0.schema.json`.
- `schemas/evidence.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- Runtime Catalog v0 diagnostics shape.

## Outputs
- `artifacts/p0/evidence.json`.

## Evidence v0 Minimum Shape
`evidence.json` must include:

- `contractId`.
- `schemaId`.
- `version`.
- `runId`.
- `checkedAt`.
- `fixtureLabel`.
- `command`.
- `args`.
- `status`: `pass` or `fail` for proof correctness; `pass` means every manifest expectation matched, including expected invalid and review-required cases.
- `promotionStatus`: aggregate run-level value: `allowed`, `review_required`, or `blocked`.
- `validationResults`: per-fixture results with fixture kind, expected and actual stage, expected and actual phase, actual and expected `validationResult`, actual and expected `promotionStatus`, expected diagnostic codes, actual diagnostic codes, artifact path, JSON Pointer, source ref, and matched boolean.
- `evaluator`: name and version.
- `environment`: deterministic proof metadata with `golden`, `timestampMode`, `timestampOverride`, `timezone`, `locale`, `pathStyle`, `jsonCanonicalization`, `numberSerialization`, `schemaOutputFormat`, and `host`.
- `artifacts`: every input and output artifact with role, path, schema id, hash algorithm, and hash.
- `provenance`: source URI, source hash, compiler version, schema ids, and stage chain.
- `diagnostics`: diagnostics conforming to `schemas/diagnostics.v0.schema.json`.
- `adapterDiagnosticsPath`: `artifacts/p0/adapter-diagnostics.json`.

## Hash And Provenance Policy
P0 evidence must cover every listed input and output artifact:

- `schemas/runtime-catalog.v0.schema.json`.
- `schemas/surface-ir.v0.schema.json`.
- `schemas/fixture-expectations.v0.schema.json`.
- `schemas/extract.v0.schema.json`.
- `schemas/adapter-diagnostics.v0.schema.json`.
- `schemas/evidence.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- `fixtures/p0/source.fixture.json`.
- `fixtures/p0/expectations.manifest.json`.
- every file in `fixtures/p0/mutations/`.
- `fixtures/p0/valid.surface-ir.json`.
- every file in `fixtures/p0/invalid/`.
- every file in `fixtures/p0/review/`.
- `artifacts/p0/extract.json`.
- `artifacts/p0/catalog.json`.
- `artifacts/p0/governed-catalog.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- `artifacts/p0/evidence.json`.

The spec pins deterministic proof output:

- Canonical JSON: RFC 8785 JSON Canonicalization Scheme over UTF-8 JSON, with no insignificant whitespace, arrays preserved in specified order, object properties recursively sorted by UTF-16 code units, and string, literal, and number serialization following JCS. Inputs must be I-JSON: JSON numbers must be IEEE 754 double-precision compatible, and larger integers or higher-precision values must be represented as strings. Non-finite numbers are invalid, and string token values are never coerced to numbers.
- Hash algorithm: SHA-256 over canonical JSON bytes.
- Artifact ordering in evidence: schemas, source fixture, expectations manifest, mutation fixtures, valid fixture, invalid fixtures, review fixtures, generated artifacts, adapter diagnostics, final evidence.
- `runId`: deterministic P0 value derived from the SHA-256 hash of `source.fixture.json`, schema ids, and command args unless explicitly overridden.
- `checkedAt`: normalized to `1970-01-01T00:00:00.000Z` for golden artifacts; real timestamps are allowed only outside golden fixture comparison.
- `generatedAt`: all golden fixture and artifact provenance timestamps are normalized to `1970-01-01T00:00:00.000Z`.
- Timestamp override: P0 has no CLI timestamp flag. Any timestamp override must be recorded in `environment.timestampOverride`; golden comparison requires `environment.golden: true`, `timestampMode: "normalized"`, `timestampOverride: null`, `timezone: "UTC"`, `locale: "en-US-POSIX"`, `pathStyle: "posix-relative"`, `jsonCanonicalization: "rfc8785"`, `numberSerialization: "rfc8785"`, `schemaOutputFormat: "basic"`, and `host: null`.
- Paths: POSIX-style relative paths from workspace root.

The `artifacts` entry for `artifacts/p0/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`. The `hash` field must not be omitted. Verifiers must apply the same null-placeholder transform before hashing. `adapter-diagnostics.json` must be produced before the final evidence artifact is finalized so its hash can be recorded.

## Promotion Aggregation
`promotionStatus` is a run-level aggregate, not a direct echo of every fixture result:

1. If `status` is `fail`, or if any required schema, fixture, artifact, hash, provenance, or manifest comparison check fails, aggregate `promotionStatus` is `blocked`.
2. If `status` is `pass`, expected invalid fixtures whose `blocked` result matches `fixtures/p0/expectations.manifest.json` remain visible in `validationResults` but do not make the run-level aggregate `blocked`.
3. If `status` is `pass` and any structurally valid fixture or governed result requires review, aggregate `promotionStatus` is `review_required`.
4. If `status` is `pass` and no structurally valid fixture or governed result requires review, aggregate `promotionStatus` is `allowed`.

For the P0 fixture set, a successful proof must produce `status: pass` and aggregate `promotionStatus: review_required`.

## JSON Schema Output Normalization
P0 pins JSON Schema validation output to Draft 2020-12 `basic` output. Validator-native errors must be normalized before writing diagnostics or evidence. Persisted diagnostics must not depend on validator-native error order.

Each schema output unit maps to Diagnostics v0 with `schemaOutputFormat: "basic"`, `diagnosticSource: "json-schema"`, `path` equal to `instanceLocation`, and preserved `instanceLocation`, `keywordLocation`, and `absoluteKeywordLocation`. The persisted `message` must be the canonical registry message for the matched registry row, identified by `code`, trigger, artifact path, JSON Pointer, and fixture coverage; validator-native `error` text is non-normative and must not be used for evidence hashing or manifest comparison.

Schema validation runs first for each checked artifact. A schema output unit maps to a specific registry row only by `artifactPath`, `instanceLocation`, `keywordLocation` or `absoluteKeywordLocation`, and manifest-declared expected diagnostic codes. P0 mapping must not depend on validator-native error wording, validator error order, or a JSON Schema `rule` field. If no specific registry row maps the output unit, emit `SCHEMA_VALIDATION_FAILED` with its canonical registry message. Semantic, governance, and adapter diagnostics must not duplicate a schema diagnostic for the same `artifactPath`, `path`, and `code`.

Diagnostics arrays are sorted by `artifactPath`, stage order (`extract`, `compile`, `govern`, `validate`, `adapter-conformance`, `evidence`), `path`, `keywordLocation`, `code`, `sourceRef`, then canonical `message`; nulls sort after strings. Validator-native message text is excluded from sorting and hashing. `validationResults` are sorted by manifest fixture order.

## Diagnostic v0 Minimum Shape
Each diagnostic must include:

- `code`.
- `diagnosticSource`: `json-schema`, `extractor`, `catalog-validator`, `governance`, `adapter`, or `evidence`.
- `schemaOutputFormat`: `basic` for JSON Schema diagnostics; `null` otherwise.
- `severity`: `info`, `warning`, `review`, or `error`.
- P0 manifest expectations must use only `review` or `error`; `info` and `warning` are reserved for post-P0 diagnostics unless a registry row and fixture are added.
- `message`: row-specific canonical registry message for the matched registry row; used in canonical evidence and hash comparison.
- `validatorMessage`: optional non-normative validator-native JSON Schema `error` text; omitted from golden artifacts and removed before evidence hashing when present in non-golden debug output.
- `stage`: `extract`, `compile`, `govern`, `validate`, `adapter-conformance`, or `evidence`.
- `path`: JSON Pointer path in the checked artifact.
- `instanceLocation`: JSON Schema output-compatible instance path; same value as `path` unless a validator reports a more precise nested location.
- `keywordLocation`: JSON Schema output-compatible schema keyword path when the diagnostic comes from schema validation.
- `absoluteKeywordLocation`: absolute schema URI plus keyword path when available.
- `sourceRef`: fixture source ref when available.
- `artifactPath`.
- `validationResult`: `valid`, `invalid`, or `not_applicable`.
- `promotionStatus`.
- `suggestedAction`.

## Diagnostics Registry
`schemas/diagnostics.v0.schema.json` must encode the registry in [Subplan Index](README.md). Codes not listed there are invalid in P0. Every blocking rule in the extractor, compiler, governance, validation, and adapter-conformance stages must map to one registry row with stage, trigger, row-specific `canonicalMessage`, severity, promotion status, artifact path, JSON Pointer path, and fixture coverage.

## P0 Proof
One evidence file records successful validation for the valid Surface IR, expected failures for every invalid fixture, the `review_required` case, adapter diagnostics, and enough provenance to reproduce the run. It includes diagnostics for human review, CI, and adapter-conformance consumers.

## Non-Goals
- No screenshot capture.
- No visual diff.
- No automated accessibility scan beyond catalog-declared semantics.
- No external JudgmentKit execution.
- No SurfaceOps persistence.

## Closed P0 Decisions
- Evidence status values are `pass` and `fail`; review state is represented by aggregate `promotionStatus: review_required` only when proof correctness passes and at least one structurally valid fixture or governed result requires review.
- Evidence hashes cover every schema, fixture, and artifact.
- JudgmentKit becomes an evaluator candidate after P0, not during P0.
