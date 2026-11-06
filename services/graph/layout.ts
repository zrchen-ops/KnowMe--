import type { Entity, EntityType } from '@/types';

export const GRAPH_WIDTH = 360;
export const GRAPH_HEIGHT = 540;

const RADIUS: Record<EntityType, number> = {
  self: 38,
  goal: 30,
  plan: 28,
  person: 27,
  event: 27,
  interest: 26,
  career: 27,
};

export function nodeRadius(type: EntityType): number {
  return RADIUS[type] ?? 27;
}

const SLOTS: { x: number; y: number }[] = [
  { x: 286, y: 112 },
  { x: 68, y: 138 },
  { x: 304, y: 312 },
  { x: 54, y: 330 },
  { x: 254, y: 448 },
  { x: 96, y: 446 },
  { x: 182, y: 88 },
  { x: 180, y: 486 },
  { x: 312, y: 214 },
  { x: 46, y: 226 },
  { x: 226, y: 170 },
  { x: 128, y: 196 },
];

export function nodePosition(entities: Entity[], index: number): { x: number; y: number } {
  const used = new Set(
    entities
      .filter((entity) => entity.type !== 'self')
      .map((entity) => `${Math.round(entity.position.x)}:${Math.round(entity.position.y)}`),
  );
  for (let offset = 0; offset < SLOTS.length; offset += 1) {
    const slot = SLOTS[(index + offset) % SLOTS.length];
    if (!used.has(`${slot.x}:${slot.y}`)) {
      return { ...slot };
    }
  }
  return SLOTS[index % SLOTS.length];
}

export function shortEntityName(name: string): string {
  const cleaned = name
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/^(通过|参加|坚持|获得|拿下|完成|准备|好好)/, '')
    .trim();
  if (cleaned.length <= 6) return cleaned;
  return `${cleaned.slice(0, 6)}…`;
}

export const GRAPH_FILTERS = ['全部', '人物', '目标', '事件', '兴趣'] as const;
export type GraphFilter = (typeof GRAPH_FILTERS)[number];

export function matchesFilter(entity: Entity, filter: GraphFilter): boolean {
  if (filter === '全部' || entity.type === 'self') return true;
  if (filter === '人物') return entity.type === 'person';
  if (filter === '事件') return entity.type === 'event';
  if (filter === '兴趣') return entity.type === 'interest';
  return entity.type === 'goal' || entity.type === 'plan' || entity.type === 'career';
}
