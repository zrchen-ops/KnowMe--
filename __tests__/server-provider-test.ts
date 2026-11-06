import { buildChatRequest, resolveProvider } from '@/server/provider';

describe('Provider 解析', () => {
  test('DeepSeek 默认模型是 deepseek-flash（即 DeepSeek-V4.1-Flash-1017）', () => {
    const config = resolveProvider({ DEEPSEEK_API_KEY: 'sk-test' });
    expect(config).toMatchObject({
      name: 'deepseek',
      apiKey: 'sk-test',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-flash',
    });
  });

  test('AGENT_MODEL 可以覆盖成 deepseek-v4-pro', () => {
    const config = resolveProvider({ DEEPSEEK_API_KEY: 'sk-test', AGENT_MODEL: 'deepseek-v4-pro' });
    expect(config.model).toBe('deepseek-v4-pro');
  });

  test('OpenAI 分支有独立的默认模型与端点', () => {
    const config = resolveProvider({ OPENAI_API_KEY: 'sk-test' });
    expect(config).toMatchObject({ name: 'openai', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' });
  });

  test('stub 优先于任何密钥', () => {
    expect(resolveProvider({ AGENT_PROVIDER: 'stub', DEEPSEEK_API_KEY: 'sk-test' }).name).toBe('stub');
  });

  test('没有任何密钥时为 none', () => {
    expect(resolveProvider({}).name).toBe('none');
  });
});

describe('请求体构造', () => {
  const deepseek = {
    name: 'deepseek' as const,
    apiKey: 'sk-test',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
  };
  const openai = {
    name: 'openai' as const,
    apiKey: 'sk-test',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  };

  test('DeepSeek 默认关思考、开 JSON Output', () => {
    const body = buildChatRequest(deepseek, [], {});
    expect(body.model).toBe('deepseek-flash');
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.temperature).toBe(0.2);
  });

  test('需要思考链时显式开启', () => {
    expect(buildChatRequest(deepseek, [], { thinking: true }).thinking).toEqual({ type: 'enabled' });
  });

  test('thinking 是 DeepSeek 专有字段，OpenAI 请求里不能出现', () => {
    expect('thinking' in buildChatRequest(openai, [], {})).toBe(false);
    expect(buildChatRequest(openai, [], {}).response_format).toEqual({ type: 'json_object' });
  });

  test('关掉 JSON Output 后不发送 response_format', () => {
    expect('response_format' in buildChatRequest(deepseek, [], { jsonMode: false })).toBe(false);
  });
});
