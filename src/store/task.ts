/**
 * 状态管理 - 任务模块
 */

import { create } from 'zustand';
import type { TaskTemplate, TimeSlot, DailyTask, TaskStatus } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId, formatDate } from '@/utils/date';
import { defaultTimeSlots } from '@/utils/presets';
import { pushService } from '@/utils/push';
import { useFamilyStore } from './family';

interface TaskState {
  templates: TaskTemplate[];
  timeSlots: TimeSlot[];
  dailyTasks: DailyTask[];
  
  // Template Actions
  addTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => TaskTemplate;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplate: (id: string) => void;
  
  // Time Slot Actions
  addTimeSlot: (slot: Omit<TimeSlot, 'id' | 'createdAt'>) => TimeSlot;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  initDefaultTimeSlots: (familyId: string) => void;
  
  // Daily Task Actions
  addDailyTask: (task: Omit<DailyTask, 'id' | 'createdAt' | 'autoConfirmed'>) => DailyTask;
  addDailyTaskFromTemplate: (templateId: string, childId: string, date: string, timeSlotId: string) => DailyTask | null;
  updateDailyTaskStatus: (taskId: string, status: TaskStatus, extra?: Partial<DailyTask>) => void;
  deleteDailyTask: (taskId: string) => void;
  getDailyTasksByDate: (date: string) => DailyTask[];
  getDailyTasksBySlot: (date: string, slotId: string) => DailyTask[];
  submitTask: (taskId: string) => void;
  confirmTask: (taskId: string, confirmedBy: string, auto?: boolean) => void;
  rejectTask: (taskId: string, reason: string) => void;
  copyYesterdayTasks: (todayDate: string, childId: string) => void;
  
  // Load
  loadFromStorage: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  templates: [],
  timeSlots: [],
  dailyTasks: [],

  // Template Actions
  addTemplate: (data) => {
    const template: TaskTemplate = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const templates = [...get().templates, template];
    storage.set(STORAGE_KEYS.TASK_TEMPLATES, templates);
    set({ templates });
    return template;
  },

  updateTemplate: (id, updates) => {
    const templates = get().templates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    storage.set(STORAGE_KEYS.TASK_TEMPLATES, templates);
    set({ templates });
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter(t => t.id !== id);
    storage.set(STORAGE_KEYS.TASK_TEMPLATES, templates);
    set({ templates });
  },

  toggleTemplate: (id) => {
    const template = get().templates.find(t => t.id === id);
    if (template) {
      get().updateTemplate(id, { isEnabled: !template.isEnabled });
    }
  },

  // Time Slot Actions
  addTimeSlot: (data) => {
    const slot: TimeSlot = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const timeSlots = [...get().timeSlots, slot].sort((a, b) => a.order - b.order);
    storage.set(STORAGE_KEYS.TIME_SLOTS, timeSlots);
    set({ timeSlots });
    return slot;
  },

