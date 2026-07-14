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
  DRUI_CONSUMED_SCHEMA_FILES,
  DRUI_RUNTIME_OUTPUT_ROOT,
  DRUI_SCENARIO_ID,
  DRUI_SCHEMA_FILES,
  DRUI_SCHEMA_ROOT,
  DRUI_TARGET_ID,
  DRUI_VERSION,
  artifactRef,
  provenance
} from "../src/surfaceops-designer-review-ui-contract.js";
import {
  computeSurfaceopsDesignerReviewUiEvidenceSelfHash,
  verifySurfaceopsDesignerReviewUiEvidenceClosure
} from "../src/surfaceops-designer-review-ui-evidence.js";
import { KL_KANBAN_CARDS_COMMIT } from "../src/surfaceops-kanban-live-contract.js";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = DRUI_RUNTIME_OUTPUT_ROOT;
const DEFAULT_KANBAN_ROOT = "../kanban.cards";
const DETERMINISTIC_EVIDENCE_PATH = `${DRUI_ARTIFACT_ROOT}/evidence.json`;
const WORKBENCH_PATH = `${DRUI_ARTIFACT_ROOT}/surfaceops-designer-review-workbench.json`;
const COMMAND = "npm run proof:surfaceops-designer-review-ui:browser";
const VIEWPORT = { width: 1440, height: 940 };
const REQUIRED_ASSERTION_IDS = [
  "board-title",
  "agent-token-kept-server-side",
  "card-created-in-needs-review",
  "kanban-board-visible",
  "kanban-card-visible",
  "kanban-dom-has-no-tokens",
  "card-detail-has-surfaceops-ref",
  "card-detail-has-review-url",
  "surfaceops-workbench-visible",
  "surfaceops-shows-button-evidence",
  "surfaceops-shows-diagnostics",
  "surfaceops-shows-renewal-required",
  "approval-control-disabled",
  "refinement-control-disabled",
  "variant-is-inspection-only",
  "inspected-variant-is-evidence-bound",
  "blocked-submit-disabled-before-rationale",
  "surfaceops-dom-has-no-tokens",
  "approval-post-rejected",
  "refinement-post-rejected",
  "variant-of-record-post-rejected",
  "rejected-outcomes-create-no-receipt",
  "rejected-outcomes-create-no-mirror",
  "rejected-outcomes-do-not-move-card",
  "blocked-submit-enabled-after-rationale",
  "receipt-visible",
  "receipt-shows-binding",
  "dag-decision-receipt-recorded",
  "dag-kanban-mirror-blocked",
  "runtime-decision-is-blocked",
  "runtime-mirrored-status-is-blocked",
  "runtime-selected-variant-is-null",
  "runtime-variant-of-record-is-null",
  "runtime-diagnostic-code",
  "runtime-renewal-required",
  "runtime-handoff-ineligible",
  "runtime-governance-is-evidence-bound",
  "runtime-receipt-self-hash",
  "mirror-card-lane",
  "mirror-comment-created",
  "mirror-diagnostic-code",
  "mirror-renewal-required",
  "mirror-summary-is-blocked",
  "identical-replay-accepted",
  "identical-replay-marked",
  "identical-replay-preserves-receipt",
  "identical-replay-preserves-comment",
  "conflicting-replay-rejected",
  "kanban-blocked-lane-visible",
  "kanban-card-still-visible",
  "kanban-receipt-comment-visible",
  "kanban-comment-shows-blocking-diagnostic",
  "kanban-comment-shows-renewal-required",
  "view-only-create-denied",
  "event-history-card-updated",
  "event-history-comment-created",
  "idempotent-replay-single-card-update",
  "idempotent-replay-single-comment",
  "lane-move-is-mirror-only",
  "browser-requests-have-no-kanban-credentials",
  "browser-stream-payloads-inspected",
  "browser-receives-no-kanban-credentials",
  "restart-blocked-card-persists",
  "restart-blocking-comment-persists"
];
const REQUIRED_STEP_IDS = [
  "health",
  "create-review-board",
  "create-scoped-adapter-session",
  "create-button-variants-card",
  "open-kanban-board",
  "open-kanban-card-detail",
  "open-surfaceops-workbench",
  "reject-approval-decision",
  "reject-refinement-decision",
  "reject-variant-of-record",
  "complete-blocked-outcome-form",
  "submit-blocked-outcome",
  "replay-identical-blocked-outcome",
  "reject-conflicting-blocked-outcome",
  "verify-kanban-mirror",
  "card-event-history",
  "restart-persistence"
];
const REQUIRED_API_EXCHANGE_STEP_IDS = [
  "health",
  "create-review-board",
  "create-scoped-adapter-session",
  "create-button-variants-card",
  "reject-approval-decision",
  "reject-refinement-decision",
  "reject-variant-of-record",
  "mirror-card-blocked",
  "mirror-receipt-comment",
  "replay-identical-blocked-outcome",
  "reject-conflicting-blocked-outcome",
  "card-event-history",
  "restart-persistence"
];
const REQUIRED_API_EXCHANGE_STATUSES = ["pass", "pass", "pass", "pass", 400, 400, 400, "pass", "pass", 200, 409, "pass", "pass"];
const execFileAsync = promisify(execFile);

