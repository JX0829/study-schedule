import { useState } from 'react';
import { Card, Button, Badge, Icon } from '@/components/ui';
import type { RedemptionRecord, Reward, User } from '@/types';

interface RedemptionTabProps {
  pendingRedemptions: RedemptionRecord[];
  processedRedemptions: RedemptionRecord[];
  users: User[];
  rewards: Reward[];
  parent: User | undefined;
  onApprove: (redemptionId: string, confirmedBy: string) => void;
  onReject: (redemptionId: string, reason: string) => void;
}

export function RedemptionTab({
  pendingRedemptions,
  processedRedemptions,
  users,
  rewards,
  parent,
  onApprove,
  onReject,
}: RedemptionTabProps) {
  const [rejectingRedemptionId, setRejectingRedemptionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Icon name="gift" size={20} />
          待审批的兑换申请
        </h3>

        {pendingRedemptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无待审批的兑换申请</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRedemptions.map((redemption) => {
              const child = users.find(u => u.id === redemption.childId);
              const reward = rewards.find(r => r.id === redemption.rewardId);
              const lockedTime = new Date(redemption.lockedAt);

              return (
                <div key={redemption.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">
                        {redemption.rewardId === 'custom_points'
                          ? `${redemption.pointsCost}积分`
                          : reward?.name || '未知奖励'}
                      </div>
                      <div className="text-sm text-gray-500">
                        申请者：{child?.name || '孩子'}
                      </div>
                    </div>
                    <Badge color="primary">待审批</Badge>
                  </div>

                  <div className="text-sm text-gray-500 mb-3">
                    申请时间：{lockedTime.toLocaleString()}
                  </div>

                  {rejectingRedemptionId === redemption.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="请输入驳回原因"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (!rejectReason.trim()) {
                              alert('请输入驳回原因');
                              return;
                            }
                            onReject(redemption.id, rejectReason);
                            setRejectReason('');
                            setRejectingRedemptionId(null);
                          }}
                        >
                          确认驳回
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRejectReason('');
                            setRejectingRedemptionId(null);
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!parent) return;
                          onApprove(redemption.id, parent.id);
                        }}
                      >
                        ✓ 批准
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectingRedemptionId(redemption.id)}
                      >
                        ✗ 驳回
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 已处理的兑换记录 */}
      {processedRedemptions.length > 0 && (
        <Card>
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="history" size={20} />
            已处理的兑换记录
          </h3>
          <div className="space-y-2">
            {processedRedemptions
              .sort((a, b) => new Date(b.confirmedAt || b.lockedAt).getTime() - new Date(a.confirmedAt || a.lockedAt).getTime())
              .slice(0, 10)
              .map((redemption) => {
                const child = users.find(u => u.id === redemption.childId);
                const reward = rewards.find(r => r.id === redemption.rewardId);
                const processTime = new Date(redemption.confirmedAt || redemption.lockedAt);

                return (
                  <div key={redemption.id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">
                        {redemption.rewardId === 'custom_points'
                          ? `${redemption.pointsCost}积分`
                          : reward?.name || '未知奖励'}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        - {child?.name || '孩子'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={redemption.status === 'approved' ? 'success' : 'danger'}>
                        {redemption.status === 'approved' ? '已批准' : '已驳回'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {processTime.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}
