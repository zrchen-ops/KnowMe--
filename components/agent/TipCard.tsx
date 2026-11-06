import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { buildTrendTip, computeGrowthStats } from '@/services/growth/stats';
import { useAppStore } from '@/store/useAppStore';

export function TipCard() {
  const events = useAppStore((state) => state.events);
  const tasks = useAppStore((state) => state.tasks);
  const goals = useAppStore((state) => state.goals);
  const stats = computeGrowthStats(events, tasks, goals);
  const trendUp = stats.hoursDeltaPct >= 0;

  return (
    <LinearGradient
      colors={['#F4F1FF', '#FDFCFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: '#EAE5FF',
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        maxWidth: '94%',
      }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#EEEAFE',
        }}>
        <Lightbulb size={17} color={colors.brand} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.brand, letterSpacing: 0.2 }}>
          小提示
        </Text>
        <Text style={{ fontSize: 12.5, color: '#4C4867', lineHeight: 18.5, marginTop: 3 }}>
          {buildTrendTip(stats)}
        </Text>
      </View>
      <View
        style={{
          alignItems: 'center',
          gap: 2,
          paddingHorizontal: 8,
          paddingVertical: 7,
          borderRadius: 11,
          backgroundColor: trendUp ? colors.successSoft : colors.warningSoft,
        }}>
        {trendUp ? (
          <TrendingUp size={15} color={colors.success} strokeWidth={2} />
        ) : (
          <TrendingDown size={15} color={colors.warning} strokeWidth={2} />
        )}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: trendUp ? colors.success : colors.warning,
          }}>
          {stats.hoursDeltaPct > 0 ? '+' : ''}
          {stats.hoursDeltaPct}%
        </Text>
      </View>
    </LinearGradient>
  );
}
