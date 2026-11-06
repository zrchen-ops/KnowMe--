import { Tabs } from 'expo-router';

import { KnowMeTabBar } from '@/components/common/KnowMeTabBar';

export const unstable_settings = {
  anchor: 'agent',
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <KnowMeTabBar {...props} />}
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}>
      <Tabs.Screen name="agent" options={{ title: 'Agent' }} />
      <Tabs.Screen name="graph" options={{ title: '图谱' }} />
      <Tabs.Screen name="growth" options={{ title: '成长' }} />
    </Tabs>
  );
}
