import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import {
  CalendarDays,
  Check,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { IconButton } from '@/components/common/IconButton';
import { PressableScale } from '@/components/common/PressableScale';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { diffDays, formatChineseDate, formatDuration, formatTimeLabel } from '@/utils/date';

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

export default function GoalDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const goal = useAppStore((state) => state.goals.find((item) => item.id === params.id));
  const allTasks = useAppStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.goalId === params.id);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const deleteGoal = useAppStore((state) => state.deleteGoal);
  const toggleMilestone = useAppStore((state) => state.toggleMilestone);
  const addMilestone = useAppStore((state) => state.addMilestone);
  const deleteMilestone = useAppStore((state) => state.deleteMilestone);
  const toggleTask = useAppStore((state) => state.toggleTask);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [milestoneInput, setMilestoneInput] = useState('');

  if (!goal) {
    return (
      <ScreenBackground>
        <ScreenHeader title="目标详情" onBack={() => router.back()} />
        <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>这个目标已经不存在了。</Text>
          <AppButton label="返回成长" variant="secondary" compact onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  const daysLeft = diffDays(goal.deadline);
  const doneMilestones = goal.milestones.filter((item) => item.done).length;

  const setProgress = (value: number) => {
    updateGoal(goal.id, {
      progress: value,
      status: value >= 100 ? 'completed' : 'active',
    });
  };

  const saveEdit = () => {
    if (!title.trim()) return;
    updateGoal(goal.id, {
      title: title.trim(),
      description: description.trim(),
      deadline,
    });
    setEditing(false);
    useAppStore.getState().showToast('目标已更新，图谱同步完成', 'success');
  };

  const confirmDelete = () => {
    Alert.alert('删除目标？', '关联的图谱节点会被移除，日程会保留但不再关联目标。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteGoal(goal.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        title="目标详情"
        subtitle={goal.status === 'completed' ? '已达成 · 记得为自己庆祝' : `还有 ${Math.max(0, daysLeft)} 天`}
        onBack={() => router.back()}
        right={
          <IconButton
            icon={Trash2}
            onPress={confirmDelete}
            label="删除目标"
            size={16}
            color={colors.danger}
            backgroundColor={colors.dangerSoft}
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, gap: 14, paddingBottom: 40 }}>
        <Animated.View entering={FadeInUp.duration(280)}>
          <Card style={{ gap: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: colors.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Target size={20} color={colors.brand} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.4 }}>
                  {goal.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <CalendarDays size={11} color={colors.textSecondary} strokeWidth={1.9} />
                  <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                    {formatChineseDate(goal.deadline)} 截止
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 19 }}>
              {goal.description}
            </Text>

            <View style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 30, fontWeight: '700', color: colors.brand, letterSpacing: -0.9 }}>
                  {Math.round(goal.progress)}
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>%</Text>
                </Text>
                <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                  里程碑 {doneMilestones}/{goal.milestones.length}
                </Text>
              </View>
              <ProgressBar progress={goal.progress} height={9} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                <PressableScale
                  onPress={() => setProgress(Math.max(0, goal.progress - 10))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    backgroundColor: '#FAFAFE',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>-10%</Text>
                </PressableScale>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  {[50, 75, 100].map((value) => (
                    <FilterChip
                      key={value}
                      label={`${value}%`}
                      compact
                      active={Math.round(goal.progress) === value}
                      onPress={() => setProgress(value)}
                    />
                  ))}
                </View>
                <PressableScale
                  onPress={() => setProgress(Math.min(100, goal.progress + 10))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    backgroundColor: colors.brandFaint,
                    borderWidth: 1,
                    borderColor: '#E4E0FF',
                  }}>
                  <Text style={{ fontSize: 10.5, color: colors.brand, fontWeight: '600' }}>+10%</Text>
                </PressableScale>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 9 }}>
              <AppButton
                label={editing ? '收起编辑' : '编辑目标'}
                variant="ghost"
                compact
                style={{ flex: 1 }}
                onPress={() => setEditing((value) => !value)}
              />
              <AppButton
                label="查看图谱"
                variant="secondary"
                compact
                style={{ flex: 1 }}
                onPress={() => router.push('/graph')}
              />
            </View>
          </Card>
        </Animated.View>

        {editing ? (
          <Animated.View entering={FadeInUp.duration(240)}>
            <Card style={{ gap: 12 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>编辑目标信息</Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>目标名称</Text>
                <TextInput value={title} onChangeText={setTitle} style={fieldStyle} />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>目标描述</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  style={[fieldStyle, { minHeight: 68, textAlignVertical: 'top' }]}
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>截止日期</Text>
                <TextInput value={deadline} onChangeText={setDeadline} style={fieldStyle} placeholder="YYYY-MM-DD" />
              </View>
              <AppButton label="保存修改" onPress={saveEdit} disabled={!title.trim()} />
            </Card>
          </Animated.View>
        ) : null}

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Target size={13} color={colors.brand} strokeWidth={2} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>里程碑</Text>
            </View>
            <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>{doneMilestones}/{goal.milestones.length}</Text>
          </View>

          {goal.milestones.length === 0 ? (
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>还没有里程碑，添加一个阶段目标吧。</Text>
          ) : (
            goal.milestones.map((milestone) => (
              <View
                key={milestone.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 3 }}>
                <PressableScale
                  onPress={() => toggleMilestone(goal.id, milestone.id)}
                  haptic
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: milestone.done ? 0 : 1.5,
                    borderColor: '#D8D5EA',
                    backgroundColor: milestone.done ? colors.success : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {milestone.done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                </PressableScale>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    color: milestone.done ? colors.textTertiary : colors.text,
                    textDecorationLine: milestone.done ? 'line-through' : 'none',
                  }}>
                  {milestone.title}
                </Text>
                <PressableScale onPress={() => deleteMilestone(goal.id, milestone.id)} hitSlop={8}>
                  <X size={13} color={colors.textTertiary} strokeWidth={2} />
                </PressableScale>
              </View>
            ))
          )}

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={milestoneInput}
              onChangeText={setMilestoneInput}
              placeholder="添加下一个里程碑"
              placeholderTextColor={colors.textTertiary}
              style={[fieldStyle, { flex: 1 }]}
              onSubmitEditing={() => {
                addMilestone(goal.id, milestoneInput);
                setMilestoneInput('');
              }}
            />
            <PressableScale
              haptic
              onPress={() => {
                addMilestone(goal.id, milestoneInput);
                setMilestoneInput('');
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.brandFaint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Plus size={17} color={colors.brand} strokeWidth={2.2} />
            </PressableScale>
          </View>
        </Card>

        <Card style={{ gap: 11 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>相关日程</Text>
            <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>{tasks.length} 项</Text>
          </View>
          {tasks.length === 0 ? (
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>还没有关联日程，安排一次行动吧。</Text>
          ) : (
            tasks.map((task) => {
              const done = task.status === 'done';
              return (
                <PressableScale
                  key={task.id}
                  onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5 }}>
                  <PressableScale
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleTask(task.id);
                    }}
                    haptic
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: done ? 0 : 1.5,
                      borderColor: '#D8D5EA',
                      backgroundColor: done ? colors.success : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                  </PressableScale>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12.5,
                        color: done ? colors.textTertiary : colors.text,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}>
                      {task.title}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                      {task.allDay ? '全天' : formatTimeLabel(task.startTime)} · {formatDuration(task.duration)}
                    </Text>
                  </View>
                </PressableScale>
              );
            })
          )}
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}
