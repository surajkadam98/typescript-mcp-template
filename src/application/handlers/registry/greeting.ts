/**
 * Greeting Module — tool definitions
 */

import type { ToolDefinition } from "./types.js";

export const greetingTools: ToolDefinition[] = [
  {
    name: "greet",
    description: "Fetch a greeting from the API. Returns the API response message.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export type GreetingToolName = "greet";
