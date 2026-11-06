import { Alert, Text, View } from 'react-native';
import { BrainCircuit, Check, Clock3, Pencil, Trash2, X } from 'lucide-react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { PressableScale } from '@/components/common/PressableScale';
import { colors } from '@/constants/colors';
import { memoryTypeMeta, radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { Memory } from '@/types';
import { formatChineseDate } from '@/utils/date';

interface MemoryListSheetProps {
  visible: boolean;
  onClose: () => void;
  onEdit: (memoryId: string) => void;
}

function statusLabel(memory: Memory) {
  if (memory.status === 'pending') return { label: '待确认', color: colors.warning, soft: colors.warningSoft };
  if (memory.status === 'rejected') return { label: '已忽略', color: colors.textSecondary, soft: '#F1F1F7' };
  return { label: '已确认', color: colors.success, soft: colors.successSoft };
}

export function MemoryListSheet({ visible, onClose, onEdit }: MemoryListSheetProps) {
  const memories = useAppStore((state) => state.memories);
  const confirmMemory = useAppStore((state) => state.confirmMemory);
  const rejectMemory = useAppStore((state) => state.rejectMemory);
  const deleteMemory = useAppStore((state) => state.deleteMemory);

  const pendingCount = memories.filter((memory) => memory.status === 'pending').length;
  const sorted = [...memories].sort((a, b) => {
    const rank = (status: Memory['status']) => (status === 'pending' ? 0 : status === 'confirmed' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });

  const confirmDelete = (memory: Memory) => {
    Alert.alert('删除这条记忆？', '与它关联的节点、目标或任务也会被移除。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteMemory(memory.id) },
    ]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="我的记忆"
      subtitle={pendingCount > 0 ? `${pendingCount} 条新记忆等待你确认` : '所有记忆都已确认，可以随时纠错。'}>
      <View style={{ gap: 11, paddingBottom: 4 }}>
        {sorted.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
            <BrainCircuit size={26} color={colors.textTertiary} strokeWidth={1.7} />
            <Text style={{ fontSize: 12.5, color: colors.textSecondary }}>还没有记忆，和 Agent 聊聊天吧</Text>
          </View>
        ) : null}

        {sorted.map((memory) => {
          const meta = memoryTypeMeta[memory.type] ?? memoryTypeMeta.preference;
          const state = statusLabel(memory);
          return (
            <View
              key={memory.id}
              style={{
                gap: 9,
                padding: 13,
                borderRadius: radius.lg,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                    backgroundColor: meta.soft,
                  }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                    backgroundColor: state.soft,
                  }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '600', color: state.color }}>{state.label}</Text>
                </View>
                <Text style={{ fontSize: 9.5, color: colors.textTertiary, flex: 1 }} numberOfLines={1}>
                  {memory.origin === 'user' ? '你提供的信息' : 'AI 推测'}
                </Text>
                <Text style={{ fontSize: 9.5, color: colors.textTertiary }}>
                  {Math.round(memory.confidence * 100)}%
                </Text>
              </View>

              <Text style={{ fontSize: 12.5, color: colors.text, lineHeight: 19 }} numberOfLines={3}>
                {memory.content}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Clock3 size={10} color={colors.textTertiary} strokeWidth={2} />
                <Text style={{ fontSize: 9.5, color: colors.textTertiary, flex: 1 }} numberOfLines={1}>
                  {memory.source} · {formatChineseDate(memory.createdAt.slice(0, 10))}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {memory.status === 'pending' ? (
                  <>
                    <PressableScale
                      haptic
                      onPress={() => confirmMemory(memory.id)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                        backgroundColor: colors.brandFaint,
                        borderWidth: 1,
                        borderColor: '#E3DEFF',
                      }}>
                      <Check size={12} color={colors.brand} strokeWidth={2.4} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.brand }}>确认</Text>
                    </PressableScale>
                    <PressableScale
                      haptic
                      onPress={() => rejectMemory(memory.id)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                        backgroundColor: '#FAFAFE',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <X size={12} color={colors.textSecondary} strokeWidth={2.2} />
                      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>忽略</Text>
                    </PressableScale>
                  </>
                ) : (
                  <>
                    <PressableScale
                      onPress={() => onEdit(memory.id)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                        backgroundColor: '#FAFAFE',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <Pencil size={11} color={colors.brand} strokeWidth={2} />
                      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.brand }}>编辑</Text>
                    </PressableScale>
                    <PressableScale
                      onPress={() => confirmDelete(memory)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                        backgroundColor: colors.dangerSoft,
                      }}>
                      <Trash2 size={11} color={colors.danger} strokeWidth={2} />
                      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.danger }}>删除</Text>
                    </PressableScale>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}
