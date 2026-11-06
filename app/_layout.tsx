import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '@/components/common/Toast';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

// 必须在模块作用域调用，晚于首帧就会被系统忽略（见 expo-splash-screen 文档）。
void SplashScreen.preventAutoHideAsync();

// AsyncStorage 读取失败时不能把用户永久卡在启动页，超过这个时间就直接放行。
const HYDRATION_TIMEOUT_MS = 4000;

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * 等持久化读完再渲染首帧：否则会先闪一下初始状态（或上一次的演示数据），
 * 再被 AsyncStorage 的内容覆盖（P1-4）。
 */
function useHydrationGate(): boolean {
  const hydrated = useAppStore((state) => state.hydrated);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return hydrated || timedOut;
}

export default function RootLayout() {
  const ready = useHydrationGate();
  const onboarded = useAppStore((state) => state.settings.onboarded);
  // 老版本持久化的数据没有 onboarded 字段：已经有内容就不该再拦一次引导。
  const hasUserData = useAppStore((state) => state.memories.length > 0 || state.goals.length > 0);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // 首次使用先做三问引导；`onboarded` 会被持久化，之后不再打断。
  useEffect(() => {
    if (ready && !onboarded && !hasUserData) router.replace('/onboarding');
  }, [ready, onboarded, hasUserData]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="goal/create" />
          <Stack.Screen name="goal/[id]" />
          <Stack.Screen name="task/create" />
          <Stack.Screen name="task/[id]" />
          <Stack.Screen name="review/index" />
          <Stack.Screen name="settings" />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
