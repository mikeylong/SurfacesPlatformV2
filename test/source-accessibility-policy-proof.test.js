import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { canonicalJson, runInterfacectl } from "../src/p0.js";
import { rawFileHash, sha256Hex } from "../src/p2-contract.js";
import {
  SAP_ARTIFACT_PATHS,
  SAP_ARTIFACT_ROOT,
  SAP_COMMAND,
  SAP_CONTRACT_ID,
  SAP_FIXTURE_ROOT,
  SAP_GENERATED_ARTIFACTS,
  SAP_P2_CATALOG_PATH,
  SAP_P2_EVIDENCE_PATH,
  SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
  SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
  SAP_SOURCE_ROOT,
  sapFixturePaths,
  sapSchemaPaths,
  sapSourcePaths
} from "../src/source-accessibility-policy-contract.js";
import { sourceAccessibilityPolicyInternals } from "../src/source-accessibility-policy-proof.js";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const evidencePath = `${SAP_ARTIFACT_ROOT}/evidence.json`;
const reportPath = `${SAP_ARTIFACT_ROOT}/accessibility-policy-conformance-report.json`;
const coveragePath = `${SAP_ARTIFACT_ROOT}/accessibility-policy-coverage.json`;
const authorityMapPath = `${SAP_ARTIFACT_ROOT}/accessibility-policy-authority-map.json`;
const reviewQueuePath = `${SAP_ARTIFACT_ROOT}/accessibility-policy-review-queue.json`;
const declarationPath = `${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`;
const accessibilityPolicyPath = "sources/source-conformance/declared-source-bundle/policies/accessibility.json";
const authorityProfilePath = "sources/source-conformance/declared-source-bundle/governance/authority-profile.json";
const p2SourceInventoryPath = "artifacts/p2/source-inventory.json";
const stalePath = `${SAP_ARTIFACT_ROOT}/stale.tmp`;

const expectedCommandArgs = {
  source: SAP_SOURCE_ROOT,
  ingestionEvidence: SAP_P2_EVIDENCE_PATH,
  catalog: SAP_P2_CATALOG_PATH,
  sourceConformanceEvidence: SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  sourceConformanceCatalog: SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
  sourceFamilyPackagingEvidence: SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
  fixture: SAP_FIXTURE_ROOT,
  out: SAP_ARTIFACT_ROOT
};

test("source accessibility policy CLI emits an exact deterministic proof closure", async () => {
  const p2CatalogBefore = await fs.readFile(path.join(root, SAP_P2_CATALOG_PATH));
  const first = await runProof();
  assert.match(first.stdout, /surfaces source-accessibility-policy proof: pass/);
  assert.match(first.stdout, /promotionStatus: review_required/);
  assert.match(first.stdout, /structuredDeclarationsOnly: true/);

  const evidence = await readJson(evidencePath);
  assert.equal(evidence.contractId, SAP_CONTRACT_ID);
  assert.equal(evidence.schemaId, "source-accessibility-policy-evidence.v0");
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.structuredDeclarationsOnly, true);
  assert.equal(evidence.catalogCapabilityAdded, false);
  assert.deepEqual(evidence.args, expectedCommandArgs);
  assert.deepEqual(evidence.schemaClosure.map((entry) => entry.path), sapSchemaPaths());
  assert.deepEqual(evidence.sourceFileRefs.map((entry) => entry.path), sapSourcePaths());
  assert.deepEqual(evidence.fixtureRefs.map((entry) => entry.path), sapFixturePaths());
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), SAP_ARTIFACT_PATHS);
  assert.deepEqual((await fs.readdir(path.join(root, SAP_ARTIFACT_ROOT))).sort(), [...SAP_GENERATED_ARTIFACTS].sort());
  assert.equal(
    evidence.artifacts.at(-1).hash,
    sourceAccessibilityPolicyInternals.computeEvidenceSelfHash(evidence)
  );
  assert.equal(
    await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, evidence),
    null
  );

  const firstBytes = await artifactBytes();
  await runProof();
  assert.deepEqual(await artifactBytes(), firstBytes);
  assert.deepEqual(await fs.readFile(path.join(root, SAP_P2_CATALOG_PATH)), p2CatalogBefore);
});

