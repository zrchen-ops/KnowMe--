import { Text, View } from 'react-native';
import { Check, Plus } from 'lucide-react-native';

import { AppButton } from '@/components/common/AppButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { PressableScale } from '@/components/common/PressableScale';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { Task } from '@/types';
import {
  WEEKDAY_LABELS,
  formatDuration,
  formatMonthDay,
  formatTimeLabel,
  parseISO,
  todayISO,
} from '@/utils/date';

interface WeekPlanSheetProps {
  visible: boolean;
  weekDays: string[];
  tasks: Task[];
  onClose: () => void;
  onToggleTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  onAddTask: () => void;
}

export function WeekPlanSheet({
  visible,
  weekDays,
  tasks,
  onClose,
  onToggleTask,
  onOpenTask,
  onAddTask,
}: WeekPlanSheetProps) {
  const today = todayISO();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="本周全部日程"
      subtitle={`${formatMonthDay(weekDays[0])} - ${formatMonthDay(weekDays[6])}`}>
      <View style={{ gap: 14, paddingBottom: 4 }}>
        {weekDays.map((iso, index) => {
          const dayTasks = tasks.filter((task) => task.date === iso);
          if (dayTasks.length === 0) return null;
          return (
            <View key={iso} style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: iso === today ? colors.brand : colors.text,
                  }}>
                  {WEEKDAY_LABELS[index]} · {parseISO(iso).getDate()} 日
                </Text>
                {iso === today ? (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: radius.pill,
                      backgroundColor: colors.brandFaint,
                    }}>
                    <Text style={{ fontSize: 8.5, color: colors.brand }}>今天</Text>
                  </View>
                ) : null}
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
              {dayTasks.map((task) => {
                const done = task.status === 'done';
                return (
                  <PressableScale
                    key={task.id}
                    onPress={() => {
                      onClose();
                      onOpenTask(task.id);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
                      borderRadius: radius.md,
                      backgroundColor: '#FAFAFE',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <PressableScale
                      onPress={(event) => {
                        event.stopPropagation();
                        onToggleTask(task.id);
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
                        {task.allDay ? '全天' : formatTimeLabel(task.startTime)} ·{' '}
                        {formatDuration(task.duration)}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          );
        })}
        <AppButton
          label="新建日程"
          variant="secondary"
          compact
          icon={<Plus size={14} color={colors.brand} strokeWidth={2} />}
          onPress={() => {
            onClose();
            onAddTask();
          }}
        />
      </View>
    </BottomSheet>
  );
}
