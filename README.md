# KnowMe 知我

> 一个会慢慢理解你、记住你，并在你授权范围内替你行动的个人智能伙伴。

KnowMe 不是一个更会聊天的 AI，而是一套 **个人认知系统 + AI 伙伴 + 个人智能操作系统**：
对话里说的一句话，会被整理成结构化记忆，经你确认后进入个人知识图谱，再变成目标、日程与复盘。

当前仓库是 **可运行的 MVP**：移动端（Expo）+ 一个真实模型的 Agent 服务端。

---

## 现在能做什么

| 能力 | 状态 | 说明 |
|---|---|---|
| 对话 + 记忆确认 | ✅ | 一条回复里提取结构化记忆，确认/拒绝/编辑后才入库 |
| 个人知识图谱 | ✅ | 真实数据结构驱动的 SVG 图谱，支持缩放拖拽、节点编辑、关系筛选 |
| 成长系统 | ✅ | 目标 / 里程碑 / 周日程 / 学习时长统计 / 本周复盘 |
| 真实 Agent | ✅ | DeepSeek V4.1 Flash 结构化抽取，8 类记忆；服务不可用时自动降级本地规则引擎 |
| 记忆生命周期 | ✅ | 确认、拒绝、修改、删除、级联清理，来源可回溯到对话 |
| 闭环回流 | ✅ | 复盘 → 一键生成下周计划 → 执行 → 产生事件 → 下周复盘 |
| 语音输入 | 🚧 | 界面已就位，转写是演示占位（需要接语音服务） |
| 主动服务 / 工具调用 | ⏳ | 长期方向，尚未实现 |

---

## 架构

```
┌─────────────────────────────┐
│  Expo App (React Native)    │
│  app/ · components/ · store/│
│  Zustand + AsyncStorage     │
└──────────────┬──────────────┘
               │ POST /agent/respond（失败自动降级本地引擎）
┌──────────────▼──────────────┐
│  Agent 服务（server/）       │
│  提示词 + 输出归一化          │
│  DeepSeek / OpenAI 兼容端点  │
└─────────────────────────────┘
```

设计上坚持四条：

1. **数据只有一个来源** —— 对话、表单、引导三条入口都走同一个 `applyMemory` 投影，不存在两套数据。
2. **记忆与模型解耦** —— 模型只负责「把话变成结构化草稿」，落库、去重、建关系全在客户端确定性代码里。
3. **密钥不进客户端** —— 模型调用只在服务端发生，App 只拿到一个 URL。
4. **失败可降级** —— 服务端挂了就退回本地规则引擎，并在 UI 明确标注，不假装成功。

---

## 快速开始

### 前置

- Node.js **24+**（服务端用原生 TypeScript 执行，无需 tsx / 编译）
- 一个 DeepSeek API Key：<https://platform.deepseek.com/api_keys>

### 1. 安装

```bash
git clone https://github.com/zrchen-ops/KnowMe--.git
cd KnowMe--
npm install
```

### 2. 配置

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

编辑 `.env`，至少填一行：

```ini
DEEPSEEK_API_KEY=sk-你的key
```

### 3. 起 Agent 服务（终端 A）

```bash
npm run agent
```

看到下面两行即成功：

```
[knowme-agent] listening on http://127.0.0.1:8787 · provider=deepseek
[knowme-agent] 已读取 .env（6 个变量）
```

### 4. 起 App（终端 B）

```bash
npm run web       # 浏览器
npm start         # 或 Expo Go 扫码（手机真机见下）
```

首次进入会走三问引导（称呼 / 最近在忙 / 一个目标），之后在对话里说：

- 「我认识了一个叫陈晨的同学」→ 人物记忆
- 「明天下午三点复习高数两个小时」→ 任务
- 「我看完了《人类简史》」→ 事件
- 「我压力好大」→ 只回应，不落记忆

### 手机真机

`.env` 改两处，手机和电脑同一个 Wi-Fi，防火墙放行 8787：

