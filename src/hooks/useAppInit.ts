/**
 * 应用初始化 Hook
 */

import { useEffect, useState } from 'react';
import { initStores } from '@/store';
import { useFamilyStore, useTaskStore } from '@/store';

export function useAppInit() {
  const [isLoading, setIsLoading] = useState(true);
  const family = useFamilyStore(state => state.family);
  const initFamily = useFamilyStore(state => state.initFamily);
  const addUser = useFamilyStore(state => state.addUser);
  const initDefaultTimeSlots = useTaskStore(state => state.initDefaultTimeSlots);

  useEffect(() => {
    initStores().then(() => {
      setIsLoading(false);
    });
  }, []);

  const needsSetup = !family;

  const setupFamily = (familyName: string, parentName: string, childName: string) => {
    const newFamily = initFamily(familyName);
    
    // 添加家长用户
    addUser({
      familyId: newFamily.id,
      role: 'parent',
      name: parentName,
    });
    
    // 添加孩子用户
    const child = addUser({
      familyId: newFamily.id,
      role: 'child',
      name: childName,
    });
    
    // 初始化时间段
    initDefaultTimeSlots(newFamily.id);
    
    return child;
  };

  return { needsSetup, setupFamily, family, isLoading };
}