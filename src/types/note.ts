export const noteTypes = ['note', 'task', 'reminder', 'shopping'] as const;
export type NoteType = (typeof noteTypes)[number];

export interface NoteMetadata {
  scheduledDate?: string;
  scheduledTime?: string;
  items?: string[];
  confidence?: number;
}

export interface Note extends NoteMetadata {
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
    typeof n.updatedAt === 'string' && Number.isFinite(Date.parse(n.updatedAt)) &&
    (n.scheduledDate === undefined || (typeof n.scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.scheduledDate))) &&
    (n.scheduledTime === undefined || (typeof n.scheduledTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(n.scheduledTime))) &&
    (n.items === undefined || (Array.isArray(n.items) && n.items.every(item => typeof item === 'string'))) &&
    (n.confidence === undefined || (typeof n.confidence === 'number' && Number.isFinite(n.confidence) && n.confidence >= 0 && n.confidence <= 1));
}
