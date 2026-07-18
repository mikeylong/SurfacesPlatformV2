#!/usr/bin/env node

import { materializeSourceFamilyNamespaceMappingContract } from "../src/source-family-namespace-mapping-contract.js";

await materializeSourceFamilyNamespaceMappingContract(process.cwd());