```ini
HOST=0.0.0.0
EXPO_PUBLIC_AGENT_API_URL=http://192.168.x.x:8787
```

> `EXPO_PUBLIC_*` 是构建时注入的，改完必须重启 `npm start`。

---

## 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run agent` | 启动 Agent 服务（读取 `.env`） |
| `npm run web` / `npm start` | 启动 App |
| `npm run verify` | **门禁**：typecheck + lint + test |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint（flat config，Expo SDK 58） |
| `npm test` | Jest（39 个用例） |
| `npm run eval:agent` | 22 条真实提取用例，输出准确率（低于 80% 退出码 1） |

---

## 目录结构

```
app/                # Expo Router 路由（页面即路由）
  (tabs)/           #   对话 / 图谱 / 成长
  goal/ task/       #   目标与日程详情、新建
  review/           #   周复盘
  onboarding.tsx    #   首次三问引导
  settings.tsx      #   称呼、自动确认、清空/载入演示数据
components/         # 展示组件（agent / graph / growth / memory / common）
store/              # Zustand store：记忆、图谱、目标、日程、事件与全部动作
  seed.ts           #   演示数据 + 空数据起点
services/ai/        # Agent 接缝：远端优先，失败降级本地规则引擎
services/growth/    # 统计与复盘文案
server/             # Agent 服务（详见 server/README.md）
__tests__/          # 记忆投影、统计、日期、Provider 与归一化
```

### 记忆如何变成图谱

```
用户表达 → 模型/规则抽取 MemoryDraft → 用户确认
        → applyMemory() 投影：
            · 节点（按名称与类型去重，同一目标二次表达会归并）
            · 关系（从「我」出发，relationType 有语义）
            · 目标 / 任务 / 事件（各自带 sourceMemoryId）
        → 图谱、成长、复盘读的都是同一份状态
```

删除方向同样对称：删记忆会级联清理节点与关系；删目标会连它的来源记忆一起清掉，不留孤儿。

---

## 测试与质量

```
tsc --noEmit     0 errors
expo lint        0 errors / 13 warnings（Reanimated 手势的 React Compiler 规则，待重构）
jest             39 passed
eval:agent       22/22（deepseek-flash，2026-11-06 实测）
```

CI（`.github/workflows/ci.yml`）在 Ubuntu 上跑 **install → typecheck → lint → test → web 打包**。
在 Linux 上真实打包这一步是必要的：仓库曾因一处文件名大小写不一致（`Colors.ts` vs `colors`）在大小写敏感的文件系统上直接构建失败，而 Windows 本地完全看不出来。

---

## 隐私与安全

- 记忆、对话、图谱默认**只存在设备本地**（AsyncStorage），没有账号体系、没有云端同步。
- 模型密钥**只在服务端**；客户端拿到的只有 `EXPO_PUBLIC_AGENT_API_URL`。
- 发往服务端的上下文按需裁剪：最近 12 条记忆、活跃目标、未完成待办、节点名，不做全量同步。
- 涉及金额、转账、订票、发给别人的消息 → 只回应、不落记忆，并提示需要用户确认。
- 用户可以随时「清空我的数据」；清空后回到只有「我」这一个节点的空白图谱。

---

## 已知限制

- 语音输入是演示占位，没有真实转写。
- 真机/浏览器上的引导跳转与启动时序尚未做端到端验证（逻辑已实现）。
- 图谱布局是 12 个固定槽位，超过 12 个非中心节点会开始重叠。
- 记忆的「过期 / 被纠正」还没有独立状态，目前只能改或删。
- 没有多端同步与数据导出。

---

## Roadmap

- [ ] 复盘结论写入记忆（当前只生成任务）
- [ ] 图谱力学布局 + 关系来源证据链
- [ ] 真实语音转写
- [ ] 主动提醒（任务到期、目标停滞）
- [ ] 记忆过期与纠错（supersedes）
- [ ] 数据导出 / 迁移

---

## License

[MIT](./LICENSE)
