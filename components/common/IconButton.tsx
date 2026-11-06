import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { PressableScale } from './PressableScale';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

export function IconButton({
  icon: Glyph,
  onPress,
  size = 18,
  color = colors.text,
  backgroundColor = 'rgba(255,255,255,0.82)',
  label,
}: IconButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      haptic
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <View pointerEvents="none">
        <Glyph size={size} color={color} strokeWidth={1.9} />
      </View>
    </PressableScale>
  );
}
