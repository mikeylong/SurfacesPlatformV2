import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson, runInterfacectl } from "../src/p0.js";
import { canonicalFileHash, rawFileHash, readJson, writeCanonicalJson } from "../src/p2-contract.js";
import { capabilityDeclarations } from "../src/capability-index-contract.js";
import { SC_SOURCE_ROOT } from "../src/source-conformance-contract.js";
import {
  SFLM_ARTIFACT_ROOT,
  SFLM_CAPTURED_ARTIFACTS,
  SFLM_IMMUTABLE_CATALOG_FIELDS,
  SFLM_PHYSICAL_SOURCE_ROOT
} from "../src/source-family-layout-mapping-contract.js";
import {
  SFNM_ALTERNATE_NAMESPACE,
  SFNM_ARTIFACT_PATHS,
  SFNM_ARTIFACT_ROOT,
  SFNM_CANONICAL_NAMESPACE,
  SFNM_CAPTURED_ARTIFACTS,
  SFNM_COMMAND,
  SFNM_COMPILER_IMPLEMENTATION_PATHS,
  SFNM_EXPECTATION_ROWS,
  SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT,
  SFNM_EXPECTED_SUBSTITUTION_COUNT,
  SFNM_FIXTURE_ROOT,
  SFNM_LAYOUT_EVIDENCE_PATH,
  SFNM_MAPPING_PATH,
  SFNM_NAMESPACE_PACKAGE_PATH,
  SFNM_P2_CATALOG_PATH,
  SFNM_P2_EVIDENCE_PATH,
  SFNM_PROOF_IMPLEMENTATION_PATHS,
  SFNM_RUNTIME_DEPENDENCY_PATHS,
  SFNM_SOURCE_ENTRIES,
  SFNM_SOURCE_ROOT,
  buildSourceFamilyNamespaceMappingFixtures,
  defaultNamespaceMappingArgs,
  diagnosticsRegistry,
  materializeSourceFamilyNamespaceMappingContract,
  normalizeNamespacedBundle,
  sfnmFixturePaths,
  sfnmNormalizedEvidenceRemap,
  sfnmSchemaPaths,
  sfnmSourcePaths,
  sourceFamilyNamespaceMappingInternals as contractInternals,
  verifyImmutableNamespaceInputs
} from "../src/source-family-namespace-mapping-contract.js";
import {
  runSourceFamilyNamespaceMappingInterfacectl,
  runSourceFamilyNamespaceMappingProof,
  sourceFamilyNamespaceMappingInternals
} from "../src/source-family-namespace-mapping-proof.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);

