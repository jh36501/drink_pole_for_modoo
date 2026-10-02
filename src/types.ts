export interface PollConfig {
  id: string;
  title: string;
  description: string;
  organizer: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  candidateDates: string[]; // List of YYYY-MM-DD dates open for voting
  confirmedDate: string | null; // Finalized date chosen by admin
  confirmedTimeLocation: string; // e.g. "18:30 / 역삼역 마장동 김씨"
  deadline: string; // e.g. "2026-10-06 18:00"
  status: 'active' | 'closed';
  round: number; // 1 = regular, 2+ = runoff revote
  isRunoff?: boolean;
  previousCandidates?: string[];
  lastUpdated: string;
}

export interface VoterRecord {
  id: string;
  name: string;
  department?: string;
  selectedDates: string[]; // YYYY-MM-DD
  note?: string; // e.g. "목요일은 19시 이후 가능합니다"
  preferredMenu?: string; // e.g. "삼겹살", "소고기", "회/해산물", "중식/양식", "상관없음"
  updatedAt: string;
}

export interface DateVoteSummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 월, 화, 수 ...
  isCandidate: boolean;
  voterCount: number;
  totalVoters: number;
  percentage: number;
  attendees: VoterRecord[];
  absentees: VoterRecord[];
  isTop: boolean;
  isConfirmed: boolean;
}

export type ViewMode = 'calendar' | 'matrix' | 'members';
export type UserRole = 'voter' | 'admin';

export interface DayWeatherInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 월, 화, 수 ...
  timeSlot: string; // 저녁 (18:00 ~ 21:00)
  location: string; // 예: 서울 (신논현/강남)
  weatherText: string; // 맑음, 구름많음, 흐림, 비 등
  emoji: string; // ☀️, ⛅, ☁️, 🌧️, ❄️
  eveningTemp: number; // 저녁 예상 기온 (°C)
  minTemp: number;
  maxTemp: number;
  rainProbability: number; // 강수 확률 (%)
  recommendationTip?: string; // 예: 야외 2차 쾌적, 우산 지참 등
}
