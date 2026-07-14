#!/usr/bin/env node
import crypto from "node:crypto";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { chromium } from "playwright";
import { canonicalJson } from "../src/p0.js";
import {
  readJson,
  sha256Hex
} from "../src/p2-contract.js";
import {
  DRUI_ARTIFACT_ROOT,
  DRUI_COMPONENT_ID,
  DRUI_RUNTIME_OUTPUT_ROOT,
  DRUI_SCENARIO_ID,
  DRUI_SCHEMA_FILES,
  DRUI_SCHEMA_ROOT,
  DRUI_TARGET_ID,
  DRUI_VERSION,
  artifactRef,
  provenance
} from "../src/surfaceops-designer-review-ui-contract.js";
import { surfaceopsDesignerReviewUiInternals } from "../src/surfaceops-designer-review-ui-proof.js";
import { KL_KANBAN_CARDS_COMMIT } from "../src/surfaceops-kanban-live-contract.js";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = DRUI_RUNTIME_OUTPUT_ROOT;
const DEFAULT_KANBAN_ROOT = "../kanban.cards";
const DETERMINISTIC_EVIDENCE_PATH = `${DRUI_ARTIFACT_ROOT}/evidence.json`;
const COMMAND = "npm run proof:surfaceops-designer-review-ui:browser";
const VIEWPORT = { width: 1440, height: 940 };
const execFileAsync = promisify(execFile);

