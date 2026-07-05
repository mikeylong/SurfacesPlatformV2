#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { chromium } from "playwright";
import { canonicalJson } from "../src/p0.js";
import {
  SK_ARTIFACT_ROOT,
  SK_SCENARIO_ID,
  SK_SCHEMA_FILES,
  SK_SCHEMA_ROOT,
  SK_TARGET_ID,
  SK_VERSION,
  artifactRef,
  provenance
} from "../src/surfaceops-kanban-static-contract.js";
import { surfaceopsKanbanStaticInternals } from "../src/surfaceops-kanban-static-proof.js";
import {
  readJson,
  sha256Hex
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_DEMO_PATH = "demo/surfaceops-kanban-static/index.html";
const DEFAULT_OUT_DIR = "output/playwright/surfaceops-kanban-static";
const STATIC_EVIDENCE_PATH = `${SK_ARTIFACT_ROOT}/evidence.json`;
const COMMAND = "npm run proof:surfaceops-kanban-static:browser";
const VIEWPORT = { width: 1280, height: 820 };

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "surfaceops-kanban-static browser proof usage error" : "surfaceops-kanban-static browser proof failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const demoPath = workspacePath(args.demo, "--demo");
  const outDir = workspacePath(args.out, "--out");
  if (demoPath.posixPath !== DEFAULT_DEMO_PATH) {
    throw usageError(`--demo must be ${DEFAULT_DEMO_PATH}`);
  }

  const validators = await loadValidators();
  const staticEvidence = await readJson(path.join(ROOT, STATIC_EVIDENCE_PATH));
  await verifyStaticEvidence(staticEvidence);
  const projection = await readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-board-projection.json"));
  const selectedCard = projection.cards[0];
  if (!selectedCard) {
    throw contractError("browser scenario requires at least one projected card");
  }

  await fs.rm(outDir.fsPath, { recursive: true, force: true });
  await fs.mkdir(outDir.fsPath, { recursive: true });
  const videoDir = path.join(outDir.fsPath, "video-tmp");
  await fs.mkdir(videoDir, { recursive: true });

  const transcript = {
    scenarioId: SK_SCENARIO_ID,
    targetId: SK_TARGET_ID,
    steps: [],
    assertions: [],
    networkViolations: []
  };

  const browser = await launchChromium();
  let pageVideo = null;
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: {
        dir: videoDir,
        size: VIEWPORT
      }
    });
    const page = await context.newPage();
    pageVideo = page.video();
    await page.route("**/*", async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.startsWith("file:") || requestUrl.startsWith("data:") || requestUrl === "about:blank") {
        await route.continue();
        return;
      }
      transcript.networkViolations.push(requestUrl);
      await route.abort();
    });

    await runScenario(page, demoPath, selectedCard, transcript);
    const screenshotPath = path.join(outDir.fsPath, "surfaceops-kanban-static-final.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.close();
  } finally {
    await browser.close();
  }

  if (!pageVideo) {
    throw contractError("browser scenario did not create a video recorder");
  }
  const tempVideoPath = await pageVideo.path();
  const videoPath = path.join(outDir.fsPath, "surfaceops-kanban-static-browser.webm");
  await fs.rename(tempVideoPath, videoPath);
  await fs.rm(videoDir, { recursive: true, force: true });

  const transcriptPath = path.join(outDir.fsPath, "browser-functional-transcript.json");
  await fs.writeFile(transcriptPath, canonicalJson(transcript));

  const recordingRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-kanban-static-browser.webm"), "webm-video.v0", "video/webm");
  const screenshotRef = await browserFileRef(path.posix.join(outDir.posixPath, "surfaceops-kanban-static-final.png"), "png-image.v0", "image/png");
  const transcriptRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-transcript.json"), "surfaceops-kanban-browser-functional-transcript.v0", "application/json");
  const demoRef = await browserFileRef(demoPath.posixPath, "html-document.v0", "text/html");
  const staticEvidenceRef = artifactRef(STATIC_EVIDENCE_PATH, "surfaceops-kanban-evidence.v0", surfaceopsKanbanStaticInternals.computeEvidenceSelfHash(staticEvidence));
  const browserRuntime = transcript.browser;
  const boundary = boundaryResult(transcript);

  const report = {
    schemaId: "surfaceops-kanban-browser-functional-report.v0",
    version: SK_VERSION,
    targetId: SK_TARGET_ID,
    scenarioId: SK_SCENARIO_ID,
    status: "pass",
    promotionStatus: staticEvidence.promotionStatus,
    command: COMMAND,
    demoPath: demoPath.posixPath,
    staticEvidenceRef,
    browser: browserRuntime,
    steps: transcript.steps,
    assertions: transcript.assertions,
    selectedCard: {
      cardId: selectedCard.cardId,
      laneId: selectedCard.laneId,
      decisionStatus: selectedCard.decisionStatus,
      decisionPromotionStatus: selectedCard.decisionPromotionStatus,
      nextActionOwner: selectedCard.nextActionOwner,
      evidenceRefs: selectedCard.evidenceRefs
    },
    boundary,
    recordingRef,
    screenshotRef,
    transcriptRef,
    evidenceRef: null,
    provenance: provenance("surfaceops-kanban-static-browser-functional-report", [
      demoPath.posixPath,
      STATIC_EVIDENCE_PATH,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path
    ])
  };
  assertSchema(validators, "surfaceops-kanban-browser-functional-report.v0", report, "browser functional report");
  const reportPath = path.join(outDir.fsPath, "browser-functional-report.json");
  await fs.writeFile(reportPath, canonicalJson(report));
  const reportRef = await browserFileRef(path.posix.join(outDir.posixPath, "browser-functional-report.json"), "surfaceops-kanban-browser-functional-report.v0", "application/json");

  const checkedAt = new Date().toISOString();
  const evidence = {
    schemaId: "surfaceops-kanban-browser-functional-evidence.v0",
    version: SK_VERSION,
    targetId: SK_TARGET_ID,
    scenarioId: SK_SCENARIO_ID,
    status: "pass",
    promotionStatus: staticEvidence.promotionStatus,
    command: COMMAND,
    checkedAt,
    environment: {
      generatedAt: checkedAt,
      host: null
    },
    staticEvidenceRef,
    demoRef,
    reportRef,
    recordingRef,
    screenshotRef,
    transcriptRef,
    assertions: transcript.assertions,
    boundary,
    selfHash: "0".repeat(64),
    provenance: provenance("surfaceops-kanban-static-browser-functional-evidence", [
      STATIC_EVIDENCE_PATH,
      demoPath.posixPath,
      reportRef.path,
      recordingRef.path,
      screenshotRef.path,
      transcriptRef.path
    ])
  };
  evidence.selfHash = sha256Hex(canonicalJson(evidence));
  assertSchema(validators, "surfaceops-kanban-browser-functional-evidence.v0", evidence, "browser functional evidence");
  await fs.writeFile(path.join(outDir.fsPath, "browser-functional-evidence.json"), canonicalJson(evidence));

  console.log([
    "SurfaceOps kanban browser functional proof: pass",
    `video: ${recordingRef.path}`,
    `videoHash: ${recordingRef.hash}`,
    `screenshot: ${screenshotRef.path}`,
    `evidence: ${path.posix.join(outDir.posixPath, "browser-functional-evidence.json")}`
  ].join("\n"));
}

