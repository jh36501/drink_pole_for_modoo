import React from 'react';
import { PollConfig, VoterRecord, DateVoteSummary } from '../types';
import { formatDateKorean } from '../utils/dateUtils';
import { Crown, Sparkles, CheckCircle2, Clock, Users, MapPin, Edit3 } from 'lucide-react';

interface HeroSummaryProps {
  config: PollConfig;
  votes: VoterRecord[];
  topSummary: DateVoteSummary | null;
  onOpenVoteModal: () => void;
  onOpenAdminPanel: () => void;
  isAdmin: boolean;
  onDateClick: (date: string) => void;
  isVotingDisabled?: boolean;
  tiedDates?: DateVoteSummary[];
  onOpenRevoteModal?: () => void;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({
  config,
  votes,
  topSummary,
  onOpenVoteModal,
  onOpenAdminPanel,
  isAdmin,
  onDateClick,
  isVotingDisabled = false,
  tiedDates = [],
  onOpenRevoteModal,
}) => {
  const confirmedDate = config.confirmedDate;
  const hasTie = tiedDates.length >= 2;
  const formattedTitle = config.title
    ? config.title.replace('🥩', '🍗')
    : '10월 2주차 팀 정기 회식 일정 조율 🍗🍻';

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Title and metadata */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>주최: {config.organizer}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                마감: {config.deadline}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                총 {votes.length}명 응답 완료
              </span>
            </div>

            <div className="flex items-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
                {formattedTitle}
              </h1>
              {isAdmin && (
                <button
                  onClick={onOpenAdminPanel}
                  className="mt-1 p-1 text-slate-400 hover:text-amber-600 rounded-md transition-colors"
                  title="일정 및 후보일 설정 편집"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {config.description}
            </p>
          </div>

          {/* Quick CTA button for voter */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
            <button
              onClick={onOpenVoteModal}
              disabled={isVotingDisabled}
              title={isVotingDisabled ? '투표가 마감되었습니다' : '내 일정 투표하기'}
              className={`w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-xl shadow-xs transition-all transform flex items-center justify-center gap-2 whitespace-nowrap ${
                isVotingDisabled
                  ? 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 active:scale-[0.99]'
              }`}
            >
              <span>{isVotingDisabled ? '투표 마감됨 (종료)' : '내 일정 투표하기'}</span>
              {!isVotingDisabled && <span className="text-sky-200">→</span>}
            </button>
            <span className="text-xs text-slate-500 hidden sm:block">
              {isVotingDisabled
                ? '* 마감 시간이 지나 투표 제출 및 수정이 불가합니다'
                : '* 기투표자는 이름을 다시 입력하여 수정 가능'}
            </span>
          </div>
        </div>

        {/* Highlight Card for Top Candidate or Confirmed Date */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          {confirmedDate ? (
            /* Admin Confirmed State */
            <div className="bg-sky-50/90 border border-sky-300/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-900 tracking-wide uppercase">
                      회식일 최종 확정
                    </span>
                    <span className="text-xs text-sky-700 font-medium">총무 공지</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-sky-950 mt-0.5">
                    {formatDateKorean(confirmedDate, true)}
                  </h3>
                  {config.confirmedTimeLocation && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-sky-900 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{config.confirmedTimeLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => onDateClick(confirmedDate)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-sky-900 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  참석자 명단 확인
                </button>
              </div>
            </div>
          ) : hasTie && isVotingDisabled ? (
            /* Tie detected on closed poll */
            <div className="bg-sky-50/90 border border-sky-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-sky-100">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-950">
                      ⚔️ 최다 득표일 동점 발생 ({tiedDates.length}개 일자 동률)
                    </span>
                    <span className="text-xs text-sky-800 font-semibold tabular-nums">
                      각 {tiedDates[0]?.voterCount}명 참여 가능
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {tiedDates.map((d) => formatDateKorean(d.date)).join(' · ')}
                  </h3>
                  <p className="text-xs text-sky-900 mt-1 font-medium">
                    투표가 마감되었으나 동점 일자가 발생하여, 해당 일자들만으로 결선 재투표를 진행해야 합니다.
                  </p>
                </div>
              </div>

              {onOpenRevoteModal && (
                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={onOpenRevoteModal}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 rounded-xl shadow-sm transition-all whitespace-nowrap"
                  >
                    동점 일자 결선 재투표 개시 →
                  </button>
                </div>
              )}
            </div>
          ) : topSummary && topSummary.voterCount > 0 ? (
            /* Real-time Top Candidate Date Highlight */
            <div className="bg-gradient-to-r from-sky-50/95 via-cyan-50/50 to-sky-50/95 border border-sky-300/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-sky-100">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-950">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      현재 최다 참여 가능일 (1위)
                    </span>
                    <span className="text-xs text-sky-800 font-semibold tabular-nums">
                      {topSummary.voterCount}명 참여 가능 ({topSummary.percentage}%)
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {formatDateKorean(topSummary.date, true)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">참여 가능 인원:</span>
                    {topSummary.attendees.map((attendee) => (
                      <span
                        key={attendee.id}
                        className="bg-white/90 border border-sky-300 text-sky-950 font-medium px-2 py-0.5 rounded-md text-[11px]"
                      >
                        {attendee.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => onDateClick(topSummary.date)}
                  className="px-3.5 py-2 text-xs font-semibold text-sky-950 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                >
                  상세 참석자 보기
                </button>
              </div>
            </div>
          ) : (
            /* No votes yet */
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-center">
              <p className="text-xs sm:text-sm text-sky-900 font-medium">
                아직 투표한 팀원이 없습니다. 첫 번째로 참여 가능 일자를 선택해보세요!
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
