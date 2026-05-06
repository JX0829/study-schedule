import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import type { DailyTask } from '@/types';

interface EditTaskModalProps {
  task: DailyTask;
  onSave: (taskId: string, newPoints: number) => void;
  onClose: () => void;
}

export function EditTaskModal({ task, onSave, onClose }: EditTaskModalProps) {
  const [points, setPoints] = useState(String(task.points));

  useEffect(() => {
    setPoints(String(task.points));
  }, [task.points]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-4">
        <h3 className="font-medium text-gray-700 mb-4">✏️ 修改任务积分</h3>
        <div className="mb-4">
          <div className="font-medium mb-2">{task.name}</div>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              const newPoints = parseInt(points);
              if (!isNaN(newPoints)) {
                onSave(task.id, newPoints);
              }
              onClose();
            }}
          >
            保存
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
