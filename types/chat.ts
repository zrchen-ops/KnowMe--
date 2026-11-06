export type ChatRole = 'user' | 'agent';
export type ChatKind = 'text' | 'plan' | 'tip' | 'memory' | 'review';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  kind: ChatKind;
  createdAt: string;
  memoryId?: string;
  taskIds?: string[];
}

export type QuickActionKey = 'memory' | 'goal' | 'review';

export interface QuickAction {
  key: QuickActionKey;
  label: string;
}
