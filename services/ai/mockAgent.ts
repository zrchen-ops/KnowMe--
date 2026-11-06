import type { AgentContext, AgentResponse, AgentService, MemoryDraft } from './types';
import { buildWeeklySummary, computeGrowthStats, buildTrendTip } from '@/services/growth/stats';
import type { EventCategory, Goal, Task } from '@/types';
import {
  addDaysISO,
  diffDays,
  formatChineseDate,
  formatDuration,
  formatMonthDay,
  parseISO,
  relativeDayLabel,
  startOfWeekISO,
  todayISO,
  weekdayIndex,
  WEEKDAY_LABELS,
} from '@/utils/date';

const CHINESE_NUMBERS: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseChineseNumber(text: string): number | null {
  if (text === '十') return 10;
  if (text.includes('十')) {
    const [left, right] = text.split('十');
    const tens = left ? CHINESE_NUMBERS[left] ?? 0 : 1;
    const units = right ? CHINESE_NUMBERS[right] ?? 0 : 0;
    return tens * 10 + units;
  }
  let value = 0;
  for (const char of text) {
    const num = CHINESE_NUMBERS[char];
    if (num === undefined) return null;
    value = value * 10 + num;
  }
  return value;
}

export function parseDuration(text: string, fallback = 1.5): number {
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (minutes) return Number(minutes[1]) / 60;
  const half = text.match(/(半个|半)(小时|钟头)/);
  if (half) return 0.5;
  const numeric = text.match(/(\d+(?:\.\d+)?)\s*(个)?(小时|钟头|h)/i);
  if (numeric) return Number(numeric[1]);
  const chinese = text.match(/([一二两三四五六七八九十]+)\s*个?(小时|钟头)/);
  if (chinese) {
    const value = parseChineseNumber(chinese[1]);
    if (value) return value;
  }
  return fallback;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function parseTime(text: string): string | undefined {
  const match = text.match(/(上午|下午|中午|晚上|早上)?\s*(\d{1,2})(?:点|:|：|时)(\d{1,2})?\s*(半)?/);
  let hour: number | null = null;
  let minute = 0;
  if (match) {
    hour = Number(match[2]);
    minute = match[3] ? Number(match[3]) : match[4] ? 30 : 0;
    const period = match[1];
    if ((period === '下午' || period === '晚上') && hour < 12) hour += 12;
    if (period === '中午' && hour < 11) hour += 12;
    if (period === '早上' && hour === 12) hour = 0;
  } else {
    const chinese = text.match(/(上午|下午|中午|晚上|早上)?([一二两三四五六七八九十]+)点(半)?/);
    if (chinese) {
      const value = parseChineseNumber(chinese[2]);
      if (value !== null) {
        hour = value;
        if (chinese[3]) minute = 30;
        const period = chinese[1];
        if ((period === '下午' || period === '晚上') && hour < 12) hour += 12;
        if (period === '中午' && hour < 11) hour += 12;
      }
    }
  }
  if (hour === null || hour > 23) return undefined;
  return `${pad(hour)}:${pad(minute)}`;
}

export function parseTaskDate(text: string): string {
  const today = todayISO();
  if (text.includes('后天')) return addDaysISO(today, 2);
  if (text.includes('明天')) return addDaysISO(today, 1);
  if (text.includes('昨天')) return addDaysISO(today, -1);
  if (text.includes('今天') || text.includes('今晚')) return today;

  const nextWeekMatch = text.match(/下周([一二三四五六日天])/);
  const weekMatch = text.match(/(?:周|星期|礼拜)([一二三四五六日天])/);
  const targetLabel = nextWeekMatch?.[1] ?? weekMatch?.[1];
  if (targetLabel) {
    const index = WEEKDAY_LABELS.findIndex((label) => label.endsWith(targetLabel));
    if (nextWeekMatch) {
      return addDaysISO(startOfWeekISO(), 7 + index);
    }
    let date = addDaysISO(startOfWeekISO(), index);
    if (date < today) {
      date = addDaysISO(date, 7);
    }
    return date;
  }

  const explicit = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (explicit) {
    const month = Number(explicit[1]);
    const day = Number(explicit[2]);
    const now = new Date();
    let year = now.getFullYear();
    const candidate = `${year}-${pad(month)}-${pad(day)}`;
    if (candidate < today) year += 1;
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  return today;
}

export function parseDeadline(text: string): string {
  const today = todayISO();
  const explicit = text.match(/(\d{1,2}|六|十一|十二)月/);
  const monthMap: Record<string, number> = { 六: 6, 十一: 11, 十二: 12 };
  if (explicit) {
    const raw = explicit[1];
    const month = monthMap[raw] ?? Number(raw);
    const now = new Date();
    let year = now.getFullYear();
    const candidate = `${year}-${pad(month)}-20`;
    if (candidate < today) year += 1;
    return `${year}-${pad(month)}-20`;
  }
  if (text.includes('下学期')) return addDaysISO(today, 180);
  if (text.includes('本学期') || text.includes('这个学期') || text.includes('这学期')) {
    return addDaysISO(today, 120);
  }
  if (text.includes('下个月')) return addDaysISO(today, 30);
  if (text.includes('今年')) return `${new Date().getFullYear()}-12-31`;
  if (text.includes('下周')) return addDaysISO(today, 7);
  return addDaysISO(today, 90);
}

function detectCategory(text: string): EventCategory {
  if (/健身|跑步|篮球|游泳|运动|锻炼|训练/.test(text)) return 'fitness';
  if (/实习|简历|面试|求职|工作/.test(text)) return 'career';
  if (/生活|整理房间|做饭|休息|睡觉/.test(text)) return 'life';
  return 'study';
}

function cleanTitle(input: string): string {
  return input
    .replace(/[，。！？、,.!?；;：:]/g, '')
    .replace(/\s+/g, '')
    .replace(
      /^(帮我|请|麻烦|我想|我要|想要|想|要|在|把|给|添加|加|新建|制定|安排|记录|记下|提醒我|提醒|一个|一条|一下|任务|待办|目标)/g,
      '',
    )
    .replace(/^(帮我|请|麻烦|我想|我要|想要|想|要|在|把|给|添加|加|新建|制定|安排|记录|记下|提醒我|提醒|一个|一条|一下|任务|待办|目标)/g, '')
    .replace(
      /(今天|今晚|明天|后天|昨天|下周[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天]|礼拜[一二三四五六日天]|早上|上午|中午|下午|晚上|上午|半个|半小时|\d{1,2}月\d{1,2}日?|\d{1,2}点\d{1,2}?分?半?|[一二两三四五六七八九十]+点(半)?|\d+(?:\.\d+)?个?(小时|钟头|分钟|h)|[一二两三四五六七八九十]+个?(小时|钟头))/g,
      '',
    )
    .replace(/的/g, '')
    .replace(/^任务|^计划|^目标/g, '')
    .trim();
}

function extractGoalTitle(input: string): string {
  const cleaned = input.replace(/[，。！？、,.!?；;]/g, '');
  const action = cleaned.match(
    /(通过|完成|学会|坚持|考取|拿到|获得|减重|提升|找到|读完|练出|进入)[^，。,.！!？?\s]*/,
  );
  if (action) {
    return action[0]
      .replace(/(这个学期|本学期|这学期|今年|下学期|接下来|之前)$/g, '')
      .replace(/的$/, '')
      .replace(/目标$/, '')
      .trim();
  }
  const fallback = cleanTitle(cleaned).replace(/(这个学期|本学期|这学期|今年|下学期|接下来|之前)/g, '');
  return fallback.length > 0 ? fallback.slice(0, 16) : '新目标';
}

function extractTaskTitle(input: string): string {
  const cleaned = cleanTitle(input);
  const action = cleaned.match(/(复习|练习|背|整理|阅读|读|写|做|刷|学习|完成|训练|准备|预习)[^，。,.！!？?\s]*/);
  if (action) return action[0];
  return cleaned.length > 0 ? cleaned.slice(0, 18) : '新任务';
}

function extractEventTitle(input: string): string {
  const cleaned = cleanTitle(input.replace(/完成了?|学习了?|进行了?/g, ''));
  return cleaned.length > 0 ? cleaned.slice(0, 18) : '今日学习';
}

function findGoal(goals: Goal[], text: string): Goal | undefined {
  return goals
    .filter((goal) => goal.status === 'active')
    .find((goal) => {
      const keywords = goal.title.replace(/通过|坚持|完成|拿到|获得/g, '');
      return keywords.length >= 2 && (text.includes(keywords) || keywords.split('').every((char) => text.includes(char)));
    });
}

function sortWeekTasks(tasks: Task[]): Task[] {
  const weekStart = startOfWeekISO();
  const weekEnd = addDaysISO(weekStart, 6);
  const weekTasks = tasks.filter((task) => task.date >= weekStart && task.date <= weekEnd);
  return weekTasks
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'todo' ? -1 : 1;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.startTime ?? '00:00') < (b.startTime ?? '00:00') ? -1 : 1;
    });
}