test("immutable namespace inputs prove exactly 78 substitutions and 11 manifest hash refreshes", async () => {
  const { mapping, namespacePackage, normalization } = await verifyImmutableNamespaceInputs(root);
  assert.equal(mapping.fromNamespace, SFNM_ALTERNATE_NAMESPACE);
  assert.equal(mapping.toNamespace, SFNM_CANONICAL_NAMESPACE);
  assert.equal(mapping.rewriteMode, "exact-prefix-json-string");
  assert.equal(mapping.preservePathAndFragment, true);
  assert.equal(mapping.manifestHashRefresh, true);
  assert.equal(mapping.familySpecificModule, null);
  assert.equal(normalization.entries.length, 12);
  assert.equal(normalization.totalSubstitutionCount, SFNM_EXPECTED_SUBSTITUTION_COUNT);
  assert.equal(normalization.totalManifestHashRefreshCount, SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT);
  assert.equal(namespacePackage.expectedSubstitutionCount, SFNM_EXPECTED_SUBSTITUTION_COUNT);
  assert.equal(namespacePackage.expectedManifestHashRefreshCount, SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT);
  assert.equal(namespacePackage.totalSubstitutionCount, SFNM_EXPECTED_SUBSTITUTION_COUNT);
  assert.equal(namespacePackage.totalManifestHashRefreshCount, SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT);
  assert.deepEqual(mapping.entries, SFNM_SOURCE_ENTRIES.map(({ physicalPath, logicalPath }) => ({ physicalPath, logicalPath })));

  const substitutions = normalization.entries.flatMap((entry) => entry.substitutions);
  const refreshes = normalization.entries.flatMap((entry) => entry.manifestHashRefreshes);
  assert.equal(substitutions.length, 78);
  assert.equal(refreshes.length, 11);
  assert.equal(new Set(normalization.entries.flatMap((entry) => entry.substitutions.map((row) => `${entry.physicalPath}\0${row.pointer}`))).size, 78);
  assert.equal(substitutions.every((row) =>
    row.from.startsWith(SFNM_ALTERNATE_NAMESPACE) &&
    row.to.startsWith(SFNM_CANONICAL_NAMESPACE) &&
    row.from.slice(SFNM_ALTERNATE_NAMESPACE.length) === row.to.slice(SFNM_CANONICAL_NAMESPACE.length)
  ), true);
  for (const unsafe of [
    `${SFNM_ALTERNATE_NAMESPACE}components/../button.json#/`,
    `${SFNM_ALTERNATE_NAMESPACE}components\\button.json#/`,
    `${SFNM_ALTERNATE_NAMESPACE}components/button.json?raw=1#/`,
    `${SFNM_ALTERNATE_NAMESPACE}components%2Fbutton.json#/`,
    `${SFNM_ALTERNATE_NAMESPACE}components/button.json#/facts/~2invalid`,
    `${SFNM_ALTERNATE_NAMESPACE}components/button.json#/facts/~`
  ]) {
    assert.equal(contractInternals.isSafeNamespaceReference(unsafe, SFNM_ALTERNATE_NAMESPACE), false, unsafe);
  }
  assert.deepEqual(refreshes.map((row) => row.pointer), Array.from({ length: 11 }, (_, index) => `/sourceFiles/${index}/sha256`));

  const inputManifest = await readJson(path.join(root, SFNM_SOURCE_ROOT, "bundle-index.json"));
  for (const sourceFile of inputManifest.sourceFiles) {
    const entry = normalization.entries.find((candidate) => candidate.logicalPath === sourceFile.path);
    assert.ok(entry, sourceFile.path);
    assert.equal(sourceFile.sha256, entry.inputSha256, sourceFile.path);
  }

  for (const entry of normalization.entries) {
    const baseline = await readJson(path.join(root, SFLM_PHYSICAL_SOURCE_ROOT, entry.physicalPath));
    assert.equal(canonicalJson(normalization.documentsByLogicalPath.get(entry.logicalPath).document), canonicalJson(baseline), entry.logicalPath);
    assert.equal(entry.normalizedSha256, await rawFileHash(path.join(root, SFLM_PHYSICAL_SOURCE_ROOT, entry.physicalPath)));
    assert.equal(entry.inputSha256, await rawFileHash(path.join(root, SFNM_SOURCE_ROOT, entry.physicalPath)));
  }
});

test("namespace materialization preserves every immutable mapping and source byte", async () => {
  const paths = [SFNM_NAMESPACE_PACKAGE_PATH, ...sfnmSourcePaths()];
  const before = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry))));
  await materializeSourceFamilyNamespaceMappingContract(root);
  const after = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry))));
  assert.deepEqual(after, before);
});

test("the fixed Node 22 compiler and runtime closure are enforced", async () => {
  const namespacePackage = await readJson(path.join(root, SFNM_NAMESPACE_PACKAGE_PATH));
  const actualNodeMajor = Number(process.versions.node.split(".")[0]);
  assert.doesNotThrow(() => sourceFamilyNamespaceMappingInternals.assertCompilerRuntime(namespacePackage, actualNodeMajor));
  assert.throws(
    () => sourceFamilyNamespaceMappingInternals.assertCompilerRuntime(namespacePackage, actualNodeMajor === 22 ? 20 : 22),
    /SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH/
  );
  assert.deepEqual(namespacePackage.compiler.implementationRefs.map((entry) => entry.path), SFNM_COMPILER_IMPLEMENTATION_PATHS);
  assert.deepEqual(namespacePackage.compiler.runtime.dependencyRefs.map((entry) => entry.path), SFNM_RUNTIME_DEPENDENCY_PATHS);
  for (const ref of [...namespacePackage.compiler.implementationRefs, ...namespacePackage.compiler.runtime.dependencyRefs]) {
    assert.equal(ref.hash, await rawFileHash(path.join(root, ref.path)), ref.path);
  }
});

