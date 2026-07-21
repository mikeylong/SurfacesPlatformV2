import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalJson } from "./p0.js";

export const DESIGN_SYSTEM_KERNEL = Object.freeze({
  name: "surfaces-design-system-ingestion-kernel",
  version: "0.0.0"
});

export const NORMALIZED_TIMESTAMP = "1970-01-01T00:00:00.000Z";

const DIAGNOSTIC_MESSAGES = Object.freeze({
  SOURCE_LOCK_MISMATCH: "The local source tree does not match its immutable reviewed lock.",
  SOURCE_REF_UNRESOLVED: "A normalized fact references source evidence outside the verified adapter closure.",
  MAPPING_SOURCE_MISMATCH: "A declarative mapping does not match the verified source anchor.",
  MAPPING_TARGET_MISMATCH: "A declarative mapping does not match the normalized target fact.",
  MAPPING_COVERAGE_INCOMPLETE: "The adapter mapping set does not cover the complete normalized authority surface.",
  MAPPING_AUTHORITY_UNJUSTIFIED: "A normalized target fact is not justified by the verified source or a conservative platform default.",
  SOURCE_IDENTITY_REUSED: "The reuse proof repeats an adapter, source, or design-system package identity.",
  COMPILER_AUTHORITY_ESCALATION: "The compiler output grants authority absent from the normalized adapter input."
});

export class DesignSystemKernelError extends Error {
  constructor(code, details = {}) {
    super(DIAGNOSTIC_MESSAGES[code] || code);
    this.name = "DesignSystemKernelError";
    this.code = code;
    this.stage = details.stage || "adapter";
    this.path = details.path || "/";
    this.sourceRef = details.sourceRef ?? null;
  }
}

export async function compileDesignSystemAdapter({ cwd, sourceRoot, sourceLock, adapter }) {
  const inventory = await verifyLockedSource({ cwd, sourceRoot, sourceLock });
  verifyAdapterIdentity(adapter, sourceLock);
  const anchors = await verifyAdapterAnchors({ cwd, sourceRoot, adapter, inventory });
  verifySourceRefClosure(adapter, anchors);
  verifyConservativePolicy(adapter);
  verifyMappings(adapter, anchors);

  const sourceHash = sha256Hex(canonicalJson(inventory.files));
  const adapterHash = sha256Hex(canonicalJson(adapter));
  const extract = buildExtract({ adapter, sourceHash, adapterHash, inventory });
  const { catalog, governedCatalog } = compileCatalog({ adapter, extract, adapterHash, sourceHash });
  const escalation = findCatalogAuthorityEscalation(governedCatalog, normalizedAuthorityBaseline(adapter));
  if (escalation) {
    throw new DesignSystemKernelError("COMPILER_AUTHORITY_ESCALATION", {
      stage: "compile",
      path: escalation,
      sourceRef: sourceRefAtPointer(governedCatalog, escalation)
    });
  }
  return { inventory, anchors, sourceHash, adapterHash, extract, catalog, governedCatalog };
}

export async function verifyLockedSource({ cwd, sourceRoot, sourceLock }) {
  assertRelativePosixPath(sourceRoot, "sourceRoot");
  if (sourceLock.rootPath !== sourceRoot) {
    throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/rootPath" });
  }
  await assertSafeInputRoot(cwd, sourceRoot);
  const absoluteRoot = path.join(cwd, sourceRoot);
  const files = await listRegularFiles(absoluteRoot);
  const lockedPaths = sourceLock.files.map((entry) => entry.path);
  if (!isSortedUnique(lockedPaths) || canonicalJson(files) !== canonicalJson([...lockedPaths].sort())) {
    throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/files" });
  }
  const verified = [];
  for (const row of sourceLock.files) {
    assertRelativePosixPath(row.path, "source lock file path");
    const absolutePath = path.join(absoluteRoot, ...row.path.split("/"));
    const stat = await fs.lstat(absolutePath).catch(() => null);
    if (!stat?.isFile() || stat.isSymbolicLink()) {
      throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: `/files/${escapePointer(row.path)}` });
    }
    const bytes = await fs.readFile(absolutePath);
    const sha256 = sha256Hex(bytes);
    if (bytes.length !== row.bytes || sha256 !== row.sha256) {
      throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: `/files/${escapePointer(row.path)}` });
    }
    verified.push({ path: row.path, bytes: row.bytes, sha256, origin: row.origin });
  }
  const licenseRow = verified.find((row) => row.path === sourceLock.acquisition.license.path);
  if (!licenseRow || licenseRow.sha256 !== sourceLock.acquisition.license.sha256) {
    throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/acquisition/license" });
  }
  return {
    sourceId: sourceLock.sourceId,
    sourceRoot,
    acquisition: sourceLock.acquisition,
    files: verified
  };
}

