# 羽球集 - 微信云托管 Dockerfile
# 多阶段构建（仓库根目录版本）

# ---- 构建阶段 ----
FROM golang:1.22-alpine AS builder

ENV GOPROXY=https://goproxy.cn,direct
ENV CGO_ENABLED=0
ENV GOOS=linux

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY server/go.mod server/go.sum ./
RUN go mod download

# 复制 server 源码并构建
COPY server/ ./
RUN go build -ldflags="-s -w" -o /app/server .

# ---- 运行阶段 ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
