import React, { useState, useEffect } from 'react';
import { VoterRecord, DateVoteSummary } from '../types';
import { formatDateKorean, getDayOfWeekKorean, formatShortDate } from '../utils/dateUtils';
import { X, Check, Calendar, Utensils, MessageSquare, AlertCircle } from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateSummaries: DateVoteSummary[];
  existingVote: VoterRecord | null;
  onSubmitVote: (voterData: Omit<VoterRecord, 'id' | 'updatedAt'>, existingId?: string) => void;
  allVoters: VoterRecord[];
  isVotingDisabled?: boolean;
}

const MENU_OPTIONS = [
  '삼겹살 / 고기',
  '소고기',
  '회 / 해산물',
  '치킨 / 피자 / 펍',
  '중식 / 양식',
  '상관없음 (모두 좋아요)',
];

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  candidateSummaries,
  existingVote,
  onSubmitVote,
  allVoters,
  isVotingDisabled = false,
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [preferredMenu, setPreferredMenu] = useState('상관없음 (모두 좋아요)');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Track previous open state and vote id to only initialize on fresh modal open or edit target switch
  const prevIsOpenRef = React.useRef(false);
  const prevVoteIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const isNowOpen = isOpen;
    const wasOpen = prevIsOpenRef.current;
    const currentVoteId = existingVote?.id || null;
    const prevVoteId = prevVoteIdRef.current;

    // Only reset/populate form when transitioning from closed to open, OR when switching edit targets
    if (isNowOpen && (!wasOpen || currentVoteId !== prevVoteId)) {
      if (existingVote) {
        setName(existingVote.name);
        setDepartment(existingVote.department || '');
        setSelectedDates(existingVote.selectedDates || []);
        setPreferredMenu(existingVote.preferredMenu || '상관없음 (모두 좋아요)');
        setNote(existingVote.note || '');
      } else {
        setName('');
        setDepartment('');
        setSelectedDates(candidateSummaries.map((c) => c.date));
        setPreferredMenu('상관없음 (모두 좋아요)');
        setNote('');
      }
      setErrorMessage('');
    }

    prevIsOpenRef.current = isNowOpen;
    prevVoteIdRef.current = currentVoteId;
  }, [isOpen, existingVote]);

  if (!isOpen) return null;

  const handleToggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSelectAll = () => {
    setSelectedDates(candidateSummaries.map((c) => c.date));
  };

  const handleDeselectAll = () => {
    setSelectedDates([]);
  };

  // If user enters an existing voter's name, offer to load their vote
  const handleNameBlur = () => {
    if (!existingVote && name.trim()) {
      const match = allVoters.find(
        (v) => v.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (match) {
        setDepartment(match.department || '');
        setSelectedDates(match.selectedDates);
        setPreferredMenu(match.preferredMenu || '');
        setNote(match.note || '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('신청자 이름은 필수 입력 항목입니다.');
      return;
    }

    onSubmitVote(
      {
        name: name.trim(),
        department: department.trim() || undefined,
        selectedDates,
        preferredMenu: preferredMenu || undefined,
        note: note.trim() || undefined,
      },
      existingVote?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {existingVote ? '내 투표 일정 수정하기' : '팀 회식 일정 투표하기'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              참여 가능한 일자를 모두 선택해주세요 (중복 선택 가능)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {isVotingDisabled && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-600" />
              <span>투표 마감 시간이 경과하여 신규 투표 및 수정이 불가합니다.</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Department Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                신청자 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onBlur={handleNameBlur}
                placeholder="예: 홍길동"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                기존 투표자 이름을 입력하면 자동으로 불러옵니다.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                소속 / 직책 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 개발 1팀 / 매니저"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          {/* Candidate Date Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                참여 가능 일자 선택 (다중 선택)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-500 hover:text-slate-900 font-semibold"
                >
                  전체 선택
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-900 font-semibold"
                >
                  전체 해제
                </button>
              </div>
            </div>

            {candidateSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center border border-dashed rounded-lg">
                현재 활성화된 후보일이 없습니다. 총무에게 문의해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidateSummaries.map((candidate) => {
                  const isSelected = selectedDates.includes(candidate.date);
                  const dow = getDayOfWeekKorean(candidate.date);

                  return (
                    <button
                      key={candidate.date}
                      type="button"
                      onClick={() => handleToggleDate(candidate.date)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-200/60 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              dow === '토'
                                ? 'bg-blue-50 text-blue-700'
                                : dow === '일'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {dow}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatShortDate(candidate.date)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          현재 {candidate.voterCount}명 참여 가능
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-sky-500 text-white'
                            : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5">
              💡 {selectedDates.length}개 일자 선택됨 (참여 가능한 날짜를 모두 탭하여 선택하세요)
            </p>
          </div>

          {/* Preferred Menu Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-slate-500" />
              선호하는 회식 메뉴 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {MENU_OPTIONS.map((menu) => (
                <button
                  key={menu}
                  type="button"
                  onClick={() => setPreferredMenu(menu)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors truncate ${
                    preferredMenu === menu
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {menu}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              메모 및 전달 사항 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 목요일은 19시 이후 도착 가능, 2차부터 참석"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isVotingDisabled}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
                isVotingDisabled
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700'
              }`}
            >
              {isVotingDisabled ? '투표 마감됨' : existingVote ? '수정 완료' : '투표 제출하기'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
