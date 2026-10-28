import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../store';
import { colors } from '../theme';
export default function RootLayout() {
  return <StoreProvider><StatusBar style="dark" /><Stack screenOptions={{ headerTintColor: colors.ink, headerShadowVisible: false, headerStyle: { backgroundColor: colors.white }, contentStyle: { backgroundColor: colors.background }, headerBackTitle: '뒤로' }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="trip/[id]" options={{ title: '출항 상세' }} /><Stack.Screen name="checkout/[id]" options={{ title: '예약 및 결제' }} /><Stack.Screen name="policy" options={{ title: '공통 취소·환불 규정' }} /></Stack></StoreProvider>;
}
