# 运维指南

本文档介绍 Portagent 的日常运维操作，包括数据管理、日志、监控和备份。

## 数据目录结构

默认数据目录为 `~/.agentx`（Docker 中为 `/home/node/.agentx`）：

```
{AGENTX_DIR}/
├── data/
│   ├── agentx.db      # AgentX 数据（容器、镜像、会话、消息）
│   └── portagent.db   # 用户认证数据
└── logs/
    └── portagent.log  # 应用日志
```

### 数据文件说明

| 文件            | 说明                 | 大小估计              |
| --------------- | -------------------- | --------------------- |
| `agentx.db`     | Agent 会话和消息历史 | 随使用增长            |
| `portagent.db`  | 用户账户信息         | 通常较小              |
| `portagent.log` | 应用运行日志         | 最大 70MB（7 x 10MB） |

---

## 数据备份

### 手动备份

#### 停机备份

```bash
# 停止服务
docker stop portagent

# 备份数据目录
cp -r ./data ./backup-$(date +%Y%m%d)

# 启动服务
docker start portagent
```

#### 在线备份（SQLite）

使用 SQLite 备份命令，无需停机：

```bash
# Docker 环境
docker exec portagent sqlite3 /home/node/.agentx/data/agentx.db ".backup /home/node/.agentx/data/agentx-backup.db"
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db ".backup /home/node/.agentx/data/portagent-backup.db"

# 复制到主机
docker cp portagent:/home/node/.agentx/data/agentx-backup.db ./
docker cp portagent:/home/node/.agentx/data/portagent-backup.db ./
```

### 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/portagent"
DATA_DIR="/var/lib/portagent/data"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 备份数据库
sqlite3 "$DATA_DIR/agentx.db" ".backup $BACKUP_DIR/agentx-$TIMESTAMP.db"
sqlite3 "$DATA_DIR/portagent.db" ".backup $BACKUP_DIR/portagent-$TIMESTAMP.db"

# 压缩备份
tar -czf "$BACKUP_DIR/backup-$TIMESTAMP.tar.gz" \
  "$BACKUP_DIR/agentx-$TIMESTAMP.db" \
  "$BACKUP_DIR/portagent-$TIMESTAMP.db"

# 删除临时文件
rm "$BACKUP_DIR/agentx-$TIMESTAMP.db" "$BACKUP_DIR/portagent-$TIMESTAMP.db"

# 清理旧备份
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_DIR/backup-$TIMESTAMP.tar.gz"
```

配置 cron 定时备份：

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh >> /var/log/portagent-backup.log 2>&1
```

### 数据恢复

```bash
# 停止服务
docker stop portagent

# 解压备份
tar -xzf backup-20250115_020000.tar.gz

# 恢复数据库
cp agentx-20250115_020000.db /var/lib/portagent/data/agentx.db
cp portagent-20250115_020000.db /var/lib/portagent/data/portagent.db

# 修复权限
chown -R 1000:1000 /var/lib/portagent/data

# 启动服务
docker start portagent
```

---

## 日志管理

### 日志配置

日志级别通过 `LOG_LEVEL` 环境变量配置：

| 级别    | 说明         | 适用场景         |
| ------- | ------------ | ---------------- |
| `debug` | 详细调试信息 | 开发和问题排查   |
| `info`  | 常规运行信息 | 生产环境（默认） |
| `warn`  | 警告信息     | 生产环境         |
| `error` | 仅错误信息   | 最小化日志       |

### 日志轮转

Portagent 使用 LogTape 自动轮转日志：

- **单文件最大**: 10MB
- **保留文件数**: 7 个
- **总最大容量**: 约 70MB

### 查看日志

#### Docker 环境

```bash
# 查看实时日志
docker logs -f portagent

# 查看最近 100 行
docker logs --tail 100 portagent

# 查看文件日志
docker exec portagent cat /home/node/.agentx/logs/portagent.log

# 实时跟踪文件日志
docker exec portagent tail -f /home/node/.agentx/logs/portagent.log
```

#### systemd 环境

```bash
# 查看服务日志
journalctl -u portagent -f

# 查看最近日志
journalctl -u portagent --since "1 hour ago"
```

### 日志分析

#### 统计请求数

```bash
grep "POST /api/auth/login" portagent.log | wc -l
```

#### 查找错误

```bash
grep -i "error" portagent.log
```

#### 按时间筛选

```bash
grep "2025-01-15" portagent.log
```

---

## 健康检查

### 内置健康检查

```bash
# 使用 curl
curl http://localhost:5200/health

# 响应
{"status":"ok","timestamp":1736899200000}
```

### Docker 健康检查

Docker 镜像已配置健康检查：

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5200/health || exit 1
```

查看健康状态：

```bash
docker inspect --format='{{.State.Health.Status}}' portagent
```

### 外部监控

#### Prometheus

创建监控端点（需要自行添加）：

```typescript
app.get("/metrics", (c) => {
  const metrics = `
# HELP portagent_uptime_seconds Server uptime in seconds
# TYPE portagent_uptime_seconds gauge
portagent_uptime_seconds ${process.uptime()}

# HELP portagent_users_total Total registered users
# TYPE portagent_users_total gauge
portagent_users_total ${userCount}
`;
  return c.text(metrics);
});
```

#### UptimeRobot / Pingdom

配置 HTTP 检查：

- URL: `https://your-domain.com/health`
- 期望响应: 包含 `"status":"ok"`
- 检查间隔: 5 分钟

