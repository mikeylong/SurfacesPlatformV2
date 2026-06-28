#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { canonicalJson } from "../src/p0.js";
import { p2Internals } from "../src/p2-proof.js";
import { p4Internals } from "../src/p4-proof.js";
import {
  canonicalFileHash,
  readJson,
  sha256Hex
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const P5_ARTIFACT_ROOT = "artifacts/p5/native";
const P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
const P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
const PROTOCOL_EVIDENCE_PATH = "artifacts/p5/protocol/evidence.json";
const DEFAULT_EVIDENCE_PATH = `${P5_ARTIFACT_ROOT}/evidence.json`;
const DEFAULT_OUT_DIR = "demo/p5/native";
const P5_EVIDENCE_SCHEMA_ID = "surfaces-native-evidence.v0";
const TARGET_SELECTION_SCHEMA_ID = "surfaces-native-target-selection.v0";
const PROJECTION_SCHEMA_ID = "surfaces-native-projection.v0";
const PACKET_SCHEMA_ID = "surfaces-native-packet.v0";
const REPORT_SCHEMA_ID = "surfaces-native-report.v0";

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:p5-native-demo usage error" : "build:p5-native-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || path.posix.dirname(evidencePath.posixPath) !== P5_ARTIFACT_ROOT) {
    throw contractError(`P5 native demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }

  const evidence = await readJson(evidencePath.fsPath);
  verifyEvidenceHeader(evidence, evidencePath);
  await rejectStaleArtifactRoot(evidence);
  await verifyEvidenceRefs(evidence, evidencePath);

  const artifacts = await readNativeArtifacts(evidence);
  await writeDemo(outDir, {
    evidence,
    ...artifacts
  });
  console.log(`P5 native demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-p5-native-demo.mjs [--evidence artifacts/p5/native/evidence.json] [--out demo/p5/native]");
      process.exit(0);
    }
    if (arg !== "--evidence" && arg !== "--out") {
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

function verifyEvidenceHeader(evidence, evidencePath) {
  if (evidence?.schemaId !== P5_EVIDENCE_SCHEMA_ID) {
    throw contractError(`P5 native demo requires ${P5_EVIDENCE_SCHEMA_ID}`);
  }
  if (evidence.status !== "pass") {
    throw contractError("P5 native demo requires passing evidence");
  }
  if (evidence.promotionStatus === "blocked") {
    throw contractError("P5 native demo requires non-blocked evidence promotion status");
  }
  if (!Array.isArray(evidence.artifacts) || evidence.artifacts.length === 0) {
    throw contractError("P5 native evidence must include ordered artifacts");
  }
  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== evidencePath.posixPath) {
    throw contractError(`P5 native evidence final artifact must be ${evidencePath.posixPath}`);
  }
  if (finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    throw contractError("P5 native evidence self-hash is invalid");
  }
}

async function rejectStaleArtifactRoot(evidence) {
  const generatedRefs = collectGeneratedRefs(evidence);
  const expectedNames = new Set(generatedRefs.map((ref) => path.posix.basename(ref.path)));
  if (!expectedNames.has("evidence.json")) {
    throw contractError("P5 native evidence must reference its final evidence artifact");
  }
  const rootPath = path.join(ROOT, P5_ARTIFACT_ROOT);
  let entries;
  try {
    entries = await fs.readdir(rootPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw contractError(`missing P5 native artifact root: ${P5_ARTIFACT_ROOT}`);
    }
    throw error;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      throw contractError(`unexpected hidden P5 native artifact output: ${entry.name}`);
    }
    if (!expectedNames.has(entry.name)) {
      throw contractError(`unexpected P5 native artifact output: ${P5_ARTIFACT_ROOT}/${entry.name}`);
    }
    if (!entry.isFile()) {
      throw contractError(`unexpected non-file P5 native artifact output: ${P5_ARTIFACT_ROOT}/${entry.name}`);
    }
  }
}

