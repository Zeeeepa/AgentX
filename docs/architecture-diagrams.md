# Deepractice Agent 架构可视化

## 1. 整体架构思维导图

```mermaid
mindmap
  root((Deepractice Agent))
    核心目标
      为 Claude 提供 Web UI
      实时对话界面
      多会话管理
      流式响应支持

    架构原则
      契约优先开发
        agentx-api 定义契约
        TypeScript 类型保护
        先改契约再实现
      平台无关设计
        核心逻辑跨平台
        Provider 模式适配
        统一事件接口
      事件驱动
        EventBus 中心化
        松耦合通信
        ALL_EVENT_TYPES 单一来源

    技术栈
      前端
        React + TypeScript
        Zustand 状态管理
        Vite 构建
        Storybook 组件库
      后端
        Node.js + Express
        WebSocket 实时通信
        Claude SDK 集成
      工程化
        pnpm workspace
        Turbo 构建
        Vitest + Cucumber BDD
        Changesets 版本管理

    核心包结构
      契约层
        agentx-api::事件类型定义
        agentx-types::消息内容类型
      核心层
        agentx-core::Agent/EventBus/Logger
      平台层
        agentx-node::Node.js Provider
        agentx-browser::Browser Provider
      UI层
        agentx-ui::React 组件
```

## 2. 包依赖关系图

```mermaid
graph TB
    subgraph "契约层 (Pure Types)"
        API[agentx-api<br/>事件类型/接口/错误]
        TYPES[agentx-types<br/>消息/内容类型]
    end

    subgraph "核心层 (Platform Agnostic)"
        CORE[agentx-core<br/>Agent/EventBus/Logger]
    end

    subgraph "平台层 (Platform Specific)"
        NODE[agentx-node<br/>ClaudeProvider<br/>WebSocketServer<br/>WebSocketBridge]
        BROWSER[agentx-browser<br/>BrowserProvider<br/>WebSocket Client]
    end

    subgraph "UI层 (React Components)"
        UI[agentx-ui<br/>Chat/ErrorMessage<br/>ChatInput/MessageList]
    end

    subgraph "应用层 (Legacy)"
        APP[apps/agent<br/>Full-stack App<br/>正在重构中]
    end

    %% Dependencies
    CORE --> API
    CORE --> TYPES
    NODE --> CORE
    NODE --> API
    BROWSER --> CORE
    BROWSER --> API
    UI --> BROWSER
    UI --> API
    UI --> TYPES
    APP -.-> CORE
    APP -.-> NODE

    style API fill:#e1f5ff
    style TYPES fill:#e1f5ff
    style CORE fill:#fff4e1
    style NODE fill:#ffe1f0
    style BROWSER fill:#ffe1f0
    style UI fill:#e1ffe1
    style APP fill:#f0f0f0,stroke-dasharray: 5 5
```

## 3. 事件总线架构图

```mermaid
graph LR
    subgraph "Browser 端"
        UI[UI Components]
        BAgent[Browser Agent]
        BProvider[BrowserProvider]
        WS_Client[WebSocket Client]
    end

    subgraph "EventBus (RxJS)"
        EB_Browser[Browser EventBus]
        EB_Node[Node EventBus]
    end

    subgraph "Server 端"
        WS_Server[WebSocket Server]
        Bridge[WebSocketBridge]
        NAgent[Node Agent]
        ClaudeProvider[ClaudeAgentProvider]
        SDK[Claude SDK]
    end

    %% Browser side flow
    UI -->|"用户输入"| BAgent
    BAgent -->|"emit event"| EB_Browser
    EB_Browser -->|"forward"| BProvider
    BProvider -->|"send JSON"| WS_Client

    WS_Client <==>|"WebSocket<br/>ws://localhost:5200/ws"| WS_Server

    %% Server side flow
    WS_Server -->|"receive event"| Bridge
    Bridge -->|"emit event"| EB_Node
    EB_Node -->|"forward"| NAgent
    NAgent -->|"send message"| ClaudeProvider
    ClaudeProvider -->|"API call"| SDK

    %% Response flow
    SDK -->|"stream response"| ClaudeProvider
    ClaudeProvider -->|"emit events"| EB_Node
    EB_Node -->|"ALL_EVENT_TYPES<br/>auto subscribe"| Bridge
    Bridge -->|"send JSON"| WS_Server
    WS_Server -->|"push"| WS_Client
    WS_Client -->|"parse event"| BProvider
    BProvider -->|"emit"| EB_Browser
    EB_Browser -->|"notify"| UI

    style EB_Browser fill:#ffd700
    style EB_Node fill:#ffd700
    style WS_Client fill:#ff69b4
    style WS_Server fill:#ff69b4
    style Bridge fill:#87ceeb
```

