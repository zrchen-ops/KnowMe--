import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Clock3, Target } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { addDaysISO, formatChineseDate, startOfWeekISO, todayISO } from '@/utils/date';

const fieldStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: '#FAFAFE',
  borderRadius: radius.md,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 13.5,
  color: colors.text,
  lineHeight: 20,
};

const DURATIONS = [0.5, 1, 1.5, 2, 3];

function isValidISO(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function CreateTaskScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const goals = useAppStore((state) => state.goals);
  const addTask = useAppStore((state) => state.addTask);

  const initialDate = params.date && isValidISO(params.date) ? params.date : todayISO();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [dateText, setDateText] = useState(initialDate);
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState(1);
  const [allDay, setAllDay] = useState(false);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);

  const applyDate = (value: string) => {
    setDate(value);
    setDateText(value);
  };

  const updateDateText = (value: string) => {
    setDateText(value);
    if (isValidISO(value)) setDate(value);
  };

  const save = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      date: isValidISO(dateText) ? dateText : date,
      startTime: allDay ? undefined : startTime,
      duration,
      goalId,
      allDay,
    });
    router.back();
  };

  const weekStart = startOfWeekISO();
  const datePresets = [
    { label: '今天', value: todayISO() },
    { label: '明天', value: addDaysISO(todayISO(), 1) },
    { label: '周六', value: addDaysISO(weekStart, 5) },
    { label: '周日', value: addDaysISO(weekStart, 6) },
  ];

  return (
    <ScreenBackground>
      <ScreenHeader title="新建日程" subtitle="完成日程后会自动记录时间，并更新目标进度。" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 40, gap: 16 }}>
          <Animated.View entering={FadeInUp.duration(280)}>
            <Card style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>任务名称</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="例如：英语六级真题练习"
                  placeholderTextColor={colors.textTertiary}
                  style={fieldStyle}
                  autoFocus
                />
              </View>

              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>日期</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {datePresets.map((preset) => (
                    <FilterChip
                      key={preset.label}
                      label={preset.label}
                      compact
                      active={date === preset.value}
                      onPress={() => applyDate(preset.value)}
                    />
                  ))}
                </View>
                <TextInput
                  value={dateText}
                  onChangeText={updateDateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  style={fieldStyle}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={{ fontSize: 10, color: colors.textTertiary }}>{formatChineseDate(date)}</Text>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(60).duration(280)}>
            <Card style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock3 size={13} color={colors.success} strokeWidth={2} />
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>时间安排</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>全天</Text>
                <Switch
                  value={allDay}
                  onValueChange={setAllDay}
                  trackColor={{ false: '#E4E3EF', true: '#CDC8FA' }}
                  thumbColor={allDay ? colors.brand : '#FFFFFF'}
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>

              {!allDay ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>开始时间</Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="14:00"
                    placeholderTextColor={colors.textTertiary}
                    style={fieldStyle}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              ) : null}

              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>预计时长</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {DURATIONS.map((value) => (
                    <FilterChip
                      key={value}
                      label={`${value}h`}
                      compact
                      active={duration === value}
                      onPress={() => setDuration(value)}
                    />
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(280)}>
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Target size={13} color={colors.brand} strokeWidth={2} />
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>关联目标</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <FilterChip
                  label="不关联"
                  compact
                  active={!goalId}
                  onPress={() => setGoalId(undefined)}
                />
                {goals
                  .filter((goal) => goal.status === 'active')
                  .map((goal) => (
                    <FilterChip
                      key={goal.id}
                      label={goal.title}
                      compact
                      active={goalId === goal.id}
                      onPress={() => setGoalId(goal.id)}
                    />
                  ))}
              </View>
              <Text style={{ fontSize: 10.5, color: colors.textTertiary, lineHeight: 16 }}>
                关联目标后，完成任务会让目标进度 +2%，同时写入个人记忆。
              </Text>
            </Card>
          </Animated.View>

          <AppButton label="添加日程" onPress={save} disabled={!title.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
