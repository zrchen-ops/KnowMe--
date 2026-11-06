import { Platform } from 'react-native';

import { colors } from './colors';

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const spacing = {
  screen: 20,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#241E4E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  android: {
    elevation: 2,
    shadowColor: '#241E4E',
  },
  default: {},
});

export const floatingShadow = Platform.select({
  ios: {
    shadowColor: '#3B2E7A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  android: {
    elevation: 6,
    shadowColor: '#3B2E7A',
  },
  default: {},
});

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, color: colors.text },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, color: colors.text },
  section: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 14.5, fontWeight: '400' as const, color: colors.text, lineHeight: 21 },
  caption: { fontSize: 12.5, fontWeight: '400' as const, color: colors.textSecondary },
  tiny: { fontSize: 11.5, fontWeight: '500' as const, color: colors.textTertiary },
};

export const entityTypeMeta = {
  self: { label: '我', filter: '全部' },
  goal: { label: '目标', filter: '目标' },
  plan: { label: '长期计划', filter: '目标' },
  person: { label: '人物', filter: '人物' },
  event: { label: '事件', filter: '事件' },
  interest: { label: '兴趣', filter: '兴趣' },
  career: { label: '职业规划', filter: '目标' },
} as const;

export const categoryMeta: Record<string, { label: string; color: string; soft: string }> = {
  study: { label: '学习', color: colors.brand, soft: colors.brandSoft },
  fitness: { label: '运动', color: colors.success, soft: colors.successSoft },
  career: { label: '职业', color: '#4CB8C4', soft: '#E6F6F8' },
  life: { label: '生活', color: colors.warning, soft: colors.warningSoft },
  other: { label: '其他', color: colors.textSecondary, soft: '#F1F1F7' },
};

export const memoryTypeMeta: Record<string, { label: string; color: string; soft: string }> = {
  goal: { label: '目标', color: colors.brand, soft: colors.brandSoft },
  task: { label: '任务', color: colors.blue, soft: colors.blueSoft },
  event: { label: '事件', color: colors.warning, soft: colors.warningSoft },
  interest: { label: '兴趣', color: '#F07C9A', soft: '#FDEDF2' },
  person: { label: '人物', color: colors.success, soft: colors.successSoft },
  plan: { label: '计划', color: '#4CB8C4', soft: '#E6F6F8' },
  preference: { label: '偏好', color: colors.textSecondary, soft: '#F1F1F7' },
};
