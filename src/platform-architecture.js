import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { scanJavaScriptModule } from "./javascript-module-scanner.js";

export const PLATFORM_ARCHITECTURE = Object.freeze({
  name: "surfaces-platform-architecture-admission",
  version: "0.0.0"
});

export const PLATFORM_ARCHITECTURE_MESSAGES = Object.freeze({
  POLICY_SCHEMA_INVALID: "The architecture policy does not satisfy its closed machine contract.",
  POLICY_ORDER_INVALID: "Architecture policy sets must be sorted and unique.",
  POLICY_WEAKENING: "The candidate architecture policy weakens an admitted base or its fail-closed structural protections.",
  EXECUTABLE_PATH_UNREGISTERED: "An executable path is absent from the closed architecture inventory.",
  EXECUTABLE_PATH_STALE: "A registered executable path is absent from the scanned repository.",
  FROZEN_ARCHITECTURE_FILE_DRIFT: "A v0 architecture guard, execution-control file, or causal mutation changed outside a versioned migration.",
  CLI_ROUTE_UNREGISTERED: "A command-line route is absent from the closed architecture inventory.",
  CLI_ROUTE_STALE: "A registered command-line route is absent from executable code.",
  LOCAL_IMPORT_UNRESOLVED: "A local executable import does not resolve inside the scanned implementation graph.",
  COMPUTED_MODULE_LOAD: "An executable uses a nonliteral dynamic import or CommonJS require.",
  PROTECTED_MODULE_MISSING: "A protected shared module is absent from the executable implementation graph.",
  PROTECTED_DEPENDENCY_UNPROTECTED: "A protected shared module imports a local dependency outside the protected branch-free closure.",
  PROTECTED_EDGE_UNDECLARED: "A local import touching a protected shared module is not an exact admitted edge.",
  PROTECTED_EDGE_STALE: "An admitted protected-module edge is not present in the executable implementation graph.",
  LEGACY_IMPORT_UNDECLARED: "A P0 or P2 implementation import is outside the frozen legacy exception set.",
  LEGACY_IMPORT_STALE: "A frozen P0 or P2 import exception no longer matches the executable implementation graph.",
  LEGACY_EXCEPTION_ADDED: "The candidate policy grows a frozen legacy exception set relative to the base policy.",
  LEGACY_IMPLEMENTATION_DRIFT: "A frozen legacy executable changed instead of shrinking through deletion and retirement.",
  ADAPTER_MANIFEST_INVALID: "The design-system adapter manifest or a reachable adapter contract is invalid.",
  ADAPTER_MANIFEST_UNREACHABLE: "The adapter manifest does not exactly reach every adapter, source lock, and locked source file.",
  ADAPTER_NOT_DATA_ONLY: "A design-system adapter grants or points to executable implementation authority.",
  SOURCE_IDENTITY_BRANCH: "A branch-free shared module contains a source-system or component identity literal.",
  IDENTITY_CONTROL_FLOW: "A branch-free shared module uses an identity-bearing field in control flow, comparison, regex, or concatenation outside the closed generic allowances.",
  CATALOG_AUTHORITY_PATH_UNREGISTERED: "An executable catalog, compiler, or ingestion path is not registered by architecture policy.",
  CATALOG_AUTHORITY_ROUTE_UNREGISTERED: "An executable catalog, compiler, or ingestion route is not registered by architecture policy.",
  DIRECT_P2_CONSUMER: "An executable reads the P2 catalog or evidence path outside the frozen direct-consumer exceptions.",
  DIRECT_P2_EXCEPTION_STALE: "A frozen direct P2 consumer exception no longer matches an executable string literal.",
  CHANGESET_BOUNDARY_CROSSED: "An adapter-data change includes a path outside the closed data-and-derived-output allowance.",
  MIGRATION_BASELINE_DRIFT: "The immutable migration baseline does not match its architecture-policy hash.",
  MUTATION_NOT_CAUSAL: "An architecture mutation fixture did not produce its exact expected diagnostic."
});

const JAVASCRIPT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]);
const EXECUTABLE_EXTENSIONS = new Set([...JAVASCRIPT_EXTENSIONS, ".bash", ".py", ".sh"]);
const IDENTITY_FIELDS = new Set([
  "adapterId", "adapterKey", "catalogId", "componentId", "componentIds", "expectedComponentIds",
  "outputKey", "packageIdentity", "packageName", "packageVersion", "sourceFamily", "sourceId",
  "sourceRefPrefix", "upstreamRepository"
]);
const IDENTITY_STOP_WORDS = new Set([
  "adapter", "and", "catalog", "component", "components", "core", "data", "design", "designsystem",
  "documentation", "json", "package", "portable", "source", "system", "the", "tokens", "ui"
]);
const SWITCH_CONTROL_KEYWORD = String.fromCodePoint(115, 119, 105, 116, 99, 104);
const SELF_PACKAGE_NAME = "surfaces-platform-v2";
const CLOSED_EXECUTION_ROOTS = Object.freeze([".github", "test"]);
const REQUIRED_FROZEN_FILE_PATHS = Object.freeze([
  ".github/workflows/platform-architecture-trusted.yml",
  ".github/workflows/surfaces-proof.yml",
  "bin/interfacectl.js",
  "fixtures/design-system-compiler/mutations/authority-without-mapping.design-system-compiler-mutation.json",
  "fixtures/design-system-compiler/mutations/lossless-member-identifier-invention.design-system-compiler-mutation.json",
  "fixtures/design-system-compiler/mutations/lossless-target-inversion.design-system-compiler-mutation.json",
  "fixtures/design-system-compiler/mutations/receipt-catalog-hash-mismatch.design-system-compiler-mutation.json",
  "package-lock.json",
  "package.json",
  "schemas/catalog-boundary-receipt.v0.schema.json",
  "schemas/catalog-consumer-fixture.v0.schema.json",
  "schemas/catalog-consumer-report.v0.schema.json",
  "schemas/catalog-render-plan.v0.schema.json",
  "schemas/catalog-runtime-projection.v0.schema.json",
  "schemas/design-system-adapter.v0.schema.json",
  "schemas/design-system-compiler-diagnostics.v0.schema.json",
  "schemas/design-system-compiler-evidence.v0.schema.json",
  "schemas/design-system-compiler-manifest.v0.schema.json",
  "schemas/design-system-compiler-mutation.v0.schema.json",
  "schemas/design-system-compiler-report.v0.schema.json",
  "schemas/diagnostics.v0.schema.json",
  "schemas/extract.v0.schema.json",
  "schemas/platform-path-baseline.v0.schema.json",
  "schemas/platform-architecture-diagnostics.v0.schema.json",
  "schemas/platform-architecture-mutation.v0.schema.json",
  "schemas/portable-design-source-lock.v0.schema.json",
  "schemas/runtime-catalog.v0.schema.json",
  "scripts/check-platform-architecture.mjs",
  "scripts/verify-platform-path-baseline.mjs",
  "src/javascript-module-scanner.js",
  "src/p0.js",
  "src/platform-architecture.js"
]);

export async function checkPlatformArchitecture({
  root,
  policy,
  policySchema,
  basePolicy = null,
  basePolicySchema = policySchema,
  baseAdapterManifest = null,
  changedPaths = null,
  virtualFiles = null
}) {
  const diagnostics = [];
  const policyValidation = validatePolicySchema(policy, policySchema);
  if (!policyValidation.valid) {
    for (const error of policyValidation.errors) {
      diagnostics.push(diagnostic("POLICY_SCHEMA_INVALID", error.instancePath || "/", error.message || "schema validation failed"));
    }
    return emptyResult(diagnostics);
  }
  checkPolicySchemaAdmission(policy, policySchema, "/bootstrapChangeBoundary/policySchemaSha256", diagnostics);
  if (basePolicy !== null) {
    const baseValidation = validatePolicySchema(basePolicy, basePolicySchema);
    if (!baseValidation.valid) {
      for (const error of baseValidation.errors) {
        diagnostics.push(diagnostic("POLICY_SCHEMA_INVALID", `/basePolicy${error.instancePath || ""}` || "/basePolicy", error.message || "schema validation failed"));
      }
      return emptyResult(diagnostics);
    }
    checkPolicySchemaAdmission(basePolicy, basePolicySchema,
      "/basePolicy/bootstrapChangeBoundary/policySchemaSha256", diagnostics);
  }
  validatePolicyOrdering(policy, diagnostics);
  checkPolicyStructure(policy, diagnostics);
  checkBootstrapPolicyAdmission(policy, basePolicy, changedPaths, diagnostics);
  checkPolicyAgainstBase(policy, basePolicy, diagnostics);

  const access = createFileAccess(root, virtualFiles);
  await checkMigrationBaseline(access, policy, diagnostics);
  await checkFrozenFileHashes(access, policy, diagnostics);
  await checkClosedExecutionSurface(access, policy, diagnostics);
  const executablePaths = await discoverExecutablePaths(access, policy.scanRoots, diagnostics);
  const sourceByPath = new Map();
  for (const executablePath of executablePaths) {
    sourceByPath.set(executablePath, await access.readText(executablePath));
  }
  const scans = new Map([...sourceByPath].map(([filePath, source]) =>
    [filePath, scanExecutableSource(filePath, source)]));
  const graph = buildLocalImportGraph({ executablePaths, scans, diagnostics });
  checkComputedModuleLoads(scans, diagnostics);

  checkProtectedModules(policy, executablePaths, graph, diagnostics);
  checkLegacyImports(policy, graph, basePolicy, diagnostics);
  await checkLegacyExecutableHashes(access, policy, executablePaths, diagnostics);

  const adapterResult = await deriveAdapterArchitecture({ access, policy, diagnostics });
  await checkAdapterEvolution({
    access,
    policy,
    basePolicy,
    manifest: adapterResult.manifest,
    baseAdapterManifest,
    changedPaths,
    diagnostics
  });
  checkBranchFreeModules(policy, scans, adapterResult.identityTerms, diagnostics);
  checkExecutableRegistration(policy, executablePaths, scans, diagnostics);
  checkDirectP2Consumers(policy, scans, basePolicy, diagnostics);
  await checkChangeSetBoundary(access, policy, basePolicy, changedPaths, diagnostics);

  return {
    status: diagnostics.length === 0 ? "pass" : "fail",
    diagnostics: sortArchitectureDiagnostics(diagnostics),
    graph: {
      files: executablePaths,
      edges: graph.edges
    },
    identities: adapterResult.identities
  };
}

