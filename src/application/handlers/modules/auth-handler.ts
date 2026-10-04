/**
 * Auth Module — executes credential tools (always allowed, no session required).
 */

import type { AuthService } from "../../services/auth-service.js";
import type { AuthToolName } from "../registry/auth.js";

export interface AuthHandlerDeps {
  authService: AuthService;
}

const AUTH_TOOL_NAMES = new Set<AuthToolName>(["login", "logout", "auth_status"]);

export function isAuthTool(name: string): name is AuthToolName {
  return AUTH_TOOL_NAMES.has(name as AuthToolName);
}

export async function executeAuthTool(
  name: AuthToolName,
  _args: Record<string, unknown>,
  deps: AuthHandlerDeps,
): Promise<unknown> {
  switch (name) {
    case "login": {
      const token = await deps.authService.login();
      return {
        authenticated: deps.authService.isAuthenticated(),
        expires_at: token.expires_at,
      };
    }
    case "logout":
      await deps.authService.logout();
      return { authenticated: false };

    case "auth_status":
      return { authenticated: deps.authService.isAuthenticated() };
  }
}
