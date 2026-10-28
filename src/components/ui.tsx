import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Button, Host } from '@expo/ui';
import { colors as c } from '../theme';

export function Action({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Host matchContents seedColor={c.teal} colorScheme="light" style={{ minHeight: 48, width: '100%' }}><Button label={title} onPress={onPress} disabled={disabled} variant={secondary ? 'outlined' : 'filled'} style={{ paddingVertical: 14, width: '100%' }} /></Host>;
}
export function Chip({ label, active, onPress, disabled }: { label: string; active?: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.chip, active && styles.selected, disabled && { opacity: 0.4 }]}><Text style={{ color: active ? c.white : c.ink, fontWeight: '600' }}>{label}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#8A9A9C" {...props} style={[styles.input, props.style]} /></View>;
}
export function Note({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return <View style={[styles.note, danger && { backgroundColor: '#FFF0EC' }]}><Text selectable accessibilityRole={danger ? 'alert' : undefined} style={{ color: danger ? c.danger : c.teal, fontSize: 13, lineHeight: 21 }}>{children}</Text></View>;
}
export function Page({ children }: { children: React.ReactNode }) {
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}><View style={styles.container}>{children}</View></ScrollView>;
}
export function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
export function Heading({ title, sub }: { title: string; sub?: string }) { return <View style={{ gap: 8 }}><Text style={styles.heading}>{title}</Text>{!!sub && <Text style={styles.muted}>{sub}</Text>}</View>; }
export function Empty({ title, body }: { title: string; body: string }) { return <View style={styles.empty}><Text style={{ fontSize: 34, color: c.teal }}>⌁</Text><Text style={styles.title}>{title}</Text><Text style={[styles.muted, { textAlign: 'center' }]}>{body}</Text></View>; }
export function Loading() { return <View style={styles.empty}><ActivityIndicator color={c.teal} /><Text style={styles.muted}>예약 정보를 불러오고 있어요</Text></View>; }
export const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, flexGrow: 1, backgroundColor: c.background },
  container: { width: '100%', maxWidth: 1000, alignSelf: 'center', gap: 24 },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 20, gap: 16 },
  heading: { fontSize: 26, lineHeight: 36, fontWeight: '800', color: c.ink, letterSpacing: -1 },
  title: { fontSize: 18, fontWeight: '700', color: c.ink },
  muted: { fontSize: 14, lineHeight: 22, color: c.muted },
  label: { fontSize: 14, fontWeight: '600', color: c.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  chip: { borderWidth: 1, borderColor: c.line, backgroundColor: c.white, paddingHorizontal: 17, minHeight: 44, justifyContent: 'center', borderRadius: 25 },
  selected: { backgroundColor: c.teal, borderColor: c.teal },
  input: { borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: c.white, fontSize: 16, color: c.ink, minHeight: 48 },
  note: { backgroundColor: c.pale, padding: 14, borderRadius: 12 },
  empty: { padding: 36, alignItems: 'center', justifyContent: 'center', gap: 12 },
  badge: { color: c.teal, backgroundColor: c.pale, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, fontSize: 12, fontWeight: '700' },
  price: { color: c.ink, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
