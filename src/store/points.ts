/**
 * 状态管理 - 积分模块
 */

import { create } from 'zustand';
import type { PointsRecord, ChildPoints } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/date';
import { defaultSystemConfig } from '@/utils/presets';
import { pushService } from '@/utils/push';

interface PointsState {
  childPoints: ChildPoints[];
  records: PointsRecord[];
  config: typeof defaultSystemConfig;
  
  // Actions
  getChildPoints: (childId: string) => ChildPoints;
  addPointsRecord: (data: Omit<PointsRecord, 'id' | 'createdAt'>) => PointsRecord;
  earnPoints: (childId: string, points: number, taskId: string, description: string) => void;
  lockPoints: (childId: string, points: number, redemptionId: string) => boolean;
  unlockPoints: (childId: string, redemptionId: string) => void;
  deductPoints: (childId: string, points: number, redemptionId: string) => void;
  getPointsRecords: (childId: string) => PointsRecord[];
  initChildPoints: (childId: string) => void;
  addExtraReward: (childId: string, points: number, description: string) => void;
  addExtraPenalty: (childId: string, points: number, description: string) => void;
  reverseExtraTransaction: (childId: string, taskPoints: number, taskDescription: string) => void;
  loadFromStorage: () => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  childPoints: [],
  records: [],
  config: defaultSystemConfig,

  getChildPoints: (childId): ChildPoints => {
    const existing = get().childPoints.find(p => p.childId === childId);
    if (existing) return existing;
    // 初始化新的积分记录
    const newPoints: ChildPoints = { childId, balance: 0, locked: 0, totalEarned: 0, totalRedeemed: 0 };
    const childPoints = [...get().childPoints, newPoints];
    storage.set(STORAGE_KEYS.CHILD_POINTS, childPoints);
    set({ childPoints });
    return newPoints;
  },

  initChildPoints: (childId): ChildPoints => {
    const existing = get().childPoints.find(p => p.childId === childId);
    if (existing) return existing;
    
    const newPoints: ChildPoints = {
      childId,
      balance: 0,
      locked: 0,
      totalEarned: 0,
      totalRedeemed: 0,
    };
    const childPoints = [...get().childPoints, newPoints];
    storage.set(STORAGE_KEYS.CHILD_POINTS, childPoints);
    set({ childPoints });
    return newPoints;
  },

  addPointsRecord: (data) => {
    const record: PointsRecord = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const records = [...get().records, record];
    storage.set(STORAGE_KEYS.POINTS_RECORDS, records);
    set({ records });
    return record;
  },

  earnPoints: (childId, points, taskId, description) => {
    const childPoints = get().getChildPoints(childId);
    const newBalance = Math.min(childPoints.balance + points, get().config.pointsLimit);
    const actualEarned = newBalance - childPoints.balance;
    
    // 累计获得记录原始积分值（不扣除上限）
    if (actualEarned !== 0) {
      get().addPointsRecord({
        familyId: childPoints.childId, // 简化处理
        childId,
        changeType: 'earn',
        points: actualEarned,
        balanceAfter: newBalance,
        lockedPoints: childPoints.locked,
        relatedTaskId: taskId,
        description,
      });

      const updated = get().childPoints.map(p => 
        p.childId === childId 
          ? { ...p, 
              balance: newBalance, 
              totalEarned: points > 0 ? p.totalEarned + points : p.totalEarned + actualEarned 
            }
          : p
      );
      storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
      set({ childPoints: updated });
    }
  },

  lockPoints: (childId, points, redemptionId) => {
    const childPoints = get().getChildPoints(childId);
    const available = childPoints.balance - childPoints.locked;
    
    if (available < points) return false;

    const newLocked = childPoints.locked + points;
    get().addPointsRecord({
      familyId: childPoints.childId,
      childId,
      changeType: 'redeem_lock',
      points: -points,
      balanceAfter: childPoints.balance,
      lockedPoints: newLocked,
      relatedRedemptionId: redemptionId,
      description: `兑换申请锁定积分`,
    });

    const updated = get().childPoints.map(p => 
      p.childId === childId ? { ...p, locked: newLocked } : p
    );
    storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
    set({ childPoints: updated });
    return true;
  },

  unlockPoints: (childId, redemptionId) => {
    const lockRecord = get().records.find(
      r => r.childId === childId && r.relatedRedemptionId === redemptionId && r.changeType === 'redeem_lock'
    );
    if (!lockRecord) return;

    const points = Math.abs(lockRecord.points);
    const childPoints = get().getChildPoints(childId);
    const newLocked = childPoints.locked - points;

    get().addPointsRecord({
      familyId: childPoints.childId,
      childId,
      changeType: 'redeem_unlock',
      points,
      balanceAfter: childPoints.balance,
      lockedPoints: newLocked,
      relatedRedemptionId: redemptionId,
      description: `兑换驳回解锁积分`,
    });

    const updated = get().childPoints.map(p => 
      p.childId === childId ? { ...p, locked: newLocked } : p
    );
    storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
    set({ childPoints: updated });
  },

