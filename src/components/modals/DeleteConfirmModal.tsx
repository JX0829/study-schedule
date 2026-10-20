import { Button } from '@/components/ui';

interface DeleteConfirmModalProps {
  taskName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({ taskName, onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="cosmic-glass text-white rounded-lg max-w-sm w-full p-4">
        <h3 className="font-medium text-white mb-4">🗑️ 确认删除</h3>
        <p className="text-slate-400 mb-4">
          确定要删除任务 "{taskName}" 吗？
        </p>
        <div className="flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
          >
            删除
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
