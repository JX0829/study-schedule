/**
 * 家长端 App
 */

import { useState, useEffect } from 'react';
import { SetupPage } from '@/pages';
import { ParentPage } from '@/pages/ParentPage';
import { useAppInit } from '@/hooks/useAppInit';

function AppParent() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { needsSetup } = useAppInit();

  useEffect(() => {
    if (!needsSetup) {
      setIsSetupComplete(true);
    }
  }, [needsSetup]);

  if (!isSetupComplete) {
    return <SetupPage onComplete={() => setIsSetupComplete(true)} />;
  }

  return <ParentPage />;
}

export default AppParent;