main().catch((error) => {
  console.error(`surfaceops-designer-review-ui browser proof failed: ${error.stack || error.message || String(error)}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = workspacePath(args.out || DEFAULT_OUT_DIR, "--out");
  const kanbanRoot = path.resolve(ROOT, args.kanbanRoot || DEFAULT_KANBAN_ROOT);
  await assertKanbanWorkspace(kanbanRoot);
  const kanbanCommit = await assertPinnedKanbanCommit(kanbanRoot);

  const validators = await loadValidators();
  const deterministicEvidence = await readJson(path.join(ROOT, DETERMINISTIC_EVIDENCE_PATH));
  await verifyDeterministicEvidence(deterministicEvidence);
  const workbench = await readJson(path.join(ROOT, DRUI_ARTIFACT_ROOT, "surfaceops-designer-review-workbench.json"));
  const deterministicReceipt = await readJson(path.join(ROOT, DRUI_ARTIFACT_ROOT, "surfaceops-designer-review-decision-receipt.json"));

  await fs.rm(outDir.fsPath, { recursive: true, force: true });
  await fs.mkdir(outDir.fsPath, { recursive: true });
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "surfaceops-designer-review-ui-"));
  const adminToken = `redacted-admin-${crypto.randomBytes(6).toString("hex")}`;
  const kanbanPort = await freePort();
  const surfaceOpsPort = await freePort();
  const kanbanBaseUrl = `http://127.0.0.1:${kanbanPort}`;
  const kanbanApiBaseUrl = `${kanbanBaseUrl}/api`;
  const surfaceOpsBaseUrl = `http://127.0.0.1:${surfaceOpsPort}`;
  const bindingId = "surfaceops-button-variants-local-live";
  const reviewUrl = `${surfaceOpsBaseUrl}/review/${bindingId}`;
  const transcript = {
    scenarioId: DRUI_SCENARIO_ID,
    targetId: DRUI_TARGET_ID,
    kanbanBaseUrl: "http://127.0.0.1:<redacted-port>",
    surfaceOpsBaseUrl: "http://127.0.0.1:<redacted-port>",
    steps: [],
    assertions: [],
    apiExchanges: [],
    tokensRedacted: true
  };
  const runtimeState = {
    bindingId,
    reviewUrl,
    workbench,
    deterministicReceipt,
    deterministicEvidence,
    kanbanApiBaseUrl,
    adminToken,
    agentToken: null,
    board: null,
    card: null,
    receipt: null,
    mirrorResult: null,
    apiExchanges: transcript.apiExchanges
  };

  const surfaceOpsServer = await startSurfaceOpsServer({ port: surfaceOpsPort, state: runtimeState });
  const kanbanServer = startKanbanServer({
    kanbanRoot,
    port: kanbanPort,
    dataPath: path.join(tempDir, "state.json"),
    tokenDataPath: path.join(tempDir, "agent-tokens.json"),
    eventDataPath: path.join(tempDir, "events.jsonl"),
    adminToken
  });

  let browser = null;
  let pageVideo = null;
  let stream = null;
  try {
    await waitForHealth(kanbanApiBaseUrl, adminToken);
    await apiStep(transcript, "health", "GET", "/health", async () => requestJson(kanbanApiBaseUrl, "/health", { headers: bearerHeaders(adminToken) }));
    const adminHeaders = bearerHeaders(adminToken);

    const board = await apiStep(transcript, "create-review-board", "POST", "/boards", async () => requestJson(kanbanApiBaseUrl, "/boards", {
      method: "POST",
      headers: adminHeaders,
      body: {
        name: "SurfaceOps Designer Review",
        lanes: [
          lane("Needs Review", "Evidence-bound designer review is pending.", "surfaceops-adapter", "surfaceops-reviewer"),
          lane("Needs Refinement", "Designer requested changes before handoff.", "surfaceops-adapter", "surfaceops-reviewer"),
          lane("Approved For Handoff", "Structured SurfaceOps receipt has been recorded.", "surfaceops-adapter", "surfaceops-reviewer"),
          lane("Blocked", "Review is blocked until evidence or authority changes.", "surfaceops-adapter", "surfaceops-reviewer")
        ],
        agentSpecs: [
          agent("surfaceops-adapter", "SurfaceOps Adapter", "Adapter", ["needs-review", "needs-refinement", "approved-for-handoff", "blocked"]),
          agent("surfaceops-reviewer", "SurfaceOps Reviewer", "Reviewer", ["needs-review", "needs-refinement", "approved-for-handoff", "blocked"])
        ]
      }
    }));
    await assertEqual(transcript, "board-title", "SurfaceOps Designer Review", board.name);
    runtimeState.board = board;

    const session = await apiStep(transcript, "create-scoped-adapter-session", "POST", "/boards/:boardId/agent-sessions", async () => requestJson(kanbanApiBaseUrl, `/boards/${encodeURIComponent(board.id)}/agent-sessions`, {
      method: "POST",
      headers: adminHeaders,
      body: {
        agentId: "surfaceops-adapter",
        label: "SurfaceOps designer review mirror adapter",
        capabilities: ["view", "create", "update", "comment", "move"],
        reason: "Local-live SurfaceOps designer review UI browser proof."
      }
    }));
    runtimeState.agentToken = session.token;
    await assertEqual(transcript, "agent-token-kept-server-side", false, JSON.stringify(redact(session)).includes(session.token));
    const agentHeaders = bearerHeaders(session.token);

    stream = await openSse(`${kanbanApiBaseUrl}/events`, adminHeaders);
    await stream.messages.next((message) => message.event === "connected");
    const evidenceHash = deterministicEvidence.artifacts.at(-1).hash;
    const cardSummary = [
      `SURFACEOPS_REF reviewItemId=review-item.button.primary evidenceHash=${evidenceHash}`,
      `bindingId=${bindingId}`,
      "status=needs-review",
      "decision=structured-surfaceops-required",
      `surfaceopsUrl=${reviewUrl}`
    ].join(" ");
    const card = await apiStep(transcript, "create-button-variants-card", "POST", "/boards/:boardId/work-items", async () => requestJson(kanbanApiBaseUrl, `/boards/${encodeURIComponent(board.id)}/work-items`, {
      method: "POST",
      headers: agentHeaders,
      body: {
        title: "Button variants",
        summary: cardSummary,
        laneId: "needs-review",
        ownerAgentId: "surfaceops-adapter",
        reviewerAgentId: "surfaceops-reviewer"
      }
    }));
    runtimeState.card = card;
    await assertEqual(transcript, "card-created-in-needs-review", "needs-review", card.laneId);
    await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "card_created");

    browser = await chromium.launch({ headless: true });
    const videoDir = path.join(outDir.fsPath, "video-tmp");
    await fs.mkdir(videoDir, { recursive: true });
    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: videoDir, size: VIEWPORT }
    });
    const page = await context.newPage();
    pageVideo = page.video();

    await browserStep(transcript, "open-kanban-board", "navigate kanban.cards", async () => {
      await page.goto(kanbanBaseUrl, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "kanban-board-visible", "SurfaceOps Designer Review");
    await assertPageContains(page, transcript, "kanban-card-visible", "Button variants");
    await assertNoSecretText(page, transcript, "kanban-dom-has-no-tokens", [adminToken, session.token]);

    await browserStep(transcript, "open-kanban-card-detail", "click Button variants card", async () => {
      await page.getByText("Button variants").first().click();
      await page.waitForTimeout(500);
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "card-detail-has-surfaceops-ref", "SURFACEOPS_REF");
    await assertPageContains(page, transcript, "card-detail-has-review-url", "surfaceopsUrl=");

    await browserStep(transcript, "open-surfaceops-workbench", "navigate SurfaceOps local review", async () => {
      await page.goto(reviewUrl, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "surfaceops-workbench-visible", "SurfaceOps Designer Review");
    await assertPageContains(page, transcript, "surfaceops-shows-button-evidence", "Button variants");
    await assertPageContains(page, transcript, "surfaceops-shows-diagnostics", "SOURCE_REVIEW_EXPIRED");
    await assertEqual(transcript, "submit-disabled-before-rationale", true, await page.locator("[data-testid='submit-decision']").isDisabled());
    await assertNoSecretText(page, transcript, "surfaceops-dom-has-no-tokens", [adminToken, session.token]);

    await browserStep(transcript, "complete-decision-form", "select variant and rationale", async () => {
      await page.locator("[data-testid='variant-select']").selectOption(deterministicReceipt.selectedVariantId);
      await page.locator("[data-testid='decision-rationale']").fill(deterministicReceipt.rationale);
      return await page.locator("[data-testid='submit-decision']").isDisabled();
    });
    await assertEqual(transcript, "submit-enabled-after-rationale", false, await page.locator("[data-testid='submit-decision']").isDisabled());
    await browserStep(transcript, "submit-decision", "POST SurfaceOps decision", async () => {
      await page.locator("[data-testid='submit-decision']").click();
      await page.getByTestId("receipt-id").waitFor({ state: "visible" });
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "receipt-visible", deterministicReceipt.decisionState);
    await assertPageContains(page, transcript, "receipt-shows-binding", bindingId);

    await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "card_updated");
    await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "comment_created");
    const mirrorResult = runtimeState.mirrorResult;
    await assertEqual(transcript, "mirror-card-lane", "approved-for-handoff", mirrorResult?.card?.laneId);
    await assertEqual(transcript, "mirror-comment-created", true, Boolean(mirrorResult?.comment?.id));

    await browserStep(transcript, "verify-kanban-mirror", "reload kanban.cards", async () => {
      await page.goto(kanbanBaseUrl, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      await page.waitForTimeout(700);
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "kanban-approved-lane-visible", "Approved For Handoff");
    await assertPageContains(page, transcript, "kanban-card-still-visible", "Button variants");
    await page.getByText("Button variants").first().click();
    await page.waitForTimeout(500);
    await assertPageContains(page, transcript, "kanban-receipt-comment-visible", "SurfaceOps receipt");

    const viewOnly = await requestJson(kanbanApiBaseUrl, `/boards/${encodeURIComponent(board.id)}/agent-sessions`, {
      method: "POST",
      headers: adminHeaders,
      body: { agentId: "surfaceops-adapter", label: "View only SurfaceOps proof token", capabilities: ["view"] }
    });
    const denied = await fetch(`${kanbanApiBaseUrl}/boards/${encodeURIComponent(board.id)}/work-items`, {
      method: "POST",
      headers: { ...bearerHeaders(viewOnly.token), "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Denied card", laneId: "needs-review" })
    });
    await assertEqual(transcript, "view-only-create-denied", 403, denied.status);

    const cardEvents = await apiStep(transcript, "card-event-history", "GET", "/boards/:boardId/events", async () => requestJson(kanbanApiBaseUrl, `/boards/${encodeURIComponent(board.id)}/events?cardId=${encodeURIComponent(card.id)}&limit=10`, { headers: adminHeaders }));
    await assertEqual(transcript, "event-history-card-updated", true, cardEvents.events.some((event) => event.payload.reason === "card_updated"));
    await assertEqual(transcript, "event-history-comment-created", true, cardEvents.events.some((event) => event.payload.reason === "comment_created"));
    await assertEqual(transcript, "lane-move-is-mirror-only", false, workbench.kanbanMirror.laneMovementCommitsDecision);

    const screenshotPath = path.join(outDir.fsPath, "surfaceops-designer-review-ui-final.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.close();
    await browser.close();
    browser = null;

    await stopServer(kanbanServer);
    const restarted = startKanbanServer({
      kanbanRoot,
      port: kanbanPort,
      dataPath: path.join(tempDir, "state.json"),
      tokenDataPath: path.join(tempDir, "agent-tokens.json"),
      eventDataPath: path.join(tempDir, "events.jsonl"),
      adminToken
    });
    try {
      await waitForHealth(kanbanApiBaseUrl, adminToken);
      const persisted = await apiStep(transcript, "restart-persistence", "GET", "/boards/:boardId", async () => requestJson(kanbanApiBaseUrl, `/boards/${encodeURIComponent(board.id)}`, { headers: adminHeaders }));
      const persistedCard = persisted.workItems.find((item) => item.id === card.id);
      await assertEqual(transcript, "restart-mirrored-card-persists", "approved-for-handoff", persistedCard?.laneId);
      await assertEqual(transcript, "restart-receipt-comment-persists", true, (persistedCard?.comments || []).some((comment) => comment.text.includes("SurfaceOps receipt")));
    } finally {
      await stopServer(restarted);
    }
  } finally {
    if (stream) stream.close();
    if (browser) await browser.close();
    if (!kanbanServer.stopped) await stopServer(kanbanServer).catch(() => undefined);
    await stopHttpServer(surfaceOpsServer).catch(() => undefined);
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  const transcriptPath = path.join(outDir.fsPath, "browser-functional-transcript.json");
  const apiLogPath = path.join(outDir.fsPath, "redacted-api-exchange-log.json");
  await fs.writeFile(transcriptPath, canonicalJson(redact({
    scenarioId: transcript.scenarioId,
    targetId: transcript.targetId,
    steps: transcript.steps,
    assertions: transcript.assertions,
    tokensRedacted: true
  })));
  await fs.writeFile(apiLogPath, canonicalJson(redact(transcript.apiExchanges)));
  await fs.writeFile(path.join(outDir.fsPath, "kanban-card-binding.json"), canonicalJson(redact({
    bindingId,
    boardId: runtimeState.board?.id,
    cardId: runtimeState.card?.id,
    reviewUrl: "http://127.0.0.1:<redacted-port>/review/<bindingId>",
    evidenceHash: deterministicEvidence.artifacts.at(-1).hash
  })));
  await fs.writeFile(path.join(outDir.fsPath, "surfaceops-decision-receipt.json"), canonicalJson(redact(runtimeState.receipt)));
  await fs.writeFile(path.join(outDir.fsPath, "kanban-mirror-result.json"), canonicalJson(redact(runtimeState.mirrorResult)));

  if (!pageVideo) throw contractError("browser scenario did not create a video recorder", 1);
  const tempVideoPath = await pageVideo.path();
  const videoPath = path.join(outDir.fsPath, "surfaceops-designer-review-ui-browser.webm");
  await fs.rename(tempVideoPath, videoPath);
  await fs.rm(path.join(outDir.fsPath, "video-tmp"), { recursive: true, force: true });

  const deterministicEvidenceRef = artifactRef(DETERMINISTIC_EVIDENCE_PATH, "surfaceops-designer-review-ui-evidence.v0", surfaceopsDesignerReviewUiInternals.computeEvidenceSelfHash(deterministicEvidence));
  const recordingRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-designer-review-ui-browser.webm"), "webm-video.v0", "video/webm");
  const screenshotRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-designer-review-ui-final.png"), "png-image.v0", "image/png");
  const transcriptRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-transcript.json"), "surfaceops-designer-review-ui-browser-functional-transcript.v0", "application/json");
  const apiExchangeRef = await browserFileRef(path.posix.join(outDir.posixPath, "redacted-api-exchange-log.json"), "surfaceops-designer-review-ui-redacted-api-exchange-log.v0", "application/json");
  const mirrorResult = redact(runtimeState.mirrorResult);
  const report = {
    schemaId: "surfaceops-designer-review-ui-browser-functional-report.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    scenarioId: DRUI_SCENARIO_ID,
    status: "pass",
    promotionStatus: deterministicEvidence.promotionStatus,
    command: COMMAND,
    deterministicEvidenceRef,
    kanbanRuntime: {
      upstreamWorkspace: "configured local kanban.cards checkout",
      upstreamWorkspaceName: path.basename(kanbanRoot),
      upstreamCommit: kanbanCommit,
      expectedUpstreamCommit: KL_KANBAN_CARDS_COMMIT,
      kanbanBaseUrl: "http://127.0.0.1:<redacted-port>",
      surfaceOpsBaseUrl: "http://127.0.0.1:<redacted-port>",
      browserReceivesKanbanBearerTokens: false,
      persistence: "file-store-tempdir",
      auth: "server-side-admin-bearer-plus-scoped-agent-token"
    },
    assertions: transcript.assertions,
    steps: transcript.steps,
    mirrorResult,
    recordingRef,
    screenshotRef,
    transcriptRef,
    apiExchangeRef,
    provenance: provenance("surfaceops-designer-review-ui-browser-functional-report", [
      DETERMINISTIC_EVIDENCE_PATH,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      apiExchangeRef.path
    ])
  };
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-report.v0", report, "browser functional report");
  const reportPath = path.join(outDir.fsPath, "browser-functional-report.json");
  await fs.writeFile(reportPath, canonicalJson(report));
  const reportRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-report.json"), "surfaceops-designer-review-ui-browser-functional-report.v0", "application/json");

  const checkedAt = new Date().toISOString();
  const evidence = {
    schemaId: "surfaceops-designer-review-ui-browser-functional-evidence.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    scenarioId: DRUI_SCENARIO_ID,
    status: "pass",
    promotionStatus: deterministicEvidence.promotionStatus,
    command: COMMAND,
    checkedAt,
    environment: {
      generatedAt: checkedAt,
      host: null,
      selfHashMode: "sha256 over canonical JSON with selfHash set to 64 zero characters before final assignment"
    },
    deterministicEvidenceRef,
    reportRef,
    recordingRef,
    screenshotRef,
    transcriptRef,
    apiExchangeRef,
    assertions: transcript.assertions,
    mirrorResult,
    selfHash: "0".repeat(64),
    provenance: provenance("surfaceops-designer-review-ui-browser-functional-evidence", [
      DETERMINISTIC_EVIDENCE_PATH,
      reportRef.path,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      apiExchangeRef.path
    ])
  };
  evidence.selfHash = sha256Hex(canonicalJson(evidence));
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-evidence.v0", evidence, "browser functional evidence");
  await fs.writeFile(path.join(outDir.fsPath, "browser-functional-evidence.json"), canonicalJson(evidence));

  console.log([
    "SurfaceOps designer review UI browser functional proof: pass",
    `video: ${recordingRef.path}`,
    `videoHash: ${recordingRef.hash}`,
    `screenshot: ${screenshotRef.path}`,
    `evidence: ${path.posix.join(outDir.posixPath, "browser-functional-evidence.json")}`
  ].join("\n"));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--out") args.out = argv[++index];
    else if (current === "--kanban-root") args.kanbanRoot = argv[++index];
    else throw contractError(`unexpected argument: ${current}`, 2);
  }
  return args;
}

async function startSurfaceOpsServer({ port, state }) {
  const server = http.createServer((req, res) => {
    handleSurfaceOpsRequest(req, res, state).catch((error) => {
      res.writeHead(error.status || 500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.status ? error.message : "Internal server error." }));
    });
  });
  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });
  return server;
}

