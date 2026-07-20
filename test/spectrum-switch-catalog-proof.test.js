import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../src/p0.js";
import {
  SSC_ARTIFACT_ROOT,
  SSC_CHECKBOX_CATALOG_PATH,
  SSC_CHECKBOX_EVIDENCE_PATH,
  SSC_COMPONENT_RAW_SHA256,
  SSC_EXPECTATION_ROWS,
  SSC_FIXTURE_ROOT,
  SSC_INCLUDED_POINTERS,
  SSC_PACKAGE_INTEGRITY,
  SSC_PACKAGE_TARBALL_SHA256,
  SSC_P2_EVIDENCE_PATH,
  SSC_SOURCE_ROOT
} from "../src/spectrum-switch-catalog-contract.js";
import { deepClone, rawFileHash, readJson, sha256Hex, writeCanonicalJson } from "../src/p2-contract.js";
import { spectrumSwitchCatalogInternals } from "../src/spectrum-switch-catalog-proof.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Switch source boundary is exact, independent, and immutable", async () => {
  assert.equal(await spectrumSwitchCatalogInternals.firstInputIntegrityFailureCode(root), null);
  const componentPath = `${SSC_SOURCE_ROOT}/npm/@adobe/spectrum-design-data/0.7.0/package/components/switch.json`;
  assert.equal(await rawFileHash(path.join(root, componentPath)), SSC_COMPONENT_RAW_SHA256);

  const lock = await readJson(path.join(root, `${SSC_SOURCE_ROOT}/source-addendum.lock.json`));
  assert.equal(lock.schemaId, "spectrum-switch-source-addendum-lock.v0");
  assert.equal(lock.packageIntegrity, SSC_PACKAGE_INTEGRITY);
  assert.equal(lock.tarballSha256, SSC_PACKAGE_TARBALL_SHA256);
  assert.deepEqual(lock.selectedFiles, [{
    hashAlgorithm: "sha256",
    packagePath: "components/switch.json",
    sha256: SSC_COMPONENT_RAW_SHA256
  }]);

  const p2Lock = await readJson(path.join(root, "sources/p2/design-system-source/package-snapshot.lock.json"));
  assert.equal(p2Lock.packageFiles.some((row) => row.packagePath === "components/switch.json"), false);
  const checkboxLock = await readJson(path.join(root, "sources/spectrum-checkbox-catalog/source-addendum.lock.json"));
  assert.deepEqual(checkboxLock.selectedFiles.map((row) => row.packagePath), ["components/checkbox.json"]);

  const manifest = await readJson(path.join(root, `${SSC_SOURCE_ROOT}/manifest.json`));
  assert.deepEqual([
    manifest.upstreamBoundaries.p2EvidenceRef.path,
    manifest.upstreamBoundaries.checkboxEvidenceRef.path,
    manifest.upstreamBoundaries.checkboxCatalogRef.path
  ], [SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH]);
  assert.deepEqual(manifest.includedPointers, SSC_INCLUDED_POINTERS);
  assert.equal(manifest.sourceFiles[0].sourceRefRoot.endsWith("#"), true);
});

