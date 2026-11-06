import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { floatingShadow, radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { PressableScale } from './PressableScale';

export function Toast() {
  const toast = useAppStore((state) => state.toast);
  const dismiss = useAppStore((state) => state.dismissToast);
  const insets = useSafeAreaInsets();

  if (!toast) return null;

  const icon =
    toast.tone === 'error' ? (
      <AlertCircle size={17} color={colors.danger} strokeWidth={2} />
    ) : toast.tone === 'info' ? (
      <Info size={17} color={colors.brand} strokeWidth={2} />
    ) : (
      <CheckCircle2 size={17} color={colors.success} strokeWidth={2} />
    );

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(240)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: insets.bottom + 88,
        alignItems: 'center',
      }}>
      <PressableScale
        onPress={dismiss}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 11,
          paddingLeft: 14,
          paddingRight: 10,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderWidth: 1,
          borderColor: colors.border,
          maxWidth: '100%',
          ...floatingShadow,
        }}>
        {icon}
        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500', flexShrink: 1 }}>
          {toast.message}
        </Text>
        <X size={13} color={colors.textTertiary} strokeWidth={2} />
      </PressableScale>
    </Animated.View>
  );
}
