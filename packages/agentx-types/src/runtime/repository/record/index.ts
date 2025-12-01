/**
 * Storage Records - Pure data types for persistence
 *
 * These types define the storage schema used by both:
 * - Prisma schema (agentx-node)
 * - HTTP API contracts (agentx remote)
 */

export type { AgentRecord } from "./AgentRecord";
export type { SessionRecord } from "./SessionRecord";
export type { MessageRecord } from "./MessageRecord";