async function verifyEvidenceRefs(evidence, evidencePath) {
  const refs = collectEvidenceRefs(evidence);
  for (const ref of collectGeneratedRefs(evidence)) {
    if (ref.path !== evidencePath.posixPath && (ref.hash === null || ref.hash === undefined)) {
      throw contractError(`P5 native generated artifact ref is missing a hash: ${ref.path}`);
    }
  }
  const seen = new Set();
  for (const ref of refs) {
    assertArtifactRef(ref);
    if (ref.path === evidencePath.posixPath) continue;
    if (ref.hash === null || ref.hash === undefined) continue;
    const key = `${ref.path}:${ref.hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const actualHash = await artifactHashForRef(ref);
    if (actualHash !== ref.hash) {
      throw contractError(`P5 native artifact hash mismatch for ${ref.path}`);
    }
  }
}

async function artifactHashForRef(ref) {
  if (ref.path === P2_EVIDENCE_PATH) {
    return p2Internals.computeEvidenceSelfHash(await readJson(path.join(ROOT, ref.path)));
  }
  if (ref.path === P4_EVIDENCE_PATH) {
    return p4Internals.computeEvidenceSelfHash(await readJson(path.join(ROOT, ref.path)));
  }
  if (ref.path === PROTOCOL_EVIDENCE_PATH) {
    return computeEvidenceSelfHash(await readJson(path.join(ROOT, ref.path)));
  }
  return canonicalFileHash(path.join(ROOT, ref.path));
}

async function readNativeArtifacts(evidence) {
  const targetSelectionRef = findRequiredGeneratedRef(evidence, {
    label: "target selection",
    schemaId: TARGET_SELECTION_SCHEMA_ID,
    basename: "adapter-target-selection.json"
  });
  const projectionRef = findRequiredGeneratedRef(evidence, {
    label: "native projection",
    schemaId: PROJECTION_SCHEMA_ID,
    basename: "surfaces-native-projection.json"
  });
  const reportRef = findRequiredGeneratedRef(evidence, {
    label: "native adapter report",
    schemaId: REPORT_SCHEMA_ID,
    basename: "surfaces-native-report.json"
  });
  const packetRefs = findPacketRefs(evidence);

  const [targetSelection, projection, report, ...packets] = await Promise.all([
    readJson(path.join(ROOT, targetSelectionRef.path)),
    readJson(path.join(ROOT, projectionRef.path)),
    readJson(path.join(ROOT, reportRef.path)),
    ...packetRefs.map((ref) => readJson(path.join(ROOT, ref.path)))
  ]);

  const packetArtifacts = packetRefs.map((ref, index) => {
    const packet = packets[index];
    assertInertPacketForDemo(packet, ref.path);
    return { ref, packet };
  });

  return {
    targetSelectionRef,
    targetSelection,
    projectionRef,
    projection,
    reportRef,
    report,
    packetArtifacts
  };
}

function findRequiredGeneratedRef(evidence, { label, schemaId, basename }) {
  const candidates = collectGeneratedRefs(evidence)
    .filter((ref) => ref.schemaId === schemaId || path.posix.basename(ref.path) === basename);
  const unique = uniqueRefs(candidates);
  if (unique.length !== 1) {
    throw contractError(`P5 native evidence must reference exactly one ${label} artifact`);
  }
  return unique[0];
}

function findPacketRefs(evidence) {
  const refs = collectGeneratedRefs(evidence)
    .filter((ref) => {
      const file = path.posix.basename(ref.path);
      return ref.schemaId === PACKET_SCHEMA_ID || (file.startsWith("surfaces-native-packet.") && file.endsWith(".json"));
    })
    .filter((ref) => path.posix.basename(ref.path) !== "surfaces-native-packet.json")
    .sort((left, right) => left.path.localeCompare(right.path));
  const unique = uniqueRefs(refs);
  if (unique.length === 0) {
    throw contractError("P5 native evidence must reference at least one native packet artifact");
  }
  return unique;
}

function collectGeneratedRefs(evidence) {
  return uniqueRefs(collectEvidenceRefs(evidence).filter((ref) => isP5ArtifactPath(ref.path)));
}

function collectEvidenceRefs(evidence) {
  const refs = [];
  for (const key of [
    "schemaClosure",
    "fixtureRefs",
    "boundaryRefs",
    "compatibilityPreflightRefs",
    "artifacts",
    "artifactRefs",
    "nativePacketRefs",
    "packetRefs",
    "generatedArtifactRefs"
  ]) {
    if (Array.isArray(evidence[key])) refs.push(...evidence[key]);
  }
  for (const key of [
    "targetSelectionRef",
    "nativeProjectionRef",
    "projectionRef",
    "nativeAdapterReportRef",
    "reportRef"
  ]) {
    if (isArtifactRef(evidence[key])) refs.push(evidence[key]);
  }
  return uniqueRefs(refs.filter(isArtifactRef));
}

function uniqueRefs(refs) {
  const seen = new Set();
  const unique = [];
  for (const ref of refs) {
    const key = `${ref.path}:${ref.schemaId || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ref);
  }
  return unique;
}

