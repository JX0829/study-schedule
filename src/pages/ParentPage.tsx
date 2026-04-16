/**
 * 家长端设置页面
 */

import { useState } from 'react';
import { Page, Card, Button, Badge, Tabs, Icon } from '@/components';
import { useFamilyStore, useTaskStore, useRewardStore, usePointsStore } from '@/store';
import { defaultSystemConfig, defaultRewards } from '@/utils/presets';
import type { TimeSlot, Reward, SystemConfig } from '@/types';

export function ParentPage() {
  const [activeTab, setActiveTab] = useState('family');
  
  // Store
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const timeSlots = useTaskStore(state => state.timeSlots);
  const addTimeSlot = useTaskStore(state => state.addTimeSlot);
  const updateTimeSlot = useTaskStore(state => state.updateTimeSlot);
  const deleteTimeSlot = useTaskStore(state => state.deleteTimeSlot);
  const rewards = useRewardStore(state => state.rewards);
  const addReward = useRewardStore(state => state.addReward);
  const updateReward = useRewardStore(state => state.updateReward);
  const deleteReward = useRewardStore(state => state.deleteReward);
  
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
  
  // 奖励编辑
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardStock, setNewRewardStock] = useState('');
  const [newRewardRule, setNewRewardRule] = useState('');

  const parent = users.find(u => u.role === 'parent');
  const child = users.find(u => u.role === 'child');

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
    setNewSlotName('');
    setNewSlotStart('');
    setNewSlotEnd('');
  };

  // 开始编辑时间段
  const startEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot.id);
    setNewSlotName(slot.name);
    setNewSlotStart(slot.startTime);
    setNewSlotEnd(slot.endTime);
  };

  // 添加奖励
  const handleAddReward = () => {
    if (!family || !newRewardName || !newRewardCost) return;
    
    addReward({
      familyId: family.id,
      name: newRewardName,
      cost: parseInt(newRewardCost),
      stock: newRewardStock ? parseInt(newRewardStock) : undefined,
      usageRule: newRewardRule || undefined,
      isActive: true,
    });
    
    setNewRewardName('');
    setNewRewardCost('');
    setNewRewardStock('');
    setNewRewardRule('');
    setShowAddReward(false);
  };

  // 初始化默认奖励
  const handleInitDefaultRewards = () => {
    if (!family) return;
    defaultRewards.forEach(reward => {
      addReward({
        familyId: family.id,
        name: reward.name,
        cost: reward.cost,
        stock: reward.stock,
        usageRule: reward.usageRule,
        isActive: true,
      });
    });
  };

  const tabs = [
    { key: 'family', label: '家庭信息' },
    { key: 'slots', label: '时间段' },
    { key: 'points', label: '积分配置' },
    { key: 'rewards', label: '奖励管理' },
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
              <div className="text-xs text-blue-100">设置管理中心</div>
            </div>
          </div>
          <div className="text-xs text-blue-100">
            孩子端: 192.168.31.115:3333
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-[52px] z-9">
        <div className="max-w-md mx-auto">
          <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-md mx-auto px-4 py-4">
        {/* 家庭信息 */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="home" size={20} />
                家庭信息
              </h3>
              
              {editingFamily ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-500 text-sm">家庭名称</label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditingFamily(false)}>
                      保存
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingFamily(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">家庭名称</span>
                    <span className="font-medium">{family?.name}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingFamily(true)}>
                    编辑
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="team" size={20} />
                成员信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color="blue">家长</Badge>
                    <span>{parent?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color="purple">孩子</Badge>
                    <span>{child?.name}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-700 mb-2">💡 使用提示</h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p>• 孩子端访问地址: http://192.168.31.115:3333</p>
                <p>• 孩子可以查看任务、申请完成、兑换奖励</p>
                <p>• 家长在此设置任务模板、时间段、奖励</p>
              </div>
            </Card>
          </div>
        )}

        {/* 时间段设置 */}
        {activeTab === 'slots' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="calendar" size={20} />
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
                          placeholder="时间段名称"
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
                          <Button size="sm" onClick={() => handleSaveSlot(slot.id)}>
                            保存
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingSlot(null)}>
                            取消
                          </Button>
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
                            <div className="text-sm text-gray-500">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEditSlot(slot)}>
                            编辑
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => deleteTimeSlot(slot.id)}>
                            删除
                          </Button>
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
                    placeholder="时间段名称（如：放学后）"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">开始时间</label>
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">结束时间</label>
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
                    <Button variant="secondary" onClick={() => setShowAddSlot(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button className="w-full" onClick={() => setShowAddSlot(true)}>
                + 添加时间段
              </Button>
            )}
          </div>
        )}

        {/* 积分配置 */}
        {activeTab === 'points' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="star" size={20} />
                积分配置
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-sm">积分上限（防止积分过多）</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={pointsConfig.pointsLimit}
                      onChange={(e) => setPointsConfig(prev => ({ ...prev, pointsLimit: parseInt(e.target.value) || 300 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-500">分</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">达到上限后需要兑换奖励才能继续获得积分</p>
                </div>

                <div>
                  <label className="text-gray-500 text-sm">任务确认超时时间</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={pointsConfig.confirmTimeout}
                      onChange={(e) => setPointsConfig(prev => ({ ...prev, confirmTimeout: parseInt(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-500">小时</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">超时后自动确认，积分入账</p>
                </div>

                <div>
                  <label className="text-gray-500 text-sm">兑换确认超时时间</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={pointsConfig.redemptionTimeout}
                      onChange={(e) => setPointsConfig(prev => ({ ...prev, redemptionTimeout: parseInt(e.target.value) || 24 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <span className="text-gray-500">小时</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">兑换申请超时后自动通过</p>
                </div>
              </div>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <h3 className="font-medium text-yellow-700 mb-2">💡 积分规则说明</h3>
              <div className="text-sm text-yellow-600 space-y-1">
                <p>• 完成任务获得积分，家长确认后入账</p>
                <p>• 积分上限防止孩子囤积过多积分</p>
                <p>• 兑换时积分先锁定，家长确认后扣除</p>
                <p>• 超时自动确认机制保持激励时效性</p>
              </div>
            </Card>

            <Button className="w-full" onClick={() => {
              // TODO: 保存配置到 store
              alert('配置已保存');
            }}>
              保存积分配置
            </Button>
          </div>
        )}

        {/* 奖励管理 */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Icon name="gift" size={20} />
                奖励列表
              </h3>
              
              {rewards.length > 0 ? (
                <div className="space-y-2">
                  {rewards.map(reward => (
                    <div key={reward.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color="primary">{reward.cost}分</Badge>
                          {reward.stock && (
                            <Badge color="gray">库存: {reward.stock}</Badge>
                          )}
                          {reward.usageRule && (
                            <span className="text-xs text-gray-400">{reward.usageRule}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => updateReward(reward.id, { isActive: !reward.isActive })}
                        >
                          {reward.isActive ? '启用' : '禁用'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => deleteReward(reward.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="gift" size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">暂无奖励</p>
                  <Button onClick={handleInitDefaultRewards}>
                    导入默认奖励模板
                  </Button>
                </div>
              )}
            </Card>

            {/* 添加奖励 */}
            {showAddReward ? (
              <Card>
                <h3 className="font-medium text-gray-700 mb-3">添加奖励</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                    placeholder="奖励名称（如：看动画片30分钟）"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">所需积分</label>
                      <input
                        type="number"
                        value={newRewardCost}
                        onChange={(e) => setNewRewardCost(e.target.value)}
                        placeholder="20"
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-gray-500 text-sm">库存（可选）</label>
                      <input
                        type="number"
                        value={newRewardStock}
                        onChange={(e) => setNewRewardStock(e.target.value)}
                        placeholder="无限"
                        className="w-full px-3 py-2 border rounded-lg mt-1"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newRewardRule}
                    onChange={(e) => setNewRewardRule(e.target.value)}
                    placeholder="使用规则（如：周末可用）"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddReward}>添加</Button>
                    <Button variant="secondary" onClick={() => setShowAddReward(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button className="w-full" onClick={() => setShowAddReward(true)}>
                + 添加奖励
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <a 
            href="http://192.168.31.115:3333"
            className="flex flex-col items-center text-primary-500"
          >
            <Icon name="home" size={24} />
            <span className="text-xs mt-1">孩子端</span>
          </a>
          <div className="flex flex-col items-center text-blue-500">
            <Icon name="settings" size={24} />
            <span className="text-xs mt-1">设置</span>
          </div>
        </div>
      </div>
    </Page>
  );
}