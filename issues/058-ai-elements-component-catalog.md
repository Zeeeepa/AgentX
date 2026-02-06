# AI Elements 组件清单

Vercel AI SDK 的 UI 组件库，基于 shadcn/ui 构建，专为 AI 应用设计。

## 安装

```bash
npx ai-elements@latest
```

## 核心 AI 组件

### 对话组件 (Conversation)

| 组件 | 说明 |
|-----|------|
| `Conversation` | 主容器，自动滚动（use-stick-to-bottom） |
| `ConversationContent` | 内容包装器，flex 布局 |
| `ConversationEmptyState` | 空状态展示，可自定义图标和描述 |
| `ConversationScrollButton` | 滚动到底部按钮 |
| `ConversationDownload` | 下载对话为 Markdown |

### 消息组件 (Message)

| 组件 | 说明 |
|-----|------|
| `Message` | 消息容器，支持 user/assistant 角色 |
| `MessageContent` | 消息内容包装，基于角色样式 |
| `MessageResponse` | 富文本渲染（Markdown、代码、数学公式、Mermaid） |
| `MessageActions` | 操作按钮容器 |
| `MessageAction` | 单个操作按钮，支持 tooltip |
| `MessageBranch` | 消息分支导航 |
| `MessageBranchSelector` | 分支选择器 |
| `MessageBranchPrevious/Next` | 分支导航按钮 |
| `MessageToolbar` | 消息工具栏 |

### 输入组件 (PromptInput)

| 组件 | 说明 |
|-----|------|
| `PromptInput` | 多功能输入框主容器 |
| `PromptInputProvider` | 可选的全局状态 Provider |
| `PromptInputTextarea` | 自动扩展文本框，支持中文输入 |
| `PromptInputSubmit` | 提交按钮（发送/停止状态切换） |
| `PromptInputButton` | 样式化按钮，支持 tooltip |
| `PromptInputHeader/Footer` | 输入框布局区域 |
| `PromptInputTools` | 工具容器 |
| `PromptInputActionMenu` | 操作下拉菜单 |
| `PromptInputActionAddAttachments` | 文件上传菜单项 |
| `PromptInputCommand*` | 命令面板集成 |
| `PromptInputSelect*` | 下拉选择集成 |

### 推理展示 (Reasoning)

| 组件 | 说明 |
|-----|------|
| `Reasoning` | 可折叠推理/思考展示 |

特性：
- 流式 Shimmer 动画
- 流式时自动展开
- 完成后自动折叠

### 工具执行 (Tool)

| 组件 | 说明 |
|-----|------|
| `Tool` | 可折叠工具执行展示 |
| `ToolHeader` | 工具标题和状态徽章 |
| `ToolContent` | 工具详情容器 |
| `ToolInput` | 工具输入展示 |
| `ToolOutput` | 工具输出展示 |

状态类型：
- `approval-requested` - 等待审批
- `input-streaming` - 输入流式中
- `running` - 执行中
- `output-available` - 输出可用
- `output-error` - 执行错误

### 代码展示 (Code)

| 组件 | 说明 |
|-----|------|
| `CodeBlock` | 语法高亮代码块（Shiki） |
| `Terminal` | 终端输出展示 |

CodeBlock 特性：
- 50+ 语言语法高亮
- 行号显示切换
- 主题选择
- 复制功能

Terminal 特性：
- ANSI 颜色解析（ansi-to-react）
- 自动滚动
- 清除按钮
- 复制输出

### Agent 展示

| 组件 | 说明 |
|-----|------|
| `Agent` | Agent 卡片容器 |
| `AgentHeader` | Agent 名称和模型徽章 |
| `AgentContent` | Agent 详情包装 |
| `AgentInstructions` | 系统指令展示 |
| `AgentTools` | 工具列表（手风琴样式） |

### 规划展示 (Plan)

| 组件 | 说明 |
|-----|------|
| `Plan` | 规划/步骤展示，可折叠 |
| `PlanHeader` | 规划头部 |
| `PlanTitle` | 规划标题 |
| `PlanDescription` | 规划描述 |
| `PlanContent` | 规划内容 |

