/**
 * 孩子端首页 - 自主创建任务 + 家长签字确认
 */

import { useState, useMemo, useEffect } from 'react';
import { Page, Card, Button, TaskProgress, DateHeader, TabBar, Badge, Icon, Modal } from '@/components';
import { 
  IconAstronautHelmet, 
  IconEnergyCrystal, 
} from '@/components/icons/CosmicIcons';
import { TimePicker } from '@/components/ui/TimePicker';
import { SignPasswordInput } from '@/components/sign';
import { LuckyWheel } from '@/components/LuckyWheel';
import { useTaskStore, usePointsStore, useFamilyStore, useTemplateStore, useRewardStore } from '@/store';
import { getToday, formatDate } from '@/utils/date';
import { startTaskReminder, stopTaskReminder } from '@/utils/taskReminder';
import type { DailyTask } from '@/types';

// 获取当前时间的 HH:mm 格式
function getCurrentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// 计算结束时间（起始时间 + 30分钟）
function getEndTimeString(startTime: string) {
  const [h, m] = startTime.split(':').map(Number);
  let newH = h;
  let newM = m + 30;
  if (newM >= 60) {
    newH += 1;
    newM -= 60;
  }
  if (newH >= 24) newH = 0;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

import { pushService } from '@/utils/push';

export function HomePage() {
  const [currentDate, setCurrentDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Store
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const allTemplates = useTemplateStore(state => state.taskTemplates);
  const rewardTemplates = useTemplateStore(state => state.rewardTemplates);
  
  // 按当前家庭过滤模板（如果 family 还没加载，显示所有模板）
  const templates = useMemo(() => {
    if (!family?.id) return allTemplates;
    return allTemplates.filter(t => t.familyId === family.id);
  }, [allTemplates, family?.id]);
  
  // 跨 Tab 数据同步：家长在另一个 Tab 操作后，孩子端自动刷新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (
        e.key.includes('redemption_records') ||
        e.key.includes('daily_tasks') ||
        e.key.includes('child_points') ||
        e.key.includes('points_records')
      )) {
        console.log('🔄 检测到家长端数据变更，刷新孩子端:', e.key);
        setTimeout(() => {
          useTaskStore.getState().loadFromStorage();
          usePointsStore.getState().loadFromStorage();
          useRewardStore.getState().loadFromStorage();
        }, 100);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 启动任务提醒服务
  useEffect(() => {
    startTaskReminder();
    return () => stopTaskReminder();
  }, []);
  
  // 按当前家庭过滤奖惩模板
  const filteredRewardTemplates = useMemo(() => {
    if (!family?.id) return rewardTemplates;
    return rewardTemplates.filter(t => t.familyId === family.id);
  }, [rewardTemplates, family?.id]);
  
  const rewardOptions = filteredRewardTemplates.filter(t => t.points > 0);
  const penaltyOptions = filteredRewardTemplates.filter(t => t.points < 0);
  const dailyTasks = useTaskStore(state => state.dailyTasks);
  const getDailyTasksByDate = useTaskStore(state => state.getDailyTasksByDate);
  const addDailyTask = useTaskStore(state => state.addDailyTask);
  const updateDailyTaskStatus = useTaskStore(state => state.updateDailyTaskStatus);
  const submitTask = useTaskStore(state => state.submitTask);
  const confirmTask = useTaskStore(state => state.confirmTask);
  const deleteDailyTask = useTaskStore(state => state.deleteDailyTask);
  const getChildPoints = usePointsStore(state => state.getChildPoints);
  const getPointsRecords = usePointsStore(state => state.getPointsRecords);
  const earnPoints = usePointsStore(state => state.earnPoints);
  
  // 新任务的起始和结束时间（孩子自主选择）
  const [customStartTime, setCustomStartTime] = useState(getCurrentTimeString());
  const [customEndTime, setCustomEndTime] = useState(getEndTimeString(getCurrentTimeString()));
  
  // 任务类型过滤
  const [filterType, setFilterType] = useState<'all' | 'homework' | 'practice' | 'habit'>('all');
  
  // 选中的奖惩任务
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);
  const [selectedPenalties, setSelectedPenalties] = useState<string[]>([]);
  
  // 编辑已完成任务
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editTaskPoints, setEditTaskPoints] = useState('');
  
  // 兑换积分
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  
  // 兑换记录
  const redemptionRecords = useRewardStore(state => state.redemptionRecords);
  const getRedemptionsByChild = useRewardStore(state => state.getRedemptionsByChild);
  
  // 积分记录时间范围
  const [recordDays, setRecordDays] = useState(7);
  
  // 获取孩子用户
  const child = users.find(u => u.role === 'child');
  const parent = users.find(u => u.role === 'parent');
  
  // 获取当日任务
  const todayTasks = useMemo(() => {
    return getDailyTasksByDate(currentDate);
  }, [currentDate, dailyTasks]);
  
  // 按状态分组
  const pendingTasks = todayTasks.filter(t => t.status === 'pending');
  const completedTasks = todayTasks.filter(t => t.status === 'completed');
  const submittedTasks = todayTasks.filter(t => t.status === 'submitted');
  
  // 计算进度
  const progress = useMemo(() => {
    const completed = todayTasks.filter(t => t.status === 'completed').length;
    // 已完成任务积分（排除额外奖励任务，避免重复计算）
    const taskPointsEarned = todayTasks
      .filter(t => t.status === 'completed' && !t.isExtraReward)
      .reduce((sum, t) => sum + t.points, 0);
    
    // 获取当天额外奖励积分记录（extra_reward 类型）
    const todayExtraRewards = child ? getPointsRecords(child.id).filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      return recordDate === currentDate && r.changeType === 'extra_reward';
    }) : [];
    const extraRewardPoints = todayExtraRewards.reduce((sum, r) => sum + r.points, 0);
    
    // 当天获取积分 = 任务积分 + 额外奖励积分
    const pointsEarned = taskPointsEarned + extraRewardPoints;
    
    // 待完成任务积分（包含正负）
    const pendingPoints = todayTasks
      .filter(t => t.status === 'pending' || t.status === 'submitted')
      .reduce((sum, t) => sum + t.points, 0);
    // 总分 = 已完成 + 待完成 + 额外奖励（包含正负积分累加）
    const totalPoints = taskPointsEarned + pendingPoints + extraRewardPoints;
    return { completed, total: todayTasks.length, pointsEarned, extraRewardPoints, taskPointsEarned, totalPoints, todayExtraRewards };
  }, [todayTasks, child, getPointsRecords, currentDate]);
  
  // 获取积分
  const childPoints = useMemo(() => {
    if (!child) return null;
    return getChildPoints(child.id);
  }, [child, getChildPoints]);
  
  // 获取积分记录（最近N天）
  const pointsRecords = useMemo(() => {
    if (!child) return [];
    const allRecords = getPointsRecords(child.id);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - recordDays);
    return allRecords.filter(r => new Date(r.createdAt) >= cutoffDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [child, getPointsRecords, recordDays]);
  
  // 日期切换
  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(formatDate(prev));
  };
  
  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(formatDate(next));
  };
  
  // 从模板选择任务（孩子自主选择时间段）
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !family || !child) return;
    
    addDailyTask({
      familyId: family.id,
      childId: child.id,
      date: currentDate,
      name: template.name,
      type: template.type,
      points: template.points,
      timeSlotId: '', // 不使用时间段 ID
      timeSlotStart: customStartTime,
      timeSlotEnd: customEndTime,
      status: 'pending',
    });

    // 触发推送通知家长（新任务创建）
    const timeSlot = customStartTime && customEndTime ? `${customStartTime}-${customEndTime}` : undefined;
    pushService.notifyNewTask(template.name, template.points, timeSlot);
    
    setShowAddTask(false);
  };
  
  // 打开添加任务模态框时自动计算时间
  const handleOpenAddTask = () => {
    // 自动计算起始时间
    if (completedTasks.length > 0) {
      // 从最后一个任务的结束时间 + 10分钟
      const lastTask = completedTasks[completedTasks.length - 1];
      const newStart = getEndTimeString(lastTask.timeSlotEnd || '00:00');
      setCustomStartTime(newStart);
      setCustomEndTime(getEndTimeString(newStart));
    } else {
      // 从当前时间开始
      const now = getCurrentTimeString();
      setCustomStartTime(now);
      setCustomEndTime(getEndTimeString(now));
    }
    // 重置奖惩选择
    setSelectedRewards([]);
    setSelectedPenalties([]);
    setShowAddTask(true);
  };
  
  // 标记完成（提交给家长签字，触发通知）
  const handleMarkComplete = (taskId: string) => {
    submitTask(taskId);
  };
  
  // 标记未完成
  const handleMarkPending = (taskId: string) => {
    updateDailyTaskStatus(taskId, 'pending');
  };
  
  // 打开签字确认模态框
  const handleOpenSignModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowSignModal(true);
  };
  
  // 签字确认成功
  const handleSignSuccess = () => {
    if (!selectedTaskId || !child) return;
    
    const task = todayTasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    
    // 确认任务完成（内置推送通知孩子）
    confirmTask(selectedTaskId, parent?.id || 'parent');
    
    // 积分入账
    earnPoints(child.id, task.points, selectedTaskId, `完成任务: ${task.name}`);
    
    setShowSignModal(false);
    setSelectedTaskId(null);
  };

  // 当前孩子的兑换记录
  const childRedemptions = useMemo(() => {
    if (!child) return [];
    return getRedemptionsByChild(child.id).sort(
      (a, b) => new Date(b.lockedAt).getTime() - new Date(a.lockedAt).getTime()
    );
  }, [child, redemptionRecords, getRedemptionsByChild]);

  const pendingRedemptionsCount = useMemo(() =>
    childRedemptions.filter(r => r.status === 'pending').length,
    [childRedemptions]
  );

  // TabBar 配置
  const tabBarItems = [
    { key: 'tasks', label: '任务', icon: 'calendar' },
    { key: 'points', label: '积分', icon: 'star' },
    { key: 'rewards', label: '奖励', icon: 'gift', badge: pendingRedemptionsCount },
  ];

  return (
    <Page showHeader={false} className="pb-16">
      {/* 顶部星际状态舱 */}
      <div className="px-4 py-3.5 bg-[#0B132B]/85 backdrop-blur-md border-b border-sky-500/25 sticky top-0 z-20">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center justify-center">
              <IconAstronautHelmet size={28} />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                <span>{child?.name || '小宇航员'}</span>
                <span className="text-[10px] font-orbitron px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300">COMMANDER</span>
              </div>
              <div className="text-xs font-orbitron text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span>今日有效星能: <strong className="text-cyan-300">{progress.taskPointsEarned}</strong></span>
                {progress.extraRewardPoints > 0 && (
                  <span className="text-emerald-400 font-semibold">(+{progress.extraRewardPoints} 增益)</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            <div className="cosmic-glass-subtle px-3.5 py-1.5 flex items-center gap-2">
              <IconEnergyCrystal size={20} />
              <div className="text-right">
                <div className="text-xl font-bold font-orbitron text-amber-300 leading-none">{progress.pointsEarned}</div>
                <div className="text-[10px] font-orbitron text-slate-400 tracking-wider">今日已获星能</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 任务内容 */}
      {activeTab === 'tasks' && (
        <div className="w-full max-w-7xl mx-auto py-2 space-y-5">
          <DateHeader 
            date={currentDate}
            onPrevDay={prevDay}
            onNextDay={nextDay}
          />
          
          {/* 进度条 */}
          {todayTasks.length > 0 && (
            <TaskProgress 
              completed={progress.completed}
              total={progress.total}
              pointsEarned={progress.pointsEarned}
              totalPoints={progress.totalPoints}
            />
          )}
          
          {/* 选择任务按钮 */}
          <Button className="w-full mb-4" onClick={handleOpenAddTask}>
            + 选择今日任务
          </Button>
          
          {/* 任务列表 */}
          <div className="space-y-4">
            {/* 待完成任务 */}
            {pendingTasks.length > 0 && (
              <Card>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Icon name="clock" size={18} />
                  待完成 ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="task-item pending">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color={task.points < 0 ? 'danger' : 'primary'}>{task.points}分</Badge>
                            <span className="text-sm text-white">{task.timeSlotStart}-{task.timeSlotEnd}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => deleteDailyTask(task.id)}>
                          🗑️
                        </Button>
                        <Button size="sm" onClick={() => handleMarkComplete(task.id)}>
                          ✓ 完成
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* 待签字确认 */}
            {submittedTasks.length > 0 && (
              <Card>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Icon name="lock" size={18} />
                  待签字确认 ({submittedTasks.length})
                </h3>
                <div className="space-y-2">
                  {submittedTasks.map(task => (
                    <div key={task.id} className="task-item bg-amber-950/40 border border-amber-500/40">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-amber-200">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color="primary">+{task.points}分</Badge>
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">待签字</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => handleMarkPending(task.id)}>
                          未完成
                        </Button>
                        <Button size="sm" onClick={() => handleOpenSignModal(task.id)}>
                          签字
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-white text-sm mt-3 text-center">
                  请家长输入签字密码确认后积分入账
                </p>
              </Card>
            )}
            
            {/* 已完成任务 */}
            {completedTasks.length > 0 && (
              <Card>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Icon name="check" size={18} />
                  已完成 ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div key={task.id} className={`task-item ${task.isExtraReward ? 'bg-emerald-950/40 border border-emerald-500/40' : 'completed'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.isExtraReward ? '🎁' : '✅'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{task.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge color={task.points < 0 ? 'danger' : 'success'}>{task.points}分</Badge>
                            {task.isExtraReward && <Badge color="success">家长奖励</Badge>}
                            {!task.isExtraReward && <span className="text-sm text-white">{task.timeSlotStart}-{task.timeSlotEnd}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!task.isExtraReward && (
                            <button 
                              onClick={() => {
                                setEditingTask(task);
                                setEditTaskPoints(String(task.points));
                              }}
                              className="p-1.5 text-white hover:text-white"
                            >
                              ✏️
                            </button>
                          )}
                          {!task.isExtraReward && (
                            <button 
                              onClick={() => {
                                // 删除：改回待完成状态，积分会从已完成中移除
                                updateDailyTaskStatus(task.id, 'pending');
                              }}
                              className="p-1.5 text-white hover:text-red-600"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 编辑任务弹窗 */}
                {editingTask && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="cosmic-glass border border-sky-500/40 max-w-sm w-full p-5 text-white">
                      <h3 className="font-medium text-white mb-4">修改任务积分</h3>
                      <div className="mb-4">
                        <div className="font-medium mb-2">{editingTask.name}</div>
                        <input
                          type="number"
                          value={editTaskPoints}
                          onChange={(e) => setEditTaskPoints(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            const newPoints = parseInt(editTaskPoints);
                            if (!isNaN(newPoints)) {
                              updateDailyTaskStatus(editingTask.id, 'completed', { points: newPoints });
                            }
                            setEditingTask(null);
                          }}
                        >
                          保存
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={() => setEditingTask(null)}>
                          取消
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
            
            {/* 额外奖励 */}
            {progress.todayExtraRewards.length > 0 && (
              <Card>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Icon name="gift" size={18} />
                  额外奖励 ({progress.todayExtraRewards.length})
                </h3>
                <div className="space-y-2">
                  {progress.todayExtraRewards.map(record => (
                    <div key={record.id} className="flex items-center justify-between py-2 px-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <div>
                          <div className="font-medium text-white">{record.description}</div>
                          <div className="text-xs text-white">
                            {new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">+{record.points}分</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                  <span className="text-sm text-white">奖励合计: </span>
                  <span className="font-bold text-green-600">+{progress.extraRewardPoints}分</span>
                </div>
              </Card>
            )}
            
            {/* 空状态 */}
            {todayTasks.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Icon name="calendar" size={40} className="text-white mb-3" />
                  <p className="text-white mb-2">今天还没有任务</p>
                  <p className="text-white text-sm">点击上方按钮创建你的任务吧！</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 积分内容 */}
      {activeTab === 'points' && (
        <div className="w-full max-w-7xl mx-auto py-2 space-y-5">
          <Card className="mb-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">⭐</div>
              {childPoints ? (
                <>
                  <div className="text-3xl font-bold text-primary-600">
                    {childPoints.balance}
                  </div>
                  <div className="text-white text-sm mt-1">
                    可用积分
                    {childPoints.locked > 0 && (
                      <span className="text-white ml-2">({childPoints.locked} 已锁定)</span>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-green-500">累计获得</span>
                      <span className="font-medium ml-1">{childPoints.totalEarned}</span>
                    </div>
                    <div>
                      <span className="text-red-500">累计兑换</span>
                      <span className="font-medium ml-1">{childPoints.totalRedeemed}</span>
                    </div>
                  </div>
                  {/* 兑换积分按钮 */}
                  <Button className="mt-4" onClick={() => setShowRedeemModal(true)}>
                    💰 申请兑换积分
                  </Button>

                  {/* 待审批兑换提醒 */}
                  {pendingRedemptionsCount > 0 && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <button
                        className="w-full text-left text-sm text-yellow-700"
                        onClick={() => setActiveTab('rewards')}
                      >
                        ⏳ 有 <span className="font-bold">{pendingRedemptionsCount}</span> 条兑换申请待审批
                        <span className="text-yellow-500 ml-1">→ 查看详情</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white">暂无积分数据</div>
              )}
            </div>
          </Card>
          
          {/* 积分记录 */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">积分记录</h3>
              <select 
                value={recordDays}
                onChange={(e) => setRecordDays(Number(e.target.value))}
                className="text-sm text-white bg-transparent"
              >
                <option value={7}>最近7天</option>
                <option value={14}>最近14天</option>
                <option value={30}>最近30天</option>
              </select>
            </div>
            
            {pointsRecords.length > 0 ? (
              <div className="space-y-2">
                {pointsRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        {record.changeType === 'earn' && '完成任务'}
                        {record.changeType === 'extra_reward' && '🎁 奖励'}
                        {record.changeType === 'extra_penalty' && '⚠️ 惩罚'}
                        {record.changeType === 'redeem_lock' && '🔒 兑换锁定'}
                        {record.changeType === 'redeem_unlock' && '🔓 兑换解锁'}
                        {record.changeType === 'redeem_deduct' && '✅ 兑换成功'}
                        {!['earn', 'extra_reward', 'extra_penalty', 'redeem_lock', 'redeem_unlock', 'redeem_deduct'].includes(record.changeType) && '积分变动'}
                      </div>
                      <div className="text-xs text-white">
                        {record.description}
                      </div>
                      <div className="text-xs text-white">
                        {new Date(record.createdAt).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${record.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {record.points > 0 ? '+' : ''}{record.points}
                      </div>
                      <div className="text-xs text-white">
                        余额: {record.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-white">
                暂无积分记录
              </div>
            )}
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200">
            <h3 className="font-medium text-yellow-700 mb-2">💡 获得积分小贴士</h3>
            <div className="text-sm text-yellow-600 space-y-1">
              <p>• 完成任务后点击"完成"按钮</p>
              <p>• 请家长签字确认后积分入账</p>
              <p>• 积分可以兑换奖励哦！</p>
            </div>
          </Card>
        </div>
      )}

      {/* 奖励内容 */}
      {activeTab === 'rewards' && (
        <div className="w-full max-w-7xl mx-auto py-2 space-y-5">
          <LuckyWheel />

          {/* 兑换状态 */}
          {childRedemptions.length > 0 && (
            <Card>
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <Icon name="gift" size={18} />
                兑换记录
              </h3>
              <div className="space-y-2">
                {childRedemptions.map(r => {
                  const reward = useRewardStore.getState().rewards.find(rw => rw.id === r.rewardId);
                  const statusConfig = {
                    pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⏳' },
                    approved: { label: '已批准', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
                    rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' },
                  };
                  const cfg = statusConfig[r.status] || statusConfig.pending;
                  const rewardName = r.rewardId === 'custom_points'
                    ? `${r.pointsCost}积分`
                    : reward?.name || '未知奖励';
                  return (
                    <div key={r.id} className={`rounded-lg p-3 border ${cfg.color}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <span className="font-medium">{rewardName}</span>
                        </div>
                        <Badge color={
                          r.status === 'approved' ? 'success' :
                          r.status === 'rejected' ? 'danger' : 'primary'
                        } size="sm">
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-700 mt-1">
                        申请时间：{new Date(r.lockedAt).toLocaleString('zh-CN')}
                      </div>
                      {r.status === 'rejected' && r.rejectedReason && (
                        <div className="text-xs text-red-600 mt-1">
                          驳回原因：{r.rejectedReason}
                        </div>
                      )}
                      {r.status === 'approved' && r.confirmedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          批准时间：{new Date(r.confirmedAt).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 兑换积分入口 */}
          {childPoints && (
            <Card className="text-center">
              <div className="py-3">
                <div className="text-sm text-white mb-2">可用积分</div>
                <div className="text-3xl font-bold text-primary-600 mb-3">
                  {childPoints.balance - childPoints.locked}
                </div>
                <Button onClick={() => setShowRedeemModal(true)}>
                  💰 申请兑换积分
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 添加任务模态框 */}
      <Modal 
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="选择任务"
      >
        {/* 时间选择 */}
        <div className="mb-4">
          <label className="text-white text-sm block mb-3">任务时间段</label>
          <TimePicker
            startTime={customStartTime}
            endTime={customEndTime}
            onStartTimeChange={setCustomStartTime}
            onEndTimeChange={setCustomEndTime}
          />
        </div>
        
        {/* 从模板选择任务 */}
        {templates.length > 0 ? (
          <div>
            <label className="text-white text-sm block mb-2">选择任务模板</label>
            
            {/* 任务类型过滤 */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                全部 ({templates.length})
              </button>
              <button
                onClick={() => setFilterType('homework')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'homework'
                    ? 'bg-blue-500 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                作业 ({templates.filter(t => t.type === 'homework').length})
              </button>
              <button
                onClick={() => setFilterType('practice')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'practice'
                    ? 'bg-purple-500 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                练习 ({templates.filter(t => t.type === 'practice').length})
              </button>
              <button
                onClick={() => setFilterType('habit')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'habit'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                习惯 ({templates.filter(t => t.type === 'habit').length})
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {(filterType === 'all' ? templates : templates.filter(t => t.type === filterType)).map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`border rounded-lg p-3 text-left hover:bg-primary-50 hover:border-primary-300 transition-colors ${template.points < 0 ? 'border-red-200 bg-red-50' : ''}`}
                >
                  <div className="font-medium text-white">{template.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge color={template.type === 'homework' ? 'blue' : template.type === 'practice' ? 'purple' : 'success'} size="sm">
                      {template.type === 'homework' ? '作业' : template.type === 'practice' ? '练习' : '习惯'}
                    </Badge>
                    <Badge color={template.points < 0 ? 'danger' : 'primary'} size="sm">
                      {template.points}分
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="calendar" size={40} className="text-white mb-3" />
            <p className="text-white">家长还没有设置任务模板</p>
            <p className="text-white text-sm mt-1">请让家长先在家长端添加任务模板</p>
          </div>
        )}

        {/* 奖励任务选择 */}
        {rewardOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm block">奖励任务（最多选3个）</label>
              <span className="text-xs text-white">{selectedRewards.length}/3</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {rewardOptions.slice(0, 6).map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    if (selectedRewards.includes(template.id)) {
                      setSelectedRewards(selectedRewards.filter(id => id !== template.id));
                    } else if (selectedRewards.length < 3) {
                      setSelectedRewards([...selectedRewards, template.id]);
                    }
                  }}
                  disabled={!selectedRewards.includes(template.id) && selectedRewards.length >= 3}
                  className={`border rounded-lg p-2 text-left transition-colors ${
                    selectedRewards.includes(template.id)
                      ? 'border-emerald-500 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'border-sky-500/20 bg-[#0B132B]/80 text-white placeholder-slate-400 hover:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-white text-sm">{template.name}</div>
                  <div className="text-emerald-400 font-bold text-sm">+{template.points}分</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 惩罚任务选择 */}
        {penaltyOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm block">惩罚任务（最多选3个）</label>
              <span className="text-xs text-white">{selectedPenalties.length}/3</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {penaltyOptions.slice(0, 6).map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    if (selectedPenalties.includes(template.id)) {
                      setSelectedPenalties(selectedPenalties.filter(id => id !== template.id));
                    } else if (selectedPenalties.length < 3) {
                      setSelectedPenalties([...selectedPenalties, template.id]);
                    }
                  }}
                  disabled={!selectedPenalties.includes(template.id) && selectedPenalties.length >= 3}
                  className={`border rounded-lg p-2 text-left transition-colors ${
                    selectedPenalties.includes(template.id)
                      ? 'border-red-500 bg-red-50'
                      : 'border-sky-500/20 bg-[#0B132B]/80 text-white placeholder-slate-400 hover:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-white text-sm">{template.name}</div>
                  <div className="text-red-600 font-bold text-sm">{template.points}分</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 确认添加任务按钮 */}
        {(selectedRewards.length > 0 || selectedPenalties.length > 0) && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full"
              onClick={() => {
                // 添加选中的奖励任务
                selectedRewards.forEach(rewardId => {
                  const template = rewardOptions.find(r => r.id === rewardId);
                  if (template && family && child) {
                    addDailyTask({
                      familyId: family.id,
                      childId: child.id,
                      date: currentDate,
                      name: template.name,
                      type: 'habit',
                      points: template.points,
                      timeSlotId: '',
                      timeSlotStart: customStartTime,
                      timeSlotEnd: customEndTime,
                      status: 'completed', // 奖励任务直接完成
                    });
                    // 奖励积分立即入账
                    earnPoints(child.id, template.points, '', `奖励: ${template.name}`);
                    // 触发推送
                    pushService.notifyNewTask(`🎁 ${template.name}`, template.points, '即时');
                  }
                });
                // 添加选中的惩罚任务
                selectedPenalties.forEach(penaltyId => {
                  const template = penaltyOptions.find(p => p.id === penaltyId);
                  if (template && family && child) {
                    addDailyTask({
                      familyId: family.id,
                      childId: child.id,
                      date: currentDate,
                      name: template.name,
                      type: 'habit',
                      points: template.points,
                      timeSlotId: '',
                      timeSlotStart: customStartTime,
                      timeSlotEnd: customEndTime,
                      status: 'completed', // 惩罚任务直接完成，积分已扣除
                    });
                    // 惩罚积分立即扣除
                    earnPoints(child.id, template.points, '', `惩罚: ${template.name}`);
                    // 触发推送
                    pushService.notifyNewTask(`⚠️ ${template.name}`, template.points, '即时');
                  }
                });
                // 重置选择并关闭模态框
                setSelectedRewards([]);
                setSelectedPenalties([]);
                setShowAddTask(false);
              }}
            >
              确认添加奖惩任务
            </Button>
          </div>
        )}
      </Modal>

      {/* 签字确认模态框 */}
      <Modal
        isOpen={showSignModal}
        onClose={() => {
          setShowSignModal(false);
          setSelectedTaskId(null);
        }}
        title="家长签字确认"
      >
        <SignPasswordInput 
          onConfirm={handleSignSuccess}
          onCancel={() => {
            setShowSignModal(false);
            setSelectedTaskId(null);
          }}
        />
      </Modal>
      
      {/* 兑换积分模态框 */}
      <Modal
        isOpen={showRedeemModal}
        onClose={() => {
          setShowRedeemModal(false);
          setRedeemPoints('');
        }}
        title="申请兑换积分"
      >
        <div className="py-4">
          <div className="text-center mb-4">
            <div className="text-sm text-white">当前可用积分</div>
            <div className="text-2xl font-bold text-primary-600">
              {childPoints ? childPoints.balance - childPoints.locked : 0}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-white text-sm block mb-2">兑换积分数量</label>
            <input
              type="number"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              placeholder="请输入要兑换的积分数量"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
              min="1"
              max={childPoints ? childPoints.balance - childPoints.locked : 0}
            />
          </div>
          
          <div className="bg-yellow-50 border-yellow-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">💡 提示</p>
              <p>• 兑换申请提交后，积分将被锁定</p>
              <p>• 需要家长审核通过后才能使用</p>
              <p>• 如果家长驳回，积分会自动解锁</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                const points = parseInt(redeemPoints);
                if (!points || points <= 0) return;
                if (!child || !childPoints) return;
                const available = childPoints.balance - childPoints.locked;
                if (points > available) {
                  alert('积分不足');
                  return;
                }
                
                // 创建自定义积分兑换申请
                const result = useRewardStore.getState().createCustomPointsRedemption(child.id, points);
                if (result) {
                  setShowRedeemModal(false);
                  setRedeemPoints('');
                  alert('兑换申请已提交，等待家长审核');
                } else {
                  alert('提交失败，请稍后重试');
                }
              }}
            >
              提交申请
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => {
                setShowRedeemModal(false);
                setRedeemPoints('');
              }}
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 底部 TabBar */}
      <TabBar 
        items={tabBarItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </Page>
  );
}