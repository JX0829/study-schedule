/**
 * 家长端设置页面 - 增强版
 */

import { useState, useEffect } from 'react';
import { Page, Card, Button, Badge, Tabs, Icon } from '@/components';
import { useFamilyStore, useTaskStore, useRewardStore, usePasswordStore, useTemplateStore } from '@/store';
import { defaultSystemConfig } from '@/utils/presets';
import type { TimeSlot, SystemConfig } from '@/types';
import type { TaskTemplateItem, RewardTemplateItem } from '@/store/template';

export function ParentPage() {
  const [activeTab, setActiveTab] = useState('sign');
  const [showSignPassword, setShowSignPassword] = useState(false);
  
  // Store
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const timeSlots = useTaskStore(state => state.timeSlots);
  const addTimeSlot = useTaskStore(state => state.addTimeSlot);
  const updateTimeSlot = useTaskStore(state => state.updateTimeSlot);
  const deleteTimeSlot = useTaskStore(state => state.deleteTimeSlot);
  const rewards = useRewardStore(state => state.rewards);
  const addReward = useRewardStore(state => state.addReward);
  const deleteReward = useRewardStore(state => state.deleteReward);
  const getSignPassword = usePasswordStore(state => state.getSignPassword);
  const generateSignPassword = usePasswordStore(state => state.generateSignPassword);
  const logout = usePasswordStore(state => state.logout);
  
  const taskTemplates = useTemplateStore(state => state.taskTemplates);
  const addTaskTemplate = useTemplateStore(state => state.addTaskTemplate);
  const updateTaskTemplate = useTemplateStore(state => state.updateTaskTemplate);
  const deleteTaskTemplate = useTemplateStore(state => state.deleteTaskTemplate);
  const rewardTemplates = useTemplateStore(state => state.rewardTemplates);
  const addRewardTemplate = useTemplateStore(state => state.addRewardTemplate);
  const updateRewardTemplate = useTemplateStore(state => state.updateRewardTemplate);
  const deleteRewardTemplate = useTemplateStore(state => state.deleteRewardTemplate);
  const initDefaultTemplates = useTemplateStore(state => state.initDefaultTemplates);
  
  // 家庭信息编辑
  const [editingFamily, setEditingFamily] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name || '');
  
  // 时间段编辑
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  
  // 积分配置
  const [pointsConfig, setPointsConfig] = useState<SystemConfig>(defaultSystemConfig);
  
  // 任务模板编辑
  const [showAddTaskTemplate, setShowAddTaskTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePoints, setNewTemplatePoints] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'homework' | 'practice' | 'habit'>('habit');
  
  // 奖惩模板编辑
  const [showAddRewardTemplate, setShowAddRewardTemplate] = useState(false);
  const [newRewardTemplateName, setNewRewardTemplateName] = useState('');
  const [newRewardTemplatePoints, setNewRewardTemplatePoints] = useState('');
  
  // 奖励编辑
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');

  const parent = users.find(u => u.role === 'parent');
  const child = users.find(u => u.role === 'child');

  // 获取今日签字密码
  const signPassword = getSignPassword();

  useEffect(() => {
    generateSignPassword();
  }, []);

  // 添加时间段
  const handleAddSlot = () => {
    if (!family || !newSlotName || !newSlotStart || !newSlotEnd) return;
    
    addTimeSlot({
      familyId: family.id,
      name: newSlotName,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      order: timeSlots.length + 1,
    });
    
    setNewSlotName('');
    setNewSlotStart('');
    setNewSlotEnd('');
    setShowAddSlot(false);
  };

  // 保存时间段编辑
  const handleSaveSlot = (slotId: string) => {
    if (newSlotName && newSlotStart && newSlotEnd) {
      updateTimeSlot(slotId, {
        name: newSlotName,
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
    }
    setEditingSlot(null);
  };

  // 开始编辑时间段
  const startEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot.id);
    setNewSlotName(slot.name);
    setNewSlotStart(slot.startTime);
    setNewSlotEnd(slot.endTime);
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

  // 退出登录
  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const tabs = [
    { key: 'sign', label: '签字密码' },
    { key: 'templates', label: '任务模板' },
    { key: 'rewards', label: '奖惩模板' },
    { key: 'slots', label: '时间段' },
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
          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-white">
            退出
          </Button>
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
                此密码用于确认孩子任务完成，每日随机生成
              </p>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-700 mb-2">💡 签字密码说明</h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p>• 签字密码每天自动生成，4位随机字符</p>
                <p>• 孩子完成任务后需要家长签字确认</p>
                <p>• 输入正确签字密码后积分才能入账</p>
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
              <Button className="w-full" onClick={() => setShowAddTaskTemplate(true)}>
                + 添加任务模板
              </Button>
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
                    placeholder="奖惩名称（如：考试进步）"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">分值（正数奖励，负数惩罚）</label>
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
              <Button className="w-full" onClick={() => setShowAddRewardTemplate(true)}>
                + 添加奖惩模板
              </Button>
            )}
          </div>
        )}

        {/* 时间段设置 */}
        {activeTab === 'slots' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="clock" size={20} />
                时间段配置
              </h3>
              
              <div className="space-y-3">
                {timeSlots.map(slot => (
                  <div key={slot.id} className="border rounded-lg p-3">
                    {editingSlot === slot.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newSlotName}
                          onChange={(e) => setNewSlotName(e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={newSlotStart}
                            onChange={(e) => setNewSlotStart(e.target.value)}
                            className="px-2 py-1 border rounded"
                          />
                          <input
                            type="time"
                            value={newSlotEnd}
                            onChange={(e) => setNewSlotEnd(e.target.value)}
                            className="px-2 py-1 border rounded"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveSlot(slot.id)}>保存</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingSlot(null)}>取消</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {slot.startTime.startsWith('06') || slot.startTime.startsWith('07') ? '☀️' :
                             slot.startTime.startsWith('12') ? '🌤️' : '🌙'}
                          </span>
                          <div>
                            <div className="font-medium">{slot.name}</div>
                            <div className="text-sm text-gray-500">{slot.startTime} - {slot.endTime}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEditSlot(slot)}>编辑</Button>
                          <Button size="sm" variant="danger" onClick={() => deleteTimeSlot(slot.id)}>删除</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* 添加时间段 */}
            {showAddSlot ? (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">添加时间段</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value)}
                    placeholder="时间段名称"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">开始</label>
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">结束</label>
                      <input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddSlot}>添加</Button>
                    <Button variant="secondary" onClick={() => setShowAddSlot(false)}>取消</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button className="w-full" onClick={() => setShowAddSlot(true)}>+ 添加时间段</Button>
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

                <div>
                  <label className="text-gray-500 text-sm">确认超时</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={pointsConfig.confirmTimeout}
                      onChange={(e) => setPointsConfig(prev => ({ ...prev, confirmTimeout: parseInt(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-500">小时</span>
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