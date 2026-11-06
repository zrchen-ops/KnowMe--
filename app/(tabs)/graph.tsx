import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Share, Text, useWindowDimensions, View } from 'react-native';
import { BrainCircuit, Plus, Share2, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { IconButton } from '@/components/common/IconButton';
import { LogoMark } from '@/components/common/LogoMark';
import { PressableScale } from '@/components/common/PressableScale';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { MemoryGraph } from '@/components/graph/MemoryGraph';
import { NodeDetailSheet } from '@/components/graph/NodeDetailSheet';
import { NodeEditorSheet } from '@/components/graph/NodeEditorSheet';
import { MemoryListSheet } from '@/components/memory/MemoryListSheet';
import { MemoryEditSheet } from '@/components/memory/MemoryEditSheet';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { GRAPH_FILTERS, type GraphFilter } from '@/services/graph/layout';
import { buildConcern, computeGrowthStats } from '@/services/growth/stats';
import { useAppStore } from '@/store/useAppStore';
import type { Entity } from '@/types';

export default function GraphScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const entities = useAppStore((state) => state.entities);
  const relations = useAppStore((state) => state.relations);
  const goals = useAppStore((state) => state.goals);
  const tasks = useAppStore((state) => state.tasks);
  const events = useAppStore((state) => state.events);
  const resetData = useAppStore((state) => state.resetData);

  const [filter, setFilter] = useState<GraphFilter>('全部');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [memoryListVisible, setMemoryListVisible] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  const graphHeight = Math.max(320, windowHeight - insets.top - 304);
  const stats = computeGrowthStats(events, tasks, goals);
  const concern = buildConcern(goals, stats);
  const self = entities.find((entity) => entity.type === 'self');
  const pendingCount = useAppStore(
    (state) => state.memories.filter((memory) => memory.status === 'pending').length,
  );

  const shareGraph = () => {
    void Share.share({
      message: `我的 KnowMe 记忆图谱里有 ${entities.length - 1} 个节点、${relations.length} 条关系。\n「${concern}」`,
    });
  };

  const openMore = () => {
    Alert.alert('图谱设置', '选择要执行的操作', [
      {
        text: '添加记忆节点',
        onPress: () => {
          setEditingEntity(null);
          setEditorVisible(true);
        },
      },
      {
        text: '管理我的记忆',
        onPress: () => setMemoryListVisible(true),
      },
      {
        text: '重置演示数据',
        style: 'destructive',
        onPress: () =>
          Alert.alert('重置数据？', '当前添加的目标、任务与记忆都会恢复为演示数据。', [
            { text: '取消', style: 'cancel' },
            { text: '重置', style: 'destructive', onPress: resetData },
          ]),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const openEditorFor = (entity: Entity | null) => {
    setSelectedId(null);
    setEditingEntity(entity);
    setEditorVisible(true);
  };

  return (
    <ScreenBackground>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: spacing.screen }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <LogoMark size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.textTertiary, letterSpacing: 1.2 }}>
                KNOWME MEMORY
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '700',
                  color: colors.text,
                  letterSpacing: -0.7,
                  marginTop: 1,
                }}>
                我的图谱
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon={Share2} onPress={shareGraph} label="分享图谱" size={16} />
            <IconButton icon={Sparkles} onPress={openMore} label="更多操作" size={16} />
          </View>
        </View>

        <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 7 }}>
          {entities.length - 1} 个节点 · {relations.length} 条关系 · 由你和 Agent 共同生长
        </Text>
      </View>

      <View style={{ paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: spacing.screen }}>
          {GRAPH_FILTERS.map((item) => (
            <FilterChip
              key={item}
              label={item}
              compact
              active={filter === item}
              onPress={() => {
                setFilter(item);
                setSelectedId(null);
              }}
            />
          ))}
        </View>
      </View>

      <View
        style={{
          height: graphHeight,
          marginHorizontal: spacing.screen,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'rgba(255,255,255,0.6)',
          overflow: 'hidden',
        }}>
        <LinearGradient
          colors={['#FBFAFF', '#F6F4FF', '#F3F6FE']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <MemoryGraph
          entities={entities}
          relations={relations}
          filter={filter}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <PressableScale
            haptic
            onPress={() => openEditorFor(null)}
            accessibilityLabel="添加节点"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.brandDark,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 10,
            }}>
            <LinearGradient
              colors={colors.gradients.brandDeep}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
          </PressableScale>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: spacing.screen,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 10) + 76,
        }}>
        <Card padded={false} style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
          <PressableScale
            onPress={() => router.push('/growth')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.warningSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <BrainCircuit size={17} color={colors.warning} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '600' }}>需要关注</Text>
              <Text style={{ fontSize: 11.5, color: colors.textSecondary, lineHeight: 17, marginTop: 2 }}>
                {concern}
              </Text>
            </View>
            {self ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: colors.brandFaint,
                }}>
                <Text style={{ fontSize: 9.5, color: colors.brand, fontWeight: '500' }}>
                  {pendingCount > 0 ? `${pendingCount} 条待确认` : '关联成长'}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        </Card>
      </View>

      <NodeDetailSheet
        entityId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(id) => {
          const entity = entities.find((item) => item.id === id) ?? null;
          openEditorFor(entity);
        }}
        onOpenGoal={(goalId) => router.push({ pathname: '/goal/[id]', params: { id: goalId } })}
      />
      <NodeEditorSheet
        visible={editorVisible}
        entity={editingEntity}
        onClose={() => {
          setEditorVisible(false);
          if (editingEntity) {
            const stillExists = useAppStore
              .getState()
              .entities.some((item) => item.id === editingEntity.id);
            setSelectedId(stillExists ? editingEntity.id : null);
          }
          setEditingEntity(null);
        }}
      />
      <MemoryListSheet
        visible={memoryListVisible}
        onClose={() => setMemoryListVisible(false)}
        onEdit={(memoryId) => {
          setMemoryListVisible(false);
          setEditingMemoryId(memoryId);
        }}
      />
      <MemoryEditSheet memoryId={editingMemoryId} onClose={() => setEditingMemoryId(null)} />
    </ScreenBackground>
  );
}
