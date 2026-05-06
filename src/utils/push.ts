/**
 * PushMe 推送服务
 * 
 * 文档: https://push.i-i.me/docs
 * 
 * 接口地址: https://push.i-i.me
 * 请求方式: GET 或 POST
 * 
 * 注意: 浏览器无法直接调用 PushMe API (CORS 限制)
 * 需要通过代理服务器转发请求
 */

import { create } from 'zustand';
import { storage, STORAGE_KEYS } from './storage';

// ============ 推送配置类型 ============

export interface PushConfig {
  /** PushMe 推送密钥 */
  pushKey: string;
  /** 是否启用推送 */
  enabled: boolean;
  /** 推送场景配置 */
  scenarios: PushScenarios;
  /** 代理服务器地址 */
  proxyUrl: string;
}

export interface PushScenarios {
  newTask: boolean;
  taskSubmitted: boolean;
  taskConfirmed: boolean;
  taskRejected: boolean;
  redemptionRequested: boolean;
  redemptionConfirmed: boolean;
  redemptionRejected: boolean;
  pointsChanged: boolean;
  taskStartReminder: boolean; // 任务开始提醒（提前5分钟）
  extraReward: boolean; // 额外奖励
  extraPenalty: boolean; // 额外惩罚
}

export type PushMessageType = 'text' | 'markdown' | 'html' | 'data' | 'markdata' | 'chart' | 'echarts';
export type PushTheme = 'info' | 'success' | 'warning' | 'failure';

export interface PushMessage {
  title: string;
  content: string;
  type?: PushMessageType;
  theme?: PushTheme;
  group?: string;
  avatar?: string;
  date?: string;
}

// ============ 默认配置 ============

const DEFAULT_PUSH_CONFIG: PushConfig = {
  pushKey: '',
  enabled: false,
  proxyUrl: 'https://push-proxy.asd1231506.workers.dev',
  scenarios: {
    newTask: true,
    taskSubmitted: true,
    taskConfirmed: true,
    taskRejected: true,
    redemptionRequested: true,
    redemptionConfirmed: true,
    redemptionRejected: true,
    pointsChanged: true,
    taskStartReminder: true,
    extraReward: true,
    extraPenalty: true,
  },
};

// ============ 推送服务类 ============

export class PushService {
  private config: PushConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig(): PushConfig {
    const saved = storage.get<PushConfig>(STORAGE_KEYS.PUSH_CONFIG);
    if (saved) {
      // 合并默认值（处理旧数据缺失的字段）
      return {
        pushKey: saved.pushKey || '',
        enabled: saved.enabled || false,
        proxyUrl: saved.proxyUrl || DEFAULT_PUSH_CONFIG.proxyUrl,
        scenarios: {
          ...DEFAULT_PUSH_CONFIG.scenarios,
          ...saved.scenarios,
        },
      };
    }
    return DEFAULT_PUSH_CONFIG;
  }

  saveConfig(config: PushConfig): void {
    storage.set(STORAGE_KEYS.PUSH_CONFIG, config);
    this.config = config;
  }

  getConfig(): PushConfig {
    return this.config;
  }

  setPushKey(pushKey: string): void {
    this.config.pushKey = pushKey;
    this.config.enabled = pushKey.length > 0;
    this.saveConfig(this.config);
  }

  setProxyUrl(proxyUrl: string): void {
    this.config.proxyUrl = proxyUrl;
    this.saveConfig(this.config);
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig(this.config);
  }

  updateScenarios(scenarios: Partial<PushScenarios>): void {
    this.config.scenarios = { ...this.config.scenarios, ...scenarios };
    this.saveConfig(this.config);
  }

  shouldPush(scenario: keyof PushScenarios): boolean {
    return this.config.enabled && this.config.pushKey.length > 0 && this.config.scenarios[scenario];
  }

  private buildTitle(message: PushMessage): string {
    let title = message.title;

    // 添加主题标识
    if (message.theme) {
      const themePrefix: Record<PushTheme, string> = {
        info: '[i]',
        success: '[s]',
        warning: '[w]',
        failure: '[f]',
      };
      title = themePrefix[message.theme] + title;
    }

    // 添加分组和头像
    if (message.group) {
      let groupTag = `[#${message.group}`;
      if (message.avatar) {
        groupTag += `!${message.avatar}`;
      }
      groupTag += ']';
      title = title + groupTag;
    }

    return title;
  }

  /**
   * 发送推送消息 (通过代理)
   * 
   * 由于浏览器 CORS 限制，需要通过代理服务器转发
   * 推荐方案：部署自己的代理服务
   * 
   * 快速部署代理：
   * - Cloudflare Workers: 免费，5分钟部署
   * - Vercel: 免费，支持 Node.js
   */
  async send(message: PushMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.config.pushKey) {
      return { success: false, error: '推送密钥未配置' };
    }

