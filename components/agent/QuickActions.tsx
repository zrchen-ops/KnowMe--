import { Brain, ClipboardCheck, Target, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { PressableScale } from '@/components/common/PressableScale';

interface QuickActionsProps {
  onMemory: () => void;
  onGoal: () => void;
  onReview: () => void;
}

const ACTIONS: { key: 'memory' | 'goal' | 'review'; label: string; icon: LucideIcon; color: string; soft: string }[] = [
  { key: 'memory', label: '查看我的记忆', icon: Brain, color: colors.brand, soft: colors.brandSoft },
  { key: 'goal', label: '制定新目标', icon: Target, color: colors.success, soft: colors.successSoft },
  { key: 'review', label: '本周复盘', icon: ClipboardCheck, color: '#4CB8C4', soft: '#E6F6F8' },
];

export function QuickActions({ onMemory, onGoal, onReview }: QuickActionsProps) {
  const handlers = { memory: onMemory, goal: onGoal, review: onReview };
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
      {ACTIONS.map((action) => {
        const Glyph = action.icon;
        return (
          <PressableScale
            key={action.key}
            onPress={handlers[action.key]}
            haptic
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 15,
              paddingVertical: 11,
              paddingHorizontal: 6,
              alignItems: 'center',
              gap: 6,
            }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: action.soft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Glyph size={15} color={action.color} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: '500',
                textAlign: 'center',
              }}>
              {action.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
