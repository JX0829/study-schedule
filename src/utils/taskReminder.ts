/**
 * 任务开始提醒服务
 * 
 * 定时检查即将开始的任务，提前5分钟推送提醒
 */

import { pushService } from './push';
import { useTaskStore } from '@/store';
import { getToday } from './date';

// 提前提醒时间（分钟）
const REMINDER_MINUTES = 5;

// 已提醒的任务ID缓存（避免重复提醒）
const remindedTasks = new Set<string>();

// 定时器ID
let reminderIntervalId: number | null = null;

/**
 * 检查即将开始的任务并发送提醒
 */
function checkUpcomingTasks(): void {
  const config = pushService.getConfig();
  if (!config.enabled || !pushService.hasActiveChannels() || !config.scenarios.taskStartReminder) {
    return;
  }

  const today = getToday();
  const tasks = useTaskStore.getState().getDailyTasksByDate(today);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const task of tasks) {
    // 只检查待执行的任务
    if (task.status !== 'pending') continue;
    
    // 已提醒过的跳过
    if (remindedTasks.has(task.id)) continue;

    // 解析任务开始时间
    const [startHour, startMinute] = task.timeSlotStart.split(':').map(Number);
    const taskStartMinutes = startHour * 60 + startMinute;

    // 计算时间差
    const minutesUntilStart = taskStartMinutes - currentMinutes;

    // 如果在提醒时间范围内（提前5分钟 ± 1分钟容差）
    if (minutesUntilStart >= REMINDER_MINUTES - 1 && minutesUntilStart <= REMINDER_MINUTES + 1) {
      const timeSlot = `${task.timeSlotStart}-${task.timeSlotEnd}`;
      pushService.notifyTaskStartReminder(task.name, timeSlot);
      remindedTasks.add(task.id);
      console.log(`[TaskReminder] 提醒任务: ${task.name} 将在 ${timeSlot} 开始`);
    }
  }
}

/**
 * 启动任务提醒服务
 * 
 * 每分钟检查一次即将开始的任务
 */
export function startTaskReminder(): void {
  if (reminderIntervalId !== null) {
    console.log('[TaskReminder] 服务已在运行');
    return;
  }

  console.log('[TaskReminder] 启动任务提醒服务');

  // 立即检查一次
  checkUpcomingTasks();

  // 每分钟检查一次
  reminderIntervalId = window.setInterval(checkUpcomingTasks, 60 * 1000);
}

/**
 * 停止任务提醒服务
 */
export function stopTaskReminder(): void {
  if (reminderIntervalId !== null) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
    console.log('[TaskReminder] 停止任务提醒服务');
  }
}

/**
 * 清空已提醒缓存（每天凌晨重置）
 */
export function clearRemindedCache(): void {
  remindedTasks.clear();
  console.log('[TaskReminder] 清空提醒缓存');
}

/**
 * 获取下一个即将提醒的任务
 */
export function getNextUpcomingTask(): { name: string; timeSlot: string; minutesUntil: number } | null {
  const config = pushService.getConfig();
  if (!config.enabled || !pushService.hasActiveChannels() || !config.scenarios.taskStartReminder) {
    return null;
  }

  const today = getToday();
  const tasks = useTaskStore.getState().getDailyTasksByDate(today);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nextTask: { name: string; timeSlot: string; minutesUntil: number } | null = null;
  let minMinutesUntil = Infinity;

  for (const task of tasks) {
    if (task.status !== 'pending') continue;
    if (remindedTasks.has(task.id)) continue;

    const [startHour, startMinute] = task.timeSlotStart.split(':').map(Number);
    const taskStartMinutes = startHour * 60 + startMinute;
    const minutesUntilStart = taskStartMinutes - currentMinutes;

    // 只考虑未来5-60分钟内的任务
    if (minutesUntilStart > 0 && minutesUntilStart < minMinutesUntil) {
      minMinutesUntil = minutesUntilStart;
      nextTask = {
        name: task.name,
        timeSlot: `${task.timeSlotStart}-${task.timeSlotEnd}`,
        minutesUntil: minutesUntilStart,
      };
    }
  }

  return nextTask;
}

/**
 * 自动在每天凌晨清空提醒缓存
 */
function scheduleDailyReset(): void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 5, 0, 0); // 凌晨00:05重置

  const msUntilReset = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    clearRemindedCache();
    scheduleDailyReset(); // 递归调度下一天的重置
  }, msUntilReset);
}

// 自动启动
scheduleDailyReset();