test("generated fixtures are exact-locked and every mutation stays inside the fixed boundary", async () => {
  const namespacePackage = await readJson(path.join(root, SFNM_NAMESPACE_PACKAGE_PATH));
  const generated = buildSourceFamilyNamespaceMappingFixtures(namespacePackage);
  const expectationsPath = `${SFNM_FIXTURE_ROOT}/expectations.manifest.json`;
  const expectations = await readJson(path.join(root, expectationsPath));
  assert.doesNotThrow(() => sourceFamilyNamespaceMappingInternals.assertExactFixtureDocument(expectationsPath, expectations, generated));
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(root, expectation.fixturePath));
    assert.doesNotThrow(() => sourceFamilyNamespaceMappingInternals.assertExactFixtureDocument(expectation.fixturePath, fixture, generated));
    assert.doesNotThrow(() => sourceFamilyNamespaceMappingInternals.assertFixtureMutationSafety(fixture));
  }
  const fixturePath = `${SFNM_FIXTURE_ROOT}/invalid/baseline-drift.source-family-namespace-mapping.json`;
  const drifted = await readJson(path.join(root, fixturePath));
  drifted.mutation.value = "schema-valid-drift";
  assert.throws(
    () => sourceFamilyNamespaceMappingInternals.assertExactFixtureDocument(fixturePath, drifted, generated),
    /SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH/
  );
  for (const mutation of [
    { target: "physical-source", operation: "replace-byte", path: "../outside.json", secondaryPath: null, value: "00" },
    { target: "physical-source-json", operation: "replace-value", path: "ui/button-definition.json#/~2bad", secondaryPath: null, value: null },
    { target: "normalization-result", operation: "replace-value", path: "../button.json#/sourceRef", secondaryPath: null, value: null },
    { target: "compiler-ref", operation: "replace-hash", path: "scripts/unchecked.mjs", secondaryPath: null, value: "0".repeat(64) },
    { target: "probe-workspace", operation: "remove-file", path: "components/card.json", secondaryPath: null, value: null },
    { target: "captured-inner-evidence", operation: "replace-hash", path: "nested/normalized-source-inventory.json", secondaryPath: null, value: "0".repeat(64) },
    { target: "mapping-descriptor", operation: "add-field", path: "/__proto__/polluted", secondaryPath: null, value: true },
    { target: "final-evidence", operation: "replace-hash", path: "/constructor/prototype/polluted", secondaryPath: null, value: true }
  ]) {
    assert.throws(
      () => sourceFamilyNamespaceMappingInternals.assertFixtureMutationSafety({ mutation }),
      /SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH/
    );
  }
  assert.throws(() => sourceFamilyNamespaceMappingInternals.setJsonPointer({}, "/__proto__/polluted", true), /SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH/);
  assert.equal({}.polluted, undefined);
});

test("causal mapping and source-byte mutations use production diagnostics", async () => {
  const mapping = await readJson(path.join(root, SFNM_MAPPING_PATH));
  const cases = [
    ["SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", (value) => { value.mappingId = `${value.mappingId}-drift`; }],
    ["SOURCE_NAMESPACE_UNSUPPORTED", (value) => { value.fromNamespace = "declared-source://unreviewed-authority/"; }],
    ["SOURCE_NAMESPACE_COLLISION", (value) => { value.fromNamespace = value.toNamespace; }],
    ["SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN", (value) => { value.regex = "declared-source://(.+)"; }]
  ];
  for (const [code, mutate] of cases) {
    const candidate = structuredClone(mapping);
    mutate(candidate);
    assert.throws(() => contractInternals.assertNamespaceMapping(candidate), new RegExp(code));
  }
  await withTemporaryDirectory(async (temporaryRoot) => {
    const invalidPath = path.join(temporaryRoot, "invalid.json");
    await fs.writeFile(invalidPath, "{}00");
    await assert.rejects(
      () => contractInternals.readCanonicalInput(invalidPath, "invalid.json"),
      /SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH/
    );
  });
});