export async function runArchitectureMutationFixtures({
  root,
  policy,
  policySchema,
  mutationSchema,
  diagnosticsSchema,
  virtualFiles = null
}) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  ajv.addSchema(policySchema);
  ajv.addSchema(diagnosticsSchema);
  const validateMutation = ajv.compile(mutationSchema);
  const baselineFiles = virtualFiles || await snapshotArchitectureFiles({ root, policy });
  const admittedBaseAdapterManifest = JSON.parse(baselineFiles[policy.adapterManifestPath]);
  const results = [];
  const diagnostics = [];
  for (const mutationPath of policy.mutationFixtures) {
    const mutation = JSON.parse(await fs.readFile(path.join(root, ...mutationPath.split("/")), "utf8"));
    if (!validateMutation(mutation)) {
      throw new Error(`${mutationPath} violates platform-architecture-mutation.v0: ${ajv.errorsText(validateMutation.errors)}`);
    }
    const candidatePolicy = structuredClone(policy);
    const candidateFiles = structuredClone(baselineFiles);
    applyArchitectureMutation({ mutation, policy: candidatePolicy, virtualFiles: candidateFiles });
    const comparisonMode = mutation.comparisonMode ||
      (mutation.edits.some((edit) => edit.kind.includes("policy")) ? "admitted-base" : "none");
    const result = await checkPlatformArchitecture({
      root,
      policy: candidatePolicy,
      policySchema,
      basePolicy: comparisonMode === "admitted-base" ? policy : null,
      baseAdapterManifest: comparisonMode === "admitted-base" ? admittedBaseAdapterManifest : null,
      changedPaths: comparisonMode === "none" ? null : mutationChangedPaths(mutation),
      virtualFiles: candidateFiles
    });
    const actualCodes = [...new Set(result.diagnostics.map((row) => row.code))].sort();
    const editedPaths = mutationChangedPaths(mutation);
    const policyEdited = mutation.edits.some((edit) => edit.kind.includes("policy"));
    const expectedRows = result.diagnostics.filter((row) => row.code === mutation.expectedCode);
    const causalPaths = expectedRows.map((row) => row.path).filter((diagnosticPath) =>
      editedPaths.includes(diagnosticPath) || policyEdited && diagnosticPath.startsWith("/"));
    const matched = result.status === "fail" && actualCodes.includes(mutation.expectedCode) && causalPaths.length > 0;
    results.push({
      mutationId: mutation.mutationId,
      mutationPath,
      expectedCode: mutation.expectedCode,
      actualCodes,
      causalPaths: [...new Set(causalPaths)].sort(),
      matched
    });
    if (!matched) {
      diagnostics.push(diagnostic("MUTATION_NOT_CAUSAL", mutationPath,
        `expected=${mutation.expectedCode};actual=${actualCodes.join(",") || "pass"}`));
    }
  }
  return {
    status: diagnostics.length === 0 ? "pass" : "fail",
    matched: results.filter((row) => row.matched).length,
    total: results.length,
    results,
    diagnostics: sortArchitectureDiagnostics(diagnostics)
  };
}

export async function snapshotArchitectureFiles({ root, policy }) {
  const access = createFileAccess(root, null);
  const snapshot = {};
  const roots = [...new Set([
    ...policy.scanRoots,
    policy.adapterDataRoot,
    path.posix.dirname(policy.adapterManifestPath),
    path.posix.dirname(policy.migrationBaseline.path)
  ])].sort();
  for (const snapshotRoot of roots) {
    for (const filePath of await access.listFiles(snapshotRoot)) {
      snapshot[filePath] = await access.readText(filePath);
    }
  }
  for (const filePath of policy.frozenFileHashes.map((entry) => entry.path)) {
    if (!Object.hasOwn(snapshot, filePath)) snapshot[filePath] = await access.readText(filePath);
  }
  return snapshot;
}

export function applyArchitectureMutation({ mutation, policy, virtualFiles }) {
  for (const edit of mutation.edits) {
    if (edit.kind === "write-file") virtualFiles[edit.path] = edit.content;
    else if (edit.kind === "append-file") virtualFiles[edit.path] = `${virtualFiles[edit.path] || ""}${edit.content}`;
    else if (edit.kind === "replace-text") {
      const current = virtualFiles[edit.path];
      if (typeof current !== "string" || current.split(edit.from).length !== 2) {
        throw new Error(`replace-text requires one exact match: ${edit.path}`);
      }
      virtualFiles[edit.path] = current.replace(edit.from, edit.to);
    }
    else if (edit.kind === "append-policy-row") {
      const collection = policyCollection(policy, edit.collection);
      collection.push(structuredClone(edit.value));
      collection.sort((left, right) => genericPolicyRowKey(left).localeCompare(genericPolicyRowKey(right)));
    } else if (edit.kind === "remove-policy-row") {
      const { container, property } = policyCollectionContainer(policy, edit.collection);
      container[property] = container[property].filter((row) => genericPolicyRowKey(row) !== genericPolicyRowKey(edit.value));
    }
  }
}

export function validatePolicySchema(policy, policySchema) {
  try {
    const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
    const validate = ajv.compile(policySchema);
    const valid = validate(policy);
    return { valid: Boolean(valid), errors: valid ? [] : [...(validate.errors || [])] };
  } catch (error) {
    return { valid: false, errors: [{ instancePath: "/", message: error.message }] };
  }
}

export function scanJavaScriptSource(source) {
  const scan = scanJavaScriptModule(source);
  return { ...scan, imports: scan.moduleSpecifiers };
}

function scanExecutableSource(filePath, source) {
  const extension = path.posix.extname(filePath);
  if (JAVASCRIPT_EXTENSIONS.has(extension) || extension === "" && /^#!.*\bnode\b/.test(source.split(/\r?\n/, 1)[0])) {
    return scanJavaScriptSource(source);
  }
  return {
    imports: [],
    moduleSpecifiers: [],
    commonJsLoaderUsages: [],
    nonLiteralDynamicImports: [],
    nonLiteralLoads: [],
    stringLiterals: [],
    tokens: [],
    commentFreeSource: source
  };
}

export function buildLocalImportGraph({ executablePaths, scans, diagnostics = [] }) {
  const fileSet = new Set(executablePaths);
  const edges = [];
  for (const from of executablePaths) {
    const scan = scans.get(from);
    for (const specifier of scan?.imports || []) {
      if (specifier.startsWith("#") || specifier === SELF_PACKAGE_NAME || specifier.startsWith(`${SELF_PACKAGE_NAME}/`)) {
        diagnostics.push(diagnostic("LOCAL_IMPORT_UNRESOLVED", from, `package-local alias prohibited:${specifier}`));
        continue;
      }
      if (!specifier.startsWith(".")) continue;
      const to = resolveLocalImport(from, specifier, fileSet);
      if (to === null) {
        diagnostics.push(diagnostic("LOCAL_IMPORT_UNRESOLVED", from, specifier));
        continue;
      }
      edges.push({ from, to });
    }
  }
  return {
    edges: uniqueBy(edges, edgeKey).sort(compareEdges)
  };
}

export function resolveLocalImport(from, specifier, fileSet) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(from), cleanSpecifier));
  const candidates = [joined];
  if (!path.posix.extname(joined)) {
    for (const extension of JAVASCRIPT_EXTENSIONS) candidates.push(`${joined}${extension}`);
    for (const extension of JAVASCRIPT_EXTENSIONS) candidates.push(`${joined}/index${extension}`);
  } else if (/\.(?:js|mjs|cjs)$/.test(joined)) {
    const stem = joined.replace(/\.(?:js|mjs|cjs)$/, "");
    candidates.push(`${stem}.ts`, `${stem}.mts`, `${stem}.cts`);
  }
  return candidates.find((candidate) => fileSet.has(candidate)) || null;
}

export function sortArchitectureDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) =>
    left.code.localeCompare(right.code) || left.path.localeCompare(right.path) || left.detail.localeCompare(right.detail));
}

function emptyResult(diagnostics) {
  return {
    status: "fail",
    diagnostics: sortArchitectureDiagnostics(diagnostics),
    graph: { files: [], edges: [] },
    identities: []
  };
}

function diagnostic(code, diagnosticPath, detail = "") {
  return {
    code,
    message: PLATFORM_ARCHITECTURE_MESSAGES[code],
    path: diagnosticPath,
    detail
  };
}

function validatePolicyOrdering(policy, diagnostics) {
  const scalarLists = [
    ["/scanRoots", policy.scanRoots],
    ["/protectedModules", policy.protectedModules],
    ["/branchFreeModules", policy.branchFreeModules],
    ["/mutationFixtures", policy.mutationFixtures],
    ["/migrationBaseline/inventoryExcludedPrefixes", policy.migrationBaseline.inventoryExcludedPrefixes],
    ["/migrationBaseline/postBaselinePaths", policy.migrationBaseline.postBaselinePaths],
    ["/legacy/importTargets", policy.legacy.importTargets],
    ["/legacy/directP2AuthorityPaths", policy.legacy.directP2AuthorityPaths],
    ["/catalogAuthority/executableBasenameTerms", policy.catalogAuthority.executableBasenameTerms],
    ["/changeSet/adapterDataPrefixes", policy.changeSet.adapterDataPrefixes],
    ["/changeSet/adapterAllowedCochangePrefixes", policy.changeSet.adapterAllowedCochangePrefixes],
    ["/changeSet/protectedContractPaths", policy.changeSet.protectedContractPaths],
    ["/diagnosticCodes", policy.diagnosticCodes]
  ];
  const objectLists = [
    ["/allowedProtectedEdges", policy.allowedProtectedEdges, edgeKey],
    ["/protectedDependencyExceptions", policy.protectedDependencyExceptions, edgeKey],
    ["/identityControlFlowAllowances", policy.identityControlFlowAllowances, identityAllowanceKey],
    ["/migrationBaseline/admittedCatalogReportClosureHashes",
      policy.migrationBaseline.admittedCatalogReportClosureHashes, fileHashKey],
    ["/migrationBaseline/admittedEvidenceSelfHashes",
      policy.migrationBaseline.admittedEvidenceSelfHashes, fileHashKey],
    ["/legacy/importExceptions", policy.legacy.importExceptions, edgeKey],
    ["/legacy/directP2ConsumerExceptions", policy.legacy.directP2ConsumerExceptions, literalKey],
    ["/legacy/executableHashes", policy.legacy.executableHashes, (entry) => entry.path],
    ["/platformRoles", policy.platformRoles, (entry) => entry.role],
    ["/catalogAuthority/registeredExecutablePaths", policy.catalogAuthority.registeredExecutablePaths, (entry) => entry.path],
    ["/catalogAuthority/registeredRoutes", policy.catalogAuthority.registeredRoutes, literalKey],
    ["/frozenFileHashes", policy.frozenFileHashes, (entry) => entry.path]
  ];
  for (const [pointer, values] of scalarLists) {
    if (!isSortedUnique(values)) diagnostics.push(diagnostic("POLICY_ORDER_INVALID", pointer));
  }
  for (const [pointer, values, key] of objectLists) {
    if (!isSortedUnique(values.map(key))) diagnostics.push(diagnostic("POLICY_ORDER_INVALID", pointer));
  }
}

