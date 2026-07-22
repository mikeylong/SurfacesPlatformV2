import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  PLATFORM_ARCHITECTURE_MESSAGES,
  admittedPolicySha256,
  checkPlatformArchitecture,
  runArchitectureMutationFixtures,
  scanJavaScriptSource
} from "../src/platform-architecture.js";

const root = process.cwd();
const execFileAsync = promisify(execFile);
const policyPath = "fixtures/platform-path-consolidation/architecture-policy.json";
const bootstrapBaseCommit = "a8e0fbd746e131496977b9ab2135af153863b9a3";
const bootstrapCheckpoint = "32543bfb7c5701c054f9c8c157a4f7cf0504fcbf";

const policyPromise = readJson(policyPath);
const policySchemaPromise = readJson("schemas/platform-architecture-policy.v0.schema.json");
const diagnosticsSchemaPromise = readJson("schemas/platform-architecture-diagnostics.v0.schema.json");
const mutationSchemaPromise = readJson("schemas/platform-architecture-mutation.v0.schema.json");
const virtualFilesPromise = snapshotFiles([
  ".github",
  "bin",
  "package-lock.json",
  "package.json",
  "schemas",
  "scripts",
  "src",
  "fixtures/design-system-compiler",
  "fixtures/platform-path-consolidation",
  "sources/design-system-compiler",
  "test"
]);

test("repository architecture satisfies the exact admission policy without writing artifacts", async () => {
  const [policy, policySchema, diagnosticsSchema] = await Promise.all([
    policyPromise,
    policySchemaPromise,
    diagnosticsSchemaPromise
  ]);
  const result = await checkPlatformArchitecture({ root, policy, policySchema });
  assert.equal(result.status, "pass", JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.graph.files.includes("src/catalog-authority.js"));
  assert.equal(result.identities.length, 2);
  validateSchema(diagnosticsSchema, result.diagnostics);
  assert.deepEqual(policy.diagnosticCodes, Object.keys(PLATFORM_ARCHITECTURE_MESSAGES).sort());
});

