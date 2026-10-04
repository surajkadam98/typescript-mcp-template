/**
 * Utility Module — tool definitions (no auth required)
 */

import type { ToolDefinition } from "./types.js";

export const utilityTools: ToolDefinition[] = [
  {
    name: "echo",
    description: "Echo back the provided message.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Text to echo back" },
      },
      required: ["message"],
    },
  },
  {
    name: "ping",
    description: "Health check — returns server name, version, and API URL.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

/** Tools usable without a session — utility tools have no auth requirement. */
export const utilityToolsRequiringNoAuth: readonly string[] = ["echo", "ping"];

export type UtilityToolName = "echo" | "ping";
