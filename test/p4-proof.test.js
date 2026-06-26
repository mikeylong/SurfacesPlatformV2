import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { p3Internals } from "../src/p3-proof.js";
import { p4Internals } from "../src/p4-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p3EvidencePath = path.join(root, "artifacts/p3/evidence.json");
const p3ReviewQueuePath = path.join(root, "artifacts/p3/review-queue.json");
const p4StalePath = path.join(root, "artifacts/p4/stale.tmp");

test("P4 review proof emits passing evidence with final self-hash", async () => {
  await runP4Proof();
  const evidence = await readJson("artifacts/p4/evidence.json");
  const report = await readJson("artifacts/p4/review-judgment-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "blocked");
  assert.equal(evidence.validationResults.length, 18);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/p4/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, p4Internals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/p4/surfaceops-decision-ledger.json",
    "artifacts/p4/judgmentkit-evaluation-report.json",
    "artifacts/p4/review-judgment-report.json",
    "artifacts/p4/evidence.json"
  ]);
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
});

test("P4 decision ledger is evidence-backed and non-executable", async () => {
  await runP4Proof();
  const ledger = await readJson("artifacts/p4/surfaceops-decision-ledger.json");
  const schema = await readJson("schemas/surfaceops-decision-ledger.v0.schema.json");
  const validate = compileSchema(schema);

  assert.equal(ledger.schemaId, "surfaceops-decision-ledger.v0");
  assert.equal(validate(ledger), true);
  assert.equal(ledger.decisions.length, 4);
  assert.equal(ledger.promotionStatus, "blocked");
  for (const decision of ledger.decisions) {
    assert.equal(decision.nonExecutable, true);
    assert.equal(decision.execution.authorized, false);
    assert.deepEqual(decision.execution.shellCommands, []);
    assert.deepEqual(decision.execution.toolCalls, []);
    assert.deepEqual(decision.execution.connectorCalls, []);
    assert.deepEqual(decision.execution.networkCalls, []);
    assert.deepEqual(decision.execution.fileEdits, []);
    assert.deepEqual(decision.execution.secrets, []);
    assert.deepEqual(decision.execution.callbacks, []);
    assert.equal(decision.reviewItemId, "review.review-required-work");
    assert.ok(decision.evidenceRefs.some((ref) => ref.path === "artifacts/p3/evidence.json"));
    assert.ok(decision.evidenceRefs.some((ref) => ref.path === "artifacts/p3/review-queue.json"));
    assert.equal(decision.fixtureRef.schemaId, "review-judgment-fixture.v0");
  }

  const tampered = structuredClone(ledger);
  tampered.decisions[0].execution.shellCommands.push("npm run proof:p3");
  assert.equal(validate(tampered), false);
});

test("P4 JudgmentKit report is evaluation-only", async () => {
  await runP4Proof();
  const evaluationReport = await readJson("artifacts/p4/judgmentkit-evaluation-report.json");
  const evidence = await readJson("artifacts/p4/evidence.json");
  const schema = await readJson("schemas/judgmentkit-evaluation-report.v0.schema.json");
  const validate = compileSchema(schema);

  assert.equal(evaluationReport.schemaId, "judgmentkit-evaluation-report.v0");
  assert.equal(validate(evaluationReport), true);
  assert.equal(evaluationReport.aggregateResult, "warn");
  assert.equal(evaluationReport.findings.length, 1);
  for (const finding of evaluationReport.findings) {
    assert.ok(["activity_fit", "contract_quality", "evidence_quality", "handoff_quality"].includes(finding.dimension));
    assert.ok(["info", "warning", "error"].includes(finding.severity));
    assert.deepEqual(finding.evidenceRefs.map((ref) => ref.path), [
      "artifacts/p3/evidence.json",
      "artifacts/p3/review-queue.json"
    ]);
    assert.deepEqual(finding.affectedArtifactPaths, [
      "artifacts/p3/evidence.json",
      "artifacts/p3/review-queue.json"
    ]);
    assert.deepEqual(finding.authority, {
      approves: false,
      rejects: false,
      requestsChanges: false,
      defers: false,
      routes: false,
      promotes: false,
      mutates: false,
      renders: false,
      executes: false,
      overridesPolicy: false
    });
  }

  const tamperedAuthority = structuredClone(evaluationReport);
  tamperedAuthority.findings[0].authority.approves = true;
  assert.equal(validate(tamperedAuthority), false);

  const tamperedRef = structuredClone(evaluationReport);
  tamperedRef.findings[0].evidenceRefs[1].hash = "0".repeat(64);
  assert.equal(validate(tamperedRef), false);

  const tamperedAffectedPath = structuredClone(evaluationReport);
  tamperedAffectedPath.findings[0].affectedArtifactPaths[0] = "artifacts/p2/governed-catalog.json";
  assert.equal(validate(tamperedAffectedPath), false);

  const invalidBoundaryRef = evidence.validationResults.find((result) =>
    result.fixturePath === "fixtures/p4/invalid/judgmentkit-missing-boundary-ref.review-judgment.json"
  );
  assert.deepEqual(invalidBoundaryRef.diagnosticCodes, ["JUDGMENTKIT_EVIDENCE_REF_MISSING"]);
  assert.equal(invalidBoundaryRef.actualResult, "invalid");
});