function checkPolicyStructure(policy, diagnostics) {
  const protectedModules = new Set(policy.protectedModules);
  const branchFreeModules = new Set(policy.branchFreeModules);
  const protectedContracts = new Set(policy.changeSet.protectedContractPaths);
  if (policy.schemaId !== "platform-architecture-policy.v0" || policy.version !== PLATFORM_ARCHITECTURE.version) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/schemaId", `${policy.schemaId}@${policy.version}`));
  }
  if (!sameStrings(policy.diagnosticCodes, Object.keys(PLATFORM_ARCHITECTURE_MESSAGES))) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/diagnosticCodes", "canonical diagnostic registry changed"));
  }
  for (const requiredRoot of ["bin", "scripts", "src"]) {
    if (!policy.scanRoots.includes(requiredRoot)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/scanRoots", `missing:${requiredRoot}`));
    }
  }
  for (const requiredPath of [policy.adapterManifestPath, policy.adapterDataRoot]) {
    if (!policy.changeSet.adapterDataPrefixes.some((prefix) => requiredPath === prefix || requiredPath.startsWith(`${prefix}/`))) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/changeSet/adapterDataPrefixes", `unprotected:${requiredPath}`));
    }
  }
  for (const prefix of policy.changeSet.adapterDataPrefixes) {
    if (!policy.changeSet.adapterAllowedCochangePrefixes.includes(prefix)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/changeSet/adapterAllowedCochangePrefixes", `missing:${prefix}`));
    }
  }
  for (const entry of policy.catalogAuthority.registeredExecutablePaths) {
    if (entry.classification === "canonical" &&
        (!protectedModules.has(entry.path) || !branchFreeModules.has(entry.path))) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/catalogAuthority/registeredExecutablePaths", `canonical path lacks protected and branch-free admission:${entry.path}`));
    }
  }
  for (const modulePath of policy.protectedModules) {
    if (!branchFreeModules.has(modulePath)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/branchFreeModules", `protected module is not branch-free:${modulePath}`));
    }
  }
  for (const modulePath of [...new Set([...policy.protectedModules, ...policy.branchFreeModules])].sort()) {
    if (!protectedContracts.has(modulePath)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/changeSet/protectedContractPaths", `missing:${modulePath}`));
    }
  }
  const registrations = new Map(
    policy.catalogAuthority.registeredExecutablePaths.map((entry) => [entry.path, entry.classification])
  );
  const ownedPaths = new Set();
  for (const role of policy.platformRoles) {
    if (role.ownerPath === null) continue;
    if (ownedPaths.has(role.ownerPath) || registrations.get(role.ownerPath) !== "canonical" ||
        !protectedModules.has(role.ownerPath) || !branchFreeModules.has(role.ownerPath)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/platformRoles", `${role.role}:${role.ownerPath}`));
    }
    ownedPaths.add(role.ownerPath);
  }
  const canonicalPaths = policy.catalogAuthority.registeredExecutablePaths
    .filter((entry) => entry.classification === "canonical").map((entry) => entry.path).sort();
  if (!sameStrings(canonicalPaths, [...ownedPaths])) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/platformRoles", "canonical executable lacks one exclusive role"));
  }
  const legacyRegistrations = policy.catalogAuthority.registeredExecutablePaths
    .filter((entry) => entry.classification === "legacy").map((entry) => entry.path).sort();
  const legacyHashPaths = policy.legacy.executableHashes.map((entry) => entry.path).sort();
  if (!sameStrings(legacyRegistrations, legacyHashPaths)) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/legacy/executableHashes", "legacy registrations and frozen hashes differ"));
  }
  const frozenPaths = new Set(policy.frozenFileHashes.map((entry) => entry.path));
  for (const requiredPath of [...REQUIRED_FROZEN_FILE_PATHS, ...policy.mutationFixtures]) {
    if (!frozenPaths.has(requiredPath)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/frozenFileHashes", `missing:${requiredPath}`));
    }
  }
  for (const entry of policy.catalogAuthority.registeredExecutablePaths) {
    if (entry.classification !== "legacy" && !frozenPaths.has(entry.path)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/frozenFileHashes", `unfrozen-v0-executable:${entry.path}`));
    }
  }
}

function checkBootstrapPolicyAdmission(policy, basePolicy, changedPaths, diagnostics) {
  if (basePolicy !== null || !Array.isArray(changedPaths)) return;
  const expected = policy.bootstrapChangeBoundary.admittedPolicySha256;
  const actual = admittedPolicySha256(policy);
  if (expected !== actual) {
    diagnostics.push(diagnostic(
      "POLICY_WEAKENING",
      "/bootstrapChangeBoundary/admittedPolicySha256",
      `expected=${expected || "missing"};actual=${actual}`
    ));
  }
}

export function admittedPolicySha256(policy) {
  const admitted = structuredClone(policy);
  admitted.bootstrapChangeBoundary.admittedPolicySha256 = null;
  return crypto.createHash("sha256").update(canonicalPolicyJson(admitted)).digest("hex");
}

export function admittedPolicySchemaSha256(policySchema) {
  const admitted = structuredClone(policySchema);
  const bootstrapProperties = admitted?.properties?.bootstrapChangeBoundary?.properties;
  if (bootstrapProperties?.admittedPolicySha256) {
    bootstrapProperties.admittedPolicySha256.const = null;
  }
  if (bootstrapProperties?.policySchemaSha256) {
    bootstrapProperties.policySchemaSha256.const = null;
  }
  return crypto.createHash("sha256").update(canonicalPolicyJson(admitted)).digest("hex");
}

function checkPolicySchemaAdmission(policy, policySchema, diagnosticPath, diagnostics) {
  const expected = policy.bootstrapChangeBoundary.policySchemaSha256;
  const actual = admittedPolicySchemaSha256(policySchema);
  if (expected !== actual) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", diagnosticPath,
      `expected=${expected || "missing"};actual=${actual}`));
  }
}