test("global CLI usage and package scripts expose the fixed proof paths", async () => {
  let stderr = "";
  const exitCode = await runInterfacectl(["surfaces", "source-accessibility-policy"], {
    cwd: root,
    stdout: { write() {} },
    stderr: { write(value) { stderr += value; } }
  });
  assert.equal(exitCode, 2);
  assert.match(stderr, /usage: interfacectl surfaces source-accessibility-policy proof/);
  for (const value of Object.values(expectedCommandArgs)) assert.match(stderr, new RegExp(escapeRegExp(value)));

  const packageJson = await readJson("package.json");
  const expectedProofScript = [
    "node bin/interfacectl.js surfaces source-accessibility-policy proof",
    `--source ${SAP_SOURCE_ROOT}`,
    `--ingestion-evidence ${SAP_P2_EVIDENCE_PATH}`,
    `--catalog ${SAP_P2_CATALOG_PATH}`,
    `--source-conformance-evidence ${SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH}`,
    `--source-conformance-catalog ${SAP_SOURCE_CONFORMANCE_CATALOG_PATH}`,
    `--source-family-packaging-evidence ${SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH}`,
    `--fixture ${SAP_FIXTURE_ROOT}`,
    `--out ${SAP_ARTIFACT_ROOT}`
  ].join(" ");
  assert.equal(packageJson.scripts["proof:source-accessibility-policy"], expectedProofScript);
  assert.match(packageJson.scripts["materialize:source-accessibility-policy"], /materialize:source-family-packaging/);
  assert.match(packageJson.scripts["check:source-accessibility-policy:ci"], /check:source-family-packaging:ci/);
});