test("outer receipt and evidence close exactly 11 deterministic artifacts", async () => {
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json"));
  const receipt = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "namespace-mapping-receipt.json"));
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.normalizedEvidenceClosureVerified, true);
  assert.deepEqual(evidence.schemaClosure.map((entry) => entry.path), sfnmSchemaPaths());
  assert.deepEqual(evidence.fixtureRefs.map((entry) => entry.path), sfnmFixturePaths());
  assert.deepEqual(evidence.sourceFileRefs.map((entry) => entry.path), sfnmSourcePaths().slice(1));
  assert.deepEqual(evidence.compilerRefs.map((entry) => entry.path), SFNM_COMPILER_IMPLEMENTATION_PATHS);
  assert.deepEqual(evidence.proofImplementationRefs.map((entry) => entry.path), SFNM_PROOF_IMPLEMENTATION_PATHS);
  assert.deepEqual(evidence.runtimeRefs.map((entry) => entry.path), SFNM_RUNTIME_DEPENDENCY_PATHS);
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), SFNM_ARTIFACT_PATHS);
  assert.equal(SFNM_ARTIFACT_PATHS.length, 11);
  assert.deepEqual(evidence.normalizedEvidenceRemap, sfnmNormalizedEvidenceRemap(evidence.mappingRef));
  assert.deepEqual(report.normalizedEvidenceRemap, evidence.normalizedEvidenceRemap);
  assert.deepEqual(report.compilerExecutions, { acceptedBundlePasses: 1, causalProbeFailures: 2, total: 3 });
  assert.equal(receipt.entryCount, 12);
  assert.equal(receipt.totalSubstitutionCount, 78);
  assert.equal(receipt.totalManifestHashRefreshCount, 11);
  assert.equal(receipt.normalizedBaselineMatched, true);
  assert.equal(receipt.onlyNamespaceAndManifestHashesChanged, true);
});

test("report and evidence schemas lock reference paths in exact order", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const evidenceSchema = await readJson(path.join(root, "schemas/source-family-namespace-mapping-evidence.v0.schema.json"));
  const reportSchema = await readJson(path.join(root, "schemas/source-family-namespace-mapping-report.v0.schema.json"));
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json"));
  const validateEvidence = ajv.compile(evidenceSchema);
  const validateReport = ajv.compile(reportSchema);
  assert.equal(validateEvidence(evidence), true, JSON.stringify(validateEvidence.errors));
  assert.equal(validateReport(report), true, JSON.stringify(validateReport.errors));
  for (const key of ["schemaClosure", "sourceFileRefs", "compilerRefs", "proofImplementationRefs", "runtimeRefs", "fixtureRefs", "boundaryRefs", "artifacts"]) {
    const candidate = structuredClone(evidence);
    candidate[key][0].path = "substituted/valid-path.json";
    assert.equal(validateEvidence(candidate), false, key);
  }
  for (const key of ["compilerRefs", "proofImplementationRefs", "runtimeRefs"]) {
    const candidate = structuredClone(report);
    candidate[key][0].path = "substituted/valid-path.json";
    assert.equal(validateReport(candidate), false, key);
  }
});

test("all eight normalized artifacts equal accepted layout outputs and re-verify after cleanup", async () => {
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  assert.equal(SFNM_CAPTURED_ARTIFACTS.length, 8);
  for (const [normalizedFile, , innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    const baseline = SFLM_CAPTURED_ARTIFACTS.find(([, , baselineInner]) => baselineInner === innerFile);
    assert.ok(baseline, innerFile);
    assert.equal(
      canonicalJson(await readJson(path.join(root, SFNM_ARTIFACT_ROOT, normalizedFile))),
      canonicalJson(await readJson(path.join(root, SFLM_ARTIFACT_ROOT, baseline[0]))),
      innerFile
    );
  }
  assert.equal(await sourceFamilyNamespaceMappingInternals.firstPersistedNormalizedEvidenceIntegrityFailureCode(root, evidence.normalizedEvidenceRemap), null);
  const tampered = structuredClone(evidence.normalizedEvidenceRemap);
  tampered.artifactMappings[0].persistedPath = tampered.artifactMappings[1].persistedPath;
  assert.equal(
    await sourceFamilyNamespaceMappingInternals.firstPersistedNormalizedEvidenceIntegrityFailureCode(root, tampered),
    "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID"
  );
});

test("normalized output preserves facts, catalog authority, owner, and non-executable review", async () => {
  const report = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json"));
  const queue = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "normalized-source-review-queue.json"));
  const catalog = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "normalized-governed-catalog.json"));
  assert.equal(report.baselineComparison.artifactClosureMatched, true);
  assert.equal(report.baselineComparison.factTuplesMatched, true);
  assert.equal(report.baselineComparison.immutableFieldsMatched, true);
  assert.equal(report.baselineComparison.sourceRefsCanonicalized, true);
  assert.equal(report.baselineComparison.reviewSemanticsMatched, true);
  assert.deepEqual(Object.keys(catalog.components).sort(), ["Button", "InLineAlert"]);
  assert.deepEqual(SFLM_IMMUTABLE_CATALOG_FIELDS, [
    "catalogId", "artifactKind", "schemaId", "version", "tokens", "components", "runtimeCapabilities", "diagnostics", "compatibility"
  ]);
  assert.equal(queue.promotionStatus, "review_required");
  assert.equal(queue.queueItems.every((item) => item.executable === false), true);
  assert.ok(queue.queueItems.find((item) => item.owner === "product-design-system-owners"));
});

