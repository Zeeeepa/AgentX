/**
 * Storage Module - Persistence abstraction for AgentX
 *
 * ## Architecture
 *
 * ```
 * Repository (unified interface)
 * ├── Agent methods (save, find, delete)
 * ├── Session methods (save, find, delete)
 * └── Message methods (save, find, delete)
 *
 * Implementations:
 * ├── PrismaRepository (agentx-node) - SQLite/PostgreSQL
 * └── RemoteRepository (agentx) - HTTP API
 * ```
 *
 * ## Record Types (Storage Schema)
 *
 * Pure data types used by both Prisma schema and HTTP API:
 * - AgentRecord: Agent persistence data
 * - SessionRecord: Session persistence data
 * - MessageRecord: Message persistence data
 *
 * @packageDocumentation
 */

// Repository interface
export type { Repository } from "./Repository";

// Record types (storage schema)
export * from "./record";
