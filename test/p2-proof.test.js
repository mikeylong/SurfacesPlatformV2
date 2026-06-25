import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import { p2Internals } from "../src/p2-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const manifestPath = path.join(root, "sources/p2/design-system-source/manifest.json");
const componentMapPath = path.join(root, "sources/p2/design-system-source/mappings/component-map.json");
const tokenMapPath = path.join(root, "sources/p2/design-system-source/mappings/token-map.json");
const componentsDir = path.join(root, "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/components");
const stalePath = path.join(root, "artifacts/p2/stale.tmp");

test("P2 ingest proof emits passing evidence with final self-hash", async () => {
  await runP2Proof();
  const evidence = await readJson("artifacts/p2/evidence.json");
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 21);
  assert.equal(evidence.artifactRefs.at(-1).path, "artifacts/p2/evidence.json");
  assert.equal(evidence.artifactRefs.at(-1).hash, p2Internals.computeEvidenceSelfHash(evidence));
});

test("P2 ingest proof rejects stale unexpected output before writing", async () => {
  await fs.writeFile(stalePath, "stale");
  try {
    const result = await runP2ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(stalePath, { force: true });
  }
});

test("P2 ingest proof rejects non-normalized command paths", async () => {
  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "ingest",
    "proof",
    "--source",
    "sources/p2/../p2/design-system-source",
    "--fixture",
    "fixtures/p2",
    "--out",
    "artifacts/p2"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("P2 source preflight rejects manifest source hash mismatch", async () => {
  const original = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(original);
  manifest.sourceFiles[0].sha256 = "0".repeat(64);
  await fs.writeFile(manifestPath, canonicalJson(manifest));
  try {
    const result = await runP2ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /hash mismatch/);
  } finally {
    await fs.writeFile(manifestPath, original);
  }
});

test("P2 token mapping accepts token JSON Pointer source refs", async () => {
  const mapping = await readJson("artifacts/p2/source-mapping.json");
  const tokenRow = mapping.mappingRows.find((row) => row.mappingId === "button-layout-component-token");
  assert.ok(tokenRow);
  assert.ok(tokenRow.sourceRefs.includes(
    "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/267"
  ));
});

test("P2 source mapping is built from manifest-declared mapping files, not fixtures", async () => {
  const originalMap = await fs.readFile(componentMapPath, "utf8");
  const originalManifest = await fs.readFile(manifestPath, "utf8");
  const componentMap = JSON.parse(originalMap);
  componentMap.mappingRows["button-component"].rationale = "Tampered source mapping rationale.";
  await fs.writeFile(componentMapPath, canonicalJson(componentMap));
  await refreshManifestMappingHash("mappings/component-map.json");
  try {
    const result = await runP2ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /P2 validation expectation mismatch/);
  } finally {
    await fs.writeFile(componentMapPath, originalMap);
    await fs.writeFile(manifestPath, originalManifest);
  }
});

test("P2 mapping preflight rejects unresolved token JSON Pointers", async () => {
  const originalMap = await fs.readFile(tokenMapPath, "utf8");
  const originalManifest = await fs.readFile(manifestPath, "utf8");
  const tokenMap = JSON.parse(originalMap);
  tokenMap.mappingRows["button-layout-component-token"].sourceRefs = [
    "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/999999"
  ];
  await fs.writeFile(tokenMapPath, canonicalJson(tokenMap));
  await refreshManifestMappingHash("mappings/token-map.json");
  try {
    const result = await runP2ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unresolved JSON Pointer|outside JSON array bounds/);
  } finally {
    await fs.writeFile(tokenMapPath, originalMap);
    await fs.writeFile(manifestPath, originalManifest);
  }
});

test("P2 source preflight rejects ancestor symlink escapes from declared source roots", async () => {
  const backupDir = path.join(root, `.tmp-p2-components-${process.pid}`);
  await fs.rm(backupDir, { recursive: true, force: true });
  await fs.rename(componentsDir, backupDir);
  await fs.symlink(backupDir, componentsDir, "dir");
  try {
    const result = await runP2ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /escapes declared source roots/);
  } finally {
    await fs.rm(componentsDir, { force: true });
    await fs.rename(backupDir, componentsDir);
  }
});

test("P2 evidence integrity detects real schema, source, artifact, and self-hash tampering", async () => {
  await runP2Proof();
  const evidence = await readJson("artifacts/p2/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await p2Internals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "INGEST_SCHEMA_HASH_MISMATCH");

  const sourceTamper = structuredClone(evidence);
  sourceTamper.sourceFileRefs[0].hash = "0".repeat(64);
  assert.equal(await p2Internals.firstEvidenceIntegrityFailureCode(root, sourceTamper), "INGEST_SOURCE_HASH_MISMATCH");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifactRefs[0].hash = "0".repeat(64);
  assert.equal(await p2Internals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "INGEST_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifactRefs[selfHashTamper.artifactRefs.length - 1].hash = "0".repeat(64);
  assert.equal(await p2Internals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "INGEST_EVIDENCE_HASH_MISMATCH");
});

async function runP2Proof() {
  await execFileAsync("node", [
    "bin/interfacectl.js",
    "surfaces",
    "ingest",
    "proof",
    "--source",
    "sources/p2/design-system-source",
    "--fixture",
    "fixtures/p2",
    "--out",
    "artifacts/p2"
  ], { cwd: root });
}

async function runP2ProofExpectFailure() {
  return runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "ingest",
    "proof",
    "--source",
    "sources/p2/design-system-source",
    "--fixture",
    "fixtures/p2",
    "--out",
    "artifacts/p2"
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

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function refreshManifestMappingHash(mappingPath) {
  const manifest = await readJson("sources/p2/design-system-source/manifest.json");
  const mapping = manifest.requiredMappings.find((entry) => entry.path === mappingPath);
  assert.ok(mapping);
  const bytes = await fs.readFile(path.join(root, "sources/p2/design-system-source", mappingPath));
  const { createHash } = await import("node:crypto");
  mapping.sha256 = createHash("sha256").update(bytes).digest("hex");
  await fs.writeFile(manifestPath, canonicalJson(manifest));
}