async function runScenario(page, demoPath, selectedCard, transcript) {
  await step(transcript, "open-demo", "navigate", demoPath.posixPath, async () => {
    await page.goto(pathToFileURL(demoPath.fsPath).href, { waitUntil: "load" });
    transcript.browser = {
      browserName: "chromium",
      browserVersion: page.context().browser().version(),
      headless: true,
      viewport: VIEWPORT,
      userAgent: await page.evaluate(() => navigator.userAgent)
    };
    return text(page, "[data-testid='proof-status']");
  });
  await assertContains(page, transcript, "proof-status-pass", "[data-testid='proof-status']", "pass");
  await assertContains(page, transcript, "promotion-status-review-required", "[data-testid='promotion-status']", "review_required");

  await step(transcript, "verify-board-lanes", "assert lanes", "allowed/review-required/blocked", async () => {
    for (const laneId of ["allowed", "review-required", "blocked"]) {
      await page.locator(`[data-testid='lane-${laneId}']`).waitFor({ state: "visible" });
    }
    return "allowed, review-required, blocked";
  });
  await assertContains(page, transcript, "allowed-card-count", "[data-testid='allowed-count']", "1");
  await assertContains(page, transcript, "static-execution-disabled", "[data-testid='execution-authorized']", "false");

  const cardTestId = `card-${slug(selectedCard.cardId)}`;
  await step(transcript, "select-board-card", "click", `[data-testid='${cardTestId}']`, async () => {
    await page.locator(`[data-testid='${cardTestId}']`).click();
    return text(page, "[data-testid='detail-card-title']");
  });
  await assertContains(page, transcript, "detail-shows-decision", "[data-testid='detail-decision']", "allowed");
  await assertContains(page, transcript, "detail-shows-owner", "[data-testid='detail-owner']", "surface-ops-reviewer");
  await assertContains(page, transcript, "detail-shows-evidence-count", "[data-testid='detail-evidence-count']", String(selectedCard.evidenceRefs.length));
  await assertContains(page, transcript, "detail-shows-decision-ref", "[data-testid='detail-decision-ref']", "decision.approve-reviewed-work");

  await step(transcript, "open-evidence-view", "click", "[data-testid='view-evidence']", async () => {
    await page.locator("[data-testid='view-evidence']").click();
    await page.locator("[data-testid='evidence-view']").waitFor({ state: "visible" });
    return text(page, "[data-testid='evidence-table']");
  });
  await assertContains(page, transcript, "evidence-shows-p4-ledger", "[data-testid='evidence-view']", "surfaceops-decision-ledger.json");
  await assertContains(page, transcript, "evidence-shows-p3-review-queue", "[data-testid='evidence-view']", "review-queue.json");

  await step(transcript, "open-packets-view", "click", "[data-testid='view-packets']", async () => {
    await page.locator("[data-testid='view-packets']").click();
    await page.locator("[data-testid='packets-view']").waitFor({ state: "visible" });
    return text(page, "[data-testid='packets-view']");
  });
  await assertContains(page, transcript, "packet-execution-false", "[data-testid='packet-execution-authorized']", "false");
  await assertContains(page, transcript, "packets-have-no-live-writes", "[data-testid='live-writes']", "false");
  await assertContains(page, transcript, "packets-have-no-network-transport", "[data-testid='network-transport']", "false");

  await step(transcript, "return-board-view", "click", "[data-testid='view-board']", async () => {
    await page.locator("[data-testid='view-board']").click();
    await page.locator("[data-testid='board-view']").waitFor({ state: "visible" });
    return text(page, "[data-testid='detail-card-title']");
  });

  if (transcript.networkViolations.length > 0) {
    throw contractError(`browser scenario attempted network access: ${transcript.networkViolations.join(", ")}`);
  }
}

