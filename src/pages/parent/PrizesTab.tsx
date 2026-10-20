import { useState, useEffect } from 'react';
import { Card, Button, Badge, Icon } from '@/components/ui';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface PrizeConfig {
  id: string;
  name: string;
  points: number;
  probability: number;
}

interface LuckyWheelState {
  lastSpinDate?: string;
  lastSpinCount?: number;
  dailySpinCount?: number;
}

interface PrizesTabProps {}

export function PrizesTab(_props: PrizesTabProps) {
  const [prizes, setPrizes] = useState<PrizeConfig[]>([]);
  const [dailySpinCount, setDailySpinCount] = useState(1);
  const [showAddPrize, setShowAddPrize] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizePoints, setNewPrizePoints] = useState('');
  const [newPrizeProbability, setNewPrizeProbability] = useState('');

  // 奖品编辑
  const [editingPrize, setEditingPrize] = useState<PrizeConfig | null>(null);
  const [editPrizeName, setEditPrizeName] = useState('');
  const [editPrizePoints, setEditPrizePoints] = useState('');
  const [editPrizeProbability, setEditPrizeProbability] = useState('');

  // 加载奖品配置
  useEffect(() => {
    const savedPrizes = storage.get<PrizeConfig[]>(STORAGE_KEYS.LUCKY_WHEEL_PRIZES);
    if (savedPrizes && savedPrizes.length > 0) {
      setPrizes(savedPrizes);
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
      storage.set(STORAGE_KEYS.LUCKY_WHEEL_PRIZES, defaultPrizes);
    }

    const savedState = storage.get<LuckyWheelState>(STORAGE_KEYS.LUCKY_WHEEL_STATE);
    if (savedState?.dailySpinCount) {
      setDailySpinCount(savedState.dailySpinCount);
    }
  }, []);

  const handleAddPrize = () => {
    if (!newPrizeName || !newPrizePoints || !newPrizeProbability) return;
    const newPrize = {
      id: Date.now().toString(),
      name: newPrizeName,
      points: parseInt(newPrizePoints),
      probability: parseInt(newPrizeProbability),
    };
    const updated = [...prizes, newPrize];
    setPrizes(updated);
    storage.set(STORAGE_KEYS.LUCKY_WHEEL_PRIZES, updated);
    setNewPrizeName('');
    setNewPrizePoints('');
    setNewPrizeProbability('');
    setShowAddPrize(false);
  };

  const handleDeletePrize = (id: string) => {
    const updated = prizes.filter(p => p.id !== id);
    setPrizes(updated);
    storage.set(STORAGE_KEYS.LUCKY_WHEEL_PRIZES, updated);
  };

  const handleSaveDailySpinCount = (count: number) => {
    setDailySpinCount(count);
    const savedState = storage.get<LuckyWheelState>(STORAGE_KEYS.LUCKY_WHEEL_STATE) || { dailySpinCount: 1 };
    storage.set(STORAGE_KEYS.LUCKY_WHEEL_STATE, { ...savedState, dailySpinCount: count });
  };

  const handleUpdatePrize = () => {
    if (!editingPrize || !editPrizeName || !editPrizePoints || !editPrizeProbability) return;
    const updated = prizes.map(p =>
      p.id === editingPrize.id
        ? { ...p, name: editPrizeName, points: parseInt(editPrizePoints), probability: parseInt(editPrizeProbability) }
        : p
    );
    setPrizes(updated);
    storage.set(STORAGE_KEYS.LUCKY_WHEEL_PRIZES, updated);
    setEditingPrize(null);
  };

  const probabilitySum = prizes.reduce((sum, p) => sum + p.probability, 0);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Icon name="gift" size={20} />
          抽奖奖品配置
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          配置抽奖大转盘的奖品，中奖概率总和应为100%
        </p>

        {/* 每日抽奖次数配置 */}
        <div className="bg-[#0B132B]/80 border border-sky-500/30 rounded-xl p-3.5 mb-4 shadow-[inset_0_0_12px_rgba(0,240,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">每日抽奖次数</div>
              <div className="text-slate-400 text-xs mt-0.5">当天有效，过期作废</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60 w-8 h-8 p-0 flex items-center justify-center font-bold"
                onClick={() => handleSaveDailySpinCount(Math.max(1, dailySpinCount - 1))}
              >-</Button>
              <span className="text-xl font-orbitron font-bold text-cyan-300 w-8 text-center">{dailySpinCount}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60 w-8 h-8 p-0 flex items-center justify-center font-bold"
                onClick={() => handleSaveDailySpinCount(dailySpinCount + 1)}
              >+</Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {prizes.map(prize => (
            <div key={prize.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{prize.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={prize.points > 0 ? 'success' : 'gray'}>
                    {prize.points > 0 ? `+${prize.points}分` : prize.points === 0 ? '再来一次' : `${prize.points}分`}
                  </Badge>
                  <Badge color="primary">{prize.probability}%</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditingPrize(prize);
                  setEditPrizeName(prize.name);
                  setEditPrizePoints(String(prize.points));
                  setEditPrizeProbability(String(prize.probability));
                }}>
                  ✏️
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeletePrize(prize.id)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">概率总和: {probabilitySum}%</span>
          {probabilitySum !== 100 && (
            <Badge color="danger">应为100%</Badge>
          )}
        </div>
      </Card>

      {/* 添加奖品 */}
      {showAddPrize ? (
        <Card>
          <h3 className="font-medium text-white mb-3">添加奖品</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              placeholder="奖品名称（如：10积分）"
              className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-slate-400 text-sm">积分</label>
                <input
                  type="number"
                  value={newPrizePoints}
                  onChange={(e) => setNewPrizePoints(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-slate-400 text-sm">概率%</label>
                <input
                  type="number"
                  value={newPrizeProbability}
                  onChange={(e) => setNewPrizeProbability(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPrize}>添加</Button>
              <Button variant="secondary" onClick={() => setShowAddPrize(false)}>取消</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button className="w-full" onClick={() => setShowAddPrize(true)}>+ 添加奖品</Button>
      )}

      {/* 奖品编辑弹窗 */}
      {editingPrize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cosmic-glass text-white rounded-lg max-w-sm w-full p-4">
            <h3 className="font-medium text-white mb-4">✏️ 修改奖品</h3>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={editPrizeName}
                onChange={(e) => setEditPrizeName(e.target.value)}
                placeholder="奖品名称"
                className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-slate-400 text-sm">积分</label>
                  <input
                    type="number"
                    value={editPrizePoints}
                    onChange={(e) => setEditPrizePoints(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-slate-400 text-sm">概率%</label>
                  <input
                    type="number"
                    value={editPrizeProbability}
                    onChange={(e) => setEditPrizeProbability(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdatePrize}>保存</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditingPrize(null)}>取消</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
