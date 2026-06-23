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

test("diagnostics schema is closed over registered rows", async () => {
  await materializeP0Contract(root);
  const schemas = await loadSchemas();
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  for (const schema of Object.values(schemas)) {
    ajv.addSchema(schema);
  }
  const diagnosticsSchema = await readJson("schemas/diagnostics.v0.schema.json");
  const rows = diagnosticsSchema.xDiagnosticsRegistry;
  const concrete = rows.find((row) => row.fixtureCoverage === "invalid/unknown-component.json");
  const schemaRow = rows.find((row) => row.code === "SCHEMA_VALIDATION_FAILED");

  validateWith(ajv, "diagnostics.v0", diagnosticFromRegistryRow(concrete), "concrete diagnostic row");
  assert.equal(validateResult(ajv, "diagnostics.v0", {
    ...diagnosticFromRegistryRow(concrete),
    artifactPath: "fixtures/p0/invalid/unknown-prop.json"
  }).valid, false, "registered code must not validate on the wrong artifact path");
  assert.equal(validateResult(ajv, "diagnostics.v0", {
    ...diagnosticFromRegistryRow(concrete),
    path: "/root/wrong",
    instanceLocation: "/root/wrong"
  }).valid, false, "registered code must not validate on the wrong JSON Pointer");

  validateWith(ajv, "diagnostics.v0", diagnosticFromRegistryRow(schemaRow, {
    artifactPath: "fixtures/p0/valid.surface-ir.json"
  }), "manifest-wide schema diagnostic row");
  assert.equal(validateResult(ajv, "diagnostics.v0", diagnosticFromRegistryRow(schemaRow, {
    artifactPath: "package.json"
  })).valid, false, "manifest-wide schema diagnostics must stay inside declared P0 artifacts");
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

test("P0 proof rejects tampered valid expectation artifact paths", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const manifestPath = path.join(root, "fixtures/p0/expectations.manifest.json");
  const original = await fs.readFile(manifestPath, "utf8");
  const invalidArtifactPaths = [
    "package.json",
    "/tmp/x",
    "../x",
    "fixtures/p0/invalid/unknown-component.json"
  ];

  try {
    for (const expectedArtifactPath of invalidArtifactPaths) {
      const manifest = JSON.parse(original);
      const validExpectation = manifest.expectations.find((entry) => entry.fixturePath === "fixtures/p0/valid.surface-ir.json");
      assert.ok(validExpectation, "valid fixture expectation must exist");
      validExpectation.expectedArtifactPath = expectedArtifactPath;
      await fs.writeFile(manifestPath, canonicalJson(manifest));

      await assert.rejects(
        runProof(),
        (error) => {
          assert.equal(error.code, 1);
          assert.match(error.stderr, /expectedArtifactPath|schema validation failed/);
          return true;
        },
        `tampered expectedArtifactPath must fail: ${expectedArtifactPath}`
      );
    }
  } finally {
    await fs.writeFile(manifestPath, original);
    await runProof();
  }
});

test("P0 proof rejects tampered valid expectation JSON Pointers", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const manifestPath = path.join(root, "fixtures/p0/expectations.manifest.json");
  const original = await fs.readFile(manifestPath, "utf8");
  const invalidJsonPointers = [
    "package.json",
    "/tmp/x",
    "../x",
    "/root/component"
  ];

  try {
    for (const expectedJsonPointer of invalidJsonPointers) {
      const manifest = JSON.parse(original);
      const validExpectation = manifest.expectations.find((entry) => entry.fixturePath === "fixtures/p0/valid.surface-ir.json");
      assert.ok(validExpectation, "valid fixture expectation must exist");
      validExpectation.expectedJsonPointer = expectedJsonPointer;
      await fs.writeFile(manifestPath, canonicalJson(manifest));

      await assert.rejects(
        runProof(),
        (error) => {
          assert.equal(error.code, 1);
          assert.match(error.stderr, /expectedJsonPointer|schema validation failed/);
          return true;
        },
        `tampered expectedJsonPointer must fail: ${expectedJsonPointer}`
      );
    }
  } finally {
    await fs.writeFile(manifestPath, original);
    await runProof();
  }
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
  try {
    await fs.rm(artifactDir, { recursive: true, force: true });
    await fs.writeFile(artifactDir, "not a directory");
    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 2);
        assert.match(error.stderr, /output path error/);
        return true;
      }
    );
  } finally {
    await fs.rm(artifactDir, { force: true });
    await runProof();
  }
});

