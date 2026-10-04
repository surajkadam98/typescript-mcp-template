/**
 * MCP Tool Registry — merges all per-module tool definitions.
 *
 * To add a module: create ./<module>.ts, spread its tools below and
 * add its name type to ToolName.
 */

import type { ToolDefinition } from "./types.js";
import { authTools, type AuthToolName } from "./auth.js";
import { greetingTools, type GreetingToolName } from "./greeting.js";
import {
  utilityTools,
  utilityToolsRequiringNoAuth,
  type UtilityToolName,
} from "./utility.js";

export type { ToolDefinition } from "./types.js";
export { utilityToolsRequiringNoAuth };

export const tools: ToolDefinition[] = [
  ...authTools,
  ...greetingTools,
  ...utilityTools,
];

export type ToolName = AuthToolName | GreetingToolName | UtilityToolName;
