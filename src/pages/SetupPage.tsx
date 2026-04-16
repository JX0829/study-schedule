/**
 * 初始化设置页面
 */

import { useState } from 'react';
import { Page, Card, Button, Icon } from '@/components';
import { useAppInit } from '@/hooks/useAppInit';
import { useFamilyStore } from '@/store';

interface SetupPageProps {
  onComplete: () => void;
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  
  const { setupFamily } = useAppInit();
  const setCurrentUser = useFamilyStore(state => state.setCurrentUser);

  const handleSubmit = () => {
    if (!familyName || !parentName || !childName) return;
    
    const child = setupFamily(familyName, parentName, childName);
    setCurrentUser(child.id);
    onComplete();
  };

  return (
    <Page showHeader={false}>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            小朋友任务规划
          </h1>
          <p className="text-gray-500">
            科学规划每日任务，积分激励成长
          </p>
        </div>

        {/* 步骤指示 */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${
                s <= step ? 'bg-primary-400' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 表单区域 */}
        <Card className="w-full max-w-sm">
          {step === 1 && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                家庭名称
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="例如：小明的家"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-400 focus:outline-none"
              />
              <Button 
                className="w-full mt-4"
                onClick={() => familyName && setStep(2)}
                disabled={!familyName}
              >
                下一步
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                家长称呼
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="例如：妈妈"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-400 focus:outline-none"
              />
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  上一步
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => parentName && setStep(3)}
                  disabled={!parentName}
                >
                  下一步
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                孩子名字
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例如：小明"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-400 focus:outline-none"
              />
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="secondary"
                  onClick={() => setStep(2)}
                >
                  上一步
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!childName}
                >
                  完成
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 提示 */}
        <p className="text-gray-400 text-sm mt-6 text-center">
          MVP 版本支持单孩子家庭<br/>
          多孩子支持将在后续版本推出
        </p>
      </div>
    </Page>
  );
}