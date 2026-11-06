import { mockAgentService } from './mockAgent';
import { RemoteAgentService } from './remoteAgent';
import type { AgentContext, AgentResponse, AgentService } from './types';

/**
 * 优先用真实后端（`server/`），不可用时自动降级到本地规则引擎，
 * 保证离线/没配密钥时 App 仍然可用，同时在响应里标记 `degraded` 让 UI 提示。
 */
class FallbackAgentService implements AgentService {
  constructor(
    private readonly primary: AgentService,
    private readonly fallback: AgentService,
  ) {}

  async respond(input: string, context: AgentContext): Promise<AgentResponse> {
    try {
      const result = await this.primary.respond(input, context);
      return result;
    } catch {
      const result = await this.fallback.respond(input, context);
      return { ...result, degraded: true, provider: 'mock' };
    }
  }
}

/**
 * EXPO_PUBLIC_AGENT_API_URL 指向 `server/`（例如 http://127.0.0.1:8787）。
 * 未配置时直接用本地规则引擎，所有数据留在设备上。
 */
export function getAgentService(): AgentService {
  const endpoint = process.env.EXPO_PUBLIC_AGENT_API_URL;
  if (endpoint && endpoint.length > 0) {
    return new FallbackAgentService(new RemoteAgentService(endpoint), mockAgentService);
  }
  return mockAgentService;
}

export type { AgentContext, AgentResponse, AgentService, MemoryDraft } from './types';