function checkPolicyAgainstBase(policy, basePolicy, diagnostics) {
  if (!basePolicy) return;
  requireRetainedRows(basePolicy.scanRoots, policy.scanRoots, (value) => value, "/scanRoots", diagnostics);
  requireRetainedRows(basePolicy.protectedModules, policy.protectedModules, (value) => value, "/protectedModules", diagnostics);
  requireRetainedRows(basePolicy.branchFreeModules, policy.branchFreeModules, (value) => value, "/branchFreeModules", diagnostics);
  requireRetainedRows(basePolicy.mutationFixtures, policy.mutationFixtures, (value) => value, "/mutationFixtures", diagnostics);
  requireRetainedRows(
    basePolicy.changeSet.adapterDataPrefixes,
    policy.changeSet.adapterDataPrefixes,
    (value) => value,
    "/changeSet/adapterDataPrefixes",
    diagnostics
  );
  reportAddedPolicyRows(
    basePolicy.changeSet.adapterAllowedCochangePrefixes,
    policy.changeSet.adapterAllowedCochangePrefixes,
    (value) => value,
    "/changeSet/adapterAllowedCochangePrefixes",
    diagnostics
  );
  requireRetainedRows(
    basePolicy.changeSet.protectedContractPaths,
    policy.changeSet.protectedContractPaths,
    (value) => value,
    "/changeSet/protectedContractPaths",
    diagnostics
  );
  for (const [pointer, baseValue, candidateValue] of [
    ["/bootstrapChangeBoundary/baseCommit", basePolicy.bootstrapChangeBoundary.baseCommit,
      policy.bootstrapChangeBoundary.baseCommit],
    ["/bootstrapChangeBoundary/admittedPolicySha256", basePolicy.bootstrapChangeBoundary.admittedPolicySha256,
      policy.bootstrapChangeBoundary.admittedPolicySha256],
    ["/bootstrapChangeBoundary/policySchemaSha256", basePolicy.bootstrapChangeBoundary.policySchemaSha256,
      policy.bootstrapChangeBoundary.policySchemaSha256],
    ["/bootstrapChangeBoundary/adapterManifestSha256", basePolicy.bootstrapChangeBoundary.adapterManifestSha256,
      policy.bootstrapChangeBoundary.adapterManifestSha256],
    ["/adapterManifestPath", basePolicy.adapterManifestPath, policy.adapterManifestPath],
    ["/adapterDataRoot", basePolicy.adapterDataRoot, policy.adapterDataRoot],
    ["/migrationBaseline/path", basePolicy.migrationBaseline.path, policy.migrationBaseline.path],
    ["/migrationBaseline/sha256", basePolicy.migrationBaseline.sha256, policy.migrationBaseline.sha256]
  ]) {
    if (baseValue !== candidateValue) diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, `${baseValue}->${candidateValue}`));
  }
  if (!sameStrings(basePolicy.catalogAuthority.executableBasenameTerms, policy.catalogAuthority.executableBasenameTerms)) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/catalogAuthority/executableBasenameTerms", "detection terms changed"));
  }
  for (const [pointer, baseValues, candidateValues] of [
    ["/legacy/importTargets", basePolicy.legacy.importTargets, policy.legacy.importTargets],
    ["/legacy/directP2AuthorityPaths", basePolicy.legacy.directP2AuthorityPaths, policy.legacy.directP2AuthorityPaths],
    ["/diagnosticCodes", basePolicy.diagnosticCodes, policy.diagnosticCodes],
    ["/migrationBaseline/inventoryExcludedPrefixes", basePolicy.migrationBaseline.inventoryExcludedPrefixes,
      policy.migrationBaseline.inventoryExcludedPrefixes]
  ]) {
    if (!sameStrings(baseValues, candidateValues)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, "immutable set changed"));
    }
  }
  if (canonicalPolicyJson(basePolicy.platformRoles) !== canonicalPolicyJson(policy.platformRoles)) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/platformRoles", "exclusive role ownership changed"));
  }
  if (!sameStrings(basePolicy.frozenFileHashes.map(fileHashKey), policy.frozenFileHashes.map(fileHashKey))) {
    diagnostics.push(diagnostic("POLICY_WEAKENING", "/frozenFileHashes", "v0 frozen-file registry changed"));
  }

  checkRegistrationEvolution({
    baseRows: basePolicy.catalogAuthority.registeredExecutablePaths,
    candidateRows: policy.catalogAuthority.registeredExecutablePaths,
    key: (entry) => entry.path,
    pointer: "/catalogAuthority/registeredExecutablePaths",
    allowedNewClassifications: new Set(),
    allowedRemovedClassifications: new Set(["legacy"]),
    diagnostics
  });

  reportAddedPolicyRows(
    basePolicy.protectedDependencyExceptions,
    policy.protectedDependencyExceptions,
    edgeKey,
    "/protectedDependencyExceptions",
    diagnostics
  );
  for (const [pointer, baseRows, candidateRows, key] of [
    ["/migrationBaseline/postBaselinePaths", basePolicy.migrationBaseline.postBaselinePaths,
      policy.migrationBaseline.postBaselinePaths, (value) => value],
    ["/legacy/executableHashes", basePolicy.legacy.executableHashes,
      policy.legacy.executableHashes, fileHashKey]
  ]) {
    reportAddedPolicyRows(baseRows, candidateRows, key, pointer, diagnostics);
  }
  for (const [pointer, baseRows, candidateRows] of [
    ["/migrationBaseline/admittedCatalogReportClosureHashes",
      basePolicy.migrationBaseline.admittedCatalogReportClosureHashes,
      policy.migrationBaseline.admittedCatalogReportClosureHashes],
    ["/migrationBaseline/admittedEvidenceSelfHashes",
      basePolicy.migrationBaseline.admittedEvidenceSelfHashes,
      policy.migrationBaseline.admittedEvidenceSelfHashes]
  ]) {
    if (!sameStrings(baseRows.map(fileHashKey), candidateRows.map(fileHashKey))) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, "admitted migration hash set changed"));
    }
  }
  reportAddedPolicyRows(
    basePolicy.identityControlFlowAllowances,
    policy.identityControlFlowAllowances,
    identityAllowanceKey,
    "/identityControlFlowAllowances",
    diagnostics
  );
  checkRegistrationEvolution({
    baseRows: basePolicy.catalogAuthority.registeredRoutes,
    candidateRows: policy.catalogAuthority.registeredRoutes,
    key: literalKey,
    pointer: "/catalogAuthority/registeredRoutes",
    allowedNewClassifications: new Set(),
    allowedRemovedClassifications: new Set(["legacy"]),
    diagnostics
  });

  const baseProtected = new Set(basePolicy.protectedModules);
  const baseEdges = new Set(basePolicy.allowedProtectedEdges.map(edgeKey));
  for (const edge of policy.allowedProtectedEdges) {
    if (!baseEdges.has(edgeKey(edge)) && baseProtected.has(edge.from) && baseProtected.has(edge.to)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/allowedProtectedEdges", `added existing-module edge:${edgeKey(edge)}`));
    }
  }
}

function requireRetainedRows(baseRows, candidateRows, key, pointer, diagnostics) {
  const candidateKeys = new Set(candidateRows.map(key));
  for (const row of baseRows) {
    const rowKey = key(row);
    if (!candidateKeys.has(rowKey)) diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, `removed:${rowKey}`));
  }
}

function checkRegistrationEvolution({
  baseRows,
  candidateRows,
  key,
  pointer,
  allowedNewClassifications,
  allowedRemovedClassifications = new Set(),
  diagnostics
}) {
  const baseByKey = new Map(baseRows.map((row) => [key(row), row]));
  const candidateByKey = new Map(candidateRows.map((row) => [key(row), row]));
  for (const baseRow of baseRows) {
    const candidate = candidateByKey.get(key(baseRow));
    if (candidate && candidate.classification !== baseRow.classification) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, `classification changed:${key(baseRow)}:${baseRow.classification}->${candidate.classification}`));
    } else if (!candidate && !allowedRemovedClassifications.has(baseRow.classification)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, `registration removed:${key(baseRow)}`));
    }
  }
  for (const candidate of candidateRows) {
    if (!baseByKey.has(key(candidate)) && !allowedNewClassifications.has(candidate.classification)) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", pointer,
        `registration added:${key(candidate)}:${candidate.classification}`));
    }
  }
}

function reportAddedPolicyRows(baseRows, candidateRows, key, pointer, diagnostics) {
  const baseKeys = new Set(baseRows.map(key));
  for (const row of candidateRows) {
    if (!baseKeys.has(key(row))) diagnostics.push(diagnostic("POLICY_WEAKENING", pointer, `allowance added:${key(row)}`));
  }
}

function mutationChangedPaths(mutation) {
  const paths = mutation.edits.flatMap((edit) => {
    if (typeof edit.path === "string") return [edit.path];
    if (typeof edit.collection === "string") {
      return ["fixtures/platform-path-consolidation/architecture-policy.json"];
    }
    return [];
  });
  return [...new Set(paths)].sort();
}

function checkProtectedModules(policy, executablePaths, graph, diagnostics) {
  const executableSet = new Set(executablePaths);
  const protectedSet = new Set(policy.protectedModules);
  const branchFreeSet = new Set(policy.branchFreeModules);
  const registrations = new Map(
    policy.catalogAuthority.registeredExecutablePaths.map((entry) => [entry.path, entry.classification])
  );
  const dependencyExceptions = new Set(policy.protectedDependencyExceptions.map(edgeKey));
  for (const modulePath of policy.protectedModules) {
    if (!executableSet.has(modulePath)) diagnostics.push(diagnostic("PROTECTED_MODULE_MISSING", modulePath));
  }
  const actual = graph.edges.filter((edge) => protectedSet.has(edge.from) || protectedSet.has(edge.to));
  compareExactRows({
    actual,
    declared: policy.allowedProtectedEdges,
    key: edgeKey,
    missingCode: "PROTECTED_EDGE_UNDECLARED",
    staleCode: "PROTECTED_EDGE_STALE",
    diagnostics
  });
  const graphEdges = new Set(graph.edges.map(edgeKey));
  for (const edge of graph.edges.filter((candidate) => protectedSet.has(candidate.from))) {
    if ((!protectedSet.has(edge.to) || !branchFreeSet.has(edge.to)) && !dependencyExceptions.has(edgeKey(edge))) {
      diagnostics.push(diagnostic("PROTECTED_DEPENDENCY_UNPROTECTED", edge.from, edgeKey(edge)));
    }
  }
  for (const exception of policy.protectedDependencyExceptions) {
    if (!graphEdges.has(edgeKey(exception)) || !protectedSet.has(exception.from) || protectedSet.has(exception.to) ||
        !branchFreeSet.has(exception.to) || registrations.get(exception.to) !== "neutral") {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/protectedDependencyExceptions", `invalid:${edgeKey(exception)}`));
    }
  }
}

function checkComputedModuleLoads(scans, diagnostics) {
  for (const [filePath, scan] of scans) {
    const findings = [
      ...(scan.nonLiteralDynamicImports || []),
      ...(scan.commonJsLoaderUsages || [])
    ];
    for (const finding of uniqueBy(findings, (row) => `${row.kind}:${row.index}`)) {
      diagnostics.push(diagnostic("COMPUTED_MODULE_LOAD", filePath, `${finding.kind}:${finding.line}:${finding.column}`));
    }
  }
}

function checkLegacyImports(policy, graph, basePolicy, diagnostics) {
  const targets = new Set(policy.legacy.importTargets);
  const actual = graph.edges.filter((edge) => targets.has(edge.to));
  compareExactRows({
    actual,
    declared: policy.legacy.importExceptions,
    key: edgeKey,
    missingCode: "LEGACY_IMPORT_UNDECLARED",
    staleCode: "LEGACY_IMPORT_STALE",
    diagnostics
  });
  if (basePolicy) {
    reportAddedExceptions(
      basePolicy.legacy?.importExceptions || [],
      policy.legacy.importExceptions,
      edgeKey,
      "/legacy/importExceptions",
      diagnostics
    );
  }
}

async function checkMigrationBaseline(access, policy, diagnostics) {
  try {
    const bytes = await access.readText(policy.migrationBaseline.path);
    const actual = crypto.createHash("sha256").update(bytes).digest("hex");
    if (actual !== policy.migrationBaseline.sha256) {
      diagnostics.push(diagnostic("MIGRATION_BASELINE_DRIFT", policy.migrationBaseline.path,
        `expected=${policy.migrationBaseline.sha256};actual=${actual}`));
    }
  } catch (error) {
    diagnostics.push(diagnostic("MIGRATION_BASELINE_DRIFT", policy.migrationBaseline.path, error.message));
  }
}

async function checkFrozenFileHashes(access, policy, diagnostics) {
  for (const entry of policy.frozenFileHashes) {
    try {
      if (await access.isSymlink(entry.path)) {
        diagnostics.push(diagnostic(
          "FROZEN_ARCHITECTURE_FILE_DRIFT",
          entry.path,
          "frozen path must be a regular file, not a symbolic link"
        ));
        continue;
      }
      const actual = crypto.createHash("sha256").update(await access.readText(entry.path)).digest("hex");
      if (actual !== entry.sha256) {
        diagnostics.push(diagnostic("FROZEN_ARCHITECTURE_FILE_DRIFT", entry.path,
          `expected=${entry.sha256};actual=${actual}`));
      }
    } catch (error) {
      diagnostics.push(diagnostic("FROZEN_ARCHITECTURE_FILE_DRIFT", entry.path, error.message));
    }
  }
}

