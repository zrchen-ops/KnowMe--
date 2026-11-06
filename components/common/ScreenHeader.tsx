import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  noBack?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, noBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 14 }}>
      <View style={{ height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {noBack ? (
          <View style={{ width: 38 }} />
        ) : (
          <IconButton icon={ChevronLeft} onPress={onBack ?? (() => {})} label="返回" />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{right}</View>
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.6,
          marginTop: 10,
        }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
