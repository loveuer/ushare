#!/bin/sh
set -e

# 启动后端服务（带参数后台运行）
echo "启动后端服务，参数: $@"
ushare "$@" &
BACKEND_PID=$!

# 定义优雅关闭函数
graceful_shutdown() {
    echo "接收到终止信号，开始优雅关闭..."

    # 先关闭 Nginx
    echo "关闭 Nginx..."
    nginx -s quit 2>/dev/null || kill -TERM $NGINX_PID 2>/dev/null

    # 关闭后端服务
    echo "关闭后端服务 PID $BACKEND_PID..."
    kill -TERM $BACKEND_PID 2>/dev/null

    # 等待进程终止
    wait $BACKEND_PID $NGINX_PID 2>/dev/null
    exit 0
}

# 捕获系统信号
trap 'graceful_shutdown' SIGTERM SIGINT

# 启动 Nginx（前台运行）
echo "启动 Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# 等待所有后台进程
wait $BACKEND_PID $NGINX_PID