/**
 * 统一导出所有 Store
 */

export { useFamilyStore } from './family';
export { useTaskStore } from './task';
export { usePointsStore } from './points';
export { useRewardStore } from './reward';

/**
 * 初始化所有 Store
 * 在应用启动时调用
 */

import { useFamilyStore } from './family';
import { useTaskStore } from './task';
import { usePointsStore } from './points';
import { useRewardStore } from './reward';

export function initStores() {
  useFamilyStore.getState().loadFromStorage();
  useTaskStore.getState().loadFromStorage();
  usePointsStore.getState().loadFromStorage();
  useRewardStore.getState().loadFromStorage();
}