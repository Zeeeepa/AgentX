# Portagent

**AgentX 生产级部署样例** - 展示如何将 AgentX 框架部署为多用户 SaaS 应用。

Portagent 是一个基于 [AgentX](https://github.com/Deepractice/AgentX) 构建的多用户 AI Agent 网关。它不仅是一个可直接使用的产品，更是 AgentX 框架在生产环境中的参考实现，展示了：

- 如何实现多用户隔离（Container-Per-User 模型）
- 如何集成 JWT 认证和邀请码系统
- 如何通过 WebSocket 实现实时通信
- 如何进行 Docker 化部署和运维

## 核心特性

- **多用户支持** - 用户注册、登录、JWT 认证
- **WebSocket 实时通信** - 与 AI Agent 双向实时通信
- **邀请码系统** - 可选的邀请码控制注册访问
- **持久化存储** - 基于 SQLite 存储用户、会话和 Agent 数据
- **Docker 就绪** - 预构建 Docker 镜像，开箱即用
- **Claude 集成** - 通过 Claude Agent SDK 接入 Anthropic Claude API
- **PromptX MCP 集成** - 可选的 PromptX 提示词管理系统

## 快速启动

### 使用 Docker（推荐）

一行命令启动：

```bash
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -v ./data:/home/node/.agentx \
  deepracticexs/portagent:latest
```

然后访问 <http://localhost:5200>。

### 使用 npx

需要 Node.js 20+：

```bash
LLM_PROVIDER_KEY=sk-ant-xxxxx npx @agentxjs/portagent
```

### 使用 npm 全局安装

```bash
npm install -g @agentxjs/portagent
export LLM_PROVIDER_KEY=sk-ant-xxxxx
portagent
```

## 系统要求

- **运行环境**: Node.js 20+ 或 Docker
- **API 密钥**: Anthropic API Key（以 `sk-ant-` 开头）
- **存储空间**: 至少 500MB（包含 Claude Code SDK）

## 默认配置

| 配置项   | 默认值      | 说明                                  |
| -------- | ----------- | ------------------------------------- |
| 端口     | 5200        | HTTP/WebSocket 服务端口               |
| 数据目录 | `~/.agentx` | 数据库和日志存储位置                  |
| 邀请码   | 禁用        | 设置 `INVITE_CODE_REQUIRED=true` 启用 |
| 日志级别 | info        | 可选: debug, info, warn, error        |

## 文档导航

| 章节                             | 说明                          |
| -------------------------------- | ----------------------------- |
| [部署指南](./deployment.md)      | Docker、npm、二进制包部署方式 |
| [配置参考](./configuration.md)   | 环境变量、CLI 参数完整说明    |
| [认证系统](./authentication.md)  | JWT 认证、邀请码机制详解      |
| [架构设计](./architecture.md)    | 系统架构、数据模型、API 端点  |
| [开发指南](./development.md)     | 本地开发环境搭建、构建流程    |
| [运维指南](./operations.md)      | 数据备份、日志管理、监控      |
| [故障排查](./troubleshooting.md) | 常见问题及解决方案            |

## 下一步

- 查看 [部署指南](./deployment.md) 了解详细的部署步骤
- 查看 [配置参考](./configuration.md) 了解所有可配置项
- 查看 [认证系统](./authentication.md) 了解邀请码计算方法
