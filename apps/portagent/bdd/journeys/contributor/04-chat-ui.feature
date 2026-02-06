@journey @contributor @ui
Feature: Chat UI with Sidebar
  As a contributor, I build the main chat interface with sidebar,
  so users can manage sessions and have conversations in one place.

  # ============================================================================
  # Layout Structure
  # ============================================================================
  #
  #  ┌──────────────┬────────────────────────────────────────┐
  #  │   Sidebar    │           Main Area                    │
  #  │              │                                        │
  #  │ [+ New Chat] │        Conversation                    │
  #  │              │                                        │
  #  │  Sessions    │                                        │
  #  │  ─────────── │                                        │
  #  │  session 1   │                                        │
  #  │  session 2   │                                        │
  #  │              │                                        │
  #  │  ─────────── ├────────────────────────────────────────┤
  #  │  Admin ▼     │       Prompt Input                     │
  #  │  ─────────── │                                        │
  #  │  👤 Logout   │                                        │
  #  └──────────────┴────────────────────────────────────────┘
  #

  # ============================================================================
  # User Journeys
  # ============================================================================

  @chat @layout
  Scenario: User explores chat interface layout
    Given I am logged in as admin "admin@example.com"

    # Main layout check
    Then I should see a collapsible sidebar
    And I should see a main conversation area
    And I should see a prompt input at the bottom

    # Sidebar toggle
    When I click the sidebar toggle
    Then the sidebar should collapse
    And the main area should expand

    When I click the sidebar toggle
    Then the sidebar should expand

  @chat @session
  Scenario: User manages chat sessions
    Given I am logged in as admin "admin@example.com"

    # Empty state
    Then I should see "Start a new conversation" prompt

    # Send first message
    When I type "Hello" in the prompt
    And I press Enter
    Then my message should appear in conversation
    And the input should be cleared
    And this session should appear in sidebar

    # Create new session
    When I click "New Chat"
    Then the conversation area should be empty
    And I should see two sessions in sidebar

    # Switch between sessions
    When I click the first session
    Then I should see "Hello" in conversation

  @chat @admin
  Scenario: Admin sees admin menu, regular user does not
    # Admin view
    Given I am logged in as admin "admin@example.com"
    Then I should see "Admin" in sidebar
    And I should see "Invite Codes" option

    # Logout and login as regular user
    When I logout
    And I am logged in as user "user@example.com"
    Then I should NOT see "Admin" in sidebar
    And I should see my email in sidebar
    And I should see logout option

  # ============================================================================
  # IME (Input Method) Support
  # ============================================================================

  @chat @ime
  Scenario: IME composition does not trigger send
    Given I am logged in as admin "admin@example.com"
    When I start composing Chinese text with IME
    And I press Space to select a candidate
    Then the message should NOT be sent
    And the selected text should appear in the input
    When I finish composing and press Enter
    Then the message should be sent
    # Implementation: check e.nativeEvent.isComposing || e.keyCode === 229

  # ============================================================================
  # Markdown Rendering
  # ============================================================================

  @chat @markdown
  Scenario: AI responses render as markdown
    Given I am logged in as admin "admin@example.com"
    When the AI responds with markdown content
    Then bold text should render as **bold**
    And code blocks should render with syntax highlighting
    And lists should render as proper HTML lists
    And links should be clickable
    # Uses react-markdown + remark-gfm + @tailwindcss/typography

  @chat @markdown
  Scenario: User messages remain plain text
    Given I am logged in as admin "admin@example.com"
    When I type "**not bold**" in the prompt
    And I press Enter
    Then my message should display as plain text "**not bold**"
    # Only assistant messages use markdown rendering

  # ============================================================================
  # Components Reference
  # ============================================================================
  #
  # Sidebar:
  #   - shadcn/ui: Sheet (mobile), ScrollArea, Button
  #   - Custom: SessionList, AdminMenu
  #
  # Main Area:
  #   - Message display: react-markdown + remark-gfm (assistant only)
  #   - Tool call cards (collapsible)
  #   - Thinking indicator (animated dots)
  #   - Empty state
  #
  # Prompt Input:
  #   - shadcn/ui: Textarea, Button
  #   - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
  #   - IME-safe (isComposing check)
