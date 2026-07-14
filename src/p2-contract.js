import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalJson } from "./p0.js";

export const P2_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const P2_VERSION = "0.0.0";
export const P2_SOURCE_ROOT = "sources/p2/design-system-source";
export const P2_FIXTURE_ROOT = "fixtures/p2";
export const P2_ARTIFACT_ROOT = "artifacts/p2";
export const P2_SCHEMA_ROOT = "schemas";
export const P2_PACKAGE_ROOT = "npm/@adobe/spectrum-design-data/0.7.0/package";
export const P2_PACKAGE_NAME = "@adobe/spectrum-design-data";
export const P2_PACKAGE_VERSION = "0.7.0";
export const P2_PACKAGE_TARBALL = "https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz";
export const P2_PACKAGE_INTEGRITY = "sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==";
export const P2_PACKAGE_TARBALL_SHA256 = "12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0";
export const P2_PACKAGE_SNAPSHOT_LOCK_FILE = "package-snapshot.lock.json";
export const P2_PACKAGE_SNAPSHOT_LOCK_PATH = `${P2_SOURCE_ROOT}/${P2_PACKAGE_SNAPSHOT_LOCK_FILE}`;
export const P2_PACKAGE_SNAPSHOT_LOCK_SCHEMA_ID = "design-source-package-snapshot-lock.v0";
export const P2_PACKAGE_SNAPSHOT_LOCK_GENERATOR = "surfaces-p2-package-snapshot-lock";
export const P2_PACKAGE_SNAPSHOT_LOCK_DIAGNOSTIC_CODE = "INGEST_PACKAGE_SNAPSHOT_LOCK_MISMATCH";
export const P2_PACKAGE_SNAPSHOT_LOCK_DIAGNOSTIC_MESSAGE = "Local package snapshot does not match the immutable npm snapshot lock.";

export const P2_ENVIRONMENT = Object.freeze({
  generatedAt: P2_TIMESTAMP,
  host: null
});

export const P2_SCHEMA_FILES = [
  "design-source-package-snapshot-lock.v0.schema.json",
  "design-source-manifest.v0.schema.json",
  "design-source-inventory.v0.schema.json",
  "design-source-mapping.v0.schema.json",
  "design-system-ingestion-report.v0.schema.json",
  "design-system-ingestion-evidence.v0.schema.json",
  "design-system-ingestion-expectations.v0.schema.json",
  "design-system-ingestion-diagnostics.v0.schema.json",
  "design-system-ingestion-valid-fixture.v0.schema.json"
];

export const P2_SHARED_SCHEMA_FILES = [
  "extract.v0.schema.json",
  "runtime-catalog.v0.schema.json",
  "diagnostics.v0.schema.json",
  "fixture-expectations.v0.schema.json",
  "evidence.v0.schema.json"
];

export const P2_SOURCE_FILES = [
  ["package.json", "package"],
  ["README.md", "package"],
  ["LICENSE", "package"],
  ["components/button.json", "component"],
  ["components/in-line-alert.json", "component"],
  ["registry/components.json", "registry"],
  ["registry/property-terms.json", "registry"],
  ["registry/variants.json", "registry"],
  ["registry/states.json", "registry"],
  ["registry/anatomy-terms.json", "registry"],
  ["registry/token-terminology.json", "registry"],
  ["registry/token-objects.json", "registry"],
  ["tokens/color-component.tokens.json", "token"],
  ["tokens/color-aliases.tokens.json", "token"],
  ["tokens/color-palette.tokens.json", "token"],
  ["tokens/layout-component.tokens.json", "token"],
  ["tokens/layout.tokens.json", "token"],
  ["tokens/typography.tokens.json", "token"],
  ["mode-sets/color-scheme.json", "mode"],
  ["mode-sets/contrast.json", "mode"],
  ["mode-sets/scale.json", "mode"],
  ["fields/variant.json", "field"],
  ["fields/state.json", "field"],
  ["fields/size.json", "field"],
  ["fields/property.json", "field"],
  ["fields/anatomy.json", "field"],
  ["guidelines/developer-overview.json", "guideline"],
  ["guidelines/states.json", "guideline"],
  ["guidelines/colors.json", "guideline"],
  ["guidelines/spacing.json", "guideline"],
  ["guidelines/typography-fundamentals.json", "guideline"],
  ["docs/usage-policy.json", "policy"]
].map(([packagePath, sourceType]) => {
  const isDocs = packagePath.startsWith("docs/");
  const pathValue = isDocs ? packagePath : `${P2_PACKAGE_ROOT}/${packagePath}`;
  return {
    path: pathValue,
    packagePath: isDocs ? null : packagePath,
    sourceType,
    sourceSystem: isDocs ? "local:p2-docs" : "npm:@adobe/spectrum-design-data",
    hashAlgorithm: "sha256",
    sourceRefRoot: sourceRefForSourcePath(pathValue)
  };
});

