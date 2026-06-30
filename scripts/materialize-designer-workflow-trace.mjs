#!/usr/bin/env node
import { materializeDesignerWorkflowTraceContract } from "../src/designer-workflow-trace-contract.js";

await materializeDesignerWorkflowTraceContract(process.cwd());
