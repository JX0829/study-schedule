/**
 * 家长端密码登录页面 - 科技极简风格
 */

import { useState, useEffect } from 'react';
import { Page, Card, Button } from '@/components';
import { usePasswordStore } from '@/store';

interface ParentLoginProps {
  onLogin: () => void;
}

export function ParentLoginPage({ onLogin }: ParentLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const verifyPassword = usePasswordStore(state => state.verifyPassword);
  const loadFromStorage = usePasswordStore(state => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const handleLogin = () => {
    if (verifyPassword(password)) {
      onLogin();
    } else {
      setError('密码错误，请重新输入');
    }
  };

  return (
    <Page showHeader={false} theme="parent">
      <div className="flex flex-col items-center justify-center min-h-[82vh] px-4">
        {/* Tech Minimalist Header Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.2)]">
            <span className="text-2xl text-indigo-400 font-mono">⌘</span>
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white flex items-center justify-center gap-2">
            家长管控中枢
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">ADMIN</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono tracking-wide">
            PARENTAL CONTROL CENTER
          </p>
        </div>

        {/* 密码验证卡片 */}
        <Card className="w-full max-w-sm border-slate-700/80 shadow-2xl p-6 bg-slate-900/90">
          <div className="mb-6">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
              安全密码 / PIN
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                maxLength={6}
                autoFocus
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                placeholder="请输入4位访问密码"
                className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-center font-mono text-xl tracking-[0.5em] text-cyan-300 placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
              />
            </div>
            {error && (
              <p className="text-rose-400 text-xs mt-2 font-mono flex items-center gap-1 justify-center">
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <Button 
            className="w-full py-3 text-sm tracking-wider font-semibold"
            onClick={handleLogin}
            disabled={password.length < 4}
          >
            解锁并进入控制台
          </Button>
        </Card>

        {/* 底部极简版本号 */}
        <p className="mt-8 text-[11px] font-mono text-slate-600 tracking-widest">
          STUDYPLAN CORE v2.0 • TECH MINIMAL
        </p>
      </div>
    </Page>
  );
}
