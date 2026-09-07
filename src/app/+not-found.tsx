import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../components/ui';
import { colors } from '../theme';

export default function NotFoundScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 20, backgroundColor: colors.background }}>
    <Text style={{ fontSize: 24, color: colors.ink }}>This page couldn’t be found.</Text>
    <Button label="Back to notebook" onPress={() => router.replace('/')} />
  </View>;
}