test("architecture mutation fixtures are schema-valid and causally rejected in memory", async () => {
  const [policy, policySchema, mutationSchema, diagnosticsSchema, baseFiles] = await Promise.all([
    policyPromise,
    policySchemaPromise,
    mutationSchemaPromise,
    diagnosticsSchemaPromise,
    virtualFilesPromise
  ]);
  const result = await runArchitectureMutationFixtures({
    root,
    policy,
    policySchema,
    mutationSchema,
    diagnosticsSchema,
    virtualFiles: baseFiles
  });
  assert.equal(result.status, "pass", JSON.stringify(result, null, 2));
  assert.equal(result.total, policy.mutationFixtures.length);
  assert.equal(result.matched, 34);
  assert.deepEqual(result.diagnostics, []);
  validateSchema(diagnosticsSchema, result.diagnostics);

  const resultById = new Map(result.results.map((row) => [row.mutationId, row]));
  for (const [mutationId, expectedCodes] of Object.entries({
    "adapter-consumer-fixture-escape": ["ADAPTER_NOT_DATA_ONLY"],
    "adapter-executable-payload": ["ADAPTER_NOT_DATA_ONLY"],
    "adapter-fixture-root-reuse": ["ADAPTER_MANIFEST_INVALID"],
    "adapter-existing-closure-rewrite": ["ADAPTER_MANIFEST_INVALID"],
    "adapter-path-traversal": ["ADAPTER_MANIFEST_INVALID"],
    "adapter-roster-rewrite": ["ADAPTER_MANIFEST_INVALID"],
    "bespoke-compiler-path": ["CATALOG_AUTHORITY_PATH_UNREGISTERED", "CATALOG_AUTHORITY_ROUTE_UNREGISTERED"],
    "cjs-require": ["LEGACY_IMPORT_UNDECLARED"],
    "computed-loader": ["COMPUTED_MODULE_LOAD"],
    "duplicate-canonical-owner": ["POLICY_WEAKENING"],
    "existing-neutral-executable-drift": ["FROZEN_ARCHITECTURE_FILE_DRIFT"],
    "existing-test-executable-drift": ["FROZEN_ARCHITECTURE_FILE_DRIFT"],
    "generic-compiler-mutation-drift": ["FROZEN_ARCHITECTURE_FILE_DRIFT"],
    "helper-bypass": ["PROTECTED_DEPENDENCY_UNPROTECTED"],
    "identity-concat": ["IDENTITY_CONTROL_FLOW"],
    "identity-regex": ["IDENTITY_CONTROL_FLOW"],
    "legacy-implementation-expansion": ["LEGACY_IMPLEMENTATION_DRIFT"],
    "migration-baseline-rewrite": ["MIGRATION_BASELINE_DRIFT"],
    "neutral-executable-route": ["EXECUTABLE_PATH_UNREGISTERED", "CLI_ROUTE_UNREGISTERED"],
    "new-root-executable": ["EXECUTABLE_PATH_UNREGISTERED"],
    "new-test-executable": ["EXECUTABLE_PATH_UNREGISTERED"],
    "new-workflow-executable": ["EXECUTABLE_PATH_UNREGISTERED"],
    "package-alias-import": ["LOCAL_IMPORT_UNRESOLVED"],
    "package-lock-drift": ["FROZEN_ARCHITECTURE_FILE_DRIFT"],
    "package-script-expansion": ["FROZEN_ARCHITECTURE_FILE_DRIFT"],
    "registered-neutral-bypass": ["POLICY_WEAKENING"],
    "registered-route-bypass": ["POLICY_WEAKENING"],
    "shebang-executable": ["EXECUTABLE_PATH_UNREGISTERED"],
    "typescript-import": ["LEGACY_IMPORT_UNDECLARED"]
  })) {
    const row = resultById.get(mutationId);
    assert.ok(row, mutationId);
    for (const expectedCode of expectedCodes) {
      assert.ok(row.actualCodes.includes(expectedCode), `${mutationId}: missing ${expectedCode} in ${row.actualCodes}`);
    }
  }
});

test("the normal architecture command executes the causal mutation registry", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, ["scripts/check-platform-architecture.mjs"], {
    cwd: root,
    maxBuffer: 4 * 1024 * 1024
  });
  assert.equal(stderr, "");
  assert.match(stdout, /platform architecture: pass \(83 files, \d+ local edges, 34\/34 causal mutations/);

  const bootstrap = await execFileAsync(process.execPath, [
    "scripts/check-platform-architecture.mjs",
    "--base",
    bootstrapBaseCommit
  ], {
    cwd: root,
    maxBuffer: 4 * 1024 * 1024
  });
  assert.equal(bootstrap.stderr, "");
  assert.match(bootstrap.stdout, new RegExp(`bootstrap checkpoint ${bootstrapCheckpoint}`));
});

test("source identity scanning ignores comments but rejects executable literals", async () => {
  const scan = scanJavaScriptSource(`
    // if (adapter === "spectrum-switch") {}
    /* const component = "Button"; */
    export const neutral = "portable";
  `);
  assert.deepEqual(scan.stringLiterals, ["portable"]);

});

test("the shared module scanner covers ESM, CommonJS, computed loads, and TypeScript syntax", () => {
  const scan = scanJavaScriptSource(`
    import value from "./static.js";
    export { value as other } from "./reexport.mjs";
    const dynamic = import("./dynamic.mts");
    const commonJs = require("./legacy.cjs");
    const target: string = "./computed.js";
    import(target);
    require(target);
  `);
  assert.deepEqual(scan.imports, ["./dynamic.mts", "./legacy.cjs", "./reexport.mjs", "./static.js"]);
  assert.deepEqual(scan.nonLiteralLoads.map((row) => row.kind), ["dynamic-import", "require"]);
});

