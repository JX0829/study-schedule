/**
 * 状态管理 - 家庭模块
 */

import { create } from 'zustand';
import type { Family, User } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/date';

interface FamilyState {
  family: Family | null;
  users: User[];
  currentUser: User | null;
  
  // Actions
  initFamily: (name: string) => Family;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  setCurrentUser: (userId: string) => void;
  loadFromStorage: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  users: [],
  currentUser: null,

  initFamily: (name) => {
    const family: Family = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.FAMILY, family);
    set({ family });
    return family;
  },

  addUser: (userData) => {
    const user: User = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString(),
    };
    const users = [...get().users, user];
    storage.set(STORAGE_KEYS.USERS, users);
    set({ users });
    return user;
  },

  setCurrentUser: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, userId);
      set({ currentUser: user });
    }
  },

  loadFromStorage: () => {
    const family = storage.get<Family>(STORAGE_KEYS.FAMILY);
    const users = storage.get<User[]>(STORAGE_KEYS.USERS) || [];
    const currentUserId = storage.get<string>(STORAGE_KEYS.CURRENT_USER);
    const currentUser = users.find(u => u.id === currentUserId) || null;
    set({ family, users, currentUser });
  },
}));