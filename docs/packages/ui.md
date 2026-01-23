# @agentxjs/ui

React component library for building AI agent interfaces. Provides chat components, hooks for agent binding, and a complete design system optimized for AI streaming UX.

## Overview

`@agentxjs/ui` is a pure frontend UI package that provides:

- **React Hooks** - Connect to AgentX backend (`useAgentX`, `useAgent`, `useImages`)
- **Studio Components** - Complete chat workspace (`Studio`, `ResponsiveStudio`)
- **Entry Components** - Conversation entries (`UserEntry`, `AssistantEntry`, `ErrorEntry`)
- **Pane Components** - Layout containers (`MessagePane`, `InputPane`, `ListPane`)
- **Typography Components** - Markdown rendering (`MarkdownText`, `JSONRenderer`, `DiffViewer`)
- **Design System** - Tailwind-based theming with semantic color tokens

## Installation

```bash
bun add @agentxjs/ui
```

### Peer Dependencies

```bash
bun add react react-dom
```

### CSS Setup

Import the global styles in your application entry point:

```tsx
import "@agentxjs/ui/globals.css";
```

Or use the Tailwind preset for custom styling:

```js
// tailwind.config.js
import agentxPreset from "@agentxjs/ui/tailwind-preset";

export default {
  presets: [agentxPreset],
  content: ["./src/**/*.{ts,tsx}"],
};
```

## Quick Start

The simplest way to get started is with the `Studio` component:

```tsx
import { Studio, useAgentX } from "@agentxjs/ui";
import "@agentxjs/ui/globals.css";

function App() {
  const agentx = useAgentX("ws://localhost:5200");

  if (!agentx) return <div>Connecting...</div>;

  return <Studio agentx={agentx} />;
}
```

For responsive layouts that adapt to mobile:

```tsx
import { ResponsiveStudio, useAgentX } from "@agentxjs/ui";

function App() {
  const agentx = useAgentX("ws://localhost:5200");
  return <ResponsiveStudio agentx={agentx} containerId="user-123" />;
}
```

## Hooks

### useAgentX

Creates and manages an AgentX instance that connects to a remote server.

```tsx
import { useAgentX } from "@agentxjs/ui";

function App() {
  const agentx = useAgentX("ws://localhost:5200");

  if (!agentx) return <div>Connecting...</div>;

  return <Chat agentx={agentx} />;
}
```

**Returns:** `AgentX | null` - The AgentX instance (null during connection)

### useAgent

React hook for binding to Agent events. Manages conversation state, streaming text, and message sending.

```tsx
import { useAgent } from "@agentxjs/ui";

function ChatPage({ agentx, imageId }) {
  const {
    conversations, // ConversationData[] - all conversation entries
    streamingText, // string - current streaming text
    currentTextBlockId, // string | null - active text block ID
    status, // AgentStatus - current agent status
    errors, // UIError[] - error list
    send, // (content) => void - send message
    interrupt, // () => void - interrupt current response
    isLoading, // boolean - whether agent is processing
    clearConversations, // () => void - clear all conversations
    clearErrors, // () => void - clear errors
    agentId, // string | null - current agent ID
  } = useAgent(agentx, imageId);

  return (
    <div>
      {conversations.map((conv) => {
        switch (conv.type) {
          case "user":
            return <UserEntry key={conv.id} entry={conv} />;
          case "assistant":
            return (
              <AssistantEntry
                key={conv.id}
                entry={conv}
                streamingText={streamingText}
                currentTextBlockId={currentTextBlockId}
              />
            );
          case "error":
            return <ErrorEntry key={conv.id} entry={conv} />;
        }
      })}
    </div>
  );
}
```

**Options:**

| Option           | Type                | Description                   |
| ---------------- | ------------------- | ----------------------------- |
| `onSend`         | `(content) => void` | Callback when message is sent |
| `onError`        | `(error) => void`   | Callback on error             |
| `onStatusChange` | `(status) => void`  | Callback on status change     |