test("P0 proof rejects parent traversal in command paths", async () => {
  await materializeP0Contract(root);
  await assert.rejects(
    execFileAsync("node", ["bin/interfacectl.js", "surfaces", "proof", "--fixture", "fixtures/p0", "--out", "../artifacts/p0"], { cwd: root }),
    (error) => {
      assert.equal(error.code, 2);
      assert.match(error.stderr, /POSIX-style relative path without \. or \.\. segments/);
      return true;
    }
  );
});

test("P0 proof rejects fixture files not declared by the manifest", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const extraFixture = path.join(root, "fixtures/p0/invalid/unexpected-extra.json");
  try {
    await fs.writeFile(extraFixture, "{}");
    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /fixture directory contents drift/);
        assert.match(error.stderr, /extra fixtures\/p0\/invalid\/unexpected-extra\.json/);
        return true;
      }
    );
  } finally {
    await fs.rm(extraFixture, { force: true });
    await runProof();
  }
});

test("P0 proof rejects fixture and schema directory drift that is not a regular file", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const extraFixtureDir = path.join(root, "fixtures/p0/invalid/empty-extra");
  const extraSchemaDir = path.join(root, "schemas/empty-extra");
  try {
    await fs.mkdir(extraFixtureDir);
    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /fixture directory contents drift/);
        assert.match(error.stderr, /extra fixtures\/p0\/invalid\/empty-extra\//);
        return true;
      }
    );

    await fs.rm(extraFixtureDir, { recursive: true, force: true });
    await fs.mkdir(extraSchemaDir);
    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /schema directory contents drift/);
        assert.match(error.stderr, /extra schemas\/empty-extra\//);
        return true;
      }
    );
  } finally {
    await fs.rm(extraFixtureDir, { recursive: true, force: true });
    await fs.rm(extraSchemaDir, { recursive: true, force: true });
    await runProof();
  }
});

test("P0 proof rejects schema files outside the declared suite", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const extraSchema = path.join(root, "schemas/unexpected.v0.schema.json");
  try {
    await fs.writeFile(extraSchema, "{}");
    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /schema directory contents drift/);
        assert.match(error.stderr, /extra schemas\/unexpected\.v0\.schema\.json/);
        return true;
      }
    );
  } finally {
    await fs.rm(extraSchema, { force: true });
    await runProof();
  }
});

test("P0 proof validates evidence hash mutation against actual artifact bytes", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const mutationPath = path.join(root, "fixtures/p0/mutations/hash-mismatch.evidence.json");
  const original = await fs.readFile(mutationPath, "utf8");
  try {
    await fs.writeFile(mutationPath, await fs.readFile(path.join(root, "artifacts/p0/evidence.json"), "utf8"));

    const result = await runProof();
    assert.match(result.stdout, /surfaces proof: pass/);
    assert.match(result.stdout, /validationResults: 40\/40 matched/);
  } finally {
    await fs.writeFile(mutationPath, original);
    await runProof();
  }
});

test("P0 proof rejects hash mismatch mutations outside the declared artifact order", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const mutationPath = path.join(root, "fixtures/p0/mutations/hash-mismatch.evidence.json");
  const original = await fs.readFile(mutationPath, "utf8");
  try {
    const mutation = JSON.parse(original);
    mutation.artifacts = [{
      role: "generated-artifact",
      path: "package.json",
      schemaId: null,
      hashAlgorithm: "sha256",
      hash: sha256Hex(canonicalJson(await readJson("package.json")))
    }];
    await fs.writeFile(mutationPath, canonicalJson(mutation));
    await runProof();
  } finally {
    await fs.writeFile(mutationPath, original);
    await runProof();
  }
});

test("P0 golden extraction rejects missing nested source refs", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const sourcePath = path.join(root, "fixtures/p0/source.fixture.json");
  const original = await fs.readFile(sourcePath, "utf8");
  try {
    const source = JSON.parse(original);
    delete source.components[0].accessibility.sourceRef;
    await fs.writeFile(sourcePath, canonicalJson(source));

    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /golden extraction failed: EXTRACT_SOURCE_REF_MISSING/);
        return true;
      }
    );
  } finally {
    await fs.writeFile(sourcePath, original);
    await runProof();
  }
});

