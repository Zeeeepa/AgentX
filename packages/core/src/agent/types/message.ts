/**
 * Message Types - Content Parts and Message Types
 *
 * This file defines:
 * - Content Parts: TextPart, ThinkingPart, ImagePart, FilePart, ToolCallPart, ToolResultPart
 * - Message Types: UserMessage, AssistantMessage, ToolResultMessage, ErrorMessage
 * - Message Role and Subtype discriminators
 *
 * @packageDocumentation
 */

// =============================================================================
// Content Parts
// =============================================================================

/**
 * Text Part
 *
 * Plain text content in a message.
 */
export interface TextPart {
  /** Content type discriminator */
  type: "text";

  /** The text content (supports Markdown) */
  text: string;
}

/**
 * Thinking Part
 *
 * AI's reasoning/thinking process (extended thinking).
 */
export interface ThinkingPart {
  /** Content type discriminator */
  type: "thinking";

  /** The reasoning text */
  reasoning: string;

  /** Tokens used for thinking (optional) */
  tokenCount?: number;
}

/**
 * Image Part
 *
 * Image content in a message.
 */
export interface ImagePart {
  /** Content type discriminator */
  type: "image";

  /** Image data (base64-encoded string or URL) */
  data: string;

  /** Image MIME type */
  mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";

  /** Optional image name/filename */
  name?: string;
}

/**
 * File Part
 *
 * File attachment in a message (PDF, documents, etc.).
 */
export interface FilePart {
  /** Content type discriminator */
  type: "file";

  /** File data (base64-encoded string or URL) */
  data: string;

  /** File MIME type (IANA media type) */
  mediaType: string;

  /** Optional filename */
  filename?: string;
}

/**
 * Tool Call Part
 *
 * AI's request to invoke a tool.
 */
export interface ToolCallPart {
  /** Content type discriminator */
  type: "tool-call";

  /** Unique identifier for this tool call */
  id: string;

  /** Tool name */
  name: string;

  /** Tool input parameters */
  input: Record<string, unknown>;
}

/**
 * Tool Result Output
 *
 * Enhanced tool result format supporting multiple output types.
 * Based on Vercel AI SDK and industry best practices.
 */
export type ToolResultOutput =
  /**
   * Plain text result
   */
  | {
      type: "text";
      value: string;
    }

  /**
   * JSON result
   */
  | {
      type: "json";
      value: unknown;
    }

  /**
   * Text error
   */
  | {
      type: "error-text";
      value: string;
    }

  /**
   * JSON error
   */
  | {
      type: "error-json";
      value: unknown;
    }

  /**
   * User denied tool execution
   */
  | {
      type: "execution-denied";
      reason?: string;
    }

  /**
   * Rich content (multiple parts)
   */
  | {
      type: "content";
      value: Array<TextPart | ImagePart | FilePart>;
    };

/**
 * Tool Result Part
 *
 * Result of tool execution.
 */
export interface ToolResultPart {
  /** Content type discriminator */
  type: "tool-result";

  /** Tool call ID this result corresponds to */
  id: string;

  /** Tool name */
  name: string;

  /** Tool execution output */
  output: ToolResultOutput;
}

/**
 * Content Part
 *
 * Discriminated union of all content part types.
 * Used in messages to support multi-modal and complex content.
 */
export type ContentPart =
  | TextPart
  | ThinkingPart
  | ImagePart
  | FilePart
  | ToolCallPart
  | ToolResultPart;

/**
 * User Content Part
 *
 * Subset of ContentPart types that users can send in messages.
 * - TextPart: Plain text content
 * - ImagePart: Image attachments (JPEG, PNG, GIF, WebP)
 * - FilePart: File attachments (PDF, documents, etc.)
 */
export type UserContentPart = TextPart | ImagePart | FilePart;

// =============================================================================
// Message Types
// =============================================================================

/**
 * Message Role
 *
 * Represents who sent the message in the conversation.
 * Five fundamental roles in the conversation.
 */
export type MessageRole = "user" | "assistant" | "tool" | "system" | "error";

/**
 * Message Subtype
 *
 * Represents the specific type/category of the message.
 * Used together with role for serialization and type discrimination.
 */
export type MessageSubtype = "user" | "assistant" | "tool-result" | "error";

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
}

/**
 * User Message
 *
 * Message sent by the user.
 * Can contain simple text or rich content (text, images, files).
 */
export interface UserMessage {
  /** Unique identifier */
  id: string;

  /** Message role */
  role: "user";

  /** Message subtype for serialization */
  subtype: "user";

  /** Message content - can be simple string or array of parts */
  content: string | UserContentPart[];

  /** When this message was created (Unix timestamp in milliseconds) */
  timestamp: number;

  /** Parent message ID for threading (optional) */
  parentId?: string;
}

/**
 * Assistant Message
 *
 * Message generated by the AI assistant.
 * Contains text, thinking process, files, and tool calls.
 * Tool calls are content blocks within the assistant message,
 * matching the mainstream API pattern (Anthropic, OpenAI).
 */
export interface AssistantMessage {
  /** Unique identifier */
  id: string;

  /** Message role */
  role: "assistant";

  /** Message subtype for serialization */
  subtype: "assistant";

  /** Message content - can be simple string or array of parts (including tool calls) */
  content: string | Array<TextPart | ThinkingPart | FilePart | ToolCallPart>;

  /** When this message was created (Unix timestamp in milliseconds) */
  timestamp: number;

  /** Parent message ID for threading (optional) */
  parentId?: string;

  /** Token usage for this AI response (optional) */
  usage?: TokenUsage;
}

/**
 * Tool Result Message
 *
 * Represents the result of tool execution.
 * Emitted after tool execution completes.
 *
 * Subject: Tool (execution completed with result)
 * Timing: At tool_result event
 */
export interface ToolResultMessage {
  /** Unique message identifier */
  id: string;

  /** Message role - tool returns results */
  role: "tool";

  /** Message subtype for serialization */
  subtype: "tool-result";

  /** Tool result details */
  toolResult: ToolResultPart;

  /** ID of the corresponding tool call */
  toolCallId: string;

  /** When this message was created (Unix timestamp in milliseconds) */
  timestamp: number;
}

/**
 * Error Message
 *
 * Message representing an error that occurred during conversation.
 * Displayed in the chat history so users can see what went wrong.
 */
export interface ErrorMessage {
  /** Unique identifier */
  id: string;

  /** Message role */
  role: "error";

  /** Message subtype for serialization */
  subtype: "error";

  /** Error message content (human-readable) */
  content: string;

  /** Error code (e.g., "rate_limit_error", "api_error") */
  errorCode?: string;

  /** When this error occurred (Unix timestamp in milliseconds) */
  timestamp: number;

  /** Parent message ID for threading (optional) */
  parentId?: string;
}

/**
 * Message
 *
 * Discriminated union of all message types.
 * Use `subtype` field for precise type discrimination.
 *
 * Role: Who sent it (user, assistant, tool, system, error)
 * Subtype: What type of message (user, assistant, tool-result, error)
 */
export type Message =
  | UserMessage
  | AssistantMessage
  | ToolResultMessage
  | ErrorMessage;
