/**
 * 密码和签字相关状态管理
 */

import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { getToday } from '@/utils/date';

// ============ 类型定义 ============

interface PasswordState {
  parentPassword: string | null; // 家长登录密码
  signPassword: string | null; // 今日签字密码
  signPasswordDate: string | null; // 签字密码生成日期
  isAuthenticated: boolean;
  
  // Actions
  initPassword: (password: string) => void;
  verifyPassword: (password: string) => boolean;
  logout: () => void;
  generateSignPassword: () => string;
  getSignPassword: () => string | null;
  verifySignPassword: (password: string) => boolean;
  loadFromStorage: () => void;
}

// ============ 生成随机密码 ============

function generateRandomPassword(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 避免容易混淆的字符
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============ Store ============

export const usePasswordStore = create<PasswordState>((set, get) => ({
  parentPassword: null,
  signPassword: null,
  signPasswordDate: null,
  isAuthenticated: false,

  initPassword: (password) => {
    storage.set(STORAGE_KEYS.PARENT_PASSWORD, password);
    set({ parentPassword: password, isAuthenticated: true });
  },

  verifyPassword: (password) => {
    const stored = get().parentPassword;
    if (stored && stored === password) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  generateSignPassword: () => {
    const today = getToday();
    const existing = get().signPasswordDate;
    
    // 如果今天已经生成过，返回现有的
    if (existing === today && get().signPassword) {
      return get().signPassword!;
    }
    
    // 生成新的签字密码
    const newPassword = generateRandomPassword(4);
    storage.set(STORAGE_KEYS.SIGN_PASSWORD, newPassword);
    storage.set(STORAGE_KEYS.SIGN_PASSWORD_DATE, today);
    set({ signPassword: newPassword, signPasswordDate: today });
    return newPassword;
  },

  getSignPassword: () => {
    const today = getToday();
    const storedDate = get().signPasswordDate;
    
    // 如果日期不是今天，重新生成
    if (storedDate !== today) {
      return get().generateSignPassword();
    }
    
    return get().signPassword;
  },

  verifySignPassword: (password) => {
    const correct = get().getSignPassword();
    return correct && correct.toUpperCase() === password.toUpperCase();
  },

  loadFromStorage: () => {
    const parentPassword = storage.get<string>(STORAGE_KEYS.PARENT_PASSWORD);
    const signPassword = storage.get<string>(STORAGE_KEYS.SIGN_PASSWORD);
    const signPasswordDate = storage.get<string>(STORAGE_KEYS.SIGN_PASSWORD_DATE);
    
    set({
      parentPassword,
      signPassword,
      signPasswordDate,
      isAuthenticated: false, // 启动时需要重新登录
    });
    
    // 如果签字密码日期不是今天，重新生成
    if (signPasswordDate !== getToday()) {
      get().generateSignPassword();
    }
  },
}));