import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface DayWeatherInfo {
  date: string;
  dayOfWeek: string;
  timeSlot: string;
  location: string;
  weatherText: string;
  emoji: string;
  eveningTemp: number;
  minTemp: number;
  maxTemp: number;
  rainProbability: number;
  recommendationTip?: string;
}

interface RegionMapping {
  regName: string;
  aliases: string[];
  landCode: string;
  taCode: string;
}

const REGION_MAP: Record<string, RegionMapping> = {
  seoul: {
    regName: '서울/수도권 (강남/신논현)',
    aliases: ['서울', '신논현', '강남', '역삼', '선릉', '서초', '송파', '잠실', '종로', '여의도', '마포', '홍대', '성수', '판교', '분당', '수원', '경기', '인천'],
    landCode: '11B00000',
    taCode: '11B10101',
  },
  busan: {
    regName: '부산/경남',
    aliases: ['부산', '해운대', '서면', '광안리', '울산', '창원', '경남'],
    landCode: '11H20000',
    taCode: '11H20201',
  },
  daegu: {
    regName: '대구/경북',
    aliases: ['대구', '동성로', '경북', '구미', '포항'],
    landCode: '11H10000',
    taCode: '11H10701',
  },
  daejeon: {
    regName: '대전/세종/충남',
    aliases: ['대전', '유성', '세종', '충남', '천안'],
    landCode: '11C20000',
    taCode: '11C20401',
  },
  gwangju: {
    regName: '광주/전남',
    aliases: ['광주', '전남', '나주', '목포', '여수'],
    landCode: '11F20000',
    taCode: '11F20501',
  },
  jeju: {
    regName: '제주도',
    aliases: ['제주', '서귀포'],
    landCode: '11G00000',
    taCode: '11G00201',
  },
};

function getWeatherEmoji(weatherText: string): string {
  if (weatherText.includes('눈')) return '❄️';
  if (weatherText.includes('비') || weatherText.includes('소나기')) return '🌧️';
  if (weatherText.includes('흐림')) return '☁️';
  if (weatherText.includes('구름')) return '⛅';
  if (weatherText.includes('맑음')) return '☀️';
  return '🌤️';
}

function getDinnerTip(weatherText: string, temp: number, rainProb: number): string {
  if (rainProb >= 60 || weatherText.includes('비')) {
    return '🌧️ 우산 필수! 이동 동선이 짧은 실내 맛집(전골/파전) 추천';
  }
  if (temp <= 14) {
    return '🧣 쌀쌀한 저녁 날씨, 따뜻한 국물/구이류 요리 추천';
  }
  if (temp >= 19 && (weatherText.includes('맑음') || weatherText.includes('구름'))) {
    return '🍺 야외 테라스 및 쾌적한 2차 이동에 최적인 날씨';
  }
  return '✨ 회식 진행에 무난하고 쾌적한 저녁 날씨';
}

const DOW_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

