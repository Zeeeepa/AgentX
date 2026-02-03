@devtools
Feature: Devtools SDK
  As a developer
  I want to use the devtools SDK for VCR-style fixture management
  So that I can easily record and replay LLM responses for testing

  Background:
    Given I initialize devtools with fixtures directory "devtools"

  @vcr
  Scenario: Load existing fixture and create MockDriver
    Given a fixture "simple-hello" exists with a simple reply
    When I get a driver for "simple-hello" with message "Hello!"
    Then the driver should be a MockDriver
    And the fixture should not be re-recorded

  @vcr
  Scenario: Record new fixture when not exists
    Given no fixture "new-greeting" exists
    When I get a driver for "new-greeting" with message "Hi there!"
    Then a new fixture "new-greeting" should be created
    And the fixture should contain message_start event
    And the fixture should contain message_stop event

  @vcr
  Scenario: Force re-record existing fixture
    Given a fixture "force-test" exists with a simple reply
    When I get a driver for "force-test" with message "Hello again!" and force record
    Then the fixture "force-test" should be updated

  @mock
  Scenario: MockDriver plays back fixture events
    Given a fixture "playback-test" with text response "Hello, world!"
    When I create a MockDriver with fixture "playback-test"
    And I connect the driver and send a user message
    Then I should receive text_delta events
    And the combined text should be "Hello, world!"

  @record
  Scenario: RecordingDriver captures LLM events
    Given I have a real Claude driver
    When I wrap it with RecordingDriver named "record-test"
    And I send a message "What is 2+2?"
    Then the recording should contain events
    And I can save the fixture to a file

  @factory
  Scenario: Get DriverFactory from devtools
    Given a fixture "factory-test" exists with a simple reply
    When I get a DriverFactory for "factory-test"
    Then I can use it to create drivers
    And the drivers use the fixture for playback
