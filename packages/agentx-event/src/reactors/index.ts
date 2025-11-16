/**
 * Event Reactors
 *
 * Type-safe contracts for handling events from each layer.
 * Reactors provide a structured, compile-time safe way to handle events.
 *
 * Benefits:
 * - ✅ Compile-time guarantee that all events are handled
 * - ✅ Clear interface contract for implementers
 * - ✅ Automatic binding to EventConsumer
 * - ✅ Support for partial implementations
 *
 * Usage:
 * ```typescript
 * import { bindMessageReactor, type MessageReactor } from "@deepractice-ai/agentx-event/reactors";
 *
 * class ChatUI implements MessageReactor {
 *   onUserMessage(event) { ... }
 *   onAssistantMessage(event) { ... }
 *   onToolUseMessage(event) { ... }
 *   onErrorMessage(event) { ... }
 * }
 *
 * const ui = new ChatUI();
 * const unbind = bindMessageReactor(consumer, ui);
 * ```
 */

// Stream Layer
export type { StreamReactor, PartialStreamReactor } from "../stream/StreamReactor";
export { bindStreamReactor, bindPartialStreamReactor } from "./bindStreamReactor";

// State Layer
export type { StateReactor, PartialStateReactor } from "../state/StateReactor";
export { bindStateReactor, bindPartialStateReactor } from "./bindStateReactor";

// Message Layer
export type { MessageReactor, PartialMessageReactor } from "../message/MessageReactor";
export { bindMessageReactor, bindPartialMessageReactor } from "./bindMessageReactor";

// Exchange Layer
export type { ExchangeReactor, PartialExchangeReactor } from "../exchange/ExchangeReactor";
export { bindExchangeReactor, bindPartialExchangeReactor } from "./bindExchangeReactor";
