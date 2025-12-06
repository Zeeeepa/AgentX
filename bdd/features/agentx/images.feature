Feature: ImagesAPI
  As a developer
  I want to manage images via agentx.images
  So that I can snapshot and restore agent state

  Background:
    Given I have an AgentX instance
    And I have a running agent

  # ============================================================================
  # Snapshot
  # ============================================================================

  Scenario: Snapshot an agent
    When I call agentx.images.snapshot with the agent id
    Then it should return an AgentImage
    And the image should have an id
    And the image should reference the agent id

  Scenario: Snapshot agent after conversation
    Given the agent has received messages
    When I call agentx.images.snapshot with the agent id
    Then the image should contain the conversation history

  Scenario: Snapshot non-existent agent
    When I call agentx.images.snapshot with "non-existent-id"
    Then it should throw an error

  # ============================================================================
  # Get
  # ============================================================================

  Scenario: Get image by id
    Given I have created an image
    When I call agentx.images.get with the image id
    Then it should return the image

  Scenario: Get non-existent image
    When I call agentx.images.get with "non-existent-id"
    Then it should return null

  # ============================================================================
  # List
  # ============================================================================

  Scenario: List all images
    Given I have created 3 images
    When I call agentx.images.list()
    Then it should return an array of 3 images

  # ============================================================================
  # Delete
  # ============================================================================

  Scenario: Delete an image
    Given I have created an image
    When I call agentx.images.delete with the image id
    Then the image should be deleted
    And agentx.images.get with the image id should return null

  # ============================================================================
  # Resume
  # ============================================================================

  Scenario: Resume agent from image
    Given I have created an image from an agent with conversation history
    When I call image.resume()
    Then it should return a new Agent
    And the agent should have the conversation history from the image

  Scenario: Resume creates new agent
    Given I have created an image
    When I call image.resume()
    Then the new agent should have a different id than the original
