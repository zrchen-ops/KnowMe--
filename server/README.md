# KnowMe Agent 服务

客户端不需要 Node 也能跑（离线时用本地规则引擎），但要让「AI 真的理解你」，
必须有一个持有模型密钥、负责提示词与结构化输出的服务端。这就是它：

```
客户端 (Expo)  ──POST /agent/respond──▶  server/index.ts  ──▶  DeepSeek / OpenAI
     │                                        │
     └── 失败时自动降级到本地规则引擎 ◀────────┘
```

## 启动

最短路径（推荐）：项目根目录放一个 `.env`，然后一条命令。

```bash
# 1) 第一次：从模板复制
cp .env.example .env          # Windows: copy .env.example .env

# 2) 打开 .env，填一行
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 3) 启动（在项目根目录 KnowMe/ 下执行）
npm run agent
```

看到 `provider=deepseek` 就是接上了；如果显示 `未配置模型`，说明 `.env` 没被读到或 key 为空。
`.env` 已经在 `.gitignore` 里，不会被提交。

也可以不用 `.env`，直接给环境变量：

```bash
# Windows PowerShell
$env:DEEPSEEK_API_KEY="sk-xxx"; npm run agent
# macOS / Linux
DEEPSEEK_API_KEY=sk-xxx npm run agent
```

没有密钥时验证链路：

```bash
AGENT_PROVIDER=stub npm run agent      # 返回固定 JSON，不调用模型
```

Node 24 原生执行 TypeScript，不需要 tsx 或编译步骤。

然后让客户端指向它（`.env` 里已经写了 `EXPO_PUBLIC_AGENT_API_URL`，Expo 会自动读取）：

```bash
npm run web        # 或 npx expo start
```

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | `{ ok, provider, model, today }` |
| POST | `/agent/respond` | `{ message, context }` → `AgentResponse` |

```bash
curl -s http://127.0.0.1:8787/agent/respond \
  -H 'Content-Type: application/json' \
  -d '{"message":"我想在这个学期通过英语六级","context":{}}' | jq
```

返回体与客户端 `services/ai/types.ts` 中的 `AgentResponse` 一致：

```json
{
  "text": "我把它整理成了一条目标记忆……",
  "kind": "memory",
  "memoryDraft": {
    "content": "我想在这个学期通过英语六级",
    "type": "goal",
    "confidence": 0.9,
    "origin": "user",
    "source": "2026年11月6日 与 Agent 的对话",
    "payload": {
      "entityName": "通过英语六级",
      "entityType": "goal",
      "relationType": "拥有目标",
      "description": "……",
      "goal": { "title": "通过英语六级", "deadline": "2027-03-06", "milestones": ["…"] }
    }
  },
  "provider": "deepseek"
}
```

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | — | DeepSeek 密钥（优先） |
| `OPENAI_API_KEY` | — | OpenAI 或任意 OpenAI 兼容端点 |
| `AGENT_PROVIDER=stub` | — | 无密钥占位模式 |
| `AGENT_MODEL` | `deepseek-chat` / `gpt-4o-mini` | 覆盖模型 |
| `AGENT_BASE_URL` | `https://api.deepseek.com` | 覆盖端点（含 `/v1`） |
| `AGENT_JSON_MODE=off` | 开 | 关掉 `response_format: json_object`（端点不支持时用） |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | 监听地址 |
| `AGENT_TZ` | `Asia/Shanghai` | 相对日期换算所用的时区 |

## 选哪个模型

DeepSeek 官方目前只有两个 model id（见 [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)）：

| model id | 实际模型 | 适合度 |
|---|---|---|
| `deepseek-flash` | DeepSeek-V4.1-Flash-1017 | ⭐ **默认，推荐**：1M 上下文、支持 JSON Output 与 Tool Calls，便宜大约 4 倍 |
| `deepseek-v4-pro` | DeepSeek-V4-Pro-0813 | ✅ 更强，价格约为 Flash 的 4–5 倍；抽取任务通常用不上 |

两个都是 1M 上下文、384K 最大输出、都支持 JSON Output。旧 ID `deepseek-v4-flash`、
`deepseek-v4-flash-vision-exp` 仍被接受但模型已退役（请求会被路由到 V4.1 Flash 并按 Flash 计费）；
`deepseek-chat` / `deepseek-reasoner` 是上一代命名，已不在官方模型表里，不要再用。

**思考模式**：`deepseek-flash` 默认**开启** thinking（更慢、更贵，且 thinking 下 `temperature` 无效）。
抽取任务不需要思考链，所以服务端默认显式发 `thinking: { type: 'disabled' }`；
想要思考链就 `AGENT_THINKING=enabled`。`GET /health` 会回显当前是 `thinking=enabled/disabled`。

换模型只改 `.env` 一行，然后重启 `npm run agent`：

```ini
AGENT_MODEL=deepseek-flash        # 默认，等价于 V4.1 Flash
# AGENT_MODEL=deepseek-v4-pro     # 更强更贵
# 或换一家：
# OPENAI_API_KEY=sk-xxx
# AGENT_BASE_URL=https://api.moonshot.cn/v1
# AGENT_MODEL=moonshot-v1-8k
```

`GET /health` 会回显当前生效的 `provider` / `model` / `thinking`，改完先看它再跑评估。

> 端点不支持 `response_format` 时会返回 400，服务端会自动去掉该参数重试一次；
> 也可以直接用 `AGENT_JSON_MODE=off` 关掉。模型输出被 ```json 包裹、前后带说明文字都能解析。

## 设计约束

1. **密钥只在服务端**：客户端只拿到 `EXPO_PUBLIC_AGENT_API_URL`。
2. **上下文按需发送**：客户端只发最近 12 条记忆、活跃目标、未完成待办、节点名，不做全量同步。
3. **输出必须可校验**：模型只允许返回一个 JSON 对象，服务端逐字段收敛（长度、日期格式、枚举、置信度），不合法字段丢弃而不是让脏数据进图谱。
4. **失败可降级**：服务端 5xx 时客户端自动回落到本地规则引擎，并在 UI 提示「已用本地引擎回复」。
5. **不编造**：提示词里明确「不确定就不给记忆」，`memory` 允许为 `null`。

## 评估

```bash
AGENT_PROVIDER=stub node server/eval/run.ts     # 验证管线
DEEPSEEK_API_KEY=sk-xxx node server/eval/run.ts # 真实准确率，低于 80% 退出码为 1
```

22 条用例覆盖 8 类记忆与 4 类「不该记」的输入（寒暄、情绪、知识提问、高风险操作），
改提示词后跑一遍就知道有没有退化。
