# Architecture

## Full Folder Structure

```
typescript-mcp-template/
├── src/                                  ← TypeScript source (compiled to dist/)
│   ├── application/
│   │   ├── handlers/
│   │   │   ├── registry/                 ← Tool schemas (the AI-visible contract), one file per module
│   │   │   │   ├── index.ts              ← Merges module tools into `tools` + `ToolName` union
│   │   │   │   ├── types.ts              ← Shared ToolDefinition type
│   │   │   │   ├── auth.ts               ← authTools: login, logout, auth_status
│   │   │   │   ├── greeting.ts           ← greetingTools: greet
│   │   │   │   └── utility.ts            ← utilityTools: echo, ping (+ utilityToolsRequiringNoAuth)
│   │   │   ├── modules/                  ← Tool executors, one file per module
│   │   │   │   ├── auth-handler.ts       ← isAuthTool + executeAuthTool
│   │   │   │   ├── greeting-handler.ts   ← isGreetingTool + executeGreetingTool
│   │   │   │   └── utility-handler.ts    ← isUtilityTool + executeUtilityTool
│   │   │   ├── tool-registry.ts          ← Re-exports registry for index.ts
│   │   │   └── tool-handler.ts           ← Thin dispatcher: auth gate + routes to module executors
│   │   └── services/
│   │       ├── auth-service.ts           ← Session lifecycle (login / logout / requireAuth)
│   │       └── greeting-service.ts       ← Calls HttpClient, returns domain models
│   ├── domain/
│   │   └── models.ts                     ← Pure readonly interfaces, no dependencies
│   ├── infrastructure/
│   │   ├── auth/
│   │   │   └── session-store.ts          ← In-memory credential store (write-only to the LLM)
│   │   └── http/
│   │       └── api-client.ts             ← native fetch — no axios/got/node-fetch
│   ├── libraries/
│   │   ├── config.ts                     ← AppConfig from process.env, singleton
│   │   ├── errors.ts                     ← AppError hierarchy with code + statusCode
│   │   └── logger.ts                     ← stderr-only (console.error)
│   ├── container.ts                      ← DI wiring — all in one place
│   └── index.ts                          ← MCP server entry point
│
├── dist/                                 ← Compiled JS output (tsc → NodeNext ESM)
│   └── index.js                          ← What Claude Code runs
│
├── tests/
│   ├── greeting-service.test.ts          ← Service unit test with mocked HttpClient
│   └── tool-handler.test.ts              ← Handler tests
│
├── docs/
│   ├── architecture.md                   ← This file
│   ├── getting-started.md                ← npm install, build, Claude .mcp.json
│   └── adding-new-api-service.md         ← Walkthrough: add a service + tools
│
├── package.json                          ← deps (@modelcontextprotocol/sdk only at runtime)
├── tsconfig.json                         ← module:NodeNext, strict, outDir:dist
├── vitest.config.ts                      ← test environment: node
├── Makefile                              ← install/build/test/run/docker-build shortcuts
├── Dockerfile
├── .mcp.json.example
└── README.md
```

## Layer Rules

```
┌─────────────────────────────────────────────┐
│  MCP Protocol (index.ts + @mcp/sdk)         │  ← ListTools / CallTool requests
└─────────────────────┬───────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────┐
│  Application                                 │  ← auth gate, module executors, services
│  (tool-handler, modules/, services/)         │
└─────────────────────┬───────────────────────┘
                      │ returns
┌─────────────────────▼───────────────────────┐
│  Domain (models.ts)                          │  ← readonly interfaces, zero imports
└─────────────────────┬───────────────────────┘
                      │ infrastructure used by services
┌─────────────────────▼───────────────────────┐
│  Infrastructure                              │  ← I/O: native fetch, session store
│  (http/api-client.ts, auth/)                 │
└─────────────────────┬───────────────────────┘
                      │ reads from
┌─────────────────────▼───────────────────────┐
│  libraries (config, errors, logger)          │  ← used by ALL layers
└─────────────────────────────────────────────┘
```

**Allowed import directions:**
`index.ts → application → domain`
`index.ts → application → infrastructure`
`all → libraries`
`domain → nothing`

## Tool Modules

Tools are grouped into **modules**. Each module has two files:

| Part | File | Exports |
|------|------|---------|
| Registry | `handlers/registry/<module>.ts` | `<module>Tools: ToolDefinition[]`, `<Module>ToolName` union |
| Executor | `handlers/modules/<module>-handler.ts` | `<Module>HandlerDeps`, `is<Module>Tool(name)` type guard, `execute<Module>Tool(name, args, deps)` |

