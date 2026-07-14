import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import { p3Internals } from "../src/p3-proof.js";
import { surfaceopsKanbanLiveInternals } from "../src/surfaceops-kanban-live-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p3EvidencePath = path.join(root, "artifacts/p3/evidence.json");
const apiManifestPath = path.join(root, "sources/surfaceops-kanban-live/kanban-cards-api-manifest.json");

test("SurfaceOps kanban live proof emits passing self-hashed evidence", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-kanban-live/evidence.json");
  const report = await readJson("artifacts/surfaceops-kanban-live/surfaceops-kanban-live-adapter-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 22);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/surfaceops-kanban-live/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-target-selection.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-api-projection.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-handoff-record.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-adapter-report.json",
    "artifacts/surfaceops-kanban-live/evidence.json"
  ]);
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "sources/surfaceops-kanban-live/kanban-cards-api-manifest.json"));
  assert.equal(report.apiPreflight.localOnly, true);
  assert.ok(report.apiPreflight.deniedEndpoints.includes("PUT /api/state"));
});

test("SurfaceOps kanban live operation plan uses real API scope without making kanban authority", async () => {
  await runProof();
  const targetSelection = await readJson("artifacts/surfaceops-kanban-live/surfaceops-kanban-live-target-selection.json");
  const apiProjection = await readJson("artifacts/surfaceops-kanban-live/surfaceops-kanban-live-api-projection.json");
  const operationPlan = await readJson("artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json");
  const handoff = await readJson("artifacts/surfaceops-kanban-live/surfaceops-kanban-live-handoff-record.json");

  assert.equal(targetSelection.targetId, "surfaceops-kanban-live");
  assert.equal(targetSelection.claimStatus, "local_live_functional_proof");
  assert.equal(targetSelection.boardScope.strategy, "create-dedicated-board");
  assert.equal(targetSelection.authModel.browserBearerTokensAllowed, false);

  assert.equal(apiProjection.firstProofEnvironment.productionMutationAllowed, false);
  assert.ok(apiProjection.endpoints.some((endpoint) => endpoint.method === "GET" && endpoint.path === "/api/events"));
  assert.ok(apiProjection.unsupportedCapabilities.includes("upstream-idempotency-key"));
  assert.equal(apiProjection.authority.kanbanCardsOwnsSurfaceOpsDecisions, false);
  assert.equal(apiProjection.authority.surfacesEvidenceRemainsProofAuthority, true);

  assert.equal(operationPlan.adapterMode, "surfaceops-backend-adapter");
  assert.equal(operationPlan.mappingStore.owner, "SurfaceOps");
  assert.equal(operationPlan.mappingStore.implementedInThisProof, false);
  assert.ok(operationPlan.mappingStore.plannedStoreShape.includes("kanban_card_bindings"));
  assert.equal(operationPlan.mappingStore.cardTextIsAuthority, false);
  assert.equal(operationPlan.conflictPolicy.silentOverwriteAllowed, false);
  assert.ok(operationPlan.operations.some((operation) => operation.endpoint === "/api/events"));
  assert.ok(operationPlan.operations.some((operation) => operation.operationId === "whole-state-shortcut-denied" && operation.endpoint === "/api/state"));
  assert.ok(operationPlan.operations.some((operation) => operation.operationId === "adapter-marker-reconcile"));
  assert.equal(operationPlan.operations.some((operation) => operation.operationId === "conflict-detected"), false);
  assert.ok(operationPlan.operations.every((operation) => operation.redacted === true));
  assert.ok(operationPlan.operations.every((operation) => operation.idempotencyKey.includes("{{evidenceHash}}")));

  assert.equal(handoff.boundary.liveKanbanCardsApi, true);
  assert.equal(handoff.boundary.modifiesKanbanCardsSource, false);
  assert.equal(handoff.boundary.liveSurfaceOpsProduct, false);
  assert.equal(handoff.boundary.liveJudgmentKit, false);
  assert.equal(handoff.boundary.workExecution, false);
  assert.equal(handoff.handoffEligibility.browserFunctionalProof, "required");
});

