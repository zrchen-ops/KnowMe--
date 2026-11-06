/**
 * 极简 .env 读取：零依赖，只做「KEY=VALUE」这一件事。
 * 已存在的环境变量优先，不会被文件覆盖（方便临时用命令行覆盖）。
 */
import fs from 'node:fs';

export function loadEnvFile(filePath = '.env'): { loaded: boolean; keys: string[] } {
  if (!fs.existsSync(filePath)) return { loaded: false, keys: [] };

  const keys: string[] = [];
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === '') continue;

    keys.push(key);
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return { loaded: true, keys };
}
