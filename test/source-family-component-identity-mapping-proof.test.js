import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { rawFileHash, readJson } from "../src/p2-contract.js";
import { SFNM_ARTIFACT_ROOT, SFNM_SOURCE_ROOT } from "../src/source-family-namespace-mapping-contract.js";
import {
  SFCIM_ARTIFACT_PATHS,
  SFCIM_ARTIFACT_ROOT,
  SFCIM_AUTHORITY_DECLARATION_PATH,
  SFCIM_AUTHORITY_MANIFEST_PATH,
  SFCIM_CAPTURED_ARTIFACTS,
  SFCIM_EXPECTATION_ROWS,
  SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS,
  SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT,
  SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT,
  SFCIM_EXPECTED_MANIFEST_REFRESH_POINTERS,
  SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT,
  SFCIM_FIXTURE_ROOT,
  SFCIM_IDENTITY_PACKAGE_PATH,
  SFCIM_MAPPING_PATH,
  SFCIM_NAMESPACE_NORMALIZER_PATHS,
  SFCIM_PROOF_IMPLEMENTATION_PATHS,
  SFCIM_SCHEMA_FILES,
  SFCIM_SOURCE_ENTRIES,
  SFCIM_SOURCE_ROOT,
  assertAuthorityClosure,
  assertIdentityMapping,
  assertIdentityPackage,
  componentIdentityArgumentVector,
  defaultComponentIdentityMappingArgs,
  identityMappedArtifactMappings,
  normalizeComponentIdentityBundle,
  sfcimFixturePaths,
  verifyImmutableComponentIdentityInputs
} from "../src/source-family-component-identity-mapping-contract.js";
import {
  evaluateAuthorityDeclaration,
  parseSourceFamilyComponentIdentityMappingArgs,
  runAuthorityDecisionGate,
  runSourceFamilyComponentIdentityMappingInterfacectl,
  runSourceFamilyComponentIdentityMappingProof,
  sourceFamilyComponentIdentityMappingInternals
} from "../src/source-family-component-identity-mapping-proof.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);

test("immutable identity inputs prove one alias across exact 12/22/5/4 closures", async () => {
  const { authorityManifest, authorityDeclaration, mapping, identityPackage, normalization } = await verifyImmutableComponentIdentityInputs(root);
  assert.equal(authorityManifest.declarationRefs.length, 1);
  assert.equal(authorityManifest.acceptedDeclarationId, "team-button-to-button");
  assert.equal(authorityDeclaration.declarationId, "team-button-to-button");
  assert.equal(authorityDeclaration.relationKind, "component-identity");
  assert.equal(authorityDeclaration.scope, "component-identity-only");
  assert.equal(authorityDeclaration.fromComponentId, "TeamButton");
  assert.equal(authorityDeclaration.toComponentId, "Button");
  assert.equal(authorityDeclaration.executable, false);
  assert.equal(authorityDeclaration.canAddAuthority, false);
  assert.equal(authorityManifest.provenance.role, "review-controlled-component-identity-authority-manifest");
  assert.equal(authorityDeclaration.provenance.role, "review-controlled-component-identity-authority");
  assert.equal(mapping.expectedIdentitySubstitutionCount, 22);
  assert.equal(mapping.expectedManifestHashRefreshCount, 5);
  assert.equal(mapping.expectedNarrativeMentionCount, 4);
  assert.equal(mapping.familySpecificModule, null);
  assert.equal(normalization.entries.length, 12);
  assert.equal(normalization.totalIdentitySubstitutionCount, SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT);
  assert.equal(normalization.totalManifestHashRefreshCount, SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT);
  assert.equal(normalization.totalNarrativeMentionCount, SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT);
  assert.deepEqual([...new Set(mapping.substitutions.map((row) => row.physicalPath))].sort(), SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS);
  assert.deepEqual(normalization.entries.flatMap((entry) => entry.manifestHashRefreshes.map((row) => row.pointer)), SFCIM_EXPECTED_MANIFEST_REFRESH_POINTERS);
  assert.equal(mapping.substitutions.filter((row) => row.from === "TeamButton").length, 6);
  assert.equal(mapping.substitutions.filter((row) => row.from.startsWith("/components/TeamButton")).length, 15);
  assert.equal(mapping.substitutions.filter((row) => row.from === "catalog://p2/components/TeamButton").length, 1);
  assert.equal(identityPackage.compiler.runtime.major, 22);
  assert.equal(identityPackage.compiler.unchanged, true);
  assert.equal(identityPackage.namespaceNormalizer.exportedFunction, "normalizeNamespacedBundle");
  assert.equal(identityPackage.namespaceNormalizer.unchanged, true);
  assert.equal(identityPackage.provenance.role, "immutable-component-identity-proof-input");
});

