import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CalendarDays, Flag, Sparkles } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { addDaysISO, formatChineseDate, todayISO } from '@/utils/date';

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

const DEADLINE_PRESETS = [
  { label: '1 个月后', days: 30 },
  { label: '3 个月后', days: 90 },
  { label: '本学期末', days: 150 },
];

export default function CreateGoalScreen() {
  const addGoal = useAppStore((state) => state.addGoal);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(addDaysISO(todayISO(), 90));
  const [deadlineText, setDeadlineText] = useState(addDaysISO(todayISO(), 90));
  const [milestoneText, setMilestoneText] = useState('');
  const [progress, setProgress] = useState(0);

  const applyDeadline = (days: number) => {
    const next = addDaysISO(todayISO(), days);
    setDeadline(next);
    setDeadlineText(next);
  };

  const updateDeadlineText = (value: string) => {
    setDeadlineText(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setDeadline(value);
    }
  };

  const save = () => {
    if (!title.trim()) return;
    const milestones = milestoneText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const id = addGoal({
      title: title.trim(),
      description: description.trim() || '希望在这个阶段完成这件事。',
      deadline: deadlineText.match(/^\d{4}-\d{2}-\d{2}$/) ? deadlineText : deadline,
      progress,
      milestones,
    });
    router.replace({ pathname: '/goal/[id]', params: { id } });
  };

  return (
    <ScreenBackground>
      <ScreenHeader title="制定新目标" subtitle="目标会同时出现在图谱与成长空间。" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingBottom: 40,
            gap: 16,
          }}>
          <Animated.View entering={FadeInUp.duration(280)}>
            <Card style={{ gap: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: colors.brandFaint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Flag size={13} color={colors.brand} strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>目标信息</Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>目标名称</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="例如：通过英语六级"
                  placeholderTextColor={colors.textTertiary}
                  style={fieldStyle}
                  autoFocus
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>为什么想完成它</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="写下一句提醒自己的话..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={[fieldStyle, { minHeight: 74, textAlignVertical: 'top' }]}
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(60).duration(280)}>
            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={13} color={colors.brand} strokeWidth={2} />
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>截止日期</Text>
                <Text style={{ fontSize: 10, color: colors.textTertiary }}>{formatChineseDate(deadline)}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DEADLINE_PRESETS.map((preset) => (
                  <FilterChip
                    key={preset.label}
                    label={preset.label}
                    compact
                    active={
                      deadline === addDaysISO(todayISO(), preset.days)
                    }
                    onPress={() => applyDeadline(preset.days)}
                  />
                ))}
              </View>

              <TextInput
                value={deadlineText}
                onChangeText={updateDeadlineText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                style={fieldStyle}
                keyboardType="numbers-and-punctuation"
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(280)}>
            <Card style={{ gap: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} color={colors.brand} strokeWidth={2} />
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>里程碑与起点</Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>
                  里程碑（每行一个，可选）
                </Text>
                <TextInput
                  value={milestoneText}
                  onChangeText={setMilestoneText}
                  placeholder={'背完六级核心词汇\n完成 3 套真题'}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={[fieldStyle, { minHeight: 82, textAlignVertical: 'top' }]}
                />
              </View>

              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>当前进度</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[0, 25, 50, 75].map((value) => (
                    <FilterChip
                      key={value}
                      label={`${value}%`}
                      compact
                      active={progress === value}
                      onPress={() => setProgress(value)}
                    />
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>

          <Text style={{ fontSize: 10.5, color: colors.textTertiary, lineHeight: 16, paddingHorizontal: 4 }}>
            保存后会自动生成一条已确认的个人记忆，并在「我的图谱」中创建目标节点。进度会随着相关任务完成而变化。
          </Text>

          <AppButton label="创建目标" onPress={save} disabled={!title.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
