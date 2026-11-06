import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>这个页面不存在</Text>
        <Link href="/agent" style={styles.link}>
          <Text style={styles.linkText}>回到 Agent</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  link: {
    marginTop: 14,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '500',
  },
});
