export const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

const pad = (value: number) => value.toString().padStart(2, '0');

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function startOfWeek(date: Date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  return result;
}

export function startOfWeekISO(base: Date = new Date()): string {
  return toISO(startOfWeek(base));
}

export function getWeekDays(baseISO?: string): string[] {
  const start = baseISO ? parseISO(baseISO) : startOfWeek();
  if (baseISO) {
    const day = start.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + offset);
  }
  return Array.from({ length: 7 }, (_, index) => addDaysISO(toISO(start), index));
}

export function weekdayIndex(iso: string): number {
  const day = parseISO(iso).getDay();
  return day === 0 ? 6 : day - 1;
}

export function diffDays(targetISO: string, from: Date = new Date()): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
  const end = parseISO(targetISO);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function formatMonthDay(iso: string): string {
  const date = parseISO(iso);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatWeekRange(weekStartISO: string): string {
  const end = addDaysISO(weekStartISO, 6);
  return `${formatMonthDay(weekStartISO)} - ${formatMonthDay(end)}`;
}

export function relativeDayLabel(iso: string): string {
  const delta = diffDays(iso);
  if (delta === 0) return '今天';
  if (delta === 1) return '明天';
  if (delta === -1) return '昨天';
  if (delta > 0 && delta < 7) return `${delta}天后`;
  if (delta < 0 && delta > -7) return `${Math.abs(delta)}天前`;
  return formatMonthDay(iso);
}

export function formatDuration(hours: number): string {
  if (hours <= 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

export function formatTimeLabel(time?: string): string {
  if (!time) return '全天';
 // keep 24h style but show leading zero trimmed
  return time;
}

export function isThisWeek(iso: string, base: Date = new Date()): boolean {
  const weekStart = startOfWeek(base);
  const startISO = toISO(weekStart);
  const endISO = addDaysISO(startISO, 6);
  return iso >= startISO && iso <= endISO;
}

export function isDateInRange(iso: string, startISO: string, endISO: string): boolean {
  return iso >= startISO && iso <= endISO;
}

export function greetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 13) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function formatChineseDate(iso: string): string {
  const date = parseISO(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
