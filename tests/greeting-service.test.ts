/**
 * GreetingService unit test.
 *
 * GreetingService currently returns a mock greeting (the real GET /greet call
 * is commented out in the service). Update this test when the real call is enabled.
 */

import { describe, it, expect } from "vitest";
import { GreetingService } from "../src/application/services/greeting-service.js";
import type { HttpClient } from "../src/infrastructure/http/api-client.js";

describe("GreetingService", () => {
  it("returns a Greeting", async () => {
    const service = new GreetingService({} as HttpClient);
    const result = await service.greet();

    expect(result.message).toBe("Namaste!");
    expect(result).toHaveProperty("source");
  });
});
