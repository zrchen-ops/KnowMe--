/**
 * KnowMe Agent 服务：一个零依赖的 Node HTTP 服务。
 *
 *   node server/index.ts          # Node 24 原生跑 TypeScript
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY / OPENAI_API_KEY   模型密钥（至少一个）
 *   AGENT_PROVIDER=stub                 不需要密钥的占位模式，用于联调
 *   AGENT_MODEL / AGENT_BASE_URL        覆盖默认模型与端点（OpenAI 兼容）
 *   PORT（默认 8787）/ HOST（默认 127.0.0.1）/ AGENT_TZ（默认 Asia/Shanghai）
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { AgentError, respond, type AgentContextLike } from './agent.ts';
import { loadEnvFile } from './env.ts';
import { resolveProvider } from './provider.ts';

// 先读 .env，再解析 provider —— 这样 `npm run agent` 不需要在命令行里塞密钥。
const envFile = loadEnvFile();

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const TIME_ZONE = process.env.AGENT_TZ ?? 'Asia/Shanghai';
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_MESSAGE_CHARS = 2000;

const provider = resolveProvider();

function todayISO(): string {
  // en-CA 的短日期就是 YYYY-MM-DD，避免 toISOString 的 UTC 偏移问题
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  cors(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () =>
      // 去掉 UTF-8 BOM：Windows 上用 PowerShell / 记事本存的 JSON 经常带它，
      // JSON.parse 会因为开头多一个 \uFEFF 直接失败。
      resolve(Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '')),
    );
    req.on('error', reject);
  });
}

export function createAgentServer() {
  return createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      cors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, {
        ok: true,
        provider: provider.name,
        model: provider.model ?? null,
        thinking: process.env.AGENT_THINKING === 'enabled' ? 'enabled' : 'disabled',
        jsonMode: process.env.AGENT_JSON_MODE === 'off' ? 'off' : 'on',
        timeZone: TIME_ZONE,
        today: todayISO(),
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/agent/respond') {
      let message = '';
      let context: AgentContextLike = {};
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw || '{}') as { message?: unknown; context?: unknown };
        message = typeof body.message === 'string' ? body.message.trim() : '';
        context = (body.context ?? {}) as AgentContextLike;
      } catch (error) {
        json(res, 400, { error: (error as Error).message === 'body_too_large' ? 'body_too_large' : 'invalid_json' });
        return;
      }

      if (!message) {
        json(res, 400, { error: 'message_required' });
        return;
      }
      if (message.length > MAX_MESSAGE_CHARS) {
        json(res, 413, { error: 'message_too_long' });
        return;
      }

      try {
        const result = await respond(message, context, provider, {
          today: todayISO(),
          dateLabel: todayLabel(),
          timeoutMs: 30_000,
        });
        json(res, 200, result);
      } catch (error) {
        if (error instanceof AgentError) {
          const status =
            error.code === 'provider_not_configured' ? 503 : error.code === 'provider_error' ? 502 : 502;
          json(res, status, { error: error.code, detail: error.message });
          return;
        }
        json(res, 500, { error: 'internal_error' });
      }
      return;
    }

    json(res, 404, { error: 'not_found' });
  });
}

const server = createAgentServer();
server.listen(PORT, HOST, () => {
  const mode = provider.name === 'none' ? '未配置模型（客户端会降级到本地规则引擎）' : provider.name;
  const envNotice = envFile.loaded
    ? `已读取 .env（${envFile.keys.length} 个变量）`
    : '未找到 .env（可用环境变量或复制 .env.example）';
  console.log(`[knowme-agent] listening on http://${HOST}:${PORT} · provider=${mode} · tz=${TIME_ZONE}`);
  console.log(`[knowme-agent] ${envNotice}${provider.name === 'none' ? ' · 提示：DEEPSEEK_API_KEY 未设置' : ''}`);
});
