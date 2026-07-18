#!/usr/bin/env node
import { materializeSourceFamilyComponentIdentityMappingContract } from "../src/source-family-component-identity-mapping-contract.js";

try {
  await materializeSourceFamilyComponentIdentityMappingContract(process.cwd());
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
}
