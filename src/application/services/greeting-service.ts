/**
 * GreetingService — calls the API and returns a Greeting domain object.
 *
 * This mirrors the fabricbloc-mcp service pattern:
 *   tool_handler → GreetingService → HttpClient → API → domain model
 */

import type { Greeting } from "../../domain/models.js";
import type { HttpClient } from "../../infrastructure/http/api-client.js";
import { logger } from "../../libraries/logger.js";

export class GreetingService {
  constructor(private readonly http: HttpClient) {}

  /**
   * GET /greet → { status: "success", data: { message: "Namaste!", source: "/greet" } }
   * HttpClient unwraps the envelope and returns the data object directly.
   */
  async greet(): Promise<Greeting> {
    logger.info("Calling GET /greet");
    // return this.http.get<Greeting>("/greet");

    // Mock api call
    return new Promise((resolve) => {
      resolve({
        "message": "Namaste!",
        "source": "",
      })
    })
  }
}
