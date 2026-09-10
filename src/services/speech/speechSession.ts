import type { SpeechDriver, SpeechService, SpeechSnapshot } from './types';

export function speechError(code: string, reason?: string) {
  if (code === 'not-allowed') return 'Microphone or speech permission was denied. Enable permissions in your phone’s app settings, then try again.';
  if (code === 'no-speech') return 'No speech detected. Try again and speak a little closer to the microphone.';
  if (code === 'language-not-supported' || code === 'language-unavailable') return 'This recognition service does not support the selected language. Try another language or install its speech model.';
  if (code === 'network') return 'Speech recognition could not connect. Check your connection and try again.';
  return `Recognition failed: ${reason || code}. Try again, or type your thought instead.`;
}

/** Hardware-independent session lifecycle, including cancellation during permission prompts. */
export function createSpeechSession(load: () => Promise<SpeechDriver>, defaultLanguage: () => string, log: (event: string) => void = () => {}): SpeechService {
  let snapshot: SpeechSnapshot = { status: 'idle' };
  const listeners = new Set<(s: SpeechSnapshot) => void>();
  let generation = 0;
  let driver: SpeechDriver | undefined;
  let remove = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let transcript = '';
  let appState = 'active';
  let resume: (() => void) | undefined;
  let completion: Promise<string> = Promise.resolve('');
  let resolve = (_text: string) => {};
  let reject = (_error: Error) => {};
  const emit = (next: SpeechSnapshot) => { log(`state: ${next.status}${next.message ? `: ${next.message}` : ''}`); snapshot = next; listeners.forEach(listener => listener(next)); };
  const cleanup = () => { clearTimeout(timer); resume?.(); resume = undefined; remove(); remove = () => {}; };
  const fail = (message: string) => {
    generation++; cleanup(); try { driver?.abort(); } catch { /* Already stopped. */ }
    driver = undefined; reject(new Error(message)); emit({ status: 'error', message });
  };
  const service: SpeechService = {
    setAppState(state) {
      appState = state; log(`app: ${state}`);
      if (state === 'active') { resume?.(); resume = undefined; }
      else if (['starting', 'listening', 'processing'].includes(snapshot.status)) service.interrupt();
    },
    interrupt() { if (!['idle', 'error'].includes(snapshot.status)) fail('Voice capture was interrupted. Return to AI Note and retry.'); },
    subscribe(listener) { listeners.add(listener); listener(snapshot); return () => { listeners.delete(listener); }; },
    async start(language) {
      if (!['idle', 'error'].includes(snapshot.status)) return;
      const token = ++generation;
      transcript = '';
      completion = new Promise<string>((ok, error) => { resolve = ok; reject = error; });
      void completion.catch(() => {}); // Natural-end failures may occur before stop is called.
      emit({ status: 'preparing' });
      try {
        const loaded = await load();
        if (token !== generation) return;
        driver = loaded;
        let granted = await loaded.getPermission();
        if (token !== generation) return;
        if (!granted) {
          emit({ status: 'requesting-permission' });
          granted = await loaded.requestPermission();
          if (token !== generation) return;
          granted = granted && await loaded.getPermission();
        }
        log(`permission: ${granted}`);
        if (token !== generation) return;
        if (!granted) { fail(speechError('not-allowed')); return; }
        if (appState !== 'active') {
          emit({ status: 'waiting-foreground' });
          await new Promise<void>(ok => { resume = ok; });
          if (token !== generation) return;
        }
        emit({ status: 'starting' });
        const active = (action: () => void) => { if (token === generation) action(); };
        remove = loaded.listen({
          started: () => active(() => {
            if (snapshot.status === 'processing') return;
            clearTimeout(timer); emit({ status: 'listening' });
            timer = setTimeout(() => { void service.stop().catch(() => {}); }, 60000);
          }),
          processing: () => active(() => {
            clearTimeout(timer); emit({ status: 'processing' });
            timer = setTimeout(() => fail('Transcription timed out. Please try again.'), 15000);
          }),
          result: (text, final = true) => active(() => {
            log(final ? 'result: final' : 'result: partial');
            if (final) transcript = text.trim();
            else emit({ ...snapshot, partialTranscript: text.trim() });
          }),
          ended: () => active(() => {
            log('end');
            if (!transcript) { fail(speechError('no-speech')); return; }
            generation++; cleanup(); driver = undefined; resolve(transcript);
            emit({ status: 'idle', transcript });
          }),
          error: (code, message) => active(() => fail(speechError(code, message))),
        });
        timer = setTimeout(() => fail('The microphone did not start. Please try again.'), 15000);
        const locale = language || defaultLanguage();
        log(`start: ${locale}, system recognizer`);
        loaded.start(locale);
      } catch (error) {
        if (token === generation) fail(error instanceof Error ? error.message : speechError('failed'));
      }
    },
    async stop() {
      if (snapshot.status === 'listening') {
        clearTimeout(timer); emit({ status: 'processing' });
        timer = setTimeout(() => fail('Transcription timed out. Please try again.'), 15000);
        try { driver?.stop(); } catch { fail(speechError('failed')); }
      }
      return completion;
    },
    async cancel() {
      generation++; cleanup(); try { driver?.abort(); } catch { /* Cancellation remains safe. */ }
      driver = undefined; transcript = ''; resolve(''); emit({ status: 'idle' });
    },
  };
  return service;
}
