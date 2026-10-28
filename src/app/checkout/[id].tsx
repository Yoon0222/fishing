import { Checkbox, Host } from '@expo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Action, Card, Chip, Empty, Field, Heading, Loading, Note, Page, styles as s } from '../../components/ui';
import { canSell, money, occupied, remaining, reserve } from '../../domain/model';
import { useStore } from '../../store';
import { colors as c } from '../../theme';
export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ready, transact } = useStore();
  const [mode, setMode] = useState<'seats' | 'charter'>('seats');
  const [people, setPeople] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const locked = useRef(false);
  if (!ready) return <Loading />;
  const t = state.trips.find(t => t.id === id);
  if (!t) return <Page><Empty title="출항을 찾을 수 없어요" body="다른 출항을 선택해주세요." /></Page>;
  const b = state.boats.find(b => b.id === t.boatId)!;
  const seats = remaining(state, t);
  const charter = t.charterAllowed && occupied(state, t.id).length === 0;
  const max = mode === 'charter' ? b.capacity : seats;
  const amount = mode === 'charter' ? t.charterPrice : t.price * people;
  async function pay() {
    if (locked.current) return;
    if (!agree) { setError('예약 내용과 공통 환불 규정에 동의해주세요.'); return; }
    locked.current = true; setBusy(true); setError('');
    try { await transact(s => reserve(s, { tripId: id, mode, people, name, phone })); setSuccess(true); }
    catch (e) { setError(e instanceof Error ? e.message : '기기에 저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해주세요.'); }
    finally { setBusy(false); locked.current = false; }
  }
  if (success) return <Page><View style={{ alignItems: 'center', paddingVertical: 30, gap: 18 }}><Text style={{ color: c.teal, fontSize: 56 }}>✓</Text><Heading title="바다로 떠날 준비 완료!" sub="시연 예약이 확정되었습니다." /></View><Card><Text style={s.title}>{b.name} · {t.species}</Text><Text selectable style={s.muted}>{t.date} {t.time} · {people}명 · {mode === 'charter' ? '독선' : '좌석 예약'}</Text><Text style={s.price}>{money(amount)}</Text></Card><Note>실제 금액은 청구되지 않았습니다. 내 예약에서 예약 내역과 취소 요청을 확인할 수 있습니다.</Note><Action title="내 예약 확인하기" onPress={() => router.replace('/bookings')} /><Action secondary title="다른 낚시 찾아보기" onPress={() => router.replace('/')} /></Page>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Page><Heading title="설레는 하루를 예약하세요" sub="01 일정 확인  →  02 예약자 정보  →  03 결제" />
    <Note>시연 결제입니다. 카드 번호를 입력하지 않으며 실제 결제가 발생하지 않습니다.</Note>
    <Card><Text style={s.title}>{b.name} · {t.species}</Text><Text selectable style={s.muted}>{t.date} · {t.time} 출항 / {t.returnTime} 귀항</Text><View style={s.row}><Chip label="인원별 예약" active={mode === 'seats'} onPress={() => { setMode('seats'); setPeople(1); }} /><Chip label="독선 예약" active={mode === 'charter'} disabled={!charter} onPress={() => { setMode('charter'); setPeople(1); }} /></View>{!charter && <Text style={s.muted}>이 일정은 독선 예약이 불가능합니다.</Text>}<View style={s.between}><View><Text style={s.label}>탑승 인원</Text><Text style={s.muted}>{mode === 'seats' ? `잔여 ${seats}석` : `정원 ${b.capacity}명`}</Text></View><View style={s.row}><Chip label="−" disabled={people <= 1 || busy} onPress={() => setPeople(n => n - 1)} /><Text accessibilityLabel={`탑승 인원 ${people}명`} style={s.title}>{people}명</Text><Chip label="＋" disabled={people >= max || busy} onPress={() => setPeople(n => n + 1)} /></View></View></Card>
    <Card><Text style={s.title}>예약자 정보</Text><Field label="예약자 이름" placeholder="이름을 입력해주세요" value={name} onChangeText={setName} editable={!busy} autoComplete="name" /><Field label="휴대폰 번호" placeholder="010-1234-5678" value={phone} onChangeText={setPhone} editable={!busy} keyboardType="phone-pad" autoComplete="tel" /><Text style={s.muted}>시연에는 실제 개인정보 대신 테스트 이름과 번호를 사용해주세요.</Text></Card>
    <Card><Text style={s.title}>결제 금액</Text><View style={s.between}><Text style={s.muted}>{mode === 'charter' ? '배 전체 예약' : `${money(t.price)} × ${people}명`}</Text><Text style={s.price}>{money(amount)}</Text></View><Text style={s.muted}>전액 결제 · 결제 성공 시 즉시 예약 확정</Text><Action secondary title="공통 취소·환불 규정 보기" onPress={() => router.push('/policy')} /><Host matchContents seedColor={c.teal}><Checkbox value={agree} onValueChange={setAgree} label="예약 내용과 공통 환불 규정에 동의합니다" disabled={busy} /></Host></Card>
    {error !== '' && <Note danger>{error}</Note>}<Action title={busy ? '시연 예약 처리 중…' : `${money(amount)} 시연 결제하고 확정`} disabled={busy || !canSell(state, t) || people > max || max < 1 || (mode === 'charter' && !charter)} onPress={pay} />
  </Page></KeyboardAvoidingView>;
}
