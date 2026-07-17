#!/usr/bin/env node

import { materializeSourceFamilyLayoutMappingContract } from "../src/source-family-layout-mapping-contract.js";

await materializeSourceFamilyLayoutMappingContract(process.cwd());
