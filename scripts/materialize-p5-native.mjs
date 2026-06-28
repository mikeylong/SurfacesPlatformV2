#!/usr/bin/env node
import { materializeP5NativeContract } from "../src/p5-native-contract.js";

await materializeP5NativeContract(process.cwd());
