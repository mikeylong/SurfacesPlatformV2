import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { canonicalJson, runInterfacectl } from "../src/p0.js";
import { rawFileHash, readJson, sha256Hex } from "../src/p2-contract.js";
import { SC_SOURCE_ROOT } from "../src/source-conformance-contract.js";
import {
  SFP_ARTIFACT_PATHS,
  SFP_CANDIDATE_SOURCE_ROOT,
  SFP_CAPTURED_ARTIFACTS,
  SFP_PACKAGE_PATH,
  sfpCandidateEvidenceRemap,
  sfpFixturePaths,
  sfpReferencedReviewRoutes,
  sfpSchemaPaths
} from "../src/source-family-packaging-contract.js";
import { sourceFamilyPackagingInternals } from "../src/source-family-packaging-proof.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);

test("source-family packaging evidence closes over the second bundle and unchanged compiler", async () => {
  const evidence = await readJson(path.join(root, "artifacts/source-family-packaging/evidence.json"));
  const report = await readJson(path.join(root, "artifacts/source-family-packaging/source-family-packaging-report.json"));
  const packageFixture = await readJson(path.join(root, SFP_PACKAGE_PATH));

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.deepEqual(evidence.schemaClosure.map((entry) => entry.path), sfpSchemaPaths());
  assert.deepEqual(evidence.fixtureRefs.map((entry) => entry.path), sfpFixturePaths());
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), SFP_ARTIFACT_PATHS);
  assert.deepEqual(evidence.compilerRefs.map((entry) => entry.path), packageFixture.compiler.implementationRefs.map((entry) => entry.path));
  assert.equal(evidence.compilerRefs.every((entry, index) => entry.hash === packageFixture.compiler.implementationRefs[index].hash), true);
  assert.equal(evidence.candidateSourceRefs.length, 11);
  assert.equal(evidence.candidateSourceRefs.every((entry) => entry.path.startsWith(packageFixture.candidateBundle.sourceRoot)), true);
  assert.deepEqual(report.compilerExecutions, { acceptedBundlePasses: 2, causalProbeFailures: 1, total: 3 });
  assert.equal(report.sourceBytesPreserved, true);
  assert.equal(report.candidateEvidenceClosureVerified, true);
  assert.deepEqual(report.candidateEvidenceRemap, sfpCandidateEvidenceRemap());
  assert.equal(report.primaryRun.compilerExecuted, true);
  assert.equal(report.primaryRun.compilerExitCode, 0);
  assert.equal(report.primaryRun.evidenceIntegrityVerified, true);
  assert.equal(report.primaryRun.artifactClosureVerified, true);
  assert.equal(report.candidateRun.compilerExecuted, true);
  assert.equal(report.candidateRun.compilerExitCode, 0);
  assert.equal(report.candidateRun.evidenceIntegrityVerified, true);
  assert.equal(report.candidateRun.artifactClosureVerified, true);
  assert.equal(report.capabilityComparison.compilerImplementationReused, true);
  assert.equal(report.capabilityComparison.familySpecificModule, null);
  assert.equal(report.capabilityComparison.authorityExpanded, false);
  assert.equal(report.authorityExpansionProbe.diagnosticCode, "SOURCE_FACT_AUTHORITY_ESCALATION");
  assert.equal(report.authorityExpansionProbe.blocked, true);
  assert.equal(Object.values(report.distinctness).every(Boolean), true);
  assert.notEqual(report.primaryRun.sourceBundleId, report.candidateRun.sourceBundleId);
  assert.notEqual(report.primaryRun.owner, report.candidateRun.owner);
  assert.deepEqual(report.candidateRun.componentIds, ["Button", "InLineAlert"]);
  assert.deepEqual(evidence.runtimeRefs.map((entry) => entry.path), packageFixture.compiler.runtime.dependencyRefs.map((entry) => entry.path));
  assert.deepEqual(packageFixture.compiler.implementationRefs.map((entry) => entry.path), [
    "bin/interfacectl.js",
    "scripts/materialize-source-conformance.mjs",
    "src/p0.js",
    "src/p2-contract.js",
    "src/p2-proof.js",
    "src/source-conformance-contract.js",
    "src/source-conformance-proof.js"
  ]);
  assert.equal(packageFixture.compiler.runtime.nodeMajor, 22);
});

