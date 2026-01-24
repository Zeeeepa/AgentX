# 部署指南

本文档介绍 Portagent 的各种部署方式。

## Docker 部署（推荐）

Docker 是生产环境推荐的部署方式，提供一致的运行环境和简单的管理。

### 快速启动

```bash
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -e LLM_PROVIDER_URL=https://api.anthropic.com \
  -v ./data:/home/node/.agentx \
  deepracticexs/portagent:latest
```

### 生产环境配置

```bash
docker run -d \
  --name portagent \
  --restart unless-stopped \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  -e LLM_PROVIDER_URL=https://api.anthropic.com \
  -e LLM_PROVIDER_MODEL=claude-sonnet-4-20250514 \
  -e JWT_SECRET=your-secure-random-secret \
  -e INVITE_CODE_REQUIRED=true \
  -e LOG_LEVEL=info \
  -v /var/lib/portagent:/home/node/.agentx \
  deepracticexs/portagent:0.1.9
```

### 镜像版本

```bash
# 最新版本
docker pull deepracticexs/portagent:latest

# 指定版本（推荐生产环境）
docker pull deepracticexs/portagent:0.1.9

# 支持的架构: linux/amd64, linux/arm64
```

---

## Docker Compose 部署

适合需要与其他服务一起编排的场景。

### 创建配置文件

创建 `.env` 文件：

```env
LLM_PROVIDER_KEY=sk-ant-xxxxx
LLM_PROVIDER_URL=https://api.anthropic.com
LLM_PROVIDER_MODEL=claude-sonnet-4-20250514
JWT_SECRET=your-secure-random-secret
INVITE_CODE_REQUIRED=false
LOG_LEVEL=info
```

创建 `docker-compose.yml`：

```yaml
services:
  portagent:
    image: deepracticexs/portagent:latest
    container_name: portagent
    restart: unless-stopped
    ports:
      - "5200:5200"
    environment:
      - LLM_PROVIDER_KEY=${LLM_PROVIDER_KEY}
      - LLM_PROVIDER_URL=${LLM_PROVIDER_URL:-https://api.anthropic.com}
      - LLM_PROVIDER_MODEL=${LLM_PROVIDER_MODEL:-claude-sonnet-4-20250514}
      - JWT_SECRET=${JWT_SECRET}
      - INVITE_CODE_REQUIRED=${INVITE_CODE_REQUIRED:-false}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      - ./data:/home/node/.agentx
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5200/health"]
      interval: 30s
      timeout: 10s
      start_period: 5s
      retries: 3
```

### 启动服务

```bash
docker compose up -d
```

### 查看日志

```bash
docker compose logs -f portagent
```

---

## npm 全局安装

适合已有 Node.js 环境的服务器。

### 安装

```bash
npm install -g @agentxjs/portagent
```

### 运行

```bash
# 设置环境变量
export LLM_PROVIDER_KEY=sk-ant-xxxxx
export LLM_PROVIDER_URL=https://api.anthropic.com

# 启动服务
portagent
```

### 使用 CLI 参数

```bash
portagent \
  --port 5200 \
  --data-dir /var/lib/portagent \
  --api-key sk-ant-xxxxx \
  --api-url https://api.anthropic.com \
  --jwt-secret your-secure-secret
```

### 使用环境文件

```bash
portagent --env-file /path/to/.env
```

---

## npx 快速体验

无需安装，直接运行（适合快速测试）：

```bash
LLM_PROVIDER_KEY=sk-ant-xxxxx npx @agentxjs/portagent
```

---

## 本地构建 Docker 镜像

如果需要自定义构建：

```bash
# 克隆仓库
git clone https://github.com/Deepractice/AgentX.git
cd AgentX

# 安装依赖并构建
bun install
bun build

# 构建 Docker 镜像
docker build -t portagent:local -f apps/portagent/Dockerfile .

# 运行本地构建的镜像
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=sk-ant-xxxxx \
  portagent:local
```

---

## 反向代理配置

生产环境建议使用反向代理提供 HTTPS 支持。

### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name portagent.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:5200;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 传递真实 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（适合长连接）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 3600s;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name portagent.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Caddy 配置

```caddyfile
portagent.example.com {
    reverse_proxy localhost:5200
}
```

Caddy 会自动处理 HTTPS 证书和 WebSocket 代理。

---

## systemd 服务配置

在 Linux 服务器上使用 systemd 管理服务。

### 创建服务文件

创建 `/etc/systemd/system/portagent.service`：

```ini
[Unit]
Description=Portagent - AgentX Portal
After=network.target

[Service]
Type=simple
User=node
Group=node
WorkingDirectory=/var/lib/portagent
Environment=NODE_ENV=production
Environment=PORT=5200
Environment=AGENTX_DIR=/var/lib/portagent
EnvironmentFile=/etc/portagent/env
ExecStart=/usr/local/bin/portagent
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 创建环境文件

创建 `/etc/portagent/env`：

```env
LLM_PROVIDER_KEY=sk-ant-xxxxx
LLM_PROVIDER_URL=https://api.anthropic.com
JWT_SECRET=your-secure-secret
INVITE_CODE_REQUIRED=true
```

### 启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable portagent
sudo systemctl start portagent
sudo systemctl status portagent
```

---

## 安全建议

### 1. API 密钥保护

- 不要将 `LLM_PROVIDER_KEY` 暴露在代码或日志中
- 使用环境变量或 secrets 管理工具
- 定期轮换 API 密钥

### 2. JWT 密钥管理

- 使用强随机密钥（至少 32 字符）
- 在容器重启间保持一致
- 生产环境不要使用自动生成的密钥

```bash
# 生成安全的 JWT 密钥
openssl rand -base64 32
```

### 3. 邀请码控制

- 生产环境建议启用邀请码
- 定期更新邀请码（每日自动更换）

### 4. 网络安全

- 使用 HTTPS（通过反向代理）
- 限制直接访问 5200 端口
- 配置防火墙规则

### 5. 容器安全

- 容器以非 root 用户 `node` 运行
- 挂载卷需要正确的权限

```bash
# 修复权限问题
sudo chown -R 1000:1000 ./data
```

---

## 下一步

- 查看 [配置参考](./configuration.md) 了解完整配置项
- 查看 [运维指南](./operations.md) 了解日常运维操作
- 查看 [故障排查](./troubleshooting.md) 解决部署问题
