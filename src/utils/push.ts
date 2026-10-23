/**
 * 多平台消息推送服务
 * 
 * 支持通道:
 * 1. 飞书 (Feishu 自定义机器人 Webhook)
 * 2. 企业微信 (WeCom 群机器人 Webhook)
 * 3. Telegram (Bot Token + Chat ID)
 * 4. PushMe (保留原版兼容)
 * 
 * 架构：通过本地 Node.js 后端服务 (http://localhost:3002/api/push) 统一中继分发，
 * 彻底解决前端直接调用各大第三方 Webhook 的 CORS (跨域) 限制。
 */

import { create } from 'zustand';
import { storage, STORAGE_KEYS } from './storage';

// ============ 推送配置类型 ============

export type ChannelType = 'feishu' | 'wecom' | 'telegram' | 'pushme';

export interface FeishuChannelConfig {
  webhookUrl: string;
  enabled: boolean;
}

export interface WeComChannelConfig {
  webhookUrl: string;
  enabled: boolean;
}

export interface TelegramChannelConfig {
  botToken: string;
  chatId: string;
  proxyUrl?: string;
  enabled: boolean;
}

export interface PushMeChannelConfig {
  pushKey: string;
  enabled: boolean;
}

export interface PushChannelsConfig {
  feishu: FeishuChannelConfig;
  wecom: WeComChannelConfig;
  telegram: TelegramChannelConfig;
  pushme: PushMeChannelConfig;
}

export interface PushConfig {
  /** 全局是否启用推送 */
  enabled: boolean;
  /** 后端 API 地址 */
  serverUrl: string;
  /** 各通道配置 */
  channels: PushChannelsConfig;
  /** 推送场景配置 */
  scenarios: PushScenarios;

