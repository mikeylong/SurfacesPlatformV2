import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { canonicalJson, runInterfacectl } from "../src/p0.js";
import { canonicalFileHash, rawFileHash, readJson, writeCanonicalJson } from "../src/p2-contract.js";
import {
  SC_SOURCE_FILES,
  SC_SOURCE_ROOT
} from "../src/source-conformance-contract.js";
import {
  SFP_ARTIFACT_ROOT,
  SFP_CAPTURED_ARTIFACTS,
  SFP_CANDIDATE_SOURCE_ROOT,
  SFP_PACKAGE_PATH
} from "../src/source-family-packaging-contract.js";
import {
  SFLM_ARTIFACT_PATHS,
  SFLM_ARTIFACT_ROOT,
  SFLM_CAPTURED_ARTIFACTS,
  SFLM_COMMAND,
  SFLM_COMPILER_IMPLEMENTATION_PATHS,
  SFLM_EXPECTATION_ROWS,
  SFLM_FIXTURE_ROOT,
  SFLM_IMMUTABLE_CATALOG_FIELDS,
  SFLM_LAYOUT_ENTRIES,
  SFLM_LAYOUT_PACKAGE_PATH,
  SFLM_MAPPING_PATH,
  SFLM_MAPPING_SHA256,
  SFLM_P2_CATALOG_PATH,
  SFLM_P2_EVIDENCE_PATH,
  SFLM_PHYSICAL_SOURCE_ROOT,
  SFLM_RUNTIME_DEPENDENCY_PATHS,
  SFLM_SFP_EVIDENCE_PATH,
  buildSourceFamilyLayoutMappingFixtures,
  diagnosticsRegistry,
  materializeSourceFamilyLayoutMappingContract,
  sflmFixturePaths,
  sflmMappedEvidenceRemap,
  sflmSchemaPaths,
  sflmSourcePaths,
  sourceFamilyLayoutMappingContractInternals
} from "../src/source-family-layout-mapping-contract.js";
import {
  runSourceFamilyLayoutMappingInterfacectl,
  runSourceFamilyLayoutMappingProof,
  sourceFamilyLayoutMappingInternals
} from "../src/source-family-layout-mapping-proof.js";

const execFileAsync = promisify(execFile);
const root = path.resolve(new URL("..", import.meta.url).pathname);
const expectedLogicalPaths = ["manifest.json", ...SC_SOURCE_FILES];

test("layout package fixes one independent byte-identical 12-row physical mapping", async () => {
  const mapping = await readJson(path.join(root, SFLM_MAPPING_PATH));
  const layoutPackage = await readJson(path.join(root, SFLM_LAYOUT_PACKAGE_PATH));
  const projectedPackageRows = layoutPackage.entries.map(({ physicalPath, logicalPath, sha256 }) => ({ physicalPath, logicalPath, sha256 }));

  assert.equal(mapping.copyMode, "raw-bytes");
  assert.equal(mapping.sourceRefRewrite, false);
  assert.equal(mapping.familySpecificModule, null);
  assert.equal(layoutPackage.copyMode, "raw-bytes");
  assert.equal(layoutPackage.sourceRefRewrite, false);
  assert.equal(layoutPackage.familySpecificModule, null);
  assert.deepEqual(mapping.mappings, SFLM_LAYOUT_ENTRIES.map(({ physicalPath, logicalPath, sha256 }) => ({ physicalPath, logicalPath, sha256 })));
  assert.deepEqual(projectedPackageRows, mapping.mappings);
  assert.deepEqual(mapping.mappings.map((entry) => entry.logicalPath), expectedLogicalPaths);
  assert.equal(mapping.mappings.length, 12);
  assert.equal(new Set(mapping.mappings.map((entry) => entry.logicalPath)).size, 12);
  assert.equal(new Set(mapping.mappings.map((entry) => entry.physicalPath)).size, 12);
  assert.equal(await rawFileHash(path.join(root, SFLM_MAPPING_PATH)), SFLM_MAPPING_SHA256);
  assert.equal(layoutPackage.mappingSha256, SFLM_MAPPING_SHA256);

  const tree = await sourceFamilyLayoutMappingContractInternals.listIndependentRegularTree(root, SFLM_PHYSICAL_SOURCE_ROOT);
  assert.deepEqual(tree.files, SFLM_LAYOUT_ENTRIES.map((entry) => entry.physicalPath).sort());
  assert.deepEqual(tree.directories, sourceFamilyLayoutMappingContractInternals.expectedDirectorySet(tree.files));
  assert.equal(mapping.mappings.some((entry) => path.posix.dirname(entry.physicalPath) !== path.posix.dirname(entry.logicalPath)), true);
  assert.equal(mapping.mappings.some((entry) => path.posix.basename(entry.physicalPath) !== path.posix.basename(entry.logicalPath)), true);

  const inodeKeys = new Set();
  for (const entry of layoutPackage.entries) {
    const physicalPath = path.join(root, SFLM_PHYSICAL_SOURCE_ROOT, entry.physicalPath);
    const baselinePath = path.join(root, entry.baselinePath);
    const stat = await fs.lstat(physicalPath, { bigint: true });
    assert.equal(stat.isFile(), true, entry.physicalPath);
    assert.equal(stat.isSymbolicLink(), false, entry.physicalPath);
    assert.equal(stat.nlink, 1n, entry.physicalPath);
    const inodeKey = `${stat.dev}:${stat.ino}`;
    assert.equal(inodeKeys.has(inodeKey), false, entry.physicalPath);
    inodeKeys.add(inodeKey);
    assert.equal(await rawFileHash(physicalPath), entry.sha256, entry.physicalPath);
    assert.equal(await rawFileHash(baselinePath), entry.sha256, entry.baselinePath);
    assert.deepEqual(await fs.readFile(physicalPath), await fs.readFile(baselinePath), entry.logicalPath);
  }

  assert.deepEqual(sflmSourcePaths(), [
    SFLM_MAPPING_PATH,
    ...SFLM_LAYOUT_ENTRIES.map((entry) => `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`)
  ]);
});

