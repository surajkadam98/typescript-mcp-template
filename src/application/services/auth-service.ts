/**
 * AuthService — manages the session lifecycle.
 *
 * The public interface (login / logout / requireAuth / isAuthenticated) is stable.
 * To wire in a real auth provider, replace only the body of login() and logout().
 *
 * Common replacements for login():
 *   - OAuth2 + PKCE:  browser flow → loopback redirect → redeem code → token
 *   - SSO / SAML:     redirect to IdP → callback → exchange assertion → token
 */

import type { AuthToken } from "../../domain/models.js";
import type { SessionStore } from "../../infrastructure/auth/session-store.js";
import { AuthError } from "../../libraries/errors.js";
import { logger } from "../../libraries/logger.js";

export class AuthService {
  constructor(private readonly sessionStore: SessionStore) {}

  async login(): Promise<AuthToken> {
    // REAL — uncomment when the auth endpoint is available:
    // const response = await this.http.post<AuthToken>("/auth/login");
    // this.sessionStore.set(response.token);
    // logger.info("Authenticated");
    // return response;

    // MOCK — mirrors the real API response shape so the rest of the code is production-ready
    const response: AuthToken = {
      token: `mock_token_${Date.now()}`,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    };
    this.sessionStore.set(response.token);
    logger.info("Authenticated (mock)");
    return response;
  }

  async logout(): Promise<void> {
    // REAL — uncomment when the auth endpoint is available:
    // await this.http.post("/auth/logout");

    this.sessionStore.clear();
    logger.info("Logged out");
  }

  requireAuth(): string {
    const token = this.sessionStore.get();
    if (!token) {
      throw new AuthError("Not authenticated. Call the 'login' tool first.");
    }
    return token;
  }

  isAuthenticated(): boolean {
    return this.sessionStore.isAuthenticated();
  }
}