async function handleSurfaceOpsRequest(req, res, state) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  if (req.method === "GET" && url.pathname === `/review/${state.bindingId}`) {
    writeHtml(res, reviewHtml(state));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    writeJson(res, 200, redact({
      bindingId: state.bindingId,
      boardId: state.board?.id,
      cardId: state.card?.id,
      receipt: state.receipt,
      mirrorResult: state.mirrorResult
    }));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/decisions") {
    const body = await readRequestJson(req);
    if (!state.board || !state.card || !state.agentToken) throw httpError(409, "kanban binding is not ready");
    if (body?.variantId !== state.deterministicReceipt.selectedVariantId) throw httpError(400, "selected variant is not evidence-bound");
    if (typeof body?.rationale !== "string" || body.rationale.trim().length < 8) throw httpError(400, "rationale is required");
    const evidenceHash = state.deterministicEvidence.artifacts.at(-1).hash;
    const receipt = {
      schemaId: "surfaceops-designer-review-decision-receipt.runtime.v0",
      receiptId: `surfaceops-review:${state.bindingId}:${evidenceHash.slice(0, 12)}`,
      reviewItemId: "review-item.button.primary",
      componentId: DRUI_COMPONENT_ID,
      decisionStatus: state.deterministicReceipt.decisionState,
      mirroredStatus: state.deterministicReceipt.mirroredKanbanStatus,
      selectedVariantId: body.variantId,
      rationale: body.rationale.trim(),
      evidenceRefs: state.deterministicReceipt.evidenceRefs,
      kanbanBinding: {
        boardId: state.board.id,
        cardId: state.card.id,
        bindingId: state.bindingId
      },
      authority: {
        surfaceopsOwnsDecision: true,
        kanbanCardsOwnsDecision: false
      },
      nonExecutable: true,
      selfHash: "0".repeat(64)
    };
    receipt.selfHash = sha256Hex(canonicalJson(receipt));
    const agentHeaders = bearerHeaders(state.agentToken);
    const summary = [
      state.card.summary,
      `receiptId=${receipt.receiptId}`,
      `receiptHash=${receipt.selfHash}`,
      "mirroredStatus=approved-for-handoff"
    ].join(" ");
    const card = await surfaceOpsApiStep(state, "mirror-card-approved", "PATCH", "/boards/:boardId/work-items/:itemId", async () => requestJson(state.kanbanApiBaseUrl, `/boards/${encodeURIComponent(state.board.id)}/work-items/${encodeURIComponent(state.card.id)}`, {
      method: "PATCH",
      headers: agentHeaders,
      body: {
        laneId: "approved-for-handoff",
        summary
      }
    }));
    const comment = await surfaceOpsApiStep(state, "mirror-receipt-comment", "POST", "/boards/:boardId/work-items/:itemId/comments", async () => requestJson(state.kanbanApiBaseUrl, `/boards/${encodeURIComponent(state.board.id)}/work-items/${encodeURIComponent(state.card.id)}/comments`, {
      method: "POST",
      headers: agentHeaders,
      body: {
        kind: "note",
        status: "resolved",
        text: `SurfaceOps receipt ${receipt.receiptId} ${receipt.selfHash} approved for handoff.`
      }
    }));
    state.receipt = receipt;
    state.card = card;
    state.mirrorResult = {
      bindingId: state.bindingId,
      receiptId: receipt.receiptId,
      receiptHash: receipt.selfHash,
      card,
      comment,
      mirrorOnly: true,
      laneMovementCommitsDecision: false
    };
    writeJson(res, 201, redact({ receipt, mirrorResult: state.mirrorResult }));
    return;
  }
  writeJson(res, 404, { error: "Not found." });
}