async function checkClosedExecutionSurface(access, policy, diagnostics) {
  const frozenPaths = new Set(policy.frozenFileHashes.map((entry) => entry.path));
  for (const executionRoot of CLOSED_EXECUTION_ROOTS) {
    let files;
    try {
      files = await access.listFiles(executionRoot);
    } catch (error) {
      diagnostics.push(diagnostic("EXECUTABLE_PATH_UNREGISTERED", executionRoot, error.message));
      continue;
    }
    for (const filePath of files) {
      if (!frozenPaths.has(filePath)) {
        diagnostics.push(diagnostic(
          "EXECUTABLE_PATH_UNREGISTERED",
          filePath,
          `unfrozen file under closed execution root ${executionRoot}`
        ));
      }
    }
    for (const symlinkPath of await access.listSymlinks(executionRoot)) {
      diagnostics.push(diagnostic(
        "EXECUTABLE_PATH_UNREGISTERED",
        symlinkPath,
        `symbolic link under closed execution root ${executionRoot}`
      ));
    }
  }

  for (const scanRoot of policy.scanRoots) {
    for (const symlinkPath of await access.listSymlinks(scanRoot)) {
      diagnostics.push(diagnostic(
        "EXECUTABLE_PATH_UNREGISTERED",
        symlinkPath,
        `symbolic link under executable scan root ${scanRoot}`
      ));
    }
  }

  for (const filePath of await access.listDirectFiles()) {
    const extensionExecutable = EXECUTABLE_EXTENSIONS.has(path.posix.extname(filePath));
    const shebangExecutable = !extensionExecutable &&
      (await access.readText(filePath).catch(() => "")).startsWith("#!");
    if ((extensionExecutable || shebangExecutable) && !frozenPaths.has(filePath)) {
      diagnostics.push(diagnostic(
        "EXECUTABLE_PATH_UNREGISTERED",
        filePath,
        "unfrozen repository-root executable"
      ));
    }
  }
  for (const symlinkPath of await access.listDirectSymlinks()) {
    diagnostics.push(diagnostic(
      "EXECUTABLE_PATH_UNREGISTERED",
      symlinkPath,
      "repository-root symbolic link"
    ));
  }
}

async function checkLegacyExecutableHashes(access, policy, executablePaths, diagnostics) {
  const executableSet = new Set(executablePaths);
  for (const entry of policy.legacy.executableHashes) {
    if (!executableSet.has(entry.path)) {
      diagnostics.push(diagnostic("LEGACY_IMPLEMENTATION_DRIFT", entry.path, "frozen executable missing"));
      continue;
    }
    try {
      const actual = crypto.createHash("sha256").update(await access.readText(entry.path)).digest("hex");
      if (actual !== entry.sha256) {
        diagnostics.push(diagnostic("LEGACY_IMPLEMENTATION_DRIFT", entry.path,
          `expected=${entry.sha256};actual=${actual}`));
      }
    } catch (error) {
      diagnostics.push(diagnostic("LEGACY_IMPLEMENTATION_DRIFT", entry.path, error.message));
    }
  }
}

async function deriveAdapterArchitecture({ access, policy, diagnostics }) {
  const identities = [];
  let manifest;
  let validateManifest;
  let validateAdapter;
  let validateSourceLock;
  try {
    const [manifestSchema, adapterSchema, sourceLockSchema, runtimeCatalogSchema, catalogDiagnosticsSchema] = await Promise.all([
      readJsonFromAccess(access, "schemas/design-system-compiler-manifest.v0.schema.json"),
      readJsonFromAccess(access, "schemas/design-system-adapter.v0.schema.json"),
      readJsonFromAccess(access, "schemas/portable-design-source-lock.v0.schema.json"),
      readJsonFromAccess(access, "schemas/runtime-catalog.v0.schema.json"),
      readJsonFromAccess(access, "schemas/diagnostics.v0.schema.json")
    ]);
    const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
    ajv.addSchema(catalogDiagnosticsSchema);
    ajv.addSchema(runtimeCatalogSchema);
    validateManifest = ajv.compile(manifestSchema);
    validateAdapter = ajv.compile(adapterSchema);
    validateSourceLock = ajv.compile(sourceLockSchema);
    manifest = JSON.parse(await access.readText(policy.adapterManifestPath));
  } catch (error) {
    diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", policy.adapterManifestPath, error.message));
    return { identities, identityTerms: [], manifest: null };
  }
  if (!validateManifest(manifest)) {
    diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", policy.adapterManifestPath,
      schemaErrors(validateManifest.errors)));
    return { identities, identityTerms: [], manifest: null };
  }

  const fixtureOwners = new Map();
  for (const entry of manifest.adapters) {
    const adapterKey = path.posix.basename(path.posix.dirname(entry.adapterPath));
    const fixtureRoot = `fixtures/design-system-compiler/${adapterKey}`;
    if (fixtureOwners.has(fixtureRoot)) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        policy.adapterManifestPath,
        `consumer fixture root is shared by ${fixtureOwners.get(fixtureRoot)} and ${entry.adapterPath}: ${fixtureRoot}`
      ));
    } else {
      fixtureOwners.set(fixtureRoot, entry.adapterPath);
    }
  }

  const dataFiles = await access.listFiles(policy.adapterDataRoot);
  for (const symlinkPath of await access.listSymlinks(policy.adapterDataRoot)) {
    diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", symlinkPath, "symbolic link in adapter-data root"));
  }
  const discoveredAdapters = dataFiles.filter((filePath) => filePath.endsWith("/adapter.json"));
  const discoveredLocks = dataFiles.filter((filePath) => filePath.endsWith("/source.lock.json"));
  const declaredAdapters = manifest.adapters.map((entry) => entry.adapterPath).sort();
  if (!sameStrings(discoveredAdapters, declaredAdapters)) {
    diagnostics.push(diagnostic("ADAPTER_MANIFEST_UNREACHABLE", policy.adapterDataRoot, `adapters:${setDifferenceDetail(discoveredAdapters, declaredAdapters)}`));
  }

  const reachableLocks = [];
  for (const entry of manifest.adapters) {
    let adapter;
    let sourceLock;
    try {
      adapter = JSON.parse(await access.readText(entry.adapterPath));
      sourceLock = JSON.parse(await access.readText(adapter.sourceLockPath));
    } catch (error) {
      diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", entry.adapterPath, error.message));
      continue;
    }
    if (!validateAdapter(adapter)) {
      diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", entry.adapterPath,
        schemaErrors(validateAdapter.errors)));
      if (adapter?.normalizedExtract?.provenance?.upstreamCodeExecuted !== false ||
          adapter?.runtimeCapabilities?.actionExecution !== "disabled") {
        diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", entry.adapterPath,
          "adapter grants executable source or runtime authority"));
      }
      continue;
    }
    if (!validateSourceLock(sourceLock)) {
      diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", adapter.sourceLockPath,
        schemaErrors(validateSourceLock.errors)));
      continue;
    }
    reachableLocks.push(adapter.sourceLockPath);
    const componentIds = Array.isArray(adapter.normalizedExtract?.components)
      ? adapter.normalizedExtract.components.map((component) => component.id).sort()
      : [];
    const identity = {
      adapterId: adapter.adapterId,
      outputKey: entry.outputKey,
      sourceFamily: adapter.sourceFamily,
      sourceId: sourceLock.sourceId,
      packageName: sourceLock.acquisition?.packageName,
      componentIds
    };
    identities.push(identity);

    const adapterDirectory = path.posix.dirname(entry.adapterPath);
    const adapterKey = path.posix.basename(adapterDirectory);
    const fixtureRoot = `fixtures/design-system-compiler/${adapterKey}`;
    const consumerFixturePaths = Object.values(adapter.consumerFixtures || {}).sort();
    const dataOnly = entry.adapterPath === `${adapterDirectory}/adapter.json` &&
      adapterDirectory === `${policy.adapterDataRoot}/${adapterKey}` &&
      adapter.sourceLockPath === `${adapterDirectory}/source.lock.json` &&
      adapter.normalizedExtract?.sourceUri === entry.adapterPath &&
      adapter.normalizedExtract?.provenance?.upstreamCodeExecuted === false &&
      adapter.runtimeCapabilities?.actionExecution === "disabled" &&
      sourceLock.rootPath === entry.sourceRoot &&
      entry.sourceRoot.startsWith(`${adapterDirectory}/`) &&
      consumerFixturePaths.every((fixturePath) => fixturePath.startsWith(`${fixtureRoot}/`)) &&
      sameStrings(componentIds, [...(entry.expectedComponentIds || [])].sort());
    if (!dataOnly) diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", entry.adapterPath));

    if (!Array.isArray(sourceLock.files)) {
      diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", adapter.sourceLockPath, "source lock files"));
    } else {
      const actualSourceFiles = (await access.listFiles(entry.sourceRoot))
        .map((filePath) => filePath.slice(entry.sourceRoot.length + 1))
        .sort();
      const lockedSourceFiles = sourceLock.files.map((row) => row.path).sort();
      if (!sameStrings(actualSourceFiles, lockedSourceFiles)) {
        diagnostics.push(diagnostic("ADAPTER_MANIFEST_UNREACHABLE", entry.sourceRoot, `source-files:${setDifferenceDetail(actualSourceFiles, lockedSourceFiles)}`));
      }
      const actualAdapterFiles = await access.listFiles(adapterDirectory);
      const expectedAdapterFiles = [
        entry.adapterPath,
        adapter.sourceLockPath,
        ...sourceLock.files.map((row) => `${entry.sourceRoot}/${row.path}`)
      ].sort();
      if (!sameStrings(actualAdapterFiles, expectedAdapterFiles)) {
        diagnostics.push(diagnostic(
          "ADAPTER_MANIFEST_UNREACHABLE",
          adapterDirectory,
          `adapter-files:${setDifferenceDetail(actualAdapterFiles, expectedAdapterFiles)}`
        ));
      }
      for (const lockedFile of sourceLock.files) {
        const lockedPath = `${entry.sourceRoot}/${lockedFile.path}`;
        try {
          const bytes = await access.readBytes(lockedPath);
          const actualHash = crypto.createHash("sha256").update(bytes).digest("hex");
          if (bytes.byteLength !== lockedFile.bytes || actualHash !== lockedFile.sha256) {
            diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", lockedPath,
              `lock-mismatch:bytes=${bytes.byteLength}/${lockedFile.bytes};sha256=${actualHash}/${lockedFile.sha256}`));
          }
        } catch (error) {
          diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", lockedPath, error.message));
        }
      }
    }
    const actualFixtureFiles = await access.listFiles(fixtureRoot).catch(() => []);
    if (!sameStrings(actualFixtureFiles, consumerFixturePaths)) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_UNREACHABLE",
        fixtureRoot,
        `consumer-fixtures:${setDifferenceDetail(actualFixtureFiles, consumerFixturePaths)}`
      ));
    }
    for (const symlinkPath of await access.listSymlinks(fixtureRoot)) {
      diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", symlinkPath, "symbolic link in adapter consumer fixture root"));
    }
    for (const fixturePath of consumerFixturePaths) {
      if (!fixturePath.endsWith(".json") || !(await access.exists(fixturePath))) {
        diagnostics.push(diagnostic("ADAPTER_MANIFEST_UNREACHABLE", fixturePath, "consumer fixture"));
      }
    }
  }
  if (!sameStrings(discoveredLocks, reachableLocks.sort())) {
    diagnostics.push(diagnostic("ADAPTER_MANIFEST_UNREACHABLE", policy.adapterDataRoot, `locks:${setDifferenceDetail(discoveredLocks, reachableLocks)}`));
  }
  return {
    identities: identities.sort((a, b) => a.adapterId.localeCompare(b.adapterId)),
    identityTerms: deriveSourceIdentityTerms(identities),
    manifest
  };
}

