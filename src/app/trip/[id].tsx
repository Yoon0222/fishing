import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, Card, Empty, Heading, Loading, Note, Page, styles as s } from '../../components/ui';
import { canSell, money, occupied, remaining } from '../../domain/model';
import { useStore } from '../../store';
import { colors as c } from '../../theme';
export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ready } = useStore();
  if (!ready) return <Loading />;
  const t = state.trips.find(t => t.id === id);
  if (!t) return <Page><Empty title="일정을 찾을 수 없어요" body="낚시 찾기에서 다른 출항을 선택해주세요." /></Page>;
  const b = state.boats.find(b => b.id === t.boatId)!;
  const co = state.companies.find(co => co.id === b.companyId)!;
  const seats = remaining(state, t);
  return <Page><View style={{ backgroundColor: c.teal, borderRadius: 24, padding: 26, gap: 16 }}><Text style={{ color: '#BDE5DD', fontSize: 14 }}>{co.port} · {co.name}</Text><Text style={{ fontSize: 32, color: 'white', fontWeight: '800' }}>{b.name}</Text><Text style={{ color: 'white', fontSize: 17 }}>{t.species}와 함께하는 바다의 하루</Text></View>
    <Heading title="이번 출항 안내" sub={`${t.date} · ${t.time} 출항`} />
    <Card>{[['낚시 종류', t.species], ['출항 / 귀항', `${t.time} / ${t.returnTime}`], ['탑승 정원', `${b.capacity}명`], ['남은 좌석', `${seats}석`], ['1인 요금', money(t.price)]].map(([label, value]) => <View key={label} style={s.between}><Text style={s.muted}>{label}</Text><Text selectable style={s.label}>{value}</Text></View>)}</Card>
    <Card><Text style={s.title}>배 소개</Text><Text style={s.muted}>{b.description}</Text><Note>출항 30분 전까지 집결해주세요. 신분증은 필수이며, 승선 위치와 준비물은 실제 예약 시 업체 안내를 확인해야 합니다.</Note></Card>
    <Card><Text style={s.title}>우리끼리 떠나는 독선</Text><Text style={s.muted}>배 한 척을 단독으로 예약합니다. 정원 내에서 탑승 인원을 정할 수 있어요.</Text><Text style={s.price}>{money(t.charterPrice)}</Text><Text style={s.muted}>{t.charterAllowed && occupied(state, t.id).length === 0 ? '현재 독선 예약 가능' : '현재 독선 예약 불가 · 기존 예약 또는 운영 설정'}</Text></Card>
    <Note>기상 악화·자연재해로 업체가 출항을 취소하면 전액 환불합니다.</Note><Action secondary title="공통 취소·환불 규정 보기" onPress={() => router.push('/policy')} />
    <Action title={canSell(state, t) && seats > 0 ? '날짜·인원 확인하고 예약하기' : '예약할 수 없는 출항입니다'} disabled={!canSell(state, t) || seats <= 0} onPress={() => router.push(`/checkout/${t.id}`)} />
  </Page>;
}
