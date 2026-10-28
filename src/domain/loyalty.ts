import { canSell, departure, remaining, type State, type Trip } from './model';

export type Customer = { id: string; name: string; phone: string; vacancyOptIn: boolean };
export type Ride = { id: string; customerId: string; boatId: string; tripId: string; boardedAt: string; completed: boolean };
export type Notice = { id: string; tripId: string; customerId: string; rideCount: number; createdAt: string; message: string; status: 'simulated' };
export type LoyaltyData = { customers: Customer[]; rides: Ride[]; notices: Notice[] };
export type Candidate = { customer: Customer; rideCount: number; lastRide: string };

export function vacancyEligible(s: State, t: Trip, now = new Date()) {
  const hours = (+departure(t) - +now) / 3600000;
  return canSell(s, t, now) && hours > 0 && hours <= 24 && remaining(s, t) > 0;
}

export function rankRegulars(s: State, trip: Trip, now = new Date()): Candidate[] {
  if (!s.loyalty || !vacancyEligible(s, trip, now)) return [];
  const data = s.loyalty;
  return data.customers.filter(customer => customer.vacancyOptIn &&
    !data.notices.some(n => n.tripId === trip.id && n.customerId === customer.id) &&
    !s.bookings.some(b => b.tripId === trip.id && b.status !== 'refunded' && b.phone.replace(/\D/g, '') === customer.phone.replace(/\D/g, ''))
  ).map(customer => {
    const rides = data.rides.filter(r => r.customerId === customer.id && r.boatId === trip.boatId && r.completed && +new Date(r.boardedAt) < +now);
    return { customer, rideCount: new Set(rides.map(r => r.tripId)).size, lastRide: rides.map(r => r.boardedAt).sort().at(-1) ?? '' };
  }).filter(c => c.rideCount > 0)
    .sort((a, b) => b.rideCount - a.rideCount || b.lastRide.localeCompare(a.lastRide) || a.customer.id.localeCompare(b.customer.id));
}

export function simulateNextNotice(s: State, tripId: string, now = new Date()): State {
  const trip = s.trips.find(t => t.id === tripId);
  if (!trip || !vacancyEligible(s, trip, now)) throw new Error('빈자리가 있고 출항까지 24시간 이내인 일정만 안내할 수 있습니다.');
  const next = rankRegulars(s, trip, now)[0];
  if (!s.loyalty || !next) throw new Error('다음 안내 대상이 없습니다. 수신 동의와 탑승 이력을 확인해주세요.');
  const boat = s.boats.find(b => b.id === trip.boatId)!;
  const message = `${next.customer.name}님, 다시 ${boat.name}와 바다로 떠나볼까요? ${trip.date} ${trip.time} ${trip.species} 출항에 ${remaining(s, trip)}석이 남아 있어요. 앱에서 현재 잔여석을 확인하고 예약해주세요.`;
  const notice: Notice = { id: `${trip.id}:${next.customer.id}`, tripId, customerId: next.customer.id, rideCount: next.rideCount, createdAt: now.toISOString(), message, status: 'simulated' };
  return { ...s, loyalty: { ...s.loyalty, notices: [...s.loyalty.notices, notice] } };
}

// Fictional records are isolated from live bookings and loaded only by an explicit demo action.
export function withLoyaltyDemo(s: State, now = new Date()): State {
  if (s.loyalty) return s;
  const customers: Customer[] = [
    { id: 'demo-a', name: '단골 A (예시)', phone: '01000000001', vacancyOptIn: true },
    { id: 'demo-b', name: '단골 B (예시)', phone: '01000000002', vacancyOptIn: true },
    { id: 'demo-c', name: '단골 C (예시)', phone: '01000000003', vacancyOptIn: true },
    { id: 'demo-d', name: '알림 미동의 고객 (예시)', phone: '01000000004', vacancyOptIn: false },
  ];
  const rides: Ride[] = [];
  s.boats.forEach(boat => customers.forEach((customer, customerIndex) => {
    const count = [8, 5, 2, 12][customerIndex];
    for (let i = 0; i < count; i++) rides.push({ id: `${boat.id}-${customer.id}-${i}`, customerId: customer.id, boatId: boat.id, tripId: `history-${boat.id}-${i}`, boardedAt: new Date(+now - (i + 1) * 7 * 86400000).toISOString(), completed: true });
  }));
  return { ...s, loyalty: { customers, rides, notices: [] } };
}
