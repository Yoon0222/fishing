import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, Chip, Empty, Note, styles as s } from './ui';
import { useStore } from '../store';
import { rankRegulars, simulateNextNotice, vacancyEligible, withLoyaltyDemo } from '../domain/loyalty';
import { remaining, type State } from '../domain/model';

export function VacancyPanel({ companyId }: { companyId: string }) {
  const { state, transact } = useStore();
  const [clock, setClock] = useState(() => Date.now());
  const [tripId, setTripId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const now = new Date(clock);
  const eligible = state.trips.filter(t => state.boats.some(b => b.id === t.boatId && b.companyId === companyId) && vacancyEligible(state, t, now)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const trip = eligible.find(t => t.id === tripId) ?? eligible[0];
  const candidates = trip ? rankRegulars(state, trip, now) : [];
  const notices = (state.loyalty?.notices ?? []).filter(n => n.tripId === trip?.id);
  async function run(fn: (s: State) => State) {
    if (busy) return;
    setBusy(true); setError('');
    try { await transact(fn); setClock(Date.now()); }
    catch (e) { setError(e instanceof Error ? e.message : '저장하지 못했습니다. 다시 시도해주세요.'); }
    finally { setBusy(false); }
  }
  return <>
    <Note>출항 24시간 전부터 잔여석이 있으면, 같은 배의 실제 탑승 완료 횟수 순으로 안내합니다. 동률은 최근 탑승 순입니다. 수신 동의 고객만 대상으로 하며, 이미 예약했거나 같은 출항을 안내받은 고객은 제외합니다.</Note>
    <Note>현재는 순서 확인용 시연입니다. 실제 푸시 발송·자동 실행·우선 좌석 확보는 하지 않습니다. 안내받은 고객도 결제 완료 순으로 예약이 확정됩니다.</Note>
    {!!error && <Note danger>{error}</Note>}
    {!state.loyalty && <Card><Text style={s.title}>단골 고객 예시로 체험하기</Text><Text style={s.muted}>8회·5회·2회 탑승 고객과 알림 미동의 고객의 가상 이력을 불러옵니다. 기존 예약은 유지합니다.</Text><Action title="단골 시연 데이터 불러오기" disabled={busy} onPress={() => run(st => withLoyaltyDemo(st))} /></Card>}
    {!eligible.length ? <Empty title="현재 안내할 출항이 없어요" body="판매 승인된 업체의 일정 중 출항 24시간 이내이고 빈자리가 있는 출항이 표시됩니다." /> : <>
      <Card><Text style={s.title}>빈자리 안내 출항 · {eligible.length}개</Text><View style={s.row}>{eligible.map(t => <Chip key={t.id} active={trip?.id === t.id} label={`${state.boats.find(b => b.id === t.boatId)?.name} ${t.date.slice(5)} ${t.time}`} onPress={() => { setTripId(t.id); setError(''); }} />)}</View></Card>
      {trip && <Card><Text style={s.title}>{state.boats.find(b => b.id === trip.boatId)?.name} · {trip.species}</Text><Text style={s.muted}>{trip.date} {trip.time} · 현재 잔여 {remaining(state, trip)}석</Text><Text style={s.label}>다음 안내 순서</Text>{candidates.map((candidate, i) => <View key={candidate.customer.id} style={s.between}><Text style={s.label}>{i + 1}. {candidate.customer.name}</Text><Text style={s.badge}>탑승 {candidate.rideCount}회</Text></View>)}{!candidates.length && <Text style={s.muted}>안내할 단골 고객이 없습니다.</Text>}<Action title={busy ? '시연 기록 중…' : '다음 단골 1명에게 시연 안내 기록'} disabled={busy || !candidates.length} onPress={() => run(st => simulateNextNotice(st, trip.id))} /><Text style={s.muted}>시연 버튼을 누를 때마다 다음 1명에게 진행합니다. 실제 발송 간격과 회차별 인원은 추후 정합니다.</Text></Card>}
      {notices.length > 0 && <Card><Text style={s.title}>시연 안내 이력 · {notices.length}건</Text>{notices.map(n => <View key={n.id} style={{ gap: 8 }}><Text style={s.badge}>시연 기록 · 실제 발송 없음</Text><Text selectable style={s.muted}>{n.message}</Text></View>)}</Card>}
    </>}
  </>;
}
