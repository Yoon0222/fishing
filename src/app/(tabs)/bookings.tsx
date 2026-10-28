import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, Empty, Heading, Loading, Note, Page, styles as s } from '../../components/ui';
import { money, requestCancellation } from '../../domain/model';
import { useStore } from '../../store';
export default function Bookings() {
  const { state, ready, transact } = useStore();
  const [confirmId, setConfirmId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!ready) return <Loading />;
  async function cancel(id: string) {
    setBusy(true); setError('');
    try { await transact(s => requestCancellation(s, id)); setConfirmId(''); }
    catch (e) { setError(e instanceof Error ? e.message : '저장하지 못했습니다. 다시 시도해주세요.'); }
    finally { setBusy(false); }
  }
  return <Page><Heading title="나의 다음 바다" sub="이 기기에 저장된 시연 예약을 확인하세요." />{!!error && <Note danger>{error}</Note>}
    {state.bookings.length === 0 ? <Card><Empty title="아직 예약한 출항이 없어요" body="마음에 드는 배를 고르고 첫 바다를 만나보세요." /><Action title="낚시 찾아보기" onPress={() => router.push('/')} /></Card> : state.bookings.map(b => {
      const t = state.trips.find(t => t.id === b.tripId)!;
      const boat = state.boats.find(boat => boat.id === t.boatId)!;
      return <Card key={b.id}><View style={s.between}><Text style={s.badge}>{b.status === 'confirmed' ? '예약 확정' : b.status === 'cancel-requested' ? '취소 요청 접수' : '전액 환불 · 시연'}</Text><Text style={s.muted}>{b.mode === 'charter' ? '독선' : '좌석 예약'}</Text></View><Text style={s.title}>{boat.name} · {t.species}</Text><Text selectable style={s.muted}>{t.date} · {t.time} 출항 / {t.returnTime} 귀항{'\n'}{b.name} · {b.people}명</Text><Text selectable style={s.muted}>예약번호 {b.id}</Text><View style={s.between}><Text style={s.muted}>결제 금액 (시연)</Text><Text style={s.price}>{money(b.amount)}</Text></View>{b.status === 'refunded' && <Note>{b.refundReason}{'\n'}환불 금액: {money(b.refundAmount)} · 실제 결제 취소는 발생하지 않습니다.</Note>}{b.status === 'cancel-requested' && <Note>취소 요청이 접수되었습니다. 공통 환불 기준 확정 전이므로 좌석과 결제 상태를 유지합니다.</Note>}
        <Action secondary title="출항 상세 보기" onPress={() => router.push(`/trip/${t.id}`)} />
        {b.status === 'confirmed' && (confirmId === b.id ? <View style={{ gap: 12 }}><Note>취소 요청을 접수할까요? 현재는 환불 규정 초안으로 자동 환불되지 않습니다.</Note><Action title={busy ? '접수 중…' : '취소 요청 접수하기'} disabled={busy} onPress={() => cancel(b.id)} /><Action secondary title="예약 유지하기" disabled={busy} onPress={() => setConfirmId('')} /></View> : <Action secondary title="예약 취소 요청" onPress={() => setConfirmId(b.id)} />)}<Text style={[s.muted, { fontSize: 11 }]}>예약 당시 규정: {b.policyVersion}</Text></Card>;
    })}
  </Page>;
}
