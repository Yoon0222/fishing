import { Text } from 'react-native';
import { Card, Heading, Note, Page, styles as s } from '../components/ui';
import { POLICY_TEXT, POLICY_VERSION } from '../domain/model';
export default function Policy() { return <Page><Heading title="모든 업체에 같은 기준" sub="플랫폼 공통 취소·환불 규정" /><Card><Text style={s.title}>업체의 출항 취소</Text><Text style={s.muted}>기상 악화 또는 자연재해로 업체가 출항을 취소하면 결제 금액 전액을 환불합니다.</Text></Card><Card><Text style={s.title}>이용자의 취소 요청</Text><Text style={s.muted}>출항 전 취소 시점별 환불률은 운영 정책 확정 후 안내합니다. 현재 시연 버전은 취소 요청을 접수하며 자동으로 환불 금액을 정하지 않습니다. 취소 요청 중에도 좌석은 유지됩니다.</Text></Card><Note>{POLICY_TEXT}</Note><Text selectable style={s.muted}>규정 버전: {POLICY_VERSION} (초안){'\n'}실제 판매 전 이용자 취소 규정 확정과 결제 서비스 연결이 필요합니다.</Text></Page>; }