    const title = this.buildTitle(message);
    const params = new URLSearchParams({
      push_key: this.config.pushKey,
      title: title,
      content: message.content,
    });

    if (message.type) params.append('type', message.type);
    if (message.date) params.append('date', message.date);

    const body = params.toString();

    // 优先使用用户配置的代理
    const proxies = this.config.proxyUrl ? [this.config.proxyUrl] : [
      // 默认代理
      'https://push-proxy.asd1231506.workers.dev',
      // 方案2: 自建代理地址 (推荐)
      // 如果有自建代理，填在这里
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body,
        });

        const result = await response.text();

        if (result === 'success') {
          console.log('[PushMe] 推送成功:', title);
          return { success: true };
        }

        // 如果返回的是 HTML (被 Cloudflare 阻止)，继续尝试下一个代理
        if (result.includes('<!DOCTYPE html>')) {
          console.warn('[PushMe] 代理被阻止，尝试下一个...');
          continue;
        }

        // 其他错误，直接返回
        console.error('[PushMe] 推送失败:', result);
        return { success: false, error: result };
      } catch (err) {
        console.warn('[PushMe] 代理请求失败:', err);
        continue;
      }
    }

    return { success: false, error: '所有代理都失败了，请部署自己的代理服务' };
  }

  // ============ 业务场景推送方法 ============

  async notifyNewTask(taskName: string, points: number, timeSlot?: string): Promise<void> {
    if (!this.shouldPush('newTask')) return;
    await this.send({
      title: '新任务分配',
      content: timeSlot ? `任务：${taskName}\n积分：${points}\n时间段：${timeSlot}` : `任务：${taskName}\n积分：${points}`,
      theme: 'info',
      group: 'StudyPlan',
      avatar: '📝',
    });
  }

  async notifyTaskSubmitted(taskName: string, childName: string): Promise<void> {
    if (!this.shouldPush('taskSubmitted')) return;
    await this.send({
      title: '任务待审核',
      content: `孩子「${childName}」已完成任务「${taskName}」，请及时审核确认。`,
      theme: 'warning',
      group: 'StudyPlan',
      avatar: '⏰',
    });
  }

  async notifyTaskConfirmed(taskName: string, points: number): Promise<void> {
    if (!this.shouldPush('taskConfirmed')) return;
    await this.send({
      title: '任务完成确认',
      content: `任务「${taskName}」已确认通过！\n获得积分：${points}`,
      theme: 'success',
      group: 'StudyPlan',
      avatar: '✅',
    });
  }

  async notifyTaskRejected(taskName: string, reason: string): Promise<void> {
    if (!this.shouldPush('taskRejected')) return;
    await this.send({
      title: '任务审核拒绝',
      content: `任务「${taskName}」被拒绝。\n拒绝原因：${reason}`,
      theme: 'failure',
      group: 'StudyPlan',
      avatar: '❌',
    });
  }

  async notifyRedemptionRequested(rewardName: string, cost: number, childName: string): Promise<void> {
    if (!this.shouldPush('redemptionRequested')) return;
    await this.send({
      title: '奖励兑换申请',
      content: `孩子「${childName}」申请兑换「${rewardName}」\n消耗积分：${cost}\n请及时处理。`,
      theme: 'warning',
      group: 'StudyPlan',
      avatar: '🎁',
    });
  }

  async notifyRedemptionConfirmed(rewardName: string): Promise<void> {
    if (!this.shouldPush('redemptionConfirmed')) return;
    await this.send({
      title: '兑换成功',
      content: `恭喜！「${rewardName}」兑换成功！`,
      theme: 'success',
      group: 'StudyPlan',
      avatar: '🎉',
    });
  }

  async notifyRedemptionRejected(rewardName: string, reason: string): Promise<void> {
    if (!this.shouldPush('redemptionRejected')) return;
    await this.send({
      title: '兑换申请拒绝',
      content: `「${rewardName}」兑换申请被拒绝。\n原因：${reason}`,
      theme: 'failure',
      group: 'StudyPlan',
      avatar: '💔',
    });
  }

  async notifyPointsChanged(balance: number, change: number, description: string): Promise<void> {
    if (!this.shouldPush('pointsChanged')) return;
    await this.send({
      title: '积分变动',
      content: `${description}\n变动：${change > 0 ? '+' : ''}${change}\n当前余额：${balance}`,
      theme: change > 0 ? 'success' : 'warning',
      group: 'StudyPlan',
      avatar: '💰',
    });
  }

  /**
   * 任务开始提醒 - 提前5分钟通知
   */
  async notifyTaskStartReminder(taskName: string, timeSlot: string): Promise<void> {
    if (!this.shouldPush('taskStartReminder')) return;
    await this.send({
      title: '要开始任务了',
      content: `${timeSlot} ${taskName}（马上要开始的任务）`,
      theme: 'warning',
      group: 'StudyPlan',
      avatar: '⏰',
    });
  }

  /**
   * 额外奖励通知
   */
  async notifyExtraReward(description: string, points: number): Promise<void> {
    if (!this.shouldPush('extraReward')) return;
    await this.send({
      title: '额外奖励',
      content: `恭喜获得额外奖励！\n原因：${description}\n积分：+${points}`,
      theme: 'success',
      group: 'StudyPlan',
      avatar: '🎁',
    });
  }

  /**
   * 额外惩罚通知
   */
  async notifyExtraPenalty(description: string, points: number): Promise<void> {
    if (!this.shouldPush('extraPenalty')) return;
    await this.send({
      title: '额外惩罚',
      content: `收到额外惩罚\n原因：${description}\n扣分：-${points}`,
      theme: 'failure',
      group: 'StudyPlan',
      avatar: '⚠️',
    });
  }
}

