# typescript-mcp-template

Minimal TypeScript MCP server template — Clean Architecture, native fetch, zero extra runtime dependencies.

---

## Prerequisites

- **Claude Code** — installed and authenticated
- **Node.js 18+** — required for Option A (without Docker)
- **Docker** — required for Option B (with Docker)

---

## Setup

Choose one option. Both end with the same Start step below.

### Option A — Without Docker

**Step 1 — Install and build**

```bash
cd /path/to/typescript-mcp-template
npm install
npm run build   # compiles src/ → dist/index.js
npm test        # 11 tests — all mocked, no real API needed
```

**Step 2 — Register with Claude Code**

```bash
claude mcp add typescript-mcp-template -s project \
  -e MCP_SERVER_NAME=typescript-mcp-template \
  -e MCP_VERSION=0.0.1 \
  -e API_BASE_URL=https://api.example.com \
  -e API_TIMEOUT=50000 \
  -e API_KEY=your-key-here \
  -- node "$(pwd)/dist/index.js"
```

> Run this from the project folder after `npm run build`. `$(pwd)` fills in the real absolute path — don't paste a placeholder path, or the server fails to start (Claude shows "failed").

> The server name must come **before** the `-e` flags — `-e` accepts multiple values and would otherwise swallow the name.

> `-s project` saves to `.mcp.json`. Use `-s local` to keep it out of git, or `-s user` to register globally.

**Or via `.mcp.json`:**

```bash
cp .mcp.json.example .mcp.json
```

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
        "API_TIMEOUT": "50000",
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

> `dist/index.js` is relative to the project folder, where Claude Code runs project-scoped servers. Run `npm run build` first.

---

### Option B — With Docker

**Step 1 — Build the image**

```bash
make docker-build
```


**Step 2 — Register with Claude Code**

```bash
claude mcp add -s project \
  typescript-mcp-template -- docker run -i --rm \
  -e MCP_SERVER_NAME=typescript-mcp-template \
  -e MCP_VERSION=0.0.1 \
  -e API_BASE_URL=https://api.example.com \
  -e API_TIMEOUT=50000 \
  -e API_KEY=your-key-here \
  typescript-mcp-template:latest
```

> `-i` keeps stdin open — required for stdio transport. `--rm` removes the container when the session ends.

**Or via `.mcp.json`:**

```json
{
  "mcpServers": {
    "ts-mcp-template": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "MCP_SERVER_NAME=typescript-mcp-template",
        "-e", "MCP_VERSION=0.0.1",
        "-e", "API_BASE_URL=https://api.example.com",
        "-e", "API_TIMEOUT=50000",
        "-e", "API_KEY=your-key-here",
        "typescript-mcp-template:latest"
      ]
    }
  }
}
```

> `.mcp.json` is committed and shared with the team. Keep secrets out of git — add `.mcp.json` to `.gitignore` if API keys differ per developer.

---

## Start

```bash
claude
```

Claude Code reads the registered server automatically on startup. You'll see:

```
MCP server "typescript-mcp-template" connected
```

Run `/mcp` inside Claude Code if the server doesn't appear.

## Try the Tools

```
greet me
```
```
echo "hello world"
```
```
ping
```

---

## Managing the Server

```bash
# List all registered MCP servers
claude mcp list

# Check server details and health
claude mcp get typescript-mcp-template

# Remove the server (only works if registered via `claude mcp add`)
claude mcp remove typescript-mcp-template

# If registered via .mcp.json, remove the entry from the file instead
rm .mcp.json
```

---

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `dist/index.js not found` / server "failed" | Run `npm run build` first, and make sure the path in `.mcp.json` / `claude mcp add` is real, not the `/absolute/path/to/...` placeholder (non-Docker only) |
| Server not connected | Run `/mcp` in Claude Code to see the error |
| Wrong API responses | Check `API_BASE_URL` and `API_KEY` in env or `.mcp.json` |
| Module errors | Run `npm install` — node_modules may be missing |
| Docker: server hangs | Ensure `-i` flag is present in `docker run` args |
| Docker: env vars missing | Pass each var with `-e KEY` (forwards from shell) or `-e KEY=value` |

---

## API Call Flow (greet tool)

```
Claude calls "greet"
  → ToolHandler.handle("greet", {})
  → dispatch["greet"] → handleGreet()
  → GreetingService.greet()
  → HttpClient.get<Greeting>("/greet")
  → fetch("https://api.example.com/greet")
  → { status:"success", data:{ message:"Namaste!", source:"/greet" } }
  → HttpClient unwraps envelope → Greeting object
  → { message:"Namaste!", source:"/greet" } → TextContent → Claude
```

---

## Tools

| Tool | Description |
|------|-------------|
| `greet` | Calls `GET /greet` — full API call flow demo |
| `echo` | Echoes back the message |
| `ping` | Returns server name, version, API URL |

---

## Dependencies

**Runtime:** `@modelcontextprotocol/sdk` only.
**Dev:** `typescript`, `vitest`, `tsx`, `@types/node`.
No axios, got, node-fetch, pino, winston, or any other extras.

---

## Docs

| File | Contents |
|------|---------|
| `docs/architecture.md` | Folder tree, layer rules, request flow, how to add a tool |
| `docs/getting-started.md` | Install, build, run, .mcp.json, ESM notes |
| `docs/adding-new-api-service.md` | Step-by-step: add a new API service and its tools |
