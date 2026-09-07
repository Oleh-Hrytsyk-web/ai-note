import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { useNotesStore } from '../store/notes';
import { colors } from '../theme';

export default function RootLayout() {
  const { hydrated, hydrate, storageError } = useNotesStore();
  useEffect(() => { void hydrate(); }, [hydrate]);
  return <SafeAreaProvider><StatusBar style="dark" />
    {!hydrated ? <SafeAreaView style={s.loading}>
      <Text style={s.brand}>AI Note</Text>
      {storageError ? <><Text style={s.error}>{storageError}</Text><Button label="Retry loading" onPress={() => { void hydrate(); }} /></> : <ActivityIndicator color={colors.primary} />}
    </SafeAreaView> : <View style={{ flex: 1 }}>
      {storageError && <SafeAreaView edges={['top']} style={s.banner}><Text accessibilityRole="alert" style={s.error}>{storageError}</Text></SafeAreaView>}
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink,
        headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note/new" options={{ title: 'New thought' }} />
        <Stack.Screen name="note/[id]" options={{ title: 'Your thought' }} />
      </Stack>
    </View>}
  </SafeAreaProvider>;
}
const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 24 },
  brand: { fontSize: 28, fontWeight: '700', color: colors.primary }, error: { color: colors.danger, textAlign: 'center', padding: 12 }, banner: { backgroundColor: '#FFF0ED' },
});
