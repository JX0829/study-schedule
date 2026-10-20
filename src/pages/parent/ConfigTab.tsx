import { Card, Button, Icon } from '@/components/ui';
import type { SystemConfig, Family, User } from '@/types';

interface ConfigTabProps {
  pointsConfig: SystemConfig;
  onPointsConfigChange: (config: SystemConfig) => void;
  family: Family | null;
  parent: User | undefined;
  child: User | undefined;
}

export function ConfigTab({ pointsConfig, onPointsConfigChange, family, parent, child }: ConfigTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Icon name="settings" size={20} />
          积分配置
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm">积分上限</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={pointsConfig.pointsLimit}
                onChange={(e) => onPointsConfigChange({ ...pointsConfig, pointsLimit: parseInt(e.target.value) || 300 })}
                className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
              />
              <span className="text-slate-400">分</span>
            </div>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={() => alert('配置已保存')}>
          保存配置
        </Button>
      </Card>

      <Card>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Icon name="team" size={20} />
          家庭信息
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">家庭名称</span>
            <span className="font-medium">{family?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">家长</span>
            <span className="font-medium">{parent?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">孩子</span>
            <span className="font-medium">{child?.name}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
