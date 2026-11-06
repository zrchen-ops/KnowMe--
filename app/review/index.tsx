import { router } from 'expo-router';
import { ScrollView, Share, Text, View } from 'react-native';
import { Lightbulb, Share2, Sparkles, Target, Timer, TrendingDown, TrendingUp } from 'lucide-react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { IconButton } from '@/components/common/IconButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import {
  buildSuggestions,
  buildWeeklySummary,
  computeGrowthStats,
} from '@/services/growth/stats';
import { useAppStore } from '@/store/useAppStore';
import { diffDays, formatDuration, formatWeekRange, weekdayIndex, WEEKDAY_LABELS } from '@/utils/date';

export default function ReviewScreen() {
  const events = useAppStore((state) => state.events);
  const tasks = useAppStore((state) => state.tasks);
  const goals = useAppStore((state) => state.goals);
  const planNextWeek = useAppStore((state) => state.planNextWeek);

  const stats = computeGrowthStats(events, tasks, goals);
  const summary = buildWeeklySummary(stats, goals);
  const suggestions = buildSuggestions(stats, goals);
  const activeGoals = goals.filter((goal) => goal.status === 'active');
  const weekTasks = tasks.filter((task) => task.date >= stats.weekStart && task.date <= stats.weekEnd);
  const maxHours = Math.max(1, stats.studyHours, stats.lastWeekStudyHours);
  const thisWeekWidth = `${Math.max(4, (stats.studyHours / maxHours) * 100)}%` as const;
  const lastWeekWidth = `${Math.max(4, (stats.lastWeekStudyHours / maxHours) * 100)}%` as const;

  const shareReview = () => {
    void Share.share({
      message: `KnowMe 本周复盘\n学习时长：${formatDuration(stats.studyHours)}（${
        stats.hoursDeltaPct >= 0 ? '+' : ''
      }${stats.hoursDeltaPct}%）\n任务完成：${stats.completedTasks}/${stats.totalTasks}\n\n${summary}`,
    });
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        title="本周复盘"
        subtitle={formatWeekRange(stats.weekStart)}
        onBack={() => router.back()}
        right={<IconButton icon={Share2} onPress={shareReview} label="分享复盘" size={16} />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 40, gap: 14 }}>
        <View
          style={{
            borderRadius: radius.xl,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#E6E1FF',
          }}>
          <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <Defs>
              <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#7C6FF7" />
                <Stop offset="1" stopColor="#5747DB" />
              </LinearGradient>
            </Defs>
            <Circle cx="330" cy="20" r="70" fill="#FFFFFF" opacity={0.08} />
            <Circle cx="40" cy="140" r="60" fill="#FFFFFF" opacity={0.06} />
            <Line x1="0" y1="0" x2="360" y2="200" stroke="#FFFFFF" strokeOpacity={0.05} />
          </Svg>
          <View style={{ padding: 18, gap: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>
                WEEKLY REVIEW
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)' }}>本周学习时长</Text>
                <Text style={{ fontSize: 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1 }}>
                  {formatDuration(stats.studyHours)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(255,255,255,0.17)',
                }}>
                {stats.hoursDeltaPct >= 0 ? (
                  <TrendingUp size={11} color="#C9FFE6" strokeWidth={2.2} />
                ) : (
                  <TrendingDown size={11} color="#FFE1B0" strokeWidth={2.2} />
                )}
                <Text style={{ fontSize: 10.5, color: '#FFFFFF', fontWeight: '600' }}>
                  {stats.hoursDeltaPct >= 0 ? '+' : ''}
                  {stats.hoursDeltaPct}% vs 上周
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <View
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(255,255,255,0.13)',
                }}>
                <Text style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)' }}>任务完成</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 2 }}>
                  {stats.completedTasks}/{stats.totalTasks}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(255,255,255,0.13)',
                }}>
                <Text style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)' }}>完成率</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 2 }}>
                  {stats.completionRate}%
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(255,255,255,0.13)',
                }}>
                <Text style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)' }}>记录总时长</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 2 }}>
                  {formatDuration(stats.totalRecordedHours)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Card style={{ gap: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Timer size={13} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>与上周对比</Text>
          </View>
          <View style={{ gap: 10 }}>
            {[
              { label: '本周', value: stats.studyHours, width: thisWeekWidth, color: colors.brand },
              {
                label: '上周',
                value: stats.lastWeekStudyHours,
                width: lastWeekWidth,
                color: '#CFC9F6',
              },
            ].map((row) => (
              <View key={row.label} style={{ gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>{row.label}</Text>
                  <Text style={{ fontSize: 10.5, color: colors.text, fontWeight: '600' }}>
                    {formatDuration(row.value)}
                  </Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: '#F1EFF8' }}>
                  <View
                    style={{
                      width: row.width,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 11 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>时间分配</Text>
          {stats.categories.length === 0 ? (
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>本周还没有时间记录。</Text>
          ) : (
            stats.categories.map((category) => (
              <View key={category.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: category.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: category.color }}>
                    {category.label.slice(0, 1)}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, color: colors.text }}>{category.label}</Text>
                    <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                      {formatDuration(category.hours)} · {category.percent}%
                    </Text>
                  </View>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F2F0FA' }}>
                    <View
                      style={{
                        width: `${category.percent}%`,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: category.color,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Target size={13} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>目标完成情况</Text>
          </View>
          {activeGoals.length === 0 ? (
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>没有进行中的目标。</Text>
          ) : (
            activeGoals.map((goal) => (
              <View key={goal.id} style={{ gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11.5, color: colors.text, flex: 1 }} numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.brand, fontWeight: '600' }}>
                    {goal.progress}%
                  </Text>
                </View>
                <ProgressBar progress={goal.progress} height={6} />
                <Text style={{ fontSize: 9.5, color: colors.textTertiary }}>
                  截止还有 {Math.max(0, diffDays(goal.deadline))} 天
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 11, backgroundColor: '#FBFAFF', borderColor: '#E9E5FF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>Agent 总结</Text>
          </View>
          <Text style={{ fontSize: 12.5, color: '#4E4A66', lineHeight: 20 }}>{summary}</Text>
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={13} color={colors.warning} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>下一周建议</Text>
          </View>
          {suggestions.map((item, index) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: 9,
                  backgroundColor: colors.brandFaint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}>
                <Text style={{ fontSize: 9, color: colors.brand, fontWeight: '600' }}>{index + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 11.5, color: colors.textSecondary, lineHeight: 18 }}>
                {item}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={{ gap: 9 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>本周日程回顾</Text>
          {weekTasks.length === 0 ? (
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>本周还没有安排日程。</Text>
          ) : (
            weekTasks.map((task) => (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: task.status === 'done' ? colors.success : '#D8D5EA',
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 11.5,
                    color: task.status === 'done' ? colors.textSecondary : colors.text,
                  }}
                  numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={{ fontSize: 9.5, color: colors.textTertiary }}>
                  {WEEKDAY_LABELS[weekdayIndex(task.date)]}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>把复盘变成下周动作</Text>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 18 }}>
            {activeGoals.length > 0
              ? `围绕「${activeGoals[0].title}」排两件事：周中推进一步，周末做一次复盘。`
              : '还没有进行中的目标。可以先写下一个目标，再让它自动排进下周。'}
          </Text>
          <AppButton
            label="生成下周计划"
            onPress={() => {
              const count = planNextWeek();
              if (count > 0) router.push('/growth');
            }}
          />
        </Card>

        <AppButton label="回到成长" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </ScreenBackground>
  );
}
