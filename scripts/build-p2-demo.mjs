import path from "node:path";
import fs from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";
import {
  P2_ARTIFACT_ROOT,
  P2_SCHEMA_FILES,
  P2_SCHEMA_ROOT,
  P2_SHARED_SCHEMA_FILES,
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_EVIDENCE_PATH = "artifacts/p2/evidence.json";
const DEFAULT_OUT_DIR = "demo/p2";

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:p2-demo usage error" : "build:p2-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || path.posix.dirname(evidencePath.posixPath) !== P2_ARTIFACT_ROOT) {
    throw contractError(`P2 demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }

  const validators = await loadValidators();
  const evidence = await readJson(evidencePath.fsPath);
  assertSchema(validators, "p2", "design-system-ingestion-evidence.v0", evidence, "P2 evidence");
  await verifyEvidence(evidence, evidencePath);
  const [inventory, mapping, extract, catalog, governedCatalog, report] = await Promise.all([
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "source-inventory.json")),
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "source-mapping.json")),
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "extract.json")),
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "catalog.json")),
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "governed-catalog.json")),
    readJson(path.join(ROOT, P2_ARTIFACT_ROOT, "ingestion-report.json"))
  ]);

  await writeDemo(outDir, {
    evidence,
    inventory,
    mapping,
    extract,
    catalog,
    governedCatalog,
    report
  });
  console.log(`P2 demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-p2-demo.mjs [--evidence artifacts/p2/evidence.json] [--out demo/p2]");
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

async function loadValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, validateFormats: false });
  for (const file of [...P2_SHARED_SCHEMA_FILES, ...P2_SCHEMA_FILES]) {
    const schema = await readJson(path.join(ROOT, P2_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(scope, schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: ${scope}/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

async function verifyEvidence(evidence, evidencePath) {
  if (evidence.status !== "pass") {
    throw contractError("P2 demo requires passing evidence");
  }
  const finalRef = evidence.artifactRefs[evidence.artifactRefs.length - 1];
  if (finalRef.path !== evidencePath.posixPath || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    throw contractError("P2 evidence self-hash is invalid");
  }
  for (const ref of evidence.artifactRefs) {
    if (ref.path === evidencePath.posixPath) continue;
    const actualHash = await canonicalFileHash(path.join(ROOT, ref.path));
    if (actualHash !== ref.hash) {
      throw contractError(`P2 artifact hash mismatch for ${ref.path}`);
    }
  }
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await writeCanonicalJson(path.join(outDir.fsPath, "data.json"), data);
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# P2 Ingestion Demo",
    "",
    "Generated presentation output derived from passing P2 evidence.",
    "Proof authority remains `artifacts/p2/evidence.json`."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, inventory, mapping, extract, governedCatalog, report }) {
  const components = Object.keys(governedCatalog.components);
  const rows = evidence.validationResults.map((row) =>
    `<tr><td>${escapeHtml(row.fixturePath)}</td><td>${escapeHtml(row.actualResult)}</td><td>${escapeHtml(row.promotionStatus)}</td><td>${escapeHtml(row.diagnosticCodes.join(", ") || "none")}</td></tr>`
  ).join("");
  const mappingRows = mapping.mappingRows.map((row) =>
    `<li><code>${escapeHtml(row.mappingId)}</code> ${escapeHtml(row.mappingKind)} -> <code>${escapeHtml(row.normalizedId)}</code></li>`
  ).join("");
  const sourceRows = inventory.sourceFiles.map((row) =>
    `<li><code>${escapeHtml(row.path)}</code> <span>${escapeHtml(row.sourceType)}</span></li>`
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P2 Spectrum Ingestion Proof</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17202a; background: #f7f8fb; }
    body { margin: 0; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { font-size: 28px; margin: 0 0 8px; letter-spacing: 0; }
    h2 { font-size: 18px; margin: 28px 0 12px; letter-spacing: 0; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
    .tile { border: 1px solid #d8dee8; border-radius: 8px; background: white; padding: 14px; }
    .label { color: #5b6472; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 650; margin-top: 4px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d8dee8; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e9f0; vertical-align: top; }
    th { background: #eef2f8; font-size: 13px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    ul { background: white; border: 1px solid #d8dee8; border-radius: 8px; margin: 0; padding: 14px 14px 14px 30px; }
    li { margin: 6px 0; overflow-wrap: anywhere; }
  </style>
</head>
<body>
<main>
  <h1>P2 Spectrum Ingestion Proof</h1>
  <p>Local source bundle ingestion for @adobe/spectrum-design-data 0.7.0, scoped to button and in-line-alert.</p>
  <section class="meta">
    <div class="tile"><div class="label">Evidence</div><div class="value">${escapeHtml(evidence.status)} / ${escapeHtml(evidence.promotionStatus)}</div></div>
    <div class="tile"><div class="label">Run</div><div class="value">${escapeHtml(evidence.runId)}</div></div>
    <div class="tile"><div class="label">Source Files</div><div class="value">${inventory.sourceFiles.length}</div></div>
    <div class="tile"><div class="label">Components</div><div class="value">${components.map(escapeHtml).join(", ")}</div></div>
  </section>
  <h2>Source Coverage</h2>
  <ul>${sourceRows}</ul>
  <h2>Mapping Rows</h2>
  <ul>${mappingRows}</ul>
  <h2>Extracted Material</h2>
  <div class="tile"><div class="label">Tokens</div><div class="value">${Object.keys(extract.tokens).map(escapeHtml).join(", ")}</div></div>
  <h2>Fixture Results</h2>
  <table><thead><tr><th>Fixture</th><th>Result</th><th>Promotion</th><th>Diagnostics</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Report</h2>
  <div class="tile"><div class="label">Report Status</div><div class="value">${escapeHtml(report.status)} / ${escapeHtml(report.promotionStatus)}</div></div>
</main>
</body>
</html>
`;
}

function assertSchema(validators, scope, schemaId, data, label) {
  const result = validators.validate(scope, schemaId, data);
  if (!result.valid) {
    throw contractError(`${label} failed ${schemaId}: ${formatAjvErrors(result.errors)}`);
  }
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  clone.artifactRefs[clone.artifactRefs.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
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
