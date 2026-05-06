/**
 * 状态管理 - 模块配置
 * 
 * 用于家长端控制孩子端显示哪些模块
 */

import { create } from 'zustand';
import type { ModuleConfig } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';

// 默认配置：所有模块都显示
const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  tasks: true,
  points: true,
  rewards: true,
};

interface ModuleConfigState {
  moduleConfig: ModuleConfig;
  
  // Actions
  loadFromStorage: () => void;
  updateModuleConfig: (config: Partial<ModuleConfig>) => void;
  setModuleEnabled: (module: keyof ModuleConfig, enabled: boolean) => void;
}

export const useModuleConfigStore = create<ModuleConfigState>((set, get) => ({
  moduleConfig: DEFAULT_MODULE_CONFIG,

  loadFromStorage: () => {
    const savedConfig = storage.get<ModuleConfig>(STORAGE_KEYS.MODULE_CONFIG);
    if (savedConfig) {
      set({ moduleConfig: savedConfig });
    } else {
      // 默认配置
      set({ moduleConfig: DEFAULT_MODULE_CONFIG });
    }
  },

  updateModuleConfig: (config) => {
    const newConfig = { ...get().moduleConfig, ...config };
    storage.set(STORAGE_KEYS.MODULE_CONFIG, newConfig);
    set({ moduleConfig: newConfig });
  },

  setModuleEnabled: (module, enabled) => {
    const newConfig = { ...get().moduleConfig, [module]: enabled };
    storage.set(STORAGE_KEYS.MODULE_CONFIG, newConfig);
    set({ moduleConfig: newConfig });
  },
}));