#!/bin/sh

# 如果存在 KEY 环境变量，则静默启动 Cloudflare Tunnel
if [ -n "$KEY" ]; then
  /app/cloudflared tunnel run --token "$KEY" >/dev/null 2>&1 &
fi

# 执行 Dockerfile CMD 传递过来的命令
# 注意：Dockerfile 的 CMD 必须包含 /bin/node
exec "$@"