test("SurfaceOps kanban live fixtures cover authority, security, permission, idempotency, and review boundaries", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-kanban-live/evidence.json");
  const resultByFixture = new Map(evidence.validationResults.map((row) => [row.fixturePath, row]));

  assert.ok(resultByFixture.get("fixtures/surfaceops-kanban-live/invalid/authority-override.surfaceops-kanban-live.json").diagnosticCodes.includes("SURFACEOPS_KANBAN_LIVE_AUTHORITY_OVERRIDE"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-kanban-live/invalid/secret-leak.surfaceops-kanban-live.json").diagnosticCodes.includes("SURFACEOPS_KANBAN_LIVE_SECRET_LEAK"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-kanban-live/invalid/permission-bypass.surfaceops-kanban-live.json").diagnosticCodes.includes("SURFACEOPS_KANBAN_LIVE_PERMISSION_BYPASS"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-kanban-live/invalid/idempotency-missing.surfaceops-kanban-live.json").diagnosticCodes.includes("SURFACEOPS_KANBAN_LIVE_IDEMPOTENCY_REQUIRED"));
  assert.equal(resultByFixture.get("fixtures/surfaceops-kanban-live/review/lane-move-signal-requires-decision.surfaceops-kanban-live.json").actualResult, "review_required");
  assert.equal(resultByFixture.get("fixtures/surfaceops-kanban-live/review/lane-move-signal-requires-decision.surfaceops-kanban-live.json").promotionStatus, "review_required");
});

test("SurfaceOps kanban live preflight rejects failing P3 evidence and API manifest drift", async () => {
  await runProof();
  const snapshots = await snapshotArtifacts();

  await withJsonFileMutations([
    {
      absolutePath: p3EvidencePath,
      mutate(evidence) {
        evidence.status = "fail";
        evidence.artifacts[evidence.artifacts.length - 1].hash = p3Internals.computeEvidenceSelfHash(evidence);
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /upstream P3 evidence is missing or not passing/);
    await assertArtifactsUnchanged(snapshots);
  });

  await withJsonFileMutations([
    {
      absolutePath: apiManifestPath,
      mutate(manifest) {
        manifest.authority.kanbanCardsOwnsSurfaceOpsDecisions = true;
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /API manifest hash does not match/);
    await assertArtifactsUnchanged(snapshots);
  });
});

test("SurfaceOps kanban live schema ids and package wiring are present", async () => {
  await runProof();
  const selectionSchema = await readJson("schemas/surfaceops-kanban-live-target-selection.v0.schema.json");
  const evidenceSchema = await readJson("schemas/surfaceops-kanban-live-evidence.v0.schema.json");
  const browserEvidenceSchema = await readJson("schemas/surfaceops-kanban-live-browser-functional-evidence.v0.schema.json");
  const pkg = await readJson("package.json");

  assert.equal(selectionSchema.properties.schemaId.const, "surfaceops-kanban-live-target-selection.v0");
  assert.equal(evidenceSchema.properties.schemaId.const, "surfaceops-kanban-live-evidence.v0");
  assert.equal(browserEvidenceSchema.properties.schemaId.const, "surfaceops-kanban-live-browser-functional-evidence.v0");
  assert.match(pkg.scripts["proof:surfaceops-kanban-live"], /surfaceops-kanban-live proof/);
  assert.match(pkg.scripts["proof:surfaceops-kanban-live:browser"], /prove-surfaceops-kanban-live-browser/);
  assert.match(pkg.scripts["check:surfaceops-kanban-live:ci"], /check:p4:ci/);

  const browserProofScript = await fs.readFile("scripts/prove-surfaceops-kanban-live-browser.mjs", "utf8");
  assert.doesNotMatch(browserProofScript, /upstreamWorkspace: "\/Users\/mike\/kanban\.cards"/);
  assert.match(browserProofScript, /KL_KANBAN_CARDS_COMMIT/);
  assert.match(browserProofScript, /whole-state-shortcut-denied/);
});

async function runProof() {
  await execFileAsync("node", [
    "bin/interfacectl.js",
    "surfaces",
    "surfaceops-kanban-live",
    "proof",
    "--orchestration-evidence",
    "artifacts/p3/evidence.json",
    "--review-queue",
    "artifacts/p3/review-queue.json",
    "--orchestration-report",
    "artifacts/p3/agent-orchestration-report.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--review-report",
    "artifacts/p4/review-judgment-report.json",
    "--evaluation-report",
    "artifacts/p4/judgmentkit-evaluation-report.json",
    "--kanban-api-manifest",
    "sources/surfaceops-kanban-live/kanban-cards-api-manifest.json",
    "--fixture",
    "fixtures/surfaceops-kanban-live",
    "--out",
    "artifacts/surfaceops-kanban-live"
  ], { cwd: root });
}

async function runProofExpectFailure() {
  try {
    await runProof();
    return { code: 0, stdout: "", stderr: "" };
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error)
    };
  }
}

async function snapshotArtifacts() {
  const paths = [
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-target-selection.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-api-projection.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-handoff-record.json",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-adapter-report.json",
    "artifacts/surfaceops-kanban-live/evidence.json"
  ];
  const snapshot = new Map();
  for (const relativePath of paths) {
    snapshot.set(relativePath, await fs.readFile(path.join(root, relativePath), "utf8"));
  }
  return snapshot;
}

async function assertArtifactsUnchanged(snapshot) {
  for (const [relativePath, expected] of snapshot.entries()) {
    assert.equal(await fs.readFile(path.join(root, relativePath), "utf8"), expected);
  }
}

async function withJsonFileMutations(mutations, fn) {
  const originals = [];
  for (const mutation of mutations) {
    const raw = await fs.readFile(mutation.absolutePath, "utf8");
    originals.push({ path: mutation.absolutePath, raw });
    const data = JSON.parse(raw);
    mutation.mutate(data);
    await fs.writeFile(mutation.absolutePath, canonicalJson(data));
  }
  try {
    await fn();
  } finally {
    for (const original of originals.reverse()) {
      await fs.writeFile(original.path, original.raw);
    }
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}