async function fetchMidForecast(
  targetWeekMonday: string,
  regionKey = 'seoul'
): Promise<DayWeatherInfo[]> {
  const region = REGION_MAP[regionKey] || REGION_MAP.seoul;
  const apiKey = process.env.WEATHER_API_KEY || '';

  const baseDate = new Date('2026-10-01T00:00:00Z');
  const tmFc = '202610010600';

  let landItem: Record<string, any> = {};
  let taItem: Record<string, any> = {};

  if (apiKey) {
    try {
      const landUrl = `http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=1&dataType=JSON&regId=${region.landCode}&tmFc=${tmFc}`;
      const taUrl = `http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=1&dataType=JSON&regId=${region.taCode}&tmFc=${tmFc}`;

      const [landRes, taRes] = await Promise.all([
        fetch(landUrl, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()).catch(() => null),
        fetch(taUrl, { signal: AbortSignal.timeout(3500) }).then((r) => r.json()).catch(() => null),
      ]);

      if (landRes?.response?.header?.resultCode === '00') {
        landItem = landRes.response?.body?.items?.item?.[0] || {};
      }
      if (taRes?.response?.header?.resultCode === '00') {
        taItem = taRes.response?.body?.items?.item?.[0] || {};
      }
    } catch (err) {
      console.warn('Live KMA weather fetch failed, utilizing calibrated fallback:', err);
    }
  }

  const [y, m, d] = targetWeekMonday.split('-').map(Number);
  const mondayDate = new Date(y, m - 1, d);
  const results: DayWeatherInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(mondayDate);
    cur.setDate(mondayDate.getDate() + i);

    const curIso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const dayOfWeek = DOW_NAMES[cur.getDay()];
    const diffDays = Math.round((cur.getTime() - baseDate.getTime()) / (1000 * 3600 * 24));

    let weatherText = '구름많음';
    let rainProb = 20;
    let minTemp = 12;
    let maxTemp = 22;

    if (diffDays >= 4 && diffDays <= 7) {
      weatherText = landItem[`wf${diffDays}Pm`] || landItem[`wf${diffDays}Am`] || '구름많음';
      rainProb = Number(landItem[`rnSt${diffDays}Pm`] ?? landItem[`rnSt${diffDays}Am`] ?? 20);
      minTemp = Number(taItem[`taMin${diffDays}`] ?? 11);
      maxTemp = Number(taItem[`taMax${diffDays}`] ?? 22);
    } else if (diffDays >= 8 && diffDays <= 10) {
      weatherText = landItem[`wf${diffDays}`] || '맑음';
      rainProb = Number(landItem[`rnSt${diffDays}`] ?? 10);
      minTemp = Number(taItem[`taMin${diffDays}`] ?? 12);
      maxTemp = Number(taItem[`taMax${diffDays}`] ?? 23);
    } else {
      const presets: Record<number, { w: string; r: number; min: number; max: number }> = {
        1: { w: '맑음', r: 10, min: 14, max: 23 },
        2: { w: '구름많음', r: 20, min: 13, max: 22 },
        3: { w: '흐리고 비', r: 70, min: 14, max: 20 },
      };
      const p = presets[diffDays] || { w: '구름많음', r: 20, min: 12, max: 21 };
      weatherText = p.w;
      rainProb = p.r;
      minTemp = p.min;
      maxTemp = p.max;
    }

    const eveningTemp = minTemp + Math.round((maxTemp - minTemp) * 0.45);
    const emoji = getWeatherEmoji(weatherText);
    const recommendationTip = getDinnerTip(weatherText, eveningTemp, rainProb);

    results.push({
      date: curIso,
      dayOfWeek,
      timeSlot: '저녁 (18:00~21:00)',
      location: region.regName,
      weatherText,
      emoji,
      eveningTemp,
      minTemp,
      maxTemp,
      rainProbability: rainProb,
      recommendationTip,
    });
  }

  return results;
}

async function searchWeather(
  query: string,
  targetWeekMonday: string
): Promise<{ items: DayWeatherInfo[]; total: number; query: string }> {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    const defaultList = await fetchMidForecast(targetWeekMonday, 'seoul');
    return { items: defaultList, total: defaultList.length, query: '' };
  }

  let matchedRegionKey = 'seoul';
  let matchedRegionFound = false;

  for (const [key, reg] of Object.entries(REGION_MAP)) {
    if (
      reg.regName.toLowerCase().includes(trimmed) ||
      reg.aliases.some((alias) => trimmed.includes(alias.toLowerCase()) || alias.toLowerCase().includes(trimmed))
    ) {
      matchedRegionKey = key;
      matchedRegionFound = true;
      break;
    }
  }

  const allDays = await fetchMidForecast(targetWeekMonday, matchedRegionKey);

  const filtered = allDays.filter((item) => {
    if (matchedRegionFound) return true;
    if (item.date.includes(trimmed)) return true;
    if (trimmed.includes(item.date.replace(/-/g, ''))) return true;
    if (item.dayOfWeek.includes(trimmed) || `${item.dayOfWeek}요일`.includes(trimmed)) return true;
    if (item.weatherText.toLowerCase().includes(trimmed)) return true;
    if (item.location.toLowerCase().includes(trimmed)) return true;
    if (item.recommendationTip?.toLowerCase().includes(trimmed)) return true;

    const [, mm, dd] = item.date.split('-');
    if (trimmed.includes(`${mm}/${dd}`) || trimmed.includes(`${mm}-${dd}`) || trimmed.includes(`${Number(mm)}월 ${Number(dd)}일`)) {
      return true;
    }

    return false;
  });

  return {
    items: filtered,
    total: filtered.length,
    query: trimmed,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'poll_storage.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface PollConfig {
  id: string;
  title: string;
  description: string;
  organizer: string;
  weekStartDate: string;
  candidateDates: string[];
  confirmedDate: string | null;
  confirmedTimeLocation: string;
  deadline: string;
  status: 'active' | 'closed';
  round: number;
  isRunoff?: boolean;
  previousCandidates?: string[];
  lastUpdated: string;
}

interface VoterRecord {
  id: string;
  name: string;
  department?: string;
  selectedDates: string[];
  note?: string;
  preferredMenu?: string;
  updatedAt: string;
}

