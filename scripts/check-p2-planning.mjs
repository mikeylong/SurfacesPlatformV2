import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";

const p2SchemaFiles = [
  "schemas/design-source-manifest.v0.schema.json",
  "schemas/design-source-inventory.v0.schema.json",
  "schemas/design-source-mapping.v0.schema.json",
  "schemas/design-system-ingestion-report.v0.schema.json",
  "schemas/design-system-ingestion-evidence.v0.schema.json",
  "schemas/design-system-ingestion-expectations.v0.schema.json",
  "schemas/design-system-ingestion-diagnostics.v0.schema.json",
  "schemas/design-system-ingestion-valid-fixture.v0.schema.json"
];

const sharedSchemaFiles = [
  "schemas/extract.v0.schema.json",
  "schemas/runtime-catalog.v0.schema.json",
  "schemas/diagnostics.v0.schema.json",
  "schemas/fixture-expectations.v0.schema.json",
  "schemas/evidence.v0.schema.json"
];

const sourceFiles = [
  "npm/@adobe/spectrum-design-data/0.7.0/package/package.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/README.md",
  "npm/@adobe/spectrum-design-data/0.7.0/package/LICENSE",
  "npm/@adobe/spectrum-design-data/0.7.0/package/components/button.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/components/in-line-alert.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/components.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/property-terms.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/variants.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/states.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/anatomy-terms.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/token-terminology.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/registry/token-objects.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/color-component.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/color-aliases.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/color-palette.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/layout-component.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/layout.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/tokens/typography.tokens.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/mode-sets/color-scheme.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/mode-sets/contrast.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/mode-sets/scale.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/fields/variant.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/fields/state.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/fields/size.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/fields/property.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/fields/anatomy.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/guidelines/developer-overview.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/guidelines/states.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/guidelines/colors.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/guidelines/spacing.json",
  "npm/@adobe/spectrum-design-data/0.7.0/package/guidelines/typography-fundamentals.json",
  "docs/usage-policy.json"
];

const requiredMappings = [
  "mappings/component-map.json",
  "mappings/token-map.json",
  "mappings/policy-map.json"
];

const requiredPolicyRefs = [
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/developer-overview.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/states.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/colors.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/spacing.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/typography-fundamentals.json#/",
  "source://p2/docs/usage-policy.json#/"
];

const p2Artifacts = [
  "artifacts/p2/source-inventory.json",
  "artifacts/p2/source-mapping.json",
  "artifacts/p2/extract.json",
  "artifacts/p2/catalog.json",
  "artifacts/p2/governed-catalog.json",
  "artifacts/p2/ingestion-report.json",
  "artifacts/p2/evidence.json"
];

const fixtureFiles = [
  "fixtures/p2/valid/spectrum-button.design-source.json",
  "fixtures/p2/valid/spectrum-in-line-alert.design-source.json",
  "fixtures/p2/valid/spectrum-subset.source-mapping.json",
  "fixtures/p2/review/manual-mapping-required.design-source.json",
  "fixtures/p2/invalid/unmapped-component.design-source.json",
  "fixtures/p2/invalid/unsupported-token.design-source.json",
  "fixtures/p2/invalid/unsupported-mode.design-source.json",
  "fixtures/p2/invalid/ambiguous-variant.design-source.json",
  "fixtures/p2/invalid/governance-policy-missing.design-source.json",
  "fixtures/p2/invalid/duplicate-normalized-id.design-source-mapping.json",
  "fixtures/p2/invalid/mapping-row-ref-invalid.design-source-mapping.json",
  "fixtures/p2/invalid/mapping-cardinality-invalid.design-source-mapping.json",
  "fixtures/p2/mutations/missing-source-manifest.design-source.json",
  "fixtures/p2/mutations/package-integrity-mismatch.design-source.json",
  "fixtures/p2/mutations/source-path-undeclared.design-source.json",
  "fixtures/p2/mutations/invalid-source-ref.design-source.json",
  "fixtures/p2/mutations/source-hash-mismatch.design-source-inventory.json",
  "fixtures/p2/mutations/missing-source-ref.extract.json",
  "fixtures/p2/mutations/mapping-authority-escalation.design-source-mapping.json",
  "fixtures/p2/mutations/schema-hash-mismatch.design-system-ingestion-evidence.json",
  "fixtures/p2/mutations/hash-mismatch.design-system-ingestion-evidence.json"
];

