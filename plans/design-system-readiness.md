# Design-System Readiness Plan

## Status
This is a planning-only document for deciding when Surfaces Platform can test or
support additional agent-friendly design-system slices beyond the current
bounded adapters. It is subordinate to [VISION.md](../VISION.md),
[PLAN.md](../PLAN.md), and passing proof evidence.

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
The numbered P2 baseline remains the bounded Adobe Spectrum Design Data slice,
pinned to `@adobe/spectrum-design-data@0.7.0` and scoped to `button` and
`in-line-alert`. The separate design-system compiler target now proves local
ingestion and inert consumer reuse for its bounded Spectrum Switch and Astryx
core Button adapters. Neither result is full design-system support.

The current source-conformance proof now implements a bounded readiness slice.
Checked Button and InLineAlert facts plus team-owned authority profiles compile
into fact coverage, policy and precedence mappings, owner-routed exceptions,
actionable connection reports, and governed catalogs that cannot expand
accepted P2 capability. The aggregate package proof runs the unchanged compiler
as two fresh passing executions over distinct checked instances of the fixed
source-family ABI, then re-verifies the persisted candidate closure and counts
the failing expansion probe separately. The target remains proof-only and does
not broaden P2 ingestion support or support arbitrary source-family layouts.

The source-accessibility-policy proof adds one adjacent readiness check for the
same Button and InLineAlert boundary. Five closed behavior declarations are
reconciled against existing catalog facts while policy requirement values stay
opaque and hash-bound. Missing facts remain owner-bound review work. This does
not make accessibility prose executable, expand Spectrum coverage, or prove
runtime accessibility compliance.

The source-family namespace-mapping proof removes one additional fixed
connection constraint for that same boundary. A checked fixed-layout copy uses
one alternate declared-source prefix at 78 exact JSON pointers; normalization
refreshes only 11 manifest hashes and must reproduce all 12 accepted logical
files byte-for-byte before the unchanged compiler runs. This proves one prefix
pair only. It does not establish arbitrary namespaces, another layout, broader
component coverage, live connection, or self-serve support.

The source-family component-identity-mapping proof removes one further exact
connection constraint without broadening design-system support. One explicit,
team-owned authority declaration binds the fixture-local `TeamButton` identity
to the current accepted P2 `Button` target with source refs, provenance, hashes,
and owner-bound review status. A derived 22-row Stage 1 mapping changes five
checked files and five manifest hashes while preserving four narrative `Button`
mentions, then feeds the existing namespace normalizer and unchanged compiler.
The declaration is authority; the normalizers are not. This proves one identity
relation only. It does not establish arbitrary identities, alias registries,
semantic inference, broader component coverage, live connection, or self-serve
support.

The Spectrum Checkbox catalog proof adds one bounded real-source component
outside P2. A separate immutable addendum lock binds the exact Checkbox byte to
the pinned package tarball, while accepted P2 evidence supplies the existing
catalog, component registry, and one desktop token record. The emitted catalog
preserves every P2 component and token record and adds only Checkbox plus that
token. The proof covers selection precedence, state normalization,
accessibility facts, source refs, ambiguous token mode, and owner-routed review.
It does not expand P2 or establish full Spectrum support.

The source-independent design-system compiler proof replaces the bespoke Switch
extension path. Separately locked Spectrum Switch and official Astryx core
Button adapters declare exact typed locators, normalized facts, complete mappings, and
governance as data. Both execute one shared ingestion kernel and one shared
inert portable consumer. Passing evidence requires matching implementation
hashes, no source-specific modules, an allowed render plan, an unknown-member
block, a non-promoted review request, and causal unmapped-authority,
invented-member-identifier, mapped-default, and boundary-receipt failures.

The compiler target proves those two bounded adapter slices only. It does not
expand P2 or Checkbox, make legacy P3-P5 consumers portable, establish broad
Spectrum or Astryx support, or prove production behavior.

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

