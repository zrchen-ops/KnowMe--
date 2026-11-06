import { AgentError, buildMessages, extractJSON, normalizeModelOutput } from '@/server/agent';

const options = { today: '2026-11-06', dateLabel: '2026年11月6日', provider: 'stub' };

describe('模型输出归一化', () => {
  test('完整目标：字段全部落位，kind 强制为 memory', () => {
    const raw = JSON.stringify({
      reply: '我把它整理成了一条目标记忆。',
      kind: 'text',
      memory: {
        type: 'goal',
        content: '我想在这个学期通过英语六级',
        confidence: 0.93,
        entityName: '通过英语六级',
        entityType: 'goal',
        description: '本学期通过六级',
        goal: { title: '通过英语六级', description: '冲 500+', deadline: '2027-03-06', milestones: ['背词'] },
      },
    });

    const result = normalizeModelOutput(raw, options);

    expect(result.kind).toBe('memory');
    expect(result.memoryDraft).toMatchObject({
      type: 'goal',
      confidence: 0.93,
      origin: 'user',
      source: '2026年11月6日 与 Agent 的对话',
    });
    expect(result.memoryDraft?.payload.goal).toEqual({
      title: '通过英语六级',
      description: '冲 500+',
      deadline: '2027-03-06',
      milestones: ['背词'],
    });
  });

  test('任务：缺时间与时长时给默认值，日期非法时回落到今天', () => {
    const raw = JSON.stringify({
      reply: '好',
      kind: 'memory',
      memory: {
        type: 'task',
        content: '复习高数',
        entityName: '复习高数',
        task: { title: '复习高数', date: '明天下午', duration: 'abc' },
      },
    });

    const result = normalizeModelOutput(raw, options);
    expect(result.memoryDraft?.payload.task).toMatchObject({
      date: '2026-11-06',
      duration: 1,
      startTime: undefined,
    });
  });

  test('未知类型不落记忆，但保留回复', () => {
    const raw = JSON.stringify({
      reply: '我在听。',
      kind: 'text',
      memory: { type: 'feeling', entityName: '压力' },
    });

    const result = normalizeModelOutput(raw, options);
    expect(result.memoryDraft).toBeUndefined();
    expect(result.kind).toBe('text');
    expect(result.text).toBe('我在听。');
  });

  test('缺 entityName 时丢弃记忆而不是造一个空节点', () => {
    const raw = JSON.stringify({ reply: '嗯', kind: 'memory', memory: { type: 'interest' } });
    expect(normalizeModelOutput(raw, options).memoryDraft).toBeUndefined();
  });

  test('置信度被夹在 0.3–1 之间', () => {
    const raw = JSON.stringify({
      reply: '好',
      memory: { type: 'interest', entityName: '机器人', confidence: 9 },
    });
    expect(normalizeModelOutput(raw, options).memoryDraft?.confidence).toBe(1);
  });

  test('缺少 reply 视为无效输出', () => {
    expect(() => normalizeModelOutput('{"kind":"text"}', options)).toThrow(AgentError);
  });
});

describe('JSON 提取', () => {
  test('容忍 ```json 包裹与前后说明文字', () => {
    const raw = '好的，结果如下：\n```json\n{"reply":"嗨","kind":"text"}\n```\n希望有帮助';
    expect(extractJSON(raw)).toEqual({ reply: '嗨', kind: 'text' });
  });

  test('没有 JSON 时报 bad_output', () => {
    expect(() => extractJSON('抱歉，我无法完成')).toThrow(/model_output_not_json/);
  });
});

describe('提示词构造', () => {
  test('注入当天日期与已有上下文', () => {
    const messages = buildMessages('明天要交作业', {
      memories: [{ content: '我在准备六级', type: 'goal' }],
      goals: [{ title: '通过英语六级', deadline: '2027-03-06', progress: 40, status: 'active' }],
      tasks: [{ title: '背单词', date: '2026-11-06', status: 'todo' }],
      entities: [
        { name: '我', type: 'self' },
        { name: '英语六级', type: 'goal' },
      ],
    }, '2026-11-06');

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('2026-11-06');
    expect(messages[1].content).toContain('我在准备六级');
    expect(messages[1].content).toContain('通过英语六级');
    expect(messages[1].content).toContain('明天要交作业');
    // self 节点不发给模型，避免无意义的上下文
    expect(messages[1].content).not.toContain('- 我');
  });
});
