/**
 * ToolHandler tests.
 *
 * Flow being tested:
 *   ToolHandler.handle() → auth gate → module executor → service → domain model
 *                        ← CallToolResult(text = JSON)
 */

import { describe, it, expect } from "vitest";
import { ToolHandler } from "../src/application/handlers/tool-handler.js";
import { tools } from "../src/application/handlers/tool-registry.js";
import { AuthService } from "../src/application/services/auth-service.js";
import { GreetingService } from "../src/application/services/greeting-service.js";
import { SessionStore } from "../src/infrastructure/auth/session-store.js";
import type { HttpClient } from "../src/infrastructure/http/api-client.js";
import type { AppConfig } from "../src/libraries/config.js";

const mockConfig: AppConfig = {
  server: { name: "test-server", version: "0.0.1" },
  api: { baseUrl: "http://localhost", timeout: 5000, apiKey: undefined },
};

function makeHandler() {
  const authService = new AuthService(new SessionStore());
  const greetingService = new GreetingService({} as HttpClient);
  const handler = new ToolHandler({ authService, greetingService, config: mockConfig });
  return { handler, authService };
}

async function call(handler: ToolHandler, name: string, args: Record<string, unknown> = {}) {
  const result = await handler.handle(name, args);
  const first = result.content[0] as { type: "text"; text: string };
  return { result, data: JSON.parse(first.text) };
}

describe("tool registry", () => {
  it("lists all tools", () => {
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["auth_status", "echo", "greet", "login", "logout", "ping"],
    );
  });
});

describe("ToolHandler — auth", () => {
  it("auth_status is false initially", async () => {
    const { handler } = makeHandler();
    const { data } = await call(handler, "auth_status");
    expect(data.authenticated).toBe(false);
  });

  it("login then logout toggles the session without leaking the token", async () => {
    const { handler } = makeHandler();

    const login = await call(handler, "login");
    expect(login.data.authenticated).toBe(true);
    expect(login.data).toHaveProperty("expires_at");
    expect(login.data).not.toHaveProperty("token");
    expect((await call(handler, "auth_status")).data.authenticated).toBe(true);

    expect((await call(handler, "logout")).data.authenticated).toBe(false);
    expect((await call(handler, "auth_status")).data.authenticated).toBe(false);
  });
});

describe("ToolHandler — greet", () => {
  it("prompts to login when unauthenticated", async () => {
    const { handler } = makeHandler();
    const { data } = await call(handler, "greet");
    expect(data.authenticated).toBe(false);
    expect(data.next_step).toContain("login");
  });

  it("returns the greeting after login", async () => {
    const { handler } = makeHandler();
    await call(handler, "login");
    const { result, data } = await call(handler, "greet");
    expect(result.isError).toBeFalsy();
    expect(data.message).toBe("Namaste!");
    expect(data).toHaveProperty("source");
  });
});

describe("ToolHandler — echo", () => {
  it("echoes the message with its length (no login needed)", async () => {
    const { handler } = makeHandler();
    const { result, data } = await call(handler, "echo", { message: "hello" });
    expect(result.isError).toBeFalsy();
    expect(data.echoed).toBe("hello");
    expect(data.length).toBe(5);
  });

  it("returns VALIDATION_ERROR for whitespace-only message", async () => {
    const { handler } = makeHandler();
    const { result, data } = await call(handler, "echo", { message: "   " });
    expect(result.isError).toBe(true);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when message is missing", async () => {
    const { handler } = makeHandler();
    const { result, data } = await call(handler, "echo");
    expect(result.isError).toBe(true);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("ToolHandler — ping", () => {
  it("returns server info (no login needed)", async () => {
    const { handler } = makeHandler();
    const { result, data } = await call(handler, "ping");
    expect(result.isError).toBeFalsy();
    expect(data.status).toBe("ok");
    expect(data.server).toBe("test-server");
    expect(data.version).toBe("0.0.1");
    expect(data.apiUrl).toBe("http://localhost");
  });
});

describe("ToolHandler — unknown tool", () => {
  it("returns UNKNOWN_TOOL once authenticated", async () => {
    const { handler } = makeHandler();
    await call(handler, "login");
    const { result, data } = await call(handler, "does_not_exist");
    expect(result.isError).toBe(true);
    expect(data.error.code).toBe("UNKNOWN_TOOL");
  });
});
