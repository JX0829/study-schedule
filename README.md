# StudyPlan - 小朋友每日任务规划系统

基于 React + Vite + TypeScript 开发的家庭儿童任务管理工具，帮助家长科学规划孩子的每日任务，通过积分激励机制培养孩子良好的学习和生活习惯。

## 产品特性

本项目采用一套代码支持双端独立应用（通过一套 Vite 配置共享业务逻辑和组件）：
- **孩子端 (Child UI)**：极简且带有激励反馈的界面，方便孩子查看当日任务、提交完成申请、查看当前积分与兑换奖励。
- **家长端 (Parent UI)**：全面的管理后台，支持任务模板配置、当日任务分配、积分系统设置、完成审核及统计报表查看。

### 核心功能模块

- **任务管理**：分为作业、练习、习惯三类，支持预设任务模板、快捷规划当日任务和自定义时间段划分。移除惩罚扣分机制，全方位正向激励。
- **积分系统**：完成任务赚取积分。支持积分上限及锁定机制（兑换奖励时锁定，家长审核后扣除）。
- **奖励兑换**：家长配置奖励库，孩子自主申请兑换，涵盖完整的确认和超时自动确认业务流。
- **消息提醒**：采用 PushMe 搭配自建 Proxy 推送提醒（包括任务提醒、超时提醒、家长审核通知等）。
- **云端存储同步**：数据流架构已由早期的纯 LocalStorage 演进为 **“MongoDB 云端持久化 + 内存缓存 + LocalStorage 备份”** 架构，实现了多端数据互通，并保留了离线缓存能力。

## 技术选型

- **核心框架**: React 18
- **构建工具**: Vite 5
- **语言**: TypeScript 5
- **状态管理**: Zustand (集成内存缓存和多级存储机制)
- **样式方案**: Tailwind CSS + PostCSS
- **后端服务**: Node.js + Express + MongoDB (位于 `server/` 目录，提供持久化 API)

## 快速开始

### 前提条件

- Node.js (建议 v18+)
- MongoDB (本地或云端实例)

### 1. 启动后端服务 (持久化数据层)

由于已迁移至 MongoDB 作为主力存储，使用前需启动后端服务。默认连接地址为 `mongodb://localhost:27017`（也可通过 `server/.env` 或环境变量 `MONGO_URL` 修改）。

```bash
cd server
npm install
# 启动后端服务 (默认运行在 3002 端口)
npm start
```
*提示：了解详情或执行数据迁移请参考 [MongoDB 迁移说明](./MONGODB_GUIDE.md)。*

### 2. 启动前端双端应用

在项目根目录下执行：

```bash
npm install

# 启动开发服务器
npm run dev
# 或分别打印端点信息: npm run dev:all
```

前端服务通过代理将 `/api` 转发至后端，并在同端口挂载两套页面（默认 `http://localhost:3333`）：
- **孩子端入口**: `http://localhost:3333/`
- **家长端入口**: `http://localhost:3333/parent/index.html`

### 3. 配置推送代理 (可选)

由于浏览器存在 CORS 跨域限制，前端无法直接向 PushMe 发起调用请求。如果需要启用推送提醒功能，请参考 [PushMe 代理部署指南](./PUSH_PROXY_GUIDE.md) 部署免费的 Cloudflare Worker，并在 `src/utils/push.ts` 中配置你自己的代理地址。

## 核心目录结构

```text
.
├── server/                 # Node.js/MongoDB 后端服务 (提供存储与同步 API)
├── src/                    # 前端核心源码 (业务逻辑、状态、孩子端及共享组件)
│   ├── components/         # 业务与基础 UI 组件 (Tailwind + React)
│   ├── pages/              # 孩子端页面及家长端各业务模块页面
│   ├── store/              # Zustand 状态管理库 (Task, Points, Reward, Family...)
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数 (包含 MongoDB 同步、缓存、推送封装等)
├── parent/                 # 家长端应用入口文件
├── requirements/           # 产品需求文档 (PRD)，包含详尽的系统设计
├── MONGODB_GUIDE.md        # 数据库使用及迁移操作指南
└── PUSH_PROXY_GUIDE.md     # PushMe 推送代理部署说明
```

## 部署建议

- **前端应用构建**：运行 `npm run build`，Vite 将通过 `rollupOptions.input` 分别将主端和 `parent/` 目录的资源打包至 `dist/`，可统一部署到 Nginx, Vercel 或 Netlify 等静态托管平台。
- **后端 API 服务**：将 `server/` 部署至 Node 环境（搭配 PM2 或 Docker），并将前端的 `/api` 请求反向代理至该服务。
