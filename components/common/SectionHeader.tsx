import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
  icon?: ReactNode;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, right, icon }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, letterSpacing: -0.2 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right}
      {actionLabel && onAction ? (
        <Text
          onPress={onAction}
          suppressHighlighting
          style={{ fontSize: 12.5, color: colors.brand, fontWeight: '600' }}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}
