/**
 * Application Module - Static resources and API layer
 *
 * ## ADR: Three-Layer Architecture (Ontological Foundation)
 *
 * Based on three fundamental ontological categories from issue #026:
 *
 * | Layer       | Ontology  | Protocol    | Content                          |
 * |-------------|-----------|-------------|----------------------------------|
 * | Application | Structure | HTTP        | Definition, Image, User          |
 * | Network     | Relation  | HTTP + WS   | Server, Client, Channel          |
 * | Ecosystem   | Process   | WS Events   | Runtime, Container, Session, Agent |
 *
 * This module defines the **Application Layer** - static structures and forms.
 *
 * ## ADR: Static vs Dynamic Resources
 *
 * Application layer contains **static resources** managed via HTTP CRUD:
 * - Definition: Agent blueprint (like Dockerfile)
 * - Image: Built artifact (like Docker Image)
 * - User: User identity
 *
 * These resources are **structure** - they don't change during runtime.
 * Dynamic resources (Agent, Session) belong to Ecosystem layer.
 *
 * ## Module Structure
 *
 * - spec/    - Static blueprints (Definition, Image)
 * - agentx/  - Platform API (Managers)
 * - user/    - User identity types
 * - common/  - Shared utilities (logger)
 * - error/   - Error type system
 * - guards/  - Runtime type guards
 *
 * @see issues/026-three-layer-architecture.md
 * @packageDocumentation
 */

export * from "./spec";
export * from "./agentx";
export * from "./user";
export * from "./common";
export * from "./error";
export * from "./guards";
