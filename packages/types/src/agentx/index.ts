/**
 * AgentX - User-facing API Types
 *
 * @packageDocumentation
 */

import type { Persistence } from "~/persistence";
import type { EnvironmentEvent } from "~/event";

// ============================================================================
// Event Types
// ============================================================================

/**
 * All possible event types from EnvironmentEvent
 */
export type AgentXEventType = EnvironmentEvent["type"];

/**
 * Extract specific event by type
 */
export type AgentXEvent<T extends AgentXEventType> = Extract<EnvironmentEvent, { type: T }>;

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * SourceConfig - Server-side configuration
 */
export interface SourceConfig {
  /**
   * Anthropic API key
   * @default process.env.ANTHROPIC_API_KEY
   */
  apiKey?: string;

  /**
   * Claude model to use
   * @default "claude-sonnet-4-20250514"
   */
  model?: string;

  /**
   * Anthropic API base URL (for proxies)
   * @default "https://api.anthropic.com"
   */
  baseUrl?: string;

  /**
   * Persistence layer for storing data
   * @default In-memory persistence
   */
  persistence?: Persistence;
}

/**
 * MirrorConfig - Browser-side configuration
 */
export interface MirrorConfig {
  /**
   * WebSocket URL of the AgentX server
   * @example "ws://localhost:5200"
   */
  serverUrl: string;

  /**
   * Authentication token (optional)
   */
  token?: string;

  /**
   * Additional headers for WebSocket connection
   */
  headers?: Record<string, string>;
}

/**
 * AgentXConfig - Union of Source and Mirror configurations
 */
export type AgentXConfig = SourceConfig | MirrorConfig;

/**
 * Type guard: is this a MirrorConfig?
 */
export declare function isMirrorConfig(config: AgentXConfig): config is MirrorConfig;

/**
 * Type guard: is this a SourceConfig?
 */
export declare function isSourceConfig(config: AgentXConfig): config is SourceConfig;

// ============================================================================
// Agent Definition & Config
// ============================================================================

/**
 * AgentDefinition - User-defined agent template
 */
export interface AgentDefinition {
  name: string;
  systemPrompt?: string;
  description?: string;
}

/**
 * AgentConfig - Runtime configuration for running an agent
 */
export interface AgentConfig {
  name: string;
  systemPrompt?: string;
  description?: string;
}

/**
 * defineAgent - Convert AgentDefinition to AgentConfig
 */
export declare function defineAgent(definition: AgentDefinition): AgentConfig;

// ============================================================================
// Unsubscribe
// ============================================================================

export type Unsubscribe = () => void;

// ============================================================================
// Container
// ============================================================================

/**
 * Container - Isolated environment for agents
 */
export interface Container {
  readonly id: string;
}

/**
 * ContainersAPI - Container management
 */
export interface ContainersAPI {
  create(): Promise<Container>;
  get(containerId: string): Container | undefined;
  list(): Container[];
}

// ============================================================================
// Agent
// ============================================================================

/**
 * Agent - Running AI agent instance
 *
 * Events are received via agentx.on(), not agent.on().
 * Use event.context.agentId to filter by agent.
 */
export interface Agent {
  readonly id: string;
  readonly containerId: string;

  receive(message: string): Promise<void>;
}

/**
 * AgentsAPI - Agent management
 */
export interface AgentsAPI {
  run(containerId: string, config: AgentConfig): Promise<Agent>;
  get(agentId: string): Agent | undefined;
  list(): Agent[];
  list(containerId: string): Agent[];
  destroy(agentId: string): Promise<boolean>;
}

// ============================================================================
// Image
// ============================================================================

/**
 * AgentImage - Snapshot of agent state
 */
export interface AgentImage {
  readonly id: string;
  readonly agentId: string;
  readonly containerId: string;
  readonly name: string;
  readonly createdAt: number;

  resume(): Promise<Agent>;
}

/**
 * ImagesAPI - Image management
 */
export interface ImagesAPI {
  snapshot(agentId: string): Promise<AgentImage>;
  get(imageId: string): Promise<AgentImage | null>;
  list(): Promise<AgentImage[]>;
  delete(imageId: string): Promise<void>;
}

// ============================================================================
// AgentX
// ============================================================================

/**
 * AgentX - Main user-facing API
 */
export interface AgentX {
  readonly containers: ContainersAPI;
  readonly agents: AgentsAPI;
  readonly images: ImagesAPI;

  on<T extends AgentXEventType>(
    type: T,
    handler: (event: AgentXEvent<T>) => void
  ): Unsubscribe;
  onAll(handler: (event: EnvironmentEvent) => void): Unsubscribe;

  dispose(): Promise<void>;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * createAgentX - Create AgentX instance
 */
export declare function createAgentX(): AgentX;
export declare function createAgentX(config: AgentXConfig): AgentX;
