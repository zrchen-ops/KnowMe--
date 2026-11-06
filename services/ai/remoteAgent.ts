import type { AgentContext, AgentResponse, AgentService } from './types';

/**
 * Reserved integration point for a real backend. The mobile client never holds an API key:
 * the backend owns provider credentials and memory retrieval.
 */
export class RemoteAgentService implements AgentService {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async respond(input: string, context: AgentContext): Promise<AgentResponse> {
    const response = await fetch(`${this.endpoint}/agent/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        context: {
          memories: context.memories,
          entities: context.entities,
          goals: context.goals,
          tasks: context.tasks,
          events: context.events,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent 服务暂时不可用（${response.status}）`);
    }

    const data = (await response.json()) as AgentResponse;
    return data;
  }
}
