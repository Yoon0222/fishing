import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors as c } from '../../theme';
export default function TabLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: c.teal, tabBarInactiveTintColor: c.muted, tabBarStyle: { borderTopColor: c.line, backgroundColor: c.white }, tabBarLabelStyle: { fontWeight: '600', fontSize: 11 }, headerTintColor: c.ink, headerShadowVisible: false, headerStyle: { backgroundColor: c.white } }}>
    <Tabs.Screen name="index" options={{ title: '물때', tabBarLabel: '낚시 찾기', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>⌁</Text> }} />
    <Tabs.Screen name="bookings" options={{ title: '내 예약', tabBarLabel: '내 예약', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>▤</Text> }} />
    <Tabs.Screen name="manage" options={{ title: '운영 관리 · 시연', tabBarLabel: '운영 관리', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙</Text> }} />
  </Tabs>;
}
