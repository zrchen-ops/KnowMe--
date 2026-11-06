import type { EntityType } from '@/types/memory';

export const colors = {
  brand: '#7165F5',
  brandDark: '#5747DB',
  brandSoft: '#EFEDFE',
  brandFaint: '#F7F6FF',

  blue: '#8EA7FF',
  blueSoft: '#EEF2FF',

  bg: '#F5F5FC',
  card: '#FFFFFF',

  text: '#191927',
  textSecondary: '#9293A7',
  textTertiary: '#B3B4C4',
  border: '#ECECF3',

  success: '#36B982',
  successSoft: '#E9F8F1',
  warning: '#F0A94C',
  warningSoft: '#FEF4E6',
  danger: '#EF6B7A',
  dangerSoft: '#FDEEF0',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(25,25,39,0.34)',

  gradients: {
    brand: ['#8B81FF', '#7165F5'] as const,
    brandDeep: ['#7165F5', '#5747DB'] as const,
    mist: ['#FBFAFF', '#F3F4FD'] as const,
    warm: ['#FFF8F2', '#FFF4FA'] as const,
    sky: ['#F2F6FF', '#F7F3FF'] as const,
  },
} as const;

export const entityTones: Record<EntityType, { color: string; soft: string; label: string }> = {
  self: { color: '#7165F5', soft: '#EFEDFE', label: '我' },
  goal: { color: '#7A6CF6', soft: '#F0EEFF', label: '目标' },
  plan: { color: '#5C8FF5', soft: '#ECF2FF', label: '长期计划' },
  person: { color: '#36B982', soft: '#E9F8F1', label: '人物' },
  event: { color: '#F0A94C', soft: '#FEF4E6', label: '事件' },
  interest: { color: '#F07C9A', soft: '#FDEDF2', label: '兴趣' },
  career: { color: '#4CB8C4', soft: '#E6F6F8', label: '职业规划' },
};
