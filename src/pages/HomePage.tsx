/**
 * 孩子端首页 - 自主创建任务 + 家长签字确认
 */

import { useState, useMemo } from 'react';
import { Page, Card, Button, TaskProgress, DateHeader, TabBar, Badge, PointsBadge, Icon, Modal } from '@/components';
import { TimePicker } from '@/components/ui/TimePicker';
import { SignPasswordInput } from '@/components/sign';
import { useTaskStore, usePointsStore, useFamilyStore, useTemplateStore } from '@/store';
import { getToday, formatDate } from '@/utils/date';
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

export function HomePage() {
  const [currentDate, setCurrentDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Store
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const currentUser = useFamilyStore(state => state.currentUser);
  const allTemplates = useTemplateStore(state => state.taskTemplates);
  const rewardTemplates = useTemplateStore(state => state.rewardTemplates);
  
  // 按当前家庭过滤模板（如果 family 还没加载，显示所有模板）
  const templates = useMemo(() => {
    if (!family?.id) return allTemplates;
    return allTemplates.filter(t => t.familyId === family.id);
  }, [allTemplates, family?.id]);
  
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
  const getChildPoints = usePointsStore(state => state.getChildPoints);
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
    // 已完成任务积分（包含正负）
    const pointsEarned = todayTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.points, 0);
    // 待完成任务积分（包含正负）
    const pendingPoints = todayTasks
      .filter(t => t.status === 'pending' || t.status === 'submitted')
      .reduce((sum, t) => sum + t.points, 0);
    // 总分 = 已完成 + 待完成（包含正负积分累加）
    const totalPoints = pointsEarned + pendingPoints;
    return { completed, total: todayTasks.length, pointsEarned, totalPoints };
  }, [todayTasks]);
  
  // 获取积分
  const childPoints = child ? getChildPoints(child.id) : null;
  
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
  
  // 标记完成（自己确认）
  const handleMarkComplete = (taskId: string) => {
    updateDailyTaskStatus(taskId, 'submitted', {
      completedAt: new Date().toISOString(),
    });
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
    
    // 更新任务状态为已完成
    updateDailyTaskStatus(selectedTaskId, 'completed', {
      confirmedAt: new Date().toISOString(),
      confirmedBy: parent?.id || 'parent',
    });
    
    // 积分入账
    earnPoints(child.id, task.points, selectedTaskId, `完成任务: ${task.name}`);
    
    setShowSignModal(false);
    setSelectedTaskId(null);
  };

  // TabBar 配置
  const tabBarItems = [
    { key: 'tasks', label: '任务', icon: 'calendar' },
    { key: 'points', label: '积分', icon: 'star' },
    { key: 'rewards', label: '奖励', icon: 'gift' },
  ];

  return (
    <Page showHeader={false} className="pb-16">
      {/* 顶部信息 */}
      <div className="px-4 py-3 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <div>
              <div className="font-medium text-gray-800">{child?.name}</div>
              <div className="text-xs text-gray-500">今天要加油哦！</div>
            </div>
          </div>
          {childPoints && (
            <PointsBadge points={childPoints.balance} locked={childPoints.locked} />
          )}
        </div>
      </div>

      {/* 任务内容 */}
      {activeTab === 'tasks' && (
        <div className="max-w-md mx-auto px-4 py-4">
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
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="clock" size={18} />
                  待完成 ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="task-item pending">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color={task.points < 0 ? 'danger' : 'primary'}>{task.points}分</Badge>
                            <span className="text-sm text-gray-500">{task.timeSlotStart}-{task.timeSlotEnd}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => updateDailyTaskStatus(task.id, 'pending')}>
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
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="lock" size={18} />
                  待签字确认 ({submittedTasks.length})
                </h3>
                <div className="space-y-2">
                  {submittedTasks.map(task => (
                    <div key={task.id} className="task-item bg-yellow-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color="primary">+{task.points}分</Badge>
                            <Badge color="gray">待签字</Badge>
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
                <p className="text-gray-500 text-sm mt-3 text-center">
                  请家长输入签字密码确认后积分入账
                </p>
              </Card>
            )}
            
            {/* 已完成任务 */}
            {completedTasks.length > 0 && (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="check" size={18} />
                  已完成 ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div key={task.id} className="task-item completed">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <Badge color={task.points < 0 ? 'danger' : 'success'}>{task.points}分</Badge>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setEditingTask(task);
                              setEditTaskPoints(String(task.points));
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-700"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => {
                              // 删除：改回待完成状态，积分会从已完成中移除
                              updateDailyTaskStatus(task.id, 'pending');
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 编辑任务弹窗 */}
                {editingTask && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-sm w-full p-4">
                      <h3 className="font-medium text-gray-700 mb-4">修改任务积分</h3>
                      <div className="mb-4">
                        <div className="font-medium mb-2">{editingTask.name}</div>
                        <input
                          type="number"
                          value={editTaskPoints}
                          onChange={(e) => setEditTaskPoints(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
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
            
            {/* 空状态 */}
            {todayTasks.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">今天还没有任务</p>
                  <p className="text-gray-400 text-sm">点击上方按钮创建你的任务吧！</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 积分内容 */}
      {activeTab === 'points' && (
        <div className="max-w-md mx-auto px-4 py-4">
          <Card className="mb-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">⭐</div>
              {childPoints ? (
                <>
                  <div className="text-3xl font-bold text-primary-600">
                    {childPoints.balance}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    可用积分
                    {childPoints.locked > 0 && (
                      <span className="text-gray-400 ml-2">({childPoints.locked} 已锁定)</span>
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
                </>
              ) : (
                <div className="text-gray-400">暂无积分数据</div>
              )}
            </div>
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
        <div className="max-w-md mx-auto px-4 py-4">
          <Card>
            <h3 className="font-medium text-gray-700 mb-3">可兑换奖励</h3>
            
            {rewardTemplates.length > 0 ? (
              <div className="space-y-2">
                {rewardTemplates.filter(r => r.points > 0).map(template => (
                  <div key={template.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <Badge color="success">+{template.points}分</Badge>
                    </div>
                    {childPoints && childPoints.balance >= template.points && (
                      <Button size="sm">兑换</Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="gift" size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500">家长还没有设置奖励模板</p>
              </div>
            )}
          </Card>
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
          <label className="text-gray-500 text-sm block mb-3">任务时间段</label>
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
            <label className="text-gray-500 text-sm block mb-2">选择任务模板</label>
            
            {/* 任务类型过滤 */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部 ({templates.length})
              </button>
              <button
                onClick={() => setFilterType('homework')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'homework'
                    ? 'bg-blue-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                作业 ({templates.filter(t => t.type === 'homework').length})
              </button>
              <button
                onClick={() => setFilterType('practice')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'practice'
                    ? 'bg-purple-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                练习 ({templates.filter(t => t.type === 'practice').length})
              </button>
              <button
                onClick={() => setFilterType('habit')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'habit'
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <div className="font-medium text-gray-800">{template.name}</div>
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
            <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500">家长还没有设置任务模板</p>
            <p className="text-gray-400 text-sm mt-1">请让家长先在家长端添加任务模板</p>
          </div>
        )}

        {/* 奖励任务选择 */}
        {rewardOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-500 text-sm block">奖励任务（最多选3个）</label>
              <span className="text-xs text-gray-400">{selectedRewards.length}/3</span>
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
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-gray-800 text-sm">{template.name}</div>
                  <div className="text-green-600 font-bold text-sm">+{template.points}分</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 惩罚任务选择 */}
        {penaltyOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-500 text-sm block">惩罚任务（最多选3个）</label>
              <span className="text-xs text-gray-400">{selectedPenalties.length}/3</span>
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
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-gray-800 text-sm">{template.name}</div>
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

      {/* 底部 TabBar */}
      <TabBar 
        items={tabBarItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </Page>
  );
}