### 引用来源 (Sources)

| 组件 | 说明 |
|-----|------|
| `Sources` | 可折叠来源列表 |
| `SourcesTrigger` | 触发器，显示来源数量 |
| `SourcesContent` | 来源列表容器 |
| `Source` | 单个来源链接，带图标 |

### 建议 (Suggestion)

| 组件 | 说明 |
|-----|------|
| `Suggestion` | 建议按钮（水平滚动列表） |

### 代码执行与预览

| 组件 | 说明 |
|-----|------|
| `Artifact` | 生成内容容器（代码、设计等） |
| `ArtifactHeader/Title/Description` | Artifact 元数据 |
| `ArtifactClose` | 关闭按钮 |
| `JSXPreview` | JSX 代码实时预览 |
| `WebPreview` | Web 内容预览框架 |
| `Sandbox` | 沙箱代码执行环境 |

### 数据展示

| 组件 | 说明 |
|-----|------|
| `FileTree` | 文件树结构展示 |
| `SchemaDisplay` | JSON Schema 可视化 |
| `Image` | 图片展示，带元数据 |

### 音频/语音

| 组件 | 说明 |
|-----|------|
| `AudioPlayer` | 媒体播放器（media-chrome） |
| `SpeechInput` | 语音输入 |
| `MicSelector` | 麦克风选择下拉框 |
| `VoiceSelector` | TTS 语音选择 |
| `Transcription` | 转录展示 |

### 其他组件

| 组件 | 说明 |
|-----|------|
| `Shimmer` | 加载骨架/闪烁动画 |
| `Toolbar` | 工具按钮容器 |
| `Panel` | 通用面板容器 |
| `Confirmation` | 确认对话框 |
| `StackTrace` | 错误堆栈展示 |
| `TestResults` | 测试结果展示 |
| `ModelSelector` | 模型选择下拉框 |
| `Snippet` | 代码片段展示 |
| `Context` | 上下文/环境展示 |
| `ChainOfThought` | 推理链可视化 |
| `InlineCitation` | 行内引用标记 |

## shadcn/ui 基础组件 (55个)

**布局**：Accordion, Card, Collapsible, Drawer, Sidebar, Sheet, Tabs, ResizablePanel

**表单**：Button, ButtonGroup, Checkbox, Command, DropdownMenu, Field, Form, Input, InputGroup, InputOTP, Label, RadioGroup, Select, Switch, Textarea, Toggle, ToggleGroup

**展示**：Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Calendar, Chart, Dialog, Empty, HoverCard, Image, Kbd, NavigationMenu, Pagination, Popover, Progress, ScrollArea, Skeleton, Spinner, Table, Tooltip

**通知**：Toast, Toaster, Sonner

## 使用示例

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit
} from "@/components/ai-elements/prompt-input";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex h-screen flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState />
          ) : (
            messages.map((message, index) => (
              <Message key={index} from={message.role}>
                <MessageContent>
                  <MessageResponse>{message.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <PromptInputSubmit />
      </PromptInput>
    </div>
  );
}
```

## AgentX 集成

我们不需要自己实现 UI 组件，直接使用 ai-elements。需要做的是：

1. 安装 ai-elements 到 `apps/portagent`
2. 创建 `useAgentXChat` hook 对接 AgentX 事件系统
3. 将 Stream/Message/State 事件转换为组件 props

```typescript
// 胶水层示例
function useAgentXChat(agent: Agent) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    agent.react({
      onAssistantMessage: (e) => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: e.data.content
        }]);
      },
      onTextDelta: (e) => {
        // 处理流式文本
      }
    });
  }, [agent]);

  return { messages, sendMessage: agent.receive };
}
```

## 参考链接

- [AI Elements 文档](https://sdk.vercel.ai/docs/ai-sdk-ui/ai-elements)
- [GitHub 仓库](https://github.com/vercel/ai/tree/main/packages/ai-elements)
- [shadcn/ui](https://ui.shadcn.com/)
