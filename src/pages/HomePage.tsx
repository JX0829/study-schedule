/**
 * 首页 - 当日任务规划
 */

import { useState, useMemo } from 'react';
import { Page, Card, Button, TaskList, TaskProgress, DateHeader, TabBar, Badge, PointsBadge, Icon } from '@/components';
import { useTaskStore, usePointsStore, useFamilyStore } from '@/store';
import { getToday, formatDate } from '@/utils/date';
import { presetTemplates, defaultRewards } from '@/utils/presets';
import type { DailyTask } from '@/types';

export function HomePage() {
  const [currentDate, setCurrentDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState('tasks');
  
  const family = useFamilyStore(state => state.family);
  const users = useFamilyStore(state => state.users);
  const currentUser = useFamilyStore(state => state.currentUser);
  const templates = useTaskStore(state => state.templates);
  const timeSlots = useTaskStore(state => state.timeSlots);
  const dailyTasks = useTaskStore(state => state.dailyTasks);
  const getDailyTasksByDate = useTaskStore(state => state.getDailyTasksByDate);
  const addDailyTask = useTaskStore(state => state.addDailyTask);
  const submitTask = useTaskStore(state => state.submitTask);
  const confirmTask = useTaskStore(state => state.confirmTask);
  const copyYesterdayTasks = useTaskStore(state => state.copyYesterdayTasks);
  const getChildPoints = usePointsStore(state => state.getChildPoints);
  
  // 获取孩子用户
  const child = users.find(u => u.role === 'child');
  const parent = users.find(u => u.role === 'parent');
  
  // 获取当日任务
  const todayTasks = useMemo(() => {
    return getDailyTasksByDate(currentDate);
  }, [currentDate, dailyTasks]);
  
  // 计算进度
  const progress = useMemo(() => {
    const completed = todayTasks.filter(t => t.status === 'completed').length;
    const pointsEarned = todayTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.points, 0);
    const totalPoints = todayTasks.reduce((sum, t) => sum + t.points, 0);
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
  
  // 快速添加任务（从预设）
  const handleQuickAddTask = (preset: typeof presetTemplates[0], slotId: string) => {
    if (!family || !child) return;
    
    const slot = timeSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    addDailyTask({
      familyId: family.id,
      childId: child.id,
      date: currentDate,
      name: preset.name,
      type: preset.type,
      points: preset.defaultPoints,
      timeSlotId: slotId,
      timeSlotStart: slot.startTime,
      timeSlotEnd: slot.endTime,
      status: 'pending',
    });
  };
  
  // 复制昨日任务
  const handleCopyYesterday = () => {
    if (!child) return;
    copyYesterdayTasks(currentDate, child.id);
  };
  
  // 提交任务
  const handleSubmitTask = (taskId: string) => {
    submitTask(taskId);
  };
  
  // 确认任务
  const handleConfirmTask = (taskId: string) => {
    if (!parent) return;
    confirmTask(taskId, parent.id);
  };

  // TabBar 配置
  const tabBarItems = [
    { key: 'tasks', label: '任务', icon: 'calendar' },
    { key: 'points', label: '积分', icon: 'star' },
    { key: 'rewards', label: '奖励', icon: 'gift' },
    { key: 'settings', label: '设置', icon: 'settings' },
  ];

  return (
    <Page showHeader={false} className="pb-16">
      {/* 顶部信息 */}
      <div className="px-4 py-3 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <div>
              <div className="font-medium text-gray-800">
                {currentUser?.role === 'child' ? child?.name : parent?.name}
              </div>
              <div className="text-xs text-gray-500">
                {currentUser?.role === 'child' ? '孩子模式' : '家长模式'}
              </div>
            </div>
          </div>
          {childPoints && currentUser?.role === 'child' && (
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
          
          {/* 操作按钮 */}
          {currentUser?.role === 'parent' && (
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="secondary" onClick={handleCopyYesterday}>
                复制昨日
              </Button>
              <Button size="sm" variant="ghost">
                + 添加任务
              </Button>
            </div>
          )}
          
          {/* 任务列表 */}
          {timeSlots.length > 0 ? (
            <TaskList
              tasks={todayTasks}
              timeSlots={timeSlots}
              role={currentUser?.role || 'child'}
              onSubmit={handleSubmitTask}
              onConfirm={handleConfirmTask}
            />
          ) : (
            <Card>
              <div className="text-center text-gray-400 py-8">
                暂无时间段配置，请先在设置中配置
              </div>
            </Card>
          )}
          
          {/* 空状态 */}
          {todayTasks.length === 0 && currentUser?.role === 'parent' && (
            <Card>
              <div className="text-center py-8">
                <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">今日还没有安排任务</p>
                <p className="text-gray-400 text-sm mb-4">从预设模板快速添加吧</p>
                
                {/* 预设模板快捷添加 */}
                <div className="grid grid-cols-2 gap-2">
                  {presetTemplates.slice(0, 6).map(preset => (
                    <Button 
                      key={preset.id}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => handleQuickAddTask(preset, timeSlots[0]?.id || '')}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
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
                      <span className="text-gray-400 ml-2">
                        ({childPoints.locked} 已锁定)
                      </span>
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
          
          <Card>
            <h3 className="font-medium text-gray-700 mb-3">积分明细</h3>
            {childPoints && child ? (
              <div className="space-y-2 text-sm">
                {/* 这里可以显示积分记录 */}
                <div className="text-gray-400 text-center py-4">
                  完成任务获得积分吧！
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-4">
                暂无记录
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 奖励内容 */}
      {activeTab === 'rewards' && (
        <div className="max-w-md mx-auto px-4 py-4">
          <h3 className="font-medium text-gray-700 mb-3">可兑换奖励</h3>
          
          <div className="space-y-2">
            {defaultRewards.map((reward, idx) => (
              <Card key={idx} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{reward.name}</div>
                    {reward.usageRule && (
                      <div className="text-xs text-gray-400 mt-1">{reward.usageRule}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="primary">{reward.cost}分</Badge>
                    {childPoints && childPoints.balance >= reward.cost && (
                      <Button size="sm">兑换</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {currentUser?.role === 'parent' && (
            <Button className="w-full mt-4" variant="ghost">
              + 添加奖励
            </Button>
          )}
        </div>
      )}

      {/* 设置内容 */}
      {activeTab === 'settings' && (
        <div className="max-w-md mx-auto px-4 py-4">
          <Card className="mb-4">
            <h3 className="font-medium text-gray-700 mb-3">家庭信息</h3>
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
          
          <Card className="mb-4">
            <h3 className="font-medium text-gray-700 mb-3">时间段设置</h3>
            {timeSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {slot.startTime.startsWith('06') || slot.startTime.startsWith('07') ? '☀️' :
                     slot.startTime.startsWith('12') ? '🌤️' : '🌙'}
                  </span>
                  <span>{slot.name}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            ))}
          </Card>
          
          <Card>
            <h3 className="font-medium text-gray-700 mb-3">积分配置</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">积分上限</span>
                <span className="font-medium">300 分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">确认超时</span>
                <span className="font-medium">2 小时</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">兑换超时</span>
                <span className="font-medium">24 小时</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 底部 TabBar */}
      <TabBar 
        items={tabBarItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </Page>
  );
}