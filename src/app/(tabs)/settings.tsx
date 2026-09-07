import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, SectionLabel } from '../../components/ui';
import { useNotesStore } from '../../store/notes';
import { colors } from '../../theme';

export default function SettingsScreen() {
  const count = useNotesStore(s => s.notes.length);
  return <SafeAreaView edges={['top']} style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>Settings</Text><Text style={s.subtitle}>A quieter place for your thoughts.</Text>
    <View style={s.hero}><Icon name="book-outline" size={32} color={colors.primary} /><Text style={s.brand}>AI Note</Text><Text style={s.description}>Your personal notebook, with room to grow.</Text><Text style={s.version}>VERSION 1.0.0 · LOCAL MVP</Text></View>
    <SectionLabel>YOUR NOTEBOOK</SectionLabel>
    <View style={s.card}><View style={s.row}><Icon name="documents-outline" color={colors.primary} /><Text style={s.rowLabel}>Saved thoughts</Text><Text style={s.value}>{count}</Text></View>
      <View style={s.divider} /><View style={s.row}><Icon name="phone-portrait-outline" color={colors.primary} /><Text style={s.rowLabel}>Storage</Text><Text style={s.value}>This device</Text></View></View>
    <Text style={s.caption}>Notes are saved locally. Clearing app data or uninstalling the app can remove them. On web, each browser keeps its own notebook.</Text>
    <SectionLabel>COMING LATER</SectionLabel>
    <View style={s.card}>{[
      ['mic-outline', 'Voice capture', 'Speak your thoughts naturally.'],
      ['sparkles-outline', 'AI organization', 'Let your notebook find the right type.'],
      ['notifications-outline', 'Scheduled reminders', 'A nudge at just the right time.'],
      ['cloud-outline', 'Cloud sync', 'Your thoughts, across your devices.'],
    ].map(([icon, title, description]) => <View key={title} style={s.future}><Icon name={icon as 'mic-outline'} color={colors.muted} /><View style={{ flex: 1 }}><Text style={s.futureTitle}>{title}</Text><Text style={s.futureDescription}>{description}</Text></View></View>)}</View>
    <Text style={s.footer}>A little less on your mind.</Text>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 24, width: '100%', maxWidth: 720, alignSelf: 'center' }, title: { color: colors.ink, fontSize: 32, fontWeight: '600', letterSpacing: -1 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 8 },
  hero: { alignItems: 'center', paddingVertical: 34, marginVertical: 24, backgroundColor: colors.soft, borderRadius: 24 }, brand: { color: colors.primary, fontSize: 24, fontWeight: '700', marginTop: 12 }, description: { color: colors.muted, fontSize: 12, marginTop: 8 }, version: { fontSize: 9, letterSpacing: 1.5, color: colors.primary, marginTop: 22 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 38 }, rowLabel: { flex: 1, color: colors.ink, fontSize: 14 }, value: { color: colors.muted, fontSize: 13 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 12, marginBottom: 30 }, future: { flexDirection: 'row', gap: 14, paddingVertical: 12, alignItems: 'center' }, futureTitle: { fontSize: 14, color: colors.ink }, futureDescription: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 3 }, footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginVertical: 30 },
});
