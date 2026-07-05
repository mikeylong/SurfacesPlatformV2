import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import { p3Internals } from "../src/p3-proof.js";
import { surfaceopsKanbanStaticInternals } from "../src/surfaceops-kanban-static-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const p3EvidencePath = path.join(root, "artifacts/p3/evidence.json");
const substratePath = path.join(root, "sources/surfaceops-kanban-static/kanban-board-substrate.json");
const stalePath = path.join(root, "artifacts/surfaceops-kanban-static/stale.tmp");

test("SurfaceOps kanban static proof emits passing self-hashed evidence", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-kanban-static/evidence.json");
  const report = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-adapter-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 32);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/surfaceops-kanban-static/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, surfaceopsKanbanStaticInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-target-selection.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-projection.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-designer-view-model.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.review-work.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.decisions.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-adapter-report.json",
    "artifacts/surfaceops-kanban-static/evidence.json"
  ]);
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "sources/surfaceops-kanban-static/kanban-substrate-manifest.json"));
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "sources/surfaceops-kanban-static/kanban-board-substrate.json"));
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
});

test("SurfaceOps kanban projection maps P3 review work to a static designer board", async () => {
  await runProof();
  const targetSelection = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-target-selection.json");
  const projection = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-board-projection.json");
  const viewModel = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-designer-view-model.json");

  assert.equal(targetSelection.targetId, "surfaceops-kanban-static");
  assert.equal(targetSelection.claimStatus, "proof_only");
  assert.deepEqual(targetSelection.boardScope.componentScope, []);
  assert.equal(targetSelection.capabilityScope.liveKanbanWrite, false);
  assert.equal(targetSelection.capabilityScope.liveSurfaceOpsWrite, false);
  assert.equal(targetSelection.capabilityScope.liveJudgmentKitCall, false);
  assert.equal(targetSelection.capabilityScope.execution, false);
  assert.equal(targetSelection.capabilityScope.networkCall, false);

  assert.deepEqual(projection.lanes.map((lane) => lane.laneId), ["allowed", "review-required", "blocked"]);
  assert.equal(projection.cards.length, 1);
  assert.equal(projection.cards[0].cardId, "card.review.review-required-work");
  assert.equal(projection.cards[0].laneId, "allowed");
  assert.equal(projection.cards[0].queuePromotionStatus, "review_required");
  assert.equal(projection.cards[0].decisionStatus, "approved");
  assert.equal(projection.cards[0].decisionPromotionStatus, "allowed");
  assert.equal(projection.cards[0].nonExecutable, true);
  assert.deepEqual(projection.cards[0].source.evidenceObligations, [
    "review-queue-row",
    "non-executable-status",
    "source-fixture-ref"
  ]);
  assert.equal(projection.cards[0].nextActionOwner.ownerRole, "surface-ops-reviewer");
  assert.equal(projection.cards[0].nextActionOwner.reviewerId, "surfaceops-reviewer");
  assert.deepEqual(projection.cards[0].nextActionOwner.selectedAgentIds, ["contract-architect"]);
  assert.equal(projection.authority.canOverrideAuthority, false);
  assert.equal(projection.authority.canExecuteWork, false);
  assert.equal(projection.authority.substrateAuthority, "kanban.cards constrains presentation only.");

  const decision = projection.annotations.find((annotation) => annotation.kind === "surfaceops-decision");
  const judgment = projection.annotations.find((annotation) => annotation.kind === "judgmentkit-quality-finding");
  assert.equal(decision.committed, true);
  assert.equal(decision.execution.authorized, false);
  assert.equal(judgment.committed, false);
  assert.equal(judgment.authority.executes, false);
  assert.equal(judgment.authority.promotes, false);

  assert.equal(viewModel.proofStatus.p3, "pass");
  assert.equal(viewModel.proofStatus.p4, "pass");
  assert.equal(viewModel.promotionStatus.p3, "review_required");
  assert.equal(viewModel.promotionStatus.p4, "blocked");
  assert.match(viewModel.promotionStatus.explanation, /card is allowed/);
  assert.equal(viewModel.designerSummary.decision, "allowed");
  assert.match(viewModel.designerSummary.sourceMaterial, /accepted P3 review-queue evidence/);
  assert.ok(viewModel.designerSummary.governedBy.designSystemAuthorityRefs.some((ref) => ref.path === "artifacts/p2/governed-catalog.json"));
  assert.ok(viewModel.designerSummary.evidenceRefs.length > 0);
  assert.match(viewModel.designerSummary.decisionRationale, /structurally valid/);
  assert.deepEqual(viewModel.designerSummary.staticBoardRecordsAllowed, ["review-required-work"]);
  assert.equal(viewModel.designerSummary.qualityFindings[0].blocking, false);
  assert.equal(viewModel.designerSummary.qualityFindings[0].authority, "evaluation-only");
  assert.equal(Object.hasOwn(viewModel.designerSummary, "generatedUiAllowed"), false);
  assert.deepEqual(viewModel.promotionStatus.boardCards.allowed, ["card.review.review-required-work"]);
  assert.match(viewModel.boardSummary.cards[0].whyThisLane, /Committed P4 decision/);
  assert.deepEqual(viewModel.boardSummary.cards[0].sourceRefs, ["fixture://p3/review/review-required-work#/reviewPolicy"]);
  assert.equal(viewModel.boardSummary.cards[0].decisionRef.decisionId, "decision.approve-reviewed-work");
  assert.ok(viewModel.boardSummary.cards[0].evidenceRefs.length > 0);
  assert.equal(viewModel.authorityActionQueue[0].nextActionOwner.ownerRole, "surface-ops-reviewer");
  assert.equal(viewModel.authorityActionQueue[0].decisionRef.decisionId, "decision.approve-reviewed-work");
  assert.ok(viewModel.authorityActionQueue[0].evidenceRefs.length > 0);
  assert.match(viewModel.authorityActionQueue[0].reviewDecision, /evidence-backed annotation/);
  assert.equal(viewModel.handoffEligibility.staticBoardPacket, true);
  assert.match(viewModel.handoffEligibility.reason, /static packets remain inert/);
});

