/**
 * ID 生成器
 * 
 * 生成唯一 ID，用于实体标识
 * 使用时间戳 + 随机字符串的组合
 */

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * 格式化日期
 */

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(time: string): string {
  // HH:mm 格式，直接返回
  return time;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * 获取今天的日期字符串
 */

export function getToday(): string {
  return formatDate(new Date());
}

/**
 * 获取当前时间（HH:mm）
 */

export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 检查时间是否在时间段内
 */

export function isTimeInSlot(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time <= endTime;
}

/**
 * 根据当前时间找到对应时间段
 */

export function findCurrentTimeSlot(timeSlots: Array<{ id: string; startTime: string; endTime: string }>): string | null {
  const currentTime = getCurrentTime();
  const slot = timeSlots.find(s => isTimeInSlot(currentTime, s.startTime, s.endTime));
  return slot?.id || null;
}

/**
 * 获取星期几的中文名称
 */

export function getWeekDayName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[d.getDay()];
}

/**
 * 计算两个日期之间的天数
 */

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 获取本周的开始和结束日期
 */

export function getWeekRange(date: Date | string = new Date()): { start: string; end: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDate(start), end: formatDate(end) };
}