### useImages

React hook for Image (conversation) management.

```tsx
import { useImages } from "@agentxjs/ui";

function ConversationList({ agentx }) {
  const {
    images, // ImageListItem[] - all images
    isLoading, // boolean - loading state
    error, // Error | null - error state
    refresh, // () => Promise<void> - refresh images
    createImage, // (config?) => Promise<ImageListItem>
    runImage, // (imageId) => Promise<{ agentId, reused }>
    stopImage, // (imageId) => Promise<void>
    updateImage, // (imageId, updates) => Promise<ImageListItem>
    deleteImage, // (imageId) => Promise<void>
  } = useImages(agentx, { containerId: "user-123" });

  return (
    <div>
      {images.map((img) => (
        <div key={img.imageId}>
          {img.name} - {img.online ? "Online" : "Offline"}
        </div>
      ))}
    </div>
  );
}
```

### useIsMobile

Hook to detect mobile viewport.

```tsx
import { useIsMobile } from "@agentxjs/ui";

function App() {
  const isMobile = useIsMobile(); // default 768px breakpoint
  const isSmall = useIsMobile(640); // custom breakpoint

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

## Studio Components

### Studio

Complete chat workspace with sidebar and chat area.

```tsx
import { Studio } from "@agentxjs/ui";

<Studio
  agentx={agentx}
  containerId="user-123"
  sidebarWidth={280}
  collapsible={true}
  searchable={true}
  inputHeightRatio={0.25}
/>;
```

**Props:**

| Prop               | Type             | Default     | Description                     |
| ------------------ | ---------------- | ----------- | ------------------------------- |
| `agentx`           | `AgentX \| null` | -           | AgentX instance                 |
| `containerId`      | `string`         | `"default"` | Container ID for user isolation |
| `sidebarWidth`     | `number`         | `280`       | Sidebar width in pixels         |
| `collapsible`      | `boolean`        | `true`      | Enable sidebar collapse         |
| `searchable`       | `boolean`        | `true`      | Enable search in AgentList      |
| `showSaveButton`   | `boolean`        | `false`     | Show save button in Chat        |
| `inputHeightRatio` | `number`         | `0.25`      | Input area height ratio (0-1)   |

### ResponsiveStudio

Automatically switches between desktop and mobile layouts based on container width.

```tsx
import { ResponsiveStudio } from "@agentxjs/ui";

<ResponsiveStudio agentx={agentx} containerId="user-123" breakpoint={768} />;
```

## Entry Components

Entry components represent conversation entries in the chat.

### UserEntry

Displays user messages with right-aligned layout and status indicator.

```tsx
import { UserEntry } from "@agentxjs/ui";

<UserEntry
  entry={{
    type: "user",
    id: "msg_123",
    content: "Hello, can you help me?",
    timestamp: Date.now(),
    status: "success", // "pending" | "success" | "error" | "interrupted"
  }}
/>;
```

### AssistantEntry

Displays AI assistant responses with blocks (text, tools, images).

```tsx
import { AssistantEntry } from "@agentxjs/ui";

<AssistantEntry
  entry={{
    type: "assistant",
    id: "conv_123",
    messageIds: ["msg_1"],
    timestamp: Date.now(),
    status: "completed", // "queued" | "processing" | "thinking" | "streaming" | "completed"
    blocks: [
      { type: "text", id: "t1", content: "Let me check...", status: "completed" },
      {
        type: "tool",
        id: "t2",
        toolCallId: "tc1",
        name: "Bash",
        input: { command: "ls" },
        status: "success",
      },
      { type: "text", id: "t3", content: "Done!", status: "completed" },
    ],
  }}
  streamingText="I'm typing..."
  currentTextBlockId="t1"
  onStop={() => console.log("Stop")}
  onCopy={() => console.log("Copy")}
  onRegenerate={() => console.log("Regenerate")}
/>;
```

### ErrorEntry

Displays error messages.

```tsx
import { ErrorEntry } from "@agentxjs/ui";

