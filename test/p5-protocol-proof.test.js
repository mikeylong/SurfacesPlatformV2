import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { p2Internals } from "../src/p2-proof.js";
import { p5ProtocolInternals } from "../src/p5-protocol-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p2EvidencePath = path.join(root, "artifacts/p2/evidence.json");
const p5StalePath = path.join(root, "artifacts/p5/protocol/stale.tmp");

test("P5 protocol proof emits passing evidence with final self-hash", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/protocol/evidence.json");
  const report = await readJson("artifacts/p5/protocol/protocol-adapter-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 26);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/p5/protocol/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, p5ProtocolInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/p5/protocol/adapter-target-selection.json",
    "artifacts/p5/protocol/protocol-projection.json",
    "artifacts/p5/protocol/protocol-envelope.button.json",
    "artifacts/p5/protocol/protocol-envelope.in-line-alert.json",
    "artifacts/p5/protocol/protocol-adapter-report.json",
    "artifacts/p5/protocol/evidence.json"
  ]);
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
});

test("P5 target selection and projection stay inside accepted P2/P4 authority", async () => {
  await runP5Proof();
  const targetSelection = await readJson("artifacts/p5/protocol/adapter-target-selection.json");
  const projection = await readJson("artifacts/p5/protocol/protocol-projection.json");
  const evidence = await readJson("artifacts/p5/protocol/evidence.json");

  assert.equal(targetSelection.targetId, "surfaces-protocol-static");
  assert.equal(targetSelection.targetKind, "protocol-envelope-proof");
  assert.deepEqual(targetSelection.componentScope, ["Button", "InLineAlert"]);
  assert.equal(targetSelection.capabilityScope.transport, "none");
  assert.equal(targetSelection.capabilityScope.liveProtocolApi, false);
  assert.equal(targetSelection.capabilityScope.a2uiConformance, false);
  assert.deepEqual(Object.keys(projection.components), ["Button", "InLineAlert"]);
  assert.equal(projection.protocolEnvelope.transport, "none");
  assert.equal(projection.protocolEnvelope.productionApi, false);
  assert.equal(projection.protocolEnvelope.sdk, false);
  assert.equal(projection.protocolEnvelope.a2uiConformance, false);
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/evidence.json"));
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/surfaceops-decision-ledger.json"));
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/p4/review-judgment-report.json"));
});

test("P5 generated target selection and projection semantic gates reject drift before writes", async () => {
  await runP5Proof();
  const originalP5Artifacts = await snapshotP5Artifacts();
  const targetSelectionFixturePath = path.join(root, "fixtures/p5/protocol/adapter-target-selection.fixture.json");

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.capabilityScope.liveProtocolApi = true;
      }
    }
  ], async () => {
    const result = await runP5ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated target selection failed semantic validation: PROTOCOL_LIVE_API_FORBIDDEN/);
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
    assert.match(result.stderr, /generated protocol projection failed semantic validation: PROTOCOL_AUTHORITY_ESCALATION/);
    await assertP5ArtifactsUnchanged(originalP5Artifacts);
  });
});

test("P5 protocol envelopes are inert and review-required rows emit no envelope", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/protocol/evidence.json");
  const envelopes = await Promise.all([
    readJson("artifacts/p5/protocol/protocol-envelope.button.json"),
    readJson("artifacts/p5/protocol/protocol-envelope.in-line-alert.json")
  ]);

  for (const envelope of envelopes) {
    assert.equal(envelope.schemaId, "protocol-envelope.v0");
    assert.equal(envelope.adapter, "surfaces-protocol-static");
    assert.equal(envelope.transport, "none");
    assert.deepEqual(envelope.sideEffects, []);
    for (const action of envelope.actions) {
      assert.equal(action.executed, false);
    }
  }

  const reviewRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/p5/protocol/review/review-required-protocol-action.surface-ir.json"
  );
  assert.equal(reviewRow.actualResult, "review_required");
  assert.equal(reviewRow.envelopePath, null);
  assert.deepEqual(reviewRow.diagnosticCodes, ["PROTOCOL_REVIEW_REQUIRED"]);
});

