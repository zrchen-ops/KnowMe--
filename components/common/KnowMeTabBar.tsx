import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Sprout, Waypoints, type LucideIcon } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { PressableScale } from './PressableScale';

const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  agent: { label: 'Agent', icon: Sparkles },
  graph: { label: '图谱', icon: Waypoints },
  growth: { label: '成长', icon: Sprout },
};

interface TabBarState {
  routes: { key: string; name: string }[];
  index: number;
}

interface KnowMeTabBarProps {
  state: TabBarState;
}

const TAB_HREF: Record<string, '/agent' | '/graph' | '/growth'> = {
  agent: '/agent',
  graph: '/graph',
  growth: '/growth',
};

export function KnowMeTabBar({ state }: KnowMeTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        paddingHorizontal: 16,
        backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.88)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(236,236,243,0.9)',
        shadowColor: '#2B2350',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
        elevation: 10,
      }}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="light" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52 }}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name] ?? { label: route.name, icon: Sparkles };
          const focused = state.index === index;
          const Glyph = meta.icon;
          return (
            <PressableScale
              key={route.key}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
              scaleTo={0.94}
              haptic
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                if (!focused) {
                  router.navigate(TAB_HREF[route.name] ?? '/agent');
                }
              }}>
              <View
                style={{
                  width: 44,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.brandSoft : 'transparent',
                }}>
                <Glyph
                  size={20}
                  color={focused ? colors.brand : '#A8A9B8'}
                  strokeWidth={focused ? 2.2 : 1.9}
                />
              </View>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: focused ? '600' : '500',
                  color: focused ? colors.brand : '#A0A1B0',
                  letterSpacing: 0.1,
                }}>
                {meta.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
