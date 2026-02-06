@journey @developer @pending
Feature: Log Level Configuration
  A developer embedding AgentX in tests, CLI tools, or production apps
  needs to control log verbosity through a single option.
  Today this requires manually importing commonxjs/logger and node-platform —
  it should be one line in AgentXConfig.

  Background:
    Given a local AgentX environment with provider "anthropic"

  Scenario: Silence all logs with logLevel option
    # Current pain: developer must import createNodePlatform + setLoggerFactory
    # Expected: just pass logLevel to createAgentX
    When I create AgentX with logLevel "silent"
    And I create a container "quiet-app"
    And I create an image "Assistant" in "quiet-app" with prompt "Say hello"
    And I run the image as an agent
    And I send message "Hi"
    Then I should receive a non-empty reply
    And stderr should contain no log output

  Scenario: Debug logs for troubleshooting
    When I create AgentX with logLevel "debug"
    And I create a container "debug-app"
    And I create an image "Assistant" in "debug-app" with prompt "Say hello"
    And I run the image as an agent
    Then stderr should contain "DEBUG"
