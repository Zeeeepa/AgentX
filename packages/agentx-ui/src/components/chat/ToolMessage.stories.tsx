import type { Meta, StoryObj } from "@storybook/react";
import { ToolMessage } from "./ToolMessage";

const meta: Meta<typeof ToolMessage> = {
  title: "Chat/ToolMessage",
  component: ToolMessage,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Display a tool execution result with distinctive styling. Shows tool call ID and result content with proper formatting.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolMessage>;

/**
 * Tool result with simple text output
 */
export const TextOutput: Story = {
  args: {
    message: {
      id: "1",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_abc123",
          name: "create_file",
          output: {
            type: "text",
            value: "File successfully created at /src/components/Button.tsx",
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with JSON data
 */
export const JsonData: Story = {
  args: {
    message: {
      id: "2",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_def456",
          name: "read_file",
          output: {
            type: "text",
            value: `{
  "name": "@deepractice-ai/agent",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with error message
 */
export const ErrorResult: Story = {
  args: {
    message: {
      id: "3",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_ghi789",
          name: "tool_operation",
          output: {
            type: "text",
            value: "Error: File not found at path /src/nonexistent.ts",
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with file list
 */
export const FileList: Story = {
  args: {
    message: {
      id: "4",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_jkl012",
          name: "tool_operation",
          output: {
            type: "text",
            value: `Directory listing for /src/components:
- Button.tsx
- Input.tsx
- Modal.tsx
- Card.tsx
- Avatar.tsx`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with command output
 */
export const CommandOutput: Story = {
  args: {
    message: {
      id: "5",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_mno345",
          name: "tool_operation",
          output: {
            type: "text",
            value: `$ npm test

> @deepractice-ai/agent@0.1.0 test
> vitest run

✓ src/components/Button.test.tsx (3)
✓ src/components/Input.test.tsx (5)
✓ src/utils/helpers.test.ts (8)

Test Files  3 passed (3)
Tests  16 passed (16)`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with success message
 */
export const SuccessMessage: Story = {
  args: {
    message: {
      id: "6",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_pqr678",
          name: "tool_operation",
          output: {
            type: "text",
            value: "✓ Successfully installed 42 packages in 3.2s",
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with structured data
 */
export const StructuredData: Story = {
  args: {
    message: {
      id: "7",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_stu901",
          name: "tool_operation",
          output: {
            type: "text",
            value: `Git Status:
Branch: main
Status: clean
Untracked files: 0
Modified files: 3
  - src/App.tsx
  - src/components/Header.tsx
  - package.json`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with long output
 */
export const LongOutput: Story = {
  args: {
    message: {
      id: "8",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_vwx234",
          name: "tool_operation",
          output: {
            type: "text",
            value: `Installed dependencies:

@anthropic-ai/sdk@0.20.0
@vitejs/plugin-react@4.2.1
react@18.2.0
react-dom@18.2.0
typescript@5.3.3
vite@5.0.0
vitest@1.2.0
eslint@8.56.0
prettier@3.2.0
tailwindcss@3.4.0

Total packages: 342
Total size: 124.3 MB
Installation time: 8.7s`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Multiple tool messages in sequence
 */
export const MultipleToolCalls: Story = {
  render: () => (
    <div className="space-y-4">
      <ToolMessage
        message={{
          id: "1",
          role: "tool",
          content: [
            {
              type: "tool-result",
              id: "call_001",
              name: "read_file",
              output: {
                type: "text",
                value: "Reading file: package.json",
              },
            },
          ],
          timestamp: Date.now() - 60000,
        }}
      />
      <ToolMessage
        message={{
          id: "2",
          role: "tool",
          content: [
            {
              type: "tool-result",
              id: "call_002",
              name: "analyze",
              output: {
                type: "text",
                value: "Analyzing dependencies...",
              },
            },
          ],
          timestamp: Date.now() - 30000,
        }}
      />
      <ToolMessage
        message={{
          id: "3",
          role: "tool",
          content: [
            {
              type: "tool-result",
              id: "call_003",
              name: "check_updates",
              output: {
                type: "text",
                value: "Found 3 outdated packages: react, vite, typescript",
              },
            },
          ],
          timestamp: Date.now(),
        }}
      />
    </div>
  ),
};

/**
 * Tool result with empty output
 */
export const EmptyOutput: Story = {
  args: {
    message: {
      id: "9",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_yz567",
          name: "tool_operation",
          output: {
            type: "text",
            value: "",
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};

/**
 * Tool result with multiline formatted output
 */
export const FormattedOutput: Story = {
  args: {
    message: {
      id: "10",
      role: "tool",
      content: [
        {
          type: "tool-result",
          id: "call_abc890",
          name: "tool_operation",
          output: {
            type: "text",
            value: `Search Results:
================

Match 1: src/components/Button.tsx:15
  const handleClick = () => {

Match 2: src/components/Modal.tsx:28
  const handleClick = useCallback(() => {

Match 3: src/utils/events.ts:42
  function handleClick(event) {

Total matches: 3`,
          },
        },
      ],
      timestamp: Date.now(),
    },
  },
};
