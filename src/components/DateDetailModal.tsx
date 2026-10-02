import React from 'react';
import { DateVoteSummary } from '../types';
import { formatDateKorean } from '../utils/dateUtils';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Crown, 
  Utensils, 
  MessageSquare,
  Users,
  Check
} from 'lucide-react';

interface DateDetailModalProps {
  summary: DateVoteSummary | null;
  onClose: () => void;
  isAdmin: boolean;
  onConfirmDate: (date: string) => void;
}

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  summary,
  onClose,
  isAdmin,
  onConfirmDate,
}) => {
  if (!summary) return null;

  const { date, voterCount, totalVoters, percentage, attendees, absentees, isTop, isConfirmed } = summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`p-5 border-b flex items-start justify-between ${
          isConfirmed 
            ? 'bg-emerald-50/80 border-emerald-200' 
            : isTop && voterCount > 0 
            ? 'bg-sky-50/90 border-sky-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                일자별 상세 참여 현황
              </span>
              {isConfirmed ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  최종 확정일
                </span>
              ) : isTop && voterCount > 0 ? (
                <span className="text-[11px] font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Crown className="w-3 h-3 text-sky-600" />
                  최다 참여일 (1위)
                </span>
              ) : null}
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              {formatDateKorean(date, true)}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              참여 가능: <strong className="text-slate-900">{voterCount}명</strong> / 총 {totalVoters}명 ({percentage}%)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Attendees List */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>참여 가능한 팀원 ({attendees.length}명)</span>
            </h3>

            {attendees.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg text-center">
                이 날짜에 참여 가능한 팀원이 아직 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {attendees.map((voter) => (
                  <div
                    key={voter.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                          {voter.name.slice(0, 1)}
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {voter.name}
                        </span>
                        {voter.department && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({voter.department})
                          </span>
                        )}
                      </div>

                      {voter.preferredMenu && (
                        <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-slate-400" />
                          {voter.preferredMenu}
                        </span>
                      )}
                    </div>

                    {voter.note && (
                      <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{voter.note}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Absentees List */}
          {absentees.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-2">
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>참여 불가 / 미응답 ({absentees.length}명)</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {absentees.map((voter) => (
                  <span
                    key={voter.id}
                    className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium"
                  >
                    {voter.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isTop ? '🏆 최다 참여 후보일' : '회식 일정 후보'}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onConfirmDate(date);
                  onClose();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  isConfirmed
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                }`}
              >
                {isConfirmed ? '확정 취소' : '이 날짜로 회식 확정'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
