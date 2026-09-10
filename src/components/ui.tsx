import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { colors, typeMeta } from '../theme';
import { noteTypes, type NoteType } from '../types/note';

export function Icon({ name, size = 22, color = colors.ink }: {
  name: ComponentProps<typeof Ionicons>['name']; size?: number; color?: ColorValue;
}) { return <Ionicons name={name} size={size} color={color} />; }

export function Button({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
    <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>{label}</Text>
  </Pressable>;
}

export function TypePicker({ value, onChange }: { value: NoteType; onChange: (type: NoteType) => void }) {
  return <View><View style={styles.types}>{noteTypes.map(type => <Pressable key={type} accessibilityRole="button"
    accessibilityLabel={`Type: ${typeMeta[type].label}`} accessibilityState={{ selected: value === type }} aria-pressed={value === type}
    onPress={() => onChange(type)} style={[styles.chip, value === type && { backgroundColor: colors.soft, borderColor: colors.primary }]}>
    <Icon name={typeMeta[type].icon} size={16} color={value === type ? colors.primary : colors.muted} />
    <Text style={{ color: value === type ? colors.primary : colors.muted, fontSize: 13 }}>{typeMeta[type].label}</Text>
  </Pressable>)}</View><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 12 }}>{({ note: 'Information or a thought. No action required.', task: 'Something you need to do. Check it off when finished.', reminder: 'A task or event with a date or time. Notifications are not enabled yet.', shopping: 'Items to buy. Check off the list after shopping.' })[value]}</Text></View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 20, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.soft }, buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: colors.muted, marginBottom: 14 },
});
