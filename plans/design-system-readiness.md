# Design-System Readiness Plan

## Status
This is a planning-only document for deciding when Surfaces Platform can test or
support additional agent-friendly design systems such as broader Adobe Spectrum
coverage or Astryx. It is subordinate to [VISION.md](../VISION.md), [PLAN.md](../PLAN.md),
and passing proof evidence.

This file does not create proof authority, implemented support, a runnable proof
command, schemas, fixtures, artifacts, evidence, CI gates, live ingestion,
production adapters, API, SDK, runtime, A2UI support, live SurfaceOps, live
JudgmentKit, or customer validation.

## Purpose
Agent-friendly design systems can expose source through package metadata,
component code, docs, CLI output, MCP tools, templates, themes, and swizzled or
ejected source. Those surfaces are useful for agents, but they are not Surfaces
authority until they are captured as bounded, manifest-declared, hash-bound
source or target material and proven through deterministic evidence.

This plan separates readiness to test from readiness to support.

- Ready to test means a candidate design system can be evaluated through a
  proof-shaped local source bundle and evidence walkthrough without claiming
  adoption or implementation support.
- Ready to support means a named design-system slice has passing proof evidence
  for ingestion, conformance or readiness, designer workflow trace coverage, and
  any claimed target-specific handoff.

## Current Baseline
The current repo can claim deterministic local ingestion only for the implemented
P2 Spectrum slice: Adobe Spectrum Design Data, pinned to
`@adobe/spectrum-design-data@0.7.0`, scoped to `button` and `in-line-alert`.
That is not full Spectrum support.

The current source-conformance proof demonstrates declared local source
authority, source-precedence conflict handling, review-required routing, and
evidence checks over accepted P2 catalog and evidence. It also proves the first
readiness step: declared forked Button variant exceptions route to
non-executable review, while undocumented fork drift blocks. It is proof-only
and does not broaden P2 ingestion support.

Astryx has no current repo-defined proof target. It should remain a candidate
source-family or target-conformance subject until a later proof defines schemas,
fixtures, diagnostics, command behavior, generated reports or artifacts, evidence
path, CI gate, and passing evidence.

## Readiness Checklist
A design-system candidate is ready for proof-shaped testing only when the plan
can account for every checklist item below:

1. Source material is manifest-declared and hash-bound.
2. Every emitted token, component, prop, variant, state, accessibility, example,
   and policy fact has preserved source refs.
3. Unsupported or ambiguous material becomes `blocked`, `review_required`, or an
   explicit mapping requirement, not agent inference.
4. Guidance-only conventions become explicit policy inputs or deterministic
   diagnostics.
5. CLI output, MCP output, templates, docs, themes, swizzles, or ejected source
   are treated as source or target material only when snapshotted and proven, not
   as live authority.
6. Review-required output cannot promote unattended.
7. CI can reproduce proof outputs, report rows, artifact hashes, and final
   evidence.
8. Product-designer archetypes can classify allowed, blocked, and
   `review_required` outcomes from evidence rather than demos or screenshots.

## Source-Family Direction
### Spectrum Expansion
Broader Spectrum testing should start by extending the existing local
`@adobe/spectrum-design-data` source-family pattern. This is the lowest-risk
route because the current P2 slice already proves a manifest-declared package
snapshot, source-ref grammar, source hashes, mappings, policy refs, diagnostics,
and final evidence.

Spectrum expansion should remain bounded by component subset, package version,
declared package paths, mapping files, policy refs, and evidence. It must not be
described as full Spectrum support until each claimed slice has passing evidence.

### Astryx Candidate
Astryx should start as a local git or npm snapshot source family, not as live
CLI, MCP, template, docs, or swizzle authority. Candidate source refs should be
explicit and version-bound, for example:

```text
astryx://git/facebook/astryx@<commit>/<path>#<typed-anchor>
astryx://npm/@astryxdesign/<package>@<version>/<path>#<typed-anchor>
```

If Astryx CLI, MCP, docs, templates, themes, or swizzle output are considered,
the snapshot must record the tool or command id, version, arguments or request,
response material, source refs, and hashes. Live tool output is not authority.

## Planned Proof Shape
A future design-system-readiness proof or a scoped source-conformance extension
would need:

- schemas for a candidate source manifest, source-material inventory, source
  authority matrix, fact coverage report, policy map, review queue or review
  rows, readiness report, readiness evidence, expectations, diagnostics, and
  preflight mutations;
