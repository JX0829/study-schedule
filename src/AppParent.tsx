/**
 * 家长端 App - 增加密码验证
 */

import { useState, useEffect } from 'react';
import { SetupPage, ParentPage, ParentLoginPage } from '@/pages';
import { useAppInit } from '@/hooks/useAppInit';

function AppParent() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { needsSetup, family } = useAppInit();

  useEffect(() => {
    if (!needsSetup && family) {
      setIsSetupComplete(true);
    }
  }, [needsSetup, family]);

  // 需要先初始化家庭
  if (!isSetupComplete) {
    return <SetupPage onComplete={() => setIsSetupComplete(true)} />;
  }

  // 需要登录验证
  if (!isLoggedIn) {
    return <ParentLoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // 进入家长端
  return <ParentPage />;
}

export default AppParent;