export const P2_PACKAGE_SOURCE_FILES = P2_SOURCE_FILES.filter((entry) => entry.packagePath !== null);

export const P2_MAPPING_FILES = [
  {
    path: "mappings/component-map.json",
    mappingRefRoot: "mapping://p2/spectrum/component-map.json#/",
    hashAlgorithm: "sha256"
  },
  {
    path: "mappings/token-map.json",
    mappingRefRoot: "mapping://p2/spectrum/token-map.json#/",
    hashAlgorithm: "sha256"
  },
  {
    path: "mappings/policy-map.json",
    mappingRefRoot: "mapping://p2/spectrum/policy-map.json#/",
    hashAlgorithm: "sha256"
  }
];

export const P2_POLICY_REFS = [
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/developer-overview.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/states.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/colors.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/spacing.json#/",
  "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/typography-fundamentals.json#/",
  "source://p2/docs/usage-policy.json#/"
];

export const P2_FIXTURE_FILES = [
  "valid/spectrum-button.design-source.json",
  "valid/spectrum-in-line-alert.design-source.json",
  "valid/spectrum-subset.source-mapping.json",
  "review/manual-mapping-required.design-source.json",
  "invalid/unmapped-component.design-source.json",
  "invalid/unsupported-token.design-source.json",
  "invalid/unsupported-mode.design-source.json",
  "invalid/ambiguous-variant.design-source.json",
  "invalid/governance-policy-missing.design-source.json",
  "invalid/duplicate-normalized-id.design-source-mapping.json",
  "invalid/mapping-row-ref-invalid.design-source-mapping.json",
  "invalid/mapping-cardinality-invalid.design-source-mapping.json",
  "mutations/missing-source-manifest.design-source.json",
  "mutations/package-integrity-mismatch.design-source.json",
  "mutations/package-snapshot-byte-tamper.design-source.json",
  "mutations/source-path-undeclared.design-source.json",
  "mutations/invalid-source-ref.design-source.json",
  "mutations/source-hash-mismatch.design-source-inventory.json",
  "mutations/missing-source-ref.extract.json",
  "mutations/mapping-authority-escalation.design-source-mapping.json",
  "mutations/schema-hash-mismatch.design-system-ingestion-evidence.json",
  "mutations/hash-mismatch.design-system-ingestion-evidence.json"
].map((file) => `${P2_FIXTURE_ROOT}/${file}`);

export const P2_GENERATED_ARTIFACTS = [
  "source-inventory.json",
  "source-mapping.json",
  "extract.json",
  "catalog.json",
  "governed-catalog.json",
  "ingestion-report.json",
  "evidence.json"
];

export const P2_ARTIFACT_PATHS = P2_GENERATED_ARTIFACTS.map((file) => `${P2_ARTIFACT_ROOT}/${file}`);

export function p2SchemaPaths() {
  return [...P2_SCHEMA_FILES, ...P2_SHARED_SCHEMA_FILES].map((file) => `${P2_SCHEMA_ROOT}/${file}`);
}

export function p2SourceRefPaths() {
  return [
    P2_PACKAGE_SNAPSHOT_LOCK_PATH,
    ...P2_SOURCE_FILES.map((entry) => `${P2_SOURCE_ROOT}/${entry.path}`),
    ...P2_MAPPING_FILES.map((entry) => `${P2_SOURCE_ROOT}/${entry.path}`)
  ];
}

export function p2FixturePaths() {
  return [`${P2_FIXTURE_ROOT}/expectations.manifest.json`, ...P2_FIXTURE_FILES];
}