test("SurfaceOps kanban packets are inert and hide no review authority", async () => {
  await runProof();
  const reviewPacket = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.review-work.json");
  const decisionsPacket = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.decisions.json");
  const evidence = await readJson("artifacts/surfaceops-kanban-static/evidence.json");

  for (const packet of [reviewPacket, decisionsPacket]) {
    assert.equal(packet.execution.authorized, false);
    assert.deepEqual(packet.execution.fileEdits, []);
    assert.deepEqual(packet.execution.networkCalls, []);
    assert.deepEqual(packet.execution.callbacks, []);
    assert.deepEqual(packet.execution.secrets, []);
    assert.deepEqual(packet.execution.liveWrites, []);
    assert.ok(packet.evidenceRefs.length > 0);
  }
  assert.ok(evidence.validationResults.some((row) =>
    row.fixturePath === "fixtures/surfaceops-kanban-static/invalid/hidden-review-state.surfaceops-kanban.json" &&
    row.actualResult === "invalid" &&
    row.diagnosticCodes.includes("SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE")
  ));
});

test("SurfaceOps kanban preflight rejects failing P3 evidence and substrate drift before writes", async () => {
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
    assert.match(result.stderr, /upstream P3 evidence is not passing/);
    await assertArtifactsUnchanged(snapshots);
  });

  await withJsonFileMutations([
    {
      absolutePath: substratePath,
      mutate(substrate) {
        substrate.capabilities.liveKanbanWrite = true;
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /substrate hash does not match/);
    await assertArtifactsUnchanged(snapshots);
  });
});

