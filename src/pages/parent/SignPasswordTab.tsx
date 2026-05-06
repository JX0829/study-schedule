import { useState } from 'react';
import { Card, Button, Icon } from '@/components/ui';

interface SignPasswordTabProps {
  signPassword: string;
  onLogout: () => void;
}

export function SignPasswordTab({ signPassword, onLogout }: SignPasswordTabProps) {
  const [showSignPassword, setShowSignPassword] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Icon name="lock" size={20} />
          今日签字密码
        </h3>

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="text-3xl font-mono px-6 py-3 bg-gray-100 rounded-lg">
            {showSignPassword ? signPassword : '****'}
          </div>
          <button
            onClick={() => setShowSignPassword(!showSignPassword)}
            className="p-3 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
          >
            {showSignPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        <p className="text-gray-500 text-sm text-center mb-4">
          此密码用于孩子端确认任务完成
        </p>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-700 mb-2">💡 签字密码说明</h3>
        <div className="text-sm text-blue-600 space-y-1">
          <p>• 签字密码每天自动生成，4位随机字符</p>
          <p>• 在"今日任务"中可直接点击确认，不需要密码</p>
          <p>• 点击眼睛按钮可以显示/隐藏密码</p>
        </div>
      </Card>

      <div className="pt-4">
        <Button variant="danger" className="w-full" onClick={onLogout}>
          退出登录
        </Button>
      </div>
    </div>
  );
}
