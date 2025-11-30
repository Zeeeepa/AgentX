/**
 * InputPane Stories
 *
 * Business container for user input.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { InputPane } from "./InputPane";

const meta: Meta<typeof InputPane> = {
  title: "Container/InputPane",
  component: InputPane,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "InputPane wraps InputBox with business styling for Panel layout. Designed to be used inside a resizable Allotment.Pane.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-64 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InputPane>;

/**
 * Default state
 */
export const Default: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    disabled: false,
  },
};

/**
 * Disabled state (agent is processing)
 */
export const Disabled: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    disabled: true,
  },
};

/**
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    placeholder: "Ask me anything about code refactoring...",
    disabled: false,
  },
};

/**
 * Without image button
 */
export const NoImageButton: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    showImageButton: false,
    disabled: false,
  },
};

/**
 * With image attach handler
 */
export const WithImageAttach: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    onImageAttach: (files) =>
      console.log(
        "Images attached:",
        files.map((f) => f.name)
      ),
    disabled: false,
  },
};

/**
 * In small height (80px minimum)
 */
export const SmallHeight: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="h-20 bg-background">
        <Story />
      </div>
    ),
  ],
};

/**
 * In large height (400px maximum)
 */
export const LargeHeight: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    placeholder: "Type a long message... (plenty of space)",
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="h-96 bg-background">
        <Story />
      </div>
    ),
  ],
};

/**
 * Custom styling
 */
export const CustomStyling: Story = {
  args: {
    onSend: (text) => console.log("Sent:", text),
    disabled: false,
    className: "bg-blue-50 border-t-2 border-blue-500",
  },
};
