/**
 * 模型 Provider 解析与调用。
 *
 * 设计原则：服务端持有密钥，客户端永远不碰；Provider 可替换（DeepSeek / OpenAI 兼容端点 / stub）。
 * 没有配置密钥时返回 'none'，由 HTTP 层直接回 503，客户端降级到本地规则引擎。
 */

export type ProviderName = 'deepseek' | 'openai' | 'stub' | 'none';

export interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function resolveProvider(env: Record<string, string | undefined> = process.env): ProviderConfig {
  if (env.AGENT_PROVIDER === 'stub') {
    return { name: 'stub', model: 'stub' };
  }

  const baseUrl = env.AGENT_BASE_URL;
  const model = env.AGENT_MODEL;

  if (env.DEEPSEEK_API_KEY) {
    return {
      name: 'deepseek',
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: baseUrl ?? 'https://api.deepseek.com',
      // deepseek-flash 当前由 DeepSeek-V4.1-Flash-1017 提供服务（官方模型 ID 就这一个）
      model: model ?? 'deepseek-flash',
    };
  }

  if (env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      apiKey: env.OPENAI_API_KEY,
      baseUrl: baseUrl ?? 'https://api.openai.com/v1',
      model: model ?? 'gpt-4o-mini',
    };
  }

  return { name: 'none' };
}

const STUB_REPLY = JSON.stringify({
  reply: '（stub 模式）我收到了这句话。配置模型的 API Key 后，这里会变成真实的结构化理解。',
  kind: 'text',
  memory: null,
});

/**
 * 组装 /chat/completions 的请求体。
 *
 * 两个刻意的取舍：
 * 1. `thinking: { type: 'disabled' }` —— deepseek-flash 默认开启思考模式（更慢更贵，
 *    且思考模式下 temperature 无效）。抽取任务不需要思考链，默认关掉；
 *    需要时用 AGENT_THINKING=enabled 打开。
 * 2. `response_format: json_object` —— 官方 JSON Output，保证返回是合法 JSON；
 *    AGENT_JSON_MODE=off 可关掉（第三方兼容端点未必支持）。
 */
export function buildChatRequest(
  config: ProviderConfig,
  messages: ChatMessage[],
  options: { temperature?: number; jsonMode?: boolean; thinking?: boolean } = {},
): Record<string, unknown> {
  const jsonMode = options.jsonMode ?? process.env.AGENT_JSON_MODE !== 'off';
  const thinking =
    options.thinking ?? process.env.AGENT_THINKING === 'enabled';

  return {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 900,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    // thinking 是 DeepSeek 专有字段，OpenAI 兼容端点会因未知参数报错
    ...(config.name === 'deepseek' ? { thinking: { type: thinking ? 'enabled' : 'disabled' } } : {}),
  };
}

/**
 * 调用 chat/completions 并返回原始文本。DeepSeek 与 OpenAI 都是 OpenAI 兼容协议，
 * 所以只有 baseUrl、默认 model 与 thinking 字段不同。
 */
export async function complete(
  config: ProviderConfig,
  messages: ChatMessage[],
  options: { timeoutMs?: number; temperature?: number; signal?: AbortSignal } = {},
): Promise<string> {
  if (config.name === 'none') {
    throw new Error('provider_not_configured');
  }
  if (config.name === 'stub') {
    return STUB_REPLY;
  }

  const timeoutMs = options.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);

  try {
    const url = `${config.baseUrl?.replace(/\/$/, '')}/chat/completions`;

    const call = (jsonMode: boolean) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(
          buildChatRequest(config, messages, {
            temperature: options.temperature,
            jsonMode,
          }),
        ),
        signal: controller.signal,
      });

    let response = await call(process.env.AGENT_JSON_MODE !== 'off');

    // 部分 OpenAI 兼容端点不支持 response_format，会直接 400。
    // 这里退一步重试一次，不让「换个模型」变成不可用。
    if (!response.ok && response.status === 400) {
      const detail = await response.clone().text().catch(() => '');
      if (/response_format|json_object|not supported/i.test(detail)) {
        response = await call(false);
      }
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`provider_http_${response.status}: ${detail.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('provider_empty_completion');
    return content;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
