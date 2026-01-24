# 认证系统

本文档详细介绍 Portagent 的认证机制，包括 JWT 认证和邀请码系统。

## 认证概述

Portagent 使用 JWT（JSON Web Token）进行用户认证：

1. 用户注册/登录后获取 JWT Token
2. 后续请求携带 Token 进行身份验证
3. Token 有效期为 7 天

---

## JWT 认证机制

### Token 结构

Portagent 使用 HS256 算法签名的 JWT：

```json
{
  "header": {
    "alg": "HS256"
  },
  "payload": {
    "sub": "user-uuid", // 用户 ID
    "iat": 1704067200, // 签发时间
    "exp": 1704672000 // 过期时间（7 天后）
  }
}
```

### Token 生命周期

| 阶段   | 说明                             |
| ------ | -------------------------------- |
| 签发   | 注册或登录成功后返回             |
| 有效期 | 7 天                             |
| 验证   | 每次请求验证签名和有效期         |
| 刷新   | 目前无自动刷新，过期后需重新登录 |

### HTTP 认证

在请求头中携带 Token：

```http
Authorization: Bearer <token>
```

示例：

```bash
curl -X GET http://localhost:5200/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### WebSocket 认证

WebSocket 不支持自定义请求头，通过查询参数传递 Token：

```
ws://localhost:5200/ws?token=<token>
```

### JWT 密钥配置

**生产环境必须配置固定的 JWT_SECRET**：

```bash
# 生成安全密钥
openssl rand -base64 32

# 设置环境变量
export JWT_SECRET=your-secure-random-secret-at-least-32-chars
```

如果不设置 `JWT_SECRET`：

- 系统会自动生成随机密钥
- 每次重启后所有用户需要重新登录
- 不适合生产环境

---

## 邀请码系统

Portagent 使用基于时间的邀请码控制用户注册。

### 工作原理

邀请码是**当天 00:00:01 的 Unix 时间戳（秒）**：

1. 每天午夜自动更换
2. 基于服务器时区计算
3. Docker 容器默认使用 UTC 时区

### 启用邀请码

```bash
# 环境变量
INVITE_CODE_REQUIRED=true

# Docker
docker run -e INVITE_CODE_REQUIRED=true ...

# CLI
portagent --invite-code-required
```

### 计算邀请码

#### Linux/macOS

```bash
# 服务器本地时区
date -d "today 00:00:01" +%s

# UTC 时区（Docker 默认）
TZ=UTC date -d "today 00:00:01" +%s
```

macOS 语法：

```bash
# 服务器本地时区
date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 00:00:01" "+%s"

# UTC 时区
TZ=UTC date -j -f "%Y-%m-%d %H:%M:%S" "$(TZ=UTC date +%Y-%m-%d) 00:00:01" "+%s"
```

#### JavaScript/Node.js

```javascript
// 服务器本地时区
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);
const inviteCode = Math.floor(todayStart.getTime() / 1000);
console.log(inviteCode);
```

```javascript
// UTC 时区
const now = new Date();
const utcTodayStart = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 1)
);
const inviteCode = Math.floor(utcTodayStart.getTime() / 1000);
console.log(inviteCode);
```

#### Python

```python
from datetime import datetime, timezone

# 服务器本地时区
now = datetime.now()
today_start = now.replace(hour=0, minute=0, second=1, microsecond=0)
invite_code = int(today_start.timestamp())
print(invite_code)

# UTC 时区
now_utc = datetime.now(timezone.utc)
utc_today_start = now_utc.replace(hour=0, minute=0, second=1, microsecond=0)
invite_code = int(utc_today_start.timestamp())
print(invite_code)
```

### 时区注意事项

**Docker 容器默认运行在 UTC 时区**。

示例（假设当前北京时间 2025-01-15 10:00）：

| 时区         | 日期             | 邀请码                                 |
| ------------ | ---------------- | -------------------------------------- |
| UTC          | 2025-01-15 02:00 | `1736899201` (2025-01-15 00:00:01 UTC) |
| 北京 (UTC+8) | 2025-01-15 10:00 | `1736870401` (2025-01-15 00:00:01 CST) |

如果客户端和服务器时区不同，确保按服务器时区计算邀请码。

### 验证逻辑

服务器端验证代码：

```typescript
function isValidInviteCode(code: string): boolean {
  const timestamp = parseInt(code, 10);
  if (isNaN(timestamp)) return false;

  // 获取服务器时区的今天 00:00:01
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);
  const expectedTimestamp = Math.floor(todayStart.getTime() / 1000);

  return timestamp === expectedTimestamp;
}
```

---

## 用户注册流程

### API 端点

```
POST /api/auth/register
```

### 请求格式

```json
{
  "username": "john", // 必需，至少 3 字符
  "password": "secret123", // 必需，至少 6 字符
  "inviteCode": "1736899201", // 启用时必需
  "email": "john@example.com", // 可选
  "displayName": "John Doe" // 可选
}
```

### 成功响应

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid-xxx",
    "username": "john",
    "email": "john@example.com",
    "containerId": "user-uuid-xxx",
    "displayName": "John Doe",
    "createdAt": 1736899200000
  },
  "expiresIn": "7d"
}
```

