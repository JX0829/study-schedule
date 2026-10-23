/**
 * 多平台消息推送设置组件
 * 支持: 飞书 (Feishu)、企业微信 (WeCom)、Telegram、PushMe
 */

import React, { useState, useEffect } from 'react';
import { usePushStore } from '@/utils/push';
import type { ChannelType, PushScenarios } from '@/utils/push';

export const PushSettings: React.FC = () => {
  const { config, setEnabled, updateChannel, updateScenarios, testChannel, loadFromStorage } = usePushStore();

  const [activeTab, setActiveTab] = useState<ChannelType>('feishu');

  // 本地表单草稿状态
  const [feishuWebhook, setFeishuWebhook] = useState(config.channels.feishu.webhookUrl);
  const [wecomWebhook, setWecomWebhook] = useState(config.channels.wecom.webhookUrl);
  const [tgBotToken, setTgBotToken] = useState(config.channels.telegram.botToken);
  const [tgChatId, setTgChatId] = useState(config.channels.telegram.chatId);
  const [tgProxyUrl, setTgProxyUrl] = useState(config.channels.telegram.proxyUrl || '');
  const [pushKey, setPushKey] = useState(config.channels.pushme.pushKey);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // 同步 store 到本地 draft
  useEffect(() => {
    setFeishuWebhook(config.channels.feishu.webhookUrl);
    setWecomWebhook(config.channels.wecom.webhookUrl);
    setTgBotToken(config.channels.telegram.botToken);
    setTgChatId(config.channels.telegram.chatId);
    setTgProxyUrl(config.channels.telegram.proxyUrl || '');
    setPushKey(config.channels.pushme.pushKey);
  }, [config]);

  // 通道测试与自动保存
  const handleTestAndSave = async (channel: ChannelType) => {
    setTesting(true);
    setTestResult(null);

    let draftConfig: any = {};
    if (channel === 'feishu') {
      if (!feishuWebhook) {
        setTestResult({ success: false, message: '请先输入飞书自定义机器人 Webhook URL' });
        setTesting(false);
        return;
      }
      draftConfig = { webhookUrl: feishuWebhook, enabled: true };
    } else if (channel === 'wecom') {
      if (!wecomWebhook) {
        setTestResult({ success: false, message: '请先输入企业微信机器人 Webhook URL' });
        setTesting(false);
        return;
      }
      draftConfig = { webhookUrl: wecomWebhook, enabled: true };
    } else if (channel === 'telegram') {
      if (!tgBotToken || !tgChatId) {
        setTestResult({ success: false, message: '请完整输入 Telegram Bot Token 与 Chat ID' });
        setTesting(false);
        return;
      }
      draftConfig = { botToken: tgBotToken, chatId: tgChatId, proxyUrl: tgProxyUrl, enabled: true };
    } else if (channel === 'pushme') {
      if (!pushKey) {
        setTestResult({ success: false, message: '请先输入 PushMe 推送密钥 (push_key)' });
        setTesting(false);
        return;
      }
      draftConfig = { pushKey: pushKey, enabled: true };
    }

    try {
      const res = await testChannel(channel, draftConfig);
      setTestResult(res);
      if (res.success) {
        // 测试通过，自动保存该通道并置为开启
        updateChannel(channel, draftConfig);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `测试请求异常: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleChannel = (channel: ChannelType, enabled: boolean) => {
    updateChannel(channel, { enabled } as any);
  };

  const handleScenarioChange = (scenario: keyof PushScenarios, checked: boolean) => {
    updateScenarios({ [scenario]: checked });
  };

  const scenarioLabels: Record<keyof PushScenarios, { label: string; desc: string; icon: string }> = {
    newTask: { label: '新任务分配', desc: '家长分配任务时通知孩子', icon: '📝' },
    taskSubmitted: { label: '任务提交', desc: '孩子提交任务时通知家长审核', icon: '⏰' },
    taskConfirmed: { label: '任务确认', desc: '家长确认任务时通知孩子', icon: '✅' },
    taskRejected: { label: '任务退回', desc: '家长退回任务时通知孩子', icon: '❌' },
    redemptionRequested: { label: '奖励兑换申请', desc: '孩子申请兑换时通知家长', icon: '🎁' },
    redemptionConfirmed: { label: '兑换确认', desc: '家长确认兑换时通知孩子', icon: '🎉' },
    redemptionRejected: { label: '兑换拒绝', desc: '家长拒绝兑换时通知孩子', icon: '💔' },
    pointsChanged: { label: '积分变动', desc: '积分变化时通知孩子', icon: '💰' },
    taskStartReminder: { label: '任务开始提醒', desc: '提前5分钟提醒即将开始的任务', icon: '🔔' },
    extraReward: { label: '额外奖励', desc: '家长给予额外奖励时通知孩子', icon: '🌟' },
    extraPenalty: { label: '额外惩罚', desc: '家长给予额外惩罚时通知孩子', icon: '⚠️' },
  };

  const channelsMeta: Record<ChannelType, { name: string; icon: string; desc: string; badge: string }> = {
    feishu: { name: '飞书机器人', icon: '🕊️', desc: '飞书群自定义机器人 Webhook (支持富文本卡片)', badge: '推荐' },
    wecom: { name: '企业微信', icon: '💬', desc: '企业微信内部群机器人 Webhook (Markdown)', badge: '稳定' },
    telegram: { name: 'Telegram', icon: '✈️', desc: 'Telegram 独立 Bot (Bot Token + Chat ID)', badge: '极客' },
    pushme: { name: 'PushMe', icon: '📱', desc: 'PushMe Android 独立推送 App (PushKey)', badge: '兼容' },
  };

  const isChannelConfigured = (channel: ChannelType) => {
    const c = config.channels[channel];
    if (channel === 'feishu') return !!(c as any).webhookUrl;
    if (channel === 'wecom') return !!(c as any).webhookUrl;
    if (channel === 'telegram') return !!((c as any).botToken && (c as any).chatId);
    if (channel === 'pushme') return !!(c as any).pushKey;
    return false;
  };

  return (
    <div className="cosmic-glass p-6 text-white max-w-4xl mx-auto">
      {/* 顶部标题与全局总开关 */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📬 消息推送通知设置
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            支持飞书、企业微信、Telegram、PushMe 多通道聚合推送，任务与兑换动态多端实时达。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">全局推送</span>
          <button
            onClick={() => setEnabled(!config.enabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition ${
              config.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {config.enabled ? '● 已启用' : '○ 已停用'}
          </button>
        </div>
      </div>

      {/* 四大通道卡片选择器 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(Object.keys(channelsMeta) as ChannelType[]).map((ch) => {
          const meta = channelsMeta[ch];
          const isSelected = activeTab === ch;
          const isEnabled = config.channels[ch].enabled;
          const configured = isChannelConfigured(ch);

          return (
            <button
              key={ch}
              onClick={() => {
                setActiveTab(ch);
                setTestResult(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'border-white/10 bg-slate-900/40 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-2xl">{meta.icon}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : configured
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {isEnabled ? '已开启' : configured ? '已配置' : '未配置'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                  {meta.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{meta.badge}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 当前选中通道的配置面板 */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{channelsMeta[activeTab].icon}</span>
            <div>
              <h3 className="font-bold text-white text-base">{channelsMeta[activeTab].name} 配置</h3>
              <p className="text-xs text-slate-400">{channelsMeta[activeTab].desc}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-300">启用本通道</span>
            <input
              type="checkbox"
              checked={config.channels[activeTab].enabled}
              onChange={(e) => handleToggleChannel(activeTab, e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </label>
        </div>

        {/* 飞书通道表单 */}
        {activeTab === 'feishu' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                飞书自定义机器人 Webhook URL
              </label>
              <input
                type="text"
                value={feishuWebhook}
                onChange={(e) => setFeishuWebhook(e.target.value)}
                placeholder="例如: https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-[#0B132B]/90 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200/90 leading-relaxed">
              💡 <strong>获取指引</strong>：在飞书电脑端创建群聊 ➡️ 点击右上角设置 ➡️「群机器人」➡️「添加机器人」➡️ 选择「自定义机器人」并复制生成的 Webhook 地址粘贴到此处。
            </div>
          </div>
        )}

        {/* 企业微信通道表单 */}
        {activeTab === 'wecom' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                企业微信机器人 Webhook URL
              </label>
              <input
                type="text"
                value={wecomWebhook}
                onChange={(e) => setWecomWebhook(e.target.value)}
                placeholder="例如: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-[#0B132B]/90 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200/90 leading-relaxed">
              💡 <strong>获取指引</strong>：在企微群聊点击右上角「···」➡️「添加群机器人」➡️ 新建机器人并复制 Webhook 地址粘贴到此处。
            </div>
          </div>
        )}

        {/* Telegram 通道表单 */}
        {activeTab === 'telegram' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                placeholder="例如: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-3.5 py-2.5 bg-[#0B132B]/90 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                目标 Chat ID (用户 ID 或群 ID)
              </label>
              <input
                type="text"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                placeholder="例如: 987654321 或 -100xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-[#0B132B]/90 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                可选反向代理 / 中继 API（国内网络可填）
              </label>
              <input
                type="text"
                value={tgProxyUrl}
                onChange={(e) => setTgProxyUrl(e.target.value)}
                placeholder="默认使用官方 API https://api.telegram.org"
                className="w-full px-3.5 py-2 bg-[#0B132B]/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200/90 leading-relaxed">
              💡 <strong>获取指引</strong>：在 TG 向 <code>@BotFather</code> 发送 <code>/newbot</code> 获取 Bot Token；向 <code>@userinfobot</code> 发送消息可获得你的个人 Chat ID。
            </div>
          </div>
        )}

        {/* PushMe 通道表单 */}
        {activeTab === 'pushme' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PushMe 推送密钥 (push_key)
              </label>
              <input
                type="text"
                value={pushKey}
                onChange={(e) => setPushKey(e.target.value)}
                placeholder="请输入手机 PushMe App 中展示的 push_key"
                className="w-full px-3.5 py-2.5 bg-[#0B132B]/90 border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200/90 leading-relaxed">
              💡 <strong>获取指引</strong>：在 Android 手机安装 PushMe App（官网: push.i-i.me），复制主界面的 push_key 填入即可（现已由本地后端直发，不再依赖外部跨域代理）。
            </div>
          </div>
        )}

        {/* 测试并保存按钮 */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => handleTestAndSave(activeTab)}
            disabled={testing}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
          >
            {testing ? '⏳ 正在测试通道连通性...' : `🧪 测试并保存「${channelsMeta[activeTab].name}」`}
          </button>
          <span className="text-[11px] text-slate-400">
            * 点击测试成功后将自动保存并开启当前通道。
          </span>
        </div>

        {/* 测试反馈消息 */}
        {testResult && (
          <div className={`mt-3 p-3 rounded-xl text-xs border ${
            testResult.success
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
          }`}>
            {testResult.success ? '✅ ' : '❌ '}{testResult.message}
          </div>
        )}
      </div>

      {/* 推送场景勾选面板 */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>⚙️</span> 推送触发场景设置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(Object.keys(config.scenarios) as (keyof PushScenarios)[]).map((scenario) => {
            const { label, desc, icon } = scenarioLabels[scenario];
            const isChecked = config.scenarios[scenario];

            return (
              <label
                key={scenario}
                className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  isChecked
                    ? 'border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                    : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/40 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleScenarioChange(scenario, e.target.checked)}
                  disabled={!config.enabled}
                  className="w-4 h-4 rounded border-slate-700 bg-[#0B132B] text-cyan-400 focus:ring-cyan-400 disabled:opacity-50"
                />
                <span className="text-xl">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">{label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 当前多通道状态底栏 */}
      <div className="p-4 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">通道聚合状态:</span>
          {(Object.keys(channelsMeta) as ChannelType[]).map((ch) => {
            const enabled = config.channels[ch].enabled && isChannelConfigured(ch);
            return (
              <span key={ch} className="inline-flex items-center gap-1 font-mono text-[11px]">
                <span className={enabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {enabled ? '●' : '○'}
                </span>
                {channelsMeta[ch].name}
              </span>
            );
          })}
        </div>
        <div className="text-slate-400">
          已启用场景: {Object.values(config.scenarios).filter(Boolean).length} / {Object.keys(config.scenarios).length}
        </div>
      </div>
    </div>
  );
};

export default PushSettings;
