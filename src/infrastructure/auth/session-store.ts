/**
 * In-memory session store — one active credential per process lifetime.
 *
 * The token is write-only from the LLM's perspective: it is stored here,
 * used to build request headers, and never returned to the tool caller.
 *
 * PRODUCTION: swap the storage backend (vault, OS keychain, encrypted file)
 * without touching the rest of the auth flow — this class is the only
 * place that knows where credentials live.
 */
export class SessionStore {
  private token: string | null = null;

  set(token: string): void {
    this.token = token;
  }

  get(): string | null {
    return this.token;
  }

  clear(): void {
    this.token = null;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}
