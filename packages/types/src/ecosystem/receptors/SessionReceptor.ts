import type { Receptor } from "~/ecosystem/Receptor";
import type { SessionCreatedEvent, SessionResumedEvent } from "../event";

/**
 * Session events union type.
 */
export type SessionEvent = SessionCreatedEvent | SessionResumedEvent;

/**
 * SessionReceptor - Senses session lifecycle events.
 *
 * Responsible for detecting:
 * - session_created: New session created
 * - session_resumed: Existing session resumed
 */
export interface SessionReceptor extends Receptor<SessionEvent> {}