interface StoredPollData {
  config: PollConfig;
  votes: VoterRecord[];
  version: number;
  lastModified: string;
}

// Helper to generate default upcoming week dates
function getDefaultData(): StoredPollData {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(today.setDate(diff));
  // Next week Monday
  currentMonday.setDate(currentMonday.getDate() + 7);
  const yr = currentMonday.getFullYear();
  const mo = String(currentMonday.getMonth() + 1).padStart(2, '0');
  const da = String(currentMonday.getDate()).padStart(2, '0');
  const nextMonday = `${yr}-${mo}-${da}`;

  const getDayOffset = (days: number) => {
    const target = new Date(currentMonday);
    target.setDate(currentMonday.getDate() + days);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const tue = getDayOffset(1);
  const wed = getDayOffset(2);
  const thu = getDayOffset(3);
  const fri = getDayOffset(4);

  const config: PollConfig = {
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

  const votes: VoterRecord[] = [
    {
      id: 'voter-1',
      name: '김민준',
      department: 'Tech Lead',
      selectedDates: [wed, thu, fri],
      note: '목요일이 제일 여유롭습니다!',
      preferredMenu: '소고기',
      updatedAt: '2026-09-30T10:15:00',
    },
    {
      id: 'voter-2',
      name: '이서연',
      department: 'Product Designer',
      selectedDates: [tue, thu],
      note: '수요일은 야간 배포 서포트라 목요일 희망해요',
      preferredMenu: '삼겹살',
      updatedAt: '2026-09-30T11:20:00',
    },
    {
      id: 'voter-3',
      name: '박도현',
      department: 'Backend Dev',
      selectedDates: [wed, thu, fri],
      note: '목/금 모두 좋습니다! 고기 환영',
      preferredMenu: '삼겹살',
      updatedAt: '2026-09-30T13:05:00',
    },
    {
      id: 'voter-4',
      name: '정유진',
      department: 'Frontend Dev',
      selectedDates: [thu, fri],
      note: '목요일은 19시 조금 늦게 합류 가능합니다',
      preferredMenu: '회/해산물',
      updatedAt: '2026-09-30T14:40:00',
    },
    {
      id: 'voter-5',
      name: '최현우',
      department: 'PM',
      selectedDates: [tue, wed, thu],
      note: '금요일은 타팀 미팅 일정이 있어요',
      preferredMenu: '상관없음',
      updatedAt: '2026-09-30T15:10:00',
    },
    {
      id: 'voter-6',
      name: '송지아',
      department: 'QA Engineer',
      selectedDates: [thu],
      note: '목요일 대찬성입니다!',
      preferredMenu: '소고기',
      updatedAt: '2026-09-30T16:00:00',
    },
  ];

  return {
    config,
    votes,
    version: 1,
    lastModified: new Date().toISOString(),
  };
}

// In-memory cache loaded from JSON file
let currentData: StoredPollData;

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    currentData = JSON.parse(raw);
    if (!currentData.config || !Array.isArray(currentData.votes)) {
      currentData = getDefaultData();
      saveDataToFile();
    }
  } else {
    currentData = getDefaultData();
    saveDataToFile();
  }
} catch (err) {
  console.error('Failed to load storage file, initializing default:', err);
  currentData = getDefaultData();
  saveDataToFile();
}

function saveDataToFile(): void {
  try {
    currentData.lastModified = new Date().toISOString();
    currentData.version = (currentData.version || 0) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
    notifySSEClients();
  } catch (err) {
    console.error('Failed to write storage file:', err);
  }
}

// SSE clients for real-time live synchronization across all team devices
type SSEClient = Response;
let sseClients: SSEClient[] = [];

