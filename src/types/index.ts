/**
 * 核心类型定义
 * 所有业务实体的类型都在这里定义
 */

// ============ 用户与家庭 ============

export type UserRole = 'parent' | 'child';

export interface Family {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  familyId: string;
  role: UserRole;
  name: string;
  avatar?: string;
  createdAt: string;
}

// ============ 任务类型 ============

export type TaskType = 'homework' | 'practice' | 'habit';
export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'completed' | 'rejected' | 'expired';
export type RepeatRule = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface TaskTemplate {
  id: string;
  familyId: string;
  name: string;
  type: TaskType;
  points: number;
  duration?: number; // 预计时长（分钟）
  repeatRule: RepeatRule;
  timeSlotId?: string;
  isEnabled: boolean;
  createdAt: string;
}

// ============ 时间段 ============

export interface TimeSlot {
  id: string;
  familyId: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  order: number;
  createdAt: string;
}

// ============ 当日任务 ============

export interface DailyTask {
  id: string;
  familyId: string;
  childId: string;
  date: string; // YYYY-MM-DD
  templateId?: string;
  name: string;
  type: TaskType;
  points: number;
  timeSlotId: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: TaskStatus;
  completedAt?: string;
  submittedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  autoConfirmed: boolean;
  rejectedReason?: string;
  createdAt: string;
  isExtraReward?: boolean; // 标识是否为家长额外发放的奖励
}

// ============ 积分系统 ============

export type PointsChangeType = 'earn' | 'bonus' | 'redeem_lock' | 'redeem_unlock' | 'redeem_deduct' | 'extra_reward' | 'extra_penalty';

export interface PointsRecord {
  id: string;
  familyId: string;
  childId: string;
  changeType: PointsChangeType;
  points: number;
  balanceAfter: number;
  lockedPoints: number;
  relatedTaskId?: string;
  relatedRedemptionId?: string;
  description: string;
  createdAt: string;
}

export interface ChildPoints {
  childId: string;
  balance: number;
  locked: number;
  totalEarned: number;
  totalRedeemed: number;
}

// ============ 奖励系统 ============

export type RedemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Reward {
  id: string;
  familyId: string;
  name: string;
  cost: number;
  stock?: number; // undefined = 无限
  usageRule?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RedemptionRecord {
  id: string;
  familyId: string;
  childId: string;
  rewardId: string;
  pointsCost: number;
  lockedAt: string;
  status: RedemptionStatus;
  redeemedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  autoConfirmed: boolean;
  rejectedReason?: string;
}

// ============ 预设模板 ============

export interface PresetTemplate {
  id: string;
  category: 'learning' | 'life' | 'interest';
  name: string;
  type: TaskType;
  defaultPoints: number;
  suggestedDuration?: number;
}

// ============ 配置 ============

export interface SystemConfig {
  pointsLimit: number; // 积分上限
  confirmTimeout: number; // 确认超时时间（小时）
  redemptionTimeout: number; // 兑换超时时间（小时）
}

// ============ 统计 ============

export interface DailyStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  pointsEarned: number;
  autoConfirmedCount: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalPoints: number;
  dailyStats: DailyStats[];
}

// ============ 模块配置 ============

export interface ModuleConfig {
  tasks: boolean;      // 任务模块
  points: boolean;     // 积分模块
  rewards: boolean;    // 奖励/抽奖模块
}