/**
 * Step definitions for mirror events feature
 */

import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert";
import { MirrorWorld } from "./world";

// ============================================================================
// Given Steps
// ============================================================================

Given("a MirrorRuntime instance is created with MockPeer", function (this: MirrorWorld) {
  // Already done in Before hook
  assert.ok(this.runtime, "runtime should exist");
  assert.ok(this.peer, "peer should exist");
});

Given("I am subscribed to mirror events", function (this: MirrorWorld) {
  this.subscribeToEvents();
});

Given("the peer is connected", function (this: MirrorWorld) {
  this.peer.setUpstreamState("connected");
  // Clear events from connection
  this.receivedEvents = [];
});

// ============================================================================
// When Steps - Connection
// ============================================================================

When("the peer upstream state changes to {string}", function (this: MirrorWorld, state: string) {
  this.peer.setUpstreamState(state as any);
});

// ============================================================================
// When Steps - Container
// ============================================================================

When("I create a container with id {string} on mirror", function (this: MirrorWorld, containerId: string) {
  const container = this.runtime.createContainer(containerId);
  this.containers.set(containerId, container);
});

// ============================================================================
// When Steps - Upstream Events
// ============================================================================

When("the upstream sends a {string} event with text {string}", function (this: MirrorWorld, eventType: string, text: string) {
  this.peer.triggerUpstreamEvent({
    type: eventType,
    timestamp: Date.now(),
    source: "environment",
    category: "stream",
    intent: "notification",
    data: { text },
  } as any);
});

When("the upstream sends a {string} event", function (this: MirrorWorld, eventType: string) {
  this.peer.triggerUpstreamEvent({
    type: eventType,
    timestamp: Date.now(),
    source: "environment",
    category: "stream",
    intent: "notification",
    data: {},
  } as any);
});

When("the upstream sends a {string} event for container {string}", function (this: MirrorWorld, eventType: string, containerId: string) {
  this.peer.triggerUpstreamEvent({
    type: eventType,
    timestamp: Date.now(),
    source: "container",
    category: "lifecycle",
    intent: "notification",
    data: { containerId },
    context: { containerId },
  } as any);
});

// ============================================================================
// Then Steps - Event Type
// ============================================================================

Then("I should receive event with type {string}", function (this: MirrorWorld, expectedType: string) {
  const event = this.findEventByType(expectedType);
  assert.ok(event, `Expected to receive event with type "${expectedType}", but received: ${this.receivedEvents.map(e => e.type).join(", ")}`);
});

Then("I should not receive any events", function (this: MirrorWorld) {
  assert.strictEqual(this.receivedEvents.length, 0);
});

// ============================================================================
// Then Steps - Event Properties
// ============================================================================

Then("the event should have source {string}", function (this: MirrorWorld, expectedSource: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.strictEqual(event.source, expectedSource);
});

Then("the event should have category {string}", function (this: MirrorWorld, expectedCategory: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.strictEqual(event.category, expectedCategory);
});

Then("the event should have intent {string}", function (this: MirrorWorld, expectedIntent: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.strictEqual(event.intent, expectedIntent);
});

Then("the event should have property {string}", function (this: MirrorWorld, propertyName: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.ok(propertyName in event, `event should have property "${propertyName}"`);
});

Then("the event data should contain text {string}", function (this: MirrorWorld, expectedText: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.strictEqual(event.data?.text, expectedText);
});

Then("the event context should have containerId {string}", function (this: MirrorWorld, expectedContainerId: string) {
  const event = this.getLastEvent() as any;
  assert.ok(event, "event should exist");
  assert.ok(event.context, "event should have context");
  assert.strictEqual(event.context.containerId, expectedContainerId);
});
