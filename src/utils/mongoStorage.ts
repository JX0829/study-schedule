/**
 * MongoDB 存储适配器
 * 
 * 通过 HTTP API 连接后端 MongoDB 服务
 * 替代 localStorage，实现云端数据存储
 */

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  batchGet<T>(keys: string[]): Promise<Record<string, T>>;
  batchSet<T>(items: Record<string, T>): Promise<void>;
}

/**
 * MongoDB 存储适配器
 * 
 * 通过 HTTP API 连接后端 MongoDB 服务
 */
export class StorageAdapterMongoDB implements StorageAdapter {
  private apiUrl: string;
  private familyId: string;
  private cache: Map<string, any> = new Map();
  private pendingWrites: Map<string, any> = new Map();
  private writeTimer: number | null = null;

  constructor(apiUrl: string = '', familyId: string = 'default') {
    // 使用相对路径，通过 Vite 代理访问后端
    this.apiUrl = apiUrl || ''; // 空字符串表示使用相对路径
    this.familyId = familyId;
  }

  /**
   * 设置家庭ID（切换家庭时更新）
   */
  setFamilyId(familyId: string): void {
    this.familyId = familyId;
    this.cache.clear();
  }

  /**
   * 获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    // 先检查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // 检查待写入的数据
    if (this.pendingWrites.has(key)) {
      return this.pendingWrites.get(key) as T;
    }

    try {
      const url = `${this.apiUrl}/api/storage/${key}?familyId=${this.familyId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`GET ${key} failed:`, response.status);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data !== null) {
        this.cache.set(key, result.data);
        return result.data as T;
      }

      return null;
    } catch (error) {
      console.error(`GET ${key} error:`, error);
      return null;
    }
  }

  /**
   * 设置数据（异步写入，带缓存）
   */
  async set<T>(key: string, value: T): Promise<void> {
    // 立即更新缓存
    this.cache.set(key, value);
    
    // 添加到待写入队列
    this.pendingWrites.set(key, value);

    // 触发批量写入（延迟200ms，合并多次写入）
    this.scheduleBatchWrite();
  }