async function checkAdapterEvolution({
  access,
  policy,
  basePolicy,
  manifest,
  baseAdapterManifest,
  changedPaths,
  diagnostics
}) {
  if (!manifest) return;

  if (basePolicy !== null && Array.isArray(changedPaths) && baseAdapterManifest === null) {
    diagnostics.push(diagnostic(
      "ADAPTER_MANIFEST_INVALID",
      policy.adapterManifestPath,
      "base-aware adapter evolution requires the admitted base adapter manifest"
    ));
    return;
  }

  if (basePolicy === null && Array.isArray(changedPaths)) {
    const expected = policy.bootstrapChangeBoundary.adapterManifestSha256;
    const actual = crypto.createHash("sha256")
      .update(await access.readText(policy.adapterManifestPath))
      .digest("hex");
    if (expected !== actual) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        policy.adapterManifestPath,
        `bootstrap-manifest-hash:${expected || "missing"}->${actual}`
      ));
    }
  }

  if (!baseAdapterManifest) return;

  const candidateAdapterPaths = manifest.adapters.map((entry) => entry.adapterPath);
  if (!isSortedUnique(candidateAdapterPaths)) {
    diagnostics.push(diagnostic("ADAPTER_MANIFEST_INVALID", policy.adapterManifestPath, "adapter rows must be sorted by adapterPath"));
  }
  if (manifest.expectedRun?.adapterCount !== manifest.adapters.length) {
    diagnostics.push(diagnostic(
      "ADAPTER_MANIFEST_INVALID",
      policy.adapterManifestPath,
      `expectedRun.adapterCount=${manifest.expectedRun?.adapterCount};adapters=${manifest.adapters.length}`
    ));
  }
  if (canonicalPolicyJson(adapterManifestStableContract(manifest)) !==
      canonicalPolicyJson(adapterManifestStableContract(baseAdapterManifest))) {
    diagnostics.push(diagnostic(
      "ADAPTER_MANIFEST_INVALID",
      policy.adapterManifestPath,
      "generic manifest contract changed during an adapter addition"
    ));
  }

  const candidateByPath = new Map(manifest.adapters.map((entry) => [entry.adapterPath, entry]));
  const basePaths = new Set(baseAdapterManifest.adapters.map((entry) => entry.adapterPath));
  for (const baseEntry of baseAdapterManifest.adapters) {
    const candidateEntry = candidateByPath.get(baseEntry.adapterPath);
    if (!candidateEntry || canonicalPolicyJson(candidateEntry) !== canonicalPolicyJson(baseEntry)) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        baseEntry.adapterPath,
        "an admitted adapter row was removed or rewritten"
      ));
    }
  }
  const newRows = manifest.adapters.filter((entry) => !basePaths.has(entry.adapterPath));
  const manifestChanged = canonicalPolicyJson(manifest) !== canonicalPolicyJson(baseAdapterManifest);
  if (manifestChanged && newRows.length !== 1) {
    diagnostics.push(diagnostic(
      "ADAPTER_MANIFEST_INVALID",
      policy.adapterManifestPath,
      `adapter manifest evolution must append exactly one row;added=${newRows.length}`
    ));
  }

  if (!Array.isArray(changedPaths)) return;
  const existingPrefixes = baseAdapterManifest.adapters.flatMap((entry) => {
    const adapterKey = path.posix.basename(path.posix.dirname(entry.adapterPath));
    return [path.posix.dirname(entry.adapterPath), `fixtures/design-system-compiler/${adapterKey}`];
  });
  const newPrefixes = newRows.flatMap((entry) => {
    const adapterKey = path.posix.basename(path.posix.dirname(entry.adapterPath));
    return [path.posix.dirname(entry.adapterPath), `fixtures/design-system-compiler/${adapterKey}`];
  });
  const isWithin = (candidate, prefix) => candidate === prefix || candidate.startsWith(`${prefix}/`);
  for (const changedPath of changedPaths) {
    if (existingPrefixes.some((prefix) => isWithin(changedPath, prefix))) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        changedPath,
        "an admitted adapter closure is immutable"
      ));
    }
  }
  const adapterDataChanges = changedPaths.filter((changedPath) =>
    policy.changeSet.adapterDataPrefixes.some((prefix) => isWithin(changedPath, prefix)));
  for (const changedPath of adapterDataChanges) {
    if (changedPath === policy.adapterManifestPath) continue;
    if (changedPath.startsWith("fixtures/design-system-compiler/mutations/")) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        changedPath,
        "generic causal fixtures are immutable during adapter addition"
      ));
      continue;
    }
    if (!newPrefixes.some((prefix) => isWithin(changedPath, prefix)) &&
        !existingPrefixes.some((prefix) => isWithin(changedPath, prefix))) {
      diagnostics.push(diagnostic(
        "ADAPTER_MANIFEST_INVALID",
        changedPath,
        "adapter data is not owned by the one appended manifest row"
      ));
    }
  }
}

function adapterManifestStableContract(manifest) {
  const clone = structuredClone(manifest);
  delete clone.adapters;
  if (clone.expectedRun) clone.expectedRun.adapterCount = null;
  return clone;
}

export function deriveSourceIdentityTerms(identities) {
  const terms = new Set();
  const add = (raw, includeWhole = true) => {
    if (typeof raw !== "string") return;
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    if (includeWhole && normalized.length >= 4 && !IDENTITY_STOP_WORDS.has(normalized.replaceAll(/[^a-z0-9]/g, ""))) terms.add(normalized);
    for (const token of normalized.split(/[^a-z0-9]+/).filter(Boolean)) {
      if (token.length >= 4 && !IDENTITY_STOP_WORDS.has(token)) terms.add(token);
    }
  };
  for (const identity of identities) {
    add(identity.adapterId);
    add(identity.outputKey);
    add(identity.sourceFamily);
    add(identity.sourceId);
    add(identity.packageName);
    for (const componentId of identity.componentIds) add(componentId);
  }
  return [...terms].sort();
}

function checkBranchFreeModules(policy, scans, identityTerms, diagnostics) {
  const actualControlFlow = [];
  for (const modulePath of policy.branchFreeModules) {
    const scan = scans.get(modulePath);
    if (!scan) continue;
    for (const literal of scan.stringLiterals) {
      const matched = identityTerms.find((identity) => containsIdentity(literal, identity));
      if (matched) diagnostics.push(diagnostic("SOURCE_IDENTITY_BRANCH", modulePath, `${matched}:${literal}`));
    }
    actualControlFlow.push(...identityControlFlowFindings(modulePath, scan));
  }
  const declared = new Map(policy.identityControlFlowAllowances.map((row) => [identityAllowanceKey(row), row]));
  const actual = new Map(actualControlFlow.map((row) => [identityAllowanceKey(row), row]));
  for (const row of actualControlFlow) {
    if (!declared.has(identityAllowanceKey(row))) {
      diagnostics.push(diagnostic("IDENTITY_CONTROL_FLOW", row.path, `${row.signature}:count=${row.count}`));
    }
  }
  for (const row of policy.identityControlFlowAllowances) {
    if (!actual.has(identityAllowanceKey(row))) {
      diagnostics.push(diagnostic("POLICY_WEAKENING", "/identityControlFlowAllowances", `stale:${identityAllowanceKey(row)}`));
    }
  }
}

