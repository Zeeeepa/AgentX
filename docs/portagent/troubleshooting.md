# 故障排查

本文档汇总 Portagent 常见问题及解决方案。

## 启动问题

### "LLM_PROVIDER_KEY is required"

**原因**: 未设置 Anthropic API 密钥。

**解决方案**:

```bash
# 环境变量
export LLM_PROVIDER_KEY=sk-ant-api03-xxxxx

# Docker
docker run -e LLM_PROVIDER_KEY=sk-ant-api03-xxxxx ...

# CLI
portagent --api-key sk-ant-api03-xxxxx
```

### 服务启动后立即退出

**排查步骤**:

1. 查看日志

```bash
docker logs portagent
```

2. 常见原因：
   - API 密钥无效
   - 端口被占用
   - 数据目录权限问题

3. 检查端口占用

```bash
lsof -i :5200
# 或
netstat -tuln | grep 5200
```

4. 检查目录权限

```bash
ls -la /var/lib/portagent
```

### Permission denied 错误

**原因**: Docker 容器以 `node` 用户运行，挂载卷权限不匹配。

**解决方案**:

```bash
# 修改目录所有者（node 用户 UID 为 1000）
sudo chown -R 1000:1000 ./data

# 或设置宽松权限
chmod -R 777 ./data
```

---

## 认证问题

### "Invalid invite code"

**原因**: 邀请码不正确或时区不匹配。

**排查步骤**:

1. 确认邀请码已启用

```bash
# 检查环境变量
echo $INVITE_CODE_REQUIRED
```

2. 计算正确的邀请码

```bash
# Docker 容器使用 UTC 时区
TZ=UTC date -d "today 00:00:01" +%s
```

3. 如果是测试环境，禁用邀请码

```bash
docker run -e INVITE_CODE_REQUIRED=false ...
```

**时区说明**:

- Docker 容器默认使用 UTC
- 邀请码基于服务器时区计算
- 确保计算邀请码时使用正确时区

### "Invalid credentials"

**原因**: 用户名/密码错误或用户不存在。

**排查步骤**:

1. 确认用户存在

```bash
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "SELECT username FROM users WHERE username = 'targetuser';"
```

2. 检查用户是否被禁用

```bash
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "SELECT isActive FROM users WHERE username = 'targetuser';"
```

3. 重置密码（需要直接操作数据库）

```bash
# 生成新密码哈希需要编写脚本，建议删除用户后重新注册
```

### Token 验证失败

**原因**: Token 过期或 JWT_SECRET 变化。

**排查步骤**:

1. Token 过期
   - Token 有效期 7 天
   - 需要重新登录

2. JWT_SECRET 变化
   - 容器重启后使用了新的自动生成密钥
   - 解决：设置固定的 `JWT_SECRET`

```bash
docker run -e JWT_SECRET=your-fixed-secret ...
```

### 所有用户需要重新登录

**原因**: 未设置固定的 `JWT_SECRET`，重启后自动生成了新密钥。

**解决方案**:

1. 生成固定密钥

```bash
openssl rand -base64 32
```

2. 配置环境变量

```bash
export JWT_SECRET=your-generated-secret
```

---

## WebSocket 问题

### 无法建立 WebSocket 连接

**排查步骤**:

1. 检查 Token 是否正确传递