test("packaged candidate preserves every accepted P2 catalog capability field", async () => {
  const p2Catalog = await readJson(path.join(root, "artifacts/p2/governed-catalog.json"));
  const candidateCatalog = await readJson(path.join(root, "artifacts/source-family-packaging/candidate-governed-catalog.json"));
  const report = await readJson(path.join(root, "artifacts/source-family-packaging/source-family-packaging-report.json"));
  const fields = ["catalogId", "artifactKind", "schemaId", "version", "tokens", "components", "runtimeCapabilities", "diagnostics", "compatibility"];

  assert.deepEqual(report.capabilityComparison.immutableFields.map((entry) => entry.field), fields);
  for (const field of fields) assert.equal(canonicalJson(candidateCatalog[field]), canonicalJson(p2Catalog[field]), field);
  assert.equal(canonicalJson(candidateCatalog).includes("expressive"), false);
  assert.deepEqual(Object.keys(candidateCatalog.components).sort(), ["Button", "InLineAlert"]);
});

test("normalized fact tuples reject an allowed supporting-source value change", async () => {
  const primaryManifest = await readJson(path.join(root, `${SC_SOURCE_ROOT}/manifest.json`));
  const candidateManifest = await readJson(path.join(root, `${SFP_CANDIDATE_SOURCE_ROOT}/manifest.json`));
  const primaryCoverage = await readJson(path.join(root, "artifacts/source-conformance/source-fact-coverage.json"));
  const candidateCoverage = await readJson(path.join(root, "artifacts/source-family-packaging/candidate-source-fact-coverage.json"));
  const primaryValueIndex = await sourceFamilyPackagingInternals.buildSourceFactValueIndex(root, SC_SOURCE_ROOT, primaryManifest);
  const candidateValueIndex = await sourceFamilyPackagingInternals.buildSourceFactValueIndex(root, SFP_CANDIDATE_SOURCE_ROOT, candidateManifest);
  const primaryTuples = sourceFamilyPackagingInternals.factTuples(primaryCoverage, primaryValueIndex);
  const candidateTuples = sourceFamilyPackagingInternals.factTuples(candidateCoverage, candidateValueIndex);
  assert.deepEqual(candidateTuples, primaryTuples);

  const supportingFactRef = "declared-source://source-conformance/components/button-acquired-a.json#/facts/0/value";
  const narrowedValueIndex = new Map(candidateValueIndex);
  narrowedValueIndex.set(supportingFactRef, sha256Hex(canonicalJson(["accent", "primary"])));
  const narrowedTuples = sourceFamilyPackagingInternals.factTuples(candidateCoverage, narrowedValueIndex);
  const acceptedVariant = candidateTuples.find((entry) => entry.catalogPointer === "/components/Button/props/variant/allowedValues");
  const narrowedVariant = narrowedTuples.find((entry) => entry.catalogPointer === "/components/Button/props/variant/allowedValues");

  assert.equal(narrowedVariant.catalogValueHash, acceptedVariant.catalogValueHash);
  assert.equal(narrowedVariant.status, acceptedVariant.status);
  assert.equal(narrowedVariant.conflict, acceptedVariant.conflict);
  assert.equal(narrowedVariant.resolution, acceptedVariant.resolution);
  assert.notDeepEqual(narrowedVariant.supportingFacts, acceptedVariant.supportingFacts);
  assert.throws(
    () => sourceFamilyPackagingInternals.assertMatchingFactTuples(primaryTuples, narrowedTuples),
    /SOURCE_FAMILY_SCOPE_EXPANSION: packaged source facts differ from accepted source facts/
  );
});

test("outer evidence binds every captured compiler artifact and detects tampering", async () => {
  const evidence = await readJson(path.join(root, "artifacts/source-family-packaging/evidence.json"));
  assert.deepEqual(
    evidence.artifacts.slice(0, SFP_CAPTURED_ARTIFACTS.length).map((entry) => path.basename(entry.path)),
    SFP_CAPTURED_ARTIFACTS.map(([file]) => file)
  );
  assert.equal(await sourceFamilyPackagingInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);

  const tampered = structuredClone(evidence);
  tampered.artifacts[0].hash = "0".repeat(64);
  assert.equal(
    await sourceFamilyPackagingInternals.firstEvidenceIntegrityFailureCode(root, tampered),
    "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH"
  );
});