export function verifyAdapterIdentity(adapter, sourceLock) {
  const expectedPackageSegment = `${sourceLock.acquisition.packageName}@${sourceLock.acquisition.packageVersion}/package/`;
  if (!adapter.sourceRefPrefix.includes(expectedPackageSegment)) {
    throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", {
      path: "/sourceRefPrefix",
      sourceRef: adapter.sourceRefPrefix
    });
  }
}

export async function verifyAdapterAnchors({ cwd, sourceRoot, adapter, inventory }) {
  const locked = new Set(inventory.files.map((entry) => entry.path));
  const verified = new Map();
  const sourceRefs = new Set();
  for (const anchorId of Object.keys(adapter.anchors).sort()) {
    const anchor = adapter.anchors[anchorId];
    const expectedSourceRef = anchor.selector.kind === "json-pointer"
      ? `${adapter.sourceRefPrefix}${anchor.path}#${anchor.selector.pointer}`
      : `${adapter.sourceRefPrefix}${anchor.path}#anchor=${anchorId}`;
    if (anchor.sourceRef !== expectedSourceRef || sourceRefs.has(anchor.sourceRef) || !locked.has(anchor.path)) {
      throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", { path: `/anchors/${escapePointer(anchorId)}`, sourceRef: anchor.sourceRef });
    }
    sourceRefs.add(anchor.sourceRef);
    const absolutePath = path.join(cwd, sourceRoot, ...anchor.path.split("/"));
    const selector = anchor.selector;
    let value;
    let selectionHash;
    if (selector.kind === "json-pointer") {
      const document = JSON.parse(await fs.readFile(absolutePath, "utf8"));
      value = valueAtPointer(document, selector.pointer);
      if (value === undefined || canonicalJson(value) !== canonicalJson(selector.expected)) {
        throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: selector.pointer || "/", sourceRef: anchor.sourceRef });
      }
      selectionHash = sha256Hex(canonicalJson(value));
    } else if (selector.kind === "text-anchor") {
      const document = normalizeLineEndings(await fs.readFile(absolutePath, "utf8"));
      const startCount = countOccurrences(document, selector.startText);
      const endCount = countOccurrences(document, selector.endText);
      const startIndex = document.indexOf(selector.startText);
      const endIndex = document.indexOf(selector.endText, startIndex + selector.startText.length);
      if (startCount !== 1 || endCount !== 1 || startIndex < 0 || endIndex < startIndex) {
        throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: `/anchors/${escapePointer(anchorId)}`, sourceRef: anchor.sourceRef });
      }
      value = document.slice(startIndex, endIndex + selector.endText.length);
      if (selector.contains.some((needle) => !value.includes(needle))) {
        throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: `/anchors/${escapePointer(anchorId)}`, sourceRef: anchor.sourceRef });
      }
      selectionHash = sha256Hex(value);
    } else {
      throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", { path: `/anchors/${escapePointer(anchorId)}/selector`, sourceRef: anchor.sourceRef });
    }
    verified.set(anchor.sourceRef, {
      anchorId,
      path: anchor.path,
      selectorKind: selector.kind,
      selectorPointer: selector.kind === "json-pointer" ? selector.pointer : null,
      value,
      selectionHash
    });
  }
  return verified;
}

export function verifySourceRefClosure(adapter, anchors) {
  const refs = collectSourceRefs({
    normalizedExtract: adapter.normalizedExtract,
    governance: adapter.governance
  });
  for (const sourceRef of refs) {
    if (!anchors.has(sourceRef)) {
      throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", { path: "/normalizedExtract", sourceRef });
    }
  }
  for (const [key, sourceRef] of Object.entries(adapter.normalizedExtract.sourceRefs)) {
    if (!anchors.has(sourceRef)) {
      throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", { path: `/normalizedExtract/sourceRefs/${escapePointer(key)}`, sourceRef });
    }
  }
}