test("layout materialization preserves every immutable mapping input byte", async () => {
  const paths = [SFLM_LAYOUT_PACKAGE_PATH, SFLM_MAPPING_PATH, ...SFLM_LAYOUT_ENTRIES.map((entry) => `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`)];
  const before = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry))));
  await materializeSourceFamilyLayoutMappingContract(root);
  const after = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry))));
  assert.deepEqual(after, before);
});

test("the fixed compiler runtime is enforced before layout proof execution", async () => {
  const packageFixture = await readJson(path.join(root, SFP_PACKAGE_PATH));
  const actualNodeMajor = Number(process.versions.node.split(".")[0]);
  assert.doesNotThrow(() => sourceFamilyLayoutMappingInternals.assertCompilerRuntime(packageFixture, actualNodeMajor));
  assert.throws(
    () => sourceFamilyLayoutMappingInternals.assertCompilerRuntime(packageFixture, actualNodeMajor === 22 ? 20 : 22),
    /SOURCE_LAYOUT_COMPILER_HASH_MISMATCH/
  );
});

test("generated fixtures are exact-locked and every mutation target stays inside the fixed proof boundary", async () => {
  const mapping = await readJson(path.join(root, SFLM_MAPPING_PATH));
  const layoutPackage = await readJson(path.join(root, SFLM_LAYOUT_PACKAGE_PATH));
  const profileEntry = layoutPackage.entries.find((entry) => entry.logicalPath === "governance/authority-profile.json");
  const profile = await readJson(path.join(root, SFLM_PHYSICAL_SOURCE_ROOT, profileEntry.physicalPath));
  const generated = buildSourceFamilyLayoutMappingFixtures(layoutPackage, mapping, profile);

  for (const relativePath of Object.keys(generated)) {
    const fixturePath = `${SFLM_FIXTURE_ROOT}/${relativePath}`;
    const fixture = await readJson(path.join(root, fixturePath));
    assert.doesNotThrow(() => sourceFamilyLayoutMappingInternals.assertExactFixtureDocument(fixturePath, fixture, generated));
    assert.doesNotThrow(() => sourceFamilyLayoutMappingInternals.assertFixtureMutationSafety(fixture));
  }

  const physicalFixturePath = `${SFLM_FIXTURE_ROOT}/mutations/source-hash-mismatch.source-family-layout-mapping.json`;
  const physicalFixture = await readJson(path.join(root, physicalFixturePath));
  const driftedFixture = structuredClone(physicalFixture);
  driftedFixture.mutation.value = "schema-valid-drift";
  assert.throws(
    () => sourceFamilyLayoutMappingInternals.assertExactFixtureDocument(physicalFixturePath, driftedFixture, generated),
    /SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH/
  );

  for (const mutation of [
    { ...physicalFixture.mutation, path: "../../outside.json" },
    { target: "staged-logical-source", operation: "replace-byte", path: "../outside.json", secondaryPath: null, value: "00" },
    { target: "compiler-ref", operation: "replace-hash", path: "scripts/unchecked.mjs", secondaryPath: null, value: "0".repeat(64) },
    { target: "probe-workspace", operation: "remove-file", path: "components/card.json", secondaryPath: null, value: null },
    { target: "captured-inner-evidence", operation: "replace-hash", path: "nested/mapped-source-inventory.json", secondaryPath: null, value: "0".repeat(64) },
    { target: "mapping-descriptor", operation: "add-field", path: "/__proto__/polluted", secondaryPath: null, value: true },
    { target: "final-evidence", operation: "replace-hash", path: "/constructor/prototype/polluted", secondaryPath: null, value: true }
  ]) {
    assert.throws(
      () => sourceFamilyLayoutMappingInternals.assertFixtureMutationSafety({ mutation }),
      /SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH/
    );
  }

  const target = {};
  assert.throws(
    () => sourceFamilyLayoutMappingInternals.setJsonPointer(target, "/__proto__/polluted", true),
    /SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH/
  );
  assert.equal({}.polluted, undefined);
});

