#!/usr/bin/env node
import crypto from "node:crypto";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
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
  KL_ARTIFACT_ROOT,
  KL_KANBAN_CARDS_COMMIT,
  KL_RUNTIME_OUTPUT_ROOT,
  KL_SCENARIO_ID,
  KL_SCHEMA_FILES,
  KL_SCHEMA_ROOT,
  KL_TARGET_ID,
  KL_VERSION,
  artifactRef,
  provenance
} from "../src/surfaceops-kanban-live-contract.js";
import { surfaceopsKanbanLiveInternals } from "../src/surfaceops-kanban-live-proof.js";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = KL_RUNTIME_OUTPUT_ROOT;
const DEFAULT_KANBAN_ROOT = "../kanban.cards";
const LIVE_EVIDENCE_PATH = `${KL_ARTIFACT_ROOT}/evidence.json`;
const COMMAND = "npm run proof:surfaceops-kanban-live:browser";
const VIEWPORT = { width: 1360, height: 860 };
const execFileAsync = promisify(execFile);

main().catch((error) => {
  console.error(`surfaceops-kanban-live browser proof failed: ${error.stack || error.message || String(error)}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = workspacePath(args.out || DEFAULT_OUT_DIR, "--out");
  const kanbanRoot = path.resolve(ROOT, args.kanbanRoot || DEFAULT_KANBAN_ROOT);
  await assertKanbanWorkspace(kanbanRoot);
  const kanbanCommit = await assertPinnedKanbanCommit(kanbanRoot);

  const validators = await loadValidators();
  const liveEvidence = await readJson(path.join(ROOT, LIVE_EVIDENCE_PATH));
  await verifyLiveEvidence(liveEvidence);

  await fs.rm(outDir.fsPath, { recursive: true, force: true });
  await fs.mkdir(outDir.fsPath, { recursive: true });
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "surfaceops-kanban-live-"));
  const adminToken = `redacted-admin-${crypto.randomBytes(6).toString("hex")}`;
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const apiBaseUrl = `${baseUrl}/api`;
  const transcript = {
    scenarioId: KL_SCENARIO_ID,
    targetId: KL_TARGET_ID,
    baseUrl: "http://127.0.0.1:<redacted-port>",
    steps: [],
    assertions: [],
    apiExchanges: [],
    tokensRedacted: true
  };

  const server = startKanbanServer({
    kanbanRoot,
    port,
    dataPath: path.join(tempDir, "state.json"),
    tokenDataPath: path.join(tempDir, "agent-tokens.json"),
    eventDataPath: path.join(tempDir, "events.jsonl"),
    adminToken
  });

  let browser = null;
  let pageVideo = null;
  try {
    await waitForHealth(apiBaseUrl, adminToken);
    await apiStep(transcript, "health", "GET", "/health", async () => requestJson(apiBaseUrl, "/health"));
    await assertEqual(transcript, "health-ok", true, (await requestJson(apiBaseUrl, "/health")).ok);

    await apiStep(transcript, "unauthenticated-write-denied", "POST", "/boards", async () => {
      const response = await fetch(`${apiBaseUrl}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Denied board" })
      });
      return { status: response.status };
    });
    const deniedWrite = await fetch(`${apiBaseUrl}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Denied board" })
    });
    await assertEqual(transcript, "unauthenticated-write-status", 401, deniedWrite.status);

    const adminHeaders = bearerHeaders(adminToken);
    const board = await apiStep(transcript, "bootstrap-board", "POST", "/boards", async () => requestJson(apiBaseUrl, "/boards", {
      method: "POST",
      headers: adminHeaders,
      body: {
        name: "SurfaceOps Approvals",
        lanes: [
          lane("Review Required", "Evidence-backed SurfaceOps review is needed.", "surfaceops-adapter", "surfaceops-reviewer"),
          lane("Changes Requested", "Reviewer requested authority-layer changes.", "surfaceops-adapter", "surfaceops-reviewer"),
          lane("Approved", "A structured SurfaceOps decision was recorded.", "surfaceops-adapter", "surfaceops-reviewer")
        ],
        agentSpecs: [
          agent("surfaceops-adapter", "SurfaceOps Adapter", "Adapter", ["review-required", "changes-requested", "approved"]),
          agent("surfaceops-reviewer", "SurfaceOps Reviewer", "Reviewer", ["review-required", "changes-requested", "approved"])
        ]
      }
    }));
    await assertEqual(transcript, "board-created-name", "SurfaceOps Approvals", board.name);

    const session = await apiStep(transcript, "create-agent-session", "POST", "/boards/:boardId/agent-sessions", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/agent-sessions`, {
      method: "POST",
      headers: adminHeaders,
      body: {
        agentId: "surfaceops-adapter",
        label: "SurfaceOps live proof adapter",
        capabilities: ["view", "create", "update", "comment", "move"],
        reason: "Local SurfaceOps kanban live browser proof."
      }
    }));
    await assertEqual(transcript, "agent-token-redacted", false, JSON.stringify(redact(session)).includes(session.token));
    const agentHeaders = bearerHeaders(session.token);

    const stream = await openSse(`${apiBaseUrl}/events`, adminHeaders);
    try {
      await stream.messages.next((message) => message.event === "connected");
      const evidenceHash = liveEvidence.artifacts.find((ref) => ref.path === LIVE_EVIDENCE_PATH)?.hash || surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(liveEvidence);
      const marker = `SURFACEOPS_REF reviewItemId=review-item.button.primary evidenceHash=${evidenceHash} decision=structured-surfaceops-required`;
      const card = await apiStep(transcript, "create-evidence-card", "POST", "/boards/:boardId/work-items", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/work-items`, {
        method: "POST",
        headers: agentHeaders,
        body: {
          title: "Button primary approval review",
          summary: marker,
          laneId: "review-required",
          ownerAgentId: "surfaceops-adapter",
          reviewerAgentId: "surfaceops-reviewer"
        }
      }));
      await assertEqual(transcript, "card-created-lane", "review-required", card.laneId);
      const createdEvent = await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "card_created");
      const createdEventId = createdEvent.id;
      await assertEqual(transcript, "sse-card-created", "card_created", JSON.parse(createdEvent.data).payload.reason);

      browser = await chromium.launch({ headless: true });
      const videoDir = path.join(outDir.fsPath, "video-tmp");
      await fs.mkdir(videoDir, { recursive: true });
      const context = await browser.newContext({
        viewport: VIEWPORT,
        recordVideo: { dir: videoDir, size: VIEWPORT }
      });
      const page = await context.newPage();
      pageVideo = page.video();
      await browserStep(transcript, "open-real-kanban-board", "navigate", async () => {
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await page.locator("body").waitFor({ state: "visible" });
        return await page.locator("body").innerText();
      });
      await assertPageContains(page, transcript, "browser-shows-board", "SurfaceOps Approvals");
      await assertPageContains(page, transcript, "browser-shows-card", "Button primary approval review");

      const moved = await apiStep(transcript, "move-card-signal", "PATCH", "/boards/:boardId/work-items/:itemId", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/work-items/${encodeURIComponent(card.id)}`, {
        method: "PATCH",
        headers: agentHeaders,
        body: { laneId: "changes-requested" }
      }));
      await assertEqual(transcript, "move-card-is-signal", "changes-requested", moved.laneId);
      await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "card_updated");

      const comment = await apiStep(transcript, "append-review-comment", "POST", "/boards/:boardId/work-items/:itemId/comments", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/work-items/${encodeURIComponent(card.id)}/comments`, {
        method: "POST",
        headers: agentHeaders,
        body: {
          kind: "change_request",
          status: "open",
          text: "Designer should update the source mapping before approval."
        }
      }));
      await assertEqual(transcript, "comment-author-agent", "surfaceops-adapter", comment.author);
      const commentEvent = await stream.messages.next((message) => message.event === "workspace_changed" && JSON.parse(message.data).payload.reason === "comment_created");
      await assertEqual(transcript, "sse-comment-created", "comment_created", JSON.parse(commentEvent.data).payload.reason);

      await page.waitForTimeout(1000);
      await assertPageContains(page, transcript, "browser-realtime-move-visible", "Changes Requested");
      await browserStep(transcript, "select-live-card-detail", "click card", async () => {
        await page.getByText("Button primary approval review").first().click();
        await page.waitForTimeout(500);
        return await page.locator("body").innerText();
      });
      await assertPageContains(page, transcript, "browser-realtime-comment-visible", "Designer should update the source mapping before approval.");

      const replay = await apiStep(transcript, "replay-events", "GET", "/api/events?since=<cursor>", async () => {
        const replayStream = await openSse(`${apiBaseUrl}/events?since=${encodeURIComponent(createdEventId)}`, adminHeaders);
        try {
          const replayed = await replayStream.messages.next((message) => message.event === "workspace_changed");
          return { id: replayed.id, reason: JSON.parse(replayed.data).payload.reason };
        } finally {
          replayStream.close();
        }
      });
      await assertEqual(transcript, "replay-after-cursor", true, ["card_updated", "comment_created"].includes(replay.reason));

      const cardEvents = await apiStep(transcript, "card-event-history", "GET", "/boards/:boardId/events", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/events?cardId=${encodeURIComponent(card.id)}&limit=10`, { headers: adminHeaders }));
      await assertEqual(transcript, "card-events-include-comment", true, cardEvents.events.some((event) => event.payload.reason === "comment_created"));

      const viewOnly = await requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}/agent-sessions`, {
        method: "POST",
        headers: adminHeaders,
        body: { agentId: "surfaceops-adapter", label: "View only proof token", capabilities: ["view"] }
      });
      const viewOnlyDenied = await fetch(`${apiBaseUrl}/boards/${encodeURIComponent(board.id)}/work-items`, {
        method: "POST",
        headers: { ...bearerHeaders(viewOnly.token), "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Denied card", laneId: "review-required" })
      });
      await assertEqual(transcript, "view-only-create-denied", 403, viewOnlyDenied.status);

      const stateShortcutDenied = await apiStep(transcript, "whole-state-shortcut-denied", "PUT", "/state", async () => {
        const response = await fetch(`${apiBaseUrl}/state`, {
          method: "PUT",
          headers: { ...agentHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ boards: [] })
        });
        return { status: response.status };
      });
      await assertEqual(transcript, "scoped-agent-state-shortcut-denied", 403, stateShortcutDenied.status);
      await assertEqual(transcript, "lane-move-is-collaboration-signal", true, moved.summary.includes("structured-surfaceops-required"));

      const screenshotPath = path.join(outDir.fsPath, "surfaceops-kanban-live-final.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await context.close();
      await browser.close();
      browser = null;

      const persistedBeforeRestart = await requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}`, { headers: adminHeaders });
      await assertEqual(transcript, "pre-restart-card-count", 1, persistedBeforeRestart.workItems.length);
      stream.close();
      await stopServer(server);

      const restarted = startKanbanServer({
        kanbanRoot,
        port,
        dataPath: path.join(tempDir, "state.json"),
        tokenDataPath: path.join(tempDir, "agent-tokens.json"),
        eventDataPath: path.join(tempDir, "events.jsonl"),
        adminToken
      });
      try {
        await waitForHealth(apiBaseUrl, adminToken);
        const persisted = await apiStep(transcript, "restart-persistence", "GET", "/boards/:boardId", async () => requestJson(apiBaseUrl, `/boards/${encodeURIComponent(board.id)}`, { headers: adminHeaders }));
        await assertEqual(transcript, "restart-card-persists", 1, persisted.workItems.length);
        await assertEqual(transcript, "restart-comment-persists", 1, persisted.workItems[0].comments.length);
        const reconcile = await apiStep(transcript, "adapter-marker-reconcile", "GET", "/boards/:boardId", async () => {
          const matchingCards = persisted.workItems.filter((item) => item.summary.includes("SURFACEOPS_REF"));
          return {
            matchingSurfaceOpsCards: matchingCards.length,
            duplicateCreateAttempted: false,
            reason: "existing deterministic SurfaceOps evidence marker found before create"
          };
        });
        await assertEqual(transcript, "marker-reconcile-finds-existing-card", 1, reconcile.matchingSurfaceOpsCards);
        await assertEqual(transcript, "marker-reconcile-skips-duplicate-create", false, reconcile.duplicateCreateAttempted);
      } finally {
        await stopServer(restarted);
      }
    } finally {
      stream.close();
    }
  } finally {
    if (browser) await browser.close();
    if (!server.stopped) await stopServer(server).catch(() => undefined);
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

  if (!pageVideo) throw contractError("browser scenario did not create a video recorder", 1);
  const tempVideoPath = await pageVideo.path();
  const videoPath = path.join(outDir.fsPath, "surfaceops-kanban-live-browser.webm");
  await fs.rename(tempVideoPath, videoPath);
  await fs.rm(path.join(outDir.fsPath, "video-tmp"), { recursive: true, force: true });

  const liveEvidenceRef = artifactRef(LIVE_EVIDENCE_PATH, "surfaceops-kanban-live-evidence.v0", surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(liveEvidence));
  const recordingRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-kanban-live-browser.webm"), "webm-video.v0", "video/webm");
  const screenshotRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-kanban-live-final.png"), "png-image.v0", "image/png");
  const transcriptRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-transcript.json"), "surfaceops-kanban-live-browser-functional-transcript.v0", "application/json");
  const redactedApiExchangeRef = await browserFileRef(path.posix.join(outDir.posixPath, "redacted-api-exchange-log.json"), "surfaceops-kanban-live-redacted-api-exchange-log.v0", "application/json");
  const boundary = surfaceopsKanbanLiveInternals.liveBoundary();
  const report = {
    schemaId: "surfaceops-kanban-live-browser-functional-report.v0",
    version: KL_VERSION,
    targetId: KL_TARGET_ID,
    scenarioId: KL_SCENARIO_ID,
    status: "pass",
    promotionStatus: liveEvidence.promotionStatus,
    command: COMMAND,
    liveEvidenceRef,
    kanbanRuntime: {
      upstreamWorkspace: "configured local kanban.cards checkout",
      upstreamWorkspaceName: path.basename(kanbanRoot),
      upstreamCommit: kanbanCommit,
      expectedUpstreamCommit: KL_KANBAN_CARDS_COMMIT,
      baseUrl: "http://127.0.0.1:<redacted-port>",
      persistence: "file-store-tempdir",
      auth: "local-admin-bearer-bootstrap-plus-scoped-agent-token",
      rawTokensStored: false,
      browserUiPersistenceWarningExpected: true,
      browserUiPersistenceWarningReason: "the upstream UI persists with PUT /api/state, which this SurfaceOps adapter proof denies; adapter writes use granular board, card, comment, SSE, and event-history API endpoints"
    },
    steps: transcript.steps,
    assertions: transcript.assertions,
    redactedApiExchangeRef,
    recordingRef,
    screenshotRef,
    transcriptRef,
    boundary,
    provenance: provenance("surfaceops-kanban-live-browser-functional-report", [
      LIVE_EVIDENCE_PATH,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      redactedApiExchangeRef.path
    ])
  };
  assertSchema(validators, "surfaceops-kanban-live-browser-functional-report.v0", report, "browser functional report");
  const reportPath = path.join(outDir.fsPath, "browser-functional-report.json");
  await fs.writeFile(reportPath, canonicalJson(report));
  const reportRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-report.json"), "surfaceops-kanban-live-browser-functional-report.v0", "application/json");

  const checkedAt = new Date().toISOString();
  const evidence = {
    schemaId: "surfaceops-kanban-live-browser-functional-evidence.v0",
    version: KL_VERSION,
    targetId: KL_TARGET_ID,
    scenarioId: KL_SCENARIO_ID,
    status: "pass",
    promotionStatus: liveEvidence.promotionStatus,
    command: COMMAND,
    checkedAt,
    environment: {
      generatedAt: checkedAt,
      host: null,
      selfHashMode: "sha256 over canonical JSON with selfHash set to 64 zero characters before final assignment"
    },
    liveEvidenceRef,
    reportRef,
    recordingRef,
    screenshotRef,
    transcriptRef,
    redactedApiExchangeRef,
    assertions: transcript.assertions,
    boundary,
    selfHash: "0".repeat(64),
    provenance: provenance("surfaceops-kanban-live-browser-functional-evidence", [
      LIVE_EVIDENCE_PATH,
      reportRef.path,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path,
      redactedApiExchangeRef.path
    ])
  };
  evidence.selfHash = sha256Hex(canonicalJson(evidence));
  assertSchema(validators, "surfaceops-kanban-live-browser-functional-evidence.v0", evidence, "browser functional evidence");
  await fs.writeFile(path.join(outDir.fsPath, "browser-functional-evidence.json"), canonicalJson(evidence));

  console.log([
    "SurfaceOps kanban live browser functional proof: pass",
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

async function assertKanbanWorkspace(kanbanRoot) {
  await fs.access(path.join(kanbanRoot, "src/server.ts"));
  await fs.access(path.join(kanbanRoot, "node_modules/.bin/tsx"));
}

async function assertPinnedKanbanCommit(kanbanRoot) {
  const { stdout } = await execFileAsync("git", ["-C", kanbanRoot, "rev-parse", "HEAD"]);
  const commit = stdout.trim();
  if (commit !== KL_KANBAN_CARDS_COMMIT) {
    throw contractError(`kanban.cards checkout must be pinned to ${KL_KANBAN_CARDS_COMMIT}; got ${commit}`, 1);
  }
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
  transcript.assertions.push({ assertionId, status: pass ? "pass" : "fail", expected: expectedText, actual: pass ? expectedText : bodyText.slice(0, 240) });
  if (!pass) throw contractError(`page assertion failed ${assertionId}: missing ${expectedText}`, 1);
}

function summarize(value) {
  const redacted = redact(value);
  const text = typeof redacted === "string" ? redacted : JSON.stringify(redacted);
  return text.length > 320 ? `${text.slice(0, 320)}...` : text;
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
    gate: {
      title: `${title} gate`,
      checks: ["SurfaceOps evidence remains authoritative."]
    }
  };
}

function agent(id, name, role, laneIds) {
  return {
    id,
    name,
    role,
    laneIds,
    instructions: "Use kanban.cards only as SurfaceOps collaboration substrate.",
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
  for (const file of KL_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, KL_SCHEMA_ROOT, file));
    ajv.addSchema(schema, schema.$id || file.replace(/\.schema\.json$/, ""));
  }
  return ajv;
}

function assertSchema(ajv, schemaId, data, label) {
  const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-kanban-live/${schemaId}.schema.json`);
  if (!validate) throw contractError(`missing schema validator for ${schemaId}`, 1);
  if (!validate(data)) {
    throw contractError(`schema validation failed for ${label}: ${ajv.errorsText(validate.errors, { separator: "; " })}`, 1);
  }
}

async function verifyLiveEvidence(evidence) {
  if (evidence.schemaId !== "surfaceops-kanban-live-evidence.v0" || evidence.status !== "pass") {
    throw contractError("surfaceops-kanban-live deterministic evidence must pass before browser proof", 1);
  }
  const selfHash = surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(evidence);
  const evidenceRef = evidence.artifacts.find((ref) => ref.path === LIVE_EVIDENCE_PATH);
  if (!evidenceRef || evidenceRef.hash !== selfHash) {
    throw contractError("surfaceops-kanban-live deterministic evidence self-hash failed", 1);
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

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}
