import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { LogoMark } from '@/components/common/LogoMark';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  {
    title: '怎么称呼你？',
    hint: '只保存在这台设备上，随时可以在设置里改。',
    placeholder: '例如：小林',
    keyboard: 'default' as const,
  },
  {
    title: '最近在忙什么？',
    hint: '一句话就够，比如「准备英语六级」「在做毕业设计」。',
    placeholder: '例如：准备英语六级',
    keyboard: 'default' as const,
  },
  {
    title: '现在最想实现的一个目标？',
    hint: '我会把它变成你图谱里的第一个目标，之后再一起拆成每周动作。',
    placeholder: '例如：三个月内找到 Agent 方向的实习',
    keyboard: 'default' as const,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const currentName = useAppStore((state) => state.settings.displayName);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(currentName === '同学' ? '' : currentName);
  const [focus, setFocus] = useState('');
  const [goal, setGoal] = useState('');

  const values = [name, focus, goal];
  const setters = [setName, setFocus, setGoal];
  const isLast = step === STEPS.length - 1;
  const canContinue = step === 0 ? name.trim().length > 0 : true;
  const meta = STEPS[step];

  const finish = () => {
    completeOnboarding({ displayName: name, focus, goalTitle: goal });
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 32,
            paddingHorizontal: 22,
            paddingBottom: insets.bottom + 20,
          }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <LogoMark size={52} />
            <Text style={{ fontSize: 13, color: colors.textTertiary, letterSpacing: 1.2 }}>
              KNOW ME · 知我
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 26 }}>
            {STEPS.map((item, index) => (
              <View
                key={item.title}
                style={{
                  width: index === step ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: index <= step ? colors.brand : '#E4E0FF',
                }}
              />
            ))}
          </View>

          <View style={{ marginTop: 30, gap: 8 }}>
            <Text style={{ fontSize: 25, fontWeight: '700', color: colors.text, letterSpacing: -0.6 }}>
              {meta.title}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 19 }}>
              {meta.hint}
            </Text>
          </View>

          <Card style={{ marginTop: 20 }}>
            <TextInput
              value={values[step]}
              onChangeText={setters[step]}
              placeholder={meta.placeholder}
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType={isLast ? 'done' : 'next'}
              onSubmitEditing={next}
              style={{
                fontSize: 15,
                color: colors.text,
                paddingVertical: 6,
              }}
            />
          </Card>

          <View style={{ flex: 1 }} />

          <View style={{ gap: 10 }}>
            <AppButton
              label={isLast ? '完成，开始使用' : '下一步'}
              onPress={next}
              disabled={!canContinue}
            />
            {step > 0 ? (
              <AppButton label="跳过" variant="ghost" onPress={finish} />
            ) : (
              <AppButton
                label="我有演示数据，先看看"
                variant="ghost"
                onPress={() => {
                  useAppStore.getState().loadDemoData();
                  router.replace('/(tabs)');
                }}
              />
            )}
            <Text
              style={{
                fontSize: 10,
                color: colors.textTertiary,
                textAlign: 'center',
                lineHeight: 15,
              }}>
              你写下的内容会先整理成记忆，确认后才会进入图谱。所有数据默认只存在本机。
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
