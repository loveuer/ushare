#!/bin/bash

set -e

echo "=========================================="
echo "  Building UShare Single Binary"
echo "=========================================="
echo ""

# 清理旧的构建产物
echo "[Cleanup] Removing old build files..."
rm -rf dist
rm -f ushare
rm -rf internal/static/frontend

# 构建前端
echo ""
echo "[Frontend] Building..."
cd frontend
pnpm run build
cd ..

# 复制前端构建产物到 internal/static
echo "[Frontend] Copying dist files..."
mkdir -p internal/static/frontend
cp -r frontend/dist internal/static/frontend/

# 构建后端（包含嵌入的前端文件）
echo ""
echo "[Backend] Building with embedded frontend..."
mkdir -p dist
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-s -w' -o dist/ushare .

# 清理临时文件
echo ""
echo "[Cleanup] Removing temporary files..."
rm -rf internal/static/frontend

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "  Binary: dist/ushare"
echo "=========================================="
echo ""
echo "Usage:"
echo "  ./dist/ushare -debug -address 0.0.0.0:9119 -data ./data -auth \"admin:password\""
echo ""
echo "  Development: ./dev.sh"
echo "  Production: ./make.sh && ./dist/ushare ..."
