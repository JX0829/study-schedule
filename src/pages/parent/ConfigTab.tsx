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
        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Icon name="settings" size={20} />
          积分配置
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-gray-500 text-sm">积分上限</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={pointsConfig.pointsLimit}
                onChange={(e) => onPointsConfigChange({ ...pointsConfig, pointsLimit: parseInt(e.target.value) || 300 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <span className="text-gray-500">分</span>
            </div>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={() => alert('配置已保存')}>
          保存配置
        </Button>
      </Card>

      <Card>
        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Icon name="team" size={20} />
          家庭信息
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">家庭名称</span>
            <span className="font-medium">{family?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">家长</span>
            <span className="font-medium">{parent?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">孩子</span>
            <span className="font-medium">{child?.name}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
