import { Text, View } from 'react-native';
import { CalendarDays, Check, ChevronRight, Plus } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/common/Card';
import { PressableScale } from '@/components/common/PressableScale';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { Goal, Task } from '@/types';
import {
  WEEKDAY_LABELS,
  formatDuration,
  formatTimeLabel,
  parseISO,
  todayISO,
} from '@/utils/date';

interface WeekScheduleProps {
  weekDays: string[];
  tasks: Task[];
  goals: Goal[];
  selectedDay: string;
  onSelectDay: (iso: string) => void;
  onToggleTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  onOpenAll: () => void;
  onAddTask: () => void;
}

export function WeekSchedule({
  weekDays,
  tasks,
  goals,
  selectedDay,
  onSelectDay,
  onToggleTask,
  onOpenTask,
  onOpenAll,
  onAddTask,
}: WeekScheduleProps) {
  const today = todayISO();
  const dayTasks = tasks
    .filter((task) => task.date === selectedDay)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'done' ? 1 : -1));
  const weekCount = tasks.filter((task) => weekDays.includes(task.date)).length;
  const doneCount = tasks.filter(
    (task) => weekDays.includes(task.date) && task.status === 'done',
  ).length;

  return (
    <Animated.View entering={FadeInUp.delay(60).duration(300)}>
      <SectionHeader
        title="本周日程"
        subtitle={`${doneCount}/${weekCount} 已完成 · 点击日期查看安排`}
        icon={<CalendarDays size={16} color={colors.success} strokeWidth={2} />}
        actionLabel="查看全部"
        onAction={onOpenAll}
      />

      <Card padded={false}>
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {weekDays.map((iso, index) => {
              const selected = iso === selectedDay;
              const isToday = iso === today;
              const count = tasks.filter((task) => task.date === iso).length;
              const done = tasks.filter(
                (task) => task.date === iso && task.status === 'done',
              ).length;
              return (
                <PressableScale
                  key={iso}
                  onPress={() => onSelectDay(iso)}
                  scaleTo={0.94}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 9,
                    borderRadius: radius.md,
                    backgroundColor: selected ? colors.brand : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontSize: 9.5,
                      color: selected ? 'rgba(255,255,255,0.82)' : colors.textTertiary,
                      fontWeight: '500',
                    }}>
                    {WEEKDAY_LABELS[index].replace('周', '')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: selected ? '#FFFFFF' : isToday ? colors.brand : colors.text,
                    }}>
                    {parseISO(iso).getDate()}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                    {Array.from({ length: Math.min(count, 3) }, (_, dot) => (
                      <View
                        key={dot}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor:
                            dot < done
                              ? selected
                                ? '#FFFFFF'
                                : colors.success
                              : selected
                                ? 'rgba(255,255,255,0.5)'
                                : '#DCDAED',
                        }}
                      />
                    ))}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View
          style={{
            marginTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 14,
            paddingBottom: 12,
            paddingTop: 8,
          }}>
          {dayTasks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 18, gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>这一天还没有安排</Text>
              <PressableScale
                onPress={onAddTask}
                haptic
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: radius.pill,
                  backgroundColor: colors.brandFaint,
                }}>
                <Plus size={12} color={colors.brand} strokeWidth={2.2} />
                <Text style={{ fontSize: 11, color: colors.brand, fontWeight: '600' }}>添加任务</Text>
              </PressableScale>
            </View>
          ) : (
            dayTasks.map((task) => {
              const done = task.status === 'done';
              const goal = task.goalId ? goals.find((item) => item.id === task.goalId) : undefined;
              return (
                <PressableScale
                  key={task.id}
                  onPress={() => onOpenTask(task.id)}
                  scaleTo={0.99}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 10,
                  }}>
                  <PressableScale
                    onPress={(event) => {
                      event.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    haptic
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: done ? colors.success : 'transparent',
                      borderWidth: done ? 0 : 1.5,
                      borderColor: '#D8D5EA',
                    }}>
                    {done ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                  </PressableScale>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: done ? colors.textTertiary : colors.text,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}
                      numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                        {task.allDay ? '全天' : formatTimeLabel(task.startTime)}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textTertiary }}>·</Text>
                      <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                        {formatDuration(task.duration)}
                      </Text>
                      {goal ? (
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: radius.pill,
                            backgroundColor: colors.brandFaint,
                          }}>
                          <Text style={{ fontSize: 9, color: colors.brand }} numberOfLines={1}>
                            {goal.title}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <ChevronRight size={14} color={colors.textTertiary} strokeWidth={2} />
                </PressableScale>
              );
            })
          )}
        </View>
      </Card>
    </Animated.View>
  );
}
