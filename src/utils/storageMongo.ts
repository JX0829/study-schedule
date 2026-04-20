/**
 * 存储抽象层 - MongoDB + 内存缓存版本
 * 
 * 采用混合存储策略：
 * - 内存缓存：快速同步读写
 * - MongoDB：持久化存储
 * 
 * 启动时从 MongoDB 加载到内存
 * 写入时同步更新内存，异步写入 MongoDB
 */

import { STORAGE_KEYS } from './storage';
import { mongoStorage } from './mongoStorage';

// 内存缓存
const memoryCache: Map<string, any> = new Map();

// 初始化状态
let initialized = false;
let initializing = false;

/**
 * 从 MongoDB 加载所有数据到内存
 */
export async function initStorage(familyId: string = 'default'): Promise<void> {
  if (initialized || initializing) return;
  initializing = true;

  // 设置家庭ID
  mongoStorage.setFamilyId(familyId);

  // 尝试从 MongoDB 加载所有数据
  try {
    const keys = Object.values(STORAGE_KEYS);
    const data = await mongoStorage.batchGet<any>(keys);

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        memoryCache.set(key, value);
      }
    }

    console.log('✅ Storage initialized from MongoDB:', Object.keys(data).length, 'items');
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
}

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * MongoDB 存储适配器（带内存缓存）
 * 
 * 同步接口，内部使用内存缓存
 * 异步持久化到 MongoDB
 */
export class StorageAdapterMongoDBSync implements StorageAdapter {
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

    // 同步写入 localStorage（作为备份）
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage set error:', e);
    }

    // 异步写入 MongoDB（不阻塞）
    mongoStorage.set(key, value).catch(e => {
      console.error('MongoDB set error:', e);
    });
  }

  remove(key: string): void {
    // 同步删除内存缓存
    memoryCache.delete(key);

    // 同步删除 localStorage
    localStorage.removeItem(this.prefix + key);

    // 异步删除 MongoDB
    mongoStorage.remove(key).catch(e => {
      console.error('MongoDB remove error:', e);
    });
  }

  clear(): void {
    // 同步清空内存缓存
    memoryCache.clear();

    // 同步清空 localStorage
    const keys = this.keys();
    keys.forEach(k => localStorage.removeItem(this.prefix + k));

    // 异步清空 MongoDB
    mongoStorage.clear().catch(e => {
      console.error('MongoDB clear error:', e);
    });
  }

  keys(): string[] {
    // 从内存缓存获取键
    return Array.from(memoryCache.keys());
  }

  /**
   * 强制刷新 MongoDB
   */
  async flush(): Promise<void> {
    await mongoStorage.flush();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return mongoStorage.healthCheck();
  }
}

/**
 * localStorage 存储适配器（原版本，作为备用）
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

// 当前使用的存储适配器
// 默认使用 MongoDB + 内存缓存版本
export const storage = new StorageAdapterMongoDBSync();

// localStorage 版本（备用）
export const localStorageAdapter = new StorageAdapterLocalStorage();

// 存储键名常量（导出）
export { STORAGE_KEYS };