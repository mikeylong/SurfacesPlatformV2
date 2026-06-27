import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { p2Internals } from "../src/p2-proof.js";
import { p3Internals } from "../src/p3-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p2EvidencePath = path.join(root, "artifacts/p2/evidence.json");
const p2CatalogPath = path.join(root, "artifacts/p2/governed-catalog.json");
const p3StalePath = path.join(root, "artifacts/p3/stale.tmp");

test("P3 agents proof emits passing evidence with final self-hash", async () => {
  await runP3Proof();
  const evidence = await readJson("artifacts/p3/evidence.json");
  const plan = await readJson("artifacts/p3/orchestration-plan.json");
  const reviewQueue = await readJson("artifacts/p3/review-queue.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 24);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/p3/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, p3Internals.computeEvidenceSelfHash(evidence));
  assert.equal(plan.reviewQueueRef.path, "artifacts/p3/review-queue.json");
  assert.equal(Object.hasOwn(plan.reviewQueueRef, "hash"), false);
  assert.equal(reviewQueue.orchestrationPlanRef.hash, evidence.artifacts.find((entry) => entry.path === "artifacts/p3/orchestration-plan.json").hash);
});

test("P3 blocked review policy remains blocked and emits no work order", async () => {
  await runP3Proof();
  const evidence = await readJson("artifacts/p3/evidence.json");
  const report = await readJson("artifacts/p3/agent-orchestration-report.json");
  const plan = await readJson("artifacts/p3/orchestration-plan.json");

  const result = evidence.validationResults.find((row) => row.fixturePath === "fixtures/p3/invalid/blocked-review-policy.agent-task.json");
  assert.ok(result, "expected blocked review-policy fixture result");
  assert.equal(result.actualResult, "invalid");
  assert.equal(result.promotionStatus, "blocked");
  assert.deepEqual(result.diagnosticCodes, ["AGENT_REVIEW_POLICY_BLOCKED"]);
  assert.equal(result.workOrderPath, null);
  assert.equal(result.reviewQueuePath, null);
  assert.equal(plan.tasks.some((task) => task.taskId === "blocked-review-policy"), false);
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "AGENT_REVIEW_POLICY_BLOCKED"));
});

test("P3 evidence refs carry deterministic provenance required by schema", async () => {
  await runP3Proof();
  const evidence = await readJson("artifacts/p3/evidence.json");

  for (const ref of [
    ...evidence.schemaClosure,
    ...evidence.fixtureRefs,
    ...evidence.boundaryRefs,
    ...evidence.artifacts
  ]) {
    assert.equal(ref.provenance?.generatedAt, "1970-01-01T00:00:00.000Z");
    assert.equal(ref.provenance?.generator, "interfacectl-p3-evidence");
    assert.ok(ref.provenance?.sourceRefs?.includes(`artifact://${ref.path}`));
  }

  const ajv = await loadP3Ajv();
  const validate = ajv.getSchema("https://surfaces.dev/schemas/p3/agent-orchestration-evidence.v0.schema.json");
  assert.ok(validate, "expected P3 evidence schema to be loaded");
  const tampered = structuredClone(evidence);
  delete tampered.boundaryRefs[0].provenance;
  tampered.artifacts[tampered.artifacts.length - 1].hash = p3Internals.computeEvidenceSelfHash(tampered);
  assert.equal(validate(tampered), false);
});

test("P3 work orders remain inert and review work has no work order", async () => {
  await runP3Proof();
  const workOrders = await Promise.all([
    readJson("artifacts/p3/work-order.contract-architect.json"),
    readJson("artifacts/p3/work-order.fixture-author.json"),
    readJson("artifacts/p3/work-order.evidence-reviewer.json")
  ]);
  const reviewQueue = await readJson("artifacts/p3/review-queue.json");

  for (const workOrder of workOrders) {
    assert.equal(workOrder.nonExecutable, true);
    assert.equal(workOrder.execution.authorized, false);
    assert.deepEqual(workOrder.execution.shellCommands, []);
    assert.deepEqual(workOrder.execution.toolCalls, []);
    assert.deepEqual(workOrder.execution.connectorCalls, []);
    assert.deepEqual(workOrder.execution.networkCalls, []);
    assert.deepEqual(workOrder.execution.fileEdits, []);
    assert.deepEqual(workOrder.execution.secrets, []);
    assert.deepEqual(workOrder.execution.callbacks, []);
  }
  assert.equal(reviewQueue.items.length, 1);
  assert.equal(reviewQueue.items[0].workOrderRef, null);
  assert.equal(reviewQueue.items[0].nonExecutable, true);
});

