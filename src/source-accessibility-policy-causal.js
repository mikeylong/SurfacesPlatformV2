import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { canonicalJson } from "./p0.js";

const P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
const P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
const SOURCE_CONFORMANCE_CATALOG_PATH = "artifacts/source-conformance/governed-catalog.json";
const SOURCE_CONFORMANCE_EVIDENCE_PATH = "artifacts/source-conformance/evidence.json";
const SOURCE_CONFORMANCE_COVERAGE_PATH = "artifacts/source-conformance/source-fact-coverage.json";
const SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH = "artifacts/source-family-packaging/evidence.json";
const SOURCE_CONFORMANCE_ROOT = "sources/source-conformance/declared-source-bundle";
const SOURCE_ACCESSIBILITY_ROOT = "sources/source-accessibility-policy";
const P2_SOURCE_ROOT = "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package";
const SOURCE_ACCESSIBILITY_FIXTURE_ROOT = "fixtures/source-accessibility-policy";
const SOURCE_ACCESSIBILITY_ARTIFACT_ROOT = "artifacts/source-accessibility-policy";
const SEMANTIC_COPY_PATHS = [
  ".github",
  "bin",
  "fixtures",
  "plans",
  "schemas",
  "scripts",
  "sources",
  "src",
  "artifacts",
  "package.json",
  "package-lock.json",
  "PLAN.md",
  "VISION.md"
];

let semanticReverificationDepth = 0;

export async function checkedPrecedenceConflictAuthorized({ cwd, conflict }) {
  if (!conflict || conflict.resolutionMode !== "primary-precedence") return false;
  if (canonicalJson(conflict.selectedValue) !== canonicalJson(conflict.primaryValue)) return false;
  return await checkedPrecedenceFactBinding({ cwd, conflict });
}

export async function firstCausalFixtureDiagnosticCode({ cwd, fixture }) {
  if (fixture?.schemaId === "source-accessibility-policy-preflight-mutation.v0") {
    return await preflightMutationDiagnostic(cwd, fixture);
  }

  if (fixture?.integrityMutation?.kind === "source-hash") {
    return await sourceHashMutationDiagnostic(cwd, fixture.integrityMutation);
  }
  if (fixture?.integrityMutation?.kind === "evidence-hash") {
    return await evidenceHashMutationDiagnostic(cwd, fixture.integrityMutation);
  }
  if (fixture?.freeFormPolicyText !== null && fixture?.freeFormPolicyText !== undefined) {
    return "SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN";
  }
  if (fixture?.catalogMutation !== null && fixture?.catalogMutation !== undefined) {
    const catalog = await readJson(path.join(cwd, P2_CATALOG_PATH));
    const candidate = structuredClone(catalog);
    setValueAtJsonPointer(candidate, fixture.catalogMutation.catalogPointer, fixture.catalogMutation.value);
    if (canonicalJson(candidate) !== canonicalJson(catalog)) return "SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION";
  }
  if (fixture?.reviewRouteMutation !== null && fixture?.reviewRouteMutation !== undefined) {
    const route = await loadReviewRoute(cwd, fixture.reviewRouteMutation.routeId);
    if (!route) return null;
    const candidate = { ...route, owner: fixture.reviewRouteMutation.owner };
    if (candidate.owner === null || candidate.owner === "") return "SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING";
  }
  if (fixture?.declarationOverride !== null && fixture?.declarationOverride !== undefined) {
    return await declarationOverrideDiagnostic(cwd, fixture.declarationOverride);
  }
  if (fixture?.authorityConflict !== null && fixture?.authorityConflict !== undefined) {
    if (!await checkedPrecedenceFactBinding({ cwd, conflict: fixture.authorityConflict })) return null;
    if (fixture.authorityConflict.resolutionMode !== "primary-precedence") {
      return "SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED";
    }
  }
  return null;
}

