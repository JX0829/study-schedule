import { useState, useEffect, useMemo } from 'react';
import { Page, Tabs, Icon, Button, Card, Badge } from '@/components';
import { PushSettings } from '@/components/PushSettings';
import {
  useFamilyStore, useTaskStore, useRewardStore, usePasswordStore,
  useTemplateStore, usePointsStore, useModuleConfigStore,
} from '@/store';
import { defaultSystemConfig } from '@/utils/presets';
import { getToday } from '@/utils/date';
import { startTaskReminder, stopTaskReminder } from '@/utils/taskReminder';
import type { SystemConfig, DailyTask } from '@/types';

import { TodayTasksTab } from './parent/TodayTasksTab';
import { RedemptionTab } from './parent/RedemptionTab';
import { SignPasswordTab } from './parent/SignPasswordTab';
import { TaskTemplatesTab } from './parent/TaskTemplatesTab';
import { RewardTemplatesTab } from './parent/RewardTemplatesTab';
import { PrizesTab } from './parent/PrizesTab';
import { ModulesTab } from './parent/ModulesTab';
import { ConfigTab } from './parent/ConfigTab';

export function ParentPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [currentDate, setCurrentDate] = useState(getToday());
  const [pointsConfig, setPointsConfig] = useState<SystemConfig>(defaultSystemConfig);

  // Stores
  const family = useFamilyStore(s => s.family);
  const users = useFamilyStore(s => s.users);
  const dailyTasks = useTaskStore(s => s.dailyTasks);
  const getDailyTasksByDate = useTaskStore(s => s.getDailyTasksByDate);
  const updateDailyTaskStatus = useTaskStore(s => s.updateDailyTaskStatus);
  const deleteDailyTask = useTaskStore(s => s.deleteDailyTask);
  const addDailyTask = useTaskStore(s => s.addDailyTask);
  const redemptionRecords = useRewardStore(s => s.redemptionRecords);
  const rewards = useRewardStore(s => s.rewards);
  const getPendingRedemptions = useRewardStore(s => s.getPendingRedemptions);
  const confirmRedemption = useRewardStore(s => s.confirmRedemption);
  const rejectRedemption = useRewardStore(s => s.rejectRedemption);
  const getSignPassword = usePasswordStore(s => s.getSignPassword);
  const generateSignPassword = usePasswordStore(s => s.generateSignPassword);
  const logout = usePasswordStore(s => s.logout);
  const getChildPoints = usePointsStore(s => s.getChildPoints);
  const earnPoints = usePointsStore(s => s.earnPoints);
  const addExtraReward = usePointsStore(s => s.addExtraReward);
  const addExtraPenalty = usePointsStore(s => s.addExtraPenalty);
  const reverseExtraTransaction = usePointsStore(s => s.reverseExtraTransaction);
  const moduleConfig = useModuleConfigStore(s => s.moduleConfig);
  const setModuleEnabled = useModuleConfigStore(s => s.setModuleEnabled);
  const taskTemplates = useTemplateStore(s => s.taskTemplates);
  const addTaskTemplate = useTemplateStore(s => s.addTaskTemplate);
  const updateTaskTemplate = useTemplateStore(s => s.updateTaskTemplate);
  const deleteTaskTemplate = useTemplateStore(s => s.deleteTaskTemplate);
  const rewardTemplates = useTemplateStore(s => s.rewardTemplates);
  const addRewardTemplate = useTemplateStore(s => s.addRewardTemplate);
  const updateRewardTemplate = useTemplateStore(s => s.updateRewardTemplate);
  const deleteRewardTemplate = useTemplateStore(s => s.deleteRewardTemplate);
  const initDefaultTemplates = useTemplateStore(s => s.initDefaultTemplates);

  // 跨 Tab 数据同步：孩子在另一个 Tab 写入数据后，家长端自动检测并刷新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key.includes('redemption_records') ||
        e.key.includes('daily_tasks') ||
        e.key.includes('child_points') ||
        e.key.includes('points_records')
      )) {
        console.log('🔄 检测到数据变更，刷新家长端数据:', e.key);
        setTimeout(() => {
          useRewardStore.getState().loadFromStorage();
          useTaskStore.getState().loadFromStorage();
          usePointsStore.getState().loadFromStorage();
        }, 100);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 定时刷新数据（每30秒同步一次，兜底保证数据不丢）
  useEffect(() => {
    const interval = setInterval(() => {
      useRewardStore.getState().loadFromStorage();
      useTaskStore.getState().loadFromStorage();
      usePointsStore.getState().loadFromStorage();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { startTaskReminder(); return () => stopTaskReminder(); }, []);

  useEffect(() => { generateSignPassword(); }, []);
  const parent = users.find(u => u.role === 'parent');
  const child = users.find(u => u.role === 'child');
  const childPoints = child ? getChildPoints(child.id) : null;
  const signPassword = getSignPassword();

  const todayTasks = useMemo(() => getDailyTasksByDate(currentDate), [currentDate, dailyTasks]);
  const pendingTasks = todayTasks.filter(t => t.status === 'pending');
  const submittedTasks = todayTasks.filter(t => t.status === 'submitted');
  const completedTasks = todayTasks.filter(t => t.status === 'completed');

  const progress = useMemo(() => {
    const comp = completedTasks.length;
    const pe = completedTasks.reduce((s, t) => s + t.points, 0);
    const pp = [...pendingTasks, ...submittedTasks].reduce((s, t) => s + t.points, 0);
    return { completed: comp, total: todayTasks.length, pointsEarned: pe, totalPoints: pe + pp };
  }, [todayTasks, completedTasks, pendingTasks, submittedTasks]);

  const pendingRedemptions = useMemo(() =>
    getPendingRedemptions(), [redemptionRecords, getPendingRedemptions]);
  const processedRedemptions = redemptionRecords.filter(r => r.status !== 'pending');

  // 最旧待审批兑换的等待时长
  const oldestPendingWait = useMemo(() => {
    if (pendingRedemptions.length === 0) return '';
    const oldest = pendingRedemptions.reduce((a, b) =>
      new Date(a.lockedAt).getTime() < new Date(b.lockedAt).getTime() ? a : b
    );
    const hours = Math.floor((Date.now() - new Date(oldest.lockedAt).getTime()) / 3600000);
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  }, [pendingRedemptions]);

  // 有待审批兑换时自动跳转到兑换审批 Tab
  const [hasCheckedRedemptions, setHasCheckedRedemptions] = useState(false);
  useEffect(() => {
    if (pendingRedemptions.length > 0 && !hasCheckedRedemptions) {
      setActiveTab('redemptions');
      setHasCheckedRedemptions(true);
    }
  }, [pendingRedemptions.length > 0 ? 1 : 0]);

  const handleDirectConfirmTask = (task: DailyTask) => {
    if (!child || !parent) return;
    updateDailyTaskStatus(task.id, 'completed', {
      confirmedAt: new Date().toISOString(), confirmedBy: parent.id,
    });
    earnPoints(child.id, task.points, task.id, `完成任务: ${task.name}`);
  };

  const handleEditTaskSave = (taskId: string, newPoints: number) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task) updateDailyTaskStatus(taskId, task.status, { points: newPoints });
  };

  const handleGiveBonus = (templateId: string, description: string) => {
    if (!child || !family || !parent) return;
    const template = rewardTemplates.find(t => t.id === templateId);
    if (!template) return;
    const points = Math.abs(template.points);
    const desc = description || template.name;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = getToday();
    addDailyTask({
      familyId: family.id, childId: child.id, date: today,
      name: template.points > 0 ? `🎁 ${desc}` : `⚠️ ${desc}`,
      type: 'habit', points: template.points, timeSlotId: '',
      timeSlotStart: time, timeSlotEnd: time, status: 'completed',
      confirmedAt: new Date().toISOString(), confirmedBy: parent.id, isExtraReward: true,
    });
    if (template.points > 0) addExtraReward(child.id, points, desc);
    else addExtraPenalty(child.id, points, desc);
  };

  const handleLogout = () => { logout(); window.location.reload(); };
  const tabs = [
    { key: 'today', label: '今日任务' },
    { key: 'redemptions', label: '兑换审批', badge: pendingRedemptions.length > 0 ? pendingRedemptions.length : undefined },
    { key: 'sign', label: '签字密码' },
    { key: 'templates', label: '任务模板' },
    { key: 'rewards', label: '奖惩模板' },
    { key: 'prizes', label: '奖品配置' },
    { key: 'modules', label: '模块配置' },
    { key: 'push', label: '推送设置' },
    { key: 'config', label: '配置' },
  ];

  return (
    <Page showHeader={false} className="pb-20">
      <div className="px-4 py-3 bg-blue-500/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👨‍👩‍👧</span>
            <div>
              <div className="font-medium text-white">家长端</div>
              <div className="text-xs text-blue-100">{family?.name}</div>
            </div>
          </div>
          {childPoints && (
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-white font-medium">{childPoints.balance}</span>
              <span className="text-blue-100 text-sm ml-1">分</span>
            </div>
          )}
        </div>
      </div>

      {/* 待审批兑换提醒横幅 */}
      {pendingRedemptions.length > 0 && (
        <div className="sticky top-[52px] z-8 bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 text-white animate-pulse shadow-lg shadow-orange-500/30">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <button
              className="flex items-center gap-3 flex-1 text-left"
              onClick={() => setActiveTab('redemptions')}
            >
              <span className="text-2xl animate-bounce">🔔</span>
              <div className="flex flex-col">
                <span className="font-bold text-base">有 {pendingRedemptions.length} 条兑换申请待审批</span>
                <span className="text-white/80 text-xs">最早于 {oldestPendingWait} 提交 · 点击立即处理</span>
              </div>
            </button>
            <button
              className="text-white/70 hover:text-white px-2"
              onClick={() => setActiveTab('redemptions')}
            >
              <Icon name="forward" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 栏 */}
      <div className={`bg-white sticky ${pendingRedemptions.length > 0 ? 'top-[100px]' : 'top-[52px]'} z-9 border-b`}>
        <div className="max-w-lg mx-auto overflow-x-auto">
          <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'today' && (
          <TodayTasksTab currentDate={currentDate} onDateChange={setCurrentDate}
            progress={progress} pendingTasks={pendingTasks} submittedTasks={submittedTasks}
            completedTasks={completedTasks} rewardTemplates={rewardTemplates}
            onDirectConfirmTask={handleDirectConfirmTask}
            onEditTaskSave={handleEditTaskSave} onDeleteTask={(taskId) => {
              const task = dailyTasks.find(t => t.id === taskId);
              if (task?.isExtraReward && child) {
                reverseExtraTransaction(child.id, task.points, task.name);
              }
              deleteDailyTask(taskId);
            }}
            onGiveBonus={handleGiveBonus} />
        )}
        {activeTab === 'redemptions' && (
          <RedemptionTab pendingRedemptions={pendingRedemptions}
            processedRedemptions={processedRedemptions} users={users}
            rewards={rewards} parent={parent}
            onApprove={(id, cb) => confirmRedemption(id, cb)}
            onReject={rejectRedemption} />
        )}
        {activeTab === 'sign' && (
          <SignPasswordTab signPassword={signPassword ?? ''} onLogout={handleLogout} />
        )}
        {activeTab === 'templates' && (
          <TaskTemplatesTab templates={taskTemplates} familyId={family?.id}
            onAdd={addTaskTemplate} onUpdate={updateTaskTemplate}
            onDelete={deleteTaskTemplate}
            onInitDefaults={() => family && initDefaultTemplates(family.id)} />
        )}
        {activeTab === 'rewards' && (
          <RewardTemplatesTab templates={rewardTemplates} familyId={family?.id}
            onAdd={addRewardTemplate} onUpdate={updateRewardTemplate}
            onDelete={deleteRewardTemplate}
            onInitDefaults={() => family && initDefaultTemplates(family.id)} />
        )}
        {activeTab === 'prizes' && <PrizesTab />}
        {activeTab === 'modules' && (
          <ModulesTab moduleConfig={moduleConfig} onSetModuleEnabled={setModuleEnabled} />
        )}
        {activeTab === 'push' && (
          <div className="space-y-4"><PushSettings /></div>
        )}
        {activeTab === 'config' && (
          <ConfigTab pointsConfig={pointsConfig} onPointsConfigChange={setPointsConfig}
            family={family} parent={parent} child={child} />
        )}
      </div>
    </Page>
  );
}