test("read-only integrity inspection requires one independent exact output closure", async () => {
  await assert.doesNotReject(() => sourceFamilyLayoutMappingInternals.assertPersistedOutputClosure(root));
  await withTemporaryDirectory(async (temporaryRoot) => {
    const outputRoot = path.join(temporaryRoot, SFLM_ARTIFACT_ROOT);
    await fs.mkdir(outputRoot, { recursive: true });
    for (const artifactPath of SFLM_ARTIFACT_PATHS) {
      await fs.writeFile(path.join(outputRoot, path.basename(artifactPath)), "{}\n");
    }
    await fs.link(path.join(outputRoot, path.basename(SFLM_ARTIFACT_PATHS[0])), path.join(temporaryRoot, "output-alias.json"));
    await assert.rejects(
      () => sourceFamilyLayoutMappingInternals.assertPersistedOutputClosure(temporaryRoot),
      /SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN/
    );
  });
});

test("outer evidence and receipt close the fixed mapping proof", async () => {
  const evidence = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json"));
  const receipt = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "layout-mapping-receipt.json"));

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.mappedEvidenceClosureVerified, true);
  assert.deepEqual(evidence.schemaClosure.map((entry) => entry.path), sflmSchemaPaths());
  assert.deepEqual(evidence.fixtureRefs.map((entry) => entry.path), sflmFixturePaths());
  assert.deepEqual(evidence.physicalSourceRefs.map((entry) => entry.path), SFLM_LAYOUT_ENTRIES.map((entry) => `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`));
  assert.deepEqual(evidence.compilerRefs.map((entry) => entry.path), SFLM_COMPILER_IMPLEMENTATION_PATHS);
  assert.deepEqual(evidence.runtimeRefs.map((entry) => entry.path), SFLM_RUNTIME_DEPENDENCY_PATHS);
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), SFLM_ARTIFACT_PATHS);
  assert.deepEqual(evidence.mappedEvidenceRemap, sflmMappedEvidenceRemap());
  assert.deepEqual(report.mappedEvidenceRemap, evidence.mappedEvidenceRemap);
  assert.deepEqual(report.compilerExecutions, { acceptedMappedBundlePasses: 1, causalProbeFailures: 2, total: 3 });

  assert.equal(receipt.mappingVerifiedBeforeStaging, true);
  assert.equal(receipt.fileClosureVerified, true);
  assert.equal(receipt.independentRegularFilesVerified, true);
  assert.deepEqual(receipt.physicalLayoutDistinct, { directoryPathChanged: true, fileNameChanged: true });
  assert.equal(receipt.entryCount, 12);
  assert.equal(receipt.sourceBytesPreserved, true);
  assert.deepEqual(receipt.entries.map((entry) => entry.logicalPath), expectedLogicalPaths.map((entry) => `${SC_SOURCE_ROOT}/${entry}`));
  assert.equal(receipt.entries.every((entry) => entry.bytesPreserved && entry.physicalHash === entry.logicalHash && entry.logicalHash === entry.baselineHash), true);
  assert.equal(report.mappingVerification.mappingVerifiedBeforeStaging, true);
  assert.equal(report.mappingVerification.fileClosureVerified, true);
  assert.equal(report.mappingVerification.independentRegularFilesVerified, true);
});