async function step(transcript, stepId, action, target, fn) {
  try {
    const observedText = await fn();
    transcript.steps.push({ stepId, action, target, status: "pass", observedText: observedText ?? null });
  } catch (error) {
    transcript.steps.push({ stepId, action, target, status: "fail", observedText: error.message });
    throw error;
  }
}

async function assertContains(page, transcript, assertionId, selector, expected) {
  const actual = await text(page, selector);
  const status = actual.includes(expected) ? "pass" : "fail";
  transcript.assertions.push({
    assertionId,
    description: `Expected ${selector} to contain ${expected}`,
    selector,
    expected,
    actual,
    status
  });
  if (status !== "pass") {
    throw contractError(`assertion failed: ${assertionId}; expected ${expected}; actual ${actual}`);
  }
}

async function text(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible" });
  return normalizeWhitespace(await locator.textContent());
}

function boundaryResult(transcript) {
  return {
    staticOnly: true,
    liveKanbanWrites: false,
    liveSurfaceOpsWrites: false,
    liveJudgmentKitCalls: false,
    networkViolations: transcript.networkViolations,
    executionAuthorized: false,
    hiddenReviewState: false,
    proofAuthority: STATIC_EVIDENCE_PATH
  };
}

async function launchChromium() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    if (String(error.message || "").includes("Executable doesn't exist")) {
      throw contractError("Playwright Chromium is not installed. Run `npx playwright install chromium`, then rerun `npm run check:surfaceops-kanban-static:browser`.");
    }
    throw error;
  }
}

async function verifyStaticEvidence(evidence) {
  if (evidence.status !== "pass") {
    throw contractError("browser functional proof requires passing SurfaceOps kanban static evidence");
  }
  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  if (finalRef.path !== STATIC_EVIDENCE_PATH || finalRef.hash !== surfaceopsKanbanStaticInternals.computeEvidenceSelfHash(evidence)) {
    throw contractError("SurfaceOps kanban static evidence self-hash is invalid");
  }
  const integrityCode = await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(ROOT, evidence);
  if (integrityCode !== null) {
    throw contractError(`SurfaceOps kanban static evidence integrity verification failed: ${integrityCode}`);
  }
}

async function browserFileRef(relativePath, schemaId, mimeType) {
  const fsPath = path.join(ROOT, relativePath);
  const [hash, stat] = await Promise.all([
    fileHash(fsPath),
    fs.stat(fsPath)
  ]);
  return {
    path: relativePath,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    bytes: stat.size,
    mimeType,
    sourceRef: null
  };
}

async function fileHash(fsPath) {
  return crypto.createHash("sha256").update(await fs.readFile(fsPath)).digest("hex");
}

async function loadValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, validateFormats: false });
  for (const file of SK_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, SK_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-kanban-static/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: surfaceops-kanban-static/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

function assertSchema(validators, schemaId, data, label) {
  const result = validators.validate(schemaId, data);
  if (!result.valid) {
    throw contractError(`${label} failed ${schemaId}: ${formatAjvErrors(result.errors)}`);
  }
}

function parseArgs(argv) {
  const args = {
    demo: DEFAULT_DEMO_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/prove-surfaceops-kanban-static-browser.mjs [--demo demo/surfaceops-kanban-static/index.html] [--out output/playwright/surfaceops-kanban-static]");
      process.exit(0);
    }
    if (arg !== "--demo" && arg !== "--out") {
      throw usageError(`unknown argument ${arg}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw usageError(`${arg} requires a value`);
    }
    args[arg.slice(2)] = value;
    index += 1;
  }
  return args;
}

function workspacePath(input, flag) {
  if (typeof input !== "string" || input.length === 0 || input.includes("\0")) {
    throw usageError(`${flag} must be a non-empty workspace path`);
  }
  const fsPath = path.resolve(ROOT, input);
  const relative = path.relative(ROOT, fsPath);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw usageError(`${flag} must stay inside the workspace`);
  }
  return { fsPath, posixPath: relative.split(path.sep).join("/") };
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slug(value) {
  return String(value).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
}

function usageError(message) {
  const error = new Error(message);
  error.exitCode = 2;
  return error;
}

function contractError(message) {
  const error = new Error(message);
  error.exitCode = 1;
  return error;
}
