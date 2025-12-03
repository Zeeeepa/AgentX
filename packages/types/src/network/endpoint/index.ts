/**
 * Network Endpoints - HTTP API contracts
 *
 * Only static resources use HTTP:
 * - Definition (blueprint)
 * - Image (artifact)
 * - Platform (health, info)
 *
 * Runtime resources (Agent, Session) use WebSocket events.
 */

export type { HttpMethod, Endpoint } from "./Endpoint";
export * from "./DefinitionEndpoint";
export * from "./ImageEndpoint";
export * from "./PlatformEndpoint";
