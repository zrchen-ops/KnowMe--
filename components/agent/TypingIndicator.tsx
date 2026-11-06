import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LogoMark } from '@/components/common/LogoMark';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';

function Dot({ index }: { index: number }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      index * 140,
      withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.25, { duration: 380 })), -1, true),
    );
  }, [index, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.brand,
        },
        style,
      ]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
      <LogoMark size={26} />
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderBottomLeftRadius: 7,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
        }}>
        <Dot index={0} />
        <Dot index={1} />
        <Dot index={2} />
        <Text style={{ fontSize: 10.5, color: colors.textTertiary, marginLeft: 4 }}>知我正在想</Text>
      </View>
    </View>
  );
}