test("policy requirement strings remain opaque hashes and only structured assertions affect behavior", async () => {
  const source = await readJson(declarationPath);
  const policy = await readJson(accessibilityPolicyPath);
  const catalog = await readJson(SAP_P2_CATALOG_PATH);
  const coverage = await readJson(coveragePath);

  assert.equal(source.authorityMode, "structured-assertions-only");
  assert.equal(source.declarations.length, policy.requirements.length);
  for (const declaration of source.declarations) {
    const match = declaration.policyRef.match(/#\/requirements\/([0-9]+)$/);
    assert.ok(match, declaration.policyRef);
    const requirement = policy.requirements[Number(match[1])];
    assert.equal(
      declaration.policyRequirementValueHash,
      sha256Hex(canonicalJson(requirement)),
      declaration.behaviorId
    );
    const behavior = coverage.behaviors.find((entry) => entry.behaviorId === declaration.behaviorId);
    assert.equal(behavior.policyRequirementValueHash, declaration.policyRequirementValueHash);
  }

  const accessibleName = structuredClone(source.declarations.find((entry) => entry.behaviorId === "button-accessible-name"));
  const misleadingLabels = {
    ...accessibleName,
    behaviorId: "this-label-does-not-authorize-runtime-compliance",
    behaviorKind: "status-announcement",
    policyRequirementValueHash: "0".repeat(64)
  };
  const stillAssertionDriven = sourceAccessibilityPolicyInternals.evaluateDeclaration(misleadingLabels, catalog);
  assert.equal(stillAssertionDriven.status, "allowed");
  assert.equal(stillAssertionDriven.assertions[0].matched, true);

  const structuredConflict = structuredClone(accessibleName);
  structuredConflict.assertions[0].expectedValue = "author-supplied-prose";
  const conflictResult = sourceAccessibilityPolicyInternals.evaluateDeclaration(structuredConflict, catalog);
  assert.equal(conflictResult.status, "blocked");
  assert.equal(conflictResult.assertions[0].matched, false);

  const freeFormResult = (await readJson(reportPath)).validationResults.find((entry) =>
    entry.fixturePath.endsWith("invalid/free-form-policy-text.source-accessibility-policy.json")
  );
  assert.deepEqual(freeFormResult.diagnosticCodes, ["SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN"]);
  assert.equal(freeFormResult.promotionStatus, "blocked");
});

test("assertion provenance requires the declaration, opaque policy, and checked fact refs", async () => {
  const fixture = await readJson(`${SAP_FIXTURE_ROOT}/invalid/source-ref-missing.source-accessibility-policy.json`);
  const declaration = fixture.declarationOverride;
  const assertion = declaration.assertions[0];
  const catalog = await readJson(SAP_P2_CATALOG_PATH);
  assert.equal(assertion.sourceRefs.some((ref) => ref.includes("components/not-button.json")), true);
  assert.equal(sourceAccessibilityPolicyInternals.assertionSourceRefsValid(declaration, assertion, catalog), false);

  const repaired = structuredClone(assertion);
  repaired.sourceRefs = repaired.sourceRefs.map((ref) =>
    ref.includes("components/not-button.json") ? catalog.components.Button.accessibility.sourceRef : ref
  );
  assert.equal(sourceAccessibilityPolicyInternals.assertionSourceRefsValid(declaration, repaired, catalog), true);

  const row = (await readJson(reportPath)).validationResults.find((entry) => entry.fixturePath === `${SAP_FIXTURE_ROOT}/invalid/source-ref-missing.source-accessibility-policy.json`);
  assert.deepEqual(row.diagnosticCodes, ["SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING"]);
  assert.equal(row.promotionStatus, "blocked");
});

test("allowed, review-required, and blocked outcomes stay distinct and review stays inert", async () => {
  const coverage = await readJson(coveragePath);
  const report = await readJson(reportPath);
  const reviewQueue = await readJson(reviewQueuePath);
  const expectations = await readJson(`${SAP_FIXTURE_ROOT}/expectations.manifest.json`);
  const authorityProfile = await readJson(authorityProfilePath);

  assert.deepEqual(coverage.summary, {
    behaviorCount: 5,
    allowedCount: 3,
    reviewRequiredCount: 2,
    blockedCount: 0
  });
  assert.deepEqual(
    Object.fromEntries(coverage.behaviors.map((entry) => [entry.behaviorId, entry.status])),
    {
      "button-accessible-name": "allowed",
      "button-keyboard-activation": "allowed",
      "button-focus-visible": "review_required",
      "inline-alert-status-announcement": "allowed",
      "button-contrast-token": "review_required"
    }
  );
  assert.deepEqual(coverage.summary, expectations.runExpectation.summary);
  assert.deepEqual(
    coverage.behaviors.map(({ behaviorId, status }) => ({ behaviorId, status })),
    expectations.runExpectation.behaviorStatuses
  );
  assert.equal(report.status, "pass");
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(report.validationResults.every((entry) => entry.matched), true);

  assert.deepEqual(reviewQueue.summary, { itemCount: 3, executableCount: 0 });
  assert.equal(reviewQueue.items.every((entry) => entry.executable === false), true);
  assert.equal(reviewQueue.items.every((entry) => entry.status === "review_required"), true);
  assert.equal(reviewQueue.items.every((entry) => entry.owner === "design-systems-governance"), true);
  const checkedRoute = authorityProfile.reviewRoutes.find((entry) => entry.routeId === "design-systems-governance");
  assert.equal(reviewQueue.items.every((entry) => entry.rationale === checkedRoute.rationale), true);
  assert.equal(reviewQueue.items.every((entry) => entry.expiresAt === "1970-01-31T00:00:00.000Z"), true);
  assert.equal(reviewQueue.items.every((entry) => entry.requiredSourceRefs.includes(entry.policyRef)), true);

  for (const [suffix, expectedCode] of [
    ["invalid/policy-catalog-conflict.source-accessibility-policy.json", "SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT"],
    ["invalid/unsupported-behavior.source-accessibility-policy.json", "SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED"],
    ["invalid/authority-escalation.source-accessibility-policy.json", "SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION"],
    ["invalid/precedence-unresolved.source-accessibility-policy.json", "SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED"]
  ]) {
    const row = report.validationResults.find((entry) => entry.fixturePath.endsWith(suffix));
    assert.equal(row.actualResult, "invalid", suffix);
    assert.equal(row.promotionStatus, "blocked", suffix);
    assert.deepEqual(row.diagnosticCodes, [expectedCode], suffix);
  }
});

test("missing focus-visible and contrast facts are not inferred from names, states, or tokens", async () => {
  const catalog = await readJson(SAP_P2_CATALOG_PATH);
  const coverage = await readJson(coveragePath);
  const focus = coverage.behaviors.find((entry) => entry.behaviorId === "button-focus-visible");
  const contrast = coverage.behaviors.find((entry) => entry.behaviorId === "button-contrast-token");

  assert.ok(catalog.components.Button.states.focus);
  assert.ok(Object.keys(catalog.components.Button.tokenRefs).length > 0);
  assert.equal(focus.assertions[0].catalogPointer, "/components/Button/accessibility/focusVisible");
  assert.equal(focus.assertions[0].actualValueHash, null);
  assert.equal(focus.assertions[0].matched, false);
  assert.equal(focus.status, "review_required");
  assert.equal(contrast.assertions[0].catalogPointer, "/components/Button/tokenRefs/contrast-token");
  assert.equal(contrast.assertions[0].actualValueHash, null);
  assert.equal(contrast.assertions[0].matched, false);
  assert.equal(contrast.status, "review_required");
});

test("repairing the structured conflict fixture removes its blocked causal condition", async () => {
  const catalog = await readJson(SAP_P2_CATALOG_PATH);
  const fixture = await readJson(`${SAP_FIXTURE_ROOT}/invalid/policy-catalog-conflict.source-accessibility-policy.json`);
  const conflict = sourceAccessibilityPolicyInternals.evaluateDeclaration(fixture.declarationOverride, catalog);
  assert.equal(conflict.status, "blocked");
  assert.equal(conflict.assertions[0].matched, false);

  const repaired = structuredClone(fixture.declarationOverride);
  repaired.assertions[0].expectedValue = catalog.components.Button.accessibility.role;
  const repairedResult = sourceAccessibilityPolicyInternals.evaluateDeclaration(repaired, catalog);
  assert.equal(repairedResult.status, "allowed");
  assert.equal(repairedResult.assertions[0].matched, true);
});

test("structured source byte drift fails its manifest hash and restores exactly", async () => {
  const absolutePath = path.join(root, declarationPath);
  const originalHash = await rawFileHash(absolutePath);
  await withJsonFileMutation(absolutePath, (source) => {
    source.declarations[0].assertions[0].expectedValue = "tampered-content-source";
  }, async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH/);
  });
  assert.equal(await rawFileHash(absolutePath), originalHash);
});

