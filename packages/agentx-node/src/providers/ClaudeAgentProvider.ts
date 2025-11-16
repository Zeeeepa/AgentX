/**
 * ClaudeAgentProvider
 *
 * Adapts @anthropic-ai/claude-agent-sdk to AgentEvent standard.
 * This is the Node.js-specific implementation.
 *
 * Performance Optimization:
 * - Uses Claude SDK's Streaming Input Mode (prompt: AsyncIterable)
 * - Process starts once and stays alive for entire session
 * - First message: ~6-7s (process startup)
 * - Subsequent messages: ~1-2s (3-5x faster!)
 */

import { query, type SDKMessage, type Query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentProvider, AgentEventBus } from "@deepractice-ai/agentx-core";
import type { AgentEvent, UserMessageEvent, ErrorEvent, ToolUseEvent } from "@deepractice-ai/agentx-api";
import { AgentConfigError } from "@deepractice-ai/agentx-api";
import type { NodeAgentConfig } from "../config/NodeAgentConfig";
import { observableToAsyncIterable } from "../utils/observableToAsyncIterable";

/**
 * Pending tool use state during stream parsing
 */
interface PendingToolUse {
  id: string;
  name: string;
  inputJson: string; // Accumulated JSON string
}

export class ClaudeAgentProvider implements AgentProvider {
  readonly sessionId: string;
  providerSessionId: string | null = null; // Claude SDK's real session ID
  private abortController: AbortController;
  private config: NodeAgentConfig;
  private currentQuery: Query | null = null;
  private eventBus: AgentEventBus | null = null;

  constructor(config: NodeAgentConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.abortController = new AbortController();
  }

  /**
   * Connect to AgentEventBus and start Claude SDK in streaming mode
   *
   * This is called once when Agent is created.
   * Claude SDK process starts here and stays alive.
   */
  async connect(eventBus: AgentEventBus): Promise<void> {
    this.eventBus = eventBus;

    // Start Claude SDK in Streaming Input Mode (process starts ONCE)
    this.currentQuery = query({
      prompt: this.createMessageStream(eventBus) as any,  // Type mismatch between our Message and SDK's APIUserMessage
      options: {
        model: this.config.model,
        systemPrompt: this.config.systemPrompt,
        maxThinkingTokens: this.config.maxThinkingTokens,
        abortController: this.abortController,
        mcpServers: this.transformMcpConfig(this.config.mcp),
        includePartialMessages: true,
        // Resume with provider's session ID (SDK's real session ID)
        resume: this.providerSessionId || undefined,
        // Pass API credentials to Claude Code subprocess via env
        // Must include process.env to preserve PATH and other system variables
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: this.config.apiKey,
          ...(this.config.baseUrl ? { ANTHROPIC_BASE_URL: this.config.baseUrl } : {}),
        },
        // Capture stderr output for debugging
        stderr: (data: string) => {
          console.error('[ClaudeAgentProvider stderr]', data);
        },
      },
    });

