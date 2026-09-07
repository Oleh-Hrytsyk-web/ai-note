import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { noteParser, type ParsedNote } from '../services/noteParser';
import { colors } from '../theme';
import { Button, SectionLabel, TypePicker } from './ui';

export function CapturePreview({ text, onCancel, onSave }: {
  text: string; onCancel: () => void; onSave: (parsed: ParsedNote) => void;
}) {
  const [parsed, setParsed] = useState<ParsedNote>();
  const [error, setError] = useState('');
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    noteParser.parse(text).then(value => { if (active) setParsed(value); })
      .catch(() => { if (active) setError('Could not review this thought. Cancel and try again.'); });
    return () => { active = false; };
  }, [text]);
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
    <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
      <SectionLabel>A QUICK CHECK</SectionLabel><Text style={s.title}>Did I get that right?</Text>
      <Text style={s.hint}>Local text detection. You have the final say.</Text>
      {!parsed && !error && <ActivityIndicator accessibilityLabel="Reviewing thought" color={colors.primary} />}
      {!!error && <Text accessibilityRole="alert" style={s.warning}>{error}</Text>}
      {parsed && <>
        <Text style={parsed.confidence < 0.65 ? s.warning : s.hint}>
          {parsed.confidence < 0.65 ? 'Low confidence — please check the type and details.' : 'Suggested type — change it if you like.'}
        </Text><TypePicker value={parsed.type} onChange={type => setParsed({ ...parsed, type })} />
        <View style={s.card}><SectionLabel>YOUR THOUGHT</SectionLabel><Text style={s.text}>{parsed.text}</Text></View>
        {(parsed.date || parsed.time) && <View style={s.card}><SectionLabel>WHEN</SectionLabel>
          <Text style={s.text}>{parsed.date ?? 'No date detected'}{parsed.time ? ` · ${parsed.time}` : ' · No time detected'}</Text>
          <Text style={s.hint}>Local date and time only. No notification will be scheduled.</Text></View>}
        {!!parsed.items?.length && <View style={s.card}><SectionLabel>SHOPPING ITEMS</SectionLabel>{parsed.items.map((item, i) => <Text key={i} style={s.text}>• {item}</Text>)}</View>}
        <Button label="Save thought" onPress={() => { if (!saving.current) { saving.current = true; onSave(parsed); } }} />
      </>}
      <View style={{ marginTop: 12 }}><Button label="Cancel" secondary onPress={onCancel} /></View>
    </ScrollView></SafeAreaView>
  </Modal>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 24, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '600', letterSpacing: -1 }, hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginVertical: 12 },
  warning: { color: '#8C601F', backgroundColor: '#FAF0DA', padding: 14, borderRadius: 12, marginVertical: 14, lineHeight: 21 },
  card: { padding: 18, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginVertical: 12 }, text: { color: colors.ink, fontSize: 16, lineHeight: 25 },
});
