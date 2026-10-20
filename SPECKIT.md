# SpecKit: Kids Daily Task Planner (小朋友每日任务规划系统 - StudyPlan 重构规范)

**Project**: StudyPlan (小朋友任务规划系统)  
**Workspace**: `/Users/a1/Downloads/workspace/dev/project/StudyPlan`  
**Date**: 2026-10-20  
**Status**: ready_for_refactor  
**Complexity**: large  

---

## 一、项目现状分析与故障排查

### 1.1 无法启动的根本原因
1. **进程守护缺失**：系统依赖 `PM2` 与 `ecosystem.config.cjs` 进行后台常驻守护，由于 Node 版本升级或全局环境变动，全局 `pm2` 命令此前未安装。
2. **服务处于停止状态**：没有进程在监听前端 `3333` 端口与后端 `3002` 端口。
3. **已恢复状态**：已在当前 Node 运行时安装 `pm2` 并执行 `./start.sh restart`。
   - **后端 API**: `http://localhost:3002/api/health`（MongoDB 连接正常 `mongodb://192.168.31.170:27017`，状态 `online`）
   - **孩子端**: `http://localhost:3333/`（HTTP 200 `online`）
   - **家长端**: `http://localhost:3333/parent/index.html`（HTTP 200 `online`）

---

## 二、重构动机与痛点梳理 (Why Refactor)

### 2.1 架构与代码债务
1. **巨石页面逻辑**：
   - `HomePage.tsx` 超过 1000 行，任务列表渲染、倒计时器、奖励申请弹窗、打卡动效、补签逻辑全混杂在单个组件中。
2. **状态与存储割裂**：
   - 早期设计基于 LocalStorage，后期叠加了 MongoDB 远程同步。本地与云端存在竞态条件与版本覆盖风险。
3. **双端路由组织方式陈旧**：
   - 采用多 HTML 入口（`index.html` 与 `parent/index.html`）通过 Vite 打包配置分流，缺乏统一的 SPA 路由与鉴权拦截。
4. **小程序迁移准备不足**：
   - PRD 原定优先考虑复用到微信小程序，但当前深度依赖 DOM 原生事件与 Web 特有 API，缺少跨端原子化 UI 抽离。

---

## 三、系统架构图 (Architecture & Flow)

```
+-----------------------------------------------------------------------------------+
|                                前端展现层 (React 18 + Vite)                          |
|                                                                                   |
|    +-----------------------------+               +----------------------------+   |
|    |     👶 孩子端 (Child View)    |               |    👨‍👩‍👧 家长端 (Parent View)    |   |
|    |  - 今日任务时间轴 (作业/习惯) |               |  - 模板规划器 (周循环/自定义)  |   |
|    |  - 打卡提交 / 倒计时提醒     |               |  - 任务审批与积分入账       |   |
|    |  - 积分存折 / 奖励自选申请   |               |  - 奖励库配置 / 兑换审核    |   |
|    +--------------+--------------+               +-------------+--------------+   |
|                   │                                            │                  |
|                   v                                            v                  |
|    +--------------------------------------------------------------------------+   |
|    |                        统一状态管理层 (Zustand Stores)                      |   |
|    |      [taskStore]   [templateStore]   [pointsStore]   [rewardStore]       |   |
|    +------------------------------------+-------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          |
                      REST API (Axios / TanStack Query)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        后端服务层 (Express / Node.js 3002)                         |
|                                                                                   |
|  - 认证与家长 PIN 码校验 (`/api/auth`)                                              |
|  - 任务模板与每日规划派生引擎 (`/api/tasks/schedule`)                                |
|  - 积分事务账本与审批工作流 (`/api/points/transaction`)                              |
|  - 消息推送代理中继 (`/api/push` 适配 PushMe / 飞书)                                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                    Mongoose ODM
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     持久化存储层 (192.168.31.170:27017 MongoDB)                     |
|                                                                                   |
|   [users]           [task_templates]    [daily_tasks]                             |
|   [point_ledger]    [rewards]           [redemption_requests]                     |
+-----------------------------------------------------------------------------------+
```

---

## 四、重构核心领域模型 (Domain Data Models)

### 4.1 核心表设计规范

