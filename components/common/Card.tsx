import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { cardShadow, radius } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: string;
}

export function Card({ children, style, padded = true, tone }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: tone ?? colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? 18 : 0,
          ...cardShadow,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
