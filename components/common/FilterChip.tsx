import { Text } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { PressableScale } from './PressableScale';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}

export function FilterChip({ label, active, onPress, compact }: FilterChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      haptic
      style={{
        paddingVertical: compact ? 7 : 9,
        paddingHorizontal: compact ? 12 : 16,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.brand : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.brand : colors.border,
      }}>
      <Text
        style={{
          fontSize: compact ? 12 : 13,
          fontWeight: active ? '600' : '500',
          color: active ? '#FFFFFF' : colors.textSecondary,
        }}>
        {label}
      </Text>
    </PressableScale>
  );
}