export function p2ArtifactOrder() {
  const [packageSnapshotLockPath, ...sourceRefPaths] = p2SourceRefPaths();
  return [
    ...p2SchemaPaths(),
    packageSnapshotLockPath,
    `${P2_SOURCE_ROOT}/manifest.json`,
    ...sourceRefPaths,
    ...p2FixturePaths(),
    ...P2_ARTIFACT_PATHS
  ];
}

export function sourceRefForSourcePath(sourcePath) {
  if (sourcePath === "docs/usage-policy.json") {
    return "source://p2/docs/usage-policy.json#/";
  }
  if (!sourcePath.startsWith(`${P2_PACKAGE_ROOT}/`)) {
    throw new Error(`unsupported P2 source path: ${sourcePath}`);
  }
  const packagePath = sourcePath.slice(`${P2_PACKAGE_ROOT}/`.length);
  return `spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/${packagePath}#/`;
}

export function schemaIdForP2Path(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (P2_SCHEMA_FILES.includes(file) || P2_SHARED_SCHEMA_FILES.includes(file)) {
    return file.replace(/\.schema\.json$/, "");
  }
  if (artifactPath === P2_PACKAGE_SNAPSHOT_LOCK_PATH) return P2_PACKAGE_SNAPSHOT_LOCK_SCHEMA_ID;
  if (artifactPath.endsWith("/manifest.json")) return "design-source-manifest.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "design-system-ingestion-expectations.v0";
  if (artifactPath.includes("/valid/") && artifactPath.endsWith(".source-mapping.json")) return "design-source-mapping.v0";
  if (artifactPath.includes("/valid/")) return "design-system-ingestion-valid-fixture.v0";
  if (artifactPath.endsWith(".design-source-mapping.json")) return "design-source-mapping.v0";
  if (artifactPath.includes("/review/")) return "design-system-ingestion-review-fixture.v0";
  if (artifactPath.includes("/invalid/")) return "design-system-ingestion-invalid-fixture.v0";
  if (artifactPath.includes("/mutations/")) return "design-system-ingestion-mutation-fixture.v0";
  if (artifactPath.endsWith("source-inventory.json")) return "design-source-inventory.v0";
  if (artifactPath.endsWith("source-mapping.json")) return "design-source-mapping.v0";
  if (artifactPath.endsWith("extract.json")) return "extract.v0";
  if (artifactPath.endsWith("catalog.json") || artifactPath.endsWith("governed-catalog.json")) return "runtime-catalog.v0";
  if (artifactPath.endsWith("ingestion-report.json")) return "design-system-ingestion-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "design-system-ingestion-evidence.v0";
  return null;
}

export async function buildP2CompanionSources() {
  return new Map([
    ["docs/usage-policy.json", buildUsagePolicy()]
  ]);
}

