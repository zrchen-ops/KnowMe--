import { Text, View } from 'react-native';
import { ClipboardCheck, Timer, TrendingDown, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/common/Card';
import { PressableScale } from '@/components/common/PressableScale';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { GrowthStats } from '@/services/growth/stats';
import { formatDuration } from '@/utils/date';

interface GrowthReviewCardProps {
  stats: GrowthStats;
  onOpenReview: () => void;
}

function Trend({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
      {up ? (
        <TrendingUp size={10} color={colors.success} strokeWidth={2.2} />
      ) : (
        <TrendingDown size={10} color={colors.warning} strokeWidth={2.2} />
      )}
      <Text style={{ fontSize: 9.5, color: up ? colors.success : colors.warning }}>
        {up ? '+' : ''}
        {value}
        {suffix}
      </Text>
    </View>
  );
}

export function GrowthReviewCard({ stats, onOpenReview }: GrowthReviewCardProps) {
  const maxHours = Math.max(1, ...stats.daily.map((day) => day.hours));

  return (
    <Animated.View entering={FadeInUp.delay(120).duration(300)}>
      <SectionHeader
        title="成长复盘"
        subtitle="数据来自你完成的日程与时间记录"
        icon={<ClipboardCheck size={16} color={colors.brand} strokeWidth={2} />}
        actionLabel="本周总结"
        onAction={onOpenReview}
      />

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              padding: 13,
              borderRadius: radius.lg,
              backgroundColor: colors.brandFaint,
              gap: 3,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Timer size={12} color={colors.brand} strokeWidth={2} />
              <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>学习时长</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>
              {formatDuration(stats.studyHours)}
            </Text>
            <Trend value={stats.hoursDeltaPct} />
          </View>

          <View
            style={{
              flex: 1,
              padding: 13,
              borderRadius: radius.lg,
              backgroundColor: colors.successSoft,
              gap: 3,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ClipboardCheck size={12} color={colors.success} strokeWidth={2} />
              <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>目标完成率</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>
              {stats.completionRate}%
            </Text>
            <Trend value={stats.completionDeltaPct} />
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>每日学习分布</Text>
            <Text style={{ fontSize: 10, color: colors.textTertiary }}>
              {stats.completedTasks}/{stats.totalTasks} 项任务完成
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 6 }}>
            {stats.daily.map((day, index) => {
              const height = day.hours > 0 ? Math.max(6, (day.hours / maxHours) * 36) : 3;
              return (
                <View key={day.iso} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <Animated.View
                    entering={FadeInUp.delay(index * 35).duration(280)}
                    style={{
                      width: '100%',
                      height,
                      borderRadius: 4,
                      backgroundColor: day.isToday ? colors.brand : '#DDD8F8',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 8.5,
                      color: day.isToday ? colors.brand : colors.textTertiary,
                      fontWeight: day.isToday ? '600' : '400',
                    }}>
                    {day.weekday.replace('周', '')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <PressableScale
          onPress={onOpenReview}
          scaleTo={0.98}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: 10,
            borderRadius: radius.md,
            backgroundColor: colors.brandFaint,
          }}>
          <Text style={{ fontSize: 11.5, color: colors.brand, fontWeight: '600' }}>
            查看本周完整复盘
          </Text>
        </PressableScale>
      </Card>
    </Animated.View>
  );
}
