import { mockAgentService } from './mockAgent';
import { RemoteAgentService } from './remoteAgent';
import type { AgentService } from './types';

/**
 * 当前使用本地 Mock 引擎，所有数据都保存在设备上。
 * 设置 EXPO_PUBLIC_AGENT_API_URL 后会切换到后端 Agent，密钥只应保存在服务端。
 */
export function getAgentService(): AgentService {
  const endpoint = process.env.EXPO_PUBLIC_AGENT_API_URL;
  if (endpoint && endpoint.length > 0) {
    return new RemoteAgentService(endpoint);
  }
  return mockAgentService;
}

export type { AgentContext, AgentResponse, AgentService, MemoryDraft } from './types';
