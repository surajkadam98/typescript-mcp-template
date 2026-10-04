/**
 * Domain models — pure value types with no external dependencies.
 * Must not import from application, infrastructure, or libraries layers.
 */

export interface Greeting {
  readonly message: string;
  readonly source: string;
}

// Returned by POST /auth/login — stored in SessionStore, never sent to the LLM.
export interface AuthToken {
  readonly token: string;
  readonly expires_at: string; // ISO 8601
}

// The token is intentionally absent — never surface credentials in domain objects.
export interface Session {
  readonly isAuthenticated: boolean;
}