test("persisted candidate evidence re-verifies after its compiler workspace is removed", async () => {
  const evidence = await readJson(path.join(root, "artifacts/source-family-packaging/evidence.json"));
  assert.equal(
    await sourceFamilyPackagingInternals.firstPersistedCandidateEvidenceIntegrityFailureCode(root, evidence.candidateEvidenceRemap),
    null
  );

  const tampered = structuredClone(evidence.candidateEvidenceRemap);
  tampered.artifactMappings[0].persistedPath = "artifacts/source-family-packaging/candidate-governed-catalog.json";
  assert.equal(
    await sourceFamilyPackagingInternals.firstPersistedCandidateEvidenceIntegrityFailureCode(root, tampered),
    "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH"
  );
});

test("referenced review routes, not array position, determine the active candidate owner", async () => {
  const profile = await readJson(path.join(root, "sources/source-family-packaging/team-owned-authority-bundle/governance/authority-profile.json"));
  const withDecoy = structuredClone(profile);
  withDecoy.reviewRoutes.unshift({
    ...withDecoy.reviewRoutes[0],
    routeId: "unused-decoy-route",
    owner: "incorrect-unused-owner"
  });
  const resolution = sfpReferencedReviewRoutes(withDecoy);
  assert.equal(resolution.valid, true);
  assert.deepEqual(resolution.routeIds, ["product-team-design-owners"]);
  assert.deepEqual(resolution.owners, ["product-design-system-owners"]);
});

test("global CLI usage advertises the reusable source-family packaging command", async () => {
  let stderr = "";
  const exitCode = await runInterfacectl(["surfaces", "source-family-packaging"], {
    cwd: root,
    stdout: { write() {} },
    stderr: { write(value) { stderr += value; } }
  });
  assert.equal(exitCode, 2);
  assert.match(stderr, /usage: interfacectl surfaces source-family-packaging proof --package fixtures\/source-family-packaging\/package\.fixture\.json/);
});

test("packaging materialization never rewrites the team-owned package or source bytes", async () => {
  const packageFixture = await readJson(path.join(root, SFP_PACKAGE_PATH));
  const manifest = await readJson(path.join(root, packageFixture.candidateBundle.manifestPath));
  const paths = [
    SFP_PACKAGE_PATH,
    packageFixture.candidateBundle.manifestPath,
    ...manifest.sourceFiles.map((entry) => `${packageFixture.candidateBundle.sourceRoot}/${entry.path}`)
  ];
  const before = await Promise.all(paths.map((entry) => rawFileHash(path.join(root, entry))));
  const { materializeSourceFamilyPackagingContract } = await import("../src/source-family-packaging-contract.js");
  await materializeSourceFamilyPackagingContract(root);
  const after = await Promise.all(paths.map((entry) => rawFileHash(path.join(root, entry))));
  assert.deepEqual(after, before);
});

test("candidate evidence capture is byte-deterministic across proof materialization", async () => {
  const paths = SFP_ARTIFACT_PATHS.filter((entry) => !entry.endsWith("/evidence.json"));
  const before = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry), "utf8")));
  const { runSourceFamilyPackagingProof } = await import("../src/source-family-packaging-proof.js");
  await runSourceFamilyPackagingProof({
    cwd: root,
    packagePath: SFP_PACKAGE_PATH,
    ingestionEvidencePath: "artifacts/p2/evidence.json",
    catalogPath: "artifacts/p2/governed-catalog.json",
    primaryEvidencePath: "artifacts/source-conformance/evidence.json",
    primaryCatalogPath: "artifacts/source-conformance/governed-catalog.json",
    fixtureRoot: "fixtures/source-family-packaging",
    outRoot: "artifacts/source-family-packaging",
    command: "interfacectl surfaces source-family-packaging proof",
    args: {
      package: SFP_PACKAGE_PATH,
      ingestionEvidence: "artifacts/p2/evidence.json",
      catalog: "artifacts/p2/governed-catalog.json",
      sourceConformanceEvidence: "artifacts/source-conformance/evidence.json",
      sourceConformanceCatalog: "artifacts/source-conformance/governed-catalog.json",
      fixture: "fixtures/source-family-packaging",
      out: "artifacts/source-family-packaging"
    }
  });
  const after = await Promise.all(paths.map((entry) => fs.readFile(path.join(root, entry), "utf8")));
  assert.deepEqual(after, before);
});
