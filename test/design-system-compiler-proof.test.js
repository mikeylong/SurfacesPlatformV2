import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../src/p0.js";
import {
  designSystemCompilerInternals,
  firstReuseIdentityFailureCode,
  firstEvidenceIntegrityFailureCode
} from "../src/design-system-compiler-proof.js";
import { evaluateConsumerFixture } from "../src/catalog-consumer-kernel.js";
import {
  DesignSystemKernelError,
  compileDesignSystemAdapter,
  findCatalogAuthorityEscalation,
  sha256Hex,
  verifyConservativePolicy,
  verifyLockedSource
} from "../src/design-system-ingestion-kernel.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(root, "artifacts/design-system-compiler");

test("generic compiler proof records two independent source families on one implementation closure", async () => {
  const report = await readJson(path.join(artifactRoot, "design-system-compiler-report.json"));
  assert.equal(report.status, "pass");
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(report.adapterRuns.length, 2);
  assert.equal(new Set(report.adapterRuns.map((run) => run.sourceFamily)).size, 2);
  assert.equal(report.reuseProof.sharedKernel, true);
  assert.equal(report.reuseProof.sharedConsumer, true);
  assert.deepEqual(report.reuseProof.sourceSpecificImplementationModules, []);
  assert.equal(new Set(report.reuseProof.kernelImplementationHashes).size, 1);
  assert.equal(new Set(report.reuseProof.consumerImplementationHashes).size, 1);
  assert.equal(new Set(report.reuseProof.sourceIds).size, 2);
  assert.equal(new Set(report.reuseProof.designSystemIdentities).size, 2);
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

async function readJson(absolutePath) {
  return JSON.parse(await fs.readFile(absolutePath, "utf8"));
}
