# 配置参考

本文档详细说明 Portagent 的所有配置选项。

## 环境变量

### 必需配置

| 变量               | 说明               | 示例                 |
| ------------------ | ------------------ | -------------------- |
| `LLM_PROVIDER_KEY` | Anthropic API 密钥 | `sk-ant-api03-xxxxx` |

### LLM 配置

| 变量                 | 默认值                      | 说明               |
| -------------------- | --------------------------- | ------------------ |
| `LLM_PROVIDER_URL`   | `https://api.anthropic.com` | API 基础 URL       |
| `LLM_PROVIDER_MODEL` | `claude-sonnet-4-20250514`  | 使用的 Claude 模型 |

**可用模型**:

- `claude-sonnet-4-20250514` - 推荐，平衡性能和成本
- `claude-opus-4-20250514` - 最强能力
- `claude-haiku-4-5-20251001` - 最快响应

### 服务器配置

| 变量         | 默认值       | 说明                                    |
| ------------ | ------------ | --------------------------------------- |
| `PORT`       | `5200`       | HTTP/WebSocket 服务端口                 |
| `AGENTX_DIR` | `~/.agentx`  | 数据目录路径                            |
| `NODE_ENV`   | `production` | 运行环境 (`production` / `development`) |

### 认证配置

| 变量                   | 默认值   | 说明               |
| ---------------------- | -------- | ------------------ |
| `JWT_SECRET`           | 自动生成 | JWT 签名密钥       |
| `INVITE_CODE_REQUIRED` | `false`  | 是否要求邀请码注册 |

**重要**: 生产环境应该设置固定的 `JWT_SECRET`，否则每次重启后所有用户需要重新登录。

### 日志配置

| 变量        | 默认值 | 说明     |
| ----------- | ------ | -------- |
| `LOG_LEVEL` | `info` | 日志级别 |

**日志级别**:

- `debug` - 详细调试信息
- `info` - 常规运行信息
- `warn` - 警告信息
- `error` - 仅错误信息

### MCP 集成配置

| 变量             | 默认值 | 说明                        |
| ---------------- | ------ | --------------------------- |
| `ENABLE_PROMPTX` | `true` | 是否启用 PromptX MCP 服务器 |

设置 `ENABLE_PROMPTX=false` 禁用 PromptX 集成。

---

## CLI 参数

通过命令行参数配置 Portagent：

```bash
portagent [options]
```

### 可用参数

| 参数                    | 简写 | 说明         | 示例                                |
| ----------------------- | ---- | ------------ | ----------------------------------- |
| `--port <port>`         | `-p` | 服务端口     | `--port 3000`                       |
| `--data-dir <path>`     | `-d` | 数据目录     | `--data-dir /var/lib/portagent`     |
| `--env-file <path>`     | `-e` | 环境文件路径 | `--env-file .env.prod`              |
| `--jwt-secret <secret>` | -    | JWT 密钥     | `--jwt-secret xxx`                  |
| `--api-key <key>`       | -    | API 密钥     | `--api-key sk-ant-xxx`              |
| `--api-url <url>`       | -    | API 基础 URL | `--api-url https://api.example.com` |
| `--model <model>`       | -    | 模型名称     | `--model claude-sonnet-4-20250514`  |
| `--help`                | `-h` | 显示帮助     | `--help`                            |
| `--version`             | `-V` | 显示版本     | `--version`                         |

### 优先级

CLI 参数 > 环境变量 > 默认值

### 示例

```bash
# 使用 CLI 参数启动
portagent --port 3000 --data-dir /data/portagent --api-key sk-ant-xxx

# 加载自定义环境文件
portagent --env-file /etc/portagent/.env.production

# 覆盖环境文件中的设置
portagent --env-file .env --port 8080
```

---

## 环境文件

Portagent 按以下顺序加载环境文件：

1. `--env-file` 指定的文件（如果提供）
2. 当前目录的 `.env.local`
3. 当前目录的 `.env`

### 示例 .env 文件

```env
# LLM 配置
LLM_PROVIDER_KEY=sk-ant-api03-xxxxx
LLM_PROVIDER_URL=https://api.anthropic.com
LLM_PROVIDER_MODEL=claude-sonnet-4-20250514

# 服务器配置
PORT=5200
AGENTX_DIR=/var/lib/portagent

# 认证配置
JWT_SECRET=your-secure-random-secret-at-least-32-chars
INVITE_CODE_REQUIRED=true

# 日志配置
LOG_LEVEL=info

# MCP 配置
ENABLE_PROMPTX=true
```

---