// ============ 单例实例 ============

export const pushService = new PushService();

// ============ Zustand Store ============

interface PushState {
  config: PushConfig;
  setPushKey: (key: string) => void;
  setProxyUrl: (url: string) => void;
  setEnabled: (enabled: boolean) => void;
  updateScenarios: (scenarios: Partial<PushScenarios>) => void;
  notifyNewTask: (taskName: string, points: number, timeSlot?: string) => Promise<void>;
  notifyTaskSubmitted: (taskName: string, childName: string) => Promise<void>;
  notifyTaskConfirmed: (taskName: string, points: number) => Promise<void>;
  notifyTaskRejected: (taskName: string, reason: string) => Promise<void>;
  notifyRedemptionRequested: (rewardName: string, cost: number, childName: string) => Promise<void>;
  notifyRedemptionConfirmed: (rewardName: string) => Promise<void>;
  notifyRedemptionRejected: (rewardName: string, reason: string) => Promise<void>;
  notifyPointsChanged: (balance: number, change: number, description: string) => Promise<void>;
  notifyTaskStartReminder: (taskName: string, timeSlot: string) => Promise<void>;
  notifyExtraReward: (description: string, points: number) => Promise<void>;
  notifyExtraPenalty: (description: string, points: number) => Promise<void>;
  loadFromStorage: () => void;
}

export const usePushStore = create<PushState>((set) => ({
  config: DEFAULT_PUSH_CONFIG,

  setPushKey: (key) => {
    pushService.setPushKey(key);
    set({ config: pushService.getConfig() });
  },

  setProxyUrl: (url) => {
    pushService.setProxyUrl(url);
    set({ config: pushService.getConfig() });
  },

  setEnabled: (enabled) => {
    pushService.setEnabled(enabled);
    set({ config: pushService.getConfig() });
  },

  updateScenarios: (scenarios) => {
    pushService.updateScenarios(scenarios);
    set({ config: pushService.getConfig() });
  },

  notifyNewTask: async (taskName, points, timeSlot) => {
    await pushService.notifyNewTask(taskName, points, timeSlot);
  },

  notifyTaskSubmitted: async (taskName, childName) => {
    await pushService.notifyTaskSubmitted(taskName, childName);
  },

  notifyTaskConfirmed: async (taskName, points) => {
    await pushService.notifyTaskConfirmed(taskName, points);
  },

  notifyTaskRejected: async (taskName, reason) => {
    await pushService.notifyTaskRejected(taskName, reason);
  },

  notifyRedemptionRequested: async (rewardName, cost, childName) => {
    await pushService.notifyRedemptionRequested(rewardName, cost, childName);
  },

  notifyRedemptionConfirmed: async (rewardName) => {
    await pushService.notifyRedemptionConfirmed(rewardName);
  },

  notifyRedemptionRejected: async (rewardName, reason) => {
    await pushService.notifyRedemptionRejected(rewardName, reason);
  },

  notifyPointsChanged: async (balance, change, description) => {
    await pushService.notifyPointsChanged(balance, change, description);
  },

  notifyTaskStartReminder: async (taskName, timeSlot) => {
    await pushService.notifyTaskStartReminder(taskName, timeSlot);
  },

  notifyExtraReward: async (description, points) => {
    await pushService.notifyExtraReward(description, points);
  },

  notifyExtraPenalty: async (description, points) => {
    await pushService.notifyExtraPenalty(description, points);
  },

  loadFromStorage: () => {
    const config = pushService.loadConfig();
    set({ config });
  },
}));