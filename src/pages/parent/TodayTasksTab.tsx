import { useState } from 'react';
import { Card, Button, Badge, Icon, TaskProgress } from '@/components';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { formatDate } from '@/utils/date';
import type { DailyTask } from '@/types';

interface RewardTemplateItem {
  id: string;
  name: string;
  points: number;
}

interface TodayTasksTabProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  progress: { completed: number; total: number; pointsEarned: number; totalPoints: number };
  pendingTasks: DailyTask[];
  submittedTasks: DailyTask[];
  completedTasks: DailyTask[];
  rewardTemplates: RewardTemplateItem[];
  onDirectConfirmTask: (task: DailyTask) => void;
  onEditTaskSave: (taskId: string, newPoints: number) => void;
  onDeleteTask: (taskId: string) => void;
  onGiveBonus: (templateId: string, description: string) => void;
}

export function TodayTasksTab({
  currentDate,
  onDateChange,
  progress,
  pendingTasks,
  submittedTasks,
  completedTasks,
  rewardTemplates,
  onDirectConfirmTask,
  onEditTaskSave,
  onDeleteTask,
  onGiveBonus,
}: TodayTasksTabProps) {
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<DailyTask | null>(null);

  // Bonus modal
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusType, setBonusType] = useState<'reward' | 'penalty'>('reward');
  const [bonusTemplateId, setBonusTemplateId] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(formatDate(prev));
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    onDateChange(formatDate(next));
  };

  const handleEditTaskSave = (taskId: string, newPoints: number) => {
    onEditTaskSave(taskId, newPoints);
    setEditingTask(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmTask) {
      onDeleteTask(deleteConfirmTask.id);
      setDeleteConfirmTask(null);
    }
  };

  const handleGiveBonus = () => {
    if (bonusTemplateId) {
      onGiveBonus(bonusTemplateId, bonusDescription);
      setShowBonusModal(false);
      setBonusTemplateId('');
      setBonusDescription('');
      setBonusType('reward');
    }
  };

  const filteredTemplates = bonusType === 'reward'
    ? rewardTemplates.filter(t => t.points > 0)
    : rewardTemplates.filter(t => t.points < 0);

  // Task item edit/delete actions
  const renderTaskActions = (task: DailyTask) => (
    <div className="flex gap-1">
      <button
        onClick={() => setEditingTask(task)}
        className="p-1.5 text-slate-400 hover:text-white"
      >
        ✏️
      </button>
      <button
        onClick={() => setDeleteConfirmTask(task)}
        className="p-1.5 text-slate-400 hover:text-red-600"
      >
        🗑️
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={prevDay}>◀</Button>
        <div className="font-medium text-white">{currentDate}</div>
        <Button size="sm" variant="ghost" onClick={nextDay}>▶</Button>
      </div>

      {/* Progress */}
      {progress.total > 0 && (
        <TaskProgress
          completed={progress.completed}
          total={progress.total}
          pointsEarned={progress.pointsEarned}
          totalPoints={progress.totalPoints}
        />
      )}

      {/* Bonus button */}
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => setShowBonusModal(true)}
      >
        🎁 发放额外奖惩
      </Button>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <Card>
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
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
                    <div className="font-medium text-white font-semibold">{task.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={task.points < 0 ? 'danger' : 'primary'}>{task.points}分</Badge>
                      <span className="text-sm text-slate-400">{task.timeSlotStart}-{task.timeSlotEnd}</span>
                    </div>
                  </div>
                  {renderTaskActions(task)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Submitted tasks - sign directly */}
      {submittedTasks.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <h3 className="font-medium text-yellow-700 mb-3 flex items-center gap-2">
            <Icon name="lock" size={18} />
            待签字确认 ({submittedTasks.length})
          </h3>
          <div className="space-y-2">
            {submittedTasks.map(task => (
              <div key={task.id} className="border border-yellow-200 rounded-lg p-3 cosmic-glass text-white">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {task.type === 'homework' ? '📝' : task.type === 'practice' ? '🎨' : '✨'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-white font-semibold">{task.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color="primary">+{task.points}分</Badge>
                      <Badge color="gray">待确认</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 border-none"
                    onClick={() => onDirectConfirmTask(task)}
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

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Icon name="check" size={18} />
            已完成 ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div key={task.id} className="border border-emerald-500/30 rounded-lg p-3 bg-emerald-950/40 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div className="flex-1">
                    <div className="font-medium text-white font-semibold">{task.name}</div>
                    <Badge color={task.points < 0 ? 'danger' : 'success'}>{task.points}分</Badge>
                  </div>
                  {renderTaskActions(task)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {pendingTasks.length === 0 && submittedTasks.length === 0 && completedTasks.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
            <p className="text-slate-400">今天还没有任务</p>
            <p className="text-slate-400 text-sm mt-1">等孩子添加任务后会显示在这里</p>
          </div>
        </Card>
      )}

      {/* Bonus modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cosmic-glass text-white rounded-lg max-w-sm w-full p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-medium text-white mb-4 text-lg">🎁 发放额外奖惩</h3>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBonusType('reward')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  bonusType === 'reward'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                奖励 +
              </button>
              <button
                onClick={() => setBonusType('penalty')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  bonusType === 'penalty'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                惩罚 -
              </button>
            </div>

            {/* Template list */}
            <div className="space-y-2 mb-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setBonusTemplateId(template.id)}
                  className={`w-full border rounded-lg p-3 text-left transition-colors ${
                    bonusTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-sky-500/20 hover:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400'
                  }`}
                >
                  <div className="font-medium text-white font-semibold">{template.name}</div>
                  <div className={`font-bold ${template.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {template.points > 0 ? '+' : ''}{template.points}分
                  </div>
                </button>
              ))}
              {rewardTemplates.length === 0 && (
                <p className="text-slate-400 text-center py-4">请先在奖惩模板中添加模板</p>
              )}
            </div>

            {/* Description */}
            <input
              type="text"
              value={bonusDescription}
              onChange={(e) => setBonusDescription(e.target.value)}
              placeholder="添加备注（可选）"
              className="w-full px-3 py-2 border rounded-lg mb-4 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
            />

            {/* Buttons */}
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

      {/* Edit task modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleEditTaskSave}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteConfirmTask && (
        <DeleteConfirmModal
          taskName={deleteConfirmTask.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteConfirmTask(null)}
        />
      )}
    </div>
  );
}
