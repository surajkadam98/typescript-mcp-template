/**
 * Dependency Injection Container.
 *
 * Wires all dependencies in one place. Services never construct their own
 * dependencies — they receive them via constructor injection.
 *
 * Order:
 *   1. Config (from env)
 *   2. Infrastructure (HttpClient)
 *   3. Services (inject infrastructure)
 *   4. Handlers (inject services + config)
 */

import { getConfig, resetConfig, type AppConfig } from "./libraries/config.js";
import { HttpClient } from "./infrastructure/http/api-client.js";
import { SessionStore } from "./infrastructure/auth/session-store.js";
import { AuthService } from "./application/services/auth-service.js";
import { GreetingService } from "./application/services/greeting-service.js";
import { ToolHandler } from "./application/handlers/tool-handler.js";

export interface Container {
  config: AppConfig;
  http: HttpClient;
  sessionStore: SessionStore;
  authService: AuthService;
  greetingService: GreetingService;
  toolHandler: ToolHandler;
}

export function createContainer(): Container {
  const config = getConfig();

  const http = new HttpClient({
    baseUrl: config.api.baseUrl,
    timeout: config.api.timeout,
    defaultHeaders: config.api.apiKey ? { "X-API-Key": config.api.apiKey } : {},
  });

  const sessionStore = new SessionStore();
  const authService = new AuthService(sessionStore);
  const greetingService = new GreetingService(http);
  const toolHandler = new ToolHandler({
    authService,
    greetingService,
    config,
  });

  return {
    config,
    http,
    sessionStore,
    authService,
    greetingService,
    toolHandler,
  };
}

let containerInstance: Container | null = null;

export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = createContainer();
  }
  return containerInstance;
}

export function resetContainer(): void {
  containerInstance = null;
  resetConfig();
}
