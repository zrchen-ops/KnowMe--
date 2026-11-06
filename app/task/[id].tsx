import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Target,
  Trash2,
} from 'lucide-react-native';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { IconButton } from '@/components/common/IconButton';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { formatChineseDate, formatDuration, formatTimeLabel, todayISO } from '@/utils/date';

const fieldStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: '#FAFAFE',
  borderRadius: radius.md,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: 13.5,
  color: colors.text,
  lineHeight: 19,
};

const DURATIONS = [0.5, 1, 1.5, 2, 3];

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const task = useAppStore((state) =>
    state.tasks.find((item) => item.id === params.id),
  );
  const goals = useAppStore((state) => state.goals);
  const events = useAppStore((state) => state.events);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task?.title ?? '');
  const [date, setDate] = useState(task?.date ?? todayISO());
  const [startTime, setStartTime] = useState(task?.startTime ?? '14:00');
  const [duration, setDuration] = useState(task?.duration ?? 1);
  const [allDay, setAllDay] = useState(task?.allDay ?? false);
  const [goalId, setGoalId] = useState<string | undefined>(task?.goalId);

  if (!task) {
    return (
      <ScreenBackground>
        <ScreenHeader title="任务详情" onBack={() => router.back()} />
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>这个任务已经不存在了。</Text>
          <AppButton label="返回" variant="secondary" compact onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  const done = task.status === 'done';
  const goal = goals.find((item) => item.id === task.goalId);
  const event = events.find((item) => item.taskId === task.id);

  const saveEdit = () => {
    if (!title.trim()) return;
    const goalChanged = goalId !== task.goalId;
    updateTask(task.id, {
      title: title.trim(),
      date,
      startTime: allDay ? undefined : startTime,
      duration,
      allDay,
      goalId,
    });
    if (goalChanged) {
      useAppStore.getState().showToast('任务信息已更新', 'success');
    }
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert('删除任务？', '与任务关联的成长记录也会被移除。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        title="任务详情"
        subtitle={done ? '已完成 · 已同步到成长记录' : '待完成 · 完成后会记录时间'}
        onBack={() => router.back()}
        right={
          <IconButton
            icon={Trash2}
            onPress={confirmDelete}
            label="删除任务"
            size={16}
            color={colors.danger}
            backgroundColor={colors.dangerSoft}
          />
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 40, gap: 14 }}>
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: done ? colors.successSoft : colors.brandFaint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Check size={20} color={done ? colors.success : colors.brand} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 21, fontWeight: '700', color: colors.text, letterSpacing: -0.4 }}>
                  {task.title}
                </Text>
                <Text style={{ fontSize: 11.5, color: done ? colors.success : colors.textSecondary, marginTop: 4 }}>
                  {done ? '已完成' : '待完成'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { icon: CalendarDays, text: formatChineseDate(task.date) },
                { icon: Clock3, text: task.allDay ? '全天' : formatTimeLabel(task.startTime) },
                { icon: FileText, text: formatDuration(task.duration) },
              ].map((item) => (
                <View
                  key={item.text}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingVertical: 8,
                    borderRadius: radius.md,
                    backgroundColor: '#FAFAFE',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <item.icon size={11} color={colors.textSecondary} strokeWidth={1.9} />
                  <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>

            {event ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: colors.successSoft,
                }}>
                <Check size={12} color={colors.success} strokeWidth={2.5} />
                <Text style={{ fontSize: 10.5, color: '#2C8C68', flex: 1 }}>
                  已写入成长时间记录，复盘时会自动引用。
                </Text>
              </View>
            ) : null}

            <AppButton
              label={done ? '标记为未完成' : '标记完成'}
              variant={done ? 'secondary' : 'primary'}
              icon={<Check size={15} color={done ? colors.brand : '#FFFFFF'} strokeWidth={2.4} />}
              onPress={() => toggleTask(task.id)}
            />
            <AppButton
              label={editing ? '收起编辑' : '编辑任务'}
              variant="ghost"
              compact
              onPress={() => setEditing((value) => !value)}
            />
          </Card>

          {goal ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.brandFaint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Target size={15} color={colors.brand} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: colors.textTertiary }}>关联目标</Text>
                  <Text style={{ fontSize: 12.5, color: colors.text, fontWeight: '500' }} numberOfLines={1}>
                    {goal.title}
                  </Text>
                </View>
                <AppButton
                  label="查看"
                  variant="ghost"
                  compact
                  onPress={() => router.push({ pathname: '/goal/[id]', params: { id: goal.id } })}
                />
              </View>
            </Card>
          ) : null}

          {editing ? (
            <Card style={{ gap: 13 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>编辑任务</Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>任务名称</Text>
                <TextInput value={title} onChangeText={setTitle} style={fieldStyle} />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>日期</Text>
                <TextInput value={date} onChangeText={setDate} style={fieldStyle} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1 }}>全天任务</Text>
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
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>开始时间</Text>
                  <TextInput value={startTime} onChangeText={setStartTime} style={fieldStyle} placeholder="14:00" />
                </View>
              ) : null}
              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>预计时长</Text>
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
              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>关联目标</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <FilterChip label="不关联" compact active={!goalId} onPress={() => setGoalId(undefined)} />
                  {goals
                    .filter((item) => item.status === 'active')
                    .map((item) => (
                      <FilterChip
                        key={item.id}
                        label={item.title}
                        compact
                        active={goalId === item.id}
                        onPress={() => setGoalId(item.id)}
                      />
                    ))}
                </View>
              </View>
              <AppButton label="保存修改" onPress={saveEdit} disabled={!title.trim()} />
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
