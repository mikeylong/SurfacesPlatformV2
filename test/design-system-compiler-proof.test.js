import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import {
  canonicalArtifactRef,
  canonicalJson as runtimeCanonicalJson,
  sha256Hex
} from "../src/proof-runtime.js";
import { findCatalogAuthorityEscalation } from "../src/catalog-authority.js";
import {
  designSystemCompilerInternals,
  computeCompilerRunId,
  firstReuseIdentityFailureCode,
  firstEvidenceIntegrityFailureCode
} from "../src/design-system-compiler-proof.js";
import { scanJavaScriptModule } from "../src/javascript-module-scanner.js";
import { assertCatalogReleaseReceipt, evaluateConsumerFixture } from "../src/catalog-consumer-kernel.js";
import {
  DesignSystemKernelError,
  compileDesignSystemAdapter,
  verifyConservativePolicy,
  verifyLockedSource
} from "../src/design-system-ingestion-kernel.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(root, "artifacts/design-system-compiler");

test("phase-independent runtime preserves canonical authority hashes", () => {
  const value = { z: [3, { b: true, a: null }], a: "authority" };
  assert.equal(runtimeCanonicalJson(value), canonicalJson(value));
  assert.equal(canonicalArtifactRef("artifacts/example.json", "runtime-catalog.v0", value).hash, sha256Hex(canonicalJson(value)));
});

