import { Check, CheckCircle2, Clock3, Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { WEEKDAY_LABELS, formatWeekRange, relativeDayLabel, startOfWeekISO, weekdayIndex } from '@/utils/date';
import { PressableScale } from '@/components/common/PressableScale';

interface PlanCardProps {
  taskIds: string[];
  onOpenTask: (id: string) => void;
}

export function PlanCard({ taskIds, onOpenTask }: PlanCardProps) {
  const tasks = useAppStore((state) => state.tasks);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const planTasks = taskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is NonNullable<typeof task> => Boolean(task));

  if (planTasks.length === 0) return null;

  const doneCount = planTasks.filter((task) => task.status === 'done').length;

  return (
    <View
      style={{
        backgroundColor: '#FBFBFF',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: '#EDEDF7',
        padding: 14,
        marginTop: 2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Sparkles size={15} color={colors.brand} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>本周学习计划</Text>
          <Text style={{ fontSize: 10.5, color: colors.textTertiary, marginTop: 1 }}>
            {formatWeekRange(startOfWeekISO())}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
          {doneCount}/{planTasks.length}
        </Text>
      </View>

      <View style={{ marginTop: 8 }}>
        {planTasks.map((task, index) => {
          const done = task.status === 'done';
          const delta = relativeDayLabel(task.date);
          const dayLabel =
            delta === '今天' || delta === '明天' ? delta : WEEKDAY_LABELS[weekdayIndex(task.date)];
          const timeLabel = task.allDay ? '全天' : task.startTime ?? '';
          return (
            <View key={task.id}>
              {index > 0 ? (
                <View style={{ height: 1, backgroundColor: '#EFEFF7', marginVertical: 2 }} />
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  gap: 10,
                }}>
                <PressableScale
                  onPress={() => toggleTask(task.id)}
                  haptic
                  style={{
                    width: 21,
                    height: 21,
                    borderRadius: 11,
                    borderWidth: done ? 0 : 1.5,
                    borderColor: done ? colors.success : '#D9D8E6',
                    backgroundColor: done ? colors.success : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                </PressableScale>

                <PressableScale
                  onPress={() => onOpenTask(task.id)}
                  style={{ flex: 1, justifyContent: 'center' }}
                  scaleTo={0.985}>
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '500',
                      color: done ? colors.textTertiary : colors.text,
                      textDecorationLine: done ? 'line-through' : 'none',
                    }}>
                    {task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <Clock3 size={11} color={colors.textTertiary} strokeWidth={1.8} />
                    <Text style={{ fontSize: 10.5, color: colors.textSecondary }}>
                      {dayLabel}
                      {timeLabel ? ` ${timeLabel}` : ''} · {task.duration}h
                    </Text>
                    {task.goalId ? (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 5,
                          backgroundColor: colors.brandSoft,
                        }}>
                        <Text style={{ fontSize: 9, color: colors.brand, fontWeight: '600' }}>目标</Text>
                      </View>
                    ) : null}
                  </View>
                </PressableScale>
              </View>
            </View>
          );
        })}
      </View>

      {doneCount === planTasks.length ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#EFEFF7',
          }}>
          <CheckCircle2 size={14} color={colors.success} strokeWidth={2} />
          <Text style={{ fontSize: 11.5, color: colors.success, fontWeight: '500' }}>
            本周计划全部完成，去成长页看看你的复盘吧
          </Text>
        </View>
      ) : null}
    </View>
  );
}
