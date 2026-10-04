#!/usr/bin/env node

/**
 * MCP Server entry point.
 *
 * Connects the MCP protocol layer to the application container.
 * All logging goes to stderr — stdout is reserved for the stdio transport.
 *
 * Architecture: Clean Architecture with DI
 * - Domain:          models.ts
 * - Application:     handlers/ + services/
 * - Infrastructure:  http/api-client.ts
 * - libraries:          config, errors, logger
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

import { getContainer } from "./container.js";
import { tools } from "./application/handlers/tool-registry.js";

const container = getContainer();

const server = new Server(
  {
    name: container.config.server.name,
    version: container.config.server.version,
  },
  {
    capabilities: { tools: {} },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    return container.toolHandler.handle(
      name,
      (args as Record<string, unknown>) ?? {},
    );
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `${container.config.server.name} v${container.config.server.version} ready`,
  );
  console.error(`API: ${container.config.api.baseUrl}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
