/**
 * 签字密码输入组件
 */

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { usePasswordStore } from '@/store';

interface SignPasswordInputProps {
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
}

export function SignPasswordInput({ onConfirm, onCancel, title = '签字确认' }: SignPasswordInputProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { verifySignPassword } = usePasswordStore.getState();

  const handleConfirm = () => {
    if (verifySignPassword(password)) {
      onConfirm();
      setPassword('');
    } else {
      setError('签字密码错误，请重新输入');
    }
  };

  return (
    <Card className="w-full">
      <h3 className="font-medium text-gray-700 mb-4 text-center">{title}</h3>
      
      {/* 输入签字密码 */}
      <div className="mb-4">
        <input
          type="text"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="请输入家长签字密码"
          maxLength={4}
          className="w-full px-4 py-3 border rounded-lg text-center text-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
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