function isArtifactRef(value) {
  return Boolean(value && typeof value === "object" && typeof value.path === "string");
}

function assertArtifactRef(ref) {
  if (!isArtifactRef(ref)) {
    throw contractError("P5 native evidence contains an invalid artifact ref");
  }
  assertRelativePosixPath(ref.path, "artifact ref path");
  if (typeof ref.schemaId !== "string" || ref.schemaId.length === 0) {
    throw contractError(`P5 native artifact ref has invalid schema id: ${ref.path}`);
  }
  if (ref.hashAlgorithm !== "sha256") {
    throw contractError(`P5 native artifact ref has invalid hash algorithm: ${ref.path}`);
  }
  if (!Object.prototype.hasOwnProperty.call(ref, "sourceRef")) {
    throw contractError(`P5 native artifact ref is missing sourceRef: ${ref.path}`);
  }
  if (
    Object.prototype.hasOwnProperty.call(ref, "sourceEvidenceHash") &&
    !/^[a-f0-9]{64}$/.test(ref.sourceEvidenceHash)
  ) {
    throw contractError(`P5 native artifact ref has invalid source evidence hash: ${ref.path}`);
  }
  if (ref.hash !== null && ref.hash !== undefined && !/^[a-f0-9]{64}$/.test(ref.hash)) {
    throw contractError(`P5 native artifact ref has invalid hash: ${ref.path}`);
  }
}

function assertRelativePosixPath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw contractError(`invalid P5 native ${label}: ${value}`);
  }
}

function isP5ArtifactPath(value) {
  return typeof value === "string" && (value === P5_ARTIFACT_ROOT || value.startsWith(`${P5_ARTIFACT_ROOT}/`));
}

