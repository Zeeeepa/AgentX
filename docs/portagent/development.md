# 开发指南

本文档介绍如何搭建 Portagent 本地开发环境和自定义开发。

## 环境要求

- **Node.js**: 20+
- **Bun**: 1.0+（包管理和构建）
- **Git**: 版本控制

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Deepractice/AgentX.git
cd AgentX
```

### 2. 安装依赖

```bash
bun install
```

### 3. 构建所有包

```bash
bun build
```

### 4. 配置环境变量

在 `apps/portagent` 目录创建 `.env.local`：

```env
LLM_PROVIDER_KEY=sk-ant-api03-xxxxx
LLM_PROVIDER_URL=https://api.anthropic.com
LLM_PROVIDER_MODEL=claude-sonnet-4-20250514
LOG_LEVEL=debug
INVITE_CODE_REQUIRED=false
```

### 5. 启动开发服务器

```bash
cd apps/portagent
bun dev
```

服务器启动后访问 <http://localhost:5200>。

---

## 项目结构

```
apps/portagent/
├── src/
│   ├── client/                # 前端代码
│   │   ├── main.tsx          # 应用入口
│   │   ├── App.tsx           # 路由配置
│   │   ├── input.css         # Tailwind 入口
│   │   ├── hooks/
│   │   │   └── useAuth.tsx   # 认证 Hook
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       └── ChatPage.tsx
│   │
│   ├── server/                # 后端代码
│   │   ├── index.ts          # 服务器主入口
│   │   ├── main.ts           # 开发入口
│   │   ├── auth.ts           # 认证模块
│   │   ├── logger.ts         # 日志模块
│   │   ├── defaultAgent.ts   # 默认 Agent
│   │   ├── database/
│   │   │   └── SQLiteUserRepository.ts
│   │   └── user/
│   │       ├── types.ts
│   │       └── UserRepository.ts
│   │
│   └── cli/                   # CLI 入口
│       └── index.ts
│
├── public/                    # 静态资源
│   └── favicon.svg
│
├── build.ts                   # 构建脚本
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── Dockerfile
```

---

## 开发模式

### 后端开发

后端使用 Bun 直接运行 TypeScript：

```bash
cd apps/portagent
bun run src/server/main.ts
```

`main.ts` 会自动加载 `.env.local` 和 `.env`。

### 前端开发

前端使用 Vite 开发服务器：

```bash
cd apps/portagent
bun run dev:client
```

Vite 开发服务器运行在 5173 端口，自动代理 API 请求到后端。

### 同时开发前后端

推荐使用两个终端：

```bash
# 终端 1: 后端
cd apps/portagent && bun run src/server/main.ts

# 终端 2: 前端
cd apps/portagent && bun run dev:client
```

或使用 monorepo 根目录的 dev 命令：

```bash
# 从仓库根目录
bun dev portagent
```

---

## 构建流程

### 开发构建

```bash
cd apps/portagent
bun run build
```

### 构建产物

构建脚本 (`build.ts`) 执行以下步骤：

1. **清理**: 删除 `dist` 目录
2. **前端构建**: Bun 打包 React 应用到 `dist/public`
3. **CSS 生成**: PostCSS + Tailwind 生成样式
4. **生成 index.html**: 注入打包后的 JS 文件名
5. **二进制构建**: 为各平台编译二进制

### 构建平台

| 平台        | 二进制文件                  |
| ----------- | --------------------------- |
| macOS ARM64 | `portagent-darwin-arm64`    |
| macOS x64   | `portagent-darwin-x64`      |
| Linux x64   | `portagent-linux-x64`       |
| Linux ARM64 | `portagent-linux-arm64`     |
| Windows x64 | `portagent-windows-x64.exe` |

### 测试本地构建

```bash
# 使用 CLI 入口
node dist/cli.js --help

# 直接运行二进制（macOS ARM64 示例）
./dist/bin/portagent-darwin-arm64 --help
```

---

## 代码规范

### TypeScript

- 使用 ESM 模块 (`"type": "module"`)
- 启用严格模式
- 导入使用 `.js` 扩展名

### 命名约定

- **文件**: camelCase（`authRoutes.ts`）
- **组件**: PascalCase（`LoginPage.tsx`）
- **函数**: camelCase（`createToken`）
- **常量**: UPPER_SNAKE_CASE（`TOKEN_EXPIRY`）

### 日志

使用 AgentX logger，不要直接使用 `console.*`：

```typescript
import { createLogger } from "@agentxjs/common";

