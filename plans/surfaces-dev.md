# Surfaces.dev Documentation Tracking

## Decision
`surfaces.dev` is the developer and agent documentation surface for Surfaces Platform. This repo tracks its required phase updates here until a dedicated docs site or package exists.

`surfaces.dev` is not proof authority. It must point back to versioned schemas, fixtures, commands, artifacts, evidence, `VISION.md`, `PLAN.md`, and phase subplans.

## Goal
Make documentation obligations explicit at each phase boundary so the platform does not advance proof contracts without keeping developer and agent instructions current.

## Phase Update Rule
Every phase that changes commands, schemas, fixtures, artifacts, evidence, diagnostics, demos, or operating rules must update this tracking file or the future `surfaces.dev` docs package in the same change set.

Each phase update must include:

- supported `interfacectl` commands;
- schema and artifact refs;
- fixture and source roots;
- evidence authority and promotion semantics;
- examples or generated demo refs;
- non-goals and safety boundaries;
- agent instructions for using the phase correctly;
- links back to the normative plan and subplans.

## Current Tracking

| Phase | Documentation state | Required surfaces.dev update |
| --- | --- | --- |
| P0 | Planned and implemented in proof docs | Explain catalog proof, fixture-only extraction, diagnostics, evidence, and no real design-system ingestion claim |
| P1 | Planned and implemented in proof docs | Explain `web-static` runtime projection, render plans, generated demo, review-required behavior, and no runtime authority expansion |
| P2 | Planned as real design-system ingestion | Explain source bundle requirements, source refs, mapping review, ingestion diagnostics, evidence, and the selected target design system once chosen |
| P3 | Parked as agent orchestration draft | Explain capability registry, inert work orders, review queue, report, and no live agent execution in P3; any later live execution requires a separate proof or explicit authorization |

## Non-Goals
- No docs site implementation in this repo yet.
- No replacement for schemas, manifests, proof commands, or evidence.
- No product marketing content.
- No live API reference beyond implemented commands.
