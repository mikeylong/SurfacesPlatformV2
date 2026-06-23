# Catalog Compiler

## Decision
The P0 compiler converts `artifacts/p0/extract.json` into `artifacts/p0/catalog.json`. Governance annotation is a separate stage that produces `artifacts/p0/governed-catalog.json`.

## Goal
Prove that normalized design-system source material can become a machine-readable Surfaces Catalog with deterministic structure, diagnostics, provenance, and enforcement-ready fields.

## Inputs
- `artifacts/p0/extract.json`.
- `schemas/runtime-catalog.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- P0 fixture expectations.

## Outputs
- `artifacts/p0/catalog.json`.
- Compiler diagnostics conforming to `schemas/diagnostics.v0.schema.json`.

## Blocking Rules
The compiler blocks invalid catalog construction for compile-owned catalog assembly failures proven by P0 mutation fixtures.

The compiler must block:
- duplicate component ids with `CATALOG_DUPLICATE_ID`;
- missing generated artifact provenance in `artifacts/p0/extract.json` with `PROVENANCE_MISSING`.

Surface IR misuse, unknown token refs, invalid values, missing accessibility contracts, and invalid JSON Pointer paths are validated in the `validate` phase against `surface-ir.v0.schema.json`, `runtime-catalog.v0.schema.json`, and the governed catalog. P0 does not assign those failures to the compiler unless a compile-stage mutation fixture and registry row are added.

Duplicate prop, variant, state, slot, action, event, or data-binding ids within a component are deferred to P1 unless P0 adds dedicated member-duplicate mutation fixtures and registry rows. They must not be claimed as P0 compile-stage proof coverage.

## P0 Proof
The compiler produces deterministic `artifacts/p0/catalog.json` for the golden fixture. It records diagnostics for every blocking condition in the shared diagnostic shape.

## Non-Goals
- No multi-source merge.
- No live package generation.
- No runtime renderer.
- No public schema registry.
- No framework-specific code generation.

## Closed P0 Decisions
- `catalog.json` and `governed-catalog.json` are separate persisted artifacts.
- Compiler diagnostics share the same code namespace as validation and adapter diagnostics.
- Partial catalogs are not supported in P0.
