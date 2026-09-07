import { Tabs } from 'expo-router';
import { Icon } from '../../components/ui';
import { colors } from '../../theme';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'My notebook', tabBarIcon: ({ color }) => <Icon name="book-outline" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon name="settings-outline" color={color} /> }} />
  </Tabs>;
}
