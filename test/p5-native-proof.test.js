import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { p2Internals } from "../src/p2-proof.js";
import { p5NativeInternals } from "../src/p5-native-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p2EvidencePath = path.join(root, "artifacts/p2/evidence.json");
const p5StalePath = path.join(root, "artifacts/p5/native/stale.tmp");

test("P5 native proof emits passing evidence with final self-hash", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/native/evidence.json");
  const report = await readJson("artifacts/p5/native/surfaces-native-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 30);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/p5/native/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, p5NativeInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/p5/native/adapter-target-selection.json",
    "artifacts/p5/native/surfaces-native-projection.json",
    "artifacts/p5/native/surfaces-native-packet.button.json",
    "artifacts/p5/native/surfaces-native-packet.in-line-alert.json",
    "artifacts/p5/native/surfaces-native-report.json",
    "artifacts/p5/native/evidence.json"
  ]);
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
});

test("P5 target selection and projection stay inside accepted P2/P4 authority", async () => {
  await runP5Proof();
  const targetSelection = await readJson("artifacts/p5/native/adapter-target-selection.json");
  const projection = await readJson("artifacts/p5/native/surfaces-native-projection.json");
  const evidence = await readJson("artifacts/p5/native/evidence.json");

  assert.equal(targetSelection.targetId, "surfaces-native-static");
  assert.equal(targetSelection.targetKind, "native-static-packet-proof");
  assert.deepEqual(targetSelection.componentScope, ["Button", "InLineAlert"]);
  assert.equal(targetSelection.capabilityScope.transport, "none");
  assert.equal(targetSelection.capabilityScope.liveNativeApi, false);
  assert.equal(targetSelection.capabilityScope.a2uiConformance, false);
  assert.deepEqual(targetSelection.upstreamRefs.map((ref) => ref.path), [
    "artifacts/p2/evidence.json",
    "artifacts/p2/governed-catalog.json",
    "artifacts/p4/evidence.json",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "artifacts/p4/review-judgment-report.json"
  ]);
  assert.deepEqual(targetSelection.compatibilityPreflightRefs.map((ref) => ref.path), [
    "artifacts/p5/protocol/evidence.json"
  ]);
  assert.deepEqual(Object.keys(projection.components), ["Button", "InLineAlert"]);
  assert.equal(projection.nativePacket.transport, "none");
  assert.equal(projection.nativePacket.productionApi, false);
  assert.equal(projection.nativePacket.sdk, false);
  assert.equal(projection.nativePacket.a2uiConformance, false);
  assert.equal(projection.compatibilityPreflightRef.path, "artifacts/p5/protocol/evidence.json");
  const targetSelectionArtifact = evidence.artifacts.find((ref) => ref.path === "artifacts/p5/native/adapter-target-selection.json");
  assert.equal(projection.targetSelectionRef.path, targetSelectionArtifact.path);
  assert.equal(projection.targetSelectionRef.schemaId, targetSelectionArtifact.schemaId);
  assert.equal(projection.targetSelectionRef.hash, targetSelectionArtifact.hash);
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/evidence.json"));
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/surfaceops-decision-ledger.json"));
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/review-judgment-report.json"));
  assert.ok(!evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p5/protocol/evidence.json"));
  assert.deepEqual(evidence.compatibilityPreflightRefs.map((ref) => ref.path), ["artifacts/p5/protocol/evidence.json"]);
});

test("P5 generated target selection and projection semantic gates reject drift before writes", async () => {
  await runP5Proof();
  const originalP5Artifacts = await snapshotP5Artifacts();
  const targetSelectionFixturePath = path.join(root, "fixtures/p5/native/adapter-target-selection.fixture.json");

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.capabilityScope.liveNativeApi = true;
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated target selection failed semantic validation: NATIVE_LIVE_API_FORBIDDEN/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.componentScope = ["Button"];
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated native projection failed semantic validation: NATIVE_AUTHORITY_ESCALATION/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.upstreamRefs[1].sourceEvidenceHash = "0".repeat(64);
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated target selection failed semantic validation: NATIVE_UPSTREAM_EVIDENCE_STALE/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.compatibilityPreflightRefs[0].path = "artifacts/p5/protocol/stale-evidence.json";
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated target selection failed semantic validation: NATIVE_PROTOCOL_EVIDENCE_STALE/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });
});

test("P5 native packets are inert and review-required rows emit no packet", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/native/evidence.json");
  const packets = await Promise.all([
    readJson("artifacts/p5/native/surfaces-native-packet.button.json"),
    readJson("artifacts/p5/native/surfaces-native-packet.in-line-alert.json")
  ]);

  for (const packet of packets) {
    assert.equal(packet.schemaId, "surfaces-native-packet.v0");
    assert.equal(packet.adapter, "surfaces-native-static");
    assert.equal(packet.transport, "none");
    assert.deepEqual(packet.sideEffects, []);
    for (const action of packet.actions) {
      assert.equal(action.executed, false);
    }
  }

  const reviewRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/p5/native/review/review-required-native-action.surface-ir.json"
  );
  assert.equal(reviewRow.actualResult, "review_required");
  assert.equal(reviewRow.packetPath, null);
  assert.deepEqual(reviewRow.diagnosticCodes, ["NATIVE_REVIEW_REQUIRED"]);
});