export async function writeCanonicalJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`);
  try {
    await fs.writeFile(tempPath, canonicalJson(data), { flag: "wx" });
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function rawFileHash(filePath) {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export async function canonicalFileHash(filePath) {
  const data = await readJson(filePath);
  return sha256Hex(canonicalJson(data));
}

export function assertP2PackageSnapshotLock(lock) {
  assertPlainObject(lock, "lock");
  assertExactKeys(lock, [
    "schemaId",
    "version",
    "packageName",
    "packageVersion",
    "packageTarball",
    "packageIntegrity",
    "tarballHashAlgorithm",
    "tarballSha256",
    "packageRoot",
    "packageFiles",
    "provenance"
  ], "lock");

  assertExactValue(lock.schemaId, P2_PACKAGE_SNAPSHOT_LOCK_SCHEMA_ID, "lock.schemaId");
  assertExactValue(lock.version, P2_VERSION, "lock.version");
  assertExactValue(lock.packageName, P2_PACKAGE_NAME, "lock.packageName");
  assertExactValue(lock.packageVersion, P2_PACKAGE_VERSION, "lock.packageVersion");
  assertExactValue(lock.packageTarball, P2_PACKAGE_TARBALL, "lock.packageTarball");
  assertExactValue(lock.packageIntegrity, P2_PACKAGE_INTEGRITY, "lock.packageIntegrity");
  assertExactValue(lock.tarballHashAlgorithm, "sha256", "lock.tarballHashAlgorithm");
  assertExactValue(lock.tarballSha256, P2_PACKAGE_TARBALL_SHA256, "lock.tarballSha256");
  assertExactValue(lock.packageRoot, P2_PACKAGE_ROOT, "lock.packageRoot");

  if (!Array.isArray(lock.packageFiles)) {
    throw invalidP2PackageSnapshotLock("lock.packageFiles must be an array");
  }
  if (lock.packageFiles.length !== P2_PACKAGE_SOURCE_FILES.length) {
    throw invalidP2PackageSnapshotLock(
      `lock.packageFiles must contain exactly ${P2_PACKAGE_SOURCE_FILES.length} ordered package files`
    );
  }

  const hashByPackagePath = new Map();
  for (let index = 0; index < P2_PACKAGE_SOURCE_FILES.length; index += 1) {
    const expected = P2_PACKAGE_SOURCE_FILES[index];
    const actual = lock.packageFiles[index];
    const label = `lock.packageFiles[${index}]`;
    assertPlainObject(actual, label);
    assertExactKeys(actual, ["packagePath", "hashAlgorithm", "sha256"], label);
    assertExactValue(actual.packagePath, expected.packagePath, `${label}.packagePath`);
    assertExactValue(actual.hashAlgorithm, "sha256", `${label}.hashAlgorithm`);
    if (typeof actual.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(actual.sha256)) {
      throw invalidP2PackageSnapshotLock(`${label}.sha256 must be a lowercase SHA-256 hex digest`);
    }
    hashByPackagePath.set(actual.packagePath, actual.sha256);
  }

  assertPlainObject(lock.provenance, "lock.provenance");
  assertExactKeys(lock.provenance, ["generatedAt", "generator", "sourceRefs"], "lock.provenance");
  assertExactValue(lock.provenance.generatedAt, P2_TIMESTAMP, "lock.provenance.generatedAt");
  assertExactValue(lock.provenance.generator, P2_PACKAGE_SNAPSHOT_LOCK_GENERATOR, "lock.provenance.generator");
  if (!Array.isArray(lock.provenance.sourceRefs) || lock.provenance.sourceRefs.length !== 1) {
    throw invalidP2PackageSnapshotLock("lock.provenance.sourceRefs must contain exactly the package tarball URL");
  }
  assertExactValue(lock.provenance.sourceRefs[0], P2_PACKAGE_TARBALL, "lock.provenance.sourceRefs[0]");

  return hashByPackagePath;
}

export async function verifyP2PackageSnapshotLock(root) {
  const lockFilePath = path.join(root, P2_PACKAGE_SNAPSHOT_LOCK_PATH);
  await assertRegularP2Input(root, P2_PACKAGE_SNAPSHOT_LOCK_PATH);

  let lock;
  try {
    lock = await readJson(lockFilePath);
  } catch (error) {
    throw invalidP2PackageSnapshotLock(`cannot parse ${P2_PACKAGE_SNAPSHOT_LOCK_PATH}: ${error.message}`);
  }

  const hashByPackagePath = assertP2PackageSnapshotLock(lock);
  await assertP2PackageSnapshotFileSet(root, [...hashByPackagePath.keys()]);
  for (const [packagePath, expectedHash] of hashByPackagePath) {
    const relativePath = `${P2_SOURCE_ROOT}/${P2_PACKAGE_ROOT}/${packagePath}`;
    const filePath = path.join(root, relativePath);
    await assertRegularP2Input(root, relativePath);
    const actualHash = await rawFileHash(filePath);
    if (actualHash !== expectedHash) {
      throw p2PackageSnapshotLockMismatch(
        `Path ${relativePath} expected ${expectedHash} but received ${actualHash}.`
      );
    }
  }

  return {
    lock,
    lockSha256: await rawFileHash(lockFilePath),
    hashByPackagePath
  };
}

export async function assertP2PackageSnapshotFileSet(root, expectedPackagePaths) {
  const packageRootPath = `${P2_SOURCE_ROOT}/${P2_PACKAGE_ROOT}`;
  await assertRegularP2Directory(root, packageRootPath);
  const actualPackagePaths = await listRegularP2Files(path.join(root, packageRootPath));
  const expected = [...expectedPackagePaths].sort(comparePosixPaths);
  const actual = [...actualPackagePaths].sort(comparePosixPaths);
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw p2PackageSnapshotLockMismatch(
      `Expected package files ${canonicalJson(expected)} but received ${canonicalJson(actual)}.`
    );
  }
  return actual;
}

export function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function assertRegularP2Input(root, label) {
  const filePath = await assertP2PathHasNoSymlinks(root, label);
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw new Error(`missing P2 source input: ${label}`);
  }
  if (!stat.isFile()) {
    throw new Error(`P2 source input is not a regular file: ${label}`);
  }
}

async function assertRegularP2Directory(root, label) {
  const directoryPath = await assertP2PathHasNoSymlinks(root, label);
  const stat = await fs.lstat(directoryPath);
  if (!stat.isDirectory()) {
    throw p2PackageSnapshotLockMismatch(`Package root is not a regular directory: ${label}.`);
  }
}

async function assertP2PathHasNoSymlinks(root, label) {
  let current = root;
  for (const segment of label.split("/")) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch {
      throw new Error(`missing P2 source input: ${label}`);
    }
    if (stat.isSymbolicLink()) {
      throw p2PackageSnapshotLockMismatch(`Symlinked package input is not allowed: ${label}.`);
    }
  }
  return current;
}

async function listRegularP2Files(directoryPath, relativeRoot = "") {
  const files = [];
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  entries.sort((left, right) => comparePosixPaths(left.name, right.name));
  for (const entry of entries) {
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isSymbolicLink()) {
      throw p2PackageSnapshotLockMismatch(`Symlinked package input is not allowed: ${relativePath}.`);
    }
    if (entry.isDirectory()) {
      files.push(...await listRegularP2Files(entryPath, relativePath));
      continue;
    }
    if (!entry.isFile()) {
      throw p2PackageSnapshotLockMismatch(`Non-regular package input is not allowed: ${relativePath}.`);
    }
    files.push(relativePath);
  }
  return files;
}

function comparePosixPaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function p2PackageSnapshotLockMismatch(detail) {
  return new Error(
    `${P2_PACKAGE_SNAPSHOT_LOCK_DIAGNOSTIC_CODE}: ${P2_PACKAGE_SNAPSHOT_LOCK_DIAGNOSTIC_MESSAGE} ${detail}`
  );
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalidP2PackageSnapshotLock(`${label} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (canonicalJson(actualKeys) !== canonicalJson(sortedExpectedKeys)) {
    throw invalidP2PackageSnapshotLock(`${label} must contain exactly: ${sortedExpectedKeys.join(", ")}`);
  }
}