test("P4 preflight rejects missing, failing, mismatched, and stale P3 inputs before ledger write", async () => {
  await runP4Proof();
  const originalP4Artifacts = await snapshotP4Artifacts();
  const originalEvidence = await fs.readFile(p3EvidencePath, "utf8");
  const originalQueue = await fs.readFile(p3ReviewQueuePath, "utf8");

  await fs.rm(p3EvidencePath, { force: true });
  try {
    const result = await runP4ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream evidence input is missing/);
    await assertP4ArtifactsUnchanged(originalP4Artifacts);
  } finally {
    await fs.writeFile(p3EvidencePath, originalEvidence);
  }

  await withJsonFileMutations([
    {
      absolutePath: p3EvidencePath,
      mutate(evidence) {
        evidence.status = "fail";
        evidence.artifacts[evidence.artifacts.length - 1].hash = p3Internals.computeEvidenceSelfHash(evidence);
      }
    }
  ], async () => {
    const result = await runP4ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream P3 evidence status is not pass/);
    await assertP4ArtifactsUnchanged(originalP4Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: p3ReviewQueuePath,
      mutate(queue) {
        queue.provenance.sourceRefs.push("fixture://p4/test/hash-mismatch");
      }
    }
  ], async () => {
    const result = await runP4ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /review queue hash does not match the accepted boundary/);
    await assertP4ArtifactsUnchanged(originalP4Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: p3EvidencePath,
      mutate(evidence) {
        const queueRef = evidence.artifacts.find((entry) => entry.path === "artifacts/p3/review-queue.json");
        assert.ok(queueRef, "expected P3 review queue ref");
        queueRef.path = "artifacts/p3/stale-review-queue.json";
      }
    }
  ], async () => {
    const result = await runP4ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must contain exactly one ref for artifacts\/p3\/review-queue\.json/);
    await assertP4ArtifactsUnchanged(originalP4Artifacts);
  });

  await fs.writeFile(p3EvidencePath, originalEvidence);
  await fs.writeFile(p3ReviewQueuePath, originalQueue);
});

