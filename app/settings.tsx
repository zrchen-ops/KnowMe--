import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { BrainCircuit, ChevronRight, Info, RotateCcw, ShieldCheck, Trash2, UserRound } from 'lucide-react-native';

import { AppButton } from '@/components/common/AppButton';
import { Card } from '@/components/common/Card';
import { LogoMark } from '@/components/common/LogoMark';
import { PressableScale } from '@/components/common/PressableScale';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { MemoryEditSheet } from '@/components/memory/MemoryEditSheet';
import { MemoryListSheet } from '@/components/memory/MemoryListSheet';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const clearAllData = useAppStore((state) => state.clearAllData);
  const loadDemoData = useAppStore((state) => state.loadDemoData);
  const memories = useAppStore((state) => state.memories);
  const entities = useAppStore((state) => state.entities);
  const goals = useAppStore((state) => state.goals);
  const tasks = useAppStore((state) => state.tasks);

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [memoryVisible, setMemoryVisible] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  const saveName = () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    updateSettings({ displayName: trimmed });
    useAppStore.getState().showToast('称呼已更新', 'success');
  };

  const pendingCount = memories.filter((memory) => memory.status === 'pending').length;

  return (
    <ScreenBackground>
      <ScreenHeader title="设置" subtitle="KnowMe 会用你确认过的信息来理解你。" onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 40, gap: 14 }}>
        <Card style={{ gap: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.brandFaint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <UserRound size={17} color={colors.brand} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>希望 Agent 怎么称呼你</Text>
              <Text style={{ fontSize: 10.5, color: colors.textTertiary }}>只保存在本机，不会上传</Text>
            </View>
          </View>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="知我"
            placeholderTextColor={colors.textTertiary}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: '#FAFAFE',
              borderRadius: radius.md,
              paddingHorizontal: 13,
              paddingVertical: 11,
              fontSize: 13.5,
              color: colors.text,
            }}
            onSubmitEditing={saveName}
            returnKeyType="done"
          />
          <AppButton label="保存称呼" compact variant="secondary" onPress={saveName} disabled={!displayName.trim()} />
        </Card>

        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7 }}>
            <ShieldCheck size={16} color={colors.success} strokeWidth={1.9} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '500', color: colors.text }}>自动确认 AI 记忆</Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2, lineHeight: 15 }}>
                关闭时，Agent 提取的记忆需要你逐条确认。
              </Text>
            </View>
            <Switch
              value={settings.autoConfirmMemories}
              onValueChange={(value) => {
                updateSettings({ autoConfirmMemories: value });
                useAppStore
                  .getState()
                  .showToast(value ? '新记忆将自动确认' : '新记忆需要手动确认', 'info');
              }}
              trackColor={{ false: '#E4E3EF', true: '#CDC8FA' }}
              thumbColor={settings.autoConfirmMemories ? colors.brand : '#FFFFFF'}
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <PressableScale
            onPress={() => setMemoryVisible(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11 }}>
            <BrainCircuit size={16} color={colors.brand} strokeWidth={1.9} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '500', color: colors.text }}>管理我的记忆</Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                {memories.length} 条记忆 · {pendingCount} 条待确认
              </Text>
            </View>
            <ChevronRight size={15} color={colors.textTertiary} strokeWidth={2} />
          </PressableScale>
        </Card>

        <Card style={{ gap: 11 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.text }}>数据概览</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: '记忆', value: memories.length },
              { label: '节点', value: entities.length },
              { label: '目标', value: goals.length },
              { label: '日程', value: tasks.length },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: '#FAFAFE',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.value}</Text>
                <Text style={{ fontSize: 9.5, color: colors.textTertiary, marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 10, color: colors.textTertiary, lineHeight: 15 }}>
            所有数据保存在本机 AsyncStorage 中，重启 App 后依然存在。未来接入大模型时只发送必要上下文。
          </Text>
        </Card>

        <Card>
          <PressableScale
            haptic
            onPress={() =>
              Alert.alert(
                '清空我的数据？',
                '记忆、目标、日程、事件与对话都会被清空，图谱只剩「我」这一个节点。无法撤销。',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '清空',
                    style: 'destructive',
                    onPress: () => {
                      clearAllData();
                      setMemoryVisible(false);
                      setEditingMemoryId(null);
                    },
                  },
                ],
              )
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }}>
            <Trash2 size={16} color={colors.danger} strokeWidth={1.9} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '500', color: colors.danger }}>清空我的数据</Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                从空白图谱重新开始
              </Text>
            </View>
          </PressableScale>

          <View
            style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }}
          />

          <PressableScale
            haptic
            onPress={() =>
              Alert.alert('载入演示数据？', '当前数据会被演示数据覆盖，无法撤销。', [
                { text: '取消', style: 'cancel' },
                {
                  text: '载入',
                  style: 'destructive',
                  onPress: () => {
                    loadDemoData();
                    setMemoryVisible(false);
                    setEditingMemoryId(null);
                  },
                },
              ])
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }}>
            <RotateCcw size={16} color={colors.textSecondary} strokeWidth={1.9} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '500', color: colors.text }}>载入演示数据</Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                体验完整的目标、日程与图谱样例
              </Text>
            </View>
          </PressableScale>
        </Card>

        <View style={{ alignItems: 'center', gap: 7, paddingTop: 8 }}>
          <LogoMark size={34} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>KnowMe 知我</Text>
          <Text style={{ fontSize: 10, color: colors.textTertiary }}>记住你的过去，理解你的现在，陪你走向更好的未来。</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Info size={10} color={colors.textTertiary} />
            <Text style={{ fontSize: 9.5, color: colors.textTertiary }}>版本 1.0.0 · 本地 Mock Agent</Text>
          </View>
        </View>
      </ScrollView>

      <MemoryListSheet
        visible={memoryVisible}
        onClose={() => setMemoryVisible(false)}
        onEdit={(id) => {
          setMemoryVisible(false);
          setEditingMemoryId(id);
        }}
      />
      <MemoryEditSheet memoryId={editingMemoryId} onClose={() => setEditingMemoryId(null)} />
    </ScreenBackground>
  );
}