test("all causal fixture outcomes match the closed registry without registering the inner diagnostic", async () => {
  const expectations = await readJson(path.join(root, SFNM_FIXTURE_ROOT, "expectations.manifest.json"));
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json"));
  assert.deepEqual(expectations.expectations, SFNM_EXPECTATION_ROWS);
  assert.equal(expectations.expectations.length, 23);
  assert.deepEqual(report.results, evidence.validationResults);
  assert.equal(report.results.every((entry) => entry.matched), true);
  for (let index = 0; index < report.results.length; index += 1) {
    assert.equal(report.results[index].actualResult, SFNM_EXPECTATION_ROWS[index].expectedResult);
    assert.equal(report.results[index].promotionStatus, SFNM_EXPECTATION_ROWS[index].promotionStatus);
    assert.deepEqual(report.results[index].diagnosticCodes, SFNM_EXPECTATION_ROWS[index].diagnosticCodes);
  }
  const expectedCodes = diagnosticsRegistry().map((entry) => entry.code).sort();
  assert.deepEqual([...new Set(report.results.flatMap((entry) => entry.diagnosticCodes))].sort(), expectedCodes);
  assert.equal(report.diagnosticsRegistry.some((entry) => entry.code === "SOURCE_FACT_AUTHORITY_ESCALATION"), false);
  assert.equal(report.results.some((entry) => entry.diagnosticCodes.includes("SOURCE_FACT_AUTHORITY_ESCALATION")), false);
});

test("the isolated authority probe reaches the unchanged inner compiler", async () => {
  const report = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json"));
  assert.deepEqual(report.authorityExpansionProbe, {
    baselineVerified: true,
    mutationIsolated: true,
    innerDiagnosticCode: "SOURCE_FACT_AUTHORITY_ESCALATION",
    compilerExitCode: 1,
    checkedInputsUnchanged: true,
    baselineArtifactsUnchanged: true
  });
  const exactCoverage = {
    promotionStatus: "blocked",
    findings: [
      { status: "review_required", diagnosticCode: "SOURCE_FORKED_VARIANT_REVIEW_REQUIRED" },
      { status: "blocked", diagnosticCode: "SOURCE_FACT_AUTHORITY_ESCALATION" }
    ]
  };
  assert.equal(sourceFamilyNamespaceMappingInternals.exactAuthorityExpansionFinding(exactCoverage)?.diagnosticCode, "SOURCE_FACT_AUTHORITY_ESCALATION");
  const duplicate = structuredClone(exactCoverage);
  duplicate.findings.push({ status: "blocked", diagnosticCode: "SOURCE_FACT_AUTHORITY_ESCALATION" });
  assert.equal(sourceFamilyNamespaceMappingInternals.exactAuthorityExpansionFinding(duplicate), null);
  const unrelated = structuredClone(exactCoverage);
  unrelated.findings[1].diagnosticCode = "SOURCE_GOVERNED_CATALOG_DRIFT";
  assert.equal(sourceFamilyNamespaceMappingInternals.exactAuthorityExpansionFinding(unrelated), null);
  const innerEvidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "normalized-source-conformance-evidence.json"));
  const diagnosticCodes = innerEvidence.diagnostics.map((entry) => entry.code);
  const expectedFailure = `source conformance run expectation mismatch: expected pass/review_required got fail/blocked; diagnostics ${diagnosticCodes.join(",")}`;
  assert.equal(sourceFamilyNamespaceMappingInternals.hasExactAuthorityExpansionFailure({ exitCode: 1, stderr: expectedFailure, stdout: "" }, diagnosticCodes), true);
  assert.equal(sourceFamilyNamespaceMappingInternals.hasExactAuthorityExpansionFailure({ exitCode: 1, stderr: expectedFailure, stdout: "unrelated later failure" }, diagnosticCodes), false);
  assert.equal(sourceFamilyNamespaceMappingInternals.hasExactAuthorityExpansionFailure({ exitCode: 1, stderr: "unrelated failure", stdout: "" }, diagnosticCodes), false);
  assert.equal(sourceFamilyNamespaceMappingInternals.hasExactAuthorityExpansionFailure({ exitCode: 2, stderr: expectedFailure, stdout: "" }, diagnosticCodes), false);
});

