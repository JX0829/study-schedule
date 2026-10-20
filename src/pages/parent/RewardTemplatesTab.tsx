import { useState } from 'react';
import { Card, Button, Badge, Icon } from '@/components/ui';

interface RewardTemplateItem {
  id: string;
  familyId: string;
  name: string;
  points: number;
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

interface RewardTemplatesTabProps {
  templates: RewardTemplateItem[];
  familyId: string | undefined;
  onAdd: (template: { familyId: string; name: string; points: number; isCustom: boolean }) => void;
  onUpdate: (id: string, updates: Partial<RewardTemplateItem>) => void;
  onDelete: (id: string) => void;
  onInitDefaults: () => void;
}

function parseClipboardText(text: string) {
  const lines = text.split('\n').filter((line) => line.trim());
  const result: Array<{ name: string; points: number }> = [];

  for (const line of lines) {
    const regex = /^(.+?)[\(\uff08](-?\d+)[\)\uff09](?:[\(\uff08]([^\)\uff09]+)[\)\uff09])?$/;
    const match = line.match(regex);

    if (match) {
      const name = match[1].trim();
      const points = parseInt(match[2]);

      if (name && !isNaN(points)) {
        result.push({ name, points });
      }
    }
  }
  return result;
}

export function RewardTemplatesTab({
  templates,
  familyId,
  onAdd,
  onUpdate,
  onDelete,
  onInitDefaults,
}: RewardTemplatesTabProps) {
  // 添加模板
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('');

  // 编辑模板
  const [editing, setEditing] = useState<RewardTemplateItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPoints, setEditPoints] = useState('');

  // 剪切板导入
  const [showClipboardImport, setShowClipboardImport] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{ name: string; points: number }>>([]);

  const handleAdd = () => {
    if (!familyId || !newName || !newPoints) return;
    onAdd({
      familyId,
      name: newName,
      points: parseInt(newPoints),
      isCustom: true,
    });
    setNewName('');
    setNewPoints('');
    setShowAdd(false);
  };

  const handleClipboardImport = () => {
    if (!familyId || importPreview.length === 0) return;
    importPreview.forEach((item) => {
      onAdd({
        familyId,
        name: item.name,
        points: item.points,
        isCustom: true,
      });
    });
    setShowClipboardImport(false);
    setClipboardText('');
    setImportPreview([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Icon name="star" size={20} />
          奖惩模板
        </h3>

        {templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map(template => (
              <div key={template.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{template.name}</div>
                  <Badge color={template.points > 0 ? 'success' : 'danger'}>
                    {template.points > 0 ? `+${template.points}` : template.points}分
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditing(template);
                    setEditName(template.name);
                    setEditPoints(String(template.points));
                  }}>
                    ✏️
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(template.id)}>
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="star" size={40} className="text-gray-300 mb-3" />
            <p className="text-slate-400 mb-4">暂无奖惩模板</p>
            <Button onClick={onInitDefaults}>
              导入默认模板
            </Button>
          </div>
        )}
      </Card>

      {/* 添加奖惩模板 */}
      {showAdd ? (
        <Card>
          <h3 className="font-medium text-white mb-3">添加奖惩模板</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="奖惩名称"
              className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-slate-400 text-sm">分值</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="10 或 -5"
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>添加</Button>
              <Button variant="secondary" onClick={() => setShowAdd(false)}>
                取消
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          <Button className="w-full" onClick={() => setShowAdd(true)}>
            + 添加奖惩模板
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setShowClipboardImport(true)}>
            📋 剪切板批量导入
          </Button>
        </div>
      )}

      {/* 剪切板导入 */}
      {showClipboardImport && (
        <Card>
          <h3 className="font-medium text-white mb-3">📋 剪切板批量导入</h3>
          <p className="text-slate-400 text-sm mb-3">格式：名称(分值)</p>
          <textarea
            value={clipboardText}
            onChange={(e) => {
              setClipboardText(e.target.value);
              setImportPreview(parseClipboardText(e.target.value));
            }}
            placeholder="考试进步(20)\n迟到(-5)"
            className="w-full px-3 py-2 border rounded-lg min-h-[120px] text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
          />

          {importPreview.length > 0 && (
            <div className="mt-3">
              <div className="border rounded-lg p-2 cosmic-glass-subtle">
                <p className="text-slate-400 text-sm mb-2">
                  预览（{importPreview.length} 个）：
                </p>
                {importPreview.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-white">{item.name}</span>
                    <Badge color={item.points > 0 ? 'success' : 'danger'}>
                      {item.points > 0 ? `+${item.points}` : item.points}分
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={handleClipboardImport} disabled={importPreview.length === 0}>
              导入
            </Button>
            <Button variant="ghost" onClick={() => setShowClipboardImport(false)}>
              取消
            </Button>
          </div>
        </Card>
      )}

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cosmic-glass text-white rounded-lg max-w-sm w-full p-4">
            <h3 className="font-medium text-white mb-4">✏️ 修改奖惩模板</h3>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="奖惩名称"
                className="w-full px-3 py-2 border rounded-lg text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
              />
              <div>
                <label className="text-slate-400 text-sm">分值（正数奖励，负数惩罚）</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-white bg-[#0B132B]/80 border-sky-500/30 placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => {
                onUpdate(editing.id, {
                  name: editName,
                  points: parseInt(editPoints),
                });
                setEditing(null);
              }}>保存</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>取消</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
