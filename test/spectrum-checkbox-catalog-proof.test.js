import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  SCC_ARTIFACT_ROOT,
  SCC_COMPONENT_RAW_SHA256,
  SCC_EXPECTATION_ROWS,
  SCC_FIXTURE_ROOT,
  SCC_PACKAGE_TARBALL_SHA256,
  SCC_P2_CATALOG_PATH,
  SCC_P2_EVIDENCE_PATH,
  SCC_SOURCE_ROOT
} from "../src/spectrum-checkbox-catalog-contract.js";
import { deepClone, rawFileHash, readJson, writeCanonicalJson } from "../src/p2-contract.js";
import { spectrumCheckboxCatalogInternals } from "../src/spectrum-checkbox-catalog-proof.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Checkbox catalog proof inputs are intact and independently locked", async () => {
  assert.equal(await spectrumCheckboxCatalogInternals.firstInputIntegrityFailureCode(root), null);
  assert.equal(
    await rawFileHash(path.join(root, `${SCC_SOURCE_ROOT}/npm/@adobe/spectrum-design-data/0.7.0/package/components/checkbox.json`)),
    SCC_COMPONENT_RAW_SHA256
  );
  const lock = await readJson(path.join(root, `${SCC_SOURCE_ROOT}/source-addendum.lock.json`));
  assert.equal(lock.tarballSha256, SCC_PACKAGE_TARBALL_SHA256);
  assert.deepEqual(lock.selectedFiles.map((row) => row.packagePath), ["components/checkbox.json"]);
  const p2Lock = await readJson(path.join(root, "sources/p2/design-system-source/package-snapshot.lock.json"));
  assert.equal(p2Lock.packageFiles.some((row) => row.packagePath === "components/checkbox.json"), false);
  const manifest = await readJson(path.join(root, `${SCC_SOURCE_ROOT}/manifest.json`));
  assert.equal(manifest.sourceFiles[0].sourceRefRoot.endsWith("#"), true);
  assert.equal(manifest.sourceFiles[0].sourceRefRoot.endsWith("#/"), false);
});

test("Checkbox governed catalog adds one component and one token without executable behavior", async () => {
  const base = await readJson(path.join(root, SCC_P2_CATALOG_PATH));
  const catalog = await readJson(path.join(root, `${SCC_ARTIFACT_ROOT}/governed-catalog.json`));
  assert.deepEqual(Object.keys(base.components).sort(), ["Button", "InLineAlert"]);
  assert.deepEqual(Object.keys(catalog.components).sort(), ["Button", "Checkbox", "InLineAlert"]);
  assert.deepEqual(Object.keys(catalog.tokens).filter((id) => !(id in base.tokens)), ["checkbox-control-size-medium-desktop"]);
  assert.equal(base.catalogId, "surfaces-p2-governed-spectrum");
  assert.equal(catalog.catalogId, "surfaces-spectrum-checkbox-catalog-governed");
  assert.deepEqual(catalog.components.Checkbox.actions, {});
  assert.deepEqual(catalog.components.Checkbox.events, {});
  assert.equal(catalog.components.Checkbox.accessibility.runtimeAccessibilityCompliance, "not-proven");
  assert.deepEqual(catalog.governance.rules.checkboxSelectionPrecedence, {
    executable: false,
    precedence: "indeterminate-over-selected",
    sourceRef: "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/checkbox.json#/options/isIndeterminate",
    when: "isIndeterminate=true"
  });
});

test("Checkbox fixtures cover valid, review, invalid, and causal mutation outcomes", async () => {
  const manifest = await readJson(path.join(root, `${SCC_FIXTURE_ROOT}/expectations.manifest.json`));
  assert.equal(manifest.expectations.length, SCC_EXPECTATION_ROWS.length);
  assert.deepEqual([...new Set(manifest.expectations.map((row) => row.kind))].sort(), ["invalid", "mutation", "review", "valid"]);
  assert.equal(manifest.runExpectation.promotionStatus, "review_required");
  const report = await readJson(path.join(root, `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json`));
  assert.equal(report.status, "pass");
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(report.summary.fixtureCount, SCC_EXPECTATION_ROWS.length);
  assert.deepEqual(
    [report.catalogExpansion.baseCatalogId, report.catalogExpansion.expandedCatalogId, report.catalogExpansion.catalogIdChanged],
    ["surfaces-p2-governed-spectrum", "surfaces-spectrum-checkbox-catalog-governed", true]
  );
  assert.equal(report.validationResults.every((row) => row.matched), true);
});

