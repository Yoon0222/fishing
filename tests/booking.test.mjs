import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/domain/model.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports, Date, Math, Error, Number });
const { reserve, remaining, canSell, cancelWeather, requestCancellation, addCompany, addBoat, addTrip } = exports;
const now = new Date('2026-10-20T00:00:00Z');
function fixture() { return { version: 1, companies: [{ id: 'c', name: '업체', port: '인천', approved: true }], boats: [{ id: 'b', companyId: 'c', name: '배', capacity: 4, description: '' }], trips: [{ id: 't', boatId: 'b', date: '2026-10-25', time: '05:30', returnTime: '12:00', species: '쭈꾸미', price: 80000, charterPrice: 300000, charterAllowed: true, status: 'open' }], bookings: [] }; }
const input = { tripId: 't', people: 2, mode: 'seats', name: '테스트', phone: '010-0000-0000' };
test('인원별 전액 결제 확정과 잔여석 차감', () => {
  const s = reserve(fixture(), input, now);
  assert.equal(s.bookings[0].amount, 160000);
  assert.equal(s.bookings[0].status, 'confirmed');
  assert.equal(s.bookings[0].policyVersion, 'draft-1');
  assert.equal(remaining(s, s.trips[0]), 2);
});
test('잔여석 초과 및 마지막 좌석 재예약 차단', () => {
  let s = reserve(fixture(), input, now);
  assert.throws(() => reserve(s, { ...input, people: 3 }, now), /좌석/);
  s = reserve(s, input, now);
  assert.equal(remaining(s, s.trips[0]), 0);
  assert.throws(() => reserve(s, { ...input, people: 1 }, now));
});
test('독선은 전체 좌석 잠금 및 정액 적용', () => {
  const s = reserve(fixture(), { ...input, mode: 'charter' }, now);
  assert.equal(s.bookings[0].amount, 300000);
  assert.equal(remaining(s, s.trips[0]), 0);
  assert.throws(() => reserve(s, input, now));
  assert.throws(() => reserve(s, { ...input, mode: 'charter' }, now));
});
test('일반 예약이 있는 배 독선 차단', () => {
  const s = reserve(fixture(), input, now);
  assert.throws(() => reserve(s, { ...input, mode: 'charter' }, now));
});
test('미승인·취소·출항 지난 일정 판매 차단', () => {
  const s = fixture(); s.companies[0].approved = false;
  assert.equal(canSell(s, s.trips[0], now), false);
  assert.throws(() => reserve(s, input, now));
  s.companies[0].approved = true; s.trips[0].status = 'weather-cancelled';
  assert.throws(() => reserve(s, input, now));
  s.trips[0].status = 'open';
  assert.throws(() => reserve(s, input, new Date('2026-11-01')));
});
test('잘못된 인원과 연락처 차단', () => {
  for (const people of [0, -1, 1.5, 5, NaN]) assert.throws(() => reserve(fixture(), { ...input, people }, now));
  assert.throws(() => reserve(fixture(), { ...input, phone: '123' }, now));
  assert.throws(() => reserve(fixture(), { ...input, name: '  ' }, now));
});
test('취소 요청 시 좌석 유지, 기상 취소 시 전액 환불', () => {
  let s = reserve(fixture(), input, now);
  s = requestCancellation(s, s.bookings[0].id);
  assert.equal(remaining(s, s.trips[0]), 2);
  s = cancelWeather(s, 't');
  assert.equal(s.bookings[0].status, 'refunded');
  assert.equal(s.bookings[0].refundAmount, 160000);
  assert.equal(s.trips[0].status, 'weather-cancelled');
  assert.throws(() => reserve(s, input, now));
  const again = cancelWeather(s, 't');
  assert.equal(again.bookings[0].refundAmount, 160000);
});
test('업체는 승인 대기로 등록, 소속 배 정원 검증', () => {
  let s = addCompany(fixture(), '새 업체', '태안');
  assert.equal(s.companies[1].approved, false);
  assert.throws(() => addCompany(s, '', '태안'));
  s = addBoat(s, s.companies[1].id, '새 배', 20);
  assert.equal(s.boats[1].capacity, 20);
  assert.throws(() => addBoat(s, 'missing', '배', 20));
});
test('새 출항의 한국 시각·날짜·겹침 검증', () => {
  const s = fixture();
  const trip = { ...s.trips[0], date: '2026-10-26' };
  assert.equal(addTrip(s, trip, now).trips.length, 2);
  assert.throws(() => addTrip(s, { ...trip, date: '2026-02-30' }, now));
  assert.throws(() => addTrip(s, { ...trip, time: '25:00' }, now));
  assert.throws(() => addTrip(s, { ...trip, returnTime: '04:00' }, now));
  assert.throws(() => addTrip(s, { ...trip, price: -1 }, now));
  assert.throws(() => addTrip(s, { ...trip, date: '2026-10-25', time: '10:00', returnTime: '14:00' }, now), /겹칩니다/);
});

