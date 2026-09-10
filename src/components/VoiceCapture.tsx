import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { createSpeechService, type SpeechSnapshot } from '../services/speech';
import { colors } from '../theme';
import { Button, Icon } from './ui';

export function VoiceCapture({ onTranscript, onBusy }: { onTranscript: (text: string) => void; onBusy: (busy: boolean) => void }) {
  const service = useMemo(() => createSpeechService(), []);
  const [state, setState] = useState<SpeechSnapshot>({ status: 'idle' });
  const [seconds, setSeconds] = useState(0);
  const [language, setLanguage] = useState('');
  const callbacks = useRef({ onTranscript, onBusy });
  useEffect(() => { callbacks.current = { onTranscript, onBusy }; }, [onTranscript, onBusy]);
  useEffect(() => service.subscribe(snapshot => {
    setState(snapshot);
    if (snapshot.status === 'starting') setSeconds(0);
    callbacks.current.onBusy(!['idle', 'error'].includes(snapshot.status));
    if (snapshot.status === 'idle' && snapshot.transcript) callbacks.current.onTranscript(snapshot.transcript);
  }), [service]);
  useFocusEffect(useCallback(() => () => { service.interrupt(); }, [service]));
  useEffect(() => {
    service.setAppState(AppState.currentState);
    const subscription = AppState.addEventListener('change', next => {
      service.setAppState(next);
    });
    return () => { subscription.remove(); void service.cancel(); };
  }, [service]);
  useEffect(() => {
    if (state.status !== 'listening') return;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [state.status]);
  const busy = !['idle', 'error'].includes(state.status);
  return <View style={{ marginTop: 14, gap: 10 }}>
    {!busy && <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Start voice capture" onPress={() => { void service.start(language); }} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.soft, borderRadius: 14 }}><Icon name="mic-outline" color={colors.primary} /></Pressable>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Speak a thought</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['', 'System'], ['en-US', 'English'], ['uk-UA', 'Українська']].map(([code, label]) => <Pressable key={code} accessibilityRole="button" accessibilityLabel={`Speech language: ${label}`} aria-pressed={language === code} onPress={() => setLanguage(code)} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: language === code ? colors.soft : colors.background }}><Text style={{ color: colors.primary, fontSize: 12 }}>{label}</Text></Pressable>)}</View>
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Your device’s speech service may process audio online. Ukrainian speech is supported where available; automatic note detection currently understands English.</Text>
    </>}
    {busy && <View style={{ backgroundColor: '#FAF0DA', padding: 14, borderRadius: 14, gap: 10 }}>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.ink }}>{state.status === 'listening' ? `● Listening · ${seconds}s` : state.status === 'processing' ? 'Transcribing…' : state.status === 'requesting-permission' ? 'Requesting microphone access…' : state.status === 'waiting-foreground' ? 'Return to AI Note to start listening…' : 'Starting speech recognition…'}</Text>
      {!!state.partialTranscript && <Text style={{ color: colors.ink, lineHeight: 22 }}>{state.partialTranscript}</Text>}
      {state.status === 'listening' && <Button label="Stop and review" onPress={() => { void service.stop().catch(() => {}); }} />}
      <Button label="Cancel recording" secondary onPress={() => { void service.cancel(); }} />
    </View>}
    {state.status === 'error' && <View style={{ gap: 10, backgroundColor: '#FAF0DA', padding: 14, borderRadius: 14 }}><Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13, lineHeight: 20 }}>{state.message}</Text><Button label="Retry voice capture" onPress={() => { void service.start(language); }} /><Button label="Dismiss" secondary onPress={() => { void service.cancel(); }} /></View>}
  </View>;
}
