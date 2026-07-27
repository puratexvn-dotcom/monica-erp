'use client';

// ============================================================================
// MONICA GARMENT ERP — Hooks dùng chung: session + bộ lọc thời gian toàn cục
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, type Session } from '@/lib/auth';

// ── Session ─────────────────────────────────────────────────────────────────
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);
  return { session, ready };
}

// ── Bộ lọc thời gian (Header → mọi module) ─────────────────────────────────
export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export const TIME_LABEL: Record<TimeRange, string> = {
  today: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
  year: 'Năm nay',
  all: 'Tất cả',
};

export const TimeFilterContext = createContext<TimeRange>('all');
export const useTimeFilter = (): TimeRange => useContext(TimeFilterContext);

/** Kiểm tra một mốc thời gian ISO có nằm trong khoảng lọc không. */
export function inTimeRange(iso: string | null | undefined, range: TimeRange): boolean {
  if (range === 'all') return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  if (range === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    // Tuần bắt đầu Thứ 2
    const start = new Date(now);
    const day = (now.getDay() + 6) % 7; // Mon=0
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (range === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return d.getFullYear() === now.getFullYear(); // year
}
