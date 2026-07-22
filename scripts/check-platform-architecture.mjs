#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { checkPlatformArchitecture, runArchitectureMutationFixtures } from "../src/platform-architecture.js";

const execFileAsync = promisify(execFile);
const DEFAULT_POLICY_PATH = "fixtures/platform-path-consolidation/architecture-policy.json";
const POLICY_SCHEMA_PATH = "schemas/platform-architecture-policy.v0.schema.json";
const DIAGNOSTICS_SCHEMA_PATH = "schemas/platform-architecture-diagnostics.v0.schema.json";
const MUTATION_SCHEMA_PATH = "schemas/platform-architecture-mutation.v0.schema.json";

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.ok) {
  process.stderr.write(`${parsed.error}\n`);
  process.exitCode = 2;
} else {
  try {
    const root = process.cwd();
    const [policy, policySchema, diagnosticsSchema, mutationSchema] = await Promise.all([
      readJson(root, parsed.policyPath),
      readJson(root, POLICY_SCHEMA_PATH),
      readJson(root, DIAGNOSTICS_SCHEMA_PATH),
      readJson(root, MUTATION_SCHEMA_PATH)
    ]);
    const base = await loadBaseContext(
      root,
      parsed.base || "HEAD",
      parsed.policyPath,
      POLICY_SCHEMA_PATH,
      policy.bootstrapChangeBoundary?.baseCommit,
      policy.adapterManifestPath
    );
    const result = await checkPlatformArchitecture({
      root,
      policy,
      policySchema,
      basePolicy: base.basePolicy,
      basePolicySchema: base.basePolicySchema,
      baseAdapterManifest: base.baseAdapterManifest,
      changedPaths: base.changedPaths
    });
    validateDiagnostics(diagnosticsSchema, result.diagnostics);
    if (result.status === "pass") {
      const mutations = await runArchitectureMutationFixtures({
        root,
        policy,
        policySchema,
        mutationSchema,
        diagnosticsSchema
      });
      validateDiagnostics(diagnosticsSchema, mutations.diagnostics);
      if (mutations.status === "fail") {
        for (const diagnostic of mutations.diagnostics) {
          process.stderr.write(`${diagnostic.code} ${diagnostic.path}: ${diagnostic.message}${diagnostic.detail ? ` (${diagnostic.detail})` : ""}\n`);
        }
        process.exitCode = 1;
      } else {
        process.stdout.write(`platform architecture: pass (${result.graph.files.length} files, ${result.graph.edges.length} local edges, ${mutations.matched}/${mutations.total} causal mutations${base.bootstrap ? `, bootstrap checkpoint ${base.bootstrapCheckpoint}` : ""})\n`);
      }
    } else {
      for (const diagnostic of result.diagnostics) {
        process.stderr.write(`${diagnostic.code} ${diagnostic.path}: ${diagnostic.message}${diagnostic.detail ? ` (${diagnostic.detail})` : ""}\n`);
      }
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`platform architecture check failed: ${error.message}\n`);
    process.exitCode = 2;
  }
}

export function parseArgs(argv) {
  let policyPath = DEFAULT_POLICY_PATH;
  let base = null;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--policy") {
      policyPath = argv[index + 1];
      index += 1;
    } else if (flag === "--base") {
      base = argv[index + 1];
      index += 1;
    } else {
      return { ok: false, error: `unknown argument: ${flag}` };
    }
  }
  if (!isRelativePosixPath(policyPath)) return { ok: false, error: "--policy must be a safe POSIX path relative to the repository root" };
  if (base !== null && !/^[a-f0-9]{7,64}$/i.test(base || "")) return { ok: false, error: "--base must be a git commit SHA" };
  return { ok: true, policyPath, base };
}

async function loadBaseContext(root, base, policyPath, policySchemaPath, bootstrapCheckpoint, adapterManifestPath) {
  await execFileAsync("git", ["cat-file", "-e", `${base}^{commit}`], { cwd: root });
  const { stdout: policyTree } = await execFileAsync("git", ["ls-tree", "-r", "--name-only", base, "--", policyPath], {
    cwd: root,
    maxBuffer: 4 * 1024 * 1024
  });
  if (!policyTree.split(/\r?\n/).filter(Boolean).includes(policyPath)) {
    if (!/^[a-f0-9]{40}$/.test(bootstrapCheckpoint || "")) {
      throw new Error("architecture bootstrap checkpoint is missing or invalid");
    }
    await assertCommitExists(root, bootstrapCheckpoint);
    await assertAncestor(root, base, bootstrapCheckpoint, "supplied base is not an ancestor of the architecture bootstrap checkpoint");
    await assertAncestor(root, bootstrapCheckpoint, "HEAD", "architecture bootstrap checkpoint is not an ancestor of HEAD");
    return {
      basePolicy: null,
      basePolicySchema: null,
      baseAdapterManifest: null,
      changedPaths: await changedPathsSince(root, bootstrapCheckpoint),
      bootstrap: true,
      bootstrapCheckpoint
    };
  }
  const changedPaths = await changedPathsSince(root, base);
  const [{ stdout: basePolicyBytes }, { stdout: basePolicySchemaBytes }] = await Promise.all([
    execFileAsync("git", ["show", `${base}:${policyPath}`], { cwd: root, maxBuffer: 4 * 1024 * 1024 }),
    execFileAsync("git", ["show", `${base}:${policySchemaPath}`], { cwd: root, maxBuffer: 4 * 1024 * 1024 })
  ]);
  const basePolicy = JSON.parse(basePolicyBytes);
  const baseAdapterPath = basePolicy.adapterManifestPath || adapterManifestPath;
  const { stdout: baseAdapterManifestBytes } = await execFileAsync(
    "git",
    ["show", `${base}:${baseAdapterPath}`],
    { cwd: root, maxBuffer: 4 * 1024 * 1024 }
  );
  return {
    basePolicy,
    basePolicySchema: JSON.parse(basePolicySchemaBytes),
    baseAdapterManifest: JSON.parse(baseAdapterManifestBytes),
    changedPaths,
    bootstrap: false,
    bootstrapCheckpoint: null
  };
}

async function assertCommitExists(root, commit) {
  try {
    await execFileAsync("git", ["cat-file", "-e", `${commit}^{commit}`], { cwd: root });
  } catch {
    throw new Error(`architecture bootstrap checkpoint does not exist: ${commit}`);
  }
}

async function assertAncestor(root, ancestor, descendant, message) {
  try {
    await execFileAsync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root });
  } catch (error) {
    if (error.code === 1) throw new Error(`${message}: ${ancestor}->${descendant}`);
    throw error;
  }
}

async function changedPathsSince(root, base) {
  const [{ stdout: changedPathBytes }, { stdout: untrackedPathBytes }] = await Promise.all([
    execFileAsync("git", ["diff", "--name-only", "--diff-filter=ACDMRTUXB", base, "--"], {
      cwd: root,
      maxBuffer: 4 * 1024 * 1024
    }),
    execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      maxBuffer: 4 * 1024 * 1024
    })
  ]);
  return [...new Set(`${changedPathBytes}\n${untrackedPathBytes}`.split(/\r?\n/).filter(Boolean))].sort();
}

function validateDiagnostics(schema, diagnostics) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  const validate = ajv.compile(schema);
  if (!validate(diagnostics)) {
    throw new Error(`architecture diagnostics violated their schema: ${ajv.errorsText(validate.errors)}`);
  }
}

async function readJson(root, relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, ...relativePath.split("/")), "utf8"));
}

function isRelativePosixPath(value) {
  return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("\\") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..");
}