function memorySource(): string {
  return `${formatChineseDate(todayISO())} 与 Agent 的对话`;
}

function goalDraft(input: string): MemoryDraft {
  const title = extractGoalTitle(input);
  const deadline = parseDeadline(input);
  const description = input.replace(/[。！!]\s*$/, '');
  return {
    content: input,
    type: 'goal',
    confidence: 0.94,
    origin: 'user',
    source: memorySource(),
    payload: {
      entityName: title,
      entityType: 'goal',
      relationType: '拥有目标',
      description,
      goal: {
        title,
        description,
        deadline,
        progress: 0,
        milestones: ['明确目标与截止时间', '拆解每周行动', '完成第一次阶段复盘'],
      },
    },
  };
}

function taskDraft(input: string, ctx: AgentContext): MemoryDraft {
  const title = extractTaskTitle(input);
  const date = parseTaskDate(input);
  const startTime = parseTime(input);
  const duration = parseDuration(input);
  const allDay = /全天|整天/.test(input);
  const goal = findGoal(ctx.goals, input);
  return {
    content: input,
    type: 'task',
    confidence: 0.92,
    origin: 'user',
    source: memorySource(),
    payload: {
      entityName: title,
      entityType: 'plan',
      relationType: '计划',
      description: `${relativeDayLabel(date)}${allDay ? '全天' : startTime ? ` ${startTime}` : ''} · 预计 ${formatDuration(duration)}`,
      task: {
        title,
        date,
        startTime: allDay ? undefined : startTime,
        duration,
        allDay,
        goalTitle: goal?.title,
      },
    },
  };
}