## 4. 事件类型与数据流

```mermaid
graph TD
    subgraph "事件类型定义 (agentx-api)"
        ALL[ALL_EVENT_TYPES<br/>单一事实来源]
        ALL --> USER[user<br/>用户消息]
        ALL --> ASST[assistant<br/>AI完整回复]
        ALL --> STREAM[stream_event<br/>流式增量]
        ALL --> RESULT[result<br/>成功结果]
        ALL --> SYSTEM[system<br/>系统事件]
        ALL --> ERROR[error<br/>错误事件]
    end

    subgraph "错误分类"
        ERROR --> E_SYS[system: WebSocket/网络]
        ERROR --> E_AGENT[agent: 逻辑/验证]
        ERROR --> E_LLM[llm: Claude SDK]
        ERROR --> E_VAL[validation: 输入验证]
        ERROR --> E_UNK[unknown: 未分类]
    end

    subgraph "严重级别"
        E_SYS --> SEV
        E_AGENT --> SEV
        E_LLM --> SEV
        E_VAL --> SEV
        E_UNK --> SEV
        SEV{Severity}
        SEV --> FATAL[fatal: 致命错误]
        SEV --> ERR[error: 一般错误]
        SEV --> WARN[warning: 警告]
    end

    style ALL fill:#ff6b6b
    style ERROR fill:#ffd93d
    style SEV fill:#6bcf7f
```

## 5. 完整业务流程图

```mermaid
sequenceDiagram
    autonumber

    participant User as 用户
    participant UI as UI Component
    participant BAgent as Browser Agent
    participant WS as WebSocket
    participant Bridge as WebSocketBridge
    participant NAgent as Node Agent
    participant Provider as ClaudeProvider
    participant Claude as Claude API

    %% 1. 用户发送消息
    User->>UI: 输入消息 "你好"
    UI->>BAgent: send("你好")
    BAgent->>BAgent: 生成 UserMessageEvent

    %% 2. 通过 WebSocket 发送
    BAgent->>WS: emit("user") via EventBus
    WS->>Bridge: JSON.stringify(event)

    %% 3. Server 端处理
    Bridge->>NAgent: emit("user") via EventBus
    NAgent->>Provider: send("你好")
    Provider->>Claude: API Request

    %% 4. Claude 流式响应
    Claude-->>Provider: Stream chunk 1
    Provider->>NAgent: emit("stream_event")
    NAgent->>Bridge: EventBus forwards
    Bridge->>WS: JSON.stringify(event)
    WS-->>UI: 显示 "你"

    Claude-->>Provider: Stream chunk 2
    Provider->>NAgent: emit("stream_event")
    NAgent->>Bridge: EventBus forwards
    Bridge->>WS: JSON.stringify(event)
    WS-->>UI: 显示 "好"

    %% 5. 完成响应
    Claude-->>Provider: Stream complete
    Provider->>NAgent: emit("assistant")
    NAgent->>Bridge: EventBus forwards
    Bridge->>WS: JSON.stringify(event)
    WS-->>UI: 显示完整消息

    Provider->>NAgent: emit("result")
    NAgent->>Bridge: EventBus forwards
    Bridge->>WS: JSON.stringify(event)
    WS-->>UI: 显示统计信息

    %% 6. 错误处理示例
    Note over Claude: 假设发生错误
    Claude--xProvider: Rate Limit Error
    Provider->>NAgent: emit("error")<br/>subtype: "llm"<br/>severity: "error"<br/>recoverable: true
    NAgent->>Bridge: EventBus forwards
    Bridge->>WS: JSON.stringify(error)
    WS-->>UI: 显示 ErrorMessage
```

## 6. 契约优先开发流程

