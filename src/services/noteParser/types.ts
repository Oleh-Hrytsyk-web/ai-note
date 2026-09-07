import type { NoteType } from '../../types/note';

export interface ParsedNote {
  type: NoteType;
  text: string;
  date?: string;
  time?: string;
  items?: string[];
  confidence: number;
}

export interface NoteParser {
  parse(text: string, context?: { now?: Date }): Promise<ParsedNote>;
}