function identityControlFlowFindings(filePath, scan) {
  const raw = [];
  const tokens = scan.tokens || [];
  const source = scan.commentFreeSource || "";
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === "template") {
      for (const field of IDENTITY_FIELDS) {
        if (new RegExp(`\\b${field}\\b`).test(token.value)) {
          raw.push(identityFinding(filePath, "concatenation", field, [token], source));
        }
      }
      continue;
    }
    const field = identityFieldAt(tokens, index);
    if (field === null) continue;
    const nearby = tokens.slice(Math.max(0, index - 12), Math.min(tokens.length, index + 13));
    if (nearby.some((candidate) => ["===", "!==", "==", "!="].includes(candidate.value))) {
      raw.push(identityFinding(filePath, "comparison", field, nearby, source));
    }
    if (nearby.some((candidate) => candidate.type === "identifier" &&
        ["endsWith", "includes", "indexOf", "lastIndexOf", "localeCompare", "startsWith"].includes(candidate.value))) {
      raw.push(identityFinding(filePath, "comparison", field, nearby, source));
    }
    if (nearby.some((candidate) => candidate.value === "+" || candidate.type === "template") ||
        isInsideTemplateInterpolation(source, token.start)) {
      raw.push(identityFinding(filePath, "concatenation", field, nearby, source));
    }
    if (nearby.some((candidate) => candidate.type === "regex" ||
        (candidate.type === "identifier" && ["exec", "match", "matchAll", "replace", "replaceAll", "search", "test"].includes(candidate.value)))) {
      raw.push(identityFinding(filePath, "regex", field, nearby, source));
    }
    if (isInsideControlCondition(tokens, index) ||
        nearby.some((candidate) => ["?", "&&", "||", "??"].includes(candidate.value))) {
      raw.push(identityFinding(filePath, "conditional", field, nearby, source));
    }
  }
  const counts = new Map();
  for (const row of raw) {
    const key = `${row.path}::${row.signature}`;
    counts.set(key, { ...row, count: (counts.get(key)?.count || 0) + 1 });
  }
  return [...counts.values()].sort((left, right) => identityAllowanceKey(left).localeCompare(identityAllowanceKey(right)));
}

function identityFieldAt(tokens, index) {
  const token = tokens[index];
  if (token.type === "identifier" && IDENTITY_FIELDS.has(token.value)) return token.value;
  if (token.type === "string" && IDENTITY_FIELDS.has(token.value) && tokens[index - 1]?.value === "[") return token.value;
  return null;
}

function isInsideControlCondition(tokens, fieldIndex) {
  const stack = [];
  for (let index = 0; index <= fieldIndex; index += 1) {
    if (tokens[index].value === "(") stack.push(index);
    else if (tokens[index].value === ")") stack.pop();
  }
  return stack.some((openIndex) => {
    const control = tokens[openIndex - 1];
    return control?.type === "identifier" &&
      (["if", "while", "for"].includes(control.value) || control.value === SWITCH_CONTROL_KEYWORD);
  });
}

function identityFinding(filePath, kind, field, tokens, source) {
  const first = tokens[0];
  const last = tokens.at(-1);
  const sourceSlice = first && last ? source.slice(first.start, last.end).replaceAll(/\s+/g, " ").trim() : "";
  const normalized = `${tokens.map((token) => `${token.type}:${token.value}`).join("|")}::${sourceSlice}`;
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  return { path: filePath, signature: `${kind}:${field}:${hash}`, count: 1 };
}

function isInsideTemplateInterpolation(source, position) {
  const prefix = source.slice(0, position);
  const templateStart = lastUnescapedIndex(prefix, "`");
  const interpolationStart = prefix.lastIndexOf("${");
  if (templateStart < 0 || interpolationStart < templateStart) return false;
  const interpolationEnd = source.indexOf("}", position);
  const templateEnd = source.indexOf("`", position);
  return interpolationEnd >= 0 && templateEnd >= 0 && interpolationEnd < templateEnd;
}

function lastUnescapedIndex(value, needle) {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (value[index] !== needle) continue;
    let backslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) backslashes += 1;
    if (backslashes % 2 === 0) return index;
  }
  return -1;
}

function checkExecutableRegistration(policy, executablePaths, scans, diagnostics) {
  const registeredByPath = new Map(policy.catalogAuthority.registeredExecutablePaths.map((entry) => [entry.path, entry]));
  const executableSet = new Set(executablePaths);
  const terms = policy.catalogAuthority.executableBasenameTerms;
  for (const executablePath of executablePaths) {
    if (!registeredByPath.has(executablePath)) {
      diagnostics.push(diagnostic("EXECUTABLE_PATH_UNREGISTERED", executablePath));
    }
    const basename = path.posix.basename(executablePath).toLowerCase();
    if (terms.some((term) => basename.includes(term)) &&
        (!registeredByPath.has(executablePath) || registeredByPath.get(executablePath)?.classification === "neutral")) {
      diagnostics.push(diagnostic("CATALOG_AUTHORITY_PATH_UNREGISTERED", executablePath,
        registeredByPath.has(executablePath) ? "authority marker classified as neutral" : "authority marker is unregistered"));
    }
  }
  for (const entry of policy.catalogAuthority.registeredExecutablePaths) {
    if (!executableSet.has(entry.path)) diagnostics.push(diagnostic("EXECUTABLE_PATH_STALE", entry.path));
  }

  const registeredRoutes = new Map(policy.catalogAuthority.registeredRoutes.map((entry) => [literalKey(entry), entry]));
  const actualRoutes = [];
  for (const [filePath, scan] of scans) {
    for (const route of executableRouteLiterals(scan.tokens)) {
      const row = { path: filePath, value: route };
      actualRoutes.push(row);
      const registration = registeredRoutes.get(literalKey(row));
      if (!registration) diagnostics.push(diagnostic("CLI_ROUTE_UNREGISTERED", filePath, route));
      if (!route.startsWith("-") && terms.some((term) => route.toLowerCase().includes(term)) &&
          (!registration || registration.classification === "neutral")) {
        diagnostics.push(diagnostic("CATALOG_AUTHORITY_ROUTE_UNREGISTERED", filePath,
          `${route}:${registration ? "authority marker classified as neutral" : "authority marker is unregistered"}`));
      }
    }
  }
  const actualRouteKeys = new Set(actualRoutes.map(literalKey));
  for (const route of policy.catalogAuthority.registeredRoutes) {
    if (!actualRouteKeys.has(literalKey(route))) diagnostics.push(diagnostic("CLI_ROUTE_STALE", route.path, route.value));
  }
}

function executableRouteLiterals(tokens) {
  const routes = new Set();
  const scopes = tokenScopes(tokens);
  const argvAliases = [];
  let aliasAdded = true;
  while (aliasAdded) {
    aliasAdded = false;
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index]?.type !== "identifier" || tokens[index + 1]?.value !== "=") continue;
      if (isArgvAccess(tokens, index + 2) ||
          tokens[index + 2]?.type === "identifier" &&
            isVisibleArgvAlias(tokens[index + 2].value, index + 2, scopes[index + 2], argvAliases)) {
        const key = `${tokens[index].value}:${index}`;
        if (!argvAliases.some((entry) => entry.key === key)) {
          argvAliases.push({ key, name: tokens[index].value, index, scope: scopes[index] });
          aliasAdded = true;
        }
      }
    }
  }
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "string") continue;
    const operatorBefore = isRouteComparison(tokens[index - 1]?.value);
    const directBefore = operatorBefore && (isArgvAccess(tokens, index - 5) || isArgvAccess(tokens, index - 7));
    const aliasBefore = operatorBefore && tokens[index - 2]?.type === "identifier" &&
      isVisibleArgvAlias(tokens[index - 2].value, index - 2, scopes[index - 2], argvAliases);
    const operatorAfter = isRouteComparison(tokens[index + 1]?.value);
    const directAfter = operatorAfter && isArgvAccess(tokens, index + 2);
    const aliasAfter = operatorAfter && tokens[index + 2]?.type === "identifier" &&
      isVisibleArgvAlias(tokens[index + 2].value, index + 2, scopes[index + 2], argvAliases);
    const caseRoute = tokens[index - 1]?.value === "case" &&
      enclosingSwitchUsesArgv(tokens, index, scopes, argvAliases);
    if (directBefore || aliasBefore || directAfter || aliasAfter || caseRoute) routes.add(token.value);
  }
  return [...routes].sort();
}

function isArgvAccess(tokens, start) {
  const direct = tokens[start]?.type === "identifier" && tokens[start].value === "argv" &&
    tokens[start + 1]?.value === "[" && tokens[start + 3]?.value === "]";
  const processArgv = tokens[start]?.type === "identifier" && tokens[start].value === "process" &&
    tokens[start + 1]?.value === "." && tokens[start + 2]?.type === "identifier" && tokens[start + 2].value === "argv" &&
    tokens[start + 3]?.value === "[" && tokens[start + 5]?.value === "]";
  return direct || processArgv;
}

function isRouteComparison(value) {
  return ["===", "!==", "==", "!="].includes(value);
}

function enclosingSwitchUsesArgv(tokens, caseIndex, scopes, argvAliases) {
  let braceDepth = 0;
  for (let index = caseIndex - 2; index >= 0; index -= 1) {
    if (tokens[index].value === "}") braceDepth += 1;
    else if (tokens[index].value === "{") {
      if (braceDepth > 0) {
        braceDepth -= 1;
        continue;
      }
      const closeParen = index - 1;
      if (tokens[closeParen]?.value !== ")") return false;
      let openParen = closeParen - 1;
      let parenDepth = 1;
      for (; openParen >= 0; openParen -= 1) {
        if (tokens[openParen].value === ")") parenDepth += 1;
        else if (tokens[openParen].value === "(") {
          parenDepth -= 1;
          if (parenDepth === 0) break;
        }
      }
      if (tokens[openParen - 1]?.value !== SWITCH_CONTROL_KEYWORD) return false;
      return isArgvAccess(tokens, openParen + 1) ||
        tokens[openParen + 1]?.type === "identifier" &&
          isVisibleArgvAlias(tokens[openParen + 1].value, openParen + 1, scopes[openParen + 1], argvAliases);
    }
  }
  return false;
}

function tokenScopes(tokens) {
  const scopes = [];
  const stack = [];
  for (let index = 0; index < tokens.length; index += 1) {
    scopes[index] = [...stack];
    if (tokens[index].value === "{") stack.push(index);
    else if (tokens[index].value === "}") stack.pop();
  }
  return scopes;
}

function isVisibleArgvAlias(name, useIndex, useScope, assignments) {
  return assignments.some((entry) => entry.name === name && entry.index < useIndex && isScopePrefix(entry.scope, useScope));
}

function isScopePrefix(candidate, target) {
  return candidate.length <= target.length && candidate.every((value, index) => target[index] === value);
}