function reviewHtml(state) {
  const receipt = state.deterministicReceipt;
  const workbench = state.workbench;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SurfaceOps Designer Review</title>
  <style>
    :root { color-scheme: light; --canvas: #f6f7f9; --surface: #fff; --ink: #18202a; --muted: #5b6675; --border: #d7dde5; --teal: #0c7478; --green: #287046; --amber: #915e17; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--canvas); }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 20px; }
    main { max-width: 1280px; margin: 0 auto; padding: 18px 20px; display: grid; grid-template-columns: minmax(320px, 0.9fr) minmax(420px, 1.1fr); gap: 14px; }
    section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; min-width: 0; }
    h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 16px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.45; }
    button, select, textarea { font: inherit; letter-spacing: 0; }
    .dag { display: grid; gap: 8px; }
    .dag button { border: 1px solid var(--border); background: #fbfcfd; border-radius: 8px; padding: 10px; text-align: left; cursor: pointer; font-weight: 800; }
    .dag button:hover, .dag button.selected { border-color: var(--teal); background: #eef8f8; }
    .specimen { border: 1px solid var(--border); border-radius: 8px; padding: 16px; background: #fbfcfd; margin-bottom: 12px; }
    .sample-button { border: 0; border-radius: 6px; padding: 10px 16px; color: #fff; background: var(--teal); font-weight: 900; margin-right: 8px; margin-top: 10px; }
    label { display: grid; gap: 6px; margin-top: 12px; color: var(--muted); font-weight: 800; font-size: 13px; }
    select, textarea { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; }
    textarea { min-height: 96px; resize: vertical; }
    .primary { margin-top: 12px; border: 0; border-radius: 8px; background: var(--green); color: #fff; padding: 10px 14px; font-weight: 900; cursor: pointer; }
    .primary:disabled { background: #94a3ad; cursor: not-allowed; }
    .diagnostics { margin: 12px 0 0; padding-left: 18px; color: var(--amber); font-weight: 800; }
    .receipt { display: none; margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px; }
    .receipt.visible { display: grid; gap: 8px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; overflow-wrap: anywhere; }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>SurfaceOps Designer Review</h1>
    <p>Button variants review with server-side kanban mirror. Browser receives no kanban bearer token.</p>
  </header>
  <main>
    <section>
      <h2>SurfaceOps DAG</h2>
      <div class="dag">
        ${workbench.dag.nodes.map((node, index) => `<button class="${index === 3 ? "selected" : ""}" type="button" data-testid="dag-node">${escapeHtml(node.label)} <small>${escapeHtml(node.status)}</small></button>`).join("")}
      </div>
      <ul class="diagnostics">${workbench.inspector.blockingRisks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Button variants</h2>
      <div class="specimen">
        <p>Evidence refs: <code>${escapeHtml(receipt.evidenceRefs.map((ref) => ref.path).join(", "))}</code></p>
        <button class="sample-button" type="button">Primary</button>
        <button class="sample-button" type="button" style="background:#295f9f">Secondary</button>
      </div>
      <label>Variant
        <select data-testid="variant-select">
          <option value="">Select variant</option>
          <option value="${escapeAttribute(receipt.selectedVariantId)}">${escapeHtml(receipt.selectedVariantId)}</option>
        </select>
      </label>
      <label>Rationale
        <textarea data-testid="decision-rationale" placeholder="Record the design rationale"></textarea>
      </label>
      <button class="primary" data-testid="submit-decision" type="button" disabled>Record decision receipt</button>
      <div class="receipt" data-testid="decision-receipt">
        <strong>Receipt recorded</strong>
        <div>Status: <span data-testid="receipt-status"></span></div>
        <div>Receipt: <code data-testid="receipt-id"></code></div>
        <div>Binding: <code>${escapeHtml(state.bindingId)}</code></div>
      </div>
    </section>
  </main>
  <script>
    const variant = document.querySelector("[data-testid='variant-select']");
    const rationale = document.querySelector("[data-testid='decision-rationale']");
    const submit = document.querySelector("[data-testid='submit-decision']");
    const receipt = document.querySelector("[data-testid='decision-receipt']");
    function refresh() { submit.disabled = !(variant.value && rationale.value.trim().length >= 8); }
    variant.addEventListener("change", refresh);
    rationale.addEventListener("input", refresh);
    submit.addEventListener("click", async () => {
      submit.disabled = true;
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.value, rationale: rationale.value })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Decision failed");
      receipt.classList.add("visible");
      document.querySelector("[data-testid='receipt-status']").textContent = payload.receipt.decisionStatus;
      document.querySelector("[data-testid='receipt-id']").textContent = payload.receipt.receiptId;
      submit.textContent = "Decision receipt recorded";
    });
    document.querySelectorAll("[data-testid='dag-node']").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-testid='dag-node']").forEach((node) => node.classList.remove("selected"));
      button.classList.add("selected");
    }));
    refresh();
  </script>
</body>
</html>`;
}

async function assertKanbanWorkspace(kanbanRoot) {
  await fs.access(path.join(kanbanRoot, "src/server.ts"));
  await fs.access(path.join(kanbanRoot, "node_modules/.bin/tsx"));
}

async function assertPinnedKanbanCommit(kanbanRoot) {
  const { stdout } = await execFileAsync("git", ["-C", kanbanRoot, "rev-parse", "HEAD"]);
  const commit = stdout.trim();
  if (commit !== KL_KANBAN_CARDS_COMMIT) throw contractError(`kanban.cards checkout must be pinned to ${KL_KANBAN_CARDS_COMMIT}; got ${commit}`, 1);
  return commit;
}

function startKanbanServer({ kanbanRoot, port, dataPath, tokenDataPath, eventDataPath, adminToken }) {
  const evalScript = [
    "import { startServer } from './src/server.ts';",
    "startServer({",
    "host: '127.0.0.1',",
    "port: process.env.PORT,",
    "dataPath: process.env.KANBAN_CARDS_DATA_PATH,",
    "tokenDataPath: process.env.KANBAN_CARDS_TOKEN_DATA_PATH,",
    "eventDataPath: process.env.KANBAN_CARDS_EVENT_DATA_PATH,",
    "requireDatabase: false,",
    "apiToken: process.env.KANBAN_CARDS_API_TOKEN",
    "});"
  ].join("\n");
  const server = {
    stopped: false,
    child: spawn(path.join(kanbanRoot, "node_modules/.bin/tsx"), ["--eval", evalScript], {
      cwd: kanbanRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        VERCEL: "",
        HOST: "127.0.0.1",
        PORT: String(port),
        KANBAN_CARDS_DATA_PATH: dataPath,
        KANBAN_CARDS_TOKEN_DATA_PATH: tokenDataPath,
        KANBAN_CARDS_EVENT_DATA_PATH: eventDataPath,
        KANBAN_CARDS_DATABASE_URL: "",
        POSTGRES_URL: "",
        DATABASE_URL: "",
        KANBAN_CARDS_API_TOKEN: adminToken,
        INSTRUCT_API_TOKEN: ""
      },
      stdio: ["ignore", "pipe", "pipe"]
    })
  };
  server.child.stdout.on("data", () => undefined);
  server.child.stderr.on("data", () => undefined);
  return server;
}

async function stopServer(server) {
  if (server.stopped) return;
  server.stopped = true;
  if (server.child.exitCode !== null) return;
  server.child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);
  if (server.child.exitCode === null) server.child.kill("SIGKILL");
}

async function stopHttpServer(server) {
  await new Promise((resolve) => server.close(resolve));
}

async function waitForHealth(apiBaseUrl, adminToken) {
  const deadline = Date.now() + 15_000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const health = await requestJson(apiBaseUrl, "/health", { headers: bearerHeaders(adminToken) });
      if (health.ok === true) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw contractError(`kanban.cards local server did not become healthy: ${lastError?.message || "timeout"}`, 1);
}

async function requestJson(apiBaseUrl, route, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { method: options.method || "GET", headers };
  if (options.body !== undefined) {
    init.headers = { ...headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${apiBaseUrl}${route}`, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${route} returned ${response.status}: ${text}`);
  return data;
}

async function apiStep(transcript, stepId, method, route, fn) {
  const result = await fn();
  transcript.steps.push({ stepId, action: `${method} ${route}`, status: "pass", detail: summarize(result) });
  transcript.apiExchanges.push({ stepId, method, route, status: "pass", response: summarize(result) });
  return result;
}

async function surfaceOpsApiStep(state, stepId, method, route, fn) {
  const result = await fn();
  state.apiExchanges.push({ stepId, method, route, status: "pass", actor: "surfaceops-server", response: summarize(result) });
  return result;
}

async function browserStep(transcript, stepId, action, fn) {
  const result = await fn();
  transcript.steps.push({ stepId, action, status: "pass", detail: summarize(result) });
  return result;
}

async function assertEqual(transcript, assertionId, expected, actual) {
  const pass = expected === actual;
  transcript.assertions.push({ assertionId, status: pass ? "pass" : "fail", expected: String(expected), actual: String(actual) });
  if (!pass) throw contractError(`assertion failed ${assertionId}: expected ${expected}, got ${actual}`, 1);
}

async function assertPageContains(page, transcript, assertionId, expectedText) {
  const bodyText = await page.locator("body").innerText();
  const pass = bodyText.includes(expectedText);
  transcript.assertions.push({ assertionId, status: pass ? "pass" : "fail", expected: expectedText, actual: pass ? expectedText : bodyText.slice(0, 300) });
  if (!pass) throw contractError(`page assertion failed ${assertionId}: missing ${expectedText}`, 1);
}

async function assertNoSecretText(page, transcript, assertionId, secrets) {
  const bodyText = await page.locator("body").innerText();
  const actual = secrets.some((secret) => secret && bodyText.includes(secret)) || /Authorization|kcagt_/.test(bodyText);
  transcript.assertions.push({ assertionId, status: actual ? "fail" : "pass", expected: "no kanban bearer token or Authorization text", actual: actual ? "secret-like text visible" : "none visible" });
  if (actual) throw contractError(`secret assertion failed ${assertionId}`, 1);
}

function summarize(value) {
  const redacted = redact(value);
  const text = typeof redacted === "string" ? redacted : JSON.stringify(redacted);
  return text.length > 340 ? `${text.slice(0, 340)}...` : text;
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      if (/token|authorization|secret|cookie/i.test(key)) output[key] = "[REDACTED]";
      else output[key] = redact(entry);
    }
    return output;
  }
  if (typeof value === "string") {
    return value
      .replace(/kcagt_[A-Za-z0-9_-]+/g, "kcagt_[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]")
      .replace(/redacted-admin-[a-f0-9]+/g, "[REDACTED_ADMIN_TOKEN]")
      .replace(/127\.0\.0\.1:\d+/g, "127.0.0.1:<redacted-port>")
      .replace(/\/(?:Users|private\/var|var|tmp)\/[^"'\\\s,}]+/g, "[LOCAL_PATH]");
  }
  return value;
}

function lane(title, description, defaultOwnerAgentId, defaultReviewerAgentId) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id,
    title,
    description,
    defaultOwnerAgentId,
    defaultReviewerAgentId,
    gate: { title: `${title} gate`, checks: ["SurfaceOps receipt remains decision authority."] }
  };
}

function agent(id, name, role, laneIds) {
  return {
    id,
    name,
    role,
    laneIds,
    instructions: "Use kanban.cards only as the SurfaceOps collaboration substrate.",
    skillNotes: "Do not approve, reject, execute, or override Surfaces evidence from kanban lane movement alone."
  };
}

function bearerHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function openSse(url, headers) {
  const controller = new AbortController();
  const response = await fetch(url, { headers, signal: controller.signal });
  if (!response.ok || !response.body) throw new Error(`${url} returned ${response.status}`);
  return {
    response,
    messages: new SseMessageReader(response.body.getReader()),
    close: () => controller.abort()
  };
}

class SseMessageReader {
  constructor(reader) {
    this.reader = reader;
    this.buffer = "";
    this.decoder = new TextDecoder();
  }

  async next(predicate, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const buffered = this.nextBuffered(predicate);
      if (buffered) return buffered;
      const remaining = Math.max(1, deadline - Date.now());
      const chunk = await Promise.race([
        this.reader.read(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out waiting for SSE message.")), remaining))
      ]);
      if (chunk.done) throw new Error("SSE stream closed before expected message.");
      this.buffer += this.decoder.decode(chunk.value, { stream: true });
    }
    throw new Error("Timed out waiting for SSE message.");
  }

  nextBuffered(predicate) {
    let separatorIndex = this.buffer.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const raw = this.buffer.slice(0, separatorIndex);
      this.buffer = this.buffer.slice(separatorIndex + 2);
      const message = parseSseMessage(raw);
      if (message && predicate(message)) return message;
      separatorIndex = this.buffer.indexOf("\n\n");
    }
    return null;
  }
}

function parseSseMessage(raw) {
  const message = { id: "", event: "message", data: "" };
  const dataLines = [];
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const separatorIndex = line.indexOf(":");
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).replace(/^ /, "") : "";
    if (field === "id") message.id = value;
    if (field === "event") message.event = value;
    if (field === "data") dataLines.push(value);
  }
  message.data = dataLines.join("\n");
  return message.event || message.data ? message : null;
}

async function loadValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const file of DRUI_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, DRUI_SCHEMA_ROOT, file));
    ajv.addSchema(schema, schema.$id || file.replace(/\.schema\.json$/, ""));
  }
  return ajv;
}

function assertSchema(ajv, schemaId, data, label) {
  const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-designer-review-ui/${schemaId}.schema.json`);
  if (!validate) throw contractError(`missing schema validator for ${schemaId}`, 1);
  if (!validate(data)) {
    throw contractError(`schema validation failed for ${label}: ${ajv.errorsText(validate.errors, { separator: "; " })}`, 1);
  }
}

