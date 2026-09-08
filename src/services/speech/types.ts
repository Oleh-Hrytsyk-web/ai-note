export type SpeechStatus = 'idle' | 'requesting-permission' | 'listening' | 'processing' | 'error';
export interface SpeechSnapshot { status: SpeechStatus; transcript?: string; message?: string }
export interface SpeechService {
  start(language?: string): Promise<void>;
  stop(): Promise<string>;
  cancel(): Promise<void>;
  subscribe(listener: (snapshot: SpeechSnapshot) => void): () => void;
}
export interface SpeechEvents {
  started(): void;
  processing(): void;
  result(text: string): void;
  ended(): void;
  error(code: string): void;
}
export interface SpeechDriver {
  requestPermission(): Promise<boolean>;
  listen(events: SpeechEvents): () => void;
  start(language: string): void;
  stop(): void;
  abort(): void;
}
