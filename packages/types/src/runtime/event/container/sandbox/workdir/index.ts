/**
 * Sandbox Workdir Events
 *
 * Events for file system operations in the agent's working directory.
 */

import type { RuntimeEvent } from "~/runtime/event/RuntimeEvent";

/**
 * Base WorkdirEvent
 */
export interface WorkdirEvent<T extends string = string, D = unknown> extends RuntimeEvent<T, D> {
  source: "sandbox";
  category: "workdir";
}

// ============================================================================
// File Read Events
// ============================================================================

/**
 * FileReadRequest - Request to read a file
 */
export interface FileReadRequest extends WorkdirEvent<"file_read_request"> {
  intent: "request";
  data: {
    path: string;
    encoding?: string;
  };
}

/**
 * FileReadResult - File read result
 */
export interface FileReadResult extends WorkdirEvent<"file_read_result"> {
  intent: "result";
  data: {
    path: string;
    content: string;
    size: number;
    encoding: string;
  };
}

// ============================================================================
// File Write Events
// ============================================================================

/**
 * FileWriteRequest - Request to write a file
 */
export interface FileWriteRequest extends WorkdirEvent<"file_write_request"> {
  intent: "request";
  data: {
    path: string;
    content: string;
    encoding?: string;
    createDirectories?: boolean;
  };
}

/**
 * FileWrittenEvent - File was written
 */
export interface FileWrittenEvent extends WorkdirEvent<"file_written"> {
  intent: "result";
  data: {
    path: string;
    size: number;
    timestamp: number;
  };
}

// ============================================================================
// File Delete Events
// ============================================================================

/**
 * FileDeleteRequest - Request to delete a file
 */
export interface FileDeleteRequest extends WorkdirEvent<"file_delete_request"> {
  intent: "request";
  data: {
    path: string;
    recursive?: boolean;
  };
}

/**
 * FileDeletedEvent - File was deleted
 */
export interface FileDeletedEvent extends WorkdirEvent<"file_deleted"> {
  intent: "result";
  data: {
    path: string;
    timestamp: number;
  };
}

// ============================================================================
// Directory Events
// ============================================================================

/**
 * DirectoryListRequest - Request to list directory
 */
export interface DirectoryListRequest extends WorkdirEvent<"directory_list_request"> {
  intent: "request";
  data: {
    path: string;
    recursive?: boolean;
    pattern?: string;
  };
}

/**
 * DirectoryListResult - Directory listing result
 */
export interface DirectoryListResult extends WorkdirEvent<"directory_list_result"> {
  intent: "result";
  data: {
    path: string;
    entries: Array<{
      name: string;
      type: "file" | "directory";
      size?: number;
      modifiedAt?: number;
    }>;
  };
}

// ============================================================================
// Error Event
// ============================================================================

/**
 * WorkdirErrorEvent - Workdir operation error
 */
export interface WorkdirErrorEvent extends WorkdirEvent<"workdir_error"> {
  intent: "notification";
  data: {
    operation: string;
    path: string;
    code: string;
    message: string;
  };
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * AllWorkdirEvent - All workdir events
 */
export type AllWorkdirEvent =
  | FileReadRequest
  | FileReadResult
  | FileWriteRequest
  | FileWrittenEvent
  | FileDeleteRequest
  | FileDeletedEvent
  | DirectoryListRequest
  | DirectoryListResult
  | WorkdirErrorEvent;

/**
 * Workdir request events
 */
export type WorkdirRequestEvent =
  | FileReadRequest
  | FileWriteRequest
  | FileDeleteRequest
  | DirectoryListRequest;

/**
 * Workdir result events
 */
export type WorkdirResultEvent =
  | FileReadResult
  | FileWrittenEvent
  | FileDeletedEvent
  | DirectoryListResult;