function checkDirectP2Consumers(policy, scans, basePolicy, diagnostics) {
  const authorityPaths = new Set(policy.legacy.directP2AuthorityPaths);
  const actual = [];
  for (const [filePath, scan] of scans) {
    for (const literal of scan.stringLiterals) {
      if (authorityPaths.has(literal)) actual.push({ path: filePath, value: literal });
    }
  }
  compareExactRows({
    actual: uniqueBy(actual, literalKey),
    declared: policy.legacy.directP2ConsumerExceptions,
    key: literalKey,
    missingCode: "DIRECT_P2_CONSUMER",
    staleCode: "DIRECT_P2_EXCEPTION_STALE",
    diagnostics
  });
  if (basePolicy) {
    reportAddedExceptions(
      basePolicy.legacy?.directP2ConsumerExceptions || [],
      policy.legacy.directP2ConsumerExceptions,
      literalKey,
      "/legacy/directP2ConsumerExceptions",
      diagnostics
    );
  }
}

async function checkChangeSetBoundary(access, policy, basePolicy, changedPaths, diagnostics) {
  if (!Array.isArray(changedPaths)) return;
  const adapterChanges = changedPaths.filter((changedPath) =>
    policy.changeSet.adapterDataPrefixes.some((prefix) => changedPath === prefix || changedPath.startsWith(`${prefix}/`)));
  const disallowedCochanges = adapterChanges.length === 0 ? [] : changedPaths.filter((changedPath) =>
    !policy.changeSet.adapterAllowedCochangePrefixes.some((prefix) =>
      changedPath === prefix || changedPath.startsWith(`${prefix}/`)));
  if (adapterChanges.length && disallowedCochanges.length) {
    diagnostics.push(diagnostic(
      "CHANGESET_BOUNDARY_CROSSED",
      "/changeSet",
      `adapter=${adapterChanges.sort().join(",")};outsideAllowance=${disallowedCochanges.sort().join(",")}`
    ));
  }
  const jsonOnlyPrefixes = [
    "artifacts/capability-index",
    "artifacts/design-system-compiler",
    "fixtures/design-system-compiler"
  ];
  for (const changedPath of changedPaths.filter((candidate) =>
    jsonOnlyPrefixes.some((prefix) => candidate === prefix || candidate.startsWith(`${prefix}/`)))) {
    if (!changedPath.endsWith(".json")) {
      diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", changedPath, "non-JSON file in inert adapter fixture or output root"));
    }
    if (await access.isSymlink(changedPath)) {
      diagnostics.push(diagnostic("ADAPTER_NOT_DATA_ONLY", changedPath, "symbolic link in inert adapter fixture or output root"));
    }
  }
}

function compareExactRows({ actual, declared, key, missingCode, staleCode, diagnostics }) {
  const actualKeys = new Set(actual.map(key));
  const declaredKeys = new Set(declared.map(key));
  for (const row of actual) {
    const rowKey = key(row);
    if (!declaredKeys.has(rowKey)) diagnostics.push(diagnostic(missingCode, row.path || row.from, rowKey));
  }
  for (const row of declared) {
    const rowKey = key(row);
    if (!actualKeys.has(rowKey)) diagnostics.push(diagnostic(staleCode, row.path || row.from, rowKey));
  }
}

function reportAddedExceptions(baseRows, candidateRows, key, pointer, diagnostics) {
  const baseKeys = new Set(baseRows.map(key));
  for (const row of candidateRows) {
    const rowKey = key(row);
    if (!baseKeys.has(rowKey)) diagnostics.push(diagnostic("LEGACY_EXCEPTION_ADDED", pointer, rowKey));
  }
}

function containsIdentity(literal, identity) {
  const escaped = identity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(literal);
}

function createFileAccess(root, virtualFiles) {
  const virtual = virtualFiles === null
    ? null
    : new Map(Object.entries(virtualFiles).map(([filePath, value]) => [normalizeRepoPath(filePath), String(value)]));
  return {
    async readText(filePath) {
      const normalized = normalizeRepoPath(filePath);
      if (virtual) {
        if (!virtual.has(normalized)) throw new Error(`missing virtual file: ${normalized}`);
        return virtual.get(normalized);
      }
      return fs.readFile(path.join(root, ...normalized.split("/")), "utf8");
    },
    async readBytes(filePath) {
      const normalized = normalizeRepoPath(filePath);
      if (virtual) {
        if (!virtual.has(normalized)) throw new Error(`missing virtual file: ${normalized}`);
        return Buffer.from(virtual.get(normalized), "utf8");
      }
      return fs.readFile(path.join(root, ...normalized.split("/")));
    },
    async exists(filePath) {
      const normalized = normalizeRepoPath(filePath);
      if (virtual) return virtual.has(normalized);
      const stat = await fs.lstat(path.join(root, ...normalized.split("/"))).catch(() => null);
      return Boolean(stat?.isFile() && !stat.isSymbolicLink());
    },
    async isSymlink(filePath) {
      const normalized = normalizeRepoPath(filePath);
      if (virtual) return false;
      const stat = await fs.lstat(path.join(root, ...normalized.split("/"))).catch(() => null);
      return Boolean(stat?.isSymbolicLink());
    },
    async listFiles(prefix) {
      const normalizedPrefix = normalizeRepoPath(prefix).replace(/\/$/, "");
      if (virtual) {
        return [...virtual.keys()].filter((filePath) => filePath === normalizedPrefix || filePath.startsWith(`${normalizedPrefix}/`)).sort();
      }
      const absolute = path.join(root, ...normalizedPrefix.split("/"));
      return listRegularFiles(absolute, normalizedPrefix);
    },
    async listDirectFiles() {
      if (virtual) return [...virtual.keys()].filter((filePath) => !filePath.includes("/")).sort();
      const entries = await fs.readdir(root, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
    },
    async listDirectSymlinks() {
      if (virtual) return [];
      const entries = await fs.readdir(root, { withFileTypes: true });
      return entries.filter((entry) => entry.isSymbolicLink()).map((entry) => entry.name).sort();
    },
    async listSymlinks(prefix) {
      const normalizedPrefix = normalizeRepoPath(prefix).replace(/\/$/, "");
      if (virtual) return [];
      const absolute = path.join(root, ...normalizedPrefix.split("/"));
      return listSymbolicLinks(absolute, normalizedPrefix);
    }
  };
}

async function discoverExecutablePaths(access, scanRoots, diagnostics) {
  const result = [];
  for (const scanRoot of scanRoots) {
    let paths;
    try {
      paths = await access.listFiles(scanRoot);
    } catch (error) {
      diagnostics.push(diagnostic("POLICY_SCHEMA_INVALID", `/scanRoots/${scanRoot}`, error.message));
      continue;
    }
    for (const filePath of paths) {
      if (EXECUTABLE_EXTENSIONS.has(path.posix.extname(filePath))) {
        result.push(filePath);
        continue;
      }
      const source = await access.readText(filePath).catch(() => "");
      if (source.startsWith("#!")) result.push(filePath);
    }
  }
  return [...new Set(result)].sort();
}

async function listRegularFiles(absoluteRoot, relativeRoot) {
  const stat = await fs.lstat(absoluteRoot).catch(() => null);
  if (!stat?.isDirectory() || stat.isSymbolicLink()) return [];
  const result = [];
  async function visit(absoluteDirectory, relativeDirectory) {
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = `${relativeDirectory}/${entry.name}`;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await visit(absolutePath, relativePath);
      else if (entry.isFile()) result.push(relativePath);
    }
  }
  await visit(absoluteRoot, relativeRoot);
  return result.sort();
}

async function listSymbolicLinks(absoluteRoot, relativeRoot) {
  const stat = await fs.lstat(absoluteRoot).catch(() => null);
  if (!stat?.isDirectory() || stat.isSymbolicLink()) return stat?.isSymbolicLink() ? [relativeRoot] : [];
  const result = [];
  async function visit(absoluteDirectory, relativeDirectory) {
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = `${relativeDirectory}/${entry.name}`;
      if (entry.isSymbolicLink()) result.push(relativePath);
      else if (entry.isDirectory()) await visit(absolutePath, relativePath);
    }
  }
  await visit(absoluteRoot, relativeRoot);
  return result.sort();
}

function normalizeRepoPath(filePath) {
  const value = String(filePath);
  if (!value || value.startsWith("/") || value.includes("\\") ||
      value.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
      path.posix.normalize(value) !== value) {
    throw new Error(`unsafe repository path: ${value}`);
  }
  return value;
}

async function readJsonFromAccess(access, filePath) {
  return JSON.parse(await access.readText(filePath));
}

function schemaErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.message || "invalid"}`).sort().join(";");
}

function edgeKey(edge) {
  return `${edge.from}->${edge.to}`;
}

function literalKey(row) {
  return `${row.path}::${row.value}`;
}

function identityAllowanceKey(row) {
  return `${row.path}::${row.signature}::${row.count}`;
}

function fileHashKey(row) {
  return `${row.path}::${row.sha256}`;
}

function genericPolicyRowKey(row) {
  if (typeof row === "string") return row;
  if (row.from) return edgeKey(row);
  if (row.signature) return identityAllowanceKey(row);
  if (row.classification && row.value === undefined) return row.path;
  return literalKey(row);
}

function policyCollection(policy, dottedPath) {
  const { container, property } = policyCollectionContainer(policy, dottedPath);
  return container[property];
}

function policyCollectionContainer(policy, dottedPath) {
  const segments = dottedPath.split(".");
  const property = segments.pop();
  let container = policy;
  for (const segment of segments) container = container[segment];
  return { container, property };
}

function compareEdges(left, right) {
  return edgeKey(left).localeCompare(edgeKey(right));
}

function uniqueBy(rows, key) {
  const seen = new Set();
  return rows.filter((row) => {
    const value = key(row);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function isSortedUnique(values) {
  return Array.isArray(values) && values.every((value, index) => index === 0 || values[index - 1] < value);
}

function sameStrings(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function setDifferenceDetail(actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const extra = actual.filter((value) => !expectedSet.has(value));
  const missing = expected.filter((value) => !actualSet.has(value));
  return `extra=[${extra.join(",")}],missing=[${missing.join(",")}]`;
}

function canonicalPolicyJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalPolicyJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalPolicyJson(value[key])}`).join(",")}}`;
}

export const platformArchitectureInternals = Object.freeze({
  buildLocalImportGraph,
  deriveSourceIdentityTerms,
  executableRouteLiterals,
  identityControlFlowFindings,
  resolveLocalImport,
  scanJavaScriptSource,
  sortArchitectureDiagnostics,
  validatePolicySchema
});
