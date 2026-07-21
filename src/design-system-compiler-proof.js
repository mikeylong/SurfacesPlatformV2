import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import {
  DESIGN_SYSTEM_KERNEL,
  NORMALIZED_TIMESTAMP,
  compileDesignSystemAdapter,
  diagnosticFromKernelError,
  sha256Hex,
  verifyMappings
} from "./design-system-ingestion-kernel.js";
import {
  CATALOG_CONSUMER,
  assertCatalogBoundary,
  buildPortableProjection,
  buildPortableRenderPlan,
  diagnosticFromConsumerError,
  evaluateConsumerFixture
} from "./catalog-consumer-kernel.js";

const VERSION = "0.0.0";
const CONTRACT_ID = "surfaces-design-system-compiler-proof";
const MANIFEST_PATH = "fixtures/design-system-compiler/targets.manifest.json";
const ARTIFACT_ROOT = "artifacts/design-system-compiler";
const COMMAND = "interfacectl surfaces design-system-compiler proof";
const ZERO_HASH = "0".repeat(64);
const ADAPTER_ARTIFACT_FILES = Object.freeze([
  "boundary-receipt.json",
  "catalog.json",
  "consumer-report.json",
  "extract.json",
  "governed-catalog.json",
  "render-plan.json",
  "runtime-projection.json"
]);

const SCHEMA_FILES = Object.freeze([
  "diagnostics.v0.schema.json",
  "extract.v0.schema.json",
  "runtime-catalog.v0.schema.json",
  "portable-design-source-lock.v0.schema.json",
  "design-system-adapter.v0.schema.json",
  "design-system-compiler-manifest.v0.schema.json",
  "design-system-compiler-mutation.v0.schema.json",
  "catalog-consumer-fixture.v0.schema.json",
  "catalog-boundary-receipt.v0.schema.json",
  "catalog-runtime-projection.v0.schema.json",
  "catalog-render-plan.v0.schema.json",
  "catalog-consumer-report.v0.schema.json",
  "design-system-compiler-diagnostics.v0.schema.json",
  "design-system-compiler-report.v0.schema.json",
  "design-system-compiler-evidence.v0.schema.json"
]);

const IMPLEMENTATION_FILES = Object.freeze([
  ".github/workflows/surfaces-proof.yml",
  "README.md",
  "VISION.md",
  "PLAN.md",
  "PROGRESS.md",
  "plans/README.md",
  "plans/capability-index.md",
  "plans/design-system-compiler.md",
  "plans/design-system-readiness.md",
  "plans/product-designer-workflow.md",
  "plans/source-family-component-identity-mapping.md",
  "plans/surfaces-dev.md",
  "bin/interfacectl.js",
  "package.json",
  "package-lock.json",
  "src/p0.js",
  "src/capability-index-contract.js",
  "src/capability-index-proof.js",
  "src/design-system-ingestion-kernel.js",
  "src/catalog-consumer-kernel.js",
  "src/design-system-compiler-proof.js",
  "test/capability-index-proof.test.js",
  "test/design-system-compiler-proof.test.js",
  ...SCHEMA_FILES.map((file) => `schemas/${file}`)
]);

const SCHEMA_BY_ID = Object.freeze({
  "diagnostics.v0": "diagnostics.v0.schema.json",
  "extract.v0": "extract.v0.schema.json",
  "runtime-catalog.v0": "runtime-catalog.v0.schema.json",
  "portable-design-source-lock.v0": "portable-design-source-lock.v0.schema.json",
  "design-system-adapter.v0": "design-system-adapter.v0.schema.json",
  "design-system-compiler-manifest.v0": "design-system-compiler-manifest.v0.schema.json",
  "design-system-compiler-mutation.v0": "design-system-compiler-mutation.v0.schema.json",
  "catalog-consumer-fixture.v0": "catalog-consumer-fixture.v0.schema.json",
  "catalog-boundary-receipt.v0": "catalog-boundary-receipt.v0.schema.json",
  "catalog-runtime-projection.v0": "catalog-runtime-projection.v0.schema.json",
  "catalog-render-plan.v0": "catalog-render-plan.v0.schema.json",
  "catalog-consumer-report.v0": "catalog-consumer-report.v0.schema.json",
  "design-system-compiler-diagnostics.v0": "design-system-compiler-diagnostics.v0.schema.json",
  "design-system-compiler-report.v0": "design-system-compiler-report.v0.schema.json",
  "design-system-compiler-evidence.v0": "design-system-compiler-evidence.v0.schema.json"
});