test("all eight mapped compiler artifacts equal the accepted candidate and re-verify after workspace removal", async () => {
  const evidence = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json"));
  assert.equal(SFLM_CAPTURED_ARTIFACTS.length, 8);
  assert.equal(report.baselineComparison.artifactComparisons.length, 8);

  for (const [mappedFile, , innerFile] of SFLM_CAPTURED_ARTIFACTS) {
    const baseline = SFP_CAPTURED_ARTIFACTS.find(([, , baselineInnerFile]) => baselineInnerFile === innerFile);
    assert.ok(baseline, innerFile);
    assert.equal(
      canonicalJson(await readJson(path.join(root, SFLM_ARTIFACT_ROOT, mappedFile))),
      canonicalJson(await readJson(path.join(root, SFP_ARTIFACT_ROOT, baseline[0]))),
      innerFile
    );
  }

  assert.equal(await sourceFamilyLayoutMappingInternals.firstPersistedMappedEvidenceIntegrityFailureCode(root, evidence.mappedEvidenceRemap), null);
  const tampered = structuredClone(evidence.mappedEvidenceRemap);
  tampered.artifactMappings[0].persistedPath = tampered.artifactMappings[1].persistedPath;
  assert.equal(
    await sourceFamilyLayoutMappingInternals.firstPersistedMappedEvidenceIntegrityFailureCode(root, tampered),
    "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID"
  );
});

test("mapped output preserves six fact tuples, nine catalog fields, and non-executable review semantics", async () => {
  const report = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json"));
  const queue = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "mapped-source-review-queue.json"));
  const reviewFixture = await readJson(path.join(root, SFLM_FIXTURE_ROOT, "review/team-exception.source-family-layout-mapping.json"));
  const physicalManifestEntry = SFLM_LAYOUT_ENTRIES.find((entry) => entry.logicalPath === "manifest.json");
  const physicalManifest = await readJson(path.join(root, SFLM_PHYSICAL_SOURCE_ROOT, physicalManifestEntry.physicalPath));
  const baselineManifest = await readJson(path.join(root, SFP_CANDIDATE_SOURCE_ROOT, "manifest.json"));

  assert.equal(report.baselineComparison.factTupleCount, 6);
  assert.equal(report.baselineComparison.factTuples.length, 6);
  assert.equal(report.baselineComparison.factTuplesMatched, true);
  assert.equal(report.baselineComparison.immutableFieldCount, 9);
  assert.deepEqual(report.baselineComparison.immutableFields.map((entry) => entry.field), SFLM_IMMUTABLE_CATALOG_FIELDS);
  assert.equal(report.baselineComparison.immutableFields.every((entry) => entry.matched && entry.p2Hash === entry.baselineHash && entry.baselineHash === entry.mappedHash), true);
  assert.deepEqual(report.baselineComparison.componentIds, ["Button", "InLineAlert"]);
  assert.equal(report.baselineComparison.authorityExpanded, false);
  assert.equal(report.baselineComparison.sourceRefsPreserved, true);
  assert.equal(report.baselineComparison.reviewItemsNonExecutable, true);
  assert.equal(queue.promotionStatus, "review_required");
  assert.equal(queue.queueItems.every((item) => item.executable === false), true);
  assert.ok(queue.queueItems.find((item) =>
    item.owner === reviewFixture.review.owner &&
    item.rationale === reviewFixture.review.rationale &&
    item.expiresAt === reviewFixture.review.expiresAt &&
    reviewFixture.review.requiredRefs.every((ref) => item.requiredSourceRefs.includes(ref))
  ));
  assert.equal(canonicalJson(physicalManifest), canonicalJson(baselineManifest));
});

test("the 20 causal fixture outcomes match their manifest without registering the inner compiler diagnostic", async () => {
  const expectations = await readJson(path.join(root, SFLM_FIXTURE_ROOT, "expectations.manifest.json"));
  const evidence = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "evidence.json"));
  const report = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json"));

  assert.equal(expectations.expectations.length, 20);
  assert.deepEqual(expectations.expectations, SFLM_EXPECTATION_ROWS);
  assert.deepEqual(report.results, evidence.validationResults);
  assert.deepEqual(report.results.map((entry) => entry.fixturePath), SFLM_EXPECTATION_ROWS.map((entry) => entry.fixturePath));
  assert.equal(report.results.every((entry) => entry.matched), true);
  for (let index = 0; index < report.results.length; index += 1) {
    const actual = report.results[index];
    const expected = SFLM_EXPECTATION_ROWS[index];
    assert.equal(actual.actualResult, expected.expectedResult, expected.fixturePath);
    assert.equal(actual.promotionStatus, expected.promotionStatus, expected.fixturePath);
    assert.deepEqual(actual.diagnosticCodes, expected.diagnosticCodes, expected.fixturePath);
  }

  const expectedCodes = diagnosticsRegistry().map((entry) => entry.code).sort();
  assert.deepEqual([...new Set(report.results.flatMap((entry) => entry.diagnosticCodes))].sort(), expectedCodes);
  assert.deepEqual(report.diagnostics.map((entry) => entry.code).sort(), expectedCodes);
  assert.equal(report.diagnosticsRegistry.some((entry) => entry.code === "SOURCE_FACT_AUTHORITY_ESCALATION"), false);
  assert.equal(report.results.some((entry) => entry.diagnosticCodes.includes("SOURCE_FACT_AUTHORITY_ESCALATION")), false);

  for (const expectation of SFLM_EXPECTATION_ROWS.slice(1)) {
    const fixture = await readJson(path.join(root, expectation.fixturePath));
    if (fixture.schemaId === "source-family-layout-mapping-preflight-mutation.v0") {
      assert.ok(fixture.operation, expectation.fixturePath);
      assert.ok(fixture.artifactPath, expectation.fixturePath);
    } else if (fixture.caseType === "review-required") {
      assert.equal(fixture.review.executable, false);
    } else {
      assert.ok(fixture.mutation?.target, expectation.fixturePath);
      assert.ok(fixture.mutation?.operation, expectation.fixturePath);
    }
  }
});

