/**
 * LocalClient - AgentX client for local mode
 *
 * Runs an embedded Runtime + Driver directly, without WebSocket.
 * Implements the same AgentX interface as RemoteClient.
 */

import type { BusEvent, EventBus, BusEventHandler, Unsubscribe } from "@agentxjs/core/event";
import type { AgentXRuntime, AgentXProvider } from "@agentxjs/core/runtime";
import type { UserContentPart } from "@agentxjs/core/agent";
import { createLogger } from "commonxjs/logger";
import type {
  AgentX,
  AgentCreateResponse,
  AgentGetResponse,
  AgentListResponse,
  ImageCreateResponse,
  ImageGetResponse,
  ImageListResponse,
  ContainerCreateResponse,
  ContainerGetResponse,
  ContainerListResponse,
  MessageSendResponse,
  BaseResponse,
} from "./types";
import { Presentation, type PresentationOptions } from "./presentation";

const logger = createLogger("agentx/LocalClient");

/**
 * LocalClient - Embedded runtime implementation
 */
export class LocalClient implements AgentX {
  private readonly runtime: AgentXRuntime;
  private readonly provider: AgentXProvider;
  private isDisposed = false;

  constructor(runtime: AgentXRuntime) {
    this.runtime = runtime;
    this.provider = runtime.provider;
    logger.info("LocalClient initialized");
  }

  // ==================== Properties ====================

  get connected(): boolean {
    return !this.isDisposed;
  }

  get events(): EventBus {
    return this.provider.eventBus;
  }

  // ==================== Container Operations ====================

  async createContainer(containerId: string): Promise<ContainerCreateResponse> {
    const { getOrCreateContainer } = await import("@agentxjs/core/container");
    const { containerRepository, imageRepository, sessionRepository } = this.provider;

    const container = await getOrCreateContainer(containerId, {
      containerRepository,
      imageRepository,
      sessionRepository,
    });

    return { containerId: container.containerId, requestId: "" };
  }

  async getContainer(containerId: string): Promise<ContainerGetResponse> {
    const exists = await this.provider.containerRepository.containerExists(containerId);
    return { containerId, exists, requestId: "" };
  }

  async listContainers(): Promise<ContainerListResponse> {
    const containers = await this.provider.containerRepository.findAllContainers();
    return { containerIds: containers.map((c) => c.containerId), requestId: "" };
  }

  // ==================== Image Operations ====================

  async createImage(params: {
    containerId: string;
    name?: string;
    description?: string;
    systemPrompt?: string;
    mcpServers?: Record<string, unknown>;
  }): Promise<ImageCreateResponse> {
    const { imageRepository, sessionRepository } = this.provider;
    const { createImage } = await import("@agentxjs/core/image");

    const image = await createImage(
      {
        containerId: params.containerId,
        name: params.name,
        description: params.description,
        systemPrompt: params.systemPrompt,
        mcpServers: params.mcpServers as any,
      },
      { imageRepository, sessionRepository }
    );

    return {
      record: image.toRecord(),
      __subscriptions: [image.sessionId],
      requestId: "",
    };
  }

  async getImage(imageId: string): Promise<ImageGetResponse> {
    const record = await this.provider.imageRepository.findImageById(imageId);
    return {
      record,
      __subscriptions: record?.sessionId ? [record.sessionId] : undefined,
      requestId: "",
    };
  }

  async listImages(containerId?: string): Promise<ImageListResponse> {
    const records = containerId
      ? await this.provider.imageRepository.findImagesByContainerId(containerId)
      : await this.provider.imageRepository.findAllImages();

    return {
      records,
      __subscriptions: records.map((r) => r.sessionId),
      requestId: "",
    };
  }

  async deleteImage(imageId: string): Promise<BaseResponse> {
    const { loadImage } = await import("@agentxjs/core/image");
    const { imageRepository, sessionRepository } = this.provider;

    const image = await loadImage(imageId, { imageRepository, sessionRepository });
    if (image) {
      await image.delete();
    }

    return { requestId: "" };
  }

  // ==================== Agent Operations ====================

  async createAgent(params: { imageId: string; agentId?: string }): Promise<AgentCreateResponse> {
    // Reuse existing running agent for this image
    const existingAgent = this.runtime
      .getAgents()
      .find((a) => a.imageId === params.imageId && a.lifecycle === "running");

    if (existingAgent) {
      return {
        agentId: existingAgent.agentId,
        imageId: existingAgent.imageId,
        containerId: existingAgent.containerId,
        sessionId: existingAgent.sessionId,
        requestId: "",
      };
    }

    const agent = await this.runtime.createAgent({
      imageId: params.imageId,
      agentId: params.agentId,
    });

    return {
      agentId: agent.agentId,
      imageId: agent.imageId,
      containerId: agent.containerId,
      sessionId: agent.sessionId,
      requestId: "",
    };
  }

  async getAgent(agentId: string): Promise<AgentGetResponse> {
    const agent = this.runtime.getAgent(agentId);
    return {
      agent: agent
        ? {
            agentId: agent.agentId,
            imageId: agent.imageId,
            containerId: agent.containerId,
            sessionId: agent.sessionId,
            lifecycle: agent.lifecycle,
          }
        : null,
      exists: !!agent,
      requestId: "",
    };
  }

  async listAgents(containerId?: string): Promise<AgentListResponse> {
    const agents = containerId
      ? this.runtime.getAgentsByContainer(containerId)
      : this.runtime.getAgents();

    return {
      agents: agents.map((a) => ({
        agentId: a.agentId,
        imageId: a.imageId,
        containerId: a.containerId,
        sessionId: a.sessionId,
        lifecycle: a.lifecycle,
      })),
      requestId: "",
    };
  }

  async destroyAgent(agentId: string): Promise<BaseResponse> {
    const agent = this.runtime.getAgent(agentId);
    if (agent) {
      await this.runtime.destroyAgent(agentId);
    }
    return { requestId: "" };
  }

  // ==================== Message Operations ====================

  async sendMessage(agentId: string, content: string | unknown[]): Promise<MessageSendResponse> {
    await this.runtime.receive(agentId, content as string | UserContentPart[]);
    return { agentId, requestId: "" };
  }

  async interrupt(agentId: string): Promise<BaseResponse> {
    this.runtime.interrupt(agentId);
    return { requestId: "" };
  }

  // ==================== Event Subscription ====================

  on<T extends string>(type: T, handler: BusEventHandler<BusEvent & { type: T }>): Unsubscribe {
    return this.provider.eventBus.on(type, handler);
  }

  onAny(handler: BusEventHandler): Unsubscribe {
    return this.provider.eventBus.onAny(handler);
  }

  subscribe(_sessionId: string): void {
    // No-op for local mode - already subscribed via eventBus
  }

  // ==================== Presentation ====================

  presentation(agentId: string, options?: PresentationOptions): Presentation {
    return new Presentation(this, agentId, options);
  }

  // ==================== Lifecycle ====================

  async disconnect(): Promise<void> {
    // No-op for local mode
  }

  async dispose(): Promise<void> {
    if (this.isDisposed) return;
    await this.runtime.shutdown();
    this.isDisposed = true;
    logger.info("LocalClient disposed");
  }
}
