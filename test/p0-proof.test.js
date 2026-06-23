import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson, materializeP0Contract } from "../src/p0.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const artifactDir = path.join(root, "artifacts/p0");
const expectedArtifacts = [
  "extract.json",
  "catalog.json",
  "governed-catalog.json",
  "adapter-diagnostics.json",
  "evidence.json"
];

test("diagnostics registry stays in lockstep across README, schema, and manifest", async () => {
  await assertDiagnosticsContractLockstep();
});

test("P0 proof is deterministic, schema-valid, and manifest-complete", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });

  const first = await runProof();
  assert.match(first.stdout, /surfaces proof: pass/);
  assert.match(first.stdout, /promotionStatus: review_required/);
  const firstBytes = await readArtifactBytes();

  const second = await runProof();
  assert.match(second.stdout, /validationResults: 40\/40 matched/);
  const secondBytes = await readArtifactBytes();
  assert.deepEqual(secondBytes, firstBytes, "artifact bytes must be stable across repeated runs");

  await validateSchemasFixturesAndArtifacts();
  await assertDiagnosticsContractLockstep();
  await assertEvidenceInvariants();
});

test("P0 proof rejects stale unexpected output before writing", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();
  const before = await readArtifactBytes();
  await fs.writeFile(path.join(artifactDir, "unexpected.tmp"), "stale");

  await assert.rejects(
    execFileAsync("node", ["bin/interfacectl.js", "surfaces", "proof", "--fixture", "fixtures/p0", "--out", "artifacts/p0"], { cwd: root }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /stale unexpected output/);
      return true;
    }
  );

  await fs.rm(path.join(artifactDir, "unexpected.tmp"), { force: true });
  const after = await readArtifactBytes();
  assert.deepEqual(after, before, "stale-output failure must not rewrite expected artifacts");
});

test("P0 proof maps output path errors to exit 2", async () => {
  await materializeP0Contract(root);
  const outputFile = path.join(root, "tmp-p0-out-file");
  await fs.writeFile(outputFile, "not a directory");
  try {
    await assert.rejects(
      execFileAsync("node", ["bin/interfacectl.js", "surfaces", "proof", "--fixture", "fixtures/p0", "--out", "tmp-p0-out-file"], { cwd: root }),
      (error) => {
        assert.equal(error.code, 2);
        assert.match(error.stderr, /output path error/);
        return true;
      }
    );
  } finally {
    await fs.rm(outputFile, { force: true });
  }
});

test("canonical JSON rejects unsafe integer inputs", () => {
  assert.throws(
    () => canonicalJson({ unsafe: Number.MAX_SAFE_INTEGER + 1 }),
    /safe integers/
  );
});

async function runProof() {
  return execFileAsync("node", ["bin/interfacectl.js", "surfaces", "proof", "--fixture", "fixtures/p0", "--out", "artifacts/p0"], { cwd: root });
}

async function readArtifactBytes() {
  const entries = {};
  for (const file of expectedArtifacts) {
    entries[file] = await fs.readFile(path.join(artifactDir, file), "utf8");
  }
  return entries;
}

