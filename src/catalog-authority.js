import { canonicalJson } from "./proof-runtime.js";

export const CATALOG_AUTHORITY = Object.freeze({
  name: "surfaces-catalog-authority",
  version: "0.0.0"
});

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

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}
