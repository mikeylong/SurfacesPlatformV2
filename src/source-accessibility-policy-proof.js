import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import { sourceConformanceInternals } from "./source-conformance-proof.js";
import { sourceFamilyPackagingInternals } from "./source-family-packaging-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  rawFileHash,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  SAP_ARTIFACT_PATHS,
  SAP_ARTIFACT_ROOT,
  SAP_COMMAND,
  SAP_CONTRACT_ID,
  SAP_ENVIRONMENT,
  SAP_FIXTURE_ROOT,
  SAP_GENERATED_ARTIFACTS,
  SAP_P2_CATALOG_PATH,
  SAP_P2_EVIDENCE_PATH,
  SAP_SCHEMA_FILES,
  SAP_SCHEMA_ROOT,
  SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
  SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
  SAP_SOURCE_ROOT,
  SAP_TIMESTAMP,
  SAP_VERSION,
  artifactRef,
  diagnosticsRegistry,
  provenance,
  sapFixturePaths,
  sapSchemaIdForPath,
  sapSchemaPaths,
  sapSourcePaths,
  sapSourceRefs
} from "./source-accessibility-policy-contract.js";

const BOUNDARY_PATHS = [
  SAP_P2_EVIDENCE_PATH,
  SAP_P2_CATALOG_PATH,
  SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
  SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH
];
const SOURCE_PRECEDENCE_POLICY_REF = "declared-source://source-conformance/policies/source-precedence.json#/";