async function validateSchemasFixturesAndArtifacts() {
  const schemas = await loadSchemas();
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  for (const [file, schema] of Object.entries(schemas)) {
    assert.equal(ajv.validateSchema(schema), true, `${file} must be a valid JSON Schema`);
    ajv.addSchema(schema);
  }

  validateWith(ajv, "fixture-expectations.v0", await readJson("fixtures/p0/expectations.manifest.json"), "expectations manifest");
  validateWith(ajv, "surface-ir.v0", await readJson("fixtures/p0/valid.surface-ir.json"), "valid Surface IR");
  validateWith(ajv, "surface-ir.v0", await readJson("fixtures/p0/review/review-required-action.json"), "review Surface IR");

  const invalidFiles = await fs.readdir(path.join(root, "fixtures/p0/invalid"));
  for (const file of invalidFiles.sort()) {
    const fixture = await readJson(`fixtures/p0/invalid/${file}`);
    const result = validateResult(ajv, "surface-ir.v0", fixture);
    if (file === "extra-property.json") {
      assert.equal(result.valid, false, "extra-property must be rejected by surface-ir schema");
    } else {
      assert.equal(result.valid, true, `${file} should be structurally valid before semantic validation`);
    }
  }

  validateWith(ajv, "extract.v0", await readJson("artifacts/p0/extract.json"), "extract artifact");
  validateWith(ajv, "runtime-catalog.v0", await readJson("artifacts/p0/catalog.json"), "catalog artifact");
  validateWith(ajv, "runtime-catalog.v0", await readJson("artifacts/p0/governed-catalog.json"), "governed catalog artifact");
  validateWith(ajv, "adapter-diagnostics.v0", await readJson("artifacts/p0/adapter-diagnostics.json"), "adapter diagnostics artifact");
  const evidence = await readJson("artifacts/p0/evidence.json");
  validateWith(ajv, "evidence.v0", evidence, "evidence artifact");
  const nullHashEvidence = JSON.parse(JSON.stringify(evidence));
  nullHashEvidence.artifacts[nullHashEvidence.artifacts.length - 1].hash = null;
  assert.equal(validateResult(ajv, "evidence.v0", nullHashEvidence).valid, false, "persisted evidence hashes must be strings, not null placeholders");

  const extractMutation = await readJson("fixtures/p0/mutations/missing-provenance.extract.json");
  assert.equal(validateResult(ajv, "extract.v0", extractMutation).valid, false, "missing provenance extract mutation must fail extract schema");
  validateWith(ajv, "evidence.v0", await readJson("fixtures/p0/mutations/hash-mismatch.evidence.json"), "hash mismatch evidence mutation");
}

async function assertDiagnosticsContractLockstep() {
  const readmeRows = await readReadmeDiagnosticsRegistry();
  const diagnosticsSchema = await readJson("schemas/diagnostics.v0.schema.json");
  const manifest = await readJson("fixtures/p0/expectations.manifest.json");
  const schemaRows = diagnosticsSchema.xDiagnosticsRegistry;

  assert.deepEqual(
    readmeRows.map(readmeComparableRegistryRow),
    schemaRows.map(schemaComparableRegistryRow),
    "plans/README.md diagnostics registry must match schemas/diagnostics.v0.schema.json xDiagnosticsRegistry"
  );

  const registryRows = schemaRows.filter((row) => row.fixtureCoverage !== "manifest-wide");
  const expectationByPath = new Map(manifest.expectations.map((entry) => [entry.fixturePath, entry]));
  const registryByPath = new Map(registryRows.map((row) => [row.artifactPath, row]));
  for (const row of registryRows) {
    const expectation = expectationByPath.get(row.artifactPath);
    assert.ok(expectation, `registry row ${row.fixtureCoverage} must have manifest expectation`);
    assert.equal(expectation.expectedArtifactPath, row.artifactPath);
    assert.equal(expectation.fixturePath, path.posix.join("fixtures/p0", row.fixtureCoverage));
    assert.equal(expectation.expectedDiagnosticCodes.length, 1);
    assert.equal(expectation.expectedDiagnosticCodes[0], row.code);
    assert.equal(expectation.expectedJsonPointer, row.jsonPointer);
    assert.equal(expectation.expectedStage, row.stage);
    assert.equal(expectation.promotionStatus, row.promotionStatus);
    assert.equal(expectation.requiredSourceRef, row.sourceRef);
  }
  for (const expectation of manifest.expectations) {
    if (expectation.expectedDiagnosticCodes.length === 0) continue;
    const row = registryByPath.get(expectation.fixturePath);
    assert.ok(row, `manifest expectation ${expectation.fixturePath} must have diagnostics registry row`);
    assert.equal(expectation.expectedArtifactPath, row.artifactPath);
    assert.equal(expectation.fixturePath, path.posix.join("fixtures/p0", row.fixtureCoverage));
    assert.equal(expectation.expectedDiagnosticCodes.length, 1);
    assert.equal(expectation.expectedDiagnosticCodes[0], row.code);
    assert.equal(expectation.expectedJsonPointer, row.jsonPointer);
    assert.equal(expectation.expectedStage, row.stage);
    assert.equal(expectation.promotionStatus, row.promotionStatus);
    assert.equal(expectation.requiredSourceRef, row.sourceRef);
  }
  assert.equal(manifest.expectations.length, 40);
  assert.equal(manifest.expectations.filter((expectation) => expectation.expectedDiagnosticCodes.length === 0).length, 1);
  assert.equal(manifest.runExpectation.status, "pass");
  assert.equal(manifest.runExpectation.promotionStatus, "review_required");
}

