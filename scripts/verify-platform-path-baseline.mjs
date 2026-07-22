import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";

const root = process.cwd();
const policyPath = "fixtures/platform-path-consolidation/architecture-policy.json";
let architecturePolicy;
try {
  architecturePolicy = JSON.parse(await fs.readFile(path.join(root, policyPath), "utf8"));
} catch {
  process.stderr.write(`PLATFORM_BASELINE_SCHEMA_INVALID ${policyPath} unreadable-json\n`);
  process.exit(1);
}
const baselineContract = architecturePolicy.migrationBaseline || {};
const manifestPath = baselineContract.path;
const schemaPath = "schemas/platform-path-baseline.v0.schema.json";
const failures = [];
const admittedEvidenceSelfHashes = new Map(
  (baselineContract.admittedEvidenceSelfHashes || []).map((entry) => [entry.path, entry.sha256])
);
const admittedCatalogReportClosureHashes = new Map(
  (baselineContract.admittedCatalogReportClosureHashes || []).map((entry) => [entry.path, entry.sha256])
);
const inventoryExcludedPrefixes = baselineContract.inventoryExcludedPrefixes || [];
const postBaselinePaths = new Set(baselineContract.postBaselinePaths || []);
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const canonical = (value) => value === null || typeof value !== "object"
  ? JSON.stringify(value)
  : Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
const jcsHash = (value) => sha(canonical(value));
const isPostBaselinePath = (relative) => postBaselinePaths.has(relative);
const isInventoryExcludedPath = (relative) => inventoryExcludedPrefixes.some((prefix) =>
  relative === prefix || relative.startsWith(`${prefix}/`));
const collectCatalogReportRefs = (value, refs = []) => {
  if (value === null || typeof value !== "object") return refs;
  if (typeof value.path === "string" && /(catalog|report)\.json$/.test(value.path)) {
    refs.push({ path: value.path, hash: value.hash, hashAlgorithm: value.hashAlgorithm });
  }
  for (const nested of Object.values(value)) collectCatalogReportRefs(nested, refs);
  return refs;
};
const safeWorkspacePath = (relative) => {
  if (typeof relative !== "string" || relative.length === 0 || path.isAbsolute(relative) || relative.includes("\\")) return null;
  const normalized = path.posix.normalize(relative);
  if (normalized !== relative || normalized === ".." || normalized.startsWith("../")) return null;
  const absolute = path.resolve(root, relative);
  return absolute.startsWith(`${root}${path.sep}`) ? absolute : null;
};
const readJson = async (relative, code) => {
  const absolute = safeWorkspacePath(relative);
  if (!absolute) {
    failures.push(`${code} ${relative} invalid-path`);
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(absolute, "utf8"));
  } catch {
    failures.push(`${code} ${relative} unreadable-json`);
    return null;
  }
};

const manifestBytes = await fs.readFile(safeWorkspacePath(manifestPath) || "", "utf8").catch(() => null);
if (manifestBytes === null || sha(manifestBytes) !== baselineContract.sha256) {
  failures.push(`PLATFORM_BASELINE_MANIFEST_DRIFT ${manifestPath || "missing-path"}`);
}
const manifest = await readJson(manifestPath, "PLATFORM_BASELINE_SCHEMA_INVALID");
const baselineSchema = await readJson(schemaPath, "PLATFORM_BASELINE_SCHEMA_INVALID");
if (manifest && baselineSchema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateBaseline = ajv.compile(baselineSchema);
  if (!validateBaseline(manifest)) {
    for (const error of validateBaseline.errors ?? []) {
      failures.push(`PLATFORM_BASELINE_SCHEMA_INVALID ${error.instancePath || "/"} ${error.message}`);
    }
  }
}
if (!manifest || !baselineSchema || failures.length > 0) {
  process.stderr.write(`${failures.sort().join("\n")}\n`);
  process.exit(1);
}

