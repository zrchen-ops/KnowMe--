/**
 * Agent 提取能力的回归用例集。
 *
 * 这不是「单元测试」，而是「模型质量评估」：同一份用例分别跑在 stub / 真实模型上，
 * 用准确率而不是单次成功来判断能力是否退化。
 */
export interface EvalCase {
  id: string;
  input: string;
  /** 期望抽出的记忆类型；null 表示这句话不该产生记忆。 */
  expect: 'goal' | 'task' | 'event' | 'person' | 'interest' | 'preference' | 'habit' | 'plan' | null;
  note?: string;
}

export const EVAL_CASES: EvalCase[] = [
  { id: 'goal-1', input: '我想在这个学期通过英语六级', expect: 'goal' },
  { id: 'goal-2', input: '我想三个月内找到 Agent 方向的实习', expect: 'goal' },
  { id: 'goal-3', input: '这学期我想把绩点提到 3.8', expect: 'goal' },
  { id: 'goal-4', input: '我的目标改成下个月完成开题报告', expect: 'goal' },
  { id: 'task-1', input: '明天下午三点复习高数两个小时', expect: 'task' },
  { id: 'task-2', input: '下周要交毕设初稿', expect: 'task' },
  { id: 'task-3', input: '今天下午四点开组会', expect: 'task' },
  { id: 'event-1', input: '今天完成了两个小时的高数复习', expect: 'event' },
  { id: 'event-2', input: '昨天去打了两个小时篮球', expect: 'event' },
  { id: 'event-3', input: '我看完了《人类简史》', expect: 'event' },
  { id: 'person-1', input: '我认识了一个叫陈晨的同学', expect: 'person' },
  { id: 'person-2', input: '我室友王浩在做机器人', expect: 'person' },
  { id: 'interest-1', input: '我对机器人很感兴趣', expect: 'interest' },
  { id: 'interest-2', input: '最近在追一个叫《万神殿》的剧', expect: 'interest' },
  { id: 'pref-1', input: '帮我记住：我不吃香菜', expect: 'preference' },
  { id: 'pref-2', input: '我更喜欢早上学习，晚上效率很低', expect: 'preference' },
  { id: 'habit-1', input: '我每天早上七点起床背单词', expect: 'habit' },
  { id: 'habit-2', input: '每周三晚上我要练吉他', expect: 'habit' },
  { id: 'none-1', input: '你好', expect: null },
  { id: 'none-2', input: '我压力好大，什么都不想做', expect: null },
  { id: 'none-3', input: '帮我解释一下什么是 RAG', expect: null },
  { id: 'none-4', input: '帮我订明天去上海的高铁票', expect: null, note: '高风险操作：只回应，不落记忆' },
];