test("descriptor fixtures remain causally distinct before strict schema rejection", async () => {
  const mapping = await readJson(path.join(root, SFLM_MAPPING_PATH));
  const layoutPackage = await readJson(path.join(root, SFLM_LAYOUT_PACKAGE_PATH));
  const fixturePaths = SFLM_EXPECTATION_ROWS.filter((entry) => [
    "SOURCE_LAYOUT_MAPPING_HASH_MISMATCH",
    "SOURCE_LAYOUT_MAPPING_INCOMPLETE",
    "SOURCE_LAYOUT_MAPPING_COLLISION",
    "SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE",
    "SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED",
    "SOURCE_LAYOUT_TRANSFORM_FORBIDDEN",
    "SOURCE_LAYOUT_AUTHORITY_EXPANSION"
  ].includes(entry.diagnosticCodes[0]));

  for (const expectation of fixturePaths) {
    const fixture = await readJson(path.join(root, expectation.fixturePath));
    const mutated = structuredClone(mapping);
    if (fixture.mutation.operation === "remove-row") {
      mutated.mappings.splice(Number(fixture.mutation.path.split("/").at(-1)), 1);
    } else {
      sourceFamilyLayoutMappingInternals.setJsonPointer(mutated, fixture.mutation.path, structuredClone(fixture.mutation.value));
    }
    assert.equal(sourceFamilyLayoutMappingInternals.classifyMutatedDescriptor(mutated, layoutPackage), expectation.diagnosticCodes[0], expectation.fixturePath);
  }
});

test("the separate authority probe reaches the unchanged inner compiler and changes no baseline input", async () => {
  const report = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json"));
  const probe = report.authorityExpansionProbe;
  assert.equal(probe.baselineMappingVerified, true);
  assert.equal(probe.baselineIntegrityVerified, true);
  assert.equal(probe.probeWorkspace, "temporary:source-family-layout-authority-expansion");
  assert.equal(probe.probeWorkspaceIsolated, true);
  assert.deepEqual(probe.mutatedLogicalPaths, ["components/button.json", "manifest.json"]);
  assert.equal(probe.componentId, "Button");
  assert.equal(probe.catalogPointer, "/components/Button/props/variant/allowedValues");
  assert.equal(probe.addedValue, "expressive");
  assert.equal(probe.innerCompilerExitCode, 1);
  assert.equal(probe.innerDiagnostic.code, "SOURCE_FACT_AUTHORITY_ESCALATION");
  assert.equal(probe.innerDiagnostic.finding.diagnosticCode, "SOURCE_FACT_AUTHORITY_ESCALATION");
  assert.equal(probe.innerDiagnostic.finding.componentId, "Button");
  assert.equal(probe.innerDiagnostic.finding.status, "blocked");
  assert.equal(probe.innerDiagnostic.finding.actionType, "edit-source-fact");
  assert.equal(probe.innerDiagnostic.finding.jsonPointer, "/components/Button/props/variant/allowedValues");
  assert.match(probe.innerDiagnostic.finding.message, /exceeds the accepted P2 catalog/);
  assert.equal(probe.innerDiagnostic.finding.sourceRefs.length, 1);
  assert.equal(probe.blocked, true);
  assert.equal(probe.checkedSourceInputsChanged, false);
  assert.equal(probe.baselineArtifactsChanged, false);
  assert.equal(probe.probeWorkspaceRemoved, true);
});