test("the closed source contract enforces exactly five behaviors and unambiguous exists assertions", async () => {
  const absolutePath = path.join(root, declarationPath);
  const originalHash = await rawFileHash(absolutePath);
  await withJsonFileMutation(absolutePath, (source) => {
    const extra = structuredClone(source.declarations[0]);
    extra.behaviorId = "sixth-unproved-behavior";
    source.declarations.push(extra);
  }, async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /source-accessibility-behavior-declarations\.v0/);
  });
  await withJsonFileMutation(absolutePath, (source) => {
    source.declarations.find((entry) => entry.behaviorId === "button-contrast-token").assertions[0].expectedValue = false;
  }, async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /source-accessibility-behavior-declarations\.v0/);
  });
  assert.equal(await rawFileHash(absolutePath), originalHash);
});

test("upstream evidence hash drift fails closed and restores exactly", async () => {
  const absolutePath = path.join(root, SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH);
  const originalHash = await rawFileHash(absolutePath);
  await withJsonFileMutation(absolutePath, (evidence) => {
    evidence.boundaryRefs[0].hash = "0".repeat(64);
  }, async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH/);
  });
  assert.equal(await rawFileHash(absolutePath), originalHash);
});

test("non-catalog P2 closure drift fails full upstream integrity and restores exactly", async () => {
  const absolutePath = path.join(root, p2SourceInventoryPath);
  const originalHash = await rawFileHash(absolutePath);
  await withJsonFileMutation(absolutePath, (inventory) => {
    inventory.version = "tampered-p2-closure";
  }, async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH/);
  });
  assert.equal(await rawFileHash(absolutePath), originalHash);
});

test("artifact, report, and boundary tampering fail evidence integrity", async () => {
  await runProof();
  const evidence = await readJson(evidencePath);

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(
    await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, artifactTamper),
    "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"
  );

  const boundaryTamper = structuredClone(evidence);
  boundaryTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(
    await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, boundaryTamper),
    "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"
  );

  const argsTamper = structuredClone(evidence);
  argsTamper.args.source = "sources/source-accessibility-policy-tampered";
  argsTamper.artifacts.at(-1).hash = sourceAccessibilityPolicyInternals.computeEvidenceSelfHash(argsTamper);
  assert.equal(
    await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, argsTamper),
    "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"
  );

  const absoluteReportPath = path.join(root, reportPath);
  await withJsonFileMutation(absoluteReportPath, (report) => {
    report.structuredDeclarationsOnly = false;
  }, async () => {
    assert.equal(
      await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, evidence),
      "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"
    );
  });
  assert.equal(
    await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(root, evidence),
    null
  );
});

