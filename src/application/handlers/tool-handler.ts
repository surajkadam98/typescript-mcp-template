/**
 * MCP Tool Handler
 * Thin dispatcher: applies the auth gate, then routes tool calls to the
 * owning module's executor. Per-module logic lives in ./modules/*.ts.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AuthService } from "../services/auth-service.js";
import type { GreetingService } from "../services/greeting-service.js";
import type { AppConfig } from "../../libraries/config.js";
import { AppError, toAppError, formatErrorResponse } from "../../libraries/errors.js";
import { logger } from "../../libraries/logger.js";
import { utilityToolsRequiringNoAuth } from "./registry/index.js";
import { isAuthTool, executeAuthTool } from "./modules/auth-handler.js";
import { isGreetingTool, executeGreetingTool } from "./modules/greeting-handler.js";
import { isUtilityTool, executeUtilityTool } from "./modules/utility-handler.js";

const AUTH_PROMPT = JSON.stringify({
  authenticated: false,
  message: "You need to login before using this tool. Do you want to login now?",
  next_step: "Just say the word and I will call the 'login' tool for you.",
});

const NO_AUTH_TOOLS = new Set<string>(utilityToolsRequiringNoAuth);

export interface ToolHandlerDependencies {
  authService: AuthService;
  greetingService: GreetingService;
  config: AppConfig;
}

function ok(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export class ToolHandler {
  constructor(private readonly deps: ToolHandlerDependencies) {}

  async handle(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    try {
      // Always-allowed: credential setup tools
      if (isAuthTool(name)) {
        return ok(await executeAuthTool(name, args, this.deps));
      }

      // Always-allowed: tools with no auth requirement
      if (NO_AUTH_TOOLS.has(name)) {
        return ok(await this.executeCommand(name, args));
      }

      // Everything else requires an authenticated session
      if (!this.deps.authService.isAuthenticated()) {
        return { content: [{ type: "text", text: AUTH_PROMPT }] };
      }

      return ok(await this.executeCommand(name, args));
    } catch (error) {
      const appError = toAppError(error);
      logger.warn(
        `Tool ${JSON.stringify(name)} error [${appError.code}]: ${appError.message}`,
      );
      return {
        content: [{ type: "text", text: formatErrorResponse(appError) }],
        isError: true,
      };
    }
  }

  private async executeCommand(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    if (isGreetingTool(name)) {
      return executeGreetingTool(name, args, { greetingService: this.deps.greetingService });
    }
    if (isUtilityTool(name)) {
      return executeUtilityTool(name, args, { config: this.deps.config });
    }

    throw new AppError(`Unknown tool: ${JSON.stringify(name)}`, "UNKNOWN_TOOL", 400);
  }
}
