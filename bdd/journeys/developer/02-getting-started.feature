@journey @developer
Feature: Getting Started with AgentX SDK
  As a developer, I need a clear path from install to a working agent,
  so I can integrate AgentX into my application without reading source code.

  # ============================================================================
  # Core Concepts
  # ============================================================================

  Scenario: Developer understands the four-layer data model
    Given I am new to AgentX
    When I read the getting started guide
    Then I should understand these concepts:
      | concept   | what it is                              | analogy              |
      | Container | Namespace grouping related agents       | A project folder     |
      | Image     | Persistent agent config (prompt, tools) | A Docker image       |
      | Session   | Message history for an image            | A conversation log   |
      | Agent     | Running instance of an image            | A Docker container   |
    And the relationship is: Container > Image > Session + Agent

  # ============================================================================
  # Local Mode — Zero Infrastructure
  # ============================================================================

  Scenario: Developer creates first agent in local mode
    Given I have installed agentxjs with "bun add agentxjs"
    And I have an Anthropic API key
    When I write this code:
      """
      import { createAgentX } from "agentxjs";

      const agentx = await createAgentX({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      await agentx.containers.create("my-app");

      const { record: image } = await agentx.images.create({
        containerId: "my-app",
        name: "Assistant",
        systemPrompt: "You are a helpful assistant.",
      });

      const { agentId } = await agentx.agents.create({
        imageId: image.imageId,
      });

      agentx.on("text_delta", (e) => process.stdout.write(e.data.text));
      agentx.on("message_stop", () => {
        console.log();
        agentx.dispose();
      });

      await agentx.sessions.send(agentId, "Hello, who are you?");
      """
    Then I should see a streaming response from the agent
    And no server or database is needed

  Scenario: Developer understands local mode config options
    Given I am using local mode
    Then I can customize these options:
      | option    | default      | purpose                        |
      | apiKey    | (required)   | LLM provider API key           |
      | provider  | "anthropic"  | LLM provider to use            |
      | model     | (provider default) | Specific model to use    |
      | baseUrl   | (provider default) | Custom API endpoint      |
      | dataPath  | ":memory:"   | Where to persist data          |
    And supported providers include:
      | provider   |
      | anthropic  |
      | openai     |
      | google     |
      | deepseek   |
      | mistral    |
      | xai        |

  # ============================================================================
  # Remote Mode — Client/Server Architecture
  # ============================================================================

  Scenario: Developer understands when to use local vs remote mode
    Given I am choosing between local and remote mode
    Then the guide should explain:
      | mode   | use when                                     |
      | Local  | Prototyping, CLI tools, single-user apps     |
      | Remote | Web apps, multi-tenant, shared infrastructure |
    And the client API is identical in both modes
    # The only difference is the createAgentX config

  Scenario: Developer sets up a remote server
    Given I need multi-user support
    When I set up a server:
      """
      import { createServer } from "@agentxjs/server";
      import { createNodePlatform } from "@agentxjs/node-platform";
      import { createMonoDriver } from "@agentxjs/mono-driver";

      const server = await createServer({
        platform: await createNodePlatform({ dataPath: "./data" }),
        createDriver: (config) => createMonoDriver({
          ...config,
          apiKey: process.env.ANTHROPIC_API_KEY,
          options: { provider: "anthropic" },
        }),
        port: 5200,
      });

      await server.listen();
      """
    Then clients can connect via WebSocket

  Scenario: Developer connects a client to remote server
    Given a server is running on port 5200
    When I connect with:
      """
      const agentx = await createAgentX({
        serverUrl: "ws://localhost:5200",
      });
      """
    Then I can use the exact same API as local mode
    # containers.create, images.create, agents.create, sessions.send...

  # ============================================================================
  # Stream Events
  # ============================================================================

  Scenario: Developer handles streaming responses
    Given I have a running agent
    Then I can subscribe to these stream events:
      | event          | data               | meaning                |
      | message_start  | messageId, model   | LLM starts responding  |
      | text_delta     | text               | Incremental text chunk |
      | tool_use_start | toolName           | Tool call begins       |
      | tool_result    | toolCallId, result | Tool execution result  |
      | message_stop   | stopReason         | Response complete      |
      | error          | message            | Error occurred         |
    And I subscribe via agentx.on("event_name", handler)

  # ============================================================================
  # Presentation API — UI Integration
  # ============================================================================

  Scenario: Developer builds a chat UI with the Presentation API
    Given I need structured conversation state for a UI
    When I use the Presentation API:
      """
      const presentation = agentx.presentations.create(agentId, {
        onUpdate: (state) => {
          // state.conversations — completed messages
          // state.streaming — current streaming response (or null)
          // state.status — "idle" | "thinking" | "responding" | "executing"
          renderUI(state);
        },
      });

      await presentation.send("What is the weather?");
      """
    Then the onUpdate callback fires with structured PresentationState
    And I don't need to manually aggregate stream events
    # Presentation handles text_delta, tool_use, message_stop internally

  # ============================================================================
  # MCP Tools
  # ============================================================================

  Scenario: Developer adds tools to an agent via MCP
    Given I want my agent to use external tools
    When I create an image with MCP servers:
      """
      const { record: image } = await agentx.images.create({
        containerId: "my-app",
        name: "Agent with Tools",
        systemPrompt: "You can access the filesystem.",
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["@modelcontextprotocol/server-filesystem", "/tmp"],
          },
        },
      });
      """
    Then agents created from this image can use those tools
    And tool execution events appear in the stream
