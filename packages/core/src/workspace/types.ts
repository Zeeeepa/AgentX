/**
 * Workspace Types
 *
 * Workspace is an abstraction for isolated working environments.
 * Different platforms provide different implementations:
 * - Node.js: File system based (local directories)
 * - Cloudflare: R2/KV based (cloud storage)
 * - Browser: IndexedDB/Memory based
 *
 * Architecture:
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │                     core/workspace                       │
 * │  ┌─────────────────────────────────────────────────────┐│
 * │  │  Workspace (interface)                              ││
 * │  │  WorkspaceProvider (interface)                      ││
 * │  └─────────────────────────────────────────────────────┘│
 * └─────────────────────────────────────────────────────────┘
 *                           │
 *          ┌────────────────┼────────────────┐
 *          ▼                ▼                ▼
 *   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 *   │ platform-node│ │platform-cf   │ │platform-web  │
 *   │ FileWorkspace│ │ R2Workspace  │ │ IDBWorkspace │
 *   └──────────────┘ └──────────────┘ └──────────────┘
 * ```
 */

// ============================================================================
// Workspace Interface
// ============================================================================

/**
 * Workspace - Isolated working environment for an Agent
 *
 * Provides a location abstraction for Agent file operations.
 * The actual storage mechanism depends on platform implementation.
 */
export interface Workspace {
  /**
   * Unique workspace identifier
   */
  readonly id: string;

  /**
   * Human-readable workspace name
   */
  readonly name: string;

  /**
   * Workspace path or URI
   *
   * Platform-specific:
   * - Node.js: Absolute file path (e.g., ~/.agentx/workspaces/xxx/)
   * - Cloudflare: R2 bucket prefix (e.g., workspaces/xxx/)
   * - Browser: IndexedDB store name
   */
  readonly path: string;

  /**
   * Initialize workspace (create if not exists)
   */
  initialize(): Promise<void>;

  /**
   * Check if workspace exists
   */
  exists(): Promise<boolean>;

  /**
   * Clean up workspace (optional, for temporary workspaces)
   */
  cleanup?(): Promise<void>;
}

// ============================================================================
// Workspace Provider Interface
// ============================================================================

/**
 * Configuration for creating a workspace
 */
export interface WorkspaceCreateConfig {
  /**
   * Associated container ID
   */
  containerId: string;

  /**
   * Associated image ID
   */
  imageId: string;

  /**
   * Optional custom workspace name
   */
  name?: string;
}

/**
 * WorkspaceProvider - Factory for creating workspaces
 *
 * Platform implementations provide this interface to create
 * platform-specific workspaces.
 */
export interface WorkspaceProvider {
  /**
   * Provider name (e.g., "file", "r2", "indexeddb")
   */
  readonly type: string;

  /**
   * Create a new workspace
   */
  create(config: WorkspaceCreateConfig): Promise<Workspace>;

  /**
   * Get an existing workspace by ID
   */
  get(workspaceId: string): Promise<Workspace | null>;

  /**
   * List all workspaces for a container
   */
  listByContainer(containerId: string): Promise<Workspace[]>;

  /**
   * Delete a workspace
   */
  delete(workspaceId: string): Promise<void>;
}
