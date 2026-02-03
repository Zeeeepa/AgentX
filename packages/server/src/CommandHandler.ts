/**
 * CommandHandler - Handles command request/response events
 *
 * Listens to command request events and calls AgentXRuntime methods.
 * Emits response events back to clients.
 */

import type { AgentXRuntime } from "@agentxjs/core/runtime";
import type { EventBus, BusEvent } from "@agentxjs/core/event";
import type { UserContentPart } from "@agentxjs/core/agent";
import { createLogger } from "commonxjs/logger";

const logger = createLogger("server/CommandHandler");

/**
 * Response helper
 */
function createResponse(type: string, data: Record<string, unknown>): BusEvent {
  return {
    type,
    timestamp: Date.now(),
    source: "command",
    category: "response",
    intent: "result",
    data,
  } as BusEvent;
}

/**
 * Error response helper
 */
function createErrorResponse(
  type: string,
  requestId: string,
  error: unknown
): BusEvent {
  return createResponse(type, {
    requestId,
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * CommandHandler - Processes command events
 */
export class CommandHandler {
  private readonly runtime: AgentXRuntime;
  private readonly eventBus: EventBus;
  private subscriptions: (() => void)[] = [];

  constructor(runtime: AgentXRuntime, eventBus: EventBus) {
    this.runtime = runtime;
    this.eventBus = eventBus;
    this.bindHandlers();
    logger.debug("CommandHandler created");
  }

  private bindHandlers(): void {
    // Agent lifecycle commands
    this.subscribe("agent_create_request", this.handleAgentCreate.bind(this));
    this.subscribe("agent_get_request", this.handleAgentGet.bind(this));
    this.subscribe("agent_list_request", this.handleAgentList.bind(this));
    this.subscribe("agent_destroy_request", this.handleAgentDestroy.bind(this));

    // Message commands
    this.subscribe("message_send_request", this.handleMessageSend.bind(this));
    this.subscribe("agent_interrupt_request", this.handleInterrupt.bind(this));

    // Image commands
    this.subscribe("image_create_request", this.handleImageCreate.bind(this));
    this.subscribe("image_get_request", this.handleImageGet.bind(this));
    this.subscribe("image_list_request", this.handleImageList.bind(this));
    this.subscribe("image_delete_request", this.handleImageDelete.bind(this));

    // Container commands
    this.subscribe("container_create_request", this.handleContainerCreate.bind(this));
    this.subscribe("container_get_request", this.handleContainerGet.bind(this));
    this.subscribe("container_list_request", this.handleContainerList.bind(this));

    logger.debug("Command handlers bound");
  }

  private subscribe(type: string, handler: (event: BusEvent) => void): void {
    const unsub = this.eventBus.on(type, handler);
    this.subscriptions.push(unsub);
  }

  // ==================== Agent Commands ====================

  private async handleAgentCreate(event: BusEvent): Promise<void> {
    const { requestId, imageId, agentId } = event.data as {
      requestId: string;
      imageId: string;
      agentId?: string;
    };

    logger.debug("Handling agent_create_request", { requestId, imageId });

    try {
      const agent = await this.runtime.createAgent({ imageId, agentId });
      this.eventBus.emit(
        createResponse("agent_create_response", {
          requestId,
          agentId: agent.agentId,
          imageId: agent.imageId,
          containerId: agent.containerId,
          sessionId: agent.sessionId,
        })
      );
    } catch (err) {
      logger.error("Failed to create agent", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("agent_create_response", requestId, err));
    }
  }

  private handleAgentGet(event: BusEvent): void {
    const { requestId, agentId } = event.data as {
      requestId: string;
      agentId: string;
    };

    logger.debug("Handling agent_get_request", { requestId, agentId });

    const agent = this.runtime.getAgent(agentId);
    this.eventBus.emit(
      createResponse("agent_get_response", {
        requestId,
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
      })
    );
  }

  private handleAgentList(event: BusEvent): void {
    const { requestId, containerId } = event.data as {
      requestId: string;
      containerId?: string;
    };

    logger.debug("Handling agent_list_request", { requestId, containerId });

    const agents = containerId
      ? this.runtime.getAgentsByContainer(containerId)
      : this.runtime.getAgents();

    this.eventBus.emit(
      createResponse("agent_list_response", {
        requestId,
        agents: agents.map((a) => ({
          agentId: a.agentId,
          imageId: a.imageId,
          containerId: a.containerId,
          sessionId: a.sessionId,
          lifecycle: a.lifecycle,
        })),
      })
    );
  }

  private async handleAgentDestroy(event: BusEvent): Promise<void> {
    const { requestId, agentId } = event.data as {
      requestId: string;
      agentId: string;
    };

    logger.debug("Handling agent_destroy_request", { requestId, agentId });

    try {
      await this.runtime.destroyAgent(agentId);
      this.eventBus.emit(
        createResponse("agent_destroy_response", {
          requestId,
          agentId,
          success: true,
        })
      );
    } catch (err) {
      logger.error("Failed to destroy agent", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("agent_destroy_response", requestId, err));
    }
  }

  // ==================== Message Commands ====================

  private async handleMessageSend(event: BusEvent): Promise<void> {
    const { requestId, agentId, content } = event.data as {
      requestId: string;
      agentId: string;
      content: string | UserContentPart[];
    };

    logger.debug("Handling message_send_request", { requestId, agentId });

    try {
      await this.runtime.receive(agentId, content, requestId);
      this.eventBus.emit(
        createResponse("message_send_response", {
          requestId,
          agentId,
        })
      );
    } catch (err) {
      logger.error("Failed to send message", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("message_send_response", requestId, err));
    }
  }

  private handleInterrupt(event: BusEvent): void {
    const { requestId, agentId } = event.data as {
      requestId: string;
      agentId: string;
    };

    logger.debug("Handling agent_interrupt_request", { requestId, agentId });

    try {
      this.runtime.interrupt(agentId, requestId);
      this.eventBus.emit(
        createResponse("agent_interrupt_response", {
          requestId,
          agentId,
        })
      );
    } catch (err) {
      logger.error("Failed to interrupt agent", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("agent_interrupt_response", requestId, err));
    }
  }

  // ==================== Image Commands ====================

  private async handleImageCreate(event: BusEvent): Promise<void> {
    const { requestId, containerId, name, description, systemPrompt, mcpServers } =
      event.data as {
        requestId: string;
        containerId: string;
        name?: string;
        description?: string;
        systemPrompt?: string;
        mcpServers?: Record<string, unknown>;
      };

    logger.debug("Handling image_create_request", { requestId, containerId });

    try {
      const { imageRepository, sessionRepository } = this.runtime.provider;
      const { createImage } = await import("@agentxjs/core/image");

      const image = await createImage(
        { containerId, name, description, systemPrompt, mcpServers: mcpServers as any },
        { imageRepository, sessionRepository }
      );

      this.eventBus.emit(
        createResponse("image_create_response", {
          requestId,
          record: image.toRecord(),
          __subscriptions: [image.sessionId],
        })
      );
    } catch (err) {
      logger.error("Failed to create image", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("image_create_response", requestId, err));
    }
  }

  private async handleImageGet(event: BusEvent): Promise<void> {
    const { requestId, imageId } = event.data as {
      requestId: string;
      imageId: string;
    };

    logger.debug("Handling image_get_request", { requestId, imageId });

    try {
      const record = await this.runtime.provider.imageRepository.findImageById(imageId);
      this.eventBus.emit(
        createResponse("image_get_response", {
          requestId,
          record,
          __subscriptions: record?.sessionId ? [record.sessionId] : undefined,
        })
      );
    } catch (err) {
      logger.error("Failed to get image", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("image_get_response", requestId, err));
    }
  }

  private async handleImageList(event: BusEvent): Promise<void> {
    const { requestId, containerId } = event.data as {
      requestId: string;
      containerId?: string;
    };

    logger.debug("Handling image_list_request", { requestId, containerId });

    try {
      const records = containerId
        ? await this.runtime.provider.imageRepository.findImagesByContainerId(containerId)
        : await this.runtime.provider.imageRepository.findAllImages();

      this.eventBus.emit(
        createResponse("image_list_response", {
          requestId,
          records,
          __subscriptions: records.map((r) => r.sessionId),
        })
      );
    } catch (err) {
      logger.error("Failed to list images", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("image_list_response", requestId, err));
    }
  }

  private async handleImageDelete(event: BusEvent): Promise<void> {
    const { requestId, imageId } = event.data as {
      requestId: string;
      imageId: string;
    };

    logger.debug("Handling image_delete_request", { requestId, imageId });

    try {
      const { loadImage } = await import("@agentxjs/core/image");
      const { imageRepository, sessionRepository } = this.runtime.provider;

      const image = await loadImage(imageId, { imageRepository, sessionRepository });
      if (image) {
        await image.delete();
      }

      this.eventBus.emit(
        createResponse("image_delete_response", {
          requestId,
          imageId,
        })
      );
    } catch (err) {
      logger.error("Failed to delete image", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("image_delete_response", requestId, err));
    }
  }

  // ==================== Container Commands ====================

  private async handleContainerCreate(event: BusEvent): Promise<void> {
    const { requestId, containerId } = event.data as {
      requestId: string;
      containerId: string;
    };

    logger.debug("Handling container_create_request", { requestId, containerId });

    try {
      const { getOrCreateContainer } = await import("@agentxjs/core/container");
      const { containerRepository, imageRepository, sessionRepository } = this.runtime.provider;

      const container = await getOrCreateContainer(containerId, {
        containerRepository,
        imageRepository,
        sessionRepository,
      });

      this.eventBus.emit(
        createResponse("container_create_response", {
          requestId,
          containerId: container.containerId,
        })
      );
    } catch (err) {
      logger.error("Failed to create container", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("container_create_response", requestId, err));
    }
  }

  private async handleContainerGet(event: BusEvent): Promise<void> {
    const { requestId, containerId } = event.data as {
      requestId: string;
      containerId: string;
    };

    logger.debug("Handling container_get_request", { requestId, containerId });

    try {
      const exists = await this.runtime.provider.containerRepository.containerExists(containerId);
      this.eventBus.emit(
        createResponse("container_get_response", {
          requestId,
          containerId,
          exists,
        })
      );
    } catch (err) {
      logger.error("Failed to get container", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("container_get_response", requestId, err));
    }
  }

  private async handleContainerList(event: BusEvent): Promise<void> {
    const { requestId } = event.data as { requestId: string };

    logger.debug("Handling container_list_request", { requestId });

    try {
      const containers = await this.runtime.provider.containerRepository.findAllContainers();
      this.eventBus.emit(
        createResponse("container_list_response", {
          requestId,
          containerIds: containers.map((c) => c.containerId),
        })
      );
    } catch (err) {
      logger.error("Failed to list containers", { requestId, error: err });
      this.eventBus.emit(createErrorResponse("container_list_response", requestId, err));
    }
  }

  // ==================== Lifecycle ====================

  dispose(): void {
    for (const unsub of this.subscriptions) {
      unsub();
    }
    this.subscriptions = [];
    logger.debug("CommandHandler disposed");
  }
}
