/**
 * 统一导出所有 Store
 */

export { useFamilyStore } from './family';
export { useTaskStore } from './task';
export { usePointsStore } from './points';
export { useRewardStore } from './reward';
export { usePasswordStore } from './password';
export { useTemplateStore } from './template';
export { usePushStore } from '@/utils/push';

/**
 * 初始化所有 Store
 * 在应用启动时调用
 * 
 * @param familyId 家庭ID（用于 MongoDB 分组存储）
 */

import { useFamilyStore } from './family';
import { useTaskStore } from './task';
import { usePointsStore } from './points';
import { useRewardStore } from './reward';
import { usePasswordStore } from './password';
import { useTemplateStore } from './template';
import { usePushStore } from '@/utils/push';
import { initStorage } from '@/utils/storage';

export async function initStores(familyId?: string): Promise<void> {
  // 先初始化存储（从 MongoDB 加载数据）
  const fid = familyId || useFamilyStore.getState().family?.id || 'default';
  await initStorage(fid);

  // 然后加载各模块数据
  useFamilyStore.getState().loadFromStorage();
  useTaskStore.getState().loadFromStorage();
  usePointsStore.getState().loadFromStorage();
  useRewardStore.getState().loadFromStorage();
  usePasswordStore.getState().loadFromStorage();
  useTemplateStore.getState().loadFromStorage();
  usePushStore.getState().loadFromStorage();

  console.log('✅ All stores initialized');
}

// 同步版本（兼容旧代码）
export function initStoresSync(): void {
  useFamilyStore.getState().loadFromStorage();
  useTaskStore.getState().loadFromStorage();
  usePointsStore.getState().loadFromStorage();
  useRewardStore.getState().loadFromStorage();
  usePasswordStore.getState().loadFromStorage();
  useTemplateStore.getState().loadFromStorage();
  usePushStore.getState().loadFromStorage();
}