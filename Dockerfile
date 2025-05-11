# 第一阶段：构建前端
FROM node:20-alpine AS frontend-builder
RUN npm install -g pnpm --registry=https://registry.npmmirror.com
COPY frontend /app/frontend
WORKDIR /app/frontend
RUN pnpm install --registry=https://registry.npmmirror.com
RUN pnpm run build

# 第二阶段：构建 Golang 后端
FROM golang:alpine AS backend-builder
WORKDIR /app
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOPROXY=https://goproxy.cn
COPY go.mod /app/go.mod
COPY go.sum /app/go.sum
RUN go mod download
COPY main.go /app/main.go
COPY internal /app/internal
RUN go build -ldflags '-s -w' -o ushare .

# 第三阶段：生成最终镜像
FROM nginx:alpine
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY --from=backend-builder /app/ushare /usr/local/bin/ushare

# 配置 Nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

# 开放端口
EXPOSE 80

# 启动服务
CMD ["sh", "-c", "ushare & nginx -g 'daemon off;'"]