  // 兼容旧字段
  pushKey?: string;
  proxyUrl?: string;
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

export type PushTheme = 'info' | 'success' | 'warning' | 'failure';

export interface PushMessage {
  title: string;
  content: string;
  theme?: PushTheme;
  group?: string;
  avatar?: string;
  date?: string;
}

// ============ 默认配置 ============

const DEFAULT_PUSH_CONFIG: PushConfig = {
  enabled: false,
  serverUrl: 'http://localhost:3002',
  channels: {
    feishu: { webhookUrl: '', enabled: false },
    wecom: { webhookUrl: '', enabled: false },
    telegram: { botToken: '', chatId: '', proxyUrl: '', enabled: false },
    pushme: { pushKey: '', enabled: false },
  },
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
    const saved = storage.get<any>(STORAGE_KEYS.PUSH_CONFIG);
    if (saved) {
      // 迁移旧版单一 PushMe 配置
      const oldPushKey = saved.pushKey || '';
      const oldPushMeEnabled = saved.channels?.pushme?.enabled ?? (oldPushKey.length > 0 && (saved.enabled ?? true));

      const feishu = saved.channels?.feishu || DEFAULT_PUSH_CONFIG.channels.feishu;
      const wecom = saved.channels?.wecom || DEFAULT_PUSH_CONFIG.channels.wecom;
      const telegram = saved.channels?.telegram || DEFAULT_PUSH_CONFIG.channels.telegram;
      const pushme = {
        pushKey: saved.channels?.pushme?.pushKey || oldPushKey,
        enabled: oldPushMeEnabled,
      };

      const hasAnyChannelEnabled = feishu.enabled || wecom.enabled || telegram.enabled || pushme.enabled;

      return {
        enabled: saved.enabled !== undefined ? saved.enabled : hasAnyChannelEnabled,
        serverUrl: saved.serverUrl || DEFAULT_PUSH_CONFIG.serverUrl,
        channels: { feishu, wecom, telegram, pushme },
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

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig(this.config);
  }

  setServerUrl(serverUrl: string): void {
    this.config.serverUrl = serverUrl;
    this.saveConfig(this.config);
  }

  updateChannel<T extends ChannelType>(channel: T, channelConfig: Partial<PushChannelsConfig[T]>): void {
    this.config.channels[channel] = {
      ...this.config.channels[channel],
      ...channelConfig,
    } as any;
    
    // 如果启用了某个通道，自动同步启用全局开关
    const hasEnabled = Object.values(this.config.channels).some((c: any) => c.enabled);
    if (hasEnabled && !this.config.enabled) {
      this.config.enabled = true;
    }
    this.saveConfig(this.config);
  }

  updateScenarios(scenarios: Partial<PushScenarios>): void {
    this.config.scenarios = { ...this.config.scenarios, ...scenarios };
    this.saveConfig(this.config);
  }

  // 检查是否有任何通道有效且开启
  hasActiveChannels(): boolean {
    if (!this.config.enabled) return false;
    const { feishu, wecom, telegram, pushme } = this.config.channels;
    return (
      (feishu.enabled && !!feishu.webhookUrl) ||
      (wecom.enabled && !!wecom.webhookUrl) ||
      (telegram.enabled && !!telegram.botToken && !!telegram.chatId) ||
      (pushme.enabled && !!pushme.pushKey)
    );
  }

  shouldPush(scenario: keyof PushScenarios): boolean {
    return this.hasActiveChannels() && !!this.config.scenarios[scenario];
  }

  /**
   * 单通道连通性测试
   */
  async testChannel(channel: ChannelType, customConfig?: any): Promise<{ success: boolean; message: string }> {
    const configToTest = customConfig || this.config.channels[channel];
    const serverUrl = this.config.serverUrl || 'http://localhost:3002';

    try {
      const response = await fetch(`${serverUrl}/api/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          config: configToTest,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: '测试消息发送成功！请检查相应应用中是否收到消息。' };
      }
      return { success: false, message: data.error || '推送测试失败' };
    } catch (err: any) {
      return { success: false, message: `无法连接到本地推送服务 (${serverUrl}): ${err.message}` };
    }
  }

  /**
   * 多通道统一并发下发
   */
  async send(message: PushMessage): Promise<{ success: boolean; results?: any; error?: string }> {
    if (!this.hasActiveChannels()) {
      return { success: false, error: '未启用任何有效推送通道' };
    }

    const serverUrl = this.config.serverUrl || 'http://localhost:3002';

    try {
      const response = await fetch(`${serverUrl}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: this.config.channels,
          message: {
            title: message.title,
            content: message.content,
            theme: message.theme || 'info',
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('[PushService] 多通道推送成功:', message.title, data.results);
        return { success: true, results: data.results };
      }
      return { success: false, error: data.error || '部分或全部通道推送失败', results: data.results };
    } catch (err: any) {
      console.error('[PushService] 推送中继失败:', err);
      return { success: false, error: `推送服务网络错误: ${err.message}` };
    }
  }

  // ============ 业务场景推送方法 ============

  async notifyNewTask(taskName: string, points: number, timeSlot?: string): Promise<void> {
    if (!this.shouldPush('newTask')) return;
    await this.send({
      title: '📝 新任务分配',
      content: timeSlot ? `任务：${taskName}\n积分：${points}\n时间段：${timeSlot}` : `任务：${taskName}\n积分：${points}`,
      theme: 'info',
    });
  }

  async notifyTaskSubmitted(taskName: string, childName: string): Promise<void> {
    if (!this.shouldPush('taskSubmitted')) return;
    await this.send({
      title: '⏰ 任务待审核',
      content: `孩子「${childName}」已提交打卡任务「${taskName}」，请家长尽快审核。`,
      theme: 'warning',
    });
  }

  async notifyTaskConfirmed(taskName: string, points: number): Promise<void> {
    if (!this.shouldPush('taskConfirmed')) return;
    await this.send({
      title: '✅ 任务完成确认',
      content: `任务「${taskName}」已审核通过！\n获得奖励：+${points} 积分 🌟`,
      theme: 'success',
    });
  }

  async notifyTaskRejected(taskName: string, reason: string): Promise<void> {
    if (!this.shouldPush('taskRejected')) return;
    await this.send({
      title: '❌ 任务审核退回',
      content: `任务「${taskName}」未通过审核。\n说明/原因：${reason}`,
      theme: 'failure',
    });
  }

  async notifyRedemptionRequested(rewardName: string, cost: number, childName: string): Promise<void> {
    if (!this.shouldPush('redemptionRequested')) return;
    await this.send({
      title: '🎁 奖励兑换申请',
      content: `孩子「${childName}」申请兑换「${rewardName}」\n需要消耗：${cost} 积分\n请前往家长端审批。`,
      theme: 'warning',
    });
  }

  async notifyRedemptionConfirmed(rewardName: string): Promise<void> {
    if (!this.shouldPush('redemptionConfirmed')) return;
    await this.send({
      title: '🎉 兑换申请通过',
      content: `太棒了！奖励「${rewardName}」已成功兑换，记得及时兑现承诺哦～`,
      theme: 'success',
    });
  }

  async notifyRedemptionRejected(rewardName: string, reason: string): Promise<void> {
    if (!this.shouldPush('redemptionRejected')) return;
    await this.send({
      title: '💔 兑换申请拒绝',
      content: `奖励「${rewardName}」兑换申请被拒绝。\n原因：${reason}`,
      theme: 'failure',
    });
  }

  async notifyPointsChanged(balance: number, change: number, description: string): Promise<void> {
    if (!this.shouldPush('pointsChanged')) return;
    await this.send({
      title: '💰 积分变动通知',
      content: `${description}\n变动：${change > 0 ? '+' : ''}${change}\n当前可用积分：${balance}`,
      theme: change > 0 ? 'success' : 'warning',
    });
  }

  async notifyTaskStartReminder(taskName: string, timeSlot: string): Promise<void> {
    if (!this.shouldPush('taskStartReminder')) return;
    await this.send({
      title: '⏰ 任务即将开始',
      content: `规划时间段：${timeSlot}\n任务名称：${taskName}\n还有5分钟即将开始，请做好准备！`,
      theme: 'warning',
    });
  }

  async notifyExtraReward(description: string, points: number): Promise<void> {
    if (!this.shouldPush('extraReward')) return;
    await this.send({
      title: '🌟 获得额外奖励',
      content: `表现优秀！获得额外积分奖励！\n原因：${description}\n获得积分：+${points}`,
      theme: 'success',
    });
  }

  async notifyExtraPenalty(description: string, points: number): Promise<void> {
    if (!this.shouldPush('extraPenalty')) return;
    await this.send({
      title: '⚠️ 收到扣分提示',
      content: `注意行为规范，已被扣除积分。\n原因：${description}\n扣除积分：-${points}`,
      theme: 'failure',
    });
  }
}

// ============ 单例实例 ============

export const pushService = new PushService();

// ============ Zustand Store ============

interface PushState {
  config: PushConfig;
  setEnabled: (enabled: boolean) => void;
  setServerUrl: (url: string) => void;
  updateChannel: <T extends ChannelType>(channel: T, channelConfig: Partial<PushChannelsConfig[T]>) => void;
  updateScenarios: (scenarios: Partial<PushScenarios>) => void;
  testChannel: (channel: ChannelType, customConfig?: any) => Promise<{ success: boolean; message: string }>;
  loadFromStorage: () => void;
}

export const usePushStore = create<PushState>((set) => ({
  config: pushService.getConfig(),

  setEnabled: (enabled) => {
    pushService.setEnabled(enabled);
    set({ config: pushService.getConfig() });
  },

  setServerUrl: (url) => {
    pushService.setServerUrl(url);
    set({ config: pushService.getConfig() });
  },

  updateChannel: (channel, channelConfig) => {
    pushService.updateChannel(channel, channelConfig);
    set({ config: pushService.getConfig() });
  },

  updateScenarios: (scenarios) => {
    pushService.updateScenarios(scenarios);
    set({ config: pushService.getConfig() });
  },

  testChannel: async (channel, customConfig) => {
    return await pushService.testChannel(channel, customConfig);
  },

  loadFromStorage: () => {
    const config = pushService.loadConfig();
    pushService.saveConfig(config);
    set({ config });
  },
}));