main().catch((error) => {
  console.error(`surfaceops-designer-review-ui browser proof failed: ${error.stack || error.message || String(error)}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = workspacePath(args.out || DEFAULT_OUT_DIR, "--out");
  const validators = await loadValidators();
  const {
    deterministicEvidence,
    workbench,
    deterministicReceipt
  } = await verifyDeterministicClosure(validators);

  const kanbanRoot = path.resolve(ROOT, args.kanbanRoot || DEFAULT_KANBAN_ROOT);
  await assertKanbanWorkspace(kanbanRoot);
  const kanbanCommit = await assertPinnedKanbanCommit(kanbanRoot);

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
    schemaId: "surfaceops-designer-review-ui-browser-functional-transcript.v0",
    version: DRUI_VERSION,
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
    await assertEqual(transcript, "agent-token-kept-server-side", true, runtimeState.agentToken === session.token && typeof session.token === "string");
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
    await context.addInitScript(() => {
      window.__surfaceOpsInboundStreamPayloads = [];
      window.__surfaceOpsStreamInspectionActive = false;
      const NativeEventSource = window.EventSource;
      if (typeof NativeEventSource !== "function") return;
      window.EventSource = class InstrumentedEventSource extends NativeEventSource {
        constructor(...eventSourceArgs) {
          super(...eventSourceArgs);
          for (const eventName of ["message", "connected", "workspace_changed"]) {
            this.addEventListener(eventName, (event) => {
              window.__surfaceOpsInboundStreamPayloads.push({ event: eventName, data: String(event.data || "") });
            });
          }
        }
      };
      window.__surfaceOpsStreamInspectionActive = true;
    });
    const browserRequestCredentialLeaks = [];
    const browserReceivedCredentialLeaks = [];
    const browserResponseScans = [];
    const browserCredentials = [adminToken, session.token];
    let browserStreamInspectionActive = true;
    context.on("request", (request) => {
      const headers = request.headers();
      const requestMaterial = [request.url(), request.postData() || "", ...Object.entries(headers).flat()].join("\n");
      const containsCredential = Boolean(headers.authorization) ||
        browserCredentials.some((secret) => secret && requestMaterial.includes(secret)) ||
        /(?:kcagt_|Bearer\s+)/i.test(requestMaterial);
      if (containsCredential) browserRequestCredentialLeaks.push(`${request.method()} ${redact(request.url())}`);
    });
    context.on("response", (response) => {
      const scan = scanBrowserResponseForCredentials(response, browserCredentials)
        .then((leaks) => browserReceivedCredentialLeaks.push(...leaks))
        .catch(() => browserReceivedCredentialLeaks.push(`response-scan-failed ${redact(response.url())}`));
      browserResponseScans.push(scan);
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
    const kanbanBeforeReviewScan = await scanBrowserPageState(page, browserCredentials, "kanban-before-review");
    browserReceivedCredentialLeaks.push(...kanbanBeforeReviewScan.leaks);
    browserStreamInspectionActive &&= kanbanBeforeReviewScan.streamInspectionActive;

    await browserStep(transcript, "open-surfaceops-workbench", "navigate SurfaceOps local review", async () => {
      await page.goto(reviewUrl, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "surfaceops-workbench-visible", "SurfaceOps Designer Review");
    await assertPageContains(page, transcript, "surfaceops-shows-button-evidence", "Button variants");
    await assertPageContains(page, transcript, "surfaceops-shows-diagnostics", "SOURCE_REVIEW_EXPIRED");
    await assertPageContains(page, transcript, "surfaceops-shows-renewal-required", "Renewal required before handoff");
    await assertEqual(transcript, "approval-control-disabled", true, await page.locator("[data-testid='approve-decision']").isDisabled());
    await assertEqual(transcript, "refinement-control-disabled", true, await page.locator("[data-testid='refine-decision']").isDisabled());
    await assertEqual(transcript, "variant-is-inspection-only", true, await page.locator("[data-testid='variant-select']").isDisabled());
    await assertEqual(transcript, "inspected-variant-is-evidence-bound", workbench.inspector.selectedVariantId, await page.locator("[data-testid='variant-select']").inputValue());
    await assertEqual(transcript, "blocked-submit-disabled-before-rationale", true, await page.locator("[data-testid='submit-decision']").isDisabled());
    await assertNoSecretText(page, transcript, "surfaceops-dom-has-no-tokens", [adminToken, session.token]);

    const rejectedApproval = await apiStatusStep(transcript, "reject-approval-decision", "POST", "/api/decisions", async () => requestStatus(surfaceOpsBaseUrl, "/api/decisions", {
      method: "POST",
      body: {
        decisionStatus: "approved for handoff",
        rationale: deterministicReceipt.rationale,
        variantOfRecord: null
      }
    }));
    await assertEqual(transcript, "approval-post-rejected", 400, rejectedApproval.status);
    const rejectedRefinement = await apiStatusStep(transcript, "reject-refinement-decision", "POST", "/api/decisions", async () => requestStatus(surfaceOpsBaseUrl, "/api/decisions", {
      method: "POST",
      body: {
        decisionStatus: "needs refinement",
        rationale: deterministicReceipt.rationale,
        variantOfRecord: null
      }
    }));
    await assertEqual(transcript, "refinement-post-rejected", 400, rejectedRefinement.status);
    const rejectedVariantOfRecord = await apiStatusStep(transcript, "reject-variant-of-record", "POST", "/api/decisions", async () => requestStatus(surfaceOpsBaseUrl, "/api/decisions", {
      method: "POST",
      body: {
        decisionStatus: "blocked",
        rationale: deterministicReceipt.rationale,
        variantOfRecord: { variantId: workbench.inspector.selectedVariantId }
      }
    }));
    await assertEqual(transcript, "variant-of-record-post-rejected", 400, rejectedVariantOfRecord.status);
    await assertEqual(transcript, "rejected-outcomes-create-no-receipt", null, runtimeState.receipt);
    await assertEqual(transcript, "rejected-outcomes-create-no-mirror", null, runtimeState.mirrorResult);
    await assertEqual(transcript, "rejected-outcomes-do-not-move-card", "needs-review", runtimeState.card?.laneId);

    await browserStep(transcript, "complete-blocked-outcome-form", "record rationale for blocked outcome", async () => {
      await page.locator("[data-testid='decision-rationale']").fill(deterministicReceipt.rationale);
      return await page.locator("[data-testid='submit-decision']").isDisabled();
    });
    await assertEqual(transcript, "blocked-submit-enabled-after-rationale", false, await page.locator("[data-testid='submit-decision']").isDisabled());
    await browserStep(transcript, "submit-blocked-outcome", "POST blocked SurfaceOps decision", async () => {
      await page.locator("[data-testid='submit-decision']").click();
      await page.getByTestId("receipt-id").waitFor({ state: "visible" });
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "receipt-visible", deterministicReceipt.decisionState);
    await assertPageContains(page, transcript, "receipt-shows-binding", bindingId);
    await assertEqual(transcript, "dag-decision-receipt-recorded", "recorded", await page.locator("[data-node-status-for='decision-receipt']").innerText());
    await assertEqual(transcript, "dag-kanban-mirror-blocked", "blocked", await page.locator("[data-node-status-for='kanban-mirror']").innerText());

    await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "card_updated");
    await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "comment_created");
    const mirrorResult = runtimeState.mirrorResult;
    await assertEqual(transcript, "runtime-decision-is-blocked", "blocked", runtimeState.receipt?.decisionStatus);
    await assertEqual(transcript, "runtime-mirrored-status-is-blocked", "blocked", runtimeState.receipt?.mirroredStatus);
    await assertEqual(transcript, "runtime-selected-variant-is-null", null, runtimeState.receipt?.selectedVariantId);
    await assertEqual(transcript, "runtime-variant-of-record-is-null", null, runtimeState.receipt?.variantOfRecord);
    await assertEqual(transcript, "runtime-diagnostic-code", "SOURCE_REVIEW_EXPIRED", runtimeState.receipt?.diagnosticCode);
    await assertEqual(transcript, "runtime-renewal-required", true, runtimeState.receipt?.renewalRequiredBeforeHandoff);
    await assertEqual(transcript, "runtime-handoff-ineligible", false, runtimeState.receipt?.handoffEligibility?.eligible);
    await assertEqual(transcript, "runtime-governance-is-evidence-bound", canonicalJson(deterministicEvidence.governanceOutcome), canonicalJson(runtimeState.receipt?.governanceOutcome));
    await assertEqual(transcript, "runtime-receipt-self-hash", sha256Hex(canonicalJson({ ...runtimeState.receipt, selfHash: "0".repeat(64) })), runtimeState.receipt?.selfHash);
    await assertEqual(transcript, "mirror-card-lane", "blocked", mirrorResult?.afterLaneId);
    await assertEqual(transcript, "mirror-comment-created", true, Boolean(mirrorResult?.commentId));
    await assertEqual(transcript, "mirror-diagnostic-code", "SOURCE_REVIEW_EXPIRED", mirrorResult?.diagnosticCode);
    await assertEqual(transcript, "mirror-renewal-required", true, mirrorResult?.renewalRequiredBeforeHandoff);
    await assertEqual(transcript, "mirror-summary-is-blocked", true, runtimeState.card?.summary.includes("status=blocked") && !runtimeState.card?.summary.includes("status=needs-review"));
    const identicalReplay = await apiStatusStep(transcript, "replay-identical-blocked-outcome", "POST", "/api/decisions", async () => requestStatus(surfaceOpsBaseUrl, "/api/decisions", {
      method: "POST",
      body: {
        decisionStatus: "blocked",
        rationale: deterministicReceipt.rationale,
        variantOfRecord: null
      }
    }));
    await assertEqual(transcript, "identical-replay-accepted", 200, identicalReplay.status);
    await assertEqual(transcript, "identical-replay-marked", true, identicalReplay.body?.replayed);
    await assertEqual(transcript, "identical-replay-preserves-receipt", runtimeState.receipt?.selfHash, identicalReplay.body?.receipt?.selfHash);
    await assertEqual(transcript, "identical-replay-preserves-comment", mirrorResult?.commentId, identicalReplay.body?.mirrorResult?.commentId);
    const conflictingReplay = await apiStatusStep(transcript, "reject-conflicting-blocked-outcome", "POST", "/api/decisions", async () => requestStatus(surfaceOpsBaseUrl, "/api/decisions", {
      method: "POST",
      body: {
        decisionStatus: "blocked",
        rationale: `${deterministicReceipt.rationale} Conflicting replay.`,
        variantOfRecord: null
      }
    }));
    await assertEqual(transcript, "conflicting-replay-rejected", 409, conflictingReplay.status);
    const surfaceOpsAfterDecisionScan = await scanBrowserPageState(page, browserCredentials, "surfaceops-after-decision");
    browserReceivedCredentialLeaks.push(...surfaceOpsAfterDecisionScan.leaks);
    browserStreamInspectionActive &&= surfaceOpsAfterDecisionScan.streamInspectionActive;
    const screenshotPath = path.join(outDir.fsPath, "surfaceops-designer-review-ui-final.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browserStep(transcript, "verify-kanban-mirror", "reload kanban.cards", async () => {
      await page.goto(kanbanBaseUrl, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      await page.waitForTimeout(700);
      return await page.locator("body").innerText();
    });
    await assertPageContains(page, transcript, "kanban-blocked-lane-visible", "Blocked");
    await assertPageContains(page, transcript, "kanban-card-still-visible", "Button variants");
    await page.getByText("Button variants").first().click();
    await page.waitForTimeout(500);
    await assertPageContains(page, transcript, "kanban-receipt-comment-visible", "SurfaceOps receipt");
    await assertPageContains(page, transcript, "kanban-comment-shows-blocking-diagnostic", "SOURCE_REVIEW_EXPIRED");
    await assertPageContains(page, transcript, "kanban-comment-shows-renewal-required", "renewal-required=true");
    const kanbanAfterMirrorScan = await scanBrowserPageState(page, browserCredentials, "kanban-after-mirror");
    browserReceivedCredentialLeaks.push(...kanbanAfterMirrorScan.leaks);
    browserStreamInspectionActive &&= kanbanAfterMirrorScan.streamInspectionActive;

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
    await assertEqual(transcript, "idempotent-replay-single-card-update", 1, cardEvents.events.filter((event) => event.payload.reason === "card_updated").length);
    await assertEqual(transcript, "idempotent-replay-single-comment", 1, cardEvents.events.filter((event) => event.payload.reason === "comment_created").length);
    await assertEqual(transcript, "lane-move-is-mirror-only", false, workbench.kanbanMirror.laneMovementCommitsDecision);
    await page.waitForTimeout(250);
    await Promise.all(browserResponseScans);
    const browserStorageState = await context.storageState();
    if (containsCredentialMaterial(canonicalJson(browserStorageState), browserCredentials)) {
      browserReceivedCredentialLeaks.push("browser-context-storage");
    }
    await assertEqual(transcript, "browser-requests-have-no-kanban-credentials", "none", browserRequestCredentialLeaks.length === 0 ? "none" : browserRequestCredentialLeaks.join("; "));
    await assertEqual(transcript, "browser-stream-payloads-inspected", true, browserStreamInspectionActive);
    await assertEqual(transcript, "browser-receives-no-kanban-credentials", "none", browserReceivedCredentialLeaks.length === 0 ? "none" : browserReceivedCredentialLeaks.join("; "));

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
      await assertEqual(transcript, "restart-blocked-card-persists", "blocked", persistedCard?.laneId);
      await assertEqual(transcript, "restart-blocking-comment-persists", true, (persistedCard?.comments || []).some((comment) => comment.text.includes("SOURCE_REVIEW_EXPIRED") && comment.text.includes("renewal-required=true")));
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
  const kanbanBindingPath = path.join(outDir.fsPath, "kanban-card-binding.json");
  const runtimeReceiptPath = path.join(outDir.fsPath, "surfaceops-decision-receipt.json");
  const kanbanMirrorResultPath = path.join(outDir.fsPath, "kanban-mirror-result.json");
  const transcriptDocument = redact({
    schemaId: transcript.schemaId,
    version: transcript.version,
    scenarioId: transcript.scenarioId,
    targetId: transcript.targetId,
    steps: transcript.steps,
    assertions: transcript.assertions,
    tokensRedacted: true
  });
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-transcript.v0", transcriptDocument, "browser functional transcript");
  await fs.writeFile(transcriptPath, canonicalJson(transcriptDocument));
  await fs.writeFile(apiLogPath, canonicalJson(redact(transcript.apiExchanges)));
  await fs.writeFile(kanbanBindingPath, canonicalJson(redact({
    bindingId,
    boardId: runtimeState.board?.id,
    cardId: runtimeState.card?.id,
    reviewUrl: "http://127.0.0.1:<redacted-port>/review/<bindingId>",
    evidenceHash: deterministicEvidence.artifacts.at(-1).hash
  })));
  await fs.writeFile(runtimeReceiptPath, canonicalJson(redact(runtimeState.receipt)));
  await fs.writeFile(kanbanMirrorResultPath, canonicalJson(redact(runtimeState.mirrorResult)));

  if (!pageVideo) throw contractError("browser scenario did not create a video recorder", 1);
  const tempVideoPath = await pageVideo.path();
  const videoPath = path.join(outDir.fsPath, "surfaceops-designer-review-ui-browser.webm");
  await fs.rename(tempVideoPath, videoPath);
  await fs.rm(path.join(outDir.fsPath, "video-tmp"), { recursive: true, force: true });

  const deterministicEvidenceRef = artifactRef(DETERMINISTIC_EVIDENCE_PATH, "surfaceops-designer-review-ui-evidence.v0", computeSurfaceopsDesignerReviewUiEvidenceSelfHash(deterministicEvidence));
  const recordingRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-designer-review-ui-browser.webm"), "webm-video.v0", "video/webm");
  const screenshotRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-designer-review-ui-final.png"), "png-image.v0", "image/png");
  const transcriptRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-transcript.json"), "surfaceops-designer-review-ui-browser-functional-transcript.v0", "application/json");
  const apiExchangeRef = await browserFileRef(path.posix.join(outDir.posixPath, "redacted-api-exchange-log.json"), "surfaceops-designer-review-ui-redacted-api-exchange-log.v0", "application/json");
  const kanbanBindingRef = await browserFileRef(path.posix.join(outDir.posixPath, "kanban-card-binding.json"), "surfaceops-designer-review-ui-kanban-binding-runtime.v0", "application/json");
  const runtimeDecisionReceiptRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-decision-receipt.json"), "surfaceops-designer-review-decision-receipt-runtime.v0", "application/json");
  const kanbanMirrorResultRef = await browserFileRef(path.posix.join(outDir.posixPath, "kanban-mirror-result.json"), "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0", "application/json");
  const mirrorResult = redact(runtimeState.mirrorResult);
  const report = {
    schemaId: "surfaceops-designer-review-ui-browser-functional-report.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    scenarioId: DRUI_SCENARIO_ID,
    status: "pass",
    promotionStatus: deterministicEvidence.promotionStatus,
    governanceOutcome: deterministicEvidence.governanceOutcome,
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
    kanbanBindingRef,
    runtimeDecisionReceiptRef,
    kanbanMirrorResultRef,
    provenance: provenance("surfaceops-designer-review-ui-browser-functional-report", [
      DETERMINISTIC_EVIDENCE_PATH,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      apiExchangeRef.path,
      kanbanBindingRef.path,
      runtimeDecisionReceiptRef.path,
      kanbanMirrorResultRef.path
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
    governanceOutcome: deterministicEvidence.governanceOutcome,
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
    kanbanBindingRef,
    runtimeDecisionReceiptRef,
    kanbanMirrorResultRef,
    assertions: transcript.assertions,
    mirrorResult,
    selfHash: "0".repeat(64),
    provenance: provenance("surfaceops-designer-review-ui-browser-functional-evidence", [
      DETERMINISTIC_EVIDENCE_PATH,
      reportRef.path,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      apiExchangeRef.path,
      kanbanBindingRef.path,
      runtimeDecisionReceiptRef.path,
      kanbanMirrorResultRef.path
    ])
  };
  evidence.selfHash = sha256Hex(canonicalJson(evidence));
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-evidence.v0", evidence, "browser functional evidence");
  const browserEvidencePath = path.join(outDir.fsPath, "browser-functional-evidence.json");
  await fs.writeFile(browserEvidencePath, canonicalJson(evidence));
  const persistedBrowserEvidence = await readJson(browserEvidencePath);
  await verifyBrowserEvidenceClosure({
    validators,
    evidence: persistedBrowserEvidence,
    outDir,
    credentials: [adminToken, runtimeState.agentToken]
  });

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
    if (body?.decisionStatus !== "blocked") throw httpError(400, "source governance permits only a blocked outcome");
    if (body?.variantOfRecord !== null) throw httpError(400, "blocked outcome must not declare a variant of record");
    if (typeof body?.rationale !== "string" || body.rationale.trim().length < 8) throw httpError(400, "rationale is required");
    const evidenceHash = state.deterministicEvidence.artifacts.at(-1).hash;
    const rationale = body.rationale.trim();
    if (state.receipt) {
      const identicalReplay =
        state.receipt.decisionStatus === "blocked" &&
        state.receipt.variantOfRecord === null &&
        state.receipt.rationale === rationale &&
        state.receipt.evidenceHash === evidenceHash &&
        state.receipt.kanbanBinding?.bindingId === state.bindingId &&
        state.mirrorResult?.receiptId === state.receipt.receiptId;
      if (!identicalReplay) throw httpError(409, "a conflicting receipt already exists for this review item and evidence hash");
      writeJson(res, 200, redact({ receipt: state.receipt, mirrorResult: state.mirrorResult, replayed: true }));
      return;
    }
    const receipt = {
      schemaId: "surfaceops-designer-review-decision-receipt-runtime.v0",
      receiptId: `surfaceops-review:${state.bindingId}:${evidenceHash.slice(0, 12)}`,
      reviewItemId: "review-item.button.primary",
      componentId: DRUI_COMPONENT_ID,
      decisionStatus: "blocked",
      mirroredStatus: "blocked",
      selectedVariantId: null,
      variantOfRecord: null,
      rationale,
      evidenceHash,
      diagnosticCode: "SOURCE_REVIEW_EXPIRED",
      renewalRequiredBeforeHandoff: true,
      governanceOutcome: state.deterministicEvidence.governanceOutcome,
      handoffEligibility: state.deterministicReceipt.handoffEligibility,
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
    const beforeLaneId = state.card.laneId;
    const summary = [
      state.card.summary.replace("status=needs-review", "status=blocked"),
      `receiptId=${receipt.receiptId}`,
      `receiptHash=${receipt.selfHash}`,
      "mirroredStatus=blocked",
      "diagnosticCode=SOURCE_REVIEW_EXPIRED",
      "renewalRequiredBeforeHandoff=true"
    ].join(" ");
    const card = await surfaceOpsApiStep(state, "mirror-card-blocked", "PATCH", "/boards/:boardId/work-items/:itemId", async () => requestJson(state.kanbanApiBaseUrl, `/boards/${encodeURIComponent(state.board.id)}/work-items/${encodeURIComponent(state.card.id)}`, {
      method: "PATCH",
      headers: agentHeaders,
      body: {
        laneId: "blocked",
        summary
      }
    }));
    const comment = await surfaceOpsApiStep(state, "mirror-receipt-comment", "POST", "/boards/:boardId/work-items/:itemId/comments", async () => requestJson(state.kanbanApiBaseUrl, `/boards/${encodeURIComponent(state.board.id)}/work-items/${encodeURIComponent(state.card.id)}/comments`, {
      method: "POST",
      headers: agentHeaders,
      body: {
        kind: "change_request",
        status: "open",
        text: `SurfaceOps receipt ${receipt.receiptId} ${receipt.selfHash} blocked by SOURCE_REVIEW_EXPIRED; renewal-required=true before handoff.`
      }
    }));
    state.receipt = receipt;
    state.card = card;
    state.mirrorResult = {
      bindingId: state.bindingId,
      receiptId: receipt.receiptId,
      receiptHash: receipt.selfHash,
      cardId: card.id,
      beforeLaneId,
      afterLaneId: card.laneId,
      commentId: comment.id,
      commentKind: comment.kind,
      commentStatus: comment.status,
      diagnosticCode: "SOURCE_REVIEW_EXPIRED",
      renewalRequiredBeforeHandoff: true,
      mirrorOnly: true,
      laneMovementCommitsDecision: false
    };
    writeJson(res, 201, redact({ receipt, mirrorResult: state.mirrorResult, replayed: false }));
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
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    .secondary { border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; font-weight: 800; }
    .secondary:disabled { color: #788491; background: #eef1f4; cursor: not-allowed; }
    .primary { margin-top: 12px; border: 0; border-radius: 8px; background: var(--amber); color: #fff; padding: 10px 14px; font-weight: 900; cursor: pointer; }
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
        ${workbench.dag.nodes.map((node, index) => `<button class="${index === 3 ? "selected" : ""}" type="button" data-testid="dag-node" data-node-id="${escapeAttribute(node.nodeId)}">${escapeHtml(node.label)} <small data-testid="dag-node-status" data-node-status-for="${escapeAttribute(node.nodeId)}">${escapeHtml(node.status)}</small></button>`).join("")}
      </div>
      <ul class="diagnostics">${workbench.inspector.blockingRisks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>
      <p><strong>Renewal required before handoff.</strong> Inspection remains available, but governance disables approval and refinement.</p>
    </section>
    <section>
      <h2>Button variants</h2>
      <div class="specimen">
        <p>Evidence refs: <code>${escapeHtml(receipt.evidenceRefs.map((ref) => ref.path).join(", "))}</code></p>
        <button class="sample-button" type="button">Primary</button>
        <button class="sample-button" type="button" style="background:#295f9f">Secondary</button>
      </div>
      <label>Inspected variant (evidence-bound, not a variant of record)
        <select data-testid="variant-select" disabled>
          <option value="${escapeAttribute(workbench.inspector.selectedVariantId)}" selected>${escapeHtml(workbench.inspector.selectedVariantId)}</option>
        </select>
      </label>
      <div class="actions" aria-label="Unavailable promoting outcomes">
        <button class="secondary" data-testid="approve-decision" type="button" disabled>Approve for handoff unavailable</button>
        <button class="secondary" data-testid="refine-decision" type="button" disabled>Request refinement unavailable</button>
      </div>
      <label>Rationale
        <textarea data-testid="decision-rationale" placeholder="Explain why the outcome remains blocked"></textarea>
      </label>
      <button class="primary" data-testid="submit-decision" type="button" disabled>Record blocked outcome</button>
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
    function setDagStatus(nodeId, status) {
      document.querySelector("[data-node-status-for='" + nodeId + "']").textContent = status;
    }
    function refresh() { submit.disabled = rationale.value.trim().length < 8; }
    rationale.addEventListener("input", refresh);
    submit.addEventListener("click", async () => {
      submit.disabled = true;
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionStatus: "blocked", rationale: rationale.value, variantOfRecord: null })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Decision failed");
      receipt.classList.add("visible");
      document.querySelector("[data-testid='receipt-status']").textContent = payload.receipt.decisionStatus;
      document.querySelector("[data-testid='receipt-id']").textContent = payload.receipt.receiptId;
      setDagStatus("decision-receipt", "recorded");
      setDagStatus("kanban-mirror", "blocked");
      submit.textContent = "Blocked outcome recorded";
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

async function requestStatus(apiBaseUrl, route, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { method: options.method || "GET", headers };
  if (options.body !== undefined) {
    init.headers = { ...headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${apiBaseUrl}${route}`, init);
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

async function apiStep(transcript, stepId, method, route, fn) {
  const result = await fn();
  transcript.steps.push({ stepId, action: `${method} ${route}`, status: "pass", detail: summarize(result) });
  transcript.apiExchanges.push({ stepId, method, route, status: "pass", response: summarize(result) });
  return result;
}

async function apiStatusStep(transcript, stepId, method, route, fn) {
  const result = await fn();
  transcript.steps.push({ stepId, action: `${method} ${route}`, status: "pass", detail: summarize(result) });
  transcript.apiExchanges.push({ stepId, method, route, status: result.status, response: summarize(result.body) });
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

async function scanBrowserResponseForCredentials(response, credentials) {
  const leaks = [];
  const responseLabel = `${response.status()} ${redact(response.url())}`;
  const headers = await response.allHeaders();
  if (containsCredentialMaterial(canonicalJson(headers), credentials)) {
    leaks.push(`response-headers ${responseLabel}`);
  }
  const status = response.status();
  const contentType = String(headers["content-type"] || "").toLowerCase();
  if (contentType.includes("text/event-stream") || status === 204 || status === 304 || (status >= 300 && status < 400)) return leaks;
  const body = await withTimeout(response.body(), 5_000, "browser response body scan timed out");
  if (containsCredentialMaterial(body, credentials)) leaks.push(`response-body ${responseLabel}`);
  return leaks;
}

async function scanBrowserPageState(page, credentials, label) {
  const leaks = [];
  const html = await page.content();
  if (containsCredentialMaterial(html, credentials)) leaks.push(`${label}-html`);
  const storage = await page.evaluate(() => ({
    cookie: document.cookie,
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
    streamInspectionActive: window.__surfaceOpsStreamInspectionActive === true,
    streamPayloads: Array.isArray(window.__surfaceOpsInboundStreamPayloads) ? window.__surfaceOpsInboundStreamPayloads : null
  }));
  if (containsCredentialMaterial(canonicalJson(storage), credentials)) leaks.push(`${label}-storage`);
  return { leaks, streamInspectionActive: storage.streamInspectionActive };
}

function containsCredentialMaterial(value, credentials) {
  if (Buffer.isBuffer(value)) {
    return credentials.some((credential) => credential && value.indexOf(Buffer.from(credential)) >= 0);
  }
  const text = typeof value === "string" ? value : canonicalJson(value);
  return credentials.some((credential) => credential && text.includes(credential));
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
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
      if (key === "tokensRedacted") output[key] = entry;
      else if (/token|authorization|secret|cookie/i.test(key)) output[key] = "[REDACTED]";
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
  for (const file of [...DRUI_SCHEMA_FILES, ...DRUI_CONSUMED_SCHEMA_FILES]) {
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

async function verifyDeterministicClosure(validators) {
  const deterministicEvidence = await readJson(path.join(ROOT, DETERMINISTIC_EVIDENCE_PATH));
  assertSchema(validators, "surfaceops-designer-review-ui-evidence.v0", deterministicEvidence, DETERMINISTIC_EVIDENCE_PATH);
  const closure = await verifySurfaceopsDesignerReviewUiEvidenceClosure({
    cwd: ROOT,
    evidence: deterministicEvidence,
    evidencePath: DETERMINISTIC_EVIDENCE_PATH,
    assertSchema: (schemaId, data, label) => assertSchema(validators, schemaId, data, label)
  });
  const workbench = closure.generated["surfaceops-designer-review-workbench.v0"];
  const deterministicReceipt = closure.generated["surfaceops-designer-review-decision-receipt.v0"];
  const workbenchRef = deterministicEvidence.artifacts.find((ref) => ref.path === WORKBENCH_PATH);
  assertRefMatches(deterministicReceipt.workbenchRef, workbenchRef, "decision receipt workbench ref");
  assertBlockedSourceGovernance({
    designerEvidence: closure.upstream.designerEvidence,
    designerReport: closure.upstream.designerReport,
    governanceOutcome: closure.governanceOutcome,
    workbench,
    deterministicReceipt
  });
  return { deterministicEvidence, workbench, deterministicReceipt };
}

function assertRefMatches(actual, expected, label) {
  if (!actual || !expected || canonicalJson(actual) !== canonicalJson(expected)) {
    throw contractError(`${label} does not match the accepted evidence ref`, 1);
  }
}

async function verifyBrowserEvidenceClosure({ validators, evidence, outDir, credentials }) {
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-evidence.v0", evidence, "persisted browser functional evidence");
  const hashCandidate = { ...evidence, selfHash: "0".repeat(64) };
  if (evidence.selfHash !== sha256Hex(canonicalJson(hashCandidate))) {
    throw contractError("persisted browser functional evidence self-hash is invalid", 1);
  }
  const runtimeRefs = [
    evidence.reportRef,
    evidence.recordingRef,
    evidence.screenshotRef,
    evidence.transcriptRef,
    evidence.apiExchangeRef,
    evidence.kanbanBindingRef,
    evidence.runtimeDecisionReceiptRef,
    evidence.kanbanMirrorResultRef
  ];
  const expectedRuntimeRefs = [
    ["browser-functional-report.json", "surfaceops-designer-review-ui-browser-functional-report.v0", "application/json"],
    ["surfaceops-designer-review-ui-browser.webm", "webm-video.v0", "video/webm"],
    ["surfaceops-designer-review-ui-final.png", "png-image.v0", "image/png"],
    ["browser-functional-transcript.json", "surfaceops-designer-review-ui-browser-functional-transcript.v0", "application/json"],
    ["redacted-api-exchange-log.json", "surfaceops-designer-review-ui-redacted-api-exchange-log.v0", "application/json"],
    ["kanban-card-binding.json", "surfaceops-designer-review-ui-kanban-binding-runtime.v0", "application/json"],
    ["surfaceops-decision-receipt.json", "surfaceops-designer-review-decision-receipt-runtime.v0", "application/json"],
    ["kanban-mirror-result.json", "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0", "application/json"]
  ].map(([file, schemaId, mimeType]) => ({
    path: path.posix.join(outDir.posixPath, file),
    schemaId,
    mimeType
  }));
  const runtimeRefIdentities = runtimeRefs.map(({ path: refPath, schemaId, mimeType }) => ({ path: refPath, schemaId, mimeType }));
  if (new Set(runtimeRefs.map((ref) => ref.path)).size !== runtimeRefs.length || canonicalJson(runtimeRefIdentities) !== canonicalJson(expectedRuntimeRefs)) {
    throw contractError("browser functional evidence runtime closure is not exact and ordered", 1);
  }
  for (const ref of runtimeRefs) {
    const bytes = await fs.readFile(path.join(ROOT, ref.path));
    const actualHash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (actualHash !== ref.hash) throw contractError(`browser runtime hash mismatch for ${ref.path}`, 1);
  }

  const [report, transcript, apiExchangeLog, kanbanBinding, runtimeReceipt, persistedMirrorResult] = await Promise.all([
    readJson(path.join(ROOT, evidence.reportRef.path)),
    readJson(path.join(ROOT, evidence.transcriptRef.path)),
    readJson(path.join(ROOT, evidence.apiExchangeRef.path)),
    readJson(path.join(ROOT, evidence.kanbanBindingRef.path)),
    readJson(path.join(ROOT, evidence.runtimeDecisionReceiptRef.path)),
    readJson(path.join(ROOT, evidence.kanbanMirrorResultRef.path))
  ]);
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-report.v0", report, evidence.reportRef.path);
  assertSchema(validators, "surfaceops-designer-review-ui-browser-functional-transcript.v0", transcript, evidence.transcriptRef.path);
  assertSchema(validators, "surfaceops-designer-review-ui-redacted-api-exchange-log.v0", apiExchangeLog, evidence.apiExchangeRef.path);
  assertSchema(validators, "surfaceops-designer-review-ui-kanban-binding-runtime.v0", kanbanBinding, evidence.kanbanBindingRef.path);
  assertSchema(validators, "surfaceops-designer-review-decision-receipt-runtime.v0", runtimeReceipt, evidence.runtimeDecisionReceiptRef.path);
  assertSchema(validators, "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0", persistedMirrorResult, evidence.kanbanMirrorResultRef.path);

  if (
    evidence.deterministicEvidenceRef?.path !== DETERMINISTIC_EVIDENCE_PATH ||
    evidence.deterministicEvidenceRef?.schemaId !== "surfaceops-designer-review-ui-evidence.v0"
  ) {
    throw contractError("browser evidence deterministic evidence ref targets an unexpected contract", 1);
  }
  const deterministicEvidence = await readJson(path.join(ROOT, DETERMINISTIC_EVIDENCE_PATH));
  assertSchema(validators, "surfaceops-designer-review-ui-evidence.v0", deterministicEvidence, DETERMINISTIC_EVIDENCE_PATH);
  const deterministicClosure = await verifySurfaceopsDesignerReviewUiEvidenceClosure({
    cwd: ROOT,
    evidence: deterministicEvidence,
    evidencePath: DETERMINISTIC_EVIDENCE_PATH,
    assertSchema: (schemaId, data, label) => assertSchema(validators, schemaId, data, label)
  });
  const expectedDeterministicEvidenceRef = artifactRef(
    DETERMINISTIC_EVIDENCE_PATH,
    "surfaceops-designer-review-ui-evidence.v0",
    computeSurfaceopsDesignerReviewUiEvidenceSelfHash(deterministicEvidence)
  );
  assertRefMatches(evidence.deterministicEvidenceRef, expectedDeterministicEvidenceRef, "browser evidence deterministic evidence ref");
  assertRefMatches(report.deterministicEvidenceRef, expectedDeterministicEvidenceRef, "browser report deterministic evidence ref");

  const deterministicReceipt = deterministicClosure.generated["surfaceops-designer-review-decision-receipt.v0"];
  const expectedReceiptHash = sha256Hex(canonicalJson({ ...runtimeReceipt, selfHash: "0".repeat(64) }));
  if (runtimeReceipt.selfHash !== expectedReceiptHash) {
    throw contractError("persisted runtime decision receipt self-hash is invalid", 1);
  }
  if (
    canonicalJson(persistedMirrorResult) !== canonicalJson(evidence.mirrorResult) ||
    runtimeReceipt.receiptId !== persistedMirrorResult.receiptId ||
    runtimeReceipt.selfHash !== persistedMirrorResult.receiptHash ||
    runtimeReceipt.mirroredStatus !== persistedMirrorResult.afterLaneId ||
    runtimeReceipt.diagnosticCode !== persistedMirrorResult.diagnosticCode ||
    runtimeReceipt.renewalRequiredBeforeHandoff !== persistedMirrorResult.renewalRequiredBeforeHandoff ||
    runtimeReceipt.kanbanBinding?.bindingId !== persistedMirrorResult.bindingId ||
    runtimeReceipt.kanbanBinding?.cardId !== persistedMirrorResult.cardId ||
    kanbanBinding.bindingId !== persistedMirrorResult.bindingId ||
    kanbanBinding.cardId !== persistedMirrorResult.cardId ||
    kanbanBinding.boardId !== runtimeReceipt.kanbanBinding?.boardId ||
    kanbanBinding.reviewUrl !== "http://127.0.0.1:<redacted-port>/review/<bindingId>" ||
    kanbanBinding.evidenceHash !== expectedDeterministicEvidenceRef.hash ||
    runtimeReceipt.evidenceHash !== expectedDeterministicEvidenceRef.hash
  ) {
    throw contractError("persisted browser binding, receipt, and mirror artifacts do not describe one evidence-bound outcome", 1);
  }
  for (const [label, actual, expected] of [
    ["runtime receipt evidence refs", runtimeReceipt.evidenceRefs, deterministicReceipt.evidenceRefs],
    ["runtime receipt governance", runtimeReceipt.governanceOutcome, deterministicReceipt.governanceOutcome],
    ["runtime receipt handoff eligibility", runtimeReceipt.handoffEligibility, deterministicReceipt.handoffEligibility]
  ]) {
    if (canonicalJson(actual) !== canonicalJson(expected)) {
      throw contractError(`${label} does not match deterministic evidence`, 1);
    }
  }
  if (
    canonicalJson(apiExchangeLog.map((entry) => entry.stepId)) !== canonicalJson(REQUIRED_API_EXCHANGE_STEP_IDS) ||
    canonicalJson(apiExchangeLog.map((entry) => entry.status)) !== canonicalJson(REQUIRED_API_EXCHANGE_STATUSES)
  ) {
    throw contractError("persisted API exchange log does not contain the exact ordered exchange contract", 1);
  }
  if (containsCredentialMaterial(canonicalJson(apiExchangeLog), credentials)) {
    throw contractError("persisted API exchange log contains kanban credential material", 1);
  }

  for (const field of ["status", "promotionStatus", "governanceOutcome", "command", "assertions", "mirrorResult"]) {
    if (canonicalJson(report[field]) !== canonicalJson(evidence[field])) {
      throw contractError(`browser report and evidence ${field} differ`, 1);
    }
  }
  for (const field of ["status", "promotionStatus", "governanceOutcome"]) {
    if (canonicalJson(evidence[field]) !== canonicalJson(deterministicEvidence[field])) {
      throw contractError(`browser evidence ${field} does not match deterministic evidence`, 1);
    }
  }
  if (evidence.command !== COMMAND || report.command !== COMMAND) {
    throw contractError("browser report and evidence command does not match the proof command", 1);
  }
  if (!evidence.assertions.every((assertion) => assertion.status === "pass") || !report.steps.every((step) => step.status === "pass")) {
    throw contractError("pass browser evidence requires every assertion and step to pass", 1);
  }
  const assertionIds = evidence.assertions.map((assertion) => assertion.assertionId);
  const stepIds = report.steps.map((step) => step.stepId);
  if (canonicalJson(assertionIds) !== canonicalJson(REQUIRED_ASSERTION_IDS) || canonicalJson(stepIds) !== canonicalJson(REQUIRED_STEP_IDS)) {
    throw contractError("browser functional evidence does not contain the exact ordered assertion and step contract", 1);
  }
  if (
    transcript.tokensRedacted !== true ||
    canonicalJson(transcript.assertions) !== canonicalJson(evidence.assertions) ||
    canonicalJson(transcript.steps) !== canonicalJson(report.steps)
  ) {
    throw contractError("browser transcript does not match the persisted report and evidence contract", 1);
  }
  for (const field of ["recordingRef", "screenshotRef", "transcriptRef", "apiExchangeRef", "kanbanBindingRef", "runtimeDecisionReceiptRef", "kanbanMirrorResultRef"]) {
    assertRefMatches(report[field], evidence[field], `browser report ${field}`);
  }
}

function assertBlockedSourceGovernance({ designerEvidence, designerReport, governanceOutcome, workbench, deterministicReceipt }) {
  const governance = designerReport.sourceConformanceGovernance;
  const lifecycle = governance?.exceptionLifecycle;
  if (
    designerEvidence.promotionStatus !== "blocked" ||
    governance?.targetHandoffAllowed !== false ||
    governance?.diagnosticCode !== "SOURCE_REVIEW_EXPIRED" ||
    lifecycle?.status !== "expired-blocked" ||
    lifecycle?.expiredDiagnosticCode !== "SOURCE_REVIEW_EXPIRED" ||
    lifecycle?.renewalRequiredBeforeHandoff !== true
  ) {
    throw contractError("designer workflow trace must block handoff with SOURCE_REVIEW_EXPIRED and require renewal", 1);
  }
  const allowedActions = workbench.decisionPanel?.allowedActions || [];
  if (
    workbench.decisionPanel?.rationaleRequired !== true ||
    workbench.decisionPanel?.actionControls?.approveForHandoff !== false ||
    workbench.decisionPanel?.actionControls?.requestRefinement !== false ||
    workbench.decisionPanel?.actionControls?.recordBlocked !== true ||
    !allowedActions.includes("block") ||
    allowedActions.includes("approve for handoff") ||
    allowedActions.includes("request refinement") ||
    !workbench.inspector?.blockingRisks?.includes("SOURCE_REVIEW_EXPIRED") ||
    workbench.kanbanMirror?.afterStatus !== "blocked"
  ) {
    throw contractError("SurfaceOps workbench must expose inspection and permit only a rationale-backed blocked outcome", 1);
  }
  if (
    deterministicReceipt.decisionState !== "blocked" ||
    deterministicReceipt.mirroredKanbanStatus !== "blocked" ||
    deterministicReceipt.selectedVariantId !== null ||
    deterministicReceipt.variantOfRecord !== null
  ) {
    throw contractError("deterministic decision receipt must be blocked and must not declare a variant of record", 1);
  }
  for (const outcome of [workbench.governanceOutcome, deterministicReceipt.governanceOutcome]) {
    if (canonicalJson(outcome) !== canonicalJson(governanceOutcome)) {
      throw contractError("SurfaceOps browser inputs must preserve the accepted blocked governance outcome", 1);
    }
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
