import type { AgentContext, AgentResponse, AgentService } from './types';

const REQUEST_TIMEOUT_MS = 25_000;

/**
 * 真实后端的接缝。客户端永远不持有模型密钥：Provider 凭据与记忆检索都在服务端
 * （见 `server/`）。请求体会把上下文裁剪到必要字段，避免把整库数据发出去。
 */
export class RemoteAgentService implements AgentService {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async respond(input: string, context: AgentContext): Promise<AgentResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.endpoint}/agent/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: {
            memories: context.memories.slice(-12).map((memory) => ({
              content: memory.content,
              type: memory.type,
              status: memory.status,
            })),
            entities: context.entities.map((entity) => ({
              name: entity.name,
              type: entity.type,
              description: entity.description,
            })),
            goals: context.goals.map((goal) => ({
              title: goal.title,
              deadline: goal.deadline,
              progress: goal.progress,
              status: goal.status,
            })),
            tasks: context.tasks.slice(-20).map((task) => ({
              title: task.title,
              date: task.date,
              status: task.status,
            })),
            events: context.events.slice(-20).map((event) => ({
              title: event.title,
              date: event.date,
              duration: event.duration,
              category: event.category,
            })),
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Agent 服务暂时不可用（${response.status}）`);
      }

      const data = (await response.json()) as AgentResponse;
      if (!data || typeof data.text !== 'string') {
        throw new Error('Agent 服务返回了无法识别的结果');
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }
}
