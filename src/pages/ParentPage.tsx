import { useState, useEffect, useMemo } from 'react';
import { Page, Tabs } from '@/components';
import { 
  IconCommandDeck, 
  IconEnergyCrystal, 
  IconShieldLock 
} from '@/components/icons/CosmicIcons';
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
  const confirmTask = useTaskStore(s => s.confirmTask);
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

  // 跨 Tab 数据同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key.includes('redemption_records') ||
        e.key.includes('daily_tasks') ||
        e.key.includes('child_points') ||
        e.key.includes('points_records')
      )) {
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

  // 定时刷新数据
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

  const [hasCheckedRedemptions, setHasCheckedRedemptions] = useState(false);
  useEffect(() => {
    if (pendingRedemptions.length > 0 && !hasCheckedRedemptions) {
      setActiveTab('redemptions');
      setHasCheckedRedemptions(true);
    }
  }, [pendingRedemptions.length > 0 ? 1 : 0]);

  const handleDirectConfirmTask = (task: DailyTask) => {
    if (!child || !parent) return;
    confirmTask(task.id, parent.id);
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
    { key: 'config', label: '系统设置' },
  ];

  return (
    <Page showHeader={false} className="pb-24">
      {/* 科技宇宙星际指挥台顶栏 */}
      <div className="px-4 py-3.5 bg-[#0B132B]/90 backdrop-blur-md border-b border-sky-500/25 sticky top-0 z-20">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)] flex items-center justify-center">
              <IconCommandDeck size={26} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white flex items-center gap-2 font-orbitron">
                星际指挥管控台
                <span className="text-[10px] font-orbitron px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">HQ</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{family?.name || '家庭星舰基地'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 今日快捷签字授权码胶囊 */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
              <IconShieldLock size={16} className="text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">授权码:</span>
              <span className="font-orbitron font-bold text-amber-300 tracking-widest">{signPassword || '----'}</span>
            </div>

            {childPoints && (
              <div className="cosmic-glass-subtle px-3 py-1.5 flex items-center gap-1.5">
                <IconEnergyCrystal size={18} />
                <span className="text-amber-300 font-orbitron font-bold text-sm">{childPoints.balance}</span>
                <span className="text-slate-400 text-xs font-orbitron">星能</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 待审批兑换提醒横幅 (极简预警) */}
      {pendingRedemptions.length > 0 && (
        <div className="sticky top-[52px] z-10 bg-slate-850/95 border-b border-rose-500/30 backdrop-blur-md">
          <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              className="flex items-center gap-3 flex-1 text-left"
              onClick={() => setActiveTab('redemptions')}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-wide text-rose-300">
                  {pendingRedemptions.length} 条兑换申请待处理
                </span>
                <span className="text-slate-400 text-[11px]">
                  最早提交于 {oldestPendingWait} · 点击进入审核
                </span>
              </div>
            </button>
            <button
              className="text-slate-400 hover:text-white px-2 font-mono text-xs"
              onClick={() => setActiveTab('redemptions')}
            >
              ➔
            </button>
          </div>
        </div>
      )}

      {/* Tab 栏 */}
      <div className={`bg-slate-900/90 backdrop-blur-md sticky ${pendingRedemptions.length > 0 ? 'top-[95px]' : 'top-[52px]'} z-10 border-b border-slate-800`}>
        <div className="w-full max-w-7xl mx-auto overflow-x-auto scrollbar-hide px-2">
          <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 py-4">
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
