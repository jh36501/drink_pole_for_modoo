export const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMondayOfWeek(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  // day: 0 (Sun) to 6 (Sat). If Sunday (0), treat as 7th day of previous week or same week Monday - 6
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return formatISODate(monday);
}

export function getDaysInWeek(mondayStr: string): string[] {
  const monday = parseISODate(mondayStr);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push(formatISODate(current));
  }
  return days;
}

export function shiftWeek(mondayStr: string, offsetWeeks: number): string {
  const date = parseISODate(mondayStr);
  date.setDate(date.getDate() + offsetWeeks * 7);
  return formatISODate(date);
}

export function getDayOfWeekKorean(dateStr: string): string {
  const date = parseISODate(dateStr);
  return KOREAN_DAYS[date.getDay()];
}

export function formatDateKorean(dateStr: string, includeYear = false): string {
  const date = parseISODate(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = KOREAN_DAYS[date.getDay()];
  if (includeYear) {
    return `${date.getFullYear()}년 ${month}월 ${day}일 (${dow})`;
  }
  return `${month}월 ${day}일 (${dow})`;
}

export function formatShortDate(dateStr: string): string {
  const date = parseISODate(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export function getWeekLabel(mondayStr: string): string {
  const monday = parseISODate(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mMonth = monday.getMonth() + 1;
  const mDay = monday.getDate();
  const sMonth = sunday.getMonth() + 1;
  const sDay = sunday.getDate();

  return `${mMonth}.${mDay} ~ ${sMonth}.${sDay}`;
}

export interface RemainingTime {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  urgency: 'normal' | 'warning' | 'urgent' | 'expired';
}

export function parseDeadline(deadlineStr: string): Date | null {
  if (!deadlineStr) return null;
  // Handle formats like "YYYY-MM-DD HH:mm", "YYYY-MM-DDTHH:mm"
  const normalized = deadlineStr.includes(' ') && !deadlineStr.includes('T')
    ? deadlineStr.replace(' ', 'T')
    : deadlineStr;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDateTimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function calculateRemainingTime(deadlineDate: Date | null, now: Date = new Date()): RemainingTime {
  if (!deadlineDate) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      urgency: 'normal',
    };
  }

  const diffMs = deadlineDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      urgency: 'expired',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
  if (totalSeconds < 3600) {
    urgency = 'urgent'; // Less than 1 hour left
  } else if (totalSeconds < 86400) {
    urgency = 'warning'; // Less than 24 hours left
  }

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    urgency,
  };
}

export function formatDeadlineDisplay(deadlineStr: string): string {
  const d = parseDeadline(deadlineStr);
  if (!d) return deadlineStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = KOREAN_DAYS[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}월 ${day}일 (${dow}) ${hours}:${minutes}`;
}

