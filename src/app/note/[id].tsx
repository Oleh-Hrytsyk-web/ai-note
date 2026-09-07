import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { NoteEditor } from '../../components/NoteEditor';
import { Button } from '../../components/ui';
import { useNotesStore } from '../../store/notes';
import { colors } from '../../theme';

export default function NoteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNotesStore(s => s.notes.find(n => n.id === id));
  if (!note) return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 20 }}>
    <Text style={{ fontSize: 22, color: colors.ink }}>This thought isn’t here.</Text>
    <Text style={{ color: colors.muted }}>It may belong to another device or browser.</Text>
    <Button label="Go to notebook" onPress={() => router.replace('/')} />
  </View>;
  return <NoteEditor key={note.id} note={note} />;
}
