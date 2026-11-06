import type { ReactNode } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  GitBranch,
  Pencil,
  Quote,
  Target,
  Trash2,
} from 'lucide-react-native';

import { AppButton } from '@/components/common/AppButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { colors, entityTones } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { formatChineseDate } from '@/utils/date';

interface NodeDetailSheetProps {
  entityId: string | null;
  onClose: () => void;
  onEdit: (entityId: string) => void;
  onOpenGoal: (goalId: string) => void;
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }}>
      {icon}
      <Text style={{ fontSize: 11.5, color: colors.textSecondary, width: 62 }}>{label}</Text>
      <Text style={{ fontSize: 11.5, color: colors.text, flex: 1 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function NodeDetailSheet({ entityId, onClose, onEdit, onOpenGoal }: NodeDetailSheetProps) {
  const entity = useAppStore((state) =>
    state.entities.find((item) => item.id === entityId),
  );
  const entities = useAppStore((state) => state.entities);
  const relations = useAppStore((state) => state.relations);
  const memories = useAppStore((state) => state.memories);
  const deleteEntity = useAppStore((state) => state.deleteEntity);

  const goal = useAppStore((state) =>
    entity?.goalId ? state.goals.find((item) => item.id === entity.goalId) : undefined,
  );
  const sourceMemory = memories.find((memory) => memory.id === entity?.sourceMemoryId);

  if (!entity) {
    return <BottomSheet visible={false} onClose={onClose}>{null}</BottomSheet>;
  }

  const tone = entityTones[entity.type];
  const related = relations.filter(
    (relation) => relation.sourceId === entity.id || relation.targetId === entity.id,
  );

  const confirmDelete = () => {
    Alert.alert(
      '删除这个节点？',
      '关联目标与关系会一起移除，这个操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            deleteEntity(entity.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <BottomSheet visible={Boolean(entityId)} onClose={onClose} title="记忆节点">
      <View style={{ gap: 16, paddingBottom: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: radius.lg,
            backgroundColor: tone.soft,
          }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: tone.color,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: tone.color }}>
              {entity.type === 'self' ? '我' : entity.name.slice(0, 1)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              {entity.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  backgroundColor: colors.card,
                }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: tone.color }}>
                  {tone.label}
                </Text>
              </View>
              {entity.confirmed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 size={11} color={colors.success} strokeWidth={2} />
                  <Text style={{ fontSize: 10, color: colors.success }}>已确认</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 10, color: colors.warning }}>待确认</Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>描述</Text>
          <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 20.5 }}>
            {entity.description || '还没有补充描述。'}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <GitBranch size={13} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>
              关联关系
            </Text>
          </View>
          {related.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>暂无关联</Text>
          ) : (
            related.map((relation) => {
              const from = entities.find((item) => item.id === relation.sourceId);
              const to = entities.find((item) => item.id === relation.targetId);
              return (
                <View
                  key={relation.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 5,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: radius.md,
                    backgroundColor: '#FAFAFE',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text style={{ fontSize: 11.5, color: colors.textSecondary }}>
                    {from?.name ?? '未知'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.brand, fontWeight: '600' }}>
                    → {relation.relationType}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.text }} numberOfLines={1}>
                    {to?.name ?? '未知'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {sourceMemory ? (
          <View
            style={{
              gap: 6,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colors.brandFaint,
              borderWidth: 1,
              borderColor: '#E9E5FF',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Quote size={11} color={colors.brand} strokeWidth={2} />
              <Text style={{ fontSize: 10.5, color: colors.brand, fontWeight: '600' }}>记忆来源</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#55516E', lineHeight: 18 }}>
              {sourceMemory.content}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textTertiary }}>{sourceMemory.source}</Text>
          </View>
        ) : null}

        <View style={{ gap: 2 }}>
          <MetaRow
            icon={<CalendarClock size={12} color={colors.textTertiary} strokeWidth={2} />}
            label="创建时间"
            value={formatChineseDate(entity.createdAt.slice(0, 10))}
          />
          <MetaRow
            icon={<Clock3 size={12} color={colors.textTertiary} strokeWidth={2} />}
            label="最后更新"
            value={formatChineseDate(entity.updatedAt.slice(0, 10))}
          />
        </View>

        <View style={{ gap: 9 }}>
          {goal ? (
            <AppButton
              label="查看关联目标"
              variant="secondary"
              compact
              icon={<Target size={14} color={colors.brand} strokeWidth={2} />}
              onPress={() => {
                onClose();
                onOpenGoal(goal.id);
              }}
            />
          ) : null}
          {entity.type !== 'self' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton
                label="编辑节点"
                variant="ghost"
                compact
                style={{ flex: 1 }}
                icon={<Pencil size={13} color={colors.brand} strokeWidth={2} />}
                onPress={() => onEdit(entity.id)}
              />
              <AppButton
                label="删除"
                variant="danger"
                compact
                style={{ flex: 1 }}
                icon={<Trash2 size={13} color={colors.danger} strokeWidth={2} />}
                onPress={confirmDelete}
              />
            </View>
          ) : null}
        </View>
      </View>
    </BottomSheet>
  );
}
