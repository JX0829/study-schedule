/**
 * 状态管理 - 奖励模块
 */

import { create } from 'zustand';
import type { Reward, RedemptionRecord, RedemptionStatus } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/date';
import { usePointsStore } from './points';

interface RewardState {
  rewards: Reward[];
  redemptionRecords: RedemptionRecord[];
  
  // Reward Actions
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Reward;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  toggleReward: (id: string) => void;
  
  // Redemption Actions
  createRedemption: (childId: string, rewardId: string) => RedemptionRecord | null;
  confirmRedemption: (redemptionId: string, confirmedBy: string, auto?: boolean) => void;
  rejectRedemption: (redemptionId: string, reason: string) => void;
  getRedemptionsByChild: (childId: string) => RedemptionRecord[];
  getPendingRedemptions: () => RedemptionRecord[];
  
  // Load
  loadFromStorage: () => void;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  rewards: [],
  redemptionRecords: [],

  // Reward Actions
  addReward: (data) => {
    const reward: Reward = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const rewards = [...get().rewards, reward];
    storage.set(STORAGE_KEYS.REWARDS, rewards);
    set({ rewards });
    return reward;
  },

  updateReward: (id, updates) => {
    const rewards = get().rewards.map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    storage.set(STORAGE_KEYS.REWARDS, rewards);
    set({ rewards });
  },

  deleteReward: (id) => {
    const rewards = get().rewards.filter(r => r.id !== id);
    storage.set(STORAGE_KEYS.REWARDS, rewards);
    set({ rewards });
  },

  toggleReward: (id) => {
    const reward = get().rewards.find(r => r.id === id);
    if (reward) {
      get().updateReward(id, { isActive: !reward.isActive });
    }
  },

  // Redemption Actions
  createRedemption: (childId, rewardId) => {
    const reward = get().rewards.find(r => r.id === rewardId && r.isActive);
    if (!reward) return null;

    // 检查库存
    if (reward.stock !== undefined && reward.stock <= 0) return null;

    // 检查积分并锁定
    const pointsStore = usePointsStore.getState();
    if (!pointsStore.lockPoints(childId, reward.cost, 'temp')) return null;

    const redemption: RedemptionRecord = {
      id: generateId(),
      familyId: reward.familyId,
      childId,
      rewardId,
      pointsCost: reward.cost,
      lockedAt: new Date().toISOString(),
      status: 'pending',
      autoConfirmed: false,
    };

    // 更新锁定记录中的 redemptionId
    const records = [...get().redemptionRecords, redemption];
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });

    // 重新锁定并关联正确的 redemptionId
    pointsStore.unlockPoints(childId, 'temp');
    pointsStore.lockPoints(childId, reward.cost, redemption.id);

    return redemption;
  },

  confirmRedemption: (redemptionId, confirmedBy, auto = false) => {
    const redemption = get().redemptionRecords.find(r => r.id === redemptionId);
    if (!redemption || redemption.status !== 'pending') return;

    const pointsStore = usePointsStore.getState();
    pointsStore.deductPoints(redemption.childId, redemption.pointsCost, redemptionId);

    // 更新奖励库存
    const reward = get().rewards.find(r => r.id === redemption.rewardId);
    if (reward && reward.stock !== undefined) {
      get().updateReward(reward.id, { stock: reward.stock - 1 });
    }

    const records = get().redemptionRecords.map(r => 
      r.id === redemptionId 
        ? { ...r, status: 'approved' as RedemptionStatus, confirmedAt: new Date().toISOString(), confirmedBy, autoConfirmed: auto }
        : r
    );
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });
  },

  rejectRedemption: (redemptionId, reason) => {
    const redemption = get().redemptionRecords.find(r => r.id === redemptionId);
    if (!redemption || redemption.status !== 'pending') return;

    const pointsStore = usePointsStore.getState();
    pointsStore.unlockPoints(redemption.childId, redemptionId);

    const records = get().redemptionRecords.map(r => 
      r.id === redemptionId 
        ? { ...r, status: 'rejected' as RedemptionStatus, rejectedReason: reason }
        : r
    );
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });
  },

  getRedemptionsByChild: (childId) => {
    return get().redemptionRecords.filter(r => r.childId === childId);
  },

  getPendingRedemptions: () => {
    return get().redemptionRecords.filter(r => r.status === 'pending');
  },

  loadFromStorage: () => {
    const rewards = storage.get<Reward[]>(STORAGE_KEYS.REWARDS) || [];
    const redemptionRecords = storage.get<RedemptionRecord[]>(STORAGE_KEYS.REDEMPTION_RECORDS) || [];
    set({ rewards, redemptionRecords });
  },
}));