<ErrorEntry
  entry={{
    type: "error",
    id: "err_123",
    content: "Connection failed",
    timestamp: Date.now(),
    errorCode: "CONNECTION_ERROR",
  }}
/>;
```

## Block Components

Blocks are content units within an AssistantEntry.

### TextBlock

Text content with markdown support and streaming cursor.

```tsx
import { TextBlock } from "@agentxjs/ui";

// Completed text
<TextBlock
  block={{
    type: "text",
    id: "text_123",
    content: "Hello, world!",
    timestamp: Date.now(),
    status: "completed",
  }}
/>

// Streaming text
<TextBlock
  block={{
    type: "text",
    id: "text_123",
    content: "",
    timestamp: Date.now(),
    status: "streaming",
  }}
  streamingText="I'm typing..."
/>
```

### ToolBlock

Tool execution display with status, input, and output.

```tsx
import { ToolBlock } from "@agentxjs/ui";

<ToolBlock
  block={{
    type: "tool",
    id: "tool_123",
    toolCallId: "tc_456",
    name: "Bash",
    input: { command: "ls -la" },
    status: "success", // "planning" | "executing" | "success" | "error"
    output: "file1.txt\nfile2.txt",
    duration: 1.23,
    timestamp: Date.now(),
  }}
  defaultExpanded={false}
/>;
```

## Pane Components

Pane components are pure UI layout containers.

### MessagePane

Scrollable container for messages with auto-scroll.

```tsx
import { MessagePane } from "@agentxjs/ui";

<MessagePane
  emptyState={{
    icon: <MessageSquare />,
    title: "No messages yet",
    description: "Start the conversation by sending a message",
  }}
>
  {messages.map((msg) => (
    <MessageRenderer key={msg.id} message={msg} />
  ))}
</MessagePane>;
```

### InputPane

Full-height input area with attachment support.

```tsx
import { InputPane } from "@agentxjs/ui";

<InputPane
  onSend={(content) => handleSend(content)}
  onStop={() => handleStop()}
  isLoading={isLoading}
  placeholder="Type a message..."
  toolbarItems={[
    { id: "emoji", icon: <Smile />, label: "Emoji" },
    { id: "image", icon: <Image />, label: "Add image" },
    { id: "attach", icon: <Paperclip />, label: "Attach file" },
  ]}
  enableEmojiPicker={true}
  enableAttachments={true}
  maxAttachments={10}
/>;
```

**Features:**

- Text input with markdown support
- Image/file attachments via toolbar buttons
- Drag and drop files
- Paste images (Ctrl+V)
- Emoji picker integration
- Stop button during loading

### ListPane

Generic list container for conversations, agents, etc.

```tsx
import { ListPane } from "@agentxjs/ui";

<ListPane
  title="Conversations"
  items={items}
  selectedId={selectedId}
  searchable={true}
  searchPlaceholder="Search..."
  showNewButton={true}
  newButtonLabel="New conversation"
  onSelect={(id) => handleSelect(id)}
  onNew={() => handleNew()}
  onEdit={(id, title) => handleEdit(id, title)}
  onDelete={(id) => handleDelete(id)}
/>;
```

## Typography Components

### MarkdownText

Renders markdown content with syntax highlighting and custom styling.

```tsx
import { MarkdownText } from "@agentxjs/ui";

<MarkdownText>
  {`# Hello World
  This is **bold** and this is \`code\`

  \`\`\`javascript
  console.log("Hello!");
  \`\`\`
  `}
</MarkdownText>;
```

**Features:**

- GitHub Flavored Markdown (GFM) support
- Syntax highlighting for code blocks
- Copy button for code blocks
- Custom styling for blockquotes, links, etc.

### JSONRenderer

Renders JSON data with syntax highlighting.

```tsx
import { JSONRenderer } from "@agentxjs/ui";

