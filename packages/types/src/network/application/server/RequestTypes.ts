/**
 * RequestTypes - HTTP request parsing types
 *
 * Used by ApplicationHandler to route requests.
 */

/**
 * Parsed request info
 */
export interface ParsedRequest {
  /**
   * Request type
   */
  type: RequestType;

  /**
   * Agent ID (if applicable)
   */
  agentId?: string;

  /**
   * Definition name (if applicable)
   */
  definitionName?: string;

  /**
   * Image ID (if applicable)
   */
  imageId?: string;

  /**
   * Session ID (if applicable)
   */
  sessionId?: string;


  /**
   * Message ID (if applicable)
   */
  messageId?: string;

  /**
   * Container ID (if applicable)
   */
  containerId?: string;
}

/**
 * Request types for routing
 */
export type RequestType =
  // Platform
  | "platform_info" // GET /info
  | "platform_health" // GET /health
  // Agents (runtime, but accessed via HTTP initially)
  | "list_agents" // GET /agents
  | "create_agent" // POST /agents
  | "get_agent" // GET /agents/:agentId
  | "delete_agent" // DELETE /agents/:agentId
  | "send_message" // POST /agents/:agentId/messages
  | "interrupt" // POST /agents/:agentId/interrupt
  // Definitions
  | "list_definitions" // GET /definitions
  | "get_definition" // GET /definitions/:name
  | "save_definition" // PUT /definitions/:name
  | "delete_definition" // DELETE /definitions/:name
  | "head_definition" // HEAD /definitions/:name
  // Images
  | "list_images" // GET /images
  | "get_image" // GET /images/:imageId
  | "save_image" // PUT /images/:imageId
  | "delete_image" // DELETE /images/:imageId
  | "head_image" // HEAD /images/:imageId
  | "list_image_sessions" // GET /images/:imageId/sessions
  | "delete_image_sessions" // DELETE /images/:imageId/sessions
  | "run_image" // POST /images/:imageId/run
  // Sessions
  | "list_sessions" // GET /sessions
  | "get_session" // GET /sessions/:sessionId
  | "save_session" // PUT /sessions/:sessionId
  | "delete_session" // DELETE /sessions/:sessionId
  | "head_session" // HEAD /sessions/:sessionId
  | "list_session_messages" // GET /sessions/:sessionId/messages
  | "delete_session_messages" // DELETE /sessions/:sessionId/messages
  | "count_session_messages" // GET /sessions/:sessionId/messages/count
  | "resume_session" // POST /sessions/:sessionId/resume
  // Messages
  | "get_message" // GET /messages/:messageId
  | "save_message" // PUT /messages/:messageId
  | "delete_message" // DELETE /messages/:messageId
  // Containers
  | "list_containers" // GET /containers
  | "create_container" // POST /containers
  | "get_container" // GET /containers/:containerId
  | "save_container" // PUT /containers/:containerId
  | "delete_container" // DELETE /containers/:containerId
  | "head_container" // HEAD /containers/:containerId
  // Not found
  | "not_found"; // Unknown route
