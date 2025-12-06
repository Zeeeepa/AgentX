@server
Feature: agentx.listen() and agentx.close() - Server Mode
  Start and stop WebSocket server for remote connections.

  # ============================================================================
  # listen(port, host?): Promise<void>
  # ============================================================================

  @listen
  Scenario: listen(port) starts WebSocket server
    Given an AgentX instance in local mode
    When I call agentx.listen(5200)
    Then the promise should resolve
    And WebSocket server should be running on port 5200

  @listen
  Scenario: listen(port, host) starts server on specific host
    Given an AgentX instance in local mode
    When I call agentx.listen(5201, "127.0.0.1")
    Then the promise should resolve
    And WebSocket server should be running on 127.0.0.1:5201

  @listen
  Scenario: listen() throws when already listening
    Given an AgentX instance in local mode
    And agentx is already listening on port 5202
    When I call agentx.listen(5203)
    Then it should throw "Server already listening"

  @listen @remote
  Scenario: listen() throws in remote mode
    Given an AgentX instance in remote mode
    When I call agentx.listen(5204)
    Then it should throw "Cannot listen in remote mode"

  # ============================================================================
  # close(): Promise<void>
  # ============================================================================

  @close
  Scenario: close() stops the server
    Given an AgentX instance in local mode
    And agentx is listening on port 5205
    When I call agentx.close()
    Then the promise should resolve
    And WebSocket server should be stopped

  @close
  Scenario: close() is idempotent when not listening
    Given an AgentX instance in local mode
    When I call agentx.close()
    Then the promise should resolve

  # ============================================================================
  # Remote Client Connection
  # ============================================================================

  @remote @integration
  Scenario: Remote client can connect and send requests
    Given an AgentX server listening on port 5206
    And an AgentX client connected to "ws://localhost:5206"
    When client calls request("container_create_request", { containerId: "remote-test" })
    Then client should receive "container_create_response"
    And response.data.containerId should be "remote-test"

  @remote @integration
  Scenario: Remote client receives stream events
    Given an AgentX server listening on port 5207
    And server has container "test-container" with agent "my-agent"
    And an AgentX client connected to "ws://localhost:5207"
    And client is subscribed to "text_delta" events
    When client sends message to agent "my-agent"
    Then client should receive "text_delta" events

  @remote @integration
  Scenario: Multiple clients can connect
    Given an AgentX server listening on port 5208
    And client-1 connected to "ws://localhost:5208"
    And client-2 connected to "ws://localhost:5208"
    When client-1 creates container "c1"
    And client-2 creates container "c2"
    Then both containers should exist on server