test("P3 work orders use registry-resolved input and output scope", async () => {
  await runP3Proof();
  const registry = await readJson("artifacts/p3/agent-capability-registry.json");
  const workOrders = await Promise.all([
    readJson("artifacts/p3/work-order.contract-architect.json"),
    readJson("artifacts/p3/work-order.fixture-author.json"),
    readJson("artifacts/p3/work-order.evidence-reviewer.json")
  ]);

  for (const workOrder of workOrders) {
    const agent = registry.agents[workOrder.agentId];
    assert.ok(agent, `registered agent missing for ${workOrder.agentId}`);
    for (const input of workOrder.allowedInputs) {
      assert.ok(agent.allowedInputs.includes(input.path), `${input.path} is outside agent input scope`);
    }
    for (const output of workOrder.allowedOutputs) {
      assert.ok(agent.allowedOutputs.includes(output.path), `${output.path} is outside agent output scope`);
      for (const capabilityId of workOrder.capabilityIds) {
        assert.ok(registry.capabilities[capabilityId].allowedOutputPaths.includes(output.path), `${output.path} is outside capability output scope`);
      }
    }
  }
});

test("P3 agents proof rejects stale unexpected output before writing", async () => {
  await fs.writeFile(p3StalePath, "stale");
  try {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(p3StalePath, { force: true });
  }
});

test("P3 agents proof rejects non-normalized command paths", async () => {
  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "agents",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/../p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/p3",
    "--out",
    "artifacts/p3"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("P3 agents proof rejects task output outside selected registry scope", async () => {
  await withJsonFileMutations([
    {
      relativePath: "fixtures/p3/valid/runtime-adapter-plan.agent-task.json",
      mutate(task) {
        task.allowedOutputs[0].path = "artifacts/p3/work-order.contract-architect-extra.json";
      }
    }
  ], async () => {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /AGENT_SCOPE_ESCALATION/);
  });
});

test("P3 agents proof rejects schema-invalid task fixtures before recruitment", async () => {
  await withJsonFileMutations([
    {
      relativePath: "fixtures/p3/valid/runtime-adapter-plan.agent-task.json",
      mutate(task) {
        task.liveExecutor = { callback: "https://example.invalid/live" };
      }
    }
  ], async () => {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed for fixtures\/p3\/valid\/runtime-adapter-plan\.agent-task\.json/);
  });
});

test("P3 agents proof rejects cross-task dependency cycles", async () => {
  await withJsonFileMutations([
    {
      relativePath: "fixtures/p3/valid/fixture-authoring.agent-task.json",
      mutate(task) {
        task.dependencies = [{ dependencyType: "task", ref: "evidence-review" }];
      }
    },
    {
      relativePath: "fixtures/p3/valid/evidence-review.agent-task.json",
      mutate(task) {
        task.dependencies = [{ dependencyType: "task", ref: "fixture-authoring" }];
      }
    }
  ], async () => {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /AGENT_DEPENDENCY_CYCLE/);
  });
});

test("P3 upstream preflight rejects failing P2 evidence before orchestration", async () => {
  const original = await fs.readFile(p2EvidencePath, "utf8");
  const evidence = JSON.parse(original);
  evidence.status = "fail";
  evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = p2Internals.computeEvidenceSelfHash(evidence);
  await fs.writeFile(p2EvidencePath, canonicalJson(evidence));
  try {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream evidence status is not pass/);
  } finally {
    await fs.writeFile(p2EvidencePath, original);
  }
});

test("P3 upstream preflight rejects missing P2 evidence before orchestration", async () => {
  const original = await fs.readFile(p2EvidencePath, "utf8");
  await fs.rm(p2EvidencePath, { force: true });
  try {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream evidence input is missing/);
  } finally {
    await fs.writeFile(p2EvidencePath, original);
  }
});

test("P3 upstream preflight rejects P2 catalog hash mismatch before orchestration", async () => {
  const original = await fs.readFile(p2CatalogPath, "utf8");
  const catalog = JSON.parse(original);
  catalog.version = "0.0.1";
  await fs.writeFile(p2CatalogPath, canonicalJson(catalog));
  try {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream catalog hash does not match the accepted boundary/);
  } finally {
    await fs.writeFile(p2CatalogPath, original);
  }
});

test("P3 upstream preflight rejects stale P2 catalog refs before orchestration", async () => {
  const original = await fs.readFile(p2EvidencePath, "utf8");
  const evidence = JSON.parse(original);
  const catalogRef = evidence.artifactRefs.find((entry) => entry.path === "artifacts/p2/governed-catalog.json");
  assert.ok(catalogRef, "expected P2 governed catalog ref");
  catalogRef.path = "artifacts/p2/stale-governed-catalog.json";
  await fs.writeFile(p2EvidencePath, canonicalJson(evidence));
  try {
    const result = await runP3ProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must contain exactly one ref for artifacts\/p2\/governed-catalog\.json/);
  } finally {
    await fs.writeFile(p2EvidencePath, original);
  }
});

test("P3 registry fixture schema is present and closed", async () => {
  const schema = await readJson("schemas/agent-capability-registry-fixture.v0.schema.json");
  const fixture = await readJson("fixtures/p3/agent-capability-registry.fixture.json");
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  const validate = ajv.compile(schema);

  assert.equal(validate(fixture), true);
  const tampered = structuredClone(fixture);
  tampered.liveExecutor = { callback: "https://example.invalid/live" };
  assert.equal(validate(tampered), false);
});