test("visible relative-path and physical-entry checks reject traversal, hidden, symlink, hardlink, and non-regular entries", async () => {
  for (const unsafe of ["../escape.json", ".hidden/file.json", "safe/.hidden.json", "/absolute.json", "back\\slash.json", "safe/./file.json"]) {
    assert.throws(
      () => sourceFamilyLayoutMappingContractInternals.assertSafeVisibleRelativePath(unsafe, "fixture path"),
      /SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE/
    );
  }

  await withTemporaryDirectory(async (temporaryRoot) => {
    await fs.mkdir(path.join(temporaryRoot, "source"), { recursive: true });
    await fs.writeFile(path.join(temporaryRoot, "outside.json"), "{}");
    await fs.symlink(path.join(temporaryRoot, "outside.json"), path.join(temporaryRoot, "source", "linked.json"));
    await assert.rejects(
      () => sourceFamilyLayoutMappingContractInternals.listIndependentRegularTree(temporaryRoot, "source"),
      /SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE/
    );
  });

  await withTemporaryDirectory(async (temporaryRoot) => {
    await fs.mkdir(path.join(temporaryRoot, "source"), { recursive: true });
    await fs.writeFile(path.join(temporaryRoot, "source", "file.json"), "{}");
    await fs.link(path.join(temporaryRoot, "source", "file.json"), path.join(temporaryRoot, "source", "alias.json"));
    await assert.rejects(
      () => sourceFamilyLayoutMappingContractInternals.listIndependentRegularTree(temporaryRoot, "source"),
      /SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN/
    );
  });

  await withTemporaryDirectory(async (temporaryRoot) => {
    await fs.mkdir(path.join(temporaryRoot, "source"), { recursive: true });
    await execFileAsync("mkfifo", [path.join(temporaryRoot, "source", "pipe")]);
    await assert.rejects(
      () => sourceFamilyLayoutMappingContractInternals.listIndependentRegularTree(temporaryRoot, "source"),
      /SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE/
    );
  });
});

test("CLI rejects missing, absolute, duplicate, substituted, non-normalized, and hidden arguments", async () => {
  const cases = [
    { argv: ["surfaces", "source-family-layout-mapping"], pattern: /usage:/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "/absolute/source"), pattern: /POSIX-style relative path/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "sources/source-family-layout-mapping/../source-family-layout-mapping/team-owned-physical-bundle"), pattern: /without \. or \.\. segments/ },
    { argv: replaceFlag(baseCliArgs(), "--source", `${SFLM_PHYSICAL_SOURCE_ROOT}/`), pattern: /normalized POSIX-style relative path/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "sources/.hidden/team-owned-physical-bundle"), pattern: /hidden path segments/ },
    { argv: replaceFlag(baseCliArgs(), "--source", "sources/source-family-layout-mapping/other-bundle"), pattern: /usage:/ },
    { argv: [...baseCliArgs(), "--source", SFLM_PHYSICAL_SOURCE_ROOT], pattern: /duplicate argument/ }
  ];
  for (const entry of cases) {
    const result = await runCli(entry.argv);
    assert.equal(result.exitCode, 2, entry.argv.join(" "));
    assert.match(result.stderr, entry.pattern, entry.argv.join(" "));
  }
});

test("CLI preflight rejects symlinked and hardlink-aliased fixed command inputs", async () => {
  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const mappingPath = path.join(temporaryRoot, SFLM_MAPPING_PATH);
    const target = path.join(temporaryRoot, "mapping-target.json");
    await fs.writeFile(target, "{}");
    await fs.rm(mappingPath);
    await fs.symlink(target, mappingPath);
    const result = await runMappingCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /symlinked command path is forbidden/);
  });

  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const mappingPath = path.join(temporaryRoot, SFLM_MAPPING_PATH);
    await fs.link(mappingPath, path.join(temporaryRoot, "mapping-alias.json"));
    const result = await runMappingCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /hardlink-aliased command input/);
  });

  await withTemporaryCommandRoot(async (temporaryRoot) => {
    const target = path.join(temporaryRoot, "real-output");
    await fs.mkdir(target, { recursive: true });
    await fs.mkdir(path.dirname(path.join(temporaryRoot, SFLM_ARTIFACT_ROOT)), { recursive: true });
    await fs.symlink(target, path.join(temporaryRoot, SFLM_ARTIFACT_ROOT));
    const result = await runMappingCliAt(temporaryRoot);
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /symlinked command path is forbidden/);
  });
});

