/**
 * CommandHandler - Handles CommandEvent request/response
 *
 * Listens to command request events on the bus and emits response events.
 * This separates event handling logic from RuntimeImpl resource management.
 *
 * Pattern:
 * ```
 * Bus.emit(container_create_request)
 *   → CommandHandler.handleContainerCreate()
 *   → Bus.emit(container_create_response)
 * ```
 */

import type { SystemBus } from "@agentxjs/types/runtime/internal";
import type { SystemEvent } from "@agentxjs/types/event";
import { BaseEventHandler } from "./BaseEventHandler";
import { createLogger } from "@agentxjs/common";

const logger = createLogger("runtime/CommandHandler");

/**
 * Image list item with online status
 */
export interface ImageListItemResult {
  imageId: string;
  containerId: string;
  sessionId: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
  online: boolean;
  agentId?: string;
}

/**
 * Runtime operations interface - what CommandHandler needs to execute commands
 */
export interface RuntimeOperations {
  // Container operations
  createContainer(containerId: string): Promise<{ containerId: string }>;
  getContainer(containerId: string): { containerId: string } | undefined;
  listContainers(): { containerId: string }[];

  // Agent operations (by agentId)
  getAgent(agentId: string): { agentId: string; containerId: string; imageId: string } | undefined;
  listAgents(containerId: string): { agentId: string; containerId: string; imageId: string }[];
  destroyAgent(agentId: string): Promise<boolean>;
  destroyAllAgents(containerId: string): Promise<void>;

  // Agent operations (by imageId - with auto-activation)
  receiveMessage(imageId: string | undefined, agentId: string | undefined, content: string): Promise<{ agentId: string; imageId?: string }>;
  interruptAgent(imageId: string | undefined, agentId: string | undefined): { agentId?: string; imageId?: string };

  // Image operations (new model)
  createImage(containerId: string, config: { name?: string; description?: string; systemPrompt?: string }): Promise<ImageListItemResult>;
  runImage(imageId: string): Promise<{ imageId: string; agentId: string; reused: boolean }>;
  stopImage(imageId: string): Promise<void>;
  updateImage(imageId: string, updates: { name?: string; description?: string }): Promise<ImageListItemResult>;
  listImages(containerId?: string): Promise<ImageListItemResult[]>;
  getImage(imageId: string): Promise<ImageListItemResult | null>;
  deleteImage(imageId: string): Promise<void>;
  getImageMessages(imageId: string): Promise<Array<{ id: string; role: string; content: unknown; timestamp: number }>>;
}

/**
 * Helper to create a command response event
 */
function createResponse<T extends string, D>(type: T, data: D): SystemEvent {
  return {
    type,
    timestamp: Date.now(),
    data,
    source: "command",
    category: "response",
    intent: "result",
  } as SystemEvent;
}

/**
 * CommandHandler - Event handler for command events
 */
export class CommandHandler extends BaseEventHandler {
  private readonly ops: RuntimeOperations;

  constructor(bus: SystemBus, operations: RuntimeOperations) {
    super(bus);
    this.ops = operations;
    this.bindHandlers();
    logger.debug("CommandHandler created");
  }

  /**
   * Bind all command handlers to the bus
   */
  protected bindHandlers(): void {
    // Container commands
    this.subscribe(this.bus.onCommand("container_create_request", (event) => this.handleContainerCreate(event)));
    this.subscribe(this.bus.onCommand("container_get_request", (event) => this.handleContainerGet(event)));
    this.subscribe(this.bus.onCommand("container_list_request", (event) => this.handleContainerList(event)));

    // Agent commands
    this.subscribe(this.bus.onCommand("agent_get_request", (event) => this.handleAgentGet(event)));
    this.subscribe(this.bus.onCommand("agent_list_request", (event) => this.handleAgentList(event)));
    this.subscribe(this.bus.onCommand("agent_destroy_request", (event) => this.handleAgentDestroy(event)));
    this.subscribe(this.bus.onCommand("agent_destroy_all_request", (event) => this.handleAgentDestroyAll(event)));
    this.subscribe(this.bus.onCommand("message_send_request", (event) => this.handleMessageSend(event)));
    this.subscribe(this.bus.onCommand("agent_interrupt_request", (event) => this.handleAgentInterrupt(event)));

    // Image commands
    this.subscribe(this.bus.onCommand("image_create_request", (event) => this.handleImageCreate(event)));
    this.subscribe(this.bus.onCommand("image_run_request", (event) => this.handleImageRun(event)));
    this.subscribe(this.bus.onCommand("image_stop_request", (event) => this.handleImageStop(event)));
    this.subscribe(this.bus.onCommand("image_update_request", (event) => this.handleImageUpdate(event)));
    this.subscribe(this.bus.onCommand("image_list_request", (event) => this.handleImageList(event)));
    this.subscribe(this.bus.onCommand("image_get_request", (event) => this.handleImageGet(event)));
    this.subscribe(this.bus.onCommand("image_delete_request", (event) => this.handleImageDelete(event)));
    this.subscribe(this.bus.onCommand("image_messages_request", (event) => this.handleImageMessages(event)));

    logger.debug("Command handlers bound");
  }

