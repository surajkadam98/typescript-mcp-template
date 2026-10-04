# Adding a New API Service

This guide walks through every file you touch to add a new API service. The example adds a `FruitService` that calls a `/fruits` endpoint and exposes it as a **`fruit` module** (registry + executor).

---

## The 7-step checklist

| Step | File | What you add |
|------|------|-------------|
| 1 | `src/domain/models.ts` | The response type |
| 2 | `src/application/services/fruit-service.ts` | The service class |
| 3 | `src/application/handlers/registry/fruit.ts` | Tool schemas + name type |
| 4 | `src/application/handlers/registry/index.ts` | Merge into `tools` / `ToolName` |
| 5 | `src/application/handlers/modules/fruit-handler.ts` | Executor + `isFruitTool` guard |
| 6 | `src/container.ts` | Wire the service |
| 7 | `src/application/handlers/tool-handler.ts` | Add dependency + route to the executor |

---

## Step 1 — Domain model

Pure readonly interface in `src/domain/models.ts`. No imports from other layers.

```ts
export interface Fruit {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly season: string;
}
```

---

## Step 2 — Service

Inject `HttpClient` via the constructor (never instantiate it inside the service) and return domain models.

```ts
// src/application/services/fruit-service.ts
import type { Fruit } from "../../domain/models.js";
import type { HttpClient } from "../../infrastructure/http/api-client.js";
import { logger } from "../../libraries/logger.js";

export class FruitService {
  constructor(private readonly http: HttpClient) {}

  async getFruit(id: string): Promise<Fruit> {
    logger.info(`Fetching fruit ${id}`);
    return this.http.get<Fruit>(`/fruits/${id}`);
  }

  async listFruits(): Promise<Fruit[]> {
    return this.http.get<Fruit[]>("/fruits");
  }
}
```

> `HttpClient.get(endpoint)` takes no per-call headers. Default headers (e.g. `X-API-Key`) are set once in the container. If an endpoint needs a per-user `Authorization` header, extend `HttpClient.get`/`request` to accept headers first, then pass the token from `authService.requireAuth()`.

---

## Step 3 — Registry file

```ts
// src/application/handlers/registry/fruit.ts
import type { ToolDefinition } from "./types.js";

export const fruitTools: ToolDefinition[] = [
  {
    name: "get_fruit",
    description: "Fetch a single fruit by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Fruit ID" } },
      required: ["id"],
    },
  },
  {
    name: "list_fruits",
    description: "List all available fruits.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export type FruitToolName = "get_fruit" | "list_fruits";
```

## Step 4 — Merge into the registry

```ts
// src/application/handlers/registry/index.ts
import { fruitTools, type FruitToolName } from "./fruit.js";

export const tools: ToolDefinition[] = [
  ...authTools,
  ...greetingTools,
  ...fruitTools,
  ...utilityTools,
];

export type ToolName = AuthToolName | GreetingToolName | FruitToolName | UtilityToolName;
```

---

## Step 5 — Executor

```ts
// src/application/handlers/modules/fruit-handler.ts
import type { FruitService } from "../../services/fruit-service.js";
import { ValidationError } from "../../../libraries/errors.js";
import type { FruitToolName } from "../registry/fruit.js";

export interface FruitHandlerDeps {
  fruitService: FruitService;
}

const FRUIT_TOOL_NAMES = new Set<FruitToolName>(["get_fruit", "list_fruits"]);

export function isFruitTool(name: string): name is FruitToolName {
  return FRUIT_TOOL_NAMES.has(name as FruitToolName);
}

export async function executeFruitTool(
  name: FruitToolName,
  args: Record<string, unknown>,
  deps: FruitHandlerDeps,
): Promise<unknown> {
  switch (name) {
    case "get_fruit": {
      const id = args.id;
      if (typeof id !== "string" || id.trim().length === 0) {
        throw new ValidationError("'id' must be a non-empty string");
      }
      const f = await deps.fruitService.getFruit(id.trim());
      return { id: f.id, name: f.name, color: f.color, season: f.season };
    }
    case "list_fruits": {
      const fruits = await deps.fruitService.listFruits();
      return fruits.map((f) => ({ id: f.id, name: f.name, color: f.color, season: f.season }));
    }
  }
}
```

Returning a plain value is enough — `ToolHandler` JSON-stringifies it into the `CallToolResult`.

---

## Step 6 — Container

```ts
// src/container.ts
import { FruitService } from "./application/services/fruit-service.js";

export interface Container {
  // ... existing fields ...
  fruitService: FruitService;
}

export function createContainer(): Container {
  // ... existing wiring ...
  const fruitService = new FruitService(http);

  const toolHandler = new ToolHandler({ authService, greetingService, fruitService, config });

  return { /* ... */ fruitService, toolHandler };
}
```

## Step 7 — Dispatcher

```ts
// src/application/handlers/tool-handler.ts
import { isFruitTool, executeFruitTool } from "./modules/fruit-handler.js";

export interface ToolHandlerDependencies {
  authService: AuthService;
  greetingService: GreetingService;
  fruitService: FruitService;   // <-- add
  config: AppConfig;
}

// inside executeCommand():
if (isFruitTool(name)) {
  return executeFruitTool(name, args, { fruitService: this.deps.fruitService });
}
```

Tools reaching `executeCommand` through the generic path are **already behind the auth gate** (the session check runs before it). So `fruit` tools require login by default.

To make them usable without a session, add their names to a `...RequiringNoAuth` list like `utilityToolsRequiringNoAuth` and check it alongside `NO_AUTH_TOOLS` in `ToolHandler.handle`.

If auth fails, the caller receives:
```json
{ "authenticated": false, "message": "You need to login before using this tool. Do you want to login now?", "next_step": "Just say the word and I will call the 'login' tool for you." }
```

Services that call protected upstream endpoints can additionally call `authService.requireAuth()`, which throws `AuthError` (`AUTH_ERROR`, 401) when no session exists.

---

## Tests

Add a `describe("ToolHandler — fruit")` block in `tests/tool-handler.test.ts`, mocking `FruitService` methods with `vi.fn()` and logging in first (or mocking `authService.isAuthenticated`).

---

## File summary

```
src/
├── domain/models.ts                          ← add Fruit
├── application/
│   ├── services/fruit-service.ts             ← new
│   └── handlers/
│       ├── registry/fruit.ts                 ← new
│       ├── registry/index.ts                 ← merge fruitTools + FruitToolName
│       ├── modules/fruit-handler.ts          ← new
│       └── tool-handler.ts                   ← dependency + route
└── container.ts                              ← instantiate FruitService
```

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Tool name | `snake_case` | `get_fruit` |
| Service file | `<domain>-service.ts` | `fruit-service.ts` |
| Registry file | `registry/<module>.ts` | `registry/fruit.ts` |
| Executor file | `modules/<module>-handler.ts` | `modules/fruit-handler.ts` |
| Tool group const | `<module>Tools` | `fruitTools` |
| Name type / guard | `<Module>ToolName` / `is<Module>Tool` | `FruitToolName`, `isFruitTool` |
| Domain model | `PascalCase` interface | `Fruit` |
