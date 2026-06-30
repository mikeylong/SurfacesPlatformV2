#!/usr/bin/env node
import { materializeSourceConformanceContract } from "../src/source-conformance-contract.js";

await materializeSourceConformanceContract(process.cwd());
