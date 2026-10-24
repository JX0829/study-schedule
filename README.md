<div align="center">

# 📚 StudyPlan (study-schedule)

**Daily Task Management & Positive Habit Building System for Kids**  
**小朋友每日任务规划与习惯培养激励系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Related Project: autocontent-pipeline](https://img.shields.io/badge/Companion%20Project-autocontent--pipeline-rose.svg)](https://github.com/JX0829/autocontent-pipeline)
[![React 18](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite 5](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Multi-Channel Push](https://img.shields.io/badge/Push-Feishu%20%7C%20WeCom%20%7C%20TG%20%7C%20PushMe-brightgreen.svg)](#-multi-channel-push--多平台即时通知)

<p align="center">
  <a href="#english">English</a> •
  <a href="#chinese">中文</a> •
  <a href="#tech-stack">Tech Stack / 技术选型</a> •
  <a href="https://github.com/JX0829/autocontent-pipeline">🔗 AutoContent-Pipeline Repository</a>
</p>

</div>

---

<a name="english"></a>
## 🌐 English Overview

**StudyPlan** is a dual-interface habit-building and daily task planner designed for families. Built with modern web technologies (React 18 + Vite 5 + TypeScript), it helps parents create balanced schedules while encouraging kids with positive point incentives and gamified rewards.

### 🌟 Key Highlights

- 🧒 **Child UI (`/`)**: A gamified, distraction-free portal with cosmic dark-mode aesthetics. Kids can check upcoming homework/habits, submit completed tasks with one tap, track accumulated points, and request reward redemptions.
- 👨‍👩‍👧 **Parent Dashboard (`/parent/index.html`)**: A comprehensive management panel for task templates, point rules, daily assignments, completion verification, and review history.
- 📬 **Multi-Channel Push Notifications**: Built-in relay engine supporting instant notifications across **Feishu (Lark)**, **WeCom (Enterprise WeChat)**, **Telegram**, and **PushMe** with zero client CORS issues.
- ☁️ **Hybrid Cloud Sync**: Modernized storage architecture combining MongoDB cloud persistence, in-memory caching, and localStorage fallbacks for offline support.
- 🛡️ **Positive Reinforcement**: Zero-penalty philosophy focused on celebrating consistency and achievements.

### 📁 Companion Project
- Check out [**autocontent-pipeline**](https://github.com/JX0829/autocontent-pipeline) — an end-to-end automated tech short video production engine (Remotion 4.x + Feishu HITL cards + Playwright) by the same author!

---

<a name="chinese"></a>
## 🇨🇳 中文说明

**StudyPlan** 是一套基于 React + Vite + TypeScript 开发的家庭儿童任务管理与习惯养成系统。通过同一套工程代码支持双端独立应用与组件复用，帮助家长科学规划孩子的每日作业与生活习惯。

### 🌟 核心特性

- 🧒 **孩子端 (`/`)**：深色太空科技风激励界面，孩子可清晰查看当日待办、提交打卡签字、查看积分余额并自主申请兑换心仪奖励。
- 👨‍👩‍👧 **家长端 (`/parent/index.html`)**：功能完善的后台管理，涵盖任务模板配置、每日任务编排、积分增减、打卡审核与兑换核验。
- 📬 **多通道即时推送**：内置 Node.js 中继引擎，支持**飞书富文本卡片**、**企业微信 Markdown**、**Telegram 机器人**及 **PushMe** 聚合推送，彻底杜绝前端跨域与移动端网络限制。
- ☁️ **多级存储架构**：采用“MongoDB 云端持久化 + 内存快速缓存 + 本地 LocalStorage 备份”多级存储，支持多设备跨端实时互通。
- 🛡️ **全面正向激励**：告别惩罚扣分机制，以积极正向的积分回馈培养自律好习惯。

### 📁 关联姊妹项目
- 欢迎探索 [**autocontent-pipeline**](https://github.com/JX0829/autocontent-pipeline) — 基于 Remotion 4.x 纯代码渲染、飞书 HITL 移动端审批与全自动分发的短视频生产流水线！

---

<a name="tech-stack"></a>
## 🛠️ Tech Stack / 技术选型

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide Icons
- **State Management**: Zustand (Multi-tier cache & persistence)
- **Backend / Relay**: Node.js, Express, MongoDB (located under `server/`)
- **Push Engine**: Native fetch relay supporting Feishu Webhook, WeCom Webhook, Telegram Bot API, and PushMe

---

## 🚀 Quick Start / 快速上手

### 1. Requirements / 环境要求
- Node.js (v18+ recommended)
- MongoDB (Local or remote instance)

### 2. Start Backend Server / 启动后端服务

```bash
cd server
npm install
npm start
# Runs on http://localhost:3002 by default
```

### 3. Start Frontend Dual-App / 启动前端双端应用

```bash
# Return to project root
cd ..
npm install
npm run dev
# Default listening on http://localhost:3333
```

- **Child UI / 孩子端**: `http://localhost:3333/`
- **Parent UI / 家长端**: `http://localhost:3333/parent/index.html`

---

## 📁 Directory Structure / 目录结构

```text
.
├── server/                 # Node.js/MongoDB 后端与消息推送分发服务
│   ├── index.js            # Express API 服务入口
│   └── pushService.js      # 飞书/企微/TG/PushMe 聚合分发引擎
├── src/                    # 前端核心源码
│   ├── components/         # 业务与 UI 组件 (Tailwind + React)
│   ├── pages/              # 孩子端页面及家长端模块页面
│   ├── store/              # Zustand 状态仓库 (任务、积分、家庭)
│   ├── types/              # TypeScript 核心类型定义
│   └── utils/              # MongoDB 同步、存储适配器与推送模块
├── parent/                 # 家长端入口文件
└── dist/                   # 生产打包产物
```

---

## 📄 License / 开源协议

Released under the [MIT License](LICENSE).
