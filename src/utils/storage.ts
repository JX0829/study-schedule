/**
 * 存储抽象层
 * 
 * 默认使用 MongoDB + 内存缓存版本
 * 支持异步初始化和同步读写
 * 
 * 使用方式：
 * 1. 应用启动时调用 initStorage(familyId) 初始化
 * 2. 使用 storage.get/set/remove/clear 同步读写
 * 
 * 数据流向：
 * - 读：内存缓存 → localStorage → MongoDB
 * - 写：内存缓存 → localStorage → MongoDB（异步）
 */

import { mongoStorage } from './mongoStorage';
import { hasLocalStorageData, getLocalStorageData } from './migrate';

// 内存缓存
const memoryCache: Map<string, unknown> = new Map();

// 初始化状态
let initialized = false;
let initializing = false;

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
  PUSH_CONFIG: 'push_config',
  PARENT_PASSWORD: 'parent_password',
  SIGN_PASSWORD: 'sign_password',
  SIGN_PASSWORD_DATE: 'sign_password_date',
  LUCKY_WHEEL_PRIZES: 'lucky_wheel_prizes',
  LUCKY_WHEEL_STATE: 'lucky_wheel_state',
  MODULE_CONFIG: 'module_config',
} as const;

/**
 * 初始化存储（从 MongoDB 加载到内存）
 * 
 * 在应用启动时调用
 */
export async function initStorage(familyId: string = 'default'): Promise<void> {
  if (initialized || initializing) return;
  initializing = true;

  // 设置 MongoDB 家庭ID
  mongoStorage.setFamilyId(familyId);

  // 尝试从 MongoDB 加载所有数据
  try {
    const keys = Object.values(STORAGE_KEYS) as string[];
    const data = await mongoStorage.batchGet<unknown>(keys);

    // 如果 MongoDB 没有数据，尝试从 localStorage 迁移
    if (Object.keys(data).length === 0 && hasLocalStorageData()) {
      console.log('MongoDB empty, migrating from localStorage...');
      const localData = getLocalStorageData();
      
      // 写入 MongoDB
      await mongoStorage.batchSet(localData);
      
      // 加载到内存
      for (const [key, value] of Object.entries(localData)) {
        if (value !== undefined && value !== null) {
          memoryCache.set(key, value);
        }
      }
      console.log('✅ Migrated from localStorage:', Object.keys(localData).length, 'items');
    } else {
      // 加载 MongoDB 数据到内存
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          memoryCache.set(key, value);
        }
      }
      console.log('✅ Storage initialized from MongoDB:', Object.keys(data).length, 'items');
    }
    initialized = true;
  } catch (error) {
    console.error('❌ Failed to init from MongoDB, fallback to localStorage:', error);
    
    // 回退到 localStorage
    const prefix = 'studyplan_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const cleanKey = key.replace(prefix, '');
        try {
          const value = JSON.parse(localStorage.getItem(key) || 'null');
          if (value !== null) {
            memoryCache.set(cleanKey, value);
          }
        } catch (e) {
          console.error('Parse error:', key);
        }
      }
    }
    initialized = true;
  }

  initializing = false;
}

/**
 * 迁移 localStorage 数据到 MongoDB
 */
export async function migrateToMongoDB(familyId: string = 'default'): Promise<void> {
  mongoStorage.setFamilyId(familyId);
  await mongoStorage.migrateFromLocalStorage();
  
  // 重新初始化
  initialized = false;
  await initStorage(familyId);
}

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * MongoDB + 内存缓存 存储适配器
 * 
 * 同步接口，使用内存缓存
 * 异步持久化到 MongoDB
 */
export class StorageAdapterMongoDB implements StorageAdapter {
  private prefix = 'studyplan_';

  get<T>(key: string): T | null {
    // 从内存缓存获取
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    // 尝试从 localStorage 获取（兼容旧数据）
    try {
      const data = localStorage.getItem(this.prefix + key);
      if (data === null) return null;
      const value = JSON.parse(data) as T;
      memoryCache.set(key, value);
      return value;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    // 同步更新内存缓存
    memoryCache.set(key, value);

    // 同步写入 localStorage（备份）
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage set error:', e);
    }

    // 异步写入 MongoDB
    mongoStorage.set(key, value).catch(e => {
      console.error('MongoDB set error:', e);
    });
  }

  remove(key: string): void {
    memoryCache.delete(key);
    localStorage.removeItem(this.prefix + key);
    mongoStorage.remove(key).catch(e => {
      console.error('MongoDB remove error:', e);
    });
  }

  clear(): void {
    memoryCache.clear();
    const keys = this.keys();
    keys.forEach(k => localStorage.removeItem(this.prefix + k));
    mongoStorage.clear().catch(e => {
      console.error('MongoDB clear error:', e);
    });
  }

  keys(): string[] {
    return Array.from(memoryCache.keys());
  }

  async flush(): Promise<void> {
    await mongoStorage.flush();
  }

  async healthCheck(): Promise<boolean> {
    return mongoStorage.healthCheck();
  }
}

/**
 * localStorage 存储适配器（原版本）
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

// 默认使用 MongoDB 版本
export const storage = new StorageAdapterMongoDB();