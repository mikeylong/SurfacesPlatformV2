#!/usr/bin/env node
import { materializeCapabilityIndexContract } from "../src/capability-index-contract.js";

await materializeCapabilityIndexContract(process.cwd());