test("P0 golden extraction rejects stale sourceRefs map entries", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const sourcePath = path.join(root, "fixtures/p0/source.fixture.json");
  const original = await fs.readFile(sourcePath, "utf8");
  try {
    const source = JSON.parse(original);
    source.sourceRefs["/components/0/accessibility"] = "fixture://p0/source#/wrong";
    await fs.writeFile(sourcePath, canonicalJson(source));

    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /golden extraction failed: EXTRACT_SOURCE_REF_MISSING/);
        return true;
      }
    );
  } finally {
    await fs.writeFile(sourcePath, original);
    await runProof();
  }
});

test("P0 proof rejects malformed Surface IR source refs", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const surfacePath = path.join(root, "fixtures/p0/valid.surface-ir.json");
  const original = await fs.readFile(surfacePath, "utf8");
  try {
    const surface = JSON.parse(original);
    surface.root.sourceRef = "not-a-fixture-ref";
    await fs.writeFile(surfacePath, canonicalJson(surface));

    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /run expectation mismatch/);
        return true;
      }
    );
  } finally {
    await fs.writeFile(surfacePath, original);
    await runProof();
  }
});

test("P0 proof rejects output symlinks before writing artifacts", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const target = path.join(root, "tmp-p0-symlink-target.json");
  const link = path.join(artifactDir, "extract.json");
  const original = await fs.readFile(link, "utf8");
  try {
    await fs.writeFile(target, "{}");
    await fs.rm(link, { force: true });
    await fs.symlink(target, link);

    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /unsafe expected output entry/);
        return true;
      }
    );
    assert.equal(await fs.readFile(target, "utf8"), "{}");
  } finally {
    await fs.rm(link, { force: true });
    await fs.writeFile(link, original);
    await fs.rm(target, { force: true });
    await runProof();
  }
});

test("P0 proof rejects symlinked output root before writing artifacts", async () => {
  await materializeP0Contract(root);
  await fs.rm(artifactDir, { recursive: true, force: true });
  await runProof();

  const targetDir = path.join(root, "tmp-p0-symlink-output-root");
  try {
    await fs.rm(artifactDir, { recursive: true, force: true });
    await fs.mkdir(targetDir, { recursive: true });
    await fs.symlink(targetDir, artifactDir);

    await assert.rejects(
      runProof(),
      (error) => {
        assert.equal(error.code, 2);
        assert.match(error.stderr, /output path error/);
        return true;
      }
    );
    assert.deepEqual(await fs.readdir(targetDir), []);
  } finally {
    await fs.rm(artifactDir, { force: true });
    await fs.rm(targetDir, { recursive: true, force: true });
    await runProof();
  }
});