test("P5 protocol boundary rejects known members with out-of-authority values", async () => {
  await runP5Proof();
  const buttonFixturePath = path.join(root, "fixtures/p5/protocol/valid/button-protocol-envelope.surface-ir.json");

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
    assert.match(result.stderr, /P5 protocol validation expectation mismatch/);
    assert.match(result.stderr, /PROTOCOL_MEMBER_UNKNOWN/);
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
    assert.match(result.stderr, /P5 protocol input is missing/);
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

test("P5 protocol proof rejects stale output and non-normalized command paths", async () => {
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
    "protocol",
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
    "--fixture",
    "fixtures/p5/protocol",
    "--out",
    "artifacts/p5/protocol"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("P5 diagnostic objects are locked to registry rows", async () => {
  await runP5Proof();
  const schema = await readJson("schemas/protocol-adapter-evidence.v0.schema.json");
  const evidence = await readJson("artifacts/p5/protocol/evidence.json");
  const validate = compileSchema(schema);

  assert.equal(validate(evidence), true);
  const tamperedMessage = structuredClone(evidence);
  tamperedMessage.diagnostics[0].message = "Different diagnostic wording.";
  tamperedMessage.artifacts[tamperedMessage.artifacts.length - 1].hash = p5ProtocolInternals.computeEvidenceSelfHash(tamperedMessage);
  assert.equal(validate(tamperedMessage), false);

  const targetOutOfScope = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/p5/protocol/invalid/target-out-of-scope.protocol-target-selection.json"
  );
  assert.deepEqual(targetOutOfScope.diagnosticCodes, ["PROTOCOL_TARGET_OUT_OF_SCOPE"]);
});

test("P5 evidence integrity detects schema, fixture, upstream, artifact, and self-hash tampering", async () => {
  await runP5Proof();
  const evidence = await readJson("artifacts/p5/protocol/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await p5ProtocolInternals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "PROTOCOL_EVIDENCE_HASH_MISMATCH");

  const fixtureTamper = structuredClone(evidence);
  fixtureTamper.fixtureRefs[0].hash = "0".repeat(64);
  assert.equal(await p5ProtocolInternals.firstEvidenceIntegrityFailureCode(root, fixtureTamper), "PROTOCOL_EVIDENCE_HASH_MISMATCH");

  const upstreamTamper = structuredClone(evidence);
  upstreamTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(await p5ProtocolInternals.firstEvidenceIntegrityFailureCode(root, upstreamTamper), "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(await p5ProtocolInternals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "PROTOCOL_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifacts[selfHashTamper.artifacts.length - 1].hash = "0".repeat(64);
  assert.equal(await p5ProtocolInternals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "PROTOCOL_EVIDENCE_HASH_MISMATCH");
});

test("P5 protocol demo writes static HTML from passing evidence", async () => {
  await runP5Proof();
  await execFileAsync("node", [
    "scripts/build-p5-protocol-demo.mjs",
    "--evidence",
    "artifacts/p5/protocol/evidence.json",
    "--out",
    "demo/p5/protocol"
  ], { cwd: root });
  const html = await fs.readFile(path.join(root, "demo/p5/protocol/index.html"), "utf8");

  assert.match(html, /P5 Protocol Evidence/);
  assert.match(html, /surfaces-protocol-static/);
  assert.match(html, /Projection Scope/);
  assert.match(html, /Protocol Envelopes/);
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /fetch\(/i);
  assert.doesNotMatch(html, /api console/i);
  assert.doesNotMatch(html, /sdk snippet/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("P5 package scripts and untracked guard are exposed", async () => {
  const pkg = await readJson("package.json");
  for (const script of [
    "materialize:p5:protocol",
    "proof:p5:protocol",
    "build:p5-protocol-demo",
    "demo:p5:protocol",
    "check:p5:protocol",
    "check:p5:protocol:ci",
    "check:p5:protocol:ci:phase",
    "check:p5:protocol:untracked"
  ]) {
    assert.ok(pkg.scripts[script], `${script} script missing`);
  }
  assert.match(pkg.scripts["proof:p5:protocol"], /surfaces protocol proof/);
  assert.match(pkg.scripts["check:p5:protocol:ci"], /check:p4:ci/);
  assert.match(pkg.scripts["check:p5:protocol:ci"], /check:p5:protocol:ci:phase/);
  assert.match(pkg.scripts["check:p5:protocol:ci:phase"], /check:p5:protocol/);
  assert.match(pkg.scripts["check:p5:protocol:ci:phase"], /git diff --exit-code/);
  assert.match(pkg.scripts["check:p5:protocol:ci:phase"], /check:p5:protocol:untracked/);
  for (const guardedPath of [
    "artifacts/p5/protocol",
    "demo/p5/protocol",
    "fixtures/p5/protocol",
    "schemas/protocol-target-selection.v0.schema.json",
    "schemas/protocol-projection.v0.schema.json",
    "schemas/protocol-envelope.v0.schema.json",
    "schemas/protocol-adapter-report.v0.schema.json",
    "schemas/protocol-adapter-evidence.v0.schema.json",
    "schemas/protocol-adapter-expectations.v0.schema.json",
    "schemas/protocol-adapter-diagnostics.v0.schema.json",
    "schemas/protocol-preflight-mutation.v0.schema.json",
    "scripts/materialize-p5-protocol.mjs",
    "scripts/build-p5-protocol-demo.mjs",
    "src/p5-protocol-contract.js",
    "src/p5-protocol-proof.js",
    "test/p5-protocol-proof.test.js"
  ]) {
    assert.match(pkg.scripts["check:p5:protocol:untracked"], new RegExp(escapeRegExp(guardedPath)));
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
    "protocol",
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
    "--fixture",
    "fixtures/p5/protocol",
    "--out",
    "artifacts/p5/protocol"
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
    "artifacts/p5/protocol/adapter-target-selection.json",
    "artifacts/p5/protocol/protocol-projection.json",
    "artifacts/p5/protocol/protocol-envelope.button.json",
    "artifacts/p5/protocol/protocol-envelope.in-line-alert.json",
    "artifacts/p5/protocol/protocol-adapter-report.json",
    "artifacts/p5/protocol/evidence.json"
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