## Docker 环境变量

### 基础镜像预设

Docker 镜像预设以下环境变量：

```dockerfile
ENV NODE_ENV=production
ENV PORT=5200
ENV LOG_LEVEL=info
ENV AGENTX_DIR=/home/node/.agentx
```

### 运行时覆盖

```bash
docker run -d \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -e LLM_PROVIDER_MODEL=claude-haiku-4-5-20251001 \
  -e JWT_SECRET=my-secret \
  -e INVITE_CODE_REQUIRED=true \
  deepracticexs/portagent:latest
```

### Docker Compose 配置

```yaml
services:
  portagent:
    image: deepracticexs/portagent:latest
    environment:
      - LLM_PROVIDER_KEY=${LLM_PROVIDER_KEY}
      - LLM_PROVIDER_URL=${LLM_PROVIDER_URL:-https://api.anthropic.com}
      - LLM_PROVIDER_MODEL=${LLM_PROVIDER_MODEL:-claude-sonnet-4-20250514}
      - JWT_SECRET=${JWT_SECRET}
      - INVITE_CODE_REQUIRED=${INVITE_CODE_REQUIRED:-false}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - ENABLE_PROMPTX=${ENABLE_PROMPTX:-true}
```

---

## PromptX MCP 集成

Portagent 默认集成 PromptX MCP 服务器，提供提示词管理功能。

### 启用/禁用

```bash
# 启用（默认）
ENABLE_PROMPTX=true portagent

# 禁用
ENABLE_PROMPTX=false portagent
```

### Docker 镜像中的 PromptX

Docker 镜像已预装 PromptX CLI：

```dockerfile
RUN npm install -g @promptx/cli
```

### 默认 Agent 配置

启用 PromptX 时，默认 Agent 配置为：

```typescript
{
  name: "Assistant",
  systemPrompt: "...", // 预设的欢迎语
  mcpServers: {
    promptx: {
      command: "promptx",
      args: ["mcp-server"],
    },
  },
}
```

禁用 PromptX 时：

```typescript
{
  name: "Assistant",
  systemPrompt: "You are a helpful AI assistant.",
}
```

---

## 数据目录结构

配置 `AGENTX_DIR` 后，目录结构如下：

```
{AGENTX_DIR}/
├── data/
│   ├── agentx.db      # AgentX 数据（容器、镜像、会话）
│   └── portagent.db   # 用户认证数据
└── logs/
    └── portagent.log  # 应用日志
```

### 默认位置

- **主机**: `~/.agentx/`
- **Docker**: `/home/node/.agentx/`

---

## 模型选择指南

| 模型                        | 速度 | 能力 | 成本 | 适用场景           |
| --------------------------- | ---- | ---- | ---- | ------------------ |
| `claude-haiku-4-5-20251001` | 最快 | 一般 | 最低 | 简单对话、快速响应 |
| `claude-sonnet-4-20250514`  | 适中 | 强   | 中等 | 通用场景（推荐）   |
| `claude-opus-4-20250514`    | 较慢 | 最强 | 最高 | 复杂推理、代码生成 |

### 配置示例

```bash
# 快速响应场景
LLM_PROVIDER_MODEL=claude-haiku-4-5-20251001

# 通用场景（默认）
LLM_PROVIDER_MODEL=claude-sonnet-4-20250514

# 高质量输出场景
LLM_PROVIDER_MODEL=claude-opus-4-20250514
```

---

## 配置验证

启动时，Portagent 会输出当前配置：

```
  ____            _                         _
 |  _ \ ___  _ __| |_ __ _  __ _  ___ _ __ | |_
 | |_) / _ \| '__| __/ _` |/ _` |/ _ \ '_ \| __|
 |  __/ (_) | |  | || (_| | (_| |  __/ | | | |_
 |_|   \___/|_|   \__\__,_|\__, |\___|_| |_|\__|
                           |___/

  AgentX Portal - Your AI Agent Gateway (Multi-User Mode)

Configuration:
  Port: 5200
  Data Dir: /home/node/.agentx
  API Key: sk-ant-api03-xxx...
  User DB: /home/node/.agentx/data/portagent.db
  AgentX DB: /home/node/.agentx/data/agentx.db
  Logs: /home/node/.agentx/logs
  Invite Code: required
  PromptX MCP: enabled
```

---

## 下一步

- 查看 [认证系统](./authentication.md) 了解 JWT 和邀请码机制
- 查看 [架构设计](./architecture.md) 了解系统内部结构
- 查看 [故障排查](./troubleshooting.md) 解决配置问题