test("Switch governed catalog adds exactly one component and one token", async () => {
  const base = await readJson(path.join(root, SSC_CHECKBOX_CATALOG_PATH));
  const catalog = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/governed-catalog.json`));
  const mapping = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/source-mapping.json`));
  const report = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`));

  assert.deepEqual(Object.keys(base.components).sort(), ["Button", "Checkbox", "InLineAlert"]);
  assert.deepEqual(Object.keys(catalog.components).sort(), ["Button", "Checkbox", "InLineAlert", "Switch"]);
  assert.deepEqual(Object.keys(catalog.tokens).filter((id) => !(id in base.tokens)), ["switch-control-width-medium-desktop"]);
  assert.equal(base.catalogId, "surfaces-spectrum-checkbox-catalog-governed");
  assert.equal(catalog.catalogId, "surfaces-spectrum-switch-catalog-governed");

  const switchComponent = catalog.components.Switch;
  assert.deepEqual(Object.keys(switchComponent.props).sort(), ["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"]);
  assert.deepEqual(Object.keys(switchComponent.states).sort(), ["down", "hover", "keyboardFocus"]);
  for (const field of ["actions", "events", "slots", "dataBindings", "variants"]) assert.deepEqual(switchComponent[field], {});
  assert.equal(Object.hasOwn(switchComponent, "runtimeKeyBindings"), false);
  assert.equal(Object.hasOwn(switchComponent, "toggleBehavior"), false);
  assert.equal(Object.hasOwn(switchComponent, "readOnlyBehavior"), false);
  assert.equal(switchComponent.accessibility.runtimeAccessibilityCompliance, "not-proven");
  assert.equal(catalog.tokens["switch-control-width-medium-desktop"].value, "26px");
  assert.equal(catalog.governance.promotionStatus, "review_required");
  assert.equal(Object.hasOwn(catalog.governance.rules, "switchSelectionPrecedence"), false);
  assert.deepEqual(Object.keys(mapping.mappingRows).length, 13);
  assert.deepEqual(Object.keys(mapping.reviewRequired).sort(), ["switch-activation-intent-review", "switch-standalone-label-review"]);
  assert.equal(Object.values(mapping.reviewRequired).every((row) => row.executable === false && row.reviewOwner === "design-systems-governance"), true);

  assert.equal(report.catalogExpansion.basePreservation.length, 36);
  assert.equal(report.catalogExpansion.basePreservation.every((row) => row.matched), true);
  for (const row of report.catalogExpansion.basePreservation) {
    assert.equal(row.baseHash, sha256Hex(canonicalJson(resolveJsonPointer(base, row.pointer))));
    assert.equal(row.expandedHash, sha256Hex(canonicalJson(resolveJsonPointer(catalog, row.pointer))));
  }
});

test("Switch fixtures cover exact valid, review, invalid, and causal outcomes", async () => {
  const manifest = await readJson(path.join(root, `${SSC_FIXTURE_ROOT}/expectations.manifest.json`));
  const report = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`));
  assert.equal(manifest.expectations.length, 42);
  assert.equal(manifest.expectations.length, SSC_EXPECTATION_ROWS.length);
  assert.deepEqual(countBy(manifest.expectations, (row) => row.kind), { invalid: 15, mutation: 20, review: 3, valid: 4 });
  assert.equal(report.summary.fixtureCount, 42);
  assert.equal(report.summary.basePreservedCount, 36);
  assert.equal(report.summary.reviewRequiredMappingCount, 2);
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(report.validationResults.every((row) => row.matched), true);

  const expectedMutationCodes = new Set([
    "SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH",
    "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH",
    "SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH",
    "SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED",
    "SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED",
    "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH",
    "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH",
    "SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH",
    "SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH",
    "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH",
    "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH"
  ]);
  const actualMutationCodes = new Set(report.validationResults.filter((row) => row.kind === "mutation").flatMap((row) => row.actualDiagnosticCodes));
  for (const code of expectedMutationCodes) assert.equal(actualMutationCodes.has(code), true, code);
});

