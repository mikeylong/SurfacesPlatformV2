import crypto from "node:crypto";

export const PROOF_RUNTIME = Object.freeze({
  name: "surfaces-proof-runtime",
  version: "0.0.0"
});

export const NORMALIZED_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export function canonicalJson(value) {
  assertIJson(value);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const keys = Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function canonicalArtifactRef(path, schemaId, value) {
  return {
    path,
    schemaId,
    hashAlgorithm: "sha256",
    hash: sha256Hex(canonicalJson(value))
  };
}

function assertIJson(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Canonical JSON requires finite JSON numbers.");
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new Error("Canonical JSON requires integer numbers to be IEEE-754 safe integers.");
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertIJson(item);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (nested === undefined) throw new Error(`Canonical JSON cannot serialize undefined at ${key}.`);
    assertIJson(nested);
  }
}
