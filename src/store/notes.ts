import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isNote, type Note, type NoteType, type NoteMetadata } from '../types/note';

const STORAGE_KEY = '@ai-note/notes-v1';
interface NotesState {
  notes: Note[];
  hydrated: boolean;
  savedId: string | null;
  savedRevision: number;
  acknowledgeSave: () => void;
  storageError: string | null;
  hydrate: () => Promise<void>;
  addNote: (text: string, type?: NoteType, metadata?: NoteMetadata) => string | null;
  updateNote: (id: string, text: string, type: NoteType) => void;
  toggleCompleted: (id: string) => void;
}

// Serialize writes so rapid edits cannot persist an older snapshot last.
let writes = Promise.resolve();
let hydration: Promise<void> | undefined;
function persist(notes: Note[]) {
  writes = writes.then(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, notes }));
      useNotesStore.setState({ storageError: null });
    } catch {
      useNotesStore.setState({ storageError: 'Changes are in memory, but could not be saved to this device. Try saving again.' });
    }
  });
}

export const useNotesStore = create<NotesState>((set, get) => ({
  savedId: null, savedRevision: 0, acknowledgeSave: () => set({ savedId: null }),
  notes: [], hydrated: false, storageError: null,
  hydrate: () => {
    if (get().hydrated) return Promise.resolve();
    if (hydration) return hydration;
    hydration = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const data: unknown = raw ? JSON.parse(raw) : { version: 1, notes: [] };
        if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 ||
          !('notes' in data) || !Array.isArray(data.notes) || !data.notes.every(isNote)) {
          throw new Error('Invalid stored notes');
        }
        set({ notes: data.notes, hydrated: true, storageError: null });
      } catch {
        set({ storageError: 'Your saved notes could not be loaded. Retry to keep existing data safe.' });
      } finally { hydration = undefined; }
    })();
    return hydration;
  },
  addNote: (text, type = 'note', metadata = {}) => {
    if (!text.trim() || !get().hydrated) return null;
    const now = new Date().toISOString();
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    const notes = [{ ...metadata, id, text: text.trim(), type, createdAt: now, updatedAt: now, completed: false }, ...get().notes];
    set({ notes, savedId: id, savedRevision: get().savedRevision + 1 }); persist(notes); return id;
  },
  updateNote: (id, text, type) => {
    if (!text.trim() || !get().hydrated) return;
    const notes = get().notes.map(n => n.id === id ? { ...n, text: text.trim(), type,
      completed: type === 'note' ? false : n.completed, updatedAt: new Date().toISOString() } : n);
    notes.sort((a, b) => Number(b.id === id) - Number(a.id === id));
    set({ notes, savedId: id, savedRevision: get().savedRevision + 1 }); persist(notes);
  },
  toggleCompleted: (id) => {
    if (!get().hydrated) return;
    const notes = get().notes.map(n => n.id === id && n.type !== 'note'
      ? { ...n, completed: !n.completed, updatedAt: new Date().toISOString() } : n);
    set({ notes }); persist(notes);
  },
}));
