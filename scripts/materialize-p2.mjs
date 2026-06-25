#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import {
  P2_ENVIRONMENT,
  P2_FIXTURE_ROOT,
  P2_MAPPING_FILES,
  P2_PACKAGE_INTEGRITY,
  P2_PACKAGE_NAME,
  P2_PACKAGE_TARBALL,
  P2_PACKAGE_VERSION,
  P2_POLICY_REFS,
  P2_SOURCE_FILES,
  P2_SOURCE_ROOT,
  P2_TIMESTAMP,
  P2_VERSION,
  buildP2CompanionSources,
  rawFileHash,
  writeCanonicalJson
} from "../src/p2-contract.js";

const cwd = process.cwd();

await materializeP2(cwd);

async function materializeP2(root) {
  const companions = await buildP2CompanionSources(root);
  for (const [relativePath, data] of companions) {
    await writeCanonicalJson(path.join(root, P2_SOURCE_ROOT, relativePath), data);
  }

  for (const sourceFile of P2_SOURCE_FILES) {
    await assertRegularFile(path.join(root, P2_SOURCE_ROOT, sourceFile.path), `${P2_SOURCE_ROOT}/${sourceFile.path}`);
  }
  for (const mappingFile of P2_MAPPING_FILES) {
    await assertRegularFile(path.join(root, P2_SOURCE_ROOT, mappingFile.path), `${P2_SOURCE_ROOT}/${mappingFile.path}`);
  }
  await assertRegularFile(path.join(root, P2_FIXTURE_ROOT, "expectations.manifest.json"), `${P2_FIXTURE_ROOT}/expectations.manifest.json`);

  const sourceFiles = [];
  for (const sourceFile of P2_SOURCE_FILES) {
    sourceFiles.push({
      ...sourceFile,
      sha256: await rawFileHash(path.join(root, P2_SOURCE_ROOT, sourceFile.path))
    });
  }
  const requiredMappings = [];
  for (const mappingFile of P2_MAPPING_FILES) {
    requiredMappings.push({
      ...mappingFile,
      sha256: await rawFileHash(path.join(root, P2_SOURCE_ROOT, mappingFile.path))
    });
  }

  const manifest = {
    schemaId: "design-source-manifest.v0",
    version: P2_VERSION,
    designSystemId: "adobe-spectrum",
    designSystemName: "Adobe Spectrum Design Data",
    sourceFamily: "design-system-source-bundle.v0",
    packageName: P2_PACKAGE_NAME,
    packageVersion: P2_PACKAGE_VERSION,
    packageTarball: P2_PACKAGE_TARBALL,
    packageIntegrity: P2_PACKAGE_INTEGRITY,
    snapshotRoot: `${P2_SOURCE_ROOT}/npm/@adobe/spectrum-design-data/0.7.0/package`,
    sourceRefGrammar: "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/<posix-package-path>#<rfc6901-json-pointer>",
    initialComponents: ["button", "in-line-alert"],
    sourceFiles,
    requiredMappings,
    policyRefs: P2_POLICY_REFS,
    generatedAt: P2_TIMESTAMP,
    environment: { host: null }
  };

  await writeCanonicalJson(path.join(root, P2_SOURCE_ROOT, "manifest.json"), manifest);
  console.log("P2 materialize: pass");
}

async function assertRegularFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw new Error(`missing P2 source input: ${label}`);
  }
  if (!stat.isFile()) {
    throw new Error(`P2 source input is not a regular file: ${label}`);
  }
}
