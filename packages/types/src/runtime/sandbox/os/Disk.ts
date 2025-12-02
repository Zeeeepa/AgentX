/**
 * Disk - Storage mount resource
 *
 * Provides a mountable storage location. Different implementations
 * can mount different storage backends to a local path.
 *
 * ## Architecture Decision Record (ADR)
 *
 * ### Context
 *
 * Agent needs storage space. The storage can be:
 * - Local directory
 * - Cloud storage (R2, S3)
 * - Memory (for testing)
 *
 * Claude SDK uses local paths (cwd), so we need a way to
 * mount any storage to a local path.
 *
 * ### Decision
 *
 * Disk provides mount/unmount interface:
 * - mount() → returns local path
 * - unmount() → cleanup
 *
 * Sandbox layer (NodeRuntime) uses Disk to get cwd.
 *
 * ### Usage
 *
 * ```typescript
 * const disk = new LocalDisk({ path: '/workspace' });
 * const mountPath = await disk.mount();  // "/workspace"
 *
 * // Use path for file operations or as cwd
 *
 * await disk.unmount();
 * ```
 *
 * ### Status
 *
 * **Accepted** - 2024-11-30
 */

/**
 * Disk - Storage mount resource
 */
export interface Disk {
  /**
   * Disk identifier
   */
  readonly name: string;

  /**
   * Mount the storage and return local path
   *
   * For local disk: returns the configured path
   * For R2/S3: mounts via FUSE or syncs to temp directory
   * For memory: creates tmpfs or memory-backed directory
   */
  mount(): Promise<string>;

  /**
   * Unmount and cleanup
   *
   * For local disk: may be no-op
   * For R2/S3: sync back and unmount
   * For memory: cleanup temp files
   */
  unmount(): Promise<void>;
}