const loyaltySource = fs.readFileSync(new URL('../src/domain/loyalty.ts', import.meta.url), 'utf8');
const loyaltyCompiled = ts.transpileModule(loyaltySource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loyalty = {};
vm.runInNewContext(loyaltyCompiled, { exports: loyalty, Date, Math, Error, Number, Set, require: () => exports });
const { vacancyEligible, rankRegulars, simulateNextNotice, withLoyaltyDemo } = loyalty;
const noticeNow = new Date('2026-10-24T20:30:00Z'); // 10/25 05:30 KST, departure time.
function audience() { return withLoyaltyDemo(fixture(), now); }

test('빈자리 알림은 출항 24시간 이내에만 활성화', () => {
  const s = audience();
  const at24 = new Date('2026-10-23T20:30:00Z');
  assert.equal(vacancyEligible(s, s.trips[0], at24), true);
  assert.equal(vacancyEligible(s, s.trips[0], new Date(+at24 - 1)), false);
  assert.equal(vacancyEligible(s, s.trips[0], noticeNow), false); // At departure, stop.
  assert.equal(vacancyEligible(s, s.trips[0], new Date(+at24 + 1)), true);
});
const beforeDeparture = new Date('2026-10-24T19:30:00Z');
test('같은 배의 승선 완료 횟수 순, 미동의·미완료·다른 배·미래 탑승 제외', () => {
  const s = audience();
  s.loyalty.rides.push({ id: 'other', customerId: 'demo-c', boatId: 'other-boat', tripId: 'other', boardedAt: now.toISOString(), completed: true });
  s.loyalty.rides.push({ id: 'unfinished', customerId: 'demo-c', boatId: 'b', tripId: 'unfinished', boardedAt: now.toISOString(), completed: false });
  s.loyalty.rides.push({ id: 'future', customerId: 'demo-c', boatId: 'b', tripId: 'future', boardedAt: '2026-11-01T00:00:00Z', completed: true });
  const ranked = rankRegulars(s, s.trips[0], beforeDeparture);
  assert.equal(ranked.map(c => c.rideCount).join(','), '8,5,2');
  assert.equal(ranked.map(c => c.customer.id).join(','), 'demo-a,demo-b,demo-c');
});
test('동률은 최근 탑승 순이며 같은 출항 중복 기록은 한 번만 집계', () => {
  const s = audience();
  s.loyalty.rides = s.loyalty.rides.filter(r => r.customerId === 'demo-a' || r.customerId === 'demo-b').filter(r => r.tripId.endsWith('-0'));
  s.loyalty.rides.find(r => r.customerId === 'demo-b').boardedAt = '2026-10-21T00:00:00Z';
  s.loyalty.rides.push({ ...s.loyalty.rides[0], id: 'duplicate-record' });
  const ranked = rankRegulars(s, s.trips[0], beforeDeparture);
  assert.equal(ranked[0].customer.id, 'demo-b');
  assert.equal(ranked[1].rideCount, 1);
});
test('안내는 상위 1명씩 진행하고 같은 출항 고객은 중복 안내하지 않음', () => {
  let s = audience();
  for (let i = 0; i < 3; i++) s = simulateNextNotice(s, 't', beforeDeparture);
  assert.equal(s.loyalty.notices.map(n => n.customerId).join(','), 'demo-a,demo-b,demo-c');
  assert.equal(s.loyalty.notices[0].status, 'simulated');
  assert.throws(() => simulateNextNotice(s, 't', beforeDeparture), /대상이 없습니다/);
});
test('이미 예약한 고객은 안내 제외, 만석·취소·미승인 시 즉시 중단', () => {
  let s = reserve(audience(), { ...input, phone: '01000000001' }, now);
  assert.equal(rankRegulars(s, s.trips[0], beforeDeparture)[0].customer.id, 'demo-b');
  s = reserve(s, input, now);
  assert.equal(rankRegulars(s, s.trips[0], beforeDeparture).length, 0);
  assert.throws(() => simulateNextNotice(s, 't', beforeDeparture));
  s = cancelWeather(audience(), 't');
  assert.throws(() => simulateNextNotice(s, 't', beforeDeparture));
  s = audience(); s.companies[0].approved = false;
  assert.throws(() => simulateNextNotice(s, 't', beforeDeparture));
});
test('수신 동의 철회는 다음 회차에 즉시 반영하고 시연 이력은 재생성하지 않음', () => {
  let s = simulateNextNotice(audience(), 't', beforeDeparture);
  s.loyalty.customers.find(c => c.id === 'demo-b').vacancyOptIn = false;
  s = simulateNextNotice(s, 't', beforeDeparture);
  assert.equal(s.loyalty.notices[1].customerId, 'demo-c');
  assert.equal(withLoyaltyDemo(s).loyalty.notices.length, 2);
});
