/**
 * 预设数据
 * 
 * 任务模板预设库和默认配置
 */

import type { PresetTemplate, TimeSlot, SystemConfig } from '@/types';

// 任务模板预设库
export const presetTemplates: PresetTemplate[] = [
  // 学习类
  { id: 'preset-1', category: 'learning', name: '晨读 20 分钟', type: 'habit', defaultPoints: 5, suggestedDuration: 20 },
  { id: 'preset-2', category: 'learning', name: '完成数学作业', type: 'homework', defaultPoints: 10 },
  { id: 'preset-3', category: 'learning', name: '完成语文作业', type: 'homework', defaultPoints: 10 },
  { id: 'preset-4', category: 'learning', name: '完成英语作业', type: 'homework', defaultPoints: 10 },
  { id: 'preset-5', category: 'learning', name: '课外阅读 30 分钟', type: 'practice', defaultPoints: 8, suggestedDuration: 30 },
  { id: 'preset-6', category: 'learning', name: '背诵古诗', type: 'practice', defaultPoints: 6, suggestedDuration: 15 },

  // 生活类
  { id: 'preset-7', category: 'life', name: '按时起床', type: 'habit', defaultPoints: 3 },
  { id: 'preset-8', category: 'life', name: '整理房间', type: 'habit', defaultPoints: 5, suggestedDuration: 10 },
  { id: 'preset-9', category: 'life', name: '洗漱', type: 'habit', defaultPoints: 3, suggestedDuration: 10 },
  { id: 'preset-10', category: 'life', name: '早餐整理', type: 'habit', defaultPoints: 3 },
  { id: 'preset-11', category: 'life', name: '主动做家务', type: 'habit', defaultPoints: 5 },
  { id: 'preset-12', category: 'life', name: '按时睡觉', type: 'habit', defaultPoints: 3 },

  // 兴趣类
  { id: 'preset-13', category: 'interest', name: '钢琴练习 30 分钟', type: 'practice', defaultPoints: 8, suggestedDuration: 30 },
  { id: 'preset-14', category: 'interest', name: '画画', type: 'practice', defaultPoints: 6, suggestedDuration: 30 },
  { id: 'preset-15', category: 'interest', name: '运动锻炼', type: 'practice', defaultPoints: 8, suggestedDuration: 30 },
  { id: 'preset-16', category: 'interest', name: '练字', type: 'practice', defaultPoints: 5, suggestedDuration: 15 },
];

// 默认时间段
export const defaultTimeSlots: Omit<TimeSlot, 'id' | 'familyId' | 'createdAt'>[] = [
  { name: '上午', startTime: '06:00', endTime: '12:00', order: 1 },
  { name: '下午', startTime: '12:00', endTime: '18:00', order: 2 },
  { name: '晚上', startTime: '18:00', endTime: '22:00', order: 3 },
];

// 默认系统配置
export const defaultSystemConfig: SystemConfig = {
  pointsLimit: 300,
  confirmTimeout: 2, // 小时
  redemptionTimeout: 24, // 小时
};

// 默认奖励示例
export const defaultRewards = [
  { name: '看动画片 30 分钟', cost: 20, usageRule: '周末可用' },
  { name: '买小玩具', cost: 100, stock: 1, usageRule: '每月限 1 次' },
  { name: '去游乐园', cost: 200, stock: 1, usageRule: '需提前预约' },
  { name: '选一个零食', cost: 15 },
  { name: '多玩 10 分钟游戏', cost: 10 },
];

// 任务类型图标和颜色
export const taskTypeConfig = {
  homework: { icon: '📝', color: 'blue', label: '作业类' },
  practice: { icon: '🎨', color: 'purple', label: '练习类' },
  habit: { icon: '✨', color: 'green', label: '习惯类' },
};

// 任务状态标签
export const taskStatusConfig = {
  pending: { label: '待开始', color: 'gray' },
  in_progress: { label: '进行中', color: 'blue' },
  submitted: { label: '待确认', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
  expired: { label: '已过期', color: 'gray' },
};