  deductPoints: (childId, points, redemptionId) => {
    const childPoints = get().getChildPoints(childId);
    const newBalance = childPoints.balance - points;
    const newLocked = childPoints.locked - points;

    get().addPointsRecord({
      familyId: childPoints.childId,
      childId,
      changeType: 'redeem_deduct',
      points: -points,
      balanceAfter: newBalance,
      lockedPoints: newLocked,
      relatedRedemptionId: redemptionId,
      description: `兑换成功扣除积分`,
    });

    const updated = get().childPoints.map(p => 
      p.childId === childId 
        ? { ...p, balance: newBalance, locked: newLocked, totalRedeemed: p.totalRedeemed + points }
        : p
    );
    storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
    set({ childPoints: updated });
  },

  getPointsRecords: (childId) => {
    return get().records.filter(r => r.childId === childId);
  },

  addExtraReward: (childId, points, description) => {
    const childPoints = get().getChildPoints(childId);
    const newBalance = Math.min(childPoints.balance + points, get().config.pointsLimit);
    const actualEarned = newBalance - childPoints.balance;

    if (actualEarned !== 0) {
      get().addPointsRecord({
        familyId: childPoints.childId,
        childId,
        changeType: 'extra_reward',
        points: actualEarned,
        balanceAfter: newBalance,
        lockedPoints: childPoints.locked,
        description,
      });

      const updated = get().childPoints.map(p => 
        p.childId === childId 
          ? { ...p, balance: newBalance, totalEarned: p.totalEarned + points }
          : p
      );
      storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
      set({ childPoints: updated });

      // 推送通知
      pushService.notifyExtraReward(description, actualEarned);
    }
  },

  addExtraPenalty: (childId, points, description) => {
    const childPoints = get().getChildPoints(childId);
    const newBalance = childPoints.balance - points;

    get().addPointsRecord({
      familyId: childPoints.childId,
      childId,
      changeType: 'extra_penalty',
      points: -points,
      balanceAfter: newBalance,
      lockedPoints: childPoints.locked,
      description,
    });

    const updated = get().childPoints.map(p => 
      p.childId === childId 
        ? { ...p, balance: newBalance }
        : p
    );
    storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
    set({ childPoints: updated });

    // 推送通知
    pushService.notifyExtraPenalty(description, points);
  },

  // 删除额外奖励/惩罚时回退积分
  reverseExtraTransaction: (childId, taskPoints, taskDescription) => {
    const childPoints = get().getChildPoints(childId);
    
    if (taskPoints > 0) {
      // 回退奖励：减少 balance 和 totalEarned
      const newBalance = childPoints.balance - taskPoints;
      get().addPointsRecord({
        familyId: childPoints.childId,
        childId,
        changeType: 'extra_penalty',
        points: -taskPoints,
        balanceAfter: newBalance,
        lockedPoints: childPoints.locked,
        description: `删除奖励: ${taskDescription}`,
      });

      const updated = get().childPoints.map(p => 
        p.childId === childId 
          ? { ...p, balance: newBalance, totalEarned: Math.max(0, p.totalEarned - taskPoints) }
          : p
      );
      storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
      set({ childPoints: updated });
    } else {
      // 回退惩罚：增加 balance
      const penaltyPoints = Math.abs(taskPoints);
      const newBalance = childPoints.balance + penaltyPoints;
      get().addPointsRecord({
        familyId: childPoints.childId,
        childId,
        changeType: 'extra_reward',
        points: penaltyPoints,
        balanceAfter: newBalance,
        lockedPoints: childPoints.locked,
        description: `删除惩罚: ${taskDescription}`,
      });

      const updated = get().childPoints.map(p => 
        p.childId === childId 
          ? { ...p, balance: newBalance }
          : p
      );
      storage.set(STORAGE_KEYS.CHILD_POINTS, updated);
      set({ childPoints: updated });
    }
  },

  loadFromStorage: () => {
    const childPoints = storage.get<ChildPoints[]>(STORAGE_KEYS.CHILD_POINTS) || [];
    const records = storage.get<PointsRecord[]>(STORAGE_KEYS.POINTS_RECORDS) || [];
    const config = storage.get<typeof defaultSystemConfig>(STORAGE_KEYS.SYSTEM_CONFIG) || defaultSystemConfig;
    set({ childPoints, records, config });
  },
}));