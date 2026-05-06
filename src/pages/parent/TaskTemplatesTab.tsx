import { useState } from 'react';
import { Card, Button, Badge, Icon } from '@/components/ui';
import type { TaskType } from '@/types';

// 任务模板 item 类型（本地，非 TaskTemplate from types）
interface TaskTemplateItem {
  id: string;
  familyId: string;
  name: string;
  type: TaskType;
  points: number;
  description?: string;
  isCustom: boolean;
  createdAt: string;
}

interface TaskTemplatesTabProps {
  templates: TaskTemplateItem[];
  familyId: string | undefined;
  onAdd: (template: { familyId: string; name: string; type: TaskType; points: number; isCustom: boolean }) => void;
  onUpdate: (id: string, updates: Partial<TaskTemplateItem>) => void;
  onDelete: (id: string) => void;
  onInitDefaults: () => void;
}

function parseClipboardText(text: string) {
  const lines = text.split('\n').filter((line) => line.trim());
  const result: Array<{ name: string; points: number; type: 'homework' | 'practice' | 'habit' }> = [];

  for (const line of lines) {
    const regex = /^(.+?)[\(\uff08](-?\d+)[\)\uff09](?:[\(\uff08]([^\)\uff09]+)[\)\uff09])?$/;
    const match = line.match(regex);

    if (match) {
      const name = match[1].trim();
      const points = parseInt(match[2]);
      const typeStr = match[3]?.trim() || '';

      if (name && !isNaN(points)) {
        let type: 'homework' | 'practice' | 'habit' = 'habit';
        if (typeStr === '作业' || typeStr === 'homework') type = 'homework';
        else if (typeStr === '练习' || typeStr === 'practice') type = 'practice';
        result.push({ name, points, type });
      }
    }
  }
  return result;
}

export function TaskTemplatesTab({
  templates,
  familyId,
  onAdd,
  onUpdate,
  onDelete,
  onInitDefaults,
}: TaskTemplatesTabProps) {
  // 添加模板
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newType, setNewType] = useState<TaskType>('habit');

  // 编辑模板
  const [editing, setEditing] = useState<TaskTemplateItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editType, setEditType] = useState<TaskType>('habit');

  // 剪切板导入
  const [showClipboardImport, setShowClipboardImport] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{ name: string; points: number; type: 'homework' | 'practice' | 'habit' }>>([]);

  const handleAdd = () => {
    if (!familyId || !newName || !newPoints) return;
    onAdd({
      familyId,
      name: newName,
      type: newType,
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
        type: item.type,
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
        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Icon name="calendar" size={20} />
          任务模板
        </h3>

        {templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map(template => (
              <div key={template.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={template.type === 'homework' ? 'blue' : template.type === 'practice' ? 'purple' : 'success'}>
                      {template.type === 'homework' ? '作业' : template.type === 'practice' ? '练习' : '习惯'}
                    </Badge>
                    <Badge color={template.points < 0 ? 'danger' : 'primary'}>{template.points}分</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditing(template);
                    setEditName(template.name);
                    setEditPoints(String(template.points));
                    setEditType(template.type);
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
            <Icon name="calendar" size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">暂无任务模板</p>
            <Button onClick={onInitDefaults}>
              导入默认模板
            </Button>
          </div>
        )}
      </Card>

      {/* 添加任务模板 */}
      {showAdd ? (
        <Card>
          <h3 className="font-medium text-gray-700 mb-3">添加任务模板</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="任务名称"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-gray-500 text-sm">分值</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 text-sm">类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TaskType)}
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                >
                  <option value="homework">作业</option>
                  <option value="practice">练习</option>
                  <option value="habit">习惯</option>
                </select>
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
            + 添加任务模板
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setShowClipboardImport(true)}>
            📋 剪切板批量导入
          </Button>
        </div>
      )}

      {/* 剪切板导入 */}
      {showClipboardImport && (
        <Card>
          <h3 className="font-medium text-gray-700 mb-3">📋 剪切板批量导入</h3>
          <p className="text-gray-500 text-sm mb-3">
            格式：名称(分值)(类型)
          </p>
          <textarea
            value={clipboardText}
            onChange={(e) => {
              setClipboardText(e.target.value);
              setImportPreview(parseClipboardText(e.target.value));
            }}
            placeholder="完成作业(10)(作业)\n晨读(5)(习惯)\n课外阅读(8)(练习)"
            className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
          />

          {importPreview.length > 0 && (
            <div className="mt-3">
              <div className="border rounded-lg p-2 bg-gray-50">
                <p className="text-gray-500 text-sm mb-2">
                  预览（{importPreview.length} 个任务）：
                </p>
                <div className="max-h-[200px] overflow-y-auto">
                  {importPreview.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span className="text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge color="primary">+{item.points}分</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={handleClipboardImport} disabled={importPreview.length === 0}>
              导入 {importPreview.length > 0 && `(${importPreview.length}个)`}
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
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h3 className="font-medium text-gray-700 mb-4">✏️ 修改任务模板</h3>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="任务名称"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-gray-500 text-sm">分值</label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-gray-500 text-sm">类型</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                  >
                    <option value="homework">作业</option>
                    <option value="practice">练习</option>
                    <option value="habit">习惯</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => {
                onUpdate(editing.id, {
                  name: editName,
                  points: parseInt(editPoints),
                  type: editType,
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