async function readReadmeDiagnosticsRegistry() {
  const markdown = await fs.readFile(path.join(root, "plans/README.md"), "utf8");
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.startsWith("| Code | Trigger | `canonicalMessage` |"));
  assert.notEqual(headerIndex, -1, "plans/README.md diagnostics registry table must exist");

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("| ")) break;
    const cells = splitMarkdownTableRow(line);
    assert.equal(cells.length, 10, `diagnostics registry row must have 10 columns: ${line}`);
    rows.push({
      code: cleanMarkdownCell(cells[0]),
      trigger: cleanMarkdownCell(cells[1]),
      canonicalMessage: cleanMarkdownCell(cells[2]),
      stage: cleanMarkdownCell(cells[3]),
      severity: cleanMarkdownCell(cells[4]),
      promotionStatus: cleanMarkdownCell(cells[5]),
      artifactPath: cleanMarkdownCell(cells[6]),
      jsonPointer: cleanMarkdownCell(cells[7]),
      sourceRef: cleanMarkdownCell(cells[8]),
      fixtureCoverage: cleanMarkdownCell(cells[9])
    });
  }

  assert.equal(rows.length, 40, "plans/README.md diagnostics registry must define 40 rows");
  return rows;
}

function splitMarkdownTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function cleanMarkdownCell(cell) {
  return cell.replace(/^`(.*)`$/, "$1");
}

function readmeComparableRegistryRow(row) {
  return {
    code: row.code,
    trigger: row.trigger,
    canonicalMessage: row.canonicalMessage,
    stage: row.stage,
    severity: row.severity,
    promotionStatus: row.promotionStatus,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef === "null" ? null : row.sourceRef,
    fixtureCoverage: row.fixtureCoverage
  };
}

function schemaComparableRegistryRow(row) {
  return readmeComparableRegistryRow(row);
}

async function assertEvidenceInvariants() {
  const adapter = await readJson("artifacts/p0/adapter-diagnostics.json");
  const evidence = await readJson("artifacts/p0/evidence.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(adapter.status, "pass");
  assert.equal(adapter.promotionStatus, "review_required");
  assert.equal(canonicalJson(adapter.environment), canonicalJson(evidence.environment));

  const adapterEntry = evidence.artifacts.find((entry) => entry.path === "artifacts/p0/adapter-diagnostics.json");
  assert.ok(adapterEntry, "evidence must include adapter diagnostics hash");
  assert.equal(adapterEntry.hash, sha256Hex(canonicalJson(adapter)));

  const finalEntry = evidence.artifacts[evidence.artifacts.length - 1];
  assert.equal(finalEntry.path, "artifacts/p0/evidence.json");
  const clone = JSON.parse(JSON.stringify(evidence));
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  assert.equal(finalEntry.hash, sha256Hex(canonicalJson(clone)));

  const adapterStat = await fs.stat(path.join(root, "artifacts/p0/adapter-diagnostics.json"));
  const evidenceStat = await fs.stat(path.join(root, "artifacts/p0/evidence.json"));
  assert.ok(adapterStat.mtimeMs <= evidenceStat.mtimeMs, "adapter diagnostics must be written before evidence");

  const review = evidence.validationResults.find((result) => result.fixtureKind === "review");
  assert.equal(review.actualValidationResult, "valid");
  assert.equal(review.actualPromotionStatus, "review_required");

  const disabled = evidence.validationResults.find((result) => result.fixturePath.endsWith("disabled-action-execution.json"));
  assert.equal(disabled.actualPhase, "adapter-conformance");
  assert.deepEqual(disabled.actualDiagnosticCodes, ["CATALOG_INVALID_VALUE"]);
}

async function loadSchemas() {
  const dir = path.join(root, "schemas");
  const files = await fs.readdir(dir);
  const schemas = {};
  for (const file of files.sort()) {
    if (file.endsWith(".json")) {
      schemas[file] = await readJson(`schemas/${file}`);
    }
  }
  return schemas;
}

function validateWith(ajv, schemaId, data, label) {
  const result = validateResult(ajv, schemaId, data);
  assert.equal(result.valid, true, `${label} failed schema validation: ${JSON.stringify(result.errors)}`);
}

function validateResult(ajv, schemaId, data) {
  const validate = ajv.getSchema(`https://surfaces.dev/schemas/p0/${schemaId}.schema.json`);
  assert.ok(validate, `schema missing: ${schemaId}`);
  const valid = validate(data);
  return { valid, errors: validate.errors || [] };
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}