  // ==================== Container Handlers ====================

  private async handleContainerCreate(event: { data: { requestId: string; containerId: string } }): Promise<void> {
    const { requestId, containerId } = event.data;
    logger.debug("Handling container_create_request", { requestId, containerId });

    try {
      await this.ops.createContainer(containerId);
      this.bus.emit(createResponse("container_create_response", {
        requestId,
        containerId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("container_create_response", {
        requestId,
        containerId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private handleContainerGet(event: { data: { requestId: string; containerId: string } }): void {
    const { requestId, containerId } = event.data;
    logger.debug("Handling container_get_request", { requestId, containerId });

    const container = this.ops.getContainer(containerId);
    this.bus.emit(createResponse("container_get_response", {
      requestId,
      containerId: container?.containerId,
      exists: !!container,
    }));
  }

  private handleContainerList(event: { data: { requestId: string } }): void {
    const { requestId } = event.data;
    logger.debug("Handling container_list_request", { requestId });

    const containers = this.ops.listContainers();
    this.bus.emit(createResponse("container_list_response", {
      requestId,
      containerIds: containers.map(c => c.containerId),
    }));
  }

  // ==================== Agent Handlers ====================

  private handleAgentGet(event: { data: { requestId: string; agentId: string } }): void {
    const { requestId, agentId } = event.data;
    logger.debug("Handling agent_get_request", { requestId, agentId });

    const agent = this.ops.getAgent(agentId);
    this.bus.emit(createResponse("agent_get_response", {
      requestId,
      agentId: agent?.agentId,
      containerId: agent?.containerId,
      exists: !!agent,
    }));
  }

  private handleAgentList(event: { data: { requestId: string; containerId: string } }): void {
    const { requestId, containerId } = event.data;
    logger.debug("Handling agent_list_request", { requestId, containerId });

    const agents = this.ops.listAgents(containerId);
    this.bus.emit(createResponse("agent_list_response", {
      requestId,
      agents: agents.map(a => ({ agentId: a.agentId, containerId: a.containerId, imageId: a.imageId })),
    }));
  }

  private async handleAgentDestroy(event: { data: { requestId: string; agentId: string } }): Promise<void> {
    const { requestId, agentId } = event.data;
    logger.debug("Handling agent_destroy_request", { requestId, agentId });

    try {
      const success = await this.ops.destroyAgent(agentId);
      this.bus.emit(createResponse("agent_destroy_response", {
        requestId,
        agentId,
        success,
      }));
    } catch (err) {
      this.bus.emit(createResponse("agent_destroy_response", {
        requestId,
        agentId,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleAgentDestroyAll(event: { data: { requestId: string; containerId: string } }): Promise<void> {
    const { requestId, containerId } = event.data;
    logger.debug("Handling agent_destroy_all_request", { requestId, containerId });

    try {
      await this.ops.destroyAllAgents(containerId);
      this.bus.emit(createResponse("agent_destroy_all_response", {
        requestId,
        containerId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("agent_destroy_all_response", {
        requestId,
        containerId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleMessageSend(event: { data: { requestId: string; imageId?: string; agentId?: string; content: string } }): Promise<void> {
    const { requestId, imageId, agentId, content } = event.data;
    logger.debug("Handling message_send_request", { requestId, imageId, agentId });

    try {
      const result = await this.ops.receiveMessage(imageId, agentId, content);
      this.bus.emit(createResponse("message_send_response", {
        requestId,
        imageId: result.imageId,
        agentId: result.agentId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("message_send_response", {
        requestId,
        imageId,
        agentId: agentId ?? "",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private handleAgentInterrupt(event: { data: { requestId: string; imageId?: string; agentId?: string } }): void {
    const { requestId, imageId, agentId } = event.data;
    logger.debug("Handling agent_interrupt_request", { requestId, imageId, agentId });

    try {
      const result = this.ops.interruptAgent(imageId, agentId);
      this.bus.emit(createResponse("agent_interrupt_response", {
        requestId,
        imageId: result.imageId,
        agentId: result.agentId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("agent_interrupt_response", {
        requestId,
        imageId,
        agentId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  // ==================== Image Handlers ====================

  private async handleImageCreate(event: { data: { requestId: string; containerId: string; config: { name?: string; description?: string; systemPrompt?: string } } }): Promise<void> {
    const { requestId, containerId, config } = event.data;
    logger.debug("Handling image_create_request", { requestId, containerId });

    try {
      const record = await this.ops.createImage(containerId, config);
      this.bus.emit(createResponse("image_create_response", {
        requestId,
        record,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_create_response", {
        requestId,
        record: null as unknown as ImageListItemResult,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageRun(event: { data: { requestId: string; imageId: string } }): Promise<void> {
    const { requestId, imageId } = event.data;
    logger.debug("Handling image_run_request", { requestId, imageId });

    try {
      const result = await this.ops.runImage(imageId);
      this.bus.emit(createResponse("image_run_response", {
        requestId,
        imageId: result.imageId,
        agentId: result.agentId,
        reused: result.reused,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_run_response", {
        requestId,
        imageId,
        agentId: "",
        reused: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageStop(event: { data: { requestId: string; imageId: string } }): Promise<void> {
    const { requestId, imageId } = event.data;
    logger.debug("Handling image_stop_request", { requestId, imageId });

    try {
      await this.ops.stopImage(imageId);
      this.bus.emit(createResponse("image_stop_response", {
        requestId,
        imageId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_stop_response", {
        requestId,
        imageId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageUpdate(event: { data: { requestId: string; imageId: string; updates: { name?: string; description?: string } } }): Promise<void> {
    const { requestId, imageId, updates } = event.data;
    logger.debug("Handling image_update_request", { requestId, imageId });

    try {
      const record = await this.ops.updateImage(imageId, updates);
      this.bus.emit(createResponse("image_update_response", {
        requestId,
        record,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_update_response", {
        requestId,
        record: null as unknown as ImageListItemResult,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageList(event: { data: { requestId: string; containerId?: string } }): Promise<void> {
    const { requestId, containerId } = event.data;
    logger.debug("Handling image_list_request", { requestId, containerId });

    try {
      const images = await this.ops.listImages(containerId);
      this.bus.emit(createResponse("image_list_response", {
        requestId,
        records: images,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_list_response", {
        requestId,
        records: [],
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageGet(event: { data: { requestId: string; imageId: string } }): Promise<void> {
    const { requestId, imageId } = event.data;
    logger.debug("Handling image_get_request", { requestId, imageId });

    try {
      const image = await this.ops.getImage(imageId);
      this.bus.emit(createResponse("image_get_response", {
        requestId,
        record: image,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_get_response", {
        requestId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageDelete(event: { data: { requestId: string; imageId: string } }): Promise<void> {
    const { requestId, imageId } = event.data;
    logger.debug("Handling image_delete_request", { requestId, imageId });

    try {
      await this.ops.deleteImage(imageId);
      this.bus.emit(createResponse("image_delete_response", {
        requestId,
        imageId,
      }));
    } catch (err) {
      this.bus.emit(createResponse("image_delete_response", {
        requestId,
        imageId,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  private async handleImageMessages(event: { data: { requestId: string; imageId: string } }): Promise<void> {
    const { requestId, imageId } = event.data;
    logger.info("Handling image_messages_request", { requestId, imageId });

    try {
      const messages = await this.ops.getImageMessages(imageId);
      logger.info("Got messages for image", { imageId, count: messages.length });
      this.bus.emit(createResponse("image_messages_response", {
        requestId,
        imageId,
        messages,
      }));
      logger.info("Emitted image_messages_response", { requestId, imageId });
    } catch (err) {
      logger.error("Failed to get image messages", { imageId, error: err });
      this.bus.emit(createResponse("image_messages_response", {
        requestId,
        imageId,
        messages: [],
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  // Lifecycle is handled by BaseEventHandler.dispose()
}