test("P5 native boundary rejects known members with out-of-authority values", async () => {
  await runP5Proof();
  const buttonFixturePath = path.join(root, "fixtures/p5/native/valid/button-surfaces-native-packet.surface-ir.json");

  await withJsonFileMutations([
    {
      absolutePath: buttonFixturePath,
      mutate(fixture) {
        fixture.root.props.size = "xxl";
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /P5 native validation expectation mismatch/);
    assert.match(result.stderr, /NATIVE_MEMBER_UNKNOWN/);
  });
});

test("P5 preflight rejects missing, failing, mismatched, and stale inputs before artifact write", async () => {
  await runP5Proof();
  const originalP5Artifacts = await snapshotP5Artifacts();
  const originalP2Evidence = await fs.readFile(p2EvidencePath, "utf8");

  await fs.rm(p2EvidencePath, { force: true });
  try {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /P5 native input is missing/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  } finally {
    await fs.writeFile(p2EvidencePath, originalP2Evidence);
  }

  await withJsonFileMutations([
    {
      absolutePath: p2EvidencePath,
      mutate(evidence) {
        evidence.status = "fail";
        evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = p2Internals.computeEvidenceSelfHash(evidence);
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream P2 evidence is not passing/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });

  await withJsonFileMutations([
    {
      absolutePath: p2EvidencePath,
      mutate(evidence) {
        const catalogRef = evidence.artifactRefs.find((entry) => entry.path === "artifacts/p2/governed-catalog.json");
        catalogRef.hash = "0".repeat(64);
        evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = p2Internals.computeEvidenceSelfHash(evidence);
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /P2 evidence or catalog hash does not match/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });
});

test("P5 native proof rejects stale output and non-normalized command paths", async () => {
  await fs.writeFile(p5StalePath, "stale");
  try {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(p5StalePath, { force: true });
  }

  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "native",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/../p2/evidence.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--review-report",
    "artifacts/p4/review-judgment-report.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--protocol-evidence",
    "artifacts/p5/protocol/evidence.json",
    "--fixture",
    "fixtures/p5/native",
    "--out",
    "artifacts/p5/native"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("P5 diagnostic objects are locked to registry rows", async () => {
  await runP5Proof();
  const schema = await readJson("schemas/surfaces-native-evidence.v0.schema.json");
  const evidence = await readJson("artifacts/p5/native/evidence.json");
  const validate = compileSchema(schema);

  assert.equal(validate(evidence), true);
  const tamperedMessage = structuredClone(evidence);
  tamperedMessage.diagnostics[0].message = "Different diagnostic wording.";
  tamperedMessage.artifacts[tamperedMessage.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(tamperedMessage);
  assert.equal(validate(tamperedMessage), false);

  const targetOutOfScope = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/p5/native/invalid/target-out-of-scope.surfaces-native-target-selection.json"
  );
  assert.deepEqual(targetOutOfScope.diagnosticCodes, ["NATIVE_TARGET_OUT_OF_SCOPE"]);

  const projectionHashMismatch = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/p5/native/mutations/projection-hash-mismatch.surfaces-native-projection.json"
  );
  assert.deepEqual(projectionHashMismatch.diagnosticCodes, ["NATIVE_SOURCE_HASH_MISMATCH"]);
  assert.equal(projectionHashMismatch.jsonPointer, "/targetSelectionRef/hash");
});

test("P5 evidence integrity detects schema, fixture, upstream, artifact, and self-hash tampering", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/native/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");

  const fixtureTamper = structuredClone(evidence);
  fixtureTamper.fixtureRefs[0].hash = "0".repeat(64);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, fixtureTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");

  const upstreamTamper = structuredClone(evidence);
  upstreamTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, upstreamTamper), "NATIVE_UPSTREAM_EVIDENCE_HASH_MISMATCH");

  const boundarySchemaTamper = structuredClone(evidence);
  boundarySchemaTamper.boundaryRefs[0].schemaId = "wrong-schema.v0";
  boundarySchemaTamper.artifacts[boundarySchemaTamper.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(boundarySchemaTamper);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, boundarySchemaTamper), "NATIVE_UPSTREAM_EVIDENCE_STALE");

  const boundarySourceEvidenceTamper = structuredClone(evidence);
  boundarySourceEvidenceTamper.boundaryRefs[1].sourceEvidenceHash = "0".repeat(64);
  boundarySourceEvidenceTamper.artifacts[boundarySourceEvidenceTamper.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(boundarySourceEvidenceTamper);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, boundarySourceEvidenceTamper), "NATIVE_UPSTREAM_EVIDENCE_STALE");

  const compatibilitySchemaTamper = structuredClone(evidence);
  compatibilitySchemaTamper.compatibilityPreflightRefs[0].schemaId = "wrong-schema.v0";
  compatibilitySchemaTamper.artifacts[compatibilitySchemaTamper.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(compatibilitySchemaTamper);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, compatibilitySchemaTamper), "NATIVE_PROTOCOL_EVIDENCE_STALE");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");

  const artifactPathTamper = structuredClone(evidence);
  artifactPathTamper.artifacts[0].path = "artifacts/p5/native/stale-target-selection.json";
  artifactPathTamper.artifacts[artifactPathTamper.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(artifactPathTamper);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, artifactPathTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");

  const artifactAlgorithmTamper = structuredClone(evidence);
  artifactAlgorithmTamper.artifacts[0].hashAlgorithm = "sha512";
  artifactAlgorithmTamper.artifacts[artifactAlgorithmTamper.artifacts.length - 1].hash = p5NativeInternals.computeEvidenceSelfHash(artifactAlgorithmTamper);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, artifactAlgorithmTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifacts[selfHashTamper.artifacts.length - 1].hash = "0".repeat(64);
  assert.equal(await p5NativeInternals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "NATIVE_EVIDENCE_HASH_MISMATCH");
});

test("P5 native demo writes static HTML from passing evidence", async () => {
  await runP5Proof();
  await execFileAsync("node", [
    "scripts/build-p5-native-demo.mjs",
    "--evidence",
    "artifacts/p5/native/evidence.json",
    "--out",
    "demo/p5/native"
  ], { cwd: root });
  const html = await fs.readFile(path.join(root, "demo/p5/native/index.html"), "utf8");

  assert.match(html, /P5 Native Evidence/);
  assert.match(html, /surfaces-native-static/);
  assert.match(html, /Projection Scope/);
  assert.match(html, /Native Packets/);
  assert.match(html, /Compatibility Preflight Hashes/);
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /fetch\(/i);
  assert.doesNotMatch(html, /api console/i);
  assert.doesNotMatch(html, /sdk snippet/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("P5 package scripts and untracked guard are exposed", async () => {
  const pkg = await readJson("package.json");
  for (const script of [
    "materialize:p5:native",
    "proof:p5:native",
    "build:p5-native-demo",
    "demo:p5:native",
    "check:p5:native",
    "check:p5:native:ci",
    "check:p5:native:ci:phase",
    "check:p5:native:untracked"
  ]) {
    assert.ok(pkg.scripts[script], `${script} script missing`);
  }
  assert.match(pkg.scripts["proof:p5:native"], /surfaces native proof/);
  assert.match(pkg.scripts["check:p5:native:ci"], /check:p5:protocol:ci/);
  assert.match(pkg.scripts["check:p5:native:ci"], /check:p5:native:ci:phase/);
  assert.match(pkg.scripts["check:p5:native:ci:phase"], /check:p5:native/);
  assert.match(pkg.scripts["check:p5:native:ci:phase"], /git diff --exit-code/);
  assert.match(pkg.scripts["check:p5:native:ci:phase"], /check:p5:native:untracked/);
  for (const guardedPath of [
    "artifacts/p5/native",
    "demo/p5/native",
    "fixtures/p5/native",
    "schemas/surfaces-native-target-selection.v0.schema.json",
    "schemas/surfaces-native-projection.v0.schema.json",
    "schemas/surfaces-native-packet.v0.schema.json",
    "schemas/surfaces-native-report.v0.schema.json",
    "schemas/surfaces-native-evidence.v0.schema.json",
    "schemas/surfaces-native-expectations.v0.schema.json",
    "schemas/surfaces-native-diagnostics.v0.schema.json",
    "schemas/surfaces-native-preflight-mutation.v0.schema.json",
    "scripts/materialize-p5-native.mjs",
    "scripts/build-p5-native-demo.mjs",
    "src/p5-native-contract.js",
    "src/p5-native-proof.js",
    "test/p5-native-proof.test.js"
  ]) {
    assert.match(pkg.scripts["check:p5:native:untracked"], new RegExp(escapeRegExp(guardedPath)));
  }
});

async function runP5Proof() {
  await execFileAsync("node", p5ProofArgs(), { cwd: root });
}

async function runP5ProofExpectFailure() {
  return runCommandExpectFailure(p5ProofArgs());
}

function p5ProofArgs() {
  return [
    "bin/interfacectl.js",
    "surfaces",
    "native",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--review-report",
    "artifacts/p4/review-judgment-report.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--protocol-evidence",
    "artifacts/p5/protocol/evidence.json",
    "--fixture",
    "fixtures/p5/native",
    "--out",
    "artifacts/p5/native"
  ];
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

async function snapshotP5Artifacts() {
  const paths = [
    "artifacts/p5/native/adapter-target-selection.json",
    "artifacts/p5/native/surfaces-native-projection.json",
    "artifacts/p5/native/surfaces-native-packet.button.json",
    "artifacts/p5/native/surfaces-native-packet.in-line-alert.json",
    "artifacts/p5/native/surfaces-native-report.json",
    "artifacts/p5/native/evidence.json"
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

async function assertP5ArtifactsUnchanged(snapshots) {
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
