/**
 * MessagePane Stories
 *
 * Business container for message display.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { MessagePane } from "./MessagePane";

const meta: Meta<typeof MessagePane> = {
  title: "Container/MessagePane",
  component: MessagePane,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "MessagePane wraps MessageList with business logic like status indicators and error alerts.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessagePane>;

const mockMessages = [
  {
    id: "1",
    role: "user" as const,
    subtype: "user" as const,
    content: "Hello! Can you help me with this code?",
    timestamp: Date.now() - 180000,
  },
  {
    id: "2",
    role: "assistant" as const,
    subtype: "assistant" as const,
    content: "Of course! I'd be happy to help. Please share the code you're working on.",
    timestamp: Date.now() - 120000,
  },
  {
    id: "3",
    role: "user" as const,
    subtype: "user" as const,
    content:
      "Here's the function:\n\n```javascript\nfunction processData(data) {\n  return data.map(item => item * 2);\n}\n```",
    timestamp: Date.now() - 60000,
  },
  {
    id: "4",
    role: "assistant" as const,
    subtype: "assistant" as const,
    content:
      "This function looks good! It doubles each item in the array. Here are some suggestions:\n\n1. Add type safety with TypeScript\n2. Add input validation\n3. Consider edge cases",
    timestamp: Date.now() - 30000,
  },
];

const mockErrors = [
  {
    category: "llm" as const,
    code: "RATE_LIMITED" as const,
    message: "Rate limit exceeded. Please try again later.",
    severity: "warning" as const,
    recoverable: true,
  },
];

/**
 * Empty state (no messages)
 */
export const Empty: Story = {
  args: {
    messages: [],
    isLoading: false,
  },
};

/**
 * With messages
 */
export const WithMessages: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    messages: mockMessages,
    isLoading: true,
    status: "thinking",
  },
};

/**
 * Streaming response
 */
export const Streaming: Story = {
  args: {
    messages: mockMessages,
    streaming: "I'm analyzing your code and will provide detailed feedback...",
    isLoading: true,
    status: "responding",
  },
};

/**
 * With errors
 */
export const WithErrors: Story = {
  args: {
    messages: mockMessages,
    errors: mockErrors,
    isLoading: false,
  },
};

/**
 * Tool execution state
 */
export const ToolExecuting: Story = {
  args: {
    messages: mockMessages,
    isLoading: true,
    status: "awaiting_tool_result",
  },
};

/**
 * Long conversation
 */
export const LongConversation: Story = {
  args: {
    messages: [
      ...mockMessages,
      {
        id: "5",
        role: "user" as const,
        subtype: "user" as const,
        content: "What about performance optimization?",
        timestamp: Date.now() - 25000,
      },
      {
        id: "6",
        role: "assistant" as const,
        subtype: "assistant" as const,
        content:
          "Great question! For performance optimization, consider:\n\n1. Memoization for expensive calculations\n2. Virtual scrolling for large lists\n3. Code splitting for better load times",
        timestamp: Date.now() - 20000,
      },
      {
        id: "7",
        role: "user" as const,
        subtype: "user" as const,
        content: "Can you show me an example of memoization?",
        timestamp: Date.now() - 15000,
      },
      {
        id: "8",
        role: "assistant" as const,
        subtype: "assistant" as const,
        content:
          "Sure! Here's an example using React.memo:\n\n```jsx\nconst ExpensiveComponent = React.memo(({ data }) => {\n  // expensive rendering logic\n  return <div>{/* ... */}</div>;\n});\n```",
        timestamp: Date.now() - 10000,
      },
    ],
    isLoading: false,
  },
};
