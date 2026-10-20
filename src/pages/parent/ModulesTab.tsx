import { Card, Icon } from '@/components/ui';
import type { ModuleConfig } from '@/types';

interface ModulesTabProps {
  moduleConfig: ModuleConfig;
  onSetModuleEnabled: (module: keyof ModuleConfig, enabled: boolean) => void;
}

export function ModulesTab({ moduleConfig, onSetModuleEnabled }: ModulesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Icon name="settings" size={20} />
          孩子端模块显示配置
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          勾选孩子端需要显示的模块，未勾选的模块将不在孩子端显示
        </p>

        <div className="space-y-3">
          {/* 任务模块 */}
          <div className="flex items-center justify-between p-3 cosmic-glass-subtle rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-medium text-white font-semibold">任务模块</div>
                <div className="text-slate-400 text-sm">孩子创建、完成任务</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={moduleConfig.tasks}
                onChange={(e) => onSetModuleEnabled('tasks', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:cosmic-glass text-white after:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 积分模块 */}
          <div className="flex items-center justify-between p-3 cosmic-glass-subtle rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-medium text-white font-semibold">积分模块</div>
                <div className="text-slate-400 text-sm">查看积分、申请兑换</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={moduleConfig.points}
                onChange={(e) => onSetModuleEnabled('points', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:cosmic-glass text-white after:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 奖励/抽奖模块 */}
          <div className="flex items-center justify-between p-3 cosmic-glass-subtle rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <div className="font-medium text-white font-semibold">奖励模块</div>
                <div className="text-slate-400 text-sm">抽奖大转盘</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={moduleConfig.rewards}
                onChange={(e) => onSetModuleEnabled('rewards', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:cosmic-glass text-white after:border-sky-500/30 bg-[#0B132B]/80 text-white placeholder-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-700 mb-2">💡 说明</h3>
        <div className="text-sm text-blue-600 space-y-1">
          <p>• 配置实时生效，孩子端刷新页面后即可看到变化</p>
          <p>• 至少需要保留一个模块显示</p>
          <p>• 建议根据孩子年龄和学习阶段调整显示模块</p>
        </div>
      </Card>
    </div>
  );
}