test("capability and package wiring expose only the fixed namespace target", async () => {
  const declaration = capabilityDeclarations().find((entry) => entry.capabilityId === "source-family-namespace-mapping");
  assert.ok(declaration);
  assert.equal(declaration.canAddAuthority, false);
  assert.equal(declaration.proofMode, "report-only");
  assert.equal(declaration.proofCommand, SFNM_COMMAND);
  assert.equal(declaration.packageProofScript, "proof:source-family-namespace-mapping");
  assert.equal(declaration.ciGate, "npm run check:source-family-namespace-mapping:ci");
  assert.equal(declaration.evidencePath, `${SFNM_ARTIFACT_ROOT}/evidence.json`);
  assert.ok(declaration.nonCapabilities.includes("arbitrary source namespaces"));
  assert.ok(declaration.nonCapabilities.includes("JudgmentKit invocation"));
  const packageJson = await readJson(path.join(root, "package.json"));
  assert.match(packageJson.scripts["proof:source-family-namespace-mapping"], /source-family-namespace-mapping proof/);
  assert.match(packageJson.scripts["check:source-family-namespace-mapping:ci"], /check:source-family-layout-mapping:ci/);
  assert.match(packageJson.scripts["check:source-family-namespace-mapping:ci:phase"], /check:source-family-namespace-mapping/);
});

test("path and tree checks reject traversal, hidden, symlink, hardlink, and output escape", async () => {
  for (const unsafe of ["../escape.json", ".hidden/file.json", "safe/.hidden.json", "/absolute.json", "back\\slash.json", "safe/./file.json"]) {
    assert.throws(() => sourceFamilyNamespaceMappingInternals.resolveContainedPath("/tmp/fixed-root", unsafe), /SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH/);
  }
  await withTemporaryDirectory(async (temporaryRoot) => {
    await fs.mkdir(path.join(temporaryRoot, "source"));
    await fs.writeFile(path.join(temporaryRoot, "outside.json"), "{}\n");
    await fs.symlink(path.join(temporaryRoot, "outside.json"), path.join(temporaryRoot, "source", "linked.json"));
    await assert.rejects(
      () => sourceFamilyNamespaceMappingInternals.listIndependentRegularFiles(temporaryRoot, "source", "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH"),
      /SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH/
    );
  });
  await withTemporaryDirectory(async (temporaryRoot) => {
    await fs.mkdir(path.join(temporaryRoot, "source"));
    await fs.writeFile(path.join(temporaryRoot, "source", "file.json"), "{}\n");
    await fs.link(path.join(temporaryRoot, "source", "file.json"), path.join(temporaryRoot, "source", "alias.json"));
    await assert.rejects(
      () => sourceFamilyNamespaceMappingInternals.listIndependentRegularFiles(temporaryRoot, "source", "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH"),
      /SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH/
    );
  });
});

test("CLI rejects missing, absolute, duplicate, substituted, non-normalized, and hidden arguments", async () => {
  const cases = [
    { argv: ["surfaces", "source-family-namespace-mapping"], pattern: /usage:/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "/absolute/source"), pattern: /POSIX-style relative path/ },
    { argv: replaceFlag(baseCliArgs(), "--source", `${SFNM_SOURCE_ROOT}/../team-owned-namespaced-bundle`), pattern: /without \. or \.\. segments/ },
    { argv: replaceFlag(baseCliArgs(), "--source", `${SFNM_SOURCE_ROOT}/`), pattern: /normalized POSIX-style relative path/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "sources/.hidden/team-owned-namespaced-bundle"), pattern: /hidden path segments/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "sources/source-family-namespace-mapping/other"), pattern: /usage:/ },
    { argv: [...baseCliArgs(), "--source", SFNM_SOURCE_ROOT], pattern: /duplicate argument/ }
  ];
  for (const entry of cases) {
    const result = await runCli(entry.argv);
    assert.equal(result.exitCode, 2, entry.argv.join(" "));
    assert.match(result.stderr, entry.pattern, entry.argv.join(" "));
  }
});

