export const noteTypes = ['note', 'task', 'reminder', 'shopping'] as const;
export type NoteType = (typeof noteTypes)[number];

export interface Note {
  id: string;
  text: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const n = value as Record<string, unknown>;
  return typeof n.id === 'string' && typeof n.text === 'string' &&
    noteTypes.includes(n.type as NoteType) && typeof n.completed === 'boolean' &&
    typeof n.createdAt === 'string' && Number.isFinite(Date.parse(n.createdAt)) &&
    typeof n.updatedAt === 'string' && Number.isFinite(Date.parse(n.updatedAt));
}
