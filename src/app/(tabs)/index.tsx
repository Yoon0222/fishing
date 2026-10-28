import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Action, Card, Chip, Empty, Field, Loading, Note, Page, styles as s } from '../../components/ui';
import { canSell, money, remaining } from '../../domain/model';
import { futureDate } from '../../domain/seed';
import { useStore } from '../../store';
import { colors as c } from '../../theme';

export default function Explore() {
  const { state, ready, error, retry } = useStore();
  const [date, setDate] = useState(futureDate(1));
  const [species, setSpecies] = useState('전체');
  const [region, setRegion] = useState('전체');
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  if (error) return <Page><Note danger>{error}</Note><Action title="다시 불러오기" onPress={retry} /></Page>;
  if (!ready) return <Loading />;
  const trips = state.trips.filter(t => {
    const b = state.boats.find(b => b.id === t.boatId)!;
    const company = state.companies.find(co => co.id === b.companyId)!;
    return canSell(state, t) && t.date === date && (species === '전체' || species === t.species) && (region === '전체' || company.port.includes(region)) && `${b.name} ${company.name} ${company.port} ${t.species}`.includes(query.trim());
  }).sort((a, b) => a.time.localeCompare(b.time));
  return <Page>
    <View style={{ borderRadius: 24, overflow: 'hidden', minHeight: 255, backgroundColor: '#0B4554', justifyContent: 'center' }}>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1400&q=85' }} contentFit="cover" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }} />
      <View style={{ padding: 28, gap: 14 }}><Text style={{ color: '#A5E5DC', letterSpacing: 3, fontSize: 11, fontWeight: '700' }}>YOUR NEXT FISHING DAY</Text><Text style={{ fontSize: width < 400 ? 26 : 36, lineHeight: width < 400 ? 38 : 46, fontWeight: '800', color: 'white', letterSpacing: -1 }}>좋은 날, 좋은 배.{ '\n' }바다로 떠나볼까요?</Text><Text style={{ color: '#D1E4E6', fontSize: 14, lineHeight: 23 }}>낚시배부터 출항 시간까지,{ '\n' }나에게 맞는 바다를 예약하세요.</Text></View>
    </View>
    <Note>미리 체험하는 물때 · 업체와 일정은 예시이며, 실제 결제나 예약은 발생하지 않습니다.</Note>
    <View style={{ gap: 16 }}><View style={s.between}><Text style={s.title}>언제 떠나볼까요?</Text><Text style={s.muted}>{date.slice(0, 7).replace('-', '년 ')}월</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{Array.from({ length: 10 }, (_, i) => { const d = futureDate(i + 1); const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'Asia/Seoul' }).format(new Date(`${d}T12:00:00+09:00`)); return <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${d} ${weekday}`} accessibilityState={{ selected: date === d }} onPress={() => setDate(d)} style={{ width: 63, minHeight: 80, borderWidth: 1, borderColor: date === d ? c.teal : c.line, borderRadius: 16, backgroundColor: date === d ? c.teal : c.white, alignItems: 'center', justifyContent: 'center', gap: 7 }}><Text style={{ color: date === d ? '#C1E6E2' : c.muted, fontSize: 12 }}>{weekday}</Text><Text style={{ fontSize: 22, fontWeight: '700', color: date === d ? c.white : c.ink }}>{Number(d.slice(-2))}</Text></Pressable>; })}</ScrollView>
    </View>
    <Card><Field label="어떤 배를 찾으세요?" placeholder="업체명, 배 이름, 항구로 검색" value={query} onChangeText={setQuery} returnKeyType="search" /><Field label="출항 날짜 직접 선택 (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="예: 2026-11-01" /><View style={s.row}>{['전체', '인천', '태안', '여수'].map(r => <Chip key={r} label={r === '전체' ? '전 지역' : r} active={region === r} onPress={() => setRegion(r)} />)}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{['전체', ...new Set(state.trips.map(t => t.species))].map(f => <Chip key={f} label={f === '전체' ? '모든 어종' : f} active={species === f} onPress={() => setSpecies(f)} />)}</ScrollView></Card>
    <View style={s.between}><Text style={s.title}>예약 가능한 출항 <Text style={{ color: c.teal }}>{trips.length}</Text></Text><Text style={s.muted}>출항 시간순</Text></View>
    {trips.length === 0 ? <Card><Empty title="조건에 맞는 출항이 없어요" body="날짜를 바꾸거나 검색 조건을 넓혀보세요." /><Action secondary title="검색 조건 초기화" onPress={() => { setQuery(''); setRegion('전체'); setSpecies('전체'); }} /></Card> : <View style={{ flexDirection: width >= 760 ? 'row' : 'column', flexWrap: 'wrap', gap: 16 }}>{trips.map(t => {
      const b = state.boats.find(b => b.id === t.boatId)!;
      const co = state.companies.find(co => co.id === b.companyId)!;
      const seats = remaining(state, t);
      return <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`${co.name} ${b.name} ${t.time} ${t.species} 상세보기`} onPress={() => router.push(`/trip/${t.id}`)} style={({ pressed }) => ({ width: width >= 760 ? '48.8%' : '100%', opacity: pressed ? 0.75 : 1, borderRadius: 20, overflow: 'hidden', backgroundColor: c.white, borderWidth: 1, borderColor: c.line })}>
        <View style={{ height: 130, backgroundColor: t.species === '우럭' ? '#DCE8E9' : '#CFE1DF', overflow: 'hidden', justifyContent: 'flex-end' }}><View style={{ position: 'absolute', right: 28, top: 15 }}><Text style={{ fontSize: 80, color: '#709C9F' }}>⛵</Text></View><View style={{ position: 'absolute', bottom: -18, left: -40, width: '140%', height: 65, borderRadius: 80, backgroundColor: '#9DBDC0', transform: [{ rotate: '-5deg' }] }} /><View style={{ padding: 14, alignSelf: 'flex-start' }}><Text style={[s.badge, { backgroundColor: c.white }]}>{t.species} 낚시</Text></View></View>
        <View style={{ padding: 20, gap: 12 }}><Text style={s.muted}>{co.port} · {co.name}</Text><View style={s.between}><Text style={s.title}>{b.name}</Text><Text style={[s.badge, seats === 0 && { color: c.muted, backgroundColor: c.background }]}>{seats ? `잔여 ${seats}석` : '예약 마감'}</Text></View><Text style={s.muted}>{t.time} 출항 — {t.returnTime} 귀항</Text><View style={[s.between, { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 14 }]}><Text style={s.muted}>1인 기준</Text><Text style={s.price}>{money(t.price)} <Text style={{ fontSize: 18, color: c.teal }}>↗</Text></Text></View></View>
      </Pressable>;
    })}</View>}
    <Pressable accessibilityRole="link" onPress={() => router.push('/policy')}><Text style={[s.muted, { textAlign: 'center', textDecorationLine: 'underline' }]}>안심하고 예약하세요 · 공통 취소·환불 규정</Text></Pressable>
  </Page>;
}
