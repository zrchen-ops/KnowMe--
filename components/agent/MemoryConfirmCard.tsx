import {
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Quote,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { memoryTypeMeta, radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { formatMonthDay } from '@/utils/date';
import { AppButton } from '@/components/common/AppButton';
import { PressableScale } from '@/components/common/PressableScale';

interface MemoryConfirmCardProps {
  memoryId: string;
  onEdit: (id: string) => void;
  onOpenGraph: () => void;
}

export function MemoryConfirmCard({ memoryId, onEdit, onOpenGraph }: MemoryConfirmCardProps) {
  const memory = useAppStore((state) => state.memories.find((item) => item.id === memoryId));
  const confirmMemory = useAppStore((state) => state.confirmMemory);
  const rejectMemory = useAppStore((state) => state.rejectMemory);

  if (!memory) return null;

  const meta = memoryTypeMeta[memory.type] ?? memoryTypeMeta.preference;
  const pending = memory.status === 'pending';
  const confirmed = memory.status === 'confirmed';
  const rejected = memory.status === 'rejected';
  const isGoal = Boolean(memory.payload?.goal);

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: confirmed ? '#E2F3EA' : '#ECE8FF',
        backgroundColor: '#FFFFFF',
        padding: 14,
        gap: 10,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Sparkles size={16} color={colors.brand} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.text }}>记忆整理</Text>
          <Text style={{ fontSize: 10.5, color: colors.textTertiary, marginTop: 1 }}>
            {memory.origin === 'user' ? '来自你的描述' : 'AI 推测 · 需要你确认'}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: rejected
              ? '#F3F3F8'
              : confirmed
                ? colors.successSoft
                : colors.warningSoft,
          }}>
          {confirmed ? (
            <Check size={10} color={colors.success} strokeWidth={3} />
          ) : null}
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: rejected ? colors.textSecondary : confirmed ? colors.success : colors.warning,
            }}>
            {confirmed ? '已确认' : rejected ? '已忽略' : '待确认'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor: meta.soft,
          }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
        </View>
        <Text style={{ fontSize: 10, color: colors.textTertiary }}>
          置信度 {Math.round(memory.confidence * 100)}%
        </Text>
      </View>

      <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 20.5 }}>{memory.content}</Text>

      {memory.payload?.entityName ? (
        <View
          style={{
            backgroundColor: '#FAFAFE',
            borderRadius: 12,
            padding: 10,
            gap: 5,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={12} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>整理为记忆节点</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
            {memory.payload.entityName}
          </Text>
          {memory.payload.description ? (
            <Text style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 17 }}>
              {memory.payload.description}
            </Text>
          ) : null}
          {isGoal && memory.payload.goal ? (
            <Text style={{ fontSize: 10.5, color: colors.brand }}>
              截止 {formatMonthDay(memory.payload.goal.deadline)} · 进度 {memory.payload.goal.progress ?? 0}%
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Quote size={10} color={colors.textTertiary} strokeWidth={2} />
        <Text style={{ fontSize: 10.5, color: colors.textTertiary, flex: 1 }} numberOfLines={1}>
          来源 · {memory.source}
        </Text>
      </View>

      {pending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <AppButton
            label="确认保存"
            compact
            icon={<Check size={14} color="#FFFFFF" strokeWidth={2.6} />}
            onPress={() => confirmMemory(memory.id)}
            style={{ flex: 1 }}
          />
          <PressableScale
            onPress={() => onEdit(memory.id)}
            haptic
            style={{
              width: 38,
              height: 36,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Pencil size={14} color={colors.textSecondary} strokeWidth={2} />
          </PressableScale>
          <PressableScale
            onPress={() => rejectMemory(memory.id)}
            haptic
            style={{
              width: 38,
              height: 36,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <X size={15} color={colors.textSecondary} strokeWidth={2} />
          </PressableScale>
        </View>
      ) : null}

      {confirmed ? (
        <PressableScale
          onPress={onOpenGraph}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.successSoft,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}>
          <CheckCircle2 size={13} color={colors.success} strokeWidth={2} />
          <Text style={{ fontSize: 11, color: colors.success, fontWeight: '600', flex: 1 }}>
            已同步到图谱与成长
          </Text>
          <Text style={{ fontSize: 10.5, color: colors.success }}>去看看</Text>
          <ChevronRight size={12} color={colors.success} strokeWidth={2} />
        </PressableScale>
      ) : null}

      {rejected ? (
        <PressableScale
          onPress={() => onEdit(memory.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <BrainCircuit size={12} color={colors.textTertiary} strokeWidth={2} />
          <Text style={{ fontSize: 10.5, color: colors.textTertiary }}>已忽略 · 点此重新编辑</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