`ToolHandler` ([tool-handler.ts](../src/application/handlers/tool-handler.ts)) is a thin dispatcher with this order:

1. `isAuthTool(name)` → run it (always allowed)
2. name in `utilityToolsRequiringNoAuth` → run it (no session needed)
3. otherwise, if `!authService.isAuthenticated()` → return the "please login" prompt
4. `executeCommand` routes to `executeGreetingTool` / `executeUtilityTool`, or throws `AppError("Unknown tool", "UNKNOWN_TOOL", 400)`

| Module | Tools | Auth required? |
|--------|-------|----------------|
| auth | `login`, `logout`, `auth_status` | No |
| utility | `echo`, `ping` | No |
| greeting | `greet` | **Yes** |

Executors use `switch (name)` over the module's `ToolName` union, so the compiler flags unhandled tools.

## Dependency Wiring

`createContainer()` builds: config → `HttpClient` → `SessionStore` → `AuthService` / `GreetingService` → `new ToolHandler({ authService, greetingService, config })`. `getContainer()` is a lazy singleton; `resetContainer()` clears it and the config cache.

## Authentication

- `AuthService.login()` is a **mock** that issues a fake token (1-hour expiry). The real HTTP call is left commented in `login()` / `logout()` — replace only those bodies.
- The token lives in `SessionStore` and never reaches the LLM; `login` returns only `authenticated` and `expires_at`.
- The auth gate is in `ToolHandler`. Services calling protected endpoints can also call `authService.requireAuth()` to obtain the token for headers (throws `AuthError`, 401).

## API Call Flow (greet tool)

```
Claude calls "greet"
  → server.setRequestHandler(CallToolRequestSchema)
  → container.toolHandler.handle("greet", {})
  → not auth / not no-auth tool → authService.isAuthenticated()?  no → return login prompt
  → executeCommand → isGreetingTool → executeGreetingTool("greet", args, deps)
  → greetingService.greet()
  → httpClient.get<Greeting>("/greet")
  → fetch("https://api.example.com/greet")
  → API: { status: "success", data: { message: "Namaste!", source: "/greet" } }
  → HttpClient unwraps envelope → Greeting object
  → { message, source } → JSON.stringify → CallToolResult.content[0].text
  → Claude receives the result
```

Errors: any thrown value goes through `toAppError()` and is returned as `{ content: [...formatErrorResponse], isError: true }`.

## Key TypeScript Decisions

| Decision | Why |
|----------|-----|
| Per-module registry + executor files | Adding a tool group touches its own files; the dispatcher stays small |
| `ToolName` unions + `is*Tool` type guards | Narrowing makes executor `switch`es exhaustive |
| Auth gate in the dispatcher | One place decides which tools need a session |
| `"module": "NodeNext"` | Native ESM, matches Node.js resolution algorithm |
| `.js` extension in imports | Required for NodeNext ESM — TypeScript resolves to `.ts` |
| `readonly` on domain interfaces | Prevents accidental mutation of value objects |
| Native `fetch` + `AbortController` | Zero deps; available in Node 18+ |
| `console.error()` for logging | stdout belongs to the MCP stdio transport |
| `vitest` for tests | Fast, ESM-native, vi.fn() mocking built-in |

## Adding a New Tool

**New tool in an existing module**
1. Add the definition to `registry/<module>.ts` and extend its `<Module>ToolName` union.
2. Add the name to the module's name set and a `case` in `modules/<module>-handler.ts`.
3. If it needs no session, also add it to `utilityToolsRequiringNoAuth` (utility module).

**New module** (e.g. `fruit`) — see [adding-new-api-service.md](adding-new-api-service.md) for code.
1. **Domain** — `interface` in `domain/models.ts` if needed.
2. **Service** — `application/services/fruit-service.ts`, inject `HttpClient`.
3. **Registry** — `registry/fruit.ts`; spread into `tools` and add to `ToolName` in `registry/index.ts`.
4. **Executor** — `modules/fruit-handler.ts` with `isFruitTool` + `executeFruitTool`.
5. **Container** — instantiate the service, add it to `Container` and to `ToolHandlerDependencies`.
6. **Dispatcher** — add an `isFruitTool` branch in `ToolHandler.executeCommand`.
7. **Tests** — add a `describe` block in `tests/tool-handler.test.ts`.
