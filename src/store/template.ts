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
  
  // 批量保存（覆盖模式）
  saveTaskTemplates: (familyId: string, templates: Array<{name: string; type: TaskType; points: number; isCustom: boolean}>) => void;
  saveRewardTemplates: (familyId: string, templates: Array<{name: string; points: number; isCustom: boolean}>) => void;
  
  // 批量保存（追加模式）
  appendTaskTemplates: (familyId: string, templates: Array<{name: string; type: TaskType; points: number; isCustom: boolean}>) => void;
  appendRewardTemplates: (familyId: string, templates: Array<{name: string; points: number; isCustom: boolean}>) => void;
  
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
    storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, templates);
    set({ taskTemplates: templates });
    return template;
  },

  updateTaskTemplate: (id, updates) => {
    const templates = get().taskTemplates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, templates);
    set({ taskTemplates: templates });
  },

  deleteTaskTemplate: (id) => {
    const templates = get().taskTemplates.filter(t => t.id !== id);
    storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, templates);
    set({ taskTemplates: templates });
  },

  addRewardTemplate: (data) => {
    const template: RewardTemplateItem = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const templates = [...get().rewardTemplates, template];
    storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, templates);
    set({ rewardTemplates: templates });
    return template;
  },

  updateRewardTemplate: (id, updates) => {
    const templates = get().rewardTemplates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, templates);
    set({ rewardTemplates: templates });
  },

  deleteRewardTemplate: (id) => {
    const templates = get().rewardTemplates.filter(t => t.id !== id);
    storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, templates);
    set({ rewardTemplates: templates });
  },

  // 批量保存任务模板（覆盖已有）
  saveTaskTemplates: (familyId, newTemplates) => {
    // 保留其他 familyId 的任务模板，替换当前 familyId 的
    const otherTemplates = get().taskTemplates.filter(t => t.familyId !== familyId);
    
    // 创建新模板
    const createdTemplates: TaskTemplateItem[] = newTemplates.map(t => ({
      id: generateId(),
      familyId,
      name: t.name,
      type: t.type,
      points: t.points,
      isCustom: t.isCustom,
      createdAt: new Date().toISOString(),
    }));
    
    const allTemplates = [...otherTemplates, ...createdTemplates];
    storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, allTemplates);
    set({ taskTemplates: allTemplates });
  },

  // 批量保存奖惩模板（覆盖已有）
  saveRewardTemplates: (familyId, newTemplates) => {
    // 删除所有该 familyId 的奖惩模板
    const otherTemplates = get().rewardTemplates.filter(t => t.familyId !== familyId);
    
    // 创建新模板
    const createdTemplates: RewardTemplateItem[] = newTemplates.map(t => ({
      id: generateId(),
      familyId,
      name: t.name,
      points: t.points,
      isCustom: t.isCustom,
      createdAt: new Date().toISOString(),
    }));
    
    const allTemplates = [...otherTemplates, ...createdTemplates];
    storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, allTemplates);
    set({ rewardTemplates: allTemplates });
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

  // 批量保存任务模板（追加模式）
  appendTaskTemplates: (familyId, newTemplates) => {
    // 保留已有的模板
    const existingTemplates = get().taskTemplates;
    
    // 创建新模板
    const createdTemplates: TaskTemplateItem[] = newTemplates.map(t => ({
      id: generateId(),
      familyId,
      name: t.name,
      type: t.type,
      points: t.points,
      isCustom: t.isCustom,
      createdAt: new Date().toISOString(),
    }));
    
    const allTemplates = [...existingTemplates, ...createdTemplates];
    storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, allTemplates);
    set({ taskTemplates: allTemplates });
  },

  // 批量保存奖惩模板（追加模式）
  appendRewardTemplates: (familyId, newTemplates) => {
    // 保留已有的模板
    const existingTemplates = get().rewardTemplates;
    
    // 创建新模板
    const createdTemplates: RewardTemplateItem[] = newTemplates.map(t => ({
      id: generateId(),
      familyId,
      name: t.name,
      points: t.points,
      isCustom: t.isCustom,
      createdAt: new Date().toISOString(),
    }));
    
    const allTemplates = [...existingTemplates, ...createdTemplates];
    storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, allTemplates);
    set({ rewardTemplates: allTemplates });
  },

  loadFromStorage: () => {
    // 加载任务模板 - 尝试从多个可能的旧键名迁移
    let taskTemplates = storage.get<TaskTemplateItem[]>(STORAGE_KEYS.TASK_TEMPLATE_ITEMS);
    
    // 如果新键名没有数据，尝试从旧键名迁移
    if (!taskTemplates || taskTemplates.length === 0) {
      // 尝试多个可能的旧键名（包括带前缀和不带前缀的）
      const possibleKeys = [
        STORAGE_KEYS.TASK_TEMPLATES,
        'task_template_items',
        'task_templates',
      ];
      
      for (const key of possibleKeys) {
        try {
          // 先用 storage（带前缀）尝试
          let oldData = storage.get<TaskTemplateItem[]>(key);
          if (oldData && oldData.length > 0) {
            console.log('迁移数据从键:', key, ', 数量:', oldData.length, '条');
            storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, oldData);
            taskTemplates = oldData;
            break;
          }
          // 再直接尝试 localStorage（不带前缀）
          const rawKey = 'studyplan_' + key;
          const rawData = localStorage.getItem(rawKey);
          if (rawData) {
            oldData = JSON.parse(rawData) as TaskTemplateItem[];
            if (oldData && oldData.length > 0) {
              console.log('迁移数据从 localStorage 键:', rawKey, ', 数量:', oldData.length, '条');
              storage.set(STORAGE_KEYS.TASK_TEMPLATE_ITEMS, oldData);
              taskTemplates = oldData;
              break;
            }
          }
        } catch (e) {
          console.log('尝试键', key, '失败:', e);
        }
      }
    }
    
    taskTemplates = taskTemplates || [];
    console.log('最终加载的任务模板:', taskTemplates.length, '条');
    
    // 加载奖惩模板
    let rewardTemplates = storage.get<RewardTemplateItem[]>(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS);
    
    if (!rewardTemplates || rewardTemplates.length === 0) {
      const possibleKeys = ['reward_template_items', 'reward_templates'];
      
      for (const key of possibleKeys) {
        try {
          let oldData = storage.get<RewardTemplateItem[]>(key);
          if (oldData && oldData.length > 0) {
            console.log('迁移奖惩数据从键:', key, ', 数量:', oldData.length, '条');
            storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, oldData);
            rewardTemplates = oldData;
            break;
          }
          const rawKey = 'studyplan_' + key;
          const rawData = localStorage.getItem(rawKey);
          if (rawData) {
            oldData = JSON.parse(rawData) as RewardTemplateItem[];
            if (oldData && oldData.length > 0) {
              console.log('迁移奖惩数据从 localStorage 键:', rawKey, ', 数量:', oldData.length, '条');
              storage.set(STORAGE_KEYS.REWARD_TEMPLATE_ITEMS, oldData);
              rewardTemplates = oldData;
              break;
            }
          }
        } catch (e) {
          console.log('尝试奖惩键', key, '失败:', e);
        }
      }
    }
    
    rewardTemplates = rewardTemplates || [];
    console.log('最终加载的奖惩模板:', rewardTemplates.length, '条');
    
    set({ taskTemplates, rewardTemplates });
  },
}));