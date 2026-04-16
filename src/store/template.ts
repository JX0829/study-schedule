/**
 * 任务模板管理 - 家长可配置的任务选项
 */

import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/date';
import type { TaskType } from '@/types';

// ============ 任务模板项 ============

export interface TaskTemplateItem {
  id: string;
  familyId: string;
  name: string;
  type: TaskType;
  points: number;
  description?: string;
  isCustom: boolean; // 是否家长自定义
  createdAt: string;
}

// ============ 奖惩模板项 ============

export interface RewardTemplateItem {
  id: string;
  familyId: string;
  name: string;
  points: number; // 正数为奖励，负数为惩罚
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

// ============ Store ============

interface TemplateState {
  taskTemplates: TaskTemplateItem[];
  rewardTemplates: RewardTemplateItem[];
  
  // Actions
  addTaskTemplate: (template: Omit<TaskTemplateItem, 'id' | 'createdAt'>) => TaskTemplateItem;
  updateTaskTemplate: (id: string, updates: Partial<TaskTemplateItem>) => void;
  deleteTaskTemplate: (id: string) => void;
  
  addRewardTemplate: (template: Omit<RewardTemplateItem, 'id' | 'createdAt'>) => RewardTemplateItem;
  updateRewardTemplate: (id: string, updates: Partial<RewardTemplateItem>) => void;
  deleteRewardTemplate: (id: string) => void;
  
  initDefaultTemplates: (familyId: string) => void;
  loadFromStorage: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  taskTemplates: [],
  rewardTemplates: [],

  addTaskTemplate: (data) => {
    const template: TaskTemplateItem = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const templates = [...get().taskTemplates, template];
    storage.set('task_template_items', templates);
    set({ taskTemplates: templates });
    return template;
  },

  updateTaskTemplate: (id, updates) => {
    const templates = get().taskTemplates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    storage.set('task_template_items', templates);
    set({ taskTemplates: templates });
  },

  deleteTaskTemplate: (id) => {
    const templates = get().taskTemplates.filter(t => t.id !== id);
    storage.set('task_template_items', templates);
    set({ taskTemplates: templates });
  },

  addRewardTemplate: (data) => {
    const template: RewardTemplateItem = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const templates = [...get().rewardTemplates, template];
    storage.set('reward_template_items', templates);
    set({ rewardTemplates: templates });
    return template;
  },

  updateRewardTemplate: (id, updates) => {
    const templates = get().rewardTemplates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    storage.set('reward_template_items', templates);
    set({ rewardTemplates: templates });
  },

  deleteRewardTemplate: (id) => {
    const templates = get().rewardTemplates.filter(t => t.id !== id);
    storage.set('reward_template_items', templates);
    set({ rewardTemplates: templates });
  },

  initDefaultTemplates: (familyId) => {
    // 默认任务模板
    const defaultTasks: Omit<TaskTemplateItem, 'id' | 'createdAt'>[] = [
      { familyId, name: '完成作业', type: 'homework', points: 10, isCustom: false },
      { familyId, name: '晨读', type: 'habit', points: 5, isCustom: false },
      { familyId, name: '课外阅读', type: 'practice', points: 8, isCustom: false },
      { familyId, name: '钢琴练习', type: 'practice', points: 8, isCustom: false },
      { familyId, name: '整理房间', type: 'habit', points: 5, isCustom: false },
      { familyId, name: '按时起床', type: 'habit', points: 3, isCustom: false },
      { familyId, name: '按时睡觉', type: 'habit', points: 3, isCustom: false },
    ];
    
    // 默认奖惩模板
    const defaultRewards: Omit<RewardTemplateItem, 'id' | 'createdAt'>[] = [
      { familyId, name: '主动帮助家务', points: 5, isCustom: false },
      { familyId, name: '考试进步', points: 20, isCustom: false },
      { familyId, name: '完成任务特别棒', points: 10, isCustom: false },
      { familyId, name: '迟到', points: -5, isCustom: false },
      { familyId, name: '未按时完成作业', points: -10, isCustom: false },
    ];
    
    defaultTasks.forEach(t => get().addTaskTemplate(t));
    defaultRewards.forEach(r => get().addRewardTemplate(r));
  },

  loadFromStorage: () => {
    const taskTemplates = storage.get<TaskTemplateItem[]>('task_template_items') || [];
    const rewardTemplates = storage.get<RewardTemplateItem[]>('reward_template_items') || [];
    set({ taskTemplates, rewardTemplates });
  },
}));