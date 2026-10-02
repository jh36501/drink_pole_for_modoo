import { PollConfig, VoterRecord } from '../types';
import { getMondayOfWeek, shiftWeek } from './dateUtils';

const STORAGE_KEY_CONFIG = 'team_dinner_poll_config_v1';
const STORAGE_KEY_VOTES = 'team_dinner_poll_votes_v1';

export function getDefaultPollConfig(): PollConfig {
  // Use upcoming week Monday (2026-10-05) or current week
  const today = new Date();
  const currentMonday = getMondayOfWeek(today);
  const nextMonday = shiftWeek(currentMonday, 1);

  // Default candidates: Tuesday, Wednesday, Thursday, Friday
  const tuesday = shiftWeek(nextMonday, 0); // 0th week
  // Let's create specific dates from nextMonday
  const [y, m, d] = nextMonday.split('-').map(Number);
  const nextMonDate = new Date(y, m - 1, d);

  const getDayOffset = (days: number) => {
    const target = new Date(nextMonDate);
    target.setDate(nextMonDate.getDate() + days);
    const yr = target.getFullYear();
    const mo = String(target.getMonth() + 1).padStart(2, '0');
    const da = String(target.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const tue = getDayOffset(1);
  const wed = getDayOffset(2);
  const thu = getDayOffset(3);
  const fri = getDayOffset(4);

  return {
    id: 'poll-oct-dinner',
    title: '10월 2주차 팀 정기 회식 일정 조율 🍗🍻',
    description: '3분기 프로젝트 성공적 런칭 축하 및 신규 입사자 환영 회식입니다! 가능한 날짜를 모두 선택해주세요. (다중 선택 가능)',
    organizer: '김총무 (피플팀)',
    weekStartDate: nextMonday,
    candidateDates: [tue, wed, thu, fri],
    confirmedDate: null,
    confirmedTimeLocation: '18:30 / 신논현 맛집거리',
    deadline: `${tue}T18:00`,
    status: 'active',
    round: 1,
    isRunoff: false,
    lastUpdated: new Date().toISOString(),
  };
}

export function getDefaultVotes(config: PollConfig): VoterRecord[] {
  const [tue, wed, thu, fri] = config.candidateDates;
  if (!thu) return [];

  return [
    {
      id: 'voter-1',
      name: '김민준',
      department: 'Tech Lead',
      selectedDates: [wed, thu, fri].filter(Boolean),
      note: '목요일이 제일 여유롭습니다!',
      preferredMenu: '소고기',
      updatedAt: '2026-09-30T10:15:00',
    },
    {
      id: 'voter-2',
      name: '이서연',
      department: 'Product Designer',
      selectedDates: [tue, thu].filter(Boolean),
      note: '수요일은 야간 배포 서포트라 목요일 희망해요',
      preferredMenu: '삼겹살',
      updatedAt: '2026-09-30T11:20:00',
    },
    {
      id: 'voter-3',
      name: '박도현',
      department: 'Backend Dev',
      selectedDates: [wed, thu, fri].filter(Boolean),
      note: '목/금 모두 좋습니다! 고기 환영',
      preferredMenu: '삼겹살',
      updatedAt: '2026-09-30T13:05:00',
    },
    {
      id: 'voter-4',
      name: '정유진',
      department: 'Frontend Dev',
      selectedDates: [thu, fri].filter(Boolean),
      note: '목요일은 19시 조금 늦게 합류 가능합니다',
      preferredMenu: '회/해산물',
      updatedAt: '2026-09-30T14:40:00',
    },
    {
      id: 'voter-5',
      name: '최현우',
      department: 'PM',
      selectedDates: [tue, wed, thu].filter(Boolean),
      note: '금요일은 타팀 미팅 일정이 있어요',
      preferredMenu: '상관없음',
      updatedAt: '2026-09-30T15:10:00',
    },
    {
      id: 'voter-6',
      name: '송지아',
      department: 'QA Engineer',
      selectedDates: [thu].filter(Boolean),
      note: '목요일 대찬성입니다!',
      preferredMenu: '소고기',
      updatedAt: '2026-09-30T16:00:00',
    },
  ];
}

export function loadPollData(): { config: PollConfig; votes: VoterRecord[] } {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    const savedVotes = localStorage.getItem(STORAGE_KEY_VOTES);

    let config: PollConfig = savedConfig ? JSON.parse(savedConfig) : getDefaultPollConfig();
    let votes: VoterRecord[] = savedVotes ? JSON.parse(savedVotes) : getDefaultVotes(config);

    return { config, votes };
  } catch (err) {
    console.error('Failed to load from localStorage', err);
    const config = getDefaultPollConfig();
    return { config, votes: getDefaultVotes(config) };
  }
}

export function savePollData(config: PollConfig, votes: VoterRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(votes));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function resetPollData(): { config: PollConfig; votes: VoterRecord[] } {
  const config = getDefaultPollConfig();
  const votes = getDefaultVotes(config);
  savePollData(config, votes);
  return { config, votes };
}
