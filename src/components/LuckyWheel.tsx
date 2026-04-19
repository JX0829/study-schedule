/**
 * 抽奖转盘组件
 */

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '@/components';
import { usePointsStore, useFamilyStore } from '@/store';

interface Prize {
  id: string;
  name: string;
  points: number;
  probability: number;
}

interface LuckyWheelProps {
  onSpinComplete?: (prize: Prize) => void;
}

export function LuckyWheel({ onSpinComplete }: LuckyWheelProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [remainingSpins, setRemainingSpins] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const targetRotationRef = useRef(0);
  const animationRef = useRef<number>(0);
  
  const earnPoints = usePointsStore(state => state.earnPoints);
  const getChildPoints = usePointsStore(state => state.getChildPoints);
  const users = useFamilyStore(state => state.users);
  
  const child = users.find(u => u.role === 'child');
  const childPointData = child ? getChildPoints(child.id) : null;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  // 绘制转盘
  const drawWheel = (currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const anglePerPrize = (2 * Math.PI) / prizes.length;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制扇区
    prizes.forEach((prize, index) => {
      const startAngle = currentRotation + index * anglePerPrize;
      const endAngle = startAngle + anglePerPrize;
      
      // 扇区
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 文字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerPrize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(prize.name, radius - 20, 5);
      ctx.restore();
    });
    
    // 中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  // 动画循环
  const animate = (target: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const current = rotation;
    const diff = target - current;
    
    if (Math.abs(diff) < 0.5) {
      setRotation(target);
      drawWheel(target);
      return;
    }
    
    // 缓动动画
    const eased = current + diff * 0.1;
    setRotation(eased);
    drawWheel(eased);
    animationRef.current = requestAnimationFrame(() => animate(target));
  };

  useEffect(() => {
    // 加载奖品配置
    const savedPrizes = localStorage.getItem('prizes');
    if (savedPrizes) {
      setPrizes(JSON.parse(savedPrizes));
    } else {
      const defaultPrizes = [
        { id: '1', name: '再来一次', points: 0, probability: 30 },
        { id: '2', name: '5积分', points: 5, probability: 25 },
        { id: '3', name: '10积分', points: 10, probability: 20 },
        { id: '4', name: '20积分', points: 20, probability: 15 },
        { id: '5', name: '50积分', points: 50, probability: 8 },
        { id: '6', name: '100积分', points: 100, probability: 2 },
      ];
      setPrizes(defaultPrizes);
      localStorage.setItem('prizes', JSON.stringify(defaultPrizes));
    }
    
    // 检查今天剩余抽奖次数
    const today = new Date().toDateString();
    const lastSpinDate = localStorage.getItem('lastSpinDate');
    const lastSpinCount = parseInt(localStorage.getItem('lastSpinCount') || '0');
    const dailySpinCount = parseInt(localStorage.getItem('dailySpinCount') || '1');
    
    if (lastSpinDate !== today) {
      localStorage.setItem('lastSpinDate', today);
      localStorage.setItem('lastSpinCount', '0');
      setRemainingSpins(dailySpinCount);
      setCanSpin(dailySpinCount > 0);
    } else {
      const remaining = Math.max(0, dailySpinCount - lastSpinCount);
      setRemainingSpins(remaining);
      setCanSpin(remaining > 0);
    }
  }, []);

  useEffect(() => {
    if (prizes.length > 0) {
      drawWheel(rotation);
    }
    
    // 检查今天剩余抽奖次数
    const today = new Date().toDateString();
    const lastSpinDate = localStorage.getItem('lastSpinDate');
    const lastSpinCount = parseInt(localStorage.getItem('lastSpinCount') || '0');
    const dailySpinCount = parseInt(localStorage.getItem('dailySpinCount') || '1');
    
    if (lastSpinDate !== today) {
      // 新的一天，重置抽奖次数
      localStorage.setItem('lastSpinDate', today);
      localStorage.setItem('lastSpinCount', '0');
      setRemainingSpins(dailySpinCount);
      setCanSpin(dailySpinCount > 0);
    } else {
      // 同一天，检查剩余次数
      const remaining = Math.max(0, dailySpinCount - lastSpinCount);
      setRemainingSpins(remaining);
      setCanSpin(remaining > 0);
    }
  }, [prizes, rotation]);

  const handleSpin = () => {
    if (isSpinning || !canSpin || prizes.length === 0) return;

    // 根据概率随机选择奖品
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPrize = prizes[0];
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        selectedPrize = prize;
        break;
      }
    }

    setIsSpinning(true);
    setResult(null);

    // 计算目标角度 - 让指针指向奖品的中心
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const anglePerPrize = 360 / prizes.length;
    
    // 目标：让奖品的中心转到12点钟方向（-90度）
    // 需要旋转：360 * 5圈 + 奖品的中心角度 - 当前的旋转角度
    const targetAngle = rotation + 360 * 5 + (360 - prizeIndex * anglePerPrize - anglePerPrize / 2);
    targetRotationRef.current = targetAngle;
    
    // 启动动画
    animationRef.current = requestAnimationFrame(() => animate(targetAngle));

    // 动画结束后显示结果
    setTimeout(() => {
      setIsSpinning(false);
      setResult(selectedPrize);
      
      // 记录今天已抽奖次数
      const today = new Date().toDateString();
      localStorage.setItem('lastSpinDate', today);
      const currentCount = parseInt(localStorage.getItem('lastSpinCount') || '0');
      const dailySpinCount = parseInt(localStorage.getItem('dailySpinCount') || '1');
      localStorage.setItem('lastSpinCount', String(currentCount + 1));
      
      // 检查是否还有剩余次数
      setCanSpin(currentCount + 1 < dailySpinCount);
      
      // 发放积分
      if (child && selectedPrize.points > 0) {
        earnPoints(child.id, selectedPrize.points, '', `抽奖奖励: ${selectedPrize.name}`);
      }
      
      onSpinComplete?.(selectedPrize);
    }, 4000);
  };

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* 当前积分显示 */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="text-center py-4">
          <div className="text-4xl font-bold">{childPointData?.balance || 0}</div>
          <div className="text-primary-100">当前积分</div>
        </div>
      </Card>

      {/* 转盘 */}
      <Card>
        <div className="relative w-72 h-72 mx-auto mb-4">
          {/* 指针 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-30" style={{ zIndex: 30 }}>
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-16 border-transparent border-t-primary-600"></div>
          </div>
          
          {/* 转盘 Canvas */}
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="w-full h-full rounded-full"
          />
          
          {/* 中心按钮 */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || !canSpin}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary-600 flex items-center justify-center text-primary-600 font-bold text-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-20"
          >
            {isSpinning ? '...' : canSpin ? `抽奖
${remainingSpins}次` : '明天'}
          </button>
        </div>

        {/* 结果显示 */}
        {result && (
          <div className="text-center py-4 bg-green-50 rounded-lg mb-4">
            <div className="text-2xl mb-2">🎉</div>
            <div className="text-xl font-bold text-green-600">
              {result.points > 0 ? `获得 ${result.points} 积分！` : result.name}
            </div>
            <div className="text-gray-500 text-sm mt-2">
              {result.points > 0 ? `积分已发放到账户` : '积分不变，明天再来！'}
            </div>
          </div>
        )}

        {/* 抽奖说明 */}
        <div className="text-center text-gray-500 text-sm">
          <p>🎰 每天可以抽奖一次</p>
          <p>💪 完成任务可获得抽奖机会</p>
        </div>
      </Card>

      {/* 奖品列表 */}
      <Card>
        <h3 className="font-medium text-gray-700 mb-3">奖品列表</h3>
        <div className="space-y-2">
          {prizes.map((prize, index) => (
            <div key={prize.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ background: colors[index % colors.length] }}
                ></div>
                <span className="text-gray-700">{prize.name}</span>
              </div>
              <Badge color="primary">{prize.probability}%</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