test("manifest reachability and data-only adapter rules are exact", async () => {
  const [policy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const extraAdapterFiles = structuredClone(baseFiles);
  extraAdapterFiles["sources/design-system-compiler/rogue/adapter.json"] = "{}";
  const unreachable = await checkPlatformArchitecture({ root, policy, policySchema, virtualFiles: extraAdapterFiles });
  assert.ok(unreachable.diagnostics.some((row) => row.code === "ADAPTER_MANIFEST_UNREACHABLE"));

  const executableAdapterFiles = structuredClone(baseFiles);
  const adapterPath = "sources/design-system-compiler/spectrum-switch/adapter.json";
  const adapter = JSON.parse(executableAdapterFiles[adapterPath]);
  adapter.normalizedExtract.provenance.upstreamCodeExecuted = true;
  executableAdapterFiles[adapterPath] = JSON.stringify(adapter);
  const notDataOnly = await checkPlatformArchitecture({ root, policy, policySchema, virtualFiles: executableAdapterFiles });
  assert.ok(notDataOnly.diagnostics.some((row) => row.code === "ADAPTER_NOT_DATA_ONLY"));
});

test("base-aware co-change rules also apply during policy bootstrap", async () => {
  const [policy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const baseAdapterManifest = JSON.parse(baseFiles[policy.adapterManifestPath]);
  const changedPaths = [
    "sources/design-system-compiler/spectrum-switch/adapter.json",
    "src/catalog-authority.js"
  ];
  const bootstrap = await checkPlatformArchitecture({
    root,
    policy,
    policySchema,
    basePolicy: null,
    changedPaths,
    virtualFiles: baseFiles
  });
  assert.ok(bootstrap.diagnostics.some((row) => row.code === "CHANGESET_BOUNDARY_CROSSED"),
    JSON.stringify(bootstrap.diagnostics, null, 2));

  const admittedBase = await checkPlatformArchitecture({
    root,
    policy,
    policySchema,
    basePolicy: policy,
    baseAdapterManifest,
    changedPaths,
    virtualFiles: baseFiles
  });
  assert.ok(admittedBase.diagnostics.some((row) => row.code === "CHANGESET_BOUNDARY_CROSSED"));

  for (const disallowedPath of ["src/p1-proof.js", "package.json", ".github/workflows/surfaces-proof.yml"]) {
    const disallowed = await checkPlatformArchitecture({
      root,
      policy,
      policySchema,
      basePolicy: policy,
      baseAdapterManifest,
      changedPaths: ["sources/design-system-compiler/spectrum-switch/adapter.json", disallowedPath],
      virtualFiles: baseFiles
    });
    assert.ok(disallowed.diagnostics.some((row) => row.code === "CHANGESET_BOUNDARY_CROSSED"), disallowedPath);
  }

  const admittedClosureRewrite = await checkPlatformArchitecture({
    root,
    policy,
    policySchema,
    basePolicy: policy,
    baseAdapterManifest,
    changedPaths: [
      "sources/design-system-compiler/spectrum-switch/adapter.json",
      "fixtures/design-system-compiler/spectrum-switch/allowed.consumer.json",
      "artifacts/design-system-compiler/evidence.json",
      "artifacts/capability-index/evidence.json"
    ],
    virtualFiles: baseFiles
  });
  assert.ok(admittedClosureRewrite.diagnostics.some((row) =>
    row.code === "ADAPTER_MANIFEST_INVALID" &&
    row.path === "sources/design-system-compiler/spectrum-switch/adapter.json"),
  JSON.stringify(admittedClosureRewrite.diagnostics, null, 2));
});

test("the bootstrap checkpoint is schema-locked and retained by policy evolution", async () => {
  const [basePolicy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const invalid = structuredClone(basePolicy);
  invalid.bootstrapChangeBoundary.baseCommit = "0".repeat(40);
  const schemaLocked = await checkPlatformArchitecture({
    root,
    policy: invalid,
    policySchema,
    basePolicy,
    virtualFiles: baseFiles
  });
  assert.ok(schemaLocked.diagnostics.some((row) => row.code === "POLICY_SCHEMA_INVALID"));

  const evolutionSchema = structuredClone(policySchema);
  evolutionSchema.properties.bootstrapChangeBoundary.properties.baseCommit = {
    type: "string",
    pattern: "^[a-f0-9]{40}$"
  };
  const antiWeakening = await checkPlatformArchitecture({
    root,
    policy: invalid,
    policySchema: evolutionSchema,
    basePolicy,
    virtualFiles: baseFiles
  });
  assert.ok(antiWeakening.diagnostics.some((row) =>
    row.code === "POLICY_WEAKENING" && row.path === "/bootstrapChangeBoundary/baseCommit"));
});

test("the first base-aware run admits only the hash-bound bootstrap policy", async () => {
  const [policy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  assert.equal(
    policy.bootstrapChangeBoundary.admittedPolicySha256,
    admittedPolicySha256(policy)
  );

  const candidate = structuredClone(policy);
  candidate.catalogAuthority.registeredExecutablePaths.push({
    path: "src/bootstrap-side-path.js",
    classification: "neutral"
  });
  candidate.catalogAuthority.registeredExecutablePaths.sort((left, right) => left.path.localeCompare(right.path));
  const candidateFiles = structuredClone(baseFiles);
  candidateFiles["src/bootstrap-side-path.js"] = "export const sidePath = true;\n";
  const result = await checkPlatformArchitecture({
    root,
    policy: candidate,
    policySchema,
    basePolicy: null,
    changedPaths: [
      "fixtures/platform-path-consolidation/architecture-policy.json",
      "src/bootstrap-side-path.js"
    ],
    virtualFiles: candidateFiles
  });
  assert.ok(result.diagnostics.some((row) =>
    row.code === "POLICY_WEAKENING" &&
    row.path === "/bootstrapChangeBoundary/admittedPolicySha256"),
  JSON.stringify(result.diagnostics, null, 2));
});

test("ordinary local runs reject policy-schema changes that are not hash-admitted", async () => {
  const [policy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const candidateSchema = structuredClone(policySchema);
  candidateSchema.$comment = "unadmitted schema change";
  const result = await checkPlatformArchitecture({
    root,
    policy,
    policySchema: candidateSchema,
    virtualFiles: baseFiles
  });
  assert.ok(result.diagnostics.some((row) =>
    row.code === "POLICY_WEAKENING" &&
    row.path === "/bootstrapChangeBoundary/policySchemaSha256"),
  JSON.stringify(result.diagnostics, null, 2));
});

test("candidate schema changes cannot erase immutable legacy and direct-consumer targets", async () => {
  const [basePolicy, basePolicySchema, baseFiles] = await Promise.all([
    policyPromise,
    policySchemaPromise,
    virtualFilesPromise
  ]);
  const candidate = structuredClone(basePolicy);
  candidate.legacy.importTargets = [];
  candidate.legacy.importExceptions = [];
  candidate.legacy.directP2AuthorityPaths = [];
  candidate.legacy.directP2ConsumerExceptions = [];
  const candidateSchema = structuredClone(basePolicySchema);
  candidateSchema.properties.legacy.properties.importTargets = {
    type: "array",
    items: { $ref: "#/$defs/executablePath" }
  };
  candidateSchema.properties.legacy.properties.directP2AuthorityPaths = {
    type: "array",
    items: { type: "string" }
  };
  const result = await checkPlatformArchitecture({
    root,
    policy: candidate,
    policySchema: candidateSchema,
    basePolicy,
    basePolicySchema,
    virtualFiles: baseFiles
  });
  assert.ok(result.diagnostics.some((row) => row.code === "POLICY_WEAKENING" && row.path === "/legacy/importTargets"));
  assert.ok(result.diagnostics.some((row) =>
    row.code === "POLICY_WEAKENING" && row.path === "/legacy/directP2AuthorityPaths"));
});

test("base policy cannot be weakened and v0 admits no additional canonical executable", async () => {
  const [basePolicy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const weakeningCases = [
    ["scan root", (policy) => removeValue(policy.scanRoots, "bin")],
    ["protected module", (policy) => removeValue(policy.protectedModules, "src/proof-runtime.js")],
    ["branch-free module", (policy) => removeValue(policy.branchFreeModules, "src/catalog-authority.js")],
    ["adapter-data prefix", (policy) => removeValue(policy.changeSet.adapterDataPrefixes, "fixtures/design-system-compiler")],
    ["protected contract", (policy) => removeValue(policy.changeSet.protectedContractPaths, "src/proof-runtime.js")],
    ["catalog detection term", (policy) => {
      removeValue(policy.catalogAuthority.executableBasenameTerms, "ingestion");
      policy.catalogAuthority.executableBasenameTerms.push("parser");
      policy.catalogAuthority.executableBasenameTerms.sort();
    }],
    ["canonical path removal", (policy) => {
      policy.catalogAuthority.registeredExecutablePaths = policy.catalogAuthority.registeredExecutablePaths
        .filter((entry) => entry.path !== "src/catalog-authority.js");
    }],
    ["canonical path reclassification", (policy) => {
      policy.catalogAuthority.registeredExecutablePaths
        .find((entry) => entry.path === "src/catalog-authority.js").classification = "legacy";
    }],
    ["canonical route removal", (policy) => {
      policy.catalogAuthority.registeredRoutes = policy.catalogAuthority.registeredRoutes
        .filter((entry) => entry.value !== "design-system-compiler");
    }],
    ["canonical route reclassification", (policy) => {
      policy.catalogAuthority.registeredRoutes
        .find((entry) => entry.value === "design-system-compiler").classification = "legacy";
    }],
    ["neutral path reclassification", (policy) => {
      policy.catalogAuthority.registeredExecutablePaths
        .find((entry) => entry.path === "src/p1-proof.js").classification = "canonical";
    }],
    ["neutral route reclassification", (policy) => {
      policy.catalogAuthority.registeredRoutes
        .find((entry) => entry.path === "src/p0.js" && entry.value === "proof").classification = "canonical";
    }],
    ["neutral path addition", (policy) => {
      policy.catalogAuthority.registeredExecutablePaths.push({ path: "src/worker-node.js", classification: "neutral" });
      policy.catalogAuthority.registeredExecutablePaths.sort((left, right) => left.path.localeCompare(right.path));
    }],
    ["canonical route addition", (policy) => {
      policy.catalogAuthority.registeredRoutes.push({ path: "src/p0.js", value: "route-omega", classification: "canonical" });
      policy.catalogAuthority.registeredRoutes.sort((left, right) => rowKey(left).localeCompare(rowKey(right)));
    }],
    ["legacy path addition", (policy) => {
      policy.catalogAuthority.registeredExecutablePaths.push({ path: "src/platform-architecture.js", classification: "legacy" });
      policy.catalogAuthority.registeredExecutablePaths.sort((left, right) => left.path.localeCompare(right.path));
    }],
    ["legacy route addition", (policy) => {
      policy.catalogAuthority.registeredRoutes.push({ path: "src/p0.js", value: "new-catalog-route", classification: "legacy" });
      policy.catalogAuthority.registeredRoutes.sort((left, right) => rowKey(left).localeCompare(rowKey(right)));
    }],
    ["existing-module edge addition", (policy) => {
      policy.allowedProtectedEdges.push({ from: "src/catalog-authority.js", to: "src/catalog-release-boundary.js" });
      policy.allowedProtectedEdges.sort((left, right) => rowKey(left).localeCompare(rowKey(right)));
    }]
  ];

  for (const [label, mutate] of weakeningCases) {
    const candidate = structuredClone(basePolicy);
    mutate(candidate);
    const result = await checkPlatformArchitecture({
      root,
      policy: candidate,
      policySchema,
      basePolicy,
      virtualFiles: baseFiles
    });
    assert.ok(result.diagnostics.some((row) => row.code === "POLICY_WEAKENING"),
      `${label}: ${JSON.stringify(result.diagnostics, null, 2)}`);
  }

  const additivePolicy = structuredClone(basePolicy);
  const additiveFiles = structuredClone(baseFiles);
  additiveFiles["src/catalog-normalization.js"] = "import { canonicalJson } from \"./proof-runtime.js\";\nexport const normalize = canonicalJson;\n";
  additivePolicy.protectedModules.push("src/catalog-normalization.js");
  additivePolicy.protectedModules.sort();
  additivePolicy.branchFreeModules.push("src/catalog-normalization.js");
  additivePolicy.branchFreeModules.sort();
  additivePolicy.changeSet.protectedContractPaths.push("src/catalog-normalization.js");
  additivePolicy.changeSet.protectedContractPaths.sort();
  additivePolicy.catalogAuthority.registeredExecutablePaths.push({ path: "src/catalog-normalization.js", classification: "canonical" });
  additivePolicy.catalogAuthority.registeredExecutablePaths.sort((left, right) => left.path.localeCompare(right.path));
  additivePolicy.allowedProtectedEdges.push({ from: "src/catalog-normalization.js", to: "src/proof-runtime.js" });
  additivePolicy.allowedProtectedEdges.sort((left, right) => rowKey(left).localeCompare(rowKey(right)));
  const additive = await checkPlatformArchitecture({
    root,
    policy: additivePolicy,
    policySchema,
    basePolicy,
    virtualFiles: additiveFiles
  });
  assert.ok(additive.diagnostics.some((row) =>
    row.code === "POLICY_WEAKENING" && row.path === "/catalogAuthority/registeredExecutablePaths"),
  JSON.stringify(additive.diagnostics, null, 2));
});

test("legacy executable registrations are byte-frozen but may shrink through actual deletion", async () => {
  const [basePolicy, policySchema, baseFiles] = await Promise.all([policyPromise, policySchemaPromise, virtualFilesPromise]);
  const legacyPath = "scripts/materialize-spectrum-checkbox-catalog.mjs";
  const expandedFiles = structuredClone(baseFiles);
  expandedFiles[legacyPath] += "\nexport const extraCompiler = true;\n";
  const expanded = await checkPlatformArchitecture({
    root,
    policy: basePolicy,
    policySchema,
    basePolicy,
    virtualFiles: expandedFiles
  });
  assert.ok(expanded.diagnostics.some((row) =>
    row.code === "LEGACY_IMPLEMENTATION_DRIFT" && row.path === legacyPath));

  const retiredPolicy = structuredClone(basePolicy);
  retiredPolicy.catalogAuthority.registeredExecutablePaths = retiredPolicy.catalogAuthority.registeredExecutablePaths
    .filter((entry) => entry.path !== legacyPath);
  retiredPolicy.legacy.executableHashes = retiredPolicy.legacy.executableHashes
    .filter((entry) => entry.path !== legacyPath);
  const retiredFiles = structuredClone(baseFiles);
  delete retiredFiles[legacyPath];
  const retired = await checkPlatformArchitecture({
    root,
    policy: retiredPolicy,
    policySchema,
    basePolicy,
    virtualFiles: retiredFiles
  });
  assert.equal(retired.status, "pass", JSON.stringify(retired.diagnostics, null, 2));
});

async function snapshotFiles(roots) {
  const files = {};
  for (const relativeRoot of roots) await visit(relativeRoot);
  return files;

  async function visit(relativePath) {
    const absolutePath = path.join(root, ...relativePath.split("/"));
    const stat = await fs.lstat(absolutePath);
    if (stat.isFile()) {
      files[relativePath] = await fs.readFile(absolutePath, "utf8");
      return;
    }
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const child = `${relativePath}/${entry.name}`;
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) files[child] = await fs.readFile(path.join(root, ...child.split("/")), "utf8");
    }
  }
}

function validateSchema(schema, value) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  const validate = ajv.compile(schema);
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
}

function compareDiagnostics(left, right) {
  return left.code.localeCompare(right.code) || left.path.localeCompare(right.path) || left.detail.localeCompare(right.detail);
}

function rowKey(row) {
  if (typeof row === "string") return row;
  return row.from ? `${row.from}->${row.to}` : `${row.path}::${row.value}`;
}

function removeValue(values, value) {
  values.splice(values.indexOf(value), 1);
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, ...relativePath.split("/")), "utf8"));
}