const requiredFiles = [
  ...p2SchemaFiles,
  "sources/p2/design-system-source/README.md",
  "sources/p2/design-system-source/manifest.template.json",
  "fixtures/p2/expectations.manifest.json",
  ...fixtureFiles
];

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const fail = (message) => {
  throw new Error(message);
};

const assertArrayEquals = (actual, expected, label) => {
  if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) {
    fail(`${label} mismatch:\nactual=${JSON.stringify(actual, null, 2)}\nexpected=${JSON.stringify(expected, null, 2)}`);
  }
};

const assertSetEquals = (actual, expected, label) => {
  assertArrayEquals([...actual].sort(), [...expected].sort(), label);
};

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
};

const pointerPattern = /^#\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)?$/;
const packagePathPattern = /^(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*(?:^|\/)\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)*$/;

const assertNormalizedPath = (value, label) => {
  if (!packagePathPattern.test(value) || path.posix.normalize(value) !== value) {
    fail(`${label} is not a normalized POSIX path: ${value}`);
  }
};

const parseSourceRef = (ref, label) => {
  const spectrumPrefix = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/";
  const docsPrefix = "source://p2/docs/";
  if (ref.startsWith(spectrumPrefix)) {
    const rest = ref.slice(spectrumPrefix.length);
    const hashIndex = rest.indexOf("#");
    if (hashIndex === -1) fail(`${label} missing JSON Pointer fragment: ${ref}`);
    const packagePath = rest.slice(0, hashIndex);
    const fragment = rest.slice(hashIndex);
    assertNormalizedPath(packagePath, label);
    if (!pointerPattern.test(fragment)) fail(`${label} has invalid JSON Pointer fragment: ${ref}`);
    return `npm/@adobe/spectrum-design-data/0.7.0/package/${packagePath}`;
  }
  if (ref.startsWith(docsPrefix)) {
    const rest = ref.slice(docsPrefix.length);
    const hashIndex = rest.indexOf("#");
    if (hashIndex === -1) fail(`${label} missing JSON Pointer fragment: ${ref}`);
    const docsPath = rest.slice(0, hashIndex);
    const fragment = rest.slice(hashIndex);
    if (docsPath !== "usage-policy.json" || !pointerPattern.test(fragment)) {
      fail(`${label} has invalid docs source ref: ${ref}`);
    }
    return `docs/${docsPath}`;
  }
  fail(`${label} has unknown source ref scheme: ${ref}`);
};

const parseMappingRef = (ref, label) => {
  const prefix = "mapping://p2/spectrum/";
  if (!ref.startsWith(prefix)) fail(`${label} has unknown mapping ref scheme: ${ref}`);
  const rest = ref.slice(prefix.length);
  const hashIndex = rest.indexOf("#");
  if (hashIndex === -1) fail(`${label} missing JSON Pointer fragment: ${ref}`);
  const mappingPath = rest.slice(0, hashIndex);
  const fragment = rest.slice(hashIndex);
  if (!["component-map.json", "token-map.json", "policy-map.json"].includes(mappingPath) || !pointerPattern.test(fragment)) {
    fail(`${label} has invalid mapping ref: ${ref}`);
  }
  return `mappings/${mappingPath}`;
};

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    fail(`missing P2 planning file: ${file}`);
  }
}

for (const file of requiredFiles.filter((file) => file.endsWith(".json"))) {
  readJson(file);
}

const schemas = new Map([...p2SchemaFiles, ...sharedSchemaFiles].map((file) => [file, readJson(file)]));
const ajv = new Ajv2020({ strict: false, validateFormats: false });
for (const schema of schemas.values()) {
  ajv.addSchema(schema);
}
for (const [file, schema] of schemas) {
  if (!ajv.getSchema(schema.$id)) {
    fail(`failed to register schema: ${file}`);
  }
}

