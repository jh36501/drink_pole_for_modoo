import React from 'react';
import { VoterRecord, DateVoteSummary } from '../types';
import { formatDateKorean, getDayOfWeekKorean, formatShortDate } from '../utils/dateUtils';
import { Check, X, Crown, Edit2, Trash2, Utensils } from 'lucide-react';

interface MatrixViewProps {
  candidateSummaries: DateVoteSummary[];
  votes: VoterRecord[];
  onEditVote: (vote: VoterRecord) => void;
  onDeleteVote: (voteId: string, name: string) => void;
  onOpenVoteModal: () => void;
  isVotingDisabled?: boolean;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  candidateSummaries,
  votes,
  onEditVote,
  onDeleteVote,
  onOpenVoteModal,
  isVotingDisabled = false,
}) => {
  if (candidateSummaries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500 font-medium">활성화된 투표 후보일이 없습니다.</p>
        <p className="text-xs text-slate-400 mt-1">총무 모드에서 후보일을 먼저 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            종합 참여 매트릭스 표
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            전체 팀원의 참여 가능 여부와 선호 메뉴를 한눈에 비교합니다.
          </p>
        </div>
        <button
          onClick={onOpenVoteModal}
          disabled={isVotingDisabled}
          title={isVotingDisabled ? '투표가 마감되었습니다' : '+ 내 투표 등록하기'}
          className={`self-start sm:self-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap ${
            isVotingDisabled
              ? 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed'
              : 'text-white bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isVotingDisabled ? '투표 마감됨' : '+ 내 투표 등록하기'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700">
              <th className="py-3 px-4 font-bold text-xs sticky left-0 bg-slate-100/95 z-10 w-44">
                팀원 명단 ({votes.length}명)
              </th>
              {candidateSummaries.map((col) => (
                <th
                  key={col.date}
                  className={`py-3 px-3 text-center text-xs font-bold transition-colors ${
                    col.isConfirmed
                      ? 'bg-emerald-100/80 text-emerald-950 font-extrabold'
                      : col.isTop && col.voterCount > 0
                      ? 'bg-sky-100/90 text-sky-950 font-extrabold'
                      : 'text-slate-800'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1">
                      {col.isConfirmed && <span className="text-[10px] text-emerald-700">확정</span>}
                      {col.isTop && col.voterCount > 0 && !col.isConfirmed && (
                        <Crown className="w-3 h-3 text-sky-600 inline" />
                      )}
                      <span>{formatShortDate(col.date)}</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ({getDayOfWeekKorean(col.date)})
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-xs font-bold text-slate-700 text-left min-w-[120px]">
                선호 메뉴
              </th>
              <th className="py-3 px-4 text-xs font-bold text-slate-700 text-left min-w-[160px]">
                메모 / 비고
              </th>
              <th className="py-3 px-3 text-xs font-bold text-slate-500 text-center w-16">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
            {votes.length === 0 ? (
              <tr>
                <td colSpan={candidateSummaries.length + 4} className="py-10 text-center text-slate-400 text-xs">
                  아직 투표한 참여자가 없습니다.
                </td>
              </tr>
            ) : (
              votes.map((voter) => (
                <tr key={voter.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {voter.name.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">
                          {voter.name}
                        </span>
                        {voter.department && (
                          <span className="text-[11px] text-slate-500 block truncate">
                            {voter.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {candidateSummaries.map((col) => {
                    const isAttending = voter.selectedDates.includes(col.date);
                    return (
                      <td
                        key={col.date}
                        className={`py-3 px-3 text-center border-r border-slate-100/50 ${
                          col.isConfirmed
                            ? 'bg-emerald-50/30'
                            : col.isTop && col.voterCount > 0
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        {isAttending ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-xs text-slate-700">
                    {voter.preferredMenu ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Utensils className="w-3 h-3 text-slate-400" />
                        {voter.preferredMenu}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate" title={voter.note}>
                    {voter.note || <span className="text-slate-400">-</span>}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditVote(voter)}
                        disabled={isVotingDisabled}
                        className={`p-1 rounded transition-colors ${
                          isVotingDisabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title={isVotingDisabled ? '투표가 마감되어 수정할 수 없습니다' : '투표 수정'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteVote(voter.id, voter.name)}
                        disabled={isVotingDisabled}
                        className={`p-1 rounded transition-colors ${
                          isVotingDisabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isVotingDisabled ? '투표가 마감되어 삭제할 수 없습니다' : '투표 삭제'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100/90 text-slate-900 font-bold">
              <td className="py-3 px-4 text-xs sticky left-0 bg-slate-100 z-10">
                참여 가능 인원 합계
              </td>
              {candidateSummaries.map((col) => (
                <td
                  key={col.date}
                  className={`py-3 px-3 text-center font-extrabold text-xs tabular-nums ${
                    col.isConfirmed
                      ? 'bg-emerald-200/90 text-emerald-950 font-black'
                      : col.isTop && col.voterCount > 0
                      ? 'bg-sky-200/90 text-sky-950 font-black'
                      : 'text-slate-800'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{col.voterCount}명</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({col.percentage}%)
                    </span>
                  </div>
                </td>
              ))}
              <td colSpan={3} className="py-3 px-4 text-xs text-slate-500 font-medium">
                {candidateSummaries.find((c) => c.isTop && c.voterCount > 0) ? (
                  <span>
                    👑 최다 인원: {formatDateKorean(candidateSummaries.find((c) => c.isTop)!.date)} (
                    {candidateSummaries.find((c) => c.isTop)!.voterCount}명)
                  </span>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
