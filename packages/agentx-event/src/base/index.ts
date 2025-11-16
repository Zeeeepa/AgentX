/**
 * Base Layer
 *
 * Foundation types used across all event layers
 */

import type { StreamEventType } from "../stream";
import type { StateEventType } from "../state";
import type { MessageEventType } from "../message";
import type { ExchangeEventType } from "../exchange";

export type { AgentEvent } from "./AgentEvent";

/**
 * Complete union of all AgentX events across all layers
 */
export type AgentEventType =
  | StreamEventType
  | StateEventType
  | MessageEventType
  | ExchangeEventType;