export async function runSourceAccessibilityPolicyInterfacectl(argv, io) {
  const parsed = parseProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSourceAccessibilityPolicyProof({
      cwd: io.cwd,
      ...parsed.args,
      command: SAP_COMMAND,
      args: parsed.commandArgs
    });
    io.stdout.write([
      `surfaces source-accessibility-policy proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `structuredDeclarationsOnly: true`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error && (error.exitCode === 1 || error.exitCode === 2)) {
      io.stderr.write(`${error.message}\n`);
      return error.exitCode;
    }
    throw error;
  }
}

function parseProofArgs(argv) {
  const values = {};
  const flags = new Map([
    ["--source", "sourceRoot"],
    ["--ingestion-evidence", "ingestionEvidencePath"],
    ["--catalog", "catalogPath"],
    ["--source-conformance-evidence", "sourceConformanceEvidencePath"],
    ["--source-conformance-catalog", "sourceConformanceCatalogPath"],
    ["--source-family-packaging-evidence", "sourceFamilyPackagingEvidencePath"],
    ["--fixture", "fixtureRoot"],
    ["--out", "outRoot"]
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const key = flags.get(argv[index]);
    if (!key || values[key] !== undefined || argv[index + 1] === undefined) return { ok: false, error: usage() };
    const parsed = p2Internals.parseRelativePosixPath(argv[index + 1], argv[index]);
    if (!parsed.ok) return parsed;
    values[key] = parsed.path;
    index += 1;
  }
  if ([...flags.values()].some((key) => !values[key])) return { ok: false, error: usage() };
  const commandArgs = {
    source: values.sourceRoot,
    ingestionEvidence: values.ingestionEvidencePath,
    catalog: values.catalogPath,
    sourceConformanceEvidence: values.sourceConformanceEvidencePath,
    sourceConformanceCatalog: values.sourceConformanceCatalogPath,
    sourceFamilyPackagingEvidence: values.sourceFamilyPackagingEvidencePath,
    fixture: values.fixtureRoot,
    out: values.outRoot
  };
  return { ok: true, args: values, commandArgs };
}

function usage() {
  return `usage: ${SAP_COMMAND} --source ${SAP_SOURCE_ROOT} --ingestion-evidence ${SAP_P2_EVIDENCE_PATH} --catalog ${SAP_P2_CATALOG_PATH} --source-conformance-evidence ${SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH} --source-conformance-catalog ${SAP_SOURCE_CONFORMANCE_CATALOG_PATH} --source-family-packaging-evidence ${SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH} --fixture ${SAP_FIXTURE_ROOT} --out ${SAP_ARTIFACT_ROOT}`;
}

export async function runSourceAccessibilityPolicyProof({
  cwd,
  sourceRoot,
  ingestionEvidencePath,
  catalogPath,
  sourceConformanceEvidencePath,
  sourceConformanceCatalogPath,
  sourceFamilyPackagingEvidencePath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({ sourceRoot, ingestionEvidencePath, catalogPath, sourceConformanceEvidencePath, sourceConformanceCatalogPath, sourceFamilyPackagingEvidencePath, fixtureRoot, outRoot });
  await assertRequiredFiles(cwd);
  const validators = await loadValidators(cwd);
  await rejectStaleOutput(cwd, outRoot);
  const upstream = await strictUpstreamPreflight(cwd, validators);
  const source = await loadStructuredSource(cwd, validators, upstream);
  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "source-accessibility-policy-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  assertExactFixtureClosure(expectations);
  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);

  const declarationSetRef = artifactRef(
    `${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`,
    "source-accessibility-behavior-declarations.v0",
    await rawFileHash(path.join(cwd, SAP_SOURCE_ROOT, "accessibility-behavior-declarations.json")),
    source.declarations.sourceRef
  );
  const coverage = buildCoverage(source.declarations, upstream.p2Catalog, declarationSetRef, upstream.boundaryRefs[1]);
  if (coverage.promotionStatus === "blocked") throw contractError("structured accessibility source contains a blocked baseline declaration", 1);
  assertSchema(validators, "source-accessibility-policy-coverage.v0", coverage, `${outRoot}/accessibility-policy-coverage.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "accessibility-policy-coverage.json"), coverage);
  const coverageRef = await generatedRef(cwd, outRoot, "accessibility-policy-coverage.json", "source-accessibility-policy-coverage.v0");

  const authorityMap = buildAuthorityMap(source.declarations, coverage, declarationSetRef, coverageRef, upstream.boundaryRefs[1]);
  assertSchema(validators, "source-accessibility-policy-authority-map.v0", authorityMap, `${outRoot}/accessibility-policy-authority-map.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "accessibility-policy-authority-map.json"), authorityMap);
  const authorityMapRef = await generatedRef(cwd, outRoot, "accessibility-policy-authority-map.json", "source-accessibility-policy-authority-map.v0");

  const validationResults = fixtureRows.map((row) => evaluateFixture(row, source, upstream.p2Catalog));
  const mismatches = validationResults.filter((row) => !row.matched);
  if (mismatches.length > 0) throw contractError(`source accessibility policy validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`, 1);
  const diagnostics = sortDiagnostics(uniqueDiagnostics(validationResults.flatMap((row) => row.diagnostics)));
  const reviewQueue = buildReviewQueue(source.declarations, coverage, validationResults);
  assertSchema(validators, "source-accessibility-policy-review-queue.v0", reviewQueue, `${outRoot}/accessibility-policy-review-queue.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "accessibility-policy-review-queue.json"), reviewQueue);
  const reviewQueueRef = await generatedRef(cwd, outRoot, "accessibility-policy-review-queue.json", "source-accessibility-policy-review-queue.v0");

  const summary = coverage.summary;
  const status = "pass";
  const promotionStatus = coverage.promotionStatus;
  const behaviorStatuses = coverage.behaviors.map(({ behaviorId, status: behaviorStatus }) => ({ behaviorId, status: behaviorStatus }));
  if (
    status !== expectations.runExpectation.status ||
    promotionStatus !== expectations.runExpectation.promotionStatus ||
    canonicalJson(summary) !== canonicalJson(expectations.runExpectation.summary) ||
    canonicalJson(behaviorStatuses) !== canonicalJson(expectations.runExpectation.behaviorStatuses)
  ) {
    throw contractError(`source accessibility policy run expectation mismatch: expected ${expectations.runExpectation.status}/${expectations.runExpectation.promotionStatus} got ${status}/${promotionStatus}`, 1);
  }
  const runId = `source-accessibility-policy-${sha256Hex(canonicalJson({ manifest: source.manifest, declarations: source.declarations, expectations, boundaryRefs: upstream.boundaryRefs, command, args })).slice(0, 32)}`;
  const report = buildReport({ runId, command, args, upstream, coverageRef, authorityMapRef, reviewQueueRef, validationResults, diagnostics, summary, status, promotionStatus });
  assertSchema(validators, "source-accessibility-policy-report.v0", report, `${outRoot}/accessibility-policy-conformance-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "accessibility-policy-conformance-report.json"), report);
  const reportRef = await generatedRef(cwd, outRoot, "accessibility-policy-conformance-report.json", "source-accessibility-policy-report.v0");

  const evidence = await buildEvidence({ cwd, runId, command, args, upstream, coverageRef, authorityMapRef, reviewQueueRef, reportRef, validationResults, diagnostics, summary, status, promotionStatus });
  assertSchema(validators, "source-accessibility-policy-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persisted = await readJson(path.join(cwd, outRoot, "evidence.json"));
  if (await firstEvidenceIntegrityFailureCode(cwd, persisted) !== null) throw contractError("source accessibility policy evidence integrity verification failed", 1);

  return { status, promotionStatus, matchedCount: validationResults.length, totalCount: validationResults.length, artifacts: SAP_ARTIFACT_PATHS };
}

function assertCommandRoots(actual) {
  const expected = {
    sourceRoot: SAP_SOURCE_ROOT,
    ingestionEvidencePath: SAP_P2_EVIDENCE_PATH,
    catalogPath: SAP_P2_CATALOG_PATH,
    sourceConformanceEvidencePath: SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
    sourceConformanceCatalogPath: SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
    sourceFamilyPackagingEvidencePath: SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
    fixtureRoot: SAP_FIXTURE_ROOT,
    outRoot: SAP_ARTIFACT_ROOT
  };
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError(usage(), 2);
}

async function strictUpstreamPreflight(cwd) {
  for (const upstreamPath of BOUNDARY_PATHS) await assertRegularFile(path.join(cwd, upstreamPath), upstreamPath);
  const p2Evidence = await readJson(path.join(cwd, SAP_P2_EVIDENCE_PATH));
  const p2Catalog = await readJson(path.join(cwd, SAP_P2_CATALOG_PATH));
  const sourceConformanceEvidence = await readJson(path.join(cwd, SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH));
  const sourceConformanceCatalog = await readJson(path.join(cwd, SAP_SOURCE_CONFORMANCE_CATALOG_PATH));
  const sourceFamilyPackagingEvidence = await readJson(path.join(cwd, SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH));
  if (p2Evidence.status !== "pass" || sourceConformanceEvidence.status !== "pass" || sourceFamilyPackagingEvidence.status !== "pass") {
    throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING");
  }
  if (sourceConformanceEvidence.promotionStatus !== "review_required" || sourceFamilyPackagingEvidence.promotionStatus !== "review_required") {
    throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING");
  }
  if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  if (await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(cwd, sourceConformanceEvidence) !== null) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  if (await sourceFamilyPackagingInternals.firstEvidenceIntegrityFailureCode(cwd, sourceFamilyPackagingEvidence) !== null) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  const p2Hash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const p2SelfRef = (p2Evidence.artifactRefs || []).find((ref) => ref.path === SAP_P2_EVIDENCE_PATH);
  const p2CatalogRef = (p2Evidence.artifactRefs || []).find((ref) => ref.path === SAP_P2_CATALOG_PATH);
  if (!p2SelfRef || p2SelfRef.hash !== p2Hash || !p2CatalogRef || p2CatalogRef.hash !== await canonicalFileHash(path.join(cwd, SAP_P2_CATALOG_PATH))) {
    throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  }
  const scCatalogRef = (sourceConformanceEvidence.artifacts || []).find((ref) => ref.path === SAP_SOURCE_CONFORMANCE_CATALOG_PATH);
  if (!scCatalogRef || scCatalogRef.hash !== await canonicalFileHash(path.join(cwd, SAP_SOURCE_CONFORMANCE_CATALOG_PATH))) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  if (sourceFamilyPackagingEvidence.candidateEvidenceClosureVerified !== true) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  const boundaryRefs = [
    withProvenance(artifactRef(SAP_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2Hash), "interfacectl-source-accessibility-policy-boundary"),
    withProvenance(artifactRef(SAP_P2_CATALOG_PATH, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, SAP_P2_CATALOG_PATH)), null, { sourceEvidenceHash: p2Hash }), "interfacectl-source-accessibility-policy-boundary"),
    withProvenance(artifactRef(SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH, "source-conformance-evidence.v0", sourceConformanceInternals.computeEvidenceSelfHash(sourceConformanceEvidence)), "interfacectl-source-accessibility-policy-boundary"),
    withProvenance(artifactRef(SAP_SOURCE_CONFORMANCE_CATALOG_PATH, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, SAP_SOURCE_CONFORMANCE_CATALOG_PATH))), "interfacectl-source-accessibility-policy-boundary"),
    withProvenance(artifactRef(SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH, "source-family-packaging-evidence.v0", sourceFamilyPackagingInternals.computeEvidenceSelfHash(sourceFamilyPackagingEvidence)), "interfacectl-source-accessibility-policy-boundary")
  ];
  return { p2Evidence, p2Catalog, sourceConformanceEvidence, sourceConformanceCatalog, sourceFamilyPackagingEvidence, boundaryRefs };
}

async function loadStructuredSource(cwd, validators, upstream) {
  const manifest = await readJson(path.join(cwd, SAP_SOURCE_ROOT, "manifest.json"));
  const declarations = await readJson(path.join(cwd, SAP_SOURCE_ROOT, "accessibility-behavior-declarations.json"));
  assertSchema(validators, "source-accessibility-policy-manifest.v0", manifest, `${SAP_SOURCE_ROOT}/manifest.json`);
  assertSchema(validators, "source-accessibility-behavior-declarations.v0", declarations, `${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`);
  if (declarations.authorityMode !== "structured-assertions-only") throw diagnosticError("SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN");
  const actualHash = await rawFileHash(path.join(cwd, SAP_SOURCE_ROOT, manifest.sourceFiles[0].path));
  if (manifest.sourceFiles[0].sha256 !== actualHash) throw diagnosticError("SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH");
  const actualFiles = await listRegularFiles(cwd, SAP_SOURCE_ROOT);
  if (canonicalJson(actualFiles) !== canonicalJson(sapSourcePaths().sort())) throw diagnosticError("SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH");
  const ids = declarations.declarations.map((entry) => entry.behaviorId);
  if (new Set(ids).size !== ids.length) throw contractError("duplicate structured accessibility behavior id", 1);
  const accessibilityPolicy = await readJson(path.join(cwd, "sources/source-conformance/declared-source-bundle/policies/accessibility.json"));
  const authorityProfile = await readJson(path.join(cwd, "sources/source-conformance/declared-source-bundle/governance/authority-profile.json"));
  const upstreamPolicyRef = (upstream.sourceConformanceEvidence.sourceFileRefs || []).find((ref) => ref.path === "sources/source-conformance/declared-source-bundle/policies/accessibility.json");
  if (!upstreamPolicyRef || upstreamPolicyRef.hash !== await rawFileHash(path.join(cwd, upstreamPolicyRef.path))) throw diagnosticError("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH");
  for (const [declarationIndex, declaration] of declarations.declarations.entries()) {
    assertStructuredDeclaration(declaration, upstream.p2Catalog, declarationIndex);
    const match = declaration.policyRef.match(/^declared-source:\/\/source-conformance\/policies\/accessibility\.json#\/requirements\/([0-9]+)$/);
    const requirementValue = match ? accessibilityPolicy.requirements?.[Number(match[1])] : undefined;
    if (requirementValue === undefined || sha256Hex(canonicalJson(requirementValue)) !== declaration.policyRequirementValueHash) throw diagnosticError("SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING");
  }
  for (const route of declarations.reviewRoutes) {
    const upstreamRoute = authorityProfile.reviewRoutes?.find((entry) => entry.routeId === route.routeId);
    if (!upstreamRoute || upstreamRoute.owner !== route.owner || upstreamRoute.rationale !== route.rationale || upstreamRoute.policyRef !== route.policyRef || upstreamRoute.expiresAt !== route.expiresAt || upstreamRoute.executable !== false) throw diagnosticError("SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING");
  }
  return { manifest, declarations, authorityProfile };
}

function assertStructuredDeclaration(declaration, catalog, declarationIndex) {
  if (typeof declaration !== "object" || declaration === null) throw diagnosticError("SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN");
  if (Object.hasOwn(declaration, "text") || Object.hasOwn(declaration, "description") || Object.hasOwn(declaration, "policyText")) throw diagnosticError("SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN");
  for (const [assertionIndex, assertion] of (declaration.assertions || []).entries()) {
    if (!pointerInScope(assertion.catalogPointer, declaration.componentId)) throw diagnosticError("SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION");
    const exactSelfRef = `source-accessibility-policy://accessibility-behavior-declarations.json#/declarations/${declarationIndex}/assertions/${assertionIndex}`;
    if (!assertionSourceRefsValid(declaration, assertion, catalog, exactSelfRef)) throw diagnosticError("SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING");
  }
}

function assertionSourceRefsValid(declaration, assertion, catalog, exactSelfRef = null) {
  if (!Array.isArray(assertion.sourceRefs) || assertion.sourceRefs.length < 3 || !assertion.sourceRefs.includes(declaration.policyRef)) return false;
  const declarationRefPattern = /^source-accessibility-policy:\/\/accessibility-behavior-declarations\.json#\/declarations\/[0-9]+\/assertions\/[0-9]+$/;
  if (exactSelfRef ? !assertion.sourceRefs.includes(exactSelfRef) : !assertion.sourceRefs.some((ref) => declarationRefPattern.test(ref))) return false;
  const factSourceRefs = checkedFactSourceRefs(declaration, catalog);
  if (!assertion.sourceRefs.some((ref) => factSourceRefs.includes(ref))) return false;
  return assertion.sourceRefs.every((ref) => ref === declaration.policyRef || declarationRefPattern.test(ref) || factSourceRefs.includes(ref));
}

function checkedFactSourceRefs(declaration, catalog) {
  const component = catalog.components?.[declaration.componentId];
  if (!component) return [];
  const refs = [component.accessibility?.sourceRef];
  if (typeof component.sourceRef === "string") refs.push(component.sourceRef.replace(/#\/$/, "#/tokenBindings"));
  return refs.filter((ref) => typeof ref === "string");
}

function precedenceConflictAuthorized(conflict, authorityProfile) {
  const componentMatch = conflict.catalogPointer.match(/^\/components\/([^/]+)\//);
  const binding = authorityProfile.componentBindings?.find((entry) => entry.componentId === componentMatch?.[1]);
  return (
    conflict.resolutionMode === "primary-precedence" &&
    conflict.policyRef === SOURCE_PRECEDENCE_POLICY_REF &&
    canonicalJson(conflict.selectedValue) === canonicalJson(conflict.primaryValue) &&
    binding?.authoritativePointers?.includes(conflict.catalogPointer) &&
    binding?.precedence?.mode === "primary-wins" &&
    binding?.precedence?.policyRef === conflict.policyRef
  );
}

function buildCoverage(declarations, catalog, declarationSetRef, catalogRef) {
  const behaviors = declarations.declarations.map((declaration) => evaluateDeclaration(declaration, catalog));
  const summary = summaryForBehaviors(behaviors);
  return {
    schemaId: "source-accessibility-policy-coverage.v0",
    version: SAP_VERSION,
    declarationSetRef,
    catalogRef,
    behaviors,
    summary,
    promotionStatus: strictestStatus(behaviors.map((entry) => entry.status)),
    provenance: provenance("interfacectl-source-accessibility-policy-coverage", [declarations.sourceRef, SAP_P2_CATALOG_PATH])
  };
}

function evaluateDeclaration(declaration, catalog) {
  const assertions = declaration.assertions.map((assertion) => {
    const actual = readPointer(catalog, assertion.catalogPointer);
    const exists = actual !== undefined;
    const matched = evaluateAssertion(assertion, actual, exists);
    return {
      assertionId: assertion.assertionId,
      catalogPointer: assertion.catalogPointer,
      operator: assertion.operator,
      expectedValueHash: sha256Hex(canonicalJson(assertion.expectedValue)),
      actualValueHash: exists ? sha256Hex(canonicalJson(actual)) : null,
      matched,
      sourceRefs: assertion.sourceRefs
    };
  });
  const missing = assertions.some((entry) => entry.actualValueHash === null);
  const conflict = assertions.some((entry) => entry.actualValueHash !== null && !entry.matched);
  const status = conflict ? declaration.resolution.onConflict : missing ? declaration.resolution.onMissing : "allowed";
  return { behaviorId: declaration.behaviorId, behaviorKind: declaration.behaviorKind, componentId: declaration.componentId, policyRef: declaration.policyRef, policyRequirementValueHash: declaration.policyRequirementValueHash, assertions, status, reviewRouteId: status === "review_required" ? declaration.resolution.reviewRouteId : null };
}

function evaluateAssertion(assertion, actual, exists) {
  if (assertion.operator === "exists") return exists === Boolean(assertion.expectedValue);
  if (!exists) return false;
  if (assertion.operator === "equals") return canonicalJson(actual) === canonicalJson(assertion.expectedValue);
  return false;
}

function buildAuthorityMap(declarations, coverage, declarationSetRef, coverageRef, catalogRef) {
  return {
    schemaId: "source-accessibility-policy-authority-map.v0",
    version: SAP_VERSION,
    declarationSetRef,
    coverageRef,
    catalogRef,
    bindings: coverage.behaviors.map((behavior) => {
      const declaration = declarations.declarations.find((entry) => entry.behaviorId === behavior.behaviorId);
      return { behaviorId: behavior.behaviorId, componentId: behavior.componentId, catalogPointers: declaration.assertions.map((entry) => entry.catalogPointer), policyRef: behavior.policyRef, sourceRefs: [...new Set(declaration.assertions.flatMap((entry) => entry.sourceRefs))].sort(), status: behavior.status };
    }),
    catalogCapabilityAdded: false,
    provenance: provenance("interfacectl-source-accessibility-policy-authority-map", [declarations.sourceRef, coverageRef.path, catalogRef.path])
  };
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const value = await readJson(path.join(cwd, expectation.fixturePath));
    const schemaId = expectation.fixturePath.includes("source-accessibility-policy-preflight") ? "source-accessibility-policy-preflight-mutation.v0" : "source-accessibility-policy-fixture.v0";
    assertSchema(validators, schemaId, value, expectation.fixturePath);
    rows.push({ ...expectation, value });
  }
  return rows;
}

function evaluateFixture(row, source, catalog) {
  const declarations = source.declarations;
  const value = row.value;
  let diagnosticCodes = [];
  let actualResult = "valid";
  let promotionStatus = "allowed";
  let behaviorId = value.behaviorId || null;
  if (value.schemaId === "source-accessibility-policy-preflight-mutation.v0") {
    diagnosticCodes = [value.mutation === "missing" ? "SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING" : "SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH"];
  } else if (value.fixtureId === "source-hash-mismatch") {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH"];
  } else if (value.fixtureId === "evidence-hash-mismatch") {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"];
  } else if (value.freeFormPolicyText !== null) {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN"];
  } else if (value.catalogMutation !== null) {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION"];
  } else if (value.reviewRouteMutation?.owner === null) {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING"];
  } else if (value.authorityConflict?.resolutionMode === "unresolved") {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED"];
  } else if (value.authorityConflict !== null) {
    const conflict = value.authorityConflict;
    if (!precedenceConflictAuthorized(conflict, source.authorityProfile)) diagnosticCodes = ["SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED"];
  } else if (value.ambiguity !== null) {
    diagnosticCodes = ["SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS"];
  } else {
    const declaration = value.declarationOverride || declarations.declarations.find((entry) => entry.behaviorId === value.behaviorId);
    if (!declaration) diagnosticCodes = ["SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED"];
    else if (declaration.assertions.some((entry) => !assertionSourceRefsValid(declaration, entry, catalog))) diagnosticCodes = ["SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING"];
    else if (declaration.assertions.some((entry) => !pointerInScope(entry.catalogPointer, declaration.componentId))) diagnosticCodes = ["SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION"];
    else {
      const evaluated = evaluateDeclaration(declaration, catalog);
      if (evaluated.status === "review_required") diagnosticCodes = ["SOURCE_ACCESSIBILITY_REVIEW_REQUIRED"];
      else if (evaluated.status === "blocked") {
        const missing = evaluated.assertions.some((entry) => entry.actualValueHash === null);
        diagnosticCodes = [missing ? "SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED" : "SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT"];
      }
    }
  }
  if (diagnosticCodes.length > 0) {
    const rows = diagnosticCodes.map(diagnosticForCode);
    promotionStatus = strictestStatus(rows.map((entry) => entry.promotionStatus));
    actualResult = promotionStatus === "review_required" ? "review_required" : "invalid";
  }
  const matched = actualResult === row.expectedResult && promotionStatus === row.promotionStatus && canonicalJson(diagnosticCodes.sort()) === canonicalJson([...row.diagnosticCodes].sort());
  return { fixturePath: row.fixturePath, kind: row.kind, expectedResult: row.expectedResult, actualResult, promotionStatus, diagnosticCodes: diagnosticCodes.sort(), artifactPath: row.artifactPath, jsonPointer: row.jsonPointer, behaviorId, matched, diagnostics: diagnosticCodes.map(diagnosticForCode) };
}

function buildReviewQueue(declarations, coverage, validationResults) {
  const routeById = new Map(declarations.reviewRoutes.map((route) => [route.routeId, route]));
  const items = coverage.behaviors.filter((behavior) => behavior.status === "review_required").map((behavior) => {
    const route = routeById.get(behavior.reviewRouteId);
    const declaration = declarations.declarations.find((entry) => entry.behaviorId === behavior.behaviorId);
    if (!route?.owner) throw diagnosticError("SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING");
    return reviewItem(behavior.behaviorId, behavior.componentId, "SOURCE_ACCESSIBILITY_REVIEW_REQUIRED", route, declaration.assertions.flatMap((entry) => entry.sourceRefs));
  });
  for (const row of validationResults.filter((entry) => entry.diagnosticCodes.includes("SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS"))) {
    const route = routeById.get("design-systems-governance");
    items.push(reviewItem(`fixture-${path.posix.basename(row.fixturePath, ".json")}`, "Button", "SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS", route, [declarations.sourceRef, declarations.policyRef]));
  }
  items.sort((left, right) => left.itemId.localeCompare(right.itemId));
  return { schemaId: "source-accessibility-policy-review-queue.v0", version: SAP_VERSION, items, summary: { itemCount: items.length, executableCount: 0 }, provenance: provenance("interfacectl-source-accessibility-policy-review-queue", [declarations.sourceRef]) };
}

function reviewItem(behaviorId, componentId, diagnosticCode, route, requiredSourceRefs) {
  return { itemId: `accessibility-review-${behaviorId}`, behaviorId, componentId, diagnosticCode, owner: route.owner, rationale: route.rationale, expiresAt: route.expiresAt, policyRef: route.policyRef, requiredSourceRefs: [...new Set([...requiredSourceRefs, route.policyRef])].sort(), executable: false, status: "review_required" };
}

function buildReport({ runId, command, args, upstream, coverageRef, authorityMapRef, reviewQueueRef, validationResults, diagnostics, summary, status, promotionStatus }) {
  return {
    contractId: SAP_CONTRACT_ID,
    schemaId: "source-accessibility-policy-report.v0",
    version: SAP_VERSION,
    runId,
    checkedAt: SAP_TIMESTAMP,
    command,
    args,
    environment: { ...SAP_ENVIRONMENT },
    boundaryRefs: upstream.boundaryRefs,
    coverageRef,
    authorityMapRef,
    reviewQueueRef,
    validationResults: validationResults.map(publicResult),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    summary,
    structuredDeclarationsOnly: true,
    catalogCapabilityAdded: false,
    status,
    promotionStatus,
    provenance: provenance("interfacectl-source-accessibility-policy-report", [coverageRef.path, authorityMapRef.path, reviewQueueRef.path])
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, coverageRef, authorityMapRef, reviewQueueRef, reportRef, validationResults, diagnostics, summary, status, promotionStatus }) {
  const schemaClosure = [];
  for (const schemaPath of sapSchemaPaths()) schemaClosure.push(artifactRef(schemaPath, sapSchemaIdForPath(schemaPath), await canonicalFileHash(path.join(cwd, schemaPath))));
  const sourceFileRefs = await sapSourceRefs(cwd);
  const fixtureRefs = [];
  for (const fixturePath of sapFixturePaths()) fixtureRefs.push(artifactRef(fixturePath, sapSchemaIdForPath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  const artifacts = [];
  for (const artifactPath of SAP_ARTIFACT_PATHS) {
    const hash = artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath));
    artifacts.push(withProvenance(artifactRef(artifactPath, sapSchemaIdForPath(artifactPath), hash), "interfacectl-source-accessibility-policy-evidence"));
  }
  const evidence = {
    contractId: SAP_CONTRACT_ID,
    schemaId: "source-accessibility-policy-evidence.v0",
    version: SAP_VERSION,
    runId,
    checkedAt: SAP_TIMESTAMP,
    command,
    args,
    environment: { ...SAP_ENVIRONMENT },
    schemaClosure,
    sourceFileRefs,
    fixtureRefs,
    boundaryRefs: upstream.boundaryRefs,
    artifacts,
    coverageRef,
    authorityMapRef,
    reviewQueueRef,
    validationResults: validationResults.map(publicResult),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    summary,
    structuredDeclarationsOnly: true,
    catalogCapabilityAdded: false,
    status,
    promotionStatus,
    provenance: provenance("interfacectl-source-accessibility-policy-evidence", [reportRef.path, `${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifacts?.[clone.artifacts.length - 1];
  if (finalRef?.path === `${SAP_ARTIFACT_ROOT}/evidence.json`) finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  const failureCode = "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH";
  try {
    const validators = await loadValidators(cwd);
    if (!validators.validate("source-accessibility-policy-evidence.v0", evidence).valid) return failureCode;
    const upstream = await strictUpstreamPreflight(cwd);
    await loadStructuredSource(cwd, validators, upstream);
    const expectations = await readJson(path.join(cwd, SAP_FIXTURE_ROOT, "expectations.manifest.json"));
    assertSchema(validators, "source-accessibility-policy-expectations.v0", expectations, `${SAP_FIXTURE_ROOT}/expectations.manifest.json`);
    assertExactFixtureClosure(expectations);
    await loadFixtureRows(cwd, expectations, validators);

    if (evidence.contractId !== SAP_CONTRACT_ID || evidence.status !== "pass" || evidence.promotionStatus !== expectations.runExpectation.promotionStatus || evidence.structuredDeclarationsOnly !== true || evidence.catalogCapabilityAdded !== false) return failureCode;
    if (canonicalJson(evidence.args) !== canonicalJson(expectedCommandArgs()) || canonicalJson(evidence.environment) !== canonicalJson(SAP_ENVIRONMENT)) return failureCode;
    if (canonicalJson((evidence.schemaClosure || []).map((ref) => ref.path)) !== canonicalJson(sapSchemaPaths())) return failureCode;
    if (canonicalJson((evidence.sourceFileRefs || []).map((ref) => ref.path)) !== canonicalJson(sapSourcePaths())) return failureCode;
    if (canonicalJson((evidence.fixtureRefs || []).map((ref) => ref.path)) !== canonicalJson(sapFixturePaths())) return failureCode;
    if (canonicalJson(evidence.boundaryRefs) !== canonicalJson(upstream.boundaryRefs)) return failureCode;
    if (canonicalJson((evidence.artifacts || []).map((ref) => ref.path)) !== canonicalJson(SAP_ARTIFACT_PATHS)) return failureCode;

    for (const ref of evidence.schemaClosure || []) {
      if (ref.schemaId !== sapSchemaIdForPath(ref.path) || ref.hashAlgorithm !== "sha256" || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return failureCode;
    }
    for (const ref of evidence.sourceFileRefs || []) {
      if (ref.schemaId !== sapSchemaIdForPath(ref.path) || ref.hashAlgorithm !== "sha256" || ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return failureCode;
    }
    for (const ref of evidence.fixtureRefs || []) {
      if (ref.schemaId !== sapSchemaIdForPath(ref.path) || ref.hashAlgorithm !== "sha256" || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return failureCode;
    }
    for (const ref of evidence.artifacts || []) {
      if (ref.schemaId !== sapSchemaIdForPath(ref.path) || ref.hashAlgorithm !== "sha256") return failureCode;
      if (ref.path !== `${SAP_ARTIFACT_ROOT}/evidence.json` && ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return failureCode;
    }
    const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
    if (!finalRef || finalRef.path !== `${SAP_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) return failureCode;

    const coverage = await readJson(path.join(cwd, `${SAP_ARTIFACT_ROOT}/accessibility-policy-coverage.json`));
    const authorityMap = await readJson(path.join(cwd, `${SAP_ARTIFACT_ROOT}/accessibility-policy-authority-map.json`));
    const reviewQueue = await readJson(path.join(cwd, `${SAP_ARTIFACT_ROOT}/accessibility-policy-review-queue.json`));
    const report = await readJson(path.join(cwd, `${SAP_ARTIFACT_ROOT}/accessibility-policy-conformance-report.json`));
    if (!validators.validate("source-accessibility-policy-coverage.v0", coverage).valid) return failureCode;
    if (!validators.validate("source-accessibility-policy-authority-map.v0", authorityMap).valid) return failureCode;
    if (!validators.validate("source-accessibility-policy-review-queue.v0", reviewQueue).valid) return failureCode;
    if (!validators.validate("source-accessibility-policy-report.v0", report).valid) return failureCode;

    for (const [refName, artifactPath] of [
      ["coverageRef", `${SAP_ARTIFACT_ROOT}/accessibility-policy-coverage.json`],
      ["authorityMapRef", `${SAP_ARTIFACT_ROOT}/accessibility-policy-authority-map.json`],
      ["reviewQueueRef", `${SAP_ARTIFACT_ROOT}/accessibility-policy-review-queue.json`]
    ]) {
      const artifact = evidence.artifacts.find((entry) => entry.path === artifactPath);
      if (!artifact || canonicalJson(artifactRefCore(evidence[refName])) !== canonicalJson(artifactRefCore(artifact))) return failureCode;
    }

    const behaviorStatuses = coverage.behaviors.map(({ behaviorId, status }) => ({ behaviorId, status }));
    if (canonicalJson(coverage.summary) !== canonicalJson(expectations.runExpectation.summary) || canonicalJson(behaviorStatuses) !== canonicalJson(expectations.runExpectation.behaviorStatuses)) return failureCode;
    if (canonicalJson(evidence.summary) !== canonicalJson(coverage.summary) || evidence.promotionStatus !== coverage.promotionStatus) return failureCode;
    const sharedReportFields = ["contractId", "version", "runId", "checkedAt", "command", "args", "environment", "boundaryRefs", "coverageRef", "authorityMapRef", "reviewQueueRef", "validationResults", "diagnostics", "diagnosticsRegistry", "summary", "structuredDeclarationsOnly", "catalogCapabilityAdded", "status", "promotionStatus"];
    for (const field of sharedReportFields) if (canonicalJson(report[field]) !== canonicalJson(evidence[field])) return failureCode;
    return null;
  } catch {
    return failureCode;
  }
}

function expectedCommandArgs() {
  return {
    source: SAP_SOURCE_ROOT,
    ingestionEvidence: SAP_P2_EVIDENCE_PATH,
    catalog: SAP_P2_CATALOG_PATH,
    sourceConformanceEvidence: SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH,
    sourceConformanceCatalog: SAP_SOURCE_CONFORMANCE_CATALOG_PATH,
    sourceFamilyPackagingEvidence: SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
    fixture: SAP_FIXTURE_ROOT,
    out: SAP_ARTIFACT_ROOT
  };
}

function artifactRefCore(ref) {
  if (!ref) return null;
  return { path: ref.path, schemaId: ref.schemaId, hashAlgorithm: ref.hashAlgorithm, hash: ref.hash, sourceRef: ref.sourceRef ?? null };
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  for (const file of SAP_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SAP_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
    validators.set(file.replace(/\.schema\.json$/, ""), schema.$id);
  }
  return {
    validate(schemaId, value) {
      const validate = ajv.getSchema(validators.get(schemaId));
      if (!validate) throw contractError(`missing validator: ${schemaId}`, 1);
      return { valid: validate(value), errors: validate.errors || [] };
    }
  };
}

function assertSchema(validators, schemaId, value, label) {
  const result = validators.validate(schemaId, value);
  if (!result.valid) throw contractError(`${label} failed ${schemaId}: ${(result.errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ")}`, 1);
}

async function assertRequiredFiles(cwd) {
  for (const relativePath of [...sapSchemaPaths(), ...sapSourcePaths(), ...sapFixturePaths()]) await assertRegularFile(path.join(cwd, relativePath), relativePath);
  const schemaEntries = (await fs.readdir(path.join(cwd, SAP_SCHEMA_ROOT), { withFileTypes: true })).filter((entry) => SAP_SCHEMA_FILES.includes(entry.name));
  if (schemaEntries.some((entry) => !entry.isFile() || entry.isSymbolicLink()) || schemaEntries.length !== SAP_SCHEMA_FILES.length) throw contractError("source accessibility policy schema closure is incomplete", 1);
  const actualFixtures = await listRegularFiles(cwd, SAP_FIXTURE_ROOT);
  if (canonicalJson(actualFixtures) !== canonicalJson(sapFixturePaths().sort())) throw contractError("source accessibility policy fixture closure drift", 1);
}

async function rejectStaleOutput(cwd, outRoot) {
  await ensureSafeOutputDirectory(cwd, outRoot);
  const entries = await fs.readdir(path.join(cwd, outRoot), { withFileTypes: true });
  const allowed = new Set(SAP_GENERATED_ARTIFACTS);
  const stale = entries.filter((entry) => !entry.isFile() || entry.isSymbolicLink() || !allowed.has(entry.name));
  if (stale.length > 0) throw contractError(`stale unexpected source accessibility policy output: ${stale.map((entry) => entry.name).sort().join(", ")}`, 1);
}

async function ensureSafeOutputDirectory(cwd, outRoot) {
  const segments = outRoot.split("/");
  let current = cwd;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    try {
      const stat = await fs.lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError(`unsafe source accessibility policy output path: ${outRoot}`, 2);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      if (index !== segments.length - 1) throw contractError(`missing source accessibility policy output parent: ${outRoot}`, 2);
      await fs.mkdir(current);
    }
  }
}

function assertExactFixtureClosure(expectations) {
  const expected = sapFixturePaths();
  if (canonicalJson(expectations.inputs) !== canonicalJson(expected)) throw contractError("source accessibility policy expectations input closure drift", 1);
  if (canonicalJson(expectations.expectations.map((entry) => entry.fixturePath)) !== canonicalJson(expected.filter((entry) => !entry.endsWith("expectations.manifest.json")))) throw contractError("source accessibility policy expectation row closure drift", 1);
}

async function assertRegularFile(filePath, label) {
  let stat;
  try { stat = await fs.lstat(filePath); } catch { throw contractError(`missing source accessibility policy input: ${label}`, 1); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw contractError(`source accessibility policy input is not a regular file: ${label}`, 1);
}

async function listRegularFiles(cwd, relativeRoot) {
  const files = [];
  async function walk(root) {
    const entries = await fs.readdir(path.join(cwd, root), { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = `${root}/${entry.name}`;
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (stat.isSymbolicLink()) throw contractError(`unsupported symlink in source accessibility policy closure: ${relativePath}`, 1);
      if (stat.isDirectory()) await walk(relativePath);
      else if (stat.isFile()) files.push(relativePath);
      else throw contractError(`unsupported source accessibility policy entry: ${relativePath}`, 1);
    }
  }
  await walk(relativeRoot);
  return files.sort();
}

function pointerInScope(pointer, componentId) {
  return typeof pointer === "string" && (pointer.startsWith(`/components/${componentId}/accessibility/`) || pointer.startsWith(`/components/${componentId}/tokenRefs/`));
}
function readPointer(value, pointer) {
  if (pointer === "") return value;
  let current = value;
  for (const segment of pointer.slice(1).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))) {
    if (current === null || current === undefined || !Object.hasOwn(Object(current), segment)) return undefined;
    current = current[segment];
  }
  return current;
}
function summaryForBehaviors(behaviors) { return { behaviorCount: behaviors.length, allowedCount: behaviors.filter((entry) => entry.status === "allowed").length, reviewRequiredCount: behaviors.filter((entry) => entry.status === "review_required").length, blockedCount: behaviors.filter((entry) => entry.status === "blocked").length }; }
function strictestStatus(statuses) { const rank = { allowed: 0, review_required: 1, blocked: 2 }; return statuses.reduce((current, candidate) => rank[candidate] > rank[current] ? candidate : current, "allowed"); }
function diagnosticForCode(code) { const row = diagnosticsRegistry().find((entry) => entry.code === code); if (!row) throw contractError(`missing source accessibility policy diagnostic: ${code}`, 1); return row; }
function diagnosticError(code) { const row = diagnosticForCode(code); return contractError(`${code}: ${row.canonicalMessage}`, 1); }
function uniqueDiagnostics(rows) { const byCode = new Map(); for (const row of rows) byCode.set(row.code, row); return [...byCode.values()]; }
function sortDiagnostics(rows) { return [...rows].sort((left, right) => `${left.stage}:${left.code}`.localeCompare(`${right.stage}:${right.code}`)); }
function publicResult(row) { const { diagnostics: _diagnostics, ...result } = row; return result; }
function withProvenance(ref, generator) { return { ...ref, provenance: provenance(generator, [ref.path]) }; }
async function generatedRef(cwd, outRoot, file, schemaId) { return artifactRef(`${outRoot}/${file}`, schemaId, await canonicalFileHash(path.join(cwd, outRoot, file))); }
function contractError(message, exitCode) { const error = new Error(message); error.exitCode = exitCode; return error; }

export const sourceAccessibilityPolicyInternals = {
  assertionSourceRefsValid,
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  evaluateDeclaration,
  parseProofArgs
};
