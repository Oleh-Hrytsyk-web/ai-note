import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '../store/notes';
import { colors } from '../theme';
import type { Note, NoteType } from '../types/note';
import { Button, SectionLabel, TypePicker } from './ui';

export function NoteEditor({ note }: { note?: Note }) {
  const [text, setText] = useState(note?.text ?? '');
  const [type, setType] = useState<NoteType>(note?.type ?? 'note');
  const [saved, setSaved] = useState(false);
  const addNote = useNotesStore(s => s.addNote);
  const updateNote = useNotesStore(s => s.updateNote);
  const dirty = text !== (note?.text ?? '') || type !== (note?.type ?? 'note');
  function save() {
    if (!text.trim()) return;
    if (note) { updateNote(note.id, text, type); setText(text.trim()); setSaved(true); }
    else { const id = addNote(text, type); if (id) router.replace({ pathname: '/note/[id]', params: { id } }); }
  }
  return <SafeAreaView edges={['bottom']} style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Text style={s.title}>{note ? 'A thought worth keeping.' : 'Make a little room.'}</Text>
      <Text style={s.date}>{note ? `Created ${new Date(note.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : 'Get it out of your head and onto the page.'}</Text>
      <SectionLabel>KEEP IT AS</SectionLabel><TypePicker value={type} onChange={value => { setType(value); setSaved(false); }} />
      {type === 'reminder' && <Text style={s.helper}>A place to remember. Scheduled notifications are coming later.</Text>}
      {(note?.scheduledDate || note?.scheduledTime) && <Text style={s.helper}>Captured schedule: {note.scheduledDate ?? 'No date'} · {note.scheduledTime ?? 'No time'}. No notification scheduled.</Text>}
      {!!note?.items?.length && <Text style={s.helper}>Captured items: {note.items.join(', ')}</Text>}
      {note?.confidence !== undefined && note.confidence < 0.65 && <Text style={s.helper}>Low-confidence detection — review this thought.</Text>}
      <View style={s.paper}><TextInput accessibilityLabel="Note content" placeholder="Start with a thought…" placeholderTextColor={colors.muted}
        value={text} onChangeText={value => { setText(value); setSaved(false); }} multiline maxLength={20000} textAlignVertical="top" style={s.editor} />
        <Text style={s.characters}>{text.length.toLocaleString()} / 20,000</Text></View>
      <Text style={s.helper}>Choose a type yourself. Captured schedule and items stay unchanged when editing text.</Text>
      <Button label={note ? 'Save changes' : 'Save thought'} onPress={save} disabled={!text.trim()} />
      <Text accessibilityLiveRegion="polite" style={s.status}>{saved && !dirty ? 'Changes updated in your notebook.' : dirty ? 'Unsaved changes — save before leaving.' : 'Stored on this device.'}</Text>
      <View style={{ marginTop: 20 }}><Button label="Back to notebook" secondary onPress={() => router.replace('/')} /></View>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 24, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontSize: 28, letterSpacing: -1, color: colors.ink, fontWeight: '600' }, date: { fontSize: 12, color: colors.muted, marginTop: 10, marginBottom: 30, lineHeight: 20 },
  paper: { marginTop: 24, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20 }, editor: { minHeight: 260, fontSize: 18, lineHeight: 29, color: colors.ink },
  characters: { textAlign: 'right', color: colors.muted, fontSize: 11, marginTop: 16 }, helper: { color: colors.muted, fontSize: 12, lineHeight: 19, marginVertical: 16 }, status: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
