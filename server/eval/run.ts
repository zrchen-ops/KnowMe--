/**
 * 跑一遍提取用例，输出准确率。
 *
 *   node server/eval/run.ts              # 用当前环境的 provider
 *   AGENT_PROVIDER=stub node server/eval/run.ts   # 不需要密钥，验证管线是否通
 */
import { respond } from '../agent.ts';
import { loadEnvFile } from '../env.ts';
import { resolveProvider } from '../provider.ts';
import { EVAL_CASES } from './cases.ts';

loadEnvFile();

const TIME_ZONE = process.env.AGENT_TZ ?? 'Asia/Shanghai';
const MIN_ACCURACY = Number(process.env.EVAL_MIN_ACCURACY ?? 0.8);

function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

function label(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

const provider = resolveProvider();
const rows: Array<{ id: string; input: string; expect: string; got: string; ok: boolean; error?: string }> = [];

for (const item of EVAL_CASES) {
  try {
    const result = await respond(item.input, {}, provider, {
      today: today(),
      dateLabel: label(),
      timeoutMs: 30_000,
    });
    const got = result.memoryDraft?.type ?? 'null';
    rows.push({
      id: item.id,
      input: item.input,
      expect: item.expect ?? 'null',
      got,
      ok: got === (item.expect ?? 'null'),
    });
  } catch (error) {
    rows.push({
      id: item.id,
      input: item.input,
      expect: item.expect ?? 'null',
      got: 'ERROR',
      ok: false,
      error: (error as Error).message.slice(0, 80),
    });
  }
}

const passed = rows.filter((row) => row.ok).length;
const total = rows.length;
const accuracy = passed / total;

for (const row of rows) {
  const mark = row.ok ? '✅' : '❌';
  console.log(`${mark} ${row.id.padEnd(12)} 期望 ${row.expect.padEnd(10)} 实际 ${row.got.padEnd(10)} ${row.error ?? ''}`);
}
console.log(`\nprovider=${provider.name} 准确率 ${passed}/${total} = ${(accuracy * 100).toFixed(1)}%`);

if (provider.name === 'stub') {
  console.log('stub 模式只验证管线连通，不做准确率判定。');
  process.exit(0);
}
if (provider.name === 'none') {
  console.log('没有配置模型密钥：设置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY 后再跑。');
  process.exit(2);
}

const weak = rows.filter((row) => !row.ok).map((row) => `${row.id}: ${row.input}`);
if (accuracy < MIN_ACCURACY) {
  console.log(`低于阈值 ${(MIN_ACCURACY * 100).toFixed(0)}%。需要改进的用例：`);
  for (const line of weak) console.log(`  - ${line}`);
  process.exit(1);
}
console.log('达到阈值。');