function computeEvidenceSelfHash(evidence) {
  const clone = JSON.parse(JSON.stringify(evidence));
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

function assertInertPacketForDemo(packet, artifactPath) {
  if (packet.transport !== "none") {
    throw contractError(`P5 native packet transport must be none: ${artifactPath}`);
  }
  if (!Array.isArray(packet.sideEffects) || packet.sideEffects.length !== 0) {
    throw contractError(`P5 native packet sideEffects must be empty: ${artifactPath}`);
  }
  const actions = Array.isArray(packet.actions) ? packet.actions : [];
  if (actions.some((action) => action?.executed === true)) {
    throw contractError(`P5 native packet action execution is forbidden: ${artifactPath}`);
  }
  const text = canonicalJson(safePacketView(packet));
  const forbidden = [
    /(?:^|[^a-z0-9])api(?:$|[^a-z0-9])/i,
    /(?:production|native|live)[-_\s]*api/i,
    /(?:^|[^a-z0-9])sdk(?:$|[^a-z0-9])/i,
    /(?:production|native|live)[-_\s]*sdk/i,
    /a2ui/i,
    /callback/i,
    /webhook/i,
    /\bfetch\b/i,
    /https?:/i,
    /network/i,
    /secret/i,
    /credential/i,
    /native[-_\s]*bridge/i,
    /live[-_\s]*runtime/i
  ];
  if (forbidden.some((pattern) => pattern.test(text))) {
    throw contractError(`P5 native packet contains forbidden live behavior claim: ${artifactPath}`);
  }
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# P5 Native Evidence Demo",
    "",
    "Generated presentation output derived from passing P5 native evidence.",
    "Proof authority remains `artifacts/p5/native/evidence.json`.",
    "The view is static and reads only generated proof artifacts."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, targetSelection, projection, report, packetArtifacts }) {
  const targetId = targetSelection.targetId || projection.adapter || report.adapter || "unknown";
  const targetKind = targetSelection.targetKind || "unknown";
  const claimStatus = targetSelection.claimStatus || "unknown";
  const componentScope = listText(targetSelection.componentScope || projection.components);
  const projectionRows = [
    ["Components", listText(projection.components)],
    ["Tokens", countText(projection.tokens)],
    ["Actions", countText(projection.actions)],
    ["Events", countText(projection.events)],
    ["Data Bindings", countText(projection.dataBindings)],
    ["Governance", countText(projection.governance)],
    ["Accessibility", countText(projection.accessibility)]
  ].map(([label, value]) =>
    `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
  ).join("");
  const packetRows = packetArtifacts.map(({ ref, packet }) =>
    `<tr><td><code>${escapeHtml(ref.path)}</code></td><td>${escapeHtml(surfaceLabel(packet, ref))}</td><td>${escapeHtml(packet.promotionStatus || "unknown")}</td><td>${escapeHtml(packet.transport || "none")}</td><td>${escapeHtml(actionText(packet.actions))}</td><td>${escapeHtml(sideEffectText(packet.sideEffects))}</td></tr>`
  ).join("");
  const packetBlocks = packetArtifacts.map(({ ref, packet }) =>
    `<h3><code>${escapeHtml(ref.path)}</code></h3><pre>${escapeHtml(prettyJson(safePacketView(packet)))}</pre>`
  ).join("");
  const resultRows = resultRowsFor(report, evidence).map((result) =>
    `<tr><td><code>${escapeHtml(result.fixturePath || result.artifactPath || "unknown")}</code></td><td>${escapeHtml(result.stage || "unknown")}</td><td>${escapeHtml(result.actualResult || result.validationResult || "unknown")}</td><td>${escapeHtml(result.promotionStatus || "unknown")}</td><td>${escapeHtml(listText(result.diagnosticCodes || result.diagnostics || []))}</td></tr>`
  ).join("");
  const diagnostics = listItems((evidence.diagnostics || report.diagnostics || []).map((diagnostic) =>
    `<code>${escapeHtml(diagnostic.code || "diagnostic")}</code> ${escapeHtml(diagnostic.message || diagnostic.canonicalMessage || "")}`
  ));
  const boundaryHashes = listItems((evidence.boundaryRefs || []).map((artifact) =>
    `<code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}`
  ));
  const compatibilityHashes = listItems((evidence.compatibilityPreflightRefs || []).map((artifact) =>
    `<code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}`
  ));
  const artifactHashes = listItems(collectGeneratedRefs(evidence).map((artifact) =>
    `<code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}`
  ));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P5 Native Evidence</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1c2430; background: #f6f7f9; }
    body { margin: 0; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { font-size: 28px; margin: 0 0 8px; letter-spacing: 0; }
    h2 { font-size: 18px; margin: 28px 0 12px; letter-spacing: 0; }
    h3 { font-size: 14px; margin: 18px 0 8px; letter-spacing: 0; }
    p { color: #526070; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 20px 0; }
    .tile { border: 1px solid #d6dce5; border-radius: 8px; background: white; padding: 14px; }
    .label { color: #596675; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 650; margin-top: 4px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d6dce5; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e6ebf1; vertical-align: top; }
    th { background: #edf1f5; font-size: 13px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    pre { background: white; border: 1px solid #d6dce5; border-radius: 8px; margin: 0 0 14px; padding: 14px; overflow: auto; }
    ul { background: white; border: 1px solid #d6dce5; border-radius: 8px; margin: 0; padding: 14px 14px 14px 30px; }
    li { margin: 6px 0; overflow-wrap: anywhere; }
  </style>
</head>
<body>
<main>
  <h1>P5 Native Evidence</h1>
  <p>Generated view of the selected native target, projection scope, inert packet artifacts, diagnostics, and evidence hashes.</p>
  <section class="meta">
    <div class="tile"><div class="label">Evidence</div><div class="value">${escapeHtml(evidence.status)} / ${escapeHtml(evidence.promotionStatus)}</div></div>
    <div class="tile"><div class="label">Run</div><div class="value">${escapeHtml(evidence.runId || "unknown")}</div></div>
    <div class="tile"><div class="label">Target</div><div class="value">${escapeHtml(targetId)}</div></div>
    <div class="tile"><div class="label">Packets</div><div class="value">${packetArtifacts.length}</div></div>
  </section>
  <h2>Target Selection</h2>
  <section class="meta">
    <div class="tile"><div class="label">Target ID</div><div class="value">${escapeHtml(targetId)}</div></div>
    <div class="tile"><div class="label">Target Kind</div><div class="value">${escapeHtml(targetKind)}</div></div>
    <div class="tile"><div class="label">Claim Status</div><div class="value">${escapeHtml(claimStatus)}</div></div>
    <div class="tile"><div class="label">Component Scope</div><div class="value">${escapeHtml(componentScope)}</div></div>
  </section>
  <h2>Projection Scope</h2>
  <table><thead><tr><th>Area</th><th>Declared Scope</th></tr></thead><tbody>${projectionRows}</tbody></table>
  <h2>Native Packets</h2>
  <table><thead><tr><th>Artifact</th><th>Surface</th><th>Promotion</th><th>Transport</th><th>Actions</th><th>Side Effects</th></tr></thead><tbody>${packetRows}</tbody></table>
  <h2>Packet JSON</h2>
  ${packetBlocks}
  <h2>Manifest Results</h2>
  <table><thead><tr><th>Fixture</th><th>Stage</th><th>Actual</th><th>Promotion</th><th>Diagnostics</th></tr></thead><tbody>${resultRows}</tbody></table>
  <h2>Diagnostics</h2>
  <ul>${diagnostics}</ul>
  <h2>Authority Boundary Hashes</h2>
  <ul>${boundaryHashes}</ul>
  <h2>Compatibility Preflight Hashes</h2>
  <ul>${compatibilityHashes}</ul>
  <h2>P5 Artifact Hashes</h2>
  <ul>${artifactHashes}</ul>
</main>
</body>
</html>
`;
}

