import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/colors';
import { floatingShadow, radius } from '@/constants/theme';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
  compact,
}: AppButtonProps) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {icon}
      <Text
        style={{
          fontSize: compact ? 13 : 14.5,
          fontWeight: '600',
          letterSpacing: -0.1,
          color:
            variant === 'primary'
              ? '#FFFFFF'
              : variant === 'danger'
                ? colors.danger
                : colors.brand,
        }}>
        {label}
      </Text>
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic
      style={[
        {
          borderRadius: radius.md,
          paddingVertical: compact ? 9 : 14,
          paddingHorizontal: compact ? 14 : 18,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          overflow: 'hidden',
          ...(variant === 'primary' ? floatingShadow : {}),
        },
        variant === 'secondary' && {
          backgroundColor: colors.brandFaint,
          borderWidth: 1,
          borderColor: '#E4E0FF',
        },
        variant === 'ghost' && {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        variant === 'danger' && {
          backgroundColor: colors.dangerSoft,
        },
        style,
      ]}>
      {variant === 'primary' ? (
        <>
          <LinearGradient
            colors={colors.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {content}
        </>
      ) : (
        content
      )}
    </PressableScale>
  );
}