const validateExpectations = ajv.getSchema(schemas.get("schemas/design-system-ingestion-expectations.v0.schema.json").$id);
const expectationsManifest = readJson("fixtures/p2/expectations.manifest.json");
if (!validateExpectations(expectationsManifest)) {
  fail(`invalid P2 expectations manifest: ${JSON.stringify(validateExpectations.errors)}`);
}

const validateValidFixture = ajv.getSchema(schemas.get("schemas/design-system-ingestion-valid-fixture.v0.schema.json").$id);
for (const file of [
  "fixtures/p2/valid/spectrum-button.design-source.json",
  "fixtures/p2/valid/spectrum-in-line-alert.design-source.json"
]) {
  const fixture = readJson(file);
  if (!validateValidFixture(fixture)) {
    fail(`invalid Spectrum component fixture ${file}: ${JSON.stringify(validateValidFixture.errors)}`);
  }
}

const validateMapping = ajv.getSchema(schemas.get("schemas/design-source-mapping.v0.schema.json").$id);
const mapping = readJson("fixtures/p2/valid/spectrum-subset.source-mapping.json");
if (!validateMapping(mapping)) {
  fail(`invalid Spectrum mapping fixture: ${JSON.stringify(validateMapping.errors)}`);
}

const sourceManifestTemplate = readJson("sources/p2/design-system-source/manifest.template.json");
assertSetEquals(new Set(sourceManifestTemplate.sourceFiles.map((entry) => entry.path)), new Set(sourceFiles), "manifest template sourceFiles");
assertSetEquals(new Set(sourceManifestTemplate.requiredMappings.map((entry) => entry.path)), new Set(requiredMappings), "manifest template requiredMappings");
assertSetEquals(new Set(sourceManifestTemplate.policyRefs), new Set(requiredPolicyRefs), "manifest template policyRefs");

for (const sourceFile of sourceManifestTemplate.sourceFiles) {
  assertNormalizedPath(sourceFile.path, `manifest source file ${sourceFile.path}`);
  if (sourceFile.packagePath !== null) {
    assertNormalizedPath(sourceFile.packagePath, `manifest package path ${sourceFile.packagePath}`);
    const expectedPath = `npm/@adobe/spectrum-design-data/0.7.0/package/${sourceFile.packagePath}`;
    if (sourceFile.path !== expectedPath) {
      fail(`manifest path/packagePath mismatch: ${sourceFile.path} !== ${expectedPath}`);
    }
  }
  const refPath = parseSourceRef(sourceFile.sourceRefRoot, `sourceRefRoot for ${sourceFile.path}`);
  if (refPath !== sourceFile.path) {
    fail(`sourceRefRoot does not match source file path: ${sourceFile.sourceRefRoot}`);
  }
}

for (const mappingRef of sourceManifestTemplate.requiredMappings) {
  assertNormalizedPath(mappingRef.path, `manifest mapping path ${mappingRef.path}`);
  const refPath = parseMappingRef(mappingRef.mappingRefRoot, `mappingRefRoot for ${mappingRef.path}`);
  if (refPath !== mappingRef.path) {
    fail(`mappingRefRoot does not match mapping path: ${mappingRef.mappingRefRoot}`);
  }
}

const declaredSourcePaths = new Set(sourceManifestTemplate.sourceFiles.map((entry) => entry.path));
const declaredMappingPaths = new Set(sourceManifestTemplate.requiredMappings.map((entry) => entry.path));
const assertDeclaredSourceRef = (ref, label) => {
  const refPath = parseSourceRef(ref, label);
  if (!declaredSourcePaths.has(refPath)) fail(`${label} points outside manifest-declared source files: ${ref}`);
};
const assertDeclaredMappingRef = (ref, label) => {
  const refPath = parseMappingRef(ref, label);
  if (!declaredMappingPaths.has(refPath)) fail(`${label} points outside manifest-declared mapping files: ${ref}`);
};

