/**
 * 数据迁移工具
 * 
 * 将 localStorage 数据迁移到 MongoDB
 */

import { mongoStorage } from './mongoStorage';
import { STORAGE_KEYS } from './storage';

/**
 * 检查 localStorage 是否有数据
 */
export function hasLocalStorageData(): boolean {
  const prefix = 'studyplan_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

/**
 * 获取 localStorage 所有数据
 */
export function getLocalStorageData(): Record<string, any> {
  const data: Record<string, any> = {};
  const prefix = 'studyplan_';

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const cleanKey = key.replace(prefix, '');
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[cleanKey] = JSON.parse(value);
        }
      } catch (e) {
        console.error('Parse error:', key, e);
      }
    }
  }

  return data;
}

/**
 * 迁移 localStorage 数据到 MongoDB
 * 
 * @param familyId 家庭ID
 * @returns 返回迁移的数据数量
 */
export async function migrateLocalStorageToMongoDB(familyId: string = 'default'): Promise<number> {
  const data = getLocalStorageData();
  
  if (Object.keys(data).length === 0) {
    console.log('No localStorage data to migrate');
    return 0;
  }

  console.log('Migrating localStorage data:', Object.keys(data));

  // 设置家庭ID
  mongoStorage.setFamilyId(familyId);

  // 批量写入到 MongoDB
  try {
    await mongoStorage.batchSet(data);
    console.log('✅ Migration completed:', Object.keys(data).length, 'items');
    return Object.keys(data).length;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * 自动迁移（应用启动时检查并迁移）
 */
export async function autoMigrate(familyId: string = 'default'): Promise<boolean> {
  // 检查 MongoDB 是否有数据
  try {
    const keys = await mongoStorage.keys();
    
    // MongoDB 已有数据，跳过迁移
    if (keys.length > 0) {
      console.log('MongoDB already has data, skip migration');
      return false;
    }

    // 检查 localStorage 是否有数据
    if (!hasLocalStorageData()) {
      console.log('No localStorage data, skip migration');
      return false;
    }

    // 执行迁移
    const count = await migrateLocalStorageToMongoDB(familyId);
    return count > 0;
  } catch (error) {
    console.error('Auto migrate error:', error);
    return false;
  }
}

/**
 * 强制同步 MongoDB 数据到 localStorage
 * （用于离线备份）
 */
export async function syncMongoDBToLocalStorage(familyId: string = 'default'): Promise<void> {
  mongoStorage.setFamilyId(familyId);

  const keys = Object.values(STORAGE_KEYS) as string[];
  const data = await mongoStorage.batchGet<any>(keys);

  const prefix = 'studyplan_';
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    }
  }

  console.log('✅ Synced MongoDB to localStorage:', Object.keys(data).length, 'items');
}

/**
 * 清空 MongoDB 数据
 */
export async function clearMongoDBData(familyId: string = 'default'): Promise<void> {
  mongoStorage.setFamilyId(familyId);
  await mongoStorage.clear();
  console.log('✅ MongoDB data cleared');
}