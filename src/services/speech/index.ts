import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import { createSpeechSession } from './speechSession';
import type { SpeechDriver } from './types';
export type { SpeechService, SpeechSnapshot } from './types';

async function loadNativeDriver(): Promise<SpeechDriver> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new Error('Voice capture is available in the installed Android and iOS apps. You can still type here.');
  if (Constants.executionEnvironment === 'storeClient') throw new Error('Voice capture needs an AI Note development build; Expo Go does not include the speech module.');
  // Lazy import keeps Expo Go and web usable when the native module is absent.
  let module: typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;
  try { module = (await import('expo-speech-recognition')).ExpoSpeechRecognitionModule; }
  catch { throw new Error('Speech module is unavailable. Rebuild and install the AI Note development app.'); }
  if (Platform.OS === 'android') {
    console.info('[AI Note voice] default service:', module.getDefaultRecognitionService());
    console.info('[AI Note voice] available services:', module.getSpeechRecognitionServices());
  }
  if (!module.isRecognitionAvailable()) throw new Error('No speech recognition service is available. Enable a speech service on your phone, or type your thought.');
  return {
    async getPermission() { return (await module.getPermissionsAsync()).granted; },
    async requestPermission() { return (await module.requestPermissionsAsync()).granted; },
    listen(events) {
      const subscriptions = [
        module.addListener('start', events.started),
        module.addListener('audioend', events.processing),
        module.addListener('result', event => { events.result(event.results[0]?.transcript ?? '', event.isFinal); }),
        module.addListener('error', event => events.error(event.error, event.message)),
        module.addListener('end', events.ended),
      ];
      return () => subscriptions.forEach(subscription => subscription.remove());
    },
    start(lang) { module.start({ lang, interimResults: true, continuous: false, maxAlternatives: 1, recordingOptions: { persist: false } }); },
    stop() { module.stop(); }, abort() { module.abort(); },
  };
}

export const createSpeechService = () => createSpeechSession(loadNativeDriver, () => getLocales()[0]?.languageTag ?? 'en-US', event => {
  // Event metadata only: never log dictated text. Retained in preview builds for adb diagnostics.
  console.info(`[AI Note voice] ${event}`);
});
