# Minecraft Web 管理系统

基于 Node.js Express 的 Minecraft 服务器 Web 管理系统，使用 RCON 协议进行远程管理。

## 项目结构

```
mcweb/
├── server/
│   ├── index.js           # 服务器入口
│   ├── routes/            # 路由目录
│   ├── controllers/       # 控制器目录
│   ├── models/            # 数据模型目录
│   ├── middleware/        # 中间件目录
│   └── utils/
│       └── rcon.js        # RCON 工具类
├── client/
│   ├── index.html         # 前端页面
│   ├── style.css          # 样式文件
│   └── script.js          # 前端脚本
├── package.json
├── .env.example
└── .gitignore
```

## 安装依赖

```bash
pnpm install --shamefully-hoist
```

## 配置环境变量

复制 `.env.example` 为 `.env` 并配置相应的环境变量：

```bash
cp .env.example .env
```

## 运行项目

开发模式（自动重启）:
```bash
pnpm run dev
```

生产模式:
```bash
pnpm start
```

服务器将在 `http://localhost:3000` 启动

## 技术栈

### 后端
- Express.js - Web 框架
- Mongoose - MongoDB ODM
- bcryptjs - 密码加密
- jsonwebtoken - JWT 认证
- dotenv - 环境变量管理
- cors - 跨域资源共享
- rcon-client - RCON 协议客户端

### 前端
- TailwindCSS - CSS 框架（CDN）
- 原生 JavaScript

## 功能特性

- ✅ RCON 远程管理
- ✅ 用户认证系统（已实现）
- ✅ 服务器状态监控（待实现）
- ✅ 命令控制台
- ✅ 响应式设计

## 开发说明

该项目提供了基础的项目结构和配置，需要根据实际需求实现具体的业务逻辑：

1. 在 `server/routes/` 中添加路由
2. 在 `server/controllers/` 中添加控制器
3. 在 `server/models/` 中添加数据模型
4. 在 `server/middleware/` 中添加中间件

## License

ISC