async function verifyDeterministicEvidence(evidence) {
  if (evidence.schemaId !== "surfaceops-designer-review-ui-evidence.v0" || evidence.status !== "pass") {
    throw contractError("surfaceops-designer-review-ui deterministic evidence must pass before browser proof", 1);
  }
  const selfHash = surfaceopsDesignerReviewUiInternals.computeEvidenceSelfHash(evidence);
  const evidenceRef = evidence.artifacts.find((ref) => ref.path === DETERMINISTIC_EVIDENCE_PATH);
  if (!evidenceRef || evidenceRef.hash !== selfHash) {
    throw contractError("surfaceops-designer-review-ui deterministic evidence self-hash failed", 1);
  }
}

async function browserFileRef(posixPath, schemaId, mimeType) {
  const fsPath = path.join(ROOT, posixPath);
  const bytes = await fs.readFile(fsPath);
  return {
    path: posixPath,
    schemaId,
    hashAlgorithm: "sha256",
    hash: crypto.createHash("sha256").update(bytes).digest("hex"),
    mimeType
  };
}

function workspacePath(value, flagName) {
  if (!value || value.startsWith("/") || value.includes("..") || value.split("/").some((segment) => segment === "." || segment === "")) {
    throw contractError(`${flagName} must be a POSIX workspace-relative path without traversal`, 2);
  }
  return { posixPath: value, fsPath: path.join(ROOT, value) };
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on("error", reject);
  });
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function writeJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function writeHtml(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}
