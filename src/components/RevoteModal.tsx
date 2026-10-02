import React, { useState } from 'react';
import { PollConfig, DateVoteSummary, VoterRecord } from '../types';
import { formatDateKorean, getDayOfWeekKorean, formatDateTimeLocal, formatShortDate } from '../utils/dateUtils';
import { X, Flame, Calendar, Clock, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface RevoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PollConfig;
  tiedDates: DateVoteSummary[];
  onStartRevote: (params: {
    newTitle: string;
    newCandidateDates: string[];
    newDeadline: string;
    resetVotes: boolean;
  }) => void;
}

export const RevoteModal: React.FC<RevoteModalProps> = ({
  isOpen,
  onClose,
  config,
  tiedDates,
  onStartRevote,
}) => {
  const nextRound = (config.round || 1) + 1;
  const initialTitle = config.title.includes('결선')
    ? config.title.replace(/\d+차 결선/, `${nextRound}차 결선`)
    : `[${nextRound}차 결선 투표] ${config.title}`;

  // Default next deadline: +24 hours from now
  const defaultDeadline = () => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    d.setMinutes(0, 0, 0);
    return formatDateTimeLocal(d);
  };

  const [title, setTitle] = useState(initialTitle);
  const [selectedDates, setSelectedDates] = useState<string[]>(tiedDates.map((d) => d.date));
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [resetVotes, setResetVotes] = useState(true);

  if (!isOpen) return null;

  const handleToggleDate = (date: string) => {
    if (selectedDates.includes(date)) {
      if (selectedDates.length <= 1) {
        alert('결선 투표에는 최소 1개 이상의 후보일이 필요합니다.');
        return;
      }
      setSelectedDates(selectedDates.filter((d) => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert('후보일을 1개 이상 선택해주세요.');
      return;
    }

    onStartRevote({
      newTitle: title.trim() || initialTitle,
      newCandidateDates: selectedDates,
      newDeadline: deadline,
      resetVotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-200 bg-orange-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                동점 일자 결선 재투표 시작
              </h2>
              <p className="text-xs text-orange-900 font-medium">
                동률을 기록한 최다 득표 일자들만으로 {nextRound}차 재투표를 개시합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Tied Dates Notice */}
          <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
              <span>⚔️ 동점 일자 목록 ({tiedDates.length}개 일자 동률)</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {tiedDates.map((item) => {
                const isChecked = selectedDates.includes(item.date);
                const dow = getDayOfWeekKorean(item.date);

                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => handleToggleDate(item.date)}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-white border-orange-400 shadow-2xs ring-2 ring-orange-200/80'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded">
                          {dow}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatShortDate(item.date)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        이전 {item.voterCount}표 ({item.percentage}%)
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-sky-500 text-white'
                          : 'border border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-orange-800">
              * 체크된 일자만 결선 투표의 선택지로 등록됩니다.
            </p>
          </div>

          {/* New Poll Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              재투표 제목
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* New Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>새로운 재투표 마감 일시</span>
              <span className="text-[11px] text-orange-700 font-medium">타이머 즉시 재가동</span>
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />

            {/* Quick deadline buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">빠른 설정:</span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 12);
                  setDeadline(formatDateTimeLocal(d));
                }}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                12시간 후
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 24);
                  setDeadline(formatDateTimeLocal(d));
                }}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                24시간 후
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 2);
                  d.setHours(18, 0, 0, 0);
                  setDeadline(formatDateTimeLocal(d));
                }}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                모레 18:00
              </button>
            </div>
          </div>

          {/* Reset Votes Option */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              투표 데이터 처리 방식
            </span>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="resetOption"
                checked={resetVotes}
                onChange={() => setResetVotes(true)}
                className="mt-0.5 text-orange-600 focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  기존 투표 초기화 (권장)
                </span>
                <span className="text-slate-500">
                  모든 팀원이 동점 후보일 중에서 결정적 한 표를 다시 행사하도록 투표함을 비웁니다.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="resetOption"
                checked={!resetVotes}
                onChange={() => setResetVotes(false)}
                className="mt-0.5 text-orange-600 focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  기존 동점 일자 투표 유지
                </span>
                <span className="text-slate-500">
                  팀원들의 기존 투표 중 동점 후보일에 대한 표는 유지하고, 탈락한 일자만 제거합니다.
                </span>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>{nextRound}차 결선 재투표 시작하기</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
