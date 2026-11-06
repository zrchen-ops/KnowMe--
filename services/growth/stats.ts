import { categoryMeta } from '@/constants/theme';
import type { Goal, LearningEvent, Task } from '@/types';
import {
  WEEKDAY_LABELS,
  addDaysISO,
  diffDays,
  formatDuration,
  parseISO,
  startOfWeekISO,
  todayISO,
} from '@/utils/date';

export interface CategorySlice {
  key: string;
  label: string;
  color: string;
  soft: string;
  hours: number;
  percent: number;
}

export interface DailyDatum {
  iso: string;
  label: string;
  weekday: string;
  hours: number;
  isToday: boolean;
}

export interface GrowthStats {
  weekStart: string;
  weekEnd: string;
  studyHours: number;
  lastWeekStudyHours: number;
  hoursDeltaPct: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  lastWeekCompletionRate: number;
  completionDeltaPct: number;
  pendingTasks: number;
  daily: DailyDatum[];
  categories: CategorySlice[];
  lastWeekCategories: CategorySlice[];
  totalRecordedHours: number;
}

function sumStudy(events: LearningEvent[]): number {
  return events
    .filter((event) => event.category === 'study')
    .reduce((total, event) => total + event.duration, 0);
}

function buildCategories(events: LearningEvent[]): CategorySlice[] {
  const total = events.reduce((sum, event) => sum + event.duration, 0);
  const keys = Object.keys(categoryMeta);
  return keys
    .map((key) => {
      const hours = events
        .filter((event) => event.category === key)
        .reduce((sum, event) => sum + event.duration, 0);
      const meta = categoryMeta[key];
      return {
        key,
        label: meta.label,
        color: meta.color,
        soft: meta.soft,
        hours,
        percent: total > 0 ? Math.round((hours / total) * 100) : 0,
      };
    })
    .filter((item) => item.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

export function computeGrowthStats(
  events: LearningEvent[],
  tasks: Task[],
  goals: Goal[],
): GrowthStats {
  const weekStart = startOfWeekISO();
  const weekEnd = addDaysISO(weekStart, 6);
  const lastWeekStart = addDaysISO(weekStart, -7);
  const lastWeekEnd = addDaysISO(weekStart, -1);

  const thisWeekEvents = events.filter((event) => event.date >= weekStart && event.date <= weekEnd);
  const lastWeekEvents = events.filter((event) => event.date >= lastWeekStart && event.date <= lastWeekEnd);

  const studyHours = sumStudy(thisWeekEvents);
  const lastWeekStudyHours = sumStudy(lastWeekEvents);
  const hoursDeltaPct =
    lastWeekStudyHours > 0
      ? Math.round(((studyHours - lastWeekStudyHours) / lastWeekStudyHours) * 100)
      : studyHours > 0
        ? 100
        : 0;

  const weekTasks = tasks.filter((task) => task.date >= weekStart && task.date <= weekEnd);
  const completedTasks = weekTasks.filter((task) => task.status === 'done').length;
  const totalTasks = weekTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = weekTasks.filter((task) => task.status === 'todo').length;

  const lastWeekTasks = tasks.filter(
    (task) => task.date >= lastWeekStart && task.date <= lastWeekEnd,
  );
  const lastWeekCompletionRate =
    lastWeekTasks.length > 0
      ? Math.round(
          (lastWeekTasks.filter((task) => task.status === 'done').length / lastWeekTasks.length) * 100,
        )
      : 0;

  const daily = Array.from({ length: 7 }, (_, index) => {
    const iso = addDaysISO(weekStart, index);
    const hours = thisWeekEvents
      .filter((event) => event.category === 'study' && event.date === iso)
      .reduce((sum, event) => sum + event.duration, 0);
    return {
      iso,
      label: `${parseISO(iso).getMonth() + 1}/${parseISO(iso).getDate()}`,
      weekday: WEEKDAY_LABELS[index],
      hours,
      isToday: iso === todayISO(),
    };
  });

  return {
    weekStart,
    weekEnd,
    studyHours,
    lastWeekStudyHours,
    hoursDeltaPct,
    completedTasks,
    totalTasks,
    completionRate,
    lastWeekCompletionRate,
    completionDeltaPct: completionRate - lastWeekCompletionRate,
    pendingTasks,
    daily,
    categories: buildCategories(thisWeekEvents),
    lastWeekCategories: buildCategories(lastWeekEvents),
    totalRecordedHours: thisWeekEvents.reduce((sum, event) => sum + event.duration, 0),
  };
}

export function buildTrendTip(stats: GrowthStats): string {
  if (stats.lastWeekStudyHours === 0) {
    return `本周已经记录了 ${formatDuration(stats.studyHours)} 学习时间，开始积累就是最好的开始。`;
  }
  if (stats.hoursDeltaPct > 0) {
    return `你本周学习时长比上周增加了 ${stats.hoursDeltaPct}%，节奏很稳，继续保持哦！`;
  }
  if (stats.hoursDeltaPct < 0) {
    return `本周学习时长比上周少了 ${Math.abs(stats.hoursDeltaPct)}%，可以挑一件最重要的小事先做起来。`;
  }
  return '本周学习时长和上周持平，保持稳定本身就很难得。';
}

export function buildConcern(goals: Goal[], stats: GrowthStats): string {
  const active = goals.filter((goal) => goal.status === 'active');
  const near = active
    .map((goal) => ({ goal, days: diffDays(goal.deadline) }))
    .sort((a, b) => a.days - b.days)[0];

  if (near && near.days <= 60 && stats.studyHours >= 12) {
    return `「${near.goal.title}」还剩 ${near.days} 天，本周学习已投入 ${formatDuration(
      stats.studyHours,
    )}，记得给休息和运动留一点空间。`;
  }
  if (stats.pendingTasks >= 3) {
    return `本周还有 ${stats.pendingTasks} 项任务待完成，建议先完成最重要的一项，避免堆积。`;
  }
  if (near) {
    return `「${near.goal.title}」还有 ${near.days} 天到期，按现在的节奏推进就好。`;
  }
  return '目前的记忆与计划关系很平衡，可以先补充一个近期目标，让图谱继续生长。';
}

export function buildWeeklySummary(stats: GrowthStats, goals: Goal[]): string {
  const active = goals.filter((goal) => goal.status === 'active');
  const goalLine =
    active.length > 0
      ? `「${active[0].title}」当前进度 ${active[0].progress}%，还有 ${diffDays(active[0].deadline)} 天。`
      : '本周还没有进行中的目标。';
  const top = stats.categories[0];
  const categoryLine = top ? `时间主要投入在${top.label}（${top.percent}%）。` : '还没有记录时间分配。';
  const compareLine =
    stats.lastWeekStudyHours > 0
      ? `与上周 ${formatDuration(stats.lastWeekStudyHours)} 相比，${
          stats.hoursDeltaPct >= 0 ? '提升了' : '减少了'
        } ${Math.abs(stats.hoursDeltaPct)}%。`
      : '这是你开始记录的第一周。';
  return `本周共记录 ${formatDuration(stats.studyHours)} 学习时间，完成 ${stats.completedTasks}/${stats.totalTasks} 项任务。${goalLine}${categoryLine}${compareLine}`;
}

export function buildSuggestions(stats: GrowthStats, goals: Goal[]): string[] {
  const suggestions: string[] = [];
  const active = goals.filter((goal) => goal.status === 'active')[0];
  if (stats.pendingTasks > 0) {
    suggestions.push(`还有 ${stats.pendingTasks} 项待办：先把最需要整块时间的一项放进明天上午。`);
  }
  if (stats.hoursDeltaPct < 0) {
    suggestions.push('本周学习投入有所下降，下周把每天的最小学习单元固定在 45 分钟。');
  } else {
    suggestions.push('当前节奏不错，下周尝试把最难的任务放在精力最好的上午。');
  }
  if (active) {
    suggestions.push(`距离「${active.title}」截止还有 ${diffDays(active.deadline)} 天，建议每周固定一次真题复盘。`);
  }
  suggestions.push('给运动与休息留出固定时段，它们会反过来提升学习效率。');
  return suggestions.slice(0, 3);
}
