/**
 * Session module - Session management
 *
 * - SessionManager: TypeScript API (agentx.sessions.*)
 * - SessionEndpoint: HTTP API contracts
 *
 * Storage abstraction handles local vs remote differences.
 */

export type { SessionManager } from "./SessionManager";

// Endpoint types
export type {
  ListSessionsResponse,
  CreateSessionEndpoint,
  GetSessionEndpoint,
  ListSessionsEndpoint,
  DestroySessionEndpoint,
} from "./SessionEndpoint";