```mermaid
flowchart TD
    START([需要新功能]) --> CHECK{是否需要<br/>新事件类型?}

    CHECK -->|是| UPDATE_API[1. 更新 agentx-api]
    CHECK -->|否| IMPL[直接实现]

    UPDATE_API --> DEFINE[定义新事件接口<br/>MyNewEvent extends BaseAgentEvent]
    DEFINE --> UNION[添加到 AgentEvent union]
    UNION --> ARRAY[添加到 ALL_EVENT_TYPES 数组]
    ARRAY --> EXPORT[导出类型]
    EXPORT --> BUILD_API[构建 agentx-api<br/>pnpm build]

    BUILD_API --> TS_CHECK{TypeScript<br/>编译通过?}
    TS_CHECK -->|否| FIX[修复类型错误]
    FIX --> ARRAY
    TS_CHECK -->|是| IMPL

    IMPL --> IMPL_CORE[2. 实现核心逻辑<br/>agentx-core]
    IMPL_CORE --> IMPL_PROVIDER[3. 实现 Provider<br/>agentx-node/browser]
    IMPL_PROVIDER --> IMPL_UI[4. 实现 UI<br/>agentx-ui]

    IMPL_UI --> TEST[5. 测试]
    TEST --> BDD[BDD 测试<br/>features/*.feature]
    TEST --> UNIT[单元测试<br/>*.test.ts]

    BDD --> ALL_PASS{所有测试<br/>通过?}
    UNIT --> ALL_PASS

    ALL_PASS -->|否| DEBUG[调试修复]
    DEBUG --> TEST
    ALL_PASS -->|是| DONE([完成])

    style UPDATE_API fill:#ff6b6b
    style ARRAY fill:#ffd93d
    style TS_CHECK fill:#6bcf7f
    style ALL_PASS fill:#4ecdc4
```

## 7. WebSocketBridge 自动转发机制

```mermaid
graph TB
    subgraph "初始化阶段"
        INIT[WebSocketBridge 创建]
        INIT --> LOOP[遍历 ALL_EVENT_TYPES]
        LOOP --> SUB1[订阅 'user']
        LOOP --> SUB2[订阅 'assistant']
        LOOP --> SUB3[订阅 'stream_event']
        LOOP --> SUB4[订阅 'result']
        LOOP --> SUB5[订阅 'system']
        LOOP --> SUB6[订阅 'error']
    end

    subgraph "运行时自动转发"
        EVENT[Agent 发出事件]
        EVENT --> MATCH{匹配订阅?}
        MATCH -->|是| HANDLER[调用对应 handler]
        HANDLER --> SERIALIZE[JSON.stringify]
        SERIALIZE --> SEND[ws.send]
        SEND --> CLIENT[发送到浏览器]

        MATCH -->|否| WARN[警告: 未知事件类型]
    end

    subgraph "为什么不会遗漏?"
        REASON1[ALL_EVENT_TYPES 是<br/>EventType 的完整集合]
        REASON2[TypeScript 保证<br/>数组完整性]
        REASON3[编译时检查<br/>satisfies readonly EventType]
        REASON4[新事件必须先加到数组<br/>否则编译失败]

        REASON1 --> REASON2 --> REASON3 --> REASON4
    end

    style LOOP fill:#ffd93d
    style MATCH fill:#6bcf7f
    style REASON2 fill:#ff6b6b
```

## 8. 错误处理流程图

```mermaid
flowchart TD
    ERROR([错误发生]) --> WHERE{发生位置}

    WHERE -->|Browser| B_ERROR[BrowserProvider.emitErrorEvent]
    WHERE -->|Node| N_ERROR[ClaudeProvider.emitErrorEvent]
    WHERE -->|Core| C_ERROR[Agent.emitErrorEvent]

    B_ERROR --> BUILD[构建 ErrorEvent]
    N_ERROR --> BUILD
    C_ERROR --> BUILD

    BUILD --> SET_TYPE[type: 'error']
    SET_TYPE --> SET_SUBTYPE{设置 subtype}

    SET_SUBTYPE -->|WebSocket| SUBTYPE_SYS[subtype: 'system']
    SET_SUBTYPE -->|逻辑错误| SUBTYPE_AGENT[subtype: 'agent']
    SET_SUBTYPE -->|Claude SDK| SUBTYPE_LLM[subtype: 'llm']
    SET_SUBTYPE -->|输入验证| SUBTYPE_VAL[subtype: 'validation']
    SET_SUBTYPE -->|未知| SUBTYPE_UNK[subtype: 'unknown']

    SUBTYPE_SYS --> SET_SEV{设置 severity}
    SUBTYPE_AGENT --> SET_SEV
    SUBTYPE_LLM --> SET_SEV
    SUBTYPE_VAL --> SET_SEV
    SUBTYPE_UNK --> SET_SEV

    SET_SEV -->|致命| SEV_FATAL[severity: 'fatal'<br/>recoverable: false]
    SET_SEV -->|一般| SEV_ERROR[severity: 'error'<br/>recoverable: true]
    SET_SEV -->|警告| SEV_WARN[severity: 'warning'<br/>recoverable: true]

    SEV_FATAL --> EMIT[emit 到 EventBus]
    SEV_ERROR --> EMIT
    SEV_WARN --> EMIT

    EMIT --> LOG[记录日志]
    LOG --> CHECK_HANDLER{是否有错误<br/>处理器?}

    CHECK_HANDLER -->|否| WARN_NO_HANDLER[警告: 无错误处理器]
    CHECK_HANDLER -->|是| FORWARD[转发到所有监听器]

    FORWARD --> UI[UI: ErrorMessage 显示]
    FORWARD --> LOGGER[Logger: 持久化]
    FORWARD --> MONITOR[Monitor: 监控上报]

    style BUILD fill:#ff6b6b
    style SET_SUBTYPE fill:#ffd93d
    style SET_SEV fill:#6bcf7f
    style UI fill:#4ecdc4
```