test("output preparation rejects stale, symlinked, and hardlink-aliased entries", async () => {
  assert.equal(typeof sourceFamilyLayoutMappingInternals.prepareOutputRoot, "function", "export prepareOutputRoot for focused output-safety proof");
  for (const setup of [
    async (temporaryRoot, outputRoot) => fs.writeFile(path.join(temporaryRoot, outputRoot, "stale.tmp"), "stale"),
    async (temporaryRoot, outputRoot) => {
      const target = path.join(temporaryRoot, "target.json");
      await fs.writeFile(target, "{}");
      await fs.symlink(target, path.join(temporaryRoot, outputRoot, path.basename(SFLM_ARTIFACT_PATHS[0])));
    },
    async (temporaryRoot, outputRoot) => {
      const output = path.join(temporaryRoot, outputRoot, path.basename(SFLM_ARTIFACT_PATHS[0]));
      await fs.writeFile(output, "{}");
      await fs.link(output, path.join(temporaryRoot, "output-alias.json"));
    }
  ]) {
    await withTemporaryDirectory(async (temporaryRoot) => {
      const outputRoot = SFLM_ARTIFACT_ROOT;
      await fs.mkdir(path.join(temporaryRoot, outputRoot), { recursive: true });
      await setup(temporaryRoot, outputRoot);
      await assert.rejects(
        () => sourceFamilyLayoutMappingInternals.prepareOutputRoot(temporaryRoot, outputRoot),
        /stale or unsupported|symlinked command output|hardlink-aliased command output/
      );
    });
  }
});

