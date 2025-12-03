/**
 * PlatformHandler - Handles /info and /health endpoints
 */

import type { AgentX, PlatformInfoResponse, HealthResponse } from "@agentxjs/types";
import { jsonResponse } from "./utils";

const VERSION = "0.1.0";

export interface PlatformHandlerDeps {
  agentx: AgentX;
}

export class PlatformHandler {
  constructor(private readonly deps: PlatformHandlerDeps) {}

  /**
   * GET /info
   */
  async getInfo(): Promise<Response> {
    const response: PlatformInfoResponse = {
      platform: "AgentX",
      version: VERSION,
      agentCount: this.deps.agentx.agents.list().length,
    };
    return jsonResponse(response);
  }

  /**
   * GET /health
   */
  async getHealth(): Promise<Response> {
    const response: HealthResponse = {
      status: "healthy",
      timestamp: Date.now(),
      agentCount: this.deps.agentx.agents.list().length,
    };
    return jsonResponse(response);
  }
}