function resultRowsFor(report, evidence) {
  if (Array.isArray(report.results)) return report.results;
  if (Array.isArray(report.validationResults)) return report.validationResults;
  if (Array.isArray(evidence.validationResults)) return evidence.validationResults;
  return [];
}

function safePacketView(packet) {
  return {
    schemaId: packet.schemaId || null,
    adapter: packet.adapter || null,
    surfaceRef: refView(packet.surfaceRef),
    projectionRef: refView(packet.projectionRef),
    promotionStatus: packet.promotionStatus || null,
    message: packet.message || null,
    actions: Array.isArray(packet.actions) ? packet.actions.map((action) => ({
      actionId: action.actionId || action.id || action.name || null,
      kind: action.kind || action.intent || null,
      executed: action.executed === true,
      payload: action.payload || null,
      sourceRef: action.sourceRef || null
    })) : [],
    sideEffects: Array.isArray(packet.sideEffects) ? packet.sideEffects : [],
    transport: packet.transport || null,
    accessibility: packet.accessibility || null,
    tokens: packet.tokens || null
  };
}

function refView(ref) {
  if (!ref || typeof ref !== "object") return null;
  return {
    path: ref.path || null,
    schemaId: ref.schemaId || null,
    sourceRef: ref.sourceRef || null,
    hash: ref.hash || null
  };
}

function surfaceLabel(packet, ref) {
  return packet.surfaceRef?.path || packet.surfaceRef?.sourceRef || path.posix.basename(ref.path);
}

function actionText(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return "none";
  return actions.map((action) => {
    const id = action.actionId || action.id || action.name || "action";
    const executed = action.executed === true ? "executed" : "not executed";
    return `${id} (${executed})`;
  }).join(", ");
}

function sideEffectText(sideEffects) {
  if (!Array.isArray(sideEffects) || sideEffects.length === 0) return "none";
  return sideEffects.map((effect) => typeof effect === "string" ? effect : JSON.stringify(effect)).join(", ");
}

function countText(value) {
  const names = namesFor(value);
  if (names.length > 0) return `${names.length}: ${names.join(", ")}`;
  if (value && typeof value === "object") return `${Object.keys(value).length}`;
  return "0";
}

function listText(value) {
  const names = namesFor(value);
  if (names.length === 0) return "none";
  return names.join(", ");
}

function namesFor(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        return entry.id || entry.componentId || entry.name || entry.ref || entry.path || canonicalJson(entry);
      }
      return String(entry);
    });
  }
  if (value && typeof value === "object") return Object.keys(value).sort();
  return [];
}

function listItems(items) {
  if (items.length === 0) return "<li>none</li>";
  return items.map((item) => `<li>${item}</li>`).join("");
}

function prettyJson(value) {
  return JSON.stringify(sortJson(value), null, 2);
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
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
