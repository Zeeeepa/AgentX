/**
 * Server Types
 */

/**
 * AgentX Server instance
 */
export interface AgentXServer {
  /**
   * Start listening (standalone mode only)
   */
  listen(port?: number, host?: string): Promise<void>;

  /**
   * Close server and cleanup
   */
  close(): Promise<void>;

  /**
   * Dispose all resources
   */
  dispose(): Promise<void>;
}