export async function firstSourceAccessibilityPolicySemanticFailureCode({ cwd, evidence, runProof }) {
  if (semanticReverificationDepth > 0) return null;
  semanticReverificationDepth += 1;
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "source-accessibility-policy-semantic-"));
  try {
    for (const relativePath of SEMANTIC_COPY_PATHS) {
      const sourcePath = path.join(cwd, relativePath);
      if (!await pathExists(sourcePath)) continue;
      await fs.cp(sourcePath, path.join(temporaryRoot, relativePath), { recursive: true, preserveTimestamps: true });
    }
    const dependencyRoot = path.join(cwd, "node_modules");
    if (await pathExists(dependencyRoot)) {
      await fs.symlink(dependencyRoot, path.join(temporaryRoot, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    }
    await fs.rm(path.join(temporaryRoot, SOURCE_ACCESSIBILITY_ARTIFACT_ROOT), { recursive: true, force: true });
    await runProof({
      cwd: temporaryRoot,
      sourceRoot: SOURCE_ACCESSIBILITY_ROOT,
      ingestionEvidencePath: P2_EVIDENCE_PATH,
      catalogPath: P2_CATALOG_PATH,
      sourceConformanceEvidencePath: SOURCE_CONFORMANCE_EVIDENCE_PATH,
      sourceConformanceCatalogPath: SOURCE_CONFORMANCE_CATALOG_PATH,
      sourceFamilyPackagingEvidencePath: SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH,
      fixtureRoot: SOURCE_ACCESSIBILITY_FIXTURE_ROOT,
      outRoot: SOURCE_ACCESSIBILITY_ARTIFACT_ROOT,
      command: evidence.command ?? "interfacectl surfaces source-accessibility-policy proof",
      args: evidence.args ?? {
        source: SOURCE_ACCESSIBILITY_ROOT,
        fixture: SOURCE_ACCESSIBILITY_FIXTURE_ROOT,
        out: SOURCE_ACCESSIBILITY_ARTIFACT_ROOT
      }
    });

    for (const ref of evidence.artifacts || []) {
      const expected = await readJson(path.join(temporaryRoot, ref.path));
      const actual = ref.path === `${SOURCE_ACCESSIBILITY_ARTIFACT_ROOT}/evidence.json`
        ? evidence
        : await readJson(path.join(cwd, ref.path));
      if (canonicalJson(actual) !== canonicalJson(expected)) {
        return "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH";
      }
    }
    return null;
  } catch {
    return "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH";
  } finally {
    semanticReverificationDepth -= 1;
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function checkedPrecedenceFactBinding({ cwd, conflict }) {
  if (!conflict || typeof conflict.catalogPointer !== "string") return false;
  const catalog = await readJson(path.join(cwd, P2_CATALOG_PATH));
  const catalogResult = valueAtJsonPointer(catalog, conflict.catalogPointer);
  if (!catalogResult.found) return false;
  if (canonicalJson(catalogResult.value) !== canonicalJson(conflict.primaryValue)) return false;
  if (canonicalJson(catalogResult.value) !== canonicalJson(conflict.selectedValue)) return false;

  const coverage = await readJson(path.join(cwd, SOURCE_CONFORMANCE_COVERAGE_PATH));
  const coverageRow = (coverage.componentCoverage || [])
    .flatMap((component) => component.facts || [])
    .find((fact) => fact.catalogPointer === conflict.catalogPointer);
  if (!coverageRow || coverageRow.conflict !== true || coverageRow.resolution !== "primary-precedence") return false;
  if (coverageRow.primaryFactRef !== conflict.primaryFactRef) return false;
  if (canonicalJson(coverageRow.supportingFactRefs || []) !== canonicalJson(conflict.supportingFactRefs || [])) return false;
  if ((conflict.supportingFactRefs || []).length !== (conflict.supportingValues || []).length) return false;

  const valueHashes = await buildCheckedFactValueHashIndex(cwd);
  if (valueHashes.get(conflict.primaryFactRef) !== hashCanonical(conflict.primaryValue)) return false;
  for (let index = 0; index < conflict.supportingFactRefs.length; index += 1) {
    if (valueHashes.get(conflict.supportingFactRefs[index]) !== hashCanonical(conflict.supportingValues[index])) return false;
  }
  return conflict.supportingValues.some((value) => canonicalJson(value) !== canonicalJson(conflict.primaryValue));
}

async function buildCheckedFactValueHashIndex(cwd) {
  const manifestPath = path.join(cwd, SOURCE_CONFORMANCE_ROOT, "manifest.json");
  const manifest = await readJson(manifestPath);
  const index = new Map();
  for (const entry of manifest.sourceFiles || []) {
    if (entry.sourceType !== "component") continue;
    const absolutePath = path.join(cwd, SOURCE_CONFORMANCE_ROOT, entry.path);
    const bytes = await fs.readFile(absolutePath);
    if (hashBytes(bytes) !== entry.sha256) throw new Error(`source-conformance manifest hash mismatch: ${entry.path}`);
    const document = JSON.parse(bytes.toString("utf8"));
    for (const fact of document.facts || []) index.set(fact.sourceRef, hashCanonical(fact.value));
  }
  return index;
}

async function declarationOverrideDiagnostic(cwd, declaration) {
  const catalog = await readJson(path.join(cwd, P2_CATALOG_PATH));
  for (const assertion of declaration.assertions || []) {
    for (const sourceRef of assertion.sourceRefs || []) {
      if (!await sourceRefResolves(cwd, sourceRef)) return "SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING";
    }
    const actual = valueAtJsonPointer(catalog, assertion.catalogPointer);
    if (!actual.found) return "SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED";
    const matches = assertion.operator === "exists"
      ? actual.found === true
      : canonicalJson(actual.value) === canonicalJson(assertion.expectedValue);
    if (!matches) return "SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT";
  }
  return null;
}

async function preflightMutationDiagnostic(cwd, fixture) {
  const absolutePath = path.join(cwd, fixture.upstreamPath);
  const exists = await pathExists(absolutePath);
  const actualHash = exists ? await hashCanonicalFile(absolutePath) : null;
  const upstream = exists ? await readJson(absolutePath) : null;
  const candidate = {
    exists,
    actualHash,
    claimedHash: actualHash,
    status: upstream?.status ?? null
  };
  if (fixture.mutation === "missing") candidate.exists = false;
  if (fixture.mutation === "hash-mismatch") candidate.claimedHash = "0".repeat(64);
  if (fixture.mutation === "status-fail") candidate.status = "fail";
  if (!candidate.exists || candidate.status !== "pass") return "SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING";
  if (candidate.claimedHash !== candidate.actualHash) return "SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH";
  return null;
}

async function sourceHashMutationDiagnostic(cwd, mutation) {
  const manifestPath = path.join(cwd, mutation.targetPath);
  const candidate = await readJson(manifestPath);
  setValueAtJsonPointer(candidate, mutation.jsonPointer, mutation.replacementValue);
  const sourceRoot = path.dirname(manifestPath);
  for (const entry of candidate.sourceFiles || []) {
    const bytes = await fs.readFile(path.join(sourceRoot, entry.path));
    if (hashBytes(bytes) !== entry.sha256) return "SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH";
  }
  return null;
}

async function evidenceHashMutationDiagnostic(cwd, mutation) {
  const actualHash = await hashCanonicalFile(path.join(cwd, mutation.targetPath));
  const candidate = { artifacts: [{ path: mutation.targetPath, hash: actualHash }] };
  setValueAtJsonPointer(candidate, mutation.jsonPointer, mutation.replacementValue);
  return candidate.artifacts[0].hash === actualHash ? null : "SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH";
}

async function sourceRefResolves(cwd, sourceRef) {
  const separator = sourceRef.indexOf("#");
  if (separator < 0) return false;
  const root = sourceRef.slice(0, separator);
  const pointer = sourceRef.slice(separator + 1);
  let absolutePath;
  if (root.startsWith("source-accessibility-policy://")) {
    absolutePath = safeJoinedPath(cwd, SOURCE_ACCESSIBILITY_ROOT, root.slice("source-accessibility-policy://".length));
  } else if (root.startsWith("declared-source://source-conformance/")) {
    absolutePath = safeJoinedPath(cwd, SOURCE_CONFORMANCE_ROOT, root.slice("declared-source://source-conformance/".length));
  } else if (root.startsWith("spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/")) {
    absolutePath = safeJoinedPath(cwd, P2_SOURCE_ROOT, root.slice("spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/".length));
  } else {
    return false;
  }
  if (!absolutePath || !await pathExists(absolutePath)) return false;
  const document = await readJson(absolutePath);
  return valueAtJsonPointer(document, pointer).found;
}

async function loadReviewRoute(cwd, routeId) {
  const manifest = await readJson(path.join(cwd, SOURCE_ACCESSIBILITY_ROOT, "manifest.json"));
  for (const entry of manifest.sourceFiles || []) {
    const document = await readJson(path.join(cwd, SOURCE_ACCESSIBILITY_ROOT, entry.path));
    for (const key of ["reviewRoutes", "routes"]) {
      const route = (document[key] || []).find((candidate) => candidate.routeId === routeId);
      if (route) return route;
    }
  }
  return null;
}

function safeJoinedPath(cwd, root, relativePath) {
  const normalized = path.posix.normalize(relativePath);
  if (normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return path.join(cwd, root, normalized);
}

function valueAtJsonPointer(document, pointer) {
  if (pointer === "" || pointer === "/") return { found: true, value: document };
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return { found: false, value: undefined };
  let current = document;
  for (const token of pointer.slice(1).split("/").map(unescapeJsonPointer)) {
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, token)) {
      return { found: false, value: undefined };
    }
    current = current[token];
  }
  return { found: true, value: current };
}

function setValueAtJsonPointer(document, pointer, value) {
  const tokens = pointer.slice(1).split("/").map(unescapeJsonPointer);
  let current = document;
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index];
    if (current[token] === null || typeof current[token] !== "object") current[token] = {};
    current = current[token];
  }
  current[tokens[tokens.length - 1]] = structuredClone(value);
}

function unescapeJsonPointer(value) {
  return value.replaceAll("~1", "/").replaceAll("~0", "~");
}

function hashCanonical(value) {
  return hashBytes(canonicalJson(value));
}

async function hashCanonicalFile(filePath) {
  return hashCanonical(await readJson(filePath));
}

function hashBytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await fs.lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}
