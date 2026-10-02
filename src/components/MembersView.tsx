import React from 'react';
import { VoterRecord } from '../types';
import { formatDateKorean } from '../utils/dateUtils';
import { User, Calendar, Utensils, MessageSquare, Edit2, Trash2 } from 'lucide-react';

interface MembersViewProps {
  votes: VoterRecord[];
  candidateDatesCount: number;
  onEditVote: (vote: VoterRecord) => void;
  onDeleteVote: (voteId: string, name: string) => void;
  onOpenVoteModal: () => void;
  isVotingDisabled?: boolean;
}

export const MembersView: React.FC<MembersViewProps> = ({
  votes,
  candidateDatesCount,
  onEditVote,
  onDeleteVote,
  onOpenVoteModal,
  isVotingDisabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            참여자 목록 ({votes.length}명)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            각 팀원이 응답한 가능 일자와 선호 메뉴, 메모를 확인하고 관리합니다.
          </p>
        </div>
        <button
          onClick={onOpenVoteModal}
          disabled={isVotingDisabled}
          title={isVotingDisabled ? '투표가 마감되었습니다' : '+ 신규 투표 등록'}
          className={`self-start sm:self-center px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap ${
            isVotingDisabled
              ? 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed'
              : 'text-white bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isVotingDisabled ? '투표 마감됨' : '+ 신규 투표 등록'}
        </button>
      </div>

      {votes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 font-medium">아직 등록된 참여자가 없습니다.</p>
          <button
            onClick={onOpenVoteModal}
            disabled={isVotingDisabled}
            className={`mt-3 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              isVotingDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'text-white bg-sky-500 hover:bg-sky-600'
            }`}
          >
            {isVotingDisabled ? '투표 마감됨' : '첫 번째로 투표하기'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {votes.map((voter) => {
            const ratio = candidateDatesCount > 0 
              ? Math.round((voter.selectedDates.length / candidateDatesCount) * 100) 
              : 0;

            return (
              <div
                key={voter.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                        {voter.name.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {voter.name}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {voter.department || '팀원'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditVote(voter)}
                        disabled={isVotingDisabled}
                        className={`p-1.5 rounded-lg transition-colors ${
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
                        className={`p-1.5 rounded-lg transition-colors ${
                          isVotingDisabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isVotingDisabled ? '투표가 마감되어 삭제할 수 없습니다' : '투표 삭제'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Available Dates */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        참여 가능일 ({voter.selectedDates.length}일 선택)
                      </span>
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {ratio}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {voter.selectedDates.length > 0 ? (
                        voter.selectedDates.map((dateStr) => (
                          <span
                            key={dateStr}
                            className="bg-sky-50 text-sky-800 border border-sky-200/80 text-xs px-2 py-0.5 rounded-md font-medium"
                          >
                            {formatDateKorean(dateStr)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">
                          참여 가능한 날짜 없음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu & Note */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    {voter.preferredMenu && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-slate-500">선호 메뉴:</span>
                        <span className="font-semibold text-slate-800">{voter.preferredMenu}</span>
                      </div>
                    )}
                    {voter.note && (
                      <div className="flex items-start gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{voter.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-400 text-right">
                  수정: {voter.updatedAt ? voter.updatedAt.slice(0, 10) : '최근'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