for (const [relative, expected] of Object.entries(manifest.evidence)) {
  const evidence = await readJson(relative, "PLATFORM_BASELINE_EVIDENCE_DRIFT");
  if (!evidence) continue;
  const refsKey = Array.isArray(evidence.artifacts)
    ? "artifacts"
    : Array.isArray(evidence.artifactRefs)
      ? "artifactRefs"
      : null;
  const refs = refsKey ? evidence[refsKey] : [];
  const selfRefs = refs.filter((ref) => ref && typeof ref === "object" && ref.path === relative);
  if (selfRefs.length !== 1) {
    failures.push(`PLATFORM_BASELINE_EVIDENCE_INTEGRITY ${relative} expected-one-self-ref`);
  } else {
    const selfHash = selfRefs[0].hash;
    const hashInput = structuredClone(evidence);
    hashInput[refsKey].find((ref) => ref.path === relative).hash = null;
    if (selfRefs[0].hashAlgorithm !== "sha256" || !/^[a-f0-9]{64}$/.test(selfHash) || selfHash !== jcsHash(hashInput)) {
      failures.push(`PLATFORM_BASELINE_EVIDENCE_INTEGRITY ${relative} self-hash`);
    }
    const actual = [evidence.status, evidence.promotionStatus ?? "none", selfHash];
    const admittedSelfHash = admittedEvidenceSelfHashes.get(relative);
    if (canonical(actual.slice(0, 2)) !== canonical(expected.slice(0, 2)) ||
        (admittedSelfHash ? selfHash !== admittedSelfHash : canonical(actual) !== canonical(expected))) {
      failures.push(`PLATFORM_BASELINE_EVIDENCE_DRIFT ${relative}`);
    }
  }

  const closure = refs
    .filter((ref) => ref && typeof ref.path === "string" && /(catalog|report)\.json$/.test(ref.path))
    .map((ref) => ({ path: ref.path, hash: ref.hash }));
  const embeddedRefs = [
    ...new Map(collectCatalogReportRefs(evidence).map((ref) => [`${ref.path}\0${ref.hash}\0${ref.hashAlgorithm}`, ref])).values()
  ];
  for (const ref of embeddedRefs) {
    if (ref.hashAlgorithm !== "sha256" || !/^[a-f0-9]{64}$/.test(ref.hash)) {
      failures.push(`PLATFORM_BASELINE_ARTIFACT_INTEGRITY ${relative} ${ref.path} invalid-hash`);
      continue;
    }
    const artifact = await readJson(ref.path, "PLATFORM_BASELINE_ARTIFACT_INTEGRITY");
    if (artifact && ref.hash !== jcsHash(artifact)) {
      failures.push(`PLATFORM_BASELINE_ARTIFACT_INTEGRITY ${relative} ${ref.path}`);
    }
  }
  const expectedClosureHash = admittedCatalogReportClosureHashes.get(relative) ||
    manifest.catalogReportClosure[relative];
  if (jcsHash(closure) !== expectedClosureHash) {
    failures.push(`PLATFORM_BASELINE_EVIDENCE_DRIFT ${relative} catalog-report-closure`);
  }
}

for (const relative of [
  ...admittedEvidenceSelfHashes.keys(),
  ...admittedCatalogReportClosureHashes.keys()
]) {
  if (!Object.hasOwn(manifest.evidence, relative)) {
    failures.push(`PLATFORM_BASELINE_SCHEMA_INVALID ${relative} stale-admitted-migration`);
  }
}

for (const [relative, expected] of Object.entries(manifest.rawLocks)) {
  const absolute = safeWorkspacePath(relative);
  if (!absolute) {
    failures.push(`PLATFORM_BASELINE_LOCK_DRIFT ${relative} invalid-path`);
    continue;
  }
  try {
    if (sha(await fs.readFile(absolute)) !== expected) failures.push(`PLATFORM_BASELINE_LOCK_DRIFT ${relative}`);
  } catch {
    failures.push(`PLATFORM_BASELINE_LOCK_DRIFT ${relative} unreadable`);
  }
}

for (const [relative, expected] of Object.entries(manifest.catalogAuthority)) {
  const catalog = await readJson(relative, "PLATFORM_BASELINE_AUTHORITY_DRIFT");
  if (!catalog) continue;
  const actual = manifest.catalogAuthorityOrder.map((key) => {
    if (!Object.hasOwn(catalog, key)) {
      failures.push(`PLATFORM_BASELINE_AUTHORITY_DRIFT ${relative} missing-${key}`);
      return null;
    }
    return jcsHash(catalog[key]);
  });
  if (canonical(actual) !== canonical(expected)) failures.push(`PLATFORM_BASELINE_AUTHORITY_DRIFT ${relative}`);
}

const tracked = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: root, encoding: "utf8" }
).trim().split("\n").filter((relative) =>
  relative && !isPostBaselinePath(relative) && !isInventoryExcludedPath(relative)).sort();
const inventory = {
  trackedPathCount: tracked.length,
  orderedPathListSha256: sha(`${tracked.join("\n")}\n`)
};
if (canonical(inventory) !== canonical(manifest.implementationInventory)) failures.push("PLATFORM_BASELINE_INVENTORY_DRIFT");

if (failures.length) {
  process.stderr.write(`${failures.sort().join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`platform path baseline verified: ${Object.keys(manifest.evidence).length} targets, ${tracked.length} tracked implementation paths\n`);
}