test("Checkbox evidence has a valid semantic and hash closure", async () => {
  const evidence = await readJson(path.join(root, `${SCC_ARTIFACT_ROOT}/evidence.json`));
  assert.equal(await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);
  assert.deepEqual(evidence.boundaryRefs.map((ref) => ref.path), [SCC_P2_EVIDENCE_PATH, SCC_P2_CATALOG_PATH]);
  assert.equal(evidence.artifactRefs.at(-1).hash, spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(evidence));

  const tampered = deepClone(evidence);
  tampered.artifactRefs[0].hash = `${tampered.artifactRefs[0].hash[0] === "0" ? "1" : "0"}${tampered.artifactRefs[0].hash.slice(1)}`;
  tampered.artifactRefs.at(-1).hash = spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(tampered);
  assert.equal(
    await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(root, tampered),
    "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH"
  );
});

test("Checkbox final inspector reconstructs metadata and exact persisted closure", async () => {
  const evidence = await readJson(path.join(root, `${SCC_ARTIFACT_ROOT}/evidence.json`));
  const metadataTampered = deepClone(evidence);
  const checkboxRef = metadataTampered.sourceFileRefs.find((ref) => ref.path.endsWith("/components/checkbox.json"));
  checkboxRef.schemaId = "forged-source";
  checkboxRef.sourceRef = null;
  metadataTampered.provenance.generator = "forged-generator";
  metadataTampered.provenance.sourceRefs = ["forged://source"];
  metadataTampered.artifactRefs.at(-1).hash = spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(metadataTampered);
  assert.equal(
    await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(root, metadataTampered),
    "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH"
  );

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-checkbox-final-inspector-"));
  try {
    await copyIntegrityWorkspace(root, tempRoot, evidence);
    const extraFixture = path.join(tempRoot, SCC_FIXTURE_ROOT, "invalid", "undeclared-extra.json");
    await fs.writeFile(extraFixture, "{}", "utf8");
    assert.equal(
      await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence),
      "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH"
    );
    await fs.unlink(extraFixture);

    const schemaPath = path.join(tempRoot, "schemas/spectrum-checkbox-catalog-fixture.v0.schema.json");
    const schema = await readJson(schemaPath);
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), "utf8");
    assert.equal(
      await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence),
      "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH"
    );
    await writeCanonicalJson(schemaPath, schema);

    const artifactRoot = path.join(tempRoot, SCC_ARTIFACT_ROOT);
    const movedArtifactRoot = `${artifactRoot}-real`;
    await fs.rename(artifactRoot, movedArtifactRoot);
    await fs.symlink(path.basename(movedArtifactRoot), artifactRoot, "dir");
    assert.equal(
      await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence),
      "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH"
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("Checkbox CLI accepts only the fixed proof boundary", () => {
  const valid = spectrumCheckboxCatalogInternals.parseArgs([
    "--source", SCC_SOURCE_ROOT,
    "--ingestion-evidence", SCC_P2_EVIDENCE_PATH,
    "--catalog", SCC_P2_CATALOG_PATH,
    "--fixture", SCC_FIXTURE_ROOT,
    "--out", SCC_ARTIFACT_ROOT
  ]);
  assert.equal(valid.ok, true);
  assert.equal(spectrumCheckboxCatalogInternals.parseArgs(["--source", "/tmp/escape"]).ok, false);
  assert.equal(spectrumCheckboxCatalogInternals.parseArgs([
    "--source", SCC_SOURCE_ROOT,
    "--ingestion-evidence", SCC_P2_EVIDENCE_PATH,
    "--catalog", SCC_P2_CATALOG_PATH,
    "--fixture", SCC_FIXTURE_ROOT,
    "--out", `${SCC_ARTIFACT_ROOT}/../escape`
  ]).ok, false);
});

async function copyIntegrityWorkspace(sourceRoot, targetRoot, evidence) {
  const p2Evidence = await readJson(path.join(sourceRoot, SCC_P2_EVIDENCE_PATH));
  const paths = [
    SCC_P2_EVIDENCE_PATH,
    p2Evidence.sourceManifestRef.path,
    ...p2Evidence.schemaClosure.map((ref) => ref.path),
    ...p2Evidence.sourceFileRefs.map((ref) => ref.path),
    ...p2Evidence.fixtureRefs.map((ref) => ref.path),
    ...p2Evidence.artifactRefs.map((ref) => ref.path),
    ...evidence.schemaClosure.map((ref) => ref.path),
    ...evidence.sourceFileRefs.map((ref) => ref.path),
    ...evidence.fixtureRefs.map((ref) => ref.path),
    ...evidence.implementationRefs.map((ref) => ref.path),
    ...evidence.artifactRefs.map((ref) => ref.path),
    evidence.reportRef.path
  ];
  for (const relative of [...new Set(paths)].sort()) {
    const target = path.join(targetRoot, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(sourceRoot, relative), target);
  }
}
