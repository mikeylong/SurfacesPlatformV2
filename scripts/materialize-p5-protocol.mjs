#!/usr/bin/env node
import { materializeP5ProtocolContract } from "../src/p5-protocol-contract.js";

await materializeP5ProtocolContract(process.cwd());
