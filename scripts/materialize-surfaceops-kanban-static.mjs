#!/usr/bin/env node
import { materializeSurfaceopsKanbanStaticContract } from "../src/surfaceops-kanban-static-contract.js";

await materializeSurfaceopsKanbanStaticContract(process.cwd());