test("SurfaceOps kanban fixtures reject live claims and missing evidence refs", async () => {
  await runProof();
  const liveFixturePath = path.join(root, "fixtures/surfaceops-kanban-static/valid/p3-review-queue-to-board.surfaceops-kanban.json");
  const targetSelectionFixturePath = path.join(root, "fixtures/surfaceops-kanban-static/surfaceops-kanban-target-selection.fixture.json");

  await withJsonFileMutations([
    {
      absolutePath: liveFixturePath,
      mutate(fixture) {
        fixture.claims.liveKanbanWrite = true;
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SurfaceOps kanban validation expectation mismatch/);
    assert.match(result.stderr, /SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN/);
  });

  await withJsonFileMutations([
    {
      absolutePath: liveFixturePath,
      mutate(fixture) {
        fixture.claims.api = true;
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SurfaceOps kanban validation expectation mismatch/);
    assert.match(result.stderr, /SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN/);
  });

  await withJsonFileMutations([
    {
      absolutePath: targetSelectionFixturePath,
      mutate(fixture) {
        fixture.capabilityScope.api = true;
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /generated SurfaceOps kanban target selection failed semantic validation: SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN/);
  });
});

test("SurfaceOps kanban artifact schemas pin schema ids", async () => {
  await runProof();
  const selectionSchema = await readJson("schemas/surfaceops-kanban-target-selection.v0.schema.json");
  const evidenceSchema = await readJson("schemas/surfaceops-kanban-evidence.v0.schema.json");

  assert.equal(selectionSchema.properties.schemaId.const, "surfaceops-kanban-target-selection.v0");
  assert.equal(evidenceSchema.properties.schemaId.const, "surfaceops-kanban-evidence.v0");
});

test("SurfaceOps kanban schemas reject live execution and hidden review state", async () => {
  await runProof();
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const packetSchema = await readJson("schemas/surfaceops-kanban-board-packet.v0.schema.json");
  const projectionSchema = await readJson("schemas/surfaceops-kanban-board-projection.v0.schema.json");
  const validatePacket = ajv.compile(packetSchema);
  const validateProjection = ajv.compile(projectionSchema);
  const packet = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.review-work.json");
  const projection = await readJson("artifacts/surfaceops-kanban-static/surfaceops-kanban-board-projection.json");

  assert.equal(validatePacket(packet), true);
  const executablePacket = structuredClone(packet);
  executablePacket.execution.authorized = true;
  executablePacket.execution.networkCalls = ["https://kanban.cards/write"];
  assert.equal(validatePacket(executablePacket), false);

  assert.equal(validateProjection(projection), true);
  const hiddenProjection = structuredClone(projection);
  hiddenProjection.cards[0].hiddenReviewState = { status: "approved" };
  assert.equal(validateProjection(hiddenProjection), false);

  const missingEvidenceProjection = structuredClone(projection);
  missingEvidenceProjection.cards[0].evidenceRefs = [];
  assert.equal(validateProjection(missingEvidenceProjection), false);
});

test("SurfaceOps kanban evidence integrity detects schema, fixture, upstream, substrate, artifact, and self-hash tampering", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-kanban-static/evidence.json");

  const schemaTamper = structuredClone(evidence);
  schemaTamper.schemaClosure[0].hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, schemaTamper), "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH");

  const fixtureTamper = structuredClone(evidence);
  fixtureTamper.fixtureRefs[0].hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, fixtureTamper), "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH");

  const upstreamTamper = structuredClone(evidence);
  upstreamTamper.boundaryRefs[0].hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, upstreamTamper), "SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH");

  const substrateTamper = structuredClone(evidence);
  const substrateRef = substrateTamper.boundaryRefs.find((ref) => ref.path === "sources/surfaceops-kanban-static/kanban-board-substrate.json");
  substrateRef.hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, substrateTamper), "SURFACEOPS_KANBAN_SUBSTRATE_HASH_MISMATCH");

  const artifactTamper = structuredClone(evidence);
  artifactTamper.artifacts[0].hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, artifactTamper), "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH");

  const selfHashTamper = structuredClone(evidence);
  selfHashTamper.artifacts[selfHashTamper.artifacts.length - 1].hash = "0".repeat(64);
  assert.equal(await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(root, selfHashTamper), "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH");
});

test("SurfaceOps kanban proof rejects stale output and non-normalized command paths", async () => {
  await fs.writeFile(stalePath, "stale");
  try {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(stalePath, { force: true });
  }

  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "surfaceops-kanban-static",
    "proof",
    "--orchestration-evidence",
    "artifacts/p3/../p3/evidence.json",
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
    "--kanban-substrate-manifest",
    "sources/surfaceops-kanban-static/kanban-substrate-manifest.json",
    "--fixture",
    "fixtures/surfaceops-kanban-static",
    "--out",
    "artifacts/surfaceops-kanban-static"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);

  await runProof();
  const artifactDir = path.join(root, "artifacts/surfaceops-kanban-static");
  const backupDir = path.join(root, "artifacts/surfaceops-kanban-static.backup-test");
  const targetDir = path.join(root, "tmp-surfaceops-kanban-static-output-root");
  await fs.rm(backupDir, { recursive: true, force: true });
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.rename(artifactDir, backupDir);
  await fs.mkdir(targetDir);
  await fs.symlink(targetDir, artifactDir);
  try {
    const symlinkResult = await runProofExpectFailure();
    assert.equal(symlinkResult.code, 2);
    assert.match(symlinkResult.stderr, /output path error/);
  } finally {
    await fs.rm(artifactDir, { force: true });
    await fs.rm(targetDir, { recursive: true, force: true });
    await fs.rename(backupDir, artifactDir);
  }
});