function assertExactValue(actual, expected, label) {
  if (actual !== expected) {
    throw invalidP2PackageSnapshotLock(`${label} must equal ${JSON.stringify(expected)}`);
  }
}

function invalidP2PackageSnapshotLock(message) {
  return new Error(`invalid P2 package snapshot lock: ${message}`);
}

function buildUsagePolicy() {
  return {
    schemaId: "p2-usage-policy.v0",
    version: P2_VERSION,
    designSystemId: "adobe-spectrum",
    policyRefs: P2_POLICY_REFS,
    governanceRules: [
      {
        ruleId: "action-semantics-require-review",
        appliesTo: ["catalog://p2/components/Button/actions/*"],
        promotionStatus: "review_required",
        sourceRefs: [
          "source://p2/docs/usage-policy.json#/governanceRules/0",
          "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/developer-overview.json#/"
        ],
        rationale: "Action semantics are policy-sensitive and require explicit human mapping review in P2."
      },
      {
        ruleId: "status-messaging-policy",
        appliesTo: ["catalog://p2/components/InLineAlert/accessibility"],
        promotionStatus: "allowed",
        sourceRefs: [
          "source://p2/docs/usage-policy.json#/governanceRules/1",
          "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/guidelines/states.json#/"
        ],
        rationale: "Non-modal status messaging can be governed from declared Spectrum accessibility and local policy refs."
      }
    ],
    provenance: {
      generatedAt: P2_TIMESTAMP,
      generator: "interfacectl-p2-materialize",
      sourceRefs: P2_POLICY_REFS
    }
  };
}