test("P4 review proof rejects stale output and non-normalized command paths", async () => {
  await fs.writeFile(p4StalePath, "stale");
  try {
    const result = await runP4ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(p4StalePath, { force: true });
  }

  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "review",
    "proof",
    "--orchestration-evidence",
    "artifacts/p3/../p3/evidence.json",
    "--review-queue",
    "artifacts/p3/review-queue.json",
    "--fixture",
    "fixtures/p4",
    "--out",
    "artifacts/p4"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("P4 preflight mutation schema is exact and rejects hybrid known fields", async () => {
  const schema = await readJson("schemas/review-preflight-mutation.v0.schema.json");
  const fixtures = {
    missing: await readJson("fixtures/p4/mutations/missing-upstream-evidence.review-preflight.json"),
    status: await readJson("fixtures/p4/mutations/failing-upstream-evidence.review-preflight.json"),
    hashMismatch: await readJson("fixtures/p4/mutations/upstream-evidence-hash-mismatch.review-preflight.json"),
    stale: await readJson("fixtures/p4/mutations/stale-upstream-evidence.review-preflight.json")
  };
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  const validate = ajv.compile(schema);

  for (const fixture of Object.values(fixtures)) {
    assert.equal(validate(fixture), true);
  }
  const missingWithBoundary = structuredClone(fixtures.missing);
  missingWithBoundary.boundaryRefs = fixtures.hashMismatch.boundaryRefs;
  assert.equal(validate(missingWithBoundary), false);

  const statusWithBoundary = structuredClone(fixtures.status);
  statusWithBoundary.boundaryRefs = fixtures.hashMismatch.boundaryRefs;
  assert.equal(validate(statusWithBoundary), false);

  const mismatchWithEvidenceRef = structuredClone(fixtures.hashMismatch);
  mismatchWithEvidenceRef.orchestrationEvidenceRef = fixtures.status.orchestrationEvidenceRef;
  assert.equal(validate(mismatchWithEvidenceRef), false);

  const staleWithStatus = structuredClone(fixtures.stale);
  staleWithStatus.status = "fail";
  assert.equal(validate(staleWithStatus), false);

  const mismatchWithWrongBoundary = structuredClone(fixtures.hashMismatch);
  mismatchWithWrongBoundary.boundaryRefs[0].path = "artifacts/p3/evidence.json";
  assert.equal(validate(mismatchWithWrongBoundary), false);
  assert.equal(p4Internals.preflightFixtureMatchesDiagnostic("REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH", mismatchWithWrongBoundary), false);
  assert.equal(p4Internals.preflightFixtureMatchesDiagnostic("REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH", fixtures.hashMismatch), true);
});

test("P4 diagnostic objects are locked to registry rows", async () => {
  await runP4Proof();
  const schema = await readJson("schemas/review-judgment-evidence.v0.schema.json");
  const evidence = await readJson("artifacts/p4/evidence.json");
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  const validate = ajv.compile(schema);

  assert.equal(validate(evidence), true);
  const tampered = structuredClone(evidence);
  tampered.diagnostics[0].artifactPath = "fixtures/p4/invalid/missing-evidence-ref.review-judgment.json";
  tampered.artifacts[tampered.artifacts.length - 1].hash = p4Internals.computeEvidenceSelfHash(tampered);
  assert.equal(validate(tampered), false);

  const tamperedAction = structuredClone(evidence);
  tamperedAction.diagnostics[0].suggestedAction = "Use a different suggested action.";
  tamperedAction.artifacts[tamperedAction.artifacts.length - 1].hash = p4Internals.computeEvidenceSelfHash(tamperedAction);
  assert.equal(validate(tamperedAction), false);
});

test("P4 evidence integrity detects schema, fixture, upstream, artifact, and self-hash tampering", async () => {
  await runP4Proof();
  const evidence = await readJson("artifacts/p4/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");

  const fixtureTamper = structuredClone(evidence);
  fixtureTamper.fixtureRefs[0].hash = "0".repeat(64);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, fixtureTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");

  const upstreamTamper = structuredClone(evidence);
  upstreamTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, upstreamTamper), "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifacts[selfHashTamper.artifacts.length - 1].hash = "0".repeat(64);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");

  const missingBoundaryTamper = structuredClone(evidence);
  missingBoundaryTamper.boundaryRefs = missingBoundaryTamper.boundaryRefs.slice(1);
  missingBoundaryTamper.artifacts[missingBoundaryTamper.artifacts.length - 1].hash = p4Internals.computeEvidenceSelfHash(missingBoundaryTamper);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, missingBoundaryTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");

  const reorderedSchemaTamper = structuredClone(evidence);
  reorderedSchemaTamper.schemaClosure = [...reorderedSchemaTamper.schemaClosure].reverse();
  reorderedSchemaTamper.artifacts[reorderedSchemaTamper.artifacts.length - 1].hash = p4Internals.computeEvidenceSelfHash(reorderedSchemaTamper);
  assert.equal(await p4Internals.firstEvidenceIntegrityFailureCode(root, reorderedSchemaTamper), "REVIEW_EVIDENCE_HASH_MISMATCH");
});

test("P4 demo writes static HTML from passing evidence", async () => {
  await runP4Proof();
  await execFileAsync("node", [
    "scripts/build-p4-demo.mjs",
    "--evidence",
    "artifacts/p4/evidence.json",
    "--out",
    "demo/p4"
  ], { cwd: root });
  const html = await fs.readFile(path.join(root, "demo/p4/index.html"), "utf8");

  assert.match(html, /P4 Review And Judgment Proof/);
  assert.match(html, /SurfaceOps Decision Ledger/);
  assert.match(html, /JudgmentKit-Shaped Findings/);
  assert.match(html, /Boundary Hashes/);
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /fetch\(/i);
  assert.doesNotMatch(html, /connector/i);
  assert.doesNotMatch(html, /execute work order/i);
});