test("CLI preflight rejects symlinked and hardlink-aliased inputs and a symlinked output root", async () => {
  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const mappingPath = path.join(temporaryRoot, SFNM_MAPPING_PATH);
    const target = path.join(temporaryRoot, "mapping-target.json");
    await fs.writeFile(target, "{}\n");
    await fs.rm(mappingPath);
    await fs.symlink(target, mappingPath);
    const result = await runNamespaceCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /symlinked command path is forbidden/);
  });
  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const mappingPath = path.join(temporaryRoot, SFNM_MAPPING_PATH);
    await fs.link(mappingPath, path.join(temporaryRoot, "mapping-alias.json"));
    const result = await runNamespaceCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /hardlink-aliased command input/);
  });
  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const target = path.join(temporaryRoot, "real-output");
    await fs.mkdir(target);
    await fs.mkdir(path.dirname(path.join(temporaryRoot, SFNM_ARTIFACT_ROOT)), { recursive: true });
    await fs.symlink(target, path.join(temporaryRoot, SFNM_ARTIFACT_ROOT));
    const result = await runNamespaceCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /symlinked command path is forbidden/);
  });
});

test("output preparation rejects stale, symlinked, and hardlink-aliased entries", async () => {
  for (const setup of [
    async (temporaryRoot, outputRoot) => fs.writeFile(path.join(temporaryRoot, outputRoot, "stale.tmp"), "stale"),
    async (temporaryRoot, outputRoot) => {
      const target = path.join(temporaryRoot, "target.json");
      await fs.writeFile(target, "{}\n");
      await fs.symlink(target, path.join(temporaryRoot, outputRoot, path.basename(SFNM_ARTIFACT_PATHS[0])));
    },
    async (temporaryRoot, outputRoot) => {
      const output = path.join(temporaryRoot, outputRoot, path.basename(SFNM_ARTIFACT_PATHS[0]));
      await fs.writeFile(output, "{}\n");
      await fs.link(output, path.join(temporaryRoot, "output-alias.json"));
    }
  ]) {
    await withTemporaryDirectory(async (temporaryRoot) => {
      await fs.mkdir(path.join(temporaryRoot, SFNM_ARTIFACT_ROOT), { recursive: true });
      await setup(temporaryRoot, SFNM_ARTIFACT_ROOT);
      await assert.rejects(
        () => sourceFamilyNamespaceMappingInternals.prepareOutputRoot(temporaryRoot, SFNM_ARTIFACT_ROOT),
        /stale or unsupported|symlinked command output|hardlink-aliased command output/
      );
    });
  }
});