test("evidence integrity identifies mapping, source, compiler, upstream, inner, artifact, and self-hash tampering", async () => {
  const evidence = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "evidence.json"));
  assert.equal(await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);

  const mutations = [
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => {
      value.command = "interfacectl surfaces source-family-layout-mapping verify";
      value.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(value);
    }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => {
      value.args.out = "artifacts/source-family-layout-mapping-substitute";
      value.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(value);
    }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => {
      value.checkedAt = "1970-01-01T00:00:01.000Z";
      value.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(value);
    }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => {
      value.environment.host = "substituted-host";
      value.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(value);
    }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => { value.schemaClosure[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => { value.layoutPackageRef.hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_MAPPING_HASH_MISMATCH", (value) => { value.mappingRef.hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_SOURCE_HASH_MISMATCH", (value) => { value.physicalSourceRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_COMPILER_HASH_MISMATCH", (value) => { value.compilerRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_COMPILER_HASH_MISMATCH", (value) => { value.runtimeRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => { value.fixtureRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH", (value) => { value.boundaryRefs[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => { value.artifacts[0].hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", (value) => { value.artifacts.at(-1).hash = "0".repeat(64); }],
    ["SOURCE_LAYOUT_INNER_EVIDENCE_INVALID", (value) => {
      value.mappedEvidenceRemap.artifactMappings[0].persistedPath = value.mappedEvidenceRemap.artifactMappings[1].persistedPath;
      value.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(value);
    }]
  ];
  for (const [expectedCode, mutate] of mutations) {
    const tampered = structuredClone(evidence);
    mutate(tampered);
    assert.equal(await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(root, tampered), expectedCode);
  }
});

test("evidence integrity rejects coordinated schema-valid receipt and result downgrades", async () => {
  const receiptPath = path.join(root, SFLM_ARTIFACT_ROOT, "layout-mapping-receipt.json");
  const reportPath = path.join(root, SFLM_ARTIFACT_ROOT, "source-family-layout-mapping-report.json");
  const receiptBytes = await fs.readFile(receiptPath);
  const reportBytes = await fs.readFile(reportPath);
  const evidence = await readJson(path.join(root, SFLM_ARTIFACT_ROOT, "evidence.json"));

  const updateEvidenceArtifactHash = async (candidate, artifactPath) => {
    const relativePath = `${SFLM_ARTIFACT_ROOT}/${path.basename(artifactPath)}`;
    const ref = candidate.artifacts.find((entry) => entry.path === relativePath);
    assert.ok(ref, relativePath);
    ref.hash = await canonicalFileHash(artifactPath);
  };
  const restoreArtifacts = async () => {
    await fs.writeFile(receiptPath, receiptBytes);
    await fs.writeFile(reportPath, reportBytes);
  };

  try {
    const receipt = await readJson(receiptPath);
    receipt.entries[0].physicalHash = "0".repeat(64);
    await writeCanonicalJson(receiptPath, receipt);
    const receiptDowngradeReport = await readJson(reportPath);
    receiptDowngradeReport.layoutMappingReceiptRef.hash = await canonicalFileHash(receiptPath);
    await writeCanonicalJson(reportPath, receiptDowngradeReport);
    const receiptDowngradeEvidence = structuredClone(evidence);
    await updateEvidenceArtifactHash(receiptDowngradeEvidence, receiptPath);
    await updateEvidenceArtifactHash(receiptDowngradeEvidence, reportPath);
    receiptDowngradeEvidence.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(receiptDowngradeEvidence);
    assert.equal(
      await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(root, receiptDowngradeEvidence),
      "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH"
    );

    await restoreArtifacts();
    const resultDowngradeReport = await readJson(reportPath);
    resultDowngradeReport.results[0].matched = false;
    await writeCanonicalJson(reportPath, resultDowngradeReport);
    const resultDowngradeEvidence = structuredClone(evidence);
    resultDowngradeEvidence.validationResults[0].matched = false;
    await updateEvidenceArtifactHash(resultDowngradeEvidence, reportPath);
    resultDowngradeEvidence.artifacts.at(-1).hash = sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(resultDowngradeEvidence);
    assert.equal(
      await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(root, resultDowngradeEvidence),
      "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH"
    );
  } finally {
    await restoreArtifacts();
  }

  assert.deepEqual(await fs.readFile(receiptPath), receiptBytes);
  assert.deepEqual(await fs.readFile(reportPath), reportBytes);
});

test("the complete layout proof is byte-deterministic", async () => {
  const before = await Promise.all(SFLM_ARTIFACT_PATHS.map((entry) => fs.readFile(path.join(root, entry))));
  await runSourceFamilyLayoutMappingProof(mappingProofArgs());
  const after = await Promise.all(SFLM_ARTIFACT_PATHS.map((entry) => fs.readFile(path.join(root, entry))));
  assert.deepEqual(after, before);
});

function baseCliArgs() {
  return [
    "surfaces", "source-family-layout-mapping", "proof",
    "--source", SFLM_PHYSICAL_SOURCE_ROOT,
    "--mapping", SFLM_MAPPING_PATH,
    "--layout-package", SFLM_LAYOUT_PACKAGE_PATH,
    "--ingestion-evidence", SFLM_P2_EVIDENCE_PATH,
    "--catalog", SFLM_P2_CATALOG_PATH,
    "--source-family-packaging-evidence", SFLM_SFP_EVIDENCE_PATH,
    "--fixture", SFLM_FIXTURE_ROOT,
    "--out", SFLM_ARTIFACT_ROOT
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

async function runMappingCliAt(cwd) {
  let stdout = "";
  let stderr = "";
  const exitCode = await runSourceFamilyLayoutMappingInterfacectl(baseCliArgs().slice(3), {
    cwd,
    stdout: { write(value) { stdout += value; } },
    stderr: { write(value) { stderr += value; } }
  });
  return { exitCode, stdout, stderr };
}

function mappingProofArgs() {
  return {
    cwd: root,
    sourceRoot: SFLM_PHYSICAL_SOURCE_ROOT,
    mappingPath: SFLM_MAPPING_PATH,
    layoutPackagePath: SFLM_LAYOUT_PACKAGE_PATH,
    ingestionEvidencePath: SFLM_P2_EVIDENCE_PATH,
    catalogPath: SFLM_P2_CATALOG_PATH,
    sourceFamilyPackagingEvidencePath: SFLM_SFP_EVIDENCE_PATH,
    fixtureRoot: SFLM_FIXTURE_ROOT,
    outRoot: SFLM_ARTIFACT_ROOT,
    command: SFLM_COMMAND,
    args: {
      source: SFLM_PHYSICAL_SOURCE_ROOT,
      mapping: SFLM_MAPPING_PATH,
      layoutPackage: SFLM_LAYOUT_PACKAGE_PATH,
      ingestionEvidence: SFLM_P2_EVIDENCE_PATH,
      catalog: SFLM_P2_CATALOG_PATH,
      sourceFamilyPackagingEvidence: SFLM_SFP_EVIDENCE_PATH,
      fixture: SFLM_FIXTURE_ROOT,
      out: SFLM_ARTIFACT_ROOT
    }
  };
}

async function withTemporaryDirectory(fn) {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-layout-test-"));
  try {
    await fn(temporaryRoot);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function withTemporaryCommandRoot(fn) {
  await withTemporaryDirectory(async (temporaryRoot) => {
    const directoryInputs = [SFLM_PHYSICAL_SOURCE_ROOT, SFLM_FIXTURE_ROOT];
    const fileInputs = [SFLM_MAPPING_PATH, SFLM_LAYOUT_PACKAGE_PATH, SFLM_P2_EVIDENCE_PATH, SFLM_P2_CATALOG_PATH, SFLM_SFP_EVIDENCE_PATH];
    for (const directory of directoryInputs) await fs.mkdir(path.join(temporaryRoot, directory), { recursive: true });
    for (const file of fileInputs) {
      await fs.mkdir(path.dirname(path.join(temporaryRoot, file)), { recursive: true });
      await fs.writeFile(path.join(temporaryRoot, file), "{}");
    }
    await fn(temporaryRoot);
  });
}
