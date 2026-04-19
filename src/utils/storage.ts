/**
 * 存储抽象层
 * 
 * 设计目的：统一存储接口，方便从 Web (localStorage) 迁移到小程序 (wx.setStorage)
 * 
 * 使用方式：
 * - Web: 使用 StorageAdapterLocalStorage
 * - 小程序: 实现 StorageAdapterMiniProgram 接口
 * 
 * 注意事项：
 * - 所有存储操作都通过此层，不直接使用 localStorage
 * - 数据序列化/反序列化由适配器处理
 */

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * Web 端 localStorage 适配器
 */
export class StorageAdapterLocalStorage implements StorageAdapter {
  private prefix = 'studyplan_';

  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(this.prefix + key);
      if (data === null) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = this.keys();
    keys.forEach(k => this.remove(k));
  }

  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }
}

/**
 * 小程序存储适配器（迁移时实现）
 * 
 * 示例实现：
 * export class StorageAdapterMiniProgram implements StorageAdapter {
 *   get<T>(key: string): T | null {
 *     try {
 *       const data = wx.getStorageSync(key);
 *       return data ? JSON.parse(data) as T : null;
 *     } catch {
 *       return null;
 *     }
 *   }
 *   
 *   set<T>(key: string, value: T): void {
 *     wx.setStorageSync(key, JSON.stringify(value));
 *   }
 *   
 *   remove(key: string): void {
 *     wx.removeStorageSync(key);
 *   }
 *   
 *   clear(): void {
 *     wx.clearStorageSync();
 *   }
 *   
 *   keys(): string[] {
 *     const info = wx.getStorageInfoSync();
 *     return info.keys;
 *   }
 * }
 */

// 当前使用的适配器（Web 端）
export const storage = new StorageAdapterLocalStorage();

// 存储键名常量
export const STORAGE_KEYS = {
  FAMILY: 'family',
  USERS: 'users',
  CHILD_POINTS: 'child_points',
  TASK_TEMPLATES: 'task_templates',
  TASK_TEMPLATE_ITEMS: 'task_template_items',
  REWARD_TEMPLATE_ITEMS: 'reward_template_items',
  TIME_SLOTS: 'time_slots',
  DAILY_TASKS: 'daily_tasks',
  POINTS_RECORDS: 'points_records',
  REWARDS: 'rewards',
  REDEMPTION_RECORDS: 'redemption_records',
  SYSTEM_CONFIG: 'system_config',
  CURRENT_USER: 'current_user',
} as const;