# Design-System Extractor

## Decision
The P0 extractor reads `fixtures/p0/source.fixture.json` only. It does not call the Figma API, scrape Storybook, read Code Connect files, or crawl docs.

## Goal
Turn fixture source material into deterministic `artifacts/p0/extract.json` while preserving source refs and enough structure for the compiler to produce the Surfaces Catalog.

## Inputs
- `fixtures/p0/source.fixture.json`.
- `schemas/extract.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- Runtime Catalog v0 field expectations.
- P0 fixture component definitions and examples.

## Outputs
- `artifacts/p0/extract.json`.
- Extraction diagnostics conforming to `schemas/diagnostics.v0.schema.json`.

`extract.json` must include normalized tokens, components, variants, states, slots, actions/events, data bindings, accessibility semantics, examples, source refs, and provenance.

## Blocking Rules
- Missing required fixture fields block extraction with `EXTRACT_REQUIRED_FIELD_MISSING`.
- Missing source refs block extraction with `EXTRACT_SOURCE_REF_MISSING`.
- Missing source fixture provenance fields block extraction with `EXTRACT_REQUIRED_FIELD_MISSING`; missing provenance source refs block extraction with `EXTRACT_SOURCE_REF_MISSING`.
- Unresolved token alias, JSON Pointer `$ref`, or `$extends` targets block extraction with `TOKEN_REFERENCE_UNRESOLVED`.
- Circular token alias, JSON Pointer `$ref`, or `$extends` chains block extraction with `TOKEN_REFERENCE_CIRCULAR`.
- `$extends` targets that resolve to a token, non-group, or non-object block extraction with `TOKEN_EXTENDS_INVALID`.
- Missing, extra, or incompatible `typography` and `shadow` composite token sub-values block extraction with `TOKEN_COMPOSITE_INVALID`.
- P0 has no warning-only extraction path. Unsupported optional fields are absent from the fixture, and unknown or validity-affecting fields are blocked by schema or catalog validation.

## P0 Proof
The extractor proves that fixture source material can become structured input for the catalog compiler. The output is deterministic, source-ref preserving, and complete enough to compile the three fixture components without external services.

## Non-Goals
- No live Figma ingestion.
- No Figma variable API calls.
- No Code Connect parser.
- No Storybook metadata importer.
- No documentation crawler.
- No legacy repo schema copy.

## Closed P0 Decisions
- Fixture extraction is represented as the first stage of the proof command.
- Source refs use fixture-local synthetic URIs plus JSON Pointer paths.
- Missing-field, source-ref, and token-resolution diagnostics share the P0 diagnostic schema.
