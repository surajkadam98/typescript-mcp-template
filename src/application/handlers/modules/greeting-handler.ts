/**
 * Greeting Module — executes authenticated greeting tools, returns raw results.
 */

import type { GreetingService } from "../../services/greeting-service.js";
import type { GreetingToolName } from "../registry/greeting.js";

export interface GreetingHandlerDeps {
  greetingService: GreetingService;
}

const GREETING_TOOL_NAMES = new Set<GreetingToolName>(["greet"]);

export function isGreetingTool(name: string): name is GreetingToolName {
  return GREETING_TOOL_NAMES.has(name as GreetingToolName);
}

export async function executeGreetingTool(
  name: GreetingToolName,
  _args: Record<string, unknown>,
  deps: GreetingHandlerDeps,
): Promise<unknown> {
  switch (name) {
    case "greet": {
      const greeting = await deps.greetingService.greet();
      return { message: greeting.message, source: greeting.source };
    }
  }
}
