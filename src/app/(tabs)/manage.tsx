import { Host, Switch } from '@expo/ui';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Action, Card, Chip, Empty, Field, Heading, Loading, Note, Page, styles as s } from '../../components/ui';
import { addBoat, addCompany, addTrip, cancelWeather, money, remaining, type State } from '../../domain/model';
import { futureDate } from '../../domain/seed';
import { useStore } from '../../store';
import { colors as c } from '../../theme';
import { VacancyPanel } from '../../components/vacancy-panel';
export default function Manage() {
  const { state, ready, transact } = useStore();
  const [tab, setTab] = useState('출항 관리');
  const [companyId, setCompanyId] = useState('jeil');
  const [companyName, setCompanyName] = useState('');
  const [port, setPort] = useState('');
  const [boatName, setBoatName] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [boatId, setBoatId] = useState('jeil-1');
  const [date, setDate] = useState(futureDate(1));
  const [time, setTime] = useState('06:00');
  const [returnTime, setReturnTime] = useState('12:00');
  const [species, setSpecies] = useState('쭈꾸미');
  const [price, setPrice] = useState('80000');
  const [charterPrice, setCharterPrice] = useState('1500000');
  const [charterAllowed, setCharterAllowed] = useState(true);
  const [confirmTrip, setConfirmTrip] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!ready) return <Loading />;
  async function save(fn: (s: State) => State, text: string, done?: () => void) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await transact(fn); setMessage(text); done?.(); }
    catch (e) { setError(e instanceof Error ? e.message : '저장하지 못했습니다. 다시 시도해주세요.'); }
    finally { setBusy(false); }
  }
  const company = state.companies.find(co => co.id === companyId)!;
  const boats = state.boats.filter(b => b.companyId === companyId);
  const trips = state.trips.filter(t => boats.some(b => b.id === t.boatId)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const bookings = state.bookings.filter(b => trips.some(t => t.id === b.tripId));
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Page><Heading title="바다를 준비하는 공간" sub="업체 등록부터 출항 일정과 예약까지" /><Note>운영자 화면 시연입니다. 현재 로그인·권한 분리가 없으며 이 기기의 예시 데이터만 변경됩니다. 실제 운영 전 운영자와 업체 계정을 분리합니다.</Note>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{['출항 관리', '업체·배 관리', '예약 현황', '단골 빈자리 알림'].map(label => <Chip key={label} active={tab === label} label={label} onPress={() => { setTab(label); setMessage(''); setError(''); }} />)}</ScrollView>
    <Card><Text style={s.label}>관리할 업체</Text><View style={s.row}>{state.companies.map(co => <Chip key={co.id} label={co.name} active={companyId === co.id} onPress={() => { setCompanyId(co.id); setBoatId(state.boats.find(b => b.companyId === co.id)?.id ?? ''); setConfirmTrip(''); }} />)}</View><Text style={s.muted}>{company.port} · {company.approved ? '판매 승인 완료' : '승인 대기 · 고객에게 노출되지 않음'}</Text></Card>
    {!!error && <Note danger>{error}</Note>}{!!message && <Note>{message}</Note>}
    {tab === '단골 빈자리 알림' && <VacancyPanel key={companyId} companyId={companyId} />}
    {tab === '업체·배 관리' && <>
      <Card><Text style={s.title}>업체 판매 승인</Text><Text style={s.muted}>운영자가 직접 등록하고 승인한 업체만 출항을 판매할 수 있습니다.</Text><Action secondary disabled={busy} title={company.approved ? '판매 승인 해제' : '이 업체의 판매 승인'} onPress={() => save(st => ({ ...st, companies: st.companies.map(co => co.id === companyId ? { ...co, approved: !co.approved } : co) }), '업체 승인 상태를 변경했습니다. 기존 예약 내역은 유지됩니다.')} /></Card>
      <Card><Text style={s.title}>새 업체 등록</Text><Field label="업체명" value={companyName} onChangeText={setCompanyName} placeholder="예: 바다낚시 회사" /><Field label="지역 · 출항 항구" value={port} onChangeText={setPort} placeholder="예: 인천 · 남항" /><Action disabled={busy} title="업체 등록 · 승인 대기로 저장" onPress={() => save(st => addCompany(st, companyName, port), '업체를 등록했습니다. 위에서 업체를 선택한 뒤 판매 승인해주세요.', () => { setCompanyName(''); setPort(''); })} /></Card>
      <Card><Text style={s.title}>{company.name}의 배</Text>{boats.map(b => <View key={b.id} style={s.between}><Text style={s.label}>{b.name}</Text><Text style={s.muted}>정원 {b.capacity}명</Text></View>)}<Field label="새 배 이름" value={boatName} onChangeText={setBoatName} placeholder="예: 제일 3호" /><Field label="탑승 정원" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" /><Action disabled={busy} title="이 업체에 배 등록" onPress={() => save(st => addBoat(st, companyId, boatName, Number(capacity)), '배를 등록했습니다. 출항 관리에서 일정을 추가할 수 있습니다.', () => setBoatName(''))} /></Card>
    </>}
    {tab === '출항 관리' && <>
      <Card><Text style={s.title}>새 출항 일정</Text><View style={s.row}>{boats.map(b => <Chip key={b.id} label={b.name} active={boatId === b.id} onPress={() => setBoatId(b.id)} />)}</View>{!boats.length && <Text style={s.muted}>업체·배 관리에서 배를 먼저 등록해주세요.</Text>}<Field label="출항 날짜 (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-25" /><View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Field label="출항 (HH:MM)" value={time} onChangeText={setTime} /></View><View style={{ flex: 1 }}><Field label="귀항 (HH:MM)" value={returnTime} onChangeText={setReturnTime} /></View></View><Field label="낚시 종류" value={species} onChangeText={setSpecies} /><Field label="1인 요금 (원)" value={price} onChangeText={setPrice} keyboardType="number-pad" /><Host matchContents seedColor={c.teal}><Switch label="독선 예약 허용" value={charterAllowed} onValueChange={setCharterAllowed} /></Host>{charterAllowed && <Field label="독선 요금 (원)" value={charterPrice} onChangeText={setCharterPrice} keyboardType="number-pad" />}<Action disabled={busy || !boatId} title="출항 일정 등록" onPress={() => save(st => addTrip(st, { boatId, date, time, returnTime, species, price: Number(price), charterPrice: charterAllowed ? Number(charterPrice) : 0, charterAllowed }), '출항 일정을 등록했습니다. 승인된 업체의 일정만 고객에게 표시됩니다.')} /></Card>
      <Text style={s.title}>등록된 출항 · {trips.length}개</Text>{trips.map(t => <Card key={t.id}><View style={s.between}><Text style={s.label}>{state.boats.find(b => b.id === t.boatId)?.name} · {t.species}</Text><Text style={s.badge}>{t.status === 'open' ? `잔여 ${remaining(state, t)}석` : '출항 취소'}</Text></View><Text selectable style={s.muted}>{t.date} · {t.time}—{t.returnTime}{'\n'}1인 {money(t.price)}</Text>{t.status === 'open' && (confirmTrip === t.id ? <View style={{ gap: 12 }}><Note danger>기상 악화·자연재해로 출항을 취소하면 이 출항의 모든 예약이 전액 환불 처리됩니다. 시연 데이터에 적용할까요?</Note><Action title="출항 취소 및 전액 환불 · 시연" disabled={busy} onPress={() => save(st => cancelWeather(st, t.id), '출항을 취소하고 연결된 예약을 전액 환불 처리했습니다. 실제 금전 이동은 없습니다.', () => setConfirmTrip(''))} /><Action secondary title="돌아가기" disabled={busy} onPress={() => setConfirmTrip('')} /></View> : <Action secondary title="기상 악화·자연재해로 출항 취소" disabled={busy} onPress={() => setConfirmTrip(t.id)} />)}</Card>)}
    </>}
    {tab === '예약 현황' && <><View style={s.row}><Text style={s.badge}>전체 {bookings.length}건</Text><Text style={s.badge}>취소 요청 {bookings.filter(b => b.status === 'cancel-requested').length}건</Text></View>{!bookings.length && <Empty title="아직 접수된 예약이 없어요" body="낚시 찾기에서 시연 예약을 만들면 이곳에 표시됩니다." />}{bookings.map(b => { const t = state.trips.find(t => t.id === b.tripId)!; return <Card key={b.id}><View style={s.between}><Text style={s.title}>{b.name} · {b.people}명</Text><Text style={s.badge}>{b.status === 'confirmed' ? '확정' : b.status === 'refunded' ? '환불' : '취소 요청'}</Text></View><Text selectable style={s.muted}>{b.id}{'\n'}{b.phone}{'\n'}{t.date} {t.time} · {state.boats.find(boat => boat.id === t.boatId)?.name} · {b.mode === 'charter' ? '독선' : '좌석'}</Text><Text style={s.price}>{money(b.amount)}</Text>{b.status === 'cancel-requested' && <Note>이용자 취소 규정 확정 전이므로 자동 환불되지 않습니다.</Note>}</Card>; })}</>}
  </Page></KeyboardAvoidingView>;
}
