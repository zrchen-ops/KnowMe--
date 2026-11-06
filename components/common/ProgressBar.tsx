import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export function ProgressBar({
  progress,
  color = colors.brand,
  trackColor = '#EFEEF8',
  height = 7,
  style,
  duration = 700,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(100, progress)) / 100, { duration });
  }, [duration, progress, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.min(1, value.value)) * width,
  }));

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
          overflow: 'hidden',
          width: '100%',
        },
        style,
      ]}>
      <Animated.View style={[{ height: '100%', borderRadius: height / 2, backgroundColor: color }, animatedStyle]} />
    </View>
  );
}
