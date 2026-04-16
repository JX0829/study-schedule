import { useState, useEffect } from 'react';
import { SetupPage, HomePage } from '@/pages';
import { useAppInit } from '@/hooks/useAppInit';

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { needsSetup } = useAppInit();

  useEffect(() => {
    // 检查是否需要设置
    if (!needsSetup) {
      setIsSetupComplete(true);
    }
  }, [needsSetup]);

  if (!isSetupComplete) {
    return <SetupPage onComplete={() => setIsSetupComplete(true)} />;
  }

  return <HomePage />;
}

export default App;