import { localNoteParser } from './localNoteParser';
import type { NoteParser } from './types';

// Replace this implementation with an async AI adapter later; callers keep the same contract.
export const noteParser: NoteParser = localNoteParser;
export type { NoteParser, ParsedNote } from './types';
