import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { LocateFixed, Minus, Plus } from 'lucide-react-native';

import { colors, entityTones } from '@/constants/colors';
import { radius } from '@/constants/theme';
import {
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  matchesFilter,
  nodeRadius,
  shortEntityName,
  type GraphFilter,
} from '@/services/graph/layout';
import type { Entity, Relation } from '@/types';

interface MemoryGraphProps {
  entities: Entity[];
  relations: Relation[];
  filter: GraphFilter;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const MIN_SCALE = 0.55;
const MAX_SCALE = 2.4;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function linesFor(name: string): string[] {
  const short = shortEntityName(name);
  if (short.length <= 4) return [short];
  const middle = Math.ceil(short.length / 2);
  return [short.slice(0, middle), short.slice(middle)];
}

export function MemoryGraph({
  entities,
  relations,
  filter,
  selectedId,
  onSelect,
}: MemoryGraphProps) {
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureStart = useRef({ x: 0, y: 0, scale: 1, tx: 0, ty: 0 });

  const selectedMarker = useSharedValue(0);

  useEffect(() => {
    if (selectedId) {
      selectedMarker.value = 0.7;
      selectedMarker.value = withSpring(1, { stiffness: 240, damping: 18 });
    } else {
      selectedMarker.value = withTiming(0, { duration: 120 });
    }
  }, [selectedId, selectedMarker]);

  const reset = () => {
    scale.value = withSpring(1, { stiffness: 220, damping: 24 });
    translateX.value = withSpring(0, { stiffness: 220, damping: 24 });
    translateY.value = withSpring(0, { stiffness: 220, damping: 24 });
  };

  const zoomBy = (factor: number) => {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor));
    scale.value = withSpring(next, { stiffness: 240, damping: 26 });
  };

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(6)
      .onStart(() => {
        gestureStart.current.x = translateX.value;
        gestureStart.current.y = translateY.value;
      })
      .onUpdate((event) => {
        const limitX = Math.max(0, canvas.width * 0.55);
        const limitY = Math.max(0, canvas.height * 0.55);
        translateX.value = clamp(
          gestureStart.current.x + event.translationX,
          -limitX,
          limitX,
        );
        translateY.value = clamp(
          gestureStart.current.y + event.translationY,
          -limitY,
          limitY,
        );
      });

    const pinch = Gesture.Pinch()
      .onStart((event) => {
        gestureStart.current.scale = scale.value;
        gestureStart.current.tx = translateX.value;
        gestureStart.current.ty = translateY.value;
        gestureStart.current.x = event.focalX;
        gestureStart.current.y = event.focalY;
      })
      .onUpdate((event) => {
        const nextScale = clamp(
          gestureStart.current.scale * event.scale,
          MIN_SCALE,
          MAX_SCALE,
        );
        const originX = canvas.width / 2;
        const originY = canvas.height / 2;
        const focalX = gestureStart.current.x - originX;
        const focalY = gestureStart.current.y - originY;
        translateX.value =
          focalX - ((focalX - gestureStart.current.tx) / gestureStart.current.scale) * nextScale;
        translateY.value =
          focalY - ((focalY - gestureStart.current.ty) / gestureStart.current.scale) * nextScale;
        scale.value = nextScale;
      });

    return Gesture.Simultaneous(pan, pinch);
  }, [canvas.height, canvas.width, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: selectedMarker.value,
    transform: [{ scale: 0.7 + selectedMarker.value * 0.3 }],
  }));

  const selected = entities.find((entity) => entity.id === selectedId) ?? null;

  const filtered = entities.filter((entity) => matchesFilter(entity, filter));
  const visibleIds = new Set(filtered.map((entity) => entity.id));
  const visibleRelations = relations.filter(
    (relation) => visibleIds.has(relation.sourceId) && visibleIds.has(relation.targetId),
  );

  const fitScale =
    canvas.width > 0 && canvas.height > 0
      ? Math.min(canvas.width / GRAPH_WIDTH, canvas.height / GRAPH_HEIGHT)
      : 1;
  const offsetX = canvas.width > 0 ? (canvas.width - GRAPH_WIDTH * fitScale) / 2 : 0;
  const offsetY = canvas.height > 0 ? (canvas.height - GRAPH_HEIGHT * fitScale) / 2 : 0;

  return (
    <View
      style={{ flex: 1, minHeight: 260, borderRadius: radius.xl, overflow: 'hidden' }}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvas({ width, height });
      }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
            {visibleRelations.map((relation) => {
              const source = filtered.find((entity) => entity.id === relation.sourceId);
              const target = filtered.find((entity) => entity.id === relation.targetId);
              if (!source || !target) return null;
              const emphasis =
                selectedId !== null &&
                (relation.sourceId === selectedId || relation.targetId === selectedId);
              return (
                <Line
                  key={relation.id}
                  x1={source.position.x}
                  y1={source.position.y}
                  x2={target.position.x}
                  y2={target.position.y}
                  stroke={emphasis ? colors.brand : '#C9C5EF'}
                  strokeWidth={emphasis ? 2 : 1.1}
                  strokeOpacity={emphasis ? 0.9 : 0.5}
                />
              );
            })}

            {visibleRelations.map((relation) => {
              if (selectedId === null) return null;
              if (relation.sourceId !== selectedId && relation.targetId !== selectedId) {
                return null;
              }
              const source = filtered.find((entity) => entity.id === relation.sourceId);
              const target = filtered.find((entity) => entity.id === relation.targetId);
              if (!source || !target) return null;
              return (
                <SvgText
                  key={`${relation.id}-label`}
                  x={(source.position.x + target.position.x) / 2}
                  y={(source.position.y + target.position.y) / 2 - 5}
                  fill={colors.textSecondary}
                  fontSize={8.5}
                  fontWeight="500"
                  textAnchor="middle"
                  stroke={colors.bg}
                  strokeWidth={2.4}>
                  {relation.relationType}
                </SvgText>
              );
            })}

            {filtered.map((entity) => {
              const tone = entityTones[entity.type];
              const isSelf = entity.type === 'self';
              const isSelected = entity.id === selectedId;
              const r = nodeRadius(entity.type);
              return (
                <G key={entity.id}>
                  <Circle
                    cx={entity.position.x}
                    cy={entity.position.y}
                    r={r + 10}
                    fill="transparent"
                  />
                  <Circle
                    cx={entity.position.x}
                    cy={entity.position.y}
                    r={r + 5}
                    fill={tone.soft}
                    fillOpacity={isSelf ? 0.9 : 0.55}
                  />
                  <Circle
                    cx={entity.position.x}
                    cy={entity.position.y}
                    r={r}
                    fill={isSelf ? colors.brand : colors.card}
                    stroke={isSelected ? colors.brandDark : tone.color}
                    strokeWidth={isSelected ? 2.6 : 1.4}
                  />
                  <Circle
                    cx={entity.position.x}
                    cy={entity.position.y - r + 7}
                    r={3}
                    fill={isSelf ? '#FFFFFF' : tone.color}
                    fillOpacity={0.85}
                  />
                  <Circle
                    cx={entity.position.x}
                    cy={entity.position.y}
                    r={r}
                    fill="transparent"
                  />
                </G>
              );
            })}
          </Svg>

          {filtered.map((entity) => {
            const r = nodeRadius(entity.type);
            const isSelf = entity.type === 'self';
            const isSelected = entity.id === selectedId;
            const size = (r + 5) * 2 * fitScale;
            const lines = linesFor(entity.name);
            return (
              <Pressable
                key={`${entity.id}-hit`}
                accessibilityLabel={`节点 ${entity.name}`}
                accessibilityRole="button"
                onPress={() => onSelect(isSelected ? null : entity.id)}
                style={{
                  position: 'absolute',
                  left: offsetX + (entity.position.x - r - 5) * fitScale,
                  top: offsetY + (entity.position.y - r - 5) * fitScale,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {lines.map((line, index) => (
                    <Text
                      key={`${entity.id}-label-${index}`}
                      numberOfLines={1}
                      style={{
                        fontSize: (isSelf ? 19 : lines.length > 1 ? 11 : 12) * fitScale,
                        lineHeight: (isSelf ? 21 : lines.length > 1 ? 13 : 14) * fitScale,
                        fontWeight: isSelf ? '700' : '600',
                        color: isSelf ? '#FFFFFF' : entityTones[entity.type].color,
                      }}>
                      {line}
                    </Text>
                  ))}
                </View>
              </Pressable>
            );
          })}

          {selected ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: offsetX + (selected.position.x - 40) * fitScale,
                  top: offsetY + (selected.position.y - 40) * fitScale,
                  width: 80 * fitScale,
                  height: 80 * fitScale,
                  borderRadius: 40 * fitScale,
                  borderWidth: 2,
                  borderColor: colors.brand,
                  backgroundColor: 'rgba(113,101,245,0.06)',
                },
                markStyle,
              ]}
            />
          ) : null}
        </Animated.View>
      </GestureDetector>

      <Pressable
        onPress={reset}
        style={[
          styles.hint,
          { position: 'absolute', top: 12, left: 12 },
        ]}>
        <LocateFixed size={12} color={colors.brand} strokeWidth={2} />
        <Text style={{ fontSize: 10, color: colors.brand, fontWeight: '500' }}>
          双指缩放 · 拖动探索
        </Text>
      </Pressable>

      <View style={[styles.zoomGroup, { position: 'absolute', right: 12, bottom: 14 }]}>
        <Pressable onPress={() => zoomBy(1.2)} style={styles.zoomButton} hitSlop={6}>
          <Plus size={15} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Pressable onPress={() => zoomBy(0.82)} style={styles.zoomButton} hitSlop={6}>
          <Minus size={15} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoomGroup: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
