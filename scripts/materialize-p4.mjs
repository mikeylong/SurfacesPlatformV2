#!/usr/bin/env node
import { materializeP4Contract } from "../src/p4-contract.js";

await materializeP4Contract(process.cwd());
