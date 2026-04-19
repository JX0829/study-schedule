/**
 * 家长端设置页面 - 增强版
 * 功能：
 * 1. 今日任务 - 查看孩子当天任务并直接签字确认
 * 2. 任务模板剪切板导入
 * 3. 奖惩模板剪切板导入
 */

import { useState, useEffect, useMemo } from 'react';
import { Page, Card, Button, Badge, Tabs, Icon, TaskProgress } from '@/components';
import { useFamilyStore, useTaskStore, useRewardStore, usePasswordStore, useTemplateStore, usePointsStore } from '@/store';
import { defaultSystemConfig } from '@/utils/presets';
import { getToday, formatDate } from '@/utils/date';
import type { SystemConfig, DailyTask } from '@/types';

export function ParentPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showSignPassword, setShowSignPassword] = useState(false);
  const [currentDate, setCurrentDate] = useState(getToday());
  
  // Store
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const dailyTasks = useTaskStore(state => state.dailyTasks);
  const getDailyTasksByDate = useTaskStore(state => state.getDailyTasksByDate);
  const updateDailyTaskStatus = useTaskStore(state => state.updateDailyTaskStatus);
  const deleteDailyTask = useTaskStore(state => state.deleteDailyTask);
  const rewards = useRewardStore(state => state.rewards);
  const addReward = useRewardStore(state => state.addReward);
  const deleteReward = useRewardStore(state => state.deleteReward);
  const getSignPassword = usePasswordStore(state => state.getSignPassword);
  const generateSignPassword = usePasswordStore(state => state.generateSignPassword);
  const logout = usePasswordStore(state => state.logout);
  const getChildPoints = usePointsStore(state => state.getChildPoints);
  const earnPoints = usePointsStore(state => state.earnPoints);
  
  const taskTemplates = useTemplateStore(state => state.taskTemplates);
  const addTaskTemplate = useTemplateStore(state => state.addTaskTemplate);
  const deleteTaskTemplate = useTemplateStore(state => state.deleteTaskTemplate);
  const rewardTemplates = useTemplateStore(state => state.rewardTemplates);
  const addRewardTemplate = useTemplateStore(state => state.addRewardTemplate);
  const deleteRewardTemplate = useTemplateStore(state => state.deleteRewardTemplate);
  const initDefaultTemplates = useTemplateStore(state => state.initDefaultTemplates);
  
  // 家庭信息编辑
  const [editingFamily, setEditingFamily] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name || '');
  
  // 积分配置
  const [pointsConfig, setPointsConfig] = useState<SystemConfig>(defaultSystemConfig);
  
  // 任务模板编辑
  const [showAddTaskTemplate, setShowAddTaskTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePoints, setNewTemplatePoints] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'homework' | 'practice' | 'habit'>('habit');
  
  // 任务模板剪切板导入
  const [showTaskClipboardImport, setShowTaskClipboardImport] = useState(false);
  const [taskClipboardText, setTaskClipboardText] = useState('');
  const [taskImportPreview, setTaskImportPreview] = useState<Array<{ name: string; points: number; type: 'homework' | 'practice' | 'habit' }>>([]);
  
  // 奖惩模板编辑
  const [showAddRewardTemplate, setShowAddRewardTemplate] = useState(false);
  const [newRewardTemplateName, setNewRewardTemplateName] = useState('');
  const [newRewardTemplatePoints, setNewRewardTemplatePoints] = useState('');
  
  // 奖惩模板剪切板导入
  const [showRewardClipboardImport, setShowRewardClipboardImport] = useState(false);
  const [rewardClipboardText, setRewardClipboardText] = useState('');
  const [rewardImportPreview, setRewardImportPreview] = useState<Array<{ name: string; points: number }>>([]);
  
  // 奖励编辑
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');

  // 额外奖惩发放
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusType, setBonusType] = useState<'reward' | 'penalty'>('reward');
  const [bonusTemplateId, setBonusTemplateId] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');

  // 编辑任务
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editTaskPoints, setEditTaskPoints] = useState('');
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<DailyTask | null>(null);

  const parent = users.find(u => u.role === 'parent');
  const child = users.find(u => u.role === 'child');

  // 获取孩子积分
  const childPoints = child ? getChildPoints(child.id) : null;

  // 获取今日签字密码
  const signPassword = getSignPassword();

  // 获取孩子的当日任务
  const todayTasks = useMemo(() => {
    return getDailyTasksByDate(currentDate);
  }, [currentDate, dailyTasks]);
  
  // 按状态分组任务
  const pendingTasks = todayTasks.filter(t => t.status === 'pending');
  const submittedTasks = todayTasks.filter(t => t.status === 'submitted');
  const completedTasks = todayTasks.filter(t => t.status === 'completed');
  
  // 进度
  const progress = useMemo(() => {
    const completed = completedTasks.length;
    const pointsEarned = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const pendingPoints = [...pendingTasks, ...submittedTasks].reduce((sum, t) => sum + t.points, 0);
    return { completed, total: todayTasks.length, pointsEarned, totalPoints: pointsEarned + pendingPoints };
  }, [todayTasks, completedTasks, pendingTasks, submittedTasks]);

  useEffect(() => {
    generateSignPassword();
  }, []);

  // 解析剪切板文本
  const parseClipboardText = (text: string, isReward: boolean = false) => {
    const lines = text.split('\n').filter((line) => line.trim());
    const result: Array<{ name: string; points: number; type?: 'homework' | 'practice' | 'habit' }> = [];

    for (const line of lines) {
      const regex = /^(.+?)[\(\uff08](-?\d+)[\)\uff09](?:[\(\uff08]([^\)\uff09]+)[\)\uff09])?$/;
      const match = line.match(regex);
      
      if (match) {
        const name = match[1].trim();
        const points = parseInt(match[2]);
        const typeStr = match[3]?.trim() || '';
        
        if (name && !isNaN(points)) {
          if (isReward) {
            result.push({ name, points });
          } else {
            let type: 'homework' | 'practice' | 'habit' = 'habit';
            if (typeStr === '作业' || typeStr === 'homework') type = 'homework';
            else if (typeStr === '练习' || typeStr === 'practice') type = 'practice';
            result.push({ name, points, type });
          }
        }
      }
    }
    return result;
  };

  // 直接签字确认 - 不需要密码
  const handleDirectConfirmTask = (task: DailyTask) => {
    if (!child || !parent) return;
    
    // 更新任务状态为已完成
    updateDailyTaskStatus(task.id, 'completed', {
      confirmedAt: new Date().toISOString(),
      confirmedBy: parent.id,
    });
    
    // 积分入账
    earnPoints(child.id, task.points, task.id, `完成任务: ${task.name}`);
  };

  // 添加任务模板
  const handleAddTaskTemplate = () => {
    if (!family || !newTemplateName || !newTemplatePoints) return;
    
    addTaskTemplate({
      familyId: family.id,
      name: newTemplateName,
      type: newTemplateType,
      points: parseInt(newTemplatePoints),
      isCustom: true,
    });
    
    setNewTemplateName('');
    setNewTemplatePoints('');
    setShowAddTaskTemplate(false);
  };

  // 执行任务模板剪切板导入
  const handleTaskClipboardImport = () => {
    if (!family || taskImportPreview.length === 0) return;

    taskImportPreview.forEach((item) => {
      addTaskTemplate({
        familyId: family.id,
        name: item.name,
        type: item.type,
        points: item.points,
        isCustom: true,
      });
    });

    setShowTaskClipboardImport(false);
    setTaskClipboardText('');
    setTaskImportPreview([]);
  };

  // 添加奖惩模板
  const handleAddRewardTemplate = () => {
    if (!family || !newRewardTemplateName || !newRewardTemplatePoints) return;
    
    addRewardTemplate({
      familyId: family.id,
      name: newRewardTemplateName,
      points: parseInt(newRewardTemplatePoints),
      isCustom: true,
    });
    
    setNewRewardTemplateName('');
    setNewRewardTemplatePoints('');
    setShowAddRewardTemplate(false);
  };

  // 执行奖惩模板剪切板导入
  const handleRewardClipboardImport = () => {
    if (!family || rewardImportPreview.length === 0) return;

    rewardImportPreview.forEach((item) => {
      addRewardTemplate({
        familyId: family.id,
        name: item.name,
        points: item.points,
        isCustom: true,
      });
    });

    setShowRewardClipboardImport(false);
    setRewardClipboardText('');
    setRewardImportPreview([]);
  };

  // 初始化默认模板
  const handleInitDefaultTemplates = () => {
    if (!family) return;
    initDefaultTemplates(family.id);
  };

  // 添加奖励
  const handleAddReward = () => {
    if (!family || !newRewardName || !newRewardCost) return;
    
    addReward({
      familyId: family.id,
      name: newRewardName,
      cost: parseInt(newRewardCost),
      isActive: true,
    });
    
    setNewRewardName('');
    setNewRewardCost('');
    setShowAddReward(false);
  };

  // 发放额外奖惩
  const handleGiveBonus = () => {
    if (!child || !bonusTemplateId) return;
    
    const template = rewardTemplates.find(t => t.id === bonusTemplateId);
    if (!template) return;
    
    // 积分入账（正数为奖励，负数为惩罚）
    earnPoints(child.id, template.points, '', bonusDescription || template.name);
    
    setShowBonusModal(false);
    setBonusTemplateId('');
    setBonusDescription('');
    setBonusType('reward');
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    window.location.reload();
  };

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

  const tabs = [
    { key: 'today', label: '今日任务' },
    { key: 'sign', label: '签字密码' },
    { key: 'templates', label: '任务模板' },
    { key: 'rewards', label: '奖惩模板' },
    { key: 'config', label: '配置' },
  ];

  return (
    <Page showHeader={false} className="pb-20">
      {/* 顶部标题 */}
      <div className="px-4 py-3 bg-blue-500/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
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

      {/* Tabs */}
      <div className="bg-white sticky top-[52px] z-9 border-b">
        <div className="max-w-md mx-auto overflow-x-auto">
          <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-md mx-auto px-4 py-4">
        {/* 今日任务 */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* 日期选择 */}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={prevDay}>◀</Button>
              <div className="font-medium text-gray-700">{currentDate}</div>
              <Button size="sm" variant="ghost" onClick={nextDay}>▶</Button>
            </div>
            
            {/* 进度条 */}
            {todayTasks.length > 0 && (
              <TaskProgress 
                completed={progress.completed}
                total={progress.total}
                pointsEarned={progress.pointsEarned}
                totalPoints={progress.totalPoints}
              />
            )}

            {/* 发放额外奖惩按钮 */}
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => setShowBonusModal(true)}
            >
              🎁 发放额外奖惩
            </Button>

            {/* 待完成任务 */}
            {pendingTasks.length > 0 && (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="clock" size={18} />
                  待完成 ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color={task.points < 0 ? 'danger' : 'primary'}>{task.points}分</Badge>
                            <span className="text-sm text-gray-500">{task.timeSlotStart}-{task.timeSlotEnd}</span>
                          </div>
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
                            onClick={() => setDeleteConfirmTask(task)}
                            className="p-1.5 text-gray-500 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* 待签字确认 - 核心功能：直接点击确认，不需要密码 */}
            {submittedTasks.length > 0 && (
              <Card className="border-yellow-300 bg-yellow-50">
                <h3 className="font-medium text-yellow-700 mb-3 flex items-center gap-2">
                  <Icon name="lock" size={18} />
                  待签字确认 ({submittedTasks.length})
                </h3>
                <div className="space-y-2">
                  {submittedTasks.map(task => (
                    <div key={task.id} className="border border-yellow-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color="primary">+{task.points}分</Badge>
                            <Badge color="gray">待确认</Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 border-none"
                          onClick={() => handleDirectConfirmTask(task)}
                        >
                          ✓ 确认
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-yellow-600 text-sm mt-3 text-center">
                  点击"确认"即可完成签字，积分立即入账
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
                    <div key={task.id} className="border rounded-lg p-3 bg-green-50">
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
                            onClick={() => setDeleteConfirmTask(task)}
                            className="p-1.5 text-gray-500 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* 空状态 */}
            {todayTasks.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500">今天还没有任务</p>
                  <p className="text-gray-400 text-sm mt-1">等孩子添加任务后会显示在这里</p>
                </div>
              </Card>
            )}

            {/* 发放额外奖惩模态框 */}
            {showBonusModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-sm w-full p-4 max-h-[80vh] overflow-y-auto">
                  <h3 className="font-medium text-gray-700 mb-4 text-lg">🎁 发放额外奖惩</h3>
                  
                  {/* 类型选择 */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setBonusType('reward')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        bonusType === 'reward' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      奖励 +
                    </button>
                    <button
                      onClick={() => setBonusType('penalty')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        bonusType === 'penalty' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      惩罚 -
                    </button>
                  </div>
                  
                  {/* 奖惩模板列表 */}
                  <div className="space-y-2 mb-4">
                    {(bonusType === 'reward' 
                      ? rewardTemplates.filter(t => t.points > 0) 
                      : rewardTemplates.filter(t => t.points < 0)
                    ).map(template => (
                      <button
                        key={template.id}
                        onClick={() => setBonusTemplateId(template.id)}
                        className={`w-full border rounded-lg p-3 text-left transition-colors ${
                          bonusTemplateId === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{template.name}</div>
                        <div className={`font-bold ${template.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {template.points > 0 ? '+' : ''}{template.points}分
                        </div>
                      </button>
                    ))}
                    {rewardTemplates.length === 0 && (
                      <p className="text-gray-500 text-center py-4">请先在奖惩模板中添加模板</p>
                    )}
                  </div>
                  
                  {/* 描述 */}
                  <input
                    type="text"
                    value={bonusDescription}
                    onChange={(e) => setBonusDescription(e.target.value)}
                    placeholder="添加备注（可选）"
                    className="w-full px-3 py-2 border rounded-lg mb-4"
                  />
                  
                  {/* 按钮 */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={handleGiveBonus}
                      disabled={!bonusTemplateId}
                    >
                      确认发放
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => {
                        setShowBonusModal(false);
                        setBonusTemplateId('');
                        setBonusDescription('');
                        setBonusType('reward');
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 编辑任务弹窗 */}
            {editingTask && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-sm w-full p-4">
                  <h3 className="font-medium text-gray-700 mb-4">✏️ 修改任务积分</h3>
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
                          updateDailyTaskStatus(editingTask.id, editingTask.status, { points: newPoints });
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

            {/* 删除确认弹窗 */}
            {deleteConfirmTask && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-sm w-full p-4">
                  <h3 className="font-medium text-gray-700 mb-4">🗑️ 确认删除</h3>
                  <p className="text-gray-500 mb-4">
                    确定要删除任务 "{deleteConfirmTask.name}" 吗？
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="danger"
                      className="flex-1"
                      onClick={() => {
                        deleteDailyTask(deleteConfirmTask.id);
                        setDeleteConfirmTask(null);
                      }}
                    >
                      删除
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmTask(null)}>
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 签字密码 */}
        {activeTab === 'sign' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Icon name="lock" size={20} />
                今日签字密码
              </h3>
              
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-3xl font-mono px-6 py-3 bg-gray-100 rounded-lg">
                  {showSignPassword ? signPassword : '****'}
                </div>
                <button
                  onClick={() => setShowSignPassword(!showSignPassword)}
                  className="p-3 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
                >
                  {showSignPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              <p className="text-gray-500 text-sm text-center mb-4">
                此密码用于孩子端确认任务完成
              </p>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-700 mb-2">💡 签字密码说明</h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p>• 签字密码每天自动生成，4位随机字符</p>
                <p>• 在"今日任务"中可直接点击确认，不需要密码</p>
                <p>• 点击眼睛按钮可以显示/隐藏密码</p>
              </div>
            </Card>
          </div>
        )}

        {/* 任务模板 */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="calendar" size={20} />
                任务模板
              </h3>
              
              {taskTemplates.length > 0 ? (
                <div className="space-y-2">
                  {taskTemplates.map(template => (
                    <div key={template.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color={template.type === 'homework' ? 'blue' : template.type === 'practice' ? 'purple' : 'success'}>
                            {template.type === 'homework' ? '作业' : template.type === 'practice' ? '练习' : '习惯'}
                          </Badge>
                          <Badge color="primary">+{template.points}分</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="danger" onClick={() => deleteTaskTemplate(template.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">暂无任务模板</p>
                  <Button onClick={handleInitDefaultTemplates}>
                    导入默认模板
                  </Button>
                </div>
              )}
            </Card>

            {/* 添加任务模板 */}
            {showAddTaskTemplate ? (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">添加任务模板</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="任务名称"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">分值</label>
                      <input
                        type="number"
                        value={newTemplatePoints}
                        onChange={(e) => setNewTemplatePoints(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">类型</label>
                      <select
                        value={newTemplateType}
                        onChange={(e) => setNewTemplateType(e.target.value as 'homework' | 'practice' | 'habit')}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      >
                        <option value="homework">作业</option>
                        <option value="practice">练习</option>
                        <option value="habit">习惯</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTaskTemplate}>添加</Button>
                    <Button variant="secondary" onClick={() => setShowAddTaskTemplate(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowAddTaskTemplate(true)}>
                  + 添加任务模板
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowTaskClipboardImport(true)}>
                  📋 剪切板批量导入
                </Button>
              </div>
            )}

            {/* 任务模板剪切板导入 */}
            {showTaskClipboardImport && (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">📋 剪切板批量导入</h3>
                <p className="text-gray-500 text-sm mb-3">
                  格式：名称(分值)(类型)
                </p>
                <textarea
                  value={taskClipboardText}
                  onChange={(e) => {
                    setTaskClipboardText(e.target.value);
                    setTaskImportPreview(parseClipboardText(e.target.value, false));
                  }}
                  placeholder="完成作业(10)(作业)\n晨读(5)(习惯)\n课外阅读(8)(练习)"
                  className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
                />

                {taskImportPreview.length > 0 && (
                  <div className="mt-3">
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <p className="text-gray-500 text-sm mb-2">
                        预览（{taskImportPreview.length} 个任务）：
                      </p>
                      <div className="max-h-[200px] overflow-y-auto">
                        {taskImportPreview.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <span className="text-gray-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge color="primary">+{item.points}分</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleTaskClipboardImport} disabled={taskImportPreview.length === 0}>
                    导入 {taskImportPreview.length > 0 && `(${taskImportPreview.length}个)`}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowTaskClipboardImport(false)}>
                    取消
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 奖惩模板 */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="star" size={20} />
                奖惩模板
              </h3>
              
              {rewardTemplates.length > 0 ? (
                <div className="space-y-2">
                  {rewardTemplates.map(template => (
                    <div key={template.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <Badge color={template.points > 0 ? 'success' : 'danger'}>
                          {template.points > 0 ? `+${template.points}` : template.points}分
                        </Badge>
                      </div>
                      <Button size="sm" variant="danger" onClick={() => deleteRewardTemplate(template.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="star" size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">暂无奖惩模板</p>
                  <Button onClick={handleInitDefaultTemplates}>
                    导入默认模板
                  </Button>
                </div>
              )}
            </Card>

            {/* 添加奖惩模板 */}
            {showAddRewardTemplate ? (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">添加奖惩模板</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newRewardTemplateName}
                    onChange={(e) => setNewRewardTemplateName(e.target.value)}
                    placeholder="奖惩名称"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">分值</label>
                      <input
                        type="number"
                        value={newRewardTemplatePoints}
                        onChange={(e) => setNewRewardTemplatePoints(e.target.value)}
                        placeholder="10 或 -5"
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddRewardTemplate}>添加</Button>
                    <Button variant="secondary" onClick={() => setShowAddRewardTemplate(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowAddRewardTemplate(true)}>
                  + 添加奖惩模板
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowRewardClipboardImport(true)}>
                  📋 剪切板批量导入
                </Button>
              </div>
            )}

            {/* 奖惩模板剪切板导入 */}
            {showRewardClipboardImport && (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">📋 剪切板批量导入</h3>
                <p className="text-gray-500 text-sm mb-3">格式：名称(分值)</p>
                <textarea
                  value={rewardClipboardText}
                  onChange={(e) => {
                    setRewardClipboardText(e.target.value);
                    setRewardImportPreview(parseClipboardText(e.target.value, true));
                  }}
                  placeholder="考试进步(20)\n迟到(-5)"
                  className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
                />

                {rewardImportPreview.length > 0 && (
                  <div className="mt-3">
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <p className="text-gray-500 text-sm mb-2">
                        预览（{rewardImportPreview.length} 个）：
                      </p>
                      {rewardImportPreview.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="text-gray-700">{item.name}</span>
                          <Badge color={item.points > 0 ? 'success' : 'danger'}>
                            {item.points > 0 ? `+${item.points}` : item.points}分
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleRewardClipboardImport} disabled={rewardImportPreview.length === 0}>
                    导入
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRewardClipboardImport(false)}>
                    取消
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 配置 */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="settings" size={20} />
                积分配置
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-sm">积分上限</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={pointsConfig.pointsLimit}
                      onChange={(e) => setPointsConfig(prev => ({ ...prev, pointsLimit: parseInt(e.target.value) || 300 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-500">分</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-4" onClick={() => alert('配置已保存')}>
                保存配置
              </Button>
            </Card>

            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="team" size={20} />
                家庭信息
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">家庭名称</span>
                  <span className="font-medium">{family?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">家长</span>
                  <span className="font-medium">{parent?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">孩子</span>
                  <span className="font-medium">{child?.name}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}