## 9. 学习路径建议

```mermaid
graph LR
    subgraph "第1天: 理解契约"
        D1_1[阅读 agentx-api<br/>所有事件类型]
        D1_2[阅读 agentx-types<br/>消息/内容类型]
        D1_3[理解 ALL_EVENT_TYPES<br/>为什么是单一来源]
        D1_1 --> D1_2 --> D1_3
    end

    subgraph "第2天: 核心逻辑"
        D2_1[agentx-core/Agent.ts<br/>主类实现]
        D2_2[agentx-core/AgentEventBus.ts<br/>事件总线]
        D2_3[agentx-core/LoggerProvider.ts<br/>日志抽象]
        D2_1 --> D2_2 --> D2_3
    end

    subgraph "第3天: 平台适配"
        D3_1[agentx-node<br/>ClaudeProvider]
        D3_2[agentx-node<br/>WebSocketBridge]
        D3_3[agentx-browser<br/>BrowserProvider]
        D3_1 --> D3_2 --> D3_3
    end

    subgraph "第4天: UI 组件"
        D4_1[agentx-ui/Chat.tsx<br/>主组件]
        D4_2[agentx-ui/ErrorMessage.tsx<br/>错误显示]
        D4_3[运行 Storybook<br/>查看所有组件]
        D4_1 --> D4_2 --> D4_3
    end

    subgraph "第5天: 实战调试"
        D5_1[启动 pnpm dev<br/>运行完整应用]
        D5_2[Chrome DevTools<br/>查看 WebSocket]
        D5_3[添加新事件类型<br/>完整流程实践]
        D5_1 --> D5_2 --> D5_3
    end

    D1_3 --> D2_1
    D2_3 --> D3_1
    D3_3 --> D4_1
    D4_3 --> D5_1

    style D1_3 fill:#e1f5ff
    style D2_3 fill:#fff4e1
    style D3_3 fill:#ffe1f0
    style D4_3 fill:#e1ffe1
    style D5_3 fill:#ffd93d
```

## 10. 关键代码位置索引

```mermaid
mindmap
  root((代码位置))
    契约定义
      packages/agentx-api/src/events/AgentEvent.ts
        ALL_EVENT_TYPES 数组
        EventType 类型
      packages/agentx-api/src/events/ErrorEvent.ts
        ErrorEvent 接口
        错误分类
      packages/agentx-types/src/Message.ts
        Message 类型
        ContentPart 类型

    核心实现
      packages/agentx-core/src/Agent.ts
        Agent 类
        emitErrorEvent 方法
      packages/agentx-core/src/AgentEventBus.ts
        事件总线实现
      packages/agentx-core/src/LoggerProvider.ts
        日志接口

    平台层
      packages/agentx-node/src/ClaudeAgentProvider.ts
        Claude SDK 适配
      packages/agentx-node/src/WebSocketBridge.ts
        自动转发逻辑
      packages/agentx-browser/src/BrowserProvider.ts
        浏览器端实现

    UI层
      packages/agentx-ui/src/Chat.tsx
        主聊天组件
      packages/agentx-ui/src/ErrorMessage.tsx
        错误显示
      packages/agentx-ui/.storybook/
        Storybook 配置
```

---

## 使用说明

这些图表都使用 Mermaid 语法,可以在以下环境查看:

1. **GitHub** - 直接在 Markdown 中渲染
2. **VSCode** - 安装 "Markdown Preview Mermaid Support" 插件
3. **在线编辑器** - https://mermaid.live/
4. **Notion/Obsidian** - 支持 Mermaid 代码块

## 推荐学习顺序

1. **思维导图** (整体概览)
2. **包依赖图** (理解模块关系)
3. **业务流程图** (跟踪一次完整对话)
4. **事件总线图** (理解通信机制)
5. **契约开发流程** (掌握开发方法)
6. **错误处理流程** (理解异常处理)
7. **学习路径** (按天学习计划)

祝学习顺利! 🚀