```typescript
// 1. 任务模板 (Task Template)
interface TaskTemplate {
  id: string;
  title: string;              // 如 "数学计算练习"
  category: 'homework' | 'practice' | 'habit'; // 作业 / 练习 / 习惯
  points: number;             // 正向激励分值 (+5 ~ +20)
  timeSlot: {
    start: string;            // "19:00"
    end: string;              // "19:45"
  };
  repeatRule: 'daily' | 'workday' | 'weekend' | 'custom';
  customDays?: number[];      // 1-7
  reminderMinutes: number;    // 开始前提醒 (默认 5 分钟)
}

// 2. 当日任务实例 (Daily Task)
interface DailyTask {
  id: string;
  date: string;               // "2026-10-20"
  templateId?: string;
  title: string;
  category: 'homework' | 'practice' | 'habit';
  points: number;
  timeSlot: { start: string; end: string };
  status: 'pending' | 'submitted' | 'confirmed' | 'rejected';
  submittedAt?: string;
  confirmedAt?: string;
  notes?: string;             // 孩子留言或完成备注
}

// 3. 积分账本 (Point Ledger)
interface PointLedger {
  id: string;
  change: number;             // 如 +10 或 -50
  balanceAfter: number;
  reason: string;             // "完成[数学作业]" 或 "兑换[乐高拼装]"
  taskId?: string;
  rewardId?: string;
  createdAt: string;
}

// 4. 奖励兑换 (Redemption Request)
interface RedemptionRequest {
  id: string;
  rewardTitle: string;
  costPoints: number;
  status: 'locked' | 'approved' | 'rejected'; // 申请时锁定积分，审核后扣除
  requestedAt: string;
  reviewedAt?: string;
}
```

---

## 五、重构实施计划 (Refactor Plan)

### 阶段 1：目录规范化与公共模块拆解
- 拆分 `HomePage.tsx`：分解为 `TaskTimeline`、`PointsBadge`、`RewardShopModal`、`TaskSubmitDialog` 独立组件。
- 引入统一 SPA 路由（React Router v6），替代 Vite 多页面打包方案，路由结构：
  - `/child`（默认入口，大卡片高饱和度儿童界面）
  - `/parent`（家长 PIN 码验证、配置后台）

### 阶段 2：数据层严谨化（双写与竞态消除）
- 引入 TanStack Query (React Query) 处理 `/api` 数据同步与服务端缓存。
- 强化后端 `/server` 路由：从纯 KV 存取重构为遵循 RESTful 的实体控制器（TaskController, PointsController）。

### 阶段 3：正向激励机制与推送体验
- 固化全正向激励规则（彻底移除惩罚扣分，保留未达标复核机制）。
- 整合 PushMe 搭配家长飞书通知代理，实现“任务开始前提醒”与“孩子提交确认”。

---

## 六、重构任务清单 (Refactor Tasks)

- [ ] **Task 1: 前端组件原子化解耦**
  - [ ] 提取 `src/components/child/` 儿童端专属组件
  - [ ] 提取 `src/components/parent/` 家长端表单与列表组件
  - [ ] 重构 `HomePage.tsx` 降至 200 行以内
- [ ] **Task 2: 路由与鉴权统一**
  - [ ] 安装并配置 `react-router-dom`
  - [ ] 实现家长端 PIN 码路由守卫 (`RequireParentAuth`)
- [ ] **Task 3: 后端数据契约与接口升级**
  - [ ] 封装 Mongoose Schemas (Task, Template, Point, Reward)
  - [ ] 提供幂等性的积分打卡接口 (`POST /api/tasks/:id/confirm`)
- [ ] **Task 4: 编译打包与容器化**
  - [ ] 编写标准化 Dockerfile 与 docker-compose 配置
  - [ ] 固化 PM2 守护与服务自启机制

---

## 七、验收标准 (Done When)

- [ ] 孩子端与家长端均能秒级打开，无白屏或数据同步丢失。
- [ ] 孩子提交任务 ➔ 家长端实时展示待审核 ➔ 家长确认 ➔ 积分实时入账且记录在流水中。
- [ ] 代码分层清晰，无超过 300 行的单一巨石组件文件。
- [ ] 支持离线弱网操作并在网络恢复时自动同步云端。

---

## 八、视觉可读性与响应式紧急修复补充 (Visual Readability & Layout Fixes)

**Date**: 2026-10-20  
**Status**: completed  

### 修复内容与根因处置
1. **输入框内容与 Placeholder 对比度**：
   - 根因：部分输入框缺少 `bg`、`text` 显式类名，沿用旧版 `border-gray-300`，在深空背景下对比度不足 2:1。
   - 处置：在全局 CSS (`src/index.css`) 注入基底规范，将所有 `input` 与 `textarea` 固化为 `bg-[#0B132B]/88 border-sky-500/35 text-white`，`placeholder` 提升至高辨识度 `text-slate-400`。
   - 同步修正 11 个业务组件（`HomePage`, `PushSettings`, `TodayTasksTab`, `PrizesTab`, `TaskTemplatesTab`, `RewardTemplatesTab` 等）中的旧类名。
2. **文字层级辨识度（`text-slate-100/200`）**：
   - 全局将深蓝背景下的细淡文字升级为 `text-white font-semibold`，确保任务标题、关键分值与说明文字清晰高亮。
3. **底部导航栏组件（TabBar）漂移出屏幕左侧**：
   - 根因：`className` 同时包含 `sm:left-auto` 与 `sm:left-1/2 -translate-x-1/2` 产生断点解析冲突，导致向左偏移 50% 移出屏幕。
   - 处置：修正为全局安全居中容器规范：`fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg`。