<JSONRenderer data={{ name: "John", age: 30 }} />;
```

### DiffViewer

Displays diff output with proper highlighting.

```tsx
import { DiffViewer } from "@agentxjs/ui";

<DiffViewer diff={diffText} />;
```

## Container Components

### Chat

Business component combining MessagePane + InputPane with useAgent hook.

```tsx
import { Chat } from "@agentxjs/ui";

<Chat
  agentx={agentx}
  imageId={currentImageId}
  agentName="Assistant"
  placeholder="Type a message..."
  inputHeightRatio={0.25}
/>;
```

### AgentList

Conversation list with online/offline status.

```tsx
import { AgentList } from "@agentxjs/ui";

<AgentList
  agentx={agentx}
  containerId="user-123"
  selectedId={currentImageId}
  onSelect={(imageId, agentId) => handleSelect(imageId, agentId)}
  onNew={(imageId) => handleNew(imageId)}
  title="Conversations"
  searchable={true}
/>;
```

## Theming

The UI package uses a semantic color token system based on CSS variables.

### Color Tokens

| Token         | Purpose                    | Description                        |
| ------------- | -------------------------- | ---------------------------------- |
| `primary`     | Computational intelligence | Blue - main actions, AI thinking   |
| `secondary`   | Generative creativity      | Amber - creative outputs           |
| `accent`      | Interactive highlights     | Orange - hover, focus states       |
| `success`     | Positive feedback          | Green - completed, online          |
| `warning`     | Caution                    | Yellow - warnings                  |
| `destructive` | Errors, danger             | Red - errors, delete               |
| `muted`       | Subdued content            | Gray - backgrounds, secondary text |

### Dark Mode

The package supports dark mode via CSS variables. Use a theme provider like `next-themes`:

```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>;
```

### Custom Theming

Override CSS variables to customize the theme:

```css
:root {
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --radius: 0.5rem;
}

.dark {
  --primary: 217 91% 60%;
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
}
```

## Type Definitions

### ConversationData

```typescript
type ConversationData = UserConversationData | AssistantConversationData | ErrorConversationData;
```

### BlockData

```typescript
type BlockData = TextBlockData | ToolBlockData | ImageBlockData;
```

### AgentStatus

```typescript
type AgentStatus =
  | "idle"
  | "thinking"
  | "responding"
  | "planning_tool"
  | "awaiting_tool_result"
  | "error";
```

## Integration with agentxjs

The UI package is designed to work seamlessly with the `agentxjs` SDK:

```tsx
import { createAgentX } from "agentxjs";
import { Studio } from "@agentxjs/ui";

// Create AgentX instance
const agentx = await createAgentX({
  serverUrl: "ws://localhost:5200",
  headers: { Authorization: "Bearer token" },
  context: { userId: "123" },
});

// Use with Studio
function App() {
  return <Studio agentx={agentx} containerId="user-123" />;
}
```

## Development with Storybook

The package includes Storybook stories for component development. Run from the monorepo root:

```bash
bun dev storybook
```

This starts Storybook at `http://localhost:6006` with all component stories.

## Architecture

### Design Principles

1. **Headless + Styled**: Core logic in hooks, styling via Tailwind
2. **Atomic Design**: Elements -> Entry -> Container composition
3. **Agent-First**: Components designed for AI streaming UX
4. **Design Tokens**: Semantic colors for AI concepts
5. **Isomorphic**: Works with both local and remote agents

### Component Hierarchy

```
Studio (workspace)
├── AgentList (sidebar)
│   └── ListPane
└── Chat (main area)
    ├── ChatHeader
    ├── MessagePane
    │   ├── UserEntry
    │   ├── AssistantEntry
    │   │   ├── TextBlock
    │   │   └── ToolBlock
    │   └── ErrorEntry
    └── InputPane
        └── InputToolBar
```

### Data Flow

```
AgentX Events -> useAgent Hook -> React State -> UI Components
```

The `useAgent` hook subscribes to agent events and transforms them into React state that drives the UI rendering.
