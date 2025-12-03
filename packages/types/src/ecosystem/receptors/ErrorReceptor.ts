import type { Receptor } from "~/ecosystem/Receptor";
import type { ErrorEnvEvent } from "../event";

/**
 * ErrorReceptor - Senses error events.
 *
 * Responsible for detecting:
 * - error: Error occurred in the ecosystem
 */
export interface ErrorReceptor extends Receptor<ErrorEnvEvent> {}