test("P0 proof rejects non-P0 output roots before creating directories", async () => {
  await materializeP0Contract(root);
  const nonP0Out = path.join(root, "tmp-safe-relative-out");
  await fs.rm(nonP0Out, { recursive: true, force: true });
  try {
    await assert.rejects(
      execFileAsync("node", ["bin/interfacectl.js", "surfaces", "proof", "--fixture", "fixtures/p0", "--out", "tmp-safe-relative-out"], { cwd: root }),
      (error) => {
        assert.equal(error.code, 2);
        assert.match(error.stderr, /P0 proof requires --fixture fixtures\/p0 --out artifacts\/p0/);
        return true;
      }
    );
    await assert.rejects(fs.stat(nonP0Out), { code: "ENOENT" });
  } finally {
    await fs.rm(nonP0Out, { recursive: true, force: true });
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
  await assertNormalizedTokenArtifacts();
  const evidence = await readJson("artifacts/p0/evidence.json");
  validateWith(ajv, "evidence.v0", evidence, "evidence artifact");
  for (const artifactPath of ["package.json", "/tmp/x", "../x"]) {
    const poisonedEvidence = JSON.parse(JSON.stringify(evidence));
    const validResult = poisonedEvidence.validationResults.find((result) => result.fixturePath === "fixtures/p0/valid.surface-ir.json");
    assert.ok(validResult, "valid fixture result must exist");
    validResult.artifactPath = artifactPath;
    assert.equal(
      validateResult(ajv, "evidence.v0", poisonedEvidence).valid,
      false,
      `evidence validationResults artifactPath must reject ${artifactPath}`
    );
  }
  for (const jsonPointer of ["package.json", "/tmp/x", "../x"]) {
    const poisonedEvidence = JSON.parse(JSON.stringify(evidence));
    const validResult = poisonedEvidence.validationResults.find((result) => result.fixturePath === "fixtures/p0/valid.surface-ir.json");
    assert.ok(validResult, "valid fixture result must exist");
    validResult.jsonPointer = jsonPointer;
    assert.equal(
      validateResult(ajv, "evidence.v0", poisonedEvidence).valid,
      false,
      `evidence validationResults jsonPointer must reject ${jsonPointer}`
    );
  }
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

async function assertNormalizedTokenArtifacts() {
  const extract = await readJson("artifacts/p0/extract.json");
  const catalog = await readJson("artifacts/p0/catalog.json");

  assert.equal(extract.tokens.color.action.primaryBg.$value, "{color.brand.primary}");
  assert.equal(extract.tokens.color.action.primaryBg.resolvedValue, "#0B5FFF");
  assert.equal(extract.tokens.color.action.dangerBg.$ref, "/tokens/color/brand/danger");
  assert.equal(extract.tokens.color.action.dangerBg.resolvedValue, "#C1121F");
  assert.equal(extract.tokens.spacing.compact.$extends, "/tokens/spacing/base");
  assert.equal(extract.tokens.spacing.compact.md.$value, 12);
  assert.equal(extract.tokens.spacing.compact.lg.sourceRef, "fixture://p0/source#/tokens/spacing/base/lg");
  assert.deepEqual(extract.tokens.typography.heading.resolvedSubvalues.fontSize, {
    value: 20,
    sourceRef: "fixture://p0/source#/tokens/typography/heading/$value/fontSize"
  });
  assert.deepEqual(extract.tokens.shadow.raised.resolvedSubvalues.blur, {
    value: 18,
    sourceRef: "fixture://p0/source#/tokens/shadow/raised/$value/blur"
  });
  assert.equal(
    extract.sourceRefs["/tokens/typography/heading/$value/fontSize"],
    "fixture://p0/source#/tokens/typography/heading/$value/fontSize"
  );
  assert.equal(
    extract.sourceRefs["/tokens/shadow/raised/$value/blur"],
    "fixture://p0/source#/tokens/shadow/raised/$value/blur"
  );

  assert.equal(catalog.tokens.color.action.primaryBg.$value, "#0B5FFF");
  assert.equal(catalog.tokens.color.action.dangerBg.$value, "#C1121F");
  assert.equal(Object.prototype.hasOwnProperty.call(catalog.tokens.color.action.dangerBg, "$ref"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(catalog.tokens.color.action.dangerBg, "resolvedValue"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(catalog.tokens.spacing.compact, "$extends"), false);
  assert.equal(catalog.tokens.spacing.compact.md.$value, 12);
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

function diagnosticFromRegistryRow(row, overrides = {}) {
  const diagnosticSource = row.code === "SCHEMA_VALIDATION_FAILED" ? "json-schema" :
    row.stage === "extract" ? "extractor" :
    row.stage === "compile" ? "catalog-validator" :
    row.stage === "govern" ? "governance" :
    row.stage === "adapter-conformance" ? "adapter" :
    "catalog-validator";
  return {
    code: row.code,
    diagnosticSource,
    schemaOutputFormat: diagnosticSource === "json-schema" ? "basic" : null,
    severity: row.severity,
    message: row.canonicalMessage,
    stage: row.stage,
    path: row.jsonPointer,
    instanceLocation: row.jsonPointer,
    keywordLocation: diagnosticSource === "json-schema" ? "/type" : null,
    absoluteKeywordLocation: diagnosticSource === "json-schema" ? "https://surfaces.dev/schemas/p0/surface-ir.v0.schema.json#/type" : null,
    sourceRef: row.sourceRef,
    artifactPath: row.artifactPath === "checked artifact" ? "fixtures/p0/valid.surface-ir.json" : row.artifactPath,
    validationResult: row.severity === "review" ? "valid" : row.promotionStatus === "blocked" ? "invalid" : "valid",
    promotionStatus: row.promotionStatus,
    suggestedAction: "Test diagnostic schema closure.",
    ...overrides
  };
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