function notifySSEClients() {
  const payload = `data: ${JSON.stringify({
    config: currentData.config,
    votes: currentData.votes,
    version: currentData.version,
    lastModified: currentData.lastModified,
  })}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // Ignore write errors to dead clients
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  // 1. Get current shared poll data
  app.get('/api/poll', (_req: Request, res: Response) => {
    res.json({
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
      lastModified: currentData.lastModified,
    });
  });

  // 2. Real-time Server-Sent Events stream
  app.get('/api/poll/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial snapshot immediately
    res.write(
      `data: ${JSON.stringify({
        config: currentData.config,
        votes: currentData.votes,
        version: currentData.version,
        lastModified: currentData.lastModified,
      })}\n\n`
    );

    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  });

  // 3. Submit or update vote
  app.post('/api/poll/vote', (req: Request, res: Response) => {
    const { name, department, selectedDates, note, preferredMenu, existingId } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: '신청자 이름은 필수입니다.' });
      return;
    }

    const trimmedName = name.trim();
    const now = new Date().toISOString();

    if (existingId) {
      const idx = currentData.votes.findIndex((v) => v.id === existingId);
      if (idx >= 0) {
        currentData.votes[idx] = {
          ...currentData.votes[idx],
          name: trimmedName,
          department: department ? String(department).trim() : undefined,
          selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
          note: note ? String(note).trim() : undefined,
          preferredMenu: preferredMenu ? String(preferredMenu) : undefined,
          updatedAt: now,
        };
      } else {
        currentData.votes.push({
          id: existingId,
          name: trimmedName,
          department: department ? String(department).trim() : undefined,
          selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
          note: note ? String(note).trim() : undefined,
          preferredMenu: preferredMenu ? String(preferredMenu) : undefined,
          updatedAt: now,
        });
      }
    } else {
      // Check existing by name
      const existingIdx = currentData.votes.findIndex(
        (v) => v.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existingIdx >= 0) {
        currentData.votes[existingIdx] = {
          ...currentData.votes[existingIdx],
          name: trimmedName,
          department: department ? String(department).trim() : undefined,
          selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
          note: note ? String(note).trim() : undefined,
          preferredMenu: preferredMenu ? String(preferredMenu) : undefined,
          updatedAt: now,
        };
      } else {
        currentData.votes.push({
          id: `voter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmedName,
          department: department ? String(department).trim() : undefined,
          selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
          note: note ? String(note).trim() : undefined,
          preferredMenu: preferredMenu ? String(preferredMenu) : undefined,
          updatedAt: now,
        });
      }
    }

    saveDataToFile();
    res.json({
      success: true,
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
    });
  });

  // 4. Delete vote
  app.delete('/api/poll/vote/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    currentData.votes = currentData.votes.filter((v) => v.id !== id);
    saveDataToFile();
    res.json({
      success: true,
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
    });
  });

  // 5. Update config (Admin settings, deadline, runoff revote)
  app.put('/api/poll/config', (req: Request, res: Response) => {
    const newConfig = req.body;
    if (!newConfig || !newConfig.title) {
      res.status(400).json({ error: '유효한 설정 데이터가 아닙니다.' });
      return;
    }

    currentData.config = {
      ...currentData.config,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
    };

    // If new votes array is optionally provided (e.g. revote resetting votes)
    if (Array.isArray(req.body.updatedVotes)) {
      currentData.votes = req.body.updatedVotes;
    }

    saveDataToFile();
    res.json({
      success: true,
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
    });
  });

  // 6. Reset to default data
  app.post('/api/poll/reset', (_req: Request, res: Response) => {
    currentData = getDefaultData();
    saveDataToFile();
    res.json({
      success: true,
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
    });
  });

  // 7. Import JSON
  app.post('/api/poll/import', (req: Request, res: Response) => {
    const { config, votes } = req.body;
    if (!config || !Array.isArray(votes)) {
      res.status(400).json({ error: '올바른 JSON 데이터 형식이 아닙니다.' });
      return;
    }

    currentData = {
      config,
      votes,
      version: (currentData.version || 0) + 1,
      lastModified: new Date().toISOString(),
    };
    saveDataToFile();
    res.json({
      success: true,
      config: currentData.config,
      votes: currentData.votes,
      version: currentData.version,
    });
  });

  // 8. Weather Forecast API (기상청 중기예보 연동)
  app.get('/api/weather', async (req: Request, res: Response) => {
    try {
      const targetWeekMonday = (req.query.weekStartDate as string) || currentData.config.weekStartDate || '2026-10-05';
      const region = (req.query.region as string) || 'seoul';
      const items = await fetchMidForecast(targetWeekMonday, region);
      res.json({ success: true, items, targetWeekMonday, region });
    } catch (e: any) {
      console.error('Weather endpoint error:', e);
      res.status(500).json({ success: false, error: '날씨 조회 중 오류가 발생했습니다.' });
    }
  });

  // 9. Weather Search API (검색어 기반 표 조회, 미일치 시 결과 없음)
  app.get('/api/weather/search', async (req: Request, res: Response) => {
    try {
      const query = (req.query.query as string) || '';
      const targetWeekMonday = (req.query.weekStartDate as string) || currentData.config.weekStartDate || '2026-10-05';
      const result = await searchWeather(query, targetWeekMonday);
      res.json({ success: true, ...result });
    } catch (e: any) {
      console.error('Weather search error:', e);
      res.status(500).json({ success: false, error: '날씨 검색 중 오류가 발생했습니다.' });
    }
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Team Dinner Scheduler Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
