# 羽球集 (BadmintonHub)

羽毛球个人管理微信小程序 —— 记录技术水平、装备信息，追踪每次打球的开销与运动时长，量化你的羽球生活。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 微信小程序原生开发 |
| 后端 | Go 1.22 + Gin + GORM |
| 数据库 | MySQL 8.0 |
| 部署 | 微信云托管（Docker 容器） |
| 认证 | 微信登录 + JWT |

## 项目结构

```
badmintonhub/
├── server/                     # Go 后端
│   ├── main.go                 # 入口：路由 + CORS + 自动迁移
│   ├── go.mod / go.sum         # Go 依赖
│   ├── Dockerfile              # 多阶段构建
│   ├── container.config.json   # 云托管配置
│   ├── config/config.go        # 数据库 + 环境变量
│   ├── models/models.go        # GORM 模型 + 请求响应结构体
│   ├── middleware/auth.go      # JWT 签发 + 认证拦截
│   └── handlers/               # 业务逻辑
│       ├── auth.go             # 微信登录
│       ├── user.go             # 用户档案
│       ├── bill.go             # 账单 CRUD
│       ├── activity.go         # 活动 CRUD
│       └── stats.go            # 统计汇总
│
├── miniprogram/                # 小程序前端
│   ├── app.js                  # 入口：自动登录
│   ├── app.json                # 页面注册 + tabBar
│   ├── utils/
│   │   ├── api.js              # HTTP 客户端（Token 管理 + 业务 API）
│   │   ├── constants.js        # 常量（类别/等级/频率）
│   │   └── util.js             # 工具函数
│   ├── pages/
│   │   ├── index/              # 首页（本月概览 + 快捷入口）
│   │   ├── profile/            # 个人档案（技术水平/装备/偏好）
│   │   ├── bills/              # 账单列表（按月筛选 + 分组）
│   │   ├── bill-add/           # 记账/编辑（6类别）
│   │   ├── activity/           # 活动记录/编辑
│   │   ├── activity-list/      # 活动列表（查看/编辑/删除）
│   │   └── stats/              # 统计汇总（饼图 + 柱状图）
│   └── images/                 # tabBar 图标 (SVG，需转 PNG)
│
├── database/init.sql           # MySQL 建表脚本
├── docker-compose.yml          # 本地开发环境
├── .env.example                # 环境变量模板
└── .gitignore
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/login` | 微信登录（code → JWT） | 否 |
| GET | `/api/user/profile` | 获取个人档案 | 是 |
| PUT | `/api/user/profile` | 更新个人档案 | 是 |
| GET | `/api/bills` | 账单列表（?month=2026-08&pageSize=50） | 是 |
| POST | `/api/bills` | 创建账单 | 是 |
| GET | `/api/bills/:id` | 获取单条账单 | 是 |
| PUT | `/api/bills/:id` | 更新账单 | 是 |
| DELETE | `/api/bills/:id` | 删除账单 | 是 |
| GET | `/api/activities` | 活动列表（?pageSize=20） | 是 |
| POST | `/api/activities` | 创建活动 | 是 |
| GET | `/api/activities/:id` | 获取单条活动 | 是 |
| PUT | `/api/activities/:id` | 更新活动 | 是 |
| DELETE | `/api/activities/:id` | 删除活动 | 是 |
| GET | `/api/stats/summary` | 统计汇总（?period=week/month/year/all） | 是 |
| GET | `/health` | 健康检查 | 否 |

## 本地开发

### 方式一：Docker Compose 一键启动

```bash
# 1. 复制环境变量
cp .env.example .env
# 编辑 .env 填入微信 AppID 和 AppSecret

# 2. 启动 MySQL + Go 服务
docker-compose up -d

# 3. 验证
curl http://localhost:8080/health
```

### 方式二：仅启动 MySQL，Go 本地运行

```bash
# 只启动 MySQL
docker-compose up -d mysql

# 本地运行 Go 服务
cd server
export MYSQL_DSN="root:yuqiuji_dev_2024@tcp(127.0.0.1:3306)/yuqiuji?charset=utf8mb4&parseTime=True&loc=Local"
export WX_APP_ID=your_app_id
export WX_APP_SECRET=your_app_secret
go run .
```

### 小程序前端

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. 修改 `utils/api.js` 第 2 行 `BASE_URL` 为 `http://localhost:8080/api`
4. 在 `project.config.json` 中替换 `appid`
5. SVG 图标转 PNG 放入 `images/`（或先在 `app.json` 中去掉 iconPath）

## 云托管部署

1. **微信云托管控制台** → 新建服务 → 自定义运行时
2. 关联 MySQL 数据库（云托管内置 MySQL）
3. 配置环境变量：
   - `WX_APP_ID` — 小程序 AppID
   - `WX_APP_SECRET` — 小程序 AppSecret
   - `JWT_SECRET` — JWT 签名密钥
   - `MYSQL_DSN` — 云托管自动注入
4. 推送代码 → 自动构建 Docker 镜像部署
5. 拿到云托管域名，填入 `miniprogram/utils/api.js` 的 `BASE_URL`
6. 小程序后台 → 开发管理 → 服务器域名 → 添加 request 合法域名

## 功能说明

### 个人档案
- 技术水平：新手 / 初级 / 中级 / 高级 / 专业
- 球龄、打球频率、打球类型
- 装备信息：球拍、球鞋、用球品牌、拉线磅数
- 打球偏好：常用球馆、城市、打法、惯用手

### 账单管理
- 6 大开销类别：场地费 / 球费 / 饮料 / 绑线 / 装备 / 其他
- 支持关联活动、备注
- 按月筛选、按日期分组展示

### 活动记录
- 运动时长、球馆、参与人数、备注
- 列表查看、编辑、删除
- 关联账单数量统计

### 统计汇总
- 总开销 / 笔数 / 均价
- 类别占比饼图
- 近 12 个月趋势柱状图
- 运动总时长 / 场均时长 / 最长单次
- 高频球馆排行
- 四个时间维度：本周 / 本月 / 今年 / 全部