test("shared kernels do not import phase modules", async () => {
  for (const relativePath of [
    "src/proof-runtime.js",
    "src/catalog-authority.js",
    "src/catalog-release-boundary.js",
    "src/design-system-ingestion-kernel.js",
    "src/catalog-consumer-kernel.js"
  ]) {
    const source = await fs.readFile(path.join(root, relativePath), "utf8");
    assert.doesNotMatch(source, /(?:from|import\()\s*["']\.\/p(?:0|2(?:-contract|-proof)?)\.js["']/);
    assert.equal(source.includes("p2Internals"), false);
  }
  const consumerSource = await fs.readFile(path.join(root, "src/catalog-consumer-kernel.js"), "utf8");
  assert.equal(consumerSource.includes("design-system-ingestion-kernel"), false);
});

test("normalized timestamp and SHA-256 have one shared runtime owner", async () => {
  const runtimeSource = await fs.readFile(path.join(root, "src/proof-runtime.js"), "utf8");
  assert.match(runtimeSource, /export const NORMALIZED_TIMESTAMP\s*=/);
  assert.match(runtimeSource, /export function sha256Hex\s*\(/);
  for (const relativePath of [
    "src/catalog-authority.js",
    "src/catalog-release-boundary.js",
    "src/design-system-ingestion-kernel.js",
    "src/catalog-consumer-kernel.js",
    "src/design-system-compiler-proof.js"
  ]) {
    const source = await fs.readFile(path.join(root, relativePath), "utf8");
    assert.doesNotMatch(source, /export const NORMALIZED_TIMESTAMP\s*=/);
    assert.doesNotMatch(source, /export function sha256Hex\s*\(/);
  }
});

test("catalog release receipt rejects drift before a consumer can produce output", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  const run = report.adapterRuns[0];
  const receipt = await readJson(path.join(root, run.receiptRef.path));
  const governedCatalog = await readJson(path.join(root, run.governedCatalogRef.path));
  const validators = await compileBoundaryValidators();
  const stale = structuredClone(receipt);
  stale.governedCatalogRef.hash = "0".repeat(64);
  assert.throws(
    () => assertCatalogReleaseReceipt({
      adapterId: run.adapterId,
      receipt: stale,
      receiptRef: canonicalArtifactRef(run.receiptRef.path, run.receiptRef.schemaId, stale),
      governedCatalog,
      governedCatalogRef: run.governedCatalogRef,
      validators
    }),
    (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.stage === "catalog-boundary"
  );
});

test("catalog release receipt fails closed across status, promotion, schema, and reference drift", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  const run = report.adapterRuns[0];
  const baseReceipt = await readJson(path.join(root, run.receiptRef.path));
  const baseGovernedCatalog = await readJson(path.join(root, run.governedCatalogRef.path));
  const validators = await compileBoundaryValidators();
  const cases = [
    ["nonpassing receipt", ({ receipt }) => { receipt.status = "fail"; }, "/receipt", true],
    ["blocked receipt", ({ receipt }) => { receipt.promotionStatus = "blocked"; }, "/receipt", true],
    ["mistyped receipt ref", ({ receiptRef }) => { receiptRef.schemaId = "runtime-catalog.v0"; }, "/receiptRef/schemaId", false],
    ["wrong receipt hash algorithm", ({ receiptRef }) => { receiptRef.hashAlgorithm = "sha512"; }, "/receiptRef/hashAlgorithm", false],
    ["stale receipt hash", ({ receiptRef }) => { receiptRef.hash = "0".repeat(64); }, "/receiptRef/hash", false],
    ["mistyped embedded catalog ref", ({ receipt }) => { receipt.governedCatalogRef.schemaId = "extract.v0"; }, "/receipt", true],
    ["wrong embedded catalog hash algorithm", ({ receipt }) => { receipt.governedCatalogRef.hashAlgorithm = "sha512"; }, "/receipt", true],
    ["mistyped supplied catalog ref", ({ governedCatalogRef }) => { governedCatalogRef.schemaId = "extract.v0"; }, "/suppliedGovernedCatalogRef/schemaId", false],
    ["wrong supplied catalog hash algorithm", ({ governedCatalogRef }) => { governedCatalogRef.hashAlgorithm = "sha512"; }, "/suppliedGovernedCatalogRef/hashAlgorithm", false],
    ["mistyped governed catalog", ({ governedCatalog }) => { governedCatalog.schemaId = "extract.v0"; }, "/governedCatalog", false],
    ["nongoverned catalog", ({ governedCatalog }) => { governedCatalog.artifactKind = "catalog"; }, "/governedCatalog", false],
    ["promotion mismatch", ({ governedCatalog }) => { governedCatalog.governance.promotionStatus = "allowed"; }, "/promotionStatus", false],
    ["governed path mismatch", ({ governedCatalogRef }) => { governedCatalogRef.path = "artifacts/design-system-compiler/other/governed-catalog.json"; }, "/governedCatalogRef", false],
    ["governed hash mismatch", ({ governedCatalogRef }) => { governedCatalogRef.hash = "0".repeat(64); }, "/governedCatalogRef", false]
  ];
  for (const [name, mutate, expectedPath, rehashReceipt] of cases) {
    const inputs = {
      adapterId: run.adapterId,
      receipt: structuredClone(baseReceipt),
      receiptRef: structuredClone(run.receiptRef),
      governedCatalog: structuredClone(baseGovernedCatalog),
      governedCatalogRef: structuredClone(run.governedCatalogRef),
      validators
    };
    mutate(inputs);
    if (rehashReceipt) {
      inputs.receiptRef = canonicalArtifactRef(run.receiptRef.path, "catalog-boundary-receipt.v0", inputs.receipt);
    }
    assert.throws(
      () => assertCatalogReleaseReceipt(inputs),
      (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.stage === "catalog-boundary" && error.path === expectedPath,
      name
    );
  }
});

test("generic compiler proof records two independent source families on one implementation closure", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  assert.equal(report.status, "pass");
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(report.adapterRuns.length, 2);
  assert.equal(new Set(report.adapterRuns.map((run) => run.sourceFamily)).size, 2);
  assert.equal(report.reuseProof.sharedKernel, true);
  assert.equal(report.reuseProof.sharedConsumer, true);
  assert.deepEqual(report.reuseProof.sourceSpecificImplementationModules, []);
  assert.deepEqual(
    await designSystemCompilerInternals.sourceSpecificImplementationModulesFromInventory(root, report.adapterRuns),
    report.reuseProof.sourceSpecificImplementationModules
  );
  assert.equal(new Set(report.reuseProof.kernelImplementationHashes).size, 1);
  assert.equal(new Set(report.reuseProof.consumerImplementationHashes).size, 1);
  assert.equal(new Set(report.reuseProof.sourceIds).size, 2);
  assert.equal(new Set(report.reuseProof.designSystemIdentities).size, 2);
  const kernelClosure = await designSystemCompilerInternals.transitiveLocalImplementationClosure(
    root,
    "src/design-system-ingestion-kernel.js"
  );
  const consumerClosure = await designSystemCompilerInternals.transitiveLocalImplementationClosure(
    root,
    "src/catalog-consumer-kernel.js"
  );
  assert.deepEqual(
    kernelClosure.refs.map((ref) => ref.path),
    ["package.json", "src/catalog-authority.js", "src/design-system-ingestion-kernel.js", "src/proof-runtime.js"]
  );
  assert.deepEqual(
    consumerClosure.refs.map((ref) => ref.path),
    ["package.json", "src/catalog-authority.js", "src/catalog-consumer-kernel.js", "src/catalog-release-boundary.js", "src/proof-runtime.js"]
  );
  assert.equal(report.kernel.implementationHash, kernelClosure.hash);
  assert.equal(report.consumer.implementationHash, consumerClosure.hash);
  assert.notEqual(kernelClosure.hash, sha256Hex(await fs.readFile(path.join(root, "src/design-system-ingestion-kernel.js"))));
  assert.notEqual(consumerClosure.hash, sha256Hex(await fs.readFile(path.join(root, "src/catalog-consumer-kernel.js"))));
});

test("executable inventory identifies a source-specific implementation module", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  const adapterId = report.adapterRuns[0].adapterId;
  const modulePath = `src/${adapterId}-compiler.js`;
  assert.deepEqual(
    designSystemCompilerInternals.findSourceSpecificImplementationModules({
      modules: [{ path: modulePath, source: "export const compile = () => null;" }],
      adapterRuns: report.adapterRuns
    }),
    [modulePath]
  );
});

test("JavaScript module scanner ignores comments and reports computed module loads", () => {
  const source = [
    "// import('./comment-only.js'); require('./comment-only.cjs'); spectrum-switch",
    "/* export { value } from './also-comment-only.js'; */",
    "import value from './real.js';",
    "export { helper } from './helper.js';",
    "const dynamicTarget = './dynamic.js';",
    "const requiredTarget = './required.cjs';",
    "import(dynamicTarget);",
    "import(`./${dynamicTarget}.js`);",
    "require(requiredTarget);",
    "require(`./${requiredTarget}.cjs`);"
  ].join("\n");
  const scan = scanJavaScriptModule(source);
  assert.deepEqual(scan.moduleSpecifiers, ["./helper.js", "./real.js"]);
  assert.deepEqual(
    scan.nonLiteralLoads.map((finding) => finding.kind),
    ["dynamic-import", "dynamic-import", "require", "require"]
  );
  assert.equal(scan.commentFreeSource.includes("comment-only"), false);
  assert.deepEqual(
    designSystemCompilerInternals.findSourceSpecificImplementationModules({
      modules: [{ path: "src/shared.js", source }],
      adapterRuns: [{
        adapterId: "spectrum-switch",
        sourceId: "spectrum-switch",
        sourceFamily: "Spectrum family",
        packageIdentity: "@adobe/spectrum-design-data@0.7.0",
        upstreamRepository: "https://example.test/spectrum"
      }]
    }),
    []
  );
});

test("implementation closure rejects computed dynamic imports and requires", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-implementation-load-"));
  try {
    await fs.mkdir(path.join(temp, "src"));
    await writePackageManifest(temp, { name: "closure-fixture", private: true, type: "module" });
    await fs.writeFile(path.join(temp, "src/dependency.js"), "export const value = 1;\n", "utf8");
    const cases = [
      ["import(target)", /nonliteral dynamic import/],
      ["require(target)", /CommonJS module loader/],
      ["require('./dependency.js')", /CommonJS module loader/],
      ["module.require('./dependency.js')", /CommonJS module loader/],
      ["require?.('./dependency.js')", /CommonJS module loader/],
      ["module.require?.('./dependency.js')", /CommonJS module loader/],
      [
        "import { createRequire as makeRequire } from 'node:module';\nconst load = makeRequire(import.meta.url);\nload('./dependency.js')",
        /CommonJS module loader/
      ]
    ];
    for (const [expression, expectedError] of cases) {
      await fs.writeFile(
        path.join(temp, "src/entry.js"),
        `const target = "./dependency.js";\n${expression};\n`,
        "utf8"
      );
      await assert.rejects(
        designSystemCompilerInternals.transitiveLocalImplementationClosure(temp, "src/entry.js"),
        expectedError,
        expression
      );
    }
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("implementation closure rejects an intermediate directory symlink", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-implementation-symlink-"));
  try {
    await fs.mkdir(path.join(temp, "src"));
    await fs.mkdir(path.join(temp, "shared"));
    await writePackageManifest(temp, { name: "closure-fixture", private: true, type: "module" });
    await fs.writeFile(path.join(temp, "shared/dependency.js"), "export const value = 1;\n", "utf8");
    await fs.symlink("../shared", path.join(temp, "src/linked"), "dir");
    await fs.writeFile(path.join(temp, "src/entry.js"), "import './linked/dependency.js';\n", "utf8");
    await assert.rejects(
      designSystemCompilerInternals.transitiveLocalImplementationClosure(temp, "src/entry.js"),
      /implementation closure contains an unsafe module/
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("implementation closure resolves aliases and self-package exports into the local graph", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-implementation-package-"));
  try {
    await fs.mkdir(path.join(temp, "src/features"), { recursive: true });
    await writePackageManifest(temp, {
      name: "closure-fixture",
      private: true,
      type: "module",
      imports: {
        "#feature/*": "./src/features/*.js",
        "#shared": "./src/shared.js"
      },
      exports: {
        ".": "./src/index.js",
        "./helper": "./src/helper.js"
      },
      dependencies: { "declared-external": "1.0.0" }
    });
    await fs.writeFile(path.join(temp, "src/shared.js"), "export const shared = true;\n", "utf8");
    await fs.writeFile(path.join(temp, "src/features/button.js"), "export const feature = true;\n", "utf8");
    await fs.writeFile(path.join(temp, "src/helper.js"), "export const helper = true;\n", "utf8");
    await fs.writeFile(path.join(temp, "src/index.js"), "export const index = true;\n", "utf8");
    await fs.writeFile(path.join(temp, "src/entry.js"), [
      "import '#shared';",
      "import '#feature/button';",
      "import 'closure-fixture';",
      "import 'closure-fixture/helper';",
      "import 'node:fs';",
      "import 'declared-external/subpath';"
    ].join("\n") + "\n", "utf8");
    const closure = await designSystemCompilerInternals.transitiveLocalImplementationClosure(temp, "src/entry.js");
    assert.deepEqual(closure.refs.map((ref) => ref.path), [
      "package.json",
      "src/entry.js",
      "src/features/button.js",
      "src/helper.js",
      "src/index.js",
      "src/shared.js"
    ]);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("implementation closure fails closed on unresolved aliases, self references, and external packages", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-implementation-unresolved-"));
  try {
    await fs.mkdir(path.join(temp, "src"));
    await writePackageManifest(temp, {
      name: "closure-fixture",
      private: true,
      type: "module",
      imports: {
        "#external": "declared-external",
        "#local": "./src/local.js"
      },
      exports: { ".": "./src/index.js" },
      dependencies: { "declared-external": "1.0.0" }
    });
    await fs.writeFile(path.join(temp, "src/local.js"), "export const local = true;\n", "utf8");
    await fs.writeFile(path.join(temp, "src/index.js"), "export const index = true;\n", "utf8");
    const cases = [
      ["#missing", /package alias is unresolved/],
      ["#external", /package target must resolve locally/],
      ["closure-fixture/missing", /self-package reference is unresolved/],
      ["undeclared-external/subpath", /undeclared external package/],
      ["node:not-a-builtin", /unsupported module protocol/]
    ];
    for (const [specifier, expectedError] of cases) {
      await fs.writeFile(path.join(temp, "src/entry.js"), `import '${specifier}';\n`, "utf8");
      await assert.rejects(
        designSystemCompilerInternals.transitiveLocalImplementationClosure(temp, "src/entry.js"),
        expectedError,
        specifier
      );
    }
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("every adapter closes source through extract, governed catalog, receipt, and portable consumer", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  for (const run of report.adapterRuns) {
    assert.equal(run.status, "pass");
    assert.equal(run.matchedConsumerResults, 3);
    assert.equal(run.consumerResults, 3);
    for (const key of ["extractRef", "catalogRef", "governedCatalogRef", "receiptRef", "projectionRef", "consumerReportRef"]) {
      const ref = run[key];
      const value = await readJson(path.join(root, ref.path));
      assert.equal(ref.hash, sha256Hex(canonicalJson(value)));
    }
    assert.equal(run.renderPlanRefs.length, 1);
    const consumer = await readJson(path.join(root, run.consumerReportRef.path));
    assert.deepEqual(consumer.results.map((result) => result.actualOutcome), ["allowed", "blocked", "review_required"]);
    assert.equal(consumer.results[0].renderPlanPath !== null, true);
    assert.equal(consumer.results[1].renderPlanPath, null);
    assert.equal(consumer.results[2].renderPlanPath, null);
  }
});

test("shared implementation contains no source-family or component branches", async () => {
  for (const relativePath of [
    "src/proof-runtime.js",
    "src/catalog-authority.js",
    "src/catalog-release-boundary.js",
    "src/design-system-ingestion-kernel.js",
    "src/catalog-consumer-kernel.js",
    "src/design-system-compiler-proof.js"
  ]) {
    const source = (await fs.readFile(path.join(root, relativePath), "utf8")).toLowerCase();
    for (const forbidden of ["spectrum", "astryx", "@adobe", "@astryxdesign", "switch", "button"]) {
      assert.equal(source.includes(forbidden), false, `${relativePath} must not contain ${forbidden}`);
    }
  }
});

test("causal mutations reject unmapped authority, invented identifiers, target inversion, and stale receipts", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  assert.deepEqual(
    report.mutationResults.map((result) => [result.expectedCode, result.actualCode, result.matched]),
    [
      ["MAPPING_COVERAGE_INCOMPLETE", "MAPPING_COVERAGE_INCOMPLETE", true],
      ["MAPPING_AUTHORITY_UNJUSTIFIED", "MAPPING_AUTHORITY_UNJUSTIFIED", true],
      ["MAPPING_AUTHORITY_UNJUSTIFIED", "MAPPING_AUTHORITY_UNJUSTIFIED", true],
      ["CATALOG_BOUNDARY_INVALID", "CATALOG_BOUNDARY_INVALID", true]
    ]
  );
});

test("lossless mappings cannot rename a source member by changing its key and id together", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters.find((candidate) => candidate.outputKey === "spectrum-switch");
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const changed = structuredClone(adapter);
  const component = changed.normalizedExtract.components[0];
  component.props.inventedProp = { ...component.props.isDisabled, id: "inventedProp" };
  delete component.props.isDisabled;
  const propMapping = changed.mappings.find((mapping) => mapping.targetPointer === "/components/0/props/isDisabled");
  propMapping.targetPointer = "/components/0/props/inventedProp";
  propMapping.targetValue.id = "inventedProp";
  for (const state of Object.values(component.states)) {
    state.allowedProps = state.allowedProps.map((propId) => propId === "isDisabled" ? "inventedProp" : propId).sort();
  }
  for (const mapping of changed.mappings.filter((candidate) => candidate.targetPointer.includes("/states/"))) {
    mapping.targetValue.allowedProps = mapping.targetValue.allowedProps.map((propId) => propId === "isDisabled" ? "inventedProp" : propId).sort();
  }
  await assert.rejects(
    compileDesignSystemAdapter({ cwd: root, sourceRoot: entry.sourceRoot, sourceLock, adapter: changed }),
    (error) => error instanceof DesignSystemKernelError &&
      error.code === "MAPPING_AUTHORITY_UNJUSTIFIED" &&
      error.path === "/components/0/props/inventedProp/id"
  );
});

test("source-backed scalar token refs keep their stripped identifier as the member key", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters.find((candidate) => candidate.outputKey === "astryx-core-button");
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const compiled = await compileDesignSystemAdapter({ cwd: root, sourceRoot: entry.sourceRoot, sourceLock, adapter });
  assert.equal(compiled.extract.components[0].tokenRefs["size-element-md"], "size-element-md");
});

test("source-backed semantic token-ref keys may differ from their scalar token path", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters.find((candidate) => candidate.outputKey === "astryx-core-button");
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const changed = structuredClone(adapter);
  changed.normalizedExtract.components[0].tokenRefs = { size: "size-element-md" };
  const mapping = changed.mappings.find((candidate) => candidate.targetPointer.includes("/tokenRefs/"));
  mapping.targetPointer = "/components/0/tokenRefs/size";
  mapping.sourceRefs = [...mapping.sourceRefs, changed.anchors.propSize.sourceRef].sort();
  const compiled = await compileDesignSystemAdapter({ cwd: root, sourceRoot: entry.sourceRoot, sourceLock, adapter: changed });
  assert.equal(compiled.extract.components[0].tokenRefs.size, "size-element-md");
});

test("adapter and artifact cardinality are manifest-derived beyond the two-source baseline", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const extended = structuredClone(manifest);
  extended.adapters.push({
    adapterPath: "sources/design-system-compiler/third-system/adapter.json",
    sourceRoot: "sources/design-system-compiler/third-system/package",
    outputKey: "third-system-example",
    expectedComponentIds: ["Example"]
  });
  extended.expectedRun.adapterCount = 3;
  assert.equal(designSystemCompilerInternals.expectedArtifactPaths(extended).length, 22);
  assert.equal(designSystemCompilerInternals.expectedArtifactPaths(extended, undefined, { includeEvidence: true }).length, 23);
  assert.equal(
    designSystemCompilerInternals.expectedArtifactPaths(extended).includes("artifacts/design-system-compiler/third-system-example/catalog.json"),
    true
  );
  const manifestSchema = await readJson(path.join(root, "schemas/design-system-compiler-manifest.v0.schema.json"));
  const reportSchema = await readJson(path.join(root, "schemas/design-system-compiler-report.v0.schema.json"));
  const evidenceSchema = await readJson(path.join(root, "schemas/design-system-compiler-evidence.v0.schema.json"));
  assert.equal(manifestSchema.properties.adapters.maxItems, undefined);
  assert.equal(reportSchema.properties.adapterRuns.maxItems, undefined);
  assert.equal(evidenceSchema.properties.artifacts.maxItems, undefined);
});

test("adapter source refs must equal their typed locator", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters[0];
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const changed = structuredClone(adapter);
  changed.anchors.componentName.sourceRef += "-drift";
  await assert.rejects(
    compileDesignSystemAdapter({ cwd: root, sourceRoot: entry.sourceRoot, sourceLock, adapter: changed }),
    (error) => error instanceof DesignSystemKernelError && error.code === "SOURCE_REF_UNRESOLVED"
  );
});

test("adapter policy contract cannot enable runtime authority", async () => {
  const adapter = await readJson(path.join(root, "sources/design-system-compiler/astryx-core/adapter.json"));
  const changed = structuredClone(adapter);
  changed.runtimeCapabilities.actionExecution = "enabled";
  assert.throws(
    () => verifyConservativePolicy(changed),
    (error) => error instanceof DesignSystemKernelError && error.code === "MAPPING_AUTHORITY_UNJUSTIFIED"
  );
});

test("reuse proof rejects duplicate design-system identities despite different adapter labels", () => {
  const base = {
    adapterId: "one",
    sourceFamily: "Family one",
    sourceId: "source-one",
    packageIdentity: "@example/system@1.0.0",
    upstreamRepository: "https://example.com/system"
  };
  assert.equal(firstReuseIdentityFailureCode([
    base,
    {
      ...base,
      adapterId: "two",
      sourceFamily: "Family two",
      sourceId: "source-two",
      packageIdentity: "@example/system@2.0.0"
    }
  ]), "SOURCE_IDENTITY_REUSED");
});

test("authority subset guard reports the exact added member", () => {
  const baseline = {
    components: { Example: { props: {}, variants: {}, states: {}, slots: {}, actions: {}, events: {}, dataBindings: {}, tokenRefs: {}, accessibility: {}, examples: [], sourceRef: "source://example" } },
    tokens: {},
    runtimeCapabilities: {},
    governance: { rules: {}, results: { review: {} }, promotionStatus: "review_required" }
  };
  const candidate = structuredClone(baseline);
  candidate.components.Example.props.invented = { sourceRef: "source://invented" };
  assert.equal(findCatalogAuthorityEscalation(candidate, baseline), "/components/Example/props/invented");
});

test("source lock preflight detects a changed selected source byte", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters[0];
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-design-system-lock-"));
  const copiedRoot = path.join(temp, "snapshot");
  try {
    await fs.cp(path.join(root, entry.sourceRoot), copiedRoot, { recursive: true });
    const mutatedLock = structuredClone(sourceLock);
    mutatedLock.rootPath = "snapshot";
    const selected = mutatedLock.files[0].path;
    await fs.appendFile(path.join(copiedRoot, selected), "\n");
    await assert.rejects(
      verifyLockedSource({ cwd: temp, sourceRoot: "snapshot", sourceLock: mutatedLock }),
      (error) => error instanceof DesignSystemKernelError && error.code === "SOURCE_LOCK_MISMATCH"
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("source lock preflight rejects a symlinked source root", async () => {
  const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
  const entry = manifest.adapters[0];
  const adapter = await readJson(path.join(root, entry.adapterPath));
  const sourceLock = await readJson(path.join(root, adapter.sourceLockPath));
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-design-system-symlink-"));
  try {
    await fs.cp(path.join(root, entry.sourceRoot), path.join(temp, "snapshot"), { recursive: true });
    await fs.symlink("snapshot", path.join(temp, "linked"), "dir");
    const mutatedLock = structuredClone(sourceLock);
    mutatedLock.rootPath = "linked";
    await assert.rejects(
      verifyLockedSource({ cwd: temp, sourceRoot: "linked", sourceLock: mutatedLock }),
      (error) => error instanceof DesignSystemKernelError && error.code === "SOURCE_LOCK_MISMATCH"
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("tracked evidence closes artifacts, implementation, and source bytes", async () => {
  const evidence = await readJson(path.join(artifactRoot, "evidence.json"));
  assert.equal(await firstEvidenceIntegrityFailureCode(root, evidence), null);
  assert.equal(evidence.contractId, "surfaces-design-system-compiler-proof");
  assert.equal(evidence.command, "interfacectl surfaces design-system-compiler proof");
  assert.equal(evidence.implementationRefs.some((ref) => ref.path === "src/design-system-ingestion-kernel.js"), true);
  assert.equal(evidence.implementationRefs.some((ref) => ref.path === "src/catalog-consumer-kernel.js"), true);
  assert.equal(evidence.implementationRefs.some((ref) => ref.path === "src/proof-runtime.js"), true);
  assert.equal(evidence.implementationRefs.some((ref) => ref.path === "src/catalog-authority.js"), true);
  assert.equal(evidence.implementationRefs.some((ref) => ref.path === "src/catalog-release-boundary.js"), true);
  assert.equal(evidence.sourceRefs.some((ref) => ref.path.includes("sources/design-system-compiler/")), true);
});

test("evidence self-hash uses the platform null-placeholder convention", async () => {
  const evidence = await readJson(path.join(artifactRoot, "evidence.json"));
  const expectedInput = structuredClone(evidence);
  const selfRef = expectedInput.artifacts.find((ref) => ref.path === "artifacts/design-system-compiler/evidence.json");
  selfRef.hash = null;
  assert.equal(evidence.artifacts.at(-1).hash, sha256Hex(canonicalJson(expectedInput)));
});

test("evidence integrity rejects an omitted bound source even with a repaired self-hash", async () => {
  const evidence = await readJson(path.join(artifactRoot, "evidence.json"));
  const mutated = structuredClone(evidence);
  mutated.sourceRefs.pop();
  const selfRef = mutated.artifacts.find((ref) => ref.path === "artifacts/design-system-compiler/evidence.json");
  selfRef.hash = designSystemCompilerInternals.computeEvidenceSelfHash(mutated);
  assert.equal(await firstEvidenceIntegrityFailureCode(root, mutated), "EVIDENCE_HASH_MISMATCH");
});

test("evidence integrity rejects forged compiler closure, source identity, and run id with repaired hashes", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-compiler-evidence-"));
  try {
    const baseEvidence = await readJson(path.join(artifactRoot, "evidence.json"));
    const baseReport = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
    const manifest = await readJson(path.join(root, "fixtures/design-system-compiler/targets.manifest.json"));
    await stageEvidenceWorkspace(temp, baseEvidence);
    assert.equal(await firstEvidenceIntegrityFailureCode(temp, baseEvidence), null, "coherent baseline");
    const mutations = [
      ["closure", (report) => {
        const forgedHash = "0".repeat(64);
        report.kernel.implementationHash = forgedHash;
        for (const run of report.adapterRuns) run.kernelImplementationHash = forgedHash;
        report.reuseProof.kernelImplementationHashes = report.adapterRuns.map(() => forgedHash);
      }],
      ["source identity", (report) => {
        report.adapterRuns[0].sourceId = "forged-source-identity";
        report.reuseProof.sourceIds = report.adapterRuns.map((run) => run.sourceId).sort();
      }],
      ["run id", (report) => {
        report.runId = "design-system-compiler-0000000000000000";
      }]
    ];
    for (const [name, mutate] of mutations) {
      const report = structuredClone(baseReport);
      const evidence = structuredClone(baseEvidence);
      mutate(report);
      if (name !== "run id") {
        report.runId = computeCompilerRunId({
          manifestHash: sha256Hex(canonicalJson(manifest)),
          kernelImplementationHash: report.kernel.implementationHash,
          consumerImplementationHash: report.consumer.implementationHash,
          implementationClosureHash: sha256Hex(canonicalJson(evidence.implementationRefs)),
          sourceClosureHash: sha256Hex(canonicalJson(evidence.sourceRefs)),
          adapterRuns: report.adapterRuns,
          mutationResults: report.mutationResults,
          reuseProof: report.reuseProof
        });
      }
      evidence.runId = report.runId;
      const reportPath = path.join(temp, evidence.reportRef.path);
      await fs.writeFile(reportPath, `${canonicalJson(report)}\n`, "utf8");
      const reportRef = canonicalArtifactRef(evidence.reportRef.path, "design-system-compiler-report.v0", report);
      evidence.reportRef = reportRef;
      const artifactIndex = evidence.artifacts.findIndex((ref) => ref.path === reportRef.path);
      evidence.artifacts[artifactIndex] = reportRef;
      const selfRef = evidence.artifacts.find((ref) => ref.path === "artifacts/design-system-compiler/evidence.json");
      selfRef.hash = designSystemCompilerInternals.computeEvidenceSelfHash(evidence);
      assert.equal(
        await firstEvidenceIntegrityFailureCode(temp, evidence),
        "EVIDENCE_HASH_MISMATCH",
        name
      );
    }
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("portable consumer rejects unresolved fixture refs and contradictory variant props", async () => {
  const projection = await readJson(path.join(artifactRoot, "astryx-core-button/runtime-projection.json"));
  const fixturePath = "fixtures/design-system-compiler/astryx-core/allowed-render.catalog-consumer-fixture.json";
  const fixture = await readJson(path.join(root, fixturePath));
  const unresolved = structuredClone(fixture);
  unresolved.sourceRef = "source://outside-closure";
  assert.deepEqual(
    evaluateConsumerFixture({ fixture: unresolved, fixturePath, projection }).diagnostics.map((diagnostic) => diagnostic.code),
    ["CONSUMER_SOURCE_REF_UNRESOLVED"]
  );
  const contradictory = structuredClone(fixture);
  contradictory.props.variant = "secondary";
  assert.deepEqual(
    evaluateConsumerFixture({ fixture: contradictory, fixturePath, projection }).diagnostics.map((diagnostic) => diagnostic.code),
    ["CONSUMER_CONSTRAINT_VIOLATION"]
  );
});

test("CLI accepts only the deterministic manifest and artifact roots", () => {
  assert.deepEqual(
    designSystemCompilerInternals.parseArgs([
      "--manifest", "fixtures/design-system-compiler/targets.manifest.json",
      "--out", "artifacts/design-system-compiler"
    ]),
    {
      ok: true,
      manifest: "fixtures/design-system-compiler/targets.manifest.json",
      out: "artifacts/design-system-compiler"
    }
  );
  assert.equal(designSystemCompilerInternals.parseArgs(["--manifest", "../elsewhere", "--out", "artifacts/design-system-compiler"]).ok, false);
});

async function compileBoundaryValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const relativePath of [
    "schemas/diagnostics.v0.schema.json",
    "schemas/design-system-compiler-diagnostics.v0.schema.json",
    "schemas/runtime-catalog.v0.schema.json",
    "schemas/catalog-boundary-receipt.v0.schema.json"
  ]) {
    ajv.addSchema(await readJson(path.join(root, relativePath)));
  }
  return {
    receipt: ajv.getSchema("https://surfaces.dev/schemas/design-system-compiler/catalog-boundary-receipt.v0.schema.json"),
    governedCatalog: ajv.getSchema("https://surfaces.dev/schemas/p0/runtime-catalog.v0.schema.json")
  };
}

async function stageEvidenceWorkspace(temp, evidence) {
  const paths = new Set([
    ...designSystemCompilerInternals.IMPLEMENTATION_FILES,
    ...evidence.sourceRefs.map((ref) => ref.path),
    ...evidence.artifacts.map((ref) => ref.path)
  ]);
  for (const relativePath of [...paths].sort()) {
    const sourcePath = path.join(root, relativePath);
    const targetPath = path.join(temp, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function writePackageManifest(directory, manifest) {
  await fs.writeFile(path.join(directory, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function readJson(absolutePath) {
  return JSON.parse(await fs.readFile(absolutePath, "utf8"));
}