function eventDraft(input: string, ctx: AgentContext): MemoryDraft {
  const title = extractEventTitle(input);
  const duration = parseDuration(input, 1);
  const category = detectCategory(input);
  const goal = findGoal(ctx.goals, input);
  return {
    content: input,
    type: 'event',
    confidence: 0.95,
    origin: 'user',
    source: memorySource(),
    payload: {
      entityName: title,
      entityType: 'event',
      relationType: '记录',
      description: `今天完成 ${formatDuration(duration)}${title}。`,
      event: {
        title,
        category,
        duration,
        date: todayISO(),
      },
      goalTitle: goal?.title,
    },
  };
}

const casualReplies = [
  '我在。你可以告诉我想做的事，我会把它拆成目标和日程，也会记住这次对话。',
  '嗯，我在听。你也可以直接说“本周复盘”，我会把这周的记录整理给你。',
  '这件事我还不完全了解，不过可以先帮你记下来。要不要顺便看看本周的日程？',
  '好呀。你更希望我先帮你规划时间，还是先把这件事保存成一条记忆？',
  '收到。你最近在推进六级和健身，如果需要，我可以帮你重新分配一下这周的精力。',
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export const mockAgentService: AgentService = {
  async respond(input: string, ctx: AgentContext): Promise<AgentResponse> {
    const text = input.trim();
    const lower = text.toLowerCase();

    if (!text) {
      return { text: '我在，想聊点什么？', kind: 'text' };
    }

    if (/复盘|总结|回顾|周报|这周怎么样|本周怎么样/.test(text)) {
      const stats = computeGrowthStats(ctx.events, ctx.tasks, ctx.goals);
      const summary = buildWeeklySummary(stats, ctx.goals);
      return {
        text: `这是本周的成长速览：${summary}`,
        kind: 'review',
      };
    }

    if (/记忆|了解我|记得|图谱|我是谁|知道我的|我的资料/.test(text)) {
      const confirmed = ctx.memories.filter((memory) => memory.status === 'confirmed');
      const pending = ctx.memories.filter((memory) => memory.status === 'pending');
      if (confirmed.length === 0) {
        return {
          text: '我的记忆还是空的。你可以对我说“我想在这个学期通过英语六级”，我会先整理，再等你确认。',
          kind: 'text',
        };
      }
      const highlights = confirmed.slice(-4).map((memory) => `· ${memory.content}`);
      const pendingLine = pending.length > 0 ? `\n另外还有 ${pending.length} 条记忆等你确认。` : '';
      return {
        text: `我目前记住了这些关于你的事：\n${highlights.join('\n')}${pendingLine}\n你可以到图谱里查看它们之间的关系。`,
        kind: 'text',
      };
    }

    const wantsGoal = /目标/.test(text) || /(我想|我要|我希望|计划|打算|准备).*(通过|完成|拿到|坚持|学会|考上)/.test(text);
    if (wantsGoal) {
      const draft = goalDraft(text);
      return {
        text: `我把它整理成了一条目标记忆：「${draft.payload.goal?.title}」，截止 ${formatMonthDay(
          draft.payload.goal?.deadline ?? todayISO(),
        )}。确认后我会同步到图谱和成长。`,
        kind: 'memory',
        memoryDraft: draft,
      };
    }

    const isRecording = /完成|做了|学习了|学习了|记录|今天.*(复习|健身|跑步|练习|阅读|背|写)|刚.*(复习|练习)/.test(text);
    if (isRecording && !/任务|提醒我|安排/.test(text)) {
      const draft = eventDraft(text, ctx);
      return {
        text: `记录下来了：今天完成「${draft.payload.event?.title}」，${formatDuration(
          draft.payload.event?.duration ?? 1,
        )}。确认后会同步成长时长与图谱。`,
        kind: 'memory',
        memoryDraft: draft,
      };
    }

    if (/任务|提醒|待办|日程|安排|明天|后天|下周/.test(text) && !/计划|复盘|记忆/.test(text)) {
      if (/(查看|看看|有什么|本周|这周)/.test(text) && !/添加|新建|安排|提醒/.test(text)) {
        const tasks = sortWeekTasks(ctx.tasks).slice(0, 5);
        if (tasks.length === 0) {
          return { text: '这周的日程还是空的，可以先告诉我要完成什么。', kind: 'text' };
        }
        return {
          text: '这是你本周的日程，我按优先级整理好了：',
          kind: 'plan',
          taskIds: tasks.map((task) => task.id),
        };
      }
      const draft = taskDraft(text, ctx);
      const date = draft.payload.task?.date ?? todayISO();
      const time = draft.payload.task?.allDay
        ? '全天'
        : draft.payload.task?.startTime
          ? ` ${draft.payload.task.startTime}`
          : '';
      return {
        text: `我把「${draft.payload.task?.title}」安排到${relativeDayLabel(date)}${time}，预计 ${formatDuration(
          draft.payload.task?.duration ?? 1,
        )}。确认后它会同时出现在日程和图谱里。`,
        kind: 'memory',
        memoryDraft: draft,
      };
    }

    if (/计划|这周|本周|日程|安排/.test(text)) {
      const tasks = sortWeekTasks(ctx.tasks).slice(0, 6);
      if (tasks.length === 0) {
        return {
          text: '这周还没有安排。要不要先新建一个目标，我再帮你拆成本周任务？',
          kind: 'text',
        };
      }
      return {
        text: /学习计划/.test(text)
          ? '基于你本学期的目标和近期学习记录，为你规划了这份计划：'
          : '这是你本周的安排，完成状态会实时同步：',
        kind: 'plan',
        taskIds: tasks.map((task) => task.id),
      };
    }

    if (/你好|嗨|hi|hello|早上好|晚上好/.test(lower)) {
      return {
        text: `你好呀。${buildTrendTip(computeGrowthStats(ctx.events, ctx.tasks, ctx.goals))}`,
        kind: 'text',
      };
    }

    if (/累|焦虑|压力|烦|难过|不想学/.test(text)) {
      const stats = computeGrowthStats(ctx.events, ctx.tasks, ctx.goals);
      return {
        text: `辛苦了。你本周已经完成 ${stats.completedTasks} 项任务，累计学习 ${formatDuration(
          stats.studyHours,
        )}。今天可以先只做一件最小的事，比如 25 分钟的高数复习。`,
        kind: 'text',
      };
    }

    if (/谢谢|感谢/.test(text)) {
      return { text: '不客气，我会继续帮你记住重要的事。', kind: 'text' };
    }

    return { text: pick(casualReplies), kind: 'text' };
  },
};

export const weekTaskLabels = (tasks: Task[]): string =>
  tasks.map((task) => `${WEEKDAY_LABELS[weekdayIndex(task.date)]} ${task.title}`).join('、');

void diffDays;