test("stale output and non-normalized CLI paths are rejected before proof output", async () => {
  await fs.writeFile(path.join(root, stalePath), "stale");
  try {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected source accessibility policy output/);
  } finally {
    await fs.rm(path.join(root, stalePath), { force: true });
  }

  const invalidArgs = proofArgs();
  invalidArgs[invalidArgs.indexOf("--source") + 1] = "sources/source-accessibility-policy/../source-accessibility-policy";
  const invalidPathResult = await runCommandExpectFailure(invalidArgs);
  assert.equal(invalidPathResult.code, 2);
  assert.match(invalidPathResult.stderr, /without \. or \.\. segments/);
});

test("the proof records reconciliation only, never runtime compliance or P2 expansion", async () => {
  const evidence = await readJson(evidencePath);
  const report = await readJson(reportPath);
  const authorityMap = await readJson(authorityMapPath);
  const coverage = await readJson(coveragePath);

  assert.equal(evidence.structuredDeclarationsOnly, true);
  assert.equal(report.structuredDeclarationsOnly, true);
  assert.equal(evidence.catalogCapabilityAdded, false);
  assert.equal(report.catalogCapabilityAdded, false);
  assert.equal(authorityMap.catalogCapabilityAdded, false);
  assert.equal(SAP_ARTIFACT_PATHS.some((entry) => entry.endsWith("governed-catalog.json")), false);
  assert.deepEqual([...new Set(authorityMap.bindings.map((entry) => entry.componentId))].sort(), ["Button", "InLineAlert"]);
  assert.equal(authorityMap.bindings.every((entry) => entry.catalogPointers.every((pointer) =>
    pointer.startsWith(`/components/${entry.componentId}/accessibility/`) ||
    pointer.startsWith(`/components/${entry.componentId}/tokenRefs/`)
  )), true);

  const statusAnnouncement = coverage.behaviors.find((entry) => entry.behaviorId === "inline-alert-status-announcement");
  assert.equal(statusAnnouncement.status, "allowed");
  for (const field of [
    "runtimeAccessibilityCompliance",
    "runtimeCompliance",
    "productionAdapter",
    "liveConnector",
    "liveJudgmentKit"
  ]) {
    assert.equal(Object.hasOwn(evidence, field), false, field);
    assert.equal(Object.hasOwn(report, field), false, field);
    assert.equal(Object.hasOwn(statusAnnouncement, field), false, field);
  }
});

async function runProof() {
  return execFileAsync(process.execPath, proofArgs(), { cwd: root, maxBuffer: 10 * 1024 * 1024 });
}

async function runProofExpectFailure() {
  return runCommandExpectFailure(proofArgs());
}

function proofArgs() {
  return [
    "bin/interfacectl.js",
    "surfaces",
    "source-accessibility-policy",
    "proof",
    "--source",
    SAP_SOURCE_ROOT,
    "--ingestion-evidence",
    SAP_P2_EVIDENCE_PATH,
    "--catalog",
    SAP_P2_CATALOG_PATH,
    "--source-conformance-evidence",
    SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
    "--source-conformance-catalog",
    SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
    "--source-family-packaging-evidence",
    SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
    "--fixture",
    SAP_FIXTURE_ROOT,
    "--out",
    SAP_ARTIFACT_ROOT
  ];
}

async function runCommandExpectFailure(args) {
  try {
    await execFileAsync(process.execPath, args, { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    assert.fail("expected source accessibility policy command to fail");
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    };
  }
}

async function withJsonFileMutation(absolutePath, mutate, fn) {
  const original = await fs.readFile(absolutePath, "utf8");
  try {
    const value = JSON.parse(original);
    mutate(value);
    await fs.writeFile(absolutePath, canonicalJson(value));
    await fn();
  } finally {
    await fs.writeFile(absolutePath, original);
  }
}

async function artifactBytes() {
  return Promise.all(SAP_ARTIFACT_PATHS.map((relativePath) => fs.readFile(path.join(root, relativePath))));
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
