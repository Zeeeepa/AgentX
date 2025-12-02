/**
 * Container Module - Sandbox and Driver types
 *
 * This module provides types for resource isolation:
 * - Sandbox: Isolated environment (Workspace + LLM)
 * - RuntimeDriver: Driver with Sandbox reference
 *
 * Note: Container lifecycle management (ContainerManager) is at AgentX layer.
 * This module only provides the technical types used by Runtime.
 *
 * @see ContainerManager in agentx package for lifecycle management
 */

// Sandbox is exported via ./sandbox/index.ts
// RuntimeDriver is exported via ./driver/RuntimeDriver.ts
