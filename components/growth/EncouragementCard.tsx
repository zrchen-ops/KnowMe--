import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Award, Sparkles } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { GrowthStats } from '@/services/growth/stats';
import { formatDuration } from '@/utils/date';

interface EncouragementCardProps {
  stats: GrowthStats;
}

export function EncouragementCard({ stats }: EncouragementCardProps) {
  const rate = stats.completionRate;
  const headline =
    rate >= 80 ? '本周表现很棒！' : rate >= 50 ? '稳步前进中！' : '从一件小事开始吧！';
  const body =
    rate >= 80
      ? `你完成了 ${stats.completedTasks} 项任务，学习 ${formatDuration(stats.studyHours)}。继续保持，向着目标前进吧。`
      : rate >= 50
        ? `本周完成了 ${stats.completedTasks}/${stats.totalTasks} 项安排，节奏正在形成，下一次会更好。`
        : `本周还有 ${stats.pendingTasks} 项待完成。先把最重要的一件做好，成长就会开始发生。`;

  return (
    <Animated.View entering={FadeInUp.delay(180).duration(320)}>
      <View
        style={{
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#EAE5FA',
          minHeight: 144,
          justifyContent: 'center',
        }}>
        <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0.4" y2="1">
              <Stop offset="0" stopColor="#F7F1FF" />
              <Stop offset="0.55" stopColor="#EEF3FF" />
              <Stop offset="1" stopColor="#EAF7F3" />
            </LinearGradient>
            <LinearGradient id="hillFar" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#D9D2FA" />
              <Stop offset="1" stopColor="#C7D7F7" />
            </LinearGradient>
            <LinearGradient id="hillNear" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#BCE8D8" />
              <Stop offset="1" stopColor="#D3E6FA" />
            </LinearGradient>
          </Defs>
          <Path d="M0 0 H360 V144 H0 Z" fill="url(#sky)" />
          <Circle cx="292" cy="38" r="19" fill="#FFF2D4" opacity={0.9} />
          <Circle cx="292" cy="38" r="28" fill="#FFF2D4" opacity={0.32} />
          <Path
            d="M-20 150 C40 96 104 86 158 116 C210 145 250 104 300 96 C338 90 370 106 390 120 L390 160 L-20 160 Z"
            fill="url(#hillFar)"
            opacity={0.75}
          />
          <Path
            d="M-20 158 C36 128 92 122 138 138 C188 156 236 126 286 130 C330 133 366 142 390 150 L390 168 L-20 168 Z"
            fill="url(#hillNear)"
            opacity={0.9}
          />
          <Circle cx="66" cy="58" r="2" fill="#FFFFFF" opacity={0.9} />
          <Circle cx="118" cy="38" r="1.6" fill="#FFFFFF" opacity={0.8} />
          <Circle cx="200" cy="52" r="1.8" fill="#FFFFFF" opacity={0.8} />
        </Svg>

        <View style={{ padding: 16, gap: 9, paddingRight: 40 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: radius.pill,
              backgroundColor: 'rgba(255,255,255,0.72)',
            }}>
            <Award size={11} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 9.5, color: colors.brand, fontWeight: '600' }}>成长鼓励</Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.4 }}>
            {headline}
          </Text>
          <Text style={{ fontSize: 11.5, color: '#5C5970', lineHeight: 17, maxWidth: 250 }}>{body}</Text>
        </View>

        <View style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.7 }}>
          <Sparkles size={20} color={colors.brand} strokeWidth={1.8} />
        </View>
      </View>
    </Animated.View>
  );
}
