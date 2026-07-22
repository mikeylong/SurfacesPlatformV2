import fs from "node:fs/promises";
import path from "node:path";
import { builtinModules } from "node:module";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalArtifactRef, canonicalJson, NORMALIZED_TIMESTAMP, sha256Hex } from "./proof-runtime.js";
import { scanJavaScriptModule } from "./javascript-module-scanner.js";
import {
  DESIGN_SYSTEM_KERNEL,
  compileDesignSystemAdapter,
  diagnosticFromKernelError,
  verifyMappings
} from "./design-system-ingestion-kernel.js";
import {
  CATALOG_CONSUMER,
  assertCatalogReleaseReceipt,
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
const COMPILER_ENTRY_PATH = "src/design-system-compiler-proof.js";
const KERNEL_ENTRY_PATH = "src/design-system-ingestion-kernel.js";
const CONSUMER_ENTRY_PATH = "src/catalog-consumer-kernel.js";
const NODE_BUILTIN_SPECIFIERS = new Set(builtinModules.map((specifier) => specifier.replace(/^node:/, "")));
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
  "src/javascript-module-scanner.js",
  "src/capability-index-contract.js",
  "src/capability-index-proof.js",
  "src/proof-runtime.js",
  "src/catalog-authority.js",
  "src/catalog-release-boundary.js",
  "src/design-system-ingestion-kernel.js",
  "src/catalog-consumer-kernel.js",
  "src/design-system-compiler-proof.js",
  "test/capability-index-proof.test.js",
  "test/catalog-release-boundary.test.js",
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
  const boundaryValidators = {
    receipt: validators.get("catalog-boundary-receipt.v0"),
    governedCatalog: validators.get("runtime-catalog.v0")
  };
  const manifest = await readJson(path.join(cwd, manifestPath));
  assertSchema(validators, "design-system-compiler-manifest.v0", manifest, manifestPath);
  assertManifest(manifest, outRoot);
  await assertNoStaleOutput(cwd, manifest, outRoot);

  const kernelImplementationHash = (await transitiveLocalImplementationClosure(cwd, KERNEL_ENTRY_PATH)).hash;
  const consumerImplementationHash = (await transitiveLocalImplementationClosure(cwd, CONSUMER_ENTRY_PATH)).hash;
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
    const extractRef = canonicalArtifactRef(`${adapterOut}/extract.json`, "extract.v0", compiled.extract);
    const catalogRef = canonicalArtifactRef(`${adapterOut}/catalog.json`, "runtime-catalog.v0", compiled.catalog);
    const governedCatalogRef = canonicalArtifactRef(`${adapterOut}/governed-catalog.json`, "runtime-catalog.v0", compiled.governedCatalog);
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
    const receiptRef = canonicalArtifactRef(`${adapterOut}/boundary-receipt.json`, "catalog-boundary-receipt.v0", receipt);

    try {
      assertCatalogReleaseReceipt({
        adapterId: adapter.adapterId,
        receipt,
        receiptRef,
        governedCatalog: compiled.governedCatalog,
        governedCatalogRef,
        validators: boundaryValidators
      });
    } catch (error) {
      const diagnostic = diagnosticFromConsumerError(error, receiptRef.path);
      throw proofError(`${diagnostic.code}: ${diagnostic.message}`, 1);
    }

    await writeArtifact(cwd, extractRef.path, extractRef.schemaId, compiled.extract);
    await writeArtifact(cwd, catalogRef.path, catalogRef.schemaId, compiled.catalog);
    await writeArtifact(cwd, governedCatalogRef.path, governedCatalogRef.schemaId, compiled.governedCatalog);
    await writeArtifact(cwd, receiptRef.path, receiptRef.schemaId, receipt);

    const projection = buildPortableProjection({
      adapterId: adapter.adapterId,
      receipt,
      receiptRef,
      governedCatalogRef,
      governedCatalog: compiled.governedCatalog,
      validators: boundaryValidators,
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
    runContexts.set(adapter.adapterId, {
      entry,
      adapter,
      sourceLock,
      compiled,
      receipt,
      receiptRef,
      governedCatalogRef,
      boundaryValidators,
      adapterRun
    });
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
  const sourceSpecificImplementationModules = await sourceSpecificImplementationModulesFromInventory(cwd, adapterRuns);
  if (sourceSpecificImplementationModules.length > 0) {
    throw proofError(`source-specific implementation modules are forbidden: ${sourceSpecificImplementationModules.join(", ")}`, 1);
  }
  const reuseProof = buildReuseProof(adapterRuns, sourceSpecificImplementationModules);
  const implementationRefs = await buildRawRefs(cwd, IMPLEMENTATION_FILES);
  const sourceRefs = await buildSourceRefs(cwd, manifest, runContexts);
  const runId = computeCompilerRunId({
    manifestHash,
    kernelImplementationHash,
    consumerImplementationHash,
    implementationClosureHash: sha256Hex(canonicalJson(implementationRefs)),
    sourceClosureHash: sha256Hex(canonicalJson(sourceRefs)),
    adapterRuns,
    mutationResults,
    reuseProof
  });
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
    reuseProof,
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
      assertCatalogReleaseReceipt({
        adapterId: context.adapter.adapterId,
        receipt: mutatedReceipt,
        receiptRef: mutatedReceiptRef,
        governedCatalog: context.compiled.governedCatalog,
        governedCatalogRef: context.governedCatalogRef,
        validators: context.boundaryValidators
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

function buildReuseProof(adapterRuns, sourceSpecificImplementationModules) {
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
    sourceSpecificImplementationModules: [...sourceSpecificImplementationModules].sort()
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

export async function transitiveLocalImplementationClosureHash(cwd, entryPath) {
  return (await transitiveLocalImplementationClosure(cwd, entryPath)).hash;
}

export async function transitiveLocalImplementationClosure(cwd, entryPath) {
  const refs = await buildTransitiveLocalImplementationRefs(cwd, entryPath);
  return {
    refs,
    hash: sha256Hex(canonicalJson(refs))
  };
}

export async function sourceSpecificImplementationModulesFromInventory(cwd, adapterRuns) {
  const closure = await transitiveLocalImplementationClosure(cwd, COMPILER_ENTRY_PATH);
  const modules = [];
  for (const ref of closure.refs) {
    modules.push({
      path: ref.path,
      source: await fs.readFile(path.join(cwd, ...ref.path.split("/")), "utf8")
    });
  }
  return findSourceSpecificImplementationModules({ modules, adapterRuns });
}

export function findSourceSpecificImplementationModules({ modules, adapterRuns }) {
  const identities = new Set();
  for (const run of adapterRuns) {
    for (const identity of [
      run.adapterId,
      run.sourceId,
      run.sourceFamily,
      run.packageIdentity,
      typeof run.packageIdentity === "string" ? run.packageIdentity.replace(/@[^@]+$/, "") : null,
      run.upstreamRepository
    ]) {
      if (typeof identity === "string" && identity.trim().length >= 4) identities.add(identity.toLowerCase());
    }
  }
  return [...new Set(modules
    .filter((module) => {
      const searchable = `${module.path}\n${scanJavaScriptModule(module.source).commentFreeSource}`.toLowerCase();
      return [...identities].some((identity) => searchable.includes(identity));
    })
    .map((module) => module.path))]
    .sort();
}

async function buildTransitiveLocalImplementationRefs(cwd, entryPath) {
  assertRelativePosixPath(entryPath, "implementation entry path");
  const workspaceRoot = await fs.realpath(path.resolve(cwd));
  const packageContext = await loadImplementationPackageContext(workspaceRoot);
  const pending = [entryPath];
  const visited = new Set(["package.json"]);
  while (pending.length > 0) {
    pending.sort();
    const relativePath = pending.shift();
    if (visited.has(relativePath)) continue;
    const absolutePath = path.resolve(workspaceRoot, ...relativePath.split("/"));
    assertImplementationPathContained(workspaceRoot, absolutePath, relativePath);
    const realPath = await fs.realpath(absolutePath).catch(() => null);
    const stat = await fs.lstat(absolutePath).catch(() => null);
    if (realPath !== absolutePath || !stat?.isFile() || stat.isSymbolicLink()) {
      throw proofError(`implementation closure contains an unsafe module: ${relativePath}`, 1);
    }
    visited.add(relativePath);
    const source = await fs.readFile(absolutePath, "utf8");
    const scan = scanJavaScriptModule(source);
    if (scan.commonJsLoaderUsages.length > 0) {
      const findings = scan.commonJsLoaderUsages
        .map((finding) => `${finding.kind}@${finding.line}:${finding.column}`)
        .join(", ");
      throw proofError(`implementation closure contains a CommonJS module loader: ${relativePath} (${findings})`, 1);
    }
    if (scan.nonLiteralDynamicImports.length > 0) {
      const findings = scan.nonLiteralDynamicImports
        .map((finding) => `${finding.kind}@${finding.line}:${finding.column}`)
        .join(", ");
      throw proofError(`implementation closure contains a nonliteral dynamic import: ${relativePath} (${findings})`, 1);
    }
    for (const specifier of scan.moduleSpecifiers) {
      const resolvedPaths = resolveImplementationModuleSpecifier({
        workspaceRoot,
        fromPath: absolutePath,
        specifier,
        packageContext
      });
      for (const resolved of resolvedPaths) {
        assertImplementationPathContained(workspaceRoot, resolved, `${relativePath} -> ${specifier}`);
        const workspaceRelative = path.relative(workspaceRoot, resolved);
        const importedPath = workspaceRelative.split(path.sep).join("/");
        assertRelativePosixPath(importedPath, "implementation import path");
        pending.push(importedPath);
      }
    }
  }
  return buildRawRefs(workspaceRoot, [...visited]);
}

async function loadImplementationPackageContext(workspaceRoot) {
  const manifestPath = path.join(workspaceRoot, "package.json");
  const realPath = await fs.realpath(manifestPath).catch(() => null);
  const stat = await fs.lstat(manifestPath).catch(() => null);
  if (realPath !== manifestPath || !stat?.isFile() || stat.isSymbolicLink()) {
    throw proofError("implementation closure contains an unsafe package manifest: package.json", 1);
  }
  const manifest = await readJson(manifestPath);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw proofError("implementation closure package manifest must be a JSON object", 1);
  }
  const declaredExternalPackages = new Set();
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const declarations = manifest[field];
    if (declarations === undefined) continue;
    if (!declarations || typeof declarations !== "object" || Array.isArray(declarations)) {
      throw proofError(`implementation closure package manifest has invalid ${field}`, 1);
    }
    for (const packageName of Object.keys(declarations)) declaredExternalPackages.add(packageName);
  }
  return {
    name: typeof manifest.name === "string" && manifest.name.length > 0 ? manifest.name : null,
    imports: manifest.imports,
    exports: manifest.exports,
    declaredExternalPackages
  };
}

function resolveImplementationModuleSpecifier({ workspaceRoot, fromPath, specifier, packageContext }) {
  if (typeof specifier !== "string" || specifier.length === 0 || specifier.includes("\\")) {
    throw proofError(`implementation module specifier is unresolved: ${specifier}`, 1);
  }
  if (specifier.startsWith(".")) {
    return [path.resolve(path.dirname(fromPath), stripModuleSpecifierSuffix(specifier))];
  }
  if (specifier.startsWith("#")) {
    return resolvePackageImportsAlias(workspaceRoot, packageContext, specifier, new Set());
  }
  if (packageContext.name && (specifier === packageContext.name || specifier.startsWith(`${packageContext.name}/`))) {
    const subpath = specifier === packageContext.name ? "." : `.${specifier.slice(packageContext.name.length)}`;
    const match = matchPackageMap(packageContext.exports, subpath, "exports");
    return resolvePackageTarget(workspaceRoot, packageContext, match, "exports", new Set([specifier]));
  }
  if (isNodeBuiltinSpecifier(specifier)) return [];
  if (/^[A-Za-z][A-Za-z+.-]*:/.test(specifier)) {
    throw proofError(`implementation closure imports an unsupported module protocol: ${specifier}`, 1);
  }
  const externalPackage = externalPackageName(specifier);
  if (externalPackage && packageContext.declaredExternalPackages.has(externalPackage)) return [];
  throw proofError(`implementation closure imports an undeclared external package: ${specifier}`, 1);
}

function resolvePackageImportsAlias(workspaceRoot, packageContext, specifier, seen) {
  if (seen.has(specifier)) throw proofError(`implementation package alias cycle is unresolved: ${specifier}`, 1);
  seen.add(specifier);
  const match = matchPackageMap(packageContext.imports, specifier, "imports");
  return resolvePackageTarget(workspaceRoot, packageContext, match, "imports", seen);
}

function matchPackageMap(packageMap, request, field) {
  if (field === "exports" && !isPackageSubpathMap(packageMap)) {
    if (request !== "." || packageMap === undefined) {
      throw proofError(`implementation self-package reference is unresolved: ${request}`, 1);
    }
    return { value: packageMap, wildcard: null, request };
  }
  if (!packageMap || typeof packageMap !== "object" || Array.isArray(packageMap)) {
    const label = field === "imports" ? "package alias" : "self-package reference";
    throw proofError(`implementation ${label} is unresolved: ${request}`, 1);
  }
  if (Object.hasOwn(packageMap, request)) return { value: packageMap[request], wildcard: null, request };
  const patterns = Object.keys(packageMap)
    .filter((key) => key.split("*").length === 2)
    .map((key) => {
      const [prefix, suffix] = key.split("*");
      if (!request.startsWith(prefix) || !request.endsWith(suffix) || request.length < prefix.length + suffix.length) return null;
      return { key, prefix, suffix, wildcard: request.slice(prefix.length, request.length - suffix.length) };
    })
    .filter(Boolean)
    .sort((left, right) => right.prefix.length - left.prefix.length || right.suffix.length - left.suffix.length || left.key.localeCompare(right.key));
  if (patterns.length === 0) {
    const label = field === "imports" ? "package alias" : "self-package reference";
    throw proofError(`implementation ${label} is unresolved: ${request}`, 1);
  }
  const selected = patterns[0];
  return { value: packageMap[selected.key], wildcard: selected.wildcard, request };
}

function isPackageSubpathMap(packageExports) {
  return packageExports && typeof packageExports === "object" && !Array.isArray(packageExports) &&
    Object.keys(packageExports).some((key) => key.startsWith("."));
}

function resolvePackageTarget(workspaceRoot, packageContext, match, field, seen) {
  const targets = collectPackageTargetStrings(match.value);
  if (targets.length === 0) {
    const label = field === "imports" ? "package alias" : "self-package reference";
    throw proofError(`implementation ${label} is unresolved: ${match.request}`, 1);
  }
  const resolved = [];
  for (const rawTarget of targets) {
    const target = match.wildcard === null ? rawTarget : rawTarget.replaceAll("*", match.wildcard);
    if (target.includes("*")) throw proofError(`implementation package target is unresolved: ${target}`, 1);
    if (field === "imports" && target.startsWith("#")) {
      resolved.push(...resolvePackageImportsAlias(workspaceRoot, packageContext, target, new Set(seen)));
      continue;
    }
    if (!target.startsWith("./") || target.includes("\\") ||
        target.slice(2).split("/").some((segment) => !segment || segment === "." || segment === "..")) {
      throw proofError(`implementation package target must resolve locally: ${target}`, 1);
    }
    const absolutePath = path.resolve(workspaceRoot, stripModuleSpecifierSuffix(target));
    assertImplementationPathContained(workspaceRoot, absolutePath, `${field}:${match.request} -> ${target}`);
    resolved.push(absolutePath);
  }
  return [...new Set(resolved)].sort();
}

function collectPackageTargetStrings(value) {
  if (typeof value === "string") return [value];
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(collectPackageTargetStrings);
  if (typeof value === "object") return Object.values(value).flatMap(collectPackageTargetStrings);
  throw proofError("implementation package target has an unsupported value", 1);
}

function stripModuleSpecifierSuffix(specifier) {
  return specifier.split(/[?#]/, 1)[0];
}

function isNodeBuiltinSpecifier(specifier) {
  const normalized = specifier.startsWith("node:") ? specifier.slice("node:".length) : specifier;
  return NODE_BUILTIN_SPECIFIERS.has(normalized);
}

function externalPackageName(specifier) {
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) return parts.length >= 2 && parts[0].length > 1 && parts[1].length > 0 ? `${parts[0]}/${parts[1]}` : null;
  return parts[0] || null;
}

function assertImplementationPathContained(workspaceRoot, candidatePath, label) {
  const relative = path.relative(workspaceRoot, candidatePath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw proofError(`implementation import leaves the workspace: ${label}`, 1);
  }
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
    const boundaryValidators = {
      receipt: validators.get("catalog-boundary-receipt.v0"),
      governedCatalog: validators.get("runtime-catalog.v0")
    };
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
    const artifactValues = new Map();
    for (const ref of evidence.artifacts) {
      if (ref.path === `${ARTIFACT_ROOT}/evidence.json`) continue;
      const value = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== sha256Hex(canonicalJson(value))) return "EVIDENCE_HASH_MISMATCH";
      assertSchema(validators, ref.schemaId, value, ref.path);
      artifactValues.set(ref.path, value);
    }
    for (const ref of [...evidence.implementationRefs, ...evidence.sourceRefs]) {
      if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "EVIDENCE_HASH_MISMATCH";
    }
    const reportArtifact = evidence.artifacts.find((ref) => ref.path === evidence.reportRef.path);
    if (!reportArtifact || canonicalJson(reportArtifact) !== canonicalJson(evidence.reportRef)) return "EVIDENCE_HASH_MISMATCH";
    const report = artifactValues.get(evidence.reportRef.path);
    assertSchema(validators, "design-system-compiler-report.v0", report, evidence.reportRef.path);
    const manifest = await readJson(path.join(cwd, MANIFEST_PATH));
    assertSchema(validators, "design-system-compiler-manifest.v0", manifest, MANIFEST_PATH);
    const expectedPaths = expectedArtifactPaths(manifest);
    if (canonicalJson(nonSelfArtifactPaths) !== canonicalJson(expectedPaths)) return "EVIDENCE_HASH_MISMATCH";
    if (report.manifestPath !== MANIFEST_PATH || report.runId !== evidence.runId ||
        report.status !== evidence.status || report.promotionStatus !== evidence.promotionStatus) {
      return "EVIDENCE_HASH_MISMATCH";
    }

    const kernelImplementationHash = (await transitiveLocalImplementationClosure(cwd, KERNEL_ENTRY_PATH)).hash;
    const consumerImplementationHash = (await transitiveLocalImplementationClosure(cwd, CONSUMER_ENTRY_PATH)).hash;
    if (canonicalJson(report.kernel) !== canonicalJson({ ...DESIGN_SYSTEM_KERNEL, implementationHash: kernelImplementationHash }) ||
        canonicalJson(report.consumer) !== canonicalJson({ ...CATALOG_CONSUMER, implementationHash: consumerImplementationHash })) {
      return "EVIDENCE_HASH_MISMATCH";
    }

    const evidenceArtifactRefs = new Map(evidence.artifacts.map((ref) => [ref.path, ref]));
    const expectedSourcePaths = new Set([MANIFEST_PATH, ...manifest.mutationFixtures]);
    const expectedAdapterRuns = [];
    const consumerDiagnostics = [];
    if (report.adapterRuns.length !== manifest.adapters.length) return "EVIDENCE_HASH_MISMATCH";
    for (let index = 0; index < manifest.adapters.length; index += 1) {
      const entry = manifest.adapters[index];
      expectedSourcePaths.add(entry.adapterPath);
      const adapter = await readJson(path.join(cwd, entry.adapterPath));
      assertSchema(validators, "design-system-adapter.v0", adapter, entry.adapterPath);
      assertAdapterPaths(adapter, entry);
      expectedSourcePaths.add(adapter.sourceLockPath);
      const sourceLock = await readJson(path.join(cwd, adapter.sourceLockPath));
      assertSchema(validators, "portable-design-source-lock.v0", sourceLock, adapter.sourceLockPath);
      for (const file of sourceLock.files) expectedSourcePaths.add(`${entry.sourceRoot}/${file.path}`);
      for (const fixturePath of Object.values(adapter.consumerFixtures)) expectedSourcePaths.add(fixturePath);

      const componentIds = adapter.normalizedExtract.components.map((component) => component.id).sort();
      if (entry.outputKey !== adapter.adapterId || canonicalJson(entry.expectedComponentIds) !== canonicalJson(componentIds)) {
        return "EVIDENCE_HASH_MISMATCH";
      }
      const run = report.adapterRuns[index];
      const adapterOut = `${ARTIFACT_ROOT}/${entry.outputKey}`;
      const artifactSpecs = [
        ["extractRef", `${adapterOut}/extract.json`, "extract.v0"],
        ["catalogRef", `${adapterOut}/catalog.json`, "runtime-catalog.v0"],
        ["governedCatalogRef", `${adapterOut}/governed-catalog.json`, "runtime-catalog.v0"],
        ["receiptRef", `${adapterOut}/boundary-receipt.json`, "catalog-boundary-receipt.v0"],
        ["projectionRef", `${adapterOut}/runtime-projection.json`, "catalog-runtime-projection.v0"],
        ["consumerReportRef", `${adapterOut}/consumer-report.json`, "catalog-consumer-report.v0"]
      ];
      for (const [field, artifactPath, schemaId] of artifactSpecs) {
        const value = artifactValues.get(artifactPath);
        const expectedRef = value && canonicalArtifactRef(artifactPath, schemaId, value);
        if (!expectedRef || canonicalJson(run[field]) !== canonicalJson(expectedRef) ||
            canonicalJson(evidenceArtifactRefs.get(artifactPath)) !== canonicalJson(expectedRef)) {
          return "EVIDENCE_HASH_MISMATCH";
        }
      }
      const renderPath = `${adapterOut}/render-plan.json`;
      const renderPlan = artifactValues.get(renderPath);
      const expectedRenderRefs = renderPlan ? [canonicalArtifactRef(renderPath, "catalog-render-plan.v0", renderPlan)] : [];
      if (canonicalJson(run.renderPlanRefs) !== canonicalJson(expectedRenderRefs) ||
          expectedRenderRefs.some((ref) => canonicalJson(evidenceArtifactRefs.get(ref.path)) !== canonicalJson(ref))) {
        return "EVIDENCE_HASH_MISMATCH";
      }

      const sourceLockRef = jsonInputRef(adapter.sourceLockPath, "portable-design-source-lock.v0", sourceLock);
      const adapterRef = jsonInputRef(entry.adapterPath, "design-system-adapter.v0", adapter);
      const receipt = artifactValues.get(`${adapterOut}/boundary-receipt.json`);
      const projection = artifactValues.get(`${adapterOut}/runtime-projection.json`);
      const consumerReport = artifactValues.get(`${adapterOut}/consumer-report.json`);
      const governedCatalog = artifactValues.get(`${adapterOut}/governed-catalog.json`);
      if (!receipt || !projection || !consumerReport || !governedCatalog) return "EVIDENCE_HASH_MISMATCH";
      assertCatalogReleaseReceipt({
        adapterId: adapter.adapterId,
        receipt,
        receiptRef: run.receiptRef,
        governedCatalog,
        governedCatalogRef: run.governedCatalogRef,
        validators: boundaryValidators
      });
      if (canonicalJson(receipt.sourceLockRef) !== canonicalJson(sourceLockRef) ||
          canonicalJson(receipt.adapterRef) !== canonicalJson(adapterRef) ||
          canonicalJson(receipt.extractRef) !== canonicalJson(run.extractRef) ||
          canonicalJson(receipt.catalogRef) !== canonicalJson(run.catalogRef) ||
          canonicalJson(receipt.governedCatalogRef) !== canonicalJson(run.governedCatalogRef) ||
          canonicalJson(receipt.compiler) !== canonicalJson({ ...DESIGN_SYSTEM_KERNEL, implementationHash: kernelImplementationHash }) ||
          receipt.adapterId !== adapter.adapterId || receipt.status !== "pass" ||
          receipt.promotionStatus !== adapter.governance.promotionStatus) {
        return "EVIDENCE_HASH_MISMATCH";
      }
      if (projection.adapterId !== adapter.adapterId || canonicalJson(projection.receiptRef) !== canonicalJson(run.receiptRef) ||
          canonicalJson(projection.catalogRef) !== canonicalJson(run.governedCatalogRef) ||
          projection.provenance?.implementationHash !== consumerImplementationHash ||
          canonicalJson(Object.keys(projection.components).sort()) !== canonicalJson(componentIds) ||
          canonicalJson(projection.components) !== canonicalJson(governedCatalog.components) ||
          canonicalJson(projection.tokens) !== canonicalJson(governedCatalog.tokens) ||
          canonicalJson(projection.runtimeCapabilities) !== canonicalJson(governedCatalog.runtimeCapabilities) ||
          canonicalJson(projection.governance) !== canonicalJson(governedCatalog.governance)) {
        return "EVIDENCE_HASH_MISMATCH";
      }
      if (consumerReport.adapterId !== adapter.adapterId || consumerReport.status !== "pass" ||
          consumerReport.promotionStatus !== adapter.governance.promotionStatus ||
          canonicalJson(consumerReport.receiptRef) !== canonicalJson(run.receiptRef) ||
          canonicalJson(consumerReport.projectionRef) !== canonicalJson(run.projectionRef) ||
          canonicalJson(consumerReport.renderPlans) !== canonicalJson(expectedRenderRefs) ||
          consumerReport.results.some((result) => result.matched !== true)) {
        return "EVIDENCE_HASH_MISMATCH";
      }
      consumerDiagnostics.push(...consumerReport.diagnostics);

      const expectedRun = {
        ...run,
        adapterId: adapter.adapterId,
        sourceFamily: adapter.sourceFamily,
        sourceId: sourceLock.sourceId,
        packageIdentity: `${sourceLock.acquisition.packageName}@${sourceLock.acquisition.packageVersion}`,
        upstreamRepository: sourceLock.acquisition.upstreamRepository,
        componentIds,
        status: consumerReport.status,
        promotionStatus: consumerReport.promotionStatus,
        sourceLockRef,
        adapterRef,
        kernelImplementationHash,
        consumerImplementationHash,
        consumerResults: consumerReport.results.length,
        matchedConsumerResults: consumerReport.results.filter((result) => result.matched).length
      };
      if (canonicalJson(run) !== canonicalJson(expectedRun)) return "EVIDENCE_HASH_MISMATCH";
      expectedAdapterRuns.push(expectedRun);
    }

    const sourceSpecificImplementationModules = await sourceSpecificImplementationModulesFromInventory(cwd, expectedAdapterRuns);
    const expectedReuseProof = buildReuseProof(expectedAdapterRuns, sourceSpecificImplementationModules);
    if (canonicalJson(report.reuseProof) !== canonicalJson(expectedReuseProof)) return "EVIDENCE_HASH_MISMATCH";
    const expectedMutationResults = [];
    for (const mutationPath of manifest.mutationFixtures) {
      const mutation = await readJson(path.join(cwd, mutationPath));
      assertSchema(validators, "design-system-compiler-mutation.v0", mutation, mutationPath);
      expectedMutationResults.push({
        mutationPath,
        mutationId: mutation.mutationId,
        expectedCode: mutation.expectedCode,
        actualCode: mutation.expectedCode,
        matched: true
      });
    }
    if (canonicalJson(report.mutationResults) !== canonicalJson(expectedMutationResults) ||
        canonicalJson(report.diagnostics) !== canonicalJson(sortDiagnostics(consumerDiagnostics)) ||
        canonicalJson(evidence.diagnostics) !== canonicalJson(report.diagnostics)) {
      return "EVIDENCE_HASH_MISMATCH";
    }
    if (canonicalJson(evidence.sourceRefs.map((ref) => ref.path)) !== canonicalJson([...expectedSourcePaths].sort())) return "EVIDENCE_HASH_MISMATCH";

    const expectedRunId = computeCompilerRunId({
      manifestHash: sha256Hex(canonicalJson(manifest)),
      kernelImplementationHash,
      consumerImplementationHash,
      implementationClosureHash: sha256Hex(canonicalJson(evidence.implementationRefs)),
      sourceClosureHash: sha256Hex(canonicalJson(evidence.sourceRefs)),
      adapterRuns: expectedAdapterRuns,
      mutationResults: expectedMutationResults,
      reuseProof: expectedReuseProof
    });
    if (report.runId !== expectedRunId || evidence.runId !== expectedRunId) return "EVIDENCE_HASH_MISMATCH";
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

export function computeCompilerRunId({
  manifestHash,
  kernelImplementationHash,
  consumerImplementationHash,
  implementationClosureHash,
  sourceClosureHash,
  adapterRuns,
  mutationResults,
  reuseProof
}) {
  return `design-system-compiler-${sha256Hex(canonicalJson({
    manifestHash,
    kernelImplementationHash,
    consumerImplementationHash,
    implementationClosureHash,
    sourceClosureHash,
    adapterRuns,
    mutationResults,
    reuseProof
  })).slice(0, 16)}`;
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
  computeCompilerRunId,
  computeEvidenceSelfHash,
  expectedArtifactPaths,
  firstEvidenceIntegrityFailureCode,
  firstReuseIdentityFailureCode,
  findSourceSpecificImplementationModules,
  sourceSpecificImplementationModulesFromInventory,
  transitiveLocalImplementationClosure,
  transitiveLocalImplementationClosureHash,
  parseArgs
});