export async function runDesignSystemCompilerInterfacectl(argv, io) {
  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runDesignSystemCompilerProof({
      cwd: io.cwd,
      manifestPath: parsed.manifest,
      outRoot: parsed.out,
      command: COMMAND,
      args: parsed
    });
    io.stdout.write([
      `surfaces design-system-compiler proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `adapters: ${result.adapterCount}`,
      `consumerResults: ${result.matchedCount}/${result.totalCount} matched`,
      `sharedKernel: ${result.sharedKernel}`,
      `sharedConsumer: ${result.sharedConsumer}`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return Number.isInteger(error.exitCode) ? error.exitCode : 1;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    const key = flag === "--manifest" ? "manifest" : flag === "--out" ? "out" : null;
    if (!key || typeof value !== "string" || value.startsWith("--") || Object.hasOwn(parsed, key)) {
      return { ok: false, error: usage() };
    }
    try {
      assertRelativePosixPath(value, flag);
    } catch {
      return { ok: false, error: usage() };
    }
    parsed[key] = value;
  }
  if (parsed.manifest !== MANIFEST_PATH || parsed.out !== ARTIFACT_ROOT) return { ok: false, error: usage() };
  return { ok: true, ...parsed };
}

function usage() {
  return `usage: ${COMMAND} --manifest ${MANIFEST_PATH} --out ${ARTIFACT_ROOT}`;
}

export async function runDesignSystemCompilerProof({ cwd, manifestPath, outRoot, command, args }) {
  if (manifestPath !== MANIFEST_PATH || outRoot !== ARTIFACT_ROOT) throw proofError(usage(), 2);
  const validators = await loadValidators(cwd);
  const manifest = await readJson(path.join(cwd, manifestPath));
  assertSchema(validators, "design-system-compiler-manifest.v0", manifest, manifestPath);
  assertManifest(manifest, outRoot);
  await assertNoStaleOutput(cwd, manifest, outRoot);

  const kernelImplementationHash = await rawFileHash(path.join(cwd, "src/design-system-ingestion-kernel.js"));
  const consumerImplementationHash = await rawFileHash(path.join(cwd, "src/catalog-consumer-kernel.js"));
  const manifestHash = sha256Hex(canonicalJson(manifest));
  const adapterRuns = [];
  const runContexts = new Map();
  const allDiagnostics = [];
  const allArtifacts = [];

  for (const entry of manifest.adapters) {
    const adapter = await readJson(path.join(cwd, entry.adapterPath));
    assertSchema(validators, "design-system-adapter.v0", adapter, entry.adapterPath);
    assertAdapterPaths(adapter, entry);
    if (entry.outputKey !== adapter.adapterId || canonicalJson(entry.expectedComponentIds) !== canonicalJson(adapter.normalizedExtract.components.map((component) => component.id).sort())) {
      throw proofError(`adapter manifest identity mismatch: ${entry.adapterPath}`, 1);
    }
    const sourceLock = await readJson(path.join(cwd, adapter.sourceLockPath));
    assertSchema(validators, "portable-design-source-lock.v0", sourceLock, adapter.sourceLockPath);

    let compiled;
    try {
      compiled = await compileDesignSystemAdapter({ cwd, sourceRoot: entry.sourceRoot, sourceLock, adapter });
    } catch (error) {
      const diagnostic = diagnosticFromKernelError(error, entry.adapterPath);
      throw proofError(`${diagnostic.code}: ${diagnostic.message}`, 1);
    }

    assertSchema(validators, "extract.v0", compiled.extract, `${outRoot}/${entry.outputKey}/extract.json`);
    assertSchema(validators, "runtime-catalog.v0", compiled.catalog, `${outRoot}/${entry.outputKey}/catalog.json`);
    assertSchema(validators, "runtime-catalog.v0", compiled.governedCatalog, `${outRoot}/${entry.outputKey}/governed-catalog.json`);

    const adapterOut = `${outRoot}/${entry.outputKey}`;
    const extractRef = await writeArtifact(cwd, `${adapterOut}/extract.json`, "extract.v0", compiled.extract);
    const catalogRef = await writeArtifact(cwd, `${adapterOut}/catalog.json`, "runtime-catalog.v0", compiled.catalog);
    const governedCatalogRef = await writeArtifact(cwd, `${adapterOut}/governed-catalog.json`, "runtime-catalog.v0", compiled.governedCatalog);
    const sourceLockRef = jsonInputRef(adapter.sourceLockPath, "portable-design-source-lock.v0", sourceLock);
    const adapterRef = jsonInputRef(entry.adapterPath, "design-system-adapter.v0", adapter);

    const receipt = {
      schemaId: "catalog-boundary-receipt.v0",
      version: VERSION,
      adapterId: adapter.adapterId,
      status: "pass",
      promotionStatus: adapter.governance.promotionStatus,
      sourceLockRef,
      adapterRef,
      extractRef,
      catalogRef,
      governedCatalogRef,
      compiler: {
        ...DESIGN_SYSTEM_KERNEL,
        implementationHash: kernelImplementationHash
      },
      diagnostics: [],
      provenance: provenance({
        generator: "interfacectl-design-system-catalog-boundary",
        sourceRefs: [adapter.sourceLockPath, entry.adapterPath, extractRef.path, governedCatalogRef.path]
      })
    };
    assertSchema(validators, "catalog-boundary-receipt.v0", receipt, `${adapterOut}/boundary-receipt.json`);
    const receiptRef = await writeArtifact(cwd, `${adapterOut}/boundary-receipt.json`, "catalog-boundary-receipt.v0", receipt);

    try {
      assertCatalogBoundary({ receipt, receiptRef, governedCatalog: compiled.governedCatalog, governedCatalogRef });
    } catch (error) {
      const diagnostic = diagnosticFromConsumerError(error, receiptRef.path);
      throw proofError(`${diagnostic.code}: ${diagnostic.message}`, 1);
    }

    const projection = buildPortableProjection({
      adapterId: adapter.adapterId,
      receiptRef,
      governedCatalogRef,
      governedCatalog: compiled.governedCatalog,
      consumerImplementationHash
    });
    assertSchema(validators, "catalog-runtime-projection.v0", projection, `${adapterOut}/runtime-projection.json`);
    const projectionRef = await writeArtifact(cwd, `${adapterOut}/runtime-projection.json`, "catalog-runtime-projection.v0", projection);

    const results = [];
    const renderPlans = [];
    for (const fixtureKind of ["allowed", "blocked", "review"]) {
      const fixturePath = adapter.consumerFixtures[fixtureKind];
      const fixture = await readJson(path.join(cwd, fixturePath));
      assertSchema(validators, "catalog-consumer-fixture.v0", fixture, fixturePath);
      const evaluated = evaluateConsumerFixture({ fixture, fixturePath, projection });
      const roleExpectedOutcome = fixtureKind === "allowed" ? "allowed" : fixtureKind === "blocked" ? "blocked" : "review_required";
      const expectedOutcome = fixture.expectedOutcome;
      let renderPlanPath = null;
      if (evaluated.renderable) {
        renderPlanPath = `${adapterOut}/render-plan.json`;
        const renderPlan = buildPortableRenderPlan({ adapterId: adapter.adapterId, fixture, fixturePath, projectionRef, projection });
        assertSchema(validators, "catalog-render-plan.v0", renderPlan, renderPlanPath);
        renderPlans.push(await writeArtifact(cwd, renderPlanPath, "catalog-render-plan.v0", renderPlan));
      }
      const actualDiagnosticCodes = [...new Set(evaluated.diagnostics.map((diagnostic) => diagnostic.code))].sort();
      const matched = expectedOutcome === roleExpectedOutcome &&
        evaluated.outcome === expectedOutcome &&
        canonicalJson(actualDiagnosticCodes) === canonicalJson(fixture.expectedDiagnosticCodes) &&
        (fixtureKind === "allowed" ? renderPlanPath !== null : renderPlanPath === null);
      results.push({
        fixturePath,
        intent: fixture.intent,
        expectedOutcome,
        actualOutcome: evaluated.outcome,
        expectedDiagnosticCodes: fixture.expectedDiagnosticCodes,
        actualDiagnosticCodes,
        matched,
        renderPlanPath,
        diagnostics: evaluated.diagnostics
      });
      allDiagnostics.push(...evaluated.diagnostics);
    }
    const consumerStatus = results.every((result) => result.matched) ? "pass" : "fail";
    const consumerReport = {
      schemaId: "catalog-consumer-report.v0",
      version: VERSION,
      adapterId: adapter.adapterId,
      status: consumerStatus,
      promotionStatus: consumerStatus === "pass" ? adapter.governance.promotionStatus : "blocked",
      receiptRef,
      projectionRef,
      results,
      renderPlans,
      diagnostics: results.flatMap((result) => result.diagnostics),
      provenance: provenance({
        generator: "interfacectl-portable-catalog-consumer",
        sourceRefs: [receiptRef.path, projectionRef.path, ...Object.values(adapter.consumerFixtures)]
      })
    };
    assertSchema(validators, "catalog-consumer-report.v0", consumerReport, `${adapterOut}/consumer-report.json`);
    const consumerReportRef = await writeArtifact(cwd, `${adapterOut}/consumer-report.json`, "catalog-consumer-report.v0", consumerReport);

    const artifactRefs = [extractRef, catalogRef, governedCatalogRef, receiptRef, projectionRef, ...renderPlans, consumerReportRef];
    allArtifacts.push(...artifactRefs);
    const adapterRun = {
      adapterId: adapter.adapterId,
      sourceFamily: adapter.sourceFamily,
      sourceId: sourceLock.sourceId,
      packageIdentity: `${sourceLock.acquisition.packageName}@${sourceLock.acquisition.packageVersion}`,
      upstreamRepository: sourceLock.acquisition.upstreamRepository,
      componentIds: Object.keys(compiled.governedCatalog.components).sort(),
      status: consumerStatus,
      promotionStatus: consumerReport.promotionStatus,
      sourceLockRef,
      adapterRef,
      extractRef,
      catalogRef,
      governedCatalogRef,
      receiptRef,
      projectionRef,
      consumerReportRef,
      renderPlanRefs: renderPlans,
      kernelImplementationHash,
      consumerImplementationHash,
      consumerResults: results.length,
      matchedConsumerResults: results.filter((result) => result.matched).length
    };
    adapterRuns.push(adapterRun);
    runContexts.set(adapter.adapterId, { entry, adapter, sourceLock, compiled, receipt, receiptRef, governedCatalogRef, adapterRun });
  }

  const reuseIdentityCode = firstReuseIdentityFailureCode(adapterRuns);
  if (reuseIdentityCode !== null) throw proofError(`${reuseIdentityCode}: ${DIAGNOSTIC_TEXT[reuseIdentityCode]}`, 1);

  const mutationResults = [];
  for (const mutationPath of manifest.mutationFixtures) {
    assertRelativePosixPath(mutationPath, "mutation fixture path");
    const mutation = await readJson(path.join(cwd, mutationPath));
    assertSchema(validators, "design-system-compiler-mutation.v0", mutation, mutationPath);
    const context = runContexts.get(mutation.adapterId);
    if (!context) throw proofError(`mutation references unknown adapter: ${mutation.adapterId}`, 1);
    const actualCode = evaluateMutation(mutation, context);
    mutationResults.push({
      mutationPath,
      mutationId: mutation.mutationId,
      expectedCode: mutation.expectedCode,
      actualCode,
      matched: mutation.expectedCode === actualCode
    });
  }

  const uniqueDiagnosticCodes = [...new Set(allDiagnostics.map((diagnostic) => diagnostic.code))].sort();
  const allMatched = adapterRuns.every((run) => run.status === "pass") && mutationResults.every((result) => result.matched);
  const expectedMatched = manifest.expectedRun.adapterCount === adapterRuns.length &&
    adapterRuns.every((run) => run.consumerResults === manifest.expectedRun.consumerResultsPerAdapter) &&
    canonicalJson(manifest.expectedRun.diagnosticCodes) === canonicalJson(uniqueDiagnosticCodes);
  const actualStatus = allMatched && expectedMatched ? "pass" : "fail";
  const actualPromotionStatus = actualStatus === "pass" && adapterRuns.some((run) => run.promotionStatus === "review_required")
    ? "review_required"
    : actualStatus === "pass" ? "allowed" : "blocked";
  const expectationMatched = manifest.expectedRun.status === actualStatus &&
    manifest.expectedRun.promotionStatus === actualPromotionStatus;
  const status = expectationMatched ? actualStatus : "fail";
  const promotionStatus = expectationMatched ? actualPromotionStatus : "blocked";
  const implementationRefs = await buildRawRefs(cwd, IMPLEMENTATION_FILES);
  const sourceRefs = await buildSourceRefs(cwd, manifest, runContexts);
  const runId = `design-system-compiler-${sha256Hex(canonicalJson({
    manifestHash,
    kernelImplementationHash,
    consumerImplementationHash,
    implementationClosureHash: sha256Hex(canonicalJson(implementationRefs)),
    sourceClosureHash: sha256Hex(canonicalJson(sourceRefs)),
    adapterRuns,
    mutationResults
  })).slice(0, 16)}`;
  const report = {
    schemaId: "design-system-compiler-report.v0",
    version: VERSION,
    contractId: CONTRACT_ID,
    runId,
    status,
    promotionStatus,
    manifestPath,
    kernel: { ...DESIGN_SYSTEM_KERNEL, implementationHash: kernelImplementationHash },
    consumer: { ...CATALOG_CONSUMER, implementationHash: consumerImplementationHash },
    adapterRuns,
    mutationResults,
    reuseProof: buildReuseProof(adapterRuns, manifest),
    diagnostics: sortDiagnostics(allDiagnostics),
    provenance: provenance({ generator: "interfacectl-design-system-compiler-report", sourceRefs: [manifestPath] })
  };
  assertSchema(validators, "design-system-compiler-report.v0", report, `${outRoot}/design-system-compiler-report.json`);
  const reportRef = await writeArtifact(cwd, `${outRoot}/design-system-compiler-report.json`, "design-system-compiler-report.v0", report);
  allArtifacts.push(reportRef);

  const evidencePath = `${outRoot}/evidence.json`;
  const evidence = {
    schemaId: "design-system-compiler-evidence.v0",
    version: VERSION,
    contractId: CONTRACT_ID,
    runId,
    command,
    args: ["--manifest", manifestPath, "--out", outRoot],
    status,
    promotionStatus,
    reportRef,
    artifacts: [...allArtifacts.sort((a, b) => a.path.localeCompare(b.path)), artifactRef(evidencePath, "design-system-compiler-evidence.v0", ZERO_HASH)],
    implementationRefs,
    sourceRefs,
    diagnostics: sortDiagnostics(allDiagnostics),
    provenance: provenance({
      generator: "interfacectl-design-system-compiler-evidence",
      sourceRefs: [manifestPath, reportRef.path],
      command,
      args: ["--manifest", manifestPath, "--out", outRoot]
    })
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertSchema(validators, "design-system-compiler-evidence.v0", evidence, evidencePath);
  await writeCanonicalJson(path.join(cwd, evidencePath), evidence);
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, evidence);
  if (integrityCode !== null) throw proofError(`design-system compiler evidence integrity failed: ${integrityCode}`, 1);

  return {
    status,
    promotionStatus,
    adapterCount: adapterRuns.length,
    matchedCount: adapterRuns.reduce((sum, run) => sum + run.matchedConsumerResults, 0),
    totalCount: adapterRuns.reduce((sum, run) => sum + run.consumerResults, 0),
    sharedKernel: report.reuseProof.sharedKernel,
    sharedConsumer: report.reuseProof.sharedConsumer,
    artifacts: evidence.artifacts.map((ref) => ref.path)
  };
}

function evaluateMutation(mutation, context) {
  try {
    if (mutation.operation === "add-authority-without-mapping") {
      const mutated = structuredClone(context.adapter);
      const component = mutated.normalizedExtract.components[mutation.componentIndex];
      if (!component || !component[mutation.memberGroup]) return null;
      component[mutation.memberGroup][mutation.memberId] = structuredClone(mutation.memberValue);
      verifyMappings(mutated, context.compiled.anchors);
      return null;
    }
    if (mutation.operation === "receipt-catalog-hash-mismatch") {
      const mutatedReceipt = structuredClone(context.receipt);
      mutatedReceipt.governedCatalogRef.hash = ZERO_HASH;
      const mutatedReceiptRef = {
        ...context.receiptRef,
        hash: sha256Hex(canonicalJson(mutatedReceipt))
      };
      assertCatalogBoundary({
        receipt: mutatedReceipt,
        receiptRef: mutatedReceiptRef,
        governedCatalog: context.compiled.governedCatalog,
        governedCatalogRef: context.governedCatalogRef
      });
      return null;
    }
    if (mutation.operation === "replace-mapped-target-value") {
      const mutated = structuredClone(context.adapter);
      const targetDocument = {
        components: mutated.normalizedExtract.components,
        tokens: mutated.normalizedExtract.tokens
      };
      setValueAtPointer(targetDocument, mutation.targetPointer, mutation.replacementValue);
      const mapping = [...mutated.mappings]
        .sort((a, b) => b.targetPointer.length - a.targetPointer.length)
        .find((candidate) => mutation.targetPointer === candidate.targetPointer || mutation.targetPointer.startsWith(`${candidate.targetPointer}/`));
      if (!mapping) return null;
      const relativePointer = mutation.targetPointer.slice(mapping.targetPointer.length);
      setValueAtPointer(mapping, `/targetValue${relativePointer}`, mutation.replacementValue);
      verifyMappings(mutated, context.compiled.anchors);
      return null;
    }
    if (mutation.operation === "rename-mapped-member") {
      const mutated = structuredClone(context.adapter);
      const originalComponent = mutated.normalizedExtract.components[mutation.componentIndex];
      if (!originalComponent) return null;
      const component = replaceExactString(originalComponent, mutation.memberId, mutation.replacementMemberId);
      mutated.normalizedExtract.components[mutation.componentIndex] = component;
      const group = component?.[mutation.memberGroup];
      if (!group || !Object.prototype.hasOwnProperty.call(group, mutation.memberId) ||
          Object.prototype.hasOwnProperty.call(group, mutation.replacementMemberId)) return null;
      const oldPointer = `/components/${mutation.componentIndex}/${mutation.memberGroup}/${mutation.memberId}`;
      const newPointer = `/components/${mutation.componentIndex}/${mutation.memberGroup}/${mutation.replacementMemberId}`;
      group[mutation.replacementMemberId] = replaceExactString(group[mutation.memberId], mutation.memberId, mutation.replacementMemberId);
      delete group[mutation.memberId];
      for (const mapping of mutated.mappings) {
        if (mapping.targetPointer === oldPointer) mapping.targetPointer = newPointer;
        mapping.targetValue = replaceExactString(mapping.targetValue, mutation.memberId, mutation.replacementMemberId);
      }
      mutated.mappings.sort((a, b) => a.targetPointer.localeCompare(b.targetPointer));
      verifyMappings(mutated, context.compiled.anchors);
      return null;
    }
  } catch (error) {
    return error?.code || null;
  }
  return null;
}

function replaceExactString(value, expected, replacement) {
  if (value === expected) return replacement;
  if (Array.isArray(value)) return value.map((child) => replaceExactString(child, expected, replacement));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceExactString(child, expected, replacement)]));
}

function setValueAtPointer(document, pointer, value) {
  const segments = pointer.slice(1).split("/").map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
  const leaf = segments.pop();
  let current = document;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, segment)) return false;
    current = current[segment];
  }
  if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, leaf)) return false;
  current[leaf] = structuredClone(value);
  return true;
}

const DIAGNOSTIC_TEXT = Object.freeze({
  SOURCE_IDENTITY_REUSED: "The reuse proof repeats an adapter, source, or design-system package identity."
});

export function firstReuseIdentityFailureCode(adapterRuns) {
  const identityGroups = [
    adapterRuns.map((run) => run.adapterId),
    adapterRuns.map((run) => run.sourceFamily),
    adapterRuns.map((run) => run.sourceId),
    adapterRuns.map((run) => `${run.packageIdentity.replace(/@[^@]+$/, "")}|${run.upstreamRepository || ""}`)
  ];
  return identityGroups.some((values) => new Set(values).size !== values.length)
    ? "SOURCE_IDENTITY_REUSED"
    : null;
}

function buildReuseProof(adapterRuns, manifest) {
  return {
    adapterCount: adapterRuns.length,
    sourceFamilies: adapterRuns.map((run) => run.sourceFamily).sort(),
    sourceIds: adapterRuns.map((run) => run.sourceId).sort(),
    packageIdentities: adapterRuns.map((run) => run.packageIdentity).sort(),
    designSystemIdentities: adapterRuns.map((run) => `${run.packageIdentity.replace(/@[^@]+$/, "")}|${run.upstreamRepository || ""}`).sort(),
    componentIds: adapterRuns.flatMap((run) => run.componentIds).sort(),
    kernelImplementationHashes: adapterRuns.map((run) => run.kernelImplementationHash),
    consumerImplementationHashes: adapterRuns.map((run) => run.consumerImplementationHash),
    sharedKernel: new Set(adapterRuns.map((run) => run.kernelImplementationHash)).size === 1,
    sharedConsumer: new Set(adapterRuns.map((run) => run.consumerImplementationHash)).size === 1,
    sourceSpecificImplementationModules: manifest.adapters
      .map((entry) => entry.adapterPath)
      .filter((adapterPath) => !adapterPath.endsWith("/adapter.json"))
      .sort()
  };
}

function assertManifest(manifest, outRoot) {
  if (manifest.artifactRoot !== outRoot || manifest.expectedRun.adapterCount !== manifest.adapters.length) {
    throw proofError("design-system compiler manifest roots or counts do not match the proof command", 1);
  }
  const keys = manifest.adapters.map((entry) => entry.outputKey);
  const paths = manifest.adapters.map((entry) => entry.adapterPath);
  const roots = manifest.adapters.map((entry) => entry.sourceRoot);
  if (!isSortedUnique(keys) || !isSortedUnique(paths) || !isSortedUnique(roots) || !isSortedUnique(manifest.mutationFixtures) ||
      !isSortedUnique(manifest.expectedRun.diagnosticCodes)) {
    throw proofError("design-system compiler manifest paths and identifiers must be sorted and unique", 1);
  }
  for (const entry of manifest.adapters) {
    assertRelativePosixPath(entry.adapterPath, "adapterPath");
    assertRelativePosixPath(entry.sourceRoot, "sourceRoot");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.outputKey)) throw proofError(`invalid output key: ${entry.outputKey}`, 1);
    if (!isSortedUnique(entry.expectedComponentIds)) throw proofError(`expected component ids must be sorted: ${entry.outputKey}`, 1);
  }
  for (const mutationPath of manifest.mutationFixtures) assertRelativePosixPath(mutationPath, "mutation fixture path");
}

function assertAdapterPaths(adapter, entry) {
  assertRelativePosixPath(adapter.sourceLockPath, "source lock path");
  for (const [fixtureKind, fixturePath] of Object.entries(adapter.consumerFixtures)) {
    assertRelativePosixPath(fixturePath, `${fixtureKind} consumer fixture path`);
  }
  if (!adapter.normalizedExtract.sourceUri.startsWith("sources/") || adapter.normalizedExtract.sourceUri !== entry.adapterPath) {
    throw proofError(`adapter source URI must equal its checked adapter path: ${entry.adapterPath}`, 1);
  }
}

async function assertNoStaleOutput(cwd, manifest, outRoot) {
  const allowed = new Set(expectedArtifactPaths(manifest, outRoot, { includeEvidence: true }));
  const absoluteRoot = path.join(cwd, outRoot);
  await ensureSafeDirectory(cwd, outRoot);
  const existing = await listFiles(absoluteRoot, outRoot);
  const stale = existing.filter((file) => !allowed.has(file));
  if (stale.length > 0) throw proofError(`stale unexpected output under --out: ${stale.join(", ")}`, 1);
}

export function expectedArtifactPaths(manifest, outRoot = ARTIFACT_ROOT, { includeEvidence = false } = {}) {
  const paths = [
    ...manifest.adapters.flatMap((entry) => ADAPTER_ARTIFACT_FILES.map((file) => `${outRoot}/${entry.outputKey}/${file}`)),
    `${outRoot}/design-system-compiler-report.json`
  ];
  if (includeEvidence) paths.push(`${outRoot}/evidence.json`);
  return paths.sort();
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const schemas = new Map();
  for (const file of SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, "schemas", file));
    schemas.set(file, schema);
    ajv.addSchema(schema);
  }
  const validators = new Map();
  for (const [schemaId, file] of Object.entries(SCHEMA_BY_ID)) {
    const validator = ajv.getSchema(schemas.get(file).$id);
    if (!validator) throw proofError(`missing validator for ${schemaId}`, 1);
    validators.set(schemaId, validator);
  }
  return validators;
}

function assertSchema(validators, schemaId, value, artifactPath) {
  const validator = validators.get(schemaId);
  if (!validator || !validator(value)) {
    const details = validator?.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ") || "validator unavailable";
    throw proofError(`schema validation failed for ${artifactPath} against ${schemaId}: ${details}`, 1);
  }
}

async function writeArtifact(cwd, relativePath, schemaId, value) {
  await writeCanonicalJson(path.join(cwd, relativePath), value);
  return artifactRef(relativePath, schemaId, sha256Hex(canonicalJson(value)));
}

function jsonInputRef(relativePath, schemaId, value) {
  return artifactRef(relativePath, schemaId, sha256Hex(canonicalJson(value)));
}

function artifactRef(pathValue, schemaId, hash) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash };
}

async function buildRawRefs(cwd, files) {
  const refs = [];
  for (const relativePath of [...files].sort()) {
    refs.push({
      path: relativePath,
      hashAlgorithm: "sha256",
      hashMode: "raw-bytes",
      hash: await rawFileHash(path.join(cwd, relativePath))
    });
  }
  return refs;
}

async function buildSourceRefs(cwd, manifest, runContexts) {
  const paths = new Set([MANIFEST_PATH, ...manifest.mutationFixtures]);
  for (const context of runContexts.values()) {
    paths.add(context.entry.adapterPath);
    paths.add(context.adapter.sourceLockPath);
    for (const file of context.sourceLock.files) paths.add(`${context.entry.sourceRoot}/${file.path}`);
    for (const fixturePath of Object.values(context.adapter.consumerFixtures)) paths.add(fixturePath);
  }
  return buildRawRefs(cwd, [...paths]);
}

export async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    if (evidence?.schemaId !== "design-system-compiler-evidence.v0" || evidence.contractId !== CONTRACT_ID || evidence.status !== "pass") return "EVIDENCE_HASH_MISMATCH";
    const validators = await loadValidators(cwd);
    assertSchema(validators, "design-system-compiler-evidence.v0", evidence, `${ARTIFACT_ROOT}/evidence.json`);
    const artifactPaths = evidence.artifacts.map((ref) => ref.path);
    const nonSelfArtifactPaths = artifactPaths.filter((artifactPath) => artifactPath !== `${ARTIFACT_ROOT}/evidence.json`);
    if (new Set(artifactPaths).size !== artifactPaths.length ||
        canonicalJson(nonSelfArtifactPaths) !== canonicalJson([...nonSelfArtifactPaths].sort()) ||
        artifactPaths.at(-1) !== `${ARTIFACT_ROOT}/evidence.json`) return "EVIDENCE_HASH_MISMATCH";
    const selfRef = evidence.artifacts.find((ref) => ref.path === `${ARTIFACT_ROOT}/evidence.json`);
    if (!selfRef || selfRef.hash !== computeEvidenceSelfHash(evidence)) return "EVIDENCE_HASH_MISMATCH";
    const implementationPaths = evidence.implementationRefs.map((ref) => ref.path);
    if (canonicalJson(implementationPaths) !== canonicalJson([...IMPLEMENTATION_FILES].sort())) return "EVIDENCE_HASH_MISMATCH";
    for (const ref of evidence.artifacts) {
      if (ref.path === `${ARTIFACT_ROOT}/evidence.json`) continue;
      const value = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== sha256Hex(canonicalJson(value))) return "EVIDENCE_HASH_MISMATCH";
      assertSchema(validators, ref.schemaId, value, ref.path);
    }
    for (const ref of [...evidence.implementationRefs, ...evidence.sourceRefs]) {
      if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "EVIDENCE_HASH_MISMATCH";
    }
    const reportArtifact = evidence.artifacts.find((ref) => ref.path === evidence.reportRef.path);
    if (!reportArtifact || canonicalJson(reportArtifact) !== canonicalJson(evidence.reportRef)) return "EVIDENCE_HASH_MISMATCH";
    const report = await readJson(path.join(cwd, evidence.reportRef.path));
    const manifest = await readJson(path.join(cwd, MANIFEST_PATH));
    assertSchema(validators, "design-system-compiler-manifest.v0", manifest, MANIFEST_PATH);
    const expectedPaths = expectedArtifactPaths(manifest);
    if (canonicalJson(nonSelfArtifactPaths) !== canonicalJson(expectedPaths)) return "EVIDENCE_HASH_MISMATCH";
    const expectedSourcePaths = new Set([MANIFEST_PATH, ...manifest.mutationFixtures]);
    const expectedAdapterIds = [];
    for (const entry of manifest.adapters) {
      expectedSourcePaths.add(entry.adapterPath);
      const adapter = await readJson(path.join(cwd, entry.adapterPath));
      assertSchema(validators, "design-system-adapter.v0", adapter, entry.adapterPath);
      expectedAdapterIds.push(adapter.adapterId);
      expectedSourcePaths.add(adapter.sourceLockPath);
      const sourceLock = await readJson(path.join(cwd, adapter.sourceLockPath));
      assertSchema(validators, "portable-design-source-lock.v0", sourceLock, adapter.sourceLockPath);
      for (const file of sourceLock.files) expectedSourcePaths.add(`${entry.sourceRoot}/${file.path}`);
      for (const fixturePath of Object.values(adapter.consumerFixtures)) expectedSourcePaths.add(fixturePath);
    }
    if (canonicalJson(report.adapterRuns.map((run) => run.adapterId).sort()) !== canonicalJson(expectedAdapterIds.sort())) return "EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(report.reuseProof) !== canonicalJson(buildReuseProof(report.adapterRuns, manifest))) return "EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.sourceRefs.map((ref) => ref.path)) !== canonicalJson([...expectedSourcePaths].sort())) return "EVIDENCE_HASH_MISMATCH";
    return null;
  } catch {
    return "EVIDENCE_HASH_MISMATCH";
  }
}

export function computeEvidenceSelfHash(evidence) {
  const clone = structuredClone(evidence);
  const selfRef = clone.artifacts.find((ref) => ref.path === `${ARTIFACT_ROOT}/evidence.json`);
  if (!selfRef) return ZERO_HASH;
  selfRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

function provenance({ generator, sourceRefs, command = null, args = null }) {
  return {
    generator: { name: generator, version: VERSION },
    generatedAt: NORMALIZED_TIMESTAMP,
    sourceRefs: [...sourceRefs].sort(),
    command,
    args,
    environment: {
      golden: true,
      timestampMode: "normalized",
      timestampOverride: null,
      timezone: "UTC",
      locale: "en-US-POSIX",
      pathStyle: "posix-relative",
      jsonCanonicalization: "rfc8785",
      numberSerialization: "rfc8785",
      schemaOutputFormat: "basic",
      host: null
    }
  };
}

async function writeCanonicalJson(absolutePath, value) {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, `${canonicalJson(value)}\n`, "utf8");
}

async function readJson(absolutePath) {
  return JSON.parse(await fs.readFile(absolutePath, "utf8"));
}

async function rawFileHash(absolutePath) {
  return sha256Hex(await fs.readFile(absolutePath));
}

async function ensureSafeDirectory(cwd, relativePath) {
  assertRelativePosixPath(relativePath, "output path");
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    let stat = await fs.lstat(current).catch(() => null);
    if (!stat) {
      await fs.mkdir(current);
      stat = await fs.lstat(current);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw proofError(`unsafe output path: ${relativePath}`, 1);
  }
}

async function listFiles(absoluteRoot, relativeRoot) {
  const files = [];
  const walk = async (absolute, relative) => {
    for (const entry of (await fs.readdir(absolute, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const childAbsolute = path.join(absolute, entry.name);
      const childRelative = `${relative}/${entry.name}`;
      const stat = await fs.lstat(childAbsolute);
      if (stat.isSymbolicLink()) throw proofError(`unsafe output symlink: ${childRelative}`, 1);
      if (stat.isDirectory()) await walk(childAbsolute, childRelative);
      else if (stat.isFile()) files.push(childRelative);
      else throw proofError(`unsafe output entry: ${childRelative}`, 1);
    }
  };
  await walk(absoluteRoot, relativeRoot);
  return files.sort();
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    a.artifactPath.localeCompare(b.artifactPath) || a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}

function assertRelativePosixPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\") || path.isAbsolute(value) ||
      value.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw proofError(`${label} must be a POSIX-style relative path without . or .. segments`, 2);
  }
}

function isSortedUnique(values) {
  return canonicalJson(values) === canonicalJson([...new Set(values)].sort());
}

function proofError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const designSystemCompilerInternals = Object.freeze({
  ARTIFACT_ROOT,
  COMMAND,
  MANIFEST_PATH,
  IMPLEMENTATION_FILES,
  computeEvidenceSelfHash,
  expectedArtifactPaths,
  firstEvidenceIntegrityFailureCode,
  firstReuseIdentityFailureCode,
  parseArgs
});
