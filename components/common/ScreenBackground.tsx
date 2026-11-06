import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

interface ScreenBackgroundProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <LinearGradient
        colors={['#F8F6FF', '#F5F5FC', '#F4F5FC']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: '#E7E2FF',
          opacity: 0.5,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 180,
          left: -110,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#E6EDFF',
          opacity: 0.42,
        }}
      />
      {children}
    </View>
  );
}
