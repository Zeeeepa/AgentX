/**
 * Container Module - Container lifecycle and Agent runtime management
 *
 * ContainerManager provides:
 * - Container lifecycle (create, delete, list)
 * - Agent runtime (run, resume, destroy)
 *
 * This is the AgentX layer's abstraction over Runtime's technical components.
 */

export type { ContainerManager } from "./ContainerManager";
export { ContainerManagerImpl } from "./ContainerManagerImpl";