for (const policyRef of sourceManifestTemplate.policyRefs) {
  assertDeclaredSourceRef(policyRef, `policyRef ${policyRef}`);
}

for (const file of [
  "fixtures/p2/valid/spectrum-button.design-source.json",
  "fixtures/p2/valid/spectrum-in-line-alert.design-source.json"
]) {
  const fixture = readJson(file);
  fixture.sourceRefs.forEach((ref, index) => assertDeclaredSourceRef(ref, `${file} sourceRefs/${index}`));
  fixture.mappingRefs.forEach((ref, index) => assertDeclaredMappingRef(ref, `${file} mappingRefs/${index}`));
}

for (const [index, row] of mapping.mappingRows.entries()) {
  row.sourceRefs.forEach((ref, refIndex) => assertDeclaredSourceRef(ref, `mappingRows/${index}/sourceRefs/${refIndex}`));
  row.mappingRefs.forEach((ref, refIndex) => assertDeclaredMappingRef(ref, `mappingRows/${index}/mappingRefs/${refIndex}`));
  if (row.cardinality.sourceMax !== null && row.cardinality.sourceMax < row.cardinality.sourceMin) {
    fail(`mappingRows/${index} has incompatible source cardinality`);
  }
  if (row.cardinality.targetMax !== null && row.cardinality.targetMax < row.cardinality.targetMin) {
    fail(`mappingRows/${index} has incompatible target cardinality`);
  }
}

mapping.provenance.sourceRefs.forEach((ref, index) => assertDeclaredSourceRef(ref, `mapping provenance sourceRefs/${index}`));

const physicalP2Fixtures = walkFiles("fixtures/p2").filter((file) => file.endsWith(".json")).sort();
assertArrayEquals(physicalP2Fixtures, ["fixtures/p2/expectations.manifest.json", ...fixtureFiles].sort(), "physical P2 fixture files");
assertArrayEquals(expectationsManifest.expectations.map((row) => row.fixturePath), fixtureFiles, "expectations fixture order");

const diagnosticsSchema = schemas.get("schemas/design-system-ingestion-diagnostics.v0.schema.json");
const diagnosticCodes = diagnosticsSchema.$defs.diagnosticCode.enum;
const coveredCodes = expectationsManifest.expectations.flatMap((row) => row.diagnosticCodes);
assertSetEquals(new Set(coveredCodes), new Set(diagnosticCodes), "P2 diagnostic code fixture coverage");
if (coveredCodes.length !== diagnosticCodes.length) {
  fail(`P2 diagnostic coverage must use each code exactly once: ${JSON.stringify(coveredCodes)}`);
}

const diagnosticRows = new Map();
for (const branch of diagnosticsSchema.$defs.diagnostic.allOf) {
  const code = branch.if?.properties?.code?.const;
  const properties = branch.then?.properties;
  if (code) diagnosticRows.set(code, properties);
}
for (const row of expectationsManifest.expectations) {
  for (const code of row.diagnosticCodes) {
    const diagnostic = diagnosticRows.get(code);
    if (!diagnostic) fail(`missing canonical diagnostic row for ${code}`);
    const expected = {
      stage: diagnostic.stage.const,
      phase: diagnostic.phase.const,
      artifactPath: diagnostic.artifactPath.const,
      jsonPointer: diagnostic.jsonPointer.const,
      expectedResult: diagnostic.validationResult.const,
      promotionStatus: diagnostic.promotionStatus.const
    };
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (row[key] !== expectedValue) {
        fail(`expectation ${row.fixturePath} does not match ${code} ${key}: ${row[key]} !== ${expectedValue}`);
      }
    }
  }
}

