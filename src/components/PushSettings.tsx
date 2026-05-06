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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📬 推送设置
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">推送服务</span>
          <button
            onClick={() => setEnabled(!config.enabled)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              config.enabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.enabled ? '已启用' : '已禁用'}
          </button>
        </div>
      </div>

      {/* PushMe 说明 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>PushMe</strong> 是一个简单轻量的 Android 消息推送客户端。
        </p>
        <div className="text-xs text-blue-600 space-y-1">
          <p>📱 1. 在手机上安装 <a href="https://push.i-i.me" target="_blank" rel="noopener noreferrer" className="underline font-medium">PushMe App</a></p>
          <p>🔑 2. 在 App 中获取推送密钥 (push_key)</p>
          <p>✅ 3. 在下方输入密钥，点击"测试"按钮</p>
          <p>🔔 4. 测试成功后密钥自动保存，启用推送即可</p>
        </div>
      </div>

      {/* 密钥配置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          推送密钥 (push_key)
        </label>
        <input
          type="text"
          value={pushKeyInput}
          onChange={(e) => setPushKeyInput(e.target.value)}
          placeholder="请输入 PushMe App 中获取的密钥"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 代理配置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          代理服务器地址（必填）
        </label>
        <input
          type="text"
          value={proxyUrlInput}
          onChange={(e) => setProxyUrlInput(e.target.value)}
          placeholder="例如: https://push-proxy.xxx.workers.dev"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          💡 需要部署 Cloudflare Workers 代理，详见下方说明
        </p>
      </div>

      {/* 测试按钮 */}
      <div className="mb-6">
        <button
          onClick={handleTestPush}
          disabled={testing || !pushKeyInput || !proxyUrlInput}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
        >
          {testing ? '⏳ 测试中...' : '🧪 测试推送'}
        </button>
        {testResult && (
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            testResult.success ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {testResult.success ? '✅ ' : '❌ '}{testResult.message}
          </div>
        )}
        {config.pushKey && !testResult && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
            当前已保存密钥: <span className="font-mono">{config.pushKey.substring(0, 8)}...</span>
            <br />
            当前代理: <span className="font-mono">{config.proxyUrl}</span>
          </div>
        )}
      </div>

      {/* 推送场景配置 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">推送场景</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(config.scenarios) as (keyof PushScenarios)[]).map((scenario) => {
            const { label, desc, icon } = scenarioLabels[scenario];
            return (
              <label
                key={scenario}
                className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                  config.scenarios[scenario]
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.scenarios[scenario]}
                  onChange={(e) => handleScenarioChange(scenario, e.target.checked)}
                  disabled={!config.enabled || !config.pushKey}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 当前状态 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">当前状态:</span>
          {config.enabled && config.pushKey ? (
            <span className="text-green-600 font-medium">✓ 推送服务已启用</span>
          ) : config.pushKey ? (
            <span className="text-yellow-600">○ 已配置密钥，请启用推送</span>
          ) : (
            <span className="text-gray-500">○ 推送服务未配置</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          启用场景: {
            Object.entries(config.scenarios).filter(([_, v]) => v).length
          } / {Object.keys(config.scenarios).length}
        </div>
      </div>

      {/* 技术说明 */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-xs text-yellow-700">
        <p className="font-bold mb-2">💡 如何部署 Cloudflare Workers 代理：</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>打开 <a href="https://dash.cloudflare.com" target="_blank" className="underline font-medium">Cloudflare Dashboard</a></li>
          <li>左侧菜单 → Workers & Pages → Create Worker</li>
          <li>输入名称（如 push-proxy），点击 Deploy</li>
          <li>点击 Edit code，粘贴以下代码：</li>
        </ol>
        <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-x-auto">
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