```javascript
// 正确的连接方式
const ws = new WebSocket(`ws://localhost:5200/ws?token=${token}`);
```

2. 检查反向代理配置

Nginx 需要正确配置 WebSocket：

```nginx
location / {
    proxy_pass http://localhost:5200;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

3. 检查防火墙

```bash
# 确保 5200 端口开放
sudo ufw allow 5200
```

### WebSocket 连接频繁断开

**可能原因**:

1. 反向代理超时设置过短

```nginx
location / {
    proxy_read_timeout 3600s;  # 增加超时时间
    proxy_send_timeout 60s;
}
```

2. 网络不稳定
   - 检查网络连接
   - 考虑使用心跳保活

3. 服务器资源不足
   - 检查 CPU 和内存使用率
   - 考虑扩容

### 消息发送后无响应

**排查步骤**:

1. 检查 Claude API 连接

```bash
curl -H "x-api-key: sk-ant-xxx" \
  -H "anthropic-version: 2023-06-01" \
  https://api.anthropic.com/v1/models
```

2. 检查 API 密钥余额

3. 查看服务器日志

```bash
docker logs -f portagent
```

---

## 数据库问题

### "database is locked"

**原因**: 多个进程同时访问 SQLite 数据库。

**解决方案**:

1. 确保只有一个 Portagent 实例运行

```bash
docker ps | grep portagent
```

2. 停止所有实例后重启

```bash
docker stop portagent
docker rm portagent
docker run ...
```

### 数据库损坏

**症状**: 服务启动失败，日志显示 SQLite 错误。

**排查步骤**:

1. 检查完整性

```bash
sqlite3 /var/lib/portagent/data/portagent.db "PRAGMA integrity_check;"
```

2. 尝试恢复

```bash
sqlite3 /var/lib/portagent/data/portagent.db ".recover" | \
  sqlite3 /var/lib/portagent/data/portagent-recovered.db
```

3. 从备份恢复

```bash
cp /var/backups/portagent/portagent-backup.db /var/lib/portagent/data/portagent.db
```

### 磁盘空间不足

**症状**: 写入失败，日志显示 "disk full" 或 "no space left"。

**解决方案**:

1. 检查磁盘使用

```bash
df -h
```

2. 清理日志文件

```bash
# Docker
docker exec portagent rm /home/node/.agentx/logs/*.log.*

# 或限制 Docker 日志大小
docker run --log-opt max-size=10m --log-opt max-file=3 ...
```

3. 清理旧数据

```bash
# 清理旧会话（谨慎操作）
sqlite3 /var/lib/portagent/data/agentx.db \
  "DELETE FROM messages WHERE timestamp < strftime('%s', 'now', '-30 days') * 1000;"
```

---

## 性能问题

### 响应缓慢

**排查步骤**:

1. 检查 Claude API 延迟

```bash
time curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-xxx" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

2. 检查服务器资源

```bash
docker stats portagent
```

3. 检查网络延迟

```bash
ping api.anthropic.com
```

### 内存使用过高

**可能原因**:

1. 会话数据积累
2. 日志缓冲区
3. 内存泄漏

**解决方案**:

1. 限制内存使用

```bash
docker run --memory=2g --memory-swap=2g ...
```

2. 定期重启服务（临时方案）

```bash
docker restart portagent
```

### CPU 使用率高

**可能原因**:

1. 大量并发请求
2. 日志写入频繁

**解决方案**:

1. 限制 CPU

```bash
docker run --cpus=2 ...
```

2. 降低日志级别

```bash
docker run -e LOG_LEVEL=warn ...
```

---

## 网络问题

### 无法访问 Claude API

**排查步骤**:

1. 测试连接

```bash
curl -I https://api.anthropic.com
```

2. 检查 DNS

```bash
nslookup api.anthropic.com
```

3. 检查代理设置

```bash
# 如果需要代理
docker run -e HTTP_PROXY=http://proxy:8080 ...
```

### 端口被占用

**解决方案**:

1. 查找占用进程

```bash
lsof -i :5200
```

2. 使用其他端口

```bash
docker run -p 5201:5200 ...
# 或
portagent --port 5201
```

---

## 前端问题

### 页面空白

**排查步骤**:

1. 检查浏览器控制台错误
2. 确认静态文件正确构建

```bash
ls dist/public/
```

3. 检查 index.html 是否正确

### 无法登录/注册

**排查步骤**:

1. 检查网络请求（浏览器开发者工具）
2. 查看服务器响应
3. 确认 CORS 配置

### 样式丢失

**原因**: CSS 文件未正确构建或加载。

**解决方案**:

```bash
# 重新构建
cd apps/portagent
bun run build
```

---

## Docker 问题

### 镜像拉取失败

```bash
# 使用镜像加速
docker pull registry.cn-hangzhou.aliyuncs.com/deepractice/portagent:latest
```

### 容器无法访问网络

```bash
# 检查网络配置
docker network ls
docker inspect portagent | grep -A 20 NetworkSettings
```

### 日志过大

```bash
# 限制日志大小
docker run \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ...
```

---

## 日志分析

### 常见错误日志

| 日志内容                              | 含义            | 解决方案      |
| ------------------------------------- | --------------- | ------------- |
| `Error: LLM_PROVIDER_KEY is required` | 未设置 API 密钥 | 设置环境变量  |
| `Invalid API key`                     | API 密钥无效    | 检查密钥格式  |
| `SQLITE_BUSY`                         | 数据库锁定      | 确保单实例    |
| `ECONNREFUSED`                        | 连接被拒绝      | 检查网络      |
| `ETIMEDOUT`                           | 连接超时        | 检查网络/代理 |

### 启用调试日志

```bash
docker run -e LOG_LEVEL=debug ...
```

### 导出日志分析

```bash
docker logs portagent > portagent.log 2>&1
grep -i error portagent.log
```

---

## 获取帮助

### 收集诊断信息

报告问题时，请提供：

1. 版本信息

```bash
portagent --version
docker inspect deepracticexs/portagent:latest | grep -i version
```

2. 环境信息

```bash
uname -a
docker version
```

3. 相关日志

```bash
docker logs --tail 100 portagent
```

4. 配置（隐藏敏感信息）

```bash
# 不要暴露 API 密钥
env | grep -E "^(PORT|LOG_LEVEL|INVITE)"
```

### 常用命令速查

```bash
# 查看日志
docker logs -f portagent

# 进入容器
docker exec -it portagent sh

# 检查健康
curl http://localhost:5200/health

# 检查数据库
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db ".tables"

# 重启服务
docker restart portagent

# 完全重建
docker stop portagent && docker rm portagent && docker run ...
```

---

## 相关文档

- [部署指南](./deployment.md) - 正确的部署方式
- [配置参考](./configuration.md) - 配置选项详解
- [运维指南](./operations.md) - 日常运维操作
