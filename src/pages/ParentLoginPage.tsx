/**
 * 家长端密码登录页面
 */

import { useState, useEffect } from 'react';
import { Page, Card, Button } from '@/components';
import { usePasswordStore } from '@/store';

interface ParentLoginProps {
  onLogin: () => void;
}

export function ParentLoginPage({ onLogin }: ParentLoginProps) {
  const [step, setStep] = useState<'check' | 'create' | 'login'>('check');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const parentPassword = usePasswordStore(state => state.parentPassword);
  const initPassword = usePasswordStore(state => state.initPassword);
  const verifyPassword = usePasswordStore(state => state.verifyPassword);
  const loadFromStorage = usePasswordStore(state => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    if (parentPassword) {
      setStep('login');
    } else {
      setStep('create');
    }
  }, []);

  // 创建密码
  const handleCreatePassword = () => {
    if (password.length < 4) {
      setError('密码至少4位');
      return;
    }
    initPassword(password);
    onLogin();
  };

  // 登录验证
  const handleLogin = () => {
    if (verifyPassword(password)) {
      onLogin();
    } else {
      setError('密码错误');
    }
  };

  return (
    <Page showHeader={false}>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            家长端
          </h1>
          <p className="text-gray-500">
            小朋友任务规划系统
          </p>
        </div>

        {/* 创建密码 */}
        {step === 'create' && (
          <Card className="w-full max-w-sm">
            <h3 className="font-medium text-gray-700 mb-4 text-center">
              创建登录密码
            </h3>
            <p className="text-gray-500 text-sm mb-4 text-center">
              首次使用，请设置家长登录密码
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="请设置密码（至少4位）"
              className="w-full px-4 py-3 border rounded-lg mb-2"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <Button 
              className="w-full mt-4"
              onClick={handleCreatePassword}
              disabled={password.length < 4}
            >
              创建密码并进入
            </Button>
            
            <p className="text-gray-400 text-xs mt-4 text-center">
              此密码用于保护家长设置，请妥善保管
            </p>
          </Card>
        )}

        {/* 登录验证 */}
        {step === 'login' && (
          <Card className="w-full max-w-sm">
            <h3 className="font-medium text-gray-700 mb-4 text-center">
              输入密码登录
            </h3>
            
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="请输入家长密码"
              className="w-full px-4 py-3 border rounded-lg mb-2"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <Button 
              className="w-full mt-4"
              onClick={handleLogin}
            >
              登录
            </Button>
            
            <p className="text-gray-400 text-xs mt-4 text-center">
              忘记密码？清除浏览器数据重置
            </p>
          </Card>
        )}
      </div>
    </Page>
  );
}