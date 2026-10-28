import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createSeed } from './domain/seed';
import type { State } from './domain/model';

const KEY = 'multtae-demo-v1';
type Store = { state: State; ready: boolean; error: string; transact: (fn: (s: State) => State) => Promise<void>; retry: () => void };
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(createSeed);
  const current = useRef(state);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(raw => {
      const next = raw ? JSON.parse(raw) as State : createSeed();
      if (next.version !== 1 || !Array.isArray(next.trips) || !Array.isArray(next.bookings) || !Array.isArray(next.companies) || !Array.isArray(next.boats)) throw new Error('저장된 데이터 형식을 확인할 수 없습니다.');
      if (active) { current.current = next; setState(next); setReady(true); setError(''); }
    }).catch(() => { if (active) setError('기기에 저장된 예약을 불러오지 못했습니다. 다시 시도해주세요.'); });
    return () => { active = false; };
  }, [attempt]);
  async function transact(fn: (s: State) => State) {
    const task = queue.current.then(async () => {
      if (!ready) throw new Error('데이터를 불러온 후 다시 시도해주세요.');
      const next = fn(current.current);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setState(next);
    });
    queue.current = task.catch(() => {});
    return task;
  }
  return <Context.Provider value={{ state, ready, error, transact, retry: () => { setError(''); setAttempt(a => a + 1); } }}>{children}</Context.Provider>;
}
export function useStore() { const value = useContext(Context); if (!value) throw new Error('StoreProvider required'); return value; }
