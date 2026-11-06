import { ChevronRight, ClipboardCheck, Timer } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { computeGrowthStats } from '@/services/growth/stats';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils/date';
import { PressableScale } from '@/components/common/PressableScale';

interface ReviewMiniCardProps {
  onOpenReview: () => void;
}

export function ReviewMiniCard({ onOpenReview }: ReviewMiniCardProps) {
  const events = useAppStore((state) => state.events);
  const tasks = useAppStore((state) => state.tasks);
  const goals = useAppStore((state) => state.goals);
  const stats = computeGrowthStats(events, tasks, goals);

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: '#EDEDF7',
        backgroundColor: '#FBFBFF',
        padding: 13,
        marginTop: 2,
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
          <ClipboardCheck size={16} color={colors.brand} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.text }}>本周成长速览</Text>
          <Text style={{ fontSize: 10.5, color: colors.textTertiary, marginTop: 1 }}>
            基于 {stats.completedTasks} 项已完成任务
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 10,
            gap: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Timer size={11} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 9.5, color: colors.textSecondary }}>学习时长</Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            {formatDuration(stats.studyHours)}
          </Text>
          <Text style={{ fontSize: 9.5, color: stats.hoursDeltaPct >= 0 ? colors.success : colors.warning }}>
            {stats.hoursDeltaPct >= 0 ? '+' : ''}
            {stats.hoursDeltaPct}% 较上周
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 10,
            gap: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ClipboardCheck size={11} color={colors.success} strokeWidth={2} />
            <Text style={{ fontSize: 9.5, color: colors.textSecondary }}>目标完成率</Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            {stats.completionRate}%
          </Text>
          <Text style={{ fontSize: 9.5, color: colors.textTertiary }}>
            {stats.completedTasks}/{stats.totalTasks} 项任务
          </Text>
        </View>
      </View>
      <PressableScale
        onPress={onOpenReview}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: colors.brandFaint,
          borderRadius: 11,
          paddingVertical: 9,
        }}>
        <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.brand }}>查看完整复盘</Text>
        <ChevronRight size={13} color={colors.brand} strokeWidth={2.2} />
      </PressableScale>
    </View>
  );
}
