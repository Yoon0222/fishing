export type Company = { id: string; name: string; port: string; approved: boolean };
export type Boat = { id: string; companyId: string; name: string; capacity: number; description: string };
export type Trip = { id: string; boatId: string; date: string; time: string; returnTime: string; species: string; price: number; charterPrice: number; charterAllowed: boolean; status: 'open' | 'weather-cancelled' };
export type Booking = { id: string; tripId: string; people: number; mode: 'seats' | 'charter'; amount: number; name: string; phone: string; status: 'confirmed' | 'cancel-requested' | 'refunded'; createdAt: string; policyVersion: string; refundAmount: number; refundReason?: string };
export type State = { version: 1; companies: Company[]; boats: Boat[]; trips: Trip[]; bookings: Booking[]; loyalty?: import('./loyalty').LoyaltyData };
export const POLICY_VERSION = 'draft-1';
export const POLICY_TEXT = '기상 악화·자연재해로 업체가 출항을 취소하면 전액 환불합니다. 이용자 사정에 따른 취소·환불 기준은 현재 준비 중입니다. 시연에서는 취소 요청만 접수하며 임의의 환불률을 적용하지 않습니다.';
export const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
export const departure = (trip: Trip) => new Date(`${trip.date}T${trip.time}:00+09:00`);
export const occupied = (s: State, tripId: string) => s.bookings.filter(b => b.tripId === tripId && b.status !== 'refunded');
export function remaining(s: State, t: Trip) {
  const boat = s.boats.find(b => b.id === t.boatId)!;
  const bookings = occupied(s, t.id);
  return bookings.some(b => b.mode === 'charter') ? 0 : boat.capacity - bookings.reduce((n, b) => n + b.people, 0);
}
export function canSell(s: State, t: Trip, now = new Date()) {
  const boat = s.boats.find(b => b.id === t.boatId);
  return !!boat && !!s.companies.find(c => c.id === boat.companyId)?.approved && t.status === 'open' && departure(t) > now;
}
export type BookingInput = Pick<Booking, 'tripId' | 'people' | 'mode' | 'name' | 'phone'>;
export function reserve(s: State, input: BookingInput, now = new Date()): State {
  const trip = s.trips.find(t => t.id === input.tripId);
  if (!trip || !canSell(s, trip, now)) throw new Error('현재 예약할 수 없는 출항입니다. 다른 일정을 선택해주세요.');
  const boat = s.boats.find(b => b.id === trip.boatId)!;
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > boat.capacity) throw new Error('탑승 인원을 확인해주세요.');
  if (!input.name.trim() || !/^01[016789]\d{7,8}$/.test(input.phone.replace(/\D/g, ''))) throw new Error('예약자 이름과 올바른 휴대폰 번호를 입력해주세요.');
  if (input.mode === 'charter') {
    if (!trip.charterAllowed || occupied(s, trip.id).length > 0) throw new Error('일반 예약이 있거나 독선이 허용되지 않은 일정입니다.');
  } else if (remaining(s, trip) < input.people) throw new Error('남은 좌석이 부족합니다. 인원을 다시 선택해주세요.');
  const booking: Booking = { ...input, name: input.name.trim(), phone: input.phone.replace(/\D/g, ''), id: `MT-${now.getTime()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, amount: input.mode === 'charter' ? trip.charterPrice : trip.price * input.people, status: 'confirmed', refundAmount: 0, createdAt: now.toISOString(), policyVersion: POLICY_VERSION };
  return { ...s, bookings: [booking, ...s.bookings] };
}
export function requestCancellation(s: State, id: string): State {
  const booking = s.bookings.find(b => b.id === id);
  if (!booking || booking.status !== 'confirmed') throw new Error('취소 요청할 수 없는 예약입니다.');
  return { ...s, bookings: s.bookings.map(b => b.id === id ? { ...b, status: 'cancel-requested' } : b) };
}
export function cancelWeather(s: State, tripId: string): State {
  if (!s.trips.some(t => t.id === tripId)) throw new Error('출항 일정을 찾을 수 없습니다.');
  return { ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, status: 'weather-cancelled' } : t), bookings: s.bookings.map(b => b.tripId === tripId && b.status !== 'refunded' ? { ...b, status: 'refunded', refundAmount: b.amount, refundReason: '기상 악화·자연재해로 출항 취소' } : b) };
}
export function addCompany(s: State, name: string, port: string): State {
  if (!name.trim() || !port.trim()) throw new Error('업체명과 출항 항구를 입력해주세요.');
  if (s.companies.some(c => c.name === name.trim())) throw new Error('이미 등록된 업체명입니다.');
  return { ...s, companies: [...s.companies, { id: `c-${Date.now()}`, name: name.trim(), port: port.trim(), approved: false }] };
}
export function addBoat(s: State, companyId: string, name: string, capacity: number): State {
  if (!s.companies.some(c => c.id === companyId) || !name.trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw new Error('업체, 배 이름, 정원(1~100명)을 확인해주세요.');
  return { ...s, boats: [...s.boats, { id: `boat-${Date.now()}`, companyId, name: name.trim(), capacity, description: '새롭게 등록된 낚시배입니다. 출항 전 업체의 안내를 확인해주세요.' }] };
}
export function addTrip(s: State, trip: Omit<Trip, 'id' | 'status'>, now = new Date()): State {
  if (!s.boats.some(b => b.id === trip.boatId) || !trip.species.trim()) throw new Error('배와 낚시 종류를 선택해주세요.');
  const date = new Date(`${trip.date}T${trip.time}:00+09:00`);
  const calendarDate = new Date(`${trip.date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trip.date) || Number.isNaN(+date) || Number.isNaN(+calendarDate) || calendarDate.toISOString().slice(0, 10) !== trip.date || date <= now || !/^([01]\d|2[0-3]):[0-5]\d$/.test(trip.time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(trip.returnTime) || trip.returnTime <= trip.time) throw new Error('미래 날짜와 출항·귀항 시간(당일)을 확인해주세요.');
  if (!Number.isSafeInteger(trip.price) || trip.price < 1 || !Number.isSafeInteger(trip.charterPrice) || trip.charterPrice < 0 || (trip.charterAllowed && trip.charterPrice < 1)) throw new Error('올바른 좌석 가격과 독선 가격을 입력해주세요.');
  if (s.trips.some(t => t.boatId === trip.boatId && t.date === trip.date && t.status === 'open' && trip.time < t.returnTime && trip.returnTime > t.time)) throw new Error('같은 배의 출항 시간이 겹칩니다.');
  return { ...s, trips: [...s.trips, { ...trip, id: `trip-${Date.now()}`, status: 'open' }] };
}
