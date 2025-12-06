@request @image
Feature: agentx.request() - Image Commands
  Agent snapshot and resume through request/response pattern.

  Background:
    Given an AgentX instance
    And container "test-container" exists

  # ============================================================================
  # image_snapshot_request
  # ============================================================================

  @image_snapshot
  Scenario: request("image_snapshot_request", { agentId }) creates image
    Given agent "my-agent" exists in container "test-container"
    When I call agentx.request("image_snapshot_request", { agentId: "my-agent" })
    Then I should receive a "image_snapshot_response" event
    And response.data.record should be defined
    And response.data.record.imageId should be defined
    And response.data.record.agentId should be "my-agent"
    And response.data.error should be undefined

  @image_snapshot
  Scenario: request("image_snapshot_request") on non-existent agent fails
    When I call agentx.request("image_snapshot_request", { agentId: "non-existent" })
    Then I should receive a "image_snapshot_response" event
    And response.data.error should be defined

  # ============================================================================
  # image_list_request
  # ============================================================================

  @image_list
  Scenario: request("image_list_request", {}) returns empty list
    When I call agentx.request("image_list_request", {})
    Then I should receive a "image_list_response" event
    And response.data.records should be an empty array

  @image_list
  Scenario: request("image_list_request", {}) returns all images
    Given agent "agent-1" exists in container "test-container"
    And agent "agent-1" has been snapshotted
    When I call agentx.request("image_list_request", {})
    Then I should receive a "image_list_response" event
    And response.data.records should have length 1

  # ============================================================================
  # image_get_request
  # ============================================================================

  @image_get
  Scenario: request("image_get_request", { imageId }) returns existing image
    Given agent "my-agent" exists in container "test-container"
    And agent "my-agent" has been snapshotted as "my-image"
    When I call agentx.request("image_get_request", { imageId: "my-image" })
    Then I should receive a "image_get_response" event
    And response.data.record should be defined
    And response.data.record.imageId should be "my-image"

  @image_get
  Scenario: request("image_get_request", { imageId }) returns null for non-existent
    When I call agentx.request("image_get_request", { imageId: "non-existent" })
    Then I should receive a "image_get_response" event
    And response.data.record should be null

  # ============================================================================
  # image_resume_request
  # ============================================================================

  @image_resume
  Scenario: request("image_resume_request", { imageId }) creates agent from image
    Given agent "my-agent" exists in container "test-container"
    And agent "my-agent" has been snapshotted as "my-image"
    When I call agentx.request("image_resume_request", { imageId: "my-image" })
    Then I should receive a "image_resume_response" event
    And response.data.agentId should be defined
    And response.data.containerId should be "test-container"
    And response.data.error should be undefined

  @image_resume
  Scenario: request("image_resume_request") on non-existent image fails
    When I call agentx.request("image_resume_request", { imageId: "non-existent" })
    Then I should receive a "image_resume_response" event
    And response.data.error should be defined

  # ============================================================================
  # image_delete_request
  # ============================================================================

  @image_delete
  Scenario: request("image_delete_request", { imageId }) deletes image
    Given agent "my-agent" exists in container "test-container"
    And agent "my-agent" has been snapshotted as "my-image"
    When I call agentx.request("image_delete_request", { imageId: "my-image" })
    Then I should receive a "image_delete_response" event
    And response.data.imageId should be "my-image"
    And response.data.error should be undefined
    And image "my-image" should not exist
