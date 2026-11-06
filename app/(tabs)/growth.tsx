import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { CalendarPlus } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/common/IconButton';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { EncouragementCard } from '@/components/growth/EncouragementCard';
import { GoalCard } from '@/components/growth/GoalCard';
import { GrowthReviewCard } from '@/components/growth/GrowthReviewCard';
import { WeekPlanSheet } from '@/components/growth/WeekPlanSheet';
import { WeekSchedule } from '@/components/growth/WeekSchedule';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { computeGrowthStats } from '@/services/growth/stats';
import { useAppStore } from '@/store/useAppStore';
import { getWeekDays, startOfWeekISO, todayISO } from '@/utils/date';

export default function GrowthScreen() {
  const insets = useSafeAreaInsets();
  const goals = useAppStore((state) => state.goals);
  const tasks = useAppStore((state) => state.tasks);
  const events = useAppStore((state) => state.events);
  const toggleTask = useAppStore((state) => state.toggleTask);

  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [weekSheetVisible, setWeekSheetVisible] = useState(false);

  const weekDays = getWeekDays(startOfWeekISO());
  const weekTasks = tasks.filter((task) => weekDays.includes(task.date));
  const stats = computeGrowthStats(events, tasks, goals);

  const openTaskCreator = (date = selectedDay) => {
    router.push({ pathname: '/task/create', params: { date } });
  };

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.screen,
          paddingBottom: Math.max(insets.bottom, 10) + 92,
          gap: 22,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: colors.textTertiary, letterSpacing: 1.2 }}>
              GROWTH SPACE
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.8,
                marginTop: 2,
              }}>
              成长
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 5 }}>
              目标 · 日程 · 复盘，让每一步都有记录
            </Text>
          </View>
          <IconButton icon={CalendarPlus} onPress={() => openTaskCreator()} label="新建日程" size={17} />
        </View>

        <GoalCard
          goals={goals}
          onManage={(goalId) => router.push({ pathname: '/goal/[id]', params: { id: goalId } })}
          onCreate={() => router.push('/goal/create')}
        />

        <WeekSchedule
          weekDays={weekDays}
          tasks={weekTasks}
          goals={goals}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onToggleTask={toggleTask}
          onOpenTask={(id) => router.push({ pathname: '/task/[id]', params: { id } })}
          onOpenAll={() => setWeekSheetVisible(true)}
          onAddTask={() => openTaskCreator()}
        />

        <GrowthReviewCard stats={stats} onOpenReview={() => router.push('/review')} />

        <EncouragementCard stats={stats} />
      </ScrollView>

      <WeekPlanSheet
        visible={weekSheetVisible}
        weekDays={weekDays}
        tasks={weekTasks}
        onClose={() => setWeekSheetVisible(false)}
        onToggleTask={toggleTask}
        onOpenTask={(id) => router.push({ pathname: '/task/[id]', params: { id } })}
        onAddTask={() => openTaskCreator()}
      />
    </ScreenBackground>
  );
}
