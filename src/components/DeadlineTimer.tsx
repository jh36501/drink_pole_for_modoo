import React from 'react';
import { RemainingTime, formatDeadlineDisplay, formatDateKorean } from '../utils/dateUtils';
import { DateVoteSummary } from '../types';
import { Clock, AlertTriangle, CheckCircle2, Lock, PlusCircle, Settings, Flame } from 'lucide-react';

interface DeadlineTimerProps {
  deadlineStr: string;
  remainingTime: RemainingTime;
  isAdmin: boolean;
  onOpenAdminPanel: () => void;
  onExtendDeadline?: (hours: number) => void;
  tiedDates?: DateVoteSummary[];
  onOpenRevoteModal?: () => void;
  round?: number;
  isRunoff?: boolean;
}

export const DeadlineTimer: React.FC<DeadlineTimerProps> = ({
  deadlineStr,
  remainingTime,
  isAdmin,
  onOpenAdminPanel,
  onExtendDeadline,
  tiedDates = [],
  onOpenRevoteModal,
  round = 1,
  isRunoff = false,
}) => {
  const { isExpired, days, hours, minutes, seconds, urgency } = remainingTime;
  const formattedDeadline = formatDeadlineDisplay(deadlineStr);
  const hasTie = tiedDates.length >= 2;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isExpired
          ? hasTie
            ? 'bg-sky-50/90 border-sky-300 shadow-sm'
            : 'bg-slate-100 border-slate-300 text-slate-800'
          : urgency === 'urgent'
          ? 'bg-rose-50/90 border-rose-300 shadow-sm animate-pulse-slow'
          : urgency === 'warning'
          ? 'bg-sky-50/90 border-sky-300 shadow-xs'
          : 'bg-gradient-to-r from-sky-50/70 via-white to-sky-50/70 border-sky-200 shadow-xs'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left zone: Status indicator & deadline description */}
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                isExpired
                  ? hasTie
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                  : urgency === 'urgent'
                  ? 'bg-rose-500 text-white'
                  : urgency === 'warning'
                  ? 'bg-sky-500 text-white'
                  : 'bg-sky-600 text-white'
              }`}
            >
              {isExpired ? (
                hasTie ? (
                  <Flame className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )
              ) : urgency === 'urgent' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold tracking-tight uppercase ${
                    isExpired
                      ? hasTie
                        ? 'text-orange-900'
                        : 'text-slate-600'
                      : urgency === 'urgent'
                      ? 'text-rose-700'
                      : urgency === 'warning'
                      ? 'text-amber-800'
                      : 'text-slate-600'
                  }`}
                >
                  {isExpired
                    ? hasTie
                      ? '투표 마감 · 동점 발생'
                      : '투표 종료 (마감됨)'
                    : urgency === 'urgent'
                    ? '마감 1시간 이내 임박!'
                    : urgency === 'warning'
                    ? '투표 마감 임박 (24시간 이내)'
                    : isRunoff
                    ? `${round}차 결선 투표 진행 중`
                    : '투표 마감 타이머'}
                </span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  마감 일시: {formattedDeadline}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {isExpired ? (
                  hasTie ? (
                    <span className="text-orange-950 font-bold">
                      최다 득표일이 {tiedDates.length}개로 동점입니다. 결선 재투표를 시작하여 최종 일자를 결정해주세요!
                    </span>
                  ) : (
                    <span className="text-slate-700">
                      투표 접수가 마감되어 신규 투표 및 수정이 제한됩니다.
                    </span>
                  )
                ) : (
                  <span>
                    팀원들의 소중한 한 표를 위해 마감 시간 전까지 투표를 완료해주세요.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right zone: Digital countdown clocks & Admin actions */}
          <div className="flex items-center gap-3 self-start md:self-center">
            {!isExpired ? (
              <div className="flex items-center gap-1.5 font-mono tabular-nums">
                {/* Days */}
                <div className="flex flex-col items-center justify-center bg-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-neutral-800 min-w-[50px] shadow-md ring-1 ring-white/10">
                  <span className="text-lg sm:text-xl font-black text-white leading-none tracking-widest">
                    {String(days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold text-neutral-300 mt-1 uppercase tracking-tight">
                    일
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg self-center">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center justify-center bg-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-neutral-800 min-w-[50px] shadow-md ring-1 ring-white/10">
                  <span className="text-lg sm:text-xl font-black text-white leading-none tracking-widest">
                    {String(hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold text-neutral-300 mt-1 uppercase tracking-tight">
                    시간
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg self-center">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center justify-center bg-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-neutral-800 min-w-[50px] shadow-md ring-1 ring-white/10">
                  <span className="text-lg sm:text-xl font-black text-white leading-none tracking-widest">
                    {String(minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold text-neutral-300 mt-1 uppercase tracking-tight">
                    분
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg self-center">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center justify-center bg-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-neutral-800 min-w-[50px] shadow-md ring-1 ring-white/10">
                  <span className="text-lg sm:text-xl font-black text-white leading-none tracking-widest">
                    {String(seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold text-neutral-300 mt-1 uppercase tracking-tight">
                    초
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300">
                  마감 완료
                </span>
              </div>
            )}

            {/* Quick Admin extension actions */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                {onExtendDeadline && (
                  <button
                    onClick={() => onExtendDeadline(24)}
                    className="px-2.5 py-1.5 text-xs font-bold text-sky-950 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                    title="마감 시간을 24시간 연장합니다"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                    <span>+24시간 연장</span>
                  </button>
                )}

                <button
                  onClick={onOpenAdminPanel}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  title="마감 일시 및 설정 변경"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tie Detected Banner after voting closed */}
      {isExpired && hasTie && onOpenRevoteModal && (
        <div className="bg-sky-100/90 border-t border-sky-200/90 p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-sky-600 shrink-0" />
            <div className="text-xs text-sky-950 font-medium leading-relaxed">
              <strong>동점 일자 ({tiedDates.length}개):</strong>{' '}
              {tiedDates.map((d) => `${formatDateKorean(d.date)} (${d.voterCount}표)`).join(', ')}
            </div>
          </div>

          <button
            onClick={onOpenRevoteModal}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
          >
            <Flame className="w-4 h-4" />
            <span>동점 일자로 재투표(결선) 시작하기</span>
          </button>
        </div>
      )}
    </div>
  );
};
