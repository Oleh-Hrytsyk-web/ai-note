import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotesStore } from '../store/notes';
import { colors, typeMeta } from '../theme';
import type { Note } from '../types/note';
import { Icon } from './ui';

export function NoteCard({ note }: { note: Note }) {
  const toggle = useNotesStore(s => s.toggleCompleted);
  const meta = typeMeta[note.type];
  return <View style={s.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${meta.label}: ${note.text}`}
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })} style={s.body}>
      <View style={s.meta}><View style={[s.badge, { backgroundColor: meta.background }]}>
        <Icon name={meta.icon} size={14} color={meta.color} /><Text style={{ color: meta.color, fontSize: 11, fontWeight: '600' }}>{meta.label}</Text>
      </View><Text style={s.date}>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></View>
      <Text numberOfLines={3} style={[s.text, note.completed && s.completed]}>{note.text}</Text>
      {note.type === 'reminder' && <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: meta.background }}><Text style={{ color: meta.color, fontWeight: '600' }}>{note.scheduledDate || note.scheduledTime ? [note.scheduledDate, note.scheduledTime].filter(Boolean).join(' · ') : 'No date or time set'}</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>Notifications not enabled</Text></View>}
      {note.type === 'shopping' && !!note.items?.length && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{note.items.length} items · {note.items.join(', ')}</Text>}
    </Pressable>
    {note.type !== 'note' && <Pressable accessibilityRole="checkbox" accessibilityLabel={`Complete ${note.text}`}
      accessibilityState={{ checked: note.completed }} aria-checked={note.completed} onPress={() => toggle(note.id)} style={s.check}>
      <Icon name={note.completed ? 'checkmark-circle' : 'ellipse-outline'} color={note.completed ? colors.primary : colors.muted} />
    </Pressable>}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  body: { padding: 18, flex: 1 }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  badge: { flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5 },
  date: { fontSize: 11, color: colors.muted }, text: { fontSize: 16, lineHeight: 24, color: colors.ink },
  completed: { textDecorationLine: 'line-through', color: colors.muted }, check: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
});
