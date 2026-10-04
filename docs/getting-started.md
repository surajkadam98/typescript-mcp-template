# Getting Started

## Prerequisites

- Node.js >=18.0.0 (native fetch required)
- npm

---

## Install

```bash
cd /path/to/typescript-mcp-template
npm install
```

---

## Build

```bash
npm run build
# or
make build
```

TypeScript compiles `src/` → `dist/` (NodeNext ESM `.js` files).

---

## Run Tests

```bash
npm test
# or
make test
```

---

## Run the Server

```bash
npm start
# or
make run   (builds first, then starts)
```

Startup logs appear on stderr:
```
typescript-mcp-template v0.0.1 ready
API: https://api.example.com
```

Then it waits for JSON-RPC messages on stdin. Connect via Claude Desktop or Claude Code.

---

## Development Mode (watch)

```bash
npm run dev
```

`tsx watch` re-runs on every `.ts` file change — no build step needed during development.

---

## Configure Claude Code (.mcp.json)

```json
{
  "mcpServers": {
    "ts-mcp-template": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "MCP_SERVER_NAME": "typescript-mcp-template",
        "MCP_VERSION": "0.0.1",
        "API_BASE_URL": "https://api.example.com",
        "API_TIMEOUT": "30000",
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

After saving, restart Claude Code. The server appears in the tool panel.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_BASE_URL` | `https://api.example.com` | Backend API base URL |
| `API_KEY` | — | Sent as `X-API-Key` header |
| `API_TIMEOUT` | `30000` | HTTP timeout in milliseconds |
| `MCP_SERVER_NAME` | `typescript-mcp-template` | Server name shown in Claude |
| `MCP_VERSION` | `0.0.1` | Server version reported in `ping` |

---

## Available Tools

| Tool | Auth | Description |
|------|------|-------------|
| `login` | No | Mock login — stores a session token in memory |
| `logout` | No | Clears the session |
| `auth_status` | No | Reports whether a session is active |
| `greet` | **Yes** | Calls `GET /greet` — prompts to log in first if needed |
| `echo` | No | Echoes back the message |
| `ping` | No | Returns server name, version, API URL |

---

## Add a New Tool

Tools are organised in modules (registry file + handler file). See
[architecture.md](architecture.md#adding-a-new-tool) for the checklist and
[adding-new-api-service.md](adding-new-api-service.md) for a full walkthrough.

---

## TypeScript ESM Notes

This project uses `"module": "NodeNext"`. That means:

- **Import paths use `.js` extension** even in `.ts` source files:
  ```typescript
  import { HttpClient } from "../../infrastructure/http/api-client.js"; // ✓
  import { HttpClient } from "../../infrastructure/http/client";     // ✗
  ```

- **Top-level `await`** works in `.ts` files (ES2022 target)

- **`tsx`** (dev mode) handles the `.ts` → runtime conversion without a build step
