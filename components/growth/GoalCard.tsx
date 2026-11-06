import { Text, View } from 'react-native';
import { CalendarDays, ChevronRight, Flag, Plus, Target } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { PressableScale } from '@/components/common/PressableScale';
import { ProgressBar } from '@/components/common/ProgressBar';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { Goal } from '@/types';
import { diffDays } from '@/utils/date';

interface GoalCardProps {
  goals: Goal[];
  onManage: (goalId: string) => void;
  onCreate: () => void;
}

export function GoalCard({ goals, onManage, onCreate }: GoalCardProps) {
  const active = goals.filter((goal) => goal.status === 'active');
  const primary = active[0];

  return (
    <Animated.View entering={FadeInUp.duration(300)}>
      <SectionHeader
        title="本学期目标"
        subtitle={active.length > 1 ? `还有 ${active.length - 1} 个进行中的目标` : '把方向变成可以推进的节奏'}
        icon={<Target size={16} color={colors.brand} strokeWidth={2} />}
        actionLabel="新建"
        onAction={onCreate}
      />

      {!primary ? (
        <Card>
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.brandFaint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Flag size={20} color={colors.brand} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>还没有进行中的目标</Text>
            <Text style={{ fontSize: 11.5, color: colors.textSecondary, textAlign: 'center' }}>
              和 Agent 说说你想完成的事，或者手动创建一个。
            </Text>
            <AppButton
              label="制定新目标"
              compact
              icon={<Plus size={14} color="#FFFFFF" strokeWidth={2.2} />}
              onPress={onCreate}
            />
          </View>
        </Card>
      ) : (
        <PressableScale onPress={() => onManage(primary.id)} scaleTo={0.985}>
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Target size={18} color={colors.brand} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                  {primary.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 17, marginTop: 3 }}>
                  {primary.description}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
            </View>

            <View style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.brand, letterSpacing: -0.6 }}>
                  {Math.round(primary.progress)}
                  <Text style={{ fontSize: 13, fontWeight: '600' }}>%</Text>
                </Text>
                <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                  里程碑 {primary.milestones.filter((item) => item.done).length}/{primary.milestones.length}
                </Text>
              </View>
              <ProgressBar progress={primary.progress} height={8} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <CalendarDays size={12} color={colors.textSecondary} strokeWidth={1.9} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  距截止还有{' '}
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {Math.max(0, diffDays(primary.deadline))} 天
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                  backgroundColor: colors.brandFaint,
                }}>
                <Text style={{ fontSize: 10.5, color: colors.brand, fontWeight: '600' }}>管理目标</Text>
                <ChevronRight size={11} color={colors.brand} strokeWidth={2.2} />
              </View>
            </View>
          </Card>
        </PressableScale>
      )}
    </Animated.View>
  );
}