    // Start listening to Claude SDK responses
    this.startListening();
  }

  /**
   * Create AsyncIterable message stream for Claude SDK
   * Converts AgentEventBus.outbound() → AsyncIterable<SDKUserMessage>
   */
  private async *createMessageStream(eventBus: AgentEventBus) {
    // Subscribe to outbound (UserMessageEvent) and convert to AsyncIterable
    const outbound$ = eventBus.outbound();
    for await (const userEvent of observableToAsyncIterable<UserMessageEvent>(outbound$)) {
      // Convert UserMessage.content to SDK format
      // UserMessage.content can be: string | Array<TextPart | ImagePart | FilePart>
      // SDK expects: { role: "user", content: string | APIContentBlock[] }
      const sdkContent = this.convertUserMessageContent(userEvent.message.content);

      // Convert to SDKUserMessage format
      // SDK expects: { type: "user", message: { role: "user", content: ... } }
      yield {
        type: 'user' as const,
        message: {
          role: 'user',
          content: sdkContent,
        },
        parent_tool_use_id: null,
        session_id: this.sessionId,
      };
    }
  }

  /**
   * Convert UserMessage content to Claude SDK format
   */
  private convertUserMessageContent(content: string | Array<any>): any {
    // If already a string, return as-is
    if (typeof content === 'string') {
      return content;
    }

    // If array, convert each part to SDK format
    return content.map((part) => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      } else if (part.type === 'image') {
        return {
          type: 'image',
          source: part.source,
        };
      } else if (part.type === 'file') {
        // Claude SDK might not support file parts directly
        // Convert to text representation
        return {
          type: 'text',
          text: `[File: ${part.name || 'unknown'}]`,
        };
      }
      return part;
    });
  }

  /**
   * Listen to Claude SDK responses and emit to AgentEventBus
   * This runs in the background for the lifetime of the provider
   */
  private async startListening(): Promise<void> {
    if (!this.currentQuery || !this.eventBus) {
      console.error('[ClaudeAgentProvider] Cannot start listening: query or eventBus is null');
      return;
    }

    // Track pending tool_use during stream parsing
    let pendingToolUse: PendingToolUse | null = null;

    try {
      for await (const sdkMessage of this.currentQuery) {
        // First, check for tool_use in stream_event
        if (sdkMessage.type === "stream_event") {
          const streamEvent = sdkMessage.event as any;

          // Detect tool_use start in content_block_start
          if (streamEvent.type === "content_block_start" &&
              streamEvent.content_block?.type === "tool_use") {
            pendingToolUse = {
              id: streamEvent.content_block.id,
              name: streamEvent.content_block.name,
              inputJson: '',
            };
          }

          // Accumulate tool input JSON in content_block_delta
          if (streamEvent.type === "content_block_delta" &&
              streamEvent.delta?.type === "input_json_delta" &&
              pendingToolUse) {
            pendingToolUse.inputJson += streamEvent.delta.partial_json;
          }

          // Tool input complete in content_block_stop - emit ToolUseEvent
          if (streamEvent.type === "content_block_stop" && pendingToolUse) {
            try {
              const toolUseEvent: ToolUseEvent = {
                type: "tool_use",
                uuid: this.generateId(),
                sessionId: this.sessionId,
                toolUse: {
                  id: pendingToolUse.id,
                  name: pendingToolUse.name,
                  input: JSON.parse(pendingToolUse.inputJson),
                },
                timestamp: Date.now(),
              };
              this.eventBus.emit(toolUseEvent);
            } catch (parseError) {
              console.error('[ClaudeAgentProvider] Failed to parse tool input JSON:', parseError);
            } finally {
              pendingToolUse = null;
            }
          }
        }

        // Transform and emit other agent events
        const agentEvent = this.transformToAgentEvent(sdkMessage);
        if (agentEvent) {
          // Capture provider session ID from system init event
          if (agentEvent.type === "system" && agentEvent.subtype === "init") {
            this.providerSessionId = agentEvent.sessionId;
          }

          // Emit to AgentEventBus (inbound)
          this.eventBus.emit(agentEvent);
        }
      }
    } catch (error) {
      console.error('[ClaudeAgentProvider] Error in startListening:', error);

      // Emit ErrorEvent to AgentEventBus
      if (this.eventBus) {
        const errorEvent: ErrorEvent = {
          type: "error",
          subtype: "llm",
          severity: "error",
          message: error instanceof Error ? error.message : String(error),
          code: "LLM_ERROR",
          details: error instanceof Error ? { stack: error.stack } : undefined,
          recoverable: true,
          uuid: this.generateId(),
          sessionId: this.sessionId,
          timestamp: Date.now(),
        };
        this.eventBus.emit(errorEvent);
      }
    } finally {
      this.currentQuery = null;
    }
  }

  validateConfig(config: unknown): void {
    const nodeConfig = config as NodeAgentConfig;

    if (!nodeConfig.apiKey) {
      throw new AgentConfigError("apiKey is required", "apiKey");
    }
    if (!nodeConfig.model) {
      throw new AgentConfigError("model is required", "model");
    }
  }

  abort(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async destroy(): Promise<void> {
    this.abort();
    this.currentQuery = null;
    this.eventBus = null;
  }

  /**
   * Transform Claude SDK message to AgentEvent
   * This is where the adaptation happens - from SDK format to our standard
   */
  private transformToAgentEvent(sdkMessage: SDKMessage): AgentEvent | null {
    const uuid =
      sdkMessage.uuid ?? `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();

    switch (sdkMessage.type) {
      case "user":
        return {
          type: "user",
          uuid,
          sessionId: this.sessionId,
          message: {
            id: uuid,
            role: "user",
            content: typeof sdkMessage.message === "string" ? sdkMessage.message : "",
            timestamp,
          },
          timestamp,
        };

      case "assistant":
        // Filter out tool_use from content since we emit ToolUseEvent separately
        const rawContent = (sdkMessage.message as any).content ?? [];
        const filteredContent = Array.isArray(rawContent)
          ? rawContent.filter((part: any) => part.type !== "tool_use")
          : rawContent;

        return {
          type: "assistant",
          uuid,
          sessionId: this.sessionId,
          message: {
            id: uuid,
            role: "assistant",
            content: filteredContent,
            timestamp,
          },
          timestamp,
        };

      case "stream_event":
        // Map SDK stream event to our format
        const streamEvent = sdkMessage.event;
        return {
          type: "stream_event",
          uuid,
          sessionId: this.sessionId,
          streamEventType: streamEvent.type as any, // TODO: proper type mapping
          delta: streamEvent.type === "content_block_delta" ? streamEvent.delta : undefined,
          index: streamEvent.type === "content_block_start" ? streamEvent.index : undefined,
          timestamp,
        };

      case "result":
        if (sdkMessage.subtype === "success") {
          // Success result - emit as ResultEvent
          return {
            type: "result",
            uuid,
            sessionId: this.sessionId,
            durationMs: sdkMessage.duration_ms,
            durationApiMs: sdkMessage.duration_api_ms,
            numTurns: sdkMessage.num_turns,
            result: (sdkMessage as any).result ?? "",
            totalCostUsd: sdkMessage.total_cost_usd,
            usage: {
              input: sdkMessage.usage.input_tokens,
              output: sdkMessage.usage.output_tokens,
              cacheWrite: sdkMessage.usage.cache_creation_input_tokens ?? 0,
              cacheRead: sdkMessage.usage.cache_read_input_tokens ?? 0,
            },
            timestamp,
          };
        } else {
          // Error result - convert to ErrorEvent
          const errorCode = sdkMessage.subtype === "error_max_turns" ? "MAX_TURNS" : "LLM_ERROR";
          const errorMessage = sdkMessage.subtype === "error_max_turns"
            ? `Maximum turns (${sdkMessage.num_turns}) exceeded`
            : `Claude SDK error: ${sdkMessage.subtype}`;

          const errorEvent: ErrorEvent = {
            type: "error",
            subtype: "llm",
            severity: "error",
            message: errorMessage,
            code: errorCode,
            details: {
              durationMs: sdkMessage.duration_ms,
              durationApiMs: sdkMessage.duration_api_ms,
              numTurns: sdkMessage.num_turns,
              totalCostUsd: sdkMessage.total_cost_usd,
              usage: {
                input: sdkMessage.usage.input_tokens,
                output: sdkMessage.usage.output_tokens,
                cacheWrite: sdkMessage.usage.cache_creation_input_tokens ?? 0,
                cacheRead: sdkMessage.usage.cache_read_input_tokens ?? 0,
              },
            },
            recoverable: sdkMessage.subtype === "error_max_turns" ? false : true,
            uuid,
            sessionId: this.sessionId,
            timestamp,
          };
          return errorEvent;
        }

      case "system":
        if (sdkMessage.subtype === "init") {
          return {
            type: "system",
            subtype: "init",
            uuid,
            sessionId: sdkMessage.session_id, // Use SDK's real session ID
            model: sdkMessage.model,
            tools: sdkMessage.tools,
            cwd: sdkMessage.cwd,
            timestamp,
          };
        }
        // Ignore other system messages (e.g., compact_boundary)
        return null;

      default:
        // Unknown message type
        return null;
    }
  }

  private transformMcpConfig(mcp?: NodeAgentConfig["mcp"]) {
    if (!mcp || !mcp.servers) {
      return undefined;
    }

    const result: Record<string, any> = {};
    for (const [name, serverConfig] of Object.entries(mcp.servers)) {
      result[name] = serverConfig;
    }
    return result;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