export function verifyMappings(adapter, anchors) {
  const targetDocument = {
    components: adapter.normalizedExtract.components,
    tokens: adapter.normalizedExtract.tokens
  };
  const expectedTargets = expectedMappingTargets(targetDocument);
  const actualTargets = adapter.mappings.map((mapping) => mapping.targetPointer);
  if (new Set(adapter.mappings.map((mapping) => mapping.mappingId)).size !== adapter.mappings.length ||
      !isSortedUnique(actualTargets) || canonicalJson(actualTargets) !== canonicalJson(expectedTargets)) {
    throw new DesignSystemKernelError("MAPPING_COVERAGE_INCOMPLETE", { path: "/mappings" });
  }

  for (const mapping of adapter.mappings) {
    const targetValue = valueAtPointer(targetDocument, mapping.targetPointer);
    if (targetValue === undefined || canonicalJson(targetValue) !== canonicalJson(mapping.targetValue)) {
      throw new DesignSystemKernelError("MAPPING_TARGET_MISMATCH", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    const selections = mapping.sourceRefs.map((sourceRef) => anchors.get(sourceRef));
    if (selections.some((selection) => !selection)) {
      throw new DesignSystemKernelError("SOURCE_REF_UNRESOLVED", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs.find((sourceRef) => !anchors.has(sourceRef)) });
    }
    if (!mappingSourceMatches(mapping.sourceValue, selections)) {
      throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    if (mapping.authorityMode === "reviewed-inference" && mapping.reviewStatus !== "review_required") {
      throw new DesignSystemKernelError("MAPPING_AUTHORITY_UNJUSTIFIED", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    const member = mappedMemberIdentity(mapping.targetPointer);
    const memberIdentityMatches = member === null || (member.group === "tokenRefs"
      ? typeof targetValue === "string" && (
          member.id === targetValue ||
          mapping.authorityMode === "reviewed-inference" ||
          collectVerifiedSourceAtoms(selections).has(canonicalJson(member.id))
        )
      : Boolean(targetValue) && typeof targetValue === "object" && targetValue.id === member.id);
    if (!memberIdentityMatches) {
      throw new DesignSystemKernelError("MAPPING_AUTHORITY_UNJUSTIFIED", {
        path: member.group === "tokenRefs" ? mapping.targetPointer : `${mapping.targetPointer}/id`,
        sourceRef: mapping.sourceRefs[0] || null
      });
    }
    if (mapping.transform === "identity" && canonicalJson(mapping.sourceValue) !== canonicalJson(mapping.targetValue)) {
      throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    if (mapping.transform === "rename" &&
        (mapping.authorityMode !== "reviewed-inference" || typeof mapping.sourceValue !== "string" || typeof mapping.targetValue !== "string" || mapping.sourceValue === mapping.targetValue)) {
      throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    if (mapping.transform === "strip-css-custom-property-prefix" &&
        (typeof mapping.sourceValue !== "string" || typeof mapping.targetValue !== "string" ||
         !mapping.sourceValue.startsWith("--") || mapping.targetValue !== mapping.sourceValue.slice(2))) {
      throw new DesignSystemKernelError("MAPPING_SOURCE_MISMATCH", { path: mapping.targetPointer, sourceRef: mapping.sourceRefs[0] || null });
    }
    if (mapping.authorityMode === "lossless" && mapping.transform === "structured-normalization") {
      const unjustified = findUnjustifiedTargetLeaf(mapping.targetValue, selections, mapping);
      if (unjustified !== null) {
        throw new DesignSystemKernelError("MAPPING_AUTHORITY_UNJUSTIFIED", {
          path: `${mapping.targetPointer}${unjustified}`,
          sourceRef: mapping.sourceRefs[0] || null
        });
      }
    }
  }
}

export function verifyConservativePolicy(adapter) {
  const expectedContract = {
    authority: "narrowing-only",
    runtimeCapabilitiesMode: "inert-derived-only",
    governanceMode: "owner-review-required"
  };
  const expectedCapabilities = {
    actionExecution: "disabled",
    adapterTarget: "web-static-inert",
    runtimeProjection: "catalog-derived"
  };
  const governance = adapter.governance;
  const rulesValid = governance && Object.values(governance.rules || {}).every((rule) =>
    canonicalJson(Object.keys(rule).sort()) === canonicalJson(["executable", "sourceRef"]) &&
    rule.executable === false && typeof rule.sourceRef === "string");
  const reviewMappings = governance?.results?.reviewRequiredMappings;
  const resultsValid = canonicalJson(Object.keys(governance?.results || {}).sort()) === canonicalJson(["reviewRequiredMappings"]) &&
    Array.isArray(reviewMappings) && isSortedUnique(reviewMappings);
  if (canonicalJson(adapter.policyContract) !== canonicalJson(expectedContract) ||
      canonicalJson(adapter.runtimeCapabilities) !== canonicalJson(expectedCapabilities) ||
      governance?.promotionStatus !== "review_required" || !rulesValid || !resultsValid) {
    throw new DesignSystemKernelError("MAPPING_AUTHORITY_UNJUSTIFIED", {
      path: "/policyContract",
      sourceRef: null
    });
  }
}

export function expectedMappingTargets(targetDocument) {
  const targets = [];
  for (const [index, component] of targetDocument.components.entries()) {
    targets.push(`/components/${index}/id`);
    for (const group of ["props", "variants", "states", "slots", "actions", "events", "dataBindings", "tokenRefs"]) {
      for (const id of Object.keys(component[group] || {}).sort()) {
        targets.push(`/components/${index}/${group}/${escapePointer(id)}`);
      }
    }
    targets.push(`/components/${index}/accessibility`);
    for (const indexOfExample of (component.examples || []).keys()) {
      targets.push(`/components/${index}/examples/${indexOfExample}`);
    }
  }
  collectTokenTargets(targetDocument.tokens, "/tokens", targets);
  return targets.sort();
}

function collectTokenTargets(node, pointer, targets) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  if (Object.prototype.hasOwnProperty.call(node, "$value") ||
      (Object.prototype.hasOwnProperty.call(node, "value") && Object.prototype.hasOwnProperty.call(node, "type"))) {
    targets.push(pointer);
    return;
  }
  for (const key of Object.keys(node).sort()) {
    if (key === "sourceRef") continue;
    collectTokenTargets(node[key], `${pointer}/${escapePointer(key)}`, targets);
  }
}

function mappingSourceMatches(sourceValue, selections) {
  if (selections.length === 1 && selections[0].selectorKind === "json-pointer") {
    return canonicalJson(selections[0].value) === canonicalJson(sourceValue);
  }
  const haystack = selections.map((selection) => typeof selection.value === "string" ? selection.value : canonicalJson(selection.value)).join("\n");
  const needles = Array.isArray(sourceValue) ? sourceValue : [sourceValue];
  return needles.every((needle) => haystack.includes(typeof needle === "string" ? needle : canonicalJson(needle)));
}

function findUnjustifiedTargetLeaf(targetValue, selections, mapping) {
  const atoms = collectVerifiedSourceAtoms(selections);
  const sourceText = selections
    .filter((selection) => typeof selection.value === "string")
    .map((selection) => selection.value)
    .join("\n");
  const walk = (value, pointer) => {
    if (value === null) return null;
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      for (const [index, child] of value.entries()) {
        const failure = walk(child, `${pointer}/${index}`);
        if (failure !== null) return failure;
      }
      return null;
    }
    if (value && typeof value === "object") {
      if (Object.keys(value).length === 0) return null;
      for (const key of Object.keys(value).sort()) {
        const failure = walk(value[key], `${pointer}/${escapePointer(key)}`);
        if (failure !== null) return failure;
      }
      return null;
    }
    const key = decodePointerSegment(pointer.split("/").at(-1) || "");
    if (key === "sourceRef") return mapping.sourceRefs.includes(value) ? null : pointer;
    if (key === "runtimeAccessibilityCompliance" && value === "not-proven") return null;
    if (key === "type" && value === "string" && sourceText.includes("type:") && sourceText.includes(" | ")) return null;
    if ((key === "required" || key === "allowMarkup") && value === false) return null;
    if (key === "minLength" && value === 1 && targetValue?.required === true && targetValue?.type === "string") return null;
    if (key === "$type" && value === "dimension" && /(?:^|[^A-Za-z0-9])[-+]?\d*\.?\d+(?:px|rem|em|%|vh|vw)(?:[^A-Za-z0-9]|$)/.test(sourceText)) return null;
    if (atoms.has(canonicalJson(value))) return null;
    if (typeof value === "string" && value.length >= 12 && sourceText.includes(value)) return null;
    return pointer;
  };
  return walk(targetValue, "");
}

function collectVerifiedSourceAtoms(selections) {
  const atoms = new Set();
  const add = (value) => {
    if (Array.isArray(value)) {
      for (const child of value) add(child);
      return;
    }
    if (value && typeof value === "object") {
      for (const child of Object.values(value)) add(child);
      return;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) atoms.add(canonicalJson(value));
    if (typeof value !== "string") return;
    for (const pattern of [/'([^'\n]*)'/g, /"([^"\n]*)"/g]) {
      for (const match of value.matchAll(pattern)) {
        atoms.add(canonicalJson(match[1]));
        if (match[1] === "true" || match[1] === "false") atoms.add(canonicalJson(match[1] === "true"));
      }
    }
    for (const match of value.matchAll(/\b(?:true|false)\b/g)) atoms.add(canonicalJson(match[0] === "true"));
    for (const match of value.matchAll(/(?:^|[^A-Za-z0-9.])([-+]?\d+(?:\.\d+)?)(?=$|[^A-Za-z0-9.])/g)) atoms.add(canonicalJson(Number(match[1])));
  };
  for (const selection of selections) {
    add(selection.value);
    if (selection.selectorKind === "json-pointer" && typeof selection.selectorPointer === "string") {
      const finalSegment = selection.selectorPointer.split("/").at(-1);
      if (finalSegment) add(decodePointerSegment(finalSegment));
    }
  }
  return atoms;
}

function mappedMemberIdentity(targetPointer) {
  const match = targetPointer.match(/^\/components\/(?:0|[1-9][0-9]*)\/(props|variants|states|slots|actions|events|dataBindings|tokenRefs)\/([^/]+)$/);
  return match ? { group: match[1], id: decodePointerSegment(match[2]) } : null;
}

function decodePointerSegment(value) {
  return String(value).replaceAll("~1", "/").replaceAll("~0", "~");
}

export function buildExtract({ adapter, sourceHash, adapterHash, inventory }) {
  return {
    schemaId: "extract.v0",
    version: "0.0.0",
    fixtureId: adapter.normalizedExtract.fixtureId,
    generatedAt: NORMALIZED_TIMESTAMP,
    sourceUri: adapter.normalizedExtract.sourceUri,
    sourceHash,
    tokens: structuredClone(adapter.normalizedExtract.tokens),
    components: structuredClone(adapter.normalizedExtract.components),
    sourceRefs: structuredClone(adapter.normalizedExtract.sourceRefs),
    provenance: {
      ...structuredClone(adapter.normalizedExtract.provenance),
      adapterId: adapter.adapterId,
      sourceFamily: adapter.sourceFamily,
      adapterHash,
      inventoryHash: sha256Hex(canonicalJson(inventory.files)),
      generator: { ...DESIGN_SYSTEM_KERNEL }
    },
    diagnostics: []
  };
}

export function compileCatalog({ adapter, extract, adapterHash, sourceHash }) {
  const components = {};
  for (const normalized of extract.components) {
    const { id, ...component } = structuredClone(normalized);
    if (components[id]) {
      throw new DesignSystemKernelError("MAPPING_TARGET_MISMATCH", { stage: "compile", path: `/components/${escapePointer(id)}` });
    }
    components[id] = component;
  }
  const provenance = {
    sourceUri: extract.sourceUri,
    sourceHash,
    adapterId: adapter.adapterId,
    adapterHash,
    generator: { ...DESIGN_SYSTEM_KERNEL },
    generatedAt: NORMALIZED_TIMESTAMP,
    host: null
  };
  const base = {
    catalogId: adapter.catalogId,
    schemaId: "runtime-catalog.v0",
    version: "0.0.0",
    sourceRefs: structuredClone(extract.sourceRefs),
    tokens: structuredClone(extract.tokens),
    components,
    runtimeCapabilities: structuredClone(adapter.runtimeCapabilities),
    provenance,
    diagnostics: [],
    compatibility: { a2ui: "reference-only" }
  };
  const catalog = {
    ...structuredClone(base),
    artifactKind: "catalog",
    governance: { rules: {}, results: {}, promotionStatus: null }
  };
  const governedCatalog = {
    ...structuredClone(base),
    artifactKind: "governed-catalog",
    governance: structuredClone(adapter.governance)
  };
  return { catalog, governedCatalog };
}

function normalizedAuthorityBaseline(adapter) {
  const components = {};
  for (const normalized of adapter.normalizedExtract.components) {
    const { id, ...component } = structuredClone(normalized);
    components[id] = component;
  }
  return {
    components,
    tokens: structuredClone(adapter.normalizedExtract.tokens),
    runtimeCapabilities: structuredClone(adapter.runtimeCapabilities),
    governance: structuredClone(adapter.governance)
  };
}

export function findCatalogAuthorityEscalation(candidate, baseline) {
  for (const key of ["components", "tokens", "runtimeCapabilities", "governance"]) {
    const escalation = findSubsetEscalation(candidate?.[key], baseline?.[key], `/${key}`);
    if (escalation) return escalation;
  }
  return null;
}

function findSubsetEscalation(candidate, baseline, pointer) {
  if (candidate === undefined) return null;
  if (baseline === undefined) return pointer;
  if (Array.isArray(candidate)) {
    if (!Array.isArray(baseline)) return pointer;
    const allowed = new Set(baseline.map((value) => canonicalJson(value)));
    for (const [index, value] of candidate.entries()) {
      if (!allowed.has(canonicalJson(value))) return `${pointer}/${index}`;
    }
    return null;
  }
  if (candidate && typeof candidate === "object") {
    if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) return pointer;
    for (const key of Object.keys(candidate).sort()) {
      const escalation = findSubsetEscalation(candidate[key], baseline[key], `${pointer}/${escapePointer(key)}`);
      if (escalation) return escalation;
    }
    return null;
  }
  return canonicalJson(candidate) === canonicalJson(baseline) ? null : pointer;
}

export function diagnosticFromKernelError(error, artifactPath) {
  const known = error instanceof DesignSystemKernelError;
  const code = known ? error.code : "MAPPING_TARGET_MISMATCH";
  return {
    code,
    severity: "error",
    message: known ? error.message : DIAGNOSTIC_MESSAGES.MAPPING_TARGET_MISMATCH,
    stage: known ? error.stage : "adapter",
    path: known ? error.path : "/",
    sourceRef: known ? error.sourceRef : null,
    artifactPath,
    promotionStatus: "blocked",
    suggestedAction: "Reject the run and correct the checked source, adapter mapping, or compiler output before promotion."
  };
}

export function valueAtPointer(document, pointer) {
  if (pointer === "") return document;
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  let current = document;
  for (const raw of pointer.slice(1).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return undefined;
    current = current[key];
  }
  return current;
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function collectSourceRefs(value) {
  const refs = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "sourceRef" && typeof child === "string") refs.add(child);
      else if (key === "sourceRefs" && Array.isArray(child)) {
        for (const ref of child) if (typeof ref === "string") refs.add(ref);
      } else if (key === "sourceRefs" && child && typeof child === "object") {
        for (const ref of Object.values(child)) if (typeof ref === "string") refs.add(ref);
      } else walk(child);
    }
  };
  walk(value);
  return refs;
}

