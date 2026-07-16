#!/usr/bin/env node
import { materializeSourceAccessibilityPolicyContract } from "../src/source-accessibility-policy-contract.js";

await materializeSourceAccessibilityPolicyContract(process.cwd());
