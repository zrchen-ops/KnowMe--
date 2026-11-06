import { useCallback, useRef } from 'react';

import { getAgentService } from '@/services/ai';
import { nowISO } from '@/utils/date';
import { uid } from '@/utils/id';
import { useAppStore } from '@/store/useAppStore';
import type { ChatMessage } from '@/types';

const THINKING_DELAY_MS = 900;

export function useAgentChat() {
  const typing = useAppStore((state) => state.typing);
  const inFlight = useRef(false);

  const send = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || inFlight.current) return;
    inFlight.current = true;
    const store = useAppStore.getState();

    const userMessage: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      text,
      kind: 'text',
      createdAt: nowISO(),
    };
    store.appendMessage(userMessage);
    store.setTyping(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, THINKING_DELAY_MS));
      const current = useAppStore.getState();
      const response = await getAgentService().respond(text, {
        memories: current.memories,
        entities: current.entities,
        goals: current.goals,
        tasks: current.tasks,
        events: current.events,
      });

      let memoryId: string | undefined;
      if (response.memoryDraft) {
        const id = current.addPendingMemory(response.memoryDraft);
        memoryId = id;
        if (current.settings.autoConfirmMemories) {
          useAppStore.getState().confirmMemory(id);
        }
      }

      const agentMessage: ChatMessage = {
        id: uid('msg'),
        role: 'agent',
        text: response.text,
        kind: response.memoryDraft ? 'memory' : response.kind,
        createdAt: nowISO(),
        memoryId,
        taskIds: response.taskIds,
      };
      if (response.degraded) {
        useAppStore.getState().showToast('Agent 服务未连接，已用本地引擎回复', 'info');
      }
      useAppStore.getState().appendMessage(agentMessage);
    } catch {
      useAppStore.getState().appendMessage({
        id: uid('msg'),
        role: 'agent',
        text: '刚才没有连接上 Agent，请稍后再试一次。',
        kind: 'text',
        createdAt: nowISO(),
      });
      useAppStore.getState().showToast('Agent 暂时不可用', 'error');
    } finally {
      useAppStore.getState().setTyping(false);
      inFlight.current = false;
    }
  }, []);

  return { send, typing };
}
