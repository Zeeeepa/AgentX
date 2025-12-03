import type { Receptor } from "~/ecosystem/Receptor";
import type { HeartbeatEvent, ConnectionEstablishedEvent } from "../event";

/**
 * Transport events union type.
 */
export type TransportEvent = HeartbeatEvent | ConnectionEstablishedEvent;

/**
 * TransportReceptor - Senses transport layer events.
 *
 * Responsible for detecting:
 * - heartbeat: SSE keepalive signal
 * - connection_established: SSE connection established
 */
export interface TransportReceptor extends Receptor<TransportEvent> {}
