/**
 * Persistence Module - Storage Abstraction Layer
 *
 * Provides unified storage interfaces for all AgentX data:
 * - DefinitionRepository: Agent definitions (Application layer)
 * - ImageRepository: Agent images (Application layer)
 * - ContainerRepository: Containers (Runtime layer)
 * - SessionRepository: Sessions (Runtime layer)
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      Repository                             │
 * │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
 * │  │  Definition  │ │    Image     │ │   Container/Session  │ │
 * │  │  Repository  │ │  Repository  │ │     Repository       │ │
 * │  └──────────────┘ └──────────────┘ └──────────────────────┘ │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌───────────────────┴───────────────────┐
 *          │                                       │
 *          ▼                                       ▼
 * ┌─────────────────────┐               ┌─────────────────────┐
 * │  SQLiteRepository   │               │  RemoteRepository   │
 * │  (node-runtime)     │               │  (browser)          │
 * └─────────────────────┘               └─────────────────────┘
 *        Server                                Browser
 * ```
 *
 * @packageDocumentation
 */

// Domain-specific repositories
export type { DefinitionRepository } from "./DefinitionRepository";
export type { ImageRepository } from "./ImageRepository";
export type { ContainerRepository } from "./ContainerRepository";
export type { SessionRepository } from "./SessionRepository";

// Unified repository interface (flat methods)
export type { Repository } from "./Repository";

// Persistence interface (domain-grouped access)
export type { Persistence } from "./Persistence";

// Record types (storage schema)
export * from "./record";
