/**
 * 任务相关组件
 */

import type { DailyTask, TaskType, TaskStatus, TimeSlot } from '@/types';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { taskTypeConfig, taskStatusConfig } from '@/utils/presets';

// ============ TaskItem 组件 ============

interface TaskItemProps {
  task: DailyTask;
  role: 'parent' | 'child';
  onSubmit?: () => void;
  onConfirm?: () => void;
  onReject?: (reason: string) => void;
  onView?: () => void;
}

export function TaskItem({ task, role, onSubmit, onConfirm, onReject, onView }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isPending = task.status === 'pending';
  const isSubmitted = task.status === 'submitted';
  
  const statusColors: Record<TaskStatus, string> = {
    pending: 'gray',
    in_progress: 'blue',
    submitted: 'primary',
    completed: 'success',
    rejected: 'danger',
    expired: 'gray',
  };

  return (
    <div 
      className={`task-item ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
      onClick={onView}
    >
      <div className="flex items-center gap-3">
        {/* 任务图标 */}
        <span className="text-xl">{taskTypeConfig[task.type].icon}</span>
        
        {/* 任务信息 */}
        <div className="flex-1">
          <div className="font-medium text-gray-800">
            {isCompleted && <span className="mr-1">✅</span>}
            {task.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={statusColors[task.status]} size="sm">
              {taskStatusConfig[task.status].label}
            </Badge>
            <span className="text-sm text-gray-500">
              {task.timeSlotStart} - {task.timeSlotEnd}
            </span>
          </div>
        </div>
      </div>
      
      {/* 分值和操作 */}
      <div className="flex items-center gap-2">
        <span className="text-primary-600 font-bold">+{task.points}</span>
        
        {/* 孩子端操作 */}
        {role === 'child' && isPending && onSubmit && (
          <Button size="sm" onClick={onSubmit}>
            申请完成
          </Button>
        )}
        
        {/* 家长端操作 */}
        {role === 'parent' && isSubmitted && (
          <div className="flex gap-1">
            {onConfirm && (
              <Button size="sm" variant="success" onClick={onConfirm}>
                确认
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ TaskList 组件 ============

interface TaskListProps {
  tasks: DailyTask[];
  timeSlots: TimeSlot[];
  role: 'parent' | 'child';
  onSubmit?: (taskId: string) => void;
  onConfirm?: (taskId: string) => void;
  onReject?: (taskId: string, reason: string) => void;
}

export function TaskList({ tasks, timeSlots, role, onSubmit, onConfirm, onReject }: TaskListProps) {
  // 按时间段分组
  const groupedTasks = timeSlots.map(slot => ({
    slot,
    tasks: tasks.filter(t => t.timeSlotId === slot.id),
  }));

  return (
    <div className="space-y-4">
      {groupedTasks.map(group => (
        <div key={group.slot.id}>
          {/* 时间段标题 */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xl">
              {group.slot.startTime.startsWith('06') || group.slot.startTime.startsWith('07') ? '☀️' :
               group.slot.startTime.startsWith('12') || group.slot.startTime.startsWith('13') ? '🌤️' : '🌙'}
            </span>
            <span className="font-medium text-gray-700">{group.slot.name}</span>
            <span className="text-sm text-gray-400">
              ({group.slot.startTime} - {group.slot.endTime})
            </span>
          </div>
          
          {/* 任务列表 */}
          {group.tasks.length > 0 ? (
            <div className="space-y-2">
              {group.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  role={role}
                  onSubmit={() => onSubmit?.(task.id)}
                  onConfirm={() => onConfirm?.(task.id)}
                  onReject={(reason) => onReject?.(task.id, reason)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              暂无任务
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ TaskProgress 组件 ============

interface TaskProgressProps {
  completed: number;
  total: number;
  pointsEarned: number;
  totalPoints: number;
}

export function TaskProgress({ completed, total, pointsEarned, totalPoints }: TaskProgressProps) {
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-gray-600">今日进度</span>
          <span className="ml-2 font-bold text-primary-600">{completed}/{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-primary-500">⭐</span>
          <span className="font-bold text-primary-600">{pointsEarned}/{totalPoints}</span>
        </div>
      </div>
      <Progress value={completed} max={total} showLabel />
    </Card>
  );
}

// ============ TaskTypeBadge 组件 ============

interface TaskTypeBadgeProps {
  type: TaskType;
}

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const config = taskTypeConfig[type];
  const colors: Record<TaskType, string> = {
    homework: 'blue',
    practice: 'purple',
    habit: 'success',
  };
  
  return (
    <Badge color={colors[type]}>
      {config.icon} {config.label}
    </Badge>
  );
}