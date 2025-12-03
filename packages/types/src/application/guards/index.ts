/**
 * Type Guards
 *
 * Runtime type checking functions for Message and ContentPart types.
 */

// Message guards
export {
  isUserMessage,
  isAssistantMessage,
  isSystemMessage,
  isToolCallMessage,
  isToolResultMessage,
} from "./MessageGuards";

// ContentPart guards
export {
  isTextPart,
  isThinkingPart,
  isImagePart,
  isFilePart,
  isToolCallPart,
  isToolResultPart,
} from "./ContentPartGuards";

// Event guards
export {
  isStateEvent,
  isMessageEvent,
  isTurnEvent,
  isStreamEvent,
  isErrorEvent,
} from "./EventGuards";

// Event type name constants (single source of truth)
export {
  STATE_EVENT_TYPE_NAMES,
  MESSAGE_EVENT_TYPE_NAMES,
  TURN_EVENT_TYPE_NAMES,
  STREAM_EVENT_TYPE_NAMES,
  ERROR_EVENT_TYPE_NAMES,
} from "./EventGuards";