test("SurfaceOps kanban package scripts and untracked guard are exposed", async () => {
  const pkg = await readJson("package.json");
  for (const script of [
    "materialize:surfaceops-kanban-static",
    "proof:surfaceops-kanban-static",
    "check:surfaceops-kanban-static",
    "check:surfaceops-kanban-static:ci",
    "check:surfaceops-kanban-static:ci:phase",
    "check:surfaceops-kanban-static:untracked"
  ]) {
    assert.ok(pkg.scripts[script], `${script} script missing`);
  }
  assert.match(pkg.scripts["proof:surfaceops-kanban-static"], /surfaces surfaceops-kanban-static proof/);
  assert.match(pkg.scripts["check:surfaceops-kanban-static:ci"], /check:p4:ci/);
  for (const guardedPath of [
    "artifacts/surfaceops-kanban-static",
    "fixtures/surfaceops-kanban-static",
    "sources/surfaceops-kanban-static",
    "schemas/surfaceops-kanban-target-selection.v0.schema.json",
    "schemas/kanban-board-substrate-manifest.v0.schema.json",
    "schemas/kanban-board-substrate.v0.schema.json",
    "schemas/surfaceops-kanban-board-projection.v0.schema.json",
    "schemas/surfaceops-kanban-designer-view-model.v0.schema.json",
    "schemas/surfaceops-kanban-board-packet.v0.schema.json",
    "schemas/surfaceops-kanban-adapter-report.v0.schema.json",
    "schemas/surfaceops-kanban-evidence.v0.schema.json",
    "schemas/surfaceops-kanban-expectations.v0.schema.json",
    "schemas/surfaceops-kanban-diagnostics.v0.schema.json",
    "schemas/surfaceops-kanban-preflight-mutation.v0.schema.json",
    "schemas/surfaceops-kanban-fixture.v0.schema.json",
    "scripts/materialize-surfaceops-kanban-static.mjs",
    "src/surfaceops-kanban-static-contract.js",
    "src/surfaceops-kanban-static-proof.js",
    "test/surfaceops-kanban-static-proof.test.js"
  ]) {
    assert.match(pkg.scripts["check:surfaceops-kanban-static:untracked"], new RegExp(escapeRegExp(guardedPath)));
  }
});

async function runProof() {
  await execFileAsync("node", proofArgs(), { cwd: root });
}

async function runProofExpectFailure() {
  return runCommandExpectFailure(proofArgs());
}

function proofArgs() {
  return [
    "bin/interfacectl.js",
    "surfaces",
    "surfaceops-kanban-static",
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
    "--kanban-substrate-manifest",
    "sources/surfaceops-kanban-static/kanban-substrate-manifest.json",
    "--fixture",
    "fixtures/surfaceops-kanban-static",
    "--out",
    "artifacts/surfaceops-kanban-static"
  ];
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
    const original = await fs.readFile(mutation.absolutePath, "utf8");
    originals.push({ absolutePath: mutation.absolutePath, original });
    const json = JSON.parse(original);
    mutation.mutate(json);
    await fs.writeFile(mutation.absolutePath, canonicalJson(json));
  }
  try {
    return await fn();
  } finally {
    await Promise.all(originals.map(({ absolutePath, original }) => fs.writeFile(absolutePath, original)));
  }
}

async function snapshotArtifacts() {
  const snapshots = new Map();
  for (const relativePath of [
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-target-selection.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-projection.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-designer-view-model.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.review-work.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-board-packet.decisions.json",
    "artifacts/surfaceops-kanban-static/surfaceops-kanban-adapter-report.json",
    "artifacts/surfaceops-kanban-static/evidence.json"
  ]) {
    snapshots.set(relativePath, await fs.readFile(path.join(root, relativePath), "utf8"));
  }
  return snapshots;
}

async function assertArtifactsUnchanged(snapshots) {
  for (const [relativePath, contents] of snapshots.entries()) {
    assert.equal(await fs.readFile(path.join(root, relativePath), "utf8"), contents, `${relativePath} changed after failed proof`);
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
