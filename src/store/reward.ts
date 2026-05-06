/**
 * 状态管理 - 奖励模块
 */

import { create } from 'zustand';
import type { Reward, RedemptionRecord, RedemptionStatus } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/date';
import { usePointsStore } from './points';
import { pushService } from '@/utils/push';
import { useFamilyStore } from './family';

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
  createCustomPointsRedemption: (childId: string, points: number) => RedemptionRecord | null;
  confirmRedemption: (redemptionId: string, confirmedBy: string, auto?: boolean) => void;
  rejectRedemption: (redemptionId: string, reason: string) => void;
  getRedemptionsByChild: (childId: string) => RedemptionRecord[];
  getPendingRedemptions: () => RedemptionRecord[];
  
  // Load
  loadFromStorage: () => void;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  rewards: [],
  redemptionRecords: [] as RedemptionRecord[],

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

    // 先生成兑换记录 ID，避免使用 'temp' 导致解锁错误
    const redemptionId = generateId();

    const redemption: RedemptionRecord = {
      id: redemptionId,
      familyId: reward.familyId,
      childId,
      rewardId,
      pointsCost: reward.cost,
      lockedAt: new Date().toISOString(),
      status: 'pending',
      autoConfirmed: false,
    };

    // 检查积分并锁定（直接使用正式的兑换记录 ID）
    const pointsStore = usePointsStore.getState();
    if (!pointsStore.lockPoints(childId, reward.cost, redemptionId)) return null;

    // 锁定成功后保存兑换记录
    const records = [...get().redemptionRecords, redemption];
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });

    // 推送通知家长
    const child = useFamilyStore.getState().users.find(u => u.id === childId);
    pushService.notifyRedemptionRequested(reward.name, reward.cost, child?.name || '孩子');

    return redemption;
  },

  createCustomPointsRedemption: (childId, points) => {
    const familyId = useFamilyStore.getState().family?.id || childId;

    // 先生成兑换记录 ID，避免使用 'temp' 导致解锁错误
    const redemptionId = generateId();

    const redemption: RedemptionRecord = {
      id: redemptionId,
      familyId,
      childId,
      rewardId: 'custom_points', // 特殊标记表示自定义积分兑换
      pointsCost: points,
      lockedAt: new Date().toISOString(),
      status: 'pending',
      autoConfirmed: false,
    };

    // 检查积分并锁定（直接使用正式的兑换记录 ID）
    const pointsStore = usePointsStore.getState();
    if (!pointsStore.lockPoints(childId, points, redemptionId)) return null;

    // 锁定成功后保存兑换记录
    const records = [...get().redemptionRecords, redemption];
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });

    // 推送通知家长
    const child = useFamilyStore.getState().users.find(u => u.id === childId);
    pushService.notifyRedemptionRequested(`${points}积分`, points, child?.name || '孩子');

    return redemption;
  },

  confirmRedemption: (redemptionId, confirmedBy, auto = false) => {
    const redemption = get().redemptionRecords.find(r => r.id === redemptionId);
    if (!redemption || redemption.status !== 'pending') return;

    const pointsStore = usePointsStore.getState();
    pointsStore.deductPoints(redemption.childId, redemption.pointsCost, redemptionId);

    // 更新奖励库存（如果不是自定义积分兑换）
    if (redemption.rewardId !== 'custom_points') {
      const reward = get().rewards.find(r => r.id === redemption.rewardId);
      if (reward && reward.stock !== undefined) {
        get().updateReward(reward.id, { stock: reward.stock - 1 });
      }
    }

    const records = get().redemptionRecords.map(r => 
      r.id === redemptionId 
        ? { ...r, status: 'approved' as RedemptionStatus, confirmedAt: new Date().toISOString(), confirmedBy, autoConfirmed: auto }
        : r
    );
    storage.set(STORAGE_KEYS.REDEMPTION_RECORDS, records);
    set({ redemptionRecords: records });

    // 推送通知孩子
    if (redemption.rewardId === 'custom_points') {
      pushService.notifyRedemptionConfirmed(`${redemption.pointsCost}积分`);
    } else {
      const reward = get().rewards.find(r => r.id === redemption.rewardId);
      if (reward) {
        pushService.notifyRedemptionConfirmed(reward.name);
      }
    }
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

    // 推送通知孩子
    if (redemption.rewardId === 'custom_points') {
      pushService.notifyRedemptionRejected(`${redemption.pointsCost}积分`, reason);
    } else {
      const reward = get().rewards.find(r => r.id === redemption.rewardId);
      if (reward) {
        pushService.notifyRedemptionRejected(reward.name, reason);
      }
    }
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