---

## 性能监控

### 资源使用

```bash
# Docker 资源使用
docker stats portagent

# 输出示例
CONTAINER   CPU %   MEM USAGE / LIMIT     MEM %   NET I/O       BLOCK I/O
portagent   2.5%    256MiB / 2GiB         12.5%   10MB / 5MB    50MB / 20MB
```

### 数据库大小

```bash
# 查看数据库大小
docker exec portagent ls -lh /home/node/.agentx/data/

# 输出示例
total 12M
-rw-r--r-- 1 node node  8.0M Jan 15 10:00 agentx.db
-rw-r--r-- 1 node node  512K Jan 15 10:00 portagent.db
```

### 连接数

```bash
# 查看网络连接
docker exec portagent ss -tuln | grep 5200
```

---

## 数据库维护

### SQLite 优化

定期执行 VACUUM 优化数据库：

```bash
# Docker 环境
docker exec portagent sqlite3 /home/node/.agentx/data/agentx.db "VACUUM;"
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db "VACUUM;"
```

### 完整性检查

```bash
# 检查数据库完整性
docker exec portagent sqlite3 /home/node/.agentx/data/agentx.db "PRAGMA integrity_check;"
```

### 统计信息

```bash
# 查看表统计
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db "SELECT COUNT(*) FROM users;"
docker exec portagent sqlite3 /home/node/.agentx/data/agentx.db "SELECT COUNT(*) FROM images;"
```

---

## 用户管理

### 查看用户列表

```bash
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "SELECT userId, username, email, datetime(createdAt/1000, 'unixepoch') FROM users;"
```

### 禁用用户

```bash
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "UPDATE users SET isActive = 0 WHERE username = 'baduser';"
```

### 删除用户

```bash
# 获取用户的 containerId
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "SELECT containerId FROM users WHERE username = 'targetuser';"

# 删除用户记录
docker exec portagent sqlite3 /home/node/.agentx/data/portagent.db \
  "DELETE FROM users WHERE username = 'targetuser';"

# 注意：相关的 Container 数据需要单独清理
```

---

## 安全加固

### 文件权限

```bash
# 确保数据目录权限正确
chmod 700 /var/lib/portagent
chmod 600 /var/lib/portagent/data/*.db
```

### 网络隔离

```yaml
# docker-compose.yml
services:
  portagent:
    networks:
      - internal
    # 只暴露给反向代理
    expose:
      - "5200"

  nginx:
    networks:
      - internal
      - external
    ports:
      - "443:443"

networks:
  internal:
    internal: true
  external:
```

### 限制资源

```yaml
services:
  portagent:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

---

## 故障恢复

### 服务无法启动

1. 检查日志

```bash
docker logs portagent
```

2. 检查环境变量

```bash
docker inspect portagent | grep -A 20 "Env"
```

3. 检查数据库完整性

```bash
sqlite3 /var/lib/portagent/data/portagent.db "PRAGMA integrity_check;"
```

### 数据库损坏

1. 停止服务
2. 尝试恢复

```bash
sqlite3 /var/lib/portagent/data/portagent.db ".recover" | sqlite3 /var/lib/portagent/data/portagent-recovered.db
```

3. 如果无法恢复，从备份还原

### WebSocket 连接问题

1. 检查反向代理 WebSocket 配置
2. 检查防火墙规则
3. 查看客户端控制台错误

---

## 版本升级

### Docker 升级

```bash
# 备份数据
./backup.sh

# 拉取新版本
docker pull deepracticexs/portagent:1.0.0

# 停止旧容器
docker stop portagent
docker rm portagent

# 启动新容器
docker run -d \
  --name portagent \
  -p 5200:5200 \
  -e LLM_PROVIDER_KEY=$LLM_PROVIDER_KEY \
  -v /var/lib/portagent:/home/node/.agentx \
  deepracticexs/portagent:1.0.0

# 验证
curl http://localhost:5200/health
```

### Docker Compose 升级

```bash
# 备份数据
./backup.sh

# 更新镜像标签
# 编辑 docker-compose.yml 中的 image 版本

# 重新创建容器
docker compose up -d

# 验证
docker compose logs -f
```

### npm 升级

```bash
# 更新全局包
npm update -g @agentxjs/portagent

# 验证版本
portagent --version
```

---

## 监控告警

### 推荐监控项

| 指标     | 阈值          | 说明           |
| -------- | ------------- | -------------- |
| 健康检查 | 连续 3 次失败 | 服务不可用     |
| 内存使用 | > 80%         | 可能需要扩容   |
| 磁盘使用 | > 90%         | 需要清理或扩容 |
| 响应时间 | > 5s          | 性能问题       |
| 错误率   | > 5%          | 需要排查       |

### 告警脚本示例

```bash
#!/bin/bash

HEALTH_URL="http://localhost:5200/health"
ALERT_EMAIL="admin@example.com"

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$response" != "200" ]; then
  echo "Portagent is down! Response code: $response" | mail -s "Alert: Portagent Down" "$ALERT_EMAIL"
fi
```

---

## 下一步

- 查看 [故障排查](./troubleshooting.md) 解决常见问题
- 查看 [架构设计](./architecture.md) 了解系统内部
