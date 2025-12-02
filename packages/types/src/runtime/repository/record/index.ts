/**
 * Storage Records - Pure data types for persistence
 *
 * These types define the storage schema used by both:
 * - SQLite schema (agentx-runtime)
 * - HTTP API contracts (agentx remote)
 *
 * Part of Docker-style layered architecture:
 * AgentFile/Code → register → Definition → MetaImage → Session → Agent
 */

export type { DefinitionRecord } from "./DefinitionRecord";
export type { ImageRecord, ImageType } from "./ImageRecord";
export type { SessionRecord } from "./SessionRecord";
export type { MessageRecord } from "./MessageRecord";

// Deprecated: Use ImageRecord instead
// export type { AgentRecord } from "./AgentRecord";
