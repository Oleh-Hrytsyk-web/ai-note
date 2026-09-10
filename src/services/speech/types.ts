export type SpeechStatus = 'preparing' | 'waiting-foreground' | 'starting' | 'idle' | 'requesting-permission' | 'listening' | 'processing' | 'error';
export interface SpeechSnapshot { status: SpeechStatus; transcript?: string; message?: string; partialTranscript?: string }
export interface SpeechService {
  start(language?: string): Promise<void>;
  stop(): Promise<string>;
  cancel(): Promise<void>;
  setAppState(state: string): void;
  interrupt(): void;
  subscribe(listener: (snapshot: SpeechSnapshot) => void): () => void;
}
export interface SpeechEvents {
  started(): void;
  processing(): void;
  result(text: string, final?: boolean): void;
  ended(): void;
  error(code: string, message?: string): void;
}
export interface SpeechDriver {
  getPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  listen(events: SpeechEvents): () => void;
  start(language: string): void;
  stop(): void;
  abort(): void;
}
