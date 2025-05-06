# 第一阶段：构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app
RUN npm install -g pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install
COPY frontend .
RUN pnpm run build

# 第二阶段：构建 Golang 后端
FROM golang:alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY main.go internal ./
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 第三阶段：生成最终镜像
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY --from=backend-builder /app/main /app/main

# 配置 Nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

# 开放端口
EXPOSE 80

# 启动服务
CMD sh -c "/app/main & nginx -g 'daemon off;'"