- fixtures for valid, invalid, review-required, and mutation cases under a
  candidate-specific root;
- deterministic diagnostics for undeclared source, source hash mismatch, missing
  source refs, ambiguous mapping, unsupported facts, guidance-only policy gaps,
  live material overclaim, review promotion, stale review metadata, stale
  upstream evidence, and report or evidence hash mismatch;
- generated artifacts for source inventory, authority map, fact coverage, policy
  mapping, review queue, readiness report, and final evidence;
- package scripts and CI gates following the existing `proof:*`, `check:*`,
  `check:*:ci`, `check:*:ci:phase`, and `check:*:untracked` conventions.

## Minimum Fixture Matrix
| Fixture class | Required coverage |
| --- | --- |
| Valid | Complete source-ref coverage for one component family, one token or theme slice, one accessibility or behavior fact, and one policy fact. |
| Invalid | Undeclared source path, source hash mismatch, missing source ref, unsupported fact, guidance used as policy without policy input, live or unsnapshotted material treated as authority. |
| Review | Ambiguous mapping, forked variant, brand exception, accessibility behavior conflict, owner, rationale, expiry, and source refs. |
| Mutation | Stale upstream evidence, schema/report/evidence hash mismatch, source-ref pointer drift, review-required output promoted as allowed. |

## Workflow Readiness Test
Testing must use the seven-step product designer workflow from
[Product Designer Workflow](product-designer-workflow.md):

1. Declare design authority through a manifest-declared, hash-bound bundle.
2. Compile governed contracts with source refs, diagnostics, reports, and
   evidence.
3. Generate or validate inside the catalog boundary with allowed, blocked, and
   `review_required` cases.
4. Inspect evidence, status, promotion status, diagnostics, and reports before
   demos.
5. Decide or revise at the authority layer: source, mapping, policy, review
   owner, or future proof scope.
6. Hand off only proven, hash-bound target output.
7. Regenerate proof and evidence when source, policy, review, or target material
   changes.

The readiness retest should use one integrated Button scenario with:

- one allowed path;
- one `review_required` exception with owner, rationale, expiry, and source refs;
- one blocked drift, unsupported fact, or authority conflict;
- one accessibility or behavior diagnostic;
- one inert protocol or native handoff reference, if target output is included;
- one regeneration expectation.

## Archetype Acceptance Criteria
Synthetic archetype retesting is a planning signal only. It does not prove
implementation behavior or customer validation.

- High: all four archetypes classify allowed, blocked, and `review_required`
  outcomes from evidence.
- High: no archetype treats demos, protocol or native packets, A2UI, APIs, SDKs,
  live review, CLI output, MCP output, templates, or swizzles as supported after
  correction.
- Medium: at least two archetypes converge on the same next proof boundary
  before facilitator framing.
- Medium: at least three archetypes show High or Medium evidence-loop
  comprehension.
- Low: wording issues are captured as docs or session-guide follow-up only.

## Claim Boundaries
During exploration, Surfaces may say it is assessing whether a design system can
be captured as a bounded, manifest-declared, hash-bound source bundle.

During testing, Surfaces may say it is running proof-shaped evidence walkthroughs
against candidate source material. Partner or archetype feedback remains research
signal, not proof.

After proof passes, the first safe claim is:

```text
Surfaces has proof-backed deterministic support for a bounded, manifest-declared
local source-bundle slice of <design system>/<version>/<components>, with
preserved source refs, deterministic blocked/review_required diagnostics,
non-executable review rows, and reproducible CI evidence.
```

Do not claim broad Spectrum support, Astryx support, live ingestion, production
adapters, APIs, SDKs, A2UI, live SurfaceOps, live JudgmentKit, live MCP/CLI
authority, template authority, swizzle authority, or production adoption until
the relevant target-specific evidence exists and passes.

## Open Decisions
- Whether to implement readiness as a new non-numbered
  `design-system-readiness` target or as a scoped source-conformance extension.
- Whether the next proof candidate should expand Spectrum component coverage
  first or prove an Astryx source-family eligibility slice first.
- Whether Astryx should be modeled initially as source-family eligibility,
  React/web conformance, or both.
- How to encode typed source anchors for TypeScript, JSX, MDX, CLI output, MCP
  output, templates, themes, and swizzle or eject artifacts.
- Which minimal component family, token or theme slice, accessibility behavior,
  and policy fact should anchor the first Astryx candidate fixture.
