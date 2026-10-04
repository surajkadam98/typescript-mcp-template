/**
 * HTTP client — native fetch only, zero external dependencies.
 *
 * Handles:
 * - Request construction with default + per-call headers
 * - Standard envelope unwrapping: { status: "success", data: T }
 * - Timeout via AbortController
 * - Error mapping to ApiError domain exception
 */

import { ApiError } from "../../libraries/errors.js";
import { logger } from "../../libraries/logger.js";

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

interface SuccessEnvelope<T> {
  status: "success";
  data: T;
}

interface ErrorEnvelope {
  message?: string;
  detail?: string;
  code?: string;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout ?? 30000;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.defaultHeaders,
          ...(options.headers as Record<string, string>),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ErrorEnvelope;
        const message =
          body.message ?? body.detail ?? `HTTP ${response.status}`;
        logger.warn(`HTTP ${response.status} ${endpoint}: ${message}`);
        throw new ApiError(message, response.status, endpoint);
      }

      if (response.status === 204) return undefined as T;

      const json = await response.json();

      // Unwrap standard envelope: { status: "success", data: T }
      if (
        json &&
        typeof json === "object" &&
        json.status === "success" &&
        "data" in json
      ) {
        return (json as SuccessEnvelope<T>).data;
      }

      return json as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408, endpoint);
      }
      throw new ApiError(`Network error: ${String(error)}`, 503, endpoint);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}
