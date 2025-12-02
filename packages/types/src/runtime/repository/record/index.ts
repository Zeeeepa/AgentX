/**
 * Storage Records - Pure data types for persistence
 *
 * These types define the storage schema used by both:
 * - SQLite schema (agentx-runtime)
 * - HTTP API contracts (agentx remote)
 *
 * Part of Docker-style layered architecture:
 * Container → Definition → Image → Session → Agent
 */

export type { ContainerRecord, ContainerConfig } from "./ContainerRecord";
export type { DefinitionRecord } from "./DefinitionRecord";
export type { ImageRecord, ImageType } from "./ImageRecord";
export type { SessionRecord } from "./SessionRecord";
export type { MessageRecord } from "./MessageRecord";