### 错误响应

```json
// 用户名已存在
{ "error": "Username 'john' already exists" }

// 邮箱已存在
{ "error": "Email 'john@example.com' already exists" }

// 无效邀请码
{ "error": "Invalid invite code" }

// 用户名太短
{ "error": "Username must be at least 3 characters" }

// 密码太短
{ "error": "Password must be at least 6 characters" }
```

### 示例

```bash
curl -X POST http://localhost:5200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "secret123",
    "inviteCode": "1736899201",
    "email": "john@example.com",
    "displayName": "John Doe"
  }'
```

---

## 用户登录流程

### API 端点

```
POST /api/auth/login
```

### 请求格式

```json
{
  "usernameOrEmail": "john", // 用户名或邮箱
  "password": "secret123"
}
```

### 成功响应

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid-xxx",
    "username": "john",
    "email": "john@example.com",
    "containerId": "user-uuid-xxx",
    "displayName": "John Doe",
    "createdAt": 1736899200000
  },
  "expiresIn": "7d"
}
```

### 错误响应

```json
{ "error": "Invalid credentials" }
```

### 示例

```bash
curl -X POST http://localhost:5200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "john",
    "password": "secret123"
  }'
```

---

## Token 验证

### API 端点

```
GET /api/auth/verify
```

### 请求

```bash
curl -X GET http://localhost:5200/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

### 成功响应

```json
{
  "valid": true,
  "user": {
    "userId": "uuid-xxx",
    "username": "john",
    "email": "john@example.com",
    "containerId": "user-uuid-xxx",
    "displayName": "John Doe",
    "createdAt": 1736899200000
  }
}
```

### 失败响应

```json
{ "valid": false }
```

---

## 认证配置查询

获取服务器认证配置（公开接口）：

```
GET /api/auth/config
```

响应：

```json
{
  "inviteCodeRequired": true
}
```

前端可根据此配置决定是否显示邀请码输入框。

---

## 用户数据模型

### 数据库表结构

```sql
CREATE TABLE users (
  userId TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  containerId TEXT NOT NULL,
  displayName TEXT,
  avatar TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

### 用户与容器关系

- 每个用户注册时自动创建专属 Container
- `containerId` 格式：`user-{uuid}`
- 用户的所有会话和 Agent 都在此 Container 中

### 密码存储

- 使用 bcrypt 算法哈希
- cost factor: 10

---

## 前端认证流程

### 存储

Token 和用户信息存储在 localStorage：

```javascript
localStorage.setItem("portagent_token", token);
localStorage.setItem("portagent_user", JSON.stringify(user));
```

### 初始化检查

页面加载时验证存储的 Token：

```javascript
const storedToken = localStorage.getItem("portagent_token");
if (storedToken) {
  const result = await fetch("/api/auth/verify", {
    headers: { Authorization: `Bearer ${storedToken}` },
  });
  if (!result.ok) {
    // Token 无效，清除并跳转登录页
    localStorage.removeItem("portagent_token");
    localStorage.removeItem("portagent_user");
    navigate("/login");
  }
}
```

### 登出

登出是客户端操作：

```javascript
function logout() {
  localStorage.removeItem("portagent_token");
  localStorage.removeItem("portagent_user");
  navigate("/login");
}
```

---

## 安全建议

### 1. JWT 密钥安全

```bash
# 使用强随机密钥
JWT_SECRET=$(openssl rand -base64 32)

# 不要硬编码在代码中
# 使用环境变量或 secrets 管理
```

### 2. HTTPS

生产环境必须使用 HTTPS，防止 Token 被窃取。

### 3. Token 存储

- 使用 localStorage（当前实现）
- 考虑使用 httpOnly cookie 增强安全性

### 4. 邀请码分发

- 通过安全渠道分发邀请码
- 每日自动更换增加安全性

---

## 下一步

- 查看 [架构设计](./architecture.md) 了解认证中间件实现
- 查看 [故障排查](./troubleshooting.md) 解决认证问题
