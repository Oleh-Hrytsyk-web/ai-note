import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteCard } from '../../components/NoteCard';
import { CapturePreview } from '../../components/CapturePreview';
import { VoiceCapture } from '../../components/VoiceCapture';
import { Button, Icon, SectionLabel } from '../../components/ui';
import { useNotesStore } from '../../store/notes';
import { colors, typeMeta } from '../../theme';
import { noteTypes, type Note, type NoteType } from '../../types/note';

export default function HomeScreen() {
  const notes = useNotesStore(s => s.notes);
  const addNote = useNotesStore(s => s.addNote);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<NoteType | 'all'>('all');
  const list = useRef<FlatList<Note>>(null);
  const recentOffset = useRef(0);
  const scrollPending = useRef(false);
  const savedId = useNotesStore(s => s.savedId);
  const savedRevision = useNotesStore(s => s.savedRevision);
  const storageError = useNotesStore(s => s.storageError);
  const input = useRef<TextInput>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  useEffect(() => useNotesStore.subscribe((state, previous) => {
    if (state.savedId && state.savedRevision !== previous.savedRevision) {
      setText(''); setPending(null); setFilter('all');
    }
  }), []);
  useEffect(() => {
    if (!savedId) return;
    scrollPending.current = true;
    list.current?.scrollToOffset({ offset: recentOffset.current, animated: true });
    const timer = setTimeout(() => useNotesStore.getState().acknowledgeSave(), 4000);
    return () => clearTimeout(timer);
  }, [savedId, savedRevision]);
  const visible = notes.filter(n => filter === 'all' || n.type === filter);
  function capture() {
    if (text.trim()) { Keyboard.dismiss(); setPending(text); }
  }
  return <SafeAreaView edges={['top']} style={s.safe}>
    {pending !== null && <CapturePreview text={pending} onCancel={() => setPending(null)} onSave={parsed => {
      if (addNote(parsed.text, parsed.type, { scheduledDate: parsed.date, scheduledTime: parsed.time, items: parsed.items, confidence: parsed.confidence })) {
        setText(''); setFilter('all'); setPending(null);
      }
    }} />}
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!!savedId && !storageError && <Text accessibilityLiveRegion="polite" style={{ backgroundColor: colors.soft, color: colors.primary, padding: 12, textAlign: 'center', fontWeight: '600' }}>Saved</Text>}
      <FlatList ref={list} onContentSizeChange={() => { if (scrollPending.current) { list.current?.scrollToOffset({ offset: recentOffset.current, animated: true }); scrollPending.current = false; } }} data={visible} keyExtractor={n => n.id} renderItem={({ item }) => <NoteCard note={item} />}
        keyboardShouldPersistTaps="handled" contentContainerStyle={s.list}
        ListHeaderComponent={<>
          <View style={s.brandRow}><View style={s.brand}><View style={s.logo}><Icon name="sparkles-outline" color="white" size={20} /></View><Text style={s.brandText}>AI Note</Text></View><View style={s.local}><View style={s.dot} /><Text style={s.localText}>On your device</Text></View></View>
          <Text style={s.eyebrow}>A LITTLE SPACE FOR YOUR MIND</Text>
          <Text style={s.heading}>Good thoughts{ '\n' }start here.</Text>
          <Text style={s.subtitle}>An idea, a to-do, a little thing to remember.</Text>
          <View style={s.capture}>
            <TextInput ref={input} accessibilityLabel="Quick thought" placeholder="What’s on your mind?" placeholderTextColor={colors.muted}
              value={text} onChangeText={setText} editable={!voiceBusy} multiline maxLength={20000} style={s.input} textAlignVertical="top" />
            <View style={s.captureBottom}>
              <Button label="Review thought ↗" onPress={capture} disabled={!text.trim() || voiceBusy} />
            </View>
            <VoiceCapture onBusy={setVoiceBusy} onTranscript={transcript => {
              const combined = [text.trim(), transcript.trim()].filter(Boolean).join('\n');
              setText(combined); Keyboard.dismiss(); setPending(combined);
            }} />
          </View>
          <Text accessibilityLiveRegion="polite" style={s.hint}>{'Capture now. Make room for what’s next.'}</Text>
          <View style={s.section}><Text style={s.sectionTitle}>Your thoughts</Text><Text style={s.count}>{notes.length} {notes.length === 1 ? 'thought' : 'thoughts'}</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {(['all', ...noteTypes] as const).map(type => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: filter === type }} aria-pressed={filter === type} onPress={() => setFilter(type)} style={[s.filter, filter === type && s.activeFilter]}>
              <Text style={[s.filterText, filter === type && { color: '#fff' }]}>{type === 'all' ? 'All thoughts' : `${typeMeta[type].label}${type === 'shopping' ? '' : 's'}`}</Text>
            </Pressable>)}
          </ScrollView>
          <View onLayout={event => { recentOffset.current = event.nativeEvent.layout.y; }}><SectionLabel>RECENT NOTES</SectionLabel></View>
        </>}
        ListEmptyComponent={<View style={s.empty}><View style={s.emptyIcon}><Icon name="leaf-outline" size={30} color={colors.primary} /></View>
          <Text style={s.emptyTitle}>{filter === 'all' ? 'A fresh page, just for you' : `No ${typeMeta[filter].label.toLowerCase()} items yet`}</Text>
          <Text style={s.emptyText}>{filter === 'all' ? 'Let that first thought out. Big ideas and tiny reminders are equally welcome.' : 'Create a thought and choose its type to see it here.'}</Text>
          <Button label="Write a thought" secondary onPress={() => router.push('/note/new')} />
        </View>} />
      <Pressable accessibilityRole="button" accessibilityLabel="Create new note" onPress={() => router.push('/note/new')} style={({ pressed }) => [s.fab, { opacity: pressed ? 0.8 : 1 }]}><Icon name="add" size={28} color="white" /></Pressable>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, container: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }, list: { padding: 24, paddingBottom: 100 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }, brand: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  logo: { backgroundColor: colors.primary, borderRadius: 12, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, brandText: { color: colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.7 },
  local: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary }, localText: { color: colors.muted, fontSize: 10 },
  eyebrow: { fontSize: 10, letterSpacing: 1.7, color: colors.primary, fontWeight: '600', marginBottom: 14 }, heading: { fontSize: 40, lineHeight: 45, letterSpacing: -1.8, fontWeight: '600', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22, marginTop: 12, marginBottom: 24 }, capture: { backgroundColor: colors.surface, padding: 16, borderWidth: 1, borderColor: '#D7DFD5', borderRadius: 22 },
  input: { fontSize: 17, lineHeight: 25, minHeight: 100, maxHeight: 220, color: colors.ink, padding: 4 }, captureBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12 },
  voice: { flexDirection: 'row', alignItems: 'center' }, mic: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center' }, voiceText: { fontSize: 11, color: colors.muted },
  hint: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 12, marginBottom: 32 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 21, fontWeight: '600', letterSpacing: -0.5, color: colors.ink }, count: { fontSize: 12, color: colors.muted }, filters: { gap: 8, paddingBottom: 24 },
  filter: { minHeight: 44, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }, activeFilter: { backgroundColor: colors.primary, borderColor: colors.primary }, filterText: { color: colors.muted, fontSize: 13 },
  empty: { alignItems: 'center', padding: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D8DFD5', borderRadius: 22 }, emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.ink, textAlign: 'center' }, emptyText: { fontSize: 13, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, maxWidth: 280 },
  fab: { position: 'absolute', bottom: 20, right: 24, width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', boxShadow: '0 6px 16px rgba(35,65,45,0.22)' },
});
