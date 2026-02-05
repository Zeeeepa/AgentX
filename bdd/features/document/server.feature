@document @server
Feature: AgentX Server (Documentation)
  Validates code examples from the @agentxjs/server README.
  The server exposes AgentX capabilities via WebSocket + JSON-RPC.

  Scenario: Create server with platform and driver
    Given I create a server with nodePlatform and MonoDriver on a random port
    Then the server should be listening
    When I connect a client to the server
    Then the client should be connected
    When I dispose the server
    Then the server should be stopped

  Scenario: Server handles container operations
    Given I have a running test server
    And I have a client connected to the test server
    When I call "container.create" with containerId "doc-server"
    Then the response should contain containerId "doc-server"
    When I call "container.get" with containerId "doc-server"
    Then the response should show exists true
    When I call "container.list"
    Then the response should include containerId "doc-server"
