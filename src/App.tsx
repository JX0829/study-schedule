import { useState, useEffect } from 'react';
import { SetupPage, HomePage } from '@/pages';
import { ErrorBoundary } from '@/components';
import { useAppInit } from '@/hooks/useAppInit';

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { needsSetup, isLoading } = useAppInit();

  useEffect(() => {
    // 等待数据加载完成后再检查是否需要设置
    if (!isLoading && !needsSetup) {
      setIsSetupComplete(true);
    }
  }, [isLoading, needsSetup]);

  // 加载中显示等待界面
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">正在加载...</div>
    </div>;
  }

  if (!isSetupComplete) {
    return <SetupPage onComplete={() => setIsSetupComplete(true)} />;
  }

  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}

export default App;