const logger = createLogger("portagent/auth");
logger.info("User logged in", { userId });
```

---

## 添加新功能

### 添加 API 端点

在 `src/server/index.ts` 中：

```typescript
// 公开端点
app.get("/api/public/endpoint", (c) => {
  return c.json({ data: "public" });
});

// 受保护端点
app.use("/api/private/*", authMiddleware);
app.get("/api/private/endpoint", (c) => {
  const userId = c.get("userId");
  return c.json({ data: "private", userId });
});
```

### 添加前端页面

1. 创建页面组件 `src/client/pages/NewPage.tsx`：

```typescript
export function NewPage() {
  return <div>New Page</div>;
}
```

2. 添加路由 `src/client/App.tsx`：

```typescript
import { NewPage } from "./pages/NewPage";

<Routes>
  {/* ... 其他路由 */}
  <Route path="/new" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
</Routes>
```

### 修改默认 Agent

编辑 `src/server/defaultAgent.ts`：

```typescript
export const defaultAgent: AgentDefinition = {
  name: "CustomAssistant",
  systemPrompt: `你的自定义系统提示...`,
  mcpServers: {
    // 添加 MCP 服务器
    myMcp: {
      command: "my-mcp-server",
      args: ["--config", "/path/to/config"],
    },
  },
};
```

### 添加用户字段

1. 更新类型定义 `src/server/user/types.ts`：

```typescript
export interface UserRecord {
  // ... 现有字段
  newField?: string;
}
```

2. 更新数据库 Schema `src/server/database/SQLiteUserRepository.ts`：

```typescript
private initDatabase(): void {
  this.db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      -- ... 现有字段
      newField TEXT
    );
  `);
}
```

3. 更新相关方法。

---

## 调试

### 后端调试

使用 VS Code 调试配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug Portagent",
      "program": "${workspaceFolder}/apps/portagent/src/server/main.ts",
      "cwd": "${workspaceFolder}/apps/portagent"
    }
  ]
}
```

### 前端调试

使用浏览器开发者工具：

1. 打开 <http://localhost:5173>（Vite 开发服务器）
2. F12 打开开发者工具
3. Sources 面板设置断点

### 日志调试

设置 `LOG_LEVEL=debug` 查看详细日志：

```bash
LOG_LEVEL=debug bun run src/server/main.ts
```

---

## 测试

### 运行测试

```bash
# 从仓库根目录
bun test

# 只测试 portagent
bun --filter @agentxjs/portagent test
```

### 类型检查

```bash
cd apps/portagent
bun run typecheck
```

### 代码检查

```bash
cd apps/portagent
bun run lint
```

---

## Docker 本地构建

### 构建镜像

```bash
# 从仓库根目录
docker build -t portagent:local -f apps/portagent/Dockerfile .
```

### 运行本地镜像

```bash
docker run -d \
  --name portagent-dev \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxx \
  portagent:local
```

### 使用本地构建的二进制

```bash
# 先构建
cd apps/portagent && bun run build

# 使用 local target
docker build --target local -t portagent:local-bin -f apps/portagent/Dockerfile .
```

---

## 发布流程

### 创建 Changeset

```bash
bunx changeset
```

选择包和版本类型：

- `patch`: 修复 bug
- `minor`: 新功能
- `major`: 破坏性变更（尽量避免）

### 提交变更

```bash
git add .changeset/
git commit -m "chore: add changeset"
git push
```

### CI 自动发布

PR 合并后，CI 会自动：

1. 更新版本号
2. 构建包
3. 发布到 npm
4. 构建并推送 Docker 镜像

---

## 常见问题

### 依赖安装失败

```bash
# 清理并重新安装
rm -rf node_modules
bun install
```

### 构建失败

```bash
# 清理构建产物
bun clean

# 重新构建
bun build
```

### 类型错误

```bash
# 检查类型
bun run typecheck

# 可能需要重新构建依赖包
cd ../.. && bun build
```

### 前端热重载不工作

确保 Vite 配置正确，检查 `vite.config.ts`。

---

## 下一步

- 查看 [架构设计](./architecture.md) 了解代码结构
- 查看 [运维指南](./operations.md) 了解生产部署