async function listRegularFiles(root) {
  const output = [];
  const walk = async (absolute, prefix) => {
    const entries = await fs.readdir(absolute, { withFileTypes: true }).catch(() => {
      throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/rootPath" });
    });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(absolute, entry.name);
      const stat = await fs.lstat(absolutePath);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
        throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: `/files/${escapePointer(relative)}` });
      }
      if (stat.isDirectory()) await walk(absolutePath, relative);
      else output.push(relative);
    }
  };
  await walk(root, "");
  return output.sort();
}

async function assertSafeInputRoot(cwd, relativePath) {
  const workspace = await fs.lstat(cwd).catch(() => null);
  if (!workspace?.isDirectory() || workspace.isSymbolicLink()) {
    throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/rootPath" });
  }
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current).catch(() => null);
    if (!stat?.isDirectory() || stat.isSymbolicLink()) {
      throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: "/rootPath" });
    }
  }
}

function assertRelativePosixPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\") || path.isAbsolute(value) ||
      value.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw new DesignSystemKernelError("SOURCE_LOCK_MISMATCH", { stage: "source-preflight", path: `/${label}` });
  }
}

function sourceRefAtPointer(document, pointer) {
  let currentPointer = pointer;
  while (currentPointer) {
    const value = valueAtPointer(document, currentPointer);
    if (value && typeof value === "object" && typeof value.sourceRef === "string") return value.sourceRef;
    currentPointer = currentPointer.replace(/\/[^/]+$/, "");
  }
  return null;
}

function normalizeLineEndings(value) {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(needle, index)) !== -1) {
    count += 1;
    index += Math.max(needle.length, 1);
  }
  return count;
}

function isSortedUnique(values) {
  return canonicalJson(values) === canonicalJson([...new Set(values)].sort());
}

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}
