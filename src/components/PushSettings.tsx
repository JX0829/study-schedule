/**
 * 推送设置组件
 * 
 * 用于配置 PushMe 推送服务
 * 
 * 注意：由于 CORS 限制，浏览器无法直接调用 PushMe API
 * 需要通过代理服务器转发请求
 */

import React, { useState, useEffect } from 'react';
import { usePushStore } from '@/utils/push';
import type { PushScenarios } from '@/utils/push';

export const PushSettings: React.FC = () => {
  const { config, setPushKey, setProxyUrl, setEnabled, updateScenarios, loadFromStorage } = usePushStore();
  const [pushKeyInput, setPushKeyInput] = useState(config.pushKey);
  const [proxyUrlInput, setProxyUrlInput] = useState(config.proxyUrl || 'https://push-proxy.asd1231506.workers.dev');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const handleTestPush = async () => {
    if (!pushKeyInput) {
      setTestResult({ success: false, message: '请先输入推送密钥' });
      return;
    }

    if (!proxyUrlInput) {
      setTestResult({ success: false, message: '请先输入代理地址' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const params = new URLSearchParams({
        push_key: pushKeyInput,
        title: '[i]测试推送[#StudyPlan!🧪]',
        content: '这是一条来自 StudyPlan 的测试消息，推送服务配置成功！',
        type: 'text',
      });

      // 使用用户配置的代理
      const response = await fetch(proxyUrlInput, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.text();

      if (result === 'success') {
        setPushKey(pushKeyInput);
        setProxyUrl(proxyUrlInput);
        setTestResult({ success: true, message: '推送测试成功！请检查手机是否收到消息。密钥和代理已自动保存。' });
        return;
      }

      if (result.includes('DOCTYPE')) {
        setTestResult({ success: false, message: '代理被阻止，请检查代理配置' });
        return;
      }
      
      setTestResult({ success: false, message: `推送失败: ${result}` });
    } catch (error) {
      setTestResult({ success: false, message: `推送异常: ${error instanceof Error ? error.message : '网络请求失败'}` });
    } finally {
      setTesting(false);
    }
  };

  const handleScenarioChange = (scenario: keyof PushScenarios, checked: boolean) => {
    updateScenarios({ [scenario]: checked });
  };

  const scenarioLabels: Record<keyof PushScenarios, { label: string; desc: string; icon: string }> = {
    newTask: { label: '新任务分配', desc: '家长分配任务时通知孩子', icon: '📝' },
    taskSubmitted: { label: '任务提交', desc: '孩子提交任务时通知家长审核', icon: '⏰' },
    taskConfirmed: { label: '任务确认', desc: '家长确认任务时通知孩子', icon: '✅' },
    taskRejected: { label: '任务拒绝', desc: '家长拒绝任务时通知孩子', icon: '❌' },
    redemptionRequested: { label: '奖励兑换申请', desc: '孩子申请兑换时通知家长', icon: '🎁' },
    redemptionConfirmed: { label: '兑换确认', desc: '家长确认兑换时通知孩子', icon: '🎉' },
    redemptionRejected: { label: '兑换拒绝', desc: '家长拒绝兑换时通知孩子', icon: '💔' },
    pointsChanged: { label: '积分变动', desc: '积分变化时通知孩子', icon: '💰' },
    taskStartReminder: { label: '任务开始提醒', desc: '提前5分钟提醒即将开始的任务', icon: '🔔' },
    extraReward: { label: '额外奖励', desc: '家长给予额外奖励时通知孩子', icon: '🎁' },
    extraPenalty: { label: '额外惩罚', desc: '家长给予额外惩罚时通知孩子', icon: '⚠️' },
  };

  return (
    <div className="cosmic-glass p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📬 推送设置
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">推送服务</span>
          <button
            onClick={() => setEnabled(!config.enabled)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              config.enabled 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {config.enabled ? '已启用' : '已禁用'}
          </button>
        </div>
      </div>

      {/* PushMe 说明 */}
      <div className="mb-6 p-4 bg-sky-950/40 border border-sky-500/30 rounded-xl">
        <p className="text-sm text-sky-200 mb-2">
          <strong>PushMe</strong> 是一个简单轻量的 Android 消息推送客户端。
        </p>
        <div className="text-xs text-sky-300 space-y-1">
          <p>📱 1. 在手机上安装 <a href="https://push.i-i.me" target="_blank" rel="noopener noreferrer" className="underline font-medium text-cyan-300">PushMe App</a></p>
          <p>🔑 2. 在 App 中获取推送密钥 (push_key)</p>
          <p>✅ 3. 在下方输入密钥，点击"测试"按钮</p>
          <p>🔔 4. 测试成功后密钥自动保存，启用推送即可</p>
        </div>
      </div>

      {/* 密钥配置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-200 mb-2">
          推送密钥 (push_key)
        </label>
        <input
          type="text"
          value={pushKeyInput}
          onChange={(e) => setPushKeyInput(e.target.value)}
          placeholder="请输入 PushMe App 中获取的密钥"
          className="w-full px-4 py-2 border border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      {/* 代理配置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-200 mb-2">
          代理服务器地址（必填）
        </label>
        <input
          type="text"
          value={proxyUrlInput}
          onChange={(e) => setProxyUrlInput(e.target.value)}
          placeholder="例如: https://push-proxy.xxx.workers.dev"
          className="w-full px-4 py-2 border border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-slate-400">
          💡 需要部署 Cloudflare Workers 代理，详见下方说明
        </p>
      </div>

      {/* 测试按钮 */}
      <div className="mb-6">
        <button
          onClick={handleTestPush}
          disabled={testing || !pushKeyInput || !proxyUrlInput}
          className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          {testing ? '⏳ 测试中...' : '🧪 测试推送'}
        </button>
        {testResult && (
          <div className={`mt-2 p-3 rounded-lg text-sm border ${
            testResult.success 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
          }`}>
            {testResult.success ? '✅ ' : '❌ '}{testResult.message}
          </div>
        )}
        {config.pushKey && !testResult && (
          <div className="mt-2 p-3 bg-slate-900/80 border border-slate-700/60 rounded-lg text-sm text-slate-300">
            当前已保存密钥: <span className="font-mono text-cyan-300">{config.pushKey.substring(0, 8)}...</span>
            <br />
            当前代理: <span className="font-mono text-cyan-300">{config.proxyUrl}</span>
          </div>
        )}
      </div>

      {/* 推送场景配置 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-200 mb-3">推送场景</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(config.scenarios) as (keyof PushScenarios)[]).map((scenario) => {
            const { label, desc, icon } = scenarioLabels[scenario];
            return (
              <label
                key={scenario}
                className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  config.scenarios[scenario]
                    ? 'border-cyan-500/60 bg-cyan-950/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.scenarios[scenario]}
                  onChange={(e) => handleScenarioChange(scenario, e.target.checked)}
                  disabled={!config.enabled || !config.pushKey}
                  className="w-4 h-4 rounded border-sky-500/30 bg-[#0B132B]/80 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                />
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 当前状态 */}
      <div className="p-4 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-slate-300">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">当前状态:</span>
          {config.enabled && config.pushKey ? (
            <span className="text-emerald-400 font-medium">✓ 推送服务已启用</span>
          ) : config.pushKey ? (
            <span className="text-amber-400">○ 已配置密钥，请启用推送</span>
          ) : (
            <span className="text-slate-400">○ 推送服务未配置</span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          启用场景: {
            Object.entries(config.scenarios).filter(([_, v]) => v).length
          } / {Object.keys(config.scenarios).length}
        </div>
      </div>

      {/* 技术说明 */}
      <div className="mt-4 p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
        <p className="font-bold mb-2 text-amber-300">💡 如何部署 Cloudflare Workers 代理：</p>
        <ol className="space-y-1 list-decimal list-inside text-amber-200/90">
          <li>打开 <a href="https://dash.cloudflare.com" target="_blank" className="underline font-medium text-amber-300">Cloudflare Dashboard</a></li>
          <li>左侧菜单 → Workers & Pages → Create Worker</li>
          <li>输入名称（如 push-proxy），点击 Deploy</li>
          <li>点击 Edit code，粘贴以下代码：</li>
        </ol>
        <pre className="mt-2 p-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs overflow-x-auto text-cyan-300 font-mono">
{`export default {
  async fetch(request) {
    if (request.method === 'OPTIONS')
      return new Response(null, {
        headers: {'Access-Control-Allow-Origin':'*'}
      });
    const body = await request.text();
    const r = await fetch('https://push.i-i.me', {
      method: 'POST',
      body: body
    });
    return new Response(await r.text(), {
      headers: {'Access-Control-Allow-Origin':'*'}
    });
  }
};`}
        </pre>
        <p className="mt-2">5. Save and Deploy → 获取 Worker 地址填入上方</p>
      </div>
    </div>
  );
};

export default PushSettings;