The implemented Checkbox target remains a separate P2-adjacent proof. The
Spectrum Switch adapter is the first Spectrum input to the source-independent
compiler. Future components should use a separately reviewed immutable source
boundary and the shared adapter contract, kernel, and consumer. A new component
must add only declarative source, mapping, and fixture data unless a separately
reviewed contract change is required.

### Astryx Expansion
The implemented Astryx slice is the official `@astryxdesign/core@0.1.2` Button
documentation-and-StyleX adapter. It is a local, immutable selected-file
snapshot, not live CLI, MCP, template, docs, or swizzle authority. Future Astryx
source refs should remain explicit and version-bound, for example:

```text
astryx://git/facebook/astryx@<commit>/<path>#<typed-anchor>
astryx://npm/@astryxdesign/<package>@<version>/<path>#<typed-anchor>
```

If additional Astryx CLI, MCP, docs, templates, themes, or swizzle output is
considered, the snapshot must record the tool or command id, version, arguments
or request, response material, source refs, and hashes. Live tool output is not
authority. Passing Button evidence does not establish family-wide support.

## Implemented Slice And Remaining Proof Shape
The scoped source-conformance extension includes authority profiles, fact
coverage, policy maps, review queues, connection reports, diagnostics,
fixtures, aggregate package evidence, and CI shape for two checked local bundle
instances. The fixed layout, namespace, and component-identity targets add
three separate bounded connection proofs without broadening P2: one physical
layout, one prefix pair, and one explicitly declared `TeamButton` to accepted
P2 `Button` relation.

The design-system compiler now supplies the reusable source-family boundary for
new bounded adapters. A qualifying third adapter should require:

- one immutable selected-file source lock under
  `sources/design-system-compiler/<source-id>/`;
- one data-only adapter with exact typed locators, normalized facts, complete mappings,
  runtime-capability limits, and governance;
- allowed, blocked, and review-required consumer fixtures under
  `fixtures/design-system-compiler/<source-id>/`;
- one manifest row that drives the unchanged ingestion kernel and portable
  consumer; and
- passing aggregate evidence that keeps the shared implementation hashes equal
  and `sourceSpecificImplementationModules` empty.

The manifest also derives adapter/report/evidence cardinality and the complete
per-adapter artifact closure; the capability index names the aggregate output
root. A qualifying third adapter therefore does not require a schema or
capability-registry change.

A candidate that requires source-family code, a component branch, or a separate
consumer is not evidence of declining marginal cost. A contract extension may
be valid, but it must be reviewed as a platform-contract change rather than
hidden inside an adapter.

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

For the component-identity target specifically, the safe claim is narrower:

```text
Surfaces verifies one explicit team-owned declaration that the fixture-local
TeamButton source identity resolves to the already accepted P2 Button contract,
then applies that exact relation through a derived, non-authoritative mapping.
```

Do not shorten this to semantic equivalence, alias support, arbitrary component
identity support, or broader design-system readiness.

Do not claim broad Spectrum support, broad Astryx support, live ingestion, production
adapters, APIs, SDKs, A2UI, live SurfaceOps, live JudgmentKit, live MCP/CLI
authority, template authority, swizzle authority, or production adoption until
the relevant target-specific evidence exists and passes.

## Open Decisions
- How future component identities or terminology mappings should be proved
  beyond the one fixed `TeamButton` to accepted P2 `Button` relation; the current
  target does not define an alias registry or inference model.
- Which third source family best tests the current typed JSON Pointer and exact
  text-range anchor contract without adding implementation code.
- Which evidence should quantify adapter-only marginal cost as the compiler
  expands.
- Whether future TypeScript, JSX, MDX, CLI output, MCP output, templates,
  themes, or swizzle artifacts need new declarative anchor types.
- Which additional Astryx component, token, accessibility behavior, or policy
  fact is small enough to test adapter reuse without implying family-wide
  support.
