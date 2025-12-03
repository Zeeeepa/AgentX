/**
 * createApplicationHandler - Create framework-agnostic HTTP handler
 *
 * Based on Web Standards (Request/Response).
 * Can be adapted to Express, Fastify, Hono, Next.js, etc.
 *
 * @example
 * ```typescript
 * import { createApplicationHandler } from "@agentxjs/network";
 *
 * const handler = createApplicationHandler(agentx, {
 *   basePath: "/api",
 *   repository,
 * });
 *
 * // Hono
 * app.all("/api/*", toHonoHandler(handler));
 *
 * // Express
 * app.use("/api", toExpressHandler(handler));
 * ```
 */

import type {
  AgentX,
  Repository,
  ApplicationHandler,
  ApplicationHandlerOptions,
  ParsedRequest,
  RequestType,
} from "@agentxjs/types";
import { createLogger } from "@agentxjs/common";
import {
  PlatformHandler,
  DefinitionHandler,
  ImageHandler,
  SessionHandler,
  AgentHandler,
  ContainerHandler,
  MessageHandler,
  errorResponse,
} from "./handlers";

const logger = createLogger("network/ApplicationHandler");

/**
 * Route handler function type
 */
type RouteHandler = (parsed: ParsedRequest, request: Request) => Promise<Response>;

/**
 * Create an Application HTTP handler
 */
