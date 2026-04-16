/**
 * 签字密码输入组件
 */

import { useState } from 'react';
import { Button, Card } from '@/components/ui';

interface SignPasswordInputProps {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
}

export function SignPasswordInput({ onConfirm, onCancel, title = '签字确认' }: SignPasswordInputProps) {
  const [password, setPassword] = useState('');
  const [showSignPassword, setShowSignPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { getSignPassword, verifySignPassword } = usePasswordStore.getState();
  const signPassword = getSignPassword();

  const handleConfirm = () => {
    if (verifySignPassword(password)) {
      onConfirm();
      setPassword('');
    } else {
      setError('签字密码错误，请重新输入');
    }
  };

  return (
    <Card className="max-w-sm mx-auto">
      <h3 className="font-medium text-gray-700 mb-4 text-center">{title}</h3>
      
      {/* 今日签字密码显示 */}
      <div className="mb-4">
        <label className="text-gray-500 text-sm block mb-1">今日签字密码</label>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-lg font-mono flex-1">
            {showSignPassword ? signPassword : '****'}
          </div>
          <button
            onClick={() => setShowSignPassword(!showSignPassword)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            {showSignPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>
      
      {/* 输入签字密码 */}
      <div className="mb-4">
        <label className="text-gray-500 text-sm block mb-1">输入签字密码确认</label>
        <input
          type="text"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="请输入4位签字密码"
          maxLength={4}
          className="w-full px-4 py-2 border rounded-lg text-center text-lg font-mono uppercase"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            取消
          </Button>
        )}
        <Button onClick={handleConfirm} className="flex-1" disabled={password.length !== 4}>
          确认签字
        </Button>
      </div>
    </Card>
  );
}

// 需要导入 usePasswordStore
import { usePasswordStore } from '@/store';