test("P3 preflight mutation schema is present and closed", async () => {
  const schema = await readJson("schemas/agent-preflight-mutation.v0.schema.json");
  const fixtures = {
    missing: await readJson("fixtures/p3/mutations/missing-upstream-evidence.agent-preflight.json"),
    status: await readJson("fixtures/p3/mutations/failing-upstream-evidence.agent-preflight.json"),
    hashMismatch: await readJson("fixtures/p3/mutations/upstream-evidence-hash-mismatch.agent-preflight.json"),
    stale: await readJson("fixtures/p3/mutations/stale-upstream-evidence.agent-preflight.json")
  };
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  const validate = ajv.compile(schema);

  for (const fixture of Object.values(fixtures)) {
    assert.equal(validate(fixture), true);
  }
  const tampered = structuredClone(fixtures.missing);
  tampered.liveExecutor = { callback: "https://example.invalid/live" };
  assert.equal(validate(tampered), false);

  const missingWithBoundary = structuredClone(fixtures.missing);
  missingWithBoundary.boundaryRefs = fixtures.hashMismatch.boundaryRefs;
  assert.equal(validate(missingWithBoundary), false);

  const statusWithBoundary = structuredClone(fixtures.status);
  statusWithBoundary.boundaryRefs = fixtures.hashMismatch.boundaryRefs;
  assert.equal(validate(statusWithBoundary), false);

  const mismatchWithEvidenceRef = structuredClone(fixtures.hashMismatch);
  mismatchWithEvidenceRef.ingestionEvidenceRef = fixtures.status.ingestionEvidenceRef;
  assert.equal(validate(mismatchWithEvidenceRef), false);

  const staleWithStatus = structuredClone(fixtures.stale);
  staleWithStatus.status = "fail";
  assert.equal(validate(staleWithStatus), false);

  const mismatchWithWrongBoundary = structuredClone(fixtures.hashMismatch);
  mismatchWithWrongBoundary.boundaryRefs[0].path = "artifacts/p2/evidence.json";
  assert.equal(validate(mismatchWithWrongBoundary), false);
  assert.equal(p3Internals.preflightFixtureMatchesDiagnostic("AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH", mismatchWithWrongBoundary), false);
  assert.equal(p3Internals.preflightFixtureMatchesDiagnostic("AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH", fixtures.hashMismatch), true);
});

test("P3 evidence integrity detects schema, fixture, upstream, artifact, and self-hash tampering", async () => {
  await runP3Proof();
  const evidence = await readJson("artifacts/p3/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await p3Internals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "AGENT_EVIDENCE_HASH_MISMATCH");

  const fixtureTamper = structuredClone(evidence);
  fixtureTamper.fixtureRefs[0].hash = "0".repeat(64);
  assert.equal(await p3Internals.firstEvidenceIntegrityFailureCode(root, fixtureTamper), "AGENT_EVIDENCE_HASH_MISMATCH");

  const upstreamTamper = structuredClone(evidence);
  upstreamTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(await p3Internals.firstEvidenceIntegrityFailureCode(root, upstreamTamper), "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(await p3Internals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "AGENT_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifacts[selfHashTamper.artifacts.length - 1].hash = "0".repeat(64);
  assert.equal(await p3Internals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "AGENT_EVIDENCE_HASH_MISMATCH");
});

async function runP3Proof() {
  await execFileAsync("node", [
    "bin/interfacectl.js",
    "surfaces",
    "agents",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/p3",
    "--out",
    "artifacts/p3"
  ], { cwd: root });
}

async function runP3ProofExpectFailure() {
  return runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "agents",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/p3",
    "--out",
    "artifacts/p3"
  ]);
}

async function runCommandExpectFailure(args) {
  try {
    await execFileAsync("node", args, { cwd: root });
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    };
  }
  assert.fail("expected command to fail");
}

async function withJsonFileMutations(mutations, fn) {
  const originals = [];
  for (const mutation of mutations) {
    const absolutePath = path.join(root, mutation.relativePath);
    const original = await fs.readFile(absolutePath, "utf8");
    originals.push({ absolutePath, original });
    const json = JSON.parse(original);
    mutation.mutate(json);
    await fs.writeFile(absolutePath, canonicalJson(json));
  }
  try {
    return await fn();
  } finally {
    await Promise.all(originals.map(({ absolutePath, original }) => fs.writeFile(absolutePath, original)));
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function loadP3Ajv() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  for (const schemaPath of [
    "schemas/agent-capability-registry-fixture.v0.schema.json",
    "schemas/agent-capability-registry.v0.schema.json",
    "schemas/agent-preflight-mutation.v0.schema.json",
    "schemas/agent-task.v0.schema.json",
    "schemas/agent-work-order.v0.schema.json",
    "schemas/agent-orchestration-plan.v0.schema.json",
    "schemas/agent-review-queue.v0.schema.json",
    "schemas/agent-orchestration-report.v0.schema.json",
    "schemas/agent-orchestration-diagnostics.v0.schema.json",
    "schemas/agent-orchestration-expectations.v0.schema.json",
    "schemas/agent-orchestration-evidence.v0.schema.json"
  ]) {
    ajv.addSchema(await readJson(schemaPath));
  }
  return ajv;
}