export function createApplicationHandler(
  agentx: AgentX,
  options: ApplicationHandlerOptions = {}
): ApplicationHandler {
  const {
    basePath = "",
    allowDynamicCreation = false,
    allowedDefinitions = [],
    repository,
    hooks = {},
  } = options;

  // Initialize handlers
  const platformHandler = new PlatformHandler({ agentx });

  const agentHandler = new AgentHandler({
    agentx,
    basePath,
    allowDynamicCreation,
    allowedDefinitions,
    hooks,
  });

  // Repository-dependent handlers (lazy initialization)
  let definitionHandler: DefinitionHandler | null = null;
  let imageHandler: ImageHandler | null = null;
  let sessionHandler: SessionHandler | null = null;
  let containerHandler: ContainerHandler | null = null;
  let messageHandler: MessageHandler | null = null;

  function getRepository(): Repository {
    if (!repository) {
      throw new Error(
        "Repository not configured. Pass 'repository' option to createApplicationHandler."
      );
    }
    return repository;
  }

  function getDefinitionHandler(): DefinitionHandler {
    if (!definitionHandler) {
      definitionHandler = new DefinitionHandler({ repository: getRepository() });
    }
    return definitionHandler;
  }

  function getImageHandler(): ImageHandler {
    if (!imageHandler) {
      imageHandler = new ImageHandler({ agentx, repository: getRepository(), basePath });
    }
    return imageHandler;
  }

  function getSessionHandler(): SessionHandler {
    if (!sessionHandler) {
      sessionHandler = new SessionHandler({ agentx, repository: getRepository(), basePath });
    }
    return sessionHandler;
  }

  function getContainerHandler(): ContainerHandler {
    if (!containerHandler) {
      containerHandler = new ContainerHandler({ agentx, repository: getRepository() });
    }
    return containerHandler;
  }

  function getMessageHandler(): MessageHandler {
    if (!messageHandler) {
      messageHandler = new MessageHandler({ repository: getRepository() });
    }
    return messageHandler;
  }

  /**
   * Parse incoming request
   */
  function parseRequest(request: Request): ParsedRequest {
    const url = new URL(request.url);
    const method = request.method;

    // Remove basePath from pathname
    let path = url.pathname;
    if (basePath && path.startsWith(basePath)) {
      path = path.slice(basePath.length);
    }

    // Normalize path
    path = "/" + path.replace(/^\/+|\/+$/g, "");

    // Platform
    if (method === "GET" && path === "/info") return { type: "platform_info" };
    if (method === "GET" && path === "/health") return { type: "platform_health" };

    // Agents
    if (method === "GET" && path === "/agents") return { type: "list_agents" };
    if (method === "POST" && path === "/agents") return { type: "create_agent" };

    const agentMatch = path.match(/^\/agents\/([^/]+)(\/.*)?$/);
    if (agentMatch) {
      const agentId = agentMatch[1];
      const subPath = agentMatch[2] || "";
      if (method === "GET" && subPath === "") return { type: "get_agent", agentId };
      if (method === "DELETE" && subPath === "") return { type: "delete_agent", agentId };
      if (method === "POST" && subPath === "/messages") return { type: "send_message", agentId };
      if (method === "POST" && subPath === "/interrupt") return { type: "interrupt", agentId };
    }

    // Definitions
    if (method === "GET" && path === "/definitions") return { type: "list_definitions" };
    const definitionMatch = path.match(/^\/definitions\/([^/]+)$/);
    if (definitionMatch) {
      const definitionName = definitionMatch[1];
      if (method === "GET") return { type: "get_definition", definitionName };
      if (method === "PUT") return { type: "save_definition", definitionName };
      if (method === "DELETE") return { type: "delete_definition", definitionName };
      if (method === "HEAD") return { type: "head_definition", definitionName };
    }

    // Images
    if (method === "GET" && path === "/images") return { type: "list_images" };
    const imageMatch = path.match(/^\/images\/([^/]+)(\/.*)?$/);
    if (imageMatch) {
      const imageId = imageMatch[1];
      const subPath = imageMatch[2] || "";
      if (method === "GET" && subPath === "") return { type: "get_image", imageId };
      if (method === "PUT" && subPath === "") return { type: "save_image", imageId };
      if (method === "DELETE" && subPath === "") return { type: "delete_image", imageId };
      if (method === "HEAD" && subPath === "") return { type: "head_image", imageId };
      if (method === "GET" && subPath === "/sessions") return { type: "list_image_sessions", imageId };
      if (method === "DELETE" && subPath === "/sessions") return { type: "delete_image_sessions", imageId };
      if (method === "POST" && subPath === "/run") return { type: "run_image", imageId };
    }

    // Sessions
    if (method === "GET" && path === "/sessions") return { type: "list_sessions" };
    const sessionMatch = path.match(/^\/sessions\/([^/]+)(\/.*)?$/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      const subPath = sessionMatch[2] || "";
      if (method === "GET" && subPath === "") return { type: "get_session", sessionId };
      if (method === "PUT" && subPath === "") return { type: "save_session", sessionId };
      if (method === "DELETE" && subPath === "") return { type: "delete_session", sessionId };
      if (method === "HEAD" && subPath === "") return { type: "head_session", sessionId };
      if (method === "GET" && subPath === "/messages") return { type: "list_session_messages", sessionId };
      if (method === "DELETE" && subPath === "/messages") return { type: "delete_session_messages", sessionId };
      if (method === "GET" && subPath === "/messages/count") return { type: "count_session_messages", sessionId };
      if (method === "POST" && subPath === "/resume") return { type: "resume_session", sessionId };
    }

    // Messages
    const messageMatch = path.match(/^\/messages\/([^/]+)$/);
    if (messageMatch) {
      const messageId = messageMatch[1];
      if (method === "GET") return { type: "get_message", messageId };
      if (method === "PUT") return { type: "save_message", messageId };
      if (method === "DELETE") return { type: "delete_message", messageId };
    }

    // Containers
    if (method === "GET" && path === "/containers") return { type: "list_containers" };
    if (method === "POST" && path === "/containers") return { type: "create_container" };
    const containerMatch = path.match(/^\/containers\/([^/]+)$/);
    if (containerMatch) {
      const containerId = containerMatch[1];
      if (method === "GET") return { type: "get_container", containerId };
      if (method === "PUT") return { type: "save_container", containerId };
      if (method === "DELETE") return { type: "delete_container", containerId };
      if (method === "HEAD") return { type: "head_container", containerId };
    }

    return { type: "not_found" };
  }

  /**
   * Route handlers lookup table
   */
  const routes: Record<RequestType, RouteHandler> = {
    // Platform
    platform_info: () => platformHandler.getInfo(),
    platform_health: () => platformHandler.getHealth(),

    // Agents
    list_agents: () => agentHandler.list(),
    create_agent: (_, req) => agentHandler.create(req),
    get_agent: (p) => agentHandler.get(p.agentId!),
    delete_agent: (p) => agentHandler.delete(p.agentId!),
    send_message: (p, req) => agentHandler.sendMessage(p.agentId!, req),
    interrupt: (p) => agentHandler.interrupt(p.agentId!),

    // Definitions
    list_definitions: () => getDefinitionHandler().list(),
    get_definition: (p) => getDefinitionHandler().get(p.definitionName!),
    save_definition: (p, req) => getDefinitionHandler().save(p.definitionName!, req),
    delete_definition: (p) => getDefinitionHandler().delete(p.definitionName!),
    head_definition: (p) => getDefinitionHandler().exists(p.definitionName!),

    // Images
    list_images: () => getImageHandler().list(),
    get_image: (p) => getImageHandler().get(p.imageId!),
    save_image: (p, req) => getImageHandler().save(p.imageId!, req),
    delete_image: (p) => getImageHandler().delete(p.imageId!),
    head_image: (p) => getImageHandler().exists(p.imageId!),
    list_image_sessions: (p) => getImageHandler().listSessions(p.imageId!),
    delete_image_sessions: (p) => getImageHandler().deleteSessions(p.imageId!),
    run_image: (p, req) => getImageHandler().run(p.imageId!, req),

    // Sessions
    list_sessions: () => getSessionHandler().list(),
    get_session: (p) => getSessionHandler().get(p.sessionId!),
    save_session: (p, req) => getSessionHandler().save(p.sessionId!, req),
    delete_session: (p) => getSessionHandler().delete(p.sessionId!),
    head_session: (p) => getSessionHandler().exists(p.sessionId!),
    list_session_messages: (p) => getSessionHandler().listMessages(p.sessionId!),
    delete_session_messages: (p) => getSessionHandler().deleteMessages(p.sessionId!),
    count_session_messages: (p) => getSessionHandler().countMessages(p.sessionId!),
    resume_session: (p, req) => getSessionHandler().resume(p.sessionId!, req),

    // Messages
    get_message: (p) => getMessageHandler().get(p.messageId!),
    save_message: (p, req) => getMessageHandler().save(p.messageId!, req),
    delete_message: (p) => getMessageHandler().delete(p.messageId!),

    // Containers
    list_containers: () => getContainerHandler().list(),
    create_container: (_, req) => getContainerHandler().create(req),
    get_container: (p) => getContainerHandler().get(p.containerId!),
    save_container: (p, req) => getContainerHandler().save(p.containerId!, req),
    delete_container: (p) => getContainerHandler().delete(p.containerId!),
    head_container: (p) => getContainerHandler().exists(p.containerId!),

    // Not found
    not_found: () => Promise.resolve(errorResponse("INVALID_REQUEST", "Not found", 404)),
  };

  /**
   * Main handler
   */
  const handler: ApplicationHandler = async (request: Request): Promise<Response> => {
    try {
      const parsed = parseRequest(request);
      const routeHandler = routes[parsed.type];
      return await routeHandler(parsed, request);
    } catch (error) {
      logger.error("Unhandled error in request handler", { error });
      return errorResponse(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Internal server error",
        500
      );
    }
  };

  return handler;
}
