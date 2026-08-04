# 羽球集 - 微信云托管 Dockerfile
# 多阶段构建

# ---- 构建阶段 ----
FROM golang:1.21-alpine AS builder

# 设置 Go 代理（国内加速）
ENV GOPROXY=https://goproxy.cn,direct
ENV CGO_ENABLED=0
ENV GOOS=linux

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并构建
COPY . .
RUN go build -ldflags="-s -w" -o /app/server .

# ---- 运行阶段 ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/server .

# 云托管自动注入 PORT 环境变量，默认 8080
EXPOSE 8080

CMD ["./server"]
