import React from 'react';
import { DateVoteSummary, DayWeatherInfo } from '../types';
import { formatDateKorean, getWeekLabel, formatShortDate } from '../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Crown, 
  CheckCircle2, 
  Users, 
  Power, 
  Pin,
  CalendarCheck2,
  CloudSun,
  Umbrella
} from 'lucide-react';

interface WeeklyCalendarViewProps {
  currentWeekMonday: string;
  onShiftWeek: (offset: number) => void;
  onResetToCurrentWeek: () => void;
  daySummaries: DateVoteSummary[];
  isAdmin: boolean;
  onToggleCandidate: (date: string) => void;
  onSelectConfirmedDate: (date: string) => void;
  onDateClick: (date: string) => void;
  weatherMap?: Record<string, DayWeatherInfo>;
  onOpenWeatherModal?: () => void;
}

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  currentWeekMonday,
  onShiftWeek,
  onResetToCurrentWeek,
  daySummaries,
  isAdmin,
  onToggleCandidate,
  onSelectConfirmedDate,
  onDateClick,
  weatherMap = {},
  onOpenWeatherModal,
}) => {
  const weekLabel = getWeekLabel(currentWeekMonday);
  // Exclude Saturday and Sunday from the calendar display
  const weekdaySummaries = daySummaries.filter(
    (s) => s.dayOfWeek !== '토' && s.dayOfWeek !== '일'
  );

  return (
    <div className="space-y-4">
      {/* Week Navigator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              주간 투표 캘린더
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              주간 범위: {weekLabel} (월요일 ~ 금요일 평일 5일)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onOpenWeatherModal && (
            <button
              onClick={onOpenWeatherModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
              title="기상청 실시간 저녁 날씨 및 기온 조회"
            >
              <CloudSun className="w-4 h-4 text-sky-600" />
              <span>저녁 날씨 조회</span>
            </button>
          )}

          <button
            onClick={() => onShiftWeek(-1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onResetToCurrentWeek}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
          >
            기본 주차로 이동
          </button>
          <button
            onClick={() => onShiftWeek(1)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3 text-xs text-sky-950 flex items-center justify-between">
          <span className="font-medium">
            💡 <strong>총무 알림:</strong> 요일별 카드의 <Power className="w-3 h-3 inline mx-0.5 text-sky-700" /> 버튼을 눌러 팀원들에게 열어둘 후보일을 즉시 활성화/비활성화할 수 있습니다.
          </span>
        </div>
      )}

      {/* 5 Weekdays Grid (월~금, 한 줄로 표시) */}
      <div className="overflow-x-auto pb-1.5 -mx-1 px-1">
        <div className="grid grid-cols-5 gap-3 min-w-[700px] bg-sky-50/70 p-3.5 sm:p-4 rounded-2xl border border-sky-200/90 shadow-2xs">
          {weekdaySummaries.map((summary) => {
            const { date, dayOfWeek, isCandidate, voterCount, totalVoters, percentage, isTop, isConfirmed } = summary;

            return (
              <div
                key={date}
                className={`relative rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                  !isCandidate
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : isConfirmed
                    ? 'bg-emerald-50/90 border-emerald-400 shadow-sm ring-2 ring-emerald-200'
                    : isTop && voterCount > 0
                    ? 'bg-gradient-to-b from-sky-50/90 to-white border-sky-300 shadow-md ring-2 ring-sky-200/80'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Card Top: Header (날짜와 요일을 한 줄로 표시) */}
                <div className="p-3 pb-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                        {formatShortDate(date)}
                      </span>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                          dayOfWeek === '금'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {dayOfWeek}요일
                      </span>
                    </div>

                    {/* Badges */}
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        확정
                      </span>
                    ) : isTop && voterCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        <Crown className="w-3 h-3 text-sky-600" />
                        {daySummaries.filter((d) => d.isTop && d.voterCount > 0).length >= 2 ? '동점 1위' : '최다'}
                      </span>
                    ) : !isCandidate ? (
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                        제외됨
                      </span>
                    ) : null}
                  </div>

                  {/* Evening Weather Badge (이모티콘 - 온도 - 강수확률만 표시, 날씨 텍스트 제거) */}
                  {weatherMap[date] ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWeatherModal?.();
                      }}
                      title={`저녁 날씨: ${weatherMap[date].weatherText} | 저녁 예상 기온: ${weatherMap[date].eveningTemp}°C | 강수확률: ${weatherMap[date].rainProbability}%\n클릭하여 상세 날씨 표 조회`}
                      className="mt-2.5 w-full bg-slate-50/90 hover:bg-sky-50/80 border border-slate-200/80 hover:border-sky-200 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-center shadow-2xs group"
                    >
                      <div className="flex items-center justify-center gap-2.5 w-full overflow-hidden">
                        {/* 1. 날씨 이모티콘 */}
                        <span
                          className="text-lg leading-none shrink-0"
                          title={weatherMap[date].weatherText}
                        >
                          {weatherMap[date].emoji}
                        </span>

                        {/* 2. 온도 (박스 없이 텍스트만 표시) */}
                        <span className="text-sm font-extrabold text-slate-800 font-mono whitespace-nowrap shrink-0">
                          {weatherMap[date].eveningTemp}°C
                        </span>

                        {/* 3. 강수확률마크 */}
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0">
                          <Umbrella className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {weatherMap[date].rainProbability}%
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="mt-2.5 h-[34px]" />
                  )}
                </div>

              {/* Card Middle: Vote Progress & Count */}
              <div className="px-3.5 py-2">
                {isCandidate ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">참여 가능</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {voterCount}명 <span className="text-slate-500 font-normal">/ {totalVoters}명</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isConfirmed
                            ? 'bg-emerald-500'
                            : isTop && voterCount > 0
                            ? 'bg-sky-500'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${totalVoters > 0 ? percentage : 0}%` }}
                      />
                    </div>

                    <div className="text-right text-[11px] font-bold text-slate-500 tabular-nums">
                      {percentage}%
                    </div>

                    {/* Attendee mini tags preview */}
                    <div className="min-h-[52px] pt-1">
                      {summary.attendees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {summary.attendees.slice(0, 3).map((voter) => (
                            <span
                              key={voter.id}
                              className="text-[11px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[80px]"
                              title={`${voter.name}${voter.note ? ` (${voter.note})` : ''}`}
                            >
                              {voter.name}
                            </span>
                          ))}
                          {summary.attendees.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-medium self-center">
                              +{summary.attendees.length - 3}명
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 block pt-1">
                          아직 참여자 없음
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[85px] flex items-center justify-center text-center p-2">
                    <p className="text-xs text-slate-400">
                      총무가 지정하지 않은 날짜입니다
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Actions */}
              <div className="p-3 border-t border-slate-100/80 bg-slate-50/50 rounded-b-xl flex flex-col gap-1.5">
                {isCandidate ? (
                  <button
                    onClick={() => onDateClick(date)}
                    className="w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white bg-slate-100/80 rounded-lg transition-colors border border-slate-200/80 shadow-2xs"
                  >
                    참여자 명단 확인
                  </button>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() => onToggleCandidate(date)}
                      className="w-full py-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 rounded-lg transition-colors border border-amber-300/80"
                    >
                      + 후보일로 활성화
                    </button>
                  )
                )}

                {/* Admin controls for candidate cards */}
                {isAdmin && isCandidate && (
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => onToggleCandidate(date)}
                      className="flex-1 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="후보일에서 제외"
                    >
                      제외하기
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={() => onSelectConfirmedDate(date)}
                      className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors ${
                        isConfirmed
                          ? 'text-emerald-700 font-bold bg-emerald-100'
                          : 'text-amber-700 hover:bg-amber-100 font-semibold'
                      }`}
                      title="이 날짜로 회식 최종 확정"
                    >
                      {isConfirmed ? '확정 취소' : '회식일 확정'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
