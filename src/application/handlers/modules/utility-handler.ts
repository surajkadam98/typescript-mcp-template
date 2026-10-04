/**
 * Utility Module — executes stateless utility tools, returns raw results.
 */

import type { AppConfig } from "../../../libraries/config.js";
import { ValidationError } from "../../../libraries/errors.js";
import type { UtilityToolName } from "../registry/utility.js";

export interface UtilityHandlerDeps {
  config: AppConfig;
}

const UTILITY_TOOL_NAMES = new Set<UtilityToolName>(["echo", "ping"]);

export function isUtilityTool(name: string): name is UtilityToolName {
  return UTILITY_TOOL_NAMES.has(name as UtilityToolName);
}

export async function executeUtilityTool(
  name: UtilityToolName,
  args: Record<string, unknown>,
  deps: UtilityHandlerDeps,
): Promise<unknown> {
  switch (name) {
    case "echo": {
      const message = args.message;
      if (typeof message !== "string" || message.trim().length === 0) {
        throw new ValidationError("'message' must be a non-empty string");
      }
      return { echoed: message, length: message.length };
    }
    case "ping":
      return {
        status: "ok",
        server: deps.config.server.name,
        version: deps.config.server.version,
        apiUrl: deps.config.api.baseUrl,
      };
  }
}
