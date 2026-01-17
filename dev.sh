#!/bin/bash

set -e

# 捕获 Ctrl+C 信号
trap 'echo ""; echo "Stopping..."; kill $(jobs -p); exit 0' SIGINT SIGTERM

echo "=========================================="
echo "  Starting UShare Development Server"
echo "=========================================="
echo ""

# 构建前端（如果需要）
if [ ! -d "frontend/dist" ]; then
    echo "[Frontend] Building..."
    cd frontend && pnpm run build && cd ..
    echo "[Frontend] Build complete!"
fi

# 创建临时嵌入目录用于编译
mkdir -p internal/static/frontend
if [ ! -d "internal/static/frontend/dist" ]; then
    echo "[Setup] Creating frontend embed directory..."
    cp -r frontend/dist internal/static/frontend/
fi

# 检查后端是否已构建
if [ ! -f "./ushare" ]; then
    echo "[Backend] Building..."
    go build -o ushare .
    echo "[Backend] Build complete!"
fi

# 创建数据目录
mkdir -p ./data

# 启动后端
echo "[Backend] Starting..."
./ushare -debug -address 0.0.0.0:9119 -data ./data &
BACKEND_PID=$!
echo "[Backend] Running on http://0.0.0.0:9119 (PID: $BACKEND_PID)"
echo ""

# 启动前端
echo "[Frontend] Starting..."
cd frontend && pnpm run dev &
FRONTEND_PID=$!
cd ..
echo "[Frontend] Running on http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""

echo "=========================================="
echo "  All services started!"
echo "  - Backend:  http://0.0.0.0:9119"
echo "  - Frontend: http://0.0.0.0:5173"
echo "=========================================="
echo ""
echo "Note: Frontend hot-reload is enabled. Changes to backend code require rebuilding."
echo "Press Ctrl+C to stop all services"
echo ""

# 等待所有后台进程
wait
