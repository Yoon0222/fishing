import type { State } from './model';
export function futureDate(offset: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function createSeed(): State {
  const companies = [
    { id: 'jeil', name: '인천제일바다낚시', port: '인천 · 남항', approved: true },
    { id: 'blue', name: '푸른바다 피싱', port: '태안 · 안흥항', approved: true },
    { id: 'island', name: '섬마을 선상낚시', port: '여수 · 국동항', approved: false },
  ];
  const boats = [
    { id: 'jeil-1', companyId: 'jeil', name: '제일 1호', capacity: 20, description: '넓은 낚시 공간과 쾌적한 선실. 처음 오시는 분도 선장님과 함께 편안하게 즐겨보세요.' },
    { id: 'jeil-2', companyId: 'jeil', name: '제일 2호', capacity: 16, description: '가족·친구와 함께 즐기기 좋은 낚시배. 화장실과 실내 휴게 공간을 갖추고 있습니다.' },
    { id: 'blue-1', companyId: 'blue', name: '블루오션호', capacity: 18, description: '안흥 앞바다로 떠나는 하루. 계절마다 다른 어종을 만나보세요.' },
    { id: 'island-1', companyId: 'island', name: '섬마을호', capacity: 12, description: '여수 바다를 만나는 선상낚시.' },
  ];
  const trips: State['trips'] = [];
  for (let day = 1; day <= 10; day++) {
    boats.forEach((boat, i) => {
      trips.push({ id: `${boat.id}-${day}-am`, boatId: boat.id, date: futureDate(day), time: i === 2 ? '06:00' : '05:30', returnTime: '12:00', species: day > 5 ? '우럭' : i === 2 ? '갑오징어' : '쭈꾸미', price: i === 2 ? 90000 : 80000, charterPrice: boat.capacity * 75000, charterAllowed: true, status: 'open' });
      if (i < 2) trips.push({ id: `${boat.id}-${day}-pm`, boatId: boat.id, date: futureDate(day), time: '13:00', returnTime: '17:30', species: '우럭', price: 60000, charterPrice: boat.capacity * 55000, charterAllowed: true, status: 'open' });
    });
  }
  return { version: 1, companies, boats, trips, bookings: [] };
}
