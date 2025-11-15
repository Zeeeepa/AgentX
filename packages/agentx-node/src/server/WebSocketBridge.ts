/**
 * WebSocket Bridge - Agent Events → WebSocket Messages
 *
 * Automatically subscribes to all Agent events and forwards them to WebSocket client
 */

import type { Agent, EventType, EventPayload } from "@deepractice-ai/agentx-api";
import type WebSocket from "ws";

/**
 * WebSocket Bridge for Agent
 *
 * Responsibilities:
 * - Subscribe to ALL agent events
 * - Convert events to WebSocket messages
 * - Clean up on disconnect
 */
export class WebSocketBridge {
  private agent: Agent;
  private ws: WebSocket;
  private eventHandlers = new Map<EventType, (payload: any) => void>();

  constructor(agent: Agent, ws: WebSocket) {
    this.agent = agent;
    this.ws = ws;

    this.setupEventForwarding();
  }

  /**
   * Subscribe to all Agent events and forward to WebSocket
   */
  private setupEventForwarding(): void {
    // All event types from agentx-api
    const eventTypes: EventType[] = [
      "user", // User message
      "assistant", // Assistant message (complete)
      "stream_event", // Stream delta (incremental)
      "result", // Final result (success/error)
      "system", // System init
    ];

    eventTypes.forEach((eventType) => {
      const handler = (payload: EventPayload<typeof eventType>) => {
        this.sendEvent(eventType, payload);
      };

      // Subscribe to event
      this.agent.on(eventType, handler);

      // Store handler for cleanup
      this.eventHandlers.set(eventType, handler);
    });

    console.log(`[WebSocketBridge] Forwarding events for session ${this.agent.sessionId}`);
  }

  /**
   * Send event to WebSocket client
   */
  private sendEvent(eventType: EventType, payload: any): void {
    try {
      // Forward the complete event payload (already has uuid, sessionId, timestamp)
      this.ws.send(
        JSON.stringify({
          ...payload,
          // Ensure type is present
          type: eventType,
        })
      );
    } catch (error) {
      console.error("[WebSocketBridge] Failed to send event:", error);
    }
  }

  /**
   * Cleanup: remove all event listeners
   */
  destroy(): void {
    this.eventHandlers.forEach((handler, eventType) => {
      this.agent.off(eventType, handler);
    });

    this.eventHandlers.clear();
    console.log(`[WebSocketBridge] Destroyed for session ${this.agent.sessionId}`);
  }
}