test("evidence integrity identifies source, mapping, compiler, upstream, inner, artifact, and self tampering", async () => {
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  assert.equal(await sourceFamilyNamespaceMappingInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);
  const mutations = [
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.command = `${SFNM_COMMAND} verify`; value.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(value); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.args.out = `${SFNM_ARTIFACT_ROOT}-substitute`; value.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(value); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.environment.host = "substituted"; value.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(value); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.schemaClosure[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", (value) => { value.namespacePackageRef.hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", (value) => { value.mappingRef.hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH", (value) => { value.sourceFileRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH", (value) => { value.compilerRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.proofImplementationRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH", (value) => { value.runtimeRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.fixtureRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH", (value) => { value.boundaryRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.artifacts[0].hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", (value) => { value.artifacts.at(-1).hash = "0".repeat(64); }],
    ["SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID", (value) => {
      value.normalizedEvidenceRemap.artifactMappings[0].persistedPath = value.normalizedEvidenceRemap.artifactMappings[1].persistedPath;
      value.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(value);
    }]
  ];
  for (const [expected, mutate] of mutations) {
    const candidate = structuredClone(evidence);
    mutate(candidate);
    assert.equal(await sourceFamilyNamespaceMappingInternals.firstEvidenceIntegrityFailureCode(root, candidate), expected);
  }
});

test("semantic rebuild rejects coordinated receipt, report, and evidence tampering", async () => {
  const receiptPath = path.join(root, SFNM_ARTIFACT_ROOT, "namespace-mapping-receipt.json");
  const reportPath = path.join(root, SFNM_ARTIFACT_ROOT, "source-family-namespace-mapping-report.json");
  const receiptBytes = await fs.readFile(receiptPath);
  const reportBytes = await fs.readFile(reportPath);
  const evidence = await readJson(path.join(root, SFNM_ARTIFACT_ROOT, "evidence.json"));
  const updateHash = async (candidate, artifactPath) => {
    const ref = candidate.artifacts.find((entry) => entry.path === `${SFNM_ARTIFACT_ROOT}/${path.basename(artifactPath)}`);
    ref.hash = await canonicalFileHash(artifactPath);
  };
  const restore = async () => {
    await fs.writeFile(receiptPath, receiptBytes);
    await fs.writeFile(reportPath, reportBytes);
  };
  try {
    const receipt = await readJson(receiptPath);
    receipt.entries[0].substitutions[0].from = `${SFNM_ALTERNATE_NAMESPACE}wrong.json#/`;
    await writeCanonicalJson(receiptPath, receipt);
    const report = await readJson(reportPath);
    report.namespaceMappingReceiptRef.hash = await canonicalFileHash(receiptPath);
    await writeCanonicalJson(reportPath, report);
    const candidate = structuredClone(evidence);
    await updateHash(candidate, receiptPath);
    await updateHash(candidate, reportPath);
    candidate.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(candidate);
    assert.equal(await sourceFamilyNamespaceMappingInternals.firstEvidenceIntegrityFailureCode(root, candidate), "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");

    await restore();
    const resultReport = await readJson(reportPath);
    resultReport.results[0].matched = false;
    await writeCanonicalJson(reportPath, resultReport);
    const resultCandidate = structuredClone(evidence);
    resultCandidate.validationResults[0].matched = false;
    await updateHash(resultCandidate, reportPath);
    resultCandidate.artifacts.at(-1).hash = sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(resultCandidate);
    assert.equal(await sourceFamilyNamespaceMappingInternals.firstEvidenceIntegrityFailureCode(root, resultCandidate), "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");
  } finally {
    await restore();
  }
  assert.deepEqual(await fs.readFile(receiptPath), receiptBytes);
  assert.deepEqual(await fs.readFile(reportPath), reportBytes);
});

test("the complete namespace proof is byte-deterministic", async () => {
  const before = await Promise.all(SFNM_ARTIFACT_PATHS.map((entry) => fs.readFile(path.join(root, entry))));
  await runSourceFamilyNamespaceMappingProof(namespaceProofArgs());
  const after = await Promise.all(SFNM_ARTIFACT_PATHS.map((entry) => fs.readFile(path.join(root, entry))));
  assert.deepEqual(after, before);
});

function baseCliArgs() {
  const args = defaultNamespaceMappingArgs();
  return [
    "surfaces", "source-family-namespace-mapping", "proof",
    "--source", args.source,
    "--mapping", args.mapping,
    "--namespace-package", args.namespacePackage,
    "--ingestion-evidence", args.ingestionEvidence,
    "--catalog", args.catalog,
    "--source-family-layout-mapping-evidence", args.sourceFamilyLayoutMappingEvidence,
    "--fixture", args.fixture,
    "--out", args.out
  ];
}

function replaceFlag(argv, flag, value) {
  const result = [...argv];
  result[result.indexOf(flag) + 1] = value;
  return result;
}

async function runCli(argv) {
  let stdout = "";
  let stderr = "";
  const exitCode = await runInterfacectl(argv, {
    cwd: root,
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } }
  });
  return { exitCode, stdout, stderr };
}

async function runNamespaceCliAt(cwd) {
  let stdout = "";
  let stderr = "";
  const exitCode = await runSourceFamilyNamespaceMappingInterfacectl(baseCliArgs().slice(3), {
    cwd,
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } }
  });
  return { exitCode, stdout, stderr };
}

function namespaceProofArgs() {
  const args = defaultNamespaceMappingArgs();
  return {
    cwd: root,
    sourceRoot: args.source,
    mappingPath: args.mapping,
    namespacePackagePath: args.namespacePackage,
    ingestionEvidencePath: args.ingestionEvidence,
    catalogPath: args.catalog,
    sourceFamilyLayoutMappingEvidencePath: args.sourceFamilyLayoutMappingEvidence,
    fixtureRoot: args.fixture,
    outRoot: args.out,
    command: SFNM_COMMAND,
    args
  };
}

async function withTemporaryDirectory(fn) {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-namespace-test-"));
  try {
    await fn(temporaryRoot);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function withTemporaryCommandRoot(fn) {
  await withTemporaryDirectory(async (temporaryRoot) => {
    for (const directory of [SFNM_SOURCE_ROOT, SFNM_FIXTURE_ROOT]) await fs.mkdir(path.join(temporaryRoot, directory), { recursive: true });
    for (const file of [SFNM_MAPPING_PATH, SFNM_NAMESPACE_PACKAGE_PATH, SFNM_P2_EVIDENCE_PATH, SFNM_P2_CATALOG_PATH, SFNM_LAYOUT_EVIDENCE_PATH]) {
      await fs.mkdir(path.dirname(path.join(temporaryRoot, file)), { recursive: true });
      await fs.writeFile(path.join(temporaryRoot, file), "{}\n");
    }
    await fn(temporaryRoot);
  });
}
