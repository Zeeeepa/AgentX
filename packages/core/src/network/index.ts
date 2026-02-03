/**
 * Network Module
 *
 * Provides standard interfaces for client-server communication:
 * - ChannelServer: Server that accepts connections
 * - ChannelClient: Client that connects to server
 * - ChannelConnection: Server-side representation of a client
 * - Reliable Message Protocol: At-least-once delivery
 *
 * Implementations are provided by platform packages:
 * - @agentxjs/node: WebSocket (ws library)
 * - @agentxjs/cloudflare: Durable Objects WebSocket
 */

// Types
export type {
  Unsubscribe,
  MinimalHTTPServer,
  SendReliableOptions,
  ConnectionState,
  ChannelConnection,
  ChannelServer,
  ChannelServerOptions,
  ChannelClient,
  ChannelClientOptions,
  ChannelServerProvider,
  ChannelClientProvider,
} from "./types";

// Protocol (reliable delivery)
export type { ReliableWrapper, AckMessage } from "./protocol";
export {
  isReliableWrapper,
  isAckMessage,
  wrapMessage,
  createAck,
  unwrapMessage,
  generateMessageId,
} from "./protocol";

// JSON-RPC 2.0 Protocol
export type {
  RpcMethod,
  NotificationMethod,
  RpcRequest,
  RpcSuccessResponse,
  RpcErrorResponse,
  RpcNotification,
  StreamEventParams,
  ControlAckParams,
} from "./jsonrpc";
export {
  JsonRpcError,
  RpcErrorCodes,
  createRequest,
  createNotification,
  createStreamEvent,
  createAckNotification,
  createSuccessResponse,
  createErrorResponse,
  parseMessage,
  parseMessageObject,
  isRequest,
  isNotification,
  isSuccessResponse,
  isErrorResponse,
  isInvalid,
  isStreamEvent,
  isControlAck,
  eventTypeToRpcMethod,
  rpcMethodToResponseType,
} from "./jsonrpc";

// RPC Client
export type { RpcClientConfig, RpcClientState } from "./RpcClient";
export { RpcClient } from "./RpcClient";
