/**
 * FileSystem - File operation interface
 *
 * Standard file system operations, similar to Node.js fs module.
 * This is a Resource layer component - atomic, replaceable.
 *
 * ## Architecture Decision Record (ADR)
 *
 * ### Context
 *
 * Agent needs file operations. The interface is stable (fs API hasn't changed in decades).
 * No need for generics - operations are fixed.
 *
 * ### Decision
 *
 * Define standard fs-like interface. Implementations can be:
 * - LocalFileSystem (node:fs)
 * - R2FileSystem (Cloudflare R2)
 * - MemoryFileSystem (in-memory for testing)
 *
 * ### Status
 *
 * **Accepted** - 2024-11-30
 */

/**
 * File stats
 */
export interface FileStats {
  isFile(): boolean;
  isDirectory(): boolean;
  size: number;
  mtime: Date;
}

/**
 * FileSystem - Standard file operation interface
 */
export interface FileSystem {
  readFile(path: string): Promise<string>;
  readFile(path: string, encoding: "utf-8"): Promise<string>;
  readFile(path: string, encoding: null): Promise<Uint8Array>;

  writeFile(path: string, content: string | Uint8Array): Promise<void>;

  readdir(path: string): Promise<string[]>;

  stat(path: string): Promise<FileStats>;

  exists(path: string): Promise<boolean>;

  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;

  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;

  rename(oldPath: string, newPath: string): Promise<void>;

  copyFile(src: string, dest: string): Promise<void>;
}
