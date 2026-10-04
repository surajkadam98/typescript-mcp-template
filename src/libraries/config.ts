/**
 * Application configuration.
 * Reads from process.env — injected by the MCP host from the env block in .mcp.json.
 */

export interface AppConfig {
  server: {
    readonly name: string;
    readonly version: string;
  };
  api: {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly apiKey: string | undefined;
  };
}

function loadConfig(): AppConfig {
  return {
    server: {
      name: process.env.MCP_SERVER_NAME ?? "typescript-mcp-template",
      version: process.env.MCP_VERSION ?? "0.0.1",
    },
    api: {
      baseUrl: process.env.API_BASE_URL ?? "https://api.example.com",
      timeout: parseInt(process.env.API_TIMEOUT ?? "30000", 10),
      apiKey: process.env.API_KEY,
    },
  };
}

let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}