test("P4 package scripts and untracked guard are exposed", async () => {
  const pkg = await readJson("package.json");
  for (const script of [
    "materialize:p4",
    "proof:p4",
    "build:p4-demo",
    "demo:p4",
    "check:p4",
    "check:p4:ci",
    "check:p4:ci:phase",
    "check:p4:untracked"
  ]) {
    assert.ok(pkg.scripts[script], `${script} script missing`);
  }
  assert.match(pkg.scripts["proof:p4"], /surfaces review proof/);
  assert.match(pkg.scripts["check:p4:ci"], /check:p3:ci/);
  assert.match(pkg.scripts["check:p4:ci"], /check:p4:ci:phase/);
  assert.match(pkg.scripts["check:p4:ci:phase"], /check:p4/);
  assert.match(pkg.scripts["check:p4:ci:phase"], /git diff --exit-code/);
  assert.match(pkg.scripts["check:p4:ci:phase"], /check:p4:untracked/);
  for (const guardedPath of [
    "artifacts/p4",
    "demo/p4",
    "fixtures/p4",
    "schemas/surfaceops-decision-ledger.v0.schema.json",
    "schemas/judgmentkit-evaluation-report.v0.schema.json",
    "schemas/review-judgment-fixture.v0.schema.json",
    "schemas/review-judgment-report.v0.schema.json",
    "schemas/review-judgment-evidence.v0.schema.json",
    "schemas/review-judgment-expectations.v0.schema.json",
    "schemas/review-judgment-diagnostics.v0.schema.json",
    "schemas/review-preflight-mutation.v0.schema.json",
    "scripts/materialize-p4.mjs",
    "scripts/build-p4-demo.mjs",
    "src/p4-contract.js",
    "src/p4-proof.js",
    "test/p4-proof.test.js"
  ]) {
    assert.match(pkg.scripts["check:p4:untracked"], new RegExp(escapeRegExp(guardedPath)));
  }
});

async function runP4Proof() {
  await execFileAsync("node", [
    "bin/interfacectl.js",
    "surfaces",
    "review",
    "proof",
    "--orchestration-evidence",
    "artifacts/p3/evidence.json",
    "--review-queue",
    "artifacts/p3/review-queue.json",
    "--fixture",
    "fixtures/p4",
    "--out",
    "artifacts/p4"
  ], { cwd: root });
}

async function runP4ProofExpectFailure() {
  return runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "review",
    "proof",
    "--orchestration-evidence",
    "artifacts/p3/evidence.json",
    "--review-queue",
    "artifacts/p3/review-queue.json",
    "--fixture",
    "fixtures/p4",
    "--out",
    "artifacts/p4"
  ]);
}

async function runCommandExpectFailure(args) {
  try {
    await execFileAsync("node", args, { cwd: root });
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    };
  }
  assert.fail("expected command to fail");
}

async function withJsonFileMutations(mutations, fn) {
  const originals = [];
  for (const mutation of mutations) {
    const original = await fs.readFile(mutation.absolutePath, "utf8");
    originals.push({ absolutePath: mutation.absolutePath, original });
    const json = JSON.parse(original);
    mutation.mutate(json);
    await fs.writeFile(mutation.absolutePath, canonicalJson(json));
  }
  try {
    return await fn();
  } finally {
    await Promise.all(originals.map(({ absolutePath, original }) => fs.writeFile(absolutePath, original)));
  }
}

async function snapshotP4Artifacts() {
  const paths = [
    "artifacts/p4/surfaceops-decision-ledger.json",
    "artifacts/p4/judgmentkit-evaluation-report.json",
    "artifacts/p4/review-judgment-report.json",
    "artifacts/p4/evidence.json"
  ];
  const snapshots = new Map();
  for (const relativePath of paths) {
    const absolutePath = path.join(root, relativePath);
    snapshots.set(relativePath, {
      contents: await fs.readFile(absolutePath, "utf8"),
      metadata: await fileMetadata(absolutePath)
    });
  }
  return snapshots;
}

async function assertP4ArtifactsUnchanged(snapshots) {
  for (const [relativePath, original] of snapshots.entries()) {
    const absolutePath = path.join(root, relativePath);
    assert.equal(await fs.readFile(absolutePath, "utf8"), original.contents, `${relativePath} changed during preflight failure`);
    assert.deepEqual(await fileMetadata(absolutePath), original.metadata, `${relativePath} metadata changed during preflight failure`);
  }
}

async function fileMetadata(absolutePath) {
  const stat = await fs.stat(absolutePath, { bigint: true });
  return {
    size: stat.size.toString(),
    mtimeNs: stat.mtimeNs.toString(),
    ctimeNs: stat.ctimeNs.toString()
  };
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

function compileSchema(schema) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  return ajv.compile(schema);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
