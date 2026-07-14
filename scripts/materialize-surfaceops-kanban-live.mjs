#!/usr/bin/env node
import { materializeSurfaceopsKanbanLiveContract } from "../src/surfaceops-kanban-live-contract.js";

await materializeSurfaceopsKanbanLiveContract(process.cwd());
