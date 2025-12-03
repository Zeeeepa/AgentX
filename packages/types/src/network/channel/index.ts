/**
 * Channel Module - Bidirectional communication for Runtime
 *
 * Channel is the transport layer that connects Runtimes (Ecosystems).
 * It belongs to the runtime level, enabling event exchange between
 * local and remote Ecosystems.
 */

export type {
  Channel,
  ChannelState,
  ChannelEventHandler,
  ChannelStateHandler,
  ChannelUnsubscribe,
} from "./Channel";
