#!/usr/bin/env node

import { materializeSourceFamilyPackagingContract } from "../src/source-family-packaging-contract.js";

await materializeSourceFamilyPackagingContract(process.cwd());
