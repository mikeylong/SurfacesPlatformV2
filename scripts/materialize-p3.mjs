#!/usr/bin/env node
import { materializeP3Contract } from "../src/p3-contract.js";

await materializeP3Contract(process.cwd());
