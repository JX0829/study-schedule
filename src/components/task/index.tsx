/**
 * 任务相关组件 - 科技宇宙 (Sci-Fi Cosmic) 风格
 */

import type { DailyTask, TaskType, TaskStatus, TimeSlot } from '@/types';
import { Badge, Button, Progress } from '@/components/ui';
import { taskStatusConfig } from '@/utils/presets';
import { 
  IconPlanetBook, 
  IconLaserTarget, 
  IconSatelliteOrbit,
  IconOrbitCheck,
  IconChronoThruster
} from '@/components/icons/CosmicIcons';

// 任务类型对应的宇宙星球图标
export function renderCosmicTaskIcon(type: TaskType, size = 20) {
  switch (type) {
    case 'homework':
      return <IconPlanetBook size={size} className="text-sky-400" />;
    case 'practice':
      return <IconLaserTarget size={size} className="text-cyan-400" />;
    case 'habit':
      return <IconSatelliteOrbit size={size} className="text-purple-400" />;
    default:
      return <IconPlanetBook size={size} className="text-sky-400" />;
  }
}

// ============ TaskItem 组件 ============

interface TaskItemProps {
  task: DailyTask;
  role: 'parent' | 'child';
  onSubmit?: () => void;
  onConfirm?: () => void;
  onView?: () => void;
}

export function TaskItem({ task, role, onSubmit, onConfirm, onView }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isPending = task.status === 'pending';
  const isSubmitted = task.status === 'submitted';
  
  const statusColors = {
    pending: 'blue',
    in_progress: 'blue',
    submitted: 'primary',
    completed: 'success',
    rejected: 'danger',
    expired: 'gray',
  } satisfies Record<TaskStatus, 'gray' | 'blue' | 'primary' | 'success' | 'danger'>;

  return (
    <div 
      className={`task-item ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
      onClick={onView}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* 科技星球图标 */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-sky-500/20 shrink-0">
          {renderCosmicTaskIcon(task.type, 22)}
        </div>
        
        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
            {isCompleted && <IconOrbitCheck size={16} className="text-emerald-400 shrink-0" />}
            <span>{task.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={statusColors[task.status]} size="sm">
              {taskStatusConfig[task.status].label}
            </Badge>
            <span className="text-xs font-orbitron text-slate-400 flex items-center gap-1">
              <IconChronoThruster size={12} className="text-sky-400" />
              {task.timeSlotStart} - {task.timeSlotEnd}
            </span>
          </div>
        </div>
      </div>
      
      {/* 分值和操作 */}
      <div className="flex items-center gap-2.5 shrink-0 ml-2">
        <span className="text-amber-300 font-orbitron font-bold text-base">+{task.points}</span>
        
        {/* 孩子端操作 */}
        {role === 'child' && isPending && onSubmit && (
          <Button size="sm" variant="primary" onClick={onSubmit}>
            申请完成
          </Button>
        )}
        
        {/* 家长端操作 */}
        {role === 'parent' && isSubmitted && (
          <div className="flex gap-1">
            {onConfirm && (
              <Button size="sm" variant="success" onClick={onConfirm}>
                确认入账
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
}

export function TaskList({ tasks, timeSlots, role, onSubmit, onConfirm }: TaskListProps) {
  const groupedTasks = timeSlots.map(slot => ({
    slot,
    tasks: tasks.filter(t => t.timeSlotId === slot.id),
  }));

  return (
    <div className="space-y-4">
      {groupedTasks.map(({ slot, tasks }) => (
        <div key={slot.id} className="space-y-2">
          <div className="text-xs font-orbitron font-bold text-cyan-400 px-1 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {slot.name} ({slot.startTime} - {slot.endTime})
          </div>
          <div className="space-y-2">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  role={role}
                  onSubmit={onSubmit ? () => onSubmit(task.id) : undefined}
                  onConfirm={onConfirm ? () => onConfirm(task.id) : undefined}
                />
              ))
            ) : (
              <div className="text-slate-400 text-xs py-3 px-4 rounded-xl cosmic-glass-subtle text-center">
                本航程时段暂无任务指令
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ TaskProgress 组件 (火箭推进充能槽) ============

interface TaskProgressProps {
  completed: number;
  total: number;
  pointsEarned: number;
  totalPoints: number;
}

export function TaskProgress({ completed, total, pointsEarned, totalPoints }: TaskProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="cosmic-glass p-4 sm:p-5 mb-5 space-y-3">
      <div className="flex items-center justify-between text-xs font-orbitron">
        <span className="text-white font-bold tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]"></span>
          航行任务推进度
        </span>
        <span className="text-cyan-300 font-bold text-sm">
          {completed} / {total} 项 ({percentage}%)
        </span>
      </div>

      <Progress value={completed} max={total || 1} color="primary" size="md" />

      <div className="flex justify-between items-center text-xs pt-1 border-t border-sky-500/15">
        <span className="text-slate-300">今日已充能星能</span>
        <span className="font-orbitron font-bold text-amber-300">
          ⚡ {pointsEarned} <span className="text-slate-400 font-normal">/ {totalPoints} 目标</span>
        </span>
      </div>
    </div>
  );
}