  updateTimeSlot: (id, updates) => {
    const timeSlots = get().timeSlots.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ).sort((a, b) => a.order - b.order);
    storage.set(STORAGE_KEYS.TIME_SLOTS, timeSlots);
    set({ timeSlots });
  },

  deleteTimeSlot: (id) => {
    const timeSlots = get().timeSlots.filter(s => s.id !== id);
    storage.set(STORAGE_KEYS.TIME_SLOTS, timeSlots);
    set({ timeSlots });
  },

  initDefaultTimeSlots: (familyId) => {
    if (get().timeSlots.length > 0) return;
    const slots = defaultTimeSlots.map((slot, idx) => ({
      id: generateId(),
      familyId,
      ...slot,
      order: idx + 1,
      createdAt: new Date().toISOString(),
    }));
    storage.set(STORAGE_KEYS.TIME_SLOTS, slots);
    set({ timeSlots: slots });
  },

  // Daily Task Actions
  addDailyTask: (data) => {
    const task: DailyTask = {
      id: generateId(),
      ...data,
      autoConfirmed: false,
      createdAt: new Date().toISOString(),
    };
    const dailyTasks = [...get().dailyTasks, task];
    storage.set(STORAGE_KEYS.DAILY_TASKS, dailyTasks);
    set({ dailyTasks });
    return task;
  },

  addDailyTaskFromTemplate: (templateId, childId, date, timeSlotId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return null;
    
    const slot = get().timeSlots.find(s => s.id === timeSlotId);
    if (!slot) return null;

    const task = get().addDailyTask({
      familyId: template.familyId,
      childId,
      date,
      templateId,
      name: template.name,
      type: template.type,
      points: template.points,
      timeSlotId,
      timeSlotStart: slot.startTime,
      timeSlotEnd: slot.endTime,
      status: 'pending',
    });

    // 推送通知孩子
    if (task) {
      pushService.notifyNewTask(template.name, template.points, `${slot.startTime}-${slot.endTime}`);
    }

    return task;
  },

  updateDailyTaskStatus: (taskId, status, extra = {}) => {
    const dailyTasks = get().dailyTasks.map(t => 
      t.id === taskId ? { ...t, status, ...extra } : t
    );
    storage.set(STORAGE_KEYS.DAILY_TASKS, dailyTasks);
    set({ dailyTasks });
  },

  deleteDailyTask: (taskId) => {
    const dailyTasks = get().dailyTasks.filter(t => t.id !== taskId);
    storage.set(STORAGE_KEYS.DAILY_TASKS, dailyTasks);
    set({ dailyTasks });
  },

  getDailyTasksByDate: (date) => {
    return get().dailyTasks.filter(t => t.date === date);
  },

  getDailyTasksBySlot: (date, slotId) => {
    return get().dailyTasks.filter(t => t.date === date && t.timeSlotId === slotId);
  },

  submitTask: (taskId) => {
    get().updateDailyTaskStatus(taskId, 'submitted', {
      submittedAt: new Date().toISOString(),
    });

    // 推送通知家长审核
    const task = get().dailyTasks.find(t => t.id === taskId);
    if (task) {
      const child = useFamilyStore.getState().users.find(u => u.id === task.childId);
      pushService.notifyTaskSubmitted(task.name, child?.name || '孩子');
    }
  },

  confirmTask: (taskId, confirmedBy, auto = false) => {
    get().updateDailyTaskStatus(taskId, 'completed', {
      confirmedAt: new Date().toISOString(),
      confirmedBy,
      autoConfirmed: auto,
    });

    // 推送通知孩子
    const task = get().dailyTasks.find(t => t.id === taskId);
    if (task) {
      pushService.notifyTaskConfirmed(task.name, task.points);
    }
  },

  rejectTask: (taskId, reason) => {
    get().updateDailyTaskStatus(taskId, 'rejected', {
      rejectedReason: reason,
    });

    // 推送通知孩子
    const task = get().dailyTasks.find(t => t.id === taskId);
    if (task) {
      pushService.notifyTaskRejected(task.name, reason);
    }
  },

  copyYesterdayTasks: (todayDate, childId) => {
    const yesterday = formatDate(new Date(new Date(todayDate).getTime() - 24 * 60 * 60 * 1000));
    const yesterdayTasks = get().getDailyTasksByDate(yesterday);
    
    for (const yt of yesterdayTasks) {
      // 检查是否已存在相同任务
      const exists = get().dailyTasks.some(
        t => t.date === todayDate && t.name === yt.name && t.childId === childId
      );
      if (!exists) {
        get().addDailyTask({
          familyId: yt.familyId,
          childId,
          date: todayDate,
          templateId: yt.templateId,
          name: yt.name,
          type: yt.type,
          points: yt.points,
          timeSlotId: yt.timeSlotId,
          timeSlotStart: yt.timeSlotStart,
          timeSlotEnd: yt.timeSlotEnd,
          status: 'pending',
        });
      }
    }
  },

  loadFromStorage: () => {
    const templates = storage.get<TaskTemplate[]>(STORAGE_KEYS.TASK_TEMPLATES) || [];
    const timeSlots = storage.get<TimeSlot[]>(STORAGE_KEYS.TIME_SLOTS) || [];
    const dailyTasks = storage.get<DailyTask[]>(STORAGE_KEYS.DAILY_TASKS) || [];
    set({ templates, timeSlots, dailyTasks });
  },
}));