test("Switch evidence reconstructs three upstream boundaries and its complete closure", async () => {
  const evidence = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/evidence.json`));
  assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(root, evidence), null);
  assert.deepEqual(evidence.boundaryRefs.map((ref) => ref.path), [SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH]);
  assert.equal(evidence.schemaClosure.length, 14);
  assert.equal(evidence.sourceFileRefs.length, 7);
  assert.equal(evidence.fixtureRefs.length, 43);
  assert.equal(evidence.artifactRefs.length, 5);
  assert.equal(evidence.artifactRefs.at(-1).hash, spectrumSwitchCatalogInternals.computeEvidenceSelfHash(evidence));

  const tampered = deepClone(evidence);
  tampered.artifactRefs[0].hash = flipHash(tampered.artifactRefs[0].hash);
  tampered.artifactRefs.at(-1).hash = spectrumSwitchCatalogInternals.computeEvidenceSelfHash(tampered);
  assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(root, tampered), "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH");
});

test("Switch final inspector rejects semantic metadata, source-tree, schema, and output-root drift", async () => {
  const evidence = await readJson(path.join(root, `${SSC_ARTIFACT_ROOT}/evidence.json`));
  const metadataTampered = deepClone(evidence);
  const switchRef = metadataTampered.sourceFileRefs.find((ref) => ref.path.endsWith("/components/switch.json"));
  switchRef.schemaId = "forged-source";
  switchRef.sourceRef = null;
  metadataTampered.provenance.generator = "forged-generator";
  metadataTampered.artifactRefs.at(-1).hash = spectrumSwitchCatalogInternals.computeEvidenceSelfHash(metadataTampered);
  assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(root, metadataTampered), "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH");

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-switch-final-inspector-"));
  try {
    await copyIntegrityWorkspace(root, tempRoot, evidence);
    const extraSource = path.join(tempRoot, SSC_SOURCE_ROOT, "unexpected.json");
    await fs.writeFile(extraSource, "{}", "utf8");
    assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence), "SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED");
    await fs.unlink(extraSource);

    const schemaPath = path.join(tempRoot, "schemas/spectrum-switch-catalog-fixture.v0.schema.json");
    const schema = await readJson(schemaPath);
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), "utf8");
    assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence), "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH");
    await writeCanonicalJson(schemaPath, schema);

    const artifactRoot = path.join(tempRoot, SSC_ARTIFACT_ROOT);
    const movedArtifactRoot = `${artifactRoot}-real`;
    await fs.rename(artifactRoot, movedArtifactRoot);
    await fs.symlink(path.basename(movedArtifactRoot), artifactRoot, "dir");
    assert.equal(await spectrumSwitchCatalogInternals.firstEvidenceIntegrityFailureCode(tempRoot, evidence), "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("Switch CLI accepts only the fixed six-input proof boundary", () => {
  const valid = spectrumSwitchCatalogInternals.parseArgs([
    "--source", SSC_SOURCE_ROOT,
    "--ingestion-evidence", SSC_P2_EVIDENCE_PATH,
    "--checkbox-evidence", SSC_CHECKBOX_EVIDENCE_PATH,
    "--catalog", SSC_CHECKBOX_CATALOG_PATH,
    "--fixture", SSC_FIXTURE_ROOT,
    "--out", SSC_ARTIFACT_ROOT
  ]);
  assert.equal(valid.ok, true);
  assert.equal(spectrumSwitchCatalogInternals.parseArgs(["--source", "/tmp/escape"]).ok, false);
  assert.equal(spectrumSwitchCatalogInternals.parseArgs([
    "--source", SSC_SOURCE_ROOT,
    "--ingestion-evidence", SSC_P2_EVIDENCE_PATH,
    "--checkbox-evidence", SSC_CHECKBOX_EVIDENCE_PATH,
    "--catalog", SSC_CHECKBOX_CATALOG_PATH,
    "--fixture", SSC_FIXTURE_ROOT,
    "--out", `${SSC_ARTIFACT_ROOT}/../escape`
  ]).ok, false);
});

function resolveJsonPointer(rootValue, pointer) {
  let current = rootValue;
  for (const encoded of pointer.slice(1).split("/")) {
    if (!encoded) continue;
    current = current[encoded.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  return current;
}

function countBy(rows, keyFor) {
  return Object.fromEntries([...rows.reduce((counts, row) => counts.set(keyFor(row), (counts.get(keyFor(row)) || 0) + 1), new Map()).entries()].sort());
}

function flipHash(hash) {
  return `${hash[0] === "0" ? "1" : "0"}${hash.slice(1)}`;
}

async function copyIntegrityWorkspace(sourceRoot, targetRoot, evidence) {
  const p2Evidence = await readJson(path.join(sourceRoot, SSC_P2_EVIDENCE_PATH));
  const checkboxEvidence = await readJson(path.join(sourceRoot, SSC_CHECKBOX_EVIDENCE_PATH));
  const paths = [...evidencePaths(p2Evidence), ...evidencePaths(checkboxEvidence), ...evidencePaths(evidence)];
  for (const relative of [...new Set(paths)].sort()) {
    const target = path.join(targetRoot, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(sourceRoot, relative), target);
  }
}

function evidencePaths(evidence) {
  return [
    evidence.sourceManifestRef?.path,
    ...(evidence.schemaClosure || []).map((ref) => ref.path),
    ...(evidence.sourceFileRefs || []).map((ref) => ref.path),
    ...(evidence.fixtureRefs || []).map((ref) => ref.path),
    ...(evidence.implementationRefs || []).map((ref) => ref.path),
    ...(evidence.artifactRefs || []).map((ref) => ref.path),
    evidence.reportRef?.path
  ].filter(Boolean);
}
