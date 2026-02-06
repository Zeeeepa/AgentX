@journey @contributor
Feature: AgentX Connection
  As a contributor, I integrate AgentX WebSocket server into Portagent,
  so users can chat with AI agents via the standard agentxjs SDK.

  # ============================================================================
  # Architecture: Embedded WebSocket Server
  # ============================================================================
  #
  #   Browser                    Portagent (Next.js + WS)
  #  ┌────────────┐             ┌─────────────────────┐
  #  │  agentxjs  │ ─ WS ─────→ │  WebSocket :3000/ws │
  #  │  (SDK)     │ ← JSON-RPC  │    ↓                │
  #  └────────────┘             │  @agentxjs/server   │
  #                             │    ↓                │
  #                             │  Claude API         │
  #                             └─────────────────────┘
  #

  # ============================================================================
  # Dependencies
  # ============================================================================

  Scenario: AgentX packages are integrated
    Given the portagent project
    Then package.json should have "@agentxjs/server" dependency
    And package.json should have "@agentxjs/node-platform" dependency
    And package.json should have "@agentxjs/mono-driver" dependency

  # ============================================================================
  # End-to-End: User chats with AI agent
  # ============================================================================

  @ui @pending
  Scenario: User sends message and receives AI response
    Given I am logged in as admin "admin@example.com"
    When I type "Hello" in the prompt
    And I press Enter
    Then my message should appear in conversation
    And I should see an AI response in conversation

  @ui @pending
  Scenario: AI response streams into the UI
    Given I am logged in as admin "admin@example.com"
    When I type "Say hi" in the prompt
    And I press Enter
    Then I should see the response appearing progressively

  # ============================================================================
  # Waiting / Loading State
  # ============================================================================

  @ui
  Scenario: User sees thinking indicator while waiting for AI
    Given I am logged in as admin "admin@example.com"
    When I type "Hello" in the prompt
    And I press Enter
    Then I should see a thinking indicator (animated dots)
    And the prompt input should be disabled
    And the send button should be disabled
    When the AI starts streaming its response
    Then the thinking indicator should disappear
    And the streaming text should appear in conversation

  @ui
  Scenario: Input is re-enabled after AI finishes responding
    Given I am logged in as admin "admin@example.com"
    And the AI has finished responding
    Then the prompt input should be enabled
    And the send button should be enabled

  # ============================================================================
  # Tool Execution Display
  # ============================================================================
  #
  #  Tool call rendered as a collapsible card:
  #  ┌──────────────────────────────────────────┐
  #  │  [spinner] bash_tool               [▼]   │
  #  └──────────────────────────────────────────┘
  #  When expanded:
  #  ┌──────────────────────────────────────────┐
  #  │  [✓] bash_tool                     [▲]   │
  #  ├──────────────────────────────────────────┤
  #  │  Input                                    │
  #  │  { "command": "ls -la" }                  │
  #  │  Result                                   │
  #  │  total 64 ...                             │
  #  └──────────────────────────────────────────┘
  #

  @ui
  Scenario: Tool calls are displayed in conversation
    Given I am logged in as admin "admin@example.com"
    When the AI uses a tool "bash_tool" with input {"command": "ls"}
    Then I should see a tool call card showing "bash_tool"
    And the card should show a status icon (spinner while running, checkmark when done)

  @ui
  Scenario: Tool call details are expandable
    Given I am logged in as admin "admin@example.com"
    And the AI has completed a tool call "bash_tool"
    When I click the tool call card
    Then I should see the tool input JSON
    And I should see the tool result

  @ui
  Scenario: Text and tool calls render in order
    Given I am logged in as admin "admin@example.com"
    When the AI responds with text, then a tool call, then more text
    Then the conversation should show all three blocks in order:
      | type | content                     |
      | text | "Let me check that for you" |
      | tool | bash_tool                   |
      | text | "Here are the results"      |

  # ============================================================================
  # Session Persistence
  # ============================================================================
  #
  #  On page load / refresh:
  #  1. Connect WebSocket
  #  2. client.images.list(containerId) → get all saved images
  #  3. For each image, client.agents.create({ imageId }) → resume agent
  #  4. Populate sidebar with image names
  #
  #  On select session:
  #  - Create presentation for the agent
  #  - presentation.getState() → restore conversation history
  #

  @ui
  Scenario: Sessions persist after page refresh
    Given I am logged in as admin "admin@example.com"
    And I have sent "Hello" in a conversation
    When I refresh the page
    Then I should see the session in the sidebar
    When I click the session
    Then I should see the previous conversation including "Hello"
    # images.list(containerId) loads saved images on init
    # agents.create({ imageId }) + await presentations.create() on select (lazy, loads history)

  @ui
  Scenario: Multiple sessions are restored on refresh
    Given I am logged in as admin "admin@example.com"
    And I have two conversations: "Chat A" and "Chat B"
    When I refresh the page
    Then I should see both sessions in the sidebar
    And I can switch between them to see their histories

  @ui
  Scenario: Empty state when user has no sessions
    Given I am logged in as a new user with no previous conversations
    When the page loads
    Then I should see "Start a new conversation" prompt
    And the sidebar should show no sessions

  # ============================================================================
  # Session Deletion
  # ============================================================================

  @ui
  Scenario: User deletes a session
    Given I am logged in as admin "admin@example.com"
    And I have a conversation with "Hello"
    When I hover over the session in the sidebar
    Then I should see a delete button
    When I click the delete button
    Then the session should be removed from the sidebar
    And the conversation area should show empty state
    # calls client.images.delete(imageId) to remove from server

  @ui
  Scenario: Deleting non-active session keeps current view
    Given I am logged in as admin "admin@example.com"
    And I have two conversations
    And the second conversation is active
    When I delete the first conversation
    Then the first session should be removed from the sidebar
    And the second conversation should still be visible

  # ============================================================================
  # Data Model
  # ============================================================================
  #
  # Each user has:
  # - One container (containerId = `user-{userId}`)
  # - Multiple images (conversations)
  # - Sessions are auto-created per image
  #
  # Mapping:
  # - Portagent "session" UI = AgentX "image"
  # - New chat = create new image
  # - Switch session = switch image
  #
  # Restoration:
  # - images.list(containerId) → list saved images
  # - agents.create({ imageId }) → resume/create agent for image
  # - await presentations.create(agentId) → get conversation state (with history)
  #

  # ============================================================================
  # API Design
  # ============================================================================
  #
  # WebSocket endpoint: /ws
  # Protocol: JSON-RPC 2.0 (standard AgentX protocol)
  #
  # HTTP endpoints (for session management):
  # GET  /api/chat/sessions          → list user's images
  # POST /api/chat/sessions          → create new image
  # GET  /api/chat/sessions/:id      → get image details + messages
  # DELETE /api/chat/sessions/:id    → delete image
  #
  # WebSocket is used for:
  # - message.send (real-time streaming)
  # - Stream events (text_delta, etc.)
  #