  /**
   * 立即写入（不等待批量）
   */
  async setImmediate<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);

    try {
      const url = `${this.apiUrl}/api/storage/${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          familyId: this.familyId,
        }),
      });

      if (!response.ok) {
        console.error(`SET ${key} failed:`, response.status);
      }
    } catch (error) {
      console.error(`SET ${key} error:`, error);
    }
  }

  /**
   * 批量写入调度
   */
  private scheduleBatchWrite(): void {
    if (this.writeTimer !== null) {
      return;
    }

    this.writeTimer = window.setTimeout(() => {
      this.flushPendingWrites();
      this.writeTimer = null;
    }, 200);
  }

  /**
   * 执行批量写入
   */
  private async flushPendingWrites(): Promise<void> {
    if (this.pendingWrites.size === 0) {
      return;
    }

    const items = Array.from(this.pendingWrites.entries()).map(([key, value]) => ({
      key,
      value,
    }));

    this.pendingWrites.clear();

    try {
      const url = `${this.apiUrl}/api/storage/batch-set`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          familyId: this.familyId,
        }),
      });

      if (!response.ok) {
        console.error('Batch SET failed:', response.status);
        // 失败时重新加入待写入队列
        for (const item of items) {
          this.pendingWrites.set(item.key, item.value);
        }
      }
    } catch (error) {
      console.error('Batch SET error:', error);
      // 失败时重新加入待写入队列
      for (const item of items) {
        this.pendingWrites.set(item.key, item.value);
      }
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    this.pendingWrites.delete(key);

    try {
      const url = `${this.apiUrl}/api/storage/${key}?familyId=${this.familyId}`;
      await fetch(url, { method: 'DELETE' });
    } catch (error) {
      console.error(`REMOVE ${key} error:`, error);
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.pendingWrites.clear();

    try {
      const url = `${this.apiUrl}/api/storage/clear?familyId=${this.familyId}`;
      await fetch(url, { method: 'DELETE' });
    } catch (error) {
      console.error('CLEAR error:', error);
    }
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    try {
      const url = `${this.apiUrl}/api/storage/keys?familyId=${this.familyId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.success ? result.keys : [];
    } catch (error) {
      console.error('KEYS error:', error);
      return [];
    }
  }

  /**
   * 批量获取数据
   */
  async batchGet<T>(keys: string[]): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    const uncachedKeys: string[] = [];

    // 先从缓存获取
    for (const key of keys) {
      if (this.cache.has(key)) {
        result[key] = this.cache.get(key);
      } else if (this.pendingWrites.has(key)) {
        result[key] = this.pendingWrites.get(key);
      } else {
        uncachedKeys.push(key);
      }
    }

    // 未缓存的从服务器获取
    if (uncachedKeys.length > 0) {
      try {
        const url = `${this.apiUrl}/api/storage/batch`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keys: uncachedKeys,
            familyId: this.familyId,
          }),
        });

        if (response.ok) {
          const batchResult = await response.json();
          if (batchResult.success && batchResult.data) {
            for (const key of uncachedKeys) {
              if (batchResult.data[key] !== undefined) {
                result[key] = batchResult.data[key];
                this.cache.set(key, batchResult.data[key]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Batch GET error:', error);
      }
    }

    return result;
  }

  /**
   * 批量设置数据
   */
  async batchSet<T>(items: Record<string, T>): Promise<void> {
    // 立即更新缓存
    for (const [key, value] of Object.entries(items)) {
      this.cache.set(key, value);
      this.pendingWrites.set(key, value);
    }

    // 触发批量写入
    this.scheduleBatchWrite();
  }

  /**
   * 强制刷新所有待写入数据
   */
  async flush(): Promise<void> {
    if (this.writeTimer !== null) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    await this.flushPendingWrites();
  }

  /**
   * 迁移 localStorage 数据到 MongoDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    const data: Record<string, any> = {};
    const prefix = 'studyplan_';

    // 收集所有 localStorage 数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const cleanKey = key.replace(prefix, '');
        try {
          const value = JSON.parse(localStorage.getItem(key) || 'null');
          if (value !== null) {
            data[cleanKey] = value;
          }
        } catch (e) {
          console.error('Parse error:', key);
        }
      }
    }

    if (Object.keys(data).length === 0) {
      console.log('No data to migrate');
      return;
    }

    // 调用迁移 API
    try {
      const url = `${this.apiUrl}/api/migrate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          familyId: this.familyId,
        }),
      });

      const result = await response.json();
      console.log('Migration result:', result);
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/api/health`;
      const response = await fetch(url);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// 默认使用相对路径（通过 Vite 代理）
const DEFAULT_API_URL = ''; // 空字符串表示使用相对路径

// 创建 MongoDB 存储实例
export const mongoStorage = new StorageAdapterMongoDB(DEFAULT_API_URL);

// 同步版本兼容层（用于渐进式迁移）
export class StorageAdapterSyncWrapper {
  private mongoStorage: StorageAdapterMongoDB;
  private localStorage: Storage;

  constructor(mongoStorage: StorageAdapterMongoDB) {
    this.mongoStorage = mongoStorage;
    this.localStorage = localStorage;
  }

  /**
   * 获取数据（优先 MongoDB，失败回退 localStorage）
   */
  get<T>(key: string): T | null {
    // 同步获取只能从 localStorage
    const prefix = 'studyplan_';
    try {
      const data = this.localStorage.getItem(prefix + key);
      if (data === null) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * 设置数据（同时写入 localStorage 和 MongoDB）
   */
  set<T>(key: string, value: T): void {
    // 立即写入 localStorage
    const prefix = 'studyplan_';
    try {
      this.localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage set error:', e);
    }

    // 异步写入 MongoDB（不阻塞）
    this.mongoStorage.set(key, value).catch(e => {
      console.error('MongoDB set error:', e);
    });
  }

  remove(key: string): void {
    const prefix = 'studyplan_';
    this.localStorage.removeItem(prefix + key);
    this.mongoStorage.remove(key).catch(e => {
      console.error('MongoDB remove error:', e);
    });
  }

  clear(): void {
    const keys = this.keys();
    keys.forEach(k => this.remove(k));
    this.mongoStorage.clear().catch(e => {
      console.error('MongoDB clear error:', e);
    });
  }

  keys(): string[] {
    const prefix = 'studyplan_';
    const keys: string[] = [];
    for (let i = 0; i < this.localStorage.length; i++) {
      const key = this.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.replace(prefix, ''));
      }
    }
    return keys;
  }
}