test("all 12 identity outputs are byte-exact accepted namespace inputs", async () => {
  const normalization = await normalizeComponentIdentityBundle(root);
  for (const entry of normalization.entries) {
    const output = normalization.documentsByLogicalPath.get(entry.logicalPath).text;
    const accepted = await fs.readFile(path.join(root, SFNM_SOURCE_ROOT, entry.physicalPath), "utf8");
    assert.equal(output, accepted, entry.physicalPath);
    assert.equal(entry.normalizedSha256, await rawFileHash(path.join(root, SFNM_SOURCE_ROOT, entry.physicalPath)), entry.physicalPath);
  }
});

test("authority declaration binds ordered source refs, review, expiry, provenance, and accepted P2 Button", async () => {
  const declaration = await readJson(path.join(root, SFCIM_AUTHORITY_DECLARATION_PATH));
  const manifest = await readJson(path.join(root, SFCIM_AUTHORITY_MANIFEST_PATH));
  assert.equal(declaration.coveredSourceRefs.length, 5);
  assert.deepEqual(declaration.sourceRefClosure, declaration.coveredSourceRefs.map((ref) => ref.sourceRef));
  assert.equal(declaration.validity.expiresAt, null);
  assert.equal(manifest.validity.expiresAt, null);
  assert.equal(declaration.review.status, "accepted");
  assert.equal(declaration.review.executable, false);
  assert.equal(declaration.acceptedTarget.componentId, "Button");
  assert.equal(declaration.acceptedTarget.catalogRef, "catalog://p2/components/Button");
  assert.match(declaration.acceptedTarget.componentRecordHash.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(manifest.provenance.sourceRefs, [manifest.sourceRef, declaration.sourceRef, manifest.sourceBundleManifestRef.sourceRef]);

  const declarationExpansion = structuredClone(declaration);
  declarationExpansion.requestedComponentIds = ["OtherComponent"];
  await assert.rejects(() => assertAuthorityClosure(root, manifest, declarationExpansion), /SOURCE_IDENTITY_BOUNDARY_EXPANSION/);
  const nestedDeclarationExpansion = structuredClone(declaration);
  nestedDeclarationExpansion.acceptedTarget.capabilities = ["OtherComponent"];
  await assert.rejects(() => assertAuthorityClosure(root, manifest, nestedDeclarationExpansion), /SOURCE_IDENTITY_BOUNDARY_EXPANSION/);
  const manifestExpansion = structuredClone(manifest);
  manifestExpansion.actions = ["execute"];
  await assert.rejects(() => assertAuthorityClosure(root, manifestExpansion, declaration), /SOURCE_IDENTITY_BOUNDARY_EXPANSION/);
  const nestedManifestExpansion = structuredClone(manifest);
  nestedManifestExpansion.review.capabilities = ["OtherComponent"];
  await assert.rejects(() => assertAuthorityClosure(root, nestedManifestExpansion, declaration), /SOURCE_IDENTITY_BOUNDARY_EXPANSION/);
});

test("shared authority gate invokes only the authorized callback", async () => {
  const immutable = await verifyImmutableComponentIdentityInputs(root);
  let acceptedCount = 0;
  let reviewCount = 0;
  const accepted = await runAuthorityDecisionGate(immutable.authorityDeclaration, {
    onAccepted: async () => { acceptedCount += 1; return "normalized"; },
    onReview: async () => { reviewCount += 1; return "reviewed"; }
  });
  assert.equal(accepted.value, "normalized");
  assert.equal(acceptedCount, 1);
  assert.equal(reviewCount, 0);

  const declaration = structuredClone(immutable.authorityDeclaration);
  declaration.status = "review_required";
  declaration.normalizationAllowed = false;
  declaration.review.status = "review_required";
  assert.deepEqual(evaluateAuthorityDeclaration(declaration), { status: "review_required", normalizationAllowed: false, promotionStatus: "review_required" });
  const review = await runAuthorityDecisionGate(declaration, {
    onAccepted: async () => { acceptedCount += 1; return "normalized"; },
    onReview: async () => { reviewCount += 1; return "reviewed"; }
  });
  assert.equal(review.value, "reviewed");
  assert.equal(acceptedCount, 1);
  assert.equal(reviewCount, 1);
});

test("mapping mutations use distinct production diagnostics", async () => {
  const { authorityManifest, authorityDeclaration, mapping } = await verifyImmutableComponentIdentityInputs(root);
  const cases = [
    ["SOURCE_IDENTITY_MAPPING_INCOMPLETE", (value) => { value.substitutions.pop(); }],
    ["SOURCE_IDENTITY_MAPPING_REVERSED", (value) => { [value.fromComponentId, value.toComponentId] = [value.toComponentId, value.fromComponentId]; }],
    ["SOURCE_IDENTITY_WRONG_VALUE", (value) => { value.substitutions[0].from += "Wrong"; }],
    ["SOURCE_IDENTITY_EXTRA_POINTER", (value) => { value.substitutions.push({ ...structuredClone(value.substitutions[0]), pointer: "/notes" }); }],
    ["SOURCE_IDENTITY_NARRATIVE_MUTATION", (value) => { value.narrativeMentions[0].value += " changed"; }],
    ["SOURCE_IDENTITY_SIXTH_FILE_EXPANSION", (value) => { value.substitutions[0].physicalPath = "ui/inline-notice.json"; }],
    ["SOURCE_IDENTITY_BOUNDARY_EXPANSION", (value) => { value.actions = ["execute"]; }]
  ];
  for (const [code, mutate] of cases) {
    const candidate = structuredClone(mapping);
    mutate(candidate);
    await assert.rejects(() => assertIdentityMapping(root, candidate, authorityManifest, authorityDeclaration), new RegExp(code));
  }
});

test("immutable-package mutations use mapping, source, namespace, and implementation diagnostics", async () => {
  const immutable = await verifyImmutableComponentIdentityInputs(root);
  const cases = [
    ["SOURCE_IDENTITY_MAPPING_HASH_MISMATCH", (value) => { value.mappingRef.hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_SOURCE_HASH_MISMATCH", (value) => { value.sourceRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_NAMESPACE_DESCRIPTOR_HASH_MISMATCH", (value) => { value.namespaceMappingRef.hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_NAMESPACE_PACKAGE_HASH_MISMATCH", (value) => { value.namespacePackageRef.hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_NAMESPACE_NORMALIZER_HASH_MISMATCH", (value) => { value.namespaceNormalizerRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_IMPLEMENTATION_HASH_MISMATCH", (value) => { value.proofImplementationRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_IDENTITY_BOUNDARY_EXPANSION", (value) => { value.actions = ["execute"]; }],
    ["SOURCE_IDENTITY_BOUNDARY_EXPANSION", (value) => { value.compiler.capabilities = ["OtherComponent"]; }]
  ];
  for (const [code, mutate] of cases) {
    const candidate = structuredClone(immutable.identityPackage);
    mutate(candidate);
    await assert.rejects(
      () => assertIdentityPackage(root, candidate, immutable.authorityManifest, immutable.authorityDeclaration, immutable.mapping, immutable.normalization),
      new RegExp(code)
    );
  }
});

test("shared stage-chain validator rejects skipped, reversed, bypassed, and tampered stages", async () => {
  const { normalization } = await verifyImmutableComponentIdentityInputs(root);
  const rows = normalization.entries.map((entry) => ({ physicalPath: `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`, logicalPath: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`, hash: entry.normalizedSha256 }));
  const valid = {
    orderedStages: ["component-identity", "namespace-normalization", "source-conformance-compile"],
    namespaceInputRoot: SFNM_SOURCE_ROOT,
    namespaceInputMaterializedByIdentityStage: true,
    acceptedNamespaceBaselineCopiedAsInput: false,
    identityOutputHashes: rows,
    namespaceInputHashes: structuredClone(rows),
    hashCausalityVerified: true,
    namespaceNormalizerReused: true,
    compilerReused: true
  };
  assert.doesNotThrow(() => sourceFamilyComponentIdentityMappingInternals.assertStageChainDocument(valid, rows));
  const cases = [
    ["SOURCE_IDENTITY_STAGE_SKIPPED", (value) => value.orderedStages.shift()],
    ["SOURCE_IDENTITY_NAMESPACE_STAGE_SKIPPED", (value) => value.orderedStages.splice(1, 1)],
    ["SOURCE_IDENTITY_STAGE_REVERSED", (value) => value.orderedStages.reverse()],
    ["SOURCE_IDENTITY_BASELINE_MISMATCH", (value) => { value.acceptedNamespaceBaselineCopiedAsInput = true; value.namespaceInputMaterializedByIdentityStage = false; }],
    ["SOURCE_IDENTITY_INTERMEDIATE_TAMPER", (value) => { value.namespaceInputHashes[0].hash = "0".repeat(64); }]
  ];
  for (const [code, mutate] of cases) {
    const candidate = structuredClone(valid);
    mutate(candidate);
    assert.throws(() => sourceFamilyComponentIdentityMappingInternals.assertStageChainDocument(candidate, rows), new RegExp(code));
  }
});

test("fixture registry explicitly covers every causal mutation family", async () => {
  const paths = SFCIM_EXPECTATION_ROWS.map((row) => row.fixturePath);
  for (const required of [
    "mutations/identity-stage-skipped.source-family-component-identity-mapping-preflight.json",
    "mutations/authority-boundary-expansion.source-family-component-identity-mapping-preflight.json",
    "mutations/nested-authority-boundary-expansion.source-family-component-identity-mapping-preflight.json",
    "mutations/package-boundary-expansion.source-family-component-identity-mapping-preflight.json",
    "mutations/namespace-stage-skipped.source-family-component-identity-mapping-preflight.json",
    "mutations/stage-order-reversed.source-family-component-identity-mapping-preflight.json",
    "mutations/wrong-value.source-family-component-identity-mapping-preflight.json",
    "mutations/extra-pointer.source-family-component-identity-mapping-preflight.json",
    "mutations/narrative-field.source-family-component-identity-mapping-preflight.json",
    "mutations/sixth-file.source-family-component-identity-mapping-preflight.json",
    "mutations/namespace-descriptor-hash-mismatch.source-family-component-identity-mapping-preflight.json",
    "mutations/namespace-package-hash-mismatch.source-family-component-identity-mapping-preflight.json",
    "mutations/namespace-normalizer-hash-mismatch.source-family-component-identity-mapping-preflight.json"
  ]) assert.ok(paths.includes(required), required);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(paths.length, 35);
  assert.equal(sfcimFixturePaths().length, paths.length + 2);
  for (const row of SFCIM_EXPECTATION_ROWS) {
    const fixture = await readJson(path.join(root, SFCIM_FIXTURE_ROOT, row.fixturePath));
    assert.deepEqual(fixture.expectedDiagnosticCodes, row.diagnosticCodes, row.fixturePath);
    assert.equal(Object.hasOwn(fixture, "probe"), false, row.fixturePath);
    if (row.kind === "valid") {
      assert.equal(fixture.mutation, null, row.fixturePath);
    } else {
      assert.ok(fixture.mutation && typeof fixture.mutation === "object", row.fixturePath);
      assert.equal(typeof fixture.mutation.target, "string", row.fixturePath);
      assert.equal(typeof fixture.mutation.operation, "string", row.fixturePath);
      if (fixture.mutation.operation === "ordered-changes") {
        assert.ok(fixture.mutation.changes.length > 0, row.fixturePath);
        for (const change of fixture.mutation.changes) {
          assert.equal(typeof change.caseId, "string", row.fixturePath);
          assert.equal(typeof change.operation, "string", row.fixturePath);
          assert.equal(typeof change.path, "string", row.fixturePath);
        }
      } else {
        assert.equal(typeof fixture.mutation.path, "string", row.fixturePath);
        assert.deepEqual(fixture.mutation.changes, [], row.fixturePath);
      }
    }
  }
});

test("target schemas close receipt causality, exact artifact order, and ordered remap", async () => {
  assert.equal(SFCIM_SCHEMA_FILES.length, 11);
  assert.equal(SFCIM_CAPTURED_ARTIFACTS.length, 8);
  assert.equal(SFCIM_ARTIFACT_PATHS.length, 12);
  assert.deepEqual(SFCIM_CAPTURED_ARTIFACTS.map(([file]) => file), [
    "identity-mapped-source-inventory.json",
    "identity-mapped-source-fact-coverage.json",
    "identity-mapped-source-authority-map.json",
    "identity-mapped-source-review-queue.json",
    "identity-mapped-governed-catalog.json",
    "identity-mapped-authority-connection-report.json",
    "identity-mapped-source-conformance-report.json",
    "identity-mapped-source-conformance-evidence.json"
  ]);
  assert.deepEqual(SFCIM_ARTIFACT_PATHS, [
    `${SFCIM_ARTIFACT_ROOT}/component-identity-mapping-receipt.json`,
    `${SFCIM_ARTIFACT_ROOT}/namespace-mapping-receipt.json`,
    ...SFCIM_CAPTURED_ARTIFACTS.map(([file]) => `${SFCIM_ARTIFACT_ROOT}/${file}`),
    `${SFCIM_ARTIFACT_ROOT}/source-family-component-identity-mapping-report.json`,
    `${SFCIM_ARTIFACT_ROOT}/evidence.json`
  ]);
  const receiptSchema = await readJson(path.join(root, "schemas/source-family-component-identity-mapping-receipt.v0.schema.json"));
  const evidenceSchema = await readJson(path.join(root, "schemas/source-family-component-identity-mapping-evidence.v0.schema.json"));
  assert.equal(receiptSchema.additionalProperties, false);
  assert.equal(receiptSchema.properties.entryCount.const, 12);
  assert.deepEqual(receiptSchema.properties.stageChain.const.identityOutputHashes, receiptSchema.properties.stageChain.const.namespaceInputHashes);
  assert.equal(evidenceSchema.additionalProperties, false);
  assert.deepEqual(evidenceSchema.properties.artifacts.prefixItems.map((item) => item.properties.path.const), SFCIM_ARTIFACT_PATHS);
  assert.deepEqual(evidenceSchema.properties.identityMappedEvidenceRemap.properties.artifactMappings.const, identityMappedArtifactMappings());
  assert.equal(evidenceSchema.properties.identityMappedEvidenceClosureVerified.const, true);
});

test("fixed CLI parser and exported proof entrypoints are wired", () => {
  const parsed = parseSourceFamilyComponentIdentityMappingArgs(componentIdentityArgumentVector());
  assert.equal(parsed.ok, true);
  assert.deepEqual(Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== "ok")), defaultComponentIdentityMappingArgs());
  assert.equal(parseSourceFamilyComponentIdentityMappingArgs(componentIdentityArgumentVector().slice(0, -2)).ok, false);
  assert.equal(typeof runSourceFamilyComponentIdentityMappingInterfacectl, "function");
  assert.equal(typeof runSourceFamilyComponentIdentityMappingProof, "function");
  assert.deepEqual(SFCIM_NAMESPACE_NORMALIZER_PATHS, ["src/source-family-namespace-mapping-contract.js", "src/source-family-namespace-mapping-proof.js"]);
  assert.deepEqual(SFCIM_PROOF_IMPLEMENTATION_PATHS, ["scripts/materialize-source-family-component-identity-mapping.mjs", "src/source-family-component-identity-mapping-contract.js", "src/source-family-component-identity-mapping-proof.js"]);
});

test("persisted 12-artifact evidence rejects artifact, remap, and self-hash mutations", async () => {
  const evidencePath = path.join(root, SFCIM_ARTIFACT_ROOT, "evidence.json");
  const evidence = await readJson(evidencePath);
  assert.equal(await sourceFamilyComponentIdentityMappingInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  artifactTamper.artifacts.at(-1).hash = sourceFamilyComponentIdentityMappingInternals.computeEvidenceSelfHash(artifactTamper);
  assert.equal(await sourceFamilyComponentIdentityMappingInternals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH");

  const remapTamper = structuredClone(evidence);
  remapTamper.identityMappedEvidenceRemap.artifactMappings[0].persistedPath = `${SFCIM_ARTIFACT_ROOT}/substituted.json`;
  remapTamper.artifacts.at(-1).hash = sourceFamilyComponentIdentityMappingInternals.computeEvidenceSelfHash(remapTamper);
  assert.equal(await sourceFamilyComponentIdentityMappingInternals.firstEvidenceIntegrityFailureCode(root, remapTamper), "SOURCE_IDENTITY_INNER_EVIDENCE_INVALID");

  const selfTamper = structuredClone(evidence);
  selfTamper.runId = "0".repeat(64);
  assert.equal(await sourceFamilyComponentIdentityMappingInternals.firstEvidenceIntegrityFailureCode(root, selfTamper), "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH");
});

test("persisted compiler artifacts and causal namespace receipt remain exact accepted counterparts", async () => {
  const { normalization } = await verifyImmutableComponentIdentityInputs(root);
  await sourceFamilyComponentIdentityMappingInternals.verifyPersistedInnerClosure({ cwd: root, normalization });
  for (const [persistedFile, , innerFile] of SFCIM_CAPTURED_ARTIFACTS) {
    const accepted = innerFile === "evidence.json" ? "normalized-source-conformance-evidence.json" : `normalized-${innerFile}`;
    assert.deepEqual(
      await fs.readFile(path.join(root, SFCIM_ARTIFACT_ROOT, persistedFile)),
      await fs.readFile(path.join(root, SFNM_ARTIFACT_ROOT, accepted)),
      innerFile
    );
  }
  assert.equal(
    canonicalJson(await readJson(path.join(root, SFCIM_ARTIFACT_ROOT, "namespace-mapping-receipt.json"))),
    canonicalJson(await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "namespace-mapping-receipt.json")))
  );
});

test("shared compiler mapper preserves exact accepted and failure outcomes", () => {
  assert.deepEqual(sourceFamilyComponentIdentityMappingInternals.mapCompilerResult({ exitCode: 0, stdout: "", stderr: "" }), {
    status: "pass",
    diagnosticCode: null,
    detail: null
  });
  assert.deepEqual(sourceFamilyComponentIdentityMappingInternals.mapCompilerResult({ exitCode: 1, stdout: "", stderr: "compiler failed\n" }), {
    status: "fail",
    diagnosticCode: "SOURCE_IDENTITY_COMPILER_RUN_FAILED",
    detail: "compiler failed"
  });
});

test("all target JSON schemas compile under Draft 2020-12", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const file of SFCIM_SCHEMA_FILES) {
    const schema = await readJson(path.join(root, "schemas", file));
    assert.doesNotThrow(() => ajv.compile(schema), file);
  }
});
