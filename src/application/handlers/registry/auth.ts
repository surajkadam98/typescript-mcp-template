/**
 * Auth Module — tool definitions
 */

import type { ToolDefinition } from "./types.js";

export const authTools: ToolDefinition[] = [
  {
    name: "login",
    description:
      "Authenticate and receive a session token. MOCK — no credentials required. " +
      "In production this would be replaced with a real credential flow.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "logout",
    description: "Clear the current session credential from memory.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "auth_status",
    description: "Check whether the current session is authenticated.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export type AuthToolName = "login" | "logout" | "auth_status";