const schemaClosurePaths = p2SchemaFiles.concat(sharedSchemaFiles);
const expectedSourceRefPaths = sourceFiles.map((file) => `sources/p2/design-system-source/${file}`).concat(
  requiredMappings.map((file) => `sources/p2/design-system-source/${file}`)
);
const expectedArtifactOrder = schemaClosurePaths
  .concat("sources/p2/design-system-source/manifest.json")
  .concat(expectedSourceRefPaths)
  .concat("fixtures/p2/expectations.manifest.json", ...fixtureFiles)
  .concat(p2Artifacts);
assertArrayEquals(expectationsManifest.artifactOrder, expectedArtifactOrder, "P2 expectations artifactOrder");

const evidenceSchema = schemas.get("schemas/design-system-ingestion-evidence.v0.schema.json");
if (evidenceSchema.required.includes("evidenceHash") || evidenceSchema.properties.evidenceHash) {
  fail("P2 evidence schema must use artifactRefs final self-hash, not top-level evidenceHash");
}
if (evidenceSchema.$defs.finalEvidenceArtifactRef.properties.hash.$ref !== "#/$defs/hash") {
  fail("P2 final evidence artifact hash must persist as lowercase SHA-256, not null");
}
const schemaClosure = evidenceSchema.properties.schemaClosure;
const sourceFileRefs = evidenceSchema.properties.sourceFileRefs;
const fixtureRefs = evidenceSchema.properties.fixtureRefs;
const artifactRefs = evidenceSchema.properties.artifactRefs;
const validationResults = evidenceSchema.properties.validationResults;
for (const [name, schema, expectedLength] of [
  ["schemaClosure", schemaClosure, schemaClosurePaths.length],
  ["sourceFileRefs", sourceFileRefs, expectedSourceRefPaths.length],
  ["fixtureRefs", fixtureRefs, fixtureFiles.length + 1],
  ["artifactRefs", artifactRefs, p2Artifacts.length],
  ["validationResults", validationResults, fixtureFiles.length]
]) {
  if (!schema || schema.items !== false || schema.minItems !== expectedLength || schema.maxItems !== expectedLength) {
    fail(`P2 evidence ${name} must be an exact closed ordered array`);
  }
}

const extractPathConsts = (entries, propertyName = "path") =>
  entries.map((entry) => entry.allOf?.[1]?.properties?.[propertyName]?.const);
assertArrayEquals(extractPathConsts(schemaClosure.prefixItems), schemaClosurePaths, "evidence schemaClosure paths");
assertArrayEquals(extractPathConsts(sourceFileRefs.prefixItems), expectedSourceRefPaths, "evidence sourceFileRefs paths");
assertArrayEquals(extractPathConsts(fixtureRefs.prefixItems), ["fixtures/p2/expectations.manifest.json", ...fixtureFiles], "evidence fixtureRefs paths");
assertArrayEquals(extractPathConsts(artifactRefs.prefixItems), p2Artifacts, "evidence artifactRefs paths");
assertArrayEquals(extractPathConsts(validationResults.prefixItems, "fixturePath"), fixtureFiles, "evidence validationResults fixture paths");

const badMappingKinds = structuredClone(mapping);
badMappingKinds.mappingRows[0].targetRefs = ["catalog://p2/components/Button/tokenRefs/component-height-75"];
if (validateMapping(badMappingKinds)) {
  fail("mappingKind authority probe should reject component row targeting token refs");
}

const badBareSourceRef = structuredClone(mapping);
badBareSourceRef.mappingRows[0].sourceRefs = [
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/button.json#"
];
if (validateMapping(badBareSourceRef)) {
  fail("source ref grammar probe should reject bare hash fragments");
}

const badTraversalSourceRef = structuredClone(mapping);
badTraversalSourceRef.mappingRows[0].sourceRefs = [
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/../button.json#/"
];
if (validateMapping(badTraversalSourceRef)) {
  fail("source ref grammar probe should reject traversal-like path segments");
}

const ingest = spawnSync(
  "node",
  [
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
  ],
  { encoding: "utf8" }
);

if (ingest.status !== 2) {
  fail(`planned P2 ingest command should exit 2 until implemented; got ${ingest.status}`);
